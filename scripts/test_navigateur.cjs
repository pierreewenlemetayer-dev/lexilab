const {chromium}=require('playwright');
const assert=require('assert');
(async()=>{
 const browser=await chromium.launch({headless:true});
 const page=await browser.newPage();
 const errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:8765/',{waitUntil:'networkidle'});
 await page.locator('#input').fill("L'origine de cette histoire est ancienne. Le chat regarde la maison.");
 await page.locator('#go').click();
 const score=await page.locator('#score').innerText();
 const note=await page.locator('#gauge-note').innerText();
 assert.match(score,/^-?\d+[,.]\d{3}$/,'Score absent');
 assert(!note.includes('Erreur de chargement'),'Chargement lexique en échec');
 assert.deepStrictEqual(errors,[],'Erreurs JavaScript');
 console.log('TEST NAVIGATEUR OK : score='+score+'; note='+note);
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
