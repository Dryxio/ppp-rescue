import {recover,htmlDocument,imageType,escape} from './parser.js';
import {zipSync,strToU8} from 'fflate';
let current;
function progress(text){postMessage({type:'progress',text});}
function dimensions(b,type){
 const view=new DataView(b.buffer,b.byteOffset,b.byteLength);
 if(type==='png'&&b.length>=24)return [view.getUint32(16),view.getUint32(20)];
 if(type==='gif'&&b.length>=10)return [view.getUint16(6,true),view.getUint16(8,true)];
 if(type==='jpg'){let i=2;while(i+8<b.length){if(b[i++]!==255)break;let marker=b[i++];while(marker===255)marker=b[i++];if(marker===217||marker===218)break;const size=(b[i]<<8)|b[i+1];if(size<2||i+size>b.length)break;if([192,193,194,195,197,198,199,201,202,203,205,206,207].includes(marker))return [(b[i+5]<<8)|b[i+6],(b[i+3]<<8)|b[i+4]];i+=size;}}
 return [0,0];
}
async function validateImages(result){
 let pixels=0;for(const [name,bytes]of Object.entries(result.assets)){
  const type=imageType(bytes),[w,h]=dimensions(bytes,type);
  if(!w||!h||w*h>20000000||pixels+w*h>80000000){result.warnings.push(`Image ${name.slice(7)} was skipped: invalid dimensions or image safety limit.`);delete result.assets[name];continue;}
  pixels+=w*h;
  if(typeof createImageBitmap==='function')try{const bitmap=await createImageBitmap(new Blob([bytes],{type:'image/'+(type==='jpg'?'jpeg':type)}));bitmap.close();}catch{result.warnings.push(`Image ${name.slice(7)} could not be decoded and was skipped.`);delete result.assets[name];}
 }
 result.body=result.body.replace(/<img src="([^"]+)" alt="Recovered illustration">/g,(tag,src)=>Object.keys(result.assets).some(p=>escape(p)===src)?tag:'<span>[Image unavailable]</span>');
}
onmessage=async({data})=>{try{
 if(data.type==='open'){
  current=null;progress('Reading the archive…');const result=recover(await data.file.arrayBuffer());progress('Checking recovered images…');await validateImages(result);current=result;progress('Preparing your reading copy…');const preview=htmlDocument(result,true);if(preview.length>60000000)throw Error('The reading copy exceeds the 60 MB export limit.');postMessage({type:'opened',result:{title:result.title,paragraphCount:result.paragraphs.length,assets:result.assets,warnings:result.warnings},preview});
 }else if(data.type==='export'){
  if(!current)throw Error('Open a document before exporting.');progress('Preparing your download…');let bytes,mime,name;
  if(data.format==='txt'){bytes=strToU8(current.paragraphs.join('\n\n'));mime='text/plain';name='recovered.txt';}
  else if(data.format==='html'){bytes=strToU8(htmlDocument(current,true));mime='text/html';name='recovered.html';}
  else {const report={limitations:['Original layout, fonts, vector artwork, layer visibility and generated fields are not preserved.'],warnings:current.warnings};bytes=zipSync({...current.assets,'recovered.html':strToU8(htmlDocument(current)),'recovered.txt':strToU8(current.paragraphs.join('\n\n')),'recovery-report.json':strToU8(JSON.stringify(report,null,2))});mime='application/zip';name='recovered.zip';}
  postMessage({type:'exported',bytes,mime,name},[bytes.buffer]);
 }
 }catch(e){postMessage({type:'error',message:e.message||'This document could not be processed.'});}};
