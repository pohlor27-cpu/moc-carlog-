import os
import sys
import json
import subprocess
from fastapi import APIRouter, HTTPException, Body
from pydantic import BaseModel
from typing import Optional

router = APIRouter(prefix="/api/stitch", tags=["stitch-bridge"])

class StitchImportPayload(BaseModel):
    html: Optional[str] = ""
    css: Optional[str] = ""
    component_name: Optional[str] = "custom_stitch_ui"
    title: Optional[str] = "Stitch UI Update"

@router.post("/import")
async def import_from_stitch(payload: StitchImportPayload):
    """
    Direct Webhook / API endpoint for Google Stitch automated integration.
    Receives generated HTML/CSS from Stitch, updates the preview/components,
    and auto-commits/pushes to GitHub for Render CI/CD auto-deployment.
    """
    try:
        static_dir = os.path.join(os.path.dirname(__file__), "static")
        os.makedirs(static_dir, exist_ok=True)
        
        # Save raw stitch preview
        preview_file = os.path.join(static_dir, "stitch_preview.html")
        full_html = f"""<!DOCTYPE html>
<html lang="th">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Stitch Live Preview - {payload.title}</title>
    <link href="https://fonts.googleapis.com/css2?family=Prompt:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <style>
        {payload.css}
    </style>
</head>
<body>
    {payload.html}
</body>
</html>"""
        with open(preview_file, "w", encoding="utf-8") as f:
            f.write(full_html)

        # Optional auto-git commit & push if git is available
        try:
            repo_dir = os.path.dirname(__file__)
            subprocess.run(["git", "add", "static/stitch_preview.html"], cwd=repo_dir, check=False)
            subprocess.run(["git", "commit", "-m", f"feat(stitch): auto-import UI design '{payload.title}' from Google Stitch"], cwd=repo_dir, check=False)
            subprocess.run(["git", "push", "origin", "main"], cwd=repo_dir, check=False)
        except Exception as git_err:
            print("[Stitch Bridge] Git auto-push skipped:", git_err)

        return {
            "status": "success",
            "message": f"Successfully imported '{payload.title}' from Stitch!",
            "preview_url": "/stitch_preview.html",
            "render_url": "https://moc-carlog.onrender.com/stitch_preview.html"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
