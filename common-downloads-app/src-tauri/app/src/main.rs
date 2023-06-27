#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            helper::helper_single_download,
            helper::helper_muplit_download,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
