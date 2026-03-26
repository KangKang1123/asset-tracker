#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
资产管理平台
支持多种资产类型：现金类、固定资产、投资、负债、重要财产
使用 SQLite 持久化存储

使用方法：
1. 首次运行前，先安装依赖: pip3 install streamlit pandas
2. 运行: streamlit run account_book.py
3. 访问: http://127.0.0.1:8501
"""

# ==================== 导入依赖 ====================
import streamlit as st
import pandas as pd
import sqlite3
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

# ==================== SQLite 数据库 ====================
DATA_DIR = Path.home() / ".account_book"
DB_FILE = DATA_DIR / "assets.db"

def ensure_data_dir():
    """确保数据目录存在"""
    DATA_DIR.mkdir(parents=True, exist_ok=True)

def get_db_connection():
    """获取数据库连接"""
    ensure_data_dir()
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    """初始化数据库表"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # 创建记录表
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS records (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            month TEXT NOT NULL,
            timestamp TEXT NOT NULL,
            total_assets REAL DEFAULT 0,
            total_liabilities REAL DEFAULT 0,
            net_assets REAL DEFAULT 0
        )
    ''')
    
    # 创建资产条目表
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            record_id INTEGER NOT NULL,
            category TEXT NOT NULL,
            name TEXT NOT NULL,
            amount REAL NOT NULL,
            FOREIGN KEY (record_id) REFERENCES records(id) ON DELETE CASCADE
        )
    ''')
    
    conn.commit()
    conn.close()

