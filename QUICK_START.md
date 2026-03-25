# 记账应用快速开始

## 完成情况 ✅

已创建完整的月度记账应用，包含以下文件：

- `account_book.py` - 主程序（Streamlit + Python）
- `run_account_book.sh` - 快捷运行脚本
- `requirements.txt` - 依赖列表
- `README_ACCOUNT_BOOK.md` - 详细文档

## 下一步操作

### 1. 安装依赖（需要先安装pip3）

```bash
pip3 install streamlit pandas
```

### 2. 运行应用

```bash
python3 account_book.py
# 或
./run_account_book.sh
```

### 3. 浏览器访问

```
http://127.0.0.1:8501
```

## 功能特色

- ✅ 多平台支持（银行卡、支付宝、微信、信用卡、网贷等）
- ✅ 动态添加/删除平台输入
- ✅ 实时计算总存款、总欠款、净余额
- ✅ JSON文件本地持久化
- ✅ 历史记录按月份筛选查看
- ✅ 数据可视化展示

## 数据存储位置

```
~/.account_book/records.json
```

---

如果安装过程中遇到问题，参考 `README_ACCOUNT_BOOK.md` 中的常见问题部分。
