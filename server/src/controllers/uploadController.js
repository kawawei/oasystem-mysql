const path = require('path');
const fs = require('fs').promises;
const multer = require('multer');
const { getBaseUrl } = require('../config/app');

// 上傳文件
const uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: '文件上傳失敗'
      });
    }

    let uploadDir;
    let subDir;
    const isTemp = req.query.temp === 'true'; // 檢查是否為暫存文件

    if (isTemp) {
      subDir = 'temp';
    } else {
      // 根據文件類型決定存儲目錄
      if (req.file.mimetype === 'application/pdf') {
        subDir = 'pdf';
      } else if (req.file.mimetype.startsWith('image/')) {
        subDir = 'images';
      } else {
        subDir = 'others';
      }
    }

    // 創建對應的子目錄
    uploadDir = path.join(__dirname, '../../uploads', subDir);
    await fs.mkdir(uploadDir, { recursive: true });

    // 生成唯一的文件名
    const fileExt = path.extname(req.file.originalname);
    const fileName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${fileExt}`;
    const filePath = path.join(uploadDir, fileName);

    // 保存文件
    await fs.writeFile(filePath, req.file.buffer);

    // 生成文件的訪問 URL
    const baseUrl = getBaseUrl();
    const fileUrl = `${baseUrl}/uploads/${subDir}/${fileName}`;

    res.json({
      success: true,
      data: {
        url: fileUrl,
        filename: fileName,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
        isTemp: isTemp
      }
    });
  } catch (error) {
    console.error('文件上傳失敗:', error);
    res.status(500).json({
      success: false,
      message: '文件上傳失敗'
    });
  }
};

// 刪除文件
const deleteFile = async (req, res) => {
  try {
    // 從 URL 中獲取完整的文件路徑
    const filePath = req.params[0];  // 使用通配符獲取完整路徑
    if (!filePath) {
      return res.status(400).json({
        success: false,
        message: '未提供文件名'
      });
    }

    // 構建完整的文件路徑
    const fullPath = path.join(__dirname, '../../uploads', filePath);
    console.log('Attempting to delete file:', fullPath);

    try {
      await fs.access(fullPath);
    } catch (error) {
      console.log('File not found:', fullPath);
      return res.status(404).json({
        success: false,
        message: '文件不存在'
      });
    }

    // 刪除文件
    await fs.unlink(fullPath);
    console.log('File deleted successfully:', fullPath);

    res.json({
      success: true,
      message: '文件刪除成功'
    });
  } catch (error) {
    console.error('文件刪除失敗:', error);
    res.status(500).json({
      success: false,
      message: '文件刪除失敗'
    });
  }
};

module.exports = {
  uploadFile,
  deleteFile
}; 