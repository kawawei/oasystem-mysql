# OA System 開發日誌

## 項目結構 Project Structure
```
Project Root（項目根目錄）
├── web/                  # 前端項目 (Vue 3)
├── server/               # 後端項目 (Node.js + Express)
├── docker/               # Docker 配置文件
│   ├── dev/             # 開發環境配置
│   │   ├── docker-compose.dev.yml
│   │   ├── frontend.dockerfile
│   │   ├── backend.dockerfile
│   │   └── mysql.dockerfile
│   └── prod/            # 生產環境配置
│       ├── docker-compose.prod.yml
│       ├── frontend.dockerfile
│       ├── backend.dockerfile
│       └── mysql.dockerfile
├── .env.development     # 開發環境變量
├── .env.production      # 生產環境變量
└── docs/                # 項目文檔
```

## 開發日誌 Development Log

### 2024-03-21
#### 完成項目初始化設置：
- 建立項目基礎結構
- 制定開發規範
- 創建開發日誌
- 規劃開發和生產環境
- 配置服務器環境變量

### 環境配置 Environment Setup
#### 開發環境 Development Environment
- 前端 Frontend: http://localhost:3000
- 後端 Backend: http://localhost:3001
- 數據庫 Database: mysql_dev (localhost:3306)

#### 生產環境 Production Environment
- 服務器 IP Server IP: 13.250.109.239
- 前端 Frontend: ${VITE_APP_DOMAIN} (配置於環境變量)
- 後端 Backend: ${VITE_APP_API_URL} (配置於環境變量)
- 數據庫 Database: mysql_prod

#### 環境變量配置 Environment Variables
```
# 開發環境 (.env.development)
VITE_APP_ENV=development
VITE_APP_DOMAIN=http://localhost:3000
VITE_APP_API_URL=http://localhost:3001/api
VITE_APP_WS_URL=ws://localhost:3001

# 生產環境 (.env.production)
VITE_APP_ENV=production
VITE_APP_DOMAIN=${DOMAIN_NAME}
VITE_APP_API_URL=https://${DOMAIN_NAME}/api
VITE_APP_WS_URL=wss://${DOMAIN_NAME}

# 後端配置 (server/.env)
NODE_ENV=production
SERVER_PORT=8080
DB_HOST=localhost
DB_PORT=3306
DB_NAME=mysql_prod
DB_USER=root
DB_PASSWORD=your_password
JWT_SECRET=your_jwt_secret
```

### 技術棧 Technology Stack
#### 前端技術 Frontend
- 框架 Framework: Vue 3
- 路由 Router: Vue Router
- 狀態管理 State Management: Pinia
- UI 組件庫 UI Library: Element Plus
- HTTP 客戶端 HTTP Client: Axios

#### 後端技術 Backend
- 運行環境 Runtime: Node.js
- 框架 Framework: Express
- 數據庫 Database: MySQL 8
- ORM: Sequelize
- 認證 Authentication: JWT

#### 開發工具 Development Tools
- 容器化 Container: Docker
- 版本控制 Version Control: Git
- 包管理器 Package Manager: npm/yarn
- API 文檔 API Documentation: Swagger/OpenAPI

### Docker 環境配置 Docker Environment Setup
#### 開發環境 Docker 配置 Development Docker Configuration
```yaml
# docker/dev/docker-compose.dev.yml
version: '3.8'
services:
  frontend-dev:
    build:
      context: ../../web
      dockerfile: ../docker/dev/frontend.dockerfile
    container_name: oa-frontend-dev
    volumes:
      - ../../web:/app
      - /app/node_modules
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=development
    command: npm run dev

  backend-dev:
    build:
      context: ../../server
      dockerfile: ../docker/dev/backend.dockerfile
    container_name: oa-backend-dev
    volumes:
      - ../../server:/app
      - /app/node_modules
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=development
    depends_on:
      - mysql-dev
    command: npm run dev

  mysql-dev:
    image: mysql:8
    container_name: oa-mysql-dev
    ports:
      - "3306:3306"
    environment:
      - MYSQL_DATABASE=mysql_dev
      - MYSQL_ROOT_PASSWORD=${DB_PASSWORD}
    volumes:
      - mysql_dev_data:/var/lib/mysql

volumes:
  mysql_dev_data:
```

#### 生產環境 Docker 配置 Production Docker Configuration
```yaml
# docker/prod/docker-compose.prod.yml
version: '3.8'
services:
  frontend-prod:
    build:
      context: ../../web
      dockerfile: ../docker/prod/frontend.dockerfile
    container_name: oa-frontend-prod
    ports:
      - "80:80"
    environment:
      - NODE_ENV=production
    restart: always

  backend-prod:
    build:
      context: ../../server
      dockerfile: ../docker/prod/backend.dockerfile
    container_name: oa-backend-prod
    ports:
      - "8080:8080"
    environment:
      - NODE_ENV=production
    depends_on:
      - mysql-prod
    restart: always

  mysql-prod:
    image: mysql:8
    container_name: oa-mysql-prod
    ports:
      - "3306:3306"
    environment:
      - MYSQL_DATABASE=mysql_prod
      - MYSQL_ROOT_PASSWORD=${DB_PASSWORD}
    volumes:
      - mysql_prod_data:/var/lib/mysql
    restart: always

volumes:
  mysql_prod_data:
```

