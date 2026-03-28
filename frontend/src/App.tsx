import { useState, useEffect } from 'react'
import { ConfigProvider, Layout, Menu, theme } from 'antd'
import {
  WalletOutlined,
  HistoryOutlined,
  LineChartOutlined,
  HeartOutlined,
  ShoppingCartOutlined,
  BellOutlined,
} from '@ant-design/icons'
import zhCN from 'antd/locale/zh_CN'
import RecordPage from './pages/RecordPage'
import HistoryPage from './pages/HistoryPage'
import TrendPage from './pages/TrendPage'
import HealthPage from './pages/HealthPage'
import ExpensePage from './pages/ExpensePage'
import BillsPage from './pages/BillsPage'
import './App.css'

const { Header, Content, Sider } = Layout

type PageKey = 'record' | 'history' | 'trend' | 'health' | 'expense' | 'bills'

function App() {
  const [currentPage, setCurrentPage] = useState<PageKey>('record')
  const [collapsed, setCollapsed] = useState(false)

  const menuItems = [
    {
      key: 'record',
      icon: <WalletOutlined />,
      label: '资产录入',
    },
    {
      key: 'history',
      icon: <HistoryOutlined />,
      label: '历史记录',
    },
    {
      key: 'trend',
      icon: <LineChartOutlined />,
      label: '趋势分析',
    },
    {
      key: 'health',
      icon: <HeartOutlined />,
      label: '健康评分',
    },
    {
      key: 'expense',
      icon: <ShoppingCartOutlined />,
      label: '支出记录',
    },
    {
      key: 'bills',
      icon: <BellOutlined />,
      label: '账单提醒',
    },
  ]

  const renderPage = () => {
    switch (currentPage) {
      case 'record':
        return <RecordPage />
      case 'history':
        return <HistoryPage />
      case 'trend':
        return <TrendPage />
      case 'health':
        return <HealthPage />
      case 'expense':
        return <ExpensePage />
      case 'bills':
        return <BillsPage />
      default:
        return <RecordPage />
    }
  }

  return (
    <ConfigProvider
      locale={zhCN}
      theme={{
        algorithm: theme.defaultAlgorithm,
        token: {
          colorPrimary: '#1677ff',
          borderRadius: 8,
        },
      }}
    >
      <Layout style={{ minHeight: '100vh' }}>
        <Sider
          collapsible
          collapsed={collapsed}
          onCollapse={setCollapsed}
          theme="light"
          style={{
            boxShadow: '2px 0 8px rgba(0,0,0,0.06)',
          }}
        >
          <div className="logo">
            {collapsed ? '💰' : '💰 资产管理'}
          </div>
          <Menu
            mode="inline"
            selectedKeys={[currentPage]}
            items={menuItems}
            onClick={(e) => setCurrentPage(e.key as PageKey)}
          />
        </Sider>
        <Layout>
          <Header
            style={{
              padding: '0 24px',
              background: '#fff',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <h1 style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>
              个人资产管理平台
            </h1>
          </Header>
          <Content
            style={{
              margin: 24,
              padding: 24,
              background: '#fff',
              borderRadius: 12,
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              minHeight: 280,
              overflow: 'auto',
            }}
          >
            {renderPage()}
          </Content>
        </Layout>
      </Layout>
    </ConfigProvider>
  )
}

export default App
