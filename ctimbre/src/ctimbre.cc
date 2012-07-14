#include <v8.h>
#include <node.h>
#include <uv.h>

#import <AudioUnit/AudioUnit.h>

using namespace v8;
using namespace node;


class JSOutputNode : ObjectWrap {
public:  
    static v8::Handle<Value> New(const Arguments& args) {
        HandleScope scope;
        
        size_t bufferSize;
        if (args.Length() == 1 && args[0]->IsNumber()) {
            bufferSize = args[0]->NumberValue();
            if (bufferSize != 4096 && bufferSize != 2048 &&
                bufferSize != 1024 && bufferSize !=  512) {
                bufferSize = 1024;
            }
        } else {
            bufferSize = 1024;
        }
        
        JSOutputNode *node = new JSOutputNode();
        
        // AudioUnit
        AudioComponentDescription cd;
        cd.componentType         = kAudioUnitType_Output;
        cd.componentSubType      = kAudioUnitSubType_DefaultOutput;
        cd.componentManufacturer = kAudioUnitManufacturer_Apple;
        cd.componentFlags        = 0;
        cd.componentFlagsMask    = 0;
        
        AudioComponent component = AudioComponentFindNext(NULL, &cd);
        AudioComponentInstanceNew(component, &node->_audioUnit);
        AudioUnitInitialize(node->_audioUnit);
        
        uint sampleRate;
        {
            Float64 _sampleRate;
            UInt32 size = sizeof(Float64);
            AudioUnitGetProperty(node->_audioUnit,
                                 kAudioUnitProperty_SampleRate,
                                 kAudioUnitScope_Output,
                                 0,
                                 &_sampleRate,
                                 &size);
            sampleRate = (uint)_sampleRate;
        }
        uint channels = 2;
        node->init(sampleRate, channels, bufferSize);
        
        AURenderCallbackStruct callback;
        callback.inputProc = JSOutputNode::AudioUnitCallback;
        callback.inputProcRefCon = node;
        
        AudioUnitSetProperty(node->_audioUnit,
                             kAudioUnitProperty_SetRenderCallback,
                             kAudioUnitScope_Input,
                             0,
                             &callback,
                             sizeof(AURenderCallbackStruct));
        
        AudioStreamBasicDescription audioFormat;
        audioFormat.mSampleRate       = sampleRate;
        audioFormat.mFormatID         = kAudioFormatLinearPCM;
        audioFormat.mFormatFlags      = kAudioFormatFlagsAudioUnitCanonical;
        audioFormat.mChannelsPerFrame = channels;
        audioFormat.mBytesPerPacket   = sizeof(AudioUnitSampleType);
        audioFormat.mBytesPerFrame    = sizeof(AudioUnitSampleType);
        audioFormat.mFramesPerPacket  = 1;
        audioFormat.mBitsPerChannel   = 8 * sizeof(AudioUnitSampleType);
        audioFormat.mReserved         = 0;
        
        AudioUnitSetProperty(node->_audioUnit,
                             kAudioUnitProperty_StreamFormat,
                             kAudioUnitScope_Input,
                             0,
                             &audioFormat,
                             sizeof(audioFormat));
        
        // audioProcessEvent
        Local<ObjectTemplate> t = ObjectTemplate::New();
        t->SetInternalFieldCount(1);
        
        Persistent<Object> e = Persistent<Object>::New(t->NewInstance());
        e->Set(String::New("sampleRate"), Integer::New(sampleRate));
        e->Set(String::New("channels")  , Integer::New(channels));
        e->Set(String::New("bufferSize"), Integer::New(bufferSize));
        e->Set(String::New("getChannelData"),
               FunctionTemplate::New(JSOutputNode::AudioProcessEventGetChannelData)
               ->GetFunction());
        e->SetPointerInInternalField(0, node);
        node->_audioProcessEvent = e;
        
        node->Wrap(args.This());
        
        return args.This();
    }
    
