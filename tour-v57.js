/* v59 · 게임별 6장면 순서형 그림 튜토리얼
 * 실제 게임 입력을 대신하지 않는 규칙 설명용 자체 SVG 그림입니다.
 * 움직이는 예시/무한 애니메이션 없이, 다음을 누를 때 새 장면을 표시합니다.
 * 게임 엔진·진행 기록·저장 형식은 변경하지 않습니다. */
(() => {
  'use strict';
  const $=id=>document.getElementById(id);
  const dom=(name,cls,txt)=>{const e=document.createElement(name);if(cls)e.className=cls;if(txt!==undefined)e.textContent=txt;return e;};
  const C={bg:'#152638',panel:'#20354b',box:'#2b4960',stroke:'#466a81',white:'#fff6e5',sub:'#b9d7e6',cyan:'#8bd7fa',mint:'#86e2b1',amber:'#ffd47e',red:'#ff96a9',purple:'#c1aeff'};
  const rect=(x,y,w,h,fill=C.box,rx=9,stroke='none')=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${fill}" stroke="${stroke}" stroke-width="2"/>`;
  const circle=(x,y,r,fill,stroke='none')=>`<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" stroke="${stroke}" stroke-width="2"/>`;
  const line=(x1,y1,x2,y2,color=C.sub,w=5)=>`<path d="M${x1} ${y1} L${x2} ${y2}" fill="none" stroke="${color}" stroke-width="${w}" stroke-linecap="round"/>`;
  const tx=(x,y,msg,size=25,color=C.white,weight=800,anchor='middle')=>`<text x="${x}" y="${y}" text-anchor="${anchor}" dominant-baseline="middle" fill="${color}" font-size="${size}" font-weight="${weight}" font-family="system-ui,'Malgun Gothic',sans-serif">${msg}</text>`;
  const label=(x,y,msg,color=C.sub)=>tx(x,y,msg,19,color,750);
  const arrow=(x,y,dir='→',color=C.mint)=>tx(x,y,dir,48,color,900);
  const tile=(x,y,num,fill=C.box,size=74,fg=C.white)=>rect(x,y,size,size,fill,12)+tx(x+size/2,y+size/2+2,num,36,fg);
  const cap=(x,y,w,title,fill=C.panel,color=C.white)=>rect(x,y,w,40,fill,13)+tx(x+w/2,y+21,title,20,color);
  const stageScene=(scene,what)=>`<svg viewBox="0 0 640 230" role="img" aria-label="${what}" xmlns="http://www.w3.org/2000/svg"><rect x="1" y="1" width="638" height="228" rx="16" fill="${C.bg}" stroke="${C.stroke}"/>${scene}</svg>`;
  const dots=(startX,y,n,selected,color=C.mint)=>Array.from({length:n},(_,i)=>circle(startX+i*27,y,8,i===selected?color:'#3b596c')).join('');
  const digitRow=(digits,y=95,marked={})=>digits.map((n,i)=>tile(100+i*110,y,n,marked[i]||C.box,78)).join('');
  const score=(x,y,n,labelText,color)=>rect(x,y,166,98,C.panel,15,color)+circle(x+30,y+33,12,color)+tx(x+102,y+34,n,30,color)+tx(x+83,y+75,labelText,19,C.sub);
  function grid(x,y,cols,rows,size=42,gap=4,fill='#2a4358'){
    let out='';for(let r=0;r<rows;r++)for(let c=0;c<cols;c++)out+=rect(x+c*(size+gap),y+r*(size+gap),size,size,fill,6);
    return out;
  }
  function markCell(x,y,c,r,size=42,gap=4,val='',fill='#29495c',color=C.white){return rect(x+c*(size+gap),y+r*(size+gap),size,size,fill,6)+tx(x+c*(size+gap)+size/2,y+r*(size+gap)+size/2+1,val,27,color);}
  const hand=(x,y)=>tx(x,y,'☝',57,C.amber);
  const check=(x,y)=>circle(x,y,25,'#266f59','#9ff3cb')+tx(x,y+1,'✓',29,C.white);
  const cross=(x,y)=>circle(x,y,25,'#88364c','#ffb4c2')+tx(x,y+1,'×',32,C.white);
  const pipePath=(s,glow=false)=>`<path d="${s}" fill="none" stroke="${glow?'#7be4ee':'#728eaa'}" stroke-width="${glow?14:24}" stroke-linecap="round" stroke-linejoin="round"/>`;
  const blockGrid=(x=175,y=25,fill=[],size=17,gap=2)=>{
    let s=grid(x,y,10,10,size,gap,'#2d4960');
    for(const [r,c,color] of fill)s+=markCell(x,y,c,r,size,gap,'',color||'#5bd0ab');
    return s;
  };
  const stepsByGame={
    baseball:[
      {title:'숨겨진 숫자를 맞혀요',text:'정답은 서로 다른 숫자로 이루어져 있어요. 화면에 표시된 자릿수만큼 0부터 9까지의 숫자를 추리해 입력합니다.',caption:'예시는 4자리 · 실제 게임은 단계에 따라 자릿수가 달라져요.'},
      {title:'숫자를 입력하고 확인해요',text:'예를 들어 4271을 입력해 결과 확인을 눌러 보세요. 같은 숫자를 두 번 쓰거나 자릿수가 다르면 입력할 수 없어요.',caption:'입력한 숫자 4 · 2 · 7 · 1을 판정해 봅니다.'},
      {title:'스트라이크는 노란색',text:'숫자도 같고 자리도 같으면 스트라이크(S)입니다. 예시에서 첫 번째 숫자 4가 정답 자리와 같아서 1S예요.',caption:'노란색 = 스트라이크 · 숫자와 위치가 모두 일치'},
      {title:'볼은 초록색',text:'정답에 들어 있는 숫자지만 자리가 다르면 볼(B)이에요. 예시에서는 2와 1이 자리만 달라 2B가 됩니다.',caption:'초록색 = 볼 · 숫자는 맞지만 위치가 다름'},
      {title:'일치하는 숫자가 없으면 아웃',text:'입력한 숫자가 정답에 하나도 없으면 OUT이 나와요. 예시처럼 5678을 넣으면 빨간색 아웃 판정이 표시됩니다.',caption:'빨간색 = 아웃 · 일치하는 숫자 0개'},
      {title:'기록을 비교해 정답을 찾으세요',text:'각 시도의 1S 2B처럼 판정 글자와 색상 불빛이 기록에 함께 남아요. 이전 결과를 비교해 다음 숫자를 추리하면 됩니다.',caption:'예시 정답은 4123 · 힌트와 정답 보기 버튼도 있어요.'}
    ],
    '2048':[
      {title:'같은 숫자 타일을 합쳐요',text:'2, 4, 8처럼 숫자가 적힌 타일이 나옵니다. 같은 숫자를 합쳐 더 큰 수를 만들고 단계의 목표를 달성하세요.',caption:'두 개의 2가 만나면 4가 됩니다.'},
      {title:'한 방향으로 타일을 밀어요',text:'PC에서는 방향키나 WASD를 누르세요. 모바일에서는 게임판을 상하좌우로 쓸어 넘기거나 화면의 방향 버튼을 사용해요.',caption:'← 왼쪽 이동 · 모든 타일이 함께 움직입니다.'},
      {title:'합쳐지는 순서를 확인해요',text:'왼쪽으로 움직이면 2와 2가 만나 4가 되고, 다음에는 4와 4를 합쳐 8을 만들 수 있어요.',caption:'2 + 2 → 4, 4 + 4 → 8'},
      {title:'움직일 때 새 숫자가 나와요',text:'유효하게 한 번 움직일 때마다 새 타일이 나타납니다. 판이 너무 꽉 차지 않도록 빈칸을 확보하세요.',caption:'빈칸이 적어질수록 이동하기 어려워져요.'},
      {title:'되돌리기와 힌트를 활용해요',text:'방향을 잘못 선택했다면 되돌리기를 이용하고, 고민될 때는 힌트로 추천 이동 방향을 확인할 수 있어요.',caption:'되돌리기(U) · 힌트는 이동을 직접 실행하지 않아요.'},
      {title:'단계 목표를 달성하면 성공',text:'단계마다 지정된 목표 타일이나 점수를 확인하세요. 더 이상 어떤 방향으로도 움직일 수 없으면 게임 오버예요.',caption:'목표 타일을 만들면 다음 단계로 넘어갑니다.'}
    ],
    mines:[
      {title:'먼저 닫힌 칸을 열어 봐요',text:'처음에는 모든 칸이 닫혀 있어요. PC는 왼쪽 클릭, 스마트폰은 열기 모드를 고르고 원하는 칸을 터치하세요. 첫 클릭과 주변 8칸은 안전해요.',caption:'첫 클릭 후 안전한 칸과 숫자가 펼쳐집니다.'},
      {title:'숫자 1은 주변에 지뢰 한 개',text:'열린 칸에 1이 보이면 그 칸을 둘러싼 최대 8칸 중 지뢰가 한 개 있다는 뜻이에요. 숫자가 지뢰의 위치를 바로 알려주는 건 아니에요.',caption:'1 옆의 닫힌 칸들 중 지뢰가 1개 있어요.'},
      {title:'숫자 2는 주변에 지뢰 두 개',text:'숫자 2가 있으면 주변 최대 8칸에 지뢰가 두 개예요. 여러 숫자의 단서를 함께 비교해 지뢰가 있을 곳을 찾으세요.',caption:'2 주위에는 지뢰가 총 2개 있어요.'},
      {title:'의심되는 칸에는 깃발',text:'PC는 오른쪽 클릭으로 깃발을 세울 수 있어요. 스마트폰에서는 깃발 모드로 전환한 다음 지뢰가 있다고 생각되는 칸을 터치하세요.',caption:'⚑ 깃발은 지뢰 위치를 표시하는 도구예요.'},
      {title:'지뢰를 피하며 안전한 칸 열기',text:'깃발과 숫자를 단서로 지뢰가 없는 칸을 차례로 열어 보세요. 지뢰를 직접 누르면 실패하니 확실한 칸부터 선택하세요.',caption:'안전한 칸을 계속 열어 게임판을 완성해요.'},
      {title:'안전한 칸을 다 열면 클리어!',text:'모든 안전한 칸을 열면 성공이에요. 모든 지뢰에 깃발을 세우는 것만으로 끝나는 건 아니며, 안전한 칸을 모두 여는 것이 승리 조건이에요.',caption:'남은 안전한 칸 0개 → 성공!'}
    ],
    pipes:[
      {title:'시작점과 도착점을 찾아요',text:'게임판에 START와 GOAL이 있어요. START에서 출발한 물이 GOAL까지 흐르도록 모든 파이프를 연결해야 해요.',caption:'시작점에서 목표까지 이어지는 길을 만들어 보세요.'},
      {title:'파이프를 눌러 회전해요',text:'PC에서는 파이프를 클릭하고 스마트폰에서는 손가락으로 터치하면 파이프가 90도씩 회전해요.',caption:'파이프 방향을 바꿔 다음 칸을 향하게 하세요.'},
      {title:'열린 구멍끼리 맞춰요',text:'서로 붙어 있는 파이프의 열린 부분이 마주 봐야 연결됩니다. 한쪽만 열려 있으면 물이 흐르지 않아요.',caption:'서로 마주 보는 연결부는 맞고, 막힌 연결부는 틀려요.'},
      {title:'물이 흐르는 경로를 확인해요',text:'연결이 맞는 파이프를 따라 물이 흐릅니다. 연결된 구간이 색으로 표시되니 어디까지 물이 도착했는지 확인하세요.',caption:'START에서 이어지는 물길을 확인하세요.'},
      {title:'빈 쪽으로 열린 구멍은 누수',text:'파이프 구멍이 옆 칸과 이어지지 않거나 빈 공간을 향하면 누수가 생길 수 있어요. 해당 파이프를 다시 회전하세요.',caption:'열린 끝이 막힌 곳을 향하지 않게 고쳐요.'},
      {title:'모든 파이프가 연결되면 성공',text:'START부터 GOAL까지 물길이 이어지고 모든 칸에 물이 도착하며 열린 배관이 남지 않아야 클리어돼요.',caption:'연결 완성 · 누수 0 · 모든 칸에 물 도착'}
    ],
    shikaku:[
      {title:'숫자들이 있는 판을 살펴봐요',text:'게임판에는 여러 숫자가 표시되어 있어요. 숫자들을 각각 하나씩 포함하는 직사각형으로 판 전체를 나누는 퍼즐이에요.',caption:'숫자 하나당 직사각형 하나를 만들어요.'},
      {title:'숫자는 칸 개수(넓이)예요',text:'6이 적힌 영역은 정확히 6칸이어야 해요. 예를 들면 2행 × 3열이나 1행 × 6열 모양이 가능합니다.',caption:'2 × 3 = 6칸인 직사각형'},
      {title:'두 모서리를 선택해 영역 지정',text:'PC는 두 모서리를 클릭하거나 드래그하세요. 스마트폰은 시작과 끝 칸을 차례로 터치하거나 손가락으로 드래그해요.',caption:'시작 칸 → 끝 칸을 선택하면 영역이 표시돼요.'},
      {title:'한 영역에는 숫자 하나만',text:'하나의 직사각형에 숫자가 두 개 들어가면 안 돼요. 숫자가 하나이고 넓이도 정확히 맞는지 확인하세요.',caption:'숫자 두 개가 들어간 직사각형은 잘못된 영역'},
      {title:'빈칸이나 겹침 없이 채워요',text:'직사각형끼리 겹치거나 게임판에 빈칸이 남으면 클리어할 수 없어요. 잘못 칠한 영역은 지우개로 수정하세요.',caption:'각 영역이 서로 겹치지 않아야 해요.'},
      {title:'전체 판을 나누면 클리어',text:'모든 숫자가 규칙에 맞는 직사각형 안에 있고 전체 판이 빈틈없이 채워지면 성공이에요.',caption:'숫자 1개씩 · 넓이 정확 · 빈칸 0'}
    ],
    blocks:[
      {title:'10×10 게임판과 블록 3개',text:'10×10 판 아래에 블록 세 개가 나옵니다. 블록을 원하는 위치에 배치해서 가로 또는 세로 줄을 만드는 게임이에요.',caption:'아래 블록 세 개를 판에 하나씩 놓아 보세요.'},
      {title:'선택하거나 끌어서 배치',text:'PC는 블록을 클릭해서 고른 뒤 판을 누르거나 드래그하세요. 스마트폰도 블록을 선택 후 칸을 터치하거나 손가락으로 끌 수 있어요.',caption:'블록 선택 → 빈칸에 배치'},
      {title:'초록색은 가능, 빨강은 불가',text:'배치 미리보기가 초록색이면 해당 위치에 놓을 수 있고, 빨간색이면 놓을 수 없어요. 회전은 할 수 없어요.',caption:'초록색 배치 가능 · 빨간색 배치 불가'},
      {title:'가로줄을 채우면 없어져요',text:'가로 10칸을 모두 채우면 완성된 줄이 지워지고 보너스 점수를 얻어요. 지운 만큼 새로운 공간을 확보할 수 있어요.',caption:'가로 10칸 완성 → 줄 지우기'},
      {title:'세로줄도 똑같이 지워져요',text:'세로 10칸도 마찬가지로 줄을 완성하면 지워져요. 블록 3개를 모두 사용하면 다음 3개가 새로 등장해요.',caption:'세로 10칸 완성 → 줄 지우기'},
      {title:'목표 점수와 남은 공간 확인',text:'목표 점수를 달성하면 단계가 클리어됩니다. 놓을 수 있는 블록이 하나도 남지 않으면 게임 오버이니 빈칸을 관리하세요.',caption:'줄을 지우며 목표 점수를 달성하세요.'}
    ]
  };
  function diagram(game,i){
    let s='';
    if(game==='baseball'){
      const secret=()=>digitRow(['4','1','2','3'],85,{0:'#2d7762',1:'#52647d',2:'#52647d',3:'#52647d'});
      switch(i){
        case 0:s=label(320,42,'정답은 비공개')+digitRow(['?','?','?','?'],79)+cap(214,174,212,'서로 다른 숫자',C.panel,C.mint);break;
        case 1:s=label(320,38,'입력 4자리')+digitRow(['4','2','7','1'],78)+cap(200,171,240,'결과 확인 →', '#245e67',C.white);break;
        case 2:s=label(320,33,'정답 4 1 2 3')+secret()+circle(139,191,15,C.amber)+tx(257,191,'4는 같은 자리 → 1 S',23,C.amber);break;
        case 3:s=label(320,33,'정답 4 1 2 3')+digitRow(['4','2','7','1'],77,{1:'#236d51',3:'#236d51'})+cap(219,173,202,'2 B', '#236d51','#e7ffef');break;
        case 4:s=label(320,35,'정답 4 1 2 3')+digitRow(['5','6','7','8'],77)+cap(225,175,190,'OUT', '#752e45',C.white);break;
        default:s=label(320,38,'추리 기록을 비교해요')+score(55,77,'1S','STRIKE',C.amber)+score(237,77,'2B','BALL',C.mint)+score(419,77,'OUT','아웃',C.red);break;
      }
    }else if(game==='2048'){
      switch(i){
        case 0:s=label(320,38,'타일 2개 합치기')+tile(130,77,'2','#47758a')+tile(225,77,'2','#47758a')+arrow(343,112)+tile(439,77,'4','#a56e31');break;
        case 1:s=label(175,40,'이동 전')+label(477,40,'이동 후')+tile(97,84,'2','#43637d',68)+tile(173,84,'2','#43637d',68)+arrow(324,118,'←')+tile(416,84,'4','#a56e31',68)+tile(492,84,'','#294157',68);break;
        case 2:s=label(320,38,'더 큰 숫자 만들기')+tile(126,77,'4','#a56e31')+tile(228,77,'4','#a56e31')+arrow(345,113)+tile(446,77,'8','#b97e35');break;
        case 3:s=label(320,35,'스마트폰: 스와이프')+tile(160,88,'2','#47758a')+arrow(323,119,'↔')+hand(485,121);break;
        case 4:s=label(320,37,'실수했을 때')+cap(56,88,240,'↶ 되돌리기',C.panel,C.amber)+cap(342,88,240,'💡 힌트',C.panel,C.mint);break;
        default:s=label(320,35,'단계 목표 타일')+tile(268,76,'128','#b67839',105)+check(460,128);break;
      }
    }else if(game==='mines'){
      const gx=210,gy=15,sz=45,gap=6;
      const board=()=>grid(gx,gy,4,4,sz,gap);
      switch(i){
        case 0:s=board()+markCell(gx,gy,1,1,sz,gap,'☝','#2b7764',C.white)+label(102,123,'터치')+arrow(169,123);break;
        case 1:s=board()+markCell(gx,gy,1,1,sz,gap,'1','#28557a',C.cyan)+markCell(gx,gy,2,1,sz,gap,'?','#9c6b3d')+label(105,105,'주변')+tx(106,135,'1개',25,C.amber);break;
        case 2:s=board()+markCell(gx,gy,1,1,sz,gap,'2','#28557a',C.cyan)+markCell(gx,gy,0,0,sz,gap,'?','#9c6b3d')+markCell(gx,gy,2,1,sz,gap,'?','#9c6b3d')+label(105,105,'주변')+tx(106,135,'2개',25,C.amber);break;
        case 3:s=board()+markCell(gx,gy,2,1,sz,gap,'⚑','#805d35',C.amber)+cap(34,100,160,'깃발 모드',C.panel,C.amber);break;
        case 4:s=board()+markCell(gx,gy,1,1,sz,gap,'1','#28557a',C.cyan)+markCell(gx,gy,2,1,sz,gap,'⚑','#805d35',C.amber)+markCell(gx,gy,0,1,sz,gap,'✓','#256f53',C.mint)+cap(28,100,166,'안전한 칸',C.panel,C.mint);break;
        default:s=board()+markCell(gx,gy,2,1,sz,gap,'⚑','#805d35',C.amber)+Array.from({length:4},(_,a)=>Array.from({length:4},(_,b)=>a===1&&b===2?'':markCell(gx,gy,b,a,sz,gap,'', '#286d60')).join('')).join('')+check(520,110)+label(519,166,'성공');break;
      }
    }else if(game==='pipes'){
      const card=()=>rect(80,48,480,132,C.panel,22);
      switch(i){
        case 0:s=card()+cap(106,93,138,'START','#246f5b')+arrow(314,111)+cap(404,93,138,'GOAL','#626b36');break;
        case 1:s=card()+pipePath('M162 118 H259 V82')+arrow(321,115,'↻',C.amber)+pipePath('M396 118 H488')+label(320,205,'90° 회전');break;
        case 2:s=card()+pipePath('M114 116 H253')+pipePath('M389 116 H529')+circle(322,116,19,'#286e58')+check(322,116)+label(322,202,'열린 끝끼리 연결');break;
        case 3:s=card()+pipePath('M116 130 H257 V88 H393 V130 H526',true)+cap(90,30,114,'START','#256d5e')+cap(430,30,114,'GOAL','#666d37');break;
        case 4:s=card()+pipePath('M135 116 H280')+pipePath('M402 145 V84')+cross(342,116)+label(326,202,'구멍이 어긋나면 누수');break;
        default:s=card()+pipePath('M119 131 H260 V93 H388 V131 H523',true)+check(320,113)+cap(213,186,214,'연결 완료','#245e4f',C.mint);break;
      }
    }else if(game==='shikaku'){
      const gx=180,gy=14,sz=44,gap=5;const board=()=>grid(gx,gy,5,4,sz,gap);
      switch(i){
        case 0:s=board()+markCell(gx,gy,0,0,sz,gap,'6','#3b617e',C.white)+markCell(gx,gy,4,1,sz,gap,'4','#3b617e')+markCell(gx,gy,2,3,sz,gap,'2','#3b617e')+label(87,115,'숫자');break;
        case 1:s=board()+Array.from({length:6},(_,k)=>markCell(gx,gy,k%3,Math.floor(k/3),sz,gap,k===0?'6':'','#2d856d')).join('')+cap(28,110,132,'2 × 3 = 6','#28684d',C.mint);break;
        case 2:s=board()+markCell(gx,gy,0,0,sz,gap,'①','#2b7862')+markCell(gx,gy,2,1,sz,gap,'②','#2b7862')+arrow(115,122)+cap(474,100,120,'선택','#315d77');break;
        case 3:s=board()+markCell(gx,gy,0,0,sz,gap,'6','#2f756b')+markCell(gx,gy,2,1,sz,gap,'4','#8b4554')+cross(516,111);break;
        case 4:s=board()+Array.from({length:6},(_,k)=>markCell(gx,gy,k%3,Math.floor(k/3),sz,gap,k===0?'6':'','#357e65')).join('')+markCell(gx,gy,3,0,sz,gap,'?','#755b3b')+cap(20,110,125,'빈칸','#785333');break;
        default:s=board()+Array.from({length:20},(_,k)=>markCell(gx,gy,k%5,Math.floor(k/5),sz,gap,'',k%5<=2?'#337a68':'#3c6b96')).join('')+markCell(gx,gy,0,0,sz,gap,'6','#337a68')+check(520,113);break;
      }
    }else if(game==='blocks'){
      const fills=[];for(let x=0;x<7;x++)fills.push([5,x,'#4aa5af']);
      switch(i){
        case 0:s=blockGrid(166,15,[])+tile(435,54,'■','#328d7e',60)+tile(515,54,'■','#5c87b0',60)+label(508,150,'블록 3개');break;
        case 1:s=blockGrid(167,15,[[1,2,'#55c6a8'],[1,3,'#55c6a8']])+arrow(484,83,'↖')+cap(422,143,172,'블록 선택',C.panel,C.amber);break;
        case 2:s=blockGrid(160,15,[[1,2,'#3eac85'],[1,3,'#3eac85'],[1,4,'#3eac85'],[5,7,'#b54d62']])+cap(394,66,180,'초록: 가능','#285a45',C.mint)+cap(394,128,180,'빨강: 불가','#6a3245',C.red);break;
        case 3:s=blockGrid(164,15,Array.from({length:10},(_,c)=>[4,c,'#5bd2b1']))+arrow(470,99)+cap(430,139,168,'줄 지우기','#246952',C.mint);break;
        case 4:s=blockGrid(164,15,Array.from({length:10},(_,r)=>[r,4,'#5bd2b1']))+arrow(470,99)+cap(430,139,168,'줄 지우기','#246952',C.mint);break;
        default:s=blockGrid(165,15,fills)+cap(410,67,180,'목표 점수','#375c75',C.amber)+check(500,154);break;
      }
    }
    const item=stepsByGame[game][i];
    return stageScene(s,`${game} ${i+1}단계 설명: ${item.caption}`);
  }
  const visual=dom('figure','v59-tour-visual');visual.id='v59-tour-visual';
  const topline=dom('div','v59-tour-meta');const phase=dom('span','v59-tour-label','그림으로 배우기');const marker=dom('span','v59-tour-marker');
  topline.append(phase,marker);
  const diagramBox=dom('div','v59-tour-diagram');
  const caption=dom('figcaption','v59-tour-caption');
  visual.append(topline,diagramBox,caption);
  const tourText=$('tutorial-text');
  if(tourText)tourText.before(visual);
  window.TaekinTutorialV59={stepsByGame,diagram};
  window.addEventListener('taekin-tutorial-render',event=>{
    const {game,step}=event.detail||{};
    if(!stepsByGame[game]||!stepsByGame[game][step])return;
    marker.textContent=`${step+1} / ${stepsByGame[game].length}`;
    diagramBox.innerHTML=diagram(game,step);
    caption.textContent=stepsByGame[game][step].caption;
  });
  // 첫 방문에 '설명 보기'를 누르면 짧은 요약 대신 그림형 튜토리얼로 곧바로 연결합니다.
  const first=$('v55-first-guide');const show=$('v55-guide-show');
  if(first&&show)show.addEventListener('click',event=>{
    if(!first.open)return;
    const key=(typeof activeGame==='string'&&stepsByGame[activeGame])?activeGame:'baseball';
    event.preventDefault();event.stopImmediatePropagation();
    try{localStorage.setItem('taekin.arcade.v55.guideSeen.'+key,'1');}catch(_e){}
    first.close();
    queueMicrotask(()=>{if(typeof openTutorial==='function')openTutorial(key);});
  },true);
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
  window.TaekinV59={stepsByGame,menus,version:59};
})();
