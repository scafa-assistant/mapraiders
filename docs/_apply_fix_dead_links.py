# -*- coding: utf-8 -*-
"""
Repariert tote interne Links holistisch:
- Ziel-Locale aus dem Pfad, Konzept aus Quellseite/Slug/Label
- Remap auf die TATSAECHLICH existierende Datei pro (Locale, Konzept)
- Korrupte/Niche-Slugs via explizitem Override
- Unaufloesbares (z.B. /press/, vs/zenly ohne Pendant) -> Anchor zu reinem Text entlinken

Default = Dry-Run (Report). Mit --apply schreiben.
"""
import re, os, glob, sys
from urllib.parse import unquote
from collections import Counter
sys.stdout.reconfigure(encoding='utf-8')
APPLY = '--apply' in sys.argv

files = [f for f in glob.glob('**/*.html', recursive=True)
         if '__pycache__' not in f and 'index-backup' not in f
         and not os.path.basename(f).startswith('_')
         and not f.replace(os.sep, '/').startswith('_retired')]

def exists(href):
    p = unquote(href).split('#')[0].split('?')[0].lstrip('/')
    if p == '': return True
    fp = p + 'index.html' if p.endswith('/') else (p if p.endswith('.html') else p + '/index.html')
    return os.path.exists(fp)

LOCALES = {'ar','de','en','en-in','es-mx','fr','hi','id','it','ja','ko','pt-br','ru','tr','zh-cn','zh-tw'}