#### Docker 開發環境特點 Development Environment Features
- 掛載本地代碼到容器，支持熱重載
- 開發工具和依賴都在容器內
- 使用 nodemon 監視文件變化
- 暴露所有必要端口用於調試
- 共享 node_modules 目錄優化性能

#### Docker 生產環境特點 Production Environment Features
- 多階段構建優化鏡像大小
- 最小化暴露端口
- 自動重啟機制
- 數據持久化
- 性能優化配置

### 功能規劃 Feature Planning
#### 用戶模塊 User Module
- 登錄功能 Login
- 權限管理 Permission Management
  - 管理員權限 Admin Permissions
  - 用戶權限 User Permissions

#### 考勤模塊 Attendance Module
- 打卡功能 Check-in/out
- 考勤記錄 Attendance Records
- 考勤統計 Attendance Statistics

### 下一步計劃 Next Steps
1. 配置 Docker 開發環境
   - 設置前端容器
   - 設置後端容器
   - 設置數據庫容器
   - 配置環境變量

2. 初始化前端項目
   - 創建 Vue 項目
   - 配置項目依賴
   - 設置環境變量
   - 配置 API 請求基礎 URL

3. 初始化後端項目
   - 創建 Node.js 項目
   - 設置 Express 框架
   - 配置環境變量
   - 配置數據庫連接

4. 創建數據庫架構
   - 用戶表設計
   - 考勤記錄表設計
   - 權限表設計

5. 實現用戶認證
   - 登錄接口
   - JWT 認證
   - 權限中間件

### 注意事項 Notes
- 開發環境和生產環境完全隔離
- 使用 Docker 確保環境一致性
- 數據庫配置分離（開發/生產）
- 所有敏感信息使用環境變量
- 定期更新開發日誌
- 遵循代碼規範和提交規範
- 禁止在代碼中硬編碼 IP 地址和域名
- 所有配置信息統一通過環境變量注入
- 生產環境的敏感信息需要額外加密處理
- Docker 相關注意事項：
  - 開發環境和生產環境使用不同的 Dockerfile
  - 生產環境鏡像需要進行安全掃描
  - 定期更新基礎鏡像
  - 注意數據卷的備份和管理
  - 監控容器的資源使用情況

### 環境變量管理規範 Environment Variables Standards
#### 本地開發環境變量 Local Environment Variables
- 所有本地環境變量文件（.env.development）都要添加到 .gitignore
- 提供 .env.example 作為環境變量模板
- 前端環境變量以 VITE_APP_ 為前綴
- 後端環境變量使用下劃線命名法

#### 生產環境變量 Production Environment Variables
- 基礎配置可提交到 Git：
  ```
  # .env.production（可提交的配置）
  VITE_APP_ENV=production
  VITE_APP_API_URL=/api
  SERVER_PORT=8080
  ```

- 敏感信息配置（不提交到 Git）：
  ```
  # 在服務器上直接配置
  DB_PASSWORD=xxx
  JWT_SECRET=xxx
  API_KEYS=xxx
  ```

#### 環境變量分類 Environment Variables Classification
1. 可提交到 Git 的配置：
   - 環境標識（development/production）
   - API 路徑
   - 端口配置
   - 日誌級別
   - 靜態資源路徑

2. 不可提交到 Git 的配置：
   - 數據庫密碼
   - JWT 密鑰
   - API 密鑰
   - 加密密鑰
   - 第三方服務密鑰

#### 服務器環境變量管理 Server Environment Variables Management
1. 配置方式：
   - 使用服務器的環境變量
   - 使用 Docker 的環境變量文件
   - 使用配置管理服務

2. 安全措施：
   - 定期輪換敏感信息
   - 限制環境變量文件的訪問權限
   - 備份環境變量配置
   - 記錄環境變量的修改歷史

3. 部署流程：
   - CI/CD 過程中動態注入環境變量
   - 使用環境變量模板自動生成配置
   - 驗證環境變量完整性

4. 維護建議：
   - 建立環境變量清單文檔
   - 記錄每個變量的用途
   - 標註是否為敏感信息
   - 記錄最後修改時間和負責人

### 代碼規範 Code Standards
#### 前端規範 Frontend
- 使用 ESLint 進行代碼檢查
- 使用 Prettier 進行代碼格式化
- 組件命名採用 PascalCase
- CSS 類名採用 kebab-case

#### 後端規範 Backend
- 使用 ESLint 進行代碼檢查
- API 路由採用 RESTful 規範
- 使用 async/await 處理異步
- 統一錯誤處理格式

