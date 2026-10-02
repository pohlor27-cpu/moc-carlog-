import io
import os
import re
import json
import base64
import urllib.request
import urllib.error
from datetime import datetime
from PIL import Image, ExifTags, ImageOps

# In-memory cache for discovered working model
CACHED_WORKING_MODEL = None

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
    Auto-rotates image (EXIF transpose) and resizes to max 1280px.
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


def discover_available_models(api_key: str) -> list[str]:
    """
    Queries Google API to discover exact available vision models for this API key.
    """
    global CACHED_WORKING_MODEL
    if CACHED_WORKING_MODEL:
        return [CACHED_WORKING_MODEL]

    found_models = []
    for api_ver in ["v1beta", "v1"]:
        try:
            url = f"https://generativelanguage.googleapis.com/{api_ver}/models?key={api_key}"
            req = urllib.request.Request(url, headers={"Content-Type": "application/json"}, method='GET')
            with urllib.request.urlopen(req, timeout=10) as response:
                res_data = json.loads(response.read().decode('utf-8'))
                for m in res_data.get("models", []):
                    methods = m.get("supportedGenerationMethods", [])
                    if "generateContent" in methods:
                        # Extract model name (e.g. models/gemini-1.5-flash or gemini-1.5-flash)
                        name = m.get("name", "")
                        if "flash" in name.lower() or "vision" in name.lower() or "gemini" in name.lower():
                            found_models.append(name)
        except Exception as e:
            print(f"ListModels error on {api_ver}: {e}")

    return found_models


def analyze_dashboard_image(image_bytes: bytes, mime_type: str = "image/jpeg", api_key: str = None) -> dict:
    """
    Analyzes car dashboard / odometer image using Gemini Vision AI + EXIF extraction.
    Dynamically auto-discovers supported models to prevent 404 errors.
    """
    global CACHED_WORKING_MODEL

    # 1. Extract EXIF metadata
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

    prompt = """
You are an expert OCR system for car instrument clusters and dashboards.
Analyze this dashboard photo carefully:
1. "mileage": Find the TOTAL vehicle accumulated odometer mileage (ODO / Total km).
   - Look for 4 to 6 digit integer numbers (e.g., 52204, 65650, 114280).
   - Distinguish carefully from TRIP meters (Trip A/B), Range, or Speedometer (km/h).
   - Return only the main integer number.
2. "clock_time": Digital clock time shown on the dashboard (e.g. "09:45", "14:20") if visible.
3. "confidence": "high", "medium", or "low".

Return strictly JSON format:
{
  "mileage": 52204,
  "clock_time": "14:20",
  "confidence": "high"
}
"""

    b64_image = base64.b64encode(optimized_bytes).decode('utf-8')
    
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

    # Discover models supported for this specific key
    candidate_models = discover_available_models(gemini_key)
    
    # Priority fallback list
    priority_models = [
        "models/gemini-2.0-flash",
        "models/gemini-1.5-flash",
        "models/gemini-1.5-flash-latest",
        "models/gemini-2.0-flash-exp",
        "models/gemini-1.5-pro"
    ]
    
    # Merge discovered with priority
    combined_models = []
    for m in candidate_models + priority_models:
        if m not in combined_models:
            combined_models.append(m)

    error_details = []

    for model_path in combined_models:
        clean_model = model_path if model_path.startswith("models/") else f"models/{model_path}"
        
        for api_ver in ["v1beta", "v1"]:
            try:
                url = f"https://generativelanguage.googleapis.com/{api_ver}/{clean_model}:generateContent?key={gemini_key}"
                headers = {
                    "Content-Type": "application/json",
                    "x-goog-api-key": gemini_key
                }

                req = urllib.request.Request(url, data=json.dumps(payload).encode('utf-8'), headers=headers, method='POST')
                with urllib.request.urlopen(req, timeout=25) as response:
                    result = json.loads(response.read().decode('utf-8'))
                    candidate_text = result["candidates"][0]["content"]["parts"][0]["text"]
                    
                    # Parse JSON or regex fallback
                    parsed = {}
                    try:
                        parsed = parse_clean_json(candidate_text)
                    except Exception:
                        # Regex fallback if JSON was dirty
                        mileage_match = re.search(r'"mileage"\s*:\s*(\d+)', candidate_text)
                        if mileage_match:
                            parsed["mileage"] = int(mileage_match.group(1))
                        clock_match = re.search(r'"clock_time"\s*:\s*"([^"]+)"', candidate_text)
                        if clock_match:
                            parsed["clock_time"] = clock_match.group(1)
                    
                    raw_mileage = parsed.get("mileage")
                    mileage_int = None
                    if raw_mileage is not None:
                        digits = re.sub(r'[^\d]', '', str(raw_mileage))
                        if digits:
                            mileage_int = int(digits)

                    if parsed.get("clock_time") and not extracted_time:
                        extracted_time = parsed.get("clock_time")
                        dt_source = "หน้าปัดรถยนต์"

                    # Cache working model
                    CACHED_WORKING_MODEL = clean_model

                    return {
                        "success": True,
                        "mileage": mileage_int,
                        "extracted_date": extracted_date,
                        "extracted_time": extracted_time,
                        "date_time_source": dt_source,
                        "confidence": parsed.get("confidence", "high"),
                        "note": f"AI อ่านเลขไมล์สำเร็จ: {mileage_int:,} กม." if mileage_int else "AI วิเคราะห์ภาพแล้ว ไม่พบตัวเลขไมล์ชัดเจน (สามารถพิมพ์ระบุเองได้)"
                    }

            except urllib.error.HTTPError as he:
                err_body = he.read().decode('utf-8', errors='ignore')
                try:
                    err_json = json.loads(err_body)
                    msg = err_json.get("error", {}).get("message", f"HTTP {he.code}")
                except Exception:
                    msg = f"HTTP {he.code}: {err_body[:80]}"
                error_details.append(f"{clean_model}: {msg}")
            except Exception as e:
                error_details.append(f"{clean_model}: {str(e)}")

    # Clear cache if all attempts failed
    CACHED_WORKING_MODEL = None

    return {
        "success": False,
        "mileage": None,
        "extracted_date": extracted_date,
        "extracted_time": extracted_time,
        "date_time_source": dt_source,
        "note": f"⚠️ ไม่สามารถเรียก AI ได้: {error_details[0] if error_details else 'เชื่อมต่อไม่สำเร็จ'}"
    }
