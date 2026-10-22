#!/bin/bash
# สคริปต์ดึงข้อมูลสำรองล่าสุดเมื่อเปิดเครื่องในวันเวลาราชการที่ทำงาน
BASE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$BASE_DIR"

echo "=== MOC Car Log - Morning Office Sync ==="
echo "กำลังดึงข้อมูลสำรองล่าสุดจาก GitHub (รอบ 1 ทุ่มเมื่อวาน)..."

git pull origin main

TRIP_COUNT=$(python3 -c "
import sqlite3
try:
    conn = sqlite3.connect('car_log.db')
    cur = conn.cursor()
    cur.execute('SELECT count(*) FROM trips')
    print(cur.fetchone()[0])
    conn.close()
except:
    print('0')
")

echo "✅ อัปเดตข้อมูลบนเครื่องเสร็จสิ้น! ข้อมูลการเดินทางปัจจุบัน: $TRIP_COUNT เที่ยว"
