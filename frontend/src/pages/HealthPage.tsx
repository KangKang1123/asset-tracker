import { useState, useEffect } from 'react'
import {
  Card,
  Row,
  Col,
  Progress,
  Statistic,
  Tag,
  List,
  Empty,
  Spin,
  Divider,
  Tooltip,
} from 'antd'
import {
  HeartOutlined,
  TrophyOutlined,
  InfoCircleOutlined,
  CheckCircleOutlined,
  WarningOutlined,
} from '@ant-design/icons'
import { api, HealthScoreResponse, HealthScoreDetail } from '../api'

const GRADE_COLORS: Record<string, string> = {
  'A+': '#52c41a',
  A: '#73d13d',
  B: '#faad14',
  C: '#fa8c16',
  D: '#f5222d',
}

const LEVEL_COLORS: Record<string, string> = {
  优秀: '#52c41a',
  良好: '#73d13d',
  中等: '#faad14',
  及格: '#fa8c16',
  警告: '#f5222d',
  危险: '#f5222d',
  不足: '#fa8c16',
  保守: '#1890ff',
  激进: '#722ed1',
}

const SCORE_LABELS: Record<string, { label: string; icon: string; color: string }> = {
  net_asset: { label: '净资产健康度', icon: '💎', color: '#1890ff' },
  liquidity: { label: '流动性健康度', icon: '💧', color: '#13c2c2' },
  diversity: { label: '资产多样性', icon: '🎨', color: '#722ed1' },
  debt: { label: '负债控制', icon: '⚖️', color: '#fa8c16' },
  investment: { label: '投资配置', icon: '📈', color: '#52c41a' },
}

