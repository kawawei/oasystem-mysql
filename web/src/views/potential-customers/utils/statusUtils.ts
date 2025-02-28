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
export const getResultType = (result: string): 'approved' | 'pending' | 'revision' | 'normal' => {
  const typeMap: Record<string, 'approved' | 'pending' | 'revision' | 'normal'> = {
    answered: 'approved',
    no_answer: 'pending',
    busy: 'revision',
    invalid: 'revision',
  }
  return typeMap[result] || 'normal'
}

// 獲取意願類型
export const getIntentionType = (intention: string): 'approved' | 'pending' | 'revision' | 'normal' => {
  const typeMap: Record<string, 'approved' | 'pending' | 'revision' | 'normal'> = {
    interested: 'approved',
    considering: 'pending',
    not_interested: 'revision',
    call_back: 'normal',
  }
  return typeMap[intention] || 'normal'
}

// 獲取結果文字
export const getResultText = (result: string): string => {
  const textMap: Record<string, string> = {
    answered: '已接通',
    no_answer: '無人接聽',
    busy: '忙線中',
    invalid: '號碼無效',
  }
  return textMap[result] || result
}

// 獲取意願文字
export const getIntentionText = (intention: string): string => {
  const textMap: Record<string, string> = {
    interested: '有意願',
    considering: '考慮中',
    not_interested: '無意願',
    call_back: '稍後再聯繫',
  }
  return textMap[intention] || intention
} 