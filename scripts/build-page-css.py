"""Genera las hojas de AE y QR conservando la cascada y los estados dinámicos.

Requiere beautifulsoup4 y tinycss2. Ejecutar desde cualquier directorio:
  python scripts/build-page-css.py
No usa cobertura de una sola pantalla: conserva todas las clases del documento,
las palabras presentes en sus scripts locales y los selectores complejos.
"""
from pathlib import Path
import re
import sys
from urllib.parse import urljoin, urlsplit

from bs4 import BeautifulSoup
import tinycss2

ROOT = Path(__file__).resolve().parents[1]
PAGES = {
    "after-effects": ("blog/plantillas-after-effects-gratis/index.html", ["css/fonts.css", "css/site.css"]),
    "qr": ("herramientas/qr/index.html", ["css/fonts.css", "css/site.css", "herramientas/qr/css/tool.css", "css/estudio.css"]),
}


def allowed_classes(html, page):
    document = BeautifulSoup(html, "html.parser")
    names = {name for element in document.select("[class]") for name in element["class"]}
    for script in document.select("script"):
        source = script.get_text()
        if script.get("src"):
            url = urlsplit(urljoin("https://lienzo.tools/" + page, script["src"]))
            file = ROOT / url.path.lstrip("/")
            if url.netloc == "lienzo.tools" and file.is_file():
                source += file.read_text(encoding="utf-8")
        # Incluye clases de plantillas HTML, selectores y estados creados por JS.
        names.update(re.findall(r"[a-zA-Z_][\w-]*", source))
    return names


def selector_is_needed(tokens, names):
    # No simplificar :not(), :is(), :has(), escapes o selectores futuros.
    if any(token.type == "function" for token in tokens):
        return True
    for index, token in enumerate(tokens[:-1]):
        if token.type == "literal" and token.value == ".":
            following = tokens[index + 1]
            if following.type == "ident" and following.value not in names:
                return False
    return True


def compact(tokens):
    result = []
    for token in tokens:
        if token.type == "comment":
            continue
        if token.type == "whitespace":
            token.value = " "
        if token.type == "error":
            raise ValueError(f"CSS inválido: {token.message}")
        result.append(token)
    return tinycss2.serialize(result).strip()


def compile_rules(rules, names):
    output = []
    for rule in rules:
        if rule.type in ("comment", "whitespace"):
            continue
        if rule.type == "error":
            raise ValueError(rule.message)
        if rule.type == "qualified-rule":
            groups, group = [], []
            for token in rule.prelude:
                if token.type == "literal" and token.value == ",":
                    groups.append(group)
                    group = []
                else:
                    group.append(token)
            groups.append(group)
            selected = [compact(group) for group in groups if selector_is_needed(group, names)]
            if selected:
                output.append(",".join(selected) + "{" + compact(rule.content) + "}")
        elif rule.type == "at-rule":
            head = "@" + rule.at_keyword + " " + compact(rule.prelude)
            if rule.content is None:
                output.append(head.rstrip() + ";")
            elif rule.lower_at_keyword in ("media", "supports", "layer", "container"):
                body = compile_rules(tinycss2.parse_rule_list(rule.content), names)
                if body:
                    output.append(head.rstrip() + "{" + body + "}")
            else:
                # Fuentes, keyframes y propiedades registradas se conservan íntegros.
                output.append(head.rstrip() + "{" + compact(rule.content) + "}")
    return "\n".join(output)


def build(check=False):
    for name, (page, sources) in PAGES.items():
        names = allowed_classes((ROOT / page).read_text(encoding="utf-8"), page)
        sections = ["/* Generado por scripts/build-page-css.py; editar las hojas fuente.\n"
                    "   Fuentes SIL OFL: /assets/fonts/fraunces/OFL.txt y /assets/fonts/instrument-sans/OFL.txt. */"]
        for source in sources:
            css = (ROOT / source).read_text(encoding="utf-8")
            # Conservar avisos de atribución/licencia de los componentes adaptados.
            sections.extend(comment for comment in re.findall(r"/\*.*?\*/", css, re.S)
                            if re.search(r"copyright|MIT License|Permission is hereby granted", comment, re.I))
            sections.extend([f"/* Fuente: /{source} */", compile_rules(tinycss2.parse_stylesheet(css), names)])
        content = "\n".join(sections) + "\n"
        target = ROOT / "css/pages" / f"{name}.css"
        if check:
            if not target.exists() or target.read_text(encoding="utf-8") != content:
                raise SystemExit(f"Regenerar: {target.relative_to(ROOT)}")
        else:
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_text(content, encoding="utf-8")
        original = sum((ROOT / source).stat().st_size for source in sources)
        print(f"{target.relative_to(ROOT)}: {len(content.encode('utf-8'))} bytes frente a {original}; {'verificado' if check else 'generado'}")


if __name__ == "__main__":
    build(check="--check" in sys.argv)
