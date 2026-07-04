use objc::{class, msg_send, sel, sel_impl};
use cocoa::base::{id, nil, NO, YES};

#[link(name = "Speech", kind = "framework")]
#[link(name = "AVFoundation", kind = "framework")]
extern "C" {}

fn main() {
    unsafe {
        let recognizer: id = msg_send![class!(SFSpeechRecognizer), new];
        println!("Recognizer: {:?}", recognizer);
    }
}
