const fs = require('fs').promises;
const path = require('path');

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
    // 創建基礎上傳目錄 / Create base upload directory
    await fs.mkdir(baseDir, { recursive: true });
    console.log(`Created base directory: ${baseDir}`);
    await fs.chmod(baseDir, 0o755);

    // 創建一級目錄 / Create first-level directories
    for (const dir of firstLevelDirs) {
      const fullPath = path.join(baseDir, dir);
      await fs.mkdir(fullPath, { recursive: true });
      await fs.chmod(fullPath, 0o755);
      console.log(`Created directory: ${fullPath}`);
    }

    // 創建二級目錄 / Create second-level directories
    for (const [parentDir, subDirs] of Object.entries(secondLevelDirs)) {
      for (const subDir of subDirs) {
        const fullPath = path.join(baseDir, parentDir, subDir);
        await fs.mkdir(fullPath, { recursive: true });
        await fs.chmod(fullPath, 0o755);
        console.log(`Created directory: ${fullPath}`);
      }
    }

    console.log('All upload directories initialized successfully');
  } catch (error) {
    console.error('Error creating upload directories:', error);
    throw error; // 向上傳遞錯誤以便應用程序適當處理 / Propagate error for proper handling by the application
  }
}

module.exports = initUploadDirs;