    static v8::Handle<Value> Start(const Arguments& args) {
        HandleScope scope;
        
        JSOutputNode *node = ObjectWrap::Unwrap<JSOutputNode>(args.This());
        if (! node->_isPlaying) {
            node->_isPlaying = true;
            node->_notifier.data = node;
            uv_async_init(uv_default_loop(), &node->_notifier,
                          JSOutputNode::CallOnAudioProcess);
            uv_async_send(&node->_notifier);
            AudioOutputUnitStart(node->_audioUnit);
        }
        return scope.Close(Undefined());
    }
    
    static OSStatus AudioUnitCallback
    (void *inRefCon, AudioUnitRenderActionFlags *ioActionFlags,
     const AudioTimeStamp *inTimeStamp, UInt32 inBusNumber,
     UInt32 inNumberFrames, AudioBufferList *ioData) {
        JSOutputNode *node = static_cast<JSOutputNode*>(inRefCon);
        for (uint ch = 0; ch < node->_channels; ch++) {
            AudioUnitSampleType *out = (AudioUnitSampleType*)ioData->mBuffers[ch].mData;
            float *inp = node->_data[ch] + node->_readIndex;
            for (uint i = 0; i < inNumberFrames; i++) {
                *out++ = *inp++;
            }
        }
        node->_readIndex += inNumberFrames;
        if (node->_readIndex == node->_bufferSize) {
            uv_async_send(&node->_notifier);
            node->_readIndex = 0;
        }
        return noErr;
    }
    
    static void CallOnAudioProcess(uv_async_t *handle, int status) {
        HandleScope scope;
        JSOutputNode *node = static_cast<JSOutputNode*>(handle->data);
        if (!node->_onAudioProcess.IsEmpty()) {
            v8::Handle<Value> argv[] = { node->_audioProcessEvent };
            node->_onAudioProcess->Call(Context::GetCurrent()->Global(), 1, argv);
        }
    }
    
    static v8::Handle<Value> Stop(const Arguments& args) {
        HandleScope scope;
        
        JSOutputNode *node = ObjectWrap::Unwrap<JSOutputNode>(args.This());
        if (node->_isPlaying) {
            node->_isPlaying = false;
            AudioOutputUnitStop(node->_audioUnit);
            uv_unref(uv_default_loop());
        }
        return scope.Close(Undefined());
    }
    
    static v8::Handle<Value> GetSampleRate
    (Local<String> property, const AccessorInfo& info) {
        JSOutputNode *node = ObjectWrap::Unwrap<JSOutputNode>(info.Holder());
        return Integer::New(node->_sampleRate);
    }
    
    static v8::Handle<Value> GetChannels
    (Local<String> property, const AccessorInfo& info) {
        JSOutputNode *node = ObjectWrap::Unwrap<JSOutputNode>(info.Holder());
        return Integer::New(node->_channels);
    }
    
    static v8::Handle<Value> GetBufferSize
    (Local<String> property, const AccessorInfo& info) {
        JSOutputNode *node = ObjectWrap::Unwrap<JSOutputNode>(info.Holder());
        return Integer::New(node->_bufferSize);
    }
    
    static v8::Handle<Value> GetIsPlaying
    (Local<String> property, const AccessorInfo& info) {
        JSOutputNode *node = ObjectWrap::Unwrap<JSOutputNode>(info.Holder());
        return v8::Boolean::New(node->_isPlaying);
    }
    
    static v8::Handle<Value> GetOnAudioProcess
    (Local<String> property, const AccessorInfo& info) {
        JSOutputNode *node = ObjectWrap::Unwrap<JSOutputNode>(info.Holder());
        return node->_onAudioProcess;
    }
    
    static void SetOnAudioProcess
    (Local<String> property, Local<Value> value, const AccessorInfo& info) {
        if (!value->IsFunction()) return;
        JSOutputNode *node = ObjectWrap::Unwrap<JSOutputNode>(info.Holder());
        node->_onAudioProcess.Dispose();
        Local<Function> func = Local<Function>::Cast(value);
        node->_onAudioProcess = Persistent<Function>::New(func);
    }
    
