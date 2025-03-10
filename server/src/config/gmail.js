const { google } = require('googleapis');

// Gmail OAuth2 配置 / Gmail OAuth2 Configuration
const oauth2Client = new google.auth.OAuth2(
  // 客戶端ID / Client ID
  '668679636608-ogsf1mo2vha8ba9icd6lmr63fi77envu.apps.googleusercontent.com',
  // 客戶端密鑰 / Client Secret
  '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',
  // 重定向URL / Redirect URL
  'http://localhost:3000/gmail-callback'
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