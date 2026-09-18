import {imageType} from './images.js';
const $=id=>document.getElementById(id);
let current=null,worker=null,timer=null,busy=false,imageUrls=[],generation=0;
const controls=['file','demo','html','txt','zip','reset'];
function setBusy(value){busy=value;for(const id of controls)$(id).disabled=value;$('cancel').hidden=!value;$('progress').hidden=!value;document.querySelector('label.primary').classList.toggle('disabled',value);$('result').setAttribute('aria-busy',String(value));}
function status(text,error=false){$('status').textContent=text;$('status').className=error?'error':'';if(error)$('status').focus();}
function clearImages(){for(const url of imageUrls)URL.revokeObjectURL(url);imageUrls=[];$('gallery-items').replaceChildren();$('gallery').hidden=true;$('gallery').open=false;}
function stop(){generation++;worker?.terminate();worker=null;clearTimeout(timer);timer=null;setBusy(false);}
function clear(){clearImages();current=null;$('result').hidden=true;$('preview').srcdoc='';$('file').value='';}
function fail(message){stop();clear();status(message,true);}
function save(bytes,name,type){const url=URL.createObjectURL(new Blob([bytes],{type}));const a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),10000);}
function warnings(){$('warnings').replaceChildren(...current.warnings.map(w=>{const li=document.createElement('li');li.textContent=w;return li;}));}
function showImages(){clearImages();const entries=Object.entries(current.assets);$('gallery').hidden=!entries.length;$('gallery-title').textContent=`All recovered images (${entries.length})`;
 for(const [name,bytes]of entries){const type=imageType(bytes),url=URL.createObjectURL(new Blob([bytes],{type:`image/${type==='jpg'?'jpeg':type}`}));imageUrls.push(url);const link=document.createElement('a');link.href=url;link.download=name.slice(7);const img=document.createElement('img');img.src=url;img.alt='Recovered image: '+name.slice(7);img.loading='lazy';const caption=document.createElement('span');caption.textContent=name.slice(7)+' ↓';link.append(img,caption);$('gallery-items').append(link);img.onerror=()=>{caption.textContent=name.slice(7)+' — preview unavailable';const warning=`Your browser could not display ${name.slice(7)}. Check this image before using the export.`;if(current&&!current.warnings.includes(warning)){current.warnings.push(warning);warnings();}};}
}
function armTimeout(){clearTimeout(timer);timer=setTimeout(()=>fail('Processing took longer than 30 seconds and was stopped. Try a smaller document.'),30000);}
function open(file){if(!file||busy)return;stop();clear();if(file.size>30e6){status('Please choose a file smaller than 30 MB.',true);return;}setBusy(true);status('Opening your document locally…');const job=generation;
 try{worker=new Worker(new URL('./recovery.worker.js',import.meta.url),{type:'module'});worker.onerror=()=>{if(job===generation)fail('Processing stopped unexpectedly. Your original file is unchanged. Please try again.');};worker.onmessage=({data})=>{if(job!==generation)return;
  if(data.type==='progress'){status(data.text);return;}
  clearTimeout(timer);setBusy(false);
  if(data.type==='error'){fail(data.message);return;}
  if(data.type==='opened'){current=data.result;$('result-title').textContent=current.title;$('counts').textContent=`${current.paragraphCount} paragraphs · ${Object.keys(current.assets).length} embedded image${Object.keys(current.assets).length===1?'':'s'}`;warnings();$('result').hidden=false;const preview=$('preview').cloneNode(false);preview.srcdoc=data.preview;$('preview').replaceWith(preview);showImages();status('Recovered locally. Review your document below.');$('result-title').focus();$('result').scrollIntoView({block:'start'});}
  if(data.type==='exported'){save(data.bytes,data.name,data.mime);status('Your download is ready.');}
 };armTimeout();worker.postMessage({type:'open',file});}catch{fail('This browser could not start local processing. Please try a current browser.');}
}
$('file').addEventListener('change',e=>open(e.target.files[0]));
for(const name of ['dragover','drop'])$('drop').addEventListener(name,e=>{e.preventDefault();if(name==='drop'){$('drop').classList.remove('drag');if(!busy)open(e.dataTransfer.files[0]);}else if(!busy)$('drop').classList.add('drag');});$('drop').addEventListener('dragleave',()=>$('drop').classList.remove('drag'));
// Prevent dropping a file outside the target from navigating away with local content.
window.addEventListener('dragover',e=>e.preventDefault());window.addEventListener('drop',e=>e.preventDefault());
$('demo').onclick=async()=>{if(busy)return;$('demo').disabled=true;const job=generation;try{const r=await fetch('/demo.ppp');if(!r.ok)throw Error('Demo unavailable. Please try again.');const blob=await r.blob();if(job===generation)open(new File([blob],'demo.ppp'));}catch(e){status(e.message,true);}finally{if(!busy)$('demo').disabled=false;}};
$('cancel').onclick=()=>{stop();clear();status('Cancelled. Choose a file to try again.');$('file').focus();};
$('reset').onclick=()=>{stop();clear();status('');$('file').focus();window.scrollTo({top:0});};
for(const format of ['html','txt','zip'])$(format).onclick=()=>{if(!current||busy||!worker)return;setBusy(true);status('Preparing your download…');armTimeout();worker.postMessage({type:'export',format});};
