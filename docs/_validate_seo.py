# -*- coding: utf-8 -*-
"""
SEO-Validator (CI-Gate). Prüft:
1. Jedes hreflang-Ziel existiert, ist indexierbar (kein noindex, Self-Canonical)
2. Jedes hreflang-Set enthält eine Selbstreferenz
3. Reziprozität: Ziel verlinkt zurück (Return-Tags)
4. Kein hreflang zeigt auf eine Homepage, außer die Seite ist selbst eine Homepage
5. sitemap.xml enthält nur indexierbare URLs, alle Dateien existieren
6. Keine internen Links auf nicht existierende .html-Dateien (gleiche Domain)
Exit-Code 1 bei Fehlern.
"""
import re, os, glob, sys
from urllib.parse import unquote
from collections import defaultdict

BASE = 'https://mapraiders.com/'
LOCALE_DIRS = ['ar','de','en','en-in','es','es-mx','fr','hi','id','it','ja','ko',
               'pt','pt-br','ru','tr','zh','zh-cn','zh-tw']

def file_to_url(f):
    f = f.replace('\\','/')
    if f == 'index.html': return BASE
    if f.endswith('/index.html'): return BASE + f[:-10]
    return BASE + f

def url_to_file(u):
    p = unquote(u.replace(BASE,''))
    if p == '': return 'index.html'
    if p.endswith('/'): return p + 'index.html'
    if p.endswith('.html'): return p
    return p + '/index.html'

def norm(u): return unquote(u).rstrip('/')

def is_home(u):
    p = unquote(u.replace(BASE,'')).strip('/')
    return p == '' or p in LOCALE_DIRS

files = [f for f in glob.glob('**/*.html', recursive=True)
         if '__pycache__' not in f and 'index-backup' not in f and not f.startswith('_')]
info = {}
for f in files:
    h = open(f, encoding='utf-8', errors='ignore').read()
    can = re.search(r'<link rel="canonical" href="([^"]+)"', h)
    alts = re.findall(r'<link rel="alternate" hreflang="([^"]+)" href="([^"]+)"\s*/?>', h)
    url = file_to_url(f)
    noidx = 'content="noindex' in h
    canonical = can.group(1) if can else None
    info[f] = dict(url=url, noindex=noidx, alts=alts, html=h,
                   indexable=(not noidx) and (canonical is None or norm(canonical) == norm(url)))
by_url = {norm(v['url']): f for f, v in info.items()}

errors = defaultdict(list)
warnings = defaultdict(list)

for f, v in info.items():
    # Blindstelle sichtbar machen: indexierbare Seite ohne JEGLICHES hreflang
    # (kein Fehler -> faellt das Gate nicht, aber dokumentiert die Waisen)
    if not v['alts'] and v['indexable'] and not is_home(v['url']):
        warnings['indexierbar_ohne_hreflang'].append(f)
    if not v['alts']: continue
    if v['noindex']:
        errors['hreflang_auf_noindex_seite'].append(f)
        continue
    hrefs = [norm(h) for _, h in v['alts'] if not _.startswith('x-')]
    if norm(v['url']) not in hrefs:
        errors['fehlende_selbstreferenz'].append(f)
    for lang, href in v['alts']:
        if not href.startswith(BASE): continue
        if is_home(href) and not is_home(v['url']):
            errors['homepage_fallback'].append((f, lang))
            continue
        t = by_url.get(norm(href))
        if t is None:
            errors['ziel_existiert_nicht'].append((f, href)); continue
        if not info[t]['indexable']:
            errors['ziel_nicht_indexierbar'].append((f, href)); continue
        if lang != 'x-default':
            back = [norm(h2) for _, h2 in info[t]['alts']]
            if norm(v['url']) not in back:
                errors['kein_return_tag'].append((f, href))

# Sitemap
sm = open('sitemap.xml', encoding='utf-8').read()
for loc in re.findall(r'<loc>(.*?)</loc>', sm):
    f = by_url.get(norm(loc))
    if f is None:
        errors['sitemap_url_ohne_datei'].append(loc)
    elif not info[f]['indexable']:
        errors['sitemap_url_nicht_indexierbar'].append(loc)

# Interne Links
for f, v in info.items():
    for href in re.findall(r'<a href="(/[^"#?]*)"', v['html']):
        p = unquote(href).lstrip('/')
        if p == '': continue
        fp = p + 'index.html' if p.endswith('/') else (p if p.endswith('.html') else p + '/index.html')
        if not os.path.exists(fp):
            errors['toter_interner_link'].append((f, href))

total = sum(len(v) for v in errors.values())
print(f"Geprüfte Seiten: {len(files)}")
for k, v in sorted(errors.items()):
    print(f"FEHLER {k}: {len(v)}")
    for item in v[:5]: print("   ", item)
for k, v in sorted(warnings.items()):
    print(f"WARNUNG {k}: {len(v)} (kein Gate-Fehler — Cluster-/Content-Aufgabe)")
    for item in v[:5]: print("   ", item)
if total == 0:
    print("OK — alle Gate-Prüfungen bestanden.")
sys.exit(1 if total else 0)
