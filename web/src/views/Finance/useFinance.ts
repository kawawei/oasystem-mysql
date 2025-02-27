// 日期格式化相關 Date formatting related
const formatDate = (dateStr: string) => {
  if (!dateStr) return '-'
  try {
    // 將日期字符串轉換為 Date 對象 Convert date string to Date object
    const date = new Date(dateStr)
    if (isNaN(date.getTime())) return '-'

    // 轉換為台北時區 Convert to Taipei timezone
    const taipeiDate = new Date(date.toLocaleString('en-US', { timeZone: 'Asia/Taipei' }))
    
    // 格式化為 YYYY-MM-DD Format to YYYY-MM-DD
    const year = taipeiDate.getFullYear()
    const month = String(taipeiDate.getMonth() + 1).padStart(2, '0')
    const day = String(taipeiDate.getDate()).padStart(2, '0')
    
    return `${year}-${month}-${day}`
  } catch (error) {
    console.error('Error formatting date:', error)
    return '-'
  }
}

// 時間格式化相關 Time formatting related
const formatTime = (timeStr: string) => {
  if (!timeStr) return '-'
  try {
    // 將時間字符串轉換為 Date 對象 Convert time string to Date object
    const date = new Date(timeStr)
    if (isNaN(date.getTime())) return '-'

    // 轉換為台北時區 Convert to Taipei timezone
    const taipeiDate = new Date(date.toLocaleString('en-US', { timeZone: 'Asia/Taipei' }))
    
    // 格式化為 HH:mm:ss Format to HH:mm:ss
    const hours = String(taipeiDate.getHours()).padStart(2, '0')
    const minutes = String(taipeiDate.getMinutes()).padStart(2, '0')
    const seconds = String(taipeiDate.getSeconds()).padStart(2, '0')
    
    return `${hours}:${minutes}:${seconds}`
  } catch (error) {
    console.error('Error formatting time:', error)
    return '-'
  }
} 