import { useState, useEffect } from 'react'
import {
  Card,
  Row,
  Col,
  Table,
  Button,
  Form,
  Input,
  InputNumber,
  Select,
  Modal,
  Tag,
  Statistic,
  Empty,
  Popconfirm,
  message,
  Space,
} from 'antd'
import { PlusOutlined, DeleteOutlined, BellOutlined, CheckCircleOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { api } from '../api'

interface Bill {
  id: number
  name: string
  amount: number
  day_of_month: number
  category: string
  note: string
  is_active: number
  created_at: string
}

interface UpcomingBill extends Bill {
  due_date: string
  days_until: number
  is_overdue: boolean
}

export default function BillsPage() {
  const [bills, setBills] = useState<Bill[]>([])
  const [upcoming, setUpcoming] = useState<UpcomingBill[]>([])
  const [loading, setLoading] = useState(true)
  const [modalVisible, setModalVisible] = useState(false)
  const [form] = Form.useForm()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [billsRes, upcomingRes] = await Promise.all([
        fetch('/api/bills').then((r) => r.json()),
        fetch('/api/bills/upcoming').then((r) => r.json()),
      ])
      setBills(billsRes.bills)
      setUpcoming(upcomingRes.upcoming)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async (values: any) => {
    try {
      await fetch('/api/bills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      }).then((r) => r.json())
      message.success('账单添加成功')
      setModalVisible(false)
      form.resetFields()
      loadData()
    } catch (err) {
      message.error('添加失败')
    }
  }

  const handleDelete = async (id: number) => {
    try {
      await fetch(`/api/bills/${id}`, { method: 'DELETE' })
      message.success('删除成功')
      loadData()
    } catch (err) {
      message.error('删除失败')
    }
  }

  const handleToggle = async (id: number) => {
    try {
      await fetch(`/api/bills/${id}`, { method: 'PATCH' })
      loadData()
    } catch (err) {
      message.error('操作失败')
    }
  }

  // 即将到期的账单（7天内）
  const urgentBills = upcoming.filter((b) => b.days_until >= 0 && b.days_until <= 7)
  const totalUpcoming = urgentBills.reduce((sum, b) => sum + b.amount, 0)

  const columns = [
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '金额',
      dataIndex: 'amount',
      key: 'amount',
      render: (v: number) => `¥${v.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}`,
    },
    {
      title: '扣款日',
      dataIndex: 'day_of_month',
      key: 'day_of_month',
      render: (d: number) => `每月${d}号`,
    },
    {
      title: '分类',
      dataIndex: 'category',
      key: 'category',
      render: (cat: string) => <Tag>{cat}</Tag>,
    },
    {
      title: '状态',
      dataIndex: 'is_active',
      key: 'is_active',
      render: (v: number) => (
        <Tag color={v === 1 ? 'green' : 'default'}>
          {v === 1 ? '启用' : '停用'}
        </Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_: any, record: Bill) => (
        <Space>
          <Button
            type="text"
            size="small"
            onClick={() => handleToggle(record.id)}
          >
            {record.is_active === 1 ? '停用' : '启用'}
          </Button>
          <Popconfirm
            title="确定删除这个账单？"
            onConfirm={() => handleDelete(record.id)}
          >
            <Button type="text" danger size="small" icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div>
      {/* 即将到期提醒 */}
      {urgentBills.length > 0 && (
        <Card
          title={
            <span>
              <BellOutlined style={{ marginRight: 8, color: '#fa8c16' }} />
              即将到期账单
            </span>
          }
          bordered={false}
          style={{ marginBottom: 24 }}
        >
          <Row gutter={16} style={{ marginBottom: 16 }}>
            <Col span={12}>
              <Statistic
                title="7天内到期账单"
                value={urgentBills.length}
                suffix="笔"
              />
            </Col>
            <Col span={12}>
              <Statistic
                title="总金额"
                value={totalUpcoming}
                precision={2}
                prefix="¥"
                valueStyle={{ color: '#cf1322' }}
              />
            </Col>
          </Row>
          <Row gutter={[16, 16]}>
            {urgentBills.map((bill) => (
              <Col span={8} key={bill.id}>
                <Card
                  size="small"
                  style={{
                    background: bill.days_until <= 3 ? '#fff1f0' : '#fffbe6',
                    borderLeft: `3px solid ${bill.days_until <= 3 ? '#cf1322' : '#fa8c16'}`,
                  }}
                >
                  <Row justify="space-between">
                    <Col>
                      <strong>{bill.name}</strong>
                    </Col>
                    <Col>
                      <Tag color={bill.days_until <= 3 ? 'red' : 'orange'}>
                        {bill.days_until === 0 ? '今天' : `${bill.days_until}天后`}
                      </Tag>
                    </Col>
                  </Row>
                  <div style={{ marginTop: 8, fontSize: 20, fontWeight: 600 }}>
                    ¥{bill.amount.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}
                  </div>
                  <div style={{ fontSize: 12, color: '#999' }}>
                    {bill.due_date} · {bill.category}
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        </Card>
      )}

      {/* 所有账单 */}
      <Card
        title="📋 账单管理"
        bordered={false}
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setModalVisible(true)}
          >
            添加账单
          </Button>
        }
      >
        {bills.length > 0 ? (
          <Table
            columns={columns}
            dataSource={bills.map((b) => ({ ...b, key: b.id }))}
            loading={loading}
            pagination={false}
          />
        ) : (
          <Empty description="暂无账单，点击右上角添加" />
        )}
      </Card>

      {/* 添加账单弹窗 */}
      <Modal
        title="添加定期账单"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={() => form.submit()}
      >
        <Form form={form} layout="vertical" onFinish={handleCreate}>
          <Form.Item
            name="name"
            label="账单名称"
            rules={[{ required: true, message: '请输入账单名称' }]}
          >
            <Input placeholder="如：房租、信用卡还款" />
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
              style={{ width: '100%' }}
            />
          </Form.Item>
          <Form.Item
            name="day_of_month"
            label="每月扣款日"
            rules={[{ required: true, message: '请选择扣款日' }]}
          >
            <Select placeholder="选择每月几号">
              {Array.from({ length: 28 }, (_, i) => i + 1).map((d) => (
                <Select.Option key={d} value={d}>
                  每月{d}号
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="category" label="分类" initialValue="其他">
            <Select>
              <Select.Option value="居住">🏠 居住</Select.Option>
              <Select.Option value="交通">🚗 交通</Select.Option>
              <Select.Option value="通讯">📱 通讯</Select.Option>
              <Select.Option value="保险">🛡️ 保险</Select.Option>
              <Select.Option value="其他">💰 其他</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="note" label="备注">
            <Input placeholder="可选" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
