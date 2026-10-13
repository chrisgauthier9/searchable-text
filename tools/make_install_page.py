import sys
style = open(sys.argv[1]).read()
style = style.replace("</style>", """.menubar { display: flex; gap: 18px; align-items: center; justify-content: flex-end; background: #1D3A5C; color: #fff; border-radius: 8px; padding: 6px 14px; font: 14px -apple-system, sans-serif; max-width: 420px; }
.menubar .ring { display: grid; place-items: center; border-radius: 4px; }
.lang { justify-self: end; display: flex; gap: 6px; }
.lang button { font: 700 0.9rem var(--body); background: var(--card); color: var(--muted); border: 1px solid var(--line); border-radius: 8px; padding: 6px 12px; cursor: pointer; }
.lang button[aria-pressed="true"] { background: var(--accent); color: var(--accent-ink); border-color: var(--accent); }
html[lang="en"] main[lang="fr"], html[lang="fr"] main[lang="en"] { display: none; }
</style>""")
DL = "https://github.com/chrisgauthier9/searchable-text/releases/latest/download/Searchable.Text.dmg"
T = {
 "en": dict(
  intro="Copies the text out of a hospital report so you can paste it into the chart, where it can be searched. Everything stays on your Mac.",
  dl="Download for Mac", dlnote="The download lands in your Downloads folder. Double-click it to open it.",
  when1="Setting up · once, about 2 minutes", h1="Put it on your Mac",
  s1="A window opens. Drag the <b>Searchable Text</b> icon onto the <b>Applications</b> folder next to it.",
  s1shot="Drag Searchable Text into Applications",
  s2="Open your <b>Applications</b> folder and double-click <b>Searchable Text</b>. Your Mac asks if you want to open an app from the internet. Click <b>Open</b>.",
  s2shot='"Searchable Text" is an app downloaded from the Internet. Are you sure you want to open it?', cancel="Cancel", open="Open",
  s3="A small clipboard icon appears at the top right of your screen, next to the clock. That is Searchable Text. It starts by itself every time your Mac turns on.",
  s3b="Had the older version in your Dock? Drag that old icon out of the Dock. If you do not see the clipboard icon, open System Settings > Menu Bar and switch on Searchable Text.",
  when2="The first time you use it", h2="Say yes twice",
  f1="Open any report from the chart, then click the clipboard icon at the top of your screen.",
  f2="Your Mac asks if Searchable Text may use <b>Adobe Acrobat</b>. Click <b>Allow</b>.",
  f2shot='"Searchable Text" wants access to control "Adobe Acrobat".', dont="Don't Allow", allow="Allow",
  f3="If it asks about notifications, click <b>Allow</b> too.",
  when3="Every day", h3="Open, click, paste",
  d1="Open the report from the chart.", d2="Click the clipboard icon at the top of your screen. A note appears in the corner.",
  toastT="Report text copied", toastB="Click in the chart note and press Command-V.",
  d3="Click in the chart note and press <b>Command-V</b> (⌘V).",
  h4="If something looks off",
  help=[('"Please check it"',"The report has an unusual layout. The text is copied, but read it over before you save."),
        ('"No report is open"',"Open the report first, then click the icon again."),
        ('"This report is a scanned image"',"That report is a picture, so there is no text to copy."),
        ("Anything else","Nothing was copied. Let Chris know.")],
  upd="Updates install by themselves. You never need to set it up again."),
 "fr": dict(
  intro="Copie le texte d'un rapport d'hôpital pour que vous puissiez le coller dans le dossier, où il devient cherchable. Tout reste sur votre Mac.",
  dl="Télécharger pour Mac", dlnote="Le fichier arrive dans votre dossier Téléchargements. Double-cliquez dessus pour l'ouvrir.",
  when1="Installation · une seule fois, environ 2 minutes", h1="L'installer sur votre Mac",
  s1="Une fenêtre s'ouvre. Glissez l'icône <b>Searchable Text</b> sur le dossier <b>Applications</b> à côté.",
  s1shot="Glissez Searchable Text dans Applications",
  s2="Ouvrez votre dossier <b>Applications</b> et double-cliquez sur <b>Searchable Text</b>. Votre Mac demande si vous voulez ouvrir une app téléchargée d'Internet. Cliquez sur <b>Ouvrir</b>.",
  s2shot="« Searchable Text » est une app téléchargée depuis Internet. Voulez-vous vraiment l'ouvrir?", cancel="Annuler", open="Ouvrir",
  s3="Une petite icône de presse-papiers apparaît en haut à droite de l'écran, près de l'heure. C'est Searchable Text. Elle se lance toute seule à chaque démarrage du Mac.",
  s3b="Vous aviez l'ancienne version dans le Dock? Glissez cette ancienne icône hors du Dock. Si vous ne voyez pas l'icône de presse-papiers, ouvrez Réglages Système > Barre des menus et activez Searchable Text.",
  when2="La première fois", h2="Dites oui deux fois",
  f1="Ouvrez n'importe quel rapport depuis le dossier, puis cliquez sur l'icône de presse-papiers en haut de l'écran.",
  f2="Votre Mac demande si Searchable Text peut utiliser <b>Adobe Acrobat</b>. Cliquez sur <b>Autoriser</b>.",
  f2shot="« Searchable Text » souhaite obtenir l'accès pour contrôler « Adobe Acrobat ».", dont="Refuser", allow="Autoriser",
  f3="S'il demande pour les notifications, cliquez aussi sur <b>Autoriser</b>.",
  when3="Chaque jour", h3="Ouvrir, cliquer, coller",
  d1="Ouvrez le rapport depuis le dossier.", d2="Cliquez sur l'icône de presse-papiers en haut de l'écran. Une note apparaît dans le coin.",
  toastT="Report text copied", toastB="Click in the chart note and press Command-V.",
  d3="Cliquez dans la note du dossier et appuyez sur <b>Commande-V</b> (⌘V).",
  h4="Si quelque chose cloche",
  help=[('"Please check it"',"Le rapport a une mise en page inhabituelle. Le texte est copié, mais relisez-le avant d'enregistrer."),
        ('"No report is open"',"Aucun rapport ouvert. Ouvrez d'abord le rapport, puis recliquez sur l'icône."),
        ('"This report is a scanned image"',"Ce rapport est une image : il n'y a pas de texte à copier."),
        ("Autre chose","Rien n'a été copié. Prévenez Chris.")],
  upd="Les mises à jour s'installent toutes seules. Vous n'aurez jamais à refaire l'installation."),
}
CLIP='<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><rect x="5" y="4" width="13" height="17" rx="2"/><rect x="8.5" y="2.5" width="6" height="3" rx="1"/><path d="M8.5 11h6M8.5 14.5h6"/></svg>'
def main(l):
    t = T[l]
    help_ = "\n".join(f'      <div><b>{a}</b><span>{b}</span></div>' for a,b in t["help"])
    return f'''<main lang="{l}">
  <div class="lang"><button type="button" data-l="en">English</button><button type="button" data-l="fr">Français</button></div>
  <header class="hero">
    <img src="icon.png" alt="">
    <div><h1>Searchable Text</h1><p>{t["intro"]}</p></div>
  </header>
  <div class="download">
    <a class="btn" href="{DL}">{t["dl"]}</a>
    <p class="small">{t["dlnote"]}</p>
  </div>
  <section>
    <p class="when">{t["when1"]}</p>
    <h2>{t["h1"]}</h2>
    <ol>
      <li><div><p>{t["s1"]}</p>
        <div class="shot drag" aria-hidden="true"><p class="dragtitle">{t["s1shot"]}</p>
          <div class="dragrow"><img src="icon.png" alt=""><span class="arrow">&rarr;</span><span class="folder"></span></div></div>
      </div></li>
      <li><div><p>{t["s2"]}</p>
        <div class="shot" aria-hidden="true"><p>{t["s2shot"]}</p>
          <div class="row"><span class="macbtn">{t["cancel"]}</span><span class="macbtn go ring">{t["open"]}</span></div></div>
      </div></li>
      <li><div><p>{t["s3"]}</p>
        <div class="menubar" aria-hidden="true"><span class="ring">{CLIP}</span><span>Wi-Fi</span><span>Tue 5:14 PM</span></div>
        <p class="small">{t["s3b"]}</p>
      </div></li>
    </ol>
  </section>
  <section>
    <p class="when">{t["when2"]}</p>
    <h2>{t["h2"]}</h2>
    <ol>
      <li><div><p>{t["f1"]}</p></div></li>
      <li><div><p>{t["f2"]}</p>
        <div class="shot" aria-hidden="true"><p>{t["f2shot"]}</p>
          <div class="row"><span class="macbtn">{t["dont"]}</span><span class="macbtn go ring">{t["allow"]}</span></div></div>
      </div></li>
      <li><div><p>{t["f3"]}</p></div></li>
    </ol>
  </section>
  <section class="daily">
    <p class="when">{t["when3"]}</p>
    <h2>{t["h3"]}</h2>
    <ol>
      <li><div><p>{t["d1"]}</p></div></li>
      <li><div><p>{t["d2"]}</p>
        <div class="shot toast" aria-hidden="true"><img src="icon.png" alt=""><div><b>{t["toastT"]}</b>{t["toastB"]}</div></div>
      </div></li>
      <li><div><p>{t["d3"]}</p></div></li>
    </ol>
  </section>
  <section>
    <h2>{t["h4"]}</h2>
    <div class="help">
{help_}
    </div>
    <p class="small">{t["upd"]}</p>
  </section>
</main>'''
print(f'''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Searchable Text</title>
<link rel="icon" href="icon.png">
<script>
(function () {{
  var l = null;
  try {{ l = localStorage.getItem('lang'); }} catch (e) {{}}
  if (!l) l = (navigator.language || 'en').toLowerCase().indexOf('fr') === 0 ? 'fr' : 'en';
  document.documentElement.lang = l;
}})();
</script>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:wght@400;700&family=Literata:opsz,wght@7..72,600&display=swap">
{style}
</head>
<body>
{main("en")}
{main("fr")}
<script>
function setLang(l) {{
  document.documentElement.lang = l;
  document.querySelectorAll('.lang button').forEach(function (b) {{ b.setAttribute('aria-pressed', String(b.dataset.l === l)); }});
  try {{ localStorage.setItem('lang', l); }} catch (e) {{}}
}}
document.querySelectorAll('.lang button').forEach(function (b) {{ b.onclick = function () {{ setLang(b.dataset.l); }}; }});
setLang(document.documentElement.lang);
</script>
</body>
</html>''')