def save_record(month, items):
    """保存资产记录"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # 计算汇总
    totals = calculate_totals(items)
    
    # 插入记录
    cursor.execute('''
        INSERT INTO records (month, timestamp, total_assets, total_liabilities, net_assets)
        VALUES (?, ?, ?, ?, ?)
    ''', (month, datetime.now().isoformat(), totals['total_assets'], 
          totals['total_liabilities'], totals['net_assets']))
    
    record_id = cursor.lastrowid
    
    # 插入条目
    for item in items:
        cursor.execute('''
            INSERT INTO items (record_id, category, name, amount)
            VALUES (?, ?, ?, ?)
        ''', (record_id, item['category'], item['name'], item['amount']))
    
    conn.commit()
    conn.close()
    
    return totals

def get_all_months():
    """获取所有月份列表"""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT DISTINCT month FROM records ORDER BY month DESC')
    months = [row['month'] for row in cursor.fetchall()]
    conn.close()
    return months

def get_records_by_month(month):
    """获取指定月份的所有记录"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute('''
        SELECT id, month, timestamp, total_assets, total_liabilities, net_assets
        FROM records WHERE month = ? ORDER BY timestamp DESC
    ''', (month,))
    
    records = []
    for row in cursor.fetchall():
        record = dict(row)
        
        # 获取该记录的所有条目
        cursor.execute('''
            SELECT category, name, amount FROM items WHERE record_id = ?
        ''', (record['id'],))
        
        record['items'] = [dict(item) for item in cursor.fetchall()]
        records.append(record)
    
    conn.close()
    return records

def delete_record(record_id):
    """删除记录"""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('DELETE FROM items WHERE record_id = ?', (record_id,))
    cursor.execute('DELETE FROM records WHERE id = ?', (record_id,))
    conn.commit()
    conn.close()

def get_all_records():
    """获取所有记录（用于统计）"""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT COUNT(*) as count FROM records')
    count = cursor.fetchone()['count']
    conn.close()
    return count

def get_latest_record():
    """获取最近一条记录及其条目"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute('''
        SELECT id, month, timestamp FROM records ORDER BY timestamp DESC LIMIT 1
    ''')
    row = cursor.fetchone()
    
    if row:
        record_id = row['id']
        cursor.execute('''
            SELECT category, name, amount FROM items WHERE record_id = ?
        ''', (record_id,))
        items = [dict(item) for item in cursor.fetchall()]
        conn.close()
        return items, row['month']
    
    conn.close()
    return None, None

# ==================== 计算函数 ====================
def calculate_totals(items):
    """计算总资产、总负债、净资产"""
    total_assets = 0.0
    total_liabilities = 0.0
    
    for item in items:
        category = item.get('category', '')
        amount = item.get('amount', 0)
        
        if category in ASSET_CATEGORIES:
            if ASSET_CATEGORIES[category]['is_asset']:
                total_assets += amount
            else:
                total_liabilities += amount
    
    net_assets = total_assets - total_liabilities
    
    return {
        'total_assets': round(total_assets, 2),
        'total_liabilities': round(total_liabilities, 2),
        'net_assets': round(net_assets, 2)
    }

# ==================== Streamlit 界面 ====================
def main():
    # 初始化数据库
    init_db()
    
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
        
        # 导入上次记录按钮
        col_import1, col_import2 = st.columns([1, 3])
        with col_import1:
            if st.button("📥 导入上次记录", use_container_width=True):
                latest_items, latest_month = get_latest_record()
                if latest_items:
                    st.session_state.asset_items = latest_items.copy()
                    st.success(f"✅ 已导入上次记录 ({latest_month})，可在基础上修改")
                    st.rerun()
                else:
                    st.warning("暂无历史记录可导入")
        
        with col_import2:
            if st.session_state.asset_items:
                if st.button("🗑️ 清空所有条目", use_container_width=True):
                    st.session_state.asset_items = []
                    st.rerun()
        
        st.markdown("---")
        
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
                # 检查是否已存在同名条目
                existing_index = None
                for i, item in enumerate(st.session_state.asset_items):
                    if item['name'] == item_name:
                        existing_index = i
                        break
                
                if existing_index is not None:
                    # 更新已有条目
                    st.session_state.asset_items[existing_index] = {
                        'category': selected_category,
                        'name': item_name,
                        'amount': item_amount
                    }
                else:
                    # 新增条目
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
            # 为每个条目分配全局唯一索引
            global_idx = 0
            for category, items in items_by_category.items():
                cat_info = ASSET_CATEGORIES[category]
                with st.expander(f"{cat_info['icon']} {category} ({len(items)}项)", expanded=True):
                    for item in items:
                        col1, col2, col3 = st.columns([3, 2, 1])
                        with col1:
                            st.write(f"**{item['name']}**")
                        with col2:
                            if category == "负债类":
                                st.write(f"💸 ¥{item['amount']:,.2f}")
                            else:
                                st.write(f"💰 ¥{item['amount']:,.2f}")
                        with col3:
                            # 使用全局索引确保 key 唯一
                            current_idx = global_idx
                            if st.button("🗑️", key=f"del_{current_idx}"):
                                # 通过内容匹配找到要删除的条目
                                for j, it in enumerate(st.session_state.asset_items):
                                    if (it['category'] == item['category'] and 
                                        it['name'] == item['name'] and 
                                        it['amount'] == item['amount']):
                                        st.session_state.asset_items.pop(j)
                                        break
                                st.rerun()
                        global_idx += 1
            
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
                save_record(selected_month, st.session_state.asset_items)
                st.success("✅ 记录保存成功！")
                st.balloons()
                st.session_state.asset_items = []
        else:
            st.info("💡 请添加资产条目开始记录")
    
    # ==================== 查看历史记录 ====================
    with tab2:
        st.header("📅 查看历史记录")
        
        all_months = get_all_months()
        
        if not all_months:
            st.info("📝 暂无历史记录，请先在「新增资产记录」中添加")
        else:
            # 年份选择
            all_years = sorted(set(m.split('-')[0] for m in all_months), reverse=True)
            
            col1, col2 = st.columns(2)
            with col1:
                selected_year = st.selectbox("选择年份", options=all_years, key="year_select")
            
            with col2:
                year_months = [m for m in all_months if m.startswith(selected_year)]
                selected_month = st.selectbox("选择月份", options=year_months, key="month_select")
            
            st.markdown("---")
            
            # 查看按钮
            if st.button("🔍 查看记录", type="primary"):
                st.session_state.show_records = True
            
            # 显示记录详情
            if st.session_state.get('show_records', False):
                records = get_records_by_month(selected_month)
                
                if records:
                    for record in records:
                        st.subheader(f"📋 {record['month']} 资产记录")
                        st.caption(f"记录时间: {record['timestamp']}")
                        
                        # 按类别分组显示
                        items_by_category = {}
                        for item in record['items']:
                            cat = item['category']
                            if cat not in items_by_category:
                                items_by_category[cat] = []
                            items_by_category[cat].append(item)
                        
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
                        col1, col2, col3 = st.columns(3)
                        with col1:
                            st.success(f"💰 **总资产**\n\n¥{record['total_assets']:,.2f}")
                        with col2:
                            st.error(f"💳 **总负债**\n\n¥{record['total_liabilities']:,.2f}")
                        with col3:
                            if record['net_assets'] >= 0:
                                st.success(f"💎 **净资产**\n\n¥{record['net_assets']:,.2f}")
                            else:
                                st.error(f"⚠️ **净资产**\n\n¥{record['net_assets']:,.2f}")
                        
                        st.markdown("---")
                else:
                    st.warning(f"📅 {selected_month} 暂无记录")

# ==================== 主程序入口 ====================
if __name__ == "__main__":
    main()
