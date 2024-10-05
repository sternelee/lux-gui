use std::process::Command;
use std::env;


#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
async fn extract(command: &str) -> Result<String, String> {
    let current_dir = env::current_dir().expect("Failed to get current directory");
    let binary_path = current_dir.join("resources").join("lux");
    let child = Command::new(binary_path)
        .args(command.split(' '))
        .output()
        .map_err(|err| err.to_string())?;
    if child.status.success() {
        Ok(String::from_utf8_lossy(&child.stdout).to_string())
    } else {
        Err(String::from_utf8_lossy(&child.stdout).to_string())
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        // .invoke_handler(tauri::generate_handler![greet, extract])
        .invoke_handler(tauri::generate_handler![greet, extract])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
