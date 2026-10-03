import os
import shutil
import uuid
from datetime import datetime
from typing import Optional, List
from fastapi import FastAPI, HTTPException, UploadFile, File, Form, Depends
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

import database
import google_sync
from vision_ocr import analyze_dashboard_image

# Initialize DB
database.init_db()

app = FastAPI(title="MOC Car Log System (แบบ 4)", version="1.0.0")

# Import & Mount Stitch Bridge Router
try:
    from stitch_bridge import router as stitch_router
    app.include_router(stitch_router)
except Exception as e:
    print("[Stitch Bridge] Error importing router:", e)

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Middleware for security & cache-control
@app.middleware("http")
async def add_security_and_no_cache_headers(request, call_next):
    response = await call_next(request)
    response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
    response.headers["Pragma"] = "no-cache"
    response.headers["Expires"] = "0"
    response.headers["X-Frame-Options"] = "SAMEORIGIN"
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    return response

UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Helper function to get setting
def get_setting_val(key: str, default: str = "") -> str:
    # Check OS Environment Variables first (e.g. from Render Dashboard)
    env_map = {
        "google_sheets_url": "GOOGLE_SHEETS_URL",
        "gemini_api_key": "GEMINI_API_KEY",
        "agency_name": "AGENCY_NAME",
        "default_approver": "DEFAULT_APPROVER"
    }
    env_var_name = env_map.get(key, key.upper())
    if env_var_name in os.environ and os.environ[env_var_name].strip():
        return os.environ[env_var_name].strip()

    conn = database.get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT value FROM settings WHERE key = ?", (key,))
    row = cursor.fetchone()
    conn.close()
    return row["value"] if row else default

def set_setting_val(key: str, value: str):
    conn = database.get_db()
    cursor = conn.cursor()
    cursor.execute("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)", (key, value))
    conn.commit()
    conn.close()

@app.on_event("startup")
def startup_event():
    # Attempt to auto-restore trips from Google Sheets if configured
    try:
        url = get_setting_val("google_sheets_url")
        if url:
            google_sync.restore_from_sheets()
    except Exception:
        pass

# Models
class DriverCreate(BaseModel):
    name: str
    nickname: Optional[str] = None
    avatar_color: Optional[str] = "#2563eb"
    phone: Optional[str] = None

class VehicleCreate(BaseModel):
    license_plate: str
    model: Optional[str] = None
    current_mileage: Optional[int] = 0

class TripDepartCreate(BaseModel):
    vehicle_id: int
    driver_id: int
    depart_date: str
    depart_time: str
    depart_mileage: int
    destination: str
    approver: Optional[str] = ""
    notes: Optional[str] = ""

class TripArriveUpdate(BaseModel):
    arrive_date: str
    arrive_time: str
    arrive_mileage: int
    fuel_liters: Optional[float] = 0.0
    fuel_cost: Optional[float] = 0.0
    fuel_authorizer: Optional[str] = ""
    notes: Optional[str] = ""

class SettingUpdate(BaseModel):
    gemini_api_key: Optional[str] = None
    agency_name: Optional[str] = "สำนักงานพาณิชย์จังหวัดเพชรบุรี"
    default_approver: Optional[str] = "หัวหน้ากลุ่มยุทธศาสตร์ฯ"
    google_sheets_url: Optional[str] = None

class VerifyPinRequest(BaseModel):
    pin: str

class ChangePinRequest(BaseModel):
    current_pin: str
    new_pin: str

class ResetPinRequest(BaseModel):
    master_pin: str

# ----------------- APIs -----------------

@app.get("/api/drivers")
def get_drivers():
    conn = database.get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM drivers WHERE is_active = 1 ORDER BY id ASC")
    drivers = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return {"drivers": drivers}

@app.post("/api/drivers")
def create_driver(driver: DriverCreate):
    conn = database.get_db()
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO drivers (name, nickname, avatar_color, phone) VALUES (?, ?, ?, ?)",
        (driver.name, driver.nickname, driver.avatar_color, driver.phone)
    )
    conn.commit()
    new_id = cursor.lastrowid
    conn.close()
    return {"status": "success", "id": new_id}

