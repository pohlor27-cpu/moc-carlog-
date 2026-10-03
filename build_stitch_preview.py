import os
import re

STITCH_SRC = os.path.join(os.path.dirname(__file__), "stitch_app", "src")
OUTPUT_HTML = os.path.join(os.path.dirname(__file__), "static", "stitch_preview.html")

def clean_tsx(content):
    # Remove imports and exports
    content = re.sub(r'import\s+.*?from\s+[\'"].*?[\'"];?', '', content)
    content = re.sub(r'import\s+[\'"].*?[\'"];?', '', content)
    content = re.sub(r'export\s+default\s+', '', content)
    content = re.sub(r'export\s+(const|function|interface|type|enum)\s+', r'\1 ', content)
    return content

def compile_stitch_app():
    # Read mockData
    with open(os.path.join(STITCH_SRC, "types.ts"), "r", encoding="utf-8") as f:
        types_code = clean_tsx(f.read())
    with open(os.path.join(STITCH_SRC, "data", "mockData.ts"), "r", encoding="utf-8") as f:
        mock_code = clean_tsx(f.read())
        
    components = [
        "Toast.tsx",
        "Header.tsx",
        "BottomNav.tsx",
        "EditMileageModal.tsx",
        "PdfExportModal.tsx",
        "LineShareModal.tsx",
        "PinModal.tsx",
        "ReceiptModal.tsx",
        "SignatureModal.tsx",
        "TripDetailModal.tsx",
        "ActionModal.tsx",
        "HomeLogScreen.tsx",
        "TripHistoryScreen.tsx",
        "MaintenanceScreen.tsx",
        "OfficerDashboardScreen.tsx",
    ]
    
    comp_codes = []
    for comp in components:
        path = os.path.join(STITCH_SRC, "components", comp)
        if os.path.exists(path):
            with open(path, "r", encoding="utf-8") as f:
                comp_codes.append(f"/* === {comp} === */\n" + clean_tsx(f.read()))
                
    with open(os.path.join(STITCH_SRC, "App.tsx"), "r", encoding="utf-8") as f:
        app_code = "/* === App.tsx === */\n" + clean_tsx(f.read())

    comp_joined = "\n".join(comp_codes)
    all_ts = f"""
const {{ useState, useEffect, useMemo, useRef, useCallback }} = React;

{types_code}
{mock_code}
{comp_joined}
{app_code}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
"""

    html_template = f"""<!DOCTYPE html>
<html lang="th">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>ระบบบันทึกการใช้รถยนต์ราชการ (แบบ 4) - สำนักงานพาณิชย์จังหวัดเพชรบุรี</title>
    <!-- Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Prompt:wght@300;400;500;600;700&family=Sarabun:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" />
    
    <!-- Tailwind CSS CDN -->
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
        tailwind.config = {{
            darkMode: 'class',
            theme: {{
                extend: {{
                    colors: {{
                        'civic-navy': '#0D3B66',
                        'civic-navy-dark': '#08213B',
                        'civic-navy-light': '#E9F2FA',
                        'slate-card-dark': '#1E293B',
                        'slate-surface': '#FFFFFF',
                        'slate-muted': '#64748B',
                        'slate-border': '#E2E8F0',
                        'slate-bg': '#F8FAFC',
                        'emerald-active': '#059669',
                        'emerald-active-bg': '#ECFDF5',
                        'amber-warning': '#D97706',
                        'amber-warning-bg': '#FFFBEB',
                        'line-green': '#06C755',
                        'secondary-fixed': '#85f8c4',
                        'surface': '#f9f9ff',
                        'surface-container-low': '#f0f3ff',
                        'surface-container-high': '#dee8ff',
                        'surface-container-highest': '#d8e3fb',
                        'surface-container': '#e7eeff',
                        'surface-container-lowest': '#ffffff',
                        'on-surface': '#111c2d',
                        'on-surface-variant': '#42474f',
                        'on-primary': '#ffffff',
                        'on-primary-container': '#81a6d7',
                        'primary': '#002546',
                        'primary-fixed-dim': '#a4c9fc',
                        'tertiary': '#00263e',
                        'tertiary-container': '#003d5f',
                        'tertiary-fixed': '#cce5ff',
                        'secondary': '#006c4a',
                    }},
                    fontFamily: {{
                        headline: ['"Plus Jakarta Sans"', 'Prompt', 'sans-serif'],
                        body: ['Prompt', 'Sarabun', 'sans-serif'],
                        odometer: ['"Plus Jakarta Sans"', 'monospace'],
                    }}
                }}
            }}
        }}
    </script>
    
    <!-- React, ReactDOM, Babel for in-browser JSX/TypeScript execution -->
    <script src="https://unpkg.com/react@18/umd/react.production.min.js" crossorigin></script>
    <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js" crossorigin></script>
    <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>

    <style>
        * {{
            box-sizing: border-box;
            -webkit-tap-highlight-color: transparent;
        }}
        body {{
            margin: 0;
            padding: 0;
            font-family: 'Prompt', -apple-system, BlinkMacSystemFont, sans-serif;
            background-color: #f0f4f9;
            color: #111c2d;
            overscroll-behavior: none;
        }}
        .material-symbols-outlined {{
            font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
            user-select: none;
            display: inline-flex;
            align-items: center;
            justify-content: center;
        }}
        .no-scrollbar::-webkit-scrollbar {{
            display: none;
        }}
        .no-scrollbar {{
            -ms-overflow-style: none;
            scrollbar-width: none;
        }}
        @media print {{
            body {{ background-color: white !important; }}
            header, nav, .no-print {{ display: none !important; }}
            main {{ padding-top: 0 !important; padding-bottom: 0 !important; }}
        }}
    </style>
</head>
<body class="bg-[#f0f4f9] text-[#111c2d] min-h-screen flex justify-center">
    <div id="root" class="w-full max-w-md min-h-screen bg-white shadow-2xl relative flex flex-col"></div>

    <script type="text/babel" data-presets="typescript,react">
{all_ts}
    </script>
</body>
</html>"""

    with open(OUTPUT_HTML, "w", encoding="utf-8") as f:
        f.write(html_template)
    print(f"Stitch standalone preview created at: {{OUTPUT_HTML}}")

if __name__ == "__main__":
    compile_stitch_app()
