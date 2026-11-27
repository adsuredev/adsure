#!/usr/bin/env python3
"""Rebuild llms-full.txt (the whole public site as plain text for AI answer engines).

Run from the repo root after changing page text:   python3 scripts/build-llms-full.py
Needs: pip install beautifulsoup4
"""
import re, datetime, pathlib
from bs4 import BeautifulSoup, NavigableString

ROOT = pathlib.Path(__file__).resolve().parent.parent
SITE = "https://www.adsure.in"
PAGES = [  # (file, clean URL) in the order an AI should read them
    ("index.html", "/"), ("features.html", "/features"), ("why-adsure.html", "/why-adsure"),
    ("pricing.html", "/pricing"), ("faq.html", "/faq"), ("heatmap.html", "/heatmap"),
    ("guides.html", "/guides"), ("guides/ad-checklist.html", "/guides/ad-checklist"),
    ("guides/indian-ad-rules.html", "/guides/indian-ad-rules"),
    ("guides/festival-ad-calendar-2027.html", "/guides/festival-ad-calendar-2027"),
    ("terms.html", "/terms"), ("privacy.html", "/privacy"), ("refund-policy.html", "/refund-policy"),
]
DROP = ["script", "style", "noscript", "svg", "form", "video", "button", "input", "select",
        "textarea", "iframe", "template", "nav", "dialog", "canvas"]

BLOCK = ["p", "div", "ul", "ol", "table", "h1", "h2", "h3", "h4", "details", "section", "article", "blockquote"]

def text(el):
    return re.sub(r"\s+", " ", el.get_text(" ", strip=True)).replace(" ,", ",").replace(" .", ".").strip()

def walk(el, out):
    for c in el.children:
        if isinstance(c, NavigableString):
            continue
        n = c.name
        if n in ("h1", "h2", "h3", "h4"):
            t = text(c)
            if t: out.append("\n" + "#" * (int(n[1]) + 1) + " " + t + "\n")
        elif n == "p":
            t = text(c)
            if t: out.append(t + "\n")
        elif n in ("ul", "ol"):
            for i, li in enumerate(c.find_all("li", recursive=False), 1):
                t = text(li)
                if t: out.append(("%d. " % i if n == "ol" else "- ") + t)
            out.append("")
        elif n == "details":
            s = c.find("summary")
            q = text(s) if s else ""
            if s: s.extract()
            a = text(c)
            if q: out.append("**Q: " + q + "**\n" + a + "\n")
        elif n == "table":
            for tr in c.find_all("tr"):
                cells = [text(td) for td in tr.find_all(["th", "td"])]
                if any(cells): out.append("| " + " | ".join(cells) + " |")
            out.append("")
        elif n == "blockquote":
            t = text(c)
            if t: out.append("> " + t + "\n")
        elif n in ("div", "span", "a", "li", "label") and not c.find(BLOCK):
            t = text(c)  # a box with only inline content, e.g. a price line
            if t: out.append(t + "\n")
        else:
            walk(c, out)

def page(file, url):
    soup = BeautifulSoup((ROOT / file).read_text(encoding="utf-8"), "html.parser")
    title = soup.title.get_text(strip=True) if soup.title else url
    desc = soup.find("meta", attrs={"name": "description"})
    main = soup.find("main") or soup.body
    for t in main.find_all(DROP): t.decompose()
    for t in main.find_all(attrs={"aria-hidden": "true"}): t.decompose()
    for t in main.select(".modal, .popup, #signup, .signup, .seat, .seats, #calculator, #join, a.btn, .btn, .cta-row"): t.decompose()
    out = []
    walk(main, out)
    body = re.sub(r"\n{3,}", "\n\n", "\n".join(out)).strip()
    head = "# " + title + "\nURL: " + SITE + url + "\n"
    if desc: head += "Summary: " + desc.get("content", "").strip() + "\n"
    return head + "\n" + body + "\n"

def main():
    parts = ["# AdSure — full site text\n",
             "> AdSure (www.adsure.in) reviews Meta and Google ads before you spend on them: ad experts and AI "
             "check the creative, ad text, landing page and targeting, and give simple fixes. Made for India.\n",
             "This file is the public text of www.adsure.in, for AI assistants and answer engines. "
             "Short version: " + SITE + "/llms.txt. Generated " + datetime.date.today().isoformat() + ".\n"]
    for f, u in PAGES:
        parts.append("\n---\n\n" + page(f, u))
    (ROOT / "llms-full.txt").write_text("\n".join(parts), encoding="utf-8")
    print("llms-full.txt written,", len("".join(parts)), "chars")

if __name__ == "__main__":
    main()
