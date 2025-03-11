const { google } = require('googleapis');

// Gmail OAuth2 配置 / Gmail OAuth2 Configuration
const oauth2Client = new google.auth.OAuth2(
  // 從環境變量獲取配置 / Get configuration from environment variables
  process.env.GMAIL_CLIENT_ID,
  process.env.GMAIL_CLIENT_SECRET,
  process.env.GMAIL_REDIRECT_URL
);

// 設置訪問範圍 / Set access scopes
const SCOPES = [
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.compose',
  'https://www.googleapis.com/auth/gmail.modify'
];

// 獲取授權URL / Get authorization URL
const getAuthUrl = () => {
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent'  // 強制顯示同意頁面，確保獲得refresh token / Force consent screen to ensure getting refresh token
  });
};

// 使用授權碼獲取令牌 / Get tokens using authorization code
const getTokens = async (code) => {
  const { tokens } = await oauth2Client.getToken(code);
  return tokens;
};

// 設置憑證 / Set credentials
const setCredentials = (tokens) => {
  oauth2Client.setCredentials(tokens);
};

// 創建Gmail服務 / Create Gmail service
const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

module.exports = {
  oauth2Client,
  gmail,
  getAuthUrl,
  getTokens,
  setCredentials
}; 