export default function HealthPage() {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<HealthScoreResponse | null>(null)

  useEffect(() => {
    loadHealthScore()
  }, [])

  const loadHealthScore = async () => {
    setLoading(true)
    try {
      const result = await api.getHealthScore()
      setData(result)
    } catch (err) {
      console.error('加载健康度评分失败:', err)
    } finally {
      setLoading(false)
    }
  }

  const renderScoreDetail = (key: string, detail: HealthScoreDetail) => {
    const info = SCORE_LABELS[key]
    return (
      <Card
        key={key}
        size="small"
        style={{ height: '100%' }}
        title={
          <span>
            <span style={{ marginRight: 8 }}>{info.icon}</span>
            {info.label}
            <Tooltip title={detail.description}>
              <InfoCircleOutlined style={{ marginLeft: 8, color: '#999', fontSize: 12 }} />
            </Tooltip>
          </span>
        }
      >
        <div style={{ textAlign: 'center', marginBottom: 12 }}>
          <Progress
            type="dashboard"
            percent={detail.percentage}
            size={80}
            strokeColor={LEVEL_COLORS[detail.level] || '#1890ff'}
            format={() => `${detail.score}/${detail.max_score}`}
          />
        </div>
        <div style={{ textAlign: 'center' }}>
          <Tag color={LEVEL_COLORS[detail.level] || '#default'}>{detail.level}</Tag>
        </div>
      </Card>
    )
  }

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 100 }}>
        <Spin size="large" tip="加载中..." />
      </div>
    )
  }

  if (!data?.has_data) {
    return (
      <Empty
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        description="暂无资产记录，请先录入资产数据"
        style={{ padding: 60 }}
      />
    )
  }

  return (
    <div>
      {/* 总分展示 */}
      <Card
        bordered={false}
        style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          marginBottom: 24,
        }}
      >
        <Row gutter={24} align="middle">
          <Col span={8} style={{ textAlign: 'center' }}>
            <Progress
              type="circle"
              percent={data.total_score}
              size={180}
              strokeWidth={12}
              strokeColor="#fff"
              trailColor="rgba(255,255,255,0.2)"
              format={(percent) => (
                <div style={{ color: '#fff' }}>
                  <div style={{ fontSize: 48, fontWeight: 'bold' }}>{percent}</div>
                  <div style={{ fontSize: 14 }}>健康分数</div>
                </div>
              )}
            />
          </Col>
          <Col span={8} style={{ textAlign: 'center', color: '#fff' }}>
            <div style={{ fontSize: 72, fontWeight: 'bold', marginBottom: 8 }}>
              {data.grade}
            </div>
            <Tag
              color={GRADE_COLORS[data.grade]}
              style={{ fontSize: 16, padding: '4px 12px', border: 'none' }}
            >
              <TrophyOutlined style={{ marginRight: 4 }} />
              {data.grade_description}
            </Tag>
            <div style={{ marginTop: 16, fontSize: 14, opacity: 0.9 }}>
              评估月份：{data.month}
            </div>
          </Col>
          <Col span={8}>
            <Card size="small" style={{ background: 'rgba(255,255,255,0.1)', border: 'none' }}>
              <Statistic
                title={<span style={{ color: 'rgba(255,255,255,0.8)' }}>💰 总资产</span>}
                value={data.summary?.total_assets || 0}
                precision={2}
                prefix="¥"
                valueStyle={{ color: '#fff' }}
              />
            </Card>
            <Card
              size="small"
              style={{ background: 'rgba(255,255,255,0.1)', border: 'none', marginTop: 8 }}
            >
              <Statistic
                title={<span style={{ color: 'rgba(255,255,255,0.8)' }}>💎 净资产</span>}
                value={data.summary?.net_assets || 0}
                precision={2}
                prefix="¥"
                valueStyle={{ color: '#fff' }}
              />
            </Card>
          </Col>
        </Row>
      </Card>

      {/* 各维度评分 */}
      <Card title={<span><HeartOutlined style={{ marginRight: 8 }} />健康度维度分析</span>} bordered={false} style={{ marginBottom: 24 }}>
        <Row gutter={[16, 16]}>
          {Object.entries(data.details).map(([key, detail]) => (
            <Col span={8} key={key}>
              {renderScoreDetail(key, detail)}
            </Col>
          ))}
        </Row>
      </Card>

      {/* 关键指标 */}
      <Card title="📊 关键指标" bordered={false} style={{ marginBottom: 24 }}>
        <Row gutter={24}>
          <Col span={6}>
            <Statistic
              title="净资产比率"
              value={data.metrics?.net_asset_ratio || 0}
              suffix="%"
              valueStyle={{ color: (data.metrics?.net_asset_ratio || 0) >= 60 ? '#3f8600' : '#cf1322' }}
            />
            <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>
              {`(净资产 ÷ 总资产) × 100%`}
            </div>
          </Col>
          <Col span={6}>
            <Statistic
              title="流动性比率"
              value={data.metrics?.cash_ratio || 0}
              suffix="%"
              valueStyle={{ color: '#1890ff' }}
            />
            <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>
              现金类资产 ÷ 总资产
            </div>
          </Col>
          <Col span={6}>
            <Statistic
              title="负债率"
              value={data.metrics?.liability_ratio || 0}
              suffix="%"
              valueStyle={{ color: (data.metrics?.liability_ratio || 0) < 40 ? '#3f8600' : '#cf1322' }}
            />
            <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>
              总负债 ÷ 总资产
            </div>
          </Col>
          <Col span={6}>
            <Statistic
              title="投资比率"
              value={data.metrics?.investment_ratio || 0}
              suffix="%"
              valueStyle={{ color: '#722ed1' }}
            />
            <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>
              投资资产 ÷ 总资产
            </div>
          </Col>
        </Row>
      </Card>

      {/* 建议区域 */}
      <Card
        title={
          <span>
            <CheckCircleOutlined style={{ marginRight: 8, color: '#52c41a' }} />
            优化建议
          </span>
        }
        bordered={false}
      >
        <List
          dataSource={data.suggestions}
          renderItem={(item) => (
            <List.Item>
              <span style={{ fontSize: 15 }}>{item}</span>
            </List.Item>
          )}
        />
      </Card>

      <Divider dashed />

      {/* 评分说明 */}
      <Card size="small" title="📋 评分标准说明" bordered={false}>
        <Row gutter={[16, 8]}>
          <Col span={12}>
            <div style={{ marginBottom: 8 }}>
              <Tag color="#52c41a">A+ (90-100)</Tag> 财务状况优秀
            </div>
            <div style={{ marginBottom: 8 }}>
              <Tag color="#73d13d">A (80-89)</Tag> 财务状况良好
            </div>
          </Col>
          <Col span={12}>
            <div style={{ marginBottom: 8 }}>
              <Tag color="#faad14">B (70-79)</Tag> 财务状况中等
            </div>
            <div style={{ marginBottom: 8 }}>
              <Tag color="#fa8c16">C (60-69)</Tag> 财务状况一般
            </div>
            <div style={{ marginBottom: 8 }}>
              <Tag color="#f5222d">D (&lt;60)</Tag> 需要重点关注
            </div>
          </Col>
        </Row>
        <Divider style={{ margin: '12px 0' }} />
        <div style={{ fontSize: 12, color: '#666' }}>
          <strong>评分维度：</strong>净资产健康度(25分) + 流动性健康度(25分) + 资产多样性(20分) + 负债控制(15分) + 投资配置(15分) = 总分100分
        </div>
      </Card>
    </div>
  )
}
