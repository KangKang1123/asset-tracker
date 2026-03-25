# 资产管理平台

一个基于 Streamlit + Python 的个人资产管理应用，支持多种资产类型记录和统计分析。

## 功能特色

### 资产分类
- 💵 **现金类**：银行存款、微信余额、支付宝余额、现金
- 🏠 **固定资产**：房产、车位、商铺
- 📈 **投资**：股票、基金、债券、理财产品
- 💳 **负债类**：房贷、车贷、信用贷、信用卡欠款
- 💎 **重要财产**：黄金、珠宝、名表、艺术品

### 核心功能
- 动态添加/删除资产条目
- 实时计算总资产、总负债、净资产
- JSON 文件本地持久化存储
- 历史记录按年/月筛选查看
- 按类别分组展示资产详情

## 安装与运行

### 1. 安装依赖

```bash
pip3 install streamlit pandas
```

### 2. 运行应用

```bash
cd asset-tracker
python3 -m streamlit run account_book.py --server.port 8501 --server.headless true
```

### 3. 访问应用

浏览器访问：http://127.0.0.1:8501

## 使用说明

### 新增资产记录
1. 选择记录月份（默认当前月份）
2. 选择资产类别
3. 输入名称和金额
4. 点击"添加条目"
5. 确认无误后点击"保存记录"

### 查看历史记录
1. 选择年份
2. 选择月份
3. 点击"查看记录"按钮
4. 展开各类别查看详情

## 数据存储

数据保存在用户主目录：`~/.account_book/records.json`

## 技术栈

- Python 3.x
- Streamlit (Web UI)
- Pandas (数据处理)
- JSON (数据存储)

---
**GitHub**: https://github.com/KangKang1123/asset-tracker
