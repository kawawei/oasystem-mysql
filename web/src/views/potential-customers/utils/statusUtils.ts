// 獲取狀態類型
export function getStatusType(result: string, intention?: string): 'success' | 'warning' | 'danger' | 'info' | 'interested' | 'not_interested' | 'in_progress' | 'normal' | 'irrelevant' | 'visited' {
  if (result === 'answered') {
    switch (intention) {
      case 'interested':
        return 'interested'
      case 'considering':
        return 'in_progress'
      case 'not_interested':
        return 'not_interested'
      case 'irrelevant':
        return 'irrelevant'
      case 'visited':
        return 'visited'
      default:
        return 'in_progress'
    }
  }
  return getResultType(result)
}

// 獲取狀態文字
export function getStatusText(result: string, intention?: string): string {
  if (result === 'answered' && intention) {
    switch (intention) {
      case 'interested':
        return '有意願'
      case 'considering':
        return '考慮中'
      case 'not_interested':
        return '無意願'
      case 'irrelevant':
        return '不相關'
      case 'visited':
        return '已約訪'
      default:
        return '考慮中'
    }
  }
  return getResultText(result)
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
export function getResultType(result: string): 'success' | 'warning' | 'danger' | 'info' {
  switch (result) {
    case 'answered':
      return 'success'
    case 'no_answer':
      return 'warning'
    case 'busy':
      return 'warning'
    case 'invalid':
      return 'danger'
    case 'wrong_number':
      return 'danger'
    default:
      return 'info'
  }
}

// 獲取意願類型
export const getIntentionType = (intention: string): 'interested' | 'in_progress' | 'not_interested' | 'normal' | 'irrelevant' | 'visited' => {
  const typeMap: Record<string, 'interested' | 'in_progress' | 'not_interested' | 'normal' | 'irrelevant' | 'visited'> = {
    interested: 'interested',
    considering: 'in_progress',
    not_interested: 'not_interested',
    irrelevant: 'irrelevant',
    visited: 'visited'
  }
  return typeMap[intention] || 'in_progress'
}

// 獲取結果文字
export const getResultText = (result: string): string => {
  const textMap: { [key: string]: string } = {
    answered: '已接聽',
    no_answer: '未接聽',
    busy: '忙碌中',
    invalid: '空號',
    wrong_number: '號碼有誤'
  }
  return textMap[result] || result
}

// 獲取意願文字
export const getIntentionText = (intention: string): string => {
  const textMap: { [key: string]: string } = {
    interested: '有意願',
    not_interested: '無意願',
    considering: '考慮中',
    irrelevant: '不相關',
    visited: '已約訪'
  }
  return textMap[intention] || intention
} 