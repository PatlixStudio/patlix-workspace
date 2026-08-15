import base64, json, sys, urllib.request

KEY = "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"
IMAGE = "design/aurel-dashboard/Aurel Dashboard UX.png"
MODEL = sys.argv[1]

with open(IMAGE, "rb") as f:
    b64 = base64.b64encode(f.read()).decode()

prompt = sys.stdin.read()

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
