import io
import os
import re
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
                "source": "EXIF (ข้อมูลรูปถ่าย)"
            }
    except Exception as e:
        print(f"EXIF parsing error: {e}")
    
    return {"date": None, "time": None, "source": None}


def parse_clean_json(text: str) -> dict:
    """
    Safely parses JSON from AI response, stripping markdown code blocks if present.
    """
    clean_text = text.strip()
    if clean_text.startswith("```json"):
        clean_text = clean_text[7:]
    elif clean_text.startswith("```"):
        clean_text = clean_text[3:]
    if clean_text.endswith("```"):
        clean_text = clean_text[:-3]
    clean_text = clean_text.strip()
    
    # Extract json block with regex if still not clean
    match = re.search(r'\{.*\}', clean_text, re.DOTALL)
    if match:
        clean_text = match.group(0)
        
    return json.loads(clean_text)


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
            "note": "ยังไม่ได้ตั้งค่า GEMINI_API_KEY (กรุณากรอกเลขไมล์ด้วยตนเอง)"
        }

    # Try Gemini Models (gemini-1.5-flash then fallback to gemini-2.0-flash / gemini-1.5-pro)
    models_to_try = ["gemini-1.5-flash", "gemini-2.0-flash", "gemini-1.5-pro"]
    
    prompt = """
Analyze this vehicle dashboard/odometer photo very carefully.
Extract the following information:
1. "mileage": The main total odometer reading in kilometers (integer only, ignore decimals like .5 or trip meter A/B unless it is total ODO). Total mileage is usually 5-6 digits (e.g. 52204, 114500). If unsure between trip meter and total odo, choose the largest total number.
2. "detected_clock_time": Clock time shown visually on the car dashboard or digital display or timestamp camera watermark (e.g. "08:35", or null if not found).
3. "detected_date": Date shown visually on display or watermark (e.g. "2026-10-01" or "01/10/2026", or null).
4. "confidence": "high", "medium", or "low".

Return strictly valid JSON only:
{
  "mileage": 52204,
  "detected_clock_time": "08:35",
  "detected_date": null,
  "confidence": "high"
}
"""

    b64_image = base64.b64encode(image_bytes).decode('utf-8')
    last_err = ""

    for model_name in models_to_try:
        try:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={gemini_key}"
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
            with urllib.request.urlopen(req, timeout=25) as response:
                result = json.loads(response.read().decode('utf-8'))
                candidate_text = result["candidates"][0]["content"]["parts"][0]["text"]
                parsed = parse_clean_json(candidate_text)
                
                # Parse mileage
                raw_mileage = parsed.get("mileage")
                mileage_int = None
                if raw_mileage is not None:
                    # Clean any non-digit chars
                    digits = re.sub(r'[^\d]', '', str(raw_mileage))
                    if digits:
                        mileage_int = int(digits)

                # Visual clock
                if parsed.get("detected_clock_time") and not extracted_time:
                    extracted_time = parsed.get("detected_clock_time")
                    dt_source = "นาฬิกาบนหน้าปัดรถ"
                
                if parsed.get("detected_date") and not extracted_date:
                    extracted_date = parsed.get("detected_date")
                    dt_source = "วันที่บนภาพ"

                return {
                    "success": True,
                    "mileage": mileage_int,
                    "extracted_date": extracted_date,
                    "extracted_time": extracted_time,
                    "date_time_source": dt_source,
                    "confidence": parsed.get("confidence", "high"),
                    "note": f"AI อ่านเลขไมล์สำเร็จ: {mileage_int:,} กม." if mileage_int else "AI วิเคราะห์ภาพแล้ว ไม่พบตัวเลขไมล์ชัดเจน"
                }

        except Exception as e:
            last_err = str(e)
            continue

    return {
        "success": True,
        "mileage": None,
        "extracted_date": extracted_date,
        "extracted_time": extracted_time,
        "date_time_source": dt_source,
        "note": f"ดึงข้อมูลวันเวลาสำเร็จ ({dt_source or 'ระบบ'})" if extracted_date else f"เกิดข้อผิดพลาดในการเชื่อมต่อ AI: {last_err}"
    }
