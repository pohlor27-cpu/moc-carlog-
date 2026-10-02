import sqlite3
import os
from datetime import datetime

DB_PATH = os.path.join(os.path.dirname(__file__), "car_log.db")

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db()
    cursor = conn.cursor()

    # Settings table (API keys, default office settings, etc.)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS settings (
            key TEXT PRIMARY KEY,
            value TEXT
        )
    """)

    # Drivers table (4 Drivers + any additional)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS drivers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            nickname TEXT,
            avatar_color TEXT DEFAULT '#2563eb',
            phone TEXT,
            is_active INTEGER DEFAULT 1
        )
    """)

    # Vehicles table (Vehicles in fleet)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS vehicles (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            license_plate TEXT NOT NULL UNIQUE,
            model TEXT,
            current_mileage INTEGER DEFAULT 0,
            is_active INTEGER DEFAULT 1
        )
    """)

    # Trips table (Logs conforming to แบบ 4)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS trips (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            vehicle_id INTEGER NOT NULL,
            driver_id INTEGER NOT NULL,
            trip_number INTEGER DEFAULT 1,
            month_year TEXT, -- e.g. '2026-10' or 'ตุลาคม 2569'
            
            -- Departure (ออกเดินทาง)
            depart_date TEXT NOT NULL, -- ว/ด/ป (e.g. 01/10/2569 or 2026-10-01)
            depart_time TEXT NOT NULL, -- เวลา (e.g. 08:30)
            depart_mileage INTEGER NOT NULL, -- เลขไมล์ออก
            depart_image_path TEXT, -- รูปถ่ายหน้าปัดตอนออก
            
            -- Request / Approval
            approver TEXT, -- ผู้รับรอง
            destination TEXT NOT NULL, -- สถานที่ไป
            
            -- Arrival (รถกลับถึงสำนักงาน)
            arrive_date TEXT, -- ว/ด/ป
            arrive_time TEXT, -- เวลา
            arrive_mileage INTEGER, -- เลขไมล์กลับ
            arrive_image_path TEXT, -- รูปถ่ายหน้าปัดตอนกลับ
            distance_km INTEGER, -- ระยะทาง (กม.) = arrive_mileage - depart_mileage
            
            -- Fuel & Expenses (การเบิกจ่ายน้ำมันเชื้อเพลิง)
            fuel_liters REAL DEFAULT 0, -- จำนวน (ลิตร)
            fuel_cost REAL DEFAULT 0, -- จำนวนเงิน (บาท)
            fuel_authorizer TEXT, -- ผู้สั่งจ่ายน้ำมัน
            
            -- Status & Meta
            status TEXT DEFAULT 'departed', -- 'departed' (กำลังเดินทาง), 'completed' (กลับถึง สนง. แล้ว)
            notes TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            
            FOREIGN KEY (vehicle_id) REFERENCES vehicles(id),
            FOREIGN KEY (driver_id) REFERENCES drivers(id)
        )
    """)

    # Pre-seed 4 official drivers
    cursor.execute("SELECT COUNT(*) FROM drivers")
    if cursor.fetchone()[0] == 0:
        default_drivers = [
            ("กฤษณพัฒน์ แสงหล้า", "กฤษณพัฒน์ แสงหล้า", "#2563eb", "081-111-1111"),
            ("ประภาส ปักกิ่งเมือง", "ประภาส ปักกิ่งเมือง", "#10b981", "082-222-2222"),
            ("ธรรมรัตน์ สุรเดชานนท์", "ธรรมรัตน์ สุรเดชานนท์", "#f59e0b", "083-333-3333"),
            ("อนุพงศ์ บุญมาก", "อนุพงศ์ บุญมาก", "#8b5cf6", "084-444-4444"),
        ]
        cursor.executemany("INSERT INTO drivers (name, nickname, avatar_color, phone) VALUES (?, ?, ?, ?)", default_drivers)

    # Pre-seed 4 official vehicles
    cursor.execute("SELECT COUNT(*) FROM vehicles")
    if cursor.fetchone()[0] == 0:
        default_vehicles = [
            ("ขก 225 นนทบุรี", "รถประจำสำนักงาน (ขก 225)", 52204),
            ("กอ 409 นนทบุรี", "รถประจำสำนักงาน (กอ 409)", 0),
            ("ขก 192 นนทบุรี", "รถประจำสำนักงาน (ขก 192)", 0),
            ("นจ 4648 นนทบุรี", "รถประจำสำนักงาน (นจ 4648)", 0),
        ]
        cursor.executemany("INSERT INTO vehicles (license_plate, model, current_mileage) VALUES (?, ?, ?)", default_vehicles)

    conn.commit()
    conn.close()

if __name__ == "__main__":
    init_db()
    print("Database initialized successfully!")
