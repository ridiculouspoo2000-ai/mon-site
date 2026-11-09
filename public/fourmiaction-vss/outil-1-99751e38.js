
(function(){
  var urls={};
  ['guide','cahier'].forEach(function(k){try{var b=atob(document.getElementById('pdf-'+k).textContent.trim());var u=new Uint8Array(b.length);for(var i=0;i<b.length;i++)u[i]=b.charCodeAt(i);urls[k]=URL.createObjectURL(new Blob([u],{type:'application/pdf'}))}catch(e){}});
  document.querySelectorAll('[data-pdf]').forEach(function(a){if(urls[a.dataset.pdf])a.href=urls[a.dataset.pdf]});
  var m=document.getElementById('choix'),opener=null;
  function open(){opener=document.activeElement;m.hidden=false;document.body.style.overflow='hidden';m.querySelector('.close').focus()}
  function close(){m.hidden=true;document.body.style.overflow='';if(opener)opener.focus()}
  document.getElementById('voir').addEventListener('click',open);
  m.addEventListener('click',function(e){if(e.target===m||e.target.closest('.close'))close()});
  document.addEventListener('keydown',function(e){if(e.key==='Escape'&&!m.hidden)close()});
})();
