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
}
