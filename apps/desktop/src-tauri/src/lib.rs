use serde::Deserialize;

#[derive(Debug, Deserialize)]
pub struct PingInput {
    pub nonce: Option<String>,
}

fn validate_nonce(nonce: &Option<String>) -> bool {
    match nonce {
        None => true,
        Some(n) => {
            const MAX: usize = 64;
            !n.is_empty()
                && n.len() <= MAX
                && n.chars().all(|c| c.is_ascii_alphanumeric() || c == '-' || c == '_')
        }
    }
}

#[tauri::command]
fn ping(input: Option<PingInput>) -> Result<String, String> {
    match input {
        Some(v) if !validate_nonce(&v.nonce) => Err("invalid nonce".to_string()),
        _ => Ok("pong".to_string()),
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_stronghold::Builder::new(|password| {
            use std::hash::{Hash, Hasher};
            use std::collections::hash_map::DefaultHasher;
            let mut h = DefaultHasher::new();
            password.hash(&mut h);
            h.finish().to_string()
        }).build())
        .invoke_handler(tauri::generate_handler![ping])
        .run(tauri::generate_context!())
        .expect("tauri run failed");
}
