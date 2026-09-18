const form=document.getElementById('feedback-form');
const status=document.getElementById('feedback-status');
const button=document.getElementById('feedback-send');
let sending=false;
export function showFeedback(){document.getElementById('feedback').open=true;}
form.addEventListener('submit',async event=>{
 event.preventDefault();
 if(sending||!form.reportValidity())return;
 // Explicit fields only: this module never receives a file or recovery result.
 const rating=form.querySelector('input[name="rating"]:checked')?.value;
 const message=document.getElementById('feedback-message').value.trim();
 const email=document.getElementById('feedback-email').value.trim();
 const honey=document.getElementById('feedback-website').value;
 if(honey)return;
 sending=true;button.disabled=true;button.textContent='Sending…';status.textContent='';
 const controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),20000);
 try{
  const response=await fetch('https://formsubmit.co/ajax/mrdryxio@gmail.com',{
   method:'POST',mode:'cors',credentials:'omit',referrerPolicy:'no-referrer',signal:controller.signal,
   headers:{'Content-Type':'application/json','Accept':'application/json'},
   body:JSON.stringify({rating,message,...(email?{email}:{}),_subject:'RecoverPPP feedback',_template:'table',_url:'https://recoverppp.com/',_honey:honey})
  });
  const result=await response.json();
  if(!response.ok||!(result.success===true||result.success==='true'))throw Error('Not accepted');
  form.hidden=true;status.textContent='Thank you! Your feedback has been sent.';status.focus();
 }catch{
  status.textContent='We couldn’t confirm delivery. Your message is still here: try again, or use the email link below.';status.focus();
 }finally{clearTimeout(timeout);sending=false;button.disabled=false;button.textContent='Send feedback';}
});
document.querySelectorAll('a[href="#feedback"]').forEach(link=>link.addEventListener('click',showFeedback));
if(location.hash==='#feedback')showFeedback();
