import { ref } from 'vue'
import { message } from '@/plugins/message'
import { reimbursementApi, type ReimbursementFormData } from '@/services/api'

export function useReimbursementForm() {
  // 表單數據
  const formData = ref<ReimbursementFormData>({
    type: 'reimbursement',
    serialNumber: '',
    title: '',
    payee: '',
    paymentTarget: '',
    accountNumber: '',
    bankInfo: '',
    currency: 'TWD',
    items: [],
    attachments: []
  })

  // 生成序號
  const generateSerialNumber = async () => {
    try {
      const { data } = await reimbursementApi.getTodaySerialNumber(formData.value.type)
      formData.value.serialNumber = data.serialNumber
    } catch (error) {
      console.error('獲取序號失敗:', error)
      message.error('獲取序號失敗，請稍後再試')
    }
  }

  // 驗證表單
  const validateForm = () => {
    if (!formData.value.title?.trim()) {
      message.error('請輸入標題')
      return false
    }
    if (!formData.value.payee?.trim()) {
      message.error('請輸入收款人')
      return false
    }
    if (!formData.value.paymentTarget?.trim()) {
      message.error('請輸入付款對象')
      return false
    }
    if (!formData.value.accountNumber?.trim()) {
      message.error('請輸入付款帳號')
      return false
    }
    
    // 驗證明細項
    for (const [index, item] of formData.value.items.entries()) {
      if (!item.description?.trim()) {
        message.error(`第 ${index + 1} 項的摘要不能為空`)
        return false
      }
      if (!item.date) {
        message.error(`第 ${index + 1} 項的日期不能為空`)
        return false
      }
      if (Number(item.amount) <= 0) {
        message.error(`第 ${index + 1} 項的金額必須大於 0`)
        return false
      }
    }
    
    return true
  }

  // 提交表單
  const submitForm = async () => {
    try {
      // 先進行表單驗證
      if (!validateForm()) {
        return false
      }

      // 準備要提交的數據
      const formDataToSubmit = new FormData()
      
      // 添加基本信息
      formDataToSubmit.append('type', formData.value.type)
      formDataToSubmit.append('title', formData.value.title)
      formData.value.payee = formData.value.payee.trim()
      formData.value.paymentTarget = formData.value.paymentTarget.trim()
      formDataToSubmit.append('payee', formData.value.payee)
      formDataToSubmit.append('paymentTarget', formData.value.paymentTarget)
      formDataToSubmit.append('accountNumber', formData.value.accountNumber)
      formDataToSubmit.append('bankInfo', formData.value.bankInfo)
      formDataToSubmit.append('currency', formData.value.currency)
      if (formData.value.type === 'payable' && formData.value.paymentDate) {
        formDataToSubmit.append('paymentDate', formData.value.paymentDate)
      }

      // 添加明細項
      const itemsWithoutFiles = formData.value.items.map(item => {
        const { _file, ...itemData } = item as any
        return {
          ...itemData,
          hasNewFile: !!_file
        }
      })
      formDataToSubmit.append('items', JSON.stringify(itemsWithoutFiles))

      // 添加發票圖片
      formData.value.items.forEach((item, i) => {
        const file = (item as any)._file
        if (file) {
          formDataToSubmit.append(`files[${i}]`, file)
        }
      })

      // 添加 PDF 附件
      formData.value.attachments.forEach((attachment, index) => {
        if (attachment.file) {
          formDataToSubmit.append(`attachments[${index}]`, attachment.file)
        }
        if (attachment.url) {
          formDataToSubmit.append(`attachmentUrls[${index}]`, attachment.url)
        }
      })

      // 添加附件信息的 JSON 字符串
      const attachmentsInfo = formData.value.attachments.map(attachment => ({
        filename: attachment.filename,
        url: attachment.url,
        originalName: attachment.originalName
      }))
      formDataToSubmit.append('attachments', JSON.stringify(attachmentsInfo))

      // 提交請款單
      await reimbursementApi.createReimbursement(formDataToSubmit)
      message.success('請款單創建成功')
      return true
    } catch (error: any) {
      console.error('提交失敗：', error)
      message.error(error.message || '提交失敗，請檢查輸入資料')
      return false
    }
  }

  // 重置表單
  const resetForm = () => {
    formData.value = {
      type: 'reimbursement',
      serialNumber: '',
      title: '',
      payee: '',
      paymentTarget: '',
      accountNumber: '',
      bankInfo: '',
      currency: 'TWD',
      items: [],
      attachments: []
    }
  }

  return {
    formData,
    generateSerialNumber,
    validateForm,
    submitForm,
    resetForm
  }
} 