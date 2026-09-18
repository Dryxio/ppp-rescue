import {Unzip,UnzipInflate,strFromU8} from 'fflate';
const crcTable=Uint32Array.from({length:256},(_,n)=>{for(let k=0;k<8;k++)n=n&1?0xedb88320^(n>>>1):n>>>1;return n>>>0;});
export function readArchive(data){
 const files=Object.create(null),names=new Set(),stats=new Map();let expanded=0,declared=0,count=0,pending=0,xmlBytes=0;
 const unzip=new Unzip(file=>{
  if(++count>5000)throw Error('Too many archive entries (maximum 5,000).');
  if(names.has(file.name))throw Error('The archive contains duplicate entries.');names.add(file.name);
  if(file.name.includes('\\')||file.name.split('/').some(p=>p==='..'||p==='.')||file.name.startsWith('/'))throw Error('The archive contains an unsafe path.');
  declared+=file.originalSize||0;if(declared>100e6)throw Error('The expanded document exceeds 100 MB.');
  const wanted=/^(?:[^/]+\.xml|(?:story|spreads|masterspreads|typedspreads)\/[^/]+\.xml|(?:images|bin)\/[^/]+)$/i.test(file.name);
  const chunks=[];let length=0,crc=0xffffffff;pending++;
  file.ondata=(error,chunk,final)=>{if(error)throw Error('The ZIP archive is damaged or uses unsupported compression.');expanded+=chunk.length;length+=chunk.length;for(const byte of chunk)crc=crcTable[(crc^byte)&255]^(crc>>>8);if(wanted&&/\.xml$/i.test(file.name)){xmlBytes+=chunk.length;if(xmlBytes>20000000)throw Error("Combined XML exceeds the 20 MB safety limit.");}if(expanded>100e6)throw Error('The expanded document exceeds 100 MB.');if(wanted&&file.name.endsWith('.xml')&&length>5e6)throw Error('An XML section exceeds the 5 MB safety limit.');if(wanted)chunks.push(chunk);if(final){stats.set(file.name,{length,crc:(crc^0xffffffff)>>>0});pending--;if(wanted){const result=new Uint8Array(length);let pos=0;for(const c of chunks){result.set(c,pos);pos+=c.length;}files[file.name]=result;}}};
  file.start();
 });unzip.register(UnzipInflate);
 try{for(let pos=0;pos<data.length;pos+=8192)unzip.push(data.subarray(pos,pos+8192),pos+8192>=data.length);}catch(e){throw Error(e.message?.match(/exceeds|entries|unsafe|duplicate|damaged/)?e.message:'The ZIP archive is damaged or incomplete.');}
 if(pending||!count)throw Error('The ZIP archive is incomplete.');
 const view=new DataView(data.buffer,data.byteOffset,data.byteLength);let end=-1;
 for(let i=data.length-22;i>=Math.max(0,data.length-65557);i--)if(view.getUint32(i,true)===0x06054b50&&i+22+view.getUint16(i+20,true)===data.length){end=i;break;}
 if(end<0)throw Error('The ZIP archive is incomplete.');
 const entries=view.getUint16(end+10,true),size=view.getUint32(end+12,true),start=view.getUint32(end+16,true);
 if(view.getUint16(end+4,true)||view.getUint16(end+6,true)||entries===65535||start===0xffffffff)throw Error('Multi-part and ZIP64 archives are not supported.');
 if(entries!==count||view.getUint16(end+8,true)!==entries||start+size!==end)throw Error('The ZIP directory is damaged.');
 let pos=start;const checked=new Set();
 for(let i=0;i<entries;i++){
  if(pos+46>end||view.getUint32(pos,true)!==0x02014b50)throw Error('The ZIP directory is damaged.');
  const nameLength=view.getUint16(pos+28,true),extra=view.getUint16(pos+30,true),comment=view.getUint16(pos+32,true),next=pos+46+nameLength+extra+comment;
  if(next>end)throw Error('The ZIP directory is damaged.');
  const name=strFromU8(data.subarray(pos+46,pos+46+nameLength),!(view.getUint16(pos+8,true)&2048)),actual=stats.get(name);
  if(checked.has(name)||!actual||actual.length!==view.getUint32(pos+24,true)||actual.crc!==view.getUint32(pos+16,true))throw Error('The ZIP archive failed its integrity check.');
  checked.add(name);pos=next;
 }
 if(pos!==end)throw Error('The ZIP directory is damaged.');return files;
}
