#!/usr/bin/env python3
"""导出 OpenAPI 文档到 docs 目录"""
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.main import app

DOCS_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "docs")
os.makedirs(DOCS_DIR, exist_ok=True)

schema = app.openapi()
schema_json = json.dumps(schema, ensure_ascii=False, indent=2)

# 1. openapi.json
output_path = os.path.join(DOCS_DIR, "openapi.json")
with open(output_path, "w", encoding="utf-8") as f:
    f.write(schema_json)
print(f"已生成: {output_path}")

# 2. 自包含 HTML（内嵌 schema，可直接双击打开）
html_path = os.path.join(DOCS_DIR, "index.html")
safe_spec = schema_json.replace("<", "\\u003c").replace(">", "\\u003e")
html_content = f"""<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>仓库管理 API 文档</title>
  <link rel="stylesheet" href="https://unpkg.com/redoc@2.1.3/bundles/redoc.standalone.css">
</head>
<body>
  <div id="redoc-container"></div>
  <script type="application/json" id="spec-json">{safe_spec}</script>
  <script src="https://unpkg.com/redoc@2.1.3/bundles/redoc.standalone.js"></script>
  <script>
    var spec = JSON.parse(document.getElementById('spec-json').textContent);
    Redoc.init(spec, {{}}, document.getElementById('redoc-container'));
  </script>
</body>
</html>"""

with open(html_path, "w", encoding="utf-8") as f:
    f.write(html_content)
print(f"已生成: {html_path}")

print("\n查看方式：")
print("  1. 双击 docs/index.html 在浏览器中打开（需联网加载 Redoc）")
print("  2. 或启动服务后访问 http://localhost:8000/docs (Swagger UI)")
