import io
import os
import json
import base64
import urllib.request
import urllib.error
from datetime import datetime
from PIL import Image, ExifTags

def extract_exif_datetime(image_bytes: bytes) -> dict:
    """
    Extracts Date and Time from photo's EXIF metadata (camera/phone snapshot timestamp).
    """
    try:
        image = Image.open(io.BytesIO(image_bytes))
        exif = image._getexif()
        if not exif:
            return {"date": None, "time": None, "source": None}

        exif_dict = {}
        for tag, value in exif.items():
            decoded = ExifTags.TAGS.get(tag, tag)
            exif_dict[decoded] = value

        # Tags often used: DateTimeOriginal, DateTimeDigitized, DateTime
        dt_str = exif_dict.get("DateTimeOriginal") or exif_dict.get("DateTimeDigitized") or exif_dict.get("DateTime")
        
        if dt_str:
            # Standard EXIF format is 'YYYY:MM:DD HH:MM:SS'
            dt_parts = str(dt_str).strip().split(" ")
            date_part = dt_parts[0].replace(":", "-") # YYYY-MM-DD
            time_part = ":".join(dt_parts[1].split(":")[:2]) if len(dt_parts) > 1 else None # HH:MM
            return {
                "date": date_part,
                "time": time_part,
                "source": "EXIF Metadata (กล้องมือถือ)"
            }
    except Exception as e:
        print(f"EXIF parsing error: {e}")
    
    return {"date": None, "time": None, "source": None}


def analyze_dashboard_image(image_bytes: bytes, mime_type: str = "image/jpeg", api_key: str = None) -> dict:
    """
    Analyzes car dashboard / odometer image using Gemini Vision AI + EXIF extraction.
    Returns:
    {
        "success": bool,
        "mileage": int | None,
        "extracted_date": str | None (YYYY-MM-DD),
        "extracted_time": str | None (HH:MM),
        "date_time_source": str | None,
        "confidence": str,
        "note": str
    }
    """
    # 1. First, try reading EXIF metadata from photo
    exif_result = extract_exif_datetime(image_bytes)
    extracted_date = exif_result["date"]
    extracted_time = exif_result["time"]
    dt_source = exif_result["source"]

    # 2. Check Gemini API Key
    gemini_key = api_key or os.environ.get("GEMINI_API_KEY")
    
    if not gemini_key:
        return {
            "success": True,
            "mileage": None,
            "extracted_date": extracted_date,
            "extracted_time": extracted_time,
            "date_time_source": dt_source,
            "note": f"ตรวจพบวัน/เวลาจากรูป: {extracted_date or ''} {extracted_time or ''}" if extracted_date else "กรุณาระบุ Gemini API Key ในการตั้งค่าเพื่อเปิดระบบ AI อ่านเลขไมล์จากภาพ"
        }

    try:
        b64_image = base64.b64encode(image_bytes).decode('utf-8')
        
        prompt = """
Analyze this car dashboard/instrument cluster photo carefully.
Extract the following:
1. "mileage": The main total odometer reading in kilometers (integer only, ignore decimals or TRIP meters unless it is total ODO). Total mileage is usually 5 to 6 digits like 52204.
2. "detected_clock_time": Clock time shown visually on the car dashboard/display/screen or timestamp watermark (e.g., "08:35", or null if not found).
3. "detected_date": Date shown visually on the car dashboard or watermark (e.g., "2026-10-01" or "01/10/2026", or null).
4. "confidence": "high", "medium", or "low".

Return ONLY strict JSON:
{
  "mileage": 52204,
  "detected_clock_time": "08:35",
  "detected_date": null,
  "confidence": "high"
}
"""
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={gemini_key}"
        headers = {"Content-Type": "application/json"}
        payload = {
            "contents": [
                {
                    "parts": [
                        {"text": prompt},
                        {
                            "inline_data": {
                                "mime_type": mime_type,
                                "data": b64_image
                            }
                        }
                    ]
                }
            ],
            "generationConfig": {
                "response_mime_type": "application/json",
                "temperature": 0.1
            }
        }

        req = urllib.request.Request(url, data=json.dumps(payload).encode('utf-8'), headers=headers, method='POST')
        with urllib.request.urlopen(req, timeout=20) as response:
            result = json.loads(response.read().decode('utf-8'))
            candidate_text = result["candidates"][0]["content"]["parts"][0]["text"]
            parsed = json.loads(candidate_text)
            
            mileage = parsed.get("mileage")
            
            # If dashboard visual clock is found, we can use or prioritize it
            if parsed.get("detected_clock_time") and not extracted_time:
                extracted_time = parsed.get("detected_clock_time")
                dt_source = "หน้าปัดรถยนต์ (Digital Clock)"
            
            if parsed.get("detected_date") and not extracted_date:
                extracted_date = parsed.get("detected_date")
                dt_source = "หน้าปัด/Timestamp บนภาพ"

            return {
                "success": True,
                "mileage": mileage,
                "extracted_date": extracted_date,
                "extracted_time": extracted_time,
                "date_time_source": dt_source,
                "confidence": parsed.get("confidence", "high"),
                "note": f"AI ดึงเลขไมล์ {mileage or ''} และเวลา {extracted_time or ''} สำเร็จ"
            }
            
    except Exception as e:
        return {
            "success": True,
            "mileage": None,
            "extracted_date": extracted_date,
            "extracted_time": extracted_time,
            "date_time_source": dt_source,
            "error": str(e),
            "note": "ดึงวันเวลาจากข้อมูลภาพเรียบร้อย"
        }
