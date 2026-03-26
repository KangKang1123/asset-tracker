export interface AssetItem {
  category: string
  name: string
  amount: number
}

export interface Record {
  id: number
  month: string
  timestamp: string
  total_assets: number
  total_liabilities: number
  net_assets: number
  items: AssetItem[]
}

export interface TrendData {
  month: string
  total_assets: number
  total_liabilities: number
  net_assets: number
  categories: Record<string, number>
}

export interface ItemTrend {
  category: string
  name: string
  data: Record<string, number>
}

export interface HealthScoreDetail {
  score: number
  max_score: number
  percentage: number
  level: string
  description: string
}

export interface HealthScoreResponse {
  has_data: boolean
  message?: string
  month?: string
  total_score: number
  total_max: number
  grade: string
  grade_description: string
  details: {
    net_asset: HealthScoreDetail
    liquidity: HealthScoreDetail
    diversity: HealthScoreDetail
    debt: HealthScoreDetail
    investment: HealthScoreDetail
  }
  suggestions: string[]
  metrics?: {
    net_asset_ratio: number
    cash_ratio: number
    liability_ratio: number
    investment_ratio: number
    category_count: number
  }
  summary?: {
    total_assets: number
    total_liabilities: number
    net_assets: number
    cash_amount: number
    investment_amount: number
  }
}

export interface ExpenseItem {
  id: number
  date: string
  category: string
  name: string
  amount: number
  note: string
  timestamp: string
}

export interface ExpenseSummary {
  month: string
  total: number
  by_category: { category: string; total: number; count: number }[]
  by_date: { date: string; total: number; count: number }[]
  category_count: number
  record_count: number
}

export interface ExpenseCategory {
  value: string
  label: string
  color: string
}

const API_BASE = '/api'

export const api = {
  // 获取所有月份
  async getMonths(): Promise<string[]> {
    const res = await fetch(`${API_BASE}/months`)
    const data = await res.json()
    return data.months
  },

  // 获取指定月份记录
  async getRecords(month: string): Promise<Record[]> {
    const res = await fetch(`${API_BASE}/records/${month}`)
    const data = await res.json()
    return data.records
  },

  // 获取最新记录
  async getLatest(): Promise<{ month: string; items: AssetItem[] }> {
    const res = await fetch(`${API_BASE}/latest`)
    return res.json()
  },

  // 创建记录
  async createRecord(month: string, items: AssetItem[]) {
    const res = await fetch(`${API_BASE}/records`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ month, items }),
    })
    return res.json()
  },

  // 删除记录
  async deleteRecord(id: number) {
    const res = await fetch(`${API_BASE}/records/${id}`, {
      method: 'DELETE',
    })
    return res.json()
  },

  // 获取趋势数据
  async getTrend(): Promise<TrendData[]> {
    const res = await fetch(`${API_BASE}/trend`)
    const data = await res.json()
    return data.data
  },

  // 获取各资产项趋势
  async getItemsTrend(): Promise<Record<string, ItemTrend>> {
    const res = await fetch(`${API_BASE}/items-trend`)
    const data = await res.json()
    return data.items
  },

  // 获取健康度评分
  async getHealthScore(): Promise<HealthScoreResponse> {
    const res = await fetch(`${API_BASE}/health-score`)
    return res.json()
  },

  // ========== 支出记录 ==========
  // 获取支出分类
  async getExpenseCategories(): Promise<{ categories: ExpenseCategory[] }> {
    const res = await fetch(`${API_BASE}/expense-categories`)
    return res.json()
  },

  // 创建支出记录
  async createExpense(data: {
    date: string
    category: string
    amount: number
    note?: string
  }): Promise<{ success: boolean; id: number }> {
    const res = await fetch(`${API_BASE}/expenses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    return res.json()
  },

  // 获取支出记录列表
  async getExpenses(month?: string, limit = 100): Promise<{ expenses: ExpenseItem[] }> {
    const url = month
      ? `${API_BASE}/expenses?month=${month}&limit=${limit}`
      : `${API_BASE}/expenses?limit=${limit}`
    const res = await fetch(url)
    return res.json()
  },

  // 获取月度支出汇总
  async getExpenseSummary(month: string): Promise<ExpenseSummary> {
    const res = await fetch(`${API_BASE}/expenses/summary/${month}`)
    return res.json()
  },

  // 获取有支出记录的月份列表
  async getExpenseMonths(): Promise<{ months: string[] }> {
    const res = await fetch(`${API_BASE}/expenses/months`)
    return res.json()
  },

  // 删除支出记录
  async deleteExpense(id: number): Promise<{ success: boolean }> {
    const res = await fetch(`${API_BASE}/expenses/${id}`, {
      method: 'DELETE',
    })
    return res.json()
  },
}
