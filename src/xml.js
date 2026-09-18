import {DOMParser} from '@xmldom/xmldom';
export function elements(root, predicate=()=>true){
 const result=[],stack=Array.from(root.childNodes||[]).reverse();while(stack.length){const e=stack.pop();if(e.nodeType===1){if(predicate(e))result.push(e);for(let i=e.childNodes.length-1;i>=0;i--)stack.push(e.childNodes[i]);}}return result;
}
export function parseXML(xml){
 if(/<!DOCTYPE|<!ENTITY/i.test(xml))throw Error('Documents with XML entities are not supported.');
 let depth=0,nodes=0;for(const token of xml.matchAll(/<!--[\s\S]*?-->|<!\[CDATA\[[\s\S]*?\]\]>|<[^>]*>/g)){const t=token[0];if(t.startsWith('<?')||t.startsWith('<!'))continue;if(t.startsWith('</'))depth--;else {if(++nodes>150000)throw Error('This XML section has too many elements.');if(!t.endsWith('/>')&&++depth>80)throw Error('The document is too deeply nested.');}}
 try{return new DOMParser({onError:()=>{throw Error('Invalid XML');}}).parseFromString(xml,'application/xml');}catch{throw Error('The document contains unreadable XML.');}
}
