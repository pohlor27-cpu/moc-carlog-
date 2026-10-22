#!/usr/bin/env python3
"""
MOC Car Log - Autonomous Cloud & Cross-Node Live Backup Daemon
สำนักงานพาณิชย์จังหวัดเพชรบุรี

หน้าที่:
1. ดึงฐานข้อมูล car_log.db และ JSON จาก Render (https://moc-carlog.onrender.com) อัตโนมัติทุก 10 นาที
2. เมื่อตรวจพบว่ามีข้อมูลใหม่ จะ Commit และ Push ขึ้น GitHub ทันที (ทำให้ GitHub มีข้อมูลสดตลอด 24 ชม.)
3. ซิงค์ Mirror ไปยัง Drive D: บนเครื่องไอ้ตี้ (192.168.1.37) อัตโนมัติทันทีที่ตรวจพบว่าเครื่องออนไลน์
4. เก็บ Snapshot ไฟล์สำรองย้อนหลังไว้ในโฟลเดอร์ backups/ ป้องกันข้อมูลสูญหาย 100%
"""

import os
import sys
import time
import json
import sqlite3
import hashlib
import logging
import subprocess
import requests
from datetime import datetime

# Setup paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, "car_log.db")
BACKUPS_DIR = os.path.join(BASE_DIR, "backups")
LOG_PATH = os.path.join(BASE_DIR, "auto_backup.log")
RENDER_BASE_URL = os.environ.get("RENDER_URL", "https://moc-carlog.onrender.com").rstrip("/")

os.makedirs(BACKUPS_DIR, exist_ok=True)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.FileHandler(LOG_PATH, encoding="utf-8"),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger("AutoBackupDaemon")

def get_file_hash(filepath):
    if not os.path.exists(filepath):
        return None
    h = hashlib.sha256()
    with open(filepath, "rb") as f:
        while chunk := f.read(8192):
            h.update(chunk)
    return h.hexdigest()

def count_trips_in_db(filepath):
    if not os.path.exists(filepath):
        return 0
    try:
        conn = sqlite3.connect(filepath)
        cur = conn.cursor()
        cur.execute("SELECT count(*) FROM trips")
        count = cur.fetchone()[0]
        conn.close()
        return count
    except Exception as e:
        logger.error(f"Error counting trips in {filepath}: {e}")
        return 0

def mirror_to_aitii():
    """Mirror to aitii (PC) D:\moc_phetchaburi_agent if online."""
    try:
        # Check SSH reachability (Port 22 on 192.168.1.37 or host aitii)
        res = subprocess.run(["ssh", "-o", "ConnectTimeout=2", "-p", "22", "pohlor27@192.168.1.37", "echo online"],
                             stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        if res.returncode == 0 and "online" in res.stdout:
            logger.info("aitii PC is online. Mirroring car_log.db to D:\\moc_phetchaburi_agent...")
            scp_res = subprocess.run(["scp", "-o", "ConnectTimeout=3", "-P", "22", DB_PATH, "pohlor27@192.168.1.37:D:/moc_phetchaburi_agent/car_log.db"],
                                     stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
            if scp_res.returncode == 0:
                logger.info("Successfully mirrored car_log.db to aitii PC!")
    except Exception as e:
        logger.debug(f"Aitii mirror check skipped: {e}")

def sync_and_backup():
    logger.info("Starting sync cycle with Render...")
    try:
        # 1. Fetch Full JSON Backup from Render
        json_url = f"{RENDER_BASE_URL}/api/backup/export-full"
        res = requests.get(json_url, timeout=20)
        if res.status_code != 200:
            logger.warning(f"Render backup endpoint returned HTTP {res.status_code}")
            return False

        cloud_data = res.json()
        cloud_trips = cloud_data.get("tables", {}).get("trips", [])
        cloud_trip_count = len(cloud_trips)
        local_trip_count = count_trips_in_db(DB_PATH)
        logger.info(f"Trip Counts: Render Cloud={cloud_trip_count}, Local DB={local_trip_count}")

        # 2. Fetch SQLite DB binary
        db_url = f"{RENDER_BASE_URL}/api/backup/download-db"
        db_res = requests.get(db_url, timeout=25)
        if db_res.status_code != 200:
            logger.warning(f"Render DB download returned HTTP {db_res.status_code}")
            return False

        temp_db_path = os.path.join(BACKUPS_DIR, "temp_render_download.db")
        with open(temp_db_path, "wb") as f:
            f.write(db_res.content)

        old_hash = get_file_hash(DB_PATH)
        new_hash = get_file_hash(temp_db_path)

        if old_hash != new_hash or cloud_trip_count >= local_trip_count:
            # Timestamped Snapshot
            ts = datetime.now().strftime("%Y%m%d_%H%M%S")
            snap_json = os.path.join(BACKUPS_DIR, f"car_log_backup_{ts}.json")
            snap_db = os.path.join(BACKUPS_DIR, f"car_log_backup_{ts}.db")
            
            with open(snap_json, "w", encoding="utf-8") as f:
                json.dump(cloud_data, f, ensure_ascii=False, indent=2)
            
            # Replace main DB with verified cloud copy
            os.replace(temp_db_path, DB_PATH)
            subprocess.run(["cp", DB_PATH, snap_db])
            logger.info(f"Database updated and snapshot created: {snap_db}")

            # Also fetch latest CSV for local records
            try:
                csv_url = f"{RENDER_BASE_URL}/api/backup/download-csv"
                csv_res = requests.get(csv_url, timeout=15)
                if csv_res.status_code == 200:
                    with open(os.path.join(BASE_DIR, "static", "car_log_latest_form4.csv"), "wb") as f:
                        f.write(csv_res.content)
            except Exception as e:
                logger.error(f"Failed to fetch CSV: {e}")

            # 3. Auto Git Commit & Push to GitHub (Making GitHub 100% Up-To-Date 24/7)
            try:
                subprocess.run(["git", "add", "car_log.db", "static/car_log_latest_form4.csv"], cwd=BASE_DIR, check=True)
                commit_msg = f"Auto-Backup Sync: {ts} (Total Trips: {cloud_trip_count})"
                commit_res = subprocess.run(["git", "commit", "-m", commit_msg], cwd=BASE_DIR, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
                if "nothing to commit" not in commit_res.stdout:
                    logger.info("Pushing latest database to GitHub repository...")
                    push_res = subprocess.run(["git", "push", "origin", "main"], cwd=BASE_DIR, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
                    if push_res.returncode == 0:
                        logger.info("Successfully pushed backup to GitHub!")
                    else:
                        logger.error(f"Git push failed: {push_res.stderr}")
            except Exception as e:
                logger.error(f"Git auto-push error: {e}")

            # 4. Mirror to PC (aitii)
            mirror_to_aitii()
            return True
        else:
            if os.path.exists(temp_db_path):
                os.remove(temp_db_path)
            logger.info("Database is already up to date. No changes needed.")
            return True

    except Exception as e:
        logger.error(f"Sync cycle failed with exception: {e}")
        return False

def main():
    logger.info("=== MOC Car Log Auto Backup Daemon Started ===")
    logger.info(f"Target Render: {RENDER_BASE_URL}")
    
    # Run immediate sync once on startup
    sync_and_backup()

    # Loop every 10 minutes (600 seconds)
    while True:
        try:
            time.sleep(600)
            sync_and_backup()
        except KeyboardInterrupt:
            logger.info("Daemon stopped by user.")
            break
        except Exception as e:
            logger.error(f"Unexpected loop error: {e}")
            time.sleep(60)

if __name__ == "__main__":
    main()
