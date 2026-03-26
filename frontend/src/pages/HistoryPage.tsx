import { useState, useEffect } from 'react'
import {
  Card,
  Select,
  Button,
  Table,
  Statistic,
  Row,
  Col,
  Tag,
  Divider,
  Empty,
  Spin,
  Descriptions,
  Collapse,
} from 'antd'
import { SearchOutlined, WalletOutlined } from '@ant-design/icons'
import { api, Record, AssetItem } from '../api'

const CATEGORIES: Record<string, { label: string; color: string }> = {
  '现金类': { label: '💵 现金类', color: 'green' },
  '固定资产': { label: '🏠 固定资产', color: 'blue' },
  '投资': { label: '📈 投资', color: 'purple' },
  '负债类': { label: '💳 负债类', color: 'red' },
  '重要财产': { label: '💎 重要财产', color: 'orange' },
}

export default function HistoryPage() {
  const [months, setMonths] = useState<string[]>([])
  const [selectedYear, setSelectedYear] = useState<string>('')
  const [selectedMonth, setSelectedMonth] = useState<string>('')
  const [records, setRecords] = useState<Record[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)

  // 加载月份列表
  useEffect(() => {
    api.getMonths().then((data) => {
      setMonths(data)
      if (data.length > 0) {
        const years = [...new Set(data.map((m) => m.split('-')[0]))]
        setSelectedYear(years[0])
      }
    })
  }, [])

  // 年份变化时更新月份
  useEffect(() => {
    if (selectedYear) {
      const yearMonths = months.filter((m) => m.startsWith(selectedYear))
      if (yearMonths.length > 0) {
        setSelectedMonth(yearMonths[0])
      }
    }
  }, [selectedYear, months])

  // 查询记录
  const handleSearch = async () => {
    if (!selectedMonth) return

    setLoading(true)
    setSearched(true)
    try {
      const data = await api.getRecords(selectedMonth)
      setRecords(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  // 获取所有年份
  const years = [...new Set(months.map((m) => m.split('-')[0]))].sort().reverse()
  const yearMonths = months.filter((m) => m.startsWith(selectedYear))

  // 条目表格列
  const itemColumns = [
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '金额',
      dataIndex: 'amount',
      key: 'amount',
      align: 'right' as const,
      render: (val: number) => (
        <span style={{ color: val >= 0 ? '#3f8600' : '#cf1322', fontWeight: 600 }}>
          ¥{val.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}
        </span>
      ),
    },
  ]

  return (
    <div>
      <Card title="📅 查看历史记录" bordered={false}>
        <Row gutter={16} align="middle">
          <Col>
            <span>选择年份：</span>
            <Select
              value={selectedYear}
              onChange={setSelectedYear}
              style={{ width: 120 }}
              options={years.map((y) => ({ value: y, label: y }))}
            />
          </Col>
          <Col>
            <span>选择月份：</span>
            <Select
              value={selectedMonth}
              onChange={setSelectedMonth}
              style={{ width: 120 }}
              options={yearMonths.map((m) => ({ value: m, label: m }))}
            />
          </Col>
          <Col>
            <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
              查看记录
            </Button>
          </Col>
        </Row>
      </Card>

      <Divider />

      {loading ? (
        <Spin size="large" style={{ display: 'block', margin: '50px auto' }} />
      ) : searched ? (
        records.length > 0 ? (
          <Row gutter={[16, 16]}>
            {records.map((record, index) => {
              // 按类别分组
              const groupedItems: Record<string, AssetItem[]> = {}
              record.items.forEach((item) => {
                if (!groupedItems[item.category]) {
                  groupedItems[item.category] = []
                }
                groupedItems[item.category].push(item)
              })

              return (
                <Col span={24} key={record.id}>
                  <Card
                    title={
                      <Space>
                        <WalletOutlined />
                        <span>{record.month} 资产记录</span>
                        <Tag color="blue">{record.timestamp}</Tag>
                      </Space>
                    }
                    bordered={false}
                  >
                    {/* 统计汇总 */}
                    <Row gutter={16} style={{ marginBottom: 24 }}>
                      <Col span={8}>
                        <Card size="small" style={{ background: '#f6ffed' }}>
                          <Statistic
                            title="💰 总资产"
                            value={record.total_assets}
                            precision={2}
                            prefix="¥"
                            valueStyle={{ color: '#3f8600', fontSize: 24 }}
                          />
                        </Card>
                      </Col>
                      <Col span={8}>
                        <Card size="small" style={{ background: '#fff2f0' }}>
                          <Statistic
                            title="💳 总负债"
                            value={record.total_liabilities}
                            precision={2}
                            prefix="¥"
                            valueStyle={{ color: '#cf1322', fontSize: 24 }}
                          />
                        </Card>
                      </Col>
                      <Col span={8}>
                        <Card
                          size="small"
                          style={{
                            background: record.net_assets >= 0 ? '#e6f7ff' : '#fff7e6',
                          }}
                        >
                          <Statistic
                            title={record.net_assets >= 0 ? '💎 净资产' : '⚠️ 净负债'}
                            value={record.net_assets}
                            precision={2}
                            prefix="¥"
                            valueStyle={{
                              color: record.net_assets >= 0 ? '#1677ff' : '#fa8c16',
                              fontSize: 24,
                            }}
                          />
                        </Card>
                      </Col>
                    </Row>

                    {/* 分类详情 */}
                    <Collapse accordion>
                      {Object.entries(groupedItems).map(([category, items]) => {
                        const catInfo = CATEGORIES[category] || {
                          label: category,
                          color: 'default',
                        }
                        const catTotal = items.reduce((sum, i) => sum + i.amount, 0)

                        return (
                          <Collapse.Panel
                            header={
                              <Space>
                                <Tag color={catInfo.color}>{catInfo.label}</Tag>
                                <span>
                                  ¥{catTotal.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}
                                </span>
                                <Tag>{items.length}项</Tag>
                              </Space>
                            }
                            key={category}
                          >
                            <Table
                              columns={itemColumns}
                              dataSource={items.map((i, idx) => ({ ...i, key: idx }))}
                              pagination={false}
                              size="small"
                            />
                          </Collapse.Panel>
                        )
                      })}
                    </Collapse>
                  </Card>
                </Col>
              )
            })}
          </Row>
        ) : (
          <Empty description={`${selectedMonth} 暂无记录`} />
        )
      ) : (
        <Empty description="请选择年月后点击查看记录" />
      )}
    </div>
  )
}

// 空间组件
function Space({ children }: { children: React.ReactNode }) {
  return <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>{children}</span>
}
