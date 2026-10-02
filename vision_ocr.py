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
    Auto-rotates image (EXIF transpose) and resizes to max 1280px
    to guarantee fast AI processing.
    """
    try:
        image = Image.open(io.BytesIO(image_bytes))
        image = ImageOps.exif_transpose(image)
        
        if image.mode in ("RGBA", "P"):
            image = image.convert("RGB")
            
        max_dim = 1280
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
    Safely parses JSON from AI response.
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

    # 2. Optimize image
    optimized_bytes, opt_mime = optimize_image_for_ai(image_bytes)

    # 3. Check Gemini API Key
    gemini_key = api_key or os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")
    
    if not gemini_key:
        return {
            "success": False,
            "mileage": None,
            "extracted_date": extracted_date,
            "extracted_time": extracted_time,
            "date_time_source": dt_source,
            "note": "⚠️ ยังไม่ได้ใส่ GEMINI_API_KEY ใน Render"
        }

    gemini_key = gemini_key.strip()

    # List of API Endpoints and Models to try in sequence
    endpoints_to_try = [
        ("v1beta", "gemini-1.5-flash-latest"),
        ("v1beta", "gemini-1.5-flash"),
        ("v1", "gemini-1.5-flash"),
        ("v1beta", "gemini-2.0-flash"),
        ("v1beta", "gemini-2.0-flash-exp"),
        ("v1beta", "gemini-1.5-flash-8b"),
        ("v1beta", "gemini-1.5-pro"),
    ]
    
    prompt = """
Look at this vehicle dashboard/instrument cluster photo very carefully.
Find the TOTAL ODOMETER MILEAGE in kilometers:
- Look at the central digital screen, LCD display, or odometer box (often labeled ODO or next to km, e.g. ODO 65650 km, 52204, etc.).
- Output the exact total odometer reading integer.
- Also look for digital clock time if visible (e.g. 10:57).

Return strictly JSON format only:
{
  "mileage": 65650,
  "clock_time": "10:57",
  "confidence": "high"
}
"""

    b64_image = base64.b64encode(optimized_bytes).decode('utf-8')
    error_details = []

    for api_ver, model_name in endpoints_to_try:
        try:
            url = f"https://generativelanguage.googleapis.com/{api_ver}/models/{model_name}:generateContent?key={gemini_key}"
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

                if parsed.get("clock_time") and not extracted_time:
                    extracted_time = parsed.get("clock_time")
                    dt_source = "หน้าปัดรถยนต์"

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
            error_details.append(f"{model_name}({api_ver}): HTTP {he.code}")
        except Exception as e:
            error_details.append(f"{model_name}: {str(e)}")

    return {
        "success": False,
        "mileage": None,
        "extracted_date": extracted_date,
        "extracted_time": extracted_time,
        "date_time_source": dt_source,
        "note": f"ข้อผิดพลาดจาก AI: {' | '.join(error_details[:3])}"
    }
