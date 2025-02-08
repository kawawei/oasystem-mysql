import { pool } from '../utils/db'
import { ResultSetHeader, RowDataPacket } from 'mysql2'

export interface Account extends RowDataPacket {
  id: number
  name: string
  currency: string
  initial_balance: number
  current_balance: number
  created_at: Date
  updated_at: Date
  created_by?: number
  updated_by?: number
  is_deleted: number
}

export interface CreateAccountParams {
  name: string
  currency: string
  initial_balance: number
  created_by?: number
}

export class AccountModel {
  // 創建帳戶
  static async create(params: CreateAccountParams): Promise<Account> {
    const { name, currency, initial_balance, created_by } = params
    
    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO accounts (name, currency, initial_balance, current_balance, created_by)
       VALUES (?, ?, ?, ?, ?)`,
      [name, currency, initial_balance, initial_balance, created_by || null]
    )

    const [account] = await pool.execute<Account[]>(
      'SELECT * FROM accounts WHERE id = ?',
      [result.insertId]
    )

    return account[0]
  }

  // 獲取帳戶列表
  static async findAll(): Promise<Account[]> {
    const [accounts] = await pool.execute<Account[]>(
      'SELECT * FROM accounts WHERE is_deleted = 0 ORDER BY created_at DESC'
    )
    return accounts
  }

  // 根據ID獲取帳戶
  static async findById(id: number): Promise<Account | null> {
    const [accounts] = await pool.execute<Account[]>(
      'SELECT * FROM accounts WHERE id = ? AND is_deleted = 0',
      [id]
    )
    return accounts[0] || null
  }

  // 更新帳戶餘額
  static async updateBalance(id: number, newBalance: number, updatedBy?: number): Promise<boolean> {
    const [result] = await pool.execute<ResultSetHeader>(
      'UPDATE accounts SET current_balance = ?, updated_by = ? WHERE id = ? AND is_deleted = 0',
      [newBalance, updatedBy || null, id]
    )
    return result.affectedRows > 0
  }

  // 刪除帳戶（軟刪除）
  static async delete(id: number, updatedBy?: number): Promise<boolean> {
    const [result] = await pool.execute<ResultSetHeader>(
      'UPDATE accounts SET is_deleted = 1, updated_by = ? WHERE id = ?',
      [updatedBy || null, id]
    )
    return result.affectedRows > 0
  }
}
