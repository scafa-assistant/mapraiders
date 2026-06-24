"""
MapRaiders — Coming Soon Update
Ersetzt alle APK-Download-Buttons durch Waitlist / Notify-Me
Läuft auf dem Hetzner VPS via Paramiko oder lokal via SSH
"""

import re, sys

# ── Modal HTML (wird einmal in jede Seite injiziert) ──────────────────────────
MODAL_HTML = """
<!-- COMING SOON MODAL -->
<div id="cs-modal" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,.7);z-index:9999;align-items:center;justify-content:center;">
  <div style="background:var(--surface,#1a1a2e);border-radius:20px;padding:40px;max-width:440px;width:90%;text-align:center;border:1px solid var(--accent,#ff6b35);">
    <div style="font-size:2.5rem;margin-bottom:12px;">🚀</div>
    <h2 style="margin:0 0 8px;color:var(--text,#fff);font-size:1.5rem;">Launch Q3 2026</h2>
    <p style="color:var(--dim,#888);margin:0 0 24px;font-size:.95rem;">
      Trag dich ein — wir schreiben dir als Erstes wenn MapRaiders live geht.
    </p>
    <form action="https://formspree.io/f/mwpbpjoj" method="POST"
          onsubmit="document.getElementById('cs-thanks').style.display='block';this.style.display='none';">
      <input type="email" name="email" required placeholder="deine@email.com"
             style="width:100%;box-sizing:border-box;padding:12px 16px;border-radius:10px;border:1px solid var(--accent,#ff6b35);background:var(--bg,#0d0d1a);color:var(--text,#fff);font-size:1rem;margin-bottom:12px;">
      <input type="hidden" name="_subject" value="MapRaiders Waitlist">
      <input type="hidden" name="_next" value="https://mapraiders.com/?waitlist=ok">
      <button type="submit"
              style="width:100%;padding:14px;border-radius:10px;background:var(--accent,#ff6b35);color:#fff;border:none;font-size:1rem;font-weight:700;cursor:pointer;">
        🔔 Beim Launch benachrichtigen
      </button>
    </form>
    <div id="cs-thanks" style="display:none;color:var(--accent,#ff6b35);font-weight:700;font-size:1.1rem;padding:16px 0;">
      ✓ Du bist auf der Liste!
    </div>
    <button onclick="document.getElementById('cs-modal').style.display='none'"
            style="margin-top:16px;background:none;border:none;color:var(--dim,#888);cursor:pointer;font-size:.9rem;">
      Schließen
    </button>
  </div>
</div>
<script>
function showNotify(){
  var m=document.getElementById('cs-modal');
  m.style.display='flex';
}
document.getElementById('cs-modal').addEventListener('click',function(e){
  if(e.target===this) this.style.display='none';
});
</script>
"""

