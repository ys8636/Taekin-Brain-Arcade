/* TAEKIN BRAIN ARCADE v57 · 그림으로 이해하는 게임 가이드와 메뉴 길잡이
 * 정적 예시 그림은 실제 플레이 결과/게임판이 아니며, 규칙만 시각적으로 보여 줍니다.
 * 게임 엔진·단계·저장 기록은 변경하지 않습니다. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const dom = (name, cls, txt) => {
    const el = document.createElement(name);
    if (cls) el.className = cls;
    if (txt !== undefined) el.textContent = txt;
    return el;
  };
  const r = (x,y,w,h,fill='#29415c',rad=10,stroke='none') => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rad}" fill="${fill}" stroke="${stroke}" stroke-width="2"/>`;
  const t = (x,y,label,size=23,fill='#fff8eb',weight=750,anchor='middle') => `<text x="${x}" y="${y}" font-family="system-ui,sans-serif" font-size="${size}" font-weight="${weight}" fill="${fill}" text-anchor="${anchor}">${label}</text>`;
  const wrap = (label,body) => `<svg viewBox="0 0 640 220" role="img" aria-label="${label}" xmlns="http://www.w3.org/2000/svg" class="v57-illustration"><rect x="1" y="1" width="638" height="218" rx="17" fill="#152638" stroke="#41667a"/>${body}</svg>`;
  const round = (x,y,n,color='#24475d',w=70) => r(x,y,w,70,color,12) + t(x+w/2,y+47,n,34);
  const arrow = (x=322,y=117) => `<g class="v57-arrow">${t(x,y,'➜',46,'#7fe3c7')}</g>`;
  const boxCaption = (left,right) => t(164,39,left,16,'#a3d8e3',800)+t(476,39,right,16,'#a3d8e3',800);
  const baseGrid=(x,y,cols,rows,csize=38,gap=4,fill='#274158')=>{
    let out='';for(let a=0;a<rows;a++)for(let b=0;b<cols;b++)out+=r(x+b*(csize+gap),y+a*(csize+gap),csize,csize,fill,5);return out;
  };
  const demos = {
    baseball: wrap('숫자야구 예시. 4 2 7 1을 입력하면 정답과 비교한 결과 1스트라이크 2볼이 표시됩니다.',
      t(33,41,'입력한 숫자',18,'#b7dfed',750,'start')+
      round(46,65,'4','#247a65',76)+round(138,65,'2','#926526',76)+round(230,65,'7','#926526',76)+round(322,65,'1','#405169',76)+
      r(424,71,172,60,'#263c58',13)+t(510,110,'1 S · 2 B',27,'#ffdf91',850)+
      t(321,189,'자리까지 일치 = S   /   숫자만 일치 = B',19,'#bcdbe6',650)),
    '2048': wrap('2048 예시. 왼쪽으로 이동하면 나란히 있던 2와 2가 합쳐져 4가 됩니다.',
      boxCaption('이동 전','← 왼쪽으로 이동 후')+
      round(49,73,'2','#3e6782',70)+round(125,73,'2','#3e6782',70)+round(201,73,'','#273e53',70)+
      arrow(324,120)+round(399,73,'4','#c18349',70)+round(475,73,'','#273e53',70)+round(551,73,'','#273e53',40)+
      t(316,191,'같은 숫자 두 개가 만나면 하나로 합쳐집니다',19,'#bcdbe6',650)),
    mines: wrap('지뢰찾기 예시. 숫자 1 주변의 지뢰 후보 칸에 깃발을 표시하는 모습입니다.',
      baseGrid(66,52,3,3,42,5)+
      t(66+47+21,52+42+28,'1',29,'#82d6ff')+
      r(66+94,52,42,42,'#865634',5)+t(66+115,84,'⚑',30,'#ffe08b')+
      arrow(314,118)+r(395,78,181,89,'#233f4c',15,'#58bcaf')+t(484,112,'1',33,'#a9e4ff')+
      t(484,144,'주변 지뢰 1개',16,'#fff1d5',700)+
      t(320,202,'숫자는 주변 8칸의 지뢰 개수입니다',19,'#bcdbe6',650)),
    pipes: wrap('파이프 연결 예시. 흩어진 파이프를 회전해 시작점에서 끝점까지 연결하는 모습입니다.',
      r(48,68,544,107,'#213d50',18)+
      `<path d="M80 121 H210 Q250 121 250 94 V88 Q250 77 275 77 H380 Q414 77 414 111 V121 H560" stroke="#125e70" stroke-width="27" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`+
      `<path d="M80 121 H210 Q250 121 250 94 V88 Q250 77 275 77 H380 Q414 77 414 111 V121 H560" class="v57-water" stroke="#79e2e9" stroke-width="12" fill="none" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="25 13"/>`+
      r(60,36,100,34,'#196d5f',10)+t(110,59,'START',16)+r(487,36,100,34,'#5a6e32',10)+t(536,59,'GOAL',16)+
      t(321,205,'파이프를 눌러 회전하고 물길을 이어 주세요',18,'#c5e9e8',650)),
    shikaku: wrap('시카쿠 예시. 숫자 6을 포함하는 2행 3열의 영역을 선택하면 넓이가 6칸입니다.',
      baseGrid(149,42,6,3,48,4)+
      r(148,41,154,102,'#5f9c86',9,'#9cedca')+
      `<g stroke="#b0ffdd" stroke-width="1" opacity=".65"><path d="M200 42V142M252 42V142M149 92H302"/></g>`+
      t(175,79,'6',29,'#fff9ca')+
      t(451,93,'2 × 3',39,'#b4f3ce',850)+t(451,132,'= 6칸',25,'#ffffff')+
      t(321,205,'한 영역 안에는 숫자가 반드시 하나만 있어야 해요',18,'#c4e4f0',650)),
    blocks: wrap('블록 퍼즐 예시. 비어 있던 마지막 한 칸에 블록을 놓으면 가로줄이 완성됩니다.',
      t(170,39,'블록 놓기 전',17,'#b6dfe8')+t(485,39,'한 줄 완성',17,'#b6dfe8')+
      baseGrid(76,61,5,3,38,3)+
      [0,1,2,3].map(k=>r(76+k*41,61+41,38,38,'#4aaab7',5)).join('')+
      r(76+4*41,61+41,38,38,'#38556a',5,'#f1b55e')+
      arrow(327,116)+
      baseGrid(401,61,5,3,38,3)+
      [0,1,2,3,4].map(k=>r(401+k*41,61+41,38,38,'#7be0b2',5)).join('')+
      t(317,205,'가로나 세로 한 줄을 채우면 지워지고 점수를 얻어요',18,'#c4e4f0',650))
  };
  const notes = {
    baseball:['화면의 자릿수에 맞춰 중복 없는 숫자를 입력해요.','숫자·자리까지 맞으면 스트라이크, 숫자만 맞으면 볼이에요.','이전 입력과 결과를 비교해 정답 후보를 좁혀 보세요.'],
    '2048':['같은 숫자 2개가 한 방향으로 움직여 만나면 합쳐져요.','PC 방향키·WASD, 모바일 스와이프 또는 화면 버튼으로 움직여요.','큰 타일을 만들면서 단계의 목표 타일과 점수를 확인하세요.'],
    mines:['안전한 칸을 모두 열면 클리어, 지뢰를 누르면 실패해요.','PC 오른쪽 클릭은 깃발, 모바일은 열기·깃발 모드를 바꿔 사용해요.','숫자는 주변 8칸의 지뢰 수예요. 의심되는 칸은 깃발로 표시하세요.'],
    pipes:['시작점과 끝점을 잇고 모든 파이프가 연결되어야 해요.','원하는 파이프를 클릭하거나 터치해서 방향을 회전시켜요.','열린 파이프 끝이 빈 공간을 향하지 않도록 확인하세요.'],
    shikaku:['전체 칸을 숫자에 맞는 직사각형으로 나누는 퍼즐이에요.','두 모서리를 클릭·터치하거나 드래그해 영역을 지정해요.','6이라는 숫자라면 넓이가 6칸인 직사각형을 만들어요.'],
    blocks:['아래 블록을 놓아 가로·세로 한 줄을 완성하면 점수를 얻어요.','블록을 선택 후 칸을 누르거나 손가락·마우스로 드래그해요.','초록색은 놓을 수 있는 위치, 빨강은 불가능한 위치예요.']
  };
  const captions = {baseball:'숫자와 자리 비교 예시', '2048':'왼쪽으로 밀었을 때 타일 합치기', mines:'숫자 1과 깃발 표시 예시',pipes:'파이프를 연결한 물 흐름 예시',shikaku:'숫자 6의 직사각형 선택 예시',blocks:'마지막 한 칸을 채워 줄 완성하기'};
  const stepLabels=['① 게임 목표','② 이렇게 조작해요','③ 기억할 팁'];
  const visual = dom('figure','v57-tour-visual');
  visual.id='v57-tour-visual';
  visual.setAttribute('aria-label','게임 규칙 그림 예시');
  const top = dom('div','v57-tour-visual-head');
  const chip=dom('span','v57-demo-chip','▶ 움직이는 그림 예시');
  const stage=dom('span','v57-demo-stage');
  top.append(chip,stage);
  const board=dom('div','v57-tour-board');
  const legend=dom('figcaption','v57-tour-caption');
  const explanation=dom('p','v57-tour-detail');
  visual.append(top,board,legend,explanation);
  const tourTitle=$('tutorial-title');
  const tourText=$('tutorial-text');
  if (tourText && tourTitle) {
    tourText.before(visual);
    // 기존 3단계 튜토리얼의 실행 흐름을 유지하면서 예시 그림만 덧붙입니다.
    const original=window.renderTutorial;
    if(typeof original==='function') {
      window.renderTutorial=function(...args){
        const result=original(...args);
        const key=(typeof tutorialGame==='string'&&demos[tutorialGame])?tutorialGame:'baseball';
        const step=(typeof tutorialStep==='number')?Math.max(0,Math.min(2,tutorialStep)):0;
        stage.textContent=stepLabels[step];
        board.innerHTML=demos[key]; // 고정된 자체 제작 SVG 6종만 사용합니다.
        legend.textContent=captions[key];
        explanation.textContent=notes[key][step];
        return result;
      };
    }
  }

  // 첫 방문 질문의 '설명 보기'를 그림이 포함된 정식 3단계 가이드로 연결합니다.
  const first=$('v55-first-guide');
  const show=$('v55-guide-show');
  if(first && show){
    show.addEventListener('click',event=>{
      if(!first.open)return;
      const key=(typeof activeGame==='string'&&demos[activeGame])?activeGame:'baseball';
      event.preventDefault();event.stopImmediatePropagation();
      try{localStorage.setItem('taekin.arcade.v55.guideSeen.'+key,'1');}catch(_){}
      first.close();
      // 연속 showModal 호출이 충돌하지 않게 첫 번째 창을 닫은 후 표시합니다.
      queueMicrotask(()=>{if(typeof window.openTutorial==='function')window.openTutorial(key);});
    },true);
  }

  // 상단 도전·내 기록·프로필 메뉴에서 처음 방문해도 이해할 수 있도록 짧은 가이드 표시.
  const menus={
    challenges:{title:'🎯 도전 메뉴 길잡이',sub:'게임 6종을 넘나드는 목표와 미션에 참여해 보세요.',cards:[
      ['🏁','종합 도전 100라운드','여러 게임이 이어지는 100라운드에 도전하고 완료 기록을 쌓아요.'],
      ['📅','일일·주간 미션','오늘의 목표를 달성하면 미션 경험치를 얻어요.'],
      ['🎖️','다음 목표 추천','가까운 업적과 배지를 확인하고 어떤 게임을 할지 결정해요.']
    ]},
    records:{title:'📊 내 기록 메뉴 길잡이',sub:'지금까지의 게임 성과와 기록을 한곳에서 확인하세요.',cards:[
      ['⭐','단계·별·보스 기록','완료 단계와 획득한 별, 보스 클리어 수를 확인해요.'],
      ['📈','게임별 플레이 분석','어떤 게임에서 좋은 기록을 냈는지 살펴볼 수 있어요.'],
      ['💾','기록 백업과 복원','JSON 파일로 저장하거나 다른 기기에서 기록을 불러올 수 있어요.']
    ]},
    profile:{title:'👤 프로필 메뉴 길잡이',sub:'플레이어의 성장 기록과 꾸미기를 관리하는 공간이에요.',cards:[
      ['✏️','닉네임','상단에 표시할 플레이어 이름을 바꿀 수 있어요.'],
      ['✨','레벨·칭호·경험치','게임과 미션을 진행해 경험치를 쌓고 새 칭호를 얻어요.'],
      ['🎨','프로필·사이트 꾸미기','레벨과 업적으로 얻은 테두리·배경·엠블럼을 설정해요.']
    ]}
  };
  for(const [key,guide] of Object.entries(menus)){
    const page=$('v26-view-'+key);
    const heading=page?.querySelector('.v26-page-heading');
    if(!heading)continue;
    const fold=dom('details','v57-category-guide');
    fold.id='v57-guide-'+key;
    const storageKey='taekin.arcade.v57.catGuideClosed.'+key;
    let closed=false;try{closed=localStorage.getItem(storageKey)==='1';}catch(_){}
    fold.open=!closed;
    const summary=dom('summary','v57-category-summary');
    summary.append(dom('strong','',guide.title),dom('span','', '이용 방법 보기 · 접기'));
    const content=dom('div','v57-category-inside');
    content.append(dom('p','v57-category-sub',guide.sub));
    const cards=dom('div','v57-category-cards');
    guide.cards.forEach(([icon,title,desc])=>{
      const item=dom('article','v57-category-card');
      item.append(dom('span','v57-category-icon',icon));
      const words=dom('div','v57-category-words');
      words.append(dom('strong','',title),dom('p','',desc));
      item.append(words);cards.append(item);
    });
    content.append(cards);fold.append(summary,content);
    heading.after(fold);
    fold.addEventListener('toggle',()=>{
      try{localStorage.setItem(storageKey,fold.open?'0':'1');}catch(_){}
    });
  }
  window.TaekinV57={demos,notes,menus,version:57};
})();
