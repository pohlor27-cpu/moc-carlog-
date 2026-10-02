import sqlite3
import json
import logging
import requests
import database

logger = logging.getLogger("google_sync")

import os

def get_google_sheets_url():
    """Retrieve configured Google Apps Script Webhook URL from environment or database settings."""
    env_url = os.environ.get("GOOGLE_SHEETS_URL", "").strip()
    if env_url:
        return env_url
    conn = database.get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT value FROM settings WHERE key = 'google_sheets_url'")
    row = cursor.fetchone()
    conn.close()
    return row["value"].strip() if row and row["value"] else ""

def sync_trip_to_sheets(trip_id: int, action: str = "upsert"):
    """
    Sends a single trip to Google Sheets webhook asynchronously/synchronously.
    action: 'upsert' or 'delete'
    """
    webhook_url = get_google_sheets_url()
    if not webhook_url:
        return {"status": "skipped", "message": "Google Sheets URL not configured"}

    try:
        conn = database.get_db()
        cursor = conn.cursor()
        
        if action == "delete":
            payload = {
                "action": "delete",
                "trip_id": trip_id
            }
        else:
            cursor.execute("""
                SELECT t.*, v.license_plate, v.model as vehicle_model, d.name as driver_name, d.nickname as driver_nickname
                FROM trips t
                JOIN vehicles v ON t.vehicle_id = v.id
                JOIN drivers d ON t.driver_id = d.id
                WHERE t.id = ?
            """, (trip_id,))
            row = cursor.fetchone()
            if not row:
                conn.close()
                return {"status": "error", "message": "Trip not found"}
            
            trip_data = dict(row)
            payload = {
                "action": "upsert",
                "trip": {
                    "id": trip_data["id"],
                    "trip_number": trip_data.get("trip_number", 1),
                    "vehicle_plate": trip_data["license_plate"],
                    "vehicle_model": trip_data.get("vehicle_model", ""),
                    "driver_name": trip_data["driver_name"],
                    "driver_nickname": trip_data.get("driver_nickname", ""),
                    "depart_date": trip_data["depart_date"],
                    "depart_time": trip_data["depart_time"],
                    "depart_mileage": trip_data["depart_mileage"],
                    "destination": trip_data["destination"],
                    "approver": trip_data.get("approver", ""),
                    "arrive_date": trip_data.get("arrive_date", ""),
                    "arrive_time": trip_data.get("arrive_time", ""),
                    "arrive_mileage": trip_data.get("arrive_mileage", ""),
                    "distance_km": trip_data.get("distance_km", 0),
                    "fuel_liters": trip_data.get("fuel_liters", 0),
                    "fuel_authorizer": trip_data.get("fuel_authorizer", ""),
                    "status": trip_data.get("status", "departed"),
                    "notes": trip_data.get("notes", ""),
                    "month_year": trip_data.get("month_year", "")
                }
            }
        conn.close()

        res = requests.post(webhook_url, json=payload, timeout=8)
        return {"status": "success", "response": res.text}
    except Exception as e:
        logger.error(f"Error syncing trip {trip_id} to Google Sheets: {e}")
        return {"status": "error", "message": str(e)}

def full_backup_to_sheets():
    """Syncs ALL trips from local database up to Google Sheets."""
    webhook_url = get_google_sheets_url()
    if not webhook_url:
        return {"status": "error", "message": "กรุณาใส่ลิงก์ Google Sheets Webhook URL ในหน้าตั้งค่าก่อนครับ"}

    try:
        conn = database.get_db()
        cursor = conn.cursor()
        cursor.execute("""
            SELECT t.*, v.license_plate, v.model as vehicle_model, d.name as driver_name, d.nickname as driver_nickname
            FROM trips t
            JOIN vehicles v ON t.vehicle_id = v.id
            JOIN drivers d ON t.driver_id = d.id
            ORDER BY t.id ASC
        """)
        trips = [dict(r) for r in cursor.fetchall()]
        conn.close()

        payload = {
            "action": "batch_sync",
            "trips": trips
        }

        res = requests.post(webhook_url, json=payload, timeout=15)
        return {"status": "success", "count": len(trips), "response": res.text}
    except Exception as e:
        return {"status": "error", "message": str(e)}

def sanitize_date_str(d_str: str) -> str:
    if not d_str:
        return ""
    d_str = str(d_str).strip()
    if "T" in d_str:
        return d_str.split("T")[0]
    return d_str

def sanitize_time_str(t_str: str) -> str:
    if not t_str:
        return ""
    t_str = str(t_str).strip()
    if "T" in t_str:
        part = t_str.split("T")[1]
        return part[:5]
    if len(t_str) > 5 and ":" in t_str:
        return t_str[:5]
    return t_str

