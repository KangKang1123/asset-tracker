#!/bin/bash
# 运行记账应用的快捷脚本
# 使用前请先安装依赖: pip3 install streamlit pandas

# 检查依赖
if ! python3 -c "import streamlit; import pandas" 2>/dev/null; then
    echo "❌ 缺少依赖，请先安装:"
    echo "   pip3 install streamlit pandas"
    exit 1
fi

# 运行应用
python3 $(dirname "$0")/account_book.py