def sync_vehicle_mileage(cursor, vehicle_id: int):
    """
    Finds the latest recorded trip for the vehicle and updates vehicles.current_mileage
    to the trip's arrive_mileage (if completed) or depart_mileage (if departed).
    """
    cursor.execute("""
        SELECT depart_mileage, arrive_mileage, status 
        FROM trips 
        WHERE vehicle_id = ? 
        ORDER BY id DESC LIMIT 1
    """, (vehicle_id,))
    last_trip = cursor.fetchone()
    if last_trip:
        latest = last_trip["arrive_mileage"] if last_trip["arrive_mileage"] else last_trip["depart_mileage"]
        if latest is not None and latest > 0:
            cursor.execute("UPDATE vehicles SET current_mileage = ? WHERE id = ?", (latest, vehicle_id))
            return latest
    return None

@app.get("/api/vehicles")
def get_vehicles():
    conn = database.get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM vehicles WHERE is_active = 1 ORDER BY id ASC")
    vehicles = [dict(row) for row in cursor.fetchall()]
    for v in vehicles:
        latest = sync_vehicle_mileage(cursor, v["id"])
        if latest is not None:
            v["current_mileage"] = latest
    conn.commit()
    conn.close()
    return {"vehicles": vehicles}

class VehicleUpdate(BaseModel):
    license_plate: Optional[str] = None
    model: Optional[str] = None
    current_mileage: Optional[int] = None
    next_oil_change_mileage: Optional[int] = None
    primary_driver_id: Optional[int] = None

class MaintenanceCreate(BaseModel):
    vehicle_id: int
    service_type: str  # 'oil_change', 'repair', 'inspection', 'tire'
    service_date: str
    mileage: int
    next_due_mileage: Optional[int] = None
    cost: Optional[float] = 0.0
    service_center: Optional[str] = ""
    description: Optional[str] = ""
    reporter_name: Optional[str] = "เจ้าหน้าที่ธุรการ"
    status: Optional[str] = "completed"

@app.put("/api/vehicles/{vehicle_id}")
def update_vehicle(vehicle_id: int, vehicle: VehicleUpdate):
    conn = database.get_db()
    cursor = conn.cursor()
    if vehicle.current_mileage is not None:
        cursor.execute("UPDATE vehicles SET current_mileage = ? WHERE id = ?", (vehicle.current_mileage, vehicle_id))
    if vehicle.next_oil_change_mileage is not None:
        cursor.execute("UPDATE vehicles SET next_oil_change_mileage = ? WHERE id = ?", (vehicle.next_oil_change_mileage, vehicle_id))
    if vehicle.primary_driver_id is not None:
        cursor.execute("UPDATE vehicles SET primary_driver_id = ? WHERE id = ?", (vehicle.primary_driver_id, vehicle_id))
    if vehicle.license_plate:
        cursor.execute("UPDATE vehicles SET license_plate = ? WHERE id = ?", (vehicle.license_plate, vehicle_id))
    if vehicle.model:
        cursor.execute("UPDATE vehicles SET model = ? WHERE id = ?", (vehicle.model, vehicle_id))
    conn.commit()
    conn.close()
    return {"status": "success"}

# Maintenance & Service Log APIs
@app.get("/api/maintenance")
def get_maintenance(vehicle_id: Optional[int] = None):
    conn = database.get_db()
    cursor = conn.cursor()
    query = """
        SELECT m.*, v.license_plate, v.model as vehicle_model
        FROM maintenance_logs m
        JOIN vehicles v ON m.vehicle_id = v.id
        WHERE 1=1
    """
    params = []
    if vehicle_id:
        query += " AND m.vehicle_id = ?"
        params.append(vehicle_id)
    query += " ORDER BY m.service_date DESC, m.id DESC"
    cursor.execute(query, params)
    logs = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return {"maintenance_logs": logs}

@app.post("/api/maintenance")
def create_maintenance(item: MaintenanceCreate):
    conn = database.get_db()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO maintenance_logs (
            vehicle_id, service_type, service_date, mileage,
            next_due_mileage, cost, service_center, description,
            reporter_name, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        item.vehicle_id, item.service_type, item.service_date, item.mileage,
        item.next_due_mileage, item.cost, item.service_center, item.description,
        item.reporter_name, item.status
    ))
    
    # If it's an oil change with next_due_mileage, update vehicle's target
    if item.service_type == "oil_change" and item.next_due_mileage and item.next_due_mileage > 0:
        cursor.execute("UPDATE vehicles SET next_oil_change_mileage = ? WHERE id = ?", (item.next_due_mileage, item.vehicle_id))
        
    conn.commit()
    new_id = cursor.lastrowid
    conn.close()
    return {"status": "success", "id": new_id}

