# 资产管理平台 v2.0

基于 **React + Vite + Ant Design + FastAPI** 的现代化资产管理平台。

## 技术栈

### 前端
- React 18 + TypeScript
- Vite 5
- Ant Design 5
- @ant-design/charts（图表）
- Axios

### 后端
- Python 3.x
- FastAPI
- SQLite
- Uvicorn

## 快速开始

### 1. 启动后端

```bash
cd backend
pip3 install -r requirements.txt --break-system-packages
python3 main.py
```

后端运行在 http://localhost:8000

### 2. 启动前端

```bash
cd frontend
npm install
npm run dev
```

前端运行在 http://localhost:3000

### 3. 访问应用

浏览器打开 http://localhost:3000

## 功能特性

- 💰 **资产录入** - 支持现金类、固定资产、投资、负债、重要财产
- 📅 **历史记录** - 按年月筛选查看
- 📈 **趋势分析** - 图表展示资产变化
- 💾 **数据导入** - 一键导入上次记录
- 🎨 **现代UI** - Ant Design 企业级界面

## 项目结构

```
asset-tracker/
├── backend/           # FastAPI 后端
│   ├── main.py        # 主程序
│   └── requirements.txt
├── frontend/          # React 前端
│   ├── src/
│   │   ├── pages/     # 页面组件
│   │   ├── api.ts     # API 接口
│   │   └── App.tsx    # 主应用
│   ├── package.json
│   └── vite.config.ts
└── README.md
```

## 数据存储

SQLite 数据库：`~/.account_book/assets.db`

---
**GitHub**: https://github.com/KangKang1123/asset-tracker
