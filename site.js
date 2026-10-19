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
        label=document.getElementById('stepLabel'),bar=document.getElementById('stepBar'),step=1;
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
      document.getElementById('doneTitle').textContent='Thanks, '+document.getElementById('fname').value.trim()+'.';
      show(3);
    });
    back.addEventListener('click',function(){show(1);document.getElementById('fname').focus();});
    document.getElementById('again').addEventListener('click',function(){form.reset();document.querySelectorAll('.err').forEach(function(x){x.textContent='';});show(1);});
  }
})();
