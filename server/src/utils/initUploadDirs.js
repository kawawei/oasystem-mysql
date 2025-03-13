const fs = require('fs').promises;
const path = require('path');

// 檢查目錄是否存在並具有正確權限 / Check if directory exists and has correct permissions
async function ensureDirectoryWithPermissions(dirPath) {
  try {
    // 檢查目錄是否存在 / Check if directory exists
    try {
      await fs.access(dirPath);
    } catch (error) {
      if (error.code === 'ENOENT') {
        // 目錄不存在，創建它 / Directory doesn't exist, create it
        await fs.mkdir(dirPath, { recursive: true });
        console.log(`Created directory: ${dirPath}`);
      } else {
        throw error;
      }
    }

    // 嘗試設置權限 / Try to set permissions
    try {
      await fs.chmod(dirPath, 0o777);
    } catch (error) {
      if (error.code === 'EPERM') {
        console.warn(`Warning: Could not set permissions for ${dirPath}. Continuing anyway...`);
      } else {
        throw error;
      }
    }

    return true;
  } catch (error) {
    console.error(`Error handling directory ${dirPath}:`, error);
    return false;
  }
}

// 初始化上傳目錄 / Initialize upload directories
async function initUploadDirs() {
  const baseDir = '/app/uploads';  // 使用容器中的絕對路徑
  
  // 定義一級目錄 / Define first-level directories
  const firstLevelDirs = [
    'temp',    // 暫存文件目錄 / Temporary files directory
    'emails',  // 郵件相關目錄 / Email related directory
    'pdf',     // PDF 文件 / PDF files
    'images',  // 一般圖片 / General images
    'others'   // 其他類型文件 / Other types of files
  ];

  // 定義二級目錄 / Define second-level directories
  const secondLevelDirs = {
    'emails': ['images', 'files']  // 郵件目錄下的子目錄 / Subdirectories under emails
  };

  try {
    // 創建並檢查基礎上傳目錄 / Create and check base upload directory
    const baseDirSuccess = await ensureDirectoryWithPermissions(baseDir);
    if (!baseDirSuccess) {
      console.warn('Warning: Could not fully set up base directory. Some features might not work correctly.');
    }

    // 創建一級目錄 / Create first-level directories
    for (const dir of firstLevelDirs) {
      const fullPath = path.join(baseDir, dir);
      const success = await ensureDirectoryWithPermissions(fullPath);
      if (!success) {
        console.warn(`Warning: Could not fully set up directory ${fullPath}`);
      }
    }

    // 創建二級目錄 / Create second-level directories
    for (const [parentDir, subDirs] of Object.entries(secondLevelDirs)) {
      for (const subDir of subDirs) {
        const fullPath = path.join(baseDir, parentDir, subDir);
        const success = await ensureDirectoryWithPermissions(fullPath);
        if (!success) {
          console.warn(`Warning: Could not fully set up directory ${fullPath}`);
        }
      }
    }

    console.log('Upload directories initialization completed');
    return true;
  } catch (error) {
    console.error('Error in upload directories initialization:', error);
    // 不要拋出錯誤，讓應用程序繼續運行 / Don't throw error, let the application continue
    return false;
  }
}

module.exports = initUploadDirs;
