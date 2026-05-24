use serde::Serialize;
use url::Url;

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
    let parsed = Url::parse(&url).map_err(|_| "OAuth callback URL is invalid".to_string())?;
    if !matches!(parsed.scheme(), "mimir" | "io.mimir.app") {
        return Err("Only registered app callback URLs are accepted".into());
    }

    Ok(url)
}
