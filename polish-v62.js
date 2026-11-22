/* TAEKIN BRAIN ARCADE v62 | original fantasy rank crests, nickname commit, app dialogs, mobile input UX.
   This module does not alter level calculation, achievement unlocks, or existing saved-game format. */
(()=>{
  'use strict';
  const $ = id => document.getElementById(id);
  const make = (tag,cls,text) => { const node=document.createElement(tag);if(cls)node.className=cls;if(text!==undefined)node.textContent=text;return node; };

  // Every app confirmation is an accessible site-owned dialog: no browser-origin confirmation header.
  const confirm = (message, options={}) => new Promise(resolve=>{
    const dialog=make('dialog','v62-dialog');dialog.setAttribute('aria-label',options.title||'아케이드 확인');
    const panel=make('div','v62-dialog-panel');
    const eyebrow=make('div','v62-dialog-eyebrow',options.danger?'⚠ IMPORTANT CHOICE':'✦ TAEKIN BRAIN ARCADE');
    const title=make('h2','',options.title||(options.danger?'진행 기록을 변경할까요?':'계속 진행할까요?'));
    const detail=make('p','v62-dialog-detail',message);
    const actions=make('div','v62-dialog-actions');
    const cancel=make('button','v62-dialog-cancel',options.cancelText||'취소');cancel.type='button';
    const accept=make('button','v62-dialog-accept'+(options.danger?' danger':''),options.confirmText||(options.danger?'확인하고 진행':'확인'));accept.type='button';
    let input;
    if(options.requireText){
      const label=make('label','v62-dialog-phrase-label',`안전 확인: '${options.requireText}' 입력`);
      input=make('input','v62-dialog-phrase');input.type='text';input.autocomplete='off';input.spellcheck=false;
      input.placeholder=options.requireText;input.maxLength=30;label.append(input);panel.append(eyebrow,title,detail,label);
      accept.disabled=true;input.addEventListener('input',()=>{accept.disabled=input.value.trim()!==options.requireText;});
    } else panel.append(eyebrow,title,detail);
    actions.append(cancel,accept);panel.append(actions);dialog.append(panel);document.body.append(dialog);
    let finished=false;
    const done=value=>{if(finished)return;finished=true;try{if(dialog.open)dialog.close();}catch(_){}dialog.remove();resolve(value);};
    cancel.addEventListener('click',()=>done(false));accept.addEventListener('click',()=>done(true));
    dialog.addEventListener('cancel',event=>{event.preventDefault();done(false);});
    dialog.addEventListener('click',event=>{if(event.target===dialog)done(false);});
    try{dialog.showModal();(input||cancel).focus({preventScroll:true});}
    catch(err){console.warn('아케이드 확인창을 열 수 없습니다.',err);done(false);}
  });
  window.TaekinDialog={
    confirm,
    requirePhrase:(phrase,subject)=>confirm(`'${subject}'을(를) 초기화합니다. 이 작업은 되돌릴 수 없습니다. 중요한 기록은 내 기록에서 JSON으로 백업하세요.`,{title:'마지막 초기화 확인',danger:true,confirmText:'기록 초기화',requireText:phrase}),
  };

  // Nicknames are pending while editing; all progress/level logic reads the previously committed name.
  const nick=$('v27-nickname-input'), saved=$('v25-player-name'), zone=nick?.closest('.v27-nickname-edit');
  if(nick&&saved&&zone){
    const apply=make('button','v62-nickname-apply','✓ 닉네임 변경하기');apply.type='button';
    zone.appendChild(apply);
    const status=$('v27-nickname-status');
    const current=()=>saved.value.trim();
    const pending=()=>nick.value.trim();
    function updateNote(){
      if(!status)return;
      const raw=pending();
      status.textContent=!raw?'닉네임을 입력해 주세요.':raw===current()?`✓ 현재 적용된 닉네임: ${raw}`:`변경 예정: ${raw} · 아래 버튼에서 확인 후 적용`;
      apply.disabled=!raw||raw===current();
    }
    nick.addEventListener('input',updateNote);
    nick.addEventListener('keydown',event=>{if(event.key==='Enter'&&!event.isComposing){event.preventDefault();apply.click();}});
    apply.addEventListener('click',async()=>{
      const next=pending(),prior=current()||'플레이어';
      if(!next||next===prior)return updateNote();
      nick.blur();
      if(!(await confirm(`현재 닉네임: ${prior}\n변경할 닉네임: ${next}\n\n이 닉네임으로 프로필과 게임 기록 화면에 표시할까요?`,{title:`'${next}'(으)로 설정하시겠습니까?`,confirmText:'이 닉네임으로 설정'}))){
        nick.value=current();updateNote();return;
      }
      saved.value=next;
      saved.dispatchEvent(new Event('input',{bubbles:true}));
      window.dispatchEvent(new Event('taekin-nickname-updated'));
      window.TaekinV26Navigation?.refresh?.();window.TaekinV61?.refresh?.();
      if(status)status.textContent=`✓ '${next}' 닉네임으로 설정 완료!`;
      updateNote();
      if(status)status.textContent=`✓ '${next}' 닉네임으로 설정 완료!`;
    });
    window.addEventListener('taekin-nickname-updated',()=>requestAnimationFrame(updateNote));
    updateNote();
  }

  // Stop accidental focus/keyboard re-open when returning from other screens on phones.
  const mobile=()=>matchMedia('(pointer:coarse)').matches||matchMedia('(max-width:720px)').matches;
  const isEditable=el=>el?.matches?.('input:not([type="checkbox"]):not([type="radio"]):not([type="range"]):not([type="file"]),textarea,[contenteditable="true"]');
  const dismissKeyboard=()=>{
    const active=document.activeElement;
    if(isEditable(active))active.blur();
    try{navigator.virtualKeyboard?.hide?.();}catch(_){}
  };
  const hideBtn=make('button','v62-keyboard-dismiss','⌄ 키보드 닫기');hideBtn.type='button';hideBtn.hidden=true;
  hideBtn.setAttribute('aria-label','모바일 키보드 닫기');document.body.append(hideBtn);
  const positionKeyboard=()=>{
    if(hideBtn.hidden)return;
    const vp=window.visualViewport;
    const h=vp?(vp.height+vp.offsetTop):innerHeight;
    hideBtn.style.top=Math.max(10,h-49)+'px';
  };
  let hideDelay;
  document.addEventListener('focusin',event=>{
    clearTimeout(hideDelay);
    if(!mobile()||!isEditable(event.target))return;
    hideBtn.hidden=false;positionKeyboard();
  });
  document.addEventListener('focusout',()=>{
    clearTimeout(hideDelay);hideDelay=setTimeout(()=>{
      if(!isEditable(document.activeElement))hideBtn.hidden=true;
    },90);
  });
  hideBtn.addEventListener('pointerdown',event=>event.preventDefault());
  hideBtn.addEventListener('click',()=>{dismissKeyboard();hideBtn.hidden=true;});
  document.addEventListener('keydown',event=>{
    if(!mobile()||!isEditable(event.target))return;
    if(event.key==='Escape'||event.key==='BrowserBack'){
      event.preventDefault();dismissKeyboard();hideBtn.hidden=true;
    }
  },true);
  window.visualViewport?.addEventListener('resize',positionKeyboard,{passive:true});
  window.visualViewport?.addEventListener('scroll',positionKeyboard,{passive:true});
  window.addEventListener('pagehide',dismissKeyboard);
  window.addEventListener('popstate',()=>{
    if(mobile()&&isEditable(document.activeElement))dismissKeyboard();
  },true);
  window.TaekinMobileInput={dismissKeyboard};

  // Illustrated rank collection: all eight designs remain previewable, locked tiers never affect XP.
  const specs={
    rookie:{name:'루키',min:1,light:'#98bcb4',deep:'#4a6b6a',gem:'#d8f7ea',wing:0,crown:0,icon:'✧',desc:'기본 방패'},
    bronze:{name:'브론즈',min:5,light:'#e7ad75',deep:'#855039',gem:'#ffda9a',wing:1,crown:0,icon:'◆',desc:'청동 뿔 장식'},
    silver:{name:'실버',min:10,light:'#c5e4f4',deep:'#69889b',gem:'#ebfcff',wing:2,crown:0,icon:'✦',desc:'은빛 양쪽 날개'},
    gold:{name:'골드',min:15,light:'#f3d482',deep:'#916528',gem:'#fff1b5',wing:2,crown:1,icon:'★',desc:'황금 날개와 왕관'},
    platinum:{name:'플래티넘',min:20,light:'#89f0d5',deep:'#438f8a',gem:'#eaffef',wing:3,crown:1,icon:'✺',desc:'백금 다중 날개'},
    diamond:{name:'다이아',min:30,light:'#9ecaff',deep:'#5478ba',gem:'#d8faff',wing:4,crown:1,icon:'❖',desc:'다이아 수정 장식'},
    aurora:{name:'마스터',min:40,light:'#d8a7ff',deep:'#835cb5',gem:'#ffd6ff',wing:4,crown:2,icon:'✺',desc:'오로라 날개와 보석'},
    legend:{name:'레전드',min:50,light:'#ffdc91',deep:'#b78437',gem:'#fff7d7',wing:5,crown:3,icon:'♛',desc:'전설의 황금 왕관'},
  };
  const svgRank=id=>{
    const c=specs[id]||specs.rookie;
    const shine=`v62-sheen-${id}`,grad=`v62-grad-${id}`;
    const wings=[];
    for(let i=0;i<c.wing;i++){
      const y=42+i*8,dx=24+i*6;
      const path=`M 48 ${y} Q ${30-i*5} ${y-12} ${5-i*2} ${17+i*8} L ${18-i*2} ${35+i*10} Q ${25-i*2} ${55+i*4} 48 ${65+i*2} Z`;
      wings.push(`<path d="${path}" fill="url(#${grad})" stroke="${c.light}" stroke-width="1.9" opacity="${Math.max(.45,.95-i*.1)}"/><path d="${path}" transform="translate(120 0) scale(-1 1)" fill="url(#${grad})" stroke="${c.light}" stroke-width="1.9" opacity="${Math.max(.45,.95-i*.1)}"/>`);
    }
    const crown=c.crown?`<path d="M 41 26 L ${c.crown>1?36:41} 10 L 51 19 L 60 ${c.crown>2?1:8} L 69 19 L ${c.crown>1?84:79} 10 L 79 26 L 74 31 H 46 Z" fill="url(#${shine})" stroke="${c.light}" stroke-width="2.5"/><circle cx="60" cy="16" r="${c.crown>2?5:3}" fill="${c.gem}"/>`:'';
    const rays=c.wing>=4?`<circle cx="60" cy="57" r="46" fill="none" stroke="${c.light}" stroke-dasharray="2 7" stroke-width="2" opacity=".7"/>`:'';
    return `<svg viewBox="0 0 120 118" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${c.name} 레벨 테두리" preserveAspectRatio="xMidYMid meet"><defs><linearGradient id="${grad}" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${c.light}"/><stop offset="1" stop-color="${c.deep}"/></linearGradient><linearGradient id="${shine}" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${c.gem}"/><stop offset=".5" stop-color="${c.light}"/><stop offset="1" stop-color="${c.deep}"/></linearGradient></defs>${rays}${wings.join('')}<path d="M 60 19 L 85 30 L 84 71 Q 83 91 60 105 Q 37 91 36 71 L 35 30 Z" fill="#14232c" stroke="${c.light}" stroke-width="4"/><path d="M 60 26 L 78 34 L 77 69 Q 76 85 60 97 Q 44 85 43 69 L 42 34 Z" fill="url(#${grad})" opacity=".66" stroke="${c.gem}" stroke-width="1"/>${crown}<path d="M 60 39 L 73 56 L 60 77 L 47 56 Z" fill="${c.gem}" stroke="${c.light}" stroke-width="2"/><text x="60" y="65" text-anchor="middle" font-size="22" font-weight="900" fill="${c.deep}" font-family="system-ui,sans-serif">${c.icon}</text><circle cx="60" cy="87" r="3" fill="${c.gem}"/></svg>`;
  };
  const tierWidget=(rank,cls)=>{const e=make('span',cls);e.innerHTML=svgRank(rank);e.setAttribute('aria-hidden','true');return e;};
  const head=$('v26-header-profile'),ribbon=$('v61-mobile');
  function updateCrests(){
    const rank=head?.dataset.v61Rank||'rookie';
    if(head){let art=head.querySelector('.v62-head-crest');if(!art){art=tierWidget(rank,'v62-head-crest');head.insertBefore(art,head.firstChild);}if(art.dataset.rank!==rank){art.innerHTML=svgRank(rank);art.dataset.rank=rank;}}
    const mobileRank=$('v61-ribbon')?.dataset.v61Rank||rank;
    const mobile=$('v61-mobile');
    if(mobile){let art=mobile.querySelector('.v62-head-crest');if(!art){art=tierWidget(mobileRank,'v62-head-crest');mobile.insertBefore(art,mobile.firstChild);}if(art.dataset.rank!==mobileRank){art.innerHTML=svgRank(mobileRank);art.dataset.rank=mobileRank;}}
    document.querySelectorAll('.v61-rank-card').forEach(card=>{
      const id=card.dataset.v61Rank||'rookie';if(card.querySelector('.v62-preview-crest'))return;
      const art=tierWidget(id,'v62-preview-crest');card.insertBefore(art,card.firstChild);
      const info=card.querySelector('.v61-rank-desc');if(info)info.append(make('span','v62-preview-detail',specs[id]?.desc||''));
    });
  }
  let rankScheduled=false;
  const scheduleRank=()=>{if(rankScheduled)return;rankScheduled=true;requestAnimationFrame(()=>{rankScheduled=false;updateCrests();});};
  if(head){
    const obs=new MutationObserver(scheduleRank);obs.observe(head,{attributes:true,attributeFilter:['data-v61-rank']});
    const grid=document.querySelector('.v61-rank-grid');if(grid)obs.observe(grid,{childList:true});
    const ribbon=$('v61-ribbon');if(ribbon)obs.observe(ribbon,{attributes:true,attributeFilter:['data-v61-rank']});
    scheduleRank();
  }
  window.TaekinV62={ranks:specs,previewSvg:svgRank,refresh:scheduleRank};
})();