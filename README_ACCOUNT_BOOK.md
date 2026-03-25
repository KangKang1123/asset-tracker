# 月度记账应用安装说明

## 依赖安装

### 方法1: 使用 pip3（推荐）

```bash
pip3 install streamlit pandas
```

### 方法2: 如果没有 pip，先安装 pip

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install python3-pip
```

**然后安装依赖:**
```bash
pip3 install streamlit pandas
```

### 方法3: 清华源镜像（国内用户推荐）

```bash
pip3 install streamlit pandas -i https://pypi.tuna.tsinghua.edu.cn/simple
```

## 运行应用

### 方式1: 直接运行

```bash
python3 account_book.py
```

### 方式2: 使用快捷脚本

```bash
./run_account_book.sh
```

### 方式3: 指定端口运行

```bash
streamlit run account_book.py --server.port 5000
```

## 访问应用

默认情况下，应用运行在 **http://127.0.0.1:8501**

如果指定了端口5000，则访问 **http://127.0.0.1:5000**

## 功能说明

### 新增月度记录
- 输入平台名称（银行卡、支付宝、微信、信用卡、网贷等）
- 输入金额（正数=存款，负数=欠款）
- 自动计算总存款、总欠款、净余额
- 支持动态添加/删除平台
- 保存后数据持久化存储

### 查看历史记录
- 按月份筛选查看
- 表格形式展示各平台详情
- 显示统计信息

## 数据存储

数据保存在用户主目录的隐藏文件夹：
```
~/.account_book/records.json
```

## 常见问题

### Q: 缺少 pip 错误
A: 先安装 pip3：`sudo apt install python3-pip`

### Q: 端口被占用
A: 更换端口：`streamlit run account_book.py --server.port 8502`

### Q: 数据恢复
A: 直接编辑 `~/.account_book/records.json` 文件

---
**作者**: OpenClaw Assistant  
**版本**: 1.0.0
