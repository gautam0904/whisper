use tauri::{AppHandle, Emitter};
use std::sync::Mutex;
use objc::{class, msg_send, sel, sel_impl};
use cocoa::base::{id, nil, NO, YES};
use cocoa::foundation::NSString;
use block::ConcreteBlock;
use crate::error::AppError;

static SPEECH_ENGINE: std::sync::OnceLock<Mutex<Option<SpeechEngine>>> = std::sync::OnceLock::new();

struct SpeechEngine {
    audio_engine: id,
    recognition_task: id,
    recognition_request: id,
}

unsafe impl Send for SpeechEngine {}
unsafe impl Sync for SpeechEngine {}

pub fn request_speech_authorization() -> isize {
    use std::sync::{Arc, Condvar, Mutex as StdMutex};
    let pair = Arc::new((StdMutex::new(-1isize), Condvar::new()));
    let pair_clone = pair.clone();
    let block = ConcreteBlock::new(move |status: isize| {
        let (lock, cvar) = &*pair_clone;
        let mut val = lock.lock().unwrap();
        *val = status;
        cvar.notify_one();
    });
    let block = block.copy();
    unsafe {
        let _: () = msg_send![class!(SFSpeechRecognizer), requestAuthorization: block];
    }
    let (lock, cvar) = &*pair;
    let result = cvar.wait_while(lock.lock().unwrap(), |v| *v == -1).unwrap();
    *result
}

pub fn start_recognition(app: AppHandle) -> Result<(), AppError> {
    unsafe {
        let engine_mutex = SPEECH_ENGINE.get_or_init(|| Mutex::new(None));
        let mut engine_guard = engine_mutex.lock().unwrap();
        if engine_guard.is_some() {
            return Ok(());
        }

        // 1. Request Speech Authorization (blocks until user responds)
        let status: isize = request_speech_authorization();
        if status != 3 { // SFSpeechRecognizerAuthorizationStatusAuthorized = 3
            let reason = match status {
                0 => "Speech Recognition permission not yet determined",
                1 => "Speech Recognition was denied — go to System Settings > Privacy > Speech Recognition",
                2 => "Speech Recognition is restricted on this device",
                _ => "Speech Recognition not authorized",
            };
            return Err(AppError::PlatformUnsupported(reason.into()));
        }

        // 2. Initialize SFSpeechRecognizer
        let locale: id = msg_send![class!(NSLocale), localeWithLocaleIdentifier: cocoa::foundation::NSString::alloc(nil).init_str("en-US")];
        let recognizer: id = msg_send![class!(SFSpeechRecognizer), alloc];
        let recognizer: id = msg_send![recognizer, initWithLocale:locale];

        if recognizer == nil {
            return Err(AppError::PlatformUnsupported("Speech Recognizer not available for locale".into()));
        }

        // 3. Setup AVAudioEngine
        let audio_engine: id = msg_send![class!(AVAudioEngine), new];
        let input_node: id = msg_send![audio_engine, inputNode];
        
        let recognition_request: id = msg_send![class!(SFSpeechAudioBufferRecognitionRequest), new];
        let _: () = msg_send![recognition_request, setShouldReportPartialResults:YES];

        // 4. Create result block
        let app_clone = app.clone();
        let result_block = ConcreteBlock::new(move |result: id, error: id| {
            unsafe {
                if error != nil {
                    let desc: id = msg_send![error, localizedDescription];
                    let err_str = cocoa::foundation::NSString::UTF8String(desc);
                    let err_c_str = std::ffi::CStr::from_ptr(err_str).to_string_lossy().into_owned();
                    println!("Speech recognition error: {}", err_c_str);
                    return;
                }

                if result != nil {
                    let best_transcription: id = msg_send![result, bestTranscription];
                    let formatted_string: id = msg_send![best_transcription, formattedString];
                    let text = std::ffi::CStr::from_ptr(cocoa::foundation::NSString::UTF8String(formatted_string)).to_string_lossy().into_owned();
                    let is_final: bool = msg_send![result, isFinal];

                    #[derive(serde::Serialize, Clone)]
                    struct SpeechPayload {
                        text: String,
                        is_final: bool,
                    }

                    let _ = app_clone.emit("speech-result", SpeechPayload {
                        text,
                        is_final,
                    });
                }
            }
        });
        let result_block = result_block.copy();

        let recognition_task: id = msg_send![recognizer, recognitionTaskWithRequest:recognition_request resultHandler:result_block];

        // 5. Install tap on AVAudioEngine
        let recording_format: id = msg_send![input_node, outputFormatForBus:0];
        
        let tap_block = ConcreteBlock::new(move |buffer: id, _when: id| {
            unsafe {
                let _: () = msg_send![recognition_request, appendAudioPCMBuffer:buffer];
            }
        });
        let tap_block = tap_block.copy();

        let _: () = msg_send![input_node, installTapOnBus:0 bufferSize:1024 format:recording_format block:tap_block];

        // 6. Start AVAudioEngine
        let _: () = msg_send![audio_engine, prepare];
        let mut error: id = nil;
        let success: bool = msg_send![audio_engine, startAndReturnError:&mut error];

        if !success {
            let desc: id = msg_send![error, localizedDescription];
            let err_str = cocoa::foundation::NSString::UTF8String(desc);
            let err_c_str = std::ffi::CStr::from_ptr(err_str).to_string_lossy().into_owned();
            return Err(AppError::PlatformUnsupported(format!("Failed to start audio engine: {}", err_c_str)));
        }

        *engine_guard = Some(SpeechEngine {
            audio_engine,
            recognition_task,
            recognition_request,
        });

        Ok(())
    }
}

pub fn stop_recognition() -> Result<(), AppError> {
    unsafe {
        let engine_mutex = SPEECH_ENGINE.get_or_init(|| Mutex::new(None));
        let mut engine_guard = engine_mutex.lock().unwrap();
        if let Some(engine) = engine_guard.take() {
            let input_node: id = msg_send![engine.audio_engine, inputNode];
            let _: () = msg_send![input_node, removeTapOnBus:0];
            let _: () = msg_send![engine.audio_engine, stop];
            let _: () = msg_send![engine.recognition_request, endAudio];
            let _: () = msg_send![engine.recognition_task, finish];
        }
        Ok(())
    }
}
