"""Incrusta el CSS de portada sin cambiar reglas, orden ni animaciones.

Ejecutar después de editar las cuatro hojas fuente: python scripts/build-home-css.py
Requiere las mismas dependencias que build-page-css.py. --check no escribe.
"""
from pathlib import Path
import importlib.util
import re
import sys

sys.dont_write_bytecode = True
ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location("page_css", ROOT / "scripts/build-page-css.py")
compiler = importlib.util.module_from_spec(spec)
spec.loader.exec_module(compiler)
SOURCES = ["css/fonts.css", "css/site.css", "css/hero-eclipse.css", "css/novedades-neon.css"]


def build(check=False):
    sections = ["/* Generado por scripts/build-home-css.py. Editar las hojas fuente.",
                "   Fuentes SIL OFL: /assets/fonts/fraunces/OFL.txt y /assets/fonts/instrument-sans/OFL.txt. */"]
    for source in SOURCES:
        css = (ROOT / source).read_text(encoding="utf-8")
        if re.search(r"url\(\s*['\"]?(?!/|https?:|data:|#)", css):
            raise ValueError(f"Revisar rutas relativas antes de incrustar: {source}")
        sections.extend(comment for comment in re.findall(r"/\*.*?\*/", css, re.S)
                        if re.search(r"copyright|MIT License|Permission is hereby granted", comment, re.I))
        # Todas las clases se conservan: también estados, clases dinámicas y otras páginas.
        names = set(re.findall(r"[a-zA-Z_][\w-]*", css))
        sections.append(compiler.compile_rules(compiler.tinycss2.parse_stylesheet(css), names))
    css = "\n".join(sections)
    if "</style" in css.lower():
        raise ValueError("CSS no apto para un bloque style")
    block = '<style id="home-css">\n' + css + '\n    </style>'
    page = ROOT / "index.html"
    html = page.read_text(encoding="utf-8")
    if '<style id="home-css">' in html:
        updated = re.sub(r'<style id="home-css">.*?</style>', lambda _: block, html, count=1, flags=re.S)
    else:
        pattern = r'<link rel="stylesheet" href="/css/fonts\.css[^\"]*" />\s*<link rel="stylesheet" href="/css/site\.css[^\"]*" />\s*<link rel="stylesheet" href="/css/hero-eclipse\.css[^\"]*" />\s*<link rel="stylesheet" href="/css/novedades-neon\.css[^\"]*" />'
        updated, count = re.subn(pattern, lambda _: block, html, count=1)
        if count != 1:
            raise ValueError("No se encontró el bloque de hojas de portada")
    if check:
        if updated != html:
            raise SystemExit("Regenerar CSS de portada")
    else:
        page.write_text(updated, encoding="utf-8")
    print(f"CSS de portada: {len(css.encode('utf-8'))} bytes; {'verificado' if check else 'generado'}")


if __name__ == "__main__":
    build(check="--check" in sys.argv)
