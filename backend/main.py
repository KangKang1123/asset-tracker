"""
资产管理平台 - FastAPI 后端
提供 RESTful API 接口
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import sqlite3
from datetime import datetime
from pathlib import Path
import uvicorn

# ==================== 配置 ====================
DATA_DIR = Path.home() / ".account_book"
DB_FILE = DATA_DIR / "assets.db"

# ==================== 数据模型 ====================
class AssetItem(BaseModel):
    category: str
    name: str
    amount: float

class RecordCreate(BaseModel):
    month: str
    items: List[AssetItem]

class RecordResponse(BaseModel):
    id: int
    month: str
    timestamp: str
    total_assets: float
    total_liabilities: float
    net_assets: float
    items: List[AssetItem]

class TrendData(BaseModel):
    month: str
    total_assets: float
    total_liabilities: float
    net_assets: float
    categories: dict

# ==================== 数据库操作 ====================
def ensure_db():
    """确保数据库目录和表存在"""
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    
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

def get_db():
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    return conn

def calculate_totals(items: List[AssetItem]):
    """计算总资产、总负债、净资产"""
    asset_categories = ["现金类", "固定资产", "投资", "重要财产"]
    liability_categories = ["负债类"]
    
    total_assets = sum(item.amount for item in items if item.category in asset_categories)
    total_liabilities = sum(item.amount for item in items if item.category in liability_categories)
    net_assets = total_assets - total_liabilities
    
    return round(total_assets, 2), round(total_liabilities, 2), round(net_assets, 2)

# ==================== FastAPI 应用 ====================
app = FastAPI(title="资产管理平台 API", version="2.0.0")

# CORS 配置
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def startup():
    ensure_db()

@app.get("/")
def root():
    return {"message": "资产管理平台 API", "version": "2.0.0"}

@app.get("/api/months")
def get_months():
    """获取所有月份列表"""
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('SELECT DISTINCT month FROM records ORDER BY month DESC')
    months = [row['month'] for row in cursor.fetchall()]
    conn.close()
    return {"months": months}

@app.get("/api/records/{month}")
def get_records_by_month(month: str):
    """获取指定月份的记录"""
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute('''
        SELECT id, month, timestamp, total_assets, total_liabilities, net_assets
        FROM records WHERE month = ? ORDER BY timestamp DESC
    ''', (month,))
    
    records = []
    for row in cursor.fetchall():
        cursor.execute('''
            SELECT category, name, amount FROM items WHERE record_id = ?
        ''', (row['id'],))
        
        items = [AssetItem(
            category=item['category'],
            name=item['name'],
            amount=item['amount']
        ) for item in cursor.fetchall()]
        
        records.append({
            "id": row['id'],
            "month": row['month'],
            "timestamp": row['timestamp'],
            "total_assets": row['total_assets'],
            "total_liabilities": row['total_liabilities'],
            "net_assets": row['net_assets'],
            "items": items
        })
    
    conn.close()
    return {"records": records}

@app.get("/api/latest")
def get_latest():
    """获取最近一条记录"""
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute('''
        SELECT id, month, timestamp FROM records ORDER BY timestamp DESC LIMIT 1
    ''')
    row = cursor.fetchone()
    
    if row:
        cursor.execute('''
            SELECT category, name, amount FROM items WHERE record_id = ?
        ''', (row['id'],))
        
        items = [AssetItem(
            category=item['category'],
            name=item['name'],
            amount=item['amount']
        ) for item in cursor.fetchall()]
        
        conn.close()
        return {"month": row['month'], "items": items}
    
    conn.close()
    return {"month": None, "items": []}

@app.post("/api/records")
def create_record(record: RecordCreate):
    """创建新记录"""
    conn = get_db()
    cursor = conn.cursor()
    
    total_assets, total_liabilities, net_assets = calculate_totals(record.items)
    
    cursor.execute('''
        INSERT INTO records (month, timestamp, total_assets, total_liabilities, net_assets)
        VALUES (?, ?, ?, ?, ?)
    ''', (record.month, datetime.now().isoformat(), total_assets, 
          total_liabilities, net_assets))
    
    record_id = cursor.lastrowid
    
    for item in record.items:
        cursor.execute('''
            INSERT INTO items (record_id, category, name, amount)
            VALUES (?, ?, ?, ?)
        ''', (record_id, item.category, item.name, item.amount))
    
    conn.commit()
    conn.close()
    
    return {
        "success": True,
        "record_id": record_id,
        "totals": {
            "total_assets": total_assets,
            "total_liabilities": total_liabilities,
            "net_assets": net_assets
        }
    }

@app.get("/api/trend")
def get_trend():
    """获取资产趋势数据"""
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute('''
        SELECT id, month, timestamp, total_assets, total_liabilities, net_assets
        FROM records ORDER BY month ASC, timestamp DESC
    ''')
    
    monthly_data = {}
    for row in cursor.fetchall():
        month = row['month']
        if month not in monthly_data:
            monthly_data[month] = dict(row)
    
    result = []
    for month, record in monthly_data.items():
        cursor.execute('''
            SELECT category, SUM(amount) as total
            FROM items WHERE record_id = ?
            GROUP BY category
        ''', (record['id'],))
        
        categories = {row['category']: row['total'] for row in cursor.fetchall()}
        
        result.append({
            "month": month,
            "total_assets": record['total_assets'],
            "total_liabilities": record['total_liabilities'],
            "net_assets": record['net_assets'],
            "categories": categories
        })
    
    conn.close()
    return {"data": result}

@app.get("/api/items-trend")
def get_items_trend():
    """获取各资产项趋势数据"""
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute('''
        SELECT id, month FROM records ORDER BY month ASC, timestamp DESC
    ''')
    
    monthly_records = {}
    for row in cursor.fetchall():
        month = row['month']
        if month not in monthly_records:
            monthly_records[month] = row['id']
    
    item_data = {}
    for month, record_id in monthly_records.items():
        cursor.execute('''
            SELECT category, name, amount FROM items WHERE record_id = ?
        ''', (record_id,))
        
        for row in cursor.fetchall():
            key = f"{row['category']} - {row['name']}"
            if key not in item_data:
                item_data[key] = {
                    "category": row['category'],
                    "name": row['name'],
                    "data": {}
                }
            item_data[key]['data'][month] = row['amount']
    
    conn.close()
    return {"items": item_data}

@app.delete("/api/records/{record_id}")
def delete_record(record_id: int):
    """删除记录"""
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('DELETE FROM items WHERE record_id = ?', (record_id,))
    cursor.execute('DELETE FROM records WHERE id = ?', (record_id,))
    conn.commit()
    conn.close()
    return {"success": True}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
