import base64, json, sys, urllib.request

KEY = "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"
IMAGE = "design/aurel-dashboard/Aurel Dashboard UX.png"
MODEL = sys.argv[1] if len(sys.argv) > 1 else "meta/llama-3.2-90b-vision-instruct"

with open(IMAGE, "rb") as f:
    b64 = base64.b64encode(f.read()).decode()

prompt = """You are a UI design spec extractor. Analyze this dashboard UI design image and produce a precise, structured design specification that an Angular Material M3 developer can implement exactly. Cover:

1. COLOR PALETTE: exact hex colors for background(s), surface/cards, primary accent, secondary/tertiary, text (primary/secondary/muted), borders, sidebar/nav, status colors. Distinguish light/dark theme.
2. LAYOUT & NAVIGATION: sidebar vs topbar, logo/brand area, nav item style, content area structure, grid/cards arrangement, spacing, border-radius, shadows.
3. TYPOGRAPHY: font families, heading sizes, body size, font weights, letter-spacing.
4. COMPONENTS: cards, buttons, charts (type), tables, avatars, stat widgets, headers, footer — with their visual treatment.
5. ICONS: style/provider if visible.
6. OVERALL STYLE: minimal/flat, glassmorphism, modern, etc. Any gradients, glows.
7. What app is this dashboard for? Brand name, purpose, title shown.

Be exhaustive and exact with hex codes. Output as structured markdown with sections."""

payload = {
    "model": MODEL,
    "messages": [{
        "role": "user",
        "content": [
            {"type": "text", "text": prompt},
            {"type": "image_url", "image_url": {"url": f"data:image/png;base64,{b64}"}}
        ]
    }],
    "max_tokens": 4000,
    "temperature": 0.2,
}

req = urllib.request.Request(
    "https://integrate.api.nvidia.com/v1/chat/completions",
    data=json.dumps(payload).encode(),
    headers={"Authorization": f"Bearer {KEY}", "Content-Type": "application/json"},
)
try:
    with urllib.request.urlopen(req, timeout=300) as r:
        resp = json.load(r)
    print(resp["choices"][0]["message"]["content"])
except urllib.error.HTTPError as e:
    print("HTTP", e.code, e.read().decode()[:2000])
