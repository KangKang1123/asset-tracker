#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
资产管理平台
支持多种资产类型：现金类、固定资产、投资、负债、重要财产

使用方法：
1. 首次运行前，先安装依赖: pip3 install streamlit pandas
2. 运行: streamlit run account_book.py
3. 访问: http://127.0.0.1:8501
"""

# ==================== 导入依赖 ====================
import streamlit as st
import pandas as pd
import json
from datetime import datetime
from pathlib import Path

# ==================== 资产类型配置 ====================
ASSET_CATEGORIES = {
    "现金类": {
        "icon": "💵",
        "color": "green",
        "examples": ["银行存款", "微信余额", "支付宝余额", "现金"],
        "is_asset": True
    },
    "固定资产": {
        "icon": "🏠",
        "color": "blue",
        "examples": ["房产", "车位", "商铺"],
        "is_asset": True
    },
    "投资": {
        "icon": "📈",
        "color": "purple",
        "examples": ["股票", "基金", "债券", "理财产品"],
        "is_asset": True
    },
    "负债类": {
        "icon": "💳",
        "color": "red",
        "examples": ["房贷", "车贷", "信用贷", "信用卡欠款"],
        "is_asset": False  # 负债
    },
    "重要财产": {
        "icon": "💎",
        "color": "orange",
        "examples": ["黄金", "珠宝", "名表", "艺术品"],
        "is_asset": True
    }
}

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
    records.insert(0, record)
    save_records(records)

# ==================== 计算函数 ====================
def calculate_totals(items):
    """计算总资产、总负债、净资产"""
    total_assets = 0.0    # 总资产
    total_liabilities = 0.0  # 总负债
    
    for item in items:
        category = item.get('category', '')
        amount = item.get('amount', 0)
        
        if category in ASSET_CATEGORIES:
            if ASSET_CATEGORIES[category]['is_asset']:
                total_assets += amount
            else:
                # 负债类：金额为正数表示欠款
                total_liabilities += amount
    
    net_assets = total_assets - total_liabilities
    
    return {
        'total_assets': round(total_assets, 2),
        'total_liabilities': round(total_liabilities, 2),
        'net_assets': round(net_assets, 2)
    }

# ==================== Streamlit 界面 ====================
def main():
    st.set_page_config(
        page_title="资产管理平台",
        page_icon="📊",
        layout="wide"
    )
    
    st.title("📊 个人资产管理平台")
    st.markdown("---")
    
    tab1, tab2 = st.tabs(["📝 新增资产记录", "📅 查看历史记录"])
    
    # ==================== 新增记录 ====================
    with tab1:
        st.header("新增资产记录")
        
        # 选择月份
        col1, col2 = st.columns([1, 3])
        with col1:
            today = datetime.now()
            default_month = today.strftime("%Y-%m")
            selected_month = st.text_input("记录月份", value=default_month,
                                          help="格式: YYYY-MM，如 2026-03")
        
        st.markdown("---")
        
        # 初始化 session state
        if 'asset_items' not in st.session_state:
            st.session_state.asset_items = []
        
        # 按类别输入资产
        st.subheader("资产录入")
        
        # 类别选择和添加
        col1, col2, col3 = st.columns([2, 2, 1])
        with col1:
            selected_category = st.selectbox(
                "选择资产类别",
                options=list(ASSET_CATEGORIES.keys()),
                key="category_select"
            )
        
        with col2:
            category_info = ASSET_CATEGORIES[selected_category]
            example_text = f"示例: {', '.join(category_info['examples'][:3])}"
            item_name = st.text_input(
                "名称",
                placeholder=example_text,
                key="item_name_input"
            )
        
        with col3:
            item_amount = st.number_input(
                "金额 (元)",
                value=0.0,
                format="%.2f",
                key="item_amount_input"
            )
        
        if st.button("➕ 添加条目", use_container_width=True):
            if item_name:
                st.session_state.asset_items.append({
                    'category': selected_category,
                    'name': item_name,
                    'amount': item_amount
                })
                st.rerun()
            else:
                st.warning("请输入名称")
        
        st.markdown("---")
        
        # 显示已添加的条目
        if st.session_state.asset_items:
            st.subheader("已录入条目")
            
            # 按类别分组显示
            items_by_category = {}
            for item in st.session_state.asset_items:
                cat = item['category']
                if cat not in items_by_category:
                    items_by_category[cat] = []
                items_by_category[cat].append(item)
            
            # 显示每个类别的条目
            for category, items in items_by_category.items():
                cat_info = ASSET_CATEGORIES[category]
                with st.expander(f"{cat_info['icon']} {category} ({len(items)}项)", expanded=True):
                    for i, item in enumerate(items):
                        col1, col2, col3 = st.columns([3, 2, 1])
                        with col1:
                            st.write(f"**{item['name']}**")
                        with col2:
                            if category == "负债类":
                                st.write(f"💸 ¥{item['amount']:,.2f}")
                            else:
                                st.write(f"💰 ¥{item['amount']:,.2f}")
                        with col3:
                            # 找到该条目在总列表中的索引
                            idx = st.session_state.asset_items.index(item)
                            if st.button("🗑️", key=f"del_{idx}"):
                                st.session_state.asset_items.pop(idx)
                                st.rerun()
            
            st.markdown("---")
            
            # 计算结果
            totals = calculate_totals(st.session_state.asset_items)
            
            st.subheader("📊 资产统计")
            col1, col2, col3 = st.columns(3)
            
            with col1:
                st.metric("💰 总资产", f"¥{totals['total_assets']:,.2f}")
            
            with col2:
                st.metric("💳 总负债", f"¥{totals['total_liabilities']:,.2f}")
            
            with col3:
                if totals['net_assets'] >= 0:
                    st.metric("💎 净资产", f"¥{totals['net_assets']:,.2f}")
                else:
                    st.metric("⚠️ 净资产", f"¥{totals['net_assets']:,.2f}")
            
            st.markdown("---")
            
            # 保存按钮
            if st.button("💾 保存记录", type="primary", use_container_width=True):
                record = {
                    'month': selected_month,
                    'timestamp': datetime.now().isoformat(),
                    'items': st.session_state.asset_items,
                    'totals': totals
                }
                add_record(record)
                st.success("✅ 记录保存成功！")
                st.balloons()
                st.session_state.asset_items = []
        else:
            st.info("💡 请添加资产条目开始记录")
    
    # ==================== 查看历史记录 ====================
    with tab2:
        st.header("📅 查看历史记录")
        
        records = load_records()
        
        if not records:
            st.info("📝 暂无历史记录，请先在「新增资产记录」中添加")
        else:
            # 获取所有年份和月份
            all_months = sorted(set(r['month'] for r in records), reverse=True)
            
            # 年份选择
            all_years = sorted(set(m.split('-')[0] for m in all_months), reverse=True)
            
            col1, col2 = st.columns(2)
            with col1:
                selected_year = st.selectbox("选择年份", options=all_years, key="year_select")
            
            with col2:
                # 过滤该年份的月份
                year_months = [m for m in all_months if m.startswith(selected_year)]
                selected_month = st.selectbox("选择月份", options=year_months, key="month_select")
            
            st.markdown("---")
            
            # 查看按钮
            if st.button("🔍 查看记录", type="primary"):
                st.session_state.show_records = True
            
            # 显示记录详情
            if st.session_state.get('show_records', False):
                filtered_records = [r for r in records if r['month'] == selected_month]
                
                if filtered_records:
                    for i, record in enumerate(filtered_records):
                        # 记录标题
                        st.subheader(f"📋 {record['month']} 资产记录")
                        st.caption(f"记录时间: {record['timestamp']}")
                        
                        # 按类别分组显示
                        items_by_category = {}
                        for item in record['items']:
                            cat = item['category']
                            if cat not in items_by_category:
                                items_by_category[cat] = []
                            items_by_category[cat].append(item)
                        
                        # 显示各类别详情
                        for category, items in items_by_category.items():
                            cat_info = ASSET_CATEGORIES[category]
                            cat_total = sum(item['amount'] for item in items)
                            
                            with st.expander(
                                f"{cat_info['icon']} {category} - ¥{cat_total:,.2f} ({len(items)}项)",
                                expanded=True
                            ):
                                df_data = []
                                for item in items:
                                    df_data.append({
                                        '名称': item['name'],
                                        '金额': f"¥{item['amount']:,.2f}"
                                    })
                                df = pd.DataFrame(df_data)
                                st.dataframe(df, hide_index=True, use_container_width=True)
                        
                        st.markdown("---")
                        
                        # 统计汇总
                        totals = record['totals']
                        st.subheader("📊 资产汇总")
                        
                        col1, col2, col3 = st.columns(3)
                        with col1:
                            st.success(f"💰 **总资产**\n\n¥{totals['total_assets']:,.2f}")
                        with col2:
                            st.error(f"💳 **总负债**\n\n¥{totals['total_liabilities']:,.2f}")
                        with col3:
                            if totals['net_assets'] >= 0:
                                st.success(f"💎 **净资产**\n\n¥{totals['net_assets']:,.2f}")
                            else:
                                st.error(f"⚠️ **净资产**\n\n¥{totals['net_assets']:,.2f}")
                        
                        st.markdown("---")
                else:
                    st.warning(f"📅 {selected_month} 暂无记录")

# ==================== 主程序入口 ====================
if __name__ == "__main__":
    main()
