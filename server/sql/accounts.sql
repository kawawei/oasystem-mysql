-- 創建帳戶表
CREATE TABLE IF NOT EXISTS accounts (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL COMMENT '帳戶名稱',
    currency VARCHAR(10) NOT NULL COMMENT '幣種',
    initial_balance DECIMAL(15, 2) NOT NULL DEFAULT 0 COMMENT '初始金額',
    current_balance DECIMAL(15, 2) NOT NULL DEFAULT 0 COMMENT '目前金額',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '創建時間',
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新時間',
    created_by BIGINT COMMENT '創建者ID',
    updated_by BIGINT COMMENT '更新者ID',
    is_deleted TINYINT(1) NOT NULL DEFAULT 0 COMMENT '是否已刪除'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='帳戶表';

-- 創建帳戶交易記錄表
CREATE TABLE IF NOT EXISTS account_transactions (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    account_id BIGINT NOT NULL COMMENT '帳戶ID',
    type ENUM('income', 'expense', 'transfer') NOT NULL COMMENT '交易類型：收入/支出/轉帳',
    amount DECIMAL(15, 2) NOT NULL COMMENT '交易金額',
    balance_before DECIMAL(15, 2) NOT NULL COMMENT '交易前餘額',
    balance_after DECIMAL(15, 2) NOT NULL COMMENT '交易後餘額',
    description TEXT COMMENT '交易描述',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '創建時間',
    created_by BIGINT COMMENT '創建者ID',
    is_deleted TINYINT(1) NOT NULL DEFAULT 0 COMMENT '是否已刪除',
    FOREIGN KEY (account_id) REFERENCES accounts(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='帳戶交易記錄表';
