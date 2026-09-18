import {test,expect} from '@playwright/test';
import fs from 'node:fs';
import {zipSync,strToU8,unzipSync} from 'fflate';
test('demo recovers content, downloads valid archive, and stays local',async({page},testInfo)=>{
 const unexpected=[];page.on('request',r=>{if(!r.url().startsWith('http://127.0.0.1:4178')&&!r.url().startsWith('data:')&&!r.url().startsWith('blob:http://127.0.0.1:4178/'))unexpected.push(r.url());if(r.method()!=='GET')unexpected.push(r.method());});
 await page.setViewportSize({width:1280,height:1100});await page.goto('/');if(testInfo.project.name==='chromium')await page.screenshot({path:'docs/before.png',fullPage:false});await page.getByRole('button',{name:'Just looking?'}).click();await expect(page.locator('#result')).toBeVisible();await expect(page.locator('#counts')).toHaveText('8 paragraphs · 1 embedded image');
 const preview=page.frameLocator('#preview');await expect(preview.locator('img')).toBeVisible();await expect.poll(()=>preview.locator('img').evaluate(i=>i.complete&&i.naturalWidth>0)).toBe(true);await expect(preview.locator('p').first()).toHaveText('The little garden journal');if(testInfo.project.name==='chromium')await page.screenshot({path:'docs/after.png',fullPage:false});
 const downloadPromise=page.waitForEvent('download');await page.locator('#zip').click();const download=await downloadPromise;const archive=unzipSync(fs.readFileSync(await download.path()));expect(Object.keys(archive)).toContain('images/garden.png');expect(new TextDecoder().decode(archive['recovered.txt'])).toContain('Some things are worth keeping.');expect(unexpected).toEqual([]);
 await page.getByRole('button',{name:'Open another file'}).click();await expect(page.locator('#result')).toBeHidden();
});
test('rejects binary, malformed XML, entities and archive expansion',async({page})=>{
 await page.goto('/');for(const buffer of [Buffer.from('old binary file'),Buffer.from(zipSync({'summary.xml':strToU8('<bad'),'story/1.xml':strToU8('<x/>')})),Buffer.from(zipSync({'summary.xml':strToU8('<!DOCTYPE x><x/>'),'story/1.xml':strToU8('<x/>')})),Buffer.from(zipSync({'oversized':new Uint8Array(100000001)}))]){await page.locator('#file').setInputFiles({name:'test.ppp',mimeType:'application/octet-stream',buffer});await expect(page.locator('#status')).toHaveClass('error');await expect(page.locator('#result')).toBeHidden();}
});
test('escapes injected document HTML',async({page})=>{await page.goto('/');const buffer=Buffer.from(zipSync({'summary.xml':strToU8('<SerifXML><Summary Title="&lt;script&gt;"/></SerifXML>'),'story/1.xml':strToU8('<x><p>&lt;img src=x onerror=alert(1)&gt;</p></x>')}));await page.locator('#file').setInputFiles({name:'injection.ppp',mimeType:'application/octet-stream',buffer});await expect(page.frameLocator('#preview').locator('p')).toHaveText('<img src=x onerror=alert(1)>');await expect(page.frameLocator('#preview').locator('script,img')).toHaveCount(0);});
test('responsive at common widths',async({page},testInfo)=>{for(const width of [375,768,1024,1440]){await page.setViewportSize({width,height:900});await page.goto('/');const size=await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth,overflow:[...document.querySelectorAll('body *')].filter(e=>e.getBoundingClientRect().right>innerWidth).map(e=>({tag:e.tagName,id:e.id,class:e.className,right:e.getBoundingClientRect().right}))}));expect(size.scroll,JSON.stringify(size)).toBeLessThanOrEqual(size.width);}await page.setViewportSize({width:375,height:812});if(testInfo.project.name==='chromium')await page.screenshot({path:'docs/mobile.png',fullPage:true});});
if(process.env.PPP_SAMPLE_DIR)for(const [name,count,images]of [['customising',104,19],['graph-paper',38,4]])test('real sample '+name,async({page})=>{await page.goto('/');await page.locator('#file').setInputFiles(`${process.env.PPP_SAMPLE_DIR}/${name}.ppp`);await expect(page.locator('#result')).toBeVisible();const paragraphs=await page.frameLocator('#preview').locator('p').allTextContents();expect(paragraphs.length).toBe(count);if(process.env.PPP_EXPECTED_DIR){const expected=JSON.parse(fs.readFileSync(`${process.env.PPP_EXPECTED_DIR}/${name}/recovered.json`)).stories.flatMap(s=>s.paragraphs);expect(paragraphs).toEqual(expected);}await expect(page.frameLocator('#preview').locator('img')).toHaveCount(images);expect(await page.frameLocator('#preview').locator('img').evaluateAll(imgs=>imgs.every(i=>i.complete&&i.naturalWidth>0))).toBe(true);});

