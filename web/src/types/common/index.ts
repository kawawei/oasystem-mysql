// 列表響應類型
// List response type
export interface ListResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
} 