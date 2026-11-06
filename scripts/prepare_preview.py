"""Build a fork preview, with its own URL and without the production counter."""
import os
from pathlib import Path
import shutil
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]
env = dict(os.environ, AISLE_SITE_URL="https://yangsen-hub-dot.github.io/AISLE",
           AISLE_COUNTER_ENDPOINT="")
subprocess.run([sys.executable, "-X", "utf8", str(ROOT / "scripts/build_site.py")],
               cwd=ROOT, env=env, check=True)
target = ROOT / ".qa/pages-site"
if target.exists():
    if target.resolve() != ROOT / ".qa/pages-site" or target.is_symlink():
        raise SystemExit("Unexpected preview output path.")
    if (target / ".git").exists():
        raise SystemExit("Preview output contains Git state; retain it and use another output directory.")
    shutil.rmtree(target)
shutil.copytree(ROOT / "dist", target)
(target / "CNAME").unlink(missing_ok=True)
(target / ".nojekyll").write_text("", encoding="utf-8")
print(f"Prepared GitHub Pages preview: {target}")