# ── Ersetzungsregeln ──────────────────────────────────────────────────────────
def patch_html(html: str, lang: str = "de") -> str:

    # Labels per Sprache
    notify_labels = {
        "de": ("🔔 Beta beitreten", "🔔 Beim Launch benachrichtigen", "Launch Q3 2026 · Android &amp; iOS"),
        "en": ("🔔 Join Beta", "🔔 Notify me at launch", "Launch Q3 2026 · Android &amp; iOS"),
        "fr": ("🔔 Rejoindre la bêta", "🔔 Notifie-moi au lancement", "Lancement Q3 2026 · Android &amp; iOS"),
        "es": ("🔔 Unirse a la beta", "🔔 Notificarme al lanzamiento", "Lanzamiento Q3 2026 · Android &amp; iOS"),
        "it": ("🔔 Unisciti alla beta", "🔔 Notificami al lancio", "Lancio Q3 2026 · Android &amp; iOS"),
        "pt": ("🔔 Entrar na beta", "🔔 Notificar no lançamento", "Lançamento Q3 2026 · Android &amp; iOS"),
        "ru": ("🔔 Вступить в бету", "🔔 Уведомить при запуске", "Запуск Q3 2026 · Android &amp; iOS"),
        "ja": ("🔔 ベータ参加", "🔔 リリース時に通知", "2026年Q3リリース · Android &amp; iOS"),
        "ko": ("🔔 베타 참가", "🔔 출시 알림 받기", "2026년 Q3 출시 · Android &amp; iOS"),
        "zh": ("🔔 加入测试", "🔔 发布时通知我", "2026年Q3发布 · Android &amp; iOS"),
        "ar": ("🔔 انضم للتجربة", "🔔 إشعاري عند الإطلاق", "إطلاق Q3 2026 · Android &amp; iOS"),
        "hi": ("🔔 बीटा जॉइन करें", "🔔 लॉन्च पर सूचित करें", "लॉन्च Q3 2026 · Android &amp; iOS"),
        "tr": ("🔔 Beta'ya katıl", "🔔 Çıkışta bildir", "Çıkış Q3 2026 · Android &amp; iOS"),
    }
    nav_label, hero_label, cta_note = notify_labels.get(lang, notify_labels["en"])

    # 1. Nav Download-Button
    html = re.sub(
        r'<a\s+href="[^"]*\.apk[^"]*"\s+class="btn-dl">[^<]*</a>',
        f'<a href="#" class="btn-dl" onclick="showNotify();return false;">{nav_label}</a>',
        html
    )

    # 2. Hero + Footer btn-p APK-Links
    html = re.sub(
        r'<a\s+href="[^"]*\.apk[^"]*"\s+class="btn-p">[^<]*</a>',
        f'<a href="#" class="btn-p" onclick="showNotify();return false;">{hero_label}</a>',
        html
    )

    # 3. cta-note Text (Android APK • iOS kommt bald → Launch info)
    html = re.sub(
        r'(<div\s+class="cta-note">)[^<]*(</div>)',
        rf'\g<1>{cta_note}\g<2>',
        html
    )

    # 4. "Beta Live" Badge in hero → "Coming Q3 2026"
    html = re.sub(
        r'(<span[^>]*class="[^"]*badge[^"]*"[^>]*>)[^<]*(</span>)',
        r'\g<1>🚀 Q3 2026\g<2>',
        html
    )

    # 5. Modal + JS einbauen (vor </body>)
    if 'cs-modal' not in html:
        html = html.replace('</body>', MODAL_HTML + '\n</body>')

    return html


# ── SSH-basierter Deploy ──────────────────────────────────────────────────────
def deploy_via_ssh():
    import paramiko, io
    HOST = "159.69.157.42"
    USER = "root"
    KEY_PATH = "C:/Users/r.scafarti/.ssh/id_rsa"  # anpassen falls abweichend

    lang_paths = {
        "de": "/var/www/mapraiders/index.html",
        "en": "/var/www/mapraiders/en/index.html",
        "fr": "/var/www/mapraiders/fr/index.html",
        "es": "/var/www/mapraiders/es/index.html",
        "it": "/var/www/mapraiders/it/index.html",
        "pt": "/var/www/mapraiders/pt/index.html",
        "ru": "/var/www/mapraiders/ru/index.html",
        "ja": "/var/www/mapraiders/ja/index.html",
        "ko": "/var/www/mapraiders/ko/index.html",
        "zh": "/var/www/mapraiders/zh/index.html",
        "ar": "/var/www/mapraiders/ar/index.html",
        "hi": "/var/www/mapraiders/hi/index.html",
        "tr": "/var/www/mapraiders/tr/index.html",
    }

    print(f"Connecting to {HOST}...")
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    try:
        client.connect(HOST, username=USER, key_filename=KEY_PATH, timeout=15)
    except Exception as e:
        print(f"SSH key failed ({e}), trying agent...")
        client.connect(HOST, username=USER, timeout=15)

    sftp = client.open_sftp()
    updated = 0

    for lang, remote_path in lang_paths.items():
        try:
            # Download
            buf = io.BytesIO()
            sftp.getfo(remote_path, buf)
            original = buf.getvalue().decode('utf-8')

            # Patch
            patched = patch_html(original, lang)

            if patched == original:
                print(f"  [{lang}] no changes needed")
                continue

            # Backup
            sftp.rename(remote_path, remote_path + ".bak")

            # Upload
            sftp.putfo(io.BytesIO(patched.encode('utf-8')), remote_path)
            client.exec_command(f"chmod 644 {remote_path}")
            print(f"  [{lang}] ✓ updated ({remote_path})")
            updated += 1

        except FileNotFoundError:
            print(f"  [{lang}] skipped (file not found: {remote_path})")
        except Exception as e:
            print(f"  [{lang}] ERROR: {e}")

    sftp.close()
    client.close()
    print(f"\nDone — {updated} files updated.")


if __name__ == "__main__":
    # Prüfen ob paramiko da ist
    try:
        import paramiko
    except ImportError:
        print("Installiere paramiko: pip install paramiko")
        print("Dann nochmal starten.")
        sys.exit(1)

    deploy_via_ssh()
