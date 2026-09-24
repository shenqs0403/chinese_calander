// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
use tauri::Manager;

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
fn is_wayland() -> bool {
    std::env::var("WAYLAND_DISPLAY").is_ok()
}

#[tauri::command]
fn exit_app(app: tauri::AppHandle) {
    app.exit(0);
}

fn window_size() -> (f64, f64) {
    (1080.0, 580.0)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            let window = app
                .get_webview_window("main")
                .expect("main window not found");
            let (w, h) = window_size();
            window.set_size(tauri::LogicalSize::new(w, h))?;
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![greet, is_wayland, exit_app])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
