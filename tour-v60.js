/* v60: menu guide illustrations and first-entry game tutorial */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const node = (tag, cls, value) => {
    const e=document.createElement(tag);
    if(cls)e.className=cls;
    if(value!==undefined)e.textContent=value;
    return e;
  };
  const steps=[
    {tab:'게임',title:'게임 카드 선택',hint:'게임 → 게임 카드',items:[['⚾ 숫자야구','비밀 숫자 추리'],['🔢 2048','같은 타일 합치기'],['💣 지뢰찾기','안전한 칸 열기']]},
    {tab:'게임',title:'난이도와 단계',hint:'게임 카드 → 난이도 → 단계',items:[['쉬움','1~50단계'],['보통','1~50단계'],['📖 튜토리얼','첫 입장 자동 표시']]},
    {tab:'도전',title:'도전 메뉴',hint:'상단 도전 선택',items:[['🏁 종합 도전','100라운드'],['📅 일일 미션','매일 새 목표'],['🎯 추천 목표','다음 업적 확인']]},
    {tab:'내 기록',title:'내 기록',hint:'상단 내 기록 선택',items:[['⭐ 단계·별','클리어 현황'],['📊 플레이 기록','게임별 성과'],['💾 JSON 백업','다른 기기로 이동']]},
    {tab:'프로필',title:'프로필',hint:'상단 프로필 선택',items:[['👤 닉네임','플레이어 이름'],['✨ 레벨·칭호','경험치 확인'],['🎨 꾸미기','획득 보상 적용']]},
    {tab:'설정',title:'설정',hint:'설정 메뉴 선택',items:[['🎵 음악·효과음','곡과 음량'],['🔠 글씨·화면','크기 조절'],['💾 백업·복원','기록 보관']]}
  ];
  const title=$('v31-guide-title');
  const figure=node('figure','v60-site-visual');
  figure.id='v60-site-visual';
  figure.setAttribute('aria-label','사이트 메뉴와 사용 방법 그림');
  if(title)title.after(figure);
  function render(index){
    if(!figure.isConnected)return;
    const info=steps[Math.max(0,Math.min(steps.length-1,index))];
    figure.replaceChildren();
    const top=node('div','v60-site-top');
    top.append(node('span','v60-site-tag','어디를 누를까요?'),node('span','v60-site-arrow','↓ '+info.hint));
    figure.append(top);
    const nav=node('div','v60-site-nav');
    const labels=info.tab==='설정'?['게임','도전','내 기록','프로필','설정']:['게임','도전','내 기록','프로필'];
    labels.forEach(label=>nav.append(node('span','v60-site-nav-item'+(label===info.tab?' current':''),label)));
    figure.append(nav);
    const preview=node('div','v60-site-preview');
    preview.append(node('strong','v60-site-content-title',info.title));
    const cards=node('div','v60-site-cards');
    info.items.forEach(([name,meaning])=>{
      const card=node('div','v60-site-card');
      card.append(node('strong','',name),node('span','',meaning));cards.append(card);
    });
    preview.append(cards);
    figure.append(preview,node('figcaption','v60-site-caption','위 그림은 버튼 위치와 기능을 설명하는 예시입니다.'));
  }
  window.TaekinSiteGuideV60={render,steps};
  render(0);
  const games=['baseball','2048','mines','pipes','shikaku','blocks'];
  const seenInSession=new Set();
  const prefix='taekin.arcade.v64.tutorialSeen.';
  window.TaekinGameTourV60={enabled:true,seenKey:key=>prefix+key};
  const prior=window.showGame;
  if(typeof prior==='function'){
    window.showGame=function(...args){
      const key=args[0],valid=games.includes(key);
      let seen=true;
      if(valid){try{seen=localStorage.getItem(prefix+key)==='1';}catch(_){seen=seenInSession.has(key);}}
      prior(...args);
      if(!valid||seen)return;
      let attempts=0;
      const prompt=()=>{
        if((typeof activeGame==='string'&&activeGame!==key)||
           $('play-screen')?.classList.contains('hidden')||$('panel-'+key)?.classList.contains('hidden'))return;
        const blocked=[...document.querySelectorAll('dialog[open]')].some(d=>d.id!=='tutorial-dialog');
        if(blocked){if(++attempts<120)setTimeout(prompt,150);return;}
        if($('tutorial-dialog')?.open||typeof window.openTutorial!=='function')return;
        try{
          window.openTutorial(key);
          if($('tutorial-dialog')?.open){
            seenInSession.add(key);
            try{localStorage.setItem(prefix+key,'1');}catch(_){}
          }
        }catch(error){console.warn('첫 방문 튜토리얼 안내 오류',error);}
      };
      setTimeout(prompt,170);
    };
  }
})();