### 版本控制規範 Git Standards
- 主分支: main/master
- 開發分支: develop
- 功能分支: feature/*
- 修復分支: hotfix/*
- 提交信息格式: type(scope): message 

### 環境隔離重點注意事項 Environment Isolation Considerations
#### 網絡配置 Network Configuration
- 使用 Docker Network 隔離容器通信
- 生產環境只暴露必要端口
- 配置反向代理處理 SSL 終止
- 設置跨域 CORS 策略
- 配置負載均衡（如需要）

#### 數據庫安全 Database Security
- 開發環境和生產環境使用不同的數據庫實例
- 生產環境數據庫禁止遠程root登錄
- 定期備份生產數據庫
- 設置數據庫訪問白名單
- 加密敏感數據列

#### 部署流程 Deployment Process
- 使用 CI/CD 自動化部署
- 部署前進行自動化測試
- 配置健康檢查
- 實現零停機部署
- 保留部署回滾機制

#### 監控告警 Monitoring & Alerting
- 配置容器資源監控
- 設置日誌收集系統
- 配置性能監控
- 設置異常告警機制
- 監控服務可用性

#### 安全措施 Security Measures
- 配置防火牆規則
- 使用 HTTPS
- 實施 Rate Limiting
- 配置 WAF（Web Application Firewall）
- 定期安全掃描

#### 緩存策略 Cache Strategy
- 配置 Redis（如需要）
- 設置前端緩存策略
- 配置 CDN（如需要）
- 實施緩存清理機制

#### 備份策略 Backup Strategy
- 自動備份機制
- 定期數據備份測試
- 跨區域備份存儲
- 備份恢復演練
- 制定災難恢復計劃

### 開發運維規範 DevOps Standards
#### 本地開發規範 Local Development
- 使用 .gitignore 排除本地配置
- 本地環境統一使用 Docker
- 禁止直接連接生產數據庫
- 使用模擬數據進行開發

#### 測試規範 Testing Standards
- 單元測試覆蓋
- 集成測試
- 端到端測試
- 性能測試
- 安全測試

#### 部署規範 Deployment Standards
- 使用藍綠部署或金絲雀部署
- 部署前檢查清單
- 部署後驗證步驟
- 緊急回滾流程
- 變更管理流程

#### 文檔規範 Documentation Standards
- API 文檔及時更新
- 架構文檔維護
- 運維文檔更新
- 問題處理文檔
- 變更記錄維護

### 應急預案 Emergency Response
#### 服務中斷處理 Service Interruption
- 快速回滾機制
- 備用服務器準備
- 數據恢復流程
- 應急聯繫機制
- 事故報告模板

#### 安全事件處理 Security Incident
- 安全事件響應流程
- 數據泄露處理流程
- 應急隔離措施
- 取證調查流程
- 修復驗證流程 

### SSL/HTTPS 配置說明 SSL/HTTPS Configuration
#### 域名和 IP 訪問安全配置
- 域名訪問：已配置 HTTPS (${DOMAIN_NAME})
- IP 訪問：建議配置 HTTPS (13.250.109.239)
  - 防止測試/緊急情況下的不安全訪問
  - 避免 HTTP 明文傳輸風險
  - 保護開發和運維人員的訪問安全

#### SSL 證書配置
1. 域名證書
   - 使用正式 SSL 證書
   - 自動更新機制
   - 多域名/泛域名支持

2. IP 訪問證書
   - 可使用自簽名證書
   - 僅用於內部開發和運維
   - 配置受信任的 CA

#### 訪問策略
- 生產環境：
  - 域名訪問：強制 HTTPS
  - IP 訪問：建議限制或強制 HTTPS
  - 配置 HSTS
  
- 開發環境：
  - 本地開發使用 HTTP
  - 遠程開發環境建議使用 HTTPS

#### Nginx 配置示例
```nginx
# 域名訪問配置
server {
    listen 443 ssl;
    server_name your-domain.com;
    
    ssl_certificate /path/to/domain.crt;
    ssl_certificate_key /path/to/domain.key;
    
    # SSL 配置
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    
    # HSTS 配置
    add_header Strict-Transport-Security "max-age=31536000" always;
}

# IP 訪問配置
server {
    listen 443 ssl;
    server_name 13.250.109.239;
    
    ssl_certificate /path/to/ip.crt;
    ssl_certificate_key /path/to/ip.key;
    
    # SSL 配置
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
}

# HTTP 重定向到 HTTPS
server {
    listen 80;
    server_name your-domain.com 13.250.109.239;
    return 301 https://$server_name$request_uri;
}
```

#### 安全注意事項
1. 證書管理
   - 及時更新證書
   - 安全存儲密鑰
   - 監控證書有效期

2. 訪問控制
   - 考慮限制 IP 直接訪問
   - 配置訪問白名單
   - 記錄異常訪問

3. 安全加固
   - 啟用 HSTS
   - 配置 CSP
   - 禁用不安全的 SSL/TLS 版本
   - 定期安全評估

4. 應急措施
   - 準備備用證書
   - 證書快速替換機制
   - 應急回滾方案 