function demarrerLexiLab(LEXICON){
let hoveredRepeatKey=null;
const entries=LEXICON.entries, excluded=new Set(LEXICON.excluded);
const apostrophes=/[’‘`´]/g;
const chosenGoals=new Set();
function goalValue(id){return chosenGoals.has(id)?document.getElementById(id).value:'';}
function refreshGoalLabels(){for(const [id,suffix] of [['goal-words',' mots'],['goal-richness',' / 10'],['goal-diversity',' %']])document.getElementById(id+'-value').textContent=chosenGoals.has(id)?document.getElementById(id).value+suffix:'—';}
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
 updateGoal('words-status',formes.length?formes.length:null,goalValue('goal-words'));
 const diversite=unitesDiversite.length?new Set(unitesDiversite).size/unitesDiversite.length*100:0;
 document.getElementById('diversity-score').textContent=unitesDiversite.length?diversite.toLocaleString('fr-FR',{maximumFractionDigits:1,minimumFractionDigits:1})+' %':'—';
 updateGoal('diversity-status',unitesDiversite.length?diversite:null,goalValue('goal-diversity'));
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
 updateGoal('richness-status',note10,goalValue('goal-richness'));
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
function updateGoal(id,score,targetValue){
 const dot=document.getElementById(id),target=Number(targetValue);
 const valid=targetValue!==''&&Number.isFinite(target)&&target>0&&score!==null&&Number.isFinite(score);
 const color=!valid?'neutral':score>=target?'green':score>=target/2?'orange':'red';
 dot.className='goal-dot '+color;
 const names={neutral:'Objectif non défini ou texte absent',red:'Moins de la moitié de l’objectif',orange:'Au moins la moitié de l’objectif',green:'Objectif atteint'};
 dot.setAttribute('aria-label',names[color]);dot.title=names[color];
}
function renderHighlights(original){
 const layer=document.getElementById('highlight');
 const normalized=original.toLocaleLowerCase('fr').replace(apostrophes,"'");
 const pattern=/[\p{L}]+(?:[-'][\p{L}]+)*/gu;
 const units=[],matches=[...normalized.matchAll(pattern)];
 // Construire les unités et leurs positions exactes pour conserver chaque espace et ponctuation.
 for(const match of matches){
   const token=match[0],parts=(entries[token]||excluded.has(token))?[token]:token.split("'");
   let offset=0;
   for(const part of parts){
     if(!part)continue;
     const index=token.indexOf(part,offset);
     if(index<0)continue;
     const hit=excluded.has(part)?null:entries[part];
     const key=hit?'lemme:'+hit[0]+'|'+hit[1]:'forme:'+part;
     const freq=hit?Number(hit[2]):NaN;
     const frequencyClass=Number.isFinite(freq)&&freq>0?(freq>=100?'freq-very-common':freq>=10?'freq-common':freq>=1?'freq-uncommon':'freq-rare'):'';
     units.push({start:match.index+index,end:match.index+index+part.length,key,frequencyClass});
     offset=index+part.length;
   }
 }
 const counts=new Map();
 for(const unit of units)counts.set(unit.key,(counts.get(unit.key)||0)+1);
 const mode=document.getElementById('repetition-enabled').checked?'repetition':'frequency';
 const repeatedKeys=[...counts].filter(([,count])=>count>1).map(([key])=>key);
 const colorByKey=new Map(repeatedKeys.map((key,index)=>[key,index%16]));
 let result='',last=0;
 for(const unit of units){
   result+=esc(original.slice(last,unit.start));
   const cls=mode==='repetition'?(counts.get(unit.key)>1?'repeat-color-'+colorByKey.get(unit.key):''):unit.frequencyClass;
   const visible=esc(original.slice(unit.start,unit.end));
   result+=cls?'<span class="'+cls+'"'+(mode==='frequency'?' data-frequency="'+(cls==='freq-very-common'?'Très fréquent':cls==='freq-common'?'Fréquent':cls==='freq-uncommon'?'Peu fréquent':'Rare')+'"':' data-repeat-key="'+esc(unit.key)+'"')+'>'+visible+'</span>':visible;
   last=unit.end;
 }
 result+=esc(original.slice(last));
 layer.innerHTML=result+'\n';
 hoveredRepeatKey=null;
 syncHighlightScroll();
}
function syncHighlightScroll(){
 const input=document.getElementById('input'),layer=document.getElementById('highlight');
 layer.scrollTop=input.scrollTop;layer.scrollLeft=input.scrollLeft;
}
function esc(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
const input=document.getElementById('input');
for(const id of ['goal-words','goal-richness','goal-diversity'])document.getElementById(id).addEventListener('input',()=>{chosenGoals.add(id);refreshGoalLabels();analyze();});
refreshGoalLabels();
input.addEventListener('scroll',()=>{syncHighlightScroll();document.getElementById('word-tooltip').hidden=true;});
const tooltip=document.getElementById('word-tooltip');
input.addEventListener('mousemove',event=>{
 if(repetitionToggle.checked){tooltip.hidden=true;highlightHoveredGroup(event);return;}
 clearHoveredGroup();
 if(!frequencyToggle.checked){tooltip.hidden=true;return;}
 const layer=document.getElementById('highlight');
 let found=null;
 for(const span of layer.querySelectorAll('[data-frequency]')){
   for(const rect of span.getClientRects()){
     if(event.clientX>=rect.left&&event.clientX<=rect.right&&event.clientY>=rect.top&&event.clientY<=rect.bottom){
       found=span.dataset.frequency;break;
     }
   }
   if(found)break;
 }
 if(!found){tooltip.hidden=true;return;}
 tooltip.textContent=found;tooltip.hidden=false;
 const bounds=input.getBoundingClientRect();
 tooltip.style.left=Math.min(event.clientX-bounds.left+12,bounds.width-tooltip.offsetWidth-4)+'px';
 tooltip.style.top=Math.max(0,event.clientY-bounds.top-34)+'px';
});
input.addEventListener('mouseleave',()=>{tooltip.hidden=true;clearHoveredGroup();});
function clearHoveredGroup(){
 const layer=document.getElementById('highlight');
 layer.classList.remove('repeat-focus');
 for(const span of layer.querySelectorAll('.repeat-selected'))span.classList.remove('repeat-selected');
}
function highlightHoveredGroup(event){
 const layer=document.getElementById('highlight');
 let found=null;
 for(const span of layer.querySelectorAll('[data-repeat-key]')){
   for(const rect of span.getClientRects()){
     if(event.clientX>=rect.left&&event.clientX<=rect.right&&event.clientY>=rect.top&&event.clientY<=rect.bottom){found=span.dataset.repeatKey;break;}
   }
   if(found!==null)break;
 }
 if(found===hoveredRepeatKey)return;
 hoveredRepeatKey=found;
 layer.classList.toggle('repeat-focus',found!==null);
 for(const span of layer.querySelectorAll('[data-repeat-key]'))span.classList.toggle('repeat-selected',found!==null&&span.dataset.repeatKey===found);
}
const frequencyToggle=document.getElementById('highlight-enabled');
const repetitionToggle=document.getElementById('repetition-enabled');
function updateMode(changed){
 if(changed==='frequency'&&frequencyToggle.checked)repetitionToggle.checked=false;
 if(changed==='repetition'&&repetitionToggle.checked)frequencyToggle.checked=false;
 const enabled=frequencyToggle.checked||repetitionToggle.checked;
 input.classList.toggle('highlight-on',enabled);
 document.getElementById('word-tooltip').hidden=true;
 hoveredRepeatKey=null;
 clearHoveredGroup();
 document.getElementById('highlight').hidden=!enabled;
 document.querySelector('.frequency-legend').hidden=!frequencyToggle.checked;
 if(enabled)renderHighlights(input.value);
}
frequencyToggle.addEventListener('change',()=>updateMode('frequency'));
repetitionToggle.addEventListener('change',()=>updateMode('repetition'));
let pending; input.addEventListener('input',()=>{
 clearTimeout(pending);
 // Ne jamais masquer le texte tant que le calque n'a pas été actualisé.
 input.classList.remove('highlight-on');
 pending=setTimeout(()=>{try{analyze();updateMode();}catch(error){console.error(error);input.classList.remove('highlight-on');}},220);
});
try{analyze();updateMode();}catch(error){console.error(error);input.classList.remove('highlight-on');}

}
