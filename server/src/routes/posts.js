const express = require('express');
const router = express.Router();
const postController = require('../controllers/postController');
const uploadController = require('../controllers/uploadController');
const { authenticate } = require('../middleware/auth');

// Apply auth middleware to all routes
router.use(authenticate);

// 貼文相關路由
router.get('/', postController.getPosts);
router.get('/:id', postController.getPost);
router.post('/', postController.createPost);
router.put('/:id', postController.updatePost);
router.delete('/:id', postController.deletePost);

// 檔案上傳相關路由
router.post('/upload', uploadController.uploadFile);
router.delete('/upload/:filename', uploadController.deleteFile);

module.exports = router; 