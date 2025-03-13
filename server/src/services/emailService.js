const path = require('path');
const fs = require('fs').promises;
const { getBaseUrl } = require('../config/app');

class EmailService {
  constructor() {
    this.uploadDir = path.join(__dirname, '../../uploads');
    this.baseUrl = getBaseUrl();
  }

  /**
   * 處理郵件附件 / Handle email attachments
   * @param {Array} attachments - 附件列表 / List of attachments
   * @returns {Promise<Array>} - 處理後的附件列表 / Processed attachments list
   */
  async processAttachments(attachments) {
    const processedAttachments = [];

    for (const attachment of attachments) {
      try {
        // 檢查是否為臨時文件 / Check if it's a temporary file
        if (attachment.url.includes('/uploads/temp/')) {
          const fileName = path.basename(attachment.url);
          const tempPath = path.join(this.uploadDir, 'temp', fileName);
          
          // 確定目標目錄 / Determine target directory
          const targetDir = attachment.mimeType?.startsWith('image/') 
            ? 'emails/images' 
            : 'emails/files';
          
          // 確保目標目錄存在 / Ensure target directory exists
          const targetPath = path.join(this.uploadDir, targetDir);
          await fs.mkdir(targetPath, { recursive: true });
          
          // 移動文件到永久存儲 / Move file to permanent storage
          const permanentPath = path.join(targetPath, fileName);
          await fs.rename(tempPath, permanentPath);
          
          // 更新文件 URL / Update file URL
          processedAttachments.push({
            ...attachment,
            url: `${this.baseUrl}/uploads/${targetDir}/${fileName}`,
            path: permanentPath // 用於實際發送附件 / For actual attachment sending
          });
        } else {
          // 如果不是臨時文件，保持原樣 / If not a temporary file, keep as is
          processedAttachments.push(attachment);
        }
      } catch (error) {
        console.error(`處理附件失敗 / Failed to process attachment: ${attachment.filename}`, error);
        throw new Error(`處理附件失敗 / Failed to process attachment: ${attachment.filename}`);
      }
    }

    return processedAttachments;
  }

  /**
   * 清理臨時文件 / Clean up temporary files
   * @param {number} maxAge - 最大保留時間（毫秒）/ Maximum retention time (milliseconds)
   */
  async cleanupTempFiles(maxAge = 24 * 60 * 60 * 1000) { // 默認24小時 / Default 24 hours
    try {
      const tempDir = path.join(this.uploadDir, 'temp');
      const files = await fs.readdir(tempDir);
      const now = Date.now();

      for (const file of files) {
        const filePath = path.join(tempDir, file);
        const stats = await fs.stat(filePath);
        const fileAge = now - stats.mtimeMs;

        if (fileAge > maxAge) {
          await fs.unlink(filePath);
          console.log(`已刪除過期臨時文件 / Deleted expired temp file: ${file}`);
        }
      }
    } catch (error) {
      console.error('清理臨時文件失敗 / Failed to clean up temp files:', error);
    }
  }

  /**
   * 獲取文件的 MIME 類型 / Get file MIME type
   * @param {string} filename - 文件名 / Filename
   * @returns {string} - MIME 類型 / MIME type
   */
  getMimeType(filename) {
    const ext = path.extname(filename).toLowerCase();
    const mimeTypes = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.pdf': 'application/pdf',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.xls': 'application/vnd.ms-excel',
      '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      '.txt': 'text/plain',
      '.zip': 'application/zip',
      '.rar': 'application/x-rar-compressed'
    };
    
    return mimeTypes[ext] || 'application/octet-stream';
  }
}

module.exports = new EmailService(); 