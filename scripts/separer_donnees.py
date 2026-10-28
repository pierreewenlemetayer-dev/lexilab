from pathlib import Path
import json,hashlib,re
p=Path("index.html")
s=p.read_text(encoding="utf-8")
m=re.search(r"const LEXICON\s*=\s*",s)
assert m,"Lexique introuvable"
obj,n=json.JSONDecoder().raw_decode(s[m.end():])
raw=s[m.end():m.end()+n]
assert len(obj["entries"])>170000 and "excluded" in obj
a=s.index("<script>")+len("<script>")
b=s.index("</script>",a)
script=s[a:b]
assert script.startswith("const LEXICON = "+raw+";")
logic=script[len("const LEXICON = "+raw+";"):].lstrip("\n")
assert logic.startswith("const entries=LEXICON.entries")
c=s.index("<style>");d=s.index("</style>",c)+len("</style>")
Path("data").mkdir(exist_ok=True)
Path("js").mkdir(exist_ok=True)
Path("css").mkdir(exist_ok=True)
Path("data/lexique.json").write_text(raw+"\n",encoding="utf-8")
Path("js/app.js").write_text("function demarrerLexiLab(LEXICON){\n"+logic+"\n}\n",encoding="utf-8")
Path("css/style.css").write_text(s[c+len("<style>"):d-len("</style>")],encoding="utf-8")
new='<script src="js/app.js"></script>\n<script>fetch("data/lexique.json").then(r=>{if(!r.ok)throw Error("Dictionnaire indisponible");return r.json()}).then(demarrerLexiLab).catch(e=>{console.error(e);document.getElementById("gauge-note").textContent="Erreur de chargement du dictionnaire.";document.getElementById("go").disabled=true})</script>'
s=s[:a-len("<script>")]+new+s[b+len("</script>"):]
s=s[:c]+'<link rel="stylesheet" href="css/style.css">'+s[d:]
assert json.loads(Path("data/lexique.json").read_text(encoding="utf-8"))==obj
assert hashlib.sha256(Path("data/lexique.json").read_text(encoding="utf-8").strip().encode()).hexdigest()==hashlib.sha256(raw.encode()).hexdigest()
p.write_text(s,encoding="utf-8")
print("OK",len(obj["entries"]),"entrées",hashlib.sha256(raw.encode()).hexdigest())
