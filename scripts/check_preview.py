"""Check the exact artifact uploaded to the fork's GitHub Pages site."""
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import unquote, urlsplit

ROOT = Path(__file__).resolve().parents[1] / ".qa/pages-preview"
BASE = "https://yangsen-hub-dot.github.io/AISLE"
assert ROOT.is_dir(), "Build the preview before checking it."
assert not (ROOT / "CNAME").exists(), "A fork preview must not claim the upstream domain."
assert (ROOT / ".nojekyll").exists()
assert not (ROOT / ".git").exists()
for name in ["src", "scripts", ".github", ".qa", "node_modules"]:
    assert not (ROOT / name).exists(), f"Unexpected source directory: {name}"

class Page(HTMLParser):
    def __init__(self, path):
        super().__init__()
        self.path = path
        self.ids = set()
        self.refs = []
        self.feed(path.read_text(encoding="utf-8"))

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if "id" in a:
            assert a["id"] not in self.ids, f"Duplicate ID in {self.path.name}"
            self.ids.add(a["id"])
        self.refs += [a[key] for key in ("href", "src") if a.get(key)]

pages = {p.resolve(): Page(p) for p in [*ROOT.glob("*.html"), ROOT / "flow/index.html"]}
for path, page in pages.items():
    for ref in page.refs:
        url = urlsplit(ref)
        if url.scheme or url.netloc:
            continue
        target = (path.parent / unquote(url.path)).resolve() if url.path else path
        if target.is_dir():
            target /= "index.html"
        assert target.is_relative_to(ROOT.resolve()), f"Link escapes the preview: {ref}"
        assert target.exists(), f"Missing preview resource: {ref}"
        if url.fragment and target in pages:
            if target.name == "contribute.html" and url.fragment == "/":
                continue  # Entry route of the supplied contribution demo.
            assert unquote(url.fragment) in pages[target].ids, f"Missing preview anchor: {ref}"
for path in ROOT.glob("*.html"):
    assert f'{BASE}/{path.name}' in path.read_text(encoding="utf-8")
home = (ROOT / "index.html").read_text(encoding="utf-8")
assert 'data-endpoint=""' in home, "Production counter must be disabled."
assert "aisle-counter.aisle-counter.workers.dev" not in home
assert 'id="flow-diagram"' in (ROOT / "flow/index.html").read_text(encoding="utf-8")
print("PASS: fork URLs, flow links, artifact contents and disabled production counter.")
