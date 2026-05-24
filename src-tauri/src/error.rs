use serde::Serialize;

#[derive(Debug, thiserror::Error)]
pub enum AppError {
    #[error("Window operation failed: {0}")]
    Window(String),
    #[error("Platform capability unavailable: {0}")]
    PlatformUnsupported(String),
    #[error("Settings serialization failed: {0}")]
    Settings(String),
    #[error("Shortcut operation failed: {0}")]
    Shortcut(String),
    #[error("Internal error: {0}")]
    Internal(String),
}

impl Serialize for AppError {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        serializer.serialize_str(self.to_string().as_ref())
    }
}
