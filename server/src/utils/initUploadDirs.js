const fs = require('fs').promises;
const path = require('path');

// 初始化上傳目錄 / Initialize upload directories
async function initUploadDirs() {
  const baseDir = '/app/uploads';  // 使用容器中的絕對路徑
  // 定義所有需要的子目錄 / Define all required subdirectories
  const subDirs = [
    'temp',           // 暫存文件目錄 / Temporary files directory
    'emails/images',  // 郵件中的圖片 / Images in emails
    'emails/files',   // 郵件附件 / Email attachments
    'pdf',           // PDF 文件 / PDF files
    'images',        // 一般圖片 / General images
    'others'         // 其他類型文件 / Other types of files
  ];

  try {
    // 創建基礎上傳目錄 / Create base upload directory
    await fs.mkdir(baseDir, { recursive: true });
    console.log(`Created base directory: ${baseDir}`);

    // 創建所有子目錄 / Create all subdirectories
    for (const dir of subDirs) {
      const fullPath = path.join(baseDir, dir);
      await fs.mkdir(fullPath, { recursive: true });
      console.log(`Created directory: ${fullPath}`);
    }

    // 確保所有目錄都有正確的權限
    // Ensure all directories have correct permissions
    await fs.chmod(baseDir, 0o755);
    for (const dir of subDirs) {
      const fullPath = path.join(baseDir, dir);
      await fs.chmod(fullPath, 0o755);
    }

    console.log('All upload directories initialized successfully');
  } catch (error) {
    console.error('Error creating upload directories:', error);
    throw error; // 向上傳遞錯誤以便應用程序適當處理 / Propagate error for proper handling by the application
  }
}

module.exports = initUploadDirs;
