// 補習班路由 Tutorial center routes
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const tutorialCenterController = require('../controllers/tutorialCenterController');
const auth = require('../middleware/auth');
const fs = require('fs');

// 配置文件上傳 Configure file upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // 確保上傳目錄存在 Ensure upload directory exists
    const uploadDir = path.join(__dirname, '../../uploads');
    fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // 生成唯一的檔案名 Generate unique filename
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    cb(null, `tutorial-center-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    // 檢查檔案類型 Check file type
    const allowedMimes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel'
    ];
    
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('只允許上傳 Excel 檔案 (.xlsx, .xls)'));
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // 限制檔案大小為 5MB
  }
}).single('file');

// 路由定義 Route definitions
router.get('/template', auth.authenticate, (req, res, next) => {
  tutorialCenterController.downloadTemplate(req, res).catch(next);
});

router.post('/import', auth.authenticate, (req, res, next) => {
  upload(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      // Multer 錯誤處理
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ message: '檔案大小不能超過 5MB' });
      }
      return res.status(400).json({ message: `上傳錯誤: ${err.message}` });
    } else if (err) {
      // 其他錯誤
      return res.status(400).json({ message: err.message });
    }
    
    // 檔案上傳成功，繼續處理
    tutorialCenterController.import(req, res).catch(next);
  });
});

router.get('/', auth.authenticate, (req, res, next) => {
  tutorialCenterController.list(req, res).catch(next);
});

router.post('/', auth.authenticate, (req, res, next) => {
  tutorialCenterController.create(req, res).catch(next);
});

router.put('/:id', auth.authenticate, (req, res, next) => {
  tutorialCenterController.update(req, res).catch(next);
});

router.delete('/:id', auth.authenticate, (req, res, next) => {
  tutorialCenterController.delete(req, res).catch(next);
});

module.exports = router; 