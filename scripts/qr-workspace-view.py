"""Refresh only QR editing-shell ES/EN; preserve each route's own page chrome."""
from pathlib import Path
import argparse
import importlib.util
import json
import re

from bs4 import BeautifulSoup

ROOT = Path(__file__).resolve().parents[1]
PAGES = {'es': ROOT/'herramientas/qr/index.html', 'en': ROOT/'en/tools/qr/index.html'}
spec = importlib.util.spec_from_file_location('lienzo_editor_adapters', ROOT/'scripts/editor_workspace_adapters.py')
adapter = importlib.util.module_from_spec(spec)
spec.loader.exec_module(adapter)


def build_page(raw, lang):
    if lang not in PAGES:
        raise ValueError('Unsupported QR editor language')
    return re.sub(r'(?m)^[ \t]+$', '', adapter.enhance_document(raw, 'qr', lang))


render_page = build_page


def build(write=False):
    report = []
    for lang, path in PAGES.items():
        source = path.read_text(encoding='utf8')
        result = build_page(source, lang)
        before, after = BeautifulSoup(source, 'html.parser'), BeautifulSoup(result, 'html.parser')
        for selector in ('header.site-header', 'footer.site-footer', 'link[rel="canonical"]', 'link[hreflang="es"]', 'link[hreflang="en"]', 'link[hreflang="x-default"]'):
            assert str(before.select_one(selector)) == str(after.select_one(selector)), selector
        assert build_page(result, lang) == result, 'QR editor must be idempotent'
        if write:
            path.write_text(result, encoding='utf8')
        report.append({'lang': lang, 'path': path.relative_to(ROOT).as_posix(), 'changed': source != result, 'written': write})
    return report


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--write', action='store_true')
    print(json.dumps(build(parser.parse_args().write), indent=2))
