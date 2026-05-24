with open("src/commands/audio.rs", "r") as f:
    content = f.read()

new_cmd = """
#[tauri::command]
pub fn log_stt(msg: String) {
    println!("{}", msg);
}
"""

with open("src/commands/audio.rs", "w") as f:
    f.write(content + new_cmd)