HOWTO = {
 'root':{'clans':'clans.html','echos':'echos.html','territories':'territorien.html','defense':'verteidigungs-minispiele.html'},
 'ar':{'clans':'clans.html','echos':'echos.html','territories':'territories.html','defense':'defense-minigames.html'},
 'en':{'clans':'clans.html','echos':'echos.html','territories':'territories.html','defense':'defense-minigames.html'},
 'en-in':{'clans':'clans.html','echos':'echos.html','territories':'territories.html','defense':'defense-minigames.html'},
 'es-mx':{'clans':'clanes.html','echos':'ecos.html','territories':'territorios.html','defense':'juegos-defensa.html'},
 'fr':{'clans':'clans.html','echos':'echos.html','territories':'territoires.html','defense':'jeux-defense.html'},
 'hi':{'clans':'clans.html','echos':'echos.html','territories':'territories.html','defense':'defense-minigames.html'},
 'id':{'clans':'clans.html','echos':'echos.html','territories':'territories.html','defense':'defense-minigames.html'},
 'it':{'clans':'clan.html','echos':'echi.html','territories':'territori.html','defense':'minigiochi-difesa.html'},
 'ja':{'clans':'clans.html','echos':'echos.html','territories':'territories.html','defense':'defense-minigames.html'},
 'ko':{'clans':'clans.html','echos':'echos.html','territories':'territories.html','defense':'defense-minigames.html'},
 'pt-br':{'clans':'cla.html','echos':'ecos.html','territories':'territorios.html','defense':'minijogos-defesa.html'},
 'ru':{'clans':'klany.html','echos':'ekho.html','territories':'territorii.html','defense':'zashchita-igry.html'},
 'tr':{'clans':'klanlar.html','echos':'echolar.html','territories':'bolgeler.html','defense':'savunma-oyunlari.html'},
 'zh-cn':{'clans':'clans.html','echos':'echos.html','territories':'territories.html','defense':'defense-minigames.html'},
 'zh-tw':{'clans':'clans.html','echos':'echos.html','territories':'territories.html','defense':'defense-minigames.html'},
}
FEAT = {
 'root':{'defense':'defense.html','echos':'echos.html','events':'events.html','quests':'quests.html','territories':'territorien.html','social':'social.html'},
 'ar':{'clans':'clans.html','defense':'defense.html','echos':'echos.html','events':'events.html','quests':'quests.html','territories':'territories.html'},
 'en':{'clans':'clans.html','defense':'defense-games.html','echos':'echos.html','events':'events.html','quests':'quests.html','territories':'territories.html'},
 'en-in':{'clans':'clans.html','defense':'defence-games.html','echos':'echos.html','events':'events.html','quests':'quests.html','territories':'territories.html'},
 'es-mx':{'clans':'clanes.html','defense':'juegos-defensa.html','echos':'ecos.html','events':'eventos.html','quests':'misiones.html','territories':'territorios.html'},
 'fr':{'clans':'clans.html','defense':'jeux-defense.html','echos':'echos.html','events':'evenements.html','quests':'quetes.html','territories':'territoires.html'},
 'hi':{'clans':'clans.html','defense':'defense.html','echos':'echos.html','events':'events.html','quests':'quests.html','territories':'territories.html'},
 'id':{'clans':'clans.html','defense':'defense-games.html','echos':'echos.html','events':'events.html','quests':'quests.html','territories':'territories.html'},
 'it':{'clans':'clan.html','defense':'giochi-difesa.html','echos':'echi.html','events':'eventi.html','quests':'missioni.html','territories':'territori.html'},
 'ja':{'clans':'clans.html','defense':'defense.html','echos':'echos.html','events':'events.html','quests':'quests.html','territories':'territories.html'},
 'ko':{'clans':'clans.html','defense':'defense.html','echos':'echos.html','events':'events.html','quests':'quests.html','territories':'territories.html'},
 'pt-br':{'clans':'clans.html','defense':'defense.html','echos':'echos.html','events':'events.html','quests':'quests.html','territories':'territories.html'},
 'ru':{'clans':'clans.html','defense':'defense.html','echos':'echos.html','events':'events.html','quests':'quests.html','territories':'territories.html'},
 'tr':{'clans':'clans.html','defense':'defense.html','echos':'echos.html','events':'events.html','quests':'quests.html','territories':'territories.html'},
 'zh-cn':{'clans':'clans.html','defense':'defense.html','echos':'echos.html','events':'events.html','quests':'quests.html','territories':'territories.html'},
 'zh-tw':{'clans':'clans.html','defense':'defense.html','echos':'echos.html','events':'events.html','quests':'quests.html','territories':'territories.html'},
}
LEGAL = {
 'root':{'privacy':'datenschutz.html','terms':'agb.html','imprint':'impressum.html'},
 'ar':{'privacy':'الخصوصية.html','terms':'الشروط.html'},
 'en':{'privacy':'privacy.html','terms':'terms.html','imprint':'imprint.html'},
 'en-in':{'privacy':'privacy.html','terms':'terms.html','imprint':'imprint.html'},
 'es-mx':{'privacy':'privacidad.html','terms':'terminos.html','imprint':'aviso-legal.html'},
 'fr':{'privacy':'confidentialite.html','terms':'cgu.html','imprint':'mentions-legales.html'},
 'hi':{'privacy':'गोपनीयता.html','terms':'शर्तें.html'},
 'id':{'privacy':'privacy.html','terms':'terms.html','imprint':'legal.html'},
 'it':{'privacy':'privacy.html','terms':'termini.html','imprint':'note-legali.html'},
 'ja':{'privacy':'プライバシーポリシー.html','terms':'利用規約.html','imprint':'特定商取引法.html'},
 'ko':{'privacy':'개인정보보호.html','terms':'약관.html'},
 'pt-br':{'privacy':'privacidade.html','terms':'termos.html','imprint':'aviso-legal.html'},
 'ru':{'privacy':'konfidentsialnost.html','terms':'usloviya.html'},
 'tr':{'privacy':'gizlilik.html','terms':'sartlar.html','imprint':'kunye.html'},
 'zh-cn':{'privacy':'隐私.html','terms':'条款.html'},
 'zh-tw':{'privacy':'隱私.html','terms':'條款.html'},
}
VS = {'geocaching','ingress','pokemon-go','zenly'}

# Konzept-Keywords (auf dem Slug, lowercased)
CONCEPT_KW = [
 ('defense', ['defens','defenc','difa','difesa','defensa','zashchit','savunma','fangyu','raksha','bouei','bangeo','minigeemu','minigeeim','minijuego','minijogo','minigioch','minigame','mini-jeux','mini-juego','mini-game','mini-oyun','mini-igr','mini-alaeab','xiao-youxi','chhote-khel','verteidig']),
 ('territories', ['territ','territor','territoir','territorien','aqalim','lingtu','yeongto','ryouiki','bolge','kshetry','territorii']),
 ('echos', ['echo','ecos','echi','echol','sadaa','eko','ekho','meauri','huixiang','yank','ghatank','goonj']),
 ('clans', ['clan','klan','keulran','kuran','klany','klanlar','cla','cls']),
 ('events', ['event','evento','evenement','eventi']),
 ('quests', ['quest','mission','misione','misiones','quete','missioni']),
]
def concept_of(slug):
    s = slug.lower()
    for c, kws in CONCEPT_KW:
        if any(k in s for k in kws):
            return c
    return None

