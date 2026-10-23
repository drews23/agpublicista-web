"""Incrusta el CSS de ambas portadas sin cambiar reglas, orden ni animaciones.

Ejecutar después de editar sus hojas fuente: python scripts/build-home-css.py
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
SHARED = ["css/primary-navigation.css", "css/pages/discovery-directories.css",
          "css/pages/home-discovery.css", "css/pages/catalog-copy.css",
          "css/pages/home-layout.css", "css/pages/home-eclipse.css"]
PAGES = {
    "index.html": ["css/fonts.css", "css/site.css", "css/hero-eclipse.css", "css/novedades-neon.css"] + SHARED,
    "en/index.html": ["css/site.css", "codigo-web/plantillas/plantillas.css", "en/assets/english.css"] + SHARED,
}


def build_page(name, sources, check=False):
    sections = ["/* Generado por scripts/build-home-css.py. Editar las hojas fuente.",
                "   Fuentes SIL OFL: /assets/fonts/fraunces/OFL.txt y /assets/fonts/instrument-sans/OFL.txt. */"]
    for source in sources:
        css = (ROOT / source).read_text(encoding="utf-8")
        for match in re.finditer(r'url\(\s*(?:["\']([^"\']+)["\']|([^\s)]+))', css):
            if not (match[1] or match[2]).startswith(('/', 'https:', 'http:', 'data:', '#')):
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
    page = ROOT / name
    html = page.read_text(encoding="utf-8")
    if '<style id="home-css">' in html:
        updated = re.sub(r'<style id="home-css">.*?</style>', lambda _: block, html, count=1, flags=re.S)
    else:
        pattern = r'<link\b[^>]*href=["\']/' + re.escape(sources[0]) + r'(?:\?[^"\']*)?["\'][^>]*>'
        updated, count = re.subn(pattern, lambda _: block, html, count=1)
        if count != 1:
            raise ValueError("No se encontró el bloque de hojas de portada")
    # La cascada de cada idioma mantiene su orden original. No dejar una segunda
    # copia externa: se eliminarían las ventajas y se duplicarían las reglas.
    for source in sources:
        pattern = r'<link\b[^>]*href=["\']/' + re.escape(source) + r'(?:\?[^"\']*)?["\'][^>]*>'
        updated = re.sub(pattern, '', updated)
    if check:
        if updated != html:
            raise SystemExit("Regenerar CSS de portada")
    else:
        page.write_text(updated, encoding="utf-8")
    print(f"{name}: CSS {len(css.encode('utf-8'))} bytes; {'verificado' if check else 'generado'}")


def build(check=False):
    for name, sources in PAGES.items():
        build_page(name, sources, check)


if __name__ == "__main__":
    build(check="--check" in sys.argv)
