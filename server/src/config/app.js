// 獲取應用的基礎 URL
const getBaseUrl = () => {
  const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http'
  const host = process.env.HOST || 'localhost'
  const port = process.env.PORT || 3001
  
  // 如果是生產環境或者使用標準端口，不顯示端口號
  const showPort = process.env.NODE_ENV !== 'production' && port !== 80 && port !== 443
  return `${protocol}://${host}${showPort ? `:${port}` : ''}`
}

module.exports = {
  getBaseUrl
} 