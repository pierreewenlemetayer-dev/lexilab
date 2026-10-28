const fs=require('fs'),vm=require('vm'),assert=require('assert'),cp=require('child_process');
const js=fs.readFileSync('js/app.js','utf8');
const lex=JSON.parse(fs.readFileSync('data/lexique.json','utf8'));
const original=cp.execFileSync('git',['show','origin/sauvegarde-avant-separation-lexique:index.html'],{encoding:'utf8',maxBuffer:20*1024*1024});
const originalJs=original.match(/<script>([\s\S]*?)<\/script>/)[1];
const texts=["Le chat regarde la maison. Les enfants jouent dans le jardin.","L'origine de cette histoire est ancienne, mais elle demeure mystérieuse.","Il n'y a qu'un arbre près de l'école.","Un voyageur contemplait l'horizon, puis reprit son chemin.","Les mots rares et les mots fréquents composent ce récit.",""];
function run(source,external,text){
 const ids=['input','score','marker','gauge-note','lemmas','coverage','detail','table','uniques','go'];
 const values=Object.fromEntries(ids.map(k=>[k,{textContent:'',innerHTML:'',style:{},value:text,addEventListener(e,fn){if(e==='click')this.run=fn}}]));
 const ctx={document:{getElementById:id=>values[id]},console,setTimeout:()=>0,clearTimeout:()=>{},Math,Set,Map};
 vm.createContext(ctx);
 vm.runInContext(source,ctx,{timeout:30000});
 if(external)vm.runInContext('demarrerLexiLab(LEXICON)',ctx,{timeout:30000});
 values.go.run();
 return ['score','lemmas','coverage','detail','uniques'].map(k=>values[k].textContent).concat([values.marker.style.left,values.table.innerHTML]);
}
for(const t of texts){
 const a=run(originalJs,false,t),b=run('const LEXICON='+JSON.stringify(lex)+';\n'+js,true,t);
 assert.deepStrictEqual(a,b,'Difference pour '+t);
}
console.log('OK: '+texts.length+' textes, resultats identiques');
