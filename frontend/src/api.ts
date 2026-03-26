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
}