def legal_cat(slug, label):
    s = (slug + ' ' + label).lower()
    if any(k in s for k in ['imprint','impress','特定商取引','mentions','note-legali','aviso','/legal','kunye','künye']):
        return 'imprint'
    if any(k in s for k in ['privac','プライバシ','개인정보','隐私','隱私','gizlilik','конфиден','privacidad','privacidade','confidential','गोपनीय','الخصو','/acy','privasi']):
        return 'privacy'
    if any(k in s for k in ['terms','term','利用規約','약관','条款','條款','koşul','kosul','sartlar','услови','termino','termos','termini','cgu','शर्त','الشروط','syarat','/s/','service','koşullar']):
        return 'terms'
    return None

# Explizite Overrides fuer korrupte Niche-/Sonderlinks (Locale-Pfad -> Ziel ODER 'REMOVE')
OVERRIDE = {
 '/pt-br/o/':'/pt-br/howto/',
 '/pt-br/o-graffiti/':'/pt-br/audio-graffiti/',
 '/pt-br/-corrida/':'/pt-br/app-corrida/',
 '/pt-br/da-tesouro/':'/pt-br/caca-ao-tesouro/',
 '/pt-br/orador-urbano/':'/pt-br/explorar-cidade/',
 '/pt-br/ess-mmo/':'/pt-br/fitness-mmo/',
 '/pt-br/-pedalar/':'/pt-br/pedalar-jogo/',
 '/pt-br/-geolocalizacao.html':'/pt-br/jogo-de-gps.html',
 '/pt-br/-territorio.html':'/pt-br/jogo-de-territorio.html',
 '/pt-br/social-outdoor.html':'/pt-br/app-social-outdoor.html',
 '/pt-br/ro/':'/pt-br/bairro/',
 '/es-mx/juego-pedalar/':'/es-mx/juego-ciclismo/',
 '/it/gioco-pedalar/':'/it/gioco-ciclismo/',
 '/press/':'REMOVE',
 '/fr/vs/':'REMOVE',
 '/es-mx/vs/zenly.html':'REMOVE',
 '/fr/vs/zenly.html':'REMOVE',
}

def locale_of_href(href):
    seg = href.lstrip('/').split('/')[0]
    return seg if seg in LOCALES else 'root'

def source_howto_concept(srcfile):
    b = os.path.basename(srcfile)
    parent = srcfile.replace(os.sep,'/').split('/')
    if 'howto' in parent and b != 'index.html':
        # de root: howto/<concept>.html ; localized: <loc>/howto/<concept>.html
        m = {'clans':'clans','clanes':'clans','clan':'clans','klany':'clans','klanlar':'clans',
             'echos':'echos','ecos':'echos','echi':'echos','ekho':'echos','echolar':'echos',
             'territories':'territories','territorios':'territories','territoires':'territories','territori':'territories','territorien':'territories','territorii':'territories','bolgeler':'territories',
             'defense-minigames':'defense','juegos-defensa':'defense','jeux-defense':'defense','minigiochi-difesa':'defense','minijogos-defesa':'defense','zashchita-igry':'defense','savunma-oyunlari':'defense','verteidigungs-minispiele':'defense'}
        return m.get(b[:-5])
    return None

