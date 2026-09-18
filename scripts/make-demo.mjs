// An original, synthetic ZIP/XML fixture, not a file authored by PagePlus.
import {zipSync,strToU8} from 'fflate';
import {readFileSync,writeFileSync} from 'node:fs';
const files={
 'summary.xml':'<SerifXML><Summary Title="The little garden journal" AppName="PPP Rescue synthetic demonstration"/></SerifXML>',
 'resources.xml':'<SerifXML><_object _id="img1" _class="BitmapResource" Data="_bin_images\\garden.png"/></SerifXML>',
 'story/1.xml':`<SerifXML><_object _class="CStoryProxy"><p><b>The little garden journal</b></p><p>Notes from a slower Sunday. Issue 01 — Spring in the neighbourhood.</p><p>Some things are worth keeping.</p><p>A few seeds, a sunny windowsill, and the first signs of spring. This month, we’re making room for small beginnings.</p><p><glyph _class="GlyphObject"><object><BitmapResource _ref="img1"/></object></glyph></p><p><b>From the potting table</b></p><p>Plant the herbs you love to cook with. Water gently. Leave a little space for something unexpected.</p><p><i>This is original demonstration content, packaged as a synthetic ZIP/XML test fixture. It is not an original PagePlus screenshot or a compatibility benchmark.</i></p></_object></SerifXML>`};
const entries=Object.fromEntries(Object.entries(files).map(([n,v])=>[n,strToU8(v)]));entries['images/garden.png']=readFileSync('public/demo-art.png');writeFileSync('public/demo.ppp',zipSync(entries));
