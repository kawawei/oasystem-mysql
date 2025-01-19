# 考勤系統部署指南

## 1. 部署前準備

### 1.1 代碼清理
- 移除所有調試代碼
  ```typescript
  // 移除類似這樣的代碼
  console.log('調試信息')
  debugger
  ```
- 檢查未使用的導入和變量
  ```typescript
  // 移除未使用的導入
  import { unused } from './unused'
  ```
- 確保代碼格式統一（建議使用 ESLint 和 Prettier）

### 1.2 環境配置檢查

#### 環境文件分離
1. 前端環境文件
```
web/
├── .env.development         # 開發環境配置
├── .env.production         # 生產環境配置
└── .env.staging           # 測試環境配置（如果需要）
```

2. 後端環境文件
```
server/
├── .env.development       # 開發環境配置
├── .env.production       # 生產環境配置
└── .env.staging         # 測試環境配置（如果需要）
```

#### 前端配置
1. API 地址配置（web/src/services/api.ts）
```typescript
const api = axios.create({
  baseURL: process.env.VUE_APP_API_URL
})
```

2. 開發環境配置（.env.development）
```env
NODE_ENV=development
VUE_APP_API_URL=http://localhost:3001/api
```

3. 生產環境配置（.env.production）
```env
NODE_ENV=production
VUE_APP_API_URL=https://your-domain.com/api
```

#### 後端配置
1. 數據庫配置（server/src/config/database.js）
```javascript
// 注意：開發和生產環境使用不同的數據庫名稱，避免衝突
module.exports = {
  development: {
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: 'oa_system_dev',  // 開發環境數據庫
    host: process.env.DB_HOST,
    dialect: 'mysql',
    port: process.env.DB_PORT || 3306
  },
  production: {
    username: process.env.PROD_DB_USERNAME,
    password: process.env.PROD_DB_PASSWORD,
    database: 'oa_system_prod',  // 生產環境數據庫
    host: process.env.PROD_DB_HOST,
    dialect: 'mysql',
    port: process.env.PROD_DB_PORT || 3306
  }
}
```

2. 開發環境配置（.env.development）
```env
# 開發環境數據庫配置
DB_USERNAME=dev_username
DB_PASSWORD=dev_password
DB_HOST=localhost
DB_PORT=3306
JWT_SECRET=dev_jwt_secret

# Docker 容器名稱（開發環境）
MYSQL_CONTAINER=oa-mysql-dev
BACKEND_CONTAINER=oa-backend-dev
FRONTEND_CONTAINER=oa-frontend-dev
```

3. 生產環境配置（.env.production）
```env
# 生產環境數據庫配置
PROD_DB_USERNAME=prod_username
PROD_DB_PASSWORD=prod_password
PROD_DB_HOST=your_prod_host
PROD_DB_PORT=3306
JWT_SECRET=prod_jwt_secret

# Docker 容器名稱（生產環境）
MYSQL_CONTAINER=oa-mysql-prod
BACKEND_CONTAINER=oa-backend-prod
FRONTEND_CONTAINER=oa-frontend-prod
```

#### Docker 配置文件分離
1. 開發環境 Docker 配置（docker/dev/docker-compose.dev.yml）
```yaml
version: '3.8'
services:
  mysql:
    container_name: ${MYSQL_CONTAINER}
    image: mysql:8.0
    environment:
      MYSQL_DATABASE: oa_system_dev
      MYSQL_ROOT_PASSWORD: ${DB_PASSWORD}
    ports:
      - "3306:3306"

  backend:
    container_name: ${BACKEND_CONTAINER}
    build: 
      context: ../../server
      dockerfile: Dockerfile.dev
    env_file:
      - ../../server/.env.development

  frontend:
    container_name: ${FRONTEND_CONTAINER}
    build:
      context: ../../web
      dockerfile: Dockerfile.dev
    env_file:
      - ../../web/.env.development
```

2. 生產環境 Docker 配置（docker/prod/docker-compose.prod.yml）
```yaml
version: '3.8'
services:
  mysql:
    container_name: ${MYSQL_CONTAINER}
    image: mysql:8.0
    environment:
      MYSQL_DATABASE: oa_system_prod
      MYSQL_ROOT_PASSWORD: ${PROD_DB_PASSWORD}
    ports:
      - "3306:3306"

  backend:
    container_name: ${BACKEND_CONTAINER}
    build:
      context: ../../server
      dockerfile: Dockerfile.prod
    env_file:
      - ../../server/.env.production

  frontend:
    container_name: ${FRONTEND_CONTAINER}
    build:
      context: ../../web
      dockerfile: Dockerfile.prod
    env_file:
      - ../../web/.env.production
```

