export function imageType(bytes) {
 if (bytes[0]===0x89 && bytes[1]===0x50 && bytes[2]===0x4e && bytes[3]===0x47 && bytes[4]===13 && bytes[5]===10 && bytes[6]===26 && bytes[7]===10) return 'png';
 if (bytes[0]===255 && bytes[1]===216 && bytes[2]===255) return 'jpg';
 if (String.fromCharCode(...bytes.slice(0,6)).match(/^GIF8[79]a$/)) return 'gif';
 return null;
}
