import io
import os
import re
import json
import base64
import urllib.request
import urllib.error
from datetime import datetime
from PIL import Image, ExifTags, ImageOps

def extract_exif_datetime(image_bytes: bytes) -> dict:
    """
    Extracts Date and Time from photo's EXIF metadata.
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

        dt_str = exif_dict.get("DateTimeOriginal") or exif_dict.get("DateTimeDigitized") or exif_dict.get("DateTime")
        
        if dt_str:
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


def optimize_image_for_ai(image_bytes: bytes) -> tuple[bytes, str]:
    """
    Auto-rotates image (EXIF transpose) and resizes to optimal dimension (max 1600px)
    to guarantee fast AI processing and prevent payload timeout.
    """
    try:
        image = Image.open(io.BytesIO(image_bytes))
        # Auto transpose rotation based on EXIF tag
        image = ImageOps.exif_transpose(image)
        
        # Convert RGBA/P to RGB if needed
        if image.mode in ("RGBA", "P"):
            image = image.convert("RGB")
            
        # Resize if larger than 1600px
        max_dim = 1600
        if max(image.size) > max_dim:
            image.thumbnail((max_dim, max_dim), Image.Resampling.LANCZOS)
            
        buf = io.BytesIO()
        image.save(buf, format="JPEG", quality=85, optimize=True)
        return buf.getvalue(), "image/jpeg"
    except Exception as e:
        print(f"Image optimization error: {e}")
        return image_bytes, "image/jpeg"


def parse_clean_json(text: str) -> dict:
    """
    Safely parses JSON from AI response, stripping markdown code blocks.
    """
    clean_text = text.strip()
    if clean_text.startswith("```json"):
        clean_text = clean_text[7:]
    elif clean_text.startswith("```"):
        clean_text = clean_text[3:]
    if clean_text.endswith("```"):
        clean_text = clean_text[:-3]
    clean_text = clean_text.strip()
    
    match = re.search(r'\{.*\}', clean_text, re.DOTALL)
    if match:
        clean_text = match.group(0)
        
    return json.loads(clean_text)


def analyze_dashboard_image(image_bytes: bytes, mime_type: str = "image/jpeg", api_key: str = None) -> dict:
    """
    Analyzes car dashboard / odometer image using Gemini Vision AI + EXIF extraction.
    """
    # 1. First extract EXIF metadata
    exif_result = extract_exif_datetime(image_bytes)
    extracted_date = exif_result["date"]
    extracted_time = exif_result["time"]
    dt_source = exif_result["source"]

    # 2. Optimize and auto-rotate image for AI
    optimized_bytes, opt_mime = optimize_image_for_ai(image_bytes)

    # 3. Check Gemini API Key
    gemini_key = api_key or os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")
    
    if not gemini_key:
        return {
            "success": True,
            "mileage": None,
            "extracted_date": extracted_date,
            "extracted_time": extracted_time,
            "date_time_source": dt_source,
            "note": "⚠️ ยังไม่ได้ใส่ GEMINI_API_KEY ใน Render (กรุณาพิมพ์เลขไมล์เอง)"
        }

    # Clean key if there are accidental spaces
    gemini_key = gemini_key.strip()

    models_to_try = ["gemini-1.5-flash", "gemini-2.0-flash", "gemini-1.5-pro"]
    
    prompt = """
You are an expert OCR system specialized in vehicle instrument clusters, dashboards, and digital odometers.
Look at this dashboard photo very carefully.

Find the TOTAL ODOMETER MILEAGE (in kilometers):
- Look at the central digital screen, LCD display, or the odometer area at the bottom of the speedometer/cluster.
- Find the total vehicle distance number (usually 4 to 6 digits, e.g. 52204, 63941, 114520, etc., often next to "km" or "ODO").
- Do not confuse with trip meter (Trip A/B) unless it is the only mileage displayed.
- Also look for digital clock time (e.g. 10:05, 08:30) and date if displayed.

Output strictly valid JSON with this exact schema:
{
  "mileage": 63941,
  "clock_time": "10:05",
  "date": null,
  "confidence": "high",
  "all_numbers_seen": ["63941", "31°C", "10:05"]
}
"""

    b64_image = base64.b64encode(optimized_bytes).decode('utf-8')
    error_details = []

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
                                    "mime_type": opt_mime,
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
                parsed = parse_clean_json(candidate_text)
                
                # Parse mileage
                raw_mileage = parsed.get("mileage")
                mileage_int = None
                if raw_mileage is not None:
                    digits = re.sub(r'[^\d]', '', str(raw_mileage))
                    if digits:
                        mileage_int = int(digits)

                # Visual clock
                if parsed.get("clock_time") and not extracted_time:
                    extracted_time = parsed.get("clock_time")
                    dt_source = "หน้าปัดรถยนต์"
                
                if parsed.get("date") and not extracted_date:
                    extracted_date = parsed.get("date")
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

        except urllib.error.HTTPError as he:
            err_body = he.read().decode('utf-8', errors='ignore')
            error_details.append(f"HTTP {he.code}: {err_body[:80]}")
        except Exception as e:
            error_details.append(str(e))

    # Return error feedback clearly
    combined_err = " | ".join(error_details)
    return {
        "success": False,
        "mileage": None,
        "extracted_date": extracted_date,
        "extracted_time": extracted_time,
        "date_time_source": dt_source,
        "note": f"ข้อผิดพลาดจาก AI: {combined_err}" if combined_err else "ไม่สามารถเชื่อมต่อ AI ได้"
    }
