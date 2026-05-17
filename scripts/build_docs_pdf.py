#!/usr/bin/env python3
"""
Build a simple, dependency-free PDF from docs/PROJECT_DOCUMENTATION.md.

This intentionally avoids third-party libraries (pandoc/reportlab) so it works
in restricted/offline environments.
"""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Iterable, List, Tuple


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_MD = ROOT / "docs" / "PROJECT_DOCUMENTATION.md"
DEFAULT_PDF = ROOT / "docs" / "PROJECT_DOCUMENTATION.pdf"


PAGE_WIDTH = 612   # 8.5in * 72
PAGE_HEIGHT = 792  # 11in * 72
MARGIN_X = 54
MARGIN_Y = 54


def _pdf_escape(text: str) -> str:
    return (
        text.replace("\\", "\\\\")
        .replace("(", "\\(")
        .replace(")", "\\)")
        .replace("\t", "    ")
    )


def _wrap_words(text: str, max_chars: int) -> List[str]:
    if not text:
        return [""]
    if len(text) <= max_chars:
        return [text]

    words = text.split(" ")
    lines: List[str] = []
    current = ""
    for word in words:
        if not current:
            current = word
            continue
        if len(current) + 1 + len(word) <= max_chars:
            current += " " + word
        else:
            lines.append(current)
            current = word
    if current:
        lines.append(current)

    # If a single "word" is longer than max_chars, hard-split it.
    fixed: List[str] = []
    for line in lines:
        if len(line) <= max_chars:
            fixed.append(line)
        else:
            for i in range(0, len(line), max_chars):
                fixed.append(line[i : i + max_chars])
    return fixed or [""]


@dataclass(frozen=True)
class StyledLine:
    text: str
    font: str  # F1, F2, F3
    size: int
    indent: int = 0  # points


def _md_to_styled_lines(md: str) -> List[StyledLine]:
    lines = md.splitlines()
    out: List[StyledLine] = []

    in_code = False
    for raw in lines:
        line = raw.rstrip("\n")

        if line.strip().startswith("```"):
            in_code = not in_code
            out.append(StyledLine("", "F1", 11))
            continue

        if in_code:
            # Keep code lines as-is (no markdown parsing).
            out.append(StyledLine(line, "F3", 9, indent=12))
            continue

        stripped = line.strip()
        if not stripped:
            out.append(StyledLine("", "F1", 11))
            continue

        if stripped.startswith("# "):
            out.append(StyledLine(stripped[2:].strip(), "F2", 18))
            out.append(StyledLine("", "F1", 11))
            continue

        if stripped.startswith("## "):
            out.append(StyledLine(stripped[3:].strip(), "F2", 14))
            out.append(StyledLine("", "F1", 11))
            continue

        if stripped.startswith("### "):
            out.append(StyledLine(stripped[4:].strip(), "F2", 12))
            continue

        # Basic bullets.
        bullet_prefixes = ("- ", "* ")
        if any(stripped.startswith(p) for p in bullet_prefixes):
            body = stripped[2:].strip()
            out.append(StyledLine(f"• {body}", "F1", 11, indent=12))
            continue

        # Numbered lists (keep numbering).
        out.append(StyledLine(stripped, "F1", 11))

    return out


def _max_chars_for(font: str, size: int, indent: int) -> int:
    usable_width = (PAGE_WIDTH - 2 * MARGIN_X) - indent

    # Rough heuristics. Good enough for readable docs.
    if font == "F3":  # Courier
        avg_char = 0.60 * size
    else:  # Helvetica-ish
        avg_char = 0.55 * size
    return max(20, int(usable_width / avg_char))


def _paginate(styled_lines: Iterable[StyledLine]) -> List[List[Tuple[StyledLine, str]]]:
    pages: List[List[Tuple[StyledLine, str]]] = []
    current: List[Tuple[StyledLine, str]] = []

    y = PAGE_HEIGHT - MARGIN_Y

    def new_page() -> None:
        nonlocal current, y
        if current:
            pages.append(current)
        current = []
        y = PAGE_HEIGHT - MARGIN_Y

    for styled in styled_lines:
        max_chars = _max_chars_for(styled.font, styled.size, styled.indent)
        wrapped = _wrap_words(styled.text, max_chars)

        for idx, piece in enumerate(wrapped):
            if y < MARGIN_Y + styled.size + 6:
                new_page()
            current.append((styled, piece if idx == 0 else piece))
            y -= int(styled.size * 1.35) if piece else int(styled.size * 0.9)

    if current:
        pages.append(current)
    return pages


