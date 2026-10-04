pub fn run() {
  tauri::Builder::default()
    .invoke_handler(tauri::generate_handler![ping])
    .run(tauri::generate_context!())
    .expect("tauri run failed");
}

#[tauri::command]
fn ping() -> String {
  "pong".to_string()
}