test('recovers bin images, lists every image, and reports missing resources and fields',async({page})=>{
 await page.goto('/');const image=fs.readFileSync('public/demo-art.png');
 const input=zipSync({'summary.xml':strToU8('<SerifXML><Summary Title="Image recovery"/></SerifXML>'),'story/1.xml':strToU8('<x><p>Hello</p><p><glyph _class="GlyphFieldPageNumber" _id="field1"/></p></x>'),'resources.xml':strToU8('<x><r _id="img1" _class="BitmapResource" Data="_bin_bin\\photo.bin"/><r _id="img2" _class="BitmapResource" Data="_bin_images\\absent.png"/><r _id="img3" _class="BitmapResource" Data="_bin_images\\raw.wdp"/></x>'),'bin/photo.bin':image,'images/raw.wdp':strToU8('unsupported')});
 await page.locator('#file').setInputFiles({name:'images.ppp',mimeType:'application/octet-stream',buffer:Buffer.from(input)});await expect(page.locator('#result')).toBeVisible();await expect(page.locator('#counts')).toHaveText('2 paragraphs · 1 embedded image');await expect(page.locator('#warnings')).toContainText('1 image resource(s)');await expect(page.locator('#warnings')).toContainText('1 embedded image resource(s)');await expect(page.locator('#warnings')).toContainText('1 automatic field');
 await page.locator('#gallery summary').click();await expect(page.locator('#gallery-items img')).toHaveCount(1);await expect.poll(()=>page.locator('#gallery-items img').evaluate(i=>i.complete&&i.naturalWidth>0)).toBe(true);
 const next=page.waitForEvent('download');await page.locator('#zip').click();const zip=unzipSync(fs.readFileSync(await (await next).path()));const imgName=Object.keys(zip).find(n=>n.endsWith('.png'));expect(Buffer.from(zip[imgName])).toEqual(image);expect(new TextDecoder().decode(zip['recovered.html'])).toContain(imgName);
 const single=page.waitForEvent('download');await page.locator('#gallery-items a').click();expect(fs.readFileSync(await(await single).path())).toEqual(image);
 await page.getByRole('button',{name:'Open another file'}).click();await expect(page.locator('#gallery-items a')).toHaveCount(0);
});

