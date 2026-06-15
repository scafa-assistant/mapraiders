# -*- coding: utf-8 -*-
"""
Entfernt selbst-verfasste Bewertungs-Signale (Policy-Risiko) sauber:

1. JSON-LD: aggregateRating + review[] entfernen
   - Fall A: eigenstaendiger MobileApplication-Block NUR mit Rating/Review -> ganzen <script> loeschen
   - Fall B: Rating/Review im Haupt-App-Schema eingebettet -> nur die zwei Properties strippen, Rest (offers/publisher) behalten
2. Sichtbare <div class="fr-stars">...</div> Glyphen entfernen

BEHAELT: Founder-Textblock + Tester-Text-Cards (ehrlicher Social Proof "geschlossene Beta").
Idempotent. Default = Dry-Run; mit --apply schreiben.

  py docs/_apply_remove_fake_reviews.py          # Dry-Run (zeigt nur Zahlen)
  py docs/_apply_remove_fake_reviews.py --apply   # schreibt
"""
import re, os, glob, json, sys
from collections import Counter

APPLY = '--apply' in sys.argv
if sys.stdout.encoding and sys.stdout.encoding.lower() != 'utf-8':
    try: sys.stdout.reconfigure(encoding='utf-8')
    except Exception: pass

files = [f for f in glob.glob('**/*.html', recursive=True)
         if '__pycache__' not in f and 'index-backup' not in f
         and not os.path.basename(f).startswith('_')
         and not f.replace(os.sep, '/').startswith('_retired')]

SCRIPT = re.compile(r'([ \t]*)<script type="application/ld\+json">(.*?)</script>(\n?)', re.DOTALL)
STARS  = re.compile(r'[ \t]*<div class="fr-stars">[^<]*</div>[ \t]*\n?')

stats = Counter()

def transform(html):
    changed = False

    def repl(m):
        nonlocal changed
        indent, body, nl = m.group(1), m.group(2), m.group(3)
        if 'aggregateRating' not in body and '"review"' not in body:
            return m.group(0)
        try:
            data = json.loads(body)
        except Exception:
            return m.group(0)

        def emit(d):
            mini = json.dumps(d, ensure_ascii=False, separators=(',', ':'))
            return f'{indent}<script type="application/ld+json">{mini}</script>{nl}'

        # Fall A: eigenstaendiges MobileApplication-Objekt NUR mit Rating/Review -> ganzen Block loeschen
        if (isinstance(data, dict) and '@graph' not in data
                and data.get('@type') == 'MobileApplication'
                and ('aggregateRating' in data or 'review' in data)):
            extra = [k for k in data if k not in ('@context', '@type', 'name', 'url',
                                                  'aggregateRating', 'review')]
            if not extra:
                stats['script_removed'] += 1
                changed = True
                return ''  # Block + Trailing-Newline + Indent entfernen
            data.pop('aggregateRating', None)
            data.pop('review', None)
            stats['node_stripped'] += 1
            changed = True
            return emit(data)

        # Fall B: Rating/Review in einem @graph- oder Listen-Node eingebettet -> nur die Properties strippen
        nodes = data['@graph'] if isinstance(data, dict) and isinstance(data.get('@graph'), list) \
            else (data if isinstance(data, list) else [data] if isinstance(data, dict) else [])
        local = False
        for node in nodes:
            if isinstance(node, dict):
                if node.pop('aggregateRating', None) is not None: local = True
                if node.pop('review', None) is not None: local = True
        if local:
            stats['node_stripped'] += 1
            changed = True
            return emit(data)
        return m.group(0)

    html2 = SCRIPT.sub(repl, html)
    html3, n_stars = STARS.subn('', html2)
    if n_stars:
        stats['stars_removed'] += n_stars
        changed = True
    return html3, changed

touched = 0
for f in files:
    h = open(f, encoding='utf-8', errors='ignore').read()
    new, changed = transform(h)
    if changed:
        touched += 1
        if APPLY:
            open(f, 'w', encoding='utf-8').write(new)

print('Modus:', 'APPLY (geschrieben)' if APPLY else 'DRY-RUN (nichts geschrieben)')
print('Dateien geprueft :', len(files))
print('Dateien geaendert:', touched)
print('  JSON-LD Bloecke komplett geloescht (Fall A):', stats['script_removed'])
print('  JSON-LD Nodes gestrippt (Fall B)           :', stats['node_stripped'])
print('  Sichtbare fr-stars entfernt                :', stats['stars_removed'])
