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

    # Vehicles table (Vehicles in fleet with Primary Responsible Driver)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS vehicles (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            license_plate TEXT NOT NULL UNIQUE,
            model TEXT,
            current_mileage INTEGER DEFAULT 0,
            primary_driver_id INTEGER DEFAULT 1,
            is_active INTEGER DEFAULT 1
        )
    """)

    # Check and migrate primary_driver_id and next_oil_change_mileage column if needed
    cursor.execute("PRAGMA table_info(vehicles)")
    columns = [row["name"] for row in cursor.fetchall()]
    if "primary_driver_id" not in columns:
        cursor.execute("ALTER TABLE vehicles ADD COLUMN primary_driver_id INTEGER DEFAULT 1")
        cursor.execute("UPDATE vehicles SET primary_driver_id = id WHERE id IN (1, 2, 3, 4)")
    if "next_oil_change_mileage" not in columns:
        cursor.execute("ALTER TABLE vehicles ADD COLUMN next_oil_change_mileage INTEGER DEFAULT 60000")
        # Default reasonable next oil change targets
        cursor.execute("UPDATE vehicles SET next_oil_change_mileage = 60000 WHERE id = 1")
        cursor.execute("UPDATE vehicles SET next_oil_change_mileage = 10000 WHERE id = 2")
        cursor.execute("UPDATE vehicles SET next_oil_change_mileage = 10000 WHERE id = 3")
        cursor.execute("UPDATE vehicles SET next_oil_change_mileage = 10000 WHERE id = 4")

    # Maintenance & Service Logs Table (แจ้งซ่อม / บันทึกประวัติเข้าศูนย์ / ถ่ายน้ำมันเครื่อง)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS maintenance_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            vehicle_id INTEGER NOT NULL,
            service_type TEXT NOT NULL, -- 'oil_change', 'repair', 'inspection', 'tire'
            service_date TEXT NOT NULL,
            mileage INTEGER NOT NULL,
            next_due_mileage INTEGER,
            cost REAL DEFAULT 0,
            service_center TEXT,
            description TEXT,
            reporter_name TEXT,
            status TEXT DEFAULT 'completed', -- 'pending', 'in_progress', 'completed'
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (vehicle_id) REFERENCES vehicles(id)
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

    # Driver Monthly Performance Reports table (แบบรายงานผลการปฏิบัติงานจ้างเหมาบุคคลภายนอก ผขร.)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS driver_monthly_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            driver_id INTEGER NOT NULL,
            report_month TEXT NOT NULL, -- e.g. '2026-10'
            day_num INTEGER NOT NULL, -- 1 to 31
            work_detail TEXT NOT NULL,
            is_manual_edit INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(driver_id, report_month, day_num),
            FOREIGN KEY (driver_id) REFERENCES drivers(id)
        )
    """)

    # Moderator Daily Verification Checklist (การตรวจรับผลงาน พขร. รายวันของเจ้าหน้าที่)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS driver_verification_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            driver_id INTEGER NOT NULL,
            report_month TEXT NOT NULL, -- '2026-10'
            day_num INTEGER NOT NULL, -- 1 to 31
            is_verified INTEGER DEFAULT 0, -- 1 = ตรวจสอบแล้ว, 0 = ยังไม่ตรวจ
            officer_notes TEXT, -- บันทึกข้อสังเกตของผู้ตรวจรับ
            verified_by TEXT,
            verified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(driver_id, report_month, day_num),
            FOREIGN KEY (driver_id) REFERENCES drivers(id)
        )
    """)

    # Moderator Monthly Approval Sign-off (การลงนามอนุมัติรับรองผลงานทั้งเดือน)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS driver_monthly_approvals (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            driver_id INTEGER NOT NULL,
            report_month TEXT NOT NULL, -- '2026-10'
            is_approved INTEGER DEFAULT 0, -- 1 = อนุมัติแล้ว
            inspector_name TEXT, -- ชื่อเจ้าหน้าที่ผู้ตรวจรับ
            inspector_position TEXT, -- ตำแหน่ง
            approval_date TEXT,
            officer_comment TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(driver_id, report_month),
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
            ("ขก 225 นนทบุรี", "รถประจำสำนักงาน (ขก 225)", 52204, 1),
            ("กอ 409 นนทบุรี", "รถประจำสำนักงาน (กอ 409)", 0, 2),
            ("ขก 192 นนทบุรี", "รถประจำสำนักงาน (ขก 192)", 0, 3),
            ("นจ 4648 นนทบุรี", "รถประจำสำนักงาน (นจ 4648)", 0, 4),
        ]
        cursor.executemany("INSERT INTO vehicles (license_plate, model, current_mileage, primary_driver_id) VALUES (?, ?, ?, ?)", default_vehicles)

    conn.commit()
    conn.close()

if __name__ == "__main__":
    init_db()
    print("Database initialized successfully!")