class _PdfBuilder:
    def __init__(self) -> None:
        self._objects: List[bytes] = []

    def add_object(self, data: bytes) -> int:
        self._objects.append(data)
        return len(self._objects)

    def build(self) -> bytes:
        header = b"%PDF-1.4\n%\xe2\xe3\xcf\xd3\n"
        body = bytearray()
        offsets = [0]

        body.extend(header)
        for i, obj in enumerate(self._objects, start=1):
            offsets.append(len(body))
            body.extend(f"{i} 0 obj\n".encode("ascii"))
            body.extend(obj)
            if not obj.endswith(b"\n"):
                body.extend(b"\n")
            body.extend(b"endobj\n")

        xref_start = len(body)
        body.extend(f"xref\n0 {len(self._objects)+1}\n".encode("ascii"))
        body.extend(b"0000000000 65535 f \n")
        for off in offsets[1:]:
            body.extend(f"{off:010d} 00000 n \n".encode("ascii"))

        body.extend(
            f"trailer\n<< /Size {len(self._objects)+1} /Root 1 0 R >>\nstartxref\n{xref_start}\n%%EOF\n".encode(
                "ascii"
            )
        )
        return bytes(body)


def _content_stream_for_page(page_items: List[Tuple[StyledLine, str]]) -> bytes:
    parts: List[str] = []
    y = PAGE_HEIGHT - MARGIN_Y

    for styled, text in page_items:
        if text == "":
            y -= int(styled.size * 0.9)
            continue

        x = MARGIN_X + styled.indent
        escaped = _pdf_escape(text)
        parts.append(
            f"BT /{styled.font} {styled.size} Tf 1 0 0 1 {x} {y} Tm ({escaped}) Tj ET"
        )
        y -= int(styled.size * 1.35)

    content = "\n".join(parts).encode("utf-8")
    return b"<< /Length %d >>\nstream\n%b\nendstream\n" % (len(content), content)


def build_pdf_from_markdown(md_path: Path, pdf_path: Path) -> None:
    md_text = md_path.read_text(encoding="utf-8")
    styled = _md_to_styled_lines(md_text)
    pages = _paginate(styled)

    pdf = _PdfBuilder()

    # 1) Catalog (Root)
    # Will reference Pages object as 2 0 R.
    pdf.add_object(b"<< /Type /Catalog /Pages 2 0 R >>\n")

    # 2) Pages
    # Will be filled after Page objects are created, but we need stable object ids.
    # We'll reserve object 2 now, then patch it by rebuilding objects list later.
    pdf.add_object(b"<< /Type /Pages /Kids [] /Count 0 >>\n")

    # Fonts object (shared resource dictionary)
    fonts_obj_id = pdf.add_object(
        b"<<\n"
        b"  /Font <<\n"
        b"    /F1 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\n"
        b"    /F2 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\n"
        b"    /F3 << /Type /Font /Subtype /Type1 /BaseFont /Courier >>\n"
        b"  >>\n"
        b">>\n"
    )

    page_obj_ids: List[int] = []
    for page in pages:
        content_obj_id = pdf.add_object(_content_stream_for_page(page))
        page_obj_id = pdf.add_object(
            (
                f"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 {PAGE_WIDTH} {PAGE_HEIGHT}] "
                f"/Resources {fonts_obj_id} 0 R /Contents {content_obj_id} 0 R >>\n"
            ).encode("ascii")
        )
        page_obj_ids.append(page_obj_id)

    kids = " ".join(f"{pid} 0 R" for pid in page_obj_ids)
    pages_obj = f"<< /Type /Pages /Kids [ {kids} ] /Count {len(page_obj_ids)} >>\n".encode(
        "ascii"
    )

    # Patch object 2 in-place (since we haven't written output yet).
    pdf._objects[1] = pages_obj  # object id 2 => index 1

    pdf_bytes = pdf.build()
    pdf_path.write_bytes(pdf_bytes)


def main() -> int:
    md_path = DEFAULT_MD
    pdf_path = DEFAULT_PDF
    build_pdf_from_markdown(md_path, pdf_path)
    print(f"Wrote {pdf_path.relative_to(ROOT)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

