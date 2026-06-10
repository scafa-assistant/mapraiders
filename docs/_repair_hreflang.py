# -*- coding: utf-8 -*-
"""
Repariert die hreflang-Architektur (GSC-Audit 10.06.2026):
- entfernt Homepage-Fallbacks (650 Seiten betroffen)
- ergaenzt fehlende Selbstreferenzen
- remappt tote Ziele (/es/, /pt/, /zh/, noindex-Stubs) via deren Canonical
- schreibt Sets reziprok-konsistent in alle Cluster-Mitglieder
- entfernt hreflang komplett von noindex-Seiten
"""
import re, os, glob, sys
from urllib.parse import unquote
from collections import defaultdict

BASE = 'https://mapraiders.com/'
LOCALE_DIRS = ['ar','de','en','en-in','es','es-mx','fr','hi','id','it','ja','ko',
               'pt','pt-br','ru','tr','zh','zh-cn','zh-tw']
DEPRECATED = {'es','pt','zh'}
CODE = {'root':'de','de':'de','en':'en','en-in':'en-IN','es-mx':'es','pt-br':'pt',
        'zh-cn':'zh-Hans','zh-tw':'zh-Hant','fr':'fr','it':'it','tr':'tr','ru':'ru',
        'ja':'ja','ko':'ko','ar':'ar','hi':'hi','id':'id'}

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

def norm(u):
    return unquote(u).rstrip('/')

def locale_of(f):
    seg = f.replace('\\','/').split('/')[0]
    return seg if seg in LOCALE_DIRS else 'root'

def is_homepage_url(u):
    p = unquote(u.replace(BASE,'')).strip('/')
    return p == '' or p in LOCALE_DIRS

# ---------- Inventar ----------
files = [f for f in glob.glob('**/*.html', recursive=True)
         if '__pycache__' not in f and 'index-backup' not in f and not f.startswith('_')]
info = {}
for f in files:
    html = open(f, encoding='utf-8', errors='ignore').read()
    can = re.search(r'<link rel="canonical" href="([^"]+)"', html)
    alts = re.findall(r'<link rel="alternate" hreflang="([^"]+)" href="([^"]+)"\s*/?>', html)
    url = file_to_url(f)
    noindex = bool(re.search(r'<meta name="robots" content="noindex', html))
    canonical = can.group(1) if can else None
    indexable = (not noindex) and (canonical is None or norm(canonical) == norm(url))
    info[f] = dict(url=url, noindex=noindex, canonical=canonical, alts=alts,
                   indexable=indexable, locale=locale_of(f))

by_url = {norm(v['url']): f for f, v in info.items()}

def resolve(u):
    """URL -> Datei eines indexierbaren Ziels (folgt 1x Canonical), sonst None."""
    f = by_url.get(norm(u))
    if f is None:
        fp = url_to_file(u)
        f = fp if fp in info else None
    if f is None: return None
    if info[f]['indexable']: return f
    can = info[f]['canonical']
    if can:
        f2 = by_url.get(norm(can))
        if f2 and info[f2]['indexable']: return f2
    return None

# ---------- Cluster (Union-Find) ----------
parent = {f: f for f in files}
def find(x):
    while parent[x] != x:
        parent[x] = parent[parent[x]]; x = parent[x]
    return x
def union(a, b):
    ra, rb = find(a), find(b)
    if ra != rb: parent[ra] = rb

refcount = defaultdict(int)
for f, v in info.items():
    src_is_home = is_homepage_url(v['url'])
    for lang, href in v['alts']:
        if not href.startswith(BASE): continue
        if is_homepage_url(href) and not src_is_home:
            continue  # Homepage-Fallback -> verwerfen
        t = resolve(href)
        if t and t != f:
            union(f, t); refcount[t] += 1

clusters = defaultdict(list)
for f in files:
    if info[f]['indexable']:
        clusters[find(f)].append(f)

# ---------- Sets bauen & schreiben ----------
stats = dict(rewritten=0, removed_noindex=0, singleton=0, conflicts=0)
for root, members in clusters.items():
    per_loc = defaultdict(list)
    for m in members:
        per_loc[info[m]['locale']].append(m)
    chosen = {}
    for loc, cands in per_loc.items():
        if loc in DEPRECATED: continue
        if len(cands) > 1:
            stats['conflicts'] += 1
            cands.sort(key=lambda m: (-refcount[m], len(info[m]['url'])))
        chosen[loc] = cands[0]
    if len(chosen) < 2:
        for m in members: info[m]['newalts'] = []
        stats['singleton'] += len(members)
        continue
    entries = []
    for loc, m in sorted(chosen.items(), key=lambda kv: CODE[kv[0]]):
        entries.append((CODE[loc], info[m]['url']))
    xdef = info[chosen.get('en') or chosen.get('root') or list(chosen.values())[0]]['url']
    entries.append(('x-default', xdef))
    for m in members:
        info[m]['newalts'] = entries

ALT_RE = re.compile(r'[ \t]*<link rel="alternate" hreflang="[^"]+" href="[^"]+"\s*/?>\s*\n?')
for f, v in info.items():
    html = open(f, encoding='utf-8', errors='ignore').read()
    had = bool(ALT_RE.search(html))
    new = ALT_RE.sub('', html)
    if v['noindex'] or not v['indexable']:
        if had:
            open(f, 'w', encoding='utf-8').write(new)
            stats['removed_noindex'] += 1
        continue
    entries = v.get('newalts', [])
    if entries:
        block = '\n'.join(f'  <link rel="alternate" hreflang="{l}" href="{h}">' for l, h in entries)
        m = re.search(r'([ \t]*<link rel="canonical"[^>]*>)', new)
        if m:
            new = new[:m.end()] + '\n' + block + new[m.end():]
        else:
            new = new.replace('</head>', block + '\n</head>', 1)
        stats['rewritten'] += 1
    if new != html:
        open(f, 'w', encoding='utf-8').write(new)

print(stats)