@app.get("/api/moderator/overview")
def get_moderator_overview(month: Optional[str] = None):
    """
    Consolidated analytics for Moderator Dashboard:
    - 4 Vehicles Live Status (at office vs departed)
    - Monthly mileage and fuel breakdown per vehicle
    - Driver statistics (trips, ad-hoc missions)
    - Oil change status & alerts (<1000km warning)
    - Recent trips
    """
    if not month:
        month = datetime.now().strftime("%Y-%m")
        
    conn = database.get_db()
    cursor = conn.cursor()
    
    # Fetch vehicles
    cursor.execute("""
        SELECT v.*, d.name as primary_driver_name, d.phone as primary_driver_phone
        FROM vehicles v
        LEFT JOIN drivers d ON v.primary_driver_id = d.id
        WHERE v.is_active = 1
        ORDER BY v.id ASC
    """)
    vehicles = [dict(row) for row in cursor.fetchall()]
    
    # Check current active trip for each vehicle
    for v in vehicles:
        sync_vehicle_mileage(cursor, v["id"])
        cursor.execute("""
            SELECT t.*, d.name as current_driver_name
            FROM trips t
            JOIN drivers d ON t.driver_id = d.id
            WHERE t.vehicle_id = ? AND t.status = 'departed'
            ORDER BY t.id DESC LIMIT 1
        """, (v["id"],))
        active_trip = cursor.fetchone()
        if active_trip:
            act = dict(active_trip)
            is_ad_hoc = (act["driver_id"] != v.get("primary_driver_id"))
            act["is_ad_hoc"] = is_ad_hoc
            act["driver_name"] = f"{act['current_driver_name']} (ผู้ขับขี่เฉพาะกิจ)" if is_ad_hoc else act['current_driver_name']
            v["active_trip"] = act
            v["status"] = "on_mission"
        else:
            v["active_trip"] = None
            v["status"] = "available"
            
        # Oil change remaining calculation
        curr_m = v.get("current_mileage") or 0
        next_m = v.get("next_oil_change_mileage") or (curr_m + 10000)
        rem_m = max(0, next_m - curr_m)
        v["oil_remaining_km"] = rem_m
        v["oil_target_km"] = next_m
        if rem_m <= 0:
            v["oil_status"] = "overdue"      # เกินกำหนด
        elif rem_m <= 1000:
            v["oil_status"] = "warning"      # ใกล้ถึงกำหนด
        else:
            v["oil_status"] = "ok"           # ปกติ
            
    # Monthly aggregate for all trips in month
    cursor.execute("""
        SELECT t.*, v.license_plate, d.name as driver_name, v.primary_driver_id
        FROM trips t
        JOIN vehicles v ON t.vehicle_id = v.id
        JOIN drivers d ON t.driver_id = d.id
        WHERE t.depart_date LIKE ?
        ORDER BY t.depart_date DESC, t.depart_time DESC, t.id DESC
    """, (f"{month}%",))
    month_trips = [dict(row) for row in cursor.fetchall()]
    
    total_trips = len(month_trips)
    total_distance = sum(t["distance_km"] or 0 for t in month_trips)
    total_fuel = sum(t["fuel_liters"] or 0 for t in month_trips)
    ad_hoc_trips = sum(1 for t in month_trips if t["driver_id"] != t.get("primary_driver_id"))
    
    # Per vehicle breakdown
    vehicle_stats = []
    for v in vehicles:
        v_trips = [t for t in month_trips if t["vehicle_id"] == v["id"]]
        v_dist = sum(t["distance_km"] or 0 for t in v_trips)
        v_fuel = sum(t["fuel_liters"] or 0 for t in v_trips)
        vehicle_stats.append({
            "vehicle_id": v["id"],
            "license_plate": v["license_plate"],
            "primary_driver": v["primary_driver_name"],
            "trips_count": len(v_trips),
            "distance_km": v_dist,
            "fuel_liters": round(v_fuel, 2),
            "current_mileage": v["current_mileage"],
            "oil_remaining_km": v["oil_remaining_km"],
            "oil_status": v["oil_status"]
        })
        
    conn.commit()
    conn.close()
    
    return {
        "month": month,
        "summary": {
            "total_vehicles": len(vehicles),
            "vehicles_available": sum(1 for v in vehicles if v["status"] == "available"),
            "vehicles_on_mission": sum(1 for v in vehicles if v["status"] == "on_mission"),
            "total_trips": total_trips,
            "total_distance_km": total_distance,
            "total_fuel_liters": round(total_fuel, 2),
            "ad_hoc_trips": ad_hoc_trips
        },
        "vehicles": vehicles,
        "vehicle_stats": vehicle_stats,
        "recent_trips": month_trips[:20]
    }

