#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
月度存款/欠款记账应用 - 已完成版本
支持多平台（银行卡、支付宝、微信、信用卡、网贷等）

使用方法：
1. 首次运行前，先安装依赖: pip3 install streamlit pandas
2. 运行: python3 account_book.py
3. 访问: http://127.0.0.1:8501
"""

# ==================== 导入依赖 ====================
import streamlit as st
import pandas as pd
import json
from datetime import datetime
from pathlib import Path

# ==================== 数据持久化 ====================
DATA_DIR = Path.home() / ".account_book"
DATA_FILE = DATA_DIR / "records.json"

def ensure_data_dir():
    """确保数据目录存在"""
    DATA_DIR.mkdir(parents=True, exist_ok=True)

def load_records():
    """加载历史记录"""
    ensure_data_dir()
    if DATA_FILE.exists():
        try:
            with open(DATA_FILE, 'r', encoding='utf-8') as f:
                return json.load(f)
        except:
            return []
    return []

def save_records(records):
    """保存历史记录"""
    ensure_data_dir()
    with open(DATA_FILE, 'w', encoding='utf-8') as f:
        json.dump(records, f, ensure_ascii=False, indent=2)

def add_record(record):
    """添加新记录"""
    records = load_records()
    records.insert(0, record)  # 新记录放在最前面
    save_records(records)

# ==================== 工具函数 ====================
def calculate_totals(platforms):
    """计算总存款、总欠款、净余额"""
    total_deposit = 0.0  # 总存款（正数）
    total_debt = 0.0     # 总欠款（绝对值）
    
    for platform in platforms:
        amount = platform.get('amount', 0)
        if amount > 0:
            total_deposit += amount
        elif amount < 0:
            total_debt += abs(amount)
    
    net_balance = sum(p.get('amount', 0) for p in platforms)
    
    return {
        'total_deposit': round(total_deposit, 2),
        'total_debt': round(total_debt, 2),
        'net_balance': round(net_balance, 2)
    }

# ==================== Streamlit 界面 ====================
def main():
    # 设置页面配置
    st.set_page_config(
        page_title="月度记账 - 存款/欠款管理",
        page_icon="💰",
        layout="wide"
    )
    
    # 标题
    st.title("💰 月度存款/欠款记账本")
    st.markdown("---")
    
    # 创建两个主模块
    tab1, tab2 = st.tabs(["📝 新增月度记录", "📊 查看历史记录"])
    
    with tab1:
        st.header("新增月度记录")
        
        # 选择月份
        col1, col2 = st.columns([1, 3])
        with col1:
            today = datetime.now()
            default_month = today.strftime("%Y-%m")
            selected_month = st.text_input("月份", value=default_month, 
                                         help="格式: YYYY-MM，如 2026-03")
        
        st.markdown("---")
        
        # 动态平台输入
        st.subheader("平台输入")
        
        # 初始化平台列表
        if 'platforms' not in st.session_state:
            st.session_state.platforms = [{'name': '', 'amount': 0.0}]
        
        # 添加平台按钮
        if st.button("➕ 添加平台"):
            st.session_state.platforms.append({'name': '', 'amount': 0.0})
        
        # 每个平台的输入
        platforms = []
        for i, platform in enumerate(st.session_state.platforms):
            col1, col2, col3 = st.columns([3, 2, 1])
            
            with col1:
                name = st.text_input(
                    f"平台名称 {i+1}", 
                    value=platform['name'], 
                    key=f"platform_name_{i}",
                    placeholder="如: 工商银行、支付宝、微信等"
                )
            
            with col2:
                amount = st.number_input(
                    f"金额 (正数=存款, 负数=欠款) {i+1}",
                    value=platform['amount'],
                    key=f"platform_amount_{i}",
                    format="%.2f",
                    help="存款请输入正数，欠款请输入负数"
                )
            
            with col3:
                if i > 0:  # 至少保留一个平台
                    if st.button("➖", key=f"remove_{i}"):
                        st.session_state.platforms.pop(i)
                        st.rerun()
            
            if name:  # 只保存有名称的平台
                platforms.append({'name': name, 'amount': amount})
        
        st.markdown("---")
        
        # 显示计算结果
        if platforms:
            totals = calculate_totals(platforms)
            
            st.markdown("### 📊 计算结果")
            col1, col2, col3 = st.columns(3)
            
            with col1:
                st.success(f"💰 **总存款**\n\n¥{totals['total_deposit']:,.2f}")
            
            with col2:
                st.error(f"💳 **总欠款**\n\n¥{totals['total_debt']:,.2f}")
            
            with col3:
                if totals['net_balance'] >= 0:
                    st.success(f"💰 **净余额**\n\n¥{totals['net_balance']:,.2f}")
                else:
                    st.error(f"💸 **净负债**\n\n¥{totals['net_balance']:,.2f}")
            
            st.markdown("---")
            
            # 保存按钮
            if st.button("💾 保存记录", type="primary", use_container_width=True):
                record = {
                    'month': selected_month,
                    'timestamp': datetime.now().isoformat(),
                    'platforms': platforms,
                    'totals': totals
                }
                add_record(record)
                st.success("✅ 记录保存成功！")
                st.balloons()
                # 清空平台输入
                st.session_state.platforms = [{'name': '', 'amount': 0.0}]
        else:
            st.info("💡 请至少添加一个平台开始记录")
    
    with tab2:
        st.header("查看历史记录")
        
        # 加载所有记录
        records = load_records()
        
        if not records:
            st.info("📝 暂无历史记录，请先在「新增月度记录」中添加")
        else:
            # 获取所有月份
            all_months = sorted(set(r['month'] for r in records), reverse=True)
            
            # 月份筛选
            selected_month = st.selectbox("选择月份", options=all_months)
            
            # 过滤记录
            filtered_records = [r for r in records if r['month'] == selected_month]
            
            if filtered_records:
                for i, record in enumerate(filtered_records):
                    st.subheader(f"记录 {i+1} - {record['month']}")
                    
                    # 显示平台详情
                    st.write("##### 🏦 平台详情")
                    df_data = []
                    for p in record['platforms']:
                        amount = p['amount']
                        if amount >= 0:
                            amount_str = f"💰 ¥{amount:,.2f}"
                        else:
                            amount_str = f"💸 ¥{amount:,.2f}"
                        df_data.append({
                            '平台': p['name'],
                            '类型': '存款' if amount >= 0 else '欠款',
                            '金额': amount_str
                        })
                    
                    df = pd.DataFrame(df_data)
                    st.dataframe(df, hide_index=True, use_container_width=True)
                    
                    # 显示统计
                    totals = record['totals']
                    col1, col2, col3 = st.columns(3)
                    
                    with col1:
                        st.success(f"💰 总存款: ¥{totals['total_deposit']:,.2f}")
                    
                    with col2:
                        st.error(f"💳 总欠款: ¥{totals['total_debt']:,.2f}")
                    
                    with col3:
                        if totals['net_balance'] >= 0:
                            st.success(f"💰 净余额: ¥{totals['net_balance']:,.2f}")
                        else:
                            st.error(f"💸 净负债: ¥{totals['net_balance']:,.2f}")
                    
                    st.markdown(f"*保存时间: {record['timestamp']}*")
                    st.markdown("---")
            else:
                st.info(f"📅 月份 {selected_month} 暂无记录")

# ==================== 主程序入口 ====================
if __name__ == "__main__":
    main()
