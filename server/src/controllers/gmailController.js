const { gmail, getAuthUrl, getTokens, setCredentials } = require('../config/gmail');
const GmailAuth = require('../models/GmailAuth');
const { User } = require('../models');

// Token 刷新機制 / Token refresh mechanism
async function refreshTokenIfNeeded(auth) {
  try {
    // 檢查 token 是否即將過期（預留 5 分鐘緩衝）/ Check if token is about to expire (5 minutes buffer)
    const expiryDate = new Date(auth.expiryDate);
    const now = new Date();
    const fiveMinutes = 5 * 60 * 1000;

    if (expiryDate.getTime() - now.getTime() <= fiveMinutes) {
      console.log('Access token is about to expire, refreshing...');
      
      // 使用 refresh token 獲取新的 access token / Get new access token using refresh token
      const { credentials } = await gmail.auth.refreshToken(auth.refreshToken);
      
      // 更新數據庫中的 token 信息 / Update token info in database
      await auth.update({
        accessToken: credentials.access_token,
        expiryDate: new Date(credentials.expiry_date)
      });

      // 更新當前的認證信息 / Update current credentials
      setCredentials({
        access_token: credentials.access_token,
        refresh_token: auth.refreshToken,
        expiry_date: credentials.expiry_date
      });

      return true;
    }
    return false;
  } catch (error) {
    console.error('刷新 token 失敗 / Failed to refresh token:', error);
    throw new Error('TOKEN_REFRESH_FAILED');
  }
}

// 處理 Gmail API 錯誤 / Handle Gmail API errors
async function handleGmailError(error, auth) {
  console.error('Gmail API error:', error);
  
  // 檢查是否為授權相關錯誤 / Check if it's an authorization error
  if (error.code === 401 || error.message?.includes('invalid_grant')) {
    // 清除無效的授權信息 / Clear invalid authorization info
    if (auth) {
      await auth.destroy();
    }
    throw new Error('GMAIL_AUTH_REQUIRED');
  }
  
  // 其他 API 錯誤 / Other API errors
  throw new Error('GMAIL_API_ERROR');
}

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
  let auth;
  try {
    const { to, subject, content, attachments = [] } = req.body;
    const userId = req.user.id;

    // 獲取用戶的Gmail認證信息 / Get user's Gmail authentication info
    auth = await GmailAuth.findOne({ where: { userId } });
    if (!auth) {
      return res.status(401).json({
        success: false,
        message: '請先授權Gmail帳戶 / Please authorize Gmail account first',
        code: 'GMAIL_AUTH_REQUIRED'
      });
    }

    // 設置認證信息 / Set authentication
    setCredentials({
      access_token: auth.accessToken,
      refresh_token: auth.refreshToken,
      expiry_date: auth.expiryDate
    });

    // 檢查並刷新 token / Check and refresh token if needed
    await refreshTokenIfNeeded(auth);

    // 準備郵件內容 / Prepare email content
    let emailParts = [
      'MIME-Version: 1.0',
      `To: ${to}`,
      `Subject: =?utf-8?B?${Buffer.from(subject).toString('base64')}?=`,
      'Content-Type: multipart/mixed; boundary="mixed"',
      '',
      '--mixed',
      'Content-Type: multipart/related; boundary="related"',
      '',
      '--related',
      'Content-Type: text/html; charset=utf-8',
      'Content-Transfer-Encoding: base64',
      '',
      Buffer.from(content).toString('base64'),
      ''
    ];

    // 處理內嵌圖片 / Handle inline images
    const inlineAttachments = attachments.filter(att => att.isInline);
    for (const attachment of inlineAttachments) {
      emailParts = emailParts.concat([
        '--related',
        `Content-Type: ${attachment.contentType}`,
        'Content-Transfer-Encoding: base64',
        'Content-Disposition: inline',
        `Content-ID: <${attachment.contentId}>`,
        '',
        attachment.content,
        ''
      ]);
    }
    emailParts.push('--related--');

    // 處理一般附件 / Handle regular attachments
    const regularAttachments = attachments.filter(att => !att.isInline);
    for (const attachment of regularAttachments) {
      emailParts = emailParts.concat([
        '--mixed',
        `Content-Type: ${attachment.contentType}; name="${attachment.filename}"`,
        'Content-Transfer-Encoding: base64',
        `Content-Disposition: attachment; filename="${attachment.filename}"`,
        '',
        attachment.content,
        ''
      ]);
    }
    emailParts.push('--mixed--');

    // 組合郵件 / Compose email
    const email = emailParts.join('\r\n');

    // 發送郵件 / Send email
    await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: Buffer.from(email).toString('base64url')
      }
    });

    res.json({
      success: true,
      message: '郵件發送成功 / Email sent successfully'
    });
  } catch (error) {
    if (error.message === 'GMAIL_AUTH_REQUIRED') {
      return res.status(401).json({
        success: false,
        message: '請重新授權Gmail帳戶 / Please reauthorize Gmail account',
        code: 'GMAIL_AUTH_REQUIRED'
      });
    }
    
    if (error.message === 'TOKEN_REFRESH_FAILED') {
      return res.status(401).json({
        success: false,
        message: '無法更新授權，請重新授權Gmail帳戶 / Unable to refresh authorization, please reauthorize Gmail account',
        code: 'TOKEN_REFRESH_FAILED'
      });
    }

    console.error('發送郵件失敗 / Failed to send email:', error);
    return res.status(500).json({
      success: false,
      message: '發送郵件時發生錯誤 / Error occurred while sending email',
      code: 'GMAIL_API_ERROR'
    });
  }
};

// 檢查Gmail授權狀態 / Check Gmail authorization status
exports.checkAuthStatus = async (req, res) => {
  let auth;
  try {
    const userId = req.user.id;
    auth = await GmailAuth.findOne({ where: { userId } });
    
    if (auth) {
      // 設置認證信息 / Set authentication
      setCredentials({
        access_token: auth.accessToken,
        refresh_token: auth.refreshToken,
        expiry_date: auth.expiryDate
      });

      // 檢查並刷新 token / Check and refresh token if needed
      await refreshTokenIfNeeded(auth);
      
      // 測試 API 調用以驗證授權 / Test API call to verify authorization
      await gmail.users.getProfile({ userId: 'me' });
    }

    res.json({
      success: true,
      data: {
        isAuthorized: !!auth,
        email: auth ? auth.email : null
      },
      message: '成功獲取授權狀態 / Successfully got authorization status'
    });
  } catch (error) {
    await handleGmailError(error, auth);
    
    res.status(401).json({
      success: false,
      message: '請重新授權Gmail帳戶 / Please reauthorize Gmail account',
      code: 'GMAIL_AUTH_REQUIRED'
    });
  }
};

// 移除Gmail授權 / Remove Gmail authorization
exports.removeAuth = async (req, res) => {
  try {
    const userId = req.user.id;
    const auth = await GmailAuth.findOne({ where: { userId } });
    
    if (!auth) {
      return res.status(404).json({
        success: false,
        message: '未找到Gmail授權信息 / Gmail authorization not found'
      });
    }

    // 刪除授權記錄 / Delete authorization record
    await auth.destroy();

    res.json({
      success: true,
      message: 'Gmail授權已移除 / Gmail authorization removed successfully'
    });
  } catch (error) {
    console.error('移除Gmail授權失敗 / Failed to remove Gmail authorization:', error);
    res.status(500).json({
      success: false,
      message: '移除Gmail授權時發生錯誤 / Error occurred while removing Gmail authorization'
    });
  }
}; 