def restore_from_sheets():
    """Pulls all trips from Google Sheets and restores/updates them in local database."""
    webhook_url = get_google_sheets_url()
    if not webhook_url:
        return {"status": "error", "message": "กรุณาใส่ลิงก์ Google Sheets Webhook URL ในหน้าตั้งค่าก่อนครับ"}

    try:
        # GET request to Apps Script Web App returns all rows as JSON
        res = requests.get(webhook_url, timeout=15)
        data = res.json()
        trips = data.get("trips", [])
        if not trips:
            return {"status": "warning", "message": "ไม่พบรายการใน Google Sheets", "count": 0}

        conn = database.get_db()
        cursor = conn.cursor()

        # Map vehicles and drivers
        cursor.execute("SELECT id, license_plate FROM vehicles")
        v_map = {row["license_plate"].strip(): row["id"] for row in cursor.fetchall()}
        
        cursor.execute("SELECT id, name, nickname FROM drivers")
        d_map = {}
        for row in cursor.fetchall():
            d_map[row["name"].strip()] = row["id"]
            if row["nickname"]:
                d_map[row["nickname"].strip()] = row["id"]

        restored_count = 0
        for t in trips:
            v_id = v_map.get(str(t.get("vehicle_plate", "")).strip(), 1)
            d_name = str(t.get("driver_name", "")).strip()
            d_id = d_map.get(d_name, 1)

            trip_id = t.get("id")
            depart_date = sanitize_date_str(t.get("depart_date", ""))
            depart_time = sanitize_time_str(t.get("depart_time", ""))
            depart_mileage = int(t.get("depart_mileage") or 0)
            destination = str(t.get("destination", "")).strip()
            approver = str(t.get("approver", "")).strip()
            arrive_date = sanitize_date_str(t.get("arrive_date", ""))
            arrive_time = sanitize_time_str(t.get("arrive_time", ""))
            arrive_mileage = int(t.get("arrive_mileage") or 0) if t.get("arrive_mileage") else None
            distance_km = int(t.get("distance_km") or 0)
            fuel_liters = float(t.get("fuel_liters") or 0.0)
            fuel_authorizer = str(t.get("fuel_authorizer", "")).strip()
            status = str(t.get("status", "completed")).strip()
            notes = str(t.get("notes", "")).strip()
            month_year = depart_date[:7] if len(depart_date) >= 7 else "2026-10"

            cursor.execute("""
                INSERT INTO trips (
                    id, vehicle_id, driver_id, month_year,
                    depart_date, depart_time, depart_mileage,
                    destination, approver,
                    arrive_date, arrive_time, arrive_mileage, distance_km,
                    fuel_liters, fuel_authorizer, status, notes
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(id) DO UPDATE SET
                    vehicle_id=excluded.vehicle_id,
                    driver_id=excluded.driver_id,
                    depart_date=excluded.depart_date,
                    depart_time=excluded.depart_time,
                    depart_mileage=excluded.depart_mileage,
                    destination=excluded.destination,
                    approver=excluded.approver,
                    arrive_date=excluded.arrive_date,
                    arrive_time=excluded.arrive_time,
                    arrive_mileage=excluded.arrive_mileage,
                    distance_km=excluded.distance_km,
                    fuel_liters=excluded.fuel_liters,
                    fuel_authorizer=excluded.fuel_authorizer,
                    status=excluded.status,
                    notes=excluded.notes
            """, (
                trip_id, v_id, d_id, month_year,
                depart_date, depart_time, depart_mileage,
                destination, approver,
                arrive_date, arrive_time, arrive_mileage, distance_km,
                fuel_liters, fuel_authorizer, status, notes
            ))
            restored_count += 1

        # Sync vehicle current mileage
        cursor.execute("SELECT id FROM vehicles")
        for v in cursor.fetchall():
            cursor.execute("""
                SELECT arrive_mileage, depart_mileage FROM trips 
                WHERE vehicle_id = ? 
                ORDER BY id DESC LIMIT 1
            """, (v["id"],))
            last = cursor.fetchone()
            if last:
                m = last["arrive_mileage"] if last["arrive_mileage"] else last["depart_mileage"]
                if m:
                    cursor.execute("UPDATE vehicles SET current_mileage = ? WHERE id = ?", (m, v["id"]))

        conn.commit()
        conn.close()
        return {"status": "success", "restored_count": restored_count}
    except Exception as e:
        return {"status": "error", "message": str(e)}