def resolve(href, srcfile, label):
    raw = href
    href = href.split('#')[0].split('?')[0]
    if href in OVERRIDE:
        return OVERRIDE[href]
    loc = locale_of_href(href)
    parts = href.lstrip('/').split('/')
    # korruptes '/o/' == '/howto/'
    if len(parts) >= 2 and parts[1] == 'o':
        cand = href.replace('/o/', '/howto/', 1)
        if exists(cand): return cand
        parts = cand.lstrip('/').split('/')
    # /<loc>/howto/<slug>  oder  /howto/<slug> (root)
    if 'howto' in parts:
        slug = parts[-1].replace('.html','') if parts[-1] else 'index'
        c = source_howto_concept(srcfile) or concept_of(slug)
        if c and c in HOWTO.get(loc, {}):
            return f"/{'' if loc=='root' else loc+'/'}howto/{HOWTO[loc][c]}"
    # features (auch korrupt 'ures')
    if 'features' in parts or 'ures' in parts:
        slug = parts[-1].replace('.html','')
        c = concept_of(slug)
        if c and c in FEAT.get(loc, {}):
            return f"/{'' if loc=='root' else loc+'/'}features/{FEAT[loc][c]}"
    # vs
    if 'vs' in parts and parts[-1].endswith('.html'):
        name = parts[-1][:-5]
        if name in VS:
            tgt = f"/{'' if loc=='root' else loc+'/'}vs/{name}.html"
            if exists(tgt): return tgt
            en = f"/en/vs/{name}.html"
            return en if exists(en) else 'REMOVE'
    # legal
    cat = legal_cat(parts[-1] if parts else '', label)
    if cat:
        fn = LEGAL.get(loc, {}).get(cat) or LEGAL['root'].get(cat)
        base = '' if (loc=='root' or fn==LEGAL['root'].get(cat) and loc not in LEGAL) else (loc+'/')
        if LEGAL.get(loc, {}).get(cat):
            return f"/{loc+'/' if loc!='root' else ''}{fn}"
        # Fallback Root-Legal
        return f"/{LEGAL['root'][cat]}"
    return 'UNRESOLVED'

# ---- Durchlauf ----
A = re.compile(r'<a\s+href="(/[^"]*)"([^>]*)>(.*?)</a>', re.DOTALL)
proposed = Counter()
actions = []  # (srcfile, href, target)
for f in files:
    h = open(f, encoding='utf-8', errors='ignore').read()
    for m in A.finditer(h):
        href, attrs, inner = m.group(1), m.group(2), m.group(3)
        if exists(href): continue
        label = re.sub(r'<[^>]+>','', inner).strip()
        tgt = resolve(href, f, label)
        actions.append((f, href, tgt, m.group(0), inner))
        proposed[tgt if tgt in ('REMOVE','UNRESOLVED') else ('REMAP->'+tgt.split('/')[1] if tgt.startswith('/') else tgt)] += 1

# Report
print('Modus:', 'APPLY' if APPLY else 'DRY-RUN')
remap = [a for a in actions if a[2] not in ('REMOVE','UNRESOLVED')]
remove = [a for a in actions if a[2]=='REMOVE']
unres  = [a for a in actions if a[2]=='UNRESOLVED']
# Validierung: jedes Remap-Ziel muss existieren
bad = [a for a in remap if not exists(a[2])]
print(f"REMAP: {len(remap)}  REMOVE: {len(remove)}  UNRESOLVED: {len(unres)}  | Remap-Ziele die NICHT existieren: {len(bad)}")
print("\n-- Remap-Ziele die NICHT existieren (MUSS 0 sein) --")
for f,href,tgt,_,_ in bad[:40]: print(f"   {href:<42} -> {tgt}    (in {f})")
print("\n-- UNRESOLVED (wuerden entfernt) --")
seen=set()
for f,href,tgt,_,_ in unres:
    if href in seen: continue
    seen.add(href); print(f"   {href}    (z.B. {f})")
print("\n-- REMAP eindeutige Paare (Stichprobe) --")
seen=set()
for f,href,tgt,_,_ in remap:
    if href in seen: continue
    seen.add(href)
    if len(seen)<=60: print(f"   {href:<44} -> {tgt}")
print(f"\n(eindeutige Remap-Paare gesamt: {len(seen)})")

if APPLY:
    changed_files=0
    for f in files:
        h=open(f,encoding='utf-8',errors='ignore').read(); orig=h
        def repl(m):
            href,attrs,inner=m.group(1),m.group(2),m.group(3)
            if exists(href): return m.group(0)
            label=re.sub(r'<[^>]+>','',inner).strip()
            tgt=resolve(href,f,label)
            if tgt in ('REMOVE','UNRESOLVED'):
                return ''  # gesamten Anchor entfernen
            if not exists(tgt): return m.group(0)
            return f'<a href="{tgt}"{attrs}>{inner}</a>'
        h=A.sub(repl,h)
        if h!=orig:
            open(f,'w',encoding='utf-8').write(h); changed_files+=1
    print(f"\nGeschrieben: {changed_files} Dateien")