    static v8::Handle<Value> AudioProcessEventGetChannelData(const Arguments& args) {
        HandleScope scope;
        if (args.Length() == 1 && args[0]->IsNumber()) {
            size_t index = args[0]->ToUint32()->Value();
            
            Local<Object> e = args.Holder();
            void *p = e->GetPointerFromInternalField(0);
            JSOutputNode *node = static_cast<JSOutputNode*>(p);
            if (index < node->_channels) {
                Local<Object> q = Local<Object>::New(Object::New());
                q->SetIndexedPropertiesToExternalArrayData(node->_data[index],
                                                           kExternalFloatArray,
                                                           node->_bufferSize);
                return scope.Close(q);
            }
        }
        return Undefined();
    }
    

private:
    uint _sampleRate;
    uint _channels;
    size_t _bufferSize;
    Persistent<Function> _onAudioProcess;
    Persistent<Object> _audioProcessEvent;
    
    float **_data;
    uint _readIndex;
    bool _isPlaying;
    uv_async_t _notifier;
    AudioUnit _audioUnit;
    
    void init(uint sampleRate, uint channels, size_t bufferSize) {
        _sampleRate = sampleRate;
        _channels   = channels;
        _bufferSize = bufferSize;
        _data = new float*[channels];
        for (uint i = 0; i < channels; i++) {
            _data[i] = new float[bufferSize]();
        }
        _readIndex = 0;
        _isPlaying = false;
    }
    
    ~JSOutputNode() {
        if (_isPlaying) {
            _isPlaying = false;
            uv_unref(uv_default_loop());
        }
        for (uint i = 0; i < _channels; i++) {
            delete _data[i];
        }
        delete _data;
        _audioProcessEvent.Dispose();
        _onAudioProcess.Dispose();
    }
};


extern "C" {
    static void init(v8::Handle<Object> target) {
        HandleScope scope;
        
        Local<FunctionTemplate> t = FunctionTemplate::New(JSOutputNode::New);
        t->SetClassName(String::NewSymbol("JavaScriptOutputNode"));
        
        NODE_SET_PROTOTYPE_METHOD(t, "start", JSOutputNode::Start);
        NODE_SET_PROTOTYPE_METHOD(t, "stop" , JSOutputNode::Stop );
        
        Local<v8::ObjectTemplate> i = t->InstanceTemplate();
        i->SetInternalFieldCount(1);
        i->SetAccessor(String::New("sampleRate"),
                       JSOutputNode::GetSampleRate, NULL,
                       v8::Handle<Value>(),
                       v8::PROHIBITS_OVERWRITING,
                       PropertyAttribute(v8::ReadOnly|v8::DontDelete));
        i->SetAccessor(String::New("channels"),
                       JSOutputNode::GetChannels, NULL,
                       v8::Handle<Value>(),
                       v8::PROHIBITS_OVERWRITING,
                       PropertyAttribute(v8::ReadOnly|v8::DontDelete));
        i->SetAccessor(String::New("bufferSize"),
                       JSOutputNode::GetBufferSize, NULL,
                       v8::Handle<Value>(),
                       v8::PROHIBITS_OVERWRITING,
                       PropertyAttribute(v8::ReadOnly|v8::DontDelete));
        i->SetAccessor(String::New("isPlaying"),
                       JSOutputNode::GetIsPlaying, NULL,
                       v8::Handle<Value>(),
                       v8::PROHIBITS_OVERWRITING,
                       PropertyAttribute(v8::ReadOnly|v8::DontDelete));
        i->SetAccessor(String::New("onaudioprocess"),
                       JSOutputNode::GetOnAudioProcess,
                       JSOutputNode::SetOnAudioProcess);
        target->Set(String::New("JavaScriptOutputNode"), t->GetFunction());
    }
    
    NODE_MODULE(ctimbre, init)
}
