import { useState, useEffect } from 'react'
import {
  Card,
  Form,
  Input,
  InputNumber,
  Select,
  Button,
  Space,
  Table,
  Statistic,
  Row,
  Col,
  message,
  Divider,
  Tag,
  Popconfirm,
} from 'antd'
import {
  PlusOutlined,
  DeleteOutlined,
  SaveOutlined,
  ImportOutlined,
  ClearOutlined,
} from '@ant-design/icons'
import dayjs from 'dayjs'
import { api, AssetItem } from '../api'

const CATEGORIES = [
  { value: '现金类', label: '💵 现金类', color: 'green' },
  { value: '固定资产', label: '🏠 固定资产', color: 'blue' },
  { value: '投资', label: '📈 投资', color: 'purple' },
  { value: '负债类', label: '💳 负债类', color: 'red' },
  { value: '重要财产', label: '💎 重要财产', color: 'orange' },
]

const EXAMPLES: Record<string, string[]> = {
  '现金类': ['银行存款', '微信余额', '支付宝余额', '现金'],
  '固定资产': ['房产', '车位', '商铺'],
  '投资': ['股票', '基金', '债券', '理财产品'],
  '负债类': ['房贷', '车贷', '信用贷', '信用卡欠款'],
  '重要财产': ['黄金', '珠宝', '名表', '艺术品'],
}

export default function RecordPage() {
  const [form] = Form.useForm()
  const [month, setMonth] = useState(dayjs().format('YYYY-MM'))
  const [items, setItems] = useState<AssetItem[]>([])
  const [category, setCategory] = useState('现金类')
  const [name, setName] = useState('')
  const [amount, setAmount] = useState<number>(0)
  const [loading, setLoading] = useState(false)

  // 计算统计
  const assetCategories = ['现金类', '固定资产', '投资', '重要财产']
  const totalAssets = items
    .filter((i) => assetCategories.includes(i.category))
    .reduce((sum, i) => sum + i.amount, 0)
  const totalLiabilities = items
    .filter((i) => i.category === '负债类')
    .reduce((sum, i) => sum + i.amount, 0)
  const netAssets = totalAssets - totalLiabilities

  // 导入上次记录
  const handleImport = async () => {
    try {
      const data = await api.getLatest()
      if (data.items && data.items.length > 0) {
        setItems(data.items)
        message.success(`已导入 ${data.month} 的记录`)
      } else {
        message.warning('暂无历史记录可导入')
      }
    } catch (err) {
      message.error('导入失败')
    }
  }

  // 添加条目
  const handleAdd = () => {
    if (!name.trim()) {
      message.warning('请输入名称')
      return
    }

    // 检查是否已存在同名条目
    const existingIndex = items.findIndex((i) => i.name === name)
    if (existingIndex >= 0) {
      // 覆盖更新
      const newItems = [...items]
      newItems[existingIndex] = { category, name, amount }
      setItems(newItems)
      message.success('已更新同名资产')
    } else {
      setItems([...items, { category, name, amount }])
    }
    setName('')
    setAmount(0)
  }

  // 删除条目
  const handleDelete = (index: number) => {
    setItems(items.filter((_, i) => i !== index))
  }

  // 清空所有
  const handleClear = () => {
    setItems([])
  }

  // 保存记录
  const handleSave = async () => {
    if (items.length === 0) {
      message.warning('请至少添加一个资产条目')
      return
    }

    setLoading(true)
    try {
      await api.createRecord(month, items)
      message.success('保存成功！')
      setItems([])
    } catch (err) {
      message.error('保存失败')
    } finally {
      setLoading(false)
    }
  }

  // 表格列配置
  const columns = [
    {
      title: '类别',
      dataIndex: 'category',
      key: 'category',
      width: 150,
      render: (cat: string) => {
        const item = CATEGORIES.find((c) => c.value === cat)
        return <Tag color={item?.color}>{item?.label || cat}</Tag>
      },
    },
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
    {
      title: '操作',
      key: 'action',
      width: 80,
      render: (_: any, __: any, index: number) => (
        <Button
          type="text"
          danger
          icon={<DeleteOutlined />}
          onClick={() => handleDelete(index)}
        />
      ),
    },
  ]

  return (
    <div>
      <Row gutter={[24, 24]}>
        {/* 输入区域 */}
        <Col span={24}>
          <Card title="📝 新增资产记录" bordered={false}>
            <Space style={{ marginBottom: 16 }}>
              <span>记录月份：</span>
              <Input
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                placeholder="YYYY-MM"
                style={{ width: 120 }}
              />
              <Button icon={<ImportOutlined />} onClick={handleImport}>
                导入上次记录
              </Button>
              {items.length > 0 && (
                <Popconfirm title="确定清空所有条目？" onConfirm={handleClear}>
                  <Button danger icon={<ClearOutlined />}>
                    清空
                  </Button>
                </Popconfirm>
              )}
            </Space>

            <Divider />

            <Space.Compact style={{ width: '100%' }}>
              <Select
                value={category}
                onChange={setCategory}
                style={{ width: 150 }}
                options={CATEGORIES.map((c) => ({ value: c.value, label: c.label }))}
              />
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={`如: ${EXAMPLES[category]?.join('、')}`}
                style={{ width: 200 }}
                onPressEnter={handleAdd}
              />
              <InputNumber
                value={amount}
                onChange={(v) => setAmount(v || 0)}
                formatter={(value) => `¥ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                parser={(value) => Number(value?.replace(/¥\s?|(,*)/g, '')) || 0}
                style={{ width: 180 }}
              />
              <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
                添加
              </Button>
            </Space.Compact>
          </Card>
        </Col>

        {/* 已录入条目 */}
        {items.length > 0 && (
          <Col span={24}>
            <Card title={`📋 已录入条目 (${items.length}项)`} bordered={false}>
              <Table
                columns={columns}
                dataSource={items.map((item, i) => ({ ...item, key: i }))}
                pagination={false}
                size="small"
              />

              <Divider />

              {/* 统计卡片 */}
              <Row gutter={16}>
                <Col span={8}>
                  <Card className="stat-card" style={{ background: '#f6ffed' }}>
                    <Statistic
                      title="💰 总资产"
                      value={totalAssets}
                      precision={2}
                      prefix="¥"
                      valueStyle={{ color: '#3f8600' }}
                    />
                  </Card>
                </Col>
                <Col span={8}>
                  <Card className="stat-card" style={{ background: '#fff2f0' }}>
                    <Statistic
                      title="💳 总负债"
                      value={totalLiabilities}
                      precision={2}
                      prefix="¥"
                      valueStyle={{ color: '#cf1322' }}
                    />
                  </Card>
                </Col>
                <Col span={8}>
                  <Card
                    className="stat-card"
                    style={{ background: netAssets >= 0 ? '#e6f7ff' : '#fff7e6' }}
                  >
                    <Statistic
                      title={netAssets >= 0 ? '💎 净资产' : '⚠️ 净负债'}
                      value={netAssets}
                      precision={2}
                      prefix="¥"
                      valueStyle={{ color: netAssets >= 0 ? '#1677ff' : '#fa8c16' }}
                    />
                  </Card>
                </Col>
              </Row>

              <Divider />

              <Button
                type="primary"
                size="large"
                icon={<SaveOutlined />}
                loading={loading}
                onClick={handleSave}
                block
              >
                保存记录
              </Button>
            </Card>
          </Col>
        )}
      </Row>
    </div>
  )
}