test('cancel and timeout stop the worker and allow another file',async({page})=>{
 await page.goto('/');await page.route('**/src/recovery.worker.js*',r=>r.fulfill({contentType:'text/javascript',body:'onmessage=()=>{while(true){}}'}));
 await page.locator('#file').setInputFiles('public/demo.ppp');await expect(page.locator('#cancel')).toBeVisible();await page.locator('#cancel').click();await expect(page.locator('#status')).toHaveText('Cancelled. Choose a file to try again.');await expect(page.locator('#file')).toBeEnabled();
 await page.clock.install();await page.locator('#file').setInputFiles('public/demo.ppp');await page.clock.fastForward(31000);await expect(page.locator('#status')).toContainText('30 seconds');await page.clock.resume();
 await page.unroute('**/src/recovery.worker.js*');await page.locator('#file').setInputFiles('public/demo.ppp');await expect(page.locator('#result')).toBeVisible();
});
test('rejects truncated archives, path traversal, deep XML and recovers after errors',async({page})=>{
 await page.goto('/');const demo=fs.readFileSync('public/demo.ppp');const corrupt=Buffer.from(demo);const central=corrupt.indexOf(Buffer.from([80,75,1,2]));corrupt[central+16]^=1;const deep='<x>'.repeat(90)+'</x>'.repeat(90);
 for(const buffer of [corrupt,demo.subarray(0,demo.length-30),Buffer.from(zipSync({'../bad':strToU8('x')})),Buffer.from(zipSync({'summary.xml':strToU8(deep),'story/1.xml':strToU8('<x><p>hello</p></x>')}))]){await page.locator('#file').setInputFiles({name:'broken.ppp',mimeType:'application/octet-stream',buffer});await expect(page.locator('#status')).toHaveClass('error');await expect(page.locator('#cancel')).toBeHidden();}
 await page.locator('#file').setInputFiles('public/demo.ppp');await expect(page.locator('#result')).toBeVisible();
});
test('skips images with unsafe dimensions and includes warnings in exports',async({page})=>{
 await page.goto('/');const png=Buffer.from(fs.readFileSync('public/demo-art.png'));png.writeUInt32BE(100000,16);png.writeUInt32BE(100000,20);
 const buffer=Buffer.from(zipSync({'summary.xml':strToU8('<x><Summary Title="Limits"/></x>'),'story/1.xml':strToU8('<x><p>Keep this text.</p></x>'),'images/huge.png':png}));
 await page.locator('#file').setInputFiles({name:'limits.ppp',mimeType:'application/octet-stream',buffer});await expect(page.locator('#result')).toBeVisible();await expect(page.locator('#warnings')).toContainText('image safety limit');await expect(page.locator('#gallery')).toBeHidden();
 const htmlDownload=page.waitForEvent('download');await page.locator('#html').click();const html=fs.readFileSync(await(await htmlDownload).path(),'utf8');expect(html).toContain('Keep this text.');expect(html).toContain('image safety limit');expect(html).not.toContain('data:image');
 const txtDownload=page.waitForEvent('download');await page.locator('#txt').click();expect(fs.readFileSync(await(await txtDownload).path(),'utf8')).toBe('Keep this text.');
});
test('file chooser and reset are keyboard accessible',async({page})=>{
 await page.goto('/');await page.locator('#file').focus();await expect(page.locator('#file')).toBeFocused();const chooser=page.waitForEvent('filechooser');await page.locator('#file').press('Enter');await(await chooser).setFiles('public/demo.ppp');await expect(page.locator('#result')).toBeVisible();await expect(page.locator('#result-title')).toBeFocused();await page.locator('#reset').focus();await page.keyboard.press('Enter');await expect(page.locator('#file')).toBeFocused();
});

test('rejects misleading metadata, excessive entries and empty content',async({page})=>{
 await page.goto('/');const badSize=Buffer.from(fs.readFileSync('public/demo.ppp'));const central=badSize.indexOf(Buffer.from([80,75,1,2]));badSize.writeUInt32LE(1,central+24);
 const entries=Object.fromEntries(Array.from({length:5001},(_,i)=>['entry'+i,new Uint8Array()]));
 for(const buffer of [badSize,Buffer.from(zipSync(entries)),Buffer.from(zipSync({'summary.xml':strToU8('<x/>'),'story/1.xml':strToU8('<x/>')}))]){await page.locator('#file').setInputFiles({name:'invalid.ppp',mimeType:'application/octet-stream',buffer});await expect(page.locator('#status')).toHaveClass('error');await expect(page.locator('#result')).toBeHidden();}
});
test('drag and drop opens a document',async({page})=>{
 await page.goto('/');const bytes=[...fs.readFileSync('public/demo.ppp')];await page.locator('#drop').evaluate((target,bytes)=>{const transfer=new DataTransfer();transfer.items.add(new File([new Uint8Array(bytes)],'demo.ppp'));target.dispatchEvent(new DragEvent('drop',{bubbles:true,cancelable:true,dataTransfer:transfer}));},bytes);await expect(page.locator('#result')).toBeVisible();
});
