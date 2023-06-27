use std::{time::Duration, path::Path, sync::Arc};
use futures::future::join_all;
use tauri::{Window};
use serde::{Serialize, Deserialize};
use tokio::{time::sleep, sync::mpsc};
use downloader::Downloader;
use thiserror::Error;
use anyhow::Result;

// 用户信息
#[derive(Debug, Serialize, Deserialize)]
pub struct UserInfo {
    pub nickname: String,
    pub uid: String,
    pub avatar_url: String,
    pub res_count: u16,
}

// 单个资源信息
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ResInfoItem {
    pub res_id: String,   // 资源ID
    pub res_title: String, // 资源标题
    pub res_url: String,  // 资源链接
}


// 资源信息列表
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ResInfo {
    pub max_cursor: u64,
    pub has_more: bool,  
    pub items: Vec<ResInfoItem>,
}


// 用户和资源信息
#[derive(Debug, Serialize, Deserialize)]
pub struct UserResInfo {
    user_info: UserInfo,
    res_info: ResInfo,
}


// 错误定义
#[derive(Error, Debug)]
enum AppError {
    
    #[error("系统错误")]
    SystemAbnormal,

    #[error("下载资源失败")]
    DownloadResFailed,
}

// 单文件下载进度条数据结构
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppSingleDownloadProgress {
    pub percentage: u8
}

// 多个文件下载进度条数据结构
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppMuplitDownloadProgress {
    pub res_id: String,
    pub res_title: String,
    pub save_path: String,
    pub is_success: bool,
}

// 单个文件下载
#[tauri::command]
pub async fn helper_single_download(save_path: String, res_url: String, window: Window) -> Result<String, String> {
    
    let downloader = Downloader::new(res_url, save_path, Some(8))
        .await
        .map_err(|_|AppError::SystemAbnormal.to_string())?;

    let save_path = downloader.get_save_path();
    let downloader_clone = downloader.clone();
    
    // 进度条
    tokio::spawn(async move {
        let total_size = downloader_clone.total_size();
        loop {
            let cur_size  = downloader_clone.downloaded_size().await;
            if cur_size >= total_size {
                let _ = window.emit("helper_single_download", AppSingleDownloadProgress{ percentage: 100 });
                break;
            }
            let percentage = (cur_size as f64 * 100.0 / total_size as f64 ).round() as u8;
            let _ = window.emit("helper_single_download", AppSingleDownloadProgress{ percentage });
            sleep(Duration::from_millis(100)).await;
        }
    });

    // 下载
    match downloader.download().await {
        Ok(_) => {
            sleep(Duration::from_millis(100)).await
        },
        Err(_) => return Err(AppError::DownloadResFailed.to_string()),
    };
    Ok(save_path)
}

// 拼接保存路径
pub fn get_save_path(save_dir: &String, res_title: &str) -> String {
    let items: Vec<&str> = res_title.split('#').collect();
    let save_path = Path::new(&save_dir).join(&items[0].trim()).to_str().unwrap().to_string(); 
    save_path
}


// 批量下载资源
#[tauri::command]
pub async fn helper_muplit_download(items: Vec<ResInfoItem>, save_dir: String, window: Window) -> Result<(), String>{

    let window = Arc::new(window);
    let mut handler_list = Vec::new();
  
    for item in items.iter() {
        let res_title = Arc::new(item.res_title.clone());
        let save_path = Arc::new(get_save_path(&save_dir, &res_title.clone())); 
        let res_id = Arc::new(item.res_id.clone());
        let result = Downloader::new(item.res_url.clone(), save_path.clone().to_string(), Some(8)).await;
        let window = window.clone();

        if result.is_err() {
            let _ = window.emit("helper_muplit_download", AppMuplitDownloadProgress { 
                res_id: res_id.to_string(),
                is_success: false,
                res_title: res_title.to_string(),
                save_path: save_path.to_string(),
            });
            continue;
        }

        let downloader = result.ok().unwrap();

        let (tx, mut rx) = mpsc::channel::<bool>(1);
        
        // 下载文件
        tokio::spawn(async move {
            let is_success = downloader.download().await.is_ok();
            let _ = tx.send(is_success).await; // 下载是否成功
        });
        
        // 监听下载进度
        let handler = tokio::spawn(async move {
            loop {
                tokio::select! {
                    val = rx.recv() => {
                        let _ = window.emit("helper_muplit_download", AppMuplitDownloadProgress { 
                            res_id: res_id.to_string(),
                            is_success: val.unwrap_or(false),
                            res_title: res_title.to_string(),
                            save_path: save_path.to_string(),
                        });
                        break;
                    }
                    _ = sleep(Duration::from_secs(1)) => {}
                }
            }
        });
        handler_list.push(handler);
    }
    join_all(handler_list).await; // 等待监听下载任务完成
    Ok(())
}