use serde::Serialize;

#[derive(Serialize)]
pub struct HealthCheckResponse {
    status: &'static str,
    message: &'static str,
}

/// Called by the frontend to confirm the Rust bridge is available.
#[tauri::command]
pub fn health_check() -> HealthCheckResponse {
    HealthCheckResponse {
        status: "ok",
        message: "Rust bridge ready for secure storage, background sync ticks, and privileged API work.",
    }
}

/// Validates and hands back OAuth deep-link callbacks so the frontend
/// can hand them off to the appropriate provider without storing the
/// raw URL in Webview memory beyond this call.
#[tauri::command]
pub fn store_oauth_callback(url: String) -> Result<String, String> {
    if !url.starts_with("mimir://") {
        return Err("Only mimir:// callback URLs are accepted".into());
    }
    Ok(url)
}
