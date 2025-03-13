const path = require('path');
const fs = require('fs').promises;
const multer = require('multer');
const { getBaseUrl } = require('../config/app');

// 檢查文件類型並返回對應的目錄 / Check file type and return corresponding directory
const getFileDirectory = (mimetype, isTemp, fileType) => {
  if (isTemp) {
    return 'temp';
  }
  
  if (fileType === 'email') {
    return mimetype.startsWith('image/') ? 'emails/images' : 'emails/files';
  }
  
  if (mimetype === 'application/pdf') {
    return 'pdf';
  } else if (mimetype.startsWith('image/')) {
    return 'images';
  }
  
  return 'others';
};

// 生成安全的文件名 / Generate safe filename
const generateSafeFileName = (originalname) => {
  const fileExt = path.extname(originalname);
  const timestamp = Date.now();
  const random = Math.round(Math.random() * 1E9);
  return `${timestamp}-${random}${fileExt}`;
};

// 上傳文件 / Upload file
const uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: '未找到上傳的文件 / No file uploaded'
      });
    }

    // 獲取文件類型參數 / Get file type parameter
    const fileType = req.query.type;
    const isTemp = req.query.temp === 'true';

    // 確定存儲目錄 / Determine storage directory
    const subDir = getFileDirectory(req.file.mimetype, isTemp, fileType);
    const uploadDir = path.join(__dirname, '../../uploads', subDir);

    // 創建目錄（如果不存在）/ Create directory if not exists
    await fs.mkdir(uploadDir, { recursive: true });

    // 生成安全的文件名 / Generate safe filename
    const fileName = generateSafeFileName(req.file.originalname);
    const filePath = path.join(uploadDir, fileName);

    // 保存文件 / Save file
    await fs.writeFile(filePath, req.file.buffer);

    // 生成文件的訪問 URL / Generate file access URL
    const baseUrl = getBaseUrl();
    const fileUrl = `${baseUrl}/uploads/${subDir}/${fileName}`;

    // 返回成功響應 / Return success response
    res.json({
      success: true,
      data: {
        url: fileUrl,
        filename: fileName,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
        isTemp: isTemp,
        type: fileType
      }
    });
  } catch (error) {
    console.error('文件上傳失敗 / File upload failed:', error);
    res.status(500).json({
      success: false,
      message: '文件上傳失敗 / File upload failed'
    });
  }
};

// 刪除文件 / Delete file
const deleteFile = async (req, res) => {
  try {
    // 從 URL 中獲取完整的文件路徑 / Get complete file path from URL
    const filePath = req.params[0];
    if (!filePath) {
      return res.status(400).json({
        success: false,
        message: '未提供文件名 / No filename provided'
      });
    }

    // 構建完整的文件路徑 / Build complete file path
    const fullPath = path.join(__dirname, '../../uploads', filePath);
    console.log('Attempting to delete file:', fullPath);

    // 檢查文件是否存在 / Check if file exists
    try {
      await fs.access(fullPath);
    } catch (error) {
      console.log('File not found:', fullPath);
      return res.status(404).json({
        success: false,
        message: '文件不存在 / File does not exist'
      });
    }

    // 刪除文件 / Delete file
    await fs.unlink(fullPath);
    console.log('File deleted successfully:', fullPath);

    res.json({
      success: true,
      message: '文件刪除成功 / File deleted successfully'
    });
  } catch (error) {
    console.error('文件刪除失敗 / File deletion failed:', error);
    res.status(500).json({
      success: false,
      message: '文件刪除失敗 / File deletion failed'
    });
  }
};

// 移動文件從臨時目錄到永久目錄 / Move file from temporary to permanent directory
const moveFile = async (req, res) => {
  try {
    const { sourceFile, targetDir } = req.body;
    
    if (!sourceFile || !targetDir) {
      return res.status(400).json({
        success: false,
        message: '缺少必要參數 / Missing required parameters'
      });
    }

    // 構建源文件和目標文件的完整路徑 / Build complete paths for source and target files
    const baseDir = path.join(__dirname, '../../uploads');
    const sourcePath = path.join(baseDir, sourceFile);
    const fileName = path.basename(sourceFile);
    const targetPath = path.join(baseDir, targetDir, fileName);

    // 確保目標目錄存在 / Ensure target directory exists
    await fs.mkdir(path.dirname(targetPath), { recursive: true });

    // 移動文件 / Move file
    await fs.rename(sourcePath, targetPath);

    // 生成新的訪問 URL / Generate new access URL
    const baseUrl = getBaseUrl();
    const fileUrl = `${baseUrl}/uploads/${targetDir}/${fileName}`;

    res.json({
      success: true,
      data: {
        url: fileUrl,
        filename: fileName
      },
      message: '文件移動成功 / File moved successfully'
    });
  } catch (error) {
    console.error('文件移動失敗 / File move failed:', error);
    res.status(500).json({
      success: false,
      message: '文件移動失敗 / File move failed'
    });
  }
};

module.exports = {
  uploadFile,
  deleteFile,
  moveFile
}; 