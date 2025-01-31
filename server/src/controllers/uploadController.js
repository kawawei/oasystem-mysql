const multer = require('multer');
const path = require('path');
const fs = require('fs');

// 配置 multer 存儲
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/';
    // 確保上傳目錄存在
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // 生成唯一檔案名
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

// 檔案過濾器
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'video/mp4'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('不支援的檔案類型。只允許 jpg、png 圖片和 mp4 影片。'), false);
  }
};

// 配置上傳
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 5 // 最多5個檔案
  }
});

// 上傳處理器
exports.uploadFiles = (req, res) => {
  const uploadMiddleware = upload.array('files', 5);

  uploadMiddleware(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ message: '檔案大小不能超過 10MB' });
      }
      if (err.code === 'LIMIT_FILE_COUNT') {
        return res.status(400).json({ message: '最多只能上傳 5 個檔案' });
      }
      return res.status(400).json({ message: '檔案上傳失敗' });
    } else if (err) {
      return res.status(400).json({ message: err.message });
    }

    // 上傳成功，返回檔案資訊
    const files = req.files.map(file => ({
      filename: file.filename,
      originalname: file.originalname,
      path: file.path,
      size: file.size,
      mimetype: file.mimetype
    }));

    res.json({
      message: '檔案上傳成功',
      files: files
    });
  });
};

// 刪除檔案
exports.deleteFile = (req, res) => {
  const { filename } = req.params;
  const filepath = path.join('uploads/', filename);

  fs.unlink(filepath, (err) => {
    if (err) {
      console.error('Error deleting file:', err);
      return res.status(500).json({ message: '刪除檔案失敗' });
    }
    res.json({ message: '檔案已成功刪除' });
  });
}; 