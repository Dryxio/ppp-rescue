import { unzipSync, strFromU8 } from 'fflate';
export const escape = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function recover(buffer) {
 const data=new Uint8Array(buffer);
 if(data.length>30e6) throw Error('Please choose a file smaller than 30 MB.');
 if(data[0]!==80||data[1]!==75) throw Error('This file uses an older or unsupported format. This beta opens ZIP/XML PagePlus files only.');
 let size=0,count=0;
 const files=unzipSync(data,{filter:f=>{size+=f.originalSize;count++;if(size>100e6||count>5000)throw Error('This document exceeds the safe extraction limit.');return /^(summary\.xml|resources\.xml|story\/[^/]+\.xml|images\/[^/]+\.(png|jpg|jpeg|gif))$/i.test(f.name);}});
 const roots={};
 for(const [name,bytes] of Object.entries(files))if(name.endsWith('.xml')) {
  const xml=strFromU8(bytes);if(/<!DOCTYPE|<!ENTITY/i.test(xml))throw Error('Documents with XML entities are not supported.');
  const doc=new DOMParser().parseFromString(xml,'application/xml');if(doc.querySelector('parsererror'))throw Error('The document contains unreadable XML.');roots[name]=doc;
 }
 const stories=Object.keys(roots).filter(n=>n.startsWith('story/')).sort((a,b)=>a.localeCompare(b,undefined,{numeric:true}));
 if(!roots['summary.xml']||!stories.length)throw Error('No supported PagePlus stories were found. This may be a different file format.');
 const images={};const assets={};
 for(const [n,bytes]of Object.entries(files))if(n.startsWith('images/'))assets[n]=bytes;
 for(const doc of Object.values(roots))for(const el of doc.querySelectorAll('[_class="BitmapResource"]')){
  const p=(el.getAttribute('Data')||'').replace(/^_bin_/,'').replaceAll('\\','/');if(assets[p])images[el.getAttribute('_id')]=p;
 }
 let inline=0;const warnings=new Set();
 function render(el,depth=0){
  if(depth>80)throw Error('The document is too deeply nested.');
  let s='';for(const node of el.childNodes){
   if(node.nodeType===3||node.nodeType===4)s+=escape(node.textContent);
   else if(node.nodeType===1){const tag=node.tagName;
    if(['span','b','i','u'].includes(tag))s+=`<${tag}>${render(node,depth+1)}</${tag}>`;
    else if(tag==='glyph'){
     const refs=node.querySelectorAll('BitmapResource');
     for(const ref of refs){const path=images[ref.getAttribute('_ref')];if(path){s+=`<img src="${escape(path)}" alt="Recovered illustration">`;inline++;}else warnings.add('Some inline images could not be recovered.');}
     if(!refs.length)warnings.add('Special symbols, numbering or other inline objects may be missing.');
    }else if(['br','break'].includes(tag))s+='<br>';
    else if(!['paraDelta','delta','_item','StyleSheet'].includes(tag))warnings.add('Some text formatting or embedded objects were not rendered.');
   }
  }return s;
 }
 const paragraphs=[],sections=[];
 for(const name of stories){const parts=[];for(const p of roots[name].querySelectorAll('p')){paragraphs.push(p.textContent);parts.push('<p>'+render(p)+'</p>');}sections.push(parts.join('\n'));}
 const summary=roots['summary.xml'].querySelector('Summary');
 return {title:summary?.getAttribute('Title')||'Recovered document',app:summary?.getAttribute('AppName')||'Unknown version',paragraphs,body:sections.join('\n'),assets,inline,warnings:[...warnings]};
}
export function htmlDocument(result,inlineAssets=false){
 let body=result.body;
 if(inlineAssets)for(const [path,bytes]of Object.entries(result.assets)){
  let binary='';for(const b of bytes)binary+=String.fromCharCode(b);
  const ext=path.split('.').pop().toLowerCase();body=body.replaceAll(`src="${escape(path)}"`,`src="data:image/${ext==='jpg'?'jpeg':ext};base64,${btoa(binary)}"`);
 }
 return `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${escape(result.title)}</title><style>body{max-width:760px;margin:40px auto;padding:24px;font:18px/1.7 Georgia,serif;overflow-wrap:anywhere;color:#242b28}img{max-width:100%;height:auto;display:block;margin:20px 0}aside{font:14px/1.6 system-ui;background:#eef3ed;padding:16px;border-radius:8px}p{white-space:pre-wrap}</style><aside>Recovered with PPP Rescue. Reflowed content, not the original page layout. Review for missing objects and formatting.</aside>${body}</html>`;
}
