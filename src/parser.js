import { unzipSync, strFromU8 } from 'fflate';
export const escape = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function imageType(bytes) {
 if (bytes[0]===0x89 && bytes[1]===0x50 && bytes[2]===0x4e && bytes[3]===0x47 && bytes[4]===13 && bytes[5]===10 && bytes[6]===26 && bytes[7]===10) return 'png';
 if (bytes[0]===255 && bytes[1]===216 && bytes[2]===255) return 'jpg';
 if (String.fromCharCode(...bytes.slice(0,6)).match(/^GIF8[79]a$/)) return 'gif';
 return null;
}
export function recover(buffer) {
 const data=new Uint8Array(buffer);
 if(data.length>30e6) throw Error('Please choose a file smaller than 30 MB.');
 if(data[0]!==80||data[1]!==75) throw Error('This file uses an older or unsupported format. This beta opens ZIP/XML PagePlus files only.');
 let size=0,count=0;
 const files=unzipSync(data,{filter:f=>{size+=f.originalSize;count++;if(size>100e6||count>5000)throw Error('This document exceeds the safe extraction limit.');return /^(?:[^/]+\.xml|(?:story|spreads|masterspreads|typedspreads)\/[^/]+\.xml|(?:images|bin)\/[^/]+)$/i.test(f.name);}});
 const roots={};
 for(const [name,bytes] of Object.entries(files))if(name.endsWith('.xml')) {
  const xml=strFromU8(bytes);if(/<!DOCTYPE|<!ENTITY/i.test(xml))throw Error('Documents with XML entities are not supported.');
  const doc=new DOMParser().parseFromString(xml,'application/xml');if(doc.querySelector('parsererror'))throw Error('The document contains unreadable XML.');roots[name]=doc;
 }
 const stories=Object.keys(roots).filter(n=>n.startsWith('story/')).sort((a,b)=>a.localeCompare(b,undefined,{numeric:true}));
 if(!roots['summary.xml']||!stories.length)throw Error('No supported PagePlus stories were found. This may be a different file format.');
 const images=Object.create(null), assets=Object.create(null), assetPaths=new Map(), ids=new Map();
 const warnings=new Set(), diagnostics={missingImages:0,unsupportedImages:0,automaticFields:0,unrenderedGlyphs:0,unrenderedElements:0};
 for(const doc of Object.values(roots))for(const el of doc.querySelectorAll('[_id]'))ids.set(el.getAttribute('_id'),el);
 for(const [name,bytes] of Object.entries(files)) {
  if(!/^(images|bin)\/[^/]+$/.test(name))continue;
  const type=imageType(bytes);if(!type)continue;
  const original=/^images\/[^/]+\.(png|jpe?g|gif)$/i.test(name);
  let output=original?name:`images/recovered-${Object.keys(assets).length}.${type}`;
  while(assets[output]||(!original&&files[output]))output='images/recovered-'+output.slice(7);
  assets[output]=bytes;assetPaths.set(name,output);
 }
 const seenResources=new Set();
 for(const doc of Object.values(roots))for(const el of doc.querySelectorAll('[_class="BitmapResource"]')){
  const id=el.getAttribute('_id');if(seenResources.has(id||el))continue;seenResources.add(id||el);
  const path=(el.getAttribute('Data')||'').replace(/^_bin_/,'').replaceAll('\\','/');
  if(assetPaths.has(path)){if(id)images[id]=assetPaths.get(path);}
  else if(path&&files[path])diagnostics.unsupportedImages++;
  else diagnostics.missingImages++;
 }
 for(const doc of Object.values(roots))diagnostics.automaticFields+=doc.querySelectorAll('[_class^="GlyphField"]').length;
 let inline=0;
 function render(el,depth=0){
  if(depth>80)throw Error('The document is too deeply nested.');
  let s='';for(const node of el.childNodes){
   if(node.nodeType===3||node.nodeType===4)s+=escape(node.textContent);
   else if(node.nodeType===1){const tag=node.tagName;
    if(['span','b','i','u'].includes(tag))s+=`<${tag}>${render(node,depth+1)}</${tag}>`;
    else if(tag==='glyph'){
     const glyph=ids.get(node.getAttribute('_ref'))||node;const refs=glyph.querySelectorAll('BitmapResource');
     for(const ref of refs){const path=images[ref.getAttribute('_ref')];if(path){s+=`<img src="${escape(path)}" alt="Recovered illustration">`;inline++;}else warnings.add('An inline image could not be placed. Check the image gallery and missing-image warnings.');}
     if(!refs.length)diagnostics.unrenderedGlyphs++;
    }else if(['br','break'].includes(tag))s+='<br>';
    else if(!['paraDelta','delta','_item','StyleSheet'].includes(tag))diagnostics.unrenderedElements++;
   }
  }return s;
 }
 const paragraphs=[],sections=[];
 for(const name of stories){const parts=[];for(const p of roots[name].querySelectorAll('p')){paragraphs.push(p.textContent);parts.push('<p>'+render(p)+'</p>');}sections.push(parts.join('\n'));}
 if(diagnostics.missingImages)warnings.add(`${diagnostics.missingImages} image resource(s) have no recoverable embedded data. Linked files are not fetched.`);
 if(diagnostics.unsupportedImages)warnings.add(`${diagnostics.unsupportedImages} embedded image resource(s) use an unsupported format.`);
 if(diagnostics.automaticFields)warnings.add(`${diagnostics.automaticFields} automatic field definition(s), such as page numbers or dates, are not evaluated.`);
 if(diagnostics.unrenderedGlyphs)warnings.add(`${diagnostics.unrenderedGlyphs} inline object occurrence(s), such as breaks, numbering or special symbols, were not rendered.`);
 if(diagnostics.unrenderedElements)warnings.add(`${diagnostics.unrenderedElements} text element(s) use unsupported formatting or content. Compare the plain-text export.`);
 const summary=roots['summary.xml'].querySelector('Summary');
 return {title:summary?.getAttribute('Title')||'Recovered document',app:summary?.getAttribute('AppName')||'Unknown version',paragraphs,body:sections.join('\n'),assets,inline,diagnostics,warnings:[...warnings]};
}
export function htmlDocument(result,inlineAssets=false){
 const used=new Set([...result.body.matchAll(/src="([^"<]+)"/g)].map(m=>m[1]));
 let body=result.body;
 const remaining=Object.keys(result.assets).filter(path=>!used.has(escape(path)));
 if(remaining.length)body+='<section aria-label="Other recovered images"><h2>Other recovered images</h2>'+remaining.map(path=>`<figure><img src="${escape(path)}" alt="Recovered image"><figcaption>${escape(path.slice(7))}</figcaption></figure>`).join('')+'</section>';
 if(result.warnings.length)body='<ul>'+result.warnings.map(w=>'<li>'+escape(w)+'</li>').join('')+'</ul>'+body;
 if(inlineAssets)for(const [path,bytes]of Object.entries(result.assets)){
  let binary='';for(const b of bytes)binary+=String.fromCharCode(b);
  const ext=imageType(bytes);body=body.replaceAll(`src="${escape(path)}"`,`src="data:image/${ext==='jpg'?'jpeg':ext};base64,${btoa(binary)}"`);
 }
 return `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${escape(result.title)}</title><style>body{max-width:760px;margin:40px auto;padding:24px;font:18px/1.7 Georgia,serif;overflow-wrap:anywhere;color:#242b28}img{max-width:100%;height:auto;display:block;margin:20px 0}aside{font:14px/1.6 system-ui;background:#eef3ed;padding:16px;border-radius:8px}p{white-space:pre-wrap}</style><aside>Recovered with PPP Rescue. Reflowed content, not the original page layout. Review for missing objects and formatting.</aside>${body}</html>`;
}
