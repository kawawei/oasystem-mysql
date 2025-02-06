const fs = require('fs').promises;
const path = require('path');

// 初始化上傳目錄
async function initUploadDirs() {
  const baseDir = path.join(__dirname, '../../uploads');
  const subDirs = ['pdf', 'images', 'others'];

  try {
    // 創建基礎上傳目錄
    await fs.mkdir(baseDir, { recursive: true });

    // 創建子目錄
    for (const dir of subDirs) {
      const fullPath = path.join(baseDir, dir);
      await fs.mkdir(fullPath, { recursive: true });
      console.log(`Created directory: ${fullPath}`);
    }
  } catch (error) {
    console.error('Error creating upload directories:', error);
  }
}

module.exports = initUploadDirs;
