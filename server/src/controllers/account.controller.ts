import { Request, Response } from 'express'
import { AccountModel, CreateAccountParams } from '../models/account.model'
import { validateRequired, validateNumber } from '../utils/validator'

export class AccountController {
  // 創建帳戶
  static async create(req: Request, res: Response) {
    try {
      const { name, currency, initial_balance } = req.body

      // 驗證必填欄位
      const requiredFields = {
        name: '帳戶名稱',
        currency: '幣種',
        initial_balance: '初始金額'
      }
      const missingField = validateRequired(req.body, requiredFields)
      if (missingField) {
        return res.status(400).json({
          success: false,
          message: `請輸入${missingField}`
        })
      }

      // 驗證金額
      if (!validateNumber(initial_balance)) {
        return res.status(400).json({
          success: false,
          message: '初始金額必須是有效的數字'
        })
      }

      const params: CreateAccountParams = {
        name,
        currency,
        initial_balance: Number(initial_balance),
        created_by: req.user?.id
      }

      const account = await AccountModel.create(params)

      res.json({
        success: true,
        data: account
      })
    } catch (error) {
      console.error('Error creating account:', error)
      res.status(500).json({
        success: false,
        message: '創建帳戶失敗'
      })
    }
  }

  // 獲取帳戶列表
  static async getAll(req: Request, res: Response) {
    try {
      const accounts = await AccountModel.findAll()
      res.json({
        success: true,
        data: accounts
      })
    } catch (error) {
      console.error('Error getting accounts:', error)
      res.status(500).json({
        success: false,
        message: '獲取帳戶列表失敗'
      })
    }
  }

  // 根據ID獲取帳戶
  static async getById(req: Request, res: Response) {
    try {
      const { id } = req.params
      const account = await AccountModel.findById(Number(id))

      if (!account) {
        return res.status(404).json({
          success: false,
          message: '帳戶不存在'
        })
      }

      res.json({
        success: true,
        data: account
      })
    } catch (error) {
      console.error('Error getting account:', error)
      res.status(500).json({
        success: false,
        message: '獲取帳戶失敗'
      })
    }
  }

  // 更新帳戶餘額
  static async updateBalance(req: Request, res: Response) {
    try {
      const { id } = req.params
      const { new_balance } = req.body

      if (!validateNumber(new_balance)) {
        return res.status(400).json({
          success: false,
          message: '餘額必須是有效的數字'
        })
      }

      const success = await AccountModel.updateBalance(
        Number(id),
        Number(new_balance),
        req.user?.id
      )

      if (!success) {
        return res.status(404).json({
          success: false,
          message: '帳戶不存在或更新失敗'
        })
      }

      res.json({
        success: true,
        message: '更新餘額成功'
      })
    } catch (error) {
      console.error('Error updating account balance:', error)
      res.status(500).json({
        success: false,
        message: '更新餘額失敗'
      })
    }
  }

  // 刪除帳戶
  static async delete(req: Request, res: Response) {
    try {
      const { id } = req.params
      const success = await AccountModel.delete(Number(id), req.user?.id)

      if (!success) {
        return res.status(404).json({
          success: false,
          message: '帳戶不存在或刪除失敗'
        })
      }

      res.json({
        success: true,
        message: '刪除帳戶成功'
      })
    } catch (error) {
      console.error('Error deleting account:', error)
      res.status(500).json({
        success: false,
        message: '刪除帳戶失敗'
      })
    }
  }
}
