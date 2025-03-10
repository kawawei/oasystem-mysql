const { gmail, getAuthUrl, getTokens, setCredentials } = require('../config/gmail');
const GmailAuth = require('../models/GmailAuth');
const { User } = require('../models');

// 獲取Gmail授權URL / Get Gmail authorization URL
exports.getAuthorizationUrl = async (req, res) => {
  try {
    const authUrl = getAuthUrl();
    res.json({
      success: true,
      data: { url: authUrl },
      message: '成功獲取授權URL / Successfully got authorization URL'
    });
  } catch (error) {
    console.error('獲取授權URL失敗 / Failed to get authorization URL:', error);
    res.status(500).json({
      success: false,
      message: '獲取授權URL時發生錯誤 / Error occurred while getting authorization URL'
    });
  }
};

// 處理Gmail OAuth回調 / Handle Gmail OAuth callback
exports.handleCallback = async (req, res) => {
  try {
    const { code } = req.query;
    const userId = req.user.id;

    // 獲取令牌 / Get tokens
    const tokens = await getTokens(code);
    
    // 設置憑證 / Set credentials
    setCredentials(tokens);
    
    // 獲取用戶Gmail信息 / Get user's Gmail info
    const { data: profile } = await gmail.users.getProfile({ userId: 'me' });
    
    // 保存或更新認證信息 / Save or update authentication info
    await GmailAuth.upsert({
      userId,
      email: profile.emailAddress,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiryDate: new Date(tokens.expiry_date)
    });

    res.json({
      success: true,
      message: 'Gmail授權成功 / Gmail authorization successful'
    });
  } catch (error) {
    console.error('Gmail授權失敗 / Gmail authorization failed:', error);
    res.status(500).json({
      success: false,
      message: 'Gmail授權過程中發生錯誤 / Error occurred during Gmail authorization'
    });
  }
};

// 發送郵件 / Send email
exports.sendEmail = async (req, res) => {
  try {
    const { to, subject, content } = req.body;
    const userId = req.user.id;

    // 獲取用戶的Gmail認證信息 / Get user's Gmail authentication info
    const auth = await GmailAuth.findOne({ where: { userId } });
    if (!auth) {
      return res.status(401).json({
        success: false,
        message: '請先授權Gmail帳戶 / Please authorize Gmail account first'
      });
    }

    // 設置認證信息 / Set authentication
    setCredentials({
      access_token: auth.accessToken,
      refresh_token: auth.refreshToken,
      expiry_date: auth.expiryDate
    });

    // 準備郵件內容 / Prepare email content
    const email = [
      'Content-Type: text/html; charset=utf-8',
      'MIME-Version: 1.0',
      `To: ${to}`,
      `Subject: =?utf-8?B?${Buffer.from(subject).toString('base64')}?=`,
      '',
      content
    ].join('\n');

    // 發送郵件 / Send email
    await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: Buffer.from(email).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
      }
    });

    res.json({
      success: true,
      message: '郵件發送成功 / Email sent successfully'
    });
  } catch (error) {
    console.error('發送郵件失敗 / Failed to send email:', error);
    res.status(500).json({
      success: false,
      message: '發送郵件時發生錯誤 / Error occurred while sending email'
    });
  }
};

// 檢查Gmail授權狀態 / Check Gmail authorization status
exports.checkAuthStatus = async (req, res) => {
  try {
    const userId = req.user.id;
    const auth = await GmailAuth.findOne({ where: { userId } });
    
    res.json({
      success: true,
      data: {
        isAuthorized: !!auth,
        email: auth ? auth.email : null
      },
      message: '成功獲取授權狀態 / Successfully got authorization status'
    });
  } catch (error) {
    console.error('檢查授權狀態失敗 / Failed to check authorization status:', error);
    res.status(500).json({
      success: false,
      message: '檢查授權狀態時發生錯誤 / Error occurred while checking authorization status'
    });
  }
}; 