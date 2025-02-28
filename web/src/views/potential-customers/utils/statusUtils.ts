// 獲取狀態類型
export const getStatusType = (status: string): '' | 'success' | 'warning' | 'info' | 'danger' => {
  const typeMap: Record<string, '' | 'success' | 'warning' | 'info' | 'danger'> = {
    new: 'info',
    in_progress: 'warning',
    interested: 'success',
    not_interested: 'danger',
    call_back: '',
  }
  return typeMap[status] || ''
}

// 獲取狀態文字
export const getStatusText = (status: string): string => {
  const textMap: Record<string, string> = {
    new: '新客戶',
    in_progress: '跟進中',
    interested: '有意願',
    not_interested: '無意願',
    call_back: '稍後聯繫'
  }
  return textMap[status] || status
}

// 獲取時間軸類型
export const getTimelineType = (result: string): '' | 'primary' | 'success' | 'warning' | 'danger' | 'info' => {
  const typeMap: Record<string, '' | 'primary' | 'success' | 'warning' | 'danger' | 'info'> = {
    answered: 'success',
    no_answer: 'warning',
    busy: 'info',
    invalid: 'danger',
  }
  return typeMap[result] || ''
}

// 獲取結果類型
export const getResultType = (result: string): 'no_answer' | 'busy' | 'invalid' | 'interested' | 'not_interested' | 'call_back' | 'normal' | 'in_progress' => {
  const typeMap: Record<string, 'no_answer' | 'busy' | 'invalid' | 'interested' | 'not_interested' | 'call_back' | 'normal' | 'in_progress'> = {
    answered: 'normal',      // 已接聽 -> 一般
    no_answer: 'no_answer',  // 未接聽
    busy: 'busy',           // 忙線中
    invalid: 'invalid'      // 空號
  }
  return typeMap[result] || 'normal'
}

// 獲取意願類型
export const getIntentionType = (intention: string): 'interested' | 'in_progress' | 'not_interested' | 'call_back' => {
  const typeMap: Record<string, 'interested' | 'in_progress' | 'not_interested' | 'call_back'> = {
    interested: 'interested',
    considering: 'in_progress',
    not_interested: 'not_interested',
    call_back: 'call_back'
  }
  return typeMap[intention] || 'in_progress'
}

// 獲取結果文字
export const getResultText = (result: string): string => {
  const textMap: { [key: string]: string } = {
    answered: '已接聽',
    no_answer: '未接聽',
    busy: '忙線中',
    invalid: '空號'
  }
  return textMap[result] || result
}

// 獲取意願文字
export const getIntentionText = (intention: string): string => {
  const textMap: { [key: string]: string } = {
    interested: '有意願',
    considering: '考慮中',
    not_interested: '無意願',
    call_back: '預約回撥'
  }
  return textMap[intention] || intention
} 