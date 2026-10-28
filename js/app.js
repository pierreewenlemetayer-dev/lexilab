function demarrerLexiLab(LEXICON){
const entries=LEXICON.entries, excluded=new Set(LEXICON.excluded);
const apostrophes=/[’‘`´]/g;
function analyze(){
 const original=document.getElementById('input').value;
 renderHighlights(original);
 // Diversité : aucune exclusion ; les formes inconnues ou exclues restent comptées.
 // Le découpage est indépendant de celui de l'indice de fréquence, qui reste inchangé.
 const formes=original.toLocaleLowerCase('fr').replace(apostrophes,"'").match(/[\p{L}]+(?:[-'][\p{L}]+)*/gu)||[];
 const unitesDiversite=[];
 for(const forme of formes){
   const parties=(entries[forme]||excluded.has(forme))?[forme]:forme.split("'");
   for(const partie of parties){
     if(!partie)continue;
     const hit=excluded.has(partie)?null:entries[partie];
     unitesDiversite.push(hit?'lemme:'+hit[0]+'|'+hit[1]:'forme:'+partie);
   }
 }
 const diversite=unitesDiversite.length?new Set(unitesDiversite).size/unitesDiversite.length*100:0;
 document.getElementById('diversity-score').textContent=unitesDiversite.length?diversite.toLocaleString('fr-FR',{maximumFractionDigits:1,minimumFractionDigits:1})+' %':'—';
 const raw=original.toLocaleLowerCase('fr').replace(apostrophes,"'");
 const tokens=raw.match(/[\p{L}]+(?:[-'][\p{L}]+)*/gu)||[];
 const records=[], unknown=[], dropped=[];const unique=new Map();
 for(const token of tokens){
   // full word first; if absent, split at apostrophe (l'enfant -> l' + enfant)
   const parts=(entries[token]||excluded.has(token))?[token]:token.split("'");
   for(const part of parts){if(!part)continue;
     if(excluded.has(part)){dropped.push(part);records.push({form:part,status:'Exclu',lemma:'',pos:'',freq:null});continue;}
     const hit=entries[part];
     if(!hit){unknown.push(part);records.push({form:part,status:'Inconnu',lemma:'',pos:'',freq:null});continue;}
     const [lemma,pos,freq]=hit;const key=lemma+'|'+pos;
     if(!unique.has(key))unique.set(key,{lemma,pos,freq});
     records.push({form:part,status:'Retenu',lemma,pos,freq});
   }
 }
 const items=[...unique.values()], ifraw=items.length?items.reduce((s,x)=>s-Math.log10(x.freq),0)/items.length:null;
 const recognized=records.filter(x=>x.status==='Retenu').length;
 const fmt=v=>v===null?'—':v.toLocaleString('fr-FR',{maximumFractionDigits:3,minimumFractionDigits:3});
 const low=-2.660986,high=-1.074392;
 const note10=ifraw===null?null:Math.max(1,Math.min(10,1+9*(ifraw-low)/(high-low)));
 document.getElementById('score').textContent=note10===null?'—':note10.toLocaleString('fr-FR',{minimumFractionDigits:1,maximumFractionDigits:1});
 const marker=document.getElementById('marker');
 const pct=note10===null?0:(note10-1)/9*100;
 marker.style.left=pct+'%';
 document.getElementById('raw-index').textContent=fmt(ifraw);
 document.getElementById('lemmas').textContent=items.length;
 document.getElementById('coverage').textContent=records.length?Math.round(100*recognized/records.length)+' %':'—';
 document.getElementById('detail').textContent=`${tokens.length} unités initiales · ${records.length} unités après séparation des apostrophes · ${dropped.length} exclusions · ${unknown.length} non reconnues`;
 document.getElementById('table').innerHTML=records.map(x=>`<tr><td>${esc(x.form)}</td><td>${esc(x.status)}</td><td>${esc(x.lemma)}</td><td>${esc(x.pos)}</td><td class="num">${x.freq===null?'':fmt(x.freq)}</td></tr>`).join('');
 document.getElementById('uniques').textContent=items.sort((a,b)=>a.lemma.localeCompare(b.lemma,'fr')).map(x=>`${x.lemma} (${x.pos})`).join(' · ')||'—';
}
function renderHighlights(original){
 const layer=document.getElementById('highlight');
 const text=original.toLocaleLowerCase('fr').replace(apostrophes,"'");
 const pattern=/[\p{L}]+(?:[-'][\p{L}]+)*/gu;
 let result='',last=0,match;
 while((match=pattern.exec(text))!==null){
   result+=esc(original.slice(last,match.index));
   const token=match[0],originalToken=original.slice(match.index,match.index+token.length);
   const parts=(entries[token]||excluded.has(token))?[token]:token.split("'");
   let offset=0;
   for(let i=0;i<parts.length;i++){
     const part=parts[i];if(!part)continue;
     const index=token.indexOf(part,offset);
     if(index>offset)result+=esc(originalToken.slice(offset,index));
     const hit=excluded.has(part)?null:entries[part];
     const freq=hit?Number(hit[2]):NaN;
     const category=Number.isFinite(freq)&&freq>0?(freq>=100?'freq-very-common':freq>=10?'freq-common':freq>=1?'freq-uncommon':'freq-rare'):'';
     const visible=esc(originalToken.slice(index,index+part.length));
     result+=category?'<span class="'+category+'">'+visible+'</span>':visible;
     offset=index+part.length;
   }
   result+=esc(originalToken.slice(offset));
   last=match.index+token.length;
 }
 result+=esc(original.slice(last));
 layer.innerHTML=result+'\n';
 syncHighlightScroll();
}
function syncHighlightScroll(){
 const input=document.getElementById('input'),layer=document.getElementById('highlight');
 layer.scrollTop=input.scrollTop;layer.scrollLeft=input.scrollLeft;
}
function esc(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
analyze();
const input=document.getElementById('input');
input.addEventListener('scroll',syncHighlightScroll);
document.getElementById('highlight-enabled').addEventListener('change',e=>{const enabled=e.target.checked;input.classList.toggle('highlight-on',enabled);document.getElementById('highlight').hidden=!enabled;});
let pending; document.getElementById('input').addEventListener('input',()=>{clearTimeout(pending);pending=setTimeout(analyze,220)});

}
