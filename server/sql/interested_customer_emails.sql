-- 創建意向客戶郵件資料表 / Create interested customer emails table
CREATE TABLE IF NOT EXISTS interested_customer_emails (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    subject TEXT NOT NULL,                    -- 郵件主旨 / Email subject
    recipients TEXT NOT NULL,                 -- 收件人（JSON 格式儲存多個郵件地址）/ Recipients (stored as JSON array of email addresses)
    content TEXT NOT NULL,                    -- 郵件內容 / Email content
    status TEXT NOT NULL DEFAULT 'draft',     -- 郵件狀態（草稿、已寄送等）/ Email status (draft, sent, etc.)
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,  -- 建立時間 / Creation timestamp
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,  -- 更新時間 / Last update timestamp
    sent_at DATETIME,                        -- 寄送時間 / Sent timestamp
    created_by INTEGER,                       -- 建立者ID / Creator ID
    attachments TEXT,                         -- 附件（JSON 格式儲存檔案路徑）/ Attachments (stored as JSON array of file paths)
    metadata TEXT                             -- 其他元數據（JSON 格式）/ Additional metadata (stored as JSON)
); 