### 1.3 功能測試清單

#### 用戶管理
- [ ] 管理員登錄
- [ ] 普通用戶登錄
- [ ] 登出功能
- [ ] 用戶資料修改
- [ ] 權限控制測試

#### 考勤功能
- [ ] 簽到功能
- [ ] 簽退功能
- [ ] 考勤記錄查詢
- [ ] 管理員查看所有記錄
- [ ] 記錄篩選功能

## 2. 部署流程

### 2.1 代碼提交
```bash
# 確保在正確的分支
git checkout main

# 拉取最新代碼
git pull origin main

# 提交更改
git add .
git commit -m "feat: 完成考勤系統基礎功能
- 實現用戶打卡功能
- 添加考勤記錄查詢
- 完善管理員功能"

# 推送到遠程倉庫
git push origin main
```

### 2.2 服務器部署

#### 首次部署
```bash
# 1. 克隆代碼
git clone your-repository-url
cd your-project

# 2. 複製並設置環境變量文件
cp web/.env.example web/.env.production
cp server/.env.example server/.env.production
# 請修改 .env.production 文件中的配置

# 3. 安裝依賴
cd web
npm install
cd ../server
npm install

# 4. 構建前端
cd ../web
npm run build

# 5. 啟動服務（使用生產環境配置）
cd ../docker/prod
docker-compose -f docker-compose.prod.yml --env-file ../../server/.env.production up -d
```

#### 更新部署
```bash
# 1. 拉取最新代碼
git pull origin main

# 2. 更新依賴（如果有新的依賴）
cd web
npm install
cd ../server
npm install

# 3. 重新構建前端
cd ../web
npm run build

# 4. 重啟服務（使用生產環境配置）
cd ../docker/prod
docker-compose -f docker-compose.prod.yml --env-file ../../server/.env.production down
docker-compose -f docker-compose.prod.yml --env-file ../../server/.env.production up -d
```

### 2.3 部署後檢查

#### 基礎檢查
- [ ] 服務器啟動狀態
  ```bash
  docker ps
  docker logs oa-frontend-prod
  docker logs oa-backend-prod
  ```
- [ ] 數據庫連接
  ```bash
  docker logs oa-mysql-prod
  ```
- [ ] API 接口可訪問性
  ```bash
  curl https://your-domain.com/api/health
  ```

#### 功能檢查
- [ ] 用戶登錄/登出
- [ ] 打卡功能
- [ ] 記錄查詢
- [ ] 管理員功能

## 3. 錯誤處理

### 3.1 常見問題

#### 前端部署問題
1. 白屏問題
   - 檢查 nginx 配置
   - 檢查構建路徑
   - 檢查 API 地址配置

2. API 請求失敗
   - 檢查跨域配置
   - 檢查 API 地址
   - 檢查網絡連接

#### 後端部署問題
1. 數據庫連接失敗
   - 檢查數據庫配置
   - 檢查網絡連接
   - 檢查數據庫容器狀態

2. 服務啟動失敗
   - 檢查端口佔用
   - 檢查環境變量
   - 檢查日誌輸出

### 3.2 應急處理
1. 回滾版本
```bash
# 獲取上一個版本的 commit id
git log

# 回滾到指定版本
git reset --hard <commit-id>

# 重新部署
cd docker/prod
docker-compose down
docker-compose up -d
```

2. 數據庫備份恢復
```bash
# 備份
docker exec oa-mysql-prod mysqldump -u root -p database_name > backup.sql

# 恢復
docker exec -i oa-mysql-prod mysql -u root -p database_name < backup.sql
```

## 4. 監控和維護

### 4.1 日誌監控
```bash
# 查看實時日誌
docker logs -f oa-backend-prod
docker logs -f oa-frontend-prod

# 查看錯誤日誌
docker logs oa-backend-prod 2>&1 | grep -i error
```

### 4.2 性能監控
- 使用 Docker Stats 監控容器資源使用
```bash
docker stats
```

### 4.3 定期維護
- 每日數據庫備份
- 定期檢查日誌
- 定期清理日誌文件
- 監控磁盤使用情況

## 5. 安全注意事項

### 5.1 配置安全
- 確保所有密碼和敏感信息使用環境變量
- 不要在代碼中硬編碼敏感信息
- 定期更新密碼和密鑰

### 5.2 數據安全
- 定期備份數據庫
- 限制數據庫訪問權限
- 加密敏感數據

### 5.3 服務器安全
- 只開放必要的端口
- 配置防火牆規則
- 定期更新系統和依賴包 
- 定期更新系統和依賴包 