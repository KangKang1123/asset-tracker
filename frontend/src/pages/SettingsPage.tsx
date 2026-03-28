import { useState } from 'react'
import {
  Card,
  Button,
  Upload,
  message,
  Space,
  Divider,
  Typography,
  Alert,
  Popconfirm,
} from 'antd'
import { DownloadOutlined, UploadOutlined, DeleteOutlined } from '@ant-design/icons'

const { Title, Paragraph } = Typography

export default function SettingsPage() {
  const [importing, setImporting] = useState(false)

  const handleExport = async () => {
    try {
      const response = await fetch('/api/backup')
      const data = await response.json()
      
      // 创建下载文件
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `asset-backup-${new Date().toISOString().slice(0, 10)}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
      message.success('备份导出成功')
    } catch (err) {
      message.error('导出失败')
    }
  }

  const handleImport = async (file: File) => {
    setImporting(true)
    try {
      const text = await file.text()
      const backup = JSON.parse(text)
      
      const response = await fetch('/api/backup/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(backup),
      })
      
      const result = await response.json()
      
      if (result.success) {
        message.success(
          `导入成功：资产${result.imported.records}条、支出${result.imported.expenses}条`
        )
        window.location.reload()
      } else {
        message.error(`导入失败：${result.error}`)
      }
    } catch (err) {
      message.error('导入失败，请检查文件格式')
    } finally {
      setImporting(false)
    }
    return false
  }

  const handleClearData = async () => {
    try {
      // 清空所有数据（需要后端API支持，这里只是示例）
      message.success('数据已清空')
      window.location.reload()
    } catch (err) {
      message.error('操作失败')
    }
  }

  return (
    <div>
      <Card title="⚙️ 系统设置" bordered={false}>
        <Title level={5}>数据备份</Title>
        <Paragraph type="secondary">
          导出所有数据（资产记录、支出记录、预算、账单）为JSON文件，可用于迁移或恢复
        </Paragraph>
        
        <Space style={{ marginTop: 16 }}>
          <Button
            type="primary"
            icon={<DownloadOutlined />}
            onClick={handleExport}
          >
            导出备份
          </Button>
          
          <Upload
            accept=".json"
            beforeUpload={handleImport}
            showUploadList={false}
          >
            <Button icon={<UploadOutlined />} loading={importing}>
              导入备份
            </Button>
          </Upload>
        </Space>

        <Divider />

        <Title level={5}>数据管理</Title>
        <Alert
          message="危险操作"
          description="清空数据将删除所有记录，此操作不可恢复，请先导出备份"
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
        />
        
        <Popconfirm
          title="确定要清空所有数据吗？"
          description="此操作不可恢复！"
          okText="确定清空"
          cancelText="取消"
          okButtonProps={{ danger: true }}
        >
          <Button danger icon={<DeleteOutlined />}>
            清空所有数据
          </Button>
        </Popconfirm>

        <Divider />

        <Title level={5}>关于</Title>
        <Paragraph>
          <strong>个人资产管理平台</strong> v2.0.0
        </Paragraph>
        <Paragraph type="secondary">
          功能：资产管理、支出记录、预算管理、账单提醒、趋势分析、健康评分
        </Paragraph>
        <Paragraph type="secondary">
          数据存储：本地SQLite数据库
        </Paragraph>
      </Card>
    </div>
  )
}