# OCR Vision Analysis Endpoint
@app.post("/api/ocr/analyze")
async def ocr_analyze(file: UploadFile = File(...)):
    contents = await file.read()
    api_key = get_setting_val("gemini_api_key")
    result = analyze_dashboard_image(contents, file.content_type or "image/jpeg", api_key=api_key)
    return result

# Get Active / Departed Trips (Current on the road)
@app.get("/api/trips/active")
def get_active_trips():
    conn = database.get_db()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT t.*, v.license_plate, v.model as vehicle_model, v.primary_driver_id, d.name as base_driver_name
        FROM trips t
        JOIN vehicles v ON t.vehicle_id = v.id
        JOIN drivers d ON t.driver_id = d.id
        WHERE t.status = 'departed'
        ORDER BY t.id DESC
    """)
    active_trips = []
    for row in cursor.fetchall():
        trip = dict(row)
        is_ad_hoc = (trip["driver_id"] != trip.get("primary_driver_id"))
        trip["is_ad_hoc"] = is_ad_hoc
        trip["driver_name"] = f"{trip['base_driver_name']} (ผู้ขับขี่เฉพาะกิจ)" if is_ad_hoc else trip['base_driver_name']
        active_trips.append(trip)
    conn.close()
    return {"active_trips": active_trips}

# Record Departure (ออกเดินทาง)
@app.post("/api/trips/depart")
async def record_departure(
    vehicle_id: int = Form(...),
    driver_id: int = Form(...),
    depart_date: str = Form(...),
    depart_time: str = Form(...),
    depart_mileage: int = Form(...),
    destination: str = Form(...),
    approver: str = Form(""),
    notes: str = Form(""),
    image: Optional[UploadFile] = File(None)
):
    image_filename = None
    if image:
        ext = image.filename.split(".")[-1] if "." in image.filename else "jpg"
        image_filename = f"depart_{uuid.uuid4().hex[:8]}.{ext}"
        image_path = os.path.join(UPLOAD_DIR, image_filename)
        with open(image_path, "wb") as buffer:
            shutil.copyfileobj(image.file, buffer)

    conn = database.get_db()
    cursor = conn.cursor()

    # Determine Trip Number for this vehicle in current month
    # extract month-year like 2026-10
    month_year = depart_date[:7] if len(depart_date) >= 7 else datetime.now().strftime("%Y-%m")
    
    cursor.execute("SELECT COUNT(*) FROM trips WHERE vehicle_id = ? AND depart_date LIKE ?", (vehicle_id, f"{month_year}%"))
    trip_count = cursor.fetchone()[0] + 1

    cursor.execute("""
        INSERT INTO trips (
            vehicle_id, driver_id, trip_number, month_year,
            depart_date, depart_time, depart_mileage, depart_image_path,
            approver, destination, status, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'departed', ?)
    """, (
        vehicle_id, driver_id, trip_count, month_year,
        depart_date, depart_time, depart_mileage, image_filename,
        approver, destination, notes
    ))
    
    # Update vehicle's latest mileage
    cursor.execute("UPDATE vehicles SET current_mileage = ? WHERE id = ?", (depart_mileage, vehicle_id))
    
    conn.commit()
    trip_id = cursor.lastrowid
    conn.close()

    # Trigger async/background sync to Google Sheets
    try:
        google_sync.sync_trip_to_sheets(trip_id)
    except Exception:
        pass

    return {"status": "success", "trip_id": trip_id, "trip_number": trip_count}

# Manual Full Trip Entry (กรอกเองทั้งเที่ยวในครั้งเดียว)
@app.post("/api/trips/manual")
async def record_manual_trip(
    vehicle_id: int = Form(...),
    driver_id: int = Form(...),
    depart_date: str = Form(...),
    depart_time: str = Form(...),
    depart_mileage: int = Form(...),
    destination: str = Form(...),
    approver: str = Form(""),
    arrive_date: str = Form(...),
    arrive_time: str = Form(...),
    arrive_mileage: int = Form(...),
    fuel_liters: float = Form(0.0),
    fuel_authorizer: str = Form(""),
    notes: str = Form("")
):
    conn = database.get_db()
    cursor = conn.cursor()

    month_year = depart_date[:7] if len(depart_date) >= 7 else datetime.now().strftime("%Y-%m")
    
    cursor.execute("SELECT COUNT(*) FROM trips WHERE vehicle_id = ? AND depart_date LIKE ?", (vehicle_id, f"{month_year}%"))
    trip_count = cursor.fetchone()[0] + 1

    distance_km = max(0, arrive_mileage - depart_mileage)

    cursor.execute("""
        INSERT INTO trips (
            vehicle_id, driver_id, trip_number, month_year,
            depart_date, depart_time, depart_mileage,
            approver, destination,
            arrive_date, arrive_time, arrive_mileage, distance_km,
            fuel_liters, fuel_authorizer, status, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'completed', ?)
    """, (
        vehicle_id, driver_id, trip_count, month_year,
        depart_date, depart_time, depart_mileage,
        approver, destination,
        arrive_date, arrive_time, arrive_mileage, distance_km,
        fuel_liters, fuel_authorizer, notes
    ))

    # Update vehicle's latest mileage
    cursor.execute("UPDATE vehicles SET current_mileage = ? WHERE id = ?", (arrive_mileage, vehicle_id))
    
    conn.commit()
    trip_id = cursor.lastrowid
    conn.close()

    # Trigger sync to Google Sheets
    try:
        google_sync.sync_trip_to_sheets(trip_id)
    except Exception:
        pass

    return {"status": "success", "trip_id": trip_id, "trip_number": trip_count, "distance_km": distance_km}

# Record Arrival (กลับถึงสำนักงาน)
@app.post("/api/trips/{trip_id}/arrive")
async def record_arrival(
    trip_id: int,
    arrive_date: str = Form(...),
    arrive_time: str = Form(...),
    arrive_mileage: int = Form(...),
    fuel_liters: float = Form(0.0),
    fuel_cost: float = Form(0.0),
    fuel_authorizer: str = Form(""),
    notes: str = Form(""),
    image: Optional[UploadFile] = File(None)
):
    conn = database.get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM trips WHERE id = ?", (trip_id,))
    trip = cursor.fetchone()
    if not trip:
        conn.close()
        raise HTTPException(status_code=404, detail="Trip not found")

    image_filename = None
    if image:
        ext = image.filename.split(".")[-1] if "." in image.filename else "jpg"
        image_filename = f"arrive_{uuid.uuid4().hex[:8]}.{ext}"
        image_path = os.path.join(UPLOAD_DIR, image_filename)
        with open(image_path, "wb") as buffer:
            shutil.copyfileobj(image.file, buffer)

    distance_km = max(0, arrive_mileage - trip["depart_mileage"])

    cursor.execute("""
        UPDATE trips SET
            arrive_date = ?,
            arrive_time = ?,
            arrive_mileage = ?,
            arrive_image_path = ?,
            distance_km = ?,
            fuel_liters = ?,
            fuel_cost = ?,
            fuel_authorizer = ?,
            status = 'completed',
            notes = COALESCE(?, notes),
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
    """, (
        arrive_date, arrive_time, arrive_mileage, image_filename,
        distance_km, fuel_liters, fuel_cost, fuel_authorizer, notes, trip_id
    ))

    # Update vehicle current mileage
    cursor.execute("UPDATE vehicles SET current_mileage = ? WHERE id = ?", (arrive_mileage, trip["vehicle_id"]))

    conn.commit()
    conn.close()

    # Trigger sync to Google Sheets
    try:
        google_sync.sync_trip_to_sheets(trip_id)
    except Exception:
        pass

    return {"status": "success", "distance_km": distance_km}

# Full List of Trips / History with filter
@app.get("/api/trips")
def get_trips(vehicle_id: Optional[int] = None, month: Optional[str] = None):
    conn = database.get_db()
    cursor = conn.cursor()
    
    query = """
        SELECT t.*, v.license_plate, v.model as vehicle_model, v.primary_driver_id, d.name as base_driver_name
        FROM trips t
        JOIN vehicles v ON t.vehicle_id = v.id
        JOIN drivers d ON t.driver_id = d.id
        WHERE 1=1
    """
    params = []
    
    if vehicle_id:
        query += " AND t.vehicle_id = ?"
        params.append(vehicle_id)
    if month:
        query += " AND t.depart_date LIKE ?"
        params.append(f"{month}%")
        
    query += " ORDER BY t.depart_date DESC, t.depart_time DESC, t.id DESC"
    
    cursor.execute(query, params)
    trips = []
    for row in cursor.fetchall():
        trip = dict(row)
        is_ad_hoc = (trip["driver_id"] != trip.get("primary_driver_id"))
        trip["is_ad_hoc"] = is_ad_hoc
        trip["driver_name"] = f"{trip['base_driver_name']} (ผู้ขับขี่เฉพาะกิจ)" if is_ad_hoc else trip['base_driver_name']
        trips.append(trip)
    conn.close()
    return {"trips": trips}

# Direct Edit / Update Trip
@app.put("/api/trips/{trip_id}")
async def update_trip(
    trip_id: int,
    vehicle_id: int = Form(...),
    driver_id: int = Form(...),
    depart_date: str = Form(...),
    depart_time: str = Form(...),
    depart_mileage: int = Form(...),
    destination: str = Form(...),
    approver: str = Form(""),
    arrive_date: Optional[str] = Form(None),
    arrive_time: Optional[str] = Form(None),
    arrive_mileage: Optional[int] = Form(None),
    fuel_liters: float = Form(0.0),
    fuel_authorizer: str = Form(""),
    notes: str = Form("")
):
    conn = database.get_db()
    cursor = conn.cursor()
    
    cursor.execute("SELECT * FROM trips WHERE id = ?", (trip_id,))
    trip = cursor.fetchone()
    if not trip:
        conn.close()
        raise HTTPException(status_code=404, detail="Trip not found")

    distance_km = 0
    status = trip["status"]
    
    if arrive_mileage is not None and arrive_mileage > 0:
        distance_km = max(0, arrive_mileage - depart_mileage)
        status = "completed"
        
    month_year = depart_date[:7] if len(depart_date) >= 7 else trip["month_year"]

    cursor.execute("""
        UPDATE trips SET
            vehicle_id = ?,
            driver_id = ?,
            month_year = ?,
            depart_date = ?,
            depart_time = ?,
            depart_mileage = ?,
            destination = ?,
            approver = ?,
            arrive_date = ?,
            arrive_time = ?,
            arrive_mileage = ?,
            distance_km = ?,
            fuel_liters = ?,
            fuel_authorizer = ?,
            status = ?,
            notes = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
    """, (
        vehicle_id, driver_id, month_year,
        depart_date, depart_time, depart_mileage,
        destination, approver,
        arrive_date, arrive_time, arrive_mileage,
        distance_km, fuel_liters, fuel_authorizer,
        status, notes, trip_id
    ))
    
    # Sync vehicle's latest mileage based on all trips
    sync_vehicle_mileage(cursor, vehicle_id)

    conn.commit()
    conn.close()

    # Trigger sync to Google Sheets
    try:
        google_sync.sync_trip_to_sheets(trip_id)
    except Exception:
        pass

    return {"status": "success", "trip_id": trip_id, "distance_km": distance_km}

# Delete Trip
@app.delete("/api/trips/{trip_id}")
def delete_trip(trip_id: int):
    conn = database.get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT vehicle_id FROM trips WHERE id = ?", (trip_id,))
    row = cursor.fetchone()
    vehicle_id = row["vehicle_id"] if row else None
    
    cursor.execute("DELETE FROM trips WHERE id = ?", (trip_id,))
    if vehicle_id:
        sync_vehicle_mileage(cursor, vehicle_id)
    conn.commit()
    conn.close()

    # Trigger delete in Google Sheets
    try:
        google_sync.sync_trip_to_sheets(trip_id, action="delete")
    except Exception:
        pass

    return {"status": "success"}

# Report Data specifically formatted for "แบบ 4 (บันทึกการใช้รถราชการ)"
@app.get("/api/report/form4")
def get_form4_report(vehicle_id: int, month: str):
    """
    month: YYYY-MM (e.g. 2026-10)
    Returns complete structured dataset to render exact 100% replica of แบบ 4.
    """
    conn = database.get_db()
    cursor = conn.cursor()
    
    # Get vehicle info
    cursor.execute("SELECT * FROM vehicles WHERE id = ?", (vehicle_id,))
    vehicle = cursor.fetchone()
    if not vehicle:
        conn.close()
        raise HTTPException(status_code=404, detail="Vehicle not found")
        
    # Get all trips for this vehicle in the requested month
    cursor.execute("""
        SELECT t.*, d.name as base_driver_name
        FROM trips t
        JOIN drivers d ON t.driver_id = d.id
        WHERE t.vehicle_id = ? AND t.depart_date LIKE ?
        ORDER BY t.depart_date ASC, t.depart_time ASC, t.id ASC
    """, (vehicle_id, f"{month}%"))
    
    trips = []
    primary_driver_id = vehicle["primary_driver_id"] if "primary_driver_id" in vehicle.keys() else 1
    for row in cursor.fetchall():
        t = dict(row)
        is_ad_hoc = (t["driver_id"] != primary_driver_id)
        t["is_ad_hoc"] = is_ad_hoc
        t["driver_name"] = f"{t['base_driver_name']} (ผู้ขับขี่เฉพาะกิจ)" if is_ad_hoc else t['base_driver_name']
        trips.append(t)
    
    # Calculate previous month starting mileage
    prev_month_mileage = 0
    if trips:
        prev_month_mileage = trips[0]["depart_mileage"]
    else:
        prev_month_mileage = vehicle["current_mileage"]
        
    # Calculate Summary (Footer)
    total_trips = len(trips)
    total_distance = sum(t["distance_km"] or 0 for t in trips)
    total_fuel = sum(t["fuel_liters"] or 0 for t in trips)
    
    # Convert month string to Thai month & previous month
    thai_months = ["", "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
                   "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"]
    try:
        y, m = month.split("-")
        m_int = int(m)
        y_int = int(y)
        thai_year = y_int + 543
        thai_month_name = thai_months[m_int]
        month_label = f"{thai_month_name} {thai_year}"
        
        # Previous month
        prev_m_int = 12 if m_int == 1 else m_int - 1
        prev_y_be = thai_year - 1 if m_int == 1 else thai_year
        prev_month_label = f"{thai_months[prev_m_int]} {prev_y_be}"
    except:
        month_label = month
        thai_month_name = month
        thai_year = ""
        prev_month_label = "กันยายน 2569"

    # Get Primary Driver Name for Signature line
    cursor.execute("SELECT name FROM drivers WHERE id = ?", (primary_driver_id,))
    p_driver = cursor.fetchone()
    primary_driver_name = p_driver["name"] if p_driver else "กฤษณพัฒน์ แสงหล้า"

    conn.close()
    
    return {
        "license_plate": vehicle["license_plate"],
        "vehicle_model": vehicle["model"],
        "month_label": month_label,
        "prev_month_label": prev_month_label,
        "month_name": thai_month_name,
        "year_be": thai_year,
        "start_mileage": prev_month_mileage,
        "trips": trips,
        "summary": {
            "total_trips": total_trips,
            "total_distance_km": total_distance,
            "total_fuel_liters": round(total_fuel, 2),
            "driver_name": primary_driver_name
        }
    }

# Settings API
@app.get("/api/settings")
def get_settings():
    api_key = get_setting_val("gemini_api_key", "")
    masked_key = f"{api_key[:6]}...{api_key[-4:]}" if len(api_key) > 10 else ("Configured" if api_key else "")
    gs_url = get_setting_val("google_sheets_url", "")
    masked_gs = f"{gs_url[:20]}...{gs_url[-15:]}" if len(gs_url) > 35 else gs_url
    return {
        "gemini_api_key_set": bool(api_key),
        "gemini_api_key_masked": masked_key,
        "agency_name": get_setting_val("agency_name", "สำนักงานพาณิชย์จังหวัดเพชรบุรี"),
        "default_approver": get_setting_val("default_approver", "หัวหน้ากลุ่มยุทธศาสตร์ฯ"),
        "google_sheets_url": gs_url,
        "google_sheets_set": bool(gs_url),
        "google_sheets_masked": masked_gs
    }

@app.post("/api/settings")
def update_settings(settings: SettingUpdate):
    if settings.gemini_api_key is not None and settings.gemini_api_key.strip():
        set_setting_val("gemini_api_key", settings.gemini_api_key.strip())
    if settings.agency_name:
        set_setting_val("agency_name", settings.agency_name)
    if settings.default_approver:
        set_setting_val("default_approver", settings.default_approver)
    if settings.google_sheets_url is not None:
        set_setting_val("google_sheets_url", settings.google_sheets_url.strip())
    return {"status": "success"}

# -------------------------------------------------------------
# Auth & Security APIs (Moderator PIN & Master Key for พี่ป๋อ)
# -------------------------------------------------------------
@app.post("/api/auth/verify-pin")
def verify_pin(req: VerifyPinRequest):
    pin = req.pin.strip()
    current_mod_pin = get_setting_val("mod_pin", "9999")
    master_pin = get_setting_val("master_pin", "2424")
    
    if pin == "2424" or pin == master_pin:
        return {
            "success": True,
            "role": "master",
            "message": "ยินดีต้อนรับพี่ป๋อครับ (Master Control Access)",
            "current_mod_pin": current_mod_pin,
            "master_pin": "2424"
        }
    elif pin == current_mod_pin or (not current_mod_pin and pin == "9999"):
        return {
            "success": True,
            "role": "moderator",
            "message": "เข้าสู่ระบบเจ้าหน้าที่สำเร็จ"
        }
    else:
        return JSONResponse(
            status_code=401,
            content={"success": False, "message": "รหัส PIN ไม่ถูกต้อง โปรดตรวจสอบอีกครั้ง"}
        )

@app.post("/api/auth/change-pin")
def change_pin(req: ChangePinRequest):
    curr = req.current_pin.strip()
    new_p = req.new_pin.strip()
    
    if not new_p or len(new_p) < 4:
        raise HTTPException(status_code=400, detail="รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 4 หลัก")
    
    current_mod_pin = get_setting_val("mod_pin", "9999")
    master_pin = get_setting_val("master_pin", "2424")
    
    if curr != current_mod_pin and curr != "2424" and curr != master_pin:
        raise HTTPException(status_code=401, detail="รหัสผ่านเดิมไม่ถูกต้อง")
    
    set_setting_val("mod_pin", new_p)
    now_str = datetime.now().strftime("%d/%m/%Y %H:%M:%S")
    set_setting_val("mod_pin_updated_at", now_str)
    
    return {
        "success": True,
        "message": f"เปลี่ยนรหัสผ่านเจ้าหน้าที่เป็น '{new_p}' เรียบร้อยแล้ว",
        "new_pin": new_p,
        "updated_at": now_str
    }

@app.get("/api/auth/mod-pin-status")
def get_mod_pin_status(master_pin: str = ""):
    server_master = get_setting_val("master_pin", "2424")
    if master_pin.strip() != "2424" and master_pin.strip() != server_master:
        raise HTTPException(status_code=403, detail="ต้องใช้ Master PIN ของพี่ป๋อเพื่อดูข้อมูลนี้")
    
    return {
        "success": True,
        "current_mod_pin": get_setting_val("mod_pin", "9999"),
        "master_pin": "2424",
        "updated_at": get_setting_val("mod_pin_updated_at", "ค่าเริ่มต้น (9999)")
    }

@app.post("/api/auth/reset-pin")
def reset_pin(req: ResetPinRequest):
    server_master = get_setting_val("master_pin", "2424")
    if req.master_pin.strip() != "2424" and req.master_pin.strip() != server_master:
        raise HTTPException(status_code=403, detail="ต้องใช้ Master PIN ของพี่ป๋อเพื่อรีเซ็ตรหัสผ่าน")
    
    set_setting_val("mod_pin", "9999")
    now_str = datetime.now().strftime("%d/%m/%Y %H:%M:%S")
    set_setting_val("mod_pin_updated_at", f"{now_str} (รีเซ็ตโดยพี่ป๋อ)")
    
    return {
        "success": True,
        "message": "รีเซ็ตรหัสผ่านเจ้าหน้าที่กลับเป็น '9999' เรียบร้อยแล้ว",
        "mod_pin": "9999",
        "updated_at": now_str
    }


# Google Sheets Endpoints
@app.post("/api/google/sync-all")
def api_google_sync_all():
    return google_sync.full_backup_to_sheets()

@app.post("/api/google/restore")
def api_google_restore():
    return google_sync.restore_from_sheets()

@app.get("/api/google/script-code")
def api_google_script_code():
    script_path = os.path.join(os.path.dirname(__file__), "google_apps_script.js")
    code = ""
    if os.path.exists(script_path):
        with open(script_path, "r", encoding="utf-8") as f:
            code = f.read()
    return {"script_code": code}

# Serve uploaded images
@app.get("/uploads/{filename}")
def serve_upload(filename: str):
    file_path = os.path.join(UPLOAD_DIR, filename)
    if os.path.exists(file_path):
        return FileResponse(file_path)
    return JSONResponse(status_code=404, content={"message": "Image not found"})

# Mount static frontend files
STATIC_DIR = os.path.join(os.path.dirname(__file__), "static")
os.makedirs(STATIC_DIR, exist_ok=True)
app.mount("/", StaticFiles(directory=STATIC_DIR, html=True), name="static")

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8088))
    uvicorn.run("server:app", host="0.0.0.0", port=port, reload=True)
