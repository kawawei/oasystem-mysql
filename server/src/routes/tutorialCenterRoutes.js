// 補習班路由 Tutorial center routes
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const tutorialCenterController = require('../controllers/tutorialCenterController');
const auth = require('../middleware/auth');

// 配置文件上傳 Configure file upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, `tutorial-center-${Date.now()}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
        file.mimetype === 'application/vnd.ms-excel') {
      cb(null, true);
    } else {
      cb(new Error('只允許上傳 Excel 文件 / Only Excel files are allowed'));
    }
  }
});

// 路由定義 Route definitions
router.get('/template', auth.authenticate, (req, res, next) => {
  tutorialCenterController.downloadTemplate(req, res).catch(next);
});

router.post('/import', auth.authenticate, upload.single('file'), (req, res, next) => {
  tutorialCenterController.import(req, res).catch(next);
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