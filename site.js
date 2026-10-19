(function(){
  var root=document.documentElement;
  root.classList.add('js');
  var reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasIO='IntersectionObserver' in window;

  /* mobile menu */
  var menuBtn=document.getElementById('menuBtn'),nav=document.getElementById('mainNav');
  if(menuBtn&&nav){
    menuBtn.addEventListener('click',function(){
      var open=nav.classList.toggle('open');
      menuBtn.setAttribute('aria-expanded',open?'true':'false');
    });
    nav.addEventListener('click',function(e){if(e.target.tagName==='A'){nav.classList.remove('open');menuBtn.setAttribute('aria-expanded','false');}});
  }


  /* hero slider: controls appear only when there are 2+ slides */
  var track=document.getElementById('hsTrack');
  if(track){
    var slides=track.querySelectorAll('.hs-slide'),n=slides.length;
    if(n>1){
      var wrap=track.parentNode,prev=wrap.querySelector('.hs-prev'),nxt=wrap.querySelector('.hs-next'),dots=document.getElementById('hsDots'),cur=0,timer=null;
      prev.hidden=nxt.hidden=dots.hidden=false;
      slides.forEach(function(s,i){
        s.setAttribute('aria-label',(i+1)+' of '+n);
        var d=document.createElement('button');d.type='button';d.setAttribute('aria-label','Go to slide '+(i+1));
        d.addEventListener('click',function(){go(i);restart();});dots.appendChild(d);
      });
      var go=function(i){cur=(i+n)%n;track.scrollTo({left:cur*track.clientWidth,behavior:reduce?'auto':'smooth'});mark();};
      var mark=function(){dots.querySelectorAll('button').forEach(function(d,i){d.setAttribute('aria-current',i===cur?'true':'false');});};
      var restart=function(){clearInterval(timer);if(!reduce)timer=setInterval(function(){go(cur+1);},6000);};
      prev.addEventListener('click',function(){go(cur-1);restart();});
      nxt.addEventListener('click',function(){go(cur+1);restart();});
      track.addEventListener('scroll',function(){var i=Math.round(track.scrollLeft/track.clientWidth);if(i!==cur){cur=i;mark();}},{passive:true});
      wrap.addEventListener('mouseenter',function(){clearInterval(timer);});
      wrap.addEventListener('mouseleave',restart);
      wrap.addEventListener('focusin',function(){clearInterval(timer);});
      track.addEventListener('touchstart',function(){clearInterval(timer);},{passive:true});
      track.addEventListener('touchend',restart,{passive:true});
      document.addEventListener('visibilitychange',function(){if(document.hidden)clearInterval(timer);else restart();});
      window.addEventListener('resize',function(){track.scrollLeft=cur*track.clientWidth;});
      mark();restart();
    }
  }

  /* reveal on scroll (content is visible without this) */
  if(hasIO&&!reduce){
    var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target);}});},{rootMargin:'0px 0px -8% 0px'});
    document.querySelectorAll('.reveal').forEach(function(el){if(el.getBoundingClientRect().top>window.innerHeight)io.observe(el);});
  }

  /* count-up stats; final values already in markup */
  function run(el){
    var end=+el.dataset.count,pre=el.dataset.prefix||'',suf=el.dataset.suffix||'',t0=null,dur=1100;
    function f(t){if(!t0)t0=t;var p=Math.min(1,(t-t0)/dur);el.textContent=pre+Math.round(end*(1-Math.pow(1-p,3)))+suf;if(p<1)requestAnimationFrame(f);}
    requestAnimationFrame(f);
  }
  if(hasIO&&!reduce){
    var co=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){run(e.target);co.unobserve(e.target);}});},{threshold:.6});
    document.querySelectorAll('[data-count]').forEach(function(c){co.observe(c);});
  }

  /* paint roller before/after */
  var room=document.getElementById('room'),range=document.getElementById('paintRange');
  if(room&&range){
    var setPos=function(v){room.style.setProperty('--pos',v+'%');};
    var animateTo=function(target){
      var start=+range.value,t0=null,dur=700;
      function f(t){if(!t0)t0=t;var p=Math.min(1,(t-t0)/dur);var v=start+(target-start)*(1-Math.pow(1-p,3));range.value=v;setPos(v);if(p<1)requestAnimationFrame(f);}
      requestAnimationFrame(f);
    };
    range.addEventListener('input',function(){setPos(range.value);});
    document.querySelectorAll('.swatch').forEach(function(b){
      b.addEventListener('click',function(){
        document.querySelectorAll('.swatch').forEach(function(x){x.setAttribute('aria-pressed','false');});
        b.setAttribute('aria-pressed','true');
        room.style.setProperty('--wall',b.dataset.color);
        if(+range.value<70&&!reduce)animateTo(92);
      });
    });
    if(hasIO&&!reduce){
      var ro=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){range.value=10;setPos(10);setTimeout(function(){animateTo(60);},250);ro.disconnect();}});},{threshold:.5});
      ro.observe(room);
    }
  }

  /* process line fills as you scroll */
  var steps=document.getElementById('steps');
  if(steps&&!reduce){
    var items=steps.querySelectorAll('.step');
    var onScroll=function(){
      var r=steps.getBoundingClientRect(),vh=window.innerHeight;
      var p=Math.max(0,Math.min(1,(vh*0.75-r.top)/(r.height+vh*0.25)));
      steps.style.setProperty('--progress',p.toFixed(3));
      items.forEach(function(it,i){it.classList.toggle('on',p>=i/(items.length-1)-0.001||i===0);});
    };
    window.addEventListener('scroll',onScroll,{passive:true});onScroll();
  }

  /* gallery filter */
  var filters=document.querySelectorAll('.filters button');
  if(filters.length){
    filters.forEach(function(b){
      b.addEventListener('click',function(){
        var f=b.dataset.filter;
        filters.forEach(function(x){x.setAttribute('aria-pressed',x===b?'true':'false');});
        document.querySelectorAll('.gal figure').forEach(function(fig){
          fig.hidden=!(f==='all'||(fig.dataset.cat||'').split(' ').indexOf(f)>-1);
        });
      });
    });
  }


  /* lightbox for project photos (links open the image directly without JS) */
  var lbLinks=document.querySelectorAll('a.lb');
  if(lbLinks.length&&typeof HTMLDialogElement==='function'){
    var dlg=document.createElement('dialog');dlg.className='lightbox';dlg.setAttribute('aria-label','Project photo');
    dlg.innerHTML='<button type="button" class="lb-close" aria-label="Close">&times;</button><img alt=""><p class="lb-cap"></p>';
    document.body.appendChild(dlg);
    var dImg=dlg.querySelector('img'),dCap=dlg.querySelector('.lb-cap'),last=null;
    lbLinks.forEach(function(a){
      a.addEventListener('click',function(e){
        e.preventDefault();last=a;
        dImg.src=a.getAttribute('href');dImg.alt=a.dataset.caption||'';dCap.textContent=a.dataset.caption||'';
        dlg.showModal();
      });
    });
    dlg.querySelector('.lb-close').addEventListener('click',function(){dlg.close();});
    dlg.addEventListener('click',function(e){if(e.target===dlg)dlg.close();});
    dlg.addEventListener('close',function(){dImg.removeAttribute('src');if(last)last.focus();});
  }


  /* landing page: tag the lead with the ad's UTM values so you know it came from the reel */
  var src=document.getElementById('leadSource');
  if(src){
    try{
      var q=new URLSearchParams(location.search),parts=[];
      ['utm_source','utm_medium','utm_campaign','utm_content'].forEach(function(k){if(q.get(k))parts.push(k+'='+q.get(k));});
      if(parts.length)src.value+='|'+parts.join('&');
    }catch(e){}
  }


  /* Lead popup on the ad landing page. Opens ~4s after arriving from a Facebook/Instagram ad
     (utm_source, fbclid or referrer) or with #popup / ?popup=1 for testing. Not shown to search
     visitors (Google penalizes mobile pop-ups), and not again for 7 days once closed or sent. */
  var pop=document.getElementById('leadPop');
  if(pop&&typeof pop.showModal==='function'){
    var KEY='wfcLeadPop',DAY=864e5;
    var store={get:function(){try{return JSON.parse(localStorage.getItem(KEY)||'null');}catch(e){return null;}},
               set:function(v){try{localStorage.setItem(KEY,JSON.stringify(v));}catch(e){}}};
    var qs;try{qs=new URLSearchParams(location.search);}catch(e){qs={get:function(){return null;}};}
    var srcp=(qs.get('utm_source')||'').toLowerCase();
    var fromAd=/^(fb|facebook|ig|instagram|meta)$/.test(srcp)||!!qs.get('fbclid')||/facebook\.|instagram\.|fb\.com/.test(document.referrer);
    var forced=location.hash==='#popup'||qs.get('popup')==='1';
    var seen=store.get(),recent=seen&&(seen.sent||(Date.now()-seen.t)<7*DAY);
    var busy=function(){var f=document.getElementById('estForm');return f&&(f.contains(document.activeElement)||[].some.call(f.querySelectorAll('input[type=text],input[type=tel],input[type=email]'),function(i){return i.value;}));};
    var openPop=function(){if(pop.open||busy())return;pop.showModal();document.documentElement.classList.add('pop-open');};
    var closePop=function(){if(pop.open)pop.close();};
    pop.addEventListener('close',function(){document.documentElement.classList.remove('pop-open');var v=store.get()||{};if(!v.sent)store.set({t:Date.now()});});
    document.getElementById('leadPopClose').addEventListener('click',closePop);
    pop.addEventListener('click',function(e){if(e.target===pop)closePop();});
    if(forced||(fromAd&&!recent))setTimeout(openPop,forced?800:4000);

    var pf=document.getElementById('leadPopForm'),pbtn=document.getElementById('lpSubmit'),perr=document.getElementById('lpSendErr'),psending=false;
    var pchecks={lpName:function(v){return v.trim().length>1?'':'Add your name.';},
                 lpPhone:function(v){return v.replace(/\D/g,'').length>=10?'':'Enter a 10-digit phone number.';},
                 lpEmail:function(v){return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim())?'':'Enter an email like name@example.com.';}};
    pf.addEventListener('submit',function(e){
      e.preventDefault();if(psending)return;
      var first=null;
      Object.keys(pchecks).forEach(function(id){var el=document.getElementById(id),m=pchecks[id](el.value);
        document.getElementById(id+'-err').textContent=m;el.setAttribute('aria-invalid',m?'true':'false');if(m&&!first)first=el;});
      if(first){first.focus();return;}
      if(document.getElementById('lpHp').value){closePop();return;}
      var name=document.getElementById('lpName').value.trim();
      var utm=[];['utm_source','utm_medium','utm_campaign','utm_content'].forEach(function(k){if(qs.get(k))utm.push(k+'='+qs.get(k));});
      var data={_subject:'New lead (ad popup): '+name,_template:'table',_honey:'',
        Name:name,Phone:document.getElementById('lpPhone').value.trim(),Email:document.getElementById('lpEmail').value.trim(),
        'What needs doing':'Storm damage repair (from ad popup)',
        Source:'storm-repair popup'+(utm.length?' | '+utm.join('&'):''),Page:location.href};
      psending=true;pbtn.disabled=true;pbtn.textContent='Sending...';perr.hidden=true;
      var fail=function(){psending=false;pbtn.disabled=false;pbtn.textContent='Get my free estimate';
        perr.textContent="Sorry, that didn't go through. Please try again, or call or text Sonny at (850) 525-5007.";perr.hidden=false;};
      fetch(pf.dataset.endpoint,{method:'POST',headers:{'Content-Type':'application/json','Accept':'application/json'},body:JSON.stringify(data)})
        .then(function(r){return r.json().then(function(j){return {ok:r.ok,j:j};});})
        .then(function(res){
          if(res.ok&&String(res.j.success)==='true'){
            store.set({t:Date.now(),sent:true});
            try{if(window.fbq)fbq('track','Lead');}catch(e){}
            location.href='thank-you.html';
          }else{fail();}
        }).catch(fail);
    });
  }

  /* copy phone */
  var copyBtn=document.getElementById('copyPhone');
  if(copyBtn){
    copyBtn.addEventListener('click',function(){
      function ok(){copyBtn.textContent='Copied';setTimeout(function(){copyBtn.textContent='Copy number';},1600);}
      function fallback(){var r=document.createRange();r.selectNodeContents(document.getElementById('phone'));var s=window.getSelection();s.removeAllRanges();s.addRange(r);copyBtn.textContent='Selected';}
      try{navigator.clipboard.writeText('(850) 525-5007').then(ok,fallback);}catch(e){fallback();}
    });
  }

  /* two-step estimate form */
  var form=document.getElementById('estForm');
  if(form){
    var s1=document.getElementById('step1'),s2=document.getElementById('step2'),done=document.getElementById('done'),
        back=document.getElementById('back'),next=document.getElementById('next'),foot=document.getElementById('foot'),
        label=document.getElementById('stepLabel'),bar=document.getElementById('stepBar'),step=1,sending=false;
    var checks={
      fname:function(v){return v.trim()?'':'Add your first name.';},
      lname:function(v){return v.trim()?'':'Add your last name.';},
      tel:function(v){return v.replace(/\D/g,'').length>=10?'':'Enter a 10-digit phone number.';},
      email:function(v){return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim())?'':'Enter an email like name@example.com.';}
    };
    var validate1=function(){
      var first=null;
      Object.keys(checks).forEach(function(id){
        var el=document.getElementById(id),msg=checks[id](el.value);
        document.getElementById(id+'-err').textContent=msg;
        el.setAttribute('aria-invalid',msg?'true':'false');
        if(msg&&!first)first=el;
      });
      if(first)first.focus();
      return !first;
    };
    var show=function(n){
      step=n;
      s1.hidden=n!==1;s2.hidden=n!==2;done.hidden=n!==3;foot.hidden=n===3;back.hidden=n!==2;
      next.textContent=n===1?'Continue':'Request my free estimate';
      label.textContent=n===3?'Sent':'Step '+n+' of 2';
      bar.style.width=n===1?'50%':'100%';
    };
    form.addEventListener('submit',function(e){
      e.preventDefault();
      if(step===1){if(validate1()){show(2);document.querySelector('#picks input').focus();}return;}
      var any=form.querySelectorAll('input[name=type]:checked').length;
      document.getElementById('type-err').textContent=any?'':'Pick at least one so we know what to look at.';
      if(!any){document.querySelector('#picks input').focus();return;}
      if(sending)return;
      var errBox=document.getElementById('sendErr');errBox.hidden=true;
      var val=function(id){var el=document.getElementById(id);return el?el.value.trim():'';};
      var types=[].map.call(form.querySelectorAll('input[name=type]:checked'),function(x){return x.value;});
      var away=form.querySelector('input[name=away]:checked');
      var name=val('fname')+' '+val('lname');
      var data={
        _subject:'New estimate request: '+name+' ('+(types[0]||'Website')+')',
        _template:'table',
        _honey:val('hpField'),
        Name:name,Phone:val('tel'),Email:val('email'),
        'What needs doing':types.join(', '),
        'Where':val('area'),'When to start':val('when'),
        'In town for the work':away?(away.value==='yes'?'Yes':'No, will be away'):'',
        'Notes':val('notes'),
        'Source':(document.getElementById('leadSource')||{}).value||location.pathname.split('/').pop()||'index.html',
        'Page':location.href
      };
      if(data._honey){location.href='thank-you.html';return;}
      sending=true;next.disabled=true;next.textContent='Sending...';
      var fail=function(){
        sending=false;next.disabled=false;next.textContent='Request my free estimate';
        errBox.textContent="Sorry, that didn't go through. Please try again, or call or text Sonny at (850) 525-5007.";
        errBox.hidden=false;
      };
      fetch(form.dataset.endpoint,{method:'POST',headers:{'Content-Type':'application/json','Accept':'application/json'},body:JSON.stringify(data)})
        .then(function(r){return r.json().then(function(j){return {ok:r.ok,j:j};});})
        .then(function(res){
          if(res.ok&&String(res.j.success)==='true'){
            try{if(window.fbq)fbq('track','Lead');}catch(e){}
            document.getElementById('doneTitle').textContent='Thanks, '+val('fname')+'.';
            show(3);
            location.href='thank-you.html';
          }else{fail();}
        })
        .catch(fail);
    });
    back.addEventListener('click',function(){show(1);document.getElementById('fname').focus();});
    document.getElementById('again').addEventListener('click',function(){form.reset();document.querySelectorAll('.err').forEach(function(x){x.textContent='';});show(1);});
  }
})();
