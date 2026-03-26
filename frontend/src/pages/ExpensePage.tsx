import { useState, useEffect } from 'react'
import {
  Card,
  Row,
  Col,
  Form,
  Input,
  InputNumber,
  Select,
  Button,
  Table,
  Statistic,
  Tag,
  message,
  Divider,
  DatePicker,
  Empty,
  Popconfirm,
  Space,
  Progress,
} from 'antd'
import {
  PlusOutlined,
  DeleteOutlined,
  CalendarOutlined,
  PieChartOutlined,
} from '@ant-design/icons'
import dayjs from 'dayjs'
import { api, ExpenseItem, ExpenseCategory, ExpenseSummary } from '../api'

const COLORS = [
  '#ff7d45', '#1890ff', '#eb2f96', '#722ed1', '#52c41a',
  '#faad14', '#13c2c2', '#f5222d', '#2f54eb', '#fa8c16',
  '#a0d911', '#7cb305',
]

export default function ExpensePage() {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [categories, setCategories] = useState<ExpenseCategory[]>([])
  const [expenses, setExpenses] = useState<ExpenseItem[]>([])
  const [summary, setSummary] = useState<ExpenseSummary | null>(null)
  const [selectedMonth, setSelectedMonth] = useState(dayjs().format('YYYY-MM'))
  const [availableMonths, setAvailableMonths] = useState<string[]>([])
  const [activeTab, setActiveTab] = useState<'add' | 'list' | 'stats'>('add')

  useEffect(() => {
    loadCategories()
    loadMonths()
  }, [])

  useEffect(() => {
    loadExpenses()
    loadSummary()
  }, [selectedMonth])

  const loadCategories = async () => {
    try {
      const data = await api.getExpenseCategories()
      setCategories(data.categories)
    } catch (err) {
      console.error('加载分类失败:', err)
    }
  }

  const loadMonths = async () => {
    try {
      const data = await api.getExpenseMonths()
      setAvailableMonths(data.months)
    } catch (err) {
      console.error('加载月份失败:', err)
    }
  }

  const loadExpenses = async () => {
    setLoading(true)
    try {
      const data = await api.getExpenses(selectedMonth)
      setExpenses(data.expenses)
    } catch (err) {
      console.error('加载支出记录失败:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadSummary = async () => {
    try {
      const data = await api.getExpenseSummary(selectedMonth)
      setSummary(data)
    } catch (err) {
      console.error('加载汇总失败:', err)
    }
  }

  const handleSubmit = async (values: any) => {
    try {
      await api.createExpense({
        date: values.date.format('YYYY-MM-DD'),
        category: values.category,
        amount: values.amount,
        note: values.note || '',
      })
      message.success('记录成功！')
      form.resetFields()
      form.setFieldsValue({
        date: dayjs(),
        category: '餐饮',
      })
      loadExpenses()
      loadSummary()
      loadMonths()
    } catch (err) {
      message.error('记录失败')
    }
  }

  const handleDelete = async (id: number) => {
    try {
      await api.deleteExpense(id)
      message.success('删除成功')
      loadExpenses()
      loadSummary()
    } catch (err) {
      message.error('删除失败')
    }
  }

  const getCategoryColor = (category: string) => {
    const cat = categories.find((c) => c.value === category)
    return cat?.color || 'default'
  }

  const getCategoryLabel = (category: string) => {
    const cat = categories.find((c) => c.value === category)
    return cat?.label || category
  }

  // 表格列配置
  const columns = [
    {
      title: '日期',
      dataIndex: 'date',
      key: 'date',
      width: 120,
      render: (date: string) => (
        <span>
          <CalendarOutlined style={{ marginRight: 4, color: '#999' }} />
          {date}
        </span>
      ),
    },
    {
      title: '分类',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: ExpenseItem) => (
        <Tag color={getCategoryColor(record.category)}>{name}</Tag>
      ),
    },
    {
      title: '金额',
      dataIndex: 'amount',
      key: 'amount',
      width: 120,
      align: 'right' as const,
      render: (val: number) => (
        <span style={{ color: '#cf1322', fontWeight: 600 }}>
          -¥{val.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}
        </span>
      ),
    },
    {
      title: '备注',
      dataIndex: 'note',
      key: 'note',
      ellipsis: true,
      render: (note: string) => note || '-',
    },
    {
      title: '操作',
      key: 'action',
      width: 60,
      render: (_: any, record: ExpenseItem) => (
        <Popconfirm
          title="确定删除这条记录？"
          onConfirm={() => handleDelete(record.id)}
        >
          <Button type="text" danger icon={<DeleteOutlined />} size="small" />
        </Popconfirm>
      ),
    },
  ]

  return (
    <div>
      {/* 快速记账区域 */}
      <Card title="✍️ 记一笔" bordered={false} style={{ marginBottom: 24 }}>
        <Form
          form={form}
          layout="inline"
          initialValues={{
            date: dayjs(),
            category: '餐饮',
          }}
          onFinish={handleSubmit}
        >
          <Form.Item name="date" label="日期">
            <DatePicker style={{ width: 140 }} />
          </Form.Item>
          <Form.Item name="category" label="分类">
            <Select style={{ width: 140 }}>
              {categories.map((cat) => (
                <Select.Option key={cat.value} value={cat.value}>
                  {cat.label}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="amount"
            label="金额"
            rules={[{ required: true, message: '请输入金额' }]}
          >
            <InputNumber
              min={0}
              precision={2}
              prefix="¥"
              style={{ width: 120 }}
            />
          </Form.Item>
          <Form.Item name="note" label="备注">
            <Input placeholder="可选" style={{ width: 120 }} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" icon={<PlusOutlined />}>
              记一笔
            </Button>
          </Form.Item>
        </Form>
      </Card>

      {/* 月份选择 */}
      <Card bordered={false} style={{ marginBottom: 16 }}>
        <Space>
          <span>查看月份：</span>
          <Select
            value={selectedMonth}
            onChange={setSelectedMonth}
            style={{ width: 140 }}
          >
            {availableMonths.length > 0 ? (
              availableMonths.map((m) => (
                <Select.Option key={m} value={m}>
                  {m}
                </Select.Option>
              ))
            ) : (
              <Select.Option value={dayjs().format('YYYY-MM')}>
                {dayjs().format('YYYY-MM')}
              </Select.Option>
            )}
          </Select>
        </Space>
      </Card>

      {/* 汇总卡片 */}
      {summary && (
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col span={6}>
            <Card>
              <Statistic
                title="本月支出"
                value={summary.total}
                precision={2}
                prefix="¥"
                valueStyle={{ color: '#cf1322' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="记录笔数"
                value={summary.record_count}
                suffix="笔"
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="日均支出"
                value={summary.by_date.length > 0 ? summary.total / summary.by_date.length : 0}
                precision={2}
                prefix="¥"
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="支出分类"
                value={summary.category_count}
                suffix="类"
              />
            </Card>
          </Col>
        </Row>
      )}

      {/* 分类统计 */}
      {summary && summary.by_category.length > 0 && (
        <Card
          title={
            <span>
              <PieChartOutlined style={{ marginRight: 8 }} />
              分类支出统计
            </span>
          }
          bordered={false}
          style={{ marginBottom: 24 }}
        >
          <Row gutter={[16, 16]}>
            {summary.by_category.map((item, index) => {
              const percent = (item.total / summary.total) * 100
              return (
                <Col span={8} key={item.category}>
                  <Card size="small">
                    <div style={{ marginBottom: 8 }}>
                      <Tag color={COLORS[index % COLORS.length]}>
                        {getCategoryLabel(item.category)}
                      </Tag>
                      <span style={{ float: 'right', color: '#cf1322', fontWeight: 600 }}>
                        ¥{item.total.toFixed(2)}
                      </span>
                    </div>
                    <Progress
                      percent={percent}
                      showInfo={false}
                      strokeColor={COLORS[index % COLORS.length]}
                    />
                    <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>
                      {item.count}笔 · {percent.toFixed(1)}%
                    </div>
                  </Card>
                </Col>
              )
            })}
          </Row>
        </Card>
      )}

      {/* 支出列表 */}
      <Card title={`📋 ${selectedMonth} 支出明细`} bordered={false}>
        {expenses.length > 0 ? (
          <Table
            columns={columns}
            dataSource={expenses.map((e) => ({ ...e, key: e.id }))}
            loading={loading}
            pagination={{ pageSize: 20 }}
            size="small"
          />
        ) : (
          <Empty description="暂无支出记录" style={{ padding: 40 }} />
        )}
      </Card>
    </div>
  )
}
