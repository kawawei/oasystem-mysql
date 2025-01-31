const Post = require('../models/Post');
const User = require('../models/User');
const { Op } = require('sequelize');

// 獲取貼文列表
exports.getPosts = async (req, res) => {
  try {
    const posts = await Post.findAll({
      include: [{
        model: User,
        as: 'reviewer',
        attributes: ['id', 'name']
      }],
      order: [['createdAt', 'DESC']]
    });
    res.json(posts);
  } catch (error) {
    console.error('Error getting posts:', error);
    res.status(500).json({ message: '獲取貼文列表失敗' });
  }
};

// 獲取單個貼文
exports.getPost = async (req, res) => {
  try {
    const post = await Post.findByPk(req.params.id, {
      include: [{
        model: User,
        as: 'reviewer',
        attributes: ['id', 'name']
      }]
    });
    
    if (!post) {
      return res.status(404).json({ message: '找不到該貼文' });
    }
    
    res.json(post);
  } catch (error) {
    console.error('Error getting post:', error);
    res.status(500).json({ message: '獲取貼文詳情失敗' });
  }
};

// 創建貼文
exports.createPost = async (req, res) => {
  try {
    const { title, content, platform, postDate, postTime, reviewerId, mediaFiles } = req.body;
    
    // 合併日期和時間
    const postDateTime = new Date(`${postDate} ${postTime}`);
    
    const post = await Post.create({
      title,
      content,
      platform,
      postTime: postDateTime,
      reviewerId,
      mediaFiles: mediaFiles || [],
      status: 'pending'
    });

    const postWithReviewer = await Post.findByPk(post.id, {
      include: [{
        model: User,
        as: 'reviewer',
        attributes: ['id', 'name']
      }]
    });

    res.status(201).json(postWithReviewer);
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json({ message: '創建貼文失敗' });
  }
};

// 更新貼文狀態
exports.updatePost = async (req, res) => {
  try {
    const { title, content, platform, postDate, postTime, reviewerId, mediaFiles, status, reviewComment } = req.body;
    const post = await Post.findByPk(req.params.id);
    
    if (!post) {
      return res.status(404).json({ message: '找不到該貼文' });
    }
    
    // 合併日期和時間（如果提供了的話）
    let postDateTime = post.postTime;
    if (postDate && postTime) {
      postDateTime = new Date(`${postDate} ${postTime}`);
    }
    
    await post.update({
      title: title || post.title,
      content: content || post.content,
      platform: platform || post.platform,
      postTime: postDateTime,
      reviewerId: reviewerId || post.reviewerId,
      mediaFiles: mediaFiles || post.mediaFiles,
      status: status || post.status,
      reviewComment: reviewComment || post.reviewComment
    });

    const updatedPost = await Post.findByPk(post.id, {
      include: [{
        model: User,
        as: 'reviewer',
        attributes: ['id', 'name']
      }]
    });

    res.json(updatedPost);
  } catch (error) {
    console.error('Error updating post:', error);
    res.status(500).json({ message: '更新貼文失敗' });
  }
};

// 刪除貼文
exports.deletePost = async (req, res) => {
  try {
    const post = await Post.findByPk(req.params.id);
    
    if (!post) {
      return res.status(404).json({ message: '找不到該貼文' });
    }
    
    await post.destroy();
    res.json({ message: '貼文已成功刪除' });
  } catch (error) {
    console.error('Error deleting post:', error);
    res.status(500).json({ message: '刪除貼文失敗' });
  }
}; 