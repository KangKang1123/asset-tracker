import { useState, useEffect } from 'react'
import { Card, Row, Col, Spin, Empty, Select, Table, Statistic, Tag, Alert } from 'antd'
import { Line, Column } from '@ant-design/charts'
import { api, TrendData, ItemTrend } from '../api'

const CATEGORIES: Record<string, string> = {
  '现金类': '💵 现金类',
  '固定资产': '🏠 固定资产',
  '投资': '📈 投资',
  '负债类': '💳 负债类',
  '重要财产': '💎 重要财产',
}

const COLORS = ['#52c41a', '#1890ff', '#722ed1', '#f5222d', '#fa8c16']

interface Prediction {
  can_predict: boolean
  message?: string
  current_month?: string
  predicted_month?: string
  current?: {
    total_assets: number
    total_liabilities: number
    net_assets: number
  }
  predicted?: {
    month: string
    total_assets: number
    total_liabilities: number
    net_assets: number
  }
  change?: {
    avg_asset_change: number
    avg_liability_change: number
    avg_net_change: number
  }
  trend?: {
    assets: string
    liabilities: string
    net: string
  }
  history_count?: number
}

export default function TrendPage() {
  const [trendData, setTrendData] = useState<TrendData[]>([])
  const [itemTrend, setItemTrend] = useState<Record<string, ItemTrend>>({})
  const [prediction, setPrediction] = useState<Prediction | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedItems, setSelectedItems] = useState<string[]>([])

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [trend, items, pred] = await Promise.all([
        api.getTrend(),
        api.getItemsTrend(),
        fetch('/api/trend/predict').then((r) => r.json()),
      ])
      setTrendData(trend)
      setItemTrend(items)
      setPrediction(pred)
      // 默认选中前5项
      const itemKeys = Object.keys(items)
      setSelectedItems(itemKeys.slice(0, 5))
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <Spin size="large" style={{ display: 'block', margin: '100px auto' }} />
  }

  if (trendData.length === 0) {
    return <Empty description="暂无数据，请先添加记录" />
  }

  // 总览趋势数据
  const summaryData: any[] = []
  trendData.forEach((d) => {
    summaryData.push({ month: d.month, type: '总资产', value: d.total_assets })
    summaryData.push({ month: d.month, type: '总负债', value: d.total_liabilities })
    summaryData.push({ month: d.month, type: '净资产', value: d.net_assets })
  })

  // 分类趋势数据
  const categoryData: any[] = []
  trendData.forEach((d) => {
    Object.entries(d.categories).forEach(([cat, val]) => {
      categoryData.push({
        month: d.month,
        category: CATEGORIES[cat] || cat,
        value: val,
      })
    })
  })

  // 各资产项趋势数据
  const itemTrendChartData: any[] = []
  selectedItems.forEach((key) => {
    const item = itemTrend[key]
    if (item) {
      Object.entries(item.data).forEach(([month, value]) => {
        itemTrendChartData.push({
          month,
          name: key,
          value,
        })
      })
    }
  })

  // 详细数据表
  const tableData = trendData.map((d) => ({
    key: d.month,
    month: d.month,
    total_assets: d.total_assets,
    total_liabilities: d.total_liabilities,
    net_assets: d.net_assets,
  }))

  const tableColumns = [
    { title: '月份', dataIndex: 'month', key: 'month' },
    {
      title: '总资产',
      dataIndex: 'total_assets',
      key: 'total_assets',
      align: 'right' as const,
      render: (v: number) => `¥${v.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}`,
    },
    {
      title: '总负债',
      dataIndex: 'total_liabilities',
      key: 'total_liabilities',
      align: 'right' as const,
      render: (v: number) => `¥${v.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}`,
    },
    {
      title: '净资产',
      dataIndex: 'net_assets',
      key: 'net_assets',
      align: 'right' as const,
      render: (v: number) => (
        <span style={{ color: v >= 0 ? '#3f8600' : '#cf1322' }}>
          ¥{v.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}
        </span>
      ),
    },
  ]

  // 图表配置
  const lineConfig = {
    data: summaryData,
    xField: 'month',
    yField: 'value',
    seriesField: 'type',
    smooth: true,
    legend: { position: 'top' as const },
    yAxis: {
      label: {
        formatter: (text: string) => `¥${Number(text).toLocaleString()}`,
      },
    },
    tooltip: {
      formatter: (datum: any) => ({
        name: datum.type,
        value: `¥${datum.value.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}`,
      }),
    },
  }

  const columnConfig = {
    data: categoryData,
    xField: 'month',
    yField: 'value',
    seriesField: 'category',
    isGroup: true,
    legend: { position: 'top' as const },
    yAxis: {
      label: {
        formatter: (text: string) => `¥${Number(text).toLocaleString()}`,
      },
    },
  }

  const itemLineConfig = {
    data: itemTrendChartData,
    xField: 'month',
    yField: 'value',
    seriesField: 'name',
    smooth: true,
    legend: { position: 'top' as const },
    yAxis: {
      label: {
        formatter: (text: string) => `¥${Number(text).toLocaleString()}`,
      },
    },
  }

  const itemOptions = Object.keys(itemTrend).map((key) => ({
    label: key,
    value: key,
  }))

  // 最新数据统计
  const latest = trendData[trendData.length - 1]
  const prev = trendData.length > 1 ? trendData[trendData.length - 2] : null

  return (
    <div>
      {/* 最新数据概览 */}
      <Card title="📊 最新资产概览" bordered={false} style={{ marginBottom: 24 }}>
        <Row gutter={16}>
          <Col span={8}>
            <Statistic
              title="💰 总资产"
              value={latest.total_assets}
              precision={2}
              prefix="¥"
              valueStyle={{ color: '#3f8600' }}
              suffix={
                prev && (
                  <span style={{ fontSize: 14, color: '#999' }}>
                    {latest.total_assets >= prev.total_assets ? '↑' : '↓'}
                    {Math.abs(latest.total_assets - prev.total_assets).toLocaleString('zh-CN', {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                )
              }
            />
          </Col>
          <Col span={8}>
            <Statistic
              title="💳 总负债"
              value={latest.total_liabilities}
              precision={2}
              prefix="¥"
              valueStyle={{ color: '#cf1322' }}
              suffix={
                prev && (
                  <span style={{ fontSize: 14, color: '#999' }}>
                    {latest.total_liabilities >= prev.total_liabilities ? '↑' : '↓'}
                    {Math.abs(latest.total_liabilities - prev.total_liabilities).toLocaleString(
                      'zh-CN',
                      { minimumFractionDigits: 2 }
                    )}
                  </span>
                )
              }
            />
          </Col>
          <Col span={8}>
            <Statistic
              title="💎 净资产"
              value={latest.net_assets}
              precision={2}
              prefix="¥"
              valueStyle={{ color: latest.net_assets >= 0 ? '#1677ff' : '#fa8c16' }}
              suffix={
                prev && (
                  <span style={{ fontSize: 14, color: '#999' }}>
                    {latest.net_assets >= prev.net_assets ? '↑' : '↓'}
                    {Math.abs(latest.net_assets - prev.net_assets).toLocaleString('zh-CN', {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                )
              }
            />
          </Col>
        </Row>
      </Card>

      {/* 趋势预测 */}
      {prediction && prediction.can_predict && (
        <Card
          title={
            <span>
              🔮 下月预测
              <Tag color="blue" style={{ marginLeft: 8 }}>
                基于{prediction.history_count}个月数据
              </Tag>
            </span>
          }
          bordered={false}
          style={{ marginBottom: 24 }}
        >
          <Alert
            message={`预测 ${prediction.predicted_month} 的资产情况`}
            description={`根据过去${prediction.history_count}个月的平均变化趋势预测`}
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />
          <Row gutter={16}>
            <Col span={8}>
              <Statistic
                title="💰 预测总资产"
                value={prediction.predicted?.total_assets}
                precision={0}
                prefix="¥"
                valueStyle={{
                  color: prediction.trend?.assets === '上升' ? '#3f8600' : prediction.trend?.assets === '下降' ? '#cf1322' : '#666',
                }}
                suffix={
                  <Tag color={prediction.trend?.assets === '上升' ? 'green' : prediction.trend?.assets === '下降' ? 'red' : 'default'}>
                    {prediction.trend?.assets}
                  </Tag>
                }
              />
              <div style={{ fontSize: 12, color: '#999', marginTop: 8 }}>
                月均变化: {prediction.change?.avg_asset_change && prediction.change.avg_asset_change > 0 ? '+' : ''}
                {prediction.change?.avg_asset_change?.toLocaleString('zh-CN', { minimumFractionDigits: 0 })}元
              </div>
            </Col>
            <Col span={8}>
              <Statistic
                title="💳 预测总负债"
                value={prediction.predicted?.total_liabilities}
                precision={0}
                prefix="¥"
                valueStyle={{
                  color: prediction.trend?.liabilities === '下降' ? '#3f8600' : prediction.trend?.liabilities === '上升' ? '#cf1322' : '#666',
                }}
                suffix={
                  <Tag color={prediction.trend?.liabilities === '下降' ? 'green' : prediction.trend?.liabilities === '上升' ? 'red' : 'default'}>
                    {prediction.trend?.liabilities}
                  </Tag>
                }
              />
              <div style={{ fontSize: 12, color: '#999', marginTop: 8 }}>
                月均变化: {prediction.change?.avg_liability_change && prediction.change.avg_liability_change > 0 ? '+' : ''}
                {prediction.change?.avg_liability_change?.toLocaleString('zh-CN', { minimumFractionDigits: 0 })}元
              </div>
            </Col>
            <Col span={8}>
              <Statistic
                title="💎 预测净资产"
                value={prediction.predicted?.net_assets}
                precision={0}
                prefix="¥"
                valueStyle={{
                  color: prediction.trend?.net === '上升' ? '#3f8600' : prediction.trend?.net === '下降' ? '#cf1322' : '#666',
                }}
                suffix={
                  <Tag color={prediction.trend?.net === '上升' ? 'green' : prediction.trend?.net === '下降' ? 'red' : 'default'}>
                    {prediction.trend?.net}
                  </Tag>
                }
              />
              <div style={{ fontSize: 12, color: '#999', marginTop: 8 }}>
                月均变化: {prediction.change?.avg_net_change && prediction.change.avg_net_change > 0 ? '+' : ''}
                {prediction.change?.avg_net_change?.toLocaleString('zh-CN', { minimumFractionDigits: 0 })}元
              </div>
            </Col>
          </Row>
        </Card>
      )}

      {/* 总览趋势图 */}
      <Card title="📈 资产总览趋势" bordered={false} style={{ marginBottom: 24 }}>
        <Line {...lineConfig} height={300} />
      </Card>

      {/* 分类趋势图 */}
      <Card title="📁 各类资产趋势" bordered={false} style={{ marginBottom: 24 }}>
        <Column {...columnConfig} height={300} />
      </Card>

      {/* 各资产项趋势 */}
      <Card title="📋 各资产项趋势" bordered={false} style={{ marginBottom: 24 }}>
        <Select
          mode="multiple"
          style={{ width: '100%', marginBottom: 16 }}
          placeholder="选择要查看的资产项"
          value={selectedItems}
          onChange={setSelectedItems}
          options={itemOptions}
          maxTagCount={5}
        />
        {selectedItems.length > 0 ? (
          <Line {...itemLineConfig} height={300} />
        ) : (
          <Empty description="请选择资产项" />
        )}
      </Card>

      {/* 详细数据表 */}
      <Card title="📊 详细数据表" bordered={false}>
        <Table
          columns={tableColumns}
          dataSource={tableData}
          pagination={false}
          size="small"
        />
      </Card>
    </div>
  )
}
