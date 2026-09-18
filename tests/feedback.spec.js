import {test,expect} from '@playwright/test';
import {zipSync,strToU8} from 'fflate';
const endpoint='https://formsubmit.co/ajax/mrdryxio@gmail.com';
test('feedback sends explicit answers only, never recovery data',async({page})=>{
 const sent=[];await page.route(endpoint,async route=>{sent.push(route.request().postDataJSON());await route.fulfill({json:{success:'true'}});});
 await page.goto('/');const privateText='PRIVATE_DOCUMENT_SENTINEL_471';const file=zipSync({'summary.xml':strToU8('<x><Summary Title="PRIVATE_TITLE_471"/></x>'),'story/1.xml':strToU8('<x><p>'+privateText+'</p></x>')});await page.locator('#file').setInputFiles({name:'PRIVATE_FILENAME_471.ppp',mimeType:'application/octet-stream',buffer:Buffer.from(file)});await expect(page.locator('#result')).toBeVisible();expect(sent).toHaveLength(0);
 await page.getByLabel('Partly',{exact:true}).check();await page.locator('#feedback-message').fill('The text helped.');await page.locator('#feedback-email').fill('reader@example.com');await page.locator('#feedback-send').click();await expect(page.locator('#feedback-status')).toContainText('Thank you!');
 expect(sent).toEqual([{rating:'Partly',message:'The text helped.',email:'reader@example.com',_subject:'RecoverPPP feedback',_template:'table',_url:'https://recoverppp.com/',_honey:''}]);expect(JSON.stringify(sent)).not.toContain('PRIVATE_');await expect(page.locator('#feedback-form')).toBeHidden();await expect(page.locator('#feedback-status')).toBeFocused();await expect(page.frameLocator('#preview').locator('p')).toHaveText(privateText);
});
test('rating alone works without an email, message or account',async({page})=>{
 let payload;await page.route(endpoint,async route=>{payload=route.request().postDataJSON();await route.fulfill({json:{success:true}});});await page.goto('/#feedback');await expect(page.locator('#feedback-send')).toBeVisible();await page.getByLabel('Yes',{exact:true}).check();await page.locator('#feedback-send').click();await expect(page.locator('#feedback-status')).toContainText('Thank you!');expect(payload.rating).toBe('Yes');expect(payload.message).toBe('');expect(payload).not.toHaveProperty('email');
});
test('failed submissions retain the message and can be retried',async({page})=>{
 let tries=0;await page.route(endpoint,async route=>{tries++;await route.fulfill({status:tries===1?503:200,json:tries===1?{success:false}:{success:'true'}});});await page.goto('/#feedback');await page.getByLabel('Not yet',{exact:true}).check();await page.locator('#feedback-message').fill('Please help.');await page.locator('#feedback-send').click();await expect(page.locator('#feedback-status')).toContainText('couldn’t confirm delivery');await expect(page.locator('#feedback-message')).toHaveValue('Please help.');await expect(page.locator('#feedback-send')).toBeEnabled();await page.locator('#feedback-send').click();await expect(page.locator('#feedback-status')).toContainText('Thank you!');expect(tries).toBe(2);
});
test('feedback remains usable on narrow screens and requires a rating',async({page})=>{
 let sent=false;await page.route(endpoint,async route=>{sent=true;await route.fulfill({json:{success:true}});});await page.setViewportSize({width:375,height:812});await page.goto('/#feedback');await page.locator('#feedback-send').click();expect(sent).toBe(false);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await expect(page.locator('#feedback-send')).toBeEnabled();
});
