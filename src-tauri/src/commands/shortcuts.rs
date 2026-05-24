use crate::error::AppError;

#[tauri::command]
pub async fn save_shortcut(_shortcut: String) -> Result<(), AppError> {
    Ok(())
}
