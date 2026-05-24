with open("src/commands/audio.rs", "r") as f:
    lines = f.readlines()

new_lines = []
imports = []
for line in lines:
    if line.startswith("use crate::error::AppError;"):
        imports.append(line)
    elif line.startswith("use tauri::AppHandle;"):
        imports.append(line)
    else:
        new_lines.append(line)

with open("src/commands/audio.rs", "w") as f:
    f.writelines(imports + new_lines)
