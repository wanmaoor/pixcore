use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;

// ============ 文件系统相关命令 ============

/// 获取默认存储路径
#[tauri::command]
fn get_default_storage_path() -> Result<String, String> {
    let home = dirs::home_dir().ok_or("无法获取用户目录")?;
    let storage_path = home.join("PixcoreStorage");
    Ok(storage_path.to_string_lossy().to_string())
}

/// 确保目录存在
#[tauri::command]
fn ensure_directory(path: String) -> Result<bool, String> {
    let path = PathBuf::from(&path);
    if !path.exists() {
        fs::create_dir_all(&path).map_err(|e| format!("创建目录失败: {}", e))?;
    }
    Ok(true)
}

/// 检查路径是否可写
#[tauri::command]
fn check_path_writable(path: String) -> Result<bool, String> {
    let path = PathBuf::from(&path);

    // 如果目录不存在，尝试创建
    if !path.exists() {
        fs::create_dir_all(&path).map_err(|e| format!("无法创建目录: {}", e))?;
    }

    // 尝试创建临时文件来测试写权限
    let test_file = path.join(".pixcore_write_test");
    match fs::write(&test_file, "test") {
        Ok(_) => {
            let _ = fs::remove_file(test_file);
            Ok(true)
        }
        Err(e) => Err(format!("路径不可写: {}", e)),
    }
}

/// 读取文件内容
#[tauri::command]
fn read_file(path: String) -> Result<Vec<u8>, String> {
    fs::read(&path).map_err(|e| format!("读取文件失败: {}", e))
}

/// 写入文件
#[tauri::command]
fn write_file(path: String, contents: Vec<u8>) -> Result<(), String> {
    // 确保父目录存在
    if let Some(parent) = PathBuf::from(&path).parent() {
        fs::create_dir_all(parent).map_err(|e| format!("创建目录失败: {}", e))?;
    }
    fs::write(&path, contents).map_err(|e| format!("写入文件失败: {}", e))
}

/// 删除文件
#[tauri::command]
fn delete_file(path: String) -> Result<(), String> {
    fs::remove_file(&path).map_err(|e| format!("删除文件失败: {}", e))
}

/// 列出目录内容
#[tauri::command]
fn list_directory(path: String) -> Result<Vec<FileInfo>, String> {
    let path = PathBuf::from(&path);
    if !path.exists() {
        return Ok(vec![]);
    }

    let entries = fs::read_dir(&path).map_err(|e| format!("读取目录失败: {}", e))?;

    let mut files = Vec::new();
    for entry in entries {
        if let Ok(entry) = entry {
            let metadata = entry.metadata().ok();
            files.push(FileInfo {
                name: entry.file_name().to_string_lossy().to_string(),
                path: entry.path().to_string_lossy().to_string(),
                is_directory: metadata.as_ref().map(|m| m.is_dir()).unwrap_or(false),
                size: metadata.as_ref().map(|m| m.len()).unwrap_or(0),
            });
        }
    }
    Ok(files)
}

#[derive(Debug, Serialize, Deserialize)]
struct FileInfo {
    name: String,
    path: String,
    is_directory: bool,
    size: u64,
}

/// 检查文件是否存在
#[tauri::command]
fn file_exists(path: String) -> bool {
    PathBuf::from(&path).exists()
}

/// 获取文件大小
#[tauri::command]
fn get_file_size(path: String) -> Result<u64, String> {
    let metadata = fs::metadata(&path).map_err(|e| format!("获取文件信息失败: {}", e))?;
    Ok(metadata.len())
}

// ============ 密钥存储相关命令 ============

const KEYRING_SERVICE: &str = "com.pixcore.app";

/// 存储 API Key 到系统密钥链
#[tauri::command]
fn store_api_key(provider: String, api_key: String) -> Result<(), String> {
    let entry = keyring::Entry::new(KEYRING_SERVICE, &provider)
        .map_err(|e| format!("创建密钥条目失败: {}", e))?;
    entry
        .set_password(&api_key)
        .map_err(|e| format!("存储密钥失败: {}", e))?;
    Ok(())
}

/// 从系统密钥链获取 API Key
#[tauri::command]
fn get_api_key(provider: String) -> Result<Option<String>, String> {
    let entry = keyring::Entry::new(KEYRING_SERVICE, &provider)
        .map_err(|e| format!("创建密钥条目失败: {}", e))?;
    match entry.get_password() {
        Ok(password) => Ok(Some(password)),
        Err(keyring::Error::NoEntry) => Ok(None),
        Err(e) => Err(format!("获取密钥失败: {}", e)),
    }
}

/// 删除 API Key
#[tauri::command]
fn delete_api_key(provider: String) -> Result<(), String> {
    let entry = keyring::Entry::new(KEYRING_SERVICE, &provider)
        .map_err(|e| format!("创建密钥条目失败: {}", e))?;
    match entry.delete_credential() {
        Ok(_) => Ok(()),
        Err(keyring::Error::NoEntry) => Ok(()), // 不存在也算成功
        Err(e) => Err(format!("删除密钥失败: {}", e)),
    }
}

/// 检查 API Key 是否存在
#[tauri::command]
fn has_api_key(provider: String) -> Result<bool, String> {
    let entry = keyring::Entry::new(KEYRING_SERVICE, &provider)
        .map_err(|e| format!("创建密钥条目失败: {}", e))?;
    match entry.get_password() {
        Ok(_) => Ok(true),
        Err(keyring::Error::NoEntry) => Ok(false),
        Err(e) => Err(format!("检查密钥失败: {}", e)),
    }
}

// ============ 系统信息相关命令 ============

#[derive(Debug, Serialize)]
struct SystemInfo {
    os: String,
    arch: String,
    home_dir: Option<String>,
    app_data_dir: Option<String>,
}

/// 获取系统信息
#[tauri::command]
fn get_system_info() -> SystemInfo {
    SystemInfo {
        os: std::env::consts::OS.to_string(),
        arch: std::env::consts::ARCH.to_string(),
        home_dir: dirs::home_dir().map(|p| p.to_string_lossy().to_string()),
        app_data_dir: dirs::data_dir().map(|p| p.to_string_lossy().to_string()),
    }
}

// ============ 应用入口 ============

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_store::Builder::default().build())
        .invoke_handler(tauri::generate_handler![
            // 文件系统
            get_default_storage_path,
            ensure_directory,
            check_path_writable,
            read_file,
            write_file,
            delete_file,
            list_directory,
            file_exists,
            get_file_size,
            // 密钥存储
            store_api_key,
            get_api_key,
            delete_api_key,
            has_api_key,
            // 系统信息
            get_system_info,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
