/* v55 · 공개 기념 새 출발: 방문한 브라우저의 게임 진행/업적을 1회만 초기화합니다.
   개별 사용자의 로컬 저장소만 다룹니다. 설정, 닉네임, 음원, 접근성은 유지합니다.
   기존 기록을 무한히 초기화하지 않도록 성공했을 때만 마커를 저장합니다. */
(() => {
  const marker='taekin.arcade.v55.progressResetDone';
  try {
    if(localStorage.getItem(marker)==='1')return;
    const keys=[
      'taekin-brain-arcade-v13-progress','taein-brain-arcade-v4-progress',
      'taekin_arcade_sessions_v19','taekin_arcade_playlog_v19',
      'taekin.arcade.v25.progress','taekin_arcade_best_v13',
      'taekin.arcade.v20.bonus','taekin.arcade.v22.featuredBadge',
      'taekin.arcade.v34.masterAll'
    ];
    // 플레이어 이름은 진행도가 아니라 개인 표시 설정이므로 가능한 경우 유지합니다.
    let nickname='';
    try{
      const previous=JSON.parse(localStorage.getItem('taekin.arcade.v25.progress')||'null');
      if(typeof previous?.name==='string')nickname=previous.name.slice(0,20);
    }catch(_){}
    for(const key of keys)localStorage.removeItem(key);
    if(nickname)localStorage.setItem('taekin.arcade.v25.progress',JSON.stringify({name:nickname}));
    localStorage.setItem(marker,'1');
  }catch(error){console.warn('진행 기록 초기화에 실패했습니다. 브라우저 저장소 설정을 확인해 주세요.',error);}
})();

/* TAEKIN BRAIN ARCADE v47 — 초보자 안내 · 게임 소개 배너 · 레벨 보상 가시화 */

/* ==========================================================================
   게임 6종·1,500단계·기록·음악
   ========================================================================== */
/* ===============================================================
   TAEKIN BRAIN ARCADE — 웹게임 6종과 성장·보상 시스템
   기존 C++ 콘솔게임의 주요 규칙과 6개 게임별 5개 난이도 × 50단계 도전을 구현했습니다.
   외부 라이브러리 및 인터넷 연결이 필요하지 않습니다.
   =============================================================== */
"use strict";

const $ = (id) => document.getElementById(id);
// 마스터 코드는 정적 웹사이트에서 제공하는 시연·보상 해금 기능입니다.
// 실제 클리어/별/XP 기록은 변경하지 않고, 잠긴 보상과 스테이지 선택만 별도로 열어 둡니다.
const V34_MASTER_FLAG = 'taekin.arcade.v34.masterAll';
const isMasterUnlocked = () => { try {return localStorage.getItem(V34_MASTER_FLAG)==='1';}catch(_){return false;} };
window.TaekinMaster = {
  isUnlocked: isMasterUnlocked,
  setUnlocked(on) {
    try {if(on)localStorage.setItem(V34_MASTER_FLAG,'1');else localStorage.removeItem(V34_MASTER_FLAG);}catch(_){/* 저장 차단 시 다음 실행에서는 해금되지 않을 수 있음 */}
    window.dispatchEvent(new Event('taekin-master-changed'));
    return isMasterUnlocked();
  }
};
// 기존 버전의 저장 키는 기록 호환을 위해 유지하되 쓰기 실패는 화면의 저장 상태에 반영합니다.
function arcadeStorageWrite(key,value){
  try{localStorage.setItem(key,value);window.TaekinV32Save?.record(true);return true;}
  catch(_){window.TaekinV32Save?.record(false);return false;}
}
const randomInt = (max) => Math.floor(Math.random() * max);
const copyGrid = (grid) => grid.map((row) => [...row]);
const inBounds = (size, row, col) => row >= 0 && row < size && col >= 0 && col < size;


/* 매 판은 새로운 랜덤 문제입니다. 정답/기록 생성에 고정 시드를 사용하지 않습니다. */

const gameInfo = {
  baseball: { hint: "힌트를 누르면 숨겨진 정답 중 아직 모르는 자리의 숫자 하나를 알려줘요. 「정답 보기」는 전체 정답을 보여주지만 이번 판은 클리어 기록으로 남지 않아요.", name: "숫자야구", emoji: "⚾", index: "01 / 06", description: "난이도를 선택하고 서로 다른 숫자를 추리해 정답을 맞혀보세요.",
    rules: ["<strong>0~9</strong> 중 서로 다른 숫자를 맞히세요. 자유 플레이는 3~8자리, 단계 도전은 2~8자리입니다.", "자리와 숫자가 같으면 <strong>스트라이크(S)</strong>입니다.", "숫자만 같고 위치가 다르면 <strong>볼(B)</strong>입니다.", "일치하는 숫자가 없으면 <strong>OUT</strong>입니다.", "같은 추측은 두 번 입력할 수 없습니다.", "<strong>정답 보기</strong> 버튼은 정답을 공개하고 이번 라운드를 종료합니다."], tip: "예를 들어 정답이 0123처럼 0으로 시작할 수도 있어요. 숫자를 입력한 다음 S(자리까지 일치)와 B(숫자만 일치)를 보고 다음 답을 추리하세요." },
  "2048": { hint: "지금 게임판에서 도움이 될 만한 이동 방향을 알려줘요. 힌트를 누르기만 해서는 타일이 움직이거나 점수가 바뀌지 않아요.", name: "2048", emoji: "🔢", index: "02 / 06", description: "같은 숫자를 합쳐 2048을 완성하는 전략 퍼즐입니다.",
    rules: ["<strong>방향키 / WASD</strong>로 모든 블록을 이동합니다.", "같은 숫자 두 개가 충돌하면 하나로 합쳐집니다.", "이동이 성공할 때마다 새 숫자가 생성됩니다.", "<strong>U</strong> 키나 버튼으로 이동을 되돌립니다. 모든 난이도에서 횟수 제한 없이 되돌릴 수 있습니다.", "<strong>단계 도전</strong>은 현재 단계에 표시된 목표 타일(최대 2,048)을 만들면 성공합니다. <strong>자유 플레이</strong>는 난이도에 따라 최대 8,192 타일까지 목표가 달라집니다. 이동이 불가능하면 게임 오버!", "<strong>힌트</strong> 버튼은 현재 판에서 유리한 방향 하나를 제안합니다."], tip: "같은 숫자 두 칸이 만나면 하나가 돼요. 높은 숫자 타일을 한쪽 모서리에 모아 두면 빈칸을 관리하기 쉬워요." },
  mines: { hint: "먼저 아무 칸이나 한 번 열어 보세요. 이후 힌트를 누르면 안전하다고 판단한 칸을 강조해 줘요. 첫 클릭 전에는 힌트 횟수가 줄어들지 않아요.", name: "지뢰찾기", emoji: "💣", index: "03 / 06", description: "숫자 힌트를 이용해 지뢰를 피하고 안전한 칸을 모두 여세요.",
    rules: ["<strong>단계 도전</strong>은 선택한 난이도와 단계에 따라 판 크기·지뢰 수·제한 시간이 달라집니다. 자유 플레이 설정과는 별도입니다.", "칸을 클릭해 열고, <strong>오른쪽 클릭</strong>으로 깃발을 놓으세요.", "모바일에서는 <strong>깃발 모드</strong>를 선택할 수 있습니다.", "첫 클릭 칸과 주변 8칸은 항상 안전합니다. 논리적으로 풀 수 있는 판을 우선 생성합니다.", "모든 안전한 칸을 열면 승리하고, 지뢰를 열면 패배합니다.", "<strong>힌트</strong>는 안전한 칸을 표시하며, 논리적으로 막힌 경우에는 횟수를 차감하지 않는 구조 도움을 제공합니다."], tip: "숫자 1은 주변 여덟 칸 중 지뢰가 한 개 있다는 뜻이에요. 지뢰가 없다고 확신한 칸부터 열고, 의심되는 칸에는 깃발을 표시하세요." },
  pipes: { hint: "현재 방향이 맞지 않는 파이프 하나를 찾아 올바른 방향으로 돌려 줘요. 물이 어디까지 흐르는지도 함께 확인해 보세요.", name: "파이프 연결", emoji: "🔧", index: "04 / 06", description: "모든 파이프를 이어 시작점의 물이 전체 게임판을 통과하도록 만드세요.",
    rules: ["<strong>단계 도전</strong>은 단계마다 판 크기와 파이프 회전 정도가 달라지고, <strong>자유 플레이</strong>는 난이도별 기본 판 크기를 사용합니다.", "파이프를 <strong>클릭</strong>하면 선택한 방향으로 90° 회전합니다. 회전 횟수 제한은 없으며 방향 전환과 되돌리기도 사용할 수 있습니다.", "화면 상단 오른쪽 <strong>START</strong>에서 물이 들어오고, 왼쪽 아래 <strong>GOAL</strong>로 나갑니다.", "서로 마주 보는 파이프 구멍이 맞아야 <strong>물이 흘러 연결된 부분이 푸르게 빛납니다.</strong>", "<strong>모든 칸에 물이 도착</strong>하고 열린 배관이나 누수가 없어야 승리합니다.", "<strong>힌트</strong>는 잘못 회전된 파이프 한 개를 정답 방향으로 맞춰 줍니다."], tip: "파이프를 눌러 방향을 돌려 보세요. 양쪽 파이프의 구멍이 서로 마주 봐야 물이 흘러요. 네 방향으로 뚫린 십자 파이프는 돌려도 모양이 같아요." },
  shikaku: { hint: "아직 만들지 않은 직사각형 한 곳을 노란색 테두리로 알려줘요. 표시를 참고해서 직접 영역을 선택해야 완성돼요.", name: "시카쿠", emoji: "🧩", index: "05 / 06", description: "숫자 넓이에 맞는 직사각형으로 게임판 전체를 채우세요.",
    rules: ["<strong>단계 도전</strong>은 난이도와 단계에 따라 판 크기·영역 개수가 바뀝니다. 자유 플레이의 난이도 설정과 구별해 주세요.", "직사각형 한 개에는 <strong>숫자가 정확히 하나</strong> 있어야 합니다.", "직사각형의 넓이는 적힌 숫자와 같아야 합니다.", "시작 칸과 끝 칸을 <strong>차례로 클릭</strong>하거나 드래그하세요.", "영역끼리 겹칠 수 없으며, 모든 칸을 올바르게 덮으면 승리합니다.", "<strong>지우개 모드</strong>에서 색칠된 영역을 누르면 해당 영역이 지워집니다."], tip: "숫자 6은 넓이가 6칸인 사각형을 만들라는 뜻이에요. 예를 들면 2×3이나 1×6이 가능해요. 각 사각형에는 숫자가 하나만 있어야 해요." },
  blocks: { hint: "블록을 놓을 수 있는 자리를 미리 확인할 수 있어요. 초록색은 놓을 수 있는 자리, 빨간색은 놓을 수 없는 자리예요. 블록을 대신 놓지는 않아요.", name: "블록 퍼즐", emoji: "🧱", index: "06 / 06", description: "블록을 배치하고 가로·세로 줄을 채워 점수를 획득하는 전략 게임입니다.",
    rules: ["<strong>10×10</strong> 게임판입니다. 아래에 나타난 블록 3개를 한 번씩 사용합니다.", "블록을 선택한 뒤 시작 칸을 클릭하거나, PC에서 블록을 게임판으로 드래그해 놓으세요.", "가로 또는 세로 한 줄의 <strong>10칸을 모두 채우면 줄이 지워지고 보너스 점수</strong>를 얻습니다.", "블록 3개를 모두 배치하면 다음 블록 3개가 나옵니다.", "놓을 수 있는 블록이 하나도 없으면 게임 오버입니다. 이동 취소는 되돌리기 버튼을 사용하세요.", "난이도별 목표 점수를 달성하면 승리합니다."],
    tip: "블록을 돌릴 수는 없어요. 가로 또는 세로로 10칸을 채우면 해당 줄이 사라져요. 좁은 빈칸을 남기지 않도록 미리 놓을 자리를 생각해 보세요." }
};


/* ================= 게임 효과음 엔진 (Web Audio API) =================
   파일을 내려받는 대신 Web Audio API로 짧은 소리를 직접 합성합니다.
   BGM과 효과음 설정은 별도이며, 첫 클릭/키보드 조작 때만 재생됩니다.
   브라우저가 지원하지 않거나 오디오 사용이 금지되면 게임은 무음으로 작동합니다.
   =============================================================== */
// 이전 이름으로 저장된 효과음 설정을 현재 키로 옮깁니다 (기존 사용자 호환).
function readSavedSetting(newKey, oldKey) {
  try {
    const current=localStorage.getItem(newKey);
    if(current!==null)return current;
    const legacy=localStorage.getItem(oldKey);
    if(legacy!==null){localStorage.setItem(newKey,legacy);return legacy;}
  }catch(_){/* 브라우저가 저장소를 차단한 경우에는 기본값 사용 */}
  return null;
}
function readSavedBest(kind){
  try {const all=JSON.parse(localStorage.getItem('taekin_arcade_best_v13')||'{}');return Math.max(0,Number(all[kind])||0);}catch(_){return 0;}
}
function saveBest(kind,value){
  try {const key='taekin_arcade_best_v13';const all=JSON.parse(localStorage.getItem(key)||'{}');all[kind]=Math.max(Number(all[kind])||0,Number(value)||0);localStorage.setItem(key,JSON.stringify(all));window.TaekinV32Save?.record(true);}catch(_){window.TaekinV32Save?.record(false);}
}
const SFX_STORAGE = 'taekin_arcade_sfx_v13';
const sfxToggle = $('sfx-toggle');
const sfxVolume = $('sfx-volume');
const sfxTest = $('sfx-test');
const sfxStatus = $('sfx-status');
let sfxSettings = {enabled:true,volume:40};
try {
  const previous = JSON.parse(readSavedSetting(SFX_STORAGE,'taein_arcade_sfx_v9') || '{}');
  if(typeof previous.enabled === 'boolean') sfxSettings.enabled = previous.enabled;
  if(Number.isFinite(Number(previous.volume))) sfxSettings.volume = Math.max(0,Math.min(100,Number(previous.volume)));
} catch (_) { /* 로컬 파일의 저장 제한은 무시합니다. */ }
let sfxContext = null;
let sfxMaster = null;
const sfxLastPlayed = {};
function saveSfxSettings(){
  try{localStorage.setItem(SFX_STORAGE,JSON.stringify(sfxSettings));window.TaekinV32Save?.record(true);}catch(_){window.TaekinV32Save?.record(false);}
}
function renderSfxControls(){
  sfxToggle.textContent = sfxSettings.enabled ? '🔊 효과음 켜짐' : '🔇 효과음 꺼짐';
  sfxToggle.setAttribute('aria-pressed', String(sfxSettings.enabled));
  sfxVolume.value = String(sfxSettings.volume);
  sfxVolume.disabled = !sfxSettings.enabled;
  sfxStatus.textContent = `효과음 ${sfxSettings.enabled?'켜짐':'꺼짐'} · 음량 ${sfxSettings.volume}%`;
  if(sfxMaster) sfxMaster.gain.value = sfxSettings.enabled ? sfxSettings.volume/100*.78 : 0;
}
function getSfxContext(){
  const Ctor = window.AudioContext || window.webkitAudioContext;
  if(!Ctor)return null;
  try{
    if(!sfxContext){
      sfxContext = new Ctor();
      sfxMaster = sfxContext.createGain();
      // 신호가 커지는 것을 막는 소프트 컴프레서
      const limiter = sfxContext.createDynamicsCompressor();
      limiter.threshold.value = -16;
      limiter.knee.value = 12;
      limiter.ratio.value = 6;
      limiter.attack.value = .002;
      limiter.release.value = .15;
      sfxMaster.connect(limiter);
      limiter.connect(sfxContext.destination);
    }
    sfxMaster.gain.value = sfxSettings.enabled ? sfxSettings.volume/100*.78 : 0;
    if(sfxContext.state==='suspended')sfxContext.resume().catch(()=>{});
    return sfxContext;
  }catch(_){return null;}
}
// 한 음의 주파수·길이·파형·도달 시간을 설정한 뒤, 짧은 페이드인/아웃으로 클릭 잡음을 제거
function sfxNote(ctx,frequency,duration,offset=0,shape='sine',power=.12,endFrequency=null){
  const start=ctx.currentTime+.008+offset;
  const osc=ctx.createOscillator(),gain=ctx.createGain();
  osc.type=shape;
  osc.frequency.setValueAtTime(Math.max(35,frequency),start);
  if(endFrequency)osc.frequency.exponentialRampToValueAtTime(Math.max(35,endFrequency),start+duration);
  gain.gain.setValueAtTime(.0001,start);
  gain.gain.exponentialRampToValueAtTime(Math.max(.002,power),start+.008);
  gain.gain.exponentialRampToValueAtTime(.0001,start+duration);
  osc.connect(gain);
  gain.connect(sfxMaster);
  osc.start(start);osc.stop(start+duration+.012);
}
// 게임 효과음의 성격을 각각 다르게 합성 (상업용/외부 음원 사용 없음)
function playSfx(kind){
  if(!sfxSettings.enabled||sfxSettings.volume===0||document.hidden)return;
  const ctx=getSfxContext();if(!ctx)return;
  const now=performance.now();
  if(now-(sfxLastPlayed[kind]||0)<65)return; // 연속 클릭 폭주 방지
  sfxLastPlayed[kind]=now;
  const note=(f,d,t=0,w='sine',p=.12,to=null)=>sfxNote(ctx,f,d,t,w,p,to);
  switch(kind){
    case 'ui':      note(460,.07,0,'sine',.085,620);break;
    case 'start':   note(392,.09,0,'triangle',.10);note(587,.12,.10,'triangle',.12);break;
    case 'select':  note(525,.055,0,'sine',.10,670);break;
    case 'guess':   note(350,.09,0,'triangle',.10,460);note(520,.09,.09,'sine',.10);break;
    case 'out':     note(250,.12,0,'triangle',.10,190);break;
    case 'reveal':  note(410,.07,0,'sine',.09,540);break;
    case 'flag':    note(710,.055,0,'triangle',.10,590);break;
    case 'move':    note(175,.07,0,'triangle',.12,145);break;
    case 'merge':   note(330,.09,0,'sine',.13);note(495,.14,.055,'triangle',.13,605);break;
    case 'rotate':  note(160,.09,0,'triangle',.16,265);note(385,.04,.05,'sine',.06);break;
    case 'water':   note(510,.13,0,'sine',.11,710);note(830,.12,.07,'sine',.06,650);break;
    case 'place':   note(210,.07,0,'triangle',.15,132);note(360,.07,.02,'sine',.05);break;
    case 'rectangle':note(320,.11,0,'triangle',.12);note(480,.11,.055,'sine',.09);break;
    case 'line':    [523,659,784,1046].forEach((f,i)=>note(f,.11,i*.058,'sine',.12));break;
    case 'hint':    [740,988,1175].forEach((f,i)=>note(f,.15,i*.082,'sine',.105));break;
    case 'undo':    note(650,.09,0,'sine',.10,410);note(380,.09,.08,'triangle',.08);break;
    case 'erase':   note(400,.11,0,'triangle',.09,190);break;
    case 'invalid': note(190,.09,0,'triangle',.085,150);break;
    case 'lose':    [330,262,196].forEach((f,i)=>note(f,.20,i*.15,'triangle',.14));break;
    case 'win':     [392,494,587,784].forEach((f,i)=>note(f,.25,i*.115,'triangle',.15));note(1046,.36,.47,'sine',.13);break;
    case 'grand':   [392,494,587,784,988,1175].forEach((f,i)=>note(f,.27,i*.12,'triangle',.14));note(1568,.60,.72,'sine',.13);break;
    case 'test':    note(392,.15,0,'triangle',.12);note(587,.15,.16,'sine',.12);note(784,.28,.32,'sine',.14);break;
    default:        note(440,.075,0,'sine',.09);
  }
}
sfxToggle.addEventListener('click',()=>{
  sfxSettings.enabled=!sfxSettings.enabled;
  saveSfxSettings();renderSfxControls();
  if(sfxSettings.enabled)playSfx('start');
});
sfxVolume.addEventListener('input',()=>{
  sfxSettings.volume=Number(sfxVolume.value);
  saveSfxSettings();renderSfxControls();
});
sfxVolume.addEventListener('change',()=>playSfx('select'));
sfxTest.addEventListener('click',()=>{
  if(!sfxSettings.enabled){sfxSettings.enabled=true;saveSfxSettings();renderSfxControls();}
  playSfx('test');
});
renderSfxControls();
// 메인 메뉴·단계·난이도 조작음 (다른 게임 이벤트와 이중 재생하지 않도록 제한)
document.addEventListener('click',event=>{
  const button=event.target.closest('button');
  if(!button||button.disabled)return;
  if(button.matches('.game-card,.stage-btn,.marathon-round,.difficulty-buttons button,#marathon-start,#challenge-next,#clear-next,#clear-home,#back-to-home,#header-back,#brand-home,#challenge-free')){
    playSfx('ui');
  }
});

let activeGame = null;
function setStatus(id, message, type = "") {
  const el = $(id);
  el.textContent = message;
  el.classList.remove("success", "error");
  if (type) el.classList.add(type);
}
function showHome() {
  if(activeGame==='pipes' && pipeGame.state==='flowing'){
    clearPipeFlowAnimation();pipeGame.state='playing';
  }
  hideVictoryOverlay();
  activeGame = null;
  challenge={mode:'free',stage:-1,reported:false};
  $("home-screen").classList.remove("hidden");
  $("play-screen").classList.add("hidden");
  $("header-back").classList.add("hidden");
  renderHomeProgress();
  window.scrollTo({ top: 0, behavior: "instant" });
}
// 데스크톱 레이아웃은 유지하고 작은 화면에서만 게임판으로 진입합니다.
function v41ScheduleBoardFocus(){
  const fold=$('v41-tier-fold');
  if(fold)fold.open=false;
  requestAnimationFrame(()=>requestAnimationFrame(()=>{
    const target=window.matchMedia('(max-width: 700px)').matches?$('panel-'+activeGame):document.querySelector('.game-heading');
    target?.scrollIntoView({block:'start',behavior:'instant'});
  }));
}
$('v41-jump-board').addEventListener('click',()=>$('panel-'+activeGame)?.scrollIntoView({block:'start',behavior:'smooth'}));
// 게임 카드 선택 시에는 선택한 난이도의 현재 단계에 곧바로 도전합니다.
// 도전 모드는 개별 게임의 250단계와 별도로 실행합니다.
function showGame(key, autoStage=true) {
  if (!gameInfo[key]) return;
  if(activeGame==='pipes' && key!=='pipes' && pipeGame.state==='flowing'){
    clearPipeFlowAnimation();pipeGame.state='playing';
  }
  hideVictoryOverlay();
  activeGame = key;
  const info = gameInfo[key];
  $("home-screen").classList.add("hidden");
  $("play-screen").classList.remove("hidden");
  $("header-back").classList.remove("hidden");
  $("active-emoji").textContent = info.emoji;
  $("active-title").textContent = info.name;
  $("active-description").textContent = info.description;
  $("game-counter").textContent = info.index;
  $("rules-title").textContent = info.name + " 게임 방법";
  $("rules-content").innerHTML = "<ol>" + info.rules.map((rule) => `<li>${rule}</li>`).join("") + "</ol>";
  $("game-tip").textContent = info.tip;
  $("hint-description").textContent = info.hint;
  for (const name of Object.keys(gameInfo)) $("panel-" + name).classList.toggle("hidden", name !== key);
  challenge={mode:'free',stage:-1,reported:false};
  if(autoStage){const tier=preferredTier(key);stageTier=tier;launchStage(tierBase(tier)+Math.min(49,completedTierStages(key,tier)));}
  else {RESTART_ACTIONS[key]();renderStageChallenge();}
  // 게임을 전환해도 각 게임의 화면 크기 설정을 독립적으로 유지합니다.
  v42ApplyBoardZoom(key,{keepCenter:false});
  // 작은 화면에서는 난이도 버튼을 접고 바로 게임 조작 영역에 접근합니다.
  v41ScheduleBoardFocus();
}

/* ===================== 1. 숫자야구 ===================== */
const baseballPresets = { easy: 3, normal: 4, hard: 5, extreme: 6, expert:8 };
const baseball = { answer: [], guesses: [], finished: false, digits: 4, known: [], hints: 0, maxAttempts: Infinity };
function baseballGenerate() {
  const pool = Array.from({ length: 10 }, (_, i) => String(i));
  for (let i = pool.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, baseball.digits);
}
function baseballJudge(answer, guess) {
  let strikes = 0, balls = 0;
  for (let i = 0; i < answer.length; i++) {
    if (guess[i] === answer[i]) strikes++;
    else if (answer.includes(guess[i])) balls++;
  }
  return { strikes, balls, text: strikes === 0 && balls === 0 ? "OUT" : `${strikes}S ${balls}B` };
}
function resetBaseball() {
  resetRunStats();
  if(typeof challenge!=="undefined" && challenge.reported){challenge.reported=false;hideVictoryOverlay();}
  const stage = getActiveStageConfig("baseball");
  baseball.digits = stage ? stage.digits : baseballPresets[$("bb-difficulty").value];
  baseball.maxAttempts = stage ? stage.maxAttempts : Infinity;
  baseball.answer = baseballGenerate();
  baseball.guesses = [];
  baseball.finished = false;
  baseball.known = [];
  baseball.hints = 0;
  $("bb-hint").disabled = false;
  $("bb-input").value = "";
  $("bb-input").maxLength = baseball.digits;
  $("bb-input").placeholder = ""; // 예시 숫자 대신 빈 입력창 표시
  $("bb-input").setAttribute("aria-label", `서로 다른 ${baseball.digits}자리 숫자`);
  $("bb-input").disabled = false;
  $("bb-submit").disabled = false;
  $("bb-answer").disabled = false;
  $("bb-attempts").textContent = "도전 0회";
  $("bb-history").innerHTML = '<tr class="empty-row"><td colspan="3">아직 입력한 기록이 없어요.</td></tr>';
  $("panel-baseball").querySelector(".secret-slots").innerHTML = "<span>?</span>".repeat(baseball.digits);
  setStatus("bb-status", `0~9에서 서로 다른 숫자 ${baseball.digits}개를 입력하세요.${Number.isFinite(baseball.maxAttempts) ? ` · 최대 ${baseball.maxAttempts}회` : ""}`);
  v19UpdateBaseballCandidates();
  $("bb-input").focus();
}
function submitBaseball(event) {
  event.preventDefault();
  if (baseball.finished) return;
  const input = $("bb-input");
  const guess = input.value.trim();
  if (!new RegExp(`^[0-9]{${baseball.digits}}$`).test(guess)) return setStatus("bb-status", `0~9 사이 숫자 ${baseball.digits}자리를 입력하세요.`, "error");
  if (new Set(guess).size !== baseball.digits) return setStatus("bb-status", "같은 숫자는 중복해서 입력할 수 없습니다.", "error");
  if (baseball.guesses.some((record) => record.guess === guess)) return setStatus("bb-status", "이미 시도했던 숫자입니다.", "error");
  const result = baseballJudge(baseball.answer, guess);
  baseball.guesses.push({ guess, ...result });
  const body = $("bb-history");
  if (baseball.guesses.length === 1) body.innerHTML = "";
  const tr = document.createElement("tr");
  for (const value of [String(baseball.guesses.length), guess, result.text]) {
    const td = document.createElement("td");
    td.textContent = value;
    if (value === guess) td.className = "guess";
    tr.appendChild(td);
  }
  body.appendChild(tr);
  $("bb-attempts").textContent = `도전 ${baseball.guesses.length}회`;
  v19UpdateBaseballCandidates();
  if (result.strikes !== baseball.digits) playSfx(result.text === "OUT" ? "out" : "guess");
  if (result.strikes === baseball.digits) {
    baseball.finished = true;
    $("bb-input").disabled = $("bb-submit").disabled = true;
    $("panel-baseball").querySelectorAll(".secret-slots span").forEach((cell, i) => { cell.textContent = baseball.answer[i]; });
    setStatus("bb-status", `🎉 정답! ${baseball.guesses.length}번 만에 성공했어요!`, "success");
    reportGameWin("baseball");
  } else if (baseball.guesses.length >= baseball.maxAttempts) {
    baseball.finished = true;
    input.disabled = true;
    $("bb-submit").disabled = true;
    setStatus("bb-status", `도전 횟수 ${baseball.maxAttempts}회를 사용했어요. 다시 시도해 보세요!`, "error");
  } else {
    const remain = Number.isFinite(baseball.maxAttempts) ? ` · 남은 기회 ${baseball.maxAttempts - baseball.guesses.length}회` : "";
    setStatus("bb-status", (result.text === "OUT" ? "OUT! 일치하는 숫자가 없어요." : `${result.text} · 다음 숫자를 추리해 보세요.`) + remain);
    input.value = "";
    input.focus();
  }
}

// 정답 공개: 실수로 보지 않도록 명확한 버튼 동작으로 실행
function revealBaseballAnswer() {
  if (activeGame !== "baseball") return;
  const secret = baseball.answer.join("");
  baseball.finished = true;
  $("bb-input").disabled = true;
  $("bb-submit").disabled = true;
  $("bb-answer").disabled = true;
  $("bb-hint").disabled = true;
  $("panel-baseball").querySelectorAll(".secret-slots span").forEach((cell, i) => { cell.textContent = baseball.answer[i]; });
  setStatus("bb-status", `정답은 ${secret}입니다. 새 게임으로 다시 도전할 수 있어요.`);
  playSfx('reveal');
}

function hintBaseball() {
  if (baseball.finished) return setStatus("bb-status", "이미 종료된 게임이에요.");
  const options = Array.from({length: baseball.digits}, (_,i) => i).filter(i => !baseball.known.includes(i));
  if (!options.length) return setStatus("bb-status", "모든 숫자 자리를 이미 알려줬어요.");
  const i = options[randomInt(options.length)];
  baseball.known.push(i);
  baseball.hints++;
  $("panel-baseball").querySelectorAll(".secret-slots span")[i].textContent = baseball.answer[i];
  if (baseball.known.length === baseball.digits) $("bb-hint").disabled = true;
  setStatus("bb-status", `💡 힌트 ${baseball.hints}회: ${i+1}번째 숫자는 ${baseball.answer[i]}입니다.`);
  playSfx('hint');
}

/* ======================= 2. 2048 ======================= */
const game2048Presets = { easy: 512, normal: 2048, hard: 4096, extreme: 8192, expert:8192 };
const game2048 = { board: [], score: 0, best: readSavedBest("2048"), history: [], state: "playing", target: 2048, goalScore: 0 };
function newEmptyGrid(size) { return Array.from({ length: size }, () => Array(size).fill(0)); }
function spawn2048() {
  const empty = [];
  for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) if (!game2048.board[r][c]) empty.push([r, c]);
  if (!empty.length) return false;
  const [r, c] = empty[randomInt(empty.length)];
  game2048.board[r][c] = Math.random() < .9 ? 2 : 4;
  return true;
}
function reset2048() {
  resetRunStats();
  if(typeof challenge!=="undefined" && challenge.reported){challenge.reported=false;hideVictoryOverlay();}
  const stage = getActiveStageConfig("2048");
  game2048.target = stage ? stage.tile : game2048Presets[$("g2048-difficulty").value];
  game2048.goalScore = stage ? stage.score : 0;
  game2048.undoLimit=Infinity; // v32: C++ 원본 의도대로 난이도 무관 무제한 되돌리기
  game2048.undoUsed=0;
  game2048.board = newEmptyGrid(4);
  game2048.score = 0;
  game2048.history = [];
  game2048.state = "playing";
  (spawn2048(),spawn2048());
  setStatus("g2048-status", `목표 ${game2048.target} 블록${game2048.goalScore ? ` + ${game2048.goalScore}점` : ""}! 방향키 / WASD로 이동하세요.`);
  render2048();
}
function merge2048Line(line) {
  const compact = line.filter((value) => value !== 0);
  const result = [];
  let gained = 0;
  for (let i = 0; i < compact.length; i++) {
    if (i + 1 < compact.length && compact[i] === compact[i + 1]) {
      const combined = compact[i] * 2;
      result.push(combined);
      gained += combined;
      i++;
    } else result.push(compact[i]);
  }
  while (result.length < 4) result.push(0);
  return { line: result, gained };
}
function game2048HasMove(board) {
  for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) {
    if (board[r][c] === 0) return true;
    if (r < 3 && board[r][c] === board[r + 1][c]) return true;
    if (c < 3 && board[r][c] === board[r][c + 1]) return true;
  }
  return false;
}
function move2048(direction) {
  if (activeGame !== "2048") return;
  if (game2048.state !== "playing") return setStatus("g2048-status", "게임이 종료됐어요. 되돌리기(U) 또는 새 게임을 이용하세요.");
  if (!["up", "down", "left", "right"].includes(direction)) return;
  const before = copyGrid(game2048.board);
  const oldScore = game2048.score;
  let gained = 0;
  for (let index = 0; index < 4; index++) {
    const coords = [];
    for (let i = 0; i < 4; i++) {
      if (direction === "left") coords.push([index, i]);
      else if (direction === "right") coords.push([index, 3 - i]);
      else if (direction === "up") coords.push([i, index]);
      else coords.push([3 - i, index]);
    }
    const result = merge2048Line(coords.map(([r, c]) => game2048.board[r][c]));
    gained += result.gained;
    coords.forEach(([r, c], i) => { game2048.board[r][c] = result.line[i]; });
  }
  if (before.every((row, r) => row.every((n, c) => n === game2048.board[r][c]))) {
    return setStatus("g2048-status", "그 방향으로는 움직일 수 없어요.");
  }
  game2048.history.push({ board: before, score: oldScore });
  runStats.moves++;
  playSfx(gained > 0 ? 'merge' : 'move');
  game2048.score += gained;
  game2048.best = Math.max(game2048.best, game2048.score);
  saveBest("2048",game2048.best);
  spawn2048();
  if (game2048.board.some((row) => row.some((n) => n >= game2048.target)) && game2048.score >= game2048.goalScore) {
    game2048.state = "won";
    setStatus("g2048-status", `🎉 ${game2048.target} 블록 + ${game2048.score}점 달성! 성공!`, "success");
    reportGameWin("2048");
  } else if (!game2048HasMove(game2048.board)) {
    game2048.state = "lost";
    setStatus("g2048-status", "게임 오버! U로 되돌릴 수도 있어요.", "error");
  } else setStatus("g2048-status", gained ? `+${gained}점 획득!` : "이동 성공! 다음 숫자를 합쳐 보세요.");
  render2048();
}
function undo2048() {
  if (activeGame !== "2048") return;
  if(challenge.reported){
    setStatus('g2048-status','클리어 기록이 이미 반영됐습니다. 다음 단계 버튼으로 진행하세요.');
    showVictoryOverlay('2048');
    return;
  }
  if (!game2048.history.length) return setStatus("g2048-status", "되돌릴 이동 기록이 없습니다.");
  game2048.undoUsed++;runStats.undos++;
  const previous = game2048.history.pop();
  game2048.board = copyGrid(previous.board);
  game2048.score = previous.score;
  game2048.state = 'playing';
  if(challenge.reported){challenge.reported=false;hideVictoryOverlay();renderStageChallenge();}
  setStatus('g2048-status', '이전 이동으로 되돌렸어요.');
  playSfx('undo');
  render2048();
}
function render2048() {
  const boardEl = $("g2048-board");
  boardEl.innerHTML = "";
  for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) {
    const val = game2048.board[r][c];
    const tile = document.createElement("div");
    tile.className = "tile-2048 v19-tile" + (val ? " " + (val > 2048 ? "tile-super" : val === 2048 ? "tile-value-2048" : "tile-" + val) : "");
    tile.textContent = val ? String(val) : "";
    // 장식용 2048 타일은 네이티브 div 역할을 유지합니다.
    tile.setAttribute("aria-label", `${r + 1}행 ${c + 1}열 ${val || "빈 칸"}`);
    boardEl.appendChild(tile);
  }
  $("g2048-score").textContent = game2048.score;
  $("g2048-best").textContent = game2048.best;
  $('g2048-undo-count').textContent=`무제한 · ${game2048.history.length}개 기록`;
  $('g2048-undo').disabled = challenge.reported || !game2048.history.length;
}

// 2048: 실제 게임판을 변경하지 않고 네 방향을 미리 계산해 추천
function preview2048(direction, board) {
  const result = copyGrid(board);
  let gained = 0;
  for (let index=0; index<4; index++) {
    const coords=[];
    for(let i=0;i<4;i++) {
      if(direction==="left") coords.push([index,i]);
      else if(direction==="right") coords.push([index,3-i]);
      else if(direction==="up") coords.push([i,index]);
      else coords.push([3-i,index]);
    }
    const merge=merge2048Line(coords.map(([r,c])=>result[r][c]));
    gained+=merge.gained;
    coords.forEach(([r,c],i)=>{result[r][c]=merge.line[i];});
  }
  const changed=!board.every((row,r)=>row.every((v,c)=>v===result[r][c]));
  const empty=result.flat().filter(v=>v===0).length;
  // 합치기 점수, 여유 공간, 높은 숫자가 모서리에 있는지를 가볍게 평가합니다.
  const max=Math.max(...result.flat());
  const corner=Math.max(result[0][0],result[0][3],result[3][0],result[3][3])===max;
  return {changed,gained,empty,corner,score:gained*3+empty*12+(corner?16:0)};
}
function hint2048() {
  if(activeGame!=="2048") return;
  if(game2048.state!=="playing") return setStatus("g2048-status","게임이 끝났어요. 되돌리기나 새 게임을 이용하세요.");
  const choices={up:"위쪽 ↑",down:"아래쪽 ↓",left:"왼쪽 ←",right:"오른쪽 →"};
  const found=Object.keys(choices).map(dir=>({dir,...preview2048(dir,game2048.board)}))
    .filter(item=>item.changed).sort((a,b)=>b.score-a.score);
  if(!found.length) return setStatus("g2048-status","이동할 수 있는 방향이 없어요. 되돌리기를 사용해 보세요.");
  const best=found[0];runStats.hints++;
  setStatus("g2048-status",`✧ 추천: ${choices[best.dir]} · 예상 합치기 +${best.gained}점, 이동 후 빈칸 ${best.empty}개 (자동 이동하지 않음)`);
  playSfx('hint');
}

/* ====================== 3. 지뢰찾기 ====================== */
const minePresets = { easy: [6, 6], normal: [8, 12], hard: [10, 20], extreme: [12, 35], expert:[16,60] };
const mineGame = { size: 6, count: 6, mines: [], open: [], flags: [], adjacent: [], placed: false, state: "playing", opened: 0, flagCount: 0, mode: "open", hit: null, hint: null, hintCount: 0, noGuessCertified:false };
function mineNeighbors(row, col, size) {
  const coords = [];
  for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
    if (dr === 0 && dc === 0) continue;
    if (inBounds(size, row + dr, col + dc)) coords.push([row + dr, col + dc]);
  }
  return coords;
}
function resetMines() {
  resetRunStats();
  if(typeof challenge!=="undefined" && challenge.reported){challenge.reported=false;hideVictoryOverlay();}
  const stage = getActiveStageConfig("mines");
  [mineGame.size, mineGame.count] = stage ? [stage.size, stage.mines] : minePresets[$("mine-difficulty").value];
  mineGame.mines = newEmptyGrid(mineGame.size);
  mineGame.open = newEmptyGrid(mineGame.size);
  mineGame.flags = newEmptyGrid(mineGame.size);
  mineGame.adjacent = newEmptyGrid(mineGame.size);
  mineGame.placed = false;
  mineGame.state = "playing";
  mineGame.opened = 0;
  mineGame.flagCount = 0;
  mineGame.hit = null;
  mineGame.hint = null;
  mineGame.hintCount = 0;
  mineGame.noGuessCertified=false;
  mineGame.timeLimit=stage?.timeLimit||($('mine-difficulty').value==='expert'?900:0);
  mineGame.startedAt=null;
  if($('mine-time'))$('mine-time').textContent=mineGame.timeLimit?`⏱ 제한 시간 ${Math.floor(mineGame.timeLimit/60)}분`:'';
  $("mine-hint-count").textContent = "0";
  mineGame.mode = "open";
  syncMineMode();
  setStatus("mine-status", "첫 클릭 위치와 주변 8칸은 안전해요.");
  renderMines();
}
// 열린 숫자에서 확정되는 안전 칸과 지뢰를 계산합니다.
// 한 숫자의 미확인 이웃 집합이 다른 숫자의 부분집합이면 차집합도 추론합니다.
// 추리 과정은 공개된 숫자/깃발에만 의존하며 숨겨진 정답을 참고하지 않습니다.
function mineDeductions(open,flags,adjacent,size){
  const equations=[],knownSafe=new Set(),knownMines=new Set();
  for(let r=0;r<size;r++)for(let c=0;c<size;c++){
    if(!open[r][c]||adjacent[r][c]===0)continue;
    let remaining=adjacent[r][c];const cells=[];
    for(const [nr,nc] of mineNeighbors(r,c,size)){
      if(flags[nr][nc])remaining--;
      else if(!open[nr][nc])cells.push(nr*size+nc);
    }
    if(!cells.length||remaining<0||remaining>cells.length)continue;
    if(remaining===0)cells.forEach(id=>knownSafe.add(id));
    if(remaining===cells.length)cells.forEach(id=>knownMines.add(id));
    equations.push({cells,count:remaining});
  }
  // 퍼즐 주변의 집합(최대 8칸)끼리만 비교하므로 큰 판에서도 비용이 제한됩니다.
  for(let i=0;i<equations.length;i++)for(let j=i+1;j<equations.length;j++){
    let a=equations[i],b=equations[j];
    if(a.cells.length>b.cells.length)[a,b]=[b,a];
    if(a.cells.length===b.cells.length)continue;
    if(!a.cells.every(id=>b.cells.includes(id)))continue;
    const rest=b.cells.filter(id=>!a.cells.includes(id));
    const diff=b.count-a.count;
    if(diff===0)rest.forEach(id=>knownSafe.add(id));
    else if(diff===rest.length)rest.forEach(id=>knownMines.add(id));
  }
  return {safe:knownSafe,mines:knownMines};
}
// 검증기는 첫 클릭부터 알려진 숫자에 의존한 연쇄 추리만으로 이기는지 검사합니다.
function mineLogicalSolve(mines,adjacent,startR,startC){
  const size=mines.length,open=newEmptyGrid(size),flags=newEmptyGrid(size),totalSafe=size*size-mines.flat().filter(Boolean).length;
  let opened=0,flagsPlaced=0;
  const reveal=(r,c)=>{
    const queue=[[r,c]];
    while(queue.length){
      const [rr,cc]=queue.pop();
      if(open[rr][cc]||flags[rr][cc]||mines[rr][cc])continue;
      open[rr][cc]=1;opened++;
      if(adjacent[rr][cc]===0)for(const [nr,nc] of mineNeighbors(rr,cc,size))if(!open[nr][nc]&&!flags[nr][nc])queue.push([nr,nc]);
    }
  };
  reveal(startR,startC);
  for(let pass=0;pass<size*size*2&&opened<totalSafe;pass++){
    const deductions=mineDeductions(open,flags,adjacent,size);let progress=false;
    for(const id of deductions.mines){const r=Math.floor(id/size),c=id%size;if(!flags[r][c]&&!open[r][c]&&mines[r][c]){flags[r][c]=1;flagsPlaced++;progress=true;}}
    for(const id of deductions.safe){const r=Math.floor(id/size),c=id%size;if(!open[r][c]&&!flags[r][c]&&!mines[r][c]){reveal(r,c);progress=true;}}
    if(!progress)break;
  }
  return {solved:opened===totalSafe,opened,flagsPlaced,totalSafe};
}
function mineCandidate(safeRow,safeCol){
  const size=mineGame.size,candidates=[];
  for(let r=0;r<size;r++)for(let c=0;c<size;c++)if(Math.abs(r-safeRow)>1||Math.abs(c-safeCol)>1)candidates.push([r,c]);
  const mines=newEmptyGrid(size),adjacent=newEmptyGrid(size),picked=[];
  // 후반 난이도에서는 일부 지뢰가 뭉친 지형도 혼합해 추리가 가능한 상황을 늘립니다.
  const clustered=Math.random()<.50;
  const pool=candidates.slice();
  for(let i=0;i<mineGame.count&&pool.length;i++){
    let index=randomInt(pool.length);
    if(clustered&&picked.length&&Math.random()<.83){
      const pivot=picked[randomInt(picked.length)],neighbors=[];
      for(let j=0;j<pool.length;j++)if(Math.abs(pool[j][0]-pivot[0])<=1&&Math.abs(pool[j][1]-pivot[1])<=1)neighbors.push(j);
      if(neighbors.length)index=neighbors[randomInt(neighbors.length)];
    }
    const [r,c]=pool.splice(index,1)[0];picked.push([r,c]);mines[r][c]=1;
  }
  for(const [r,c] of picked)for(const [nr,nc] of mineNeighbors(r,c,size))adjacent[nr][nc]++;
  return {mines,adjacent};
}
function placeMines(safeRow,safeCol) {
  // 논리 풀이 인증된 판을 우선 사용합니다. 최악의 경우에도 무한 생성을 하지 않습니다.
  const size=mineGame.size,attempts=size<=8?32:size<=12?24:36;
  let best=null,bestProgress=-1;
  for(let i=0;i<attempts;i++){
    const candidate=mineCandidate(safeRow,safeCol);
    const result=mineLogicalSolve(candidate.mines,candidate.adjacent,safeRow,safeCol);
    if(result.solved){best={...candidate,certified:true};break;}
    const progress=result.opened/result.totalSafe;
    if(progress>bestProgress){best={...candidate,certified:false};bestProgress=progress;}
  }
  mineGame.mines=best.mines;
  mineGame.adjacent=best.adjacent;
  mineGame.noGuessCertified=best.certified;
  mineGame.placed=true;
}
function revealMines(row, col) {
  if (mineGame.state !== "playing") return;
  if (mineGame.open[row][col] || mineGame.flags[row][col]) return;
  if (!mineGame.placed){placeMines(row,col);mineGame.startedAt=Date.now();runStats.started=Date.now();}
  if (mineGame.timeLimit && mineGame.startedAt && (Date.now()-mineGame.startedAt)/1000>=mineGame.timeLimit){mineGame.state='lost';setStatus('mine-status','⏱ 제한 시간이 끝났어요. 다시 도전하세요.','error');playSfx('lose');return renderMines();}
  mineGame.hint = null;
  if (mineGame.mines[row][col]) {
    mineGame.hit = [row, col];
    mineGame.state = "lost";
    setStatus("mine-status", "💥 지뢰를 밟았어요! 새 게임으로 다시 도전하세요.", "error");
    playSfx('lose');
    return renderMines();
  }
  const stack = [[row, col]];
  while (stack.length) {
    const [r, c] = stack.pop();
    if (mineGame.open[r][c] || mineGame.flags[r][c] || mineGame.mines[r][c]) continue;
    mineGame.open[r][c] = 1;
    mineGame.opened++;
    if (mineGame.adjacent[r][c] === 0) {
      for (const [nr, nc] of mineNeighbors(r, c, mineGame.size)) if (!mineGame.open[nr][nc] && !mineGame.flags[nr][nc]) stack.push([nr, nc]);
    }
  }
  if (mineGame.opened !== mineGame.size * mineGame.size - mineGame.count) playSfx('reveal');
  if (mineGame.opened === mineGame.size * mineGame.size - mineGame.count) {
    mineGame.state = "won";
    setStatus("mine-status", "🎉 성공! 안전한 칸을 모두 열었어요.", "success");
    reportGameWin("mines");
  } else setStatus("mine-status", `${mineGame.opened}칸을 안전하게 열었어요.${mineGame.noGuessCertified?' · 논리 풀이 인증판':' · 막히면 힌트로 안전 칸을 확인하세요.'}`);
  renderMines();
}
let mineClockHandle=setInterval(()=>{
  if(v19Paused||activeGame!=='mines'||mineGame.state!=='playing'||!mineGame.timeLimit||!mineGame.startedAt)return;
  const remain=Math.max(0,Math.ceil(mineGame.timeLimit-(Date.now()-mineGame.startedAt)/1000));
  const label=$('mine-time');if(label)label.textContent=`⏱ 남은 시간 ${String(Math.floor(remain/60)).padStart(2,'0')}:${String(remain%60).padStart(2,'0')}`;
  if(remain===0){mineGame.state='lost';setStatus('mine-status','⏱ 제한 시간이 끝났어요. 다시 도전하세요.','error');playSfx('lose');renderMines();}
},1000);

function flagMine(row, col) {
  if (mineGame.state !== "playing" || mineGame.open[row][col]) return;
  if (!mineGame.flags[row][col] && mineGame.flagCount >= mineGame.count) {
    return setStatus("mine-status", "깃발은 전체 지뢰 개수만큼만 놓을 수 있어요.", "error");
  }
  mineGame.flags[row][col] = mineGame.flags[row][col] ? 0 : 1;
  mineGame.flagCount += mineGame.flags[row][col] ? 1 : -1;
  setStatus("mine-status", mineGame.flags[row][col] ? "⚑ 깃발을 표시했어요." : "깃발을 제거했어요.");
  playSfx('flag');
  renderMines();
}
function handleMineCell(row, col, useFlag) { if (useFlag) flagMine(row, col); else revealMines(row, col); }
function syncMineMode() {
  const isFlag=mineGame.mode==='flag';
  $('mine-mode-open').classList.toggle('active',!isFlag);
  $('mine-mode-flag').classList.toggle('active',isFlag);
  $('mine-mode-open').setAttribute('aria-pressed',String(!isFlag));
  $('mine-mode-flag').setAttribute('aria-pressed',String(isFlag));
  $('mine-board').classList.toggle('v41-flag-mode',isFlag);
  const note=$('v41-mine-mode-note');
  if(note)note.textContent=isFlag?'⚑ 깃발 모드: 칸을 누르면 표시 또는 해제돼요.':'☝ 열기 모드: 칸을 누르면 열려요. 지뢰가 의심되면 깃발 모드를 선택하세요.';
}
function renderMines() {
  const el = $("mine-board");
  el.style.setProperty("--size", String(mineGame.size));
  el.innerHTML = "";
  for (let r = 0; r < mineGame.size; r++) for (let c = 0; c < mineGame.size; c++) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "mine-cell";
    // 게임 칸은 네이티브 button 역할을 유지합니다 (그리드 행 없는 ARIA grid 제거).
    const shownMine = mineGame.state === "lost" && mineGame.mines[r][c];
    if (mineGame.hint && mineGame.hint[0]===r && mineGame.hint[1]===c) btn.classList.add("mine-hint-mark");
    if (mineGame.open[r][c]) {
      btn.classList.add("opened");
      if (mineGame.adjacent[r][c]) {
        btn.textContent = mineGame.adjacent[r][c];
        btn.classList.add("n" + mineGame.adjacent[r][c]);
      } else btn.classList.add("zero");
    } else if (shownMine) {
      btn.textContent = "✹";
      btn.classList.add("mine-reveal");
      if (mineGame.hit && mineGame.hit[0] === r && mineGame.hit[1] === c) btn.classList.add("mine-hit");
    } else if (mineGame.flags[r][c]) { btn.textContent = "⚑"; btn.classList.add("flagged"); }
    btn.setAttribute("aria-label", `${r + 1}행 ${c + 1}열 ${mineGame.open[r][c] ? "열림 " + (mineGame.adjacent[r][c] || "0") : shownMine ? "지뢰" : mineGame.flags[r][c] ? "깃발" : "닫힘"}`);
    btn.addEventListener("click", () => handleMineCell(r, c, mineGame.mode === "flag"));
    btn.addEventListener("dblclick", (e) => { e.preventDefault(); v19MineChord(r,c); });
    btn.addEventListener("contextmenu", (e) => { e.preventDefault(); handleMineCell(r, c, true); });
    el.appendChild(btn);
  }
  $("mine-total").textContent = mineGame.count;
  $("mine-flags").textContent = mineGame.flagCount;
  $("mine-opened").textContent = mineGame.opened;
  requestAnimationFrame(v39UpdateMinePosition);
}

// 힌트는 지뢰가 없는 미개봉 칸을 표시하며 자동으로 열지 않습니다.
function hintMines() {
  if(activeGame!=="mines") return;
  if(mineGame.state!=="playing") return setStatus("mine-status","게임이 종료됐어요. 새 게임을 시작하세요.");
  // 첫 클릭 전에 지뢰가 아직 배치되지 않아 안전 칸을 논리적으로 특정할 수 없습니다.
  // 힌트를 차감하지 않고 안내만 표시하며, 실제 첫 클릭의 3×3 안전 규칙은 유지합니다.
  if(!mineGame.placed) return setStatus("mine-status","💡 먼저 원하는 칸을 한 번 열어주세요. 첫 클릭과 주변 8칸은 안전하며, 첫 클릭 전에는 힌트 횟수가 차감되지 않아요.");
  const available=[];
  for(let r=0;r<mineGame.size;r++)for(let c=0;c<mineGame.size;c++){
    if(mineGame.open[r][c]||mineGame.flags[r][c])continue;
    if(mineGame.placed&&mineGame.mines[r][c])continue;
    available.push([r,c]);
  }
  if(!available.length)return setStatus("mine-status","힌트를 줄 수 있는 안전한 칸이 없어요.");
  const deductions=mineGame.placed?mineDeductions(mineGame.open,mineGame.flags,mineGame.adjacent,mineGame.size):null;
  const logical=deductions?available.filter(([r,c])=>deductions.safe.has(r*mineGame.size+c)):[];
  // 보장 생성에 실패한 어려운 판도 운에 맡기지 않도록, 막힌 경우에는 횟수 차감 없이 안전칸을 보여줍니다.
  const freeAssist=mineGame.placed&&logical.length===0;
  const pool=logical.length?logical:available;
  const [r,c]=pool[randomInt(pool.length)];
  mineGame.hint=[r,c];
  if(!freeAssist){mineGame.hintCount++;$("mine-hint-count").textContent=mineGame.hintCount;runStats.hints++;}
  setStatus("mine-status",freeAssist?`💡 추론으로 더 열 칸이 없는 상황이에요. ${r+1}행 ${c+1}열을 무료 안전 힌트로 표시했어요 (힌트 횟수 차감 없음).`:`✧ 논리로 확인한 안전 칸: ${r+1}행 ${c+1}열! 노란 테두리로 표시했어요.`);
  playSfx('hint');renderMines();
}

/* ===== v42: six independent game board zoom controls ===== */
// View-only preferences: separate keys intentionally avoid changing any old game-save schema.
const V42_ZOOM_MIN=.35,V42_ZOOM_MAX=2.00,V42_ZOOM_STEP=.15;
const V42_ZOOM_GAMES=['baseball','2048','mines','pipes','shikaku','blocks'];
const v42Zoom=Object.fromEntries(V42_ZOOM_GAMES.map(game=>{
  let value=1;
  try{const saved=Number(localStorage.getItem('taekin.arcade.v42.boardZoom.'+game));
      if(Number.isFinite(saved)&&saved>=V42_ZOOM_MIN&&saved<=V42_ZOOM_MAX)value=saved;
  }catch(_){/* Private browsing and restricted storage: keep default zoom. */}
  return [game,value];
}));
function v42BoardViewport(game){return $(game==='mines'?'v39-mine-viewport':'v42-window-'+game);}
function v42BoardBase(game){
  const viewport=v42BoardViewport(game);
  const available=Math.max(80,viewport?.clientWidth||420);
  if(game==='baseball')return window.innerWidth<=540?50:63;
  if(game==='mines')return 30;
  if(game==='2048')return Math.min(420,available);
  if(game==='pipes')return Math.min(420,available);
  if(game==='shikaku')return Math.min(450,available);
  if(game==='blocks')return Math.min(440,available,Math.max(170,window.innerHeight*.48));
  return 420;
}
function v42BoardNaturalWidth(game){
  const base=v42BoardBase(game);
  if(game==='mines')return (mineGame?.size||6)*(base+4)+2;
  if(game==='baseball')return (base+12)*(baseball?.digits||4);
  return base;
}
function v42ApplyBoardZoom(game,{keepCenter=true}={}){
  const viewport=v42BoardViewport(game);if(!viewport)return;
  const value=v42Zoom[game],base=v42BoardBase(game);
  const previousRange=Math.max(0,viewport.scrollWidth-viewport.clientWidth);
  const centerFraction=previousRange?viewport.scrollLeft/previousRange:0.5;
  if(game==='baseball'){
    const panel=$('panel-baseball');
    panel.style.setProperty('--v42-baseball-zoom',String(value));
    panel.style.setProperty('--v42-baseball-unit',base+'px');
  }else if(game==='mines'){
    // Crucial: resize the REAL grid tracks, not a CSS transform or a min-width:100% container.
    const board=$('mine-board');board.style.setProperty('--v42-mine-cell',(base*value)+'px');
  }else{
    const board=$(game==='2048'?'g2048-board':game==='pipes'?'pipe-board':game==='shikaku'?'shikaku-board':'block-board');
    const target=game==='pipes'?board.closest('.pipe-board-wrap'):board;
    target.style.setProperty('--v42-board-px',(base*value)+'px');
  }
  const tools=document.querySelector('.v42-size-tools[data-v42-game="'+game+'"]');
  if(tools){
    const output=tools.querySelector('output');output.textContent=Math.round(value*100)+'%';
    tools.querySelector('[data-v42-action="out"]').disabled=value<=V42_ZOOM_MIN+.001;
    tools.querySelector('[data-v42-action="in"]').disabled=value>=V42_ZOOM_MAX-.001;
  }
  requestAnimationFrame(()=>{
    if(keepCenter)viewport.scrollLeft=Math.max(0,viewport.scrollWidth-viewport.clientWidth)*centerFraction;
    if(game==='mines')v39UpdateMinePosition();
    v42UpdatePanControls(game);
  });
}
function v42UpdatePanControls(game){
  const viewport=v42BoardViewport(game);
  const nav=document.querySelector('.v42-pan-tools[data-v42-pan-game="'+game+'"]');
  if(!viewport||!nav)return;
  const range=Math.max(0,viewport.scrollWidth-viewport.clientWidth);
  nav.hidden=range<=2;
  const left=nav.querySelector('[data-v42-pan="left"]'),right=nav.querySelector('[data-v42-pan="right"]');
  left.disabled=range<=2||viewport.scrollLeft<=1;
  right.disabled=range<=2||viewport.scrollLeft>=range-1;
}
function v42SetBoardZoom(game,next,{save=true,keepCenter=true}={}){
  if(!V42_ZOOM_GAMES.includes(game))return;
  const n=Number(next);if(!Number.isFinite(n))return;
  v42Zoom[game]=Math.round(Math.max(V42_ZOOM_MIN,Math.min(V42_ZOOM_MAX,n))*100)/100;
  v42ApplyBoardZoom(game,{keepCenter});
  if(save){try{localStorage.setItem('taekin.arcade.v42.boardZoom.'+game,String(v42Zoom[game]));}
    catch(_){/* Zoom remains usable if preferences cannot be saved. */}}
}
function v42FitBoardZoom(game,{save=true,shrinkOnly=false}={}){
  const viewport=v42BoardViewport(game);if(!viewport)return;
  let desired;
  if(game==='mines'){
    // Unlike the other boards, the mine grid has a fixed 4px gap BETWEEN cells.
    // The gap does not shrink with zoom, so (natural width * zoom) is incorrect.
    const board=$('mine-board'),style=getComputedStyle(board),size=mineGame.size;
    const gap=parseFloat(style.columnGap)||0;
    const extras=(parseFloat(style.paddingLeft)||0)+(parseFloat(style.paddingRight)||0)+
      (parseFloat(style.borderLeftWidth)||0)+(parseFloat(style.borderRightWidth)||0);
    desired=(viewport.clientWidth-5-gap*(size-1)-extras)/(v42BoardBase(game)*size);
  }else desired=(viewport.clientWidth-5)/v42BoardNaturalWidth(game);
  if(game==='blocks' && innerWidth<=720 && document.body.classList.contains('v48-compact-game')){
    // 트레이와 10×10 판을 한 화면에 넣기 위한 세로 공간까지 고려합니다.
    const shellZoom=Number.parseFloat(getComputedStyle(document.querySelector('.site-shell')).zoom)||1;
    const availableHeight=(window.visualViewport?.height||innerHeight)*.31/shellZoom;
    desired=Math.min(desired,availableHeight/v42BoardBase(game));
  }
  // Expert 16×16 mines need a smaller scale to actually fit a 320px phone.
  v42SetBoardZoom(game,Math.max(V42_ZOOM_MIN,Math.min(V42_ZOOM_MAX,shrinkOnly?Math.min(1,desired):desired)),{save,keepCenter:false});
  viewport.scrollLeft=0;
}
function v39UpdateMinePosition(){
  const viewport=$('v39-mine-viewport'),status=$('v39-mine-position');if(!viewport||!status)return;
  const remaining=viewport.scrollWidth-viewport.clientWidth;
  if(remaining<2){status.textContent='게임판 전체 표시';return;}
  status.textContent=`↔ 게임판을 좌우로 밀어 이동 · 위치 ${Math.round(viewport.scrollLeft/remaining*100)}%`;
}
(function v42InitBoardZoom(){
  document.querySelectorAll('.v42-size-tools').forEach(tools=>{
    const game=tools.dataset.v42Game;
    tools.insertAdjacentHTML('afterend',`<div class="v42-pan-tools" data-v42-pan-game="${game}" hidden>
      <span>↔ 확대된 게임판 이동</span><button type="button" data-v42-pan="left">◀ 왼쪽</button>
      <button type="button" data-v42-pan="right">오른쪽 ▶</button></div>`);
    const nav=tools.nextElementSibling,viewport=v42BoardViewport(game);
    nav.addEventListener('click',event=>{
      const btn=event.target.closest('button[data-v42-pan]');if(!btn)return;
      const dir=btn.dataset.v42Pan==='left'?-1:1;
      viewport.scrollBy({left:dir*Math.max(100,viewport.clientWidth*.65),behavior:'instant'});
      requestAnimationFrame(()=>v42UpdatePanControls(game));
    });
    viewport.addEventListener('scroll',()=>v42UpdatePanControls(game),{passive:true});
    tools.addEventListener('click',event=>{
      const button=event.target.closest('button[data-v42-action]');if(!button)return;
      const action=button.dataset.v42Action;
      if(action==='in')v42SetBoardZoom(game,v42Zoom[game]+V42_ZOOM_STEP);
      else if(action==='out')v42SetBoardZoom(game,v42Zoom[game]-V42_ZOOM_STEP);
      else if(action==='reset')v42SetBoardZoom(game,1);
      else if(action==='fit')v42FitBoardZoom(game);
    });
  });
  $('v39-mine-viewport').addEventListener('scroll',v39UpdateMinePosition,{passive:true});
  window.addEventListener('resize',()=>{
    if(typeof activeGame==='string'&&V42_ZOOM_GAMES.includes(activeGame))v42ApplyBoardZoom(activeGame,{keepCenter:false});
  });
  // CSS/viewport dimensions become available when the game is shown.
})();

/* ===================== 4. 파이프 연결 ==================== */
// N/E/S/W 방향은 각각 1,2,4,8 비트입니다.
const N=1, E=2, S=4, W=8;
const pipePresets={easy:4,normal:5,hard:6,extreme:7,expert:10};
const pipeDirections=[[-1,0,N,S],[0,1,E,W],[1,0,S,N],[0,-1,W,E]];
const pipeGame={
  size:5,board:[],solution:[],rotations:0,hints:0,state:"playing",
  start:{r:0,c:4,port:N},end:{r:4,c:0,port:S},info:null,
  lastTurn:-1,lastHint:-1,history:[],turnDirection:1,
  animatedSeen:null,flowTimer:null,flowBatch:1
};
// 1: 시계 방향, -1: 반시계 방향. 회전 횟수 제한은 적용하지 않습니다.
function rotatePipe(mask){return ((mask<<1)&15)|(mask>>3);}
function rotatePipeCounterClockwise(mask){return (mask>>1)|((mask&1)<<3);}
function pipeBits(mask){return [N,E,S,W].filter(d=>mask&d).length;}
function pipeReachable(board){
  const size=board.length,{start,end}=pipeGame;
  const seen=new Set(),matched=newEmptyGrid(size);
  let leaks=0;
  for(let r=0;r<size;r++)for(let c=0;c<size;c++){
    for(const [dr,dc,out,inside] of pipeDirections){
      if(!(board[r][c]&out)) continue;
      const nr=r+dr,nc=c+dc;
      if(!inBounds(size,nr,nc)){
        const validSource=r===start.r&&c===start.c&&out===start.port;
        const validGoal=r===end.r&&c===end.c&&out===end.port;
        if(!validSource&&!validGoal)leaks++;
      }else if(!(board[nr][nc]&inside))leaks++;
      else matched[r][c]|=out;
    }
  }
  const intakeOpen=Boolean(board[start.r][start.c]&start.port);
  const outletOpen=Boolean(board[end.r][end.c]&end.port);
  const order=[];
  if(intakeOpen){
    const queue=[[start.r,start.c]];
    while(queue.length){
      const [r,c]=queue.shift(),id=r*size+c;
      if(seen.has(id))continue;
      seen.add(id);
      order.push(id);
      for(const [dr,dc,out,inside] of pipeDirections){
        const nr=r+dr,nc=c+dc;
        if(inBounds(size,nr,nc)&&(board[r][c]&out)&&(board[nr][nc]&inside)&&!seen.has(nr*size+nc))queue.push([nr,nc]);
      }
    }
  }
  const goalWet=seen.has(end.r*size+end.c)&&outletOpen;
  return {seen,matched,order,leaks,intakeOpen,outletOpen,goalWet,
    solved:intakeOpen&&goalWet&&seen.size===size*size&&leaks===0};
}
// 무작위 DFS를 사용해 모든 칸을 지나는 하나의 연결된 배관을 먼저 만듭니다.
// 답은 모든 칸이 연결된 상태이고, 이를 각각 회전해서 문제를 출제합니다.
// DFS는 직선과 부드러운 커브가 많고 갈림길도 생겨 사진처럼 자연스러운 배관을 만듭니다.
function buildPipes(size=pipeGame.size){
  const solution=newEmptyGrid(size),visited=new Set();
  const {start,end}=pipeGame;
  const stack=[{r:start.r,c:start.c}];
  visited.add(start.r*size+start.c);
  while(stack.length){
    const {r,c}=stack[stack.length-1];
    const options=[];
    for(const [dr,dc,out,incoming] of pipeDirections){
      const nr=r+dr,nc=c+dc;
      if(inBounds(size,nr,nc)&&!visited.has(nr*size+nc))options.push({nr,nc,out,incoming});
    }
    if(!options.length){stack.pop();continue;}
    const pick=options[randomInt(options.length)];
    solution[r][c]|=pick.out;
    solution[pick.nr][pick.nc]|=pick.incoming;
    visited.add(pick.nr*size+pick.nc);
    stack.push({r:pick.nr,c:pick.nc});
  }
  solution[start.r][start.c]|=start.port;
  solution[end.r][end.c]|=end.port;
  const board=copyGrid(solution);
  for(let r=0;r<size;r++)for(let c=0;c<size;c++){
    const stage = getActiveStageConfig("pipes");
    const chance=stage ? stage.scramble : ({easy:.25,normal:.43,hard:.62,extreme:.80,expert:.95}[$("pipe-difficulty").value]||.4);
    const turns=Math.random()<chance ? 1+randomInt(3) : 0;
    for(let t=0;t<turns;t++)board[r][c]=rotatePipe(board[r][c]);
  }
  // 시작점은 회전을 잠궈 물이 항상 들어오도록 합니다.
  board[start.r][start.c]=solution[start.r][start.c];
  const pipeStage=getActiveStageConfig("pipes");
  const needed=pipeStage ? Math.min(Math.floor((size*size-1)*.8),Math.max(1,Math.round((size*size-1)*(.16+pipeStage.level*.005)))) : 1;
  let rotated=0;
  for(let r=0;r<size;r++)for(let c=0;c<size;c++)if(board[r][c]!==solution[r][c])rotated++;
  if(rotated<needed){
    const candidates=[];
    for(let r=0;r<size;r++)for(let c=0;c<size;c++){
      if((r!==start.r||c!==start.c)&&pipeBits(board[r][c])!==4&&board[r][c]===solution[r][c])candidates.push([r,c]);
    }
    for(let i=candidates.length-1;i>0;i--){const k=randomInt(i+1);[candidates[i],candidates[k]]=[candidates[k],candidates[i]];}
    for(const [r,c] of candidates.slice(0,Math.max(0,needed-rotated)))board[r][c]=rotatePipe(board[r][c]);
  }
  if(pipeReachable(board).solved){
    // 완성판이 실수로 나오면 최소 한 칸 돌립니다.
    for(let r=0;r<size;r++){
      let finished=false;
      for(let c=0;c<size;c++)if(!(r===start.r&&c===start.c)&&pipeBits(board[r][c])!==4){
        board[r][c]=rotatePipe(board[r][c]);finished=true;break;
      }
      if(finished)break;
    }
  }
  return {board,solution};
}
function minimalPipeClockwiseTurns(current,target){
  let total=0;
  for(let r=0;r<current.length;r++)for(let c=0;c<current.length;c++){
    let val=current[r][c],step=0;
    while(val!==target[r][c]&&step<4){val=rotatePipe(val);step++;}
    total+=step%4;
  }
  return total;
}


function clearPipeFlowAnimation(){
  if(pipeGame.flowTimer){clearTimeout(pipeGame.flowTimer);pipeGame.flowTimer=null;}
  pipeGame.animatedSeen=null;
}
function getPipeFlowSpeed(){
  const pick=$("v19-water-speed")?.value||"normal";
  return ({slow:210,normal:140,fast:90})[pick]||140;
}
function beginPipeFlowVictory(){
  clearPipeFlowAnimation();
  const info=pipeGame.info||pipeReachable(pipeGame.board);
  pipeGame.info=info;
  pipeGame.state="flowing";
  pipeGame.animatedSeen=new Set();
  const order=info.order?.slice()||[];
  const goalId=pipeGame.end.r*pipeGame.size+pipeGame.end.c;
  const batch=Math.max(1,Math.ceil(order.length/18));
  pipeGame.flowBatch=batch;
  setStatus("pipe-status","💧 물이 배관을 따라 천천히 흐르고 있어요... GOAL에 도착하면 클리어됩니다.");
  const step=()=>{
    // Switching games must never finish a delayed animation in another mode.
    if(activeGame!=='pipes'||pipeGame.state!=='flowing'){
      clearPipeFlowAnimation();return;
    }
    // Pause also suspends delayed water-flow steps and their victory report.
    if(v19Paused){pipeGame.flowTimer=setTimeout(step,140);return;}
    for(let i=0;i<batch && order.length;i++){
      const cellId=order.shift();
      pipeGame.animatedSeen.add(cellId);
      if(cellId===goalId) playSfx('water');
    }
    renderPipes();
    if(order.length){
      pipeGame.flowTimer=setTimeout(step,getPipeFlowSpeed());
      return;
    }
    pipeGame.flowTimer=null;
    pipeGame.state="won";
    renderPipes();
    setStatus("pipe-status",`🎉 물이 GOAL까지 완전히 도착했어요! 모든 ${pipeGame.size*pipeGame.size}개 파이프 연결 · ${pipeGame.rotations}회 회전 · 힌트 ${pipeGame.hints}회`,"success");
    reportGameWin("pipes");
  };
  playSfx('water');
  step();
}

function resetPipes() {
  resetRunStats();
  if(typeof challenge!=="undefined" && challenge.reported){challenge.reported=false;hideVictoryOverlay();}
  const stage=getActiveStageConfig("pipes");
  pipeGame.size=stage?stage.size:pipePresets[$("pipe-difficulty").value];
  pipeGame.start={r:0,c:pipeGame.size-1,port:N};
  pipeGame.end={r:pipeGame.size-1,c:0,port:S};
  const {board,solution}=buildPipes(pipeGame.size);
  pipeGame.board=board;pipeGame.solution=solution;
  pipeGame.optimalTurns=minimalPipeClockwiseTurns(board,solution);
  pipeGame.rotations=0;pipeGame.hints=0;pipeGame.state="playing";
  pipeGame.lastTurn=-1;pipeGame.lastHint=-1;
  pipeGame.history=[];
  clearPipeFlowAnimation();
  pipeGame.info=pipeReachable(board);
  $("pipe-hint-count").textContent=0;
  syncPipeControls();
  setStatus('pipe-status','💧 회전 횟수 제한이 없어요. 모든 배관을 연결해 물을 GOAL까지 보내세요!');
  renderPipes();
}
function evaluatePipeState(){
  const wasWet = pipeGame.info ? pipeGame.info.seen.size : 0;
  pipeGame.info=pipeReachable(pipeGame.board);
  if(!pipeGame.info.solved && pipeGame.info.seen.size > wasWet) playSfx('water');
  if(pipeGame.info.solved){
    beginPipeFlowVictory();
    return;
  }
  pipeGame.state="playing";
  pipeGame.animatedSeen=null;
  setStatus("pipe-status",`💧 물 ${pipeGame.info.seen.size}/${pipeGame.size*pipeGame.size}칸 · 끊어진 배관 ${pipeGame.info.leaks}곳`);
  renderPipes();
}
function rotatePipeAt(r,c){
  if(pipeGame.state!=="playing")return;
  const {start}=pipeGame;
  if(r===start.r&&c===start.c){
    return setStatus("pipe-status","START 파이프는 물이 들어오도록 고정되어 있어요. 다른 파이프를 돌려주세요.");
  }
  if(pipeBits(pipeGame.board[r][c])===4){
    return setStatus("pipe-status","십자(+) 파이프는 돌려도 같은 모양이에요.");
  }
  // 되돌릴 수 있도록 회전 직전의 모양만 저장합니다. 게임판은 매번 새로 생성됩니다.
  pipeGame.history.push({r,c,mask:pipeGame.board[r][c],lastTurn:pipeGame.lastTurn});
  const turn=pipeGame.turnDirection===-1?rotatePipeCounterClockwise:rotatePipe;
  pipeGame.board[r][c]=turn(pipeGame.board[r][c]);
  pipeGame.rotations++;runStats.moves++;
  playSfx('rotate');
  pipeGame.lastTurn=r*pipeGame.size+c;
  pipeGame.lastHint=-1;
  evaluatePipeState();
}
// 무제한 되돌리기: 실패 없이 배관 방향만 복구하고 누적 회전 기록은 유지합니다.
function undoPipeTurn(){
  if(pipeGame.state!=="playing"||!pipeGame.history.length)return;
  const prev=pipeGame.history.pop();
  pipeGame.board[prev.r][prev.c]=prev.mask;
  pipeGame.lastTurn=prev.lastTurn;
  pipeGame.lastHint=-1;
  pipeGame.info=pipeReachable(pipeGame.board);
  playSfx('rotate');
  renderPipes();
  setStatus('pipe-status','이전 회전을 되돌렸어요. 총 회전 횟수는 기록으로 남지만 클리어에 제한은 없어요.');
}
function togglePipeDirection(){
  pipeGame.turnDirection*=-1;
  syncPipeControls();
  setStatus('pipe-status',pipeGame.turnDirection===1?'시계 방향 회전으로 바꿨어요.':'반시계 방향 회전으로 바꿨어요.');
}
function syncPipeControls(){
  const direction=$("pipe-direction"), undo=$("pipe-undo");
  if(direction){
    const isCounter=pipeGame.turnDirection===-1;
    direction.textContent=isCounter?'반시계 방향':'시계 방향';
    direction.setAttribute('aria-pressed',String(isCounter));
    direction.title='버튼을 누르면 파이프를 돌리는 방향이 바뀝니다.';
  }
  if(undo) undo.disabled=pipeGame.state!=="playing"||pipeGame.history.length===0;
}
function hintPipes(){
  if(activeGame!=="pipes"||pipeGame.state!=="playing")return;
  const options=[];
  for(let r=0;r<pipeGame.size;r++)for(let c=0;c<pipeGame.size;c++){
    if(r===pipeGame.start.r&&c===pipeGame.start.c)continue;
    if(pipeGame.board[r][c]!==pipeGame.solution[r][c])options.push([r,c]);
  }
  if(!options.length)return setStatus("pipe-status","모든 파이프 방향은 맞아요. 연결을 확인해 보세요.");
  // 물길과 가까운 미해결 배관부터 보정하면 즉시 물길이 확장되는 재미가 있습니다.
  options.sort((a,b)=>{
    const wetA=pipeGame.info.seen.has(a[0]*pipeGame.size+a[1])?1:0;
    const wetB=pipeGame.info.seen.has(b[0]*pipeGame.size+b[1])?1:0;
    return wetB-wetA;
  });
  const [r,c]=options[0];
  pipeGame.board[r][c]=pipeGame.solution[r][c];
  // 힌트 적용 이후에는 과거 회전 기록을 뒤섞지 않도록 되돌리기 목록을 초기화합니다.
  pipeGame.history=[];
  pipeGame.hints++;
  playSfx('hint');
  pipeGame.lastTurn=-1;
  pipeGame.lastHint=r*pipeGame.size+c;
  $("pipe-hint-count").textContent=pipeGame.hints;
  evaluatePipeState();
  if(pipeGame.state!=="won")setStatus("pipe-status",`✧ 힌트: ${r+1}행 ${c+1}열 파이프를 올바른 방향으로 맞췄어요. 초록색 테두리를 확인하세요!`);
}
function checkPipes(){
  pipeGame.info=pipeReachable(pipeGame.board);
  if(pipeGame.info.solved){beginPipeFlowVictory();return;}
  renderPipes();
  setStatus("pipe-status",`물 흐름 ${pipeGame.info.seen.size}/${pipeGame.size*pipeGame.size}칸 · 불일치 연결 ${pipeGame.info.leaks}곳 · 힌트로 한 칸씩 자동 보정할 수 있어요.`);
}
// SVG는 사진과 비슷한 둥근 엘보/단면/갈림길을 만들어 줍니다.
// 각각의 도형은 정확히 타일 경계 0/100으로 닿으므로 이웃 칸과 간격 없이 이어집니다.
function pipeCurve(mask){
  if(mask===(N|S))return 'M50 0 L50 100';
  if(mask===(E|W))return 'M0 50 L100 50';
  if(mask===(N|E))return 'M50 0 L50 28 Q50 50 72 50 L100 50';
  if(mask===(E|S))return 'M100 50 L72 50 Q50 50 50 72 L50 100';
  if(mask===(S|W))return 'M50 100 L50 72 Q50 50 28 50 L0 50';
  if(mask===(W|N))return 'M0 50 L28 50 Q50 50 50 28 L50 0';
  // 지선 하나 이상: 중앙에서 넓은 선이 자연스럽게 합쳐지도록 모읍니다.
  return [
    mask&N?'M50 50 L50 0':'',mask&E?'M50 50 L100 50':'',
    mask&S?'M50 50 L50 100':'',mask&W?'M50 50 L0 50':''
  ].filter(Boolean).join(' ');
}
function pipeWaterCurve(mask,wet){
  const degree=pipeBits(mask);
  if(degree===2&&wet===mask)return pipeCurve(mask);
  // 커브 한쪽만 연결된 경우의 반쪽 선은 자연스러운 엘보 곡선에 따라갑니다.
  if(degree===2&&mask===(N|E)){
    return [wet&N?'M50 0 L50 28 Q50 39 55.5 44.5':'',wet&E?'M55.5 44.5 Q61 50 72 50 L100 50':''].filter(Boolean).join(' ');
  }
  if(degree===2&&mask===(E|S)){
    return [wet&E?'M100 50 L72 50 Q61 50 55.5 55.5':'',wet&S?'M55.5 55.5 Q50 61 50 72 L50 100':''].filter(Boolean).join(' ');
  }
  if(degree===2&&mask===(S|W)){
    return [wet&S?'M50 100 L50 72 Q50 61 44.5 55.5':'',wet&W?'M44.5 55.5 Q39 50 28 50 L0 50':''].filter(Boolean).join(' ');
  }
  if(degree===2&&mask===(W|N)){
    return [wet&W?'M0 50 L28 50 Q39 50 44.5 44.5':'',wet&N?'M44.5 44.5 Q50 39 50 28 L50 0':''].filter(Boolean).join(' ');
  }
  return [wet&N?'M50 50 L50 0':'',wet&E?'M50 50 L100 50':'',wet&S?'M50 50 L50 100':'',wet&W?'M50 50 L0 50':''].filter(Boolean).join(' ');
}
function makePipeSvg(mask,waterMask,isStart,isEnd){
  const degree=pipeBits(mask);
  const dry=pipeCurve(mask),wet=pipeWaterCurve(mask,waterMask);
  const cap=degree===1?'<circle class="pipe-cap-outer" cx="50" cy="50" r="14"/><circle class="pipe-cap-inner" cx="50" cy="50" r="9"/>':'';
  const liquid=wet?`<path class="pipe-water-glow" d="${wet}"/><path class="pipe-water" d="${wet}"/><path class="pipe-water-shine" d="${wet}"/>`:'';
  const center=(degree>=3)?'<circle class="pipe-junction-ring" cx="50" cy="50" r="21"/><circle class="pipe-junction-core" cx="50" cy="50" r="14"/>':'';
  const accent=isStart?'<circle class="pipe-start-light" cx="50" cy="50" r="7"/>':isEnd?'<circle class="pipe-end-light" cx="50" cy="50" r="7"/>':'';
  return `<svg class="pipe-graphic" viewBox="0 0 100 100" aria-hidden="true"><path class="pipe-shadow" d="${dry}"/><path class="pipe-metal" d="${dry}"/><path class="pipe-outline" d="${dry}"/><path class="pipe-edge-light" d="${dry}"/><path class="pipe-channel" d="${dry}"/>${center}${cap}${liquid}${accent}</svg>`;
}

function renderPipes(){
  const {board,size,start,end}=pipeGame;
  const info=pipeGame.info||pipeReachable(board);
  const wetSet=(pipeGame.state==="flowing"&&pipeGame.animatedSeen)?pipeGame.animatedSeen:info.seen;
  const goalId=end.r*size+end.c;
  const goalWet=wetSet.has(goalId)&&info.outletOpen;
  const el=$("pipe-board");el.style.setProperty("--pipe-size",String(size));
  const rebuild=el.children.length!==size*size || [...el.children].some(node=>!node.classList.contains('pipe-cell'));
  if(rebuild)el.replaceChildren();
  const fragment=rebuild?document.createDocumentFragment():null;
  for(let r=0;r<size;r++)for(let c=0;c<size;c++){
    const id=r*size+c,btn=rebuild?document.createElement("button"):el.children[id];
    if(rebuild)btn.type="button";
    btn.className="pipe-cell";
    const startCell=r===start.r&&c===start.c,endCell=r===end.r&&c===end.c;
    if(startCell)btn.classList.add("start","fixed");
    if(endCell)btn.classList.add("end");
    if(wetSet.has(id))btn.classList.add("wet");
    if(pipeGame.lastTurn===id)btn.classList.add("just-turned");
    if(pipeGame.lastHint===id)btn.classList.add("hinted");
    if(pipeBits(board[r][c])===4)btn.classList.add("cross-fixed");
    const waterMask=wetSet.has(id)?info.matched[r][c]|
      (startCell&&info.intakeOpen?start.port:0)|
      (endCell&&goalWet?end.port:0):0;
    const renderKey=`${board[r][c]}:${waterMask}:${Number(startCell)}:${Number(endCell)}`;
    if(btn.dataset.pipeVisual!==renderKey){
      btn.innerHTML=makePipeSvg(board[r][c],waterMask,startCell,endCell);
      btn.dataset.pipeVisual=renderKey;
    }
    btn.disabled=pipeGame.state!=="playing"||startCell;
    // 게임 칸은 네이티브 button 역할을 유지합니다.
    btn.setAttribute("aria-label",`${r+1}행 ${c+1}열, ${pipeBits(board[r][c])}방향 파이프, ${wetSet.has(id)?"물이 흐름":"아직 물이 없음"}. 클릭하면 ${pipeGame.turnDirection===-1?'반시계':'시계'} 방향으로 90도 회전`);
    if(rebuild){btn.addEventListener("click",()=>rotatePipeAt(r,c));fragment.appendChild(btn);}
  }
  if(rebuild)el.appendChild(fragment);
  $("pipe-moves").textContent=`${pipeGame.rotations}회`;
  $("pipe-wet-count").textContent=`${wetSet.size} / ${size*size}`;
  $("pipe-leaks").textContent=`${info.leaks}곳`;
  $("pipe-progress-fill").style.width=`${wetSet.size/(size*size)*100}%`;
  $("pipe-source").style.left=`${(start.c+.5)/size*100}%`;
  $("pipe-sink").style.left=`${(end.c+.5)/size*100}%`;
  $("pipe-source").classList.toggle("active",info.intakeOpen);
  $("pipe-sink").classList.toggle("active",goalWet);
  el.classList.toggle("all-connected",info.solved);
  syncPipeControls();
}

/* ====================== 5. 시카쿠 ====================== */
const shikakuPresets = { easy: [5, 6], normal: [6, 9], hard: [7, 12], extreme: [8, 17], expert:[12,34] };
const shikaku = { size: 5, target: 6, clues: [], regions: [], solution: [], history: [], hints: 0, finished: false, anchor: null, preview: null, hintRect: null, dragging: null, eraser: false };
function rectArea(rect) { return (rect.r2 - rect.r1 + 1) * (rect.c2 - rect.c1 + 1); }
// 같은 조건에서 새 퍼즐을 눌러도 직전의 퍼즐이 그대로 반복되지 않도록 비교합니다.
const shikakuRecentPuzzles=new Map();
function shikakuGenerateCandidate(size, target) {
  const rects = [{ r1: 0, c1: 0, r2: size - 1, c2: size - 1 }];
  while (rects.length < target) {
    const eligible = rects.map((rect, index) => ({ rect, index })).filter(({ rect }) => rect.r2 > rect.r1 || rect.c2 > rect.c1);
    if (!eligible.length) break;
    // 큰 영역을 우선 나누되 가끔 다른 영역을 선택해 퍼즐 모양을 다양하게 합니다.
    eligible.sort((a,b)=>rectArea(b.rect)-rectArea(a.rect));
    const shortlist=eligible.slice(0,Math.min(3,eligible.length));
    const { rect: src, index } = shortlist[randomInt(shortlist.length)];
    const height = src.r2 - src.r1 + 1, width = src.c2 - src.c1 + 1;
    const splitHorizontal = height <= 1 ? false : width <= 1 ? true : Math.random() < .5;
    const a = { ...src }, b = { ...src };
    if (splitHorizontal) {
      const cut = 1 + randomInt(height - 1);
      a.r2 = src.r1 + cut - 1;
      b.r1 = src.r1 + cut;
    } else {
      const cut = 1 + randomInt(width - 1);
      a.c2 = src.c1 + cut - 1;
      b.c1 = src.c1 + cut;
    }
    rects[index] = a;
    rects.push(b);
  }
  const clues = newEmptyGrid(size);
  for (const rect of rects) {
    const r = rect.r1 + randomInt(rect.r2 - rect.r1 + 1);
    const c = rect.c1 + randomInt(rect.c2 - rect.c1 + 1);
    clues[r][c] = rectArea(rect);
  }
  return { clues, solution: rects };
}
// 각 단서의 가능한 직사각형을 생성한 뒤, 겹치지 않는 완전 분할 수를 최대 2개까지 셉니다.
// 최대 탐색 노드를 넘기면 '검증 불가'로 취급해 게임 UI를 멈추지 않게 합니다.
function shikakuUniqueCheck(clues, maxNodes=18000){
  const n=clues.length, points=[];
  for(let r=0;r<n;r++)for(let c=0;c<n;c++)if(clues[r][c])points.push({r,c,v:clues[r][c]});
  const options=[];
  for(const {r,c,v} of points){
    const opts=[];
    for(let h=1;h<=n;h++){
      if(v%h)continue;const w=v/h;if(w>n)continue;
      for(let r1=Math.max(0,r-h+1);r1<=Math.min(r,n-h);r1++){
        for(let c1=Math.max(0,c-w+1);c1<=Math.min(c,n-w);c1++){
          let mask=0n,other=false;
          for(let y=r1;y<r1+h;y++)for(let x=c1;x<c1+w;x++){
            if(clues[y][x]&&(y!==r||x!==c))other=true;
            mask|=1n<<BigInt(y*n+x);
          }
          if(!other)opts.push(mask);
        }
      }
    }
    if(!opts.length)return {count:0,exhausted:false};
    options.push(opts);
  }
  let nodes=0,count=0,exhausted=false;
  function dfs(occupied,remaining){
    if(exhausted||count>=2)return;
    if(++nodes>maxNodes){exhausted=true;return;}
    if(!remaining.length){count++;return;}
    let bestIndex=-1,best=[];
    for(let j=0;j<remaining.length;j++){
      const available=options[remaining[j]].filter(mask=>(mask&occupied)===0n);
      if(!available.length)return;
      if(bestIndex===-1||available.length<best.length){bestIndex=j;best=available;if(best.length===1)break;}
    }
    const next=remaining.filter((_,idx)=>idx!==bestIndex);
    for(const mask of best){dfs(occupied|mask,next);if(count>=2||exhausted)break;}
  }
  dfs(0n,points.map((_,idx)=>idx));
  return {count,exhausted};
}

function shikakuGenerate(size,target) {
  const key=`${size}-${target}`;
  const used=shikakuRecentPuzzles.get(key)||[];
  let puzzle=null,signature='',verified=false;
  const maxCandidates=size<=8?10:6;
  const placements=size<=8?9:40;
  const timeStart=performance.now();
  outer:for(let attempt=0;attempt<maxCandidates;attempt++){
    const base=shikakuGenerateCandidate(size,target);
    for(let placement=0;placement<placements;placement++){
      const clues=newEmptyGrid(size);
      for(const rect of base.solution){
        const r=rect.r1+randomInt(rect.r2-rect.r1+1);
        const c=rect.c1+randomInt(rect.c2-rect.c1+1);
        clues[r][c]=rectArea(rect);
      }
      signature=clues.map(row=>row.join(',')).join('/');
      if(used.includes(signature))continue;
      puzzle={clues,solution:base.solution};
      const result=shikakuUniqueCheck(clues,size<=8?18000:11000);
      if(result.count===1 && !result.exhausted){verified=true;break outer;}
      if(performance.now()-timeStart>200)break outer;
    }
  }
  if(!puzzle){puzzle=shikakuGenerateCandidate(size,target);signature=puzzle.clues.map(row=>row.join(',')).join('/');}
  puzzle.uniqueVerified=verified;
  used.push(signature);
  if(used.length>15)used.shift();
  shikakuRecentPuzzles.set(key,used);
  return puzzle;
}
function resetShikaku() {
  resetRunStats();
  if(typeof challenge!=="undefined" && challenge.reported){challenge.reported=false;hideVictoryOverlay();}
  const stage = getActiveStageConfig("shikaku");
  [shikaku.size, shikaku.target] = stage ? [stage.size, stage.regions] : shikakuPresets[$("shikaku-difficulty").value];
  const puzzle = shikakuGenerate(shikaku.size, shikaku.target);
  shikaku.clues = puzzle.clues;
  shikaku.solution = puzzle.solution;
  shikaku.uniqueVerified=Boolean(puzzle.uniqueVerified);
  shikaku.regions = newEmptyGrid(shikaku.size).map((row) => row.map(() => -1));
  shikaku.history = [];
  shikaku.hints = 0;
  shikaku.finished = false;
  shikaku.anchor = shikaku.preview = shikaku.hintRect = shikaku.dragging = null;
  shikaku.eraser = false;
  syncShikakuEraser();
  setStatus('shikaku-status',`시작 칸과 끝 칸을 클릭하거나 드래그하세요. ${shikaku.uniqueVerified?'✅ 유일 해답 검증 완료':'한 가지 이상의 정답 경로가 보장된 문제'}`);
  renderShikaku();
}
function normalizeRect(a, b) {
  return { r1: Math.min(a.r, b.r), c1: Math.min(a.c, b.c), r2: Math.max(a.r, b.r), c2: Math.max(a.c, b.c) };
}
function insideRect(rect, r, c) { return Boolean(rect) && r >= rect.r1 && r <= rect.r2 && c >= rect.c1 && c <= rect.c2; }
function shikakuValidate(rect) {
  let clueCount = 0, clueValue = 0;
  for (let r = rect.r1; r <= rect.r2; r++) for (let c = rect.c1; c <= rect.c2; c++) {
    if (shikaku.regions[r][c] !== -1) return "이미 선택한 영역과 겹칩니다.";
    if (shikaku.clues[r][c] !== 0) { clueCount++; clueValue = shikaku.clues[r][c]; }
  }
  if (clueCount !== 1) return "한 직사각형에는 숫자가 정확히 하나 있어야 해요.";
  if (rectArea(rect) !== clueValue) return `넓이 ${rectArea(rect)}칸이지만 안의 숫자는 ${clueValue}예요.`;
  return null;
}
function shikakuCommit(rect) {
  if (shikaku.finished) return;
  shikaku.anchor = shikaku.preview = shikaku.hintRect = null;
  const error = shikakuValidate(rect);
  if (error) {runStats.misses++;playSfx('invalid'); setStatus("shikaku-status", error, "error"); return renderShikaku(); }
  playSfx('rectangle');
  const regionId = shikaku.history.length;
  for (let r = rect.r1; r <= rect.r2; r++) for (let c = rect.c1; c <= rect.c2; c++) shikaku.regions[r][c] = regionId;
  shikaku.history.push(rect);
  if (shikaku.regions.every((row) => row.every((value) => value >= 0))) {
    shikaku.finished = true;
    setStatus("shikaku-status", `🎉 시카쿠 완성! ${shikaku.history.length}개 영역 / 힌트 ${shikaku.hints}회`, "success");
    reportGameWin("shikaku");
  } else setStatus("shikaku-status", `영역 ${shikaku.history.length}개 완성! 남은 칸을 채워 보세요.`);
  renderShikaku();
}
// 어떤 직사각형을 선택해서 지워도 나머지 색상/영역 번호가 꼬이지 않게 재구성
function shikakuRebuildRegions() {
  shikaku.regions=newEmptyGrid(shikaku.size).map(row=>row.map(()=>-1));
  shikaku.history.forEach((rect,id)=>{
    for(let r=rect.r1;r<=rect.r2;r++)for(let c=rect.c1;c<=rect.c2;c++)shikaku.regions[r][c]=id;
  });
}
function shikakuEraseRegion(row,col) {
  const id=shikaku.regions[row][col];
  if(id<0)return setStatus("shikaku-status","색칠된 영역을 누르면 해당 직사각형을 지울 수 있어요.");
  shikaku.history.splice(id,1);runStats.undos++;
  shikakuRebuildRegions();
  shikaku.finished=false;
  shikaku.anchor=shikaku.preview=shikaku.hintRect=null;
  setStatus("shikaku-status",`⌫ ${row+1}행 ${col+1}열의 직사각형을 지웠어요.`);
  playSfx('erase');
  renderShikaku();
}
function syncShikakuEraser() {
  $("shikaku-erase").classList.toggle("active",shikaku.eraser);
  $("shikaku-erase").setAttribute("aria-pressed",String(shikaku.eraser));
  $("shikaku-erase").textContent=shikaku.eraser?"✓ 지우개 사용 중":"⌫ 지우개 모드";
}
function toggleShikakuEraser() {
  shikaku.eraser=!shikaku.eraser;
  shikaku.anchor=shikaku.preview=shikaku.dragging=null;
  syncShikakuEraser();
  setStatus("shikaku-status",shikaku.eraser?"지우개 모드: 색칠된 직사각형을 클릭하면 지워져요.":"선택 모드: 시작 칸과 끝 칸을 클릭하거나 드래그하세요.");
  renderShikaku();
}
function shikakuUndo() {
  if(challenge.reported){
    setStatus('shikaku-status','클리어 기록이 이미 반영됐어요. 다음 단계로 진행하세요.');
    return;
  }
  if (!shikaku.history.length) return setStatus("shikaku-status", "취소할 영역이 없습니다.");
  const rect = shikaku.history.pop();runStats.undos++;
  for (let r = rect.r1; r <= rect.r2; r++) for (let c = rect.c1; c <= rect.c2; c++) shikaku.regions[r][c] = -1;
  shikaku.anchor = shikaku.preview = shikaku.hintRect = null;
  shikaku.finished = false;
  setStatus("shikaku-status", "마지막 직사각형을 취소했어요.");
  playSfx('undo');
  renderShikaku();
}
function shikakuHint() {
  if (shikaku.finished) return setStatus("shikaku-status", "이미 퍼즐을 완성했어요!");
  const available = shikaku.solution.find((rect) => {
    for (let r = rect.r1; r <= rect.r2; r++) for (let c = rect.c1; c <= rect.c2; c++) if (shikaku.regions[r][c] !== -1) return false;
    return true;
  });
  if (!available) return setStatus("shikaku-status", "현재 선택과 겹치지 않는 정답 힌트가 없어요. 마지막 영역을 취소해 보세요.", "error");
  shikaku.hints++;
  shikaku.eraser=false;syncShikakuEraser();
  shikaku.anchor = shikaku.preview = null;
  shikaku.hintRect = available;
  setStatus("shikaku-status", `✧ 힌트: ${available.r1 + 1}행 ${available.c1 + 1}열 → ${available.r2 + 1}행 ${available.c2 + 1}열 · 넓이 ${rectArea(available)} (자동 선택 아님)`);
  playSfx('hint');
  renderShikaku();
}
function shikakuClear() {
  shikaku.anchor = shikaku.preview = shikaku.hintRect = null;
  setStatus("shikaku-status", "선택을 취소했어요. 새 직사각형을 지정하세요.");
  renderShikaku();
}
function renderShikaku(){
  const board=$("shikaku-board");board.style.setProperty("--size",String(shikaku.size));board.innerHTML="";
  // 영역 단위 하나의 둥근 사각형을 먼저 올리고, 그 위에 숫자를 보이게 합니다.
  shikaku.history.forEach((rect,id)=>{
    const block=document.createElement("div");
    block.className=`shikaku-region-block region-${id%12}`;
    block.style.gridRow=`${rect.r1+1} / span ${rect.r2-rect.r1+1}`;
    block.style.gridColumn=`${rect.c1+1} / span ${rect.c2-rect.c1+1}`;
    block.setAttribute("aria-hidden","true");
    board.appendChild(block);
  });
  if(shikaku.hintRect){
    const rect=shikaku.hintRect,hint=document.createElement("div");
    hint.className="shikaku-hint-block";
    hint.style.gridRow=`${rect.r1+1} / span ${rect.r2-rect.r1+1}`;
    hint.style.gridColumn=`${rect.c1+1} / span ${rect.c2-rect.c1+1}`;
    hint.setAttribute("aria-hidden","true");
    board.appendChild(hint);
  }
  for(let r=0;r<shikaku.size;r++)for(let c=0;c<shikaku.size;c++){
    const cell=document.createElement("button");cell.type="button";cell.className="shikaku-cell";
    cell.style.gridRow=String(r+1);cell.style.gridColumn=String(c+1);
    cell.dataset.row=r;cell.dataset.col=c;
    const region=shikaku.regions[r][c],clue=shikaku.clues[r][c];
    if(clue)cell.classList.add("has-clue");
    if(region>=0)cell.classList.add("filled");
    if(insideRect(shikaku.preview,r,c)||(shikaku.anchor&&shikaku.anchor.r===r&&shikaku.anchor.c===c))cell.classList.add("preview");
    if(clue){const bubble=document.createElement("span");bubble.className="shikaku-clue";bubble.textContent=String(clue);cell.appendChild(bubble);}
    // 네이티브 button 역할 유지
    cell.setAttribute("aria-label",`${r+1}행 ${c+1}열${clue?` 숫자 ${clue}`:""}${region>=0?" 완성 영역":""}`);
    board.appendChild(cell);
  }
  $("shikaku-count").textContent=`${shikaku.history.length} / ${shikaku.target}`;
  $("shikaku-hints").textContent=shikaku.hints;
  $("shikaku-undo").disabled=challenge.reported||!shikaku.history.length;
  v19UpdateShikakuPreview();
  v41StyleShikakuPreview();
}
function refreshShikakuPreview() {
  $("shikaku-board").querySelectorAll(".shikaku-cell").forEach((cell) => {
    const r = Number(cell.dataset.row), c = Number(cell.dataset.col);
    cell.classList.toggle("preview", insideRect(shikaku.preview, r, c) || (shikaku.anchor && shikaku.anchor.r === r && shikaku.anchor.c === c));
  });
  v19UpdateShikakuPreview();
  v41StyleShikakuPreview();
}
function shikakuCellFromPoint(x, y) {
  const element = document.elementFromPoint(x, y);
  const cell = element && element.closest(".shikaku-cell");
  if (!cell || !$("shikaku-board").contains(cell)) return null;
  return { r: Number(cell.dataset.row), c: Number(cell.dataset.col) };
}
function handleShikakuClick(coord) {
  if (shikaku.finished) return;
  if (shikaku.eraser) return shikakuEraseRegion(coord.r,coord.c);
  shikaku.hintRect = null;
  if (shikaku.anchor) return shikakuCommit(normalizeRect(shikaku.anchor, coord));
  shikaku.anchor = coord;
  shikaku.preview = null;
  setStatus("shikaku-status", `${coord.r + 1}행 ${coord.c + 1}열을 시작점으로 선택했어요. 끝 칸을 클릭하세요.`);
  renderShikaku();
}

/* ====================== 6. 블록 퍼즐 ====================== */
// 사진에서처럼 블록 3개를 선택하여 10x10 판에 놓는 게임입니다.
// 블록은 회전하지 않고, 가로/세로 한 줄을 채우면 줄 전체가 사라집니다.
const blockPresets = {easy:1000, normal:1350, hard:1650, extreme:1950, expert:2250};
const blockShapes = [
  {name:'한 칸', cells:[[0,0]]},
  {name:'2칸 가로', cells:[[0,0],[0,1]]},
  {name:'2칸 세로', cells:[[0,0],[1,0]]},
  {name:'3칸 가로', cells:[[0,0],[0,1],[0,2]]},
  {name:'3칸 세로', cells:[[0,0],[1,0],[2,0]]},
  {name:'2×2 정사각형', cells:[[0,0],[0,1],[1,0],[1,1]]},
  {name:'ㄴ자', cells:[[0,0],[1,0],[1,1]]},
  {name:'역ㄴ자', cells:[[0,1],[1,0],[1,1]]},
  {name:'4칸 가로', cells:[[0,0],[0,1],[0,2],[0,3]]},
  {name:'4칸 세로', cells:[[0,0],[1,0],[2,0],[3,0]]},
  {name:'T자', cells:[[0,0],[0,1],[0,2],[1,1]]},
  {name:'지그재그', cells:[[0,0],[0,1],[1,1],[1,2]]},
  {name:'역지그재그', cells:[[0,1],[0,2],[1,0],[1,1]]},
  {name:'긴 ㄴ자', cells:[[0,0],[1,0],[2,0],[2,1]]},
  {name:'3×2 직사각형', cells:[[0,0],[0,1],[1,0],[1,1],[2,0],[2,1]]},
  {name:'5칸 가로', cells:[[0,0],[0,1],[0,2],[0,3],[0,4]]},
  {name:'5칸 세로', cells:[[0,0],[1,0],[2,0],[3,0],[4,0]]},
  {name:'십자', cells:[[0,1],[1,0],[1,1],[1,2],[2,1]]},
  {name:'3×3 정사각형', cells:[[0,0],[0,1],[0,2],[1,0],[1,1],[1,2],[2,0],[2,1],[2,2]]},
  {name:'강화 지그재그',cells:[[0,0],[0,1],[1,1],[1,2],[2,2],[2,3]]},
  {name:'큰 ㄷ자',cells:[[0,0],[0,1],[0,2],[1,0],[2,0],[2,1],[2,2]]},
  {name:'긴 비대칭',cells:[[0,0],[1,0],[2,0],[2,1],[2,2],[3,2]]}
];
const blockGame = {board:[],tray:[],score:0,best:readSavedBest("blocks"),target:750,moves:0,combo:0,
  state:'playing',selected:null,hover:null,hint:null,hintCount:0,history:[],level:'easy'};
function blockDimensions(shape) {
  return [Math.max(...shape.cells.map(c=>c[0]))+1, Math.max(...shape.cells.map(c=>c[1]))+1];
}
function canPlaceBlock(board,shape,row,col) {
  return shape.cells.every(([dr,dc])=>inBounds(10,row+dr,col+dc) && board[row+dr][col+dc]===0);
}
function blockLegalMoves(board,shape) {
  const moves=[];
  for(let r=0;r<10;r++)for(let c=0;c<10;c++)if(canPlaceBlock(board,shape,r,c))moves.push([r,c]);
  return moves;
}
function blockPiecePool() {
  const level=blockGame.level;
  if(level==='easy')return [0,1,2,3,4,5,6,7,8,9,10,11];
  if(level==='normal')return [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14];
  if(level==='hard')return [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17];
  if(level==='extreme')return [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20];
  return [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21];
}
function newBlockBatch() {
  const pool=blockPiecePool();
  const occupied=blockGame.board.flat().filter(Boolean).length;
  const playable=pool.filter(id=>blockLegalMoves(blockGame.board,blockShapes[id]).length>0);
  const tierIndex=LEVEL_KEYS.indexOf(blockGame.level);
  const stage=getActiveStageConfig('blocks');
  const progress=stage ? (stage.level-1)/49 : .35;
  // 쉬운 난이도는 여러 개의 배치 가능 블록을 제공하고, 고난도는 한 개만 보장합니다.
  const guaranteed=tierIndex<=0?(progress>.72?2:3):tierIndex===1?2:tierIndex===2?(occupied>40?2:1):(occupied>=40?2:1);
  const selected=[];
  // 판이 채워진 상황에 작은 블록을 일부 섞어 운에 의한 즉사 가능성을 줄입니다.
  // 어려운 난이도일수록 이 보정은 적게 적용합니다.
  const needSmall=occupied>=32 && (tierIndex<=2 || (tierIndex>=3 && Math.random() < .75));
  const small=playable.filter(id=>blockShapes[id].cells.length<=3);
  if(needSmall&&small.length)selected.push(small[randomInt(small.length)]);
  while(selected.length<Math.min(guaranteed,3)&&playable.length){
    const weighted=playable.filter(id=>{
      const count=blockShapes[id].cells.length;
      return count<=4 || Math.random()>(.2 + tierIndex*.09);
    });
    const choices=weighted.length?weighted:playable;
    selected.push(choices[randomInt(choices.length)]);
  }
  while(selected.length<3) selected.push(pool[randomInt(pool.length)]);
  for(let i=selected.length-1;i>0;i--){const j=randomInt(i+1);[selected[i],selected[j]]=[selected[j],selected[i]];}
  blockGame.tray=selected.map((shapeId,i)=>({shapeId,used:false,color:i}));
}
function resetBlocks() {
  resetRunStats();
  if(typeof challenge!=="undefined" && challenge.reported){challenge.reported=false;hideVictoryOverlay();}
  const stage = getActiveStageConfig("blocks");
  blockGame.level=stage ? stage.tier : $('block-difficulty').value;
  blockGame.target=stage ? stage.score : blockPresets[blockGame.level];
  blockGame.board=newEmptyGrid(10);
  blockGame.score=0;blockGame.moves=0;blockGame.hintCount=0;blockGame.combo=0;
  blockGame.state='playing';blockGame.history=[];
  blockGame.selected=null;blockGame.hover=null;blockGame.hint=null;
  newBlockBatch();
  setStatus('block-status','블록을 선택판에서 끌어 게임판에 놓거나 선택 후 클릭하세요. 가로·세로 줄을 완성하면 점수가 올라가요.');
  renderBlocks();
}
function blockSimulation(board,shape,row,col,color=1) {
  if(!canPlaceBlock(board,shape,row,col))return null;
  const next=copyGrid(board);
  shape.cells.forEach(([dr,dc])=>next[row+dr][col+dc]=color);
  const rows=[],cols=[];
  for(let r=0;r<10;r++) if(next[r].every(Boolean))rows.push(r);
  for(let c=0;c<10;c++) if(next.every(line=>line[c]))cols.push(c);
  rows.forEach(r=>next[r].fill(0));
  cols.forEach(c=>{for(let r=0;r<10;r++)next[r][c]=0;});
  const lines=rows.length+cols.length;
  const points=shape.cells.length*10+lines*100+(lines>1?(lines-1)*50:0);
  return {board:next,lines,points,rows,cols};
}
function snapshotBlocks() {
  return {board:copyGrid(blockGame.board),tray:blockGame.tray.map(p=>({...p})),score:blockGame.score,
    state:blockGame.state,moves:blockGame.moves,selected:blockGame.selected,combo:blockGame.combo};
}
function blockHasMove() {
  return blockGame.tray.some(p=>!p.used && blockLegalMoves(blockGame.board,blockShapes[p.shapeId]).length>0);
}
function placeBlock(row,col) {
  if(activeGame!=='blocks'||blockGame.state!=='playing')return;
  if(blockGame.selected===null)return setStatus('block-status','먼저 블록 선택판의 3개 중 하나를 선택해 주세요.');
  const piece=blockGame.tray[blockGame.selected];
  if(!piece||piece.used)return;
  const shape=blockShapes[piece.shapeId];
  const result=blockSimulation(blockGame.board,shape,row,col,piece.color+1);
  if(!result){playSfx('invalid');return setStatus('block-status','이 위치에는 블록이 들어가지 않아요. 다른 위치에 놓아보세요.','error');}
  playSfx(result.lines>0 ? 'line' : 'place');
  blockGame.history.push(snapshotBlocks());
  blockGame.board=result.board;
  blockGame.combo=result.lines ? (blockGame.combo||0)+1 : 0;
  const comboBonus=result.lines&&blockGame.combo>1?(blockGame.combo-1)*75:0;
  blockGame.score+=result.points+comboBonus;
  blockGame.best=Math.max(blockGame.score,blockGame.best);
  saveBest("blocks",blockGame.best);
  blockGame.moves++;
  piece.used=true;
  blockGame.selected=null;blockGame.hover=null;blockGame.hint=null;
  if(blockGame.score>=blockGame.target){
    blockGame.state='won';
    setStatus('block-status',`🎉 목표 ${blockGame.target}점 달성! ${blockGame.score}점으로 성공했어요.`, 'success');
    reportGameWin('blocks');
  }else{
    if(blockGame.tray.every(p=>p.used))newBlockBatch();
    if(!blockHasMove()){
      blockGame.state='lost';
      playSfx('lose');
      setStatus('block-status',`게임 오버! 놓을 블록이 없습니다. 최종 ${blockGame.score}점 · 되돌리기로 다시 도전할 수 있어요.`,'error');
    } else {
      setStatus('block-status',`${shape.name} 배치 +${result.points+comboBonus}점${result.lines?` · ${result.lines}줄 완성!`:''}${comboBonus?` · 콤보 +${comboBonus}점`:""} · 목표까지 ${blockGame.target-blockGame.score}점`);
    }
  }
  renderBlocks();
}
function blockHint() {
  if(blockGame.state!=='playing')return setStatus('block-status','게임이 끝났어요. 새 게임을 시작하세요.');
  let best=null;
  blockGame.tray.forEach((piece,i)=>{
    if(piece.used)return;
    const shape=blockShapes[piece.shapeId];
    for(const [r,c] of blockLegalMoves(blockGame.board,shape)) {
      const result=blockSimulation(blockGame.board,shape,r,c);
      const nearby=shape.cells.reduce((total,[dr,dc])=>{
        const rr=r+dr,cc=c+dc;
        return total+[[1,0],[-1,0],[0,1],[0,-1]].filter(([vr,vc])=>inBounds(10,rr+vr,cc+vc)&&blockGame.board[rr+vr][cc+vc]).length;
      },0);
      const rate=result.points*10+nearby*2;
      if(!best||rate>best.rate)best={i,r,c,rate,points:result.points};
    }
  });
  if(!best)return setStatus('block-status','놓을 수 있는 블록이 없어요. 되돌리기를 사용해 보세요.');
  blockGame.hintCount++;
  blockGame.selected=best.i;
  blockGame.hint={r:best.r,c:best.c};
  blockGame.hover={r:best.r,c:best.c};
  setStatus('block-status',`💡 힌트: ${best.i+1}번째 블록을 ${best.r+1}행 ${best.c+1}열에서 놓아보세요. 예상 +${best.points}점!`);
  playSfx('hint');
  renderBlocks();
}
function undoBlocks() {
  if(challenge.reported){
    setStatus('block-status','클리어 기록이 이미 반영됐어요. 다음 단계로 진행하세요.');
    return;
  }
  if(!blockGame.history.length)return setStatus('block-status','되돌릴 이전 배치가 없어요.');
  const state=blockGame.history.pop();runStats.undos++;
  blockGame.board=state.board;blockGame.tray=state.tray;
  blockGame.score=state.score;blockGame.state='playing';blockGame.moves=state.moves;
  blockGame.selected=state.selected;blockGame.combo=state.combo||0;blockGame.hint=null;blockGame.hover=null;
  setStatus('block-status','↶ 이전 블록 배치를 취소했습니다.');
  playSfx('undo');
  renderBlocks();
}
function selectBlockPiece(index) {
  if(blockGame.state!=='playing'||blockGame.tray[index]?.used)return;
  blockGame.selected=index;blockGame.hint=null;blockGame.hover=null;
  setStatus('block-status',`${index+1}번 블록 선택! 게임판의 배치 시작 위치를 클릭하세요.`);
  playSfx('select');
  renderBlocks();
}
function updateBlockPreview() {
  const board=$('block-board');
  board.querySelectorAll('.block-cell').forEach(cell=>cell.classList.remove('block-good','block-bad','block-hint-place'));
  const note=$('v41-block-preview-note');
  if(note)note.textContent=blockGame.selected===null?'블록을 먼저 선택하세요. 초록 칸은 배치 가능, 빨간 칸은 배치 불가입니다.':'선택한 블록의 배치 위치를 가리켜 보세요. (모바일은 선택 후 게임판 터치)';
  if(blockGame.selected===null||!blockGame.hover||blockGame.state!=='playing')return;
  const piece=blockGame.tray[blockGame.selected];if(!piece||piece.used)return;
  const shape=blockShapes[piece.shapeId],{r,c}=blockGame.hover;
  const good=canPlaceBlock(blockGame.board,shape,r,c);
  const hint=$('v41-block-preview-note');
  if(hint)hint.textContent=`${r+1}행 ${c+1}열 · ${good?'✓ 배치 가능':'✕ 배치 불가 (빨간 칸)'}`;
  shape.cells.forEach(([dr,dc])=>{
    if(!inBounds(10,r+dr,c+dc))return;
    const cell=board.querySelector(`[data-r="${r+dr}"][data-c="${c+dc}"]`);
    if(cell){cell.classList.add(good?'block-good':'block-bad');if(blockGame.hint?.r===r&&blockGame.hint?.c===c)cell.classList.add('block-hint-place');}
  });
}
function renderBlocks() {
  const board=$('block-board');board.innerHTML='';
  const colors=['0','1','2'];
  for(let r=0;r<10;r++)for(let c=0;c<10;c++){
    const b=document.createElement('button');b.type='button';b.className='block-cell';
    b.dataset.r=r;b.dataset.c=c;
    if(blockGame.board[r][c])b.classList.add('occupied',`block-tile-${blockGame.board[r][c]}`);
    b.setAttribute('aria-label',`${r+1}행 ${c+1}열 ${blockGame.board[r][c]?'배치된 블록':'빈 칸'}`);
    b.addEventListener('mouseenter',()=>{blockGame.hover={r,c};updateBlockPreview();});
    b.addEventListener('click',()=>placeBlock(r,c));
    // 실제 드래그 배치는 아래 pointer 이벤트로 처리 (기본 브라우저 이미지 없음).
    board.appendChild(b);
  }
  const tray=$('block-tray');tray.innerHTML='';
  blockGame.tray.forEach((piece,i)=>{
    const shape=blockShapes[piece.shapeId],[height,width]=blockDimensions(shape);
    const b=document.createElement('button');b.type='button';b.className=`block-piece block-color-${i}`;
    if(piece.used)b.classList.add('used');
    if(blockGame.selected===i)b.classList.add('selected');
    b.setAttribute('aria-pressed',String(blockGame.selected===i));
    b.setAttribute('aria-label',`${i+1}번 블록 ${shape.name}${piece.used?' 배치 완료':blockGame.selected===i?' 선택됨':' 선택 가능'}`);
    b.disabled=piece.used||blockGame.state!=='playing';b.draggable=false;
    const small=document.createElement('span');small.className='block-mini';
    small.style.gridTemplateColumns=`repeat(${width},var(--mini))`;
    small.style.gridTemplateRows=`repeat(${height},var(--mini))`;
    shape.cells.forEach(([r,c])=>{const tile=document.createElement('span');tile.className='block-mini-tile';tile.style.gridRow=String(r+1);tile.style.gridColumn=String(c+1);small.appendChild(tile);});
    b.appendChild(small);
    const label=document.createElement('span');label.className='block-piece-label';label.textContent=piece.used?'배치 완료':shape.name;b.appendChild(label);
    b.addEventListener('click',()=>{if(!blockSuppressClick&&!blockPointer)selectBlockPiece(i);});
    b.addEventListener('dragstart',event=>event.preventDefault()); // 기본 드래그 이미지(버튼 스크린샷) 제거
    tray.appendChild(b);
  });
  $('block-score').textContent=blockGame.score;
  $('block-target').textContent=blockGame.target;
  $('block-best').textContent=blockGame.best;
  $('block-hint-count').textContent=blockGame.hintCount;
  $('block-progress-fill').style.width=Math.min(100,100*blockGame.score/blockGame.target)+'%';
  if($('v19-block-combo')) $('v19-block-combo').textContent=blockGame.combo?`🔥 연속 줄 제거 ${blockGame.combo}회 · 콤보 보너스`: '줄을 연속으로 지우면 콤보 보너스!';
  $('block-undo').disabled=challenge.reported||!blockGame.history.length;
  $('block-hint').disabled=blockGame.state!=='playing';
  updateBlockPreview();
}

/* ====================== v51 · 블록 퍼즐 격자 맞춤 드래그 ======================
   손가락·마우스가 가리킨 위치를 실제 게임판 칸의 좌표로 변환합니다.
   미리보기와 손을 놓았을 때의 배치 칸을 동일한 좌표로 사용합니다.
   모바일에서는 손가락이 블록을 가리지 않도록 목표점을 손가락 위쪽에 둡니다. */
let blockPointer=null;
let blockGhost=null;
let blockSuppressClick=false;
function clearBlockGhost(){if(blockGhost){blockGhost.remove();blockGhost=null;}}
function makeBlockGhost(pieceIndex){
  const piece=blockGame.tray[pieceIndex];if(!piece)return null;
  const shape=blockShapes[piece.shapeId],dims=blockDimensions(shape);
  const ghost=document.createElement('div');
  ghost.className=`block-drag-ghost v51-block-ghost block-color-${pieceIndex}`;
  ghost.style.gridTemplateColumns=`repeat(${dims[1]},var(--ghost-cell))`;
  ghost.style.gridTemplateRows=`repeat(${dims[0]},var(--ghost-cell))`;
  ghost.setAttribute('aria-hidden','true');
  shape.cells.forEach(([r,c])=>{
    const tile=document.createElement('span');tile.className='block-mini-tile';
    tile.style.gridRow=String(r+1);tile.style.gridColumn=String(c+1);ghost.appendChild(tile);
  });
  document.body.appendChild(ghost);
  return ghost;
}
function blockCellUnderPointer(x,y){
  const element=document.elementFromPoint(x,y);
  const cell=element?.closest('.block-cell');
  return cell&&$('block-board').contains(cell)?{r:Number(cell.dataset.r),c:Number(cell.dataset.c)}:null;
}
function v51BlockGridMetrics(){
  const board=$('block-board');
  const first=board.querySelector('.block-cell[data-r="0"][data-c="0"]');
  const secondX=board.querySelector('.block-cell[data-r="0"][data-c="1"]');
  const secondY=board.querySelector('.block-cell[data-r="1"][data-c="0"]');
  if(!first||!secondX||!secondY)return null;
  const a=first.getBoundingClientRect(),bx=secondX.getBoundingClientRect(),by=secondY.getBoundingClientRect();
  const dx=bx.left-a.left,dy=by.top-a.top;
  if(dx<1||dy<1||a.width<1||a.height<1)return null;
  return {left:a.left,top:a.top,w:a.width,h:a.height,dx,dy,
    right:bx.right+dx*8,bottom:by.bottom+dy*8};
}
function v51BlockTarget(pointerX,pointerY,pieceIndex,pointerType){
  const metrics=v51BlockGridMetrics();
  const piece=blockGame.tray[pieceIndex];
  if(!metrics||!piece||piece.used)return null;
  const shape=blockShapes[piece.shapeId],dims=blockDimensions(shape);
  // 터치 좌표보다 1~2칸 위에 블록을 놓아 손가락에 가리지 않도록 합니다.
  const lift=pointerType==='touch'?Math.min(62,Math.max(36,metrics.h*1.55)):0;
  const aimX=pointerX,aimY=pointerY-lift;
  const inside=aimX>=metrics.left&&aimX<=metrics.right&&aimY>=metrics.top&&aimY<=metrics.bottom;
  if(!inside)return {inside:false,metrics,shape,dims,lift};
  const c=Math.round((aimX-(metrics.left+metrics.w/2)-(dims[1]-1)*metrics.dx/2)/metrics.dx);
  const r=Math.round((aimY-(metrics.top+metrics.h/2)-(dims[0]-1)*metrics.dy/2)/metrics.dy);
  return {inside:true,metrics,shape,dims,lift,r,c,valid:canPlaceBlock(blockGame.board,shape,r,c)};
}
function v51DrawBlockGhost(target,x,y){
  if(!blockGhost||!target)return;
  const {metrics,dims}=target;
  const cellSize=Math.max(8,metrics.w);
  blockGhost.style.setProperty('--ghost-cell',`${cellSize}px`);
  blockGhost.style.columnGap=`${Math.max(0,metrics.dx-metrics.w)}px`;
  blockGhost.style.rowGap=`${Math.max(0,metrics.dy-metrics.h)}px`;
  blockGhost.classList.toggle('v51-invalid',target.inside&&!target.valid);
  blockGhost.classList.toggle('v51-snapped',target.inside);
  const ghostWidth=dims[1]*metrics.w+(dims[1]-1)*(metrics.dx-metrics.w);
  const ghostHeight=dims[0]*metrics.h+(dims[0]-1)*(metrics.dy-metrics.h);
  const left=target.inside?metrics.left+target.c*metrics.dx:x-ghostWidth/2;
  const top=target.inside?metrics.top+target.r*metrics.dy:y-target.lift-ghostHeight/2;
  blockGhost.style.left=`${left}px`;
  blockGhost.style.top=`${top}px`;
}
$('block-tray').addEventListener('pointerdown',event=>{
  if(event.button!==0||activeGame!=='blocks'||blockGame.state!=='playing')return;
  const piece=event.target.closest('.block-piece');
  if(!piece||piece.disabled)return;
  const index=[...$('block-tray').children].indexOf(piece);
  if(index<0)return;
  blockPointer={id:event.pointerId,index,startX:event.clientX,startY:event.clientY,
    pointerType:event.pointerType||'mouse',dragging:false,hoverKey:null,target:null};
  event.preventDefault();
});
window.addEventListener('pointermove',event=>{
  if(!blockPointer||event.pointerId!==blockPointer.id)return;
  const drag=blockPointer;
  if(!drag.dragging&&Math.hypot(event.clientX-drag.startX,event.clientY-drag.startY)<7)return;
  if(!drag.dragging){
    drag.dragging=true;
    blockGame.selected=drag.index;
    blockGame.hint=null;
    blockGhost=makeBlockGhost(drag.index);
    $('block-tray').children[drag.index]?.classList.add('selected');
  }
  if(event.cancelable)event.preventDefault();
  const target=v51BlockTarget(event.clientX,event.clientY,drag.index,drag.pointerType);
  drag.target=target;
  v51DrawBlockGhost(target,event.clientX,event.clientY);
  const hover=target?.inside?{r:target.r,c:target.c}:null;
  const hoverKey=hover?`${hover.r},${hover.c},${target.valid}`:'outside';
  if(hoverKey!==drag.hoverKey){
    drag.hoverKey=hoverKey;
    blockGame.hover=hover;
    updateBlockPreview();
    const note=$('v41-block-preview-note');
    if(note && target?.inside){
      note.textContent=target.valid?'✓ 칸에 맞았어요! 여기서 손가락을 떼면 배치돼요.':'✕ 빨간 칸에는 놓을 수 없어요. 다른 자리로 움직여 보세요.';
    }
  }
});
window.addEventListener('pointerup',event=>{
  if(!blockPointer||event.pointerId!==blockPointer.id)return;
  const drag=blockPointer;blockPointer=null;
  // 화면 전환/게임 종료 중 남아 있는 포인터가 다른 게임판에 적용되지 않게 합니다.
  if(activeGame!=='blocks'||blockGame.state!=='playing'){
    clearBlockGhost();blockGame.hover=null;
    return;
  }
  // 마지막 pointermove가 생략되어도 손을 놓은 위치로 판정합니다.
  const target=v51BlockTarget(event.clientX,event.clientY,drag.index,drag.pointerType);
  clearBlockGhost();
  if(drag.dragging){
    blockSuppressClick=true;
    blockGame.selected=drag.index;
    blockGame.hover=null;
    if(target?.inside&&target.valid){placeBlock(target.r,target.c);}
    else{
      setStatus('block-status',target?.inside?'빨간 칸에는 놓을 수 없어요. 빈 공간으로 옮겨 보세요.':'블록을 게임판 위에 맞춘 뒤 손가락을 떼세요.');
      renderBlocks();
    }
    setTimeout(()=>{blockSuppressClick=false;},0);
  }else selectBlockPiece(drag.index);
});
window.addEventListener('pointercancel',()=>{
  if(!blockPointer)return;
  blockPointer=null;clearBlockGhost();blockGame.hover=null;
  if(activeGame==='blocks')updateBlockPreview();
});
// 모바일에서 앱을 전환하거나 브라우저가 포커스를 잃으면 남은 드래그 그림을 정리합니다.
function v53CancelBlockDrag(){
  if(!blockPointer&&!blockGhost)return;
  blockPointer=null;clearBlockGhost();blockGame.hover=null;
  if(activeGame==='blocks')updateBlockPreview();
}
window.addEventListener('blur',v53CancelBlockDrag);
document.addEventListener('visibilitychange',()=>{if(document.hidden)v53CancelBlockDrag();});

/* ====================== 난이도별 50단계 + 6종 통합 100라운드 ====================== */
const ARCADE_ORDER=['baseball','2048','mines','pipes','shikaku','blocks'];
const LEVEL_KEYS=['easy','normal','hard','extreme','expert'];
const BOSS_STAGES=new Set([10,20,30,40,50]);
// 각 난이도는 독립적인 50단계입니다. 종합 도전은 종전처럼 100라운드입니다.
const STAGES_PER_TIER=50,STAGE_COUNT=250,STAGES_PER_PAGE=10,MAX_SKIPS=3;
function tierIndex(tier){return Math.max(0,LEVEL_KEYS.indexOf(tier));}
function tierBase(tier){return tierIndex(tier)*STAGES_PER_TIER;}
function tierOf(index){return LEVEL_KEYS[Math.min(4,Math.floor(Math.max(0,index)/50))];}
function localStage(index){return (Math.max(0,index)%50)+1;}
function isBossStage(n){return BOSS_STAGES.has(((n-1)%50)+1);}
function isMarathonBossStage(round){return [10,25,50,75,100].includes(round);}
function stageZone(index){const tier=tierOf(index),labels={easy:'🌿 쉬움',normal:'🔷 보통',hard:'⚡ 어려움',extreme:'💜 매우 어려움',expert:'🔥 전문가'};return [labels[tier],tier];}
let stageTier='easy';
// 각 판의 실제 수행 기록으로 별을 평가합니다.
let runStats={started:Date.now(),hints:0,undos:0,misses:0,moves:0};
function resetRunStats(){runStats={started:Date.now(),hints:0,undos:0,misses:0,moves:0};}
const DIFFICULTY_IDS={baseball:'bb-difficulty','2048':'g2048-difficulty',mines:'mine-difficulty',pipes:'pipe-difficulty',shikaku:'shikaku-difficulty',blocks:'block-difficulty'};
const RESTART_ACTIONS={baseball:resetBaseball,'2048':reset2048,mines:resetMines,pipes:resetPipes,shikaku:resetShikaku,blocks:resetBlocks};
// 이전에 저장한 단계 진행도를 유지하도록 같은 저장 키를 사용합니다.
const PROGRESS_STORAGE='taekin-brain-arcade-v13-progress';
function localDateKey(){const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;}
function loadArcadeProgress(){
  try {const raw=JSON.parse(readSavedSetting(PROGRESS_STORAGE,'taein-brain-arcade-v4-progress')||'{}');
    const oldDaily=raw.daily&&typeof raw.daily==='object'?raw.daily:{};
    // 옛 버전 일일 도전 데이터는 예전 백업 파일과의 호환을 위해 읽기만 합니다.
    const records=oldDaily.records&&typeof oldDaily.records==='object'?oldDaily.records:{easy:oldDaily.done||0};
    const prior=raw.arcadeRun&&typeof raw.arcadeRun==='object'?raw.arcadeRun:{};
    return {stageVersion:raw.stageVersion||0,tierStages:raw.tierStages||{},selectedTiers:raw.selectedTiers||{},stages:raw.stages&&typeof raw.stages==='object'?raw.stages:{}, stars:raw.stars&&typeof raw.stars==='object'?raw.stars:{}, skipped:raw.skipped&&typeof raw.skipped==='object'?raw.skipped:{},
      daily:{date:oldDaily.date||localDateKey(),selected:LEVEL_KEYS.includes(oldDaily.selected)?oldDaily.selected:'easy',records:{...records}},
      arcadeRun:{round:Math.min(100,Math.max(0,Math.floor(Number(prior.round)||0))),step:Math.min(5,Math.max(0,Math.floor(Number(prior.step)||0)))}};
  }catch{return {stages:{},stars:{},skipped:{},daily:{date:localDateKey(),selected:'easy',records:{}},arcadeRun:{round:0,step:0}};}
}
// 이전 단계 구조의 기록을 난이도별 50단계 구조로 옮깁니다.
// old 1~10 쉬움 / 11~35 보통 / 36~70 어려움 / 71~90 매우 어려움 / 91~100 전문가
const LEGACY_RANGES=[[0,10],[10,35],[35,70],[70,90],[90,100]];
function legacyStageIndex(index){
  const i=Math.max(0,Math.min(99,Math.floor(Number(index)||0)));
  const tier=LEGACY_RANGES.findIndex(([,end])=>i<end);
  return tier*50+i-LEGACY_RANGES[tier][0];
}
function upgradeProgressV29(progress){
  const p=progress||{};
  p.stages ||= {};p.stars ||= {};p.skipped ||= {};
  p.selectedTiers ||= {};p.tierStages ||= {};
  if(p.stageVersion===29){
    for(const game of ARCADE_ORDER){
      p.tierStages[game] ||= {};
      for(const tier of LEVEL_KEYS)p.tierStages[game][tier]=Math.min(50,Math.max(0,Math.floor(Number(p.tierStages[game][tier])||0)));
      p.stages[game]=LEVEL_KEYS.reduce((sum,tier)=>sum+p.tierStages[game][tier],0);
      if(!LEVEL_KEYS.includes(p.selectedTiers[game]))p.selectedTiers[game]='easy';
    }
    return p;
  }
  for(const game of ARCADE_ORDER){
    const oldCount=Math.min(100,Math.max(0,Math.floor(Number(p.stages[game])||0)));
    p.tierStages[game]={};
    LEVEL_KEYS.forEach((tier,i)=>{const [start,end]=LEGACY_RANGES[i];p.tierStages[game][tier]=Math.max(0,Math.min(end,oldCount)-start);});
    p.stages[game]=oldCount;
    const newStars={};
    for(const [index,stars] of Object.entries(p.stars[game]||{})){
      const n=Number(index);if(Number.isInteger(n)&&n>=0&&n<100)newStars[legacyStageIndex(n)]=Math.max(0,Math.min(3,Math.floor(Number(stars)||0)));
    }
    p.stars[game]=newStars;
    p.skipped[game]=Array.isArray(p.skipped[game])?p.skipped[game].filter(n=>Number.isInteger(n)&&n>=0&&n<100).map(legacyStageIndex):[];
    p.selectedTiers[game]='easy';
  }
  p.stageVersion=29;
  return p;
}
let arcadeProgress=upgradeProgressV29(loadArcadeProgress());
let challenge={mode:'free',stage:-1,reported:false};
let stagePage=0;
let marathonPage=Math.min(9,Math.floor(arcadeProgress.arcadeRun.round/10));
function clampLevel(value){return Math.min(STAGE_COUNT,Math.max(0,Math.floor(Number(value)||0)));}
function completedStages(game){return LEVEL_KEYS.reduce((sum,tier)=>sum+completedTierStages(game,tier),0);}
function completedTierStages(game,tier){return Math.min(50,Math.max(0,Math.floor(Number(arcadeProgress.tierStages?.[game]?.[tier])||0)));}
function preferredTier(game){return LEVEL_KEYS.includes(arcadeProgress.selectedTiers?.[game])?arcadeProgress.selectedTiers[game]:'easy';}
function saveSelectedTier(game,tier){arcadeProgress.selectedTiers ||= {};arcadeProgress.selectedTiers[game]=tier;saveArcadeProgress();}
function skippedStages(game){return Array.isArray(arcadeProgress.skipped?.[game])?arcadeProgress.skipped[game]:[];}
function activeTierDone(game){return completedTierStages(game,stageTier);}
function selectTierAndLaunch(tier){
  if(!activeGame||!LEVEL_KEYS.includes(tier)||challenge.mode==='marathon'||challenge.mode==='demo')return;
  stageTier=tier;stagePage=0;saveSelectedTier(activeGame,tier);
  launchStage(tierBase(tier)+Math.min(49,completedTierStages(activeGame,tier)));
}
function skipCurrentStage(){
  if(!activeGame||challenge.mode!=='stage'||challenge.reported)return;
  const index=challenge.stage,used=skippedStages(activeGame),tier=tierOf(index),local=localStage(index)-1;
  const tierSkips=used.filter(i=>tierOf(i)===tier);
  if(local>=49||tierSkips.length>=MAX_SKIPS||local!==completedTierStages(activeGame,tier))return;
  if(!window.confirm(`${difficultyName(tier)} ${local+1}단계를 건너뛰고 다음 단계로 이동할까요? 별과 보상 없이 진행합니다. 난이도별 최대 ${MAX_SKIPS}회입니다.`))return;
  arcadeProgress.skipped[activeGame]=[...used,index];
  arcadeProgress.tierStages[activeGame][tier]=local+1;
  arcadeProgress.stages[activeGame]=completedStages(activeGame);
  saveArcadeProgress();renderHomeProgress();launchStage(index+1);
}
function getStageConfig(game,index){
  index=Math.max(0,Math.min(STAGE_COUNT-1,Math.floor(Number(index)||0)));
  const level=localStage(index),tier=tierOf(index),tid=tierIndex(tier),progress=(level-1)/49;
  const [zone]=stageZone(index),boss=isBossStage(index+1);
  const info={level,absoluteStage:index+1,tier,zone,boss,objective:'',tutorial:tid===0&&level<=5};
  if(game==='baseball'){
    const start=[2,3,4,6,7][tid],end=[3,4,6,7,8][tid];
    info.digits=Math.min(8,start+Math.floor(progress*(end-start+0.999)));
    info.maxAttempts=Math.max(8,[12,13,14,16,17][tid]-Math.floor(progress*3)+(info.digits-start)-(boss?1:0));
    info.objective=`${info.digits}자리 추리 · ${info.maxAttempts}번 안에 정답 맞히기`;
  }else if(game==='2048'){
    const start=[32,64,128,256,512][tid],maxPower=[7,8,9,10,11][tid];
    const targetPow=Math.min(maxPower,Math.round(Math.log2(start)+progress*(maxPower-Math.log2(start))+(boss&&level>=20?1:0)));
    info.tile=2**targetPow;
    info.score=tid===0&&level<=5?0:Math.round((tid*220+level*(7+tid*6)+level**1.35*tid*1.5)*(boss?1.18:1)/10)*10;
    info.undoLimit=Infinity;
    info.objective=`${info.tile} 블록${info.score?` + ${info.score.toLocaleString()}점`:''} · 되돌리기 무제한`;
  }else if(game==='mines'){
    const low=[4,6,8,10,12][tid],high=[6,8,11,13,16][tid];
    info.size=Math.min(16,low+Math.floor(progress*(high-low+0.99)));
    const density=[.10,.125,.15,.17,.185][tid]+progress*.02;
    info.mines=Math.max(2,Math.min(info.size*info.size-9,Math.round(info.size*info.size*density)+(boss?1:0)));
    info.timeLimit=tid===4?Math.max(900,1200-level*5):tid===3?1000:0;
    info.objective=`${info.size}×${info.size} · 지뢰 ${info.mines}개${info.timeLimit?` · 제한 ${Math.ceil(info.timeLimit/60)}분`:''}`;
  }else if(game==='pipes'){
    const low=[3,4,5,6,8][tid],high=[4,6,7,9,10][tid];
    info.size=Math.min(10,low+Math.floor(progress*(high-low+0.99))+(boss&&level>=30&&tid<=2?1:0));
    info.scramble=Math.min(.98,.19+tid*.13+progress*.23+(boss?.08:0));
    info.objective=`${info.size}×${info.size} · 모든 배관 연결 (회전 무제한)`;
  }else if(game==='shikaku'){
    const low=[3,5,7,8,10][tid],high=[6,7,9,11,12][tid];
    info.size=low+Math.floor(progress*(high-low+0.99));
    info.regions=Math.min(info.size*info.size-1,Math.round(2+tid*3+level*(.13+tid*.055)+(boss?2:0)));
    info.objective=`${info.size}×${info.size} · 직사각형 ${info.regions}개 구성`;
  }else if(game==='blocks'){
    // 후반 단계도 한 번의 무리한 대형 블록 묶음으로 막히지 않도록 목표를 조정합니다.
    // 난이도 상승은 목표 점수뿐 아니라 블록 풀·보조 블록 제공율에도 반영됩니다.
    const base=[850,920,980,1040,1100][tid];
    const perStage=[20,21,22,22,22][tid];
    info.score=Math.round((base+level*perStage)*(boss?1.06:1)/10)*10;
    info.objective=`10×10 · 목표 ${info.score.toLocaleString()}점`;
  }
  if(boss)info.objective='👑 BOSS · '+info.objective;
  return info;
}
// 100라운드 종합 도전은 별도로 유지하며 5개 난이도가 점진적으로 섞입니다.
function getMarathonStageConfig(game,round){return getStageConfig(game,Math.min(249,Math.floor(Math.max(0,round)*2.5)));}
function getActiveStageConfig(game){
  if(challenge.mode==='stage' && activeGame===game && challenge.stage>=0)return getStageConfig(game,challenge.stage);
  if(challenge.mode==='marathon' && activeGame===game && challenge.round>=0)return getMarathonStageConfig(game,challenge.round);
  if(challenge.mode==='demo' && activeGame===game)return getStageConfig(game,0);
  return null;
}
function difficultyName(key){return {easy:'쉬움',normal:'보통',hard:'어려움',extreme:'매우 어려움',expert:'전문가'}[key]||'쉬움';}
function saveArcadeProgress(){
  try{localStorage.setItem(PROGRESS_STORAGE,JSON.stringify(arcadeProgress));window.TaekinV32Save?.record(true);return true;}
  catch(error){window.TaekinV32Save?.record(false);return false;}
}
function hideVictoryOverlay(){$('clear-overlay').classList.add('hidden');}
// 개별 단계의 별은 해당 판의 플레이 내용으로 계산합니다.
function runHintCount(key){
  if(key==='baseball')return baseball.hints;
  if(key==='2048')return runStats.hints;
  if(key==='mines')return mineGame.hintCount;
  if(key==='pipes')return pipeGame.hints;
  if(key==='shikaku')return shikaku.hints;
  return blockGame.hintCount;
}
function getRunRating(key){
  const h=runHintCount(key),u=runStats.undos;
  const seconds=Math.floor((Date.now()-runStats.started)/1000);
  let excellent=false;
  if(key==='baseball')excellent=seconds>=3&&baseball.guesses.length<=Math.max(2,baseball.digits-1);
  if(key==='2048')excellent=u===0 && runStats.moves <= Math.ceil(Math.log2(game2048.target)*55);
  if(key==='mines')excellent=seconds<=Math.max(100,mineGame.size*mineGame.size*4);
  if(key==='pipes')excellent=pipeGame.rotations<=pipeGame.optimalTurns+Math.ceil(pipeGame.size*pipeGame.size*.4);
  if(key==='shikaku')excellent=u===0&&runStats.misses===0;
  if(key==='blocks')excellent=blockGame.moves<=Math.ceil(blockGame.target/50);
  const stars=h===0&&u===0&&excellent?3:h<=1&&u<=2?2:1;
  return {stars,hints:h,undos:u,seconds,excellent};
}
function getSavedStars(key,stageIndex){
  return Math.max(0,Math.min(3,Number(arcadeProgress.stars?.[key]?.[stageIndex]||0)));
}
function saveStageStars(key,index,rating){
  if(!arcadeProgress.stars)arcadeProgress.stars={};
  if(arcadeProgress.skipped?.[key])arcadeProgress.skipped[key]=arcadeProgress.skipped[key].filter(n=>n!==index);
  if(!arcadeProgress.stars[key])arcadeProgress.stars[key]={};
  arcadeProgress.stars[key][index]=Math.max(getSavedStars(key,index),rating.stars);
}
function updateStageAchievements(game){
  const root=$('stage-achievements');if(!root)return;
  const tier=stageTier,done=completedTierStages(game,tier),base=tierBase(tier),skip=new Set(skippedStages(game));
  const earned=[10,20,30,40,50].map(n=>{
    const index=base+n-1,star=getSavedStars(game,index),cleared=done>=n&&!skip.has(index);
    return `<span class="boss-medal ${cleared?'earned':'locked'}" title="${difficultyName(tier)} ${n}단계 보스">${cleared?'🏅':'🔒'} ${n} BOSS${cleared?' · '+'★'.repeat(star):''}</span>`;
  }).join('');
  const total=Array.from({length:50},(_,i)=>getSavedStars(game,base+i)).reduce((a,b)=>a+b,0);
  root.innerHTML=`<strong>🏆 ${difficultyName(tier)} 보스 메달 & 최고 별</strong><div class="boss-medals">${earned}</div><small>현재 난이도 별 ${total} / 150 · 보스 단계 10 / 20 / 30 / 40 / 50</small>`;
}
function showVictoryOverlay(key){
  const overlay=$('clear-overlay'),next=$('clear-next');
  const game=gameInfo[key].name;
  let title='🎉 게임 클리어!',desc=`${game}을(를) 성공적으로 완료했어요!`,award='오늘도 두뇌 레벨 업!';
  if(challenge.mode==='stage'){
    const n=localStage(challenge.stage),tier=tierOf(challenge.stage);
    // Master special unlock can clear stage 50 before stage 1. Only call it an
    // all-clear when all 50 stages were actually completed or officially skipped.
    const finishedCount=completedTierStages(key,tier),allCleared=n===50&&finishedCount===50;
    title=allCleared?`🏆 ${difficultyName(tier)} 50단계 올클리어!`:
      n===50?`👑 ${difficultyName(tier)} 50단계 보스 클리어!`:`🎉 ${difficultyName(tier)} ${n}단계 클리어!`;
    desc=`${game} · ${getStageConfig(key,challenge.stage).objective}`;
    award=allCleared?'이 난이도의 50개 도전을 모두 완료했어요!':
      n===50?`50단계 클리어 기록을 저장했어요. 이전 미완료 단계는 그대로 남습니다. (${finishedCount}/50)`:
      n>finishedCount?`이 단계의 별을 저장했어요. 1단계부터 이어진 진행도는 ${finishedCount}/50입니다.`:
      `✨ ${n+1}단계 해금 · ${finishedCount} / 50 완료`;
    next.textContent=n===50?'게임 선택으로':`다음 ${n+1}단계`;
  }else if(challenge.mode==='marathon'){
    const played=challenge.step+1;
    const completedRound=played===6;
    const last=completedRound&&challenge.round===99;
    title=last?'🏆 도전 모드 100라운드 완주!':completedRound?`🏅 도전 모드 ${challenge.round+1}라운드 클리어!`:`🎉 도전 모드 ${challenge.round+1}라운드 · ${played}/6 완료!`;
    desc=`${game} 성공! ${last?'100라운드의 6개 게임을 전부 클리어했어요.':completedRound?'다음 라운드로 도전할 수 있어요.':'다음 게임이 기다리고 있어요.'}`;
    award=challenge.practice?'연습 라운드 · 기존 기록은 변경되지 않습니다.':last?'6개 게임 × 100라운드 올클리어!':completedRound?`${challenge.round+2}라운드 해금!`:`다음 게임: ${gameInfo[ARCADE_ORDER[played]].name}`;
    next.textContent=last||challenge.practice&&completedRound?'메인 메뉴로':completedRound?'다음 라운드':'다음 게임';
  }else if(challenge.mode==='demo'){title=`🎉 체험 ${challenge.step+1} / 6 완료!`;desc=`${game} 체험을 성공적으로 마쳤습니다.`;award=challenge.step===5?'6개 게임 체험 완료! 일반 단계와 도전 모드도 즐겨보세요.':'다음 게임을 체험할 수 있습니다. · 기존 단계 기록은 변경되지 않습니다.';next.textContent=challenge.step===5?'메인 메뉴로':'다음 게임 체험';}else next.textContent='50단계 도전 시작';
  const rating=getRunRating(key);
  const ratingLabel=rating.stars===3?'완벽한 클리어!':rating.stars===2?'훌륭한 클리어!':'미션 성공!';
  const isBoss=challenge.mode==='stage'&&isBossStage(challenge.stage+1) || challenge.mode==='marathon'&&isMarathonBossStage(challenge.round+1);
  $('clear-stars').textContent=`${isBoss?'👑 BOSS CLEAR · ':''}${'★'.repeat(rating.stars)}${'☆'.repeat(3-rating.stars)}  ${ratingLabel} · 힌트 ${rating.hints}회 · ${rating.seconds}초`;
  overlay.classList.toggle('boss-clear',Boolean(isBoss));
  $('clear-title').textContent=title;$('clear-description').textContent=desc;
  $('clear-award').textContent=award;
  overlay.classList.remove('hidden');next.focus();
}
function renderHomeProgress(){
  renderMarathonHome();
  syncDifficultyButtons();
  document.querySelectorAll('.game-card[data-open]').forEach(card=>{
    const game=card.dataset.open;
    let badge=card.querySelector('.card-stage-progress');
    if(!badge){badge=document.createElement('small');badge.className='card-stage-progress';card.appendChild(badge);}
    const stars=Object.values(arcadeProgress.stars?.[game]||{}).reduce((sum,n)=>sum+Number(n||0),0);
    badge.textContent=`단계 ${completedStages(game)} / ${STAGE_COUNT} · ★ ${stars}${skippedStages(game).length?` · ⏭ ${skippedStages(game).length}`:''}`;
  });
}
// 개별 250단계와 별도로 진행하는 6종 통합 도전 모드 100라운드
function renderMarathonHome(){
  const p=arcadeProgress.arcadeRun;
  const finished=p.round>=100;
  $('marathon-summary').textContent=finished?'🏆 100 / 100라운드 올클리어!':`${p.round+1} / 100라운드 · ${p.step} / 6게임 완료`;
  $('marathon-start').textContent=finished?'도전 모드 완주 ✓':p.round===0&&p.step===0?'1라운드 시작 →':'이어서 도전하기 →';
  $('marathon-start').disabled=finished;
  $('marathon-progress-fill').style.width=`${p.round}%`;
  $('marathon-track').innerHTML='';
  ARCADE_ORDER.forEach((key,i)=>{
    const el=document.createElement('span');
    el.className='challenge-step'+(finished||i<p.step?' done':i===p.step?' current':'');
    el.textContent=finished||i<p.step?'✓':gameInfo[key].emoji;
    el.title=gameInfo[key].name;
    $('marathon-track').appendChild(el);
  });
  $('marathon-page-label').textContent=`${String(marathonPage*10+1).padStart(2,'0')}~${String(marathonPage*10+10).padStart(2,'0')} / 100`;
  $('marathon-page-prev').disabled=marathonPage===0;
  $('marathon-page-next').disabled=marathonPage>=9;
  $('marathon-round-buttons').innerHTML='';
  for(let i=marathonPage*10;i<marathonPage*10+10;i++){
    const btn=document.createElement('button');
    btn.type='button';btn.className='marathon-round';
    if(i<p.round)btn.classList.add('done');
    if(i===p.round&&!finished)btn.classList.add('current');
    btn.disabled=i>p.round&&!isMasterUnlocked();
    btn.textContent=i<p.round?`✓ ${i+1}`:i===p.round&&!finished?`▶ ${i+1}`:isMasterUnlocked()?`🔓 ${i+1}`:`🔒 ${i+1}`;
    btn.title=i<p.round?'완료한 라운드 연습':i===p.round?'현재 도전 가능한 라운드':'앞 라운드를 클리어하면 열립니다';
    btn.addEventListener('click',()=>launchMarathonRound(i, i!==p.round));
    $('marathon-round-buttons').appendChild(btn);
  }
}
function launchMarathonRound(round=arcadeProgress.arcadeRun.round,practice=false,practiceStep=0){
  if(round<0||round>=100)return;
  const step=practice?practiceStep:arcadeProgress.arcadeRun.step;
  const key=ARCADE_ORDER[step];
  showGame(key,false);
  challenge={mode:'marathon',round,step,reported:false,practice};
  const config=getMarathonStageConfig(key,round);
  stageTier=config.tier;$(DIFFICULTY_IDS[key]).value=config.tier;
  RESTART_ACTIONS[key]();renderStageChallenge();
}
// 모든 도전 진행도를 초기화합니다. BGM과 효과음 설정은 보존합니다.
function resetAllProgress(){
  if(!window.confirm('개별 1,500단계·별·도전 모드·미션 기록을 모두 초기화할까요? 이 작업은 되돌릴 수 없습니다.'))return;
  if(!v31FinalResetCheck('모든 진행 기록'))return;
  arcadeProgress=upgradeProgressV29({
    stages:{},stars:{},skipped:{},tierStages:{},selectedTiers:{},stageVersion:29,
    daily:{date:localDateKey(),selected:'easy',records:{}},
    arcadeRun:{round:0,step:0}
  });
  stagePage=0;
  marathonPage=0;
  if(typeof v19Saves!=='undefined'){v19Saves={};v19Playlog={};try{localStorage.removeItem(V19_STATE_KEY);localStorage.removeItem(V19_LOG_KEY);}catch(_){}}
  window.TaekinV25?.resetProgress?.();
  saveArcadeProgress();
  showHome();
}
function resetMarathonProgress(){
  if(!window.confirm('도전 모드 100라운드 기록만 초기화할까요? 개별 게임 1,500단계는 유지됩니다.'))return;
  if(!window.confirm('마지막 확인: 도전 100라운드 기록을 초기화합니다. 계속할까요?'))return;
  arcadeProgress.arcadeRun={round:0,step:0};
  saveArcadeProgress();renderHomeProgress();
}
function renderModeBanner(){
  const isRun=challenge.mode==='marathon'||challenge.mode==='demo';
  $('mode-banner').classList.toggle('hidden',!isRun);
  $('stage-details').classList.toggle('hidden',isRun);
  $('stage-quick').classList.toggle('hidden',isRun);
  $('v41-tier-fold')?.classList.toggle('hidden',isRun);
  if(!isRun)return;
  const progress=challenge.step;
  $('mode-caption').textContent=challenge.mode==='demo'?'🎮 EXPERIENCE TOUR · 6종 체험 모드':'🏆 ARCADE CHALLENGE · 도전 모드';
  $('mode-title').textContent=challenge.mode==='demo'?`게임 체험 ${challenge.step+1} / 6`:`${challenge.round+1}/100 라운드 · ${challenge.practice?'복습':'6종 연속 도전'}`;
  $('mode-target').textContent=challenge.mode==='demo'?`현재 체험: ${gameInfo[activeGame].name} · 쉬운 연습 문제 · 단계 기록 별도`:`현재 게임: ${gameInfo[activeGame].name} · 이번 라운드 목표: ${getMarathonStageConfig(activeGame,challenge.round).objective}`;
  $('mode-steps').innerHTML='';
  ARCADE_ORDER.forEach((key,i)=>{
    const chip=document.createElement('span');
    chip.className='mode-step'+(i<progress?' done':i===progress?' current':'');
    chip.textContent=`${i<progress?'✓':gameInfo[key].emoji} ${gameInfo[key].name}`;
    $('mode-steps').appendChild(chip);
  });
}
function renderRulesForChallenge(){
  if(!activeGame)return;
  const info=gameInfo[activeGame];
  const cfg=getActiveStageConfig(activeGame);
  let rules=[...info.rules];
  if(cfg){
    rules.push('⭐ 클리어 시 1~3성 평가 · 힌트 없이 좋은 기록으로 해결하면 3성! 보스는 난이도별 10·20·30·40·50단계에 등장합니다.');
    // 고정 4단계 난이도 설명 대신 현재 난이도 1~50단계의 실제 목표 표시
    if(['baseball','mines','pipes','shikaku'].includes(activeGame))rules=rules.slice(1);
    if(activeGame==='2048')rules=rules.filter((_,i)=>i!==4);
    rules.unshift(`<strong>${challenge.mode==='marathon'?`도전 모드 ${challenge.round+1}라운드`:challenge.mode==='demo'?'체험 모드':`현재 ${cfg.level}단계`} 미션:</strong> ${cfg.objective}`);
    $('active-description').textContent=`${info.description} · 이번 목표: ${cfg.objective}`;
  }else { $('active-description').textContent=info.description; if($(DIFFICULTY_IDS[activeGame]).value==='expert') rules.unshift('<strong>🔥 전문가 자유 모드:</strong> 더 넓은 게임판과 까다로운 목표가 등장합니다. 파이프의 회전 횟수는 무제한입니다.'); }
  $('rules-content').innerHTML='<ol>'+rules.map(rule=>`<li>${rule}</li>`).join('')+'</ol>';
}
function renderStageChallenge(){
  if(!activeGame)return;
  const tier=stageTier,base=tierBase(tier),done=completedTierStages(activeGame,tier),quickCfg=getActiveStageConfig(activeGame),skips=skippedStages(activeGame).filter(n=>tierOf(n)===tier);
  const isRun=challenge.mode==='marathon'||challenge.mode==='demo';
  $('v29-tier-switch')?.classList.toggle('hidden',isRun);
  document.querySelectorAll('#v29-tier-switch button[data-tier]').forEach(button=>{
    const k=button.dataset.tier;button.classList.toggle('active',k===tier);button.setAttribute('aria-pressed',String(k===tier));
    const count=completedTierStages(activeGame,k);const counter=button.querySelector('small');if(counter)counter.textContent=`${count}/50`;
  });
  $('stage-quick-name').textContent=challenge.mode==='stage'?`🏆 ${difficultyName(tier)} · ${localStage(challenge.stage)} / 50단계${quickCfg?.boss?' · 👑 BOSS':''}`:challenge.mode==='demo'?'🎓 체험 모드':'🎮 자유 플레이';
  $('stage-quick-goal').textContent=quickCfg?.objective||`${difficultyName(tier)} · 원하는 난이도를 선택하고 1~50단계에 도전하세요.`;
  $('skip-stage').classList.toggle('hidden',challenge.mode!=='stage');
  $('skip-stage').textContent=`현재 단계 건너뛰기 (남은 ${MAX_SKIPS-skips.length}/${MAX_SKIPS}회)`;
  $('skip-stage').disabled=challenge.mode!=='stage'||skips.length>=MAX_SKIPS||challenge.reported||localStage(challenge.stage)-1!==done||done>=49;
  $('stage-progress-label').textContent=`${difficultyName(tier)} ${done}/50 클리어 · 건너뜀 ${skips.length}회`;
  $('stage-progress-fill').style.width=`${done/50*100}%`;
  $('stage-page-label').textContent=`${String(stagePage*10+1).padStart(2,'0')}~${String(stagePage*10+10).padStart(2,'0')} / 50`;
  $('stage-page-prev').disabled=stagePage===0;
  $('stage-page-next').disabled=stagePage===4;
  const wrapper=$('stage-buttons');wrapper.replaceChildren();
  for(let i=stagePage*10;i<stagePage*10+10;i++){
    const absolute=base+i,stars=getSavedStars(activeGame,absolute),skipped=skips.includes(absolute),boss=isBossStage(absolute+1);
    const b=document.createElement('button');b.type='button';b.className='stage-btn';
    if(i<done&&!skipped)b.classList.add('cleared');
    if(skipped)b.classList.add('skipped');
    if(i<5&&tier==='easy')b.classList.add('tutorial');
    if(challenge.mode==='stage'&&challenge.stage===absolute)b.classList.add('active');
    if(i>done&&!isMasterUnlocked())b.classList.add('locked');
    if(boss)b.classList.add('boss-stage');
    if(tier==='expert')b.classList.add('expert-stage');
    b.disabled=i>done&&!isMasterUnlocked();
    b.textContent=(boss?'👑 ':skipped?'⏭ ':i<done?'✓ ':i>done?(isMasterUnlocked()?'🔓 ':'🔒 '):'')+String(i+1).padStart(2,'0')+(stars?' '+'★'.repeat(stars):'');
    b.title=boss?`${difficultyName(tier)} ${i+1}단계 보스`:`${difficultyName(tier)} ${i+1}단계`;
    b.addEventListener('click',()=>launchStage(absolute));wrapper.appendChild(b);
  }
  $('stage-zone').textContent=`${difficultyName(tier)} · 독립 50단계 · 보스 10/20/30/40/50 · 별 3개`;
  updateStageAchievements(activeGame);
  const status=$('challenge-mode-status');
  if(challenge.mode==='demo')status.textContent=`🎓 체험 모드 ${challenge.step+1}/6`;
  else if(challenge.mode==='marathon')status.textContent=`🏆 종합 도전 ${challenge.round+1}/100라운드 · ${challenge.step+1}/6게임`;
  else if(challenge.mode==='stage')status.textContent=`🏆 ${gameInfo[activeGame].name} · ${difficultyName(tier)} ${localStage(challenge.stage)}/50단계${challenge.reported?' · 다음 단계 해금!':''}`;
  else status.textContent=`자유 플레이 중 · 위 난이도를 선택하면 해당 난이도의 50단계 도전에 참여할 수 있습니다.`;
  const cfg=getActiveStageConfig(activeGame);
  $('stage-goal-info').textContent=cfg?`${cfg.tutorial?'🌱 연습 · ':'🎯 목표 · '}${difficultyName(cfg.tier)} ${cfg.level}단계: ${cfg.objective}`:
    `🎮 자유 모드입니다. 단계별 기록은 각 난이도의 50단계 도전에서 저장됩니다.`;
  renderRulesForChallenge();
  $('play-screen').classList.toggle('stage-play-mode',challenge.mode==='stage');
  renderModeBanner();
  $(DIFFICULTY_IDS[activeGame]).disabled=isRun;
  syncDifficultyButtons();
  $('challenge-next').classList.add('hidden');
  if(challenge.reported){
    $('challenge-next').classList.remove('hidden');
    $('challenge-next').textContent=challenge.mode==='demo'?(challenge.step>=5?'메인 메뉴':'다음 체험 게임'):challenge.mode==='marathon'?(challenge.step>=5?'다음 라운드':'다음 게임'):
      challenge.mode==='stage'&&localStage(challenge.stage)<50?'다음 단계로':'게임 컬렉션으로';
  }
}
function stopChallengeMode(){challenge={mode:'free',stage:-1,reported:false};hideVictoryOverlay();renderStageChallenge();}
function launchStage(index){
  if(!activeGame||index<0||index>=STAGE_COUNT)return;
  const tier=tierOf(index),local=localStage(index)-1;
  if(local>completedTierStages(activeGame,tier)&&!isMasterUnlocked())return;
  hideVictoryOverlay();
  stageTier=tier;saveSelectedTier(activeGame,tier);
  challenge={mode:'stage',stage:index,reported:false};
  stagePage=Math.floor(local/10);
  $(DIFFICULTY_IDS[activeGame]).value=tier;
  RESTART_ACTIONS[activeGame]();renderStageChallenge();
  v41ScheduleBoardFocus();
}
function setStagePage(delta){stagePage=Math.max(0,Math.min(4,stagePage+delta));renderStageChallenge();}
function startFreePlay(){
  if(!activeGame)return;
  hideVictoryOverlay();
  challenge={mode:'free',stage:-1,reported:false};
  $(DIFFICULTY_IDS[activeGame]).disabled=false;
  RESTART_ACTIONS[activeGame]();
  renderStageChallenge();
}
function reportGameWin(key){
  if(activeGame!==key||challenge.reported)return;
  if(challenge.mode==='stage'){
    saveStageStars(key,challenge.stage,getRunRating(key));
    const tier=tierOf(challenge.stage);
    // The master unlock permits selecting a future stage, but it must not mark
    // all unplayed earlier stages as completed. Count only a contiguous prefix;
    // preserve any previously cleared/skipped steps and earned stars.
    const base=tierBase(tier), skipped=new Set(skippedStages(key));
    let contiguous=completedTierStages(key,tier);
    while(contiguous<STAGES_PER_TIER &&
      (getSavedStars(key,base+contiguous)>0||skipped.has(base+contiguous)))contiguous++;
    arcadeProgress.tierStages[key][tier]=contiguous;
    arcadeProgress.stages[key]=completedStages(key);
    saveArcadeProgress();renderHomeProgress();
  } else if(challenge.mode==='marathon'){
    if(!challenge.practice){
      const p=arcadeProgress.arcadeRun;
      if(p.round!==challenge.round||p.step!==challenge.step||ARCADE_ORDER[p.step]!==key)return;
      if(p.step>=5){p.round++;p.step=0;}else p.step++;
      saveArcadeProgress();renderHomeProgress();
    }
  }
  challenge.reported=true;
  v19RecordWin(key);
  const isBigWin = (challenge.mode==='stage' && isBossStage(challenge.stage+1)) || (challenge.mode==='marathon' && isMarathonBossStage(challenge.round+1) && challenge.step===5) || (challenge.mode==='stage' && challenge.stage===STAGE_COUNT-1)
    || (challenge.mode==='marathon' && challenge.round===99 && challenge.step>=5);
  playSfx(isBigWin ? 'grand' : 'win');
  renderStageChallenge();
  showVictoryOverlay(key);
}
function advanceChallenge(){
  if(!challenge.reported)return;
  hideVictoryOverlay();
  if(challenge.mode==='demo'){if(challenge.step>=5)showHome();else v19LaunchDemo(challenge.step+1);return;}
  if(challenge.mode==='marathon'){
    if(challenge.practice){
      if(challenge.step>=5)showHome();else launchMarathonRound(challenge.round,true,challenge.step+1);
    }else if(arcadeProgress.arcadeRun.round>=100)showHome();
    else launchMarathonRound();
  }else if(challenge.mode==='stage'){
    if(localStage(challenge.stage)>=50)showHome();else launchStage(challenge.stage+1);
  }else selectTierAndLaunch(stageTier);
}
// 선택한 난이도의 50단계 기록만 초기화합니다. 도전 모드 라운드는 유지됩니다.
function resetAllStageProgress(){
  if(!window.confirm('6개 게임의 모든 난이도 1,500단계와 별 기록을 초기화할까요? 종합 도전 100라운드는 유지됩니다.'))return;
  if(!v31FinalResetCheck('전체 단계 및 별 기록'))return;
  arcadeProgress.stages={};arcadeProgress.tierStages={};arcadeProgress.stars={};arcadeProgress.skipped={};
  upgradeProgressV29(arcadeProgress);
  saveArcadeProgress();showHome();renderHomeProgress();
}
function resetCurrentStageProgress(){
  if(!activeGame)return;
  const key=activeGame,tier=stageTier,base=tierBase(tier);
  if(!window.confirm(`${gameInfo[key].name}의 ${difficultyName(tier)} 50단계 기록만 초기화할까요? 다른 난이도는 유지됩니다.`))return;
  if(!window.confirm('마지막 확인: 선택한 난이도의 50단계 기록을 지웁니다. 계속할까요?'))return;
  arcadeProgress.tierStages[key][tier]=0;
  arcadeProgress.stages[key]=completedStages(key);
  for(let i=base;i<base+50;i++)delete arcadeProgress.stars?.[key]?.[i];
  if(arcadeProgress.skipped?.[key])arcadeProgress.skipped[key]=arcadeProgress.skipped[key].filter(i=>tierOf(i)!==tier);
  saveArcadeProgress();renderHomeProgress();launchStage(base);
}
/* ====================== 버튼 / 이벤트 ====================== */
$('stage-open-button').addEventListener('click',()=>{
  const details=$('stage-details');
  details.open=!details.open;
  if(details.open)details.scrollIntoView({block:'start',behavior:'smooth'});
});
$('block-difficulty').addEventListener('change',()=>selectTierAndLaunch($('block-difficulty').value));
$("block-reset").addEventListener("click", resetBlocks);
$("block-hint").addEventListener("click", blockHint);
$("block-undo").addEventListener("click", undoBlocks);
$("skip-stage").addEventListener("click",skipCurrentStage);
$("reset-all-progress").addEventListener("click",resetAllProgress);
$("marathon-start").addEventListener("click",()=>launchMarathonRound());
$("marathon-reset").addEventListener("click",resetMarathonProgress);
$("marathon-page-prev").addEventListener("click",()=>{marathonPage=Math.max(0,marathonPage-1);renderMarathonHome();});
$("marathon-page-next").addEventListener("click",()=>{marathonPage=Math.min(9,marathonPage+1);renderMarathonHome();});
$("reset-all-stages").addEventListener("click",resetAllStageProgress);
$("reset-current-stages").addEventListener("click",resetCurrentStageProgress);
$("challenge-free").addEventListener("click",startFreePlay);
$("stage-page-prev").addEventListener("click",()=>setStagePage(-1));
$("stage-page-next").addEventListener("click",()=>setStagePage(1));
$("clear-next").addEventListener("click", advanceChallenge);
$("clear-home").addEventListener("click", showHome);
$("challenge-next").addEventListener("click", advanceChallenge);

document.querySelectorAll("[data-open]").forEach((button) => button.addEventListener("click", () => showGame(button.dataset.open)));
$("back-to-home").addEventListener("click", showHome);
$("header-back").addEventListener("click", showHome);
$("brand-home").addEventListener("click", showHome);
$("bb-form").addEventListener("submit", submitBaseball);
$('bb-difficulty').addEventListener('change',()=>selectTierAndLaunch($('bb-difficulty').value));
$("bb-reset").addEventListener("click", resetBaseball);
$("bb-answer").addEventListener("click", revealBaseballAnswer);
$("bb-hint").addEventListener("click", hintBaseball);
$("g2048-reset").addEventListener("click", reset2048);
$('g2048-difficulty').addEventListener('change',()=>selectTierAndLaunch($('g2048-difficulty').value));
$("g2048-undo").addEventListener("click", undo2048);
$("g2048-hint").addEventListener("click", hint2048);
document.querySelectorAll("[data-move]").forEach((button) => {
  button.addEventListener("click", () => move2048(button.dataset.move));
  const pressOn=()=>button.classList.add("pressed");
  const pressOff=()=>button.classList.remove("pressed");
  button.addEventListener("pointerdown", pressOn);
  button.addEventListener("pointerup", pressOff);
  button.addEventListener("pointerleave", pressOff);
  button.addEventListener("pointercancel", pressOff);
});
$('mine-difficulty').addEventListener('change',()=>selectTierAndLaunch($('mine-difficulty').value));
$("mine-reset").addEventListener("click", resetMines);
$("mine-hint").addEventListener("click", hintMines);
$("mine-mode-open").addEventListener("click", () => { mineGame.mode = "open"; syncMineMode(); });
$("mine-mode-flag").addEventListener("click", () => { mineGame.mode = "flag"; syncMineMode(); });
$("pipe-check").addEventListener("click", checkPipes);
$("pipe-hint").addEventListener("click", hintPipes);
$("pipe-undo").addEventListener("click", undoPipeTurn);
$("pipe-direction").addEventListener("click", togglePipeDirection);
$('pipe-difficulty').addEventListener('change',()=>selectTierAndLaunch($('pipe-difficulty').value));
$("pipe-reset").addEventListener("click", resetPipes);
$('shikaku-difficulty').addEventListener('change',()=>selectTierAndLaunch($('shikaku-difficulty').value));
$("shikaku-reset").addEventListener("click", resetShikaku);
$("shikaku-undo").addEventListener("click", shikakuUndo);
$("shikaku-hint").addEventListener("click", shikakuHint);
$("shikaku-clear").addEventListener("click", shikakuClear);
$("shikaku-erase").addEventListener("click", toggleShikakuEraser);

// 마우스 클릭 2회 / 드래그 / 터치 드래그 방식 모두 지원
$("shikaku-board").addEventListener("pointerdown", (event) => {
  if (event.button !== 0 || shikaku.finished) return;
  const cell = event.target.closest(".shikaku-cell");
  if (!cell) return;
  event.preventDefault();
  if(shikaku.eraser){shikakuEraseRegion(Number(cell.dataset.row),Number(cell.dataset.col));return;}
  const start = { r: Number(cell.dataset.row), c: Number(cell.dataset.col) };
  shikaku.dragging = { pointer: event.pointerId, start, last: start, moved: false };
});
document.addEventListener("pointermove", (event) => {
  const drag = shikaku.dragging;
  if (!drag || drag.pointer !== event.pointerId || activeGame !== "shikaku") return;
  // 터치 드래그 도중 브라우저 기본 스크롤·텍스트 선택을 막습니다.
  if(event.cancelable)event.preventDefault();
  const coord = shikakuCellFromPoint(event.clientX, event.clientY);
  if (!coord) return;
  drag.last = coord;
  if (drag.start.r !== coord.r || drag.start.c !== coord.c) {
    drag.moved = true;
    shikaku.preview = normalizeRect(drag.start, coord);
    refreshShikakuPreview();
  }
});
document.addEventListener("pointerup", (event) => {
  const drag = shikaku.dragging;
  if (!drag || drag.pointer !== event.pointerId) return;
  shikaku.dragging = null;
  // 터치 기기는 마지막 pointermove를 합치거나 건너뛸 수 있습니다.
  // 실제로 손을 뗀 칸을 우선 사용하여 빠른 드래그의 끝점 누락을 막습니다.
  // 판 밖에서 놓았다면 마지막으로 지나간 유효 칸을 유지합니다.
  const released = shikakuCellFromPoint(event.clientX, event.clientY);
  const end = released || drag.last;
  if (drag.moved || end.r !== drag.start.r || end.c !== drag.start.c) {
    shikakuCommit(normalizeRect(drag.start, end));
  } else handleShikakuClick(drag.start);
});
document.addEventListener("pointercancel", () => { shikaku.dragging = null; shikaku.preview = null; if (activeGame === "shikaku") refreshShikakuPreview(); });
$("shikaku-board").addEventListener("click", (event) => {
  // 키보드 Enter/Space로 만든 클릭만 처리 (마우스는 pointerup에서 처리)
  if (event.detail !== 0 || shikaku.finished) return;
  const cell = event.target.closest(".shikaku-cell");
  if (cell) handleShikakuClick({ r: Number(cell.dataset.row), c: Number(cell.dataset.col) });
});

// 2048 키 입력은 2048 화면일 때만 적용
window.addEventListener("keydown", (event) => {
  if (activeGame !== "2048" || v19Paused || event.altKey || event.ctrlKey || event.metaKey) return;
  if (event.target?.closest('input,select,textarea,[contenteditable="true"]')) return;
  const key = event.key.toLowerCase();
  const directions = { arrowup: "up", w: "up", arrowdown: "down", s: "down", arrowleft: "left", a: "left", arrowright: "right", d: "right" };
  if (directions[key]) { event.preventDefault(); move2048(directions[key]); }
  else if (key === "u") { event.preventDefault(); undo2048(); }
});

/* ====================== 난이도 직접 선택 + BGM ====================== */
const DIFFICULTY_LABELS={easy:'쉬움',normal:'보통',hard:'어려움',extreme:'매우 어려움',expert:'전문가'};
function buildDifficultyButtons(){
  const selects=Object.values(DIFFICULTY_IDS).map(id=>$(id));
  selects.forEach(select=>{
    select.classList.add('difficulty-select-enhanced');
    const group=document.createElement('div');
    group.className='difficulty-buttons';
    group.setAttribute('role','group');
    group.setAttribute('aria-label',select.getAttribute('aria-label')||'난이도 선택');
    LEVEL_KEYS.forEach(level=>{
      const button=document.createElement('button');
      button.type='button';button.dataset.level=level;
      button.textContent=DIFFICULTY_LABELS[level];
      button.setAttribute('aria-pressed','false');
      button.title=`${DIFFICULTY_LABELS[level]} 난이도 바로 선택`;
      button.addEventListener('click',()=>{
        if(select.disabled)return;
        select.value=level;
        select.dispatchEvent(new Event('change',{bubbles:true}));
        syncDifficultyButtons();
      });
      group.appendChild(button);
    });
    select.insertAdjacentElement('afterend',group);
  });
  syncDifficultyButtons();
}
function syncDifficultyButtons(){
  document.querySelectorAll('.difficulty-select-enhanced').forEach(select=>{
    const group=select.nextElementSibling;
    if(!group||!group.classList.contains('difficulty-buttons'))return;
    group.querySelectorAll('button').forEach(btn=>{
      const selected=btn.dataset.level===select.value;
      btn.classList.toggle('selected',selected);
      btn.setAttribute('aria-pressed',String(selected));
      btn.disabled=select.disabled;
    });
  });
}
// 오리지널 BGM 선택: 기록 및 게임 진행 상태와 별도로 유지
const BGM_TRACKS={
  arcade_classic:{name:'기본 아케이드',file:"assets/arcade_bgm.mp3",mood:'기존 아케이드 BGM'},
  neon_drive:{name:'네온 드라이브',file:"assets/neon_drive.mp3",mood:'경쾌한 신스웨이브'},
  pixel_jump:{name:'픽셀 점프',file:"assets/pixel_jump.mp3",mood:'통통 튀는 8비트'},
  focus_flow:{name:'집중 모드',file:"assets/focus_flow.mp3",mood:'차분한 로파이·피아노'},
  mystic_maze:{name:'미스터리 퍼즐',file:"assets/mystic_maze.mp3",mood:'몽환적인 추리 분위기'},
  space_lounge:{name:'스페이스 라운지',file:"assets/space_lounge.mp3",mood:'반짝이는 우주 감성'}
};
const musicAudio=$('arcade-bgm');
const musicToggle=$('music-toggle');
const musicVolume=$('music-volume');
const musicTrack=$('music-track');
const musicStatus=$('music-status');
const BGM_STORAGE='taekin_arcade_bgm_v13';
function readMusicSettings(){
  try {return JSON.parse(readSavedSetting(BGM_STORAGE,'taein_arcade_bgm_v8'))||{};}catch{return {};}
}
function saveMusicSettings(){
  try{localStorage.setItem(BGM_STORAGE,JSON.stringify({track:musicTrack.value,volume:Number(musicVolume.value)}));window.TaekinV32Save?.record(true);}catch{window.TaekinV32Save?.record(false);}
}
const savedMusic=readMusicSettings();
const initialTrack=BGM_TRACKS[savedMusic.track]?savedMusic.track:'arcade_classic';
const initialVolume=Number.isFinite(Number(savedMusic.volume))?Math.max(0,Math.min(100,Number(savedMusic.volume))):35;
musicTrack.value=initialTrack;
musicVolume.value=String(initialVolume);
musicAudio.volume=initialVolume/100;
musicAudio.src=BGM_TRACKS[initialTrack].file;
musicAudio.loop=true;
function setMusicToggleUI(on){
  musicToggle.textContent=on?'♫ 음악 끄기':'♪ 음악 켜기';
  musicToggle.setAttribute('aria-pressed',String(on));
}
function updateMusicStatus(message){
  musicStatus.textContent=message;
  musicTrack.title=BGM_TRACKS[musicTrack.value].mood;
}
updateMusicStatus('선택한 배경음악: '+BGM_TRACKS[initialTrack].name);
let bgmSwitchSequence=0;
musicToggle.addEventListener('click',async()=>{
  if(!musicAudio.paused){
    bgmSwitchSequence++;
    musicAudio.pause();setMusicToggleUI(false);
    updateMusicStatus('음악 일시 정지 · '+BGM_TRACKS[musicTrack.value].name);
    return;
  }
  const seq=++bgmSwitchSequence;
  try{
    await musicAudio.play();
    if(seq!==bgmSwitchSequence)return;
    setMusicToggleUI(true);
    updateMusicStatus('재생 중 · '+BGM_TRACKS[musicTrack.value].name);
  }catch{
    if(seq!==bgmSwitchSequence)return;
    setMusicToggleUI(false);
    updateMusicStatus('음악을 재생할 수 없습니다. assets 폴더를 확인하세요.');
  }
});
musicTrack.addEventListener('change',async()=>{
  const seq=++bgmSwitchSequence;
  const name=musicTrack.value;
  if(!BGM_TRACKS[name])return;
  const wasPlaying=!musicAudio.paused;
  musicAudio.pause();
  musicAudio.src=BGM_TRACKS[name].file;
  musicAudio.load();
  saveMusicSettings();
  updateMusicStatus('선택한 배경음악: '+BGM_TRACKS[name].name+' ('+BGM_TRACKS[name].mood+')');
  if(wasPlaying){
    try{
      await musicAudio.play();
      if(seq!==bgmSwitchSequence)return;
      setMusicToggleUI(true);
      updateMusicStatus('재생 중 · '+BGM_TRACKS[name].name);
    }catch{
      if(seq!==bgmSwitchSequence)return;
      setMusicToggleUI(false);
      updateMusicStatus('곡 전환 실패: assets 폴더의 음원 파일을 확인하세요.');
    }
  }else{setMusicToggleUI(false);}
});
musicVolume.addEventListener('input',()=>{
  musicAudio.volume=Number(musicVolume.value)/100;
  saveMusicSettings();
});
musicAudio.addEventListener('error',()=>{
  updateMusicStatus('음원 파일을 찾을 수 없습니다: '+BGM_TRACKS[musicTrack.value].name);
});

// =========================================================
// BGM 곡 선택 UI: 공통 재생 엔진을 사용합니다.
// =========================================================
const MUSIC_VISUALS={
  arcade_classic:{icon:'🎮',color:'#93a7ff',desc:'익숙한 게임센터 감성 · 편안한 아케이드'},
  neon_drive:{icon:'🌃',color:'#f18cdb',desc:'빠른 비트와 신나는 네온 신스'},
  pixel_jump:{icon:'🕹️',color:'#75dfb1',desc:'통통 튀는 레트로 8비트'},
  focus_flow:{icon:'🌙',color:'#7eb4ff',desc:'조용하게 집중하는 퍼즐 시간'},
  mystic_maze:{icon:'🧩',color:'#b69aff',desc:'신비롭고 몽환적인 추리 분위기'},
  space_lounge:{icon:'✨',color:'#f3c985',desc:'은은하게 반짝이는 우주 사운드'}
};
const musicPickerButton=$('music-picker-button');
const musicPicker=$('music-picker');
const musicMenu=$('music-track-menu');
const musicOptions=$('music-track-options');
const musicCurrentIcon=$('music-current-icon');
const musicCurrentName=$('music-current-name');
const musicCurrentSub=$('music-current-sub');
function closeMusicMenu(returnFocus=false){
  if(musicMenu.open)musicMenu.close();
  musicMenu.hidden=true;
  musicPickerButton.setAttribute('aria-expanded','false');
  if(returnFocus)musicPickerButton.focus({preventScroll:true});
}
function openMusicMenu(){
  musicMenu.hidden=false;
  musicPickerButton.setAttribute('aria-expanded','true');
  if(!musicMenu.open)musicMenu.showModal();
  const selected=musicOptions.querySelector('[aria-selected="true"]');
  (selected||$('v50-music-close')).focus({preventScroll:true});
}
function syncMusicPicker(){
  const id=musicTrack.value;
  const visual=MUSIC_VISUALS[id]||MUSIC_VISUALS.arcade_classic;
  const track=BGM_TRACKS[id]||BGM_TRACKS.arcade_classic;
  const isPlaying=!musicAudio.paused;
  musicCurrentIcon.textContent=visual.icon;
  musicCurrentName.textContent=track.name;
  musicCurrentSub.textContent=isPlaying?'● 재생 중':'누르면 곡 선택';
  $('v50-music-active').textContent='현재 선택: '+track.name;
  musicPickerButton.setAttribute('aria-label','배경음악 선택: '+track.name+'. 목록 열기');
  for(const option of musicOptions.querySelectorAll('.music-track-item')){
    const selected=option.dataset.track===id;
    option.setAttribute('aria-selected',String(selected));
    option.classList.toggle('is-playing',selected&&isPlaying);
    const status=option.querySelector('.music-track-state');
    if(status){status.innerHTML=selected?'<span class="music-selected-indicator"><span class="music-mini-bars" aria-hidden="true"><i></i><i></i><i></i></span><span>'+(isPlaying?'재생 중':'선택됨')+'</span></span>':'';}
  }
}
for(const [id,track] of Object.entries(BGM_TRACKS)){
  const v=MUSIC_VISUALS[id]||MUSIC_VISUALS.arcade_classic;
  const option=document.createElement('button');
  option.type='button';
  option.className='music-track-item';
  option.dataset.track=id;
  option.setAttribute('role','option');
  option.setAttribute('aria-selected',String(musicTrack.value===id));
  option.style.setProperty('--track-color',v.color);
  // 이름·설명은 앱 내부에 정의한 고정 문자열만 사용
  option.innerHTML='<span class="music-track-art" aria-hidden="true">'+v.icon+'</span>'+
    '<span class="music-track-meta"><span class="music-track-name">'+track.name+'</span>'+
    '<span class="music-track-description">'+v.desc+'</span></span>'+
    '<span class="music-track-state"></span>';
  option.addEventListener('click',()=>{
    if(musicTrack.value!==id){
      musicTrack.value=id;
      musicTrack.dispatchEvent(new Event('change',{bubbles:true}));
    }
    closeMusicMenu(true);
    syncMusicPicker();
  });
  musicOptions.appendChild(option);
}
musicPickerButton.addEventListener('click',()=>musicMenu.open?closeMusicMenu(true):openMusicMenu());
$('v50-music-close').addEventListener('click',()=>closeMusicMenu(true));
musicMenu.addEventListener('cancel',event=>{event.preventDefault();closeMusicMenu(true);});
musicMenu.addEventListener('click',event=>{if(event.target===musicMenu)closeMusicMenu(true);});
document.addEventListener('pointerdown',event=>{
  if(!musicMenu.hidden&&!musicPicker.contains(event.target))closeMusicMenu();
});
document.addEventListener('keydown',event=>{
  if(musicMenu.hidden)return;
  if(event.key==='Escape'){event.preventDefault();closeMusicMenu(true);return;}
  if(event.key==='ArrowDown'||event.key==='ArrowUp'){
    const all=Array.from(musicOptions.querySelectorAll('.music-track-item'));
    const index=all.indexOf(document.activeElement);
    const shift=event.key==='ArrowDown'?1:-1;
    all[(index+shift+all.length)%all.length].focus();
    event.preventDefault();
  }
});
musicTrack.addEventListener('change',syncMusicPicker);
musicAudio.addEventListener('play',syncMusicPicker);
musicAudio.addEventListener('pause',syncMusicPicker);
musicAudio.addEventListener('ended',syncMusicPicker);
syncMusicPicker();

$('audio-settings-toggle').addEventListener('click',()=>{
  const panel=$('audio-settings');
  const opened=panel.classList.toggle('expanded');
  $('audio-settings-toggle').setAttribute('aria-expanded',String(opened));
});
buildDifficultyButtons();
// 초기 상태에서는 메인 메뉴만 표시
showHome();
renderHomeProgress();


/* ======================= 홈 소개 슬라이드 ======================= */
const HERO_SHOWS=[
  {key:null,tag:'WELCOME TO TAEKIN BRAIN ARCADE',name:'여섯 가지',accent:'두뇌 퍼즐 게임',desc:'추리부터 전략까지, 여섯 가지 퍼즐을 한곳에서 즐겨보세요. 게임을 선택해 바로 시작할 수 있습니다.',chip:'6개 게임 · 난이도별 50단계 · 도전 모드',theme:'intro',icon:'🎮',cta:'게임 모아보기'},
  {key:'baseball',tag:'01 / 06 · NUMBER BASEBALL',name:'숫자를 추리하는',accent:'숫자야구',desc:'스트라이크와 볼을 단서로 숨겨진 숫자를 찾아보세요. 단계마다 자릿수와 시도 횟수가 달라집니다.',chip:'추리 · 250단계 · 정답 힌트',theme:'baseball',icon:'⚾',cta:'숫자야구 시작하기'},
  {key:'2048',tag:'02 / 06 · 2048',name:'합치고 또 합치는',accent:'2048',desc:'숫자 타일을 밀어 같은 수를 합치세요. 높은 단계에서는 목표 타일과 이동 전략이 중요해집니다.',chip:'전략 · 방향키 조작 · 점수 기록',theme:'2048',icon:'🔢',cta:'2048 시작하기'},
  {key:'mines',tag:'03 / 06 · MINESWEEPER',name:'안전한 칸을 찾는',accent:'지뢰찾기',desc:'주변 숫자를 읽고 안전한 칸을 찾아보세요. 깃발과 힌트로 폭탄을 피하며 클리어해 보세요.',chip:'논리 · 깃발 · 난이도 5종',theme:'mines',icon:'💣',cta:'지뢰찾기 시작하기'},
  {key:'pipes',tag:'04 / 06 · PIPE CONNECT',name:'물길을 완성하는',accent:'파이프 연결',desc:'파이프를 90도씩 돌려 모든 배관을 이어 보세요. 시작점에서 파란 물길이 이어지는 퍼즐입니다.',chip:'공간 지각 · 회전 · 물 흐름',theme:'pipes',icon:'🔧',cta:'파이프 연결 시작하기'},
  {key:'shikaku',tag:'05 / 06 · SHIKAKU',name:'영역을 나누는',accent:'시카쿠',desc:'숫자 넓이에 맞는 직사각형을 그려 게임판 전체를 덮으세요. 영역 선택과 공간 추론이 핵심입니다.',chip:'공간 추리 · 드래그 · 영역 힌트',theme:'shikaku',icon:'🧩',cta:'시카쿠 시작하기'},
  {key:'blocks',tag:'06 / 06 · BLOCK PUZZLE',name:'한 줄을 완성하는',accent:'블록 퍼즐',desc:'세 개의 블록을 잘 배치해 가로·세로 줄을 완성하세요. 연속 제거로 더 높은 점수를 노려보세요.',chip:'배치 전략 · 콤보 · 목표 점수',theme:'blocks',icon:'🧱',cta:'블록 퍼즐 시작하기'}
];
const heroRoot=$('hero-carousel');
let heroIndex=0,heroTimer=null,heroPaused=false;
function heroArtSlide(slide){
  const frame=(content,label)=>`<div class="hero-device"><div class="hero-device-head"><span class="hero-device-symbol">● <b>●</b> ●</span><span>${label}</span><span>TAEKIN / PLAY</span></div><div class="hero-device-canvas">${content}</div><div class="hero-device-bottom">SIX GAMES <span>•</span> ONE COLLECTION</div></div>`;
  if(slide.theme==='intro'||slide.theme==='2048'){
    const nums=slide.theme==='intro'?[2,4,0,0,8,16,2,0,0,4,8,0,0,0,2,4]:[2,4,8,0,4,16,32,2,0,8,64,4,0,2,4,8];
    return frame(`<div class="demo-2048">${nums.map(n=>`<span class="demo-2048-tile ${n?'v'+n:'blank'}">${n||''}</span>`).join('')}</div>`,slide.theme==='intro'?'ARCADE / 01':'2048 / PLAY');
  }
  if(slide.theme==='baseball'){
    return frame(`<div class="demo-baseball"><div class="demo-baseball-row"><span>0</span><span>7</span><span>2</span><span>9</span></div><div class="demo-baseball-result">02 STRIKE <i></i> 01 BALL</div><div class="demo-baseball-tries"><span>1028</span><em>1S / 1B</em><span>5730</span><em>0S / 2B</em></div></div>`,'NUMBER / LOGIC');
  }
  if(slide.theme==='mines'){
    const vals=['','',1,1,0,'',2,2,'F',1,1,2,0,2,0,0,1,1,1,0,'',1,'F',1,0];
    return frame(`<div class="demo-mines">${vals.map((v,i)=>`<span class="${v==='F'?'flag':v?'revealed':''}">${v==='F'?'⚑':v||''}</span>`).join('')}</div>`,'MINES / GRID');
  }
  if(slide.theme==='pipes'){
    const svg=`<svg viewBox="0 0 260 190" aria-hidden="true" xmlns="http://www.w3.org/2000/svg"><g stroke="var(--hero-pipe-bg)" stroke-width="26" stroke-linecap="round" stroke-linejoin="round" fill="none"><path d="M18 32H75V82H130V135H241"/><path d="M75 82V165H155"/><path d="M130 82H232V32"/></g><g stroke="#76c9bc" stroke-width="12" stroke-linecap="round" stroke-linejoin="round" fill="none"><path d="M18 32H75V82H130V135H241"/><path d="M75 82V165H155"/><path d="M130 82H232V32"/></g><circle cx="18" cy="32" r="11" fill="#f1c48f"/><circle cx="241" cy="135" r="11" fill="#b0e3d7"/><g fill="#183035"><circle cx="75" cy="82" r="7"/><circle cx="130" cy="82" r="7"/></g></svg>`;
    return frame(`<div class="demo-pipes">${svg}</div>`,'PIPE / FLOW');
  }
  if(slide.theme==='shikaku'){
    const area=[0,0,1,1,1,0,0,2,3,3,4,4,2,3,3,4,4,2,5,5,4,4,2,5,5];
    const clue={1:'6',8:'4',12:'5',16:'4',21:'6'};
    return frame(`<div class="demo-shikaku">${area.map((v,i)=>`<span class="area-${v}">${clue[i]||''}</span>`).join('')}</div>`,'SHIKAKU / AREA');
  }
  const bits=[0,1,1,0,0,0,1,0,0,0,1,1,1,0,0,1,0,1,1,0,0,0,1,0,0];
  return frame(`<div class="demo-blocks">${bits.map((n,i)=>`<span class="${n?'piece p'+(i%3):''}"></span>`).join('')}</div>`,'BLOCKS / STRATEGY');
}
function renderHero(){
  const slides=$('hero-slides');
  // 소개 배너는 1초마다 전환되므로, 전환할 때마다 HTML 전체를 다시 만들지 않습니다.
  if(!slides.children.length){
    HERO_SHOWS.forEach((slide,index)=>{
      const page=document.createElement('article');
      page.className=`hero-slide hero-theme-${slide.theme}`;
      page.innerHTML=`<div class="hero-slide-text"><span class="hero-eyebrow">${slide.tag}</span><h1>${slide.name} <em>${slide.accent}</em></h1><p>${slide.desc}</p><span class="hero-slide-tag">${slide.chip}</span><button class="hero-slide-cta" type="button">${slide.cta} ↗</button></div><div class="hero-slide-art" aria-hidden="true">${heroArtSlide(slide)}</div>`;
      const button=page.querySelector('.hero-slide-cta');
      button.addEventListener('click',()=>{
        if(slide.key)showGame(slide.key);
        else $('game-collection').scrollIntoView({behavior:'smooth',block:'start'});
      });
      slides.append(page);
      const dot=document.createElement('button');dot.type='button';dot.className='hero-dot';
      dot.setAttribute('aria-label',`${index+1}번 소개 보기: ${slide.accent}`);
      dot.addEventListener('click',()=>setHero(index,true));$('hero-dots').append(dot);
    });
  }
  [...slides.children].forEach((page,index)=>{
    const current=index===heroIndex;
    page.classList.toggle('current',current);
    page.setAttribute('aria-hidden',String(!current));
    page.querySelector('.hero-slide-cta').tabIndex=current?0:-1;
  });
  [...$('hero-dots').children].forEach((dot,index)=>{
    dot.classList.toggle('active',index===heroIndex);
    dot.setAttribute('aria-current',String(index===heroIndex));
  });
  $('hero-count').textContent=`${heroIndex+1} / ${HERO_SHOWS.length}`;
  heroRoot.setAttribute('aria-label',`게임 소개 배너 ${heroIndex+1}/${HERO_SHOWS.length}: ${HERO_SHOWS[heroIndex].accent}`);
}
function setHero(index,userAction=false){
  heroIndex=(index+HERO_SHOWS.length)%HERO_SHOWS.length;
  renderHero();
  if(userAction)resetHeroTimer();
}
function stopHeroTimer(){if(heroTimer){clearInterval(heroTimer);heroTimer=null;}}
function resetHeroTimer(){
  stopHeroTimer();
  // 약 2초마다 자동 전환. 배너가 너무 빠르게 지나가지 않도록 조정합니다.
  // 일시정지 버튼 또는 브라우저 탭 숨김 상태에서만 전환을 중단합니다.
  if(!heroPaused && !document.hidden && !heroRoot.contains(document.activeElement) && !document.body.classList.contains('v19-reduced-motion')){
    heroTimer=setInterval(()=>{
      if(!$('home-screen').classList.contains('hidden')) setHero(heroIndex+1);
    },2000);
  }
}
$('hero-prev').addEventListener('click',()=>setHero(heroIndex-1,true));
$('hero-next').addEventListener('click',()=>setHero(heroIndex+1,true));
$('hero-pause').addEventListener('click',()=>{
  heroPaused=!heroPaused;
  $('hero-pause').setAttribute('aria-pressed',String(heroPaused));
  $('hero-pause').textContent=heroPaused?'▶ 다시 재생':'Ⅱ 일시정지';
  resetHeroTimer();
});
heroRoot.addEventListener('focusin',stopHeroTimer);
heroRoot.addEventListener('focusout',()=>setTimeout(resetHeroTimer,0));
document.addEventListener('visibilitychange',resetHeroTimer);
renderHero();resetHeroTimer();

/* ======================= 게임별 조작 튜토리얼 ======================= */
const ARCADE_TOURS={
  baseball:['숫자야구는 숨겨진 서로 다른 숫자를 맞히는 추리 게임입니다.','PC와 스마트폰 모두 숫자를 입력하고 확인을 누르세요. 스트라이크(S)는 자리까지 일치, 볼(B)은 숫자만 일치합니다.','기록 표를 보고 다시 추리하세요. 힌트는 숫자 일부, 정답 보기는 전체를 공개하지만 클리어로 인정되지 않습니다.'],
  '2048':['같은 숫자를 더해 목표 블록을 만드는 전략 퍼즐입니다.','PC에서는 방향키 또는 W/A/S/D, 스마트폰에서는 게임판을 상하좌우로 밀거나 방향 버튼을 누르세요. 같은 숫자끼리 합쳐집니다.','되돌리기(U)와 힌트 버튼을 활용하세요. 모든 난이도에서 되돌리기 횟수 제한은 없습니다.'],
  mines:['지뢰가 없는 칸을 모두 여는 게임입니다.','PC에서는 왼쪽 클릭으로 열고 오른쪽 클릭으로 깃발을 꽂아요. 스마트폰은 열기/깃발 모드를 선택한 뒤 칸을 터치하세요.','숫자는 주변 8칸의 지뢰 개수입니다. 첫 클릭과 주변 칸은 안전하고, 힌트는 안전한 칸을 표시해 줍니다.'],
  pipes:['파이프가 이어져 물이 모든 칸에 도달하도록 만드는 퍼즐입니다.','PC에서는 파이프를 클릭하고 스마트폰에서는 터치해 회전시킵니다. 열린 끝이 이웃 파이프를 향하게 맞추세요.','열린 배관이나 누수 없이 전체 칸이 연결되면 승리해요. 힌트는 파이프 하나를 올바르게 돌려 줍니다.'],
  shikaku:['숫자가 적힌 게임판을 직사각형들로 정확히 나누세요.','PC에서는 시작·끝 칸을 클릭하거나 드래그하세요. 스마트폰은 두 칸을 차례로 터치하거나 손가락으로 영역을 드래그하세요.','각 직사각형엔 숫자가 하나만 있어야 하고 서로 겹칠 수 없어요. 힌트는 영역 위치를, 지우개는 선택 영역 삭제를 지원합니다.'],
  blocks:['10×10 게임판에 블록 세 개를 놓는 점수 퍼즐입니다.','PC는 블록을 마우스로 끌거나 선택 후 칸을 클릭하세요. 스마트폰은 블록을 손가락으로 끌어 놓거나 선택 후 칸을 터치하세요.','가로 또는 세로 한 줄이 차면 사라지고 점수를 얻습니다. 힌트는 추천 위치를, 되돌리기는 마지막 배치를 취소합니다.']
};
let tutorialGame='baseball',tutorialStep=0;
const tourDialog=$('tutorial-dialog');
function renderTutorial(){
  const points=ARCADE_TOURS[tutorialGame],info=gameInfo[tutorialGame];
  $('tutorial-title').textContent=`${info.name} · ${['무엇을 하나요?','어떻게 조작하나요?','클리어 팁'][tutorialStep]}`;
  $('tutorial-symbol').textContent=info.emoji;
  $('tutorial-text').textContent=points[tutorialStep];
  $('tutorial-progress').textContent=`STEP ${tutorialStep+1} / 3`;
  $('tutorial-dots').textContent=['●','●','●'].map((p,i)=>i===tutorialStep?'●':'○').join('  ');
  $('tutorial-prev').disabled=tutorialStep===0;
  $('tutorial-next').textContent=tutorialStep===points.length-1?'게임으로 돌아가기 ✓':'다음 →';
}
function openTutorial(key=activeGame||'baseball'){
  tutorialGame=ARCADE_TOURS[key]?key:'baseball';tutorialStep=0;renderTutorial();
  if(!tourDialog.open)tourDialog.showModal();
}
$('tour-first').addEventListener('click',()=>openTutorial('baseball'));
$('game-tutorial').addEventListener('click',()=>openTutorial());
$('tutorial-close').addEventListener('click',()=>tourDialog.close());
$('tutorial-prev').addEventListener('click',()=>{tutorialStep=Math.max(0,tutorialStep-1);renderTutorial();});
$('tutorial-next').addEventListener('click',()=>{
  if(tutorialStep===2)tourDialog.close();else{tutorialStep++;renderTutorial();}
});
tourDialog.addEventListener('click',e=>{if(e.target===tourDialog)tourDialog.close();});

/* ======================= 플레이 통계·업적·백업 ======================= */
const ACHIEVEMENTS=[
  {name:'첫걸음',icon:'🌱',detail:'아무 게임 1단계 클리어',test:s=>s.cleared>=1},
  {name:'10단계 달성',icon:'🎯',detail:'전체 단계 10개 클리어',test:s=>s.cleared>=10},
  {name:'퍼즐 탐험가',icon:'🧭',detail:'6개 게임 모두 1단계 이상 클리어',test:s=>s.gamesCleared===6},
  {name:'별 수집가',icon:'⭐',detail:'별 60개 이상 획득',test:s=>s.stars>=60},
  {name:'완벽주의자',icon:'💎',detail:'3성 기록 20개 획득',test:s=>s.perfect>=20},
  {name:'보스 사냥꾼',icon:'👑',detail:'보스 단계 5개 클리어',test:s=>s.boss>=5},
  {name:'도전 모드 도전자',icon:'🏆',detail:'도전 모드 1라운드 클리어',test:s=>s.marathon>=1},
  {name:'퍼즐 마스터',icon:'🔥',detail:'한 게임에서 250단계 클리어',test:s=>s.anyMaster}
];
function arcadeStats(){
  let cleared=0,stars=0,perfect=0,boss=0,gamesCleared=0,anyMaster=false;
  for(const key of ARCADE_ORDER){
    const count=completedStages(key);cleared+=count;
    if(count>0)gamesCleared++;
    if(count>=250)anyMaster=true;
    const skips=new Set(skippedStages(key));
    for(const tier of LEVEL_KEYS){const done=completedTierStages(key,tier),base=tierBase(tier);
      for(const n of BOSS_STAGES){if(n<=done&&!skips.has(base+n-1))boss++;}
    }
    for(const value of Object.values(arcadeProgress.stars?.[key]||{})){
      const rating=Number(value)||0;stars+=rating;if(rating===3)perfect++;
    }
  }
  return {cleared,stars,perfect,boss,gamesCleared,anyMaster,marathon:arcadeProgress.arcadeRun.round};
}
function renderArcadeStats(){
  const s=arcadeStats();
  $('stat-cleared').textContent=`${s.cleared} / 1500`;
  $('stat-stars').textContent=`${s.stars} ★`;
  $('stat-boss').textContent=`${s.boss} / 150`;
  $('stat-marathon').textContent=`${s.marathon} / 100`;
  const el=$('achievement-list');el.innerHTML='';
  ACHIEVEMENTS.forEach(a=>{
    const earned=a.test(s);
    const card=document.createElement('div');card.className='achievement-card'+(earned?' earned':' locked');
    const ic=document.createElement('span');ic.textContent=earned?a.icon:'🔒';ic.className='achievement-icon';
    const body=document.createElement('span');body.className='achievement-description';
    const title=document.createElement('strong');title.textContent=a.name;
    const detail=document.createElement('small');detail.textContent=a.detail;
    body.append(title,detail);
    const state=document.createElement('span');state.className='achievement-badge';state.textContent=earned?'획득':'도전 중';
    card.append(ic,body,state);el.append(card);
  });
}
// 홈 진행도가 갱신될 때마다 통계와 업적도 함께 갱신합니다.
const oldRenderHomeProgress=renderHomeProgress;
renderHomeProgress=function(){oldRenderHomeProgress();renderArcadeStats();};
function exportArcadeProgress(){
  const data={format:'taekin-brain-arcade-progress',version:1,exportedAt:new Date().toISOString(),progress:arcadeProgress,extra:{playlog:v19Playlog,sessions:v19Saves,profileFrame:v19Frame,featuredBadge:window.TaekinHall?.exportState?.()||null,v29:window.TaekinV29Rank?.exportState?.()||null,v25:window.TaekinV25?.exportState?.()||null,v32:window.TaekinV32?.exportSettings?.()||null,v42Zoom:{...v42Zoom}}};
  const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');a.href=url;a.download=`TAEKIN_arcade_progress_${localDateKey()}.json`;document.body.append(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),2000);
  $('backup-message').textContent='진행 기록 JSON 파일을 저장했습니다.';
}
function validateImportedProgress(root){
  if(root?.format!=='taekin-brain-arcade-progress'||root.version!==1||!root.progress||typeof root.progress!=='object'||Array.isArray(root.progress))throw new Error('TAEKIN 아케이드 기록 파일이 아닙니다.');
  const p=root.progress;
  const stages={},stars={},skipped={};
  for(const key of ARCADE_ORDER){
    stages[key]=Math.max(0,Math.min(p.stageVersion===29?250:100,Math.floor(Number(p.stages?.[key])||0)));
    skipped[key]=Array.isArray(p.skipped?.[key])?p.skipped[key].filter(n=>Number.isInteger(n)&&n>=0&&n<(p.stageVersion===29?250:100)).slice(0,15):[];
    const saved=p.stars?.[key];stars[key]={};
    if(saved&&typeof saved==='object')for(const [index,level] of Object.entries(saved)){
      const n=Number(index);if(Number.isInteger(n)&&n>=0&&n<(p.stageVersion===29?250:100))stars[key][index]=Math.min(3,Math.max(0,Math.floor(Number(level)||0)));
    }
  }
  const records={};for(const level of LEVEL_KEYS)records[level]=Math.min(6,Math.max(0,Math.floor(Number(p.daily?.records?.[level])||0)));
  const chosen=LEVEL_KEYS.includes(p.daily?.selected)?p.daily.selected:'easy';
  const date=/^\d{4}-\d{2}-\d{2}$/.test(p.daily?.date)?p.daily.date:localDateKey();
  const round=Math.max(0,Math.min(100,Math.floor(Number(p.arcadeRun?.round)||0)));
  const step=Math.max(0,Math.min(5,Math.floor(Number(p.arcadeRun?.step)||0)));
  return upgradeProgressV29({stageVersion:p.stageVersion||0,tierStages:p.tierStages,selectedTiers:p.selectedTiers,stages,stars,skipped,daily:{date,selected:chosen,records},arcadeRun:{round,step}});
}
$('export-progress').addEventListener('click',exportArcadeProgress);
$('import-progress').addEventListener('click',()=>$('import-progress-file').click());
/* 백업 복원은 먼저 전체 자료를 검사하고, 실패 시 저장 값을 되돌립니다.
   이전 버전과 호환되도록 저장 키는 유지합니다. */
/* v41: JSON 백업과 브라우저 이어하기 모두 동일한 게임판 검증을 사용합니다.
   기존 저장 키/파일 형식은 바꾸지 않으며, 깨진 데이터는 적용 전에 거절합니다. */
function v41Plain(value){return value!==null&&typeof value==='object'&&!Array.isArray(value);}
function v41Require(ok,message){if(!ok)throw new Error(message);}
function v41Integer(value,min,max){return Number.isInteger(value)&&value>=min&&value<=max;}
function v41Grid(grid,size,test){return Array.isArray(grid)&&grid.length===size&&grid.every(row=>Array.isArray(row)&&row.length===size&&row.every(test));}
function v41Rectangle(rect,size){return v41Plain(rect)&&['r1','c1','r2','c2'].every(k=>v41Integer(rect[k],0,size-1))&&rect.r1<=rect.r2&&rect.c1<=rect.c2;}
function v41BoundedInt(value,max){return v41Integer(value,0,max);}
function v41ValidateSession(key,entry){
  const fail=(message)=>{throw new Error(`${gameInfo[key]?.name||key} ${message}`);};
  if(!v41Plain(entry)||entry.key!==key||!v41Plain(entry.data))fail('저장 구조가 올바르지 않습니다.');
  if(!v41Plain(entry.mode)||!['stage','marathon','free','demo'].includes(entry.mode.mode))fail('게임 모드 값이 올바르지 않습니다.');
  const mode=entry.mode;
  if(mode.mode==='stage'&&!v41Integer(mode.stage,0,249))fail('단계 번호가 올바르지 않습니다.');
  if(mode.mode==='marathon'&&(!v41Integer(mode.round,0,99)||!v41Integer(mode.step,0,5)))fail('도전 라운드가 올바르지 않습니다.');
  if(mode.mode==='demo'&&!v41Integer(mode.step,0,5))fail('체험 단계가 올바르지 않습니다.');
  if(!Number.isFinite(entry.when)||entry.when<0||entry.when>Date.now()+86400000)fail('저장 시간이 올바르지 않습니다.');
  const d=entry.data,playing=d.state===undefined||d.state==='playing';
  const isGrid=(name,size,test)=>{if(!v41Grid(d[name],size,test))fail(`${name} 게임판이 잘못됐습니다.`);};
  const cell01=x=>x===0||x===1||x===false||x===true;
  const number=(x,max=100000000)=>v41BoundedInt(x,max);
  const rectList=(arr,size,max)=>Array.isArray(arr)&&arr.length<=max&&arr.every(rect=>v41Rectangle(rect,size));
  if(key==='baseball'){
    if(!v41Integer(d.digits,2,8)||!Array.isArray(d.answer)||d.answer.length!==d.digits||!d.answer.every(x=>typeof x==='string'&&/^[0-9]$/.test(x))||new Set(d.answer).size!==d.digits)fail('정답 숫자 배열이 잘못됐습니다.');
    if(!Array.isArray(d.guesses)||d.guesses.length>5000||!d.guesses.every(g=>v41Plain(g)&&typeof g.guess==='string'&&g.guess.length===d.digits&&/^[0-9]+$/.test(g.guess)&&new Set(g.guess).size===d.digits&&v41BoundedInt(g.strikes,d.digits)&&v41BoundedInt(g.balls,d.digits)))fail('숫자 추리 기록이 잘못됐습니다.');
    if(!Array.isArray(d.known)||!d.known.every(n=>v41Integer(n,0,d.digits-1)))fail('자리 힌트가 잘못됐습니다.');
    if(typeof d.finished!=='boolean'||!number(d.hints,100000)||!playing)fail('게임 상태가 잘못됐습니다.');
    if(d.maxAttempts!==null&&d.maxAttempts!==undefined&&!v41Integer(d.maxAttempts,1,100000))fail('최대 입력 횟수가 잘못됐습니다.');
  }else if(key==='2048'){
    const tile=x=>x===0||(v41Integer(x,2,131072)&&Number.isInteger(Math.log2(x)));
    isGrid('board',4,tile);
    if(!Array.isArray(d.history)||d.history.length>20000||!d.history.every(item=>v41Plain(item)&&v41Grid(item.board,4,tile)&&number(item.score)))fail('되돌리기 기록이 잘못됐습니다.');
    if(!number(d.score)||!number(d.best)||!v41Integer(d.target,2,131072)||!number(d.goalScore??0)||!playing)fail('점수나 목표가 잘못됐습니다.');
  }else if(key==='mines'){
    const size=d.size;
    if(!v41Integer(size,3,20)||!v41Integer(d.count,1,size*size-1))fail('지뢰판 크기나 지뢰 수가 잘못됐습니다.');
    isGrid('mines',size,cell01);isGrid('open',size,cell01);isGrid('flags',size,cell01);isGrid('adjacent',size,x=>v41Integer(x,0,8));
    const actualMines=d.mines.flat().filter(Boolean).length,opened=d.open.flat().filter(Boolean).length,flags=d.flags.flat().filter(Boolean).length;
    if(typeof d.placed!=='boolean'||!['open','flag'].includes(d.mode)||!number(d.hintCount,100000)||!playing)fail('지뢰찾기 상태가 잘못됐습니다.');
    if(!v41BoundedInt(d.opened,size*size)||d.opened!==opened||d.flagCount!==flags||flags>d.count)fail('열린 칸/깃발 기록이 맞지 않습니다.');
    if(d.placed&&actualMines!==d.count)fail('실제 지뢰 수가 기록과 다릅니다.');
    if(d.open.some((row,r)=>row.some((open,c)=>open&&(d.flags[r][c]||(d.placed&&d.mines[r][c])))))fail('지뢰와 열린 칸이 충돌합니다.');
    if(d.placed)for(let r=0;r<size;r++)for(let c=0;c<size;c++){
      const near=mineNeighbors(r,c,size).filter(([nr,nc])=>Boolean(d.mines[nr][nc])).length;
      if(d.adjacent[r][c]!==near)fail('주변 지뢰 숫자가 맞지 않습니다.');
    }
    for(const field of ['hint','hit'])if(d[field]!=null&&(!Array.isArray(d[field])||d[field].length!==2||!d[field].every(x=>v41Integer(x,0,size-1))))fail(`${field} 좌표가 잘못됐습니다.`);
    if(d.elapsed!=null&&(!Number.isFinite(d.elapsed)||d.elapsed<0||d.elapsed>864000000))fail('경과 시간이 잘못됐습니다.');
    if(d.timeLimit!=null&&!v41BoundedInt(d.timeLimit,86400))fail('시간 제한이 잘못됐습니다.');
  }else if(key==='pipes'){
    const size=d.size;
    if(!v41Integer(size,3,12)||!playing)fail('배관 크기나 상태가 잘못됐습니다.');
    isGrid('board',size,x=>v41Integer(x,0,15));isGrid('solution',size,x=>v41Integer(x,0,15));
    if(!v41Plain(d.start)||!v41Plain(d.end)||d.start.r!==0||d.start.c!==size-1||d.start.port!==1||d.end.r!==size-1||d.end.c!==0||d.end.port!==4)fail('시작점/도착점 좌표가 잘못됐습니다.');
    if(!Array.isArray(d.history)||d.history.length>30000||!d.history.every(h=>v41Plain(h)&&v41Integer(h.r,0,size-1)&&v41Integer(h.c,0,size-1)&&v41Integer(h.mask,0,15)))fail('회전 기록이 잘못됐습니다.');
    if(!number(d.rotations,1000000)||!number(d.hints,1000000)||![1,-1].includes(d.turnDirection??1))fail('배관 회전 정보가 잘못됐습니다.');
  }else if(key==='shikaku'){
    const size=d.size;
    if(!v41Integer(size,3,12)||!v41Integer(d.target,1,size*size)||d.finished!==false)fail('직사각형 판 설정이 잘못됐습니다.');
    isGrid('clues',size,x=>v41Integer(x,0,size*size));isGrid('regions',size,x=>v41Integer(x,-1,size*size));
    if(!rectList(d.solution,size,size*size)||!rectList(d.history,size,size*size)||!number(d.hints,100000))fail('직사각형 영역 정보가 잘못됐습니다.');
    if(d.anchor!=null&&(!v41Plain(d.anchor)||!v41Integer(d.anchor.r,0,size-1)||!v41Integer(d.anchor.c,0,size-1)))fail('시작점 좌표가 잘못됐습니다.');
    for(const field of ['preview','hintRect'])if(d[field]!=null&&!v41Rectangle(d[field],size))fail(`${field} 좌표가 잘못됐습니다.`);
    if(d.eraser!=null&&typeof d.eraser!=='boolean')fail('지우개 상태가 잘못됐습니다.');
    const answerGrid=Array.from({length:size},()=>Array(size).fill(false));
    for(const rect of d.solution){
      let found=0,clue=0;
      for(let y=rect.r1;y<=rect.r2;y++)for(let x=rect.c1;x<=rect.c2;x++){
        if(answerGrid[y][x])fail('정답 영역이 서로 겹칩니다.');
        answerGrid[y][x]=true;
        if(d.clues[y][x]){found++;clue=d.clues[y][x];}
      }
      if(found!==1||clue!==(rect.r2-rect.r1+1)*(rect.c2-rect.c1+1))fail('정답 직사각형 숫자가 올바르지 않습니다.');
    }
    if(answerGrid.some(row=>row.some(covered=>!covered)))fail('정답이 전체 게임판을 덮지 않습니다.');
    const rebuilt=Array.from({length:size},()=>Array(size).fill(-1));
    for(let id=0;id<d.history.length;id++){
      const r=d.history[id];let found=0,clue=0;
      for(let y=r.r1;y<=r.r2;y++)for(let x=r.c1;x<=r.c2;x++){
        if(rebuilt[y][x]!==-1)fail('완성 영역이 중복됩니다.');
        rebuilt[y][x]=id;if(d.clues[y][x]){found++;clue=d.clues[y][x];}
      }
      if(found!==1||clue!==(r.r2-r.r1+1)*(r.c2-r.c1+1))fail('완성 영역의 숫자·넓이가 맞지 않습니다.');
    }
    if(!rebuilt.every((row,y)=>row.every((id,x)=>id===d.regions[y][x])))fail('저장된 색칠 영역이 일치하지 않습니다.');
  }else if(key==='blocks'){
    const board=x=>v41Integer(x,0,3);
    isGrid('board',10,board);
    const tray=items=>Array.isArray(items)&&items.length===3&&items.every(t=>v41Plain(t)&&v41Integer(t.shapeId,0,blockShapes.length-1)&&typeof t.used==='boolean'&&v41Integer(t.color,0,2));
    if(!tray(d.tray)||!Array.isArray(d.history)||d.history.length>20000||!d.history.every(h=>v41Plain(h)&&v41Grid(h.board,10,board)&&tray(h.tray)&&number(h.score)&&number(h.moves)))fail('블록과 되돌리기 기록이 잘못됐습니다.');
    if(!number(d.score)||!number(d.target)||!number(d.best)||!number(d.moves)||!number(d.combo??0)||!['easy','normal','hard','extreme','expert'].includes(d.level)||!playing)fail('블록 점수·난이도가 잘못됐습니다.');
    if(d.selected!==null&&d.selected!==undefined&&!v41Integer(d.selected,0,2))fail('블록 선택값이 잘못됐습니다.');
    for(const field of ['hover','hint'])if(d[field]!=null&&(!v41Plain(d[field])||!v41Integer(d[field].r,0,9)||!v41Integer(d[field].c,0,9)))fail(`${field} 좌표가 잘못됐습니다.`);
    if(d.hintCount!=null&&!number(d.hintCount,100000))fail('블록 힌트 기록이 잘못됐습니다.');
  }
  // JSON의 임의 속성을 Object.assign으로 게임 객체에 복사하지 않습니다.
  const fields={
    baseball:['answer','guesses','finished','digits','known','hints','maxAttempts'],
    '2048':['board','score','best','history','state','target','goalScore','undoUsed','undoLimit'],
    mines:['size','count','mines','open','flags','adjacent','placed','state','opened','flagCount','mode','hit','hint','hintCount','noGuessCertified','timeLimit','startedAt','elapsed'],
    pipes:['size','board','solution','rotations','hints','state','start','end','lastTurn','lastHint','history','turnDirection','optimalTurns','flowBatch'],
    shikaku:['size','target','clues','regions','solution','history','hints','finished','anchor','preview','hintRect','uniqueVerified','eraser'],
    blocks:['board','tray','score','best','target','moves','combo','state','selected','hover','hint','hintCount','history','level']
  };
  const cleanData={};for(const field of fields[key])if(Object.hasOwn(d,field))cleanData[field]=d[field];
  // 옛 백업에서 누락될 수 있는 선택적 필드는 현재 버전의 기본값으로 채웁니다.
  if(key==='2048'){cleanData.goalScore??=0;cleanData.undoLimit=null;}
  if(key==='pipes')cleanData.turnDirection??=1;
  if(key==='blocks')cleanData.combo??=0;
  if(key==='mines')cleanData.elapsed??=null;
  const safeMode={mode:mode.mode,reported:false};
  for(const f of ['stage','round','step','practice'])if(Object.hasOwn(mode,f))safeMode[f]=mode[f];
  const run=v41Plain(entry.run)?entry.run:{};
  const safeRun={};for(const f of ['started','hints','undos','misses','moves'])if(v41BoundedInt(run[f],1000000000000000))safeRun[f]=run[f];
  return {key,when:entry.when,stageSchema:entry.stageSchema,mode:safeMode,data:cleanData,run:safeRun};
}

function v39ValidateImportExtras(extra){
  if(extra===undefined||extra===null)return {};
  if(typeof extra!=='object'||Array.isArray(extra))throw new Error('백업 추가 설정의 형식이 잘못됐습니다.');
  const allowed=['playlog','sessions','featuredBadge','v25','v29','v32','v42Zoom'];
  for(const key of allowed){
    if(extra[key]!==undefined&&extra[key]!==null&&(typeof extra[key]!=='object'||Array.isArray(extra[key])))
      throw new Error(key+' 데이터 형식이 잘못됐습니다.');
  }
  if(extra.profileFrame!==undefined&&extra.profileFrame!==null&&typeof extra.profileFrame!=='string')
    throw new Error('프로필 테두리 값이 잘못됐습니다.');
  let cleanZoom=null;
  if(extra.v42Zoom!=null){
    cleanZoom={};
    for(const [game,value] of Object.entries(extra.v42Zoom)){
      if(!V42_ZOOM_GAMES.includes(game)||typeof value!=='number'||!Number.isFinite(value)||value<V42_ZOOM_MIN||value>V42_ZOOM_MAX)
        throw new Error('게임판 크기 설정이 잘못됐습니다.');
      cleanZoom[game]=value;
    }
  }
  const playlog={};
  if(extra.playlog){for(const key of ARCADE_ORDER){
    const d=extra.playlog[key];if(!d)continue;
    if(typeof d!=='object'||Array.isArray(d))throw new Error(key+' 플레이 기록 형식이 잘못됐습니다.');
    playlog[key]={
      wins:Math.max(0,Math.min(100000,Math.floor(Number(d.wins)||0))),
      bestSeconds:d.bestSeconds==null?null:Math.max(0,Math.min(864000,Math.floor(Number(d.bestSeconds)||0))),
      hints:Math.max(0,Math.min(999999,Math.floor(Number(d.hints)||0))),
      last:typeof d.last==='string'?d.last.slice(0,30):null
    };
  }}
  const sessions={};
  if(extra.sessions){for(const key of ARCADE_ORDER){
    const value=extra.sessions[key];
    if(value==null)continue;
    sessions[key]=v41ValidateSession(key,value);
  }}
  // 임의의 중첩 설정이 들어온 경우에도 백업 파일의 크기·값 범위를 검사합니다.
  if(extra.v32?.preferences){
    const pref=extra.v32.preferences;
    if(typeof pref!=='object'||Array.isArray(pref))throw new Error('편의 설정 형식이 잘못됐습니다.');
    const opts=['largeTargets','showGameTutorial','leaveConfirm','touchSpacing'];
    for(const key of opts)if(key in pref&&typeof pref[key]!=='boolean')throw new Error('편의 설정 '+key+' 값이 잘못됐습니다.');
    if('font' in pref&&!['large','normal'].includes(pref.font))throw new Error('글씨 크기 설정이 잘못됐습니다.');
  }
  if(extra.featuredBadge?.id!=null&&(typeof extra.featuredBadge.id!=='string'||extra.featuredBadge.id.length>50))
    throw new Error('대표 배지 정보가 잘못됐습니다.');
  return {...extra,playlog:extra.playlog?playlog:null,sessions:extra.sessions?sessions:null,v42Zoom:cleanZoom};
}
function v39SnapshotStorage(){
  const snapshot=new Map();
  for(let i=0;i<localStorage.length;i++){
    const key=localStorage.key(i);
    if(/^(taekin|taein)/i.test(key))snapshot.set(key,localStorage.getItem(key));
  }
  return snapshot;
}
function v39RestoreStorage(snapshot){
  const now=[];
  for(let i=0;i<localStorage.length;i++){
    const key=localStorage.key(i);
    if(/^(taekin|taein)/i.test(key))now.push(key);
  }
  for(const key of now)if(!snapshot.has(key))localStorage.removeItem(key);
  for(const [key,value] of snapshot)if(localStorage.getItem(key)!==value)localStorage.setItem(key,value);
}
function v39ImportSafely(imported,extra){
  const prior={
    storage:v39SnapshotStorage(), progress:arcadeProgress,playlog:v19Playlog,
    sessions:v19Saves,frame:v19Frame,
    v25:window.TaekinV25?.exportState?.(),
    hall:window.TaekinHall?.exportState?.(),
    v29:window.TaekinV29Rank?.exportState?.(),
    v32:window.TaekinV32?.exportSettings?.(),zoom:{...v42Zoom}
  };
  let reportedFailure=false;
  const saver=window.TaekinV32Save;
  const oldRecord=saver?.record;
  if(saver&&typeof oldRecord==='function')saver.record=function(ok){
    if(!ok)reportedFailure=true;
    return oldRecord.call(saver,ok);
  };
  try{
    window.TaekinV25?.beforeImport?.();
    arcadeProgress=imported;
    if(!saveArcadeProgress())throw new Error('진행 기록 저장에 실패했습니다.');
    if(extra.playlog){v19Playlog=extra.playlog;if(!arcadeStorageWrite(V19_LOG_KEY,JSON.stringify(v19Playlog)))throw new Error('플레이 기록 저장에 실패했습니다.');}
    if(extra.sessions){v19Saves=extra.sessions;if(!arcadeStorageWrite(V19_STATE_KEY,JSON.stringify(v19Saves)))throw new Error('이어하기 저장에 실패했습니다.');}
    if(v19Frames.some(f=>f.id===extra.profileFrame)){
      v19Frame=extra.profileFrame;
      if(!arcadeStorageWrite(V19_FRAME_KEY,v19Frame))throw new Error('프로필 테두리 저장에 실패했습니다.');
    }
    window.TaekinV25?.importState?.(extra.v25||null);
    if(extra.featuredBadge)window.TaekinHall?.importState?.(extra.featuredBadge);
    if(extra.v29)window.TaekinV29Rank?.importState?.(extra.v29);
    if(extra.v32)window.TaekinV32?.importSettings?.(extra.v32);
    if(extra.v42Zoom){
      for(const [game,value] of Object.entries(extra.v42Zoom)){
        if(!arcadeStorageWrite('taekin.arcade.v42.boardZoom.'+game,String(value)))
          throw new Error('게임판 크기 설정 저장에 실패했습니다.');
        v42Zoom[game]=value;
      }
      if(V42_ZOOM_GAMES.includes(activeGame))v42ApplyBoardZoom(activeGame);
    }
    if(reportedFailure)throw new Error('저장 중 일부 항목이 실패했습니다. 저장 공간/권한을 확인하세요.');
    renderHomeProgress();
    if(typeof v19RenderFrames==='function')v19RenderFrames();
    window.TaekinHall?.refresh?.();
    window.TaekinV29Rank?.refresh?.();
  }catch(error){
    let rollbackError=null;
    // 실행 중 UI에 남은 참조도 원래 상태로 되돌립니다.
    arcadeProgress=prior.progress;v19Playlog=prior.playlog;v19Saves=prior.sessions;v19Frame=prior.frame;
    try{
      if(prior.v25)window.TaekinV25?.importState?.(prior.v25);
      if(prior.hall)window.TaekinHall?.importState?.(prior.hall);
      if(prior.v29)window.TaekinV29Rank?.importState?.(prior.v29);
      if(prior.v32)window.TaekinV32?.importSettings?.(prior.v32);
    }catch(_){/* 스냅샷 기반 저장 복원이 우선입니다. */}
    try{v39RestoreStorage(prior.storage);}catch(restoreError){rollbackError=restoreError;}
    Object.assign(v42Zoom,prior.zoom);
    if(V42_ZOOM_GAMES.includes(activeGame))v42ApplyBoardZoom(activeGame);
    try{renderHomeProgress();window.TaekinHall?.refresh?.();}catch(_){}
    if(rollbackError)throw new Error('복원 중 오류가 발생했고 자동 되돌리기도 완료되지 않았습니다. 기존 JSON 백업 파일을 보관하세요. ('+error.message+')');
    throw new Error('복원 중 오류가 발생해 이전 기록으로 되돌렸습니다. '+error.message);
  }finally{
    if(saver&&typeof oldRecord==='function')saver.record=oldRecord;
  }
}
$('import-progress-file').addEventListener('change',async event=>{
  const file=event.target.files?.[0];if(!file)return;
  try{
    if(file.size>4_000_000)throw new Error('기록 파일이 너무 큽니다 (최대 4MB).');
    const root=JSON.parse(await file.text());
    const imported=validateImportedProgress(root);
    const extra=v39ValidateImportExtras(root.extra);
    if(!confirm('현재 기록을 백업 파일의 기록으로 바꿀까요? 진행·닉네임·꾸미기·설정까지 포함됩니다. 중요한 기록은 먼저 내보내기를 권장합니다.'))return;
    v39ImportSafely(imported,extra);
    window.TaekinV32Save?.record(true);
    $('backup-message').textContent='✓ 기록 복원 완료. 설정·꾸미기는 새로고침 후에도 유지됩니다.';
  }catch(error){
    window.TaekinV32Save?.record(false);
    $('backup-message').textContent='가져오기 실패: '+error.message;
  }finally{event.target.value='';}
});
renderArcadeStats();




/* ==================== 화면 테마·게임 카드·클리어 연출 ====================
   게임 엔진은 변경하지 않고 카드, 메뉴, 테마, 성취 연출을 추가했습니다.
   화면 설정과 진행 기록은 서로 다른 로컬 저장 키를 사용합니다.
   =========================================================== */
const V16_DISPLAY_STORAGE='taekin_arcade_display_v16';
const V16_THEMES=['dark','light'];
const V16_DENSITIES=['compact','normal','wide'];
let v16Display={theme:'dark',density:'normal'};
try {
  const saved=JSON.parse(localStorage.getItem(V16_DISPLAY_STORAGE)||'{}');
  if(V16_THEMES.includes(saved.theme))v16Display.theme=saved.theme;
  if(V16_DENSITIES.includes(saved.density))v16Display.density=saved.density;
}catch(_){/* 로컬 파일 저장소가 막힌 경우 기본 테마 적용 */}
function v16ApplyDisplay(){
  document.body.dataset.theme=v16Display.theme;
  document.body.dataset.density=v16Display.density;
  document.querySelectorAll('[data-theme-option]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.themeOption===v16Display.theme)));
  document.querySelectorAll('[data-density-option]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.densityOption===v16Display.density)));
  document.querySelector('meta[name="color-scheme"]')?.setAttribute('content',v16Display.theme==='light'?'light':'dark');
}
function v16SaveDisplay(){try{localStorage.setItem(V16_DISPLAY_STORAGE,JSON.stringify(v16Display));window.TaekinV32Save?.record(true);}catch(_){window.TaekinV32Save?.record(false);}}
function v16ToggleDisplay(open){
  const panel=$('display-settings');
  panel.hidden=!open;
  $('display-settings-toggle').setAttribute('aria-expanded',String(open));
}
$('display-settings-toggle').addEventListener('click',()=>v16ToggleDisplay($('display-settings').hidden));
$('display-settings-close').addEventListener('click',()=>v16ToggleDisplay(false));
document.querySelectorAll('[data-theme-option]').forEach(button=>button.addEventListener('click',()=>{v16Display.theme=button.dataset.themeOption;v16ApplyDisplay();v16SaveDisplay();}));
document.querySelectorAll('[data-density-option]').forEach(button=>button.addEventListener('click',()=>{v16Display.density=button.dataset.densityOption;v16ApplyDisplay();v16SaveDisplay();}));
document.addEventListener('click',event=>{if(!event.target.closest('.display-settings-wrap'))v16ToggleDisplay(false);});
document.addEventListener('keydown',event=>{if(event.key==='Escape')v16ToggleDisplay(false);});
v16ApplyDisplay();

function v16SetNavActive(destination){
  document.querySelectorAll('.arcade-nav-btn').forEach(button=>button.classList.toggle('active',button.dataset.destination===destination));
}
function v16GoDestination(destination){
  if(!$('play-screen').classList.contains('hidden'))showHome();
  if(destination==='achievements') $('achievement-hub').open=true;
  v16ToggleDisplay(false);
  v16SetNavActive(destination);
  const target={games:'game-collection',challenges:'challenge-hub',hall:'hall-of-fame',achievements:'achievement-hub',records:'stats-section'}[destination];
  if(target)requestAnimationFrame(()=>requestAnimationFrame(() => $(target)?.scrollIntoView({behavior:'smooth',block:'start'})));
}
document.querySelectorAll('.arcade-nav-btn').forEach(button=>button.addEventListener('click',()=>v16GoDestination(button.dataset.destination)));
const v16OriginalShowHome=showHome;
showHome=function(){v16OriginalShowHome();document.body.removeAttribute('data-game');v16SetNavActive('games');};
const v16OriginalShowGame=showGame;
showGame=function(key,autoStage=true){document.body.dataset.game=key;v16OriginalShowGame(key,autoStage);v19RenderSaves();};

function v16UpdateProgress(){
  for(const card of document.querySelectorAll('.game-card[data-open]')){
    const count=Math.min(250,Math.max(0,completedStages(card.dataset.open)));
    const percent=card.querySelector('.card-percent');
    const fill=card.querySelector('.card-progress-fill');
    if(percent)percent.textContent=Math.round(count/250*100)+'%';
    if(fill)fill.style.width=(count/250*100)+'%';
  }
  const total=arcadeStats().cleared;
  const percent=Math.min(100,Math.round(total/1500*100));
  $('overall-progress-label').textContent=`${total} / 1,500단계 · ${percent}%`;
  $('overall-progress-fill').style.width=(total/1500*100)+'%';
}
const v16OriginalRenderHomeProgress=renderHomeProgress;
renderHomeProgress=function(){v16OriginalRenderHomeProgress();v16UpdateProgress();};
renderHomeProgress();

// 승리 화면 배경에 짧은 파티클을 그립니다. 게임 클리어 판정과 별 수치는 원래 코드 그대로 사용합니다.
const v16ConfettiColors=['#b5a0ff','#7fdceb','#ffd58a','#f18bb9','#91e6b4'];
function v16Celebrate(){
  const overlay=$('clear-overlay');
  const confetti=$('clear-confetti');
  if(!confetti)return;
  confetti.replaceChildren();
  if(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches)return;
  for(let i=0;i<22;i++){
    const particle=document.createElement('i');
    particle.style.setProperty('--x',((i*47+13)%97)+'%');
    particle.style.setProperty('--size',(5+i%4*2)+'px');
    particle.style.setProperty('--color',v16ConfettiColors[i%v16ConfettiColors.length]);
    particle.style.setProperty('--rot',((i*43)%180)+'deg');
    particle.style.setProperty('--duration',(1.5+(i%6)*.18)+'s');
    particle.style.setProperty('--delay',((i%7)*.04)+'s');
    particle.style.setProperty('--shift',((i%2?1:-1)*(12+i%8*7))+'px');
    confetti.appendChild(particle);
  }
  overlay.classList.remove('celebrate');
  void overlay.offsetWidth;
  overlay.classList.add('celebrate');
}
const v16OriginalShowVictory=showVictoryOverlay;
showVictoryOverlay=function(key){v16OriginalShowVictory(key);v16Celebrate();};

/* ===============================================================
   자동 저장·이어하기·체험·접근성
   1) 게임판 자동 저장·이어하기  2) 독립적인 6종 체험 모드
   3) 구간별 스테이지 지도    4) 일시정지(지뢰찾기 타이머 정지)
   5) 개인 기록·프로필 테두리  6) 접근성 및 움직임 설정
   7) 클리어 결과 PNG 저장    8) 게임별 조작 개선
   =============================================================== */
const V19_STATE_KEY='taekin_arcade_sessions_v19';
const V19_LOG_KEY='taekin_arcade_playlog_v19';
const V19_PREF_KEY='taekin_arcade_accessibility_v19';
const V19_FRAME_KEY='taekin_arcade_profile_frame_v19';
let v19Paused=false, v19PauseStarted=0, v19LastResult=null;
let v19Saves={};
let v19Playlog={};
try{v19Saves=JSON.parse(localStorage.getItem(V19_STATE_KEY)||'{}')||{};}catch(_){v19Saves={};}
try{v19Playlog=JSON.parse(localStorage.getItem(V19_LOG_KEY)||'{}')||{};}catch(_){v19Playlog={};}
let v19Prefs={colorblind:false,reducedMotion:false};
try{v19Prefs={...v19Prefs,...JSON.parse(localStorage.getItem(V19_PREF_KEY)||'{}')};}catch(_){}

function v19Toast(message){
  const el=$('v19-toast'); el.textContent=message;el.classList.remove('hidden');
  clearTimeout(v19Toast.timer);v19Toast.timer=setTimeout(()=>el.classList.add('hidden'),3000);
}
function v19IsPlaying(){
  if(!activeGame||challenge.reported)return false;
  if(activeGame==='baseball')return !baseball.finished;
  if(activeGame==='2048')return game2048.state==='playing';
  if(activeGame==='mines')return mineGame.state==='playing';
  if(activeGame==='pipes')return pipeGame.state==='playing';
  if(activeGame==='shikaku')return !shikaku.finished;
  if(activeGame==='blocks')return blockGame.state==='playing';
  return false;
}
function v19SnapshotPayload(key){
  if(key==='baseball')return {...baseball,maxAttempts:Number.isFinite(baseball.maxAttempts)?baseball.maxAttempts:null};
  if(key==='2048')return {...game2048,history:game2048.history};
  if(key==='mines')return {...mineGame,elapsed:mineGame.startedAt?(Date.now()-mineGame.startedAt):null};
  if(key==='pipes')return {...pipeGame,info:null};
  if(key==='shikaku')return {...shikaku,dragging:null};
  if(key==='blocks')return {...blockGame,history:blockGame.history.slice(-45),hover:null};
  return null;
}
function v19StoreSnapshot(){
  if(!v19IsPlaying()||v19Paused)return 'unavailable';
  const key=activeGame;
  const previous=v19Saves[key];
  try{
    const snapshot={key,when:Date.now(),stageSchema:29,mode:{...challenge},data:v19SnapshotPayload(key),run:{...runStats}};
    v19Saves[key]=snapshot;
    localStorage.setItem(V19_STATE_KEY,JSON.stringify(v19Saves));
    window.TaekinV32Save?.record(true);
    v19RenderSaves();
    return 'saved';
  }catch(error){
    // 디스크에 반영되지 못한 판을 성공한 저장처럼 보이지 않게 되돌립니다.
    if(previous===undefined)delete v19Saves[key];else v19Saves[key]=previous;
    window.TaekinV32Save?.record(false);
    console.warn('게임판 저장 실패',error);
    return 'failed';
  }
}
function v19RemoveSave(key){
  // 저장소가 꽉 찼거나 차단된 경우에도 이전 이어하기 기록을 메모리에서 잃지 않습니다.
  if(!v19Saves[key])return true;
  const previous=v19Saves[key];
  delete v19Saves[key];
  const saved=arcadeStorageWrite(V19_STATE_KEY,JSON.stringify(v19Saves));
  if(!saved)v19Saves[key]=previous;
  v19RenderSaves();
  return saved;
}
function v19RenderSaves(){
  const saves=ARCADE_ORDER.map(k=>v19Saves[k]).filter(s=>s&&gameInfo[s.key]&&s.data);
  const list=$('v19-save-list');list.replaceChildren();
  const sorted=[...saves].sort((a,b)=>b.when-a.when);
  const resume=$('v19-resume-last');resume.disabled=sorted.length===0;
  resume.textContent=sorted.length?`↩ ${gameInfo[sorted[0].key].name} 이어하기`:'↩ 저장된 판 없음';
  for(const s of sorted){
    const b=document.createElement('button');b.type='button';b.className='v19-save-chip';
    b.textContent=`${gameInfo[s.key].emoji} ${gameInfo[s.key].name} · ${new Date(s.when).toLocaleString('ko-KR',{month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit'})}`;
    b.addEventListener('click',()=>v19ResumeSaved(s.key));list.appendChild(b);
  }
  $('v19-resume-game').disabled=!Boolean(activeGame&&v19Saves[activeGame]);
}
function v19ResumeSaved(key){
  const original=v19Saves[key];if(!original?.data||!gameInfo[key])return v19Toast('저장한 게임이 없습니다.');
  let saved;
  try{saved=v41ValidateSession(key,original);}catch(error){return v19Toast('⚠ 이어하기 자료가 손상됐습니다. '+error.message+' 기존 백업 파일은 삭제하지 않았습니다.');}
  v19PauseOff();
  showGame(key,false);
  const mode={...(saved.mode||{mode:'free',stage:-1,reported:false})};
  if(mode.mode==='stage'&&saved.stageSchema!==29&&Number.isInteger(mode.stage)&&mode.stage>=0&&mode.stage<100)mode.stage=legacyStageIndex(mode.stage);
  if(mode.mode==='stage'&&localStage(Number(mode.stage))-1>completedTierStages(key,tierOf(Number(mode.stage)))&&!isMasterUnlocked())return v19Toast('해금되지 않은 단계입니다.');
  challenge={...mode,reported:false};
  const select=$(DIFFICULTY_IDS[key]);
  if(mode.mode==='stage'){select.value=getStageConfig(key,mode.stage).tier;stageTier=select.value;stagePage=Math.floor((localStage(mode.stage)-1)/10);}
  if(mode.mode==='marathon')select.value=getMarathonStageConfig(key,mode.round).tier;
  const d=saved.data;
  try{
    if(key==='baseball'){
      Object.assign(baseball,d);baseball.maxAttempts=d.maxAttempts===null?Infinity:d.maxAttempts;
      const input=$('bb-input');input.maxLength=baseball.digits;input.value='';input.disabled=baseball.finished;
      $('bb-submit').disabled=baseball.finished;$('bb-hint').disabled=baseball.finished;$('bb-answer').disabled=baseball.finished;
      $('bb-attempts').textContent=`도전 ${baseball.guesses.length}회`;
      $('bb-history').replaceChildren();
      if(!baseball.guesses.length)$('bb-history').innerHTML='<tr class="empty-row"><td colspan="3">아직 입력한 기록이 없어요.</td></tr>';
      baseball.guesses.forEach((g,i)=>{const tr=document.createElement('tr');[i+1,g.guess,g.text].forEach(v=>{const td=document.createElement('td');td.textContent=String(v);tr.appendChild(td);});$('bb-history').appendChild(tr);});
      $('panel-baseball').querySelector('.secret-slots').innerHTML=Array.from({length:baseball.digits},(_,i)=>`<span>${baseball.known.includes(i)?baseball.answer[i]:'?'}</span>`).join('');
    }else if(key==='2048'){Object.assign(game2048,d);game2048.undoLimit=Infinity;render2048();}
    else if(key==='mines'){
      Object.assign(mineGame,d);mineGame.startedAt=d.elapsed===null?null:Date.now()-d.elapsed;syncMineMode();renderMines();
      $('mine-hint-count').textContent=mineGame.hintCount;
    }else if(key==='pipes'){
      clearPipeFlowAnimation();Object.assign(pipeGame,d);pipeGame.flowTimer=null;pipeGame.animatedSeen=null;pipeGame.info=pipeReachable(pipeGame.board);$('pipe-hint-count').textContent=pipeGame.hints;renderPipes();
    }else if(key==='shikaku'){
      Object.assign(shikaku,d);shikaku.dragging=null;shikakuRebuildRegions();syncShikakuEraser();renderShikaku();
    }else if(key==='blocks'){
      Object.assign(blockGame,d);blockGame.hover=null;blockGame.history=d.history||[];renderBlocks();
    }
    runStats={...runStats,...saved.run,started:Date.now()-Math.max(0,(saved.when-(saved.run?.started||saved.when)))};
    renderStageChallenge();
    const statusId={baseball:'bb-status','2048':'g2048-status',mines:'mine-status',pipes:'pipe-status',shikaku:'shikaku-status',blocks:'block-status'}[key];
    setStatus(statusId,'저장한 게임판을 불러왔습니다. 이어서 플레이하세요.');
    v19RenderSaves();v19Toast(`${gameInfo[key].name} 이어하기 완료`);
  }catch(error){console.warn('게임 복원 실패',error);v19Toast('복원 중 오류가 발생했습니다. 원본 이어하기 자료는 삭제하지 않았습니다.');}
}
function v19LatestSave(){return ARCADE_ORDER.map(k=>v19Saves[k]).filter(Boolean).sort((a,b)=>b.when-a.when)[0];}
$('v19-resume-last').addEventListener('click',()=>{const s=v19LatestSave();if(s)v19ResumeSaved(s.key);});
$('v19-resume-game').addEventListener('click',()=>{if(activeGame)v19ResumeSaved(activeGame);});
$('v19-save-now').addEventListener('click',()=>{
  const result=v19StoreSnapshot();
  v19Toast(result==='saved'?'현재 게임판을 저장했습니다.':result==='failed'?'⚠ 게임판 저장에 실패했습니다. 저장 공간·브라우저 권한을 확인하세요.':'저장 가능한 진행 중인 게임이 없습니다.');
});
document.addEventListener('pointerdown',event=>{
  const leaving=event.target.closest('#back-to-home,#header-back,#brand-home,.arcade-nav-btn,#v19-pause-home');
  if(leaving)v19StoreSnapshot();
},true);
// 게임 조작이 끝난 직후 자동 저장. 메뉴 진입 클릭은 기존 스냅샷을 덮어쓰지 않습니다.
document.addEventListener('click',event=>{
  if(event.target.closest('.game-card,#v19-resume-last,#v19-save-list,#v19-demo-start,#clear-overlay,.v19-welcome'))return;
  if(activeGame)setTimeout(v19StoreSnapshot,50);
});
document.addEventListener('pointerup',()=>{if(activeGame)setTimeout(v19StoreSnapshot,150);});
document.addEventListener('keydown',event=>{
  if(event.key==='Escape'||event.key==='p'||event.key==='P')return;
  if(activeGame)setTimeout(v19StoreSnapshot,150);
});
window.addEventListener('beforeunload',v19StoreSnapshot);
document.addEventListener('visibilitychange',()=>{if(document.hidden){v19StoreSnapshot();if(activeGame&&!challenge.reported)v19PauseOn();}});

/* 모든 플레이어가 이용하는 6종 순차 체험 코스. 개별 250단계 기록은 불변. */
function v19LaunchDemo(step=0){
  const key=ARCADE_ORDER[step];if(!key){showHome();return;}
  showGame(key,false);
  challenge={mode:'demo',step,reported:false};
  $(DIFFICULTY_IDS[key]).value='easy';
  RESTART_ACTIONS[key]();renderStageChallenge();
  $('v19-resume-game').disabled=true;
  v19Toast(`체험 모드 ${step+1}/6 · ${gameInfo[key].name}`);
}
$('v19-demo-start').addEventListener('click',()=>v19LaunchDemo(0));

/* 게임별 상세 플레이 통계 — 단계 기록과 독립적으로 저장 */
function v19RecordWin(key){
  v19RemoveSave(key);
  const rating=getRunRating(key);
  const row=v19Playlog[key]||{wins:0,bestSeconds:null,hints:0,last:null};
  row.wins=(row.wins||0)+1;
  row.bestSeconds=row.bestSeconds===null?rating.seconds:Math.min(row.bestSeconds,rating.seconds);
  row.hints=(row.hints||0)+rating.hints;
  row.last=new Date().toISOString();
  v19Playlog[key]=row;
  try{localStorage.setItem(V19_LOG_KEY,JSON.stringify(v19Playlog));}catch(_){}
  v19LastResult={key,stars:rating.stars,hints:rating.hints,seconds:rating.seconds,
    mode:challenge.mode,level:challenge.mode==='stage'?challenge.stage+1:challenge.mode==='marathon'?challenge.round+1:null,
    date:new Date().toLocaleDateString('ko-KR')};
  v19RenderPersonalRecords();
}
function v19RenderPersonalRecords(){
  const grid=$('v19-record-grid');grid.replaceChildren();
  for(const key of ARCADE_ORDER){
    const rec=v19Playlog[key]||{};const card=document.createElement('article');card.className='v19-record-card';
    const high=key==='2048'?`최고 점수 ${readSavedBest('2048').toLocaleString()}`:key==='blocks'?`최고 점수 ${readSavedBest('blocks').toLocaleString()}`:`완료 단계 ${completedStages(key)}/250`;
    card.innerHTML=`<strong>${gameInfo[key].emoji} ${gameInfo[key].name}</strong><div>${high}</div><small>성공 ${rec.wins||0}회 · 최단 ${rec.bestSeconds===undefined||rec.bestSeconds===null?'—':rec.bestSeconds+'초'} · 힌트 누적 ${rec.hints||0}회</small>`;
    grid.appendChild(card);
  }
}
const v19Frames=[{id:'base',name:'기본',need:0},{id:'bronze',name:'브론즈',need:1},{id:'silver',name:'실버',need:3},{id:'gold',name:'골드',need:6},{id:'prism',name:'프리즘',need:8}];
let v19Frame='base';try{v19Frame=localStorage.getItem(V19_FRAME_KEY)||'base';}catch(_){}
function v19RenderFrames(){
  const achievements=ACHIEVEMENTS.filter(a=>a.test(arcadeStats())).length;
  const root=$('v19-frame-picker');root.replaceChildren();
  for(const frame of v19Frames){
    const unlocked=achievements>=frame.need||isMasterUnlocked();const b=document.createElement('button');
    b.type='button';b.className=`v19-frame-option frame-${frame.id}${frame.id===v19Frame?' current':''}`;
    b.textContent=unlocked?`${frame.name}${frame.id===v19Frame?' ✓':''}`:`🔒 ${frame.name} (${frame.need}개 업적)`;
    b.disabled=!unlocked;
    b.addEventListener('click',()=>{v19Frame=frame.id;try{localStorage.setItem(V19_FRAME_KEY,v19Frame);}catch(_){}v19RenderFrames();});
    root.appendChild(b);
  }
  if(achievements<v19Frames.find(f=>f.id===v19Frame)?.need&&!isMasterUnlocked())v19Frame='base';
  $('v19-profile-mark').dataset.frame=v19Frame;
}
const v19OriginalRenderHomeProgress=renderHomeProgress;
renderHomeProgress=function(){v19OriginalRenderHomeProgress();v19RenderPersonalRecords();v19RenderFrames();v19RenderSaves();};
renderHomeProgress();

/* 난이도 지도: 각 난이도의 50단계 달성률과 바로 선택 */
function v19StageMap(){
  const root=$('v19-stage-zones');root.replaceChildren();
  LEVEL_KEYS.forEach((tier,i)=>{
    const done=completedTierStages(activeGame,tier),button=document.createElement('button');
    button.type='button';button.className='v19-zone-chip';
    button.innerHTML=`<strong>${['🌱','🔹','⚡','💜','🔥'][i]} ${difficultyName(tier)}</strong><small>${done}/50 · ${Math.round(done/50*100)}%</small>`;
    button.classList.toggle('active',stageTier===tier);
    button.addEventListener('click',()=>selectTierAndLaunch(tier));root.appendChild(button);
  });
}
const v19OriginalRenderStageChallenge=renderStageChallenge;
renderStageChallenge=function(){v19OriginalRenderStageChallenge();v19StageMap();};

/* PAUSE: 모든 게임의 입력을 막고 지뢰찾기 제한 시간도 함께 멈춥니다. */
function v19PauseOn(){
  if(!activeGame||v19Paused||challenge.reported)return;
  v19StoreSnapshot();v19Paused=true;v19PauseStarted=Date.now();
  $('v19-paused-overlay').classList.remove('hidden');
  $('v19-resume-pause').focus();
}
function v19PauseOff(){
  if(!v19Paused)return;
  const delta=Date.now()-v19PauseStarted;
  if(mineGame.startedAt)mineGame.startedAt+=delta;
  runStats.started+=delta;
  v19Paused=false;$('v19-paused-overlay').classList.add('hidden');
}
$('v19-pause').addEventListener('click',v19PauseOn);
$('v19-resume-pause').addEventListener('click',v19PauseOff);
$('v19-pause-home').addEventListener('click',()=>{v19PauseOff();showHome();});
document.addEventListener('keydown',event=>{
  if(!activeGame||event.target?.closest('input,textarea,select,[contenteditable="true"]'))return;
  if((event.key==='p'||event.key==='P'||event.key==='Escape')&&!event.repeat){
    if($('clear-overlay')&&!$('clear-overlay').classList.contains('hidden'))return;
    if(tourDialog.open)return;
    event.preventDefault();v19Paused?v19PauseOff():v19PauseOn();
  }
},true);
// 마우스·키보드 입력이 일시정지 상태에 뒤쪽 게임판으로 전달되지 않도록 방지합니다.
document.addEventListener('click',event=>{
  if(!v19Paused)return;
  if(event.target.closest('#v19-paused-overlay'))return;
  event.preventDefault();event.stopImmediatePropagation();
},true);
const v19PriorShowHome=showHome;
showHome=function(){v19PauseOff();v19PriorShowHome();v19RenderSaves();};

/* 접근성: 색상을 기호·테두리·패턴과 함께 표시하며, 움직임 최소화 가능 */
function v19ApplyPrefs(){
  document.body.classList.toggle('v19-colorblind',Boolean(v19Prefs.colorblind));
  document.body.classList.toggle('v19-reduced-motion',Boolean(v19Prefs.reducedMotion));
  $('v19-colorblind').checked=Boolean(v19Prefs.colorblind);
  $('v19-motion').checked=Boolean(v19Prefs.reducedMotion);
  if(typeof resetHeroTimer==='function')resetHeroTimer();
}
for(const [id,key] of [['v19-colorblind','colorblind'],['v19-motion','reducedMotion']]){
  $(id).addEventListener('change',e=>{v19Prefs[key]=e.target.checked;try{localStorage.setItem(V19_PREF_KEY,JSON.stringify(v19Prefs));window.TaekinV32Save?.record(true);}catch(_){window.TaekinV32Save?.record(false);}v19ApplyPrefs();});
}
v19ApplyPrefs();

/* 게임별 편의 기능: 지뢰찾기 주변 숫자 더블클릭, 파이프 물 흐름 속도 */
function v19MineChord(r,c){
  if(activeGame!=='mines'||mineGame.state!=='playing'||!mineGame.open[r]?.[c]||!mineGame.adjacent[r][c])return;
  const neighbors=mineNeighbors(r,c,mineGame.size);
  const flags=neighbors.filter(([nr,nc])=>mineGame.flags[nr][nc]).length;
  if(flags!==mineGame.adjacent[r][c]){
    setStatus('mine-status',`주변 깃발 ${flags}개 / 숫자 ${mineGame.adjacent[r][c]}개 · 일치하면 주변 칸을 한 번에 열 수 있어요.`);return;
  }
  for(const [nr,nc] of neighbors){
    if(mineGame.state!=='playing')break;
    if(!mineGame.flags[nr][nc]&&!mineGame.open[nr][nc])revealMines(nr,nc);
  }
}
$('v19-water-speed').addEventListener('change',e=>{
  const seconds={slow:'3.2s',normal:'1.8s',fast:'.85s'}[e.target.value];
  $('pipe-board').style.setProperty('--v19-flow-speed',seconds||'1.8s');
  v19Toast('물 흐름 속도를 변경했습니다.');
});

/* 마지막 클리어 결과를 PNG로 내보내기. 별 수치와 시간은 당시 실제 플레이 기록 사용 */
$('v19-share').addEventListener('click',()=>{
  const d=v19LastResult;
  if(!d)return v19Toast('저장할 클리어 기록이 없습니다.');
  const canvas=document.createElement('canvas');canvas.width=960;canvas.height=540;
  const ctx=canvas.getContext('2d');if(!ctx)return;
  const grad=ctx.createLinearGradient(0,0,960,540);grad.addColorStop(0,'#151c29');grad.addColorStop(1,'#273044');
  ctx.fillStyle=grad;ctx.fillRect(0,0,960,540);
  ctx.fillStyle='#a3c4bd';ctx.font='bold 27px Arial';ctx.fillText('TAEKIN BRAIN ARCADE',62,79);
  ctx.fillStyle='#f5f3ea';ctx.font='bold 60px Arial';ctx.fillText('STAGE CLEAR',60,185);
  ctx.font='bold 35px sans-serif';ctx.fillText(gameInfo[d.key].name+(d.level?`  ${d.level}단계`:''),62,248);
  ctx.fillStyle='#f8c77f';ctx.font='bold 54px Arial';ctx.fillText('★'.repeat(d.stars)+'☆'.repeat(3-d.stars),62,328);
  ctx.fillStyle='#d2dbe2';ctx.font='26px sans-serif';ctx.fillText(`클리어 시간  ${d.seconds}초    |    힌트  ${d.hints}회`,62,385);
  ctx.strokeStyle='#586d7a';ctx.beginPath();ctx.moveTo(60,433);ctx.lineTo(900,433);ctx.stroke();
  ctx.fillStyle='#96a5b4';ctx.font='23px Arial';ctx.fillText(`${d.date}   ·   MADE BY TAEKIN`,62,485);
  const a=document.createElement('a');a.download=`TAEKIN_${d.key}_${d.level||'clear'}_result.png`;a.href=canvas.toDataURL('image/png');a.click();
  v19Toast('클리어 결과 PNG를 저장했습니다.');
});

// 홈으로 들어갈 때 이어하기 목록을 최신으로 갱신
v19RenderSaves();


/* 숫자야구: 작은 자리 수에서는 남은 정답 후보 수를 계산합니다. */
function v19UpdateBaseballCandidates(){
  const el=$('v19-candidates');if(!el)return;
  const length=baseball.digits;
  if(length>5){el.textContent=`${length}자리 고난도 추리 · 이전 스트라이크/볼 기록을 이용해 후보를 줄여 보세요.`;return;}
  let count=0;const digits=Array.from({length:10},(_,i)=>String(i));
  const attempt=(candidate,used)=>{
    if(candidate.length===length){
      if(baseball.guesses.every(g=>{const a=baseballJudge(candidate,g.guess);return a.strikes===g.strikes&&a.balls===g.balls;}))count++;
      return;
    }
    for(let i=0;i<10;i++)if(!(used&(1<<i)))attempt([...candidate,digits[i]],used|(1<<i));
  };
  attempt([],0);
  el.textContent=`🔎 가능한 숫자 후보: ${count.toLocaleString()}개${baseball.guesses.length?' · 지금까지의 결과를 모두 반영':''}`;
}
function v19UpdateShikakuPreview(){
  const el=$('v19-shikaku-preview');if(!el)return;
  if(shikaku.preview){
    const r=shikaku.preview,error=shikakuValidate(r);
    el.textContent=`선택 중: ${(r.r2-r.r1+1)}행 × ${(r.c2-r.c1+1)}열 · 넓이 ${rectArea(r)}칸 · ${error?'✕ '+error:'✓ 올바른 영역'}`;
    el.classList.toggle('v41-preview-error',Boolean(error));
  }else{
    el.classList.remove('v41-preview-error');
    el.textContent=shikaku.anchor?`시작점: ${shikaku.anchor.r+1}행 ${shikaku.anchor.c+1}열 · 끝 칸을 선택하세요.`:'영역 선택: 시작 칸을 클릭하거나 드래그하세요.';
  }
}
function v41StyleShikakuPreview(){
  const board=$('shikaku-board');if(!board)return;
  const invalid=Boolean(shikaku.preview&&shikakuValidate(shikaku.preview));
  board.querySelectorAll('.shikaku-cell.preview').forEach(cell=>cell.classList.toggle('v41-invalid-preview',invalid));
}

;

/* ==========================================================================
   배지 35개·꾸미기·마스터 코드  (업적·꾸미기 모듈)
   ========================================================================== */
/* 업적 도감·개인 꾸미기·마스터 코드
 * 플레이 기록은 기존 엔진이 관리하며, 비밀 보상 해금은 기록과 분리합니다.
 * 별도 계정 인증이나 서버 보안이 없는 로컬 웹앱입니다.
 */
(() => {
  'use strict';
  const $v = id => document.getElementById(id);
  const PREFIX = 'taekin.arcade.v20';
  const SETTINGS_KEY = PREFIX + '.appearance';
  const BONUS_KEY = PREFIX + '.bonus';
  const MASTER_KEY = PREFIX + '.master';
  const TYPES = { bg:'배경화면', frame:'프로필 테두리', accent:'포인트 색상', emblem:'프로필 엠블럼' };
  const CATEGORY = {start:'시작',progress:'단계 도전',stars:'별·보스',games:'게임별',challenge:'종합 도전'};
  const GAME_ORDER = ['baseball','2048','mines','pipes','shikaku','blocks'];
  const GAME_NAMES = {baseball:'숫자야구','2048':'2048',mines:'지뢰찾기',pipes:'파이프',shikaku:'시카쿠',blocks:'블록 퍼즐'};

  const BADGES = [
    ['first','첫 번째 퍼즐','start','🌱','아무 게임 1단계 클리어', 'bg','linen','리넨 배경',s=>s.total>=1],
    ['three','작은 발걸음','start','👟','전체 단계 3개 클리어','accent','mint','민트 포인트',s=>s.total>=3],
    ['six','여섯 칸의 출발','start','🎲','전체 단계 6개 클리어','emblem','dice','주사위 엠블럼',s=>s.total>=6],
    ['ten','열 번째 기록','progress','🎯','전체 단계 10개 클리어','bg','grid','그리드 배경',s=>s.total>=10],
    ['twentyfive','차근차근','progress','🧗','전체 단계 25개 클리어','frame','copper','코퍼 테두리',s=>s.total>=25],
    ['fifty','반백 달성','progress','📚','전체 단계 50개 클리어','bg','dusk','더스크 배경',s=>s.total>=50],
    ['hundred','백 단계 돌파','progress','💯','전체 단계 100개 클리어','accent','amber','앰버 포인트',s=>s.total>=100],
    ['twohundred','끈기의 기록','progress','🔭','전체 단계 200개 클리어','frame','ocean','오션 테두리',s=>s.total>=200],
    ['threehundred','하프 마스터','progress','🏔️','전체 단계 300개 클리어','bg','forest','포레스트 배경',s=>s.total>=300],
    ['fourhundred','꾸준함의 증명','progress','⏳','전체 단계 400개 클리어','emblem','hourglass','모래시계 엠블럼',s=>s.total>=400],
    ['fivehundred','정상의 문턱','progress','🚀','전체 단계 500개 클리어','frame','royal','로열 테두리',s=>s.total>=500],
    ['all600','전설의 수집가','progress','🏆','개별 단계 1,500개 모두 클리어','bg','stellar','스텔라 배경',s=>s.total>=1500],
    ['star15','반짝이는 시작','stars','⭐','별 15개 획득','accent','sky','스카이 포인트',s=>s.stars>=15],
    ['star75','은하수 입문','stars','🌟','별 75개 획득','bg','indigo','인디고 배경',s=>s.stars>=75],
    ['star200','별빛 항해','stars','🌌','별 200개 획득','emblem','sparkle','별빛 엠블럼',s=>s.stars>=200],
    ['star500','별의 지휘자','stars','✨','별 500개 획득','accent','violet','바이올렛 포인트',s=>s.stars>=500],
    ['perfect1','첫 완벽','stars','💎','3성 기록 1개 획득','frame','pearl','펄 테두리',s=>s.perfect>=1],
    ['perfect20','정밀한 플레이','stars','🎖️','3성 기록 20개 획득','emblem','medal','메달 엠블럼',s=>s.perfect>=20],
    ['perfect80','완벽주의자','stars','🔷','3성 기록 80개 획득','bg','slate','슬레이트 배경',s=>s.perfect>=80],
    ['boss1','첫 보스 격파','stars','👑','보스 스테이지 1개 클리어','frame','brass','브라스 테두리',s=>s.boss>=1],
    ['boss10','보스 사냥꾼','stars','⚔️','보스 스테이지 10개 클리어','emblem','crown','왕관 엠블럼',s=>s.boss>=10],
    ['boss30','보스의 정점','stars','🏅','보스 스테이지 30개 클리어','accent','gold','골드 포인트',s=>s.boss>=30],
    ['explorer','퍼즐 탐험가','games','🧭','6개 게임 모두 1단계 이상 클리어','bg','sand','샌드 배경',s=>s.games===6],
    ['baseball','숫자의 탐정','games','⚾','숫자야구 20단계 클리어','emblem','baseball','야구공 엠블럼',s=>s.game.baseball>=20],
    ['g2048','타일 전략가','games','🔢','2048 20단계 클리어','frame','tile','타일 테두리',s=>s.game['2048']>=20],
    ['mines','안전지대 탐색가','games','💣','지뢰찾기 20단계 클리어','accent','coral','코랄 포인트',s=>s.game.mines>=20],
    ['pipes','물길 설계자','games','💧','파이프 20단계 클리어','bg','deepsea','심해 배경',s=>s.game.pipes>=20],
    ['shikaku','영역의 예술가','games','🧩','시카쿠 20단계 클리어','emblem','shikaku','퍼즐 엠블럼',s=>s.game.shikaku>=20],
    ['blocks','블록 건축가','games','🧱','블록 퍼즐 20단계 클리어','bg','terra','테라 배경',s=>s.game.blocks>=20],
    ['master1','한 게임 마스터','games','🔥','한 게임에서 250단계 클리어','frame','obsidian','옵시디언 테두리',s=>Object.values(s.game).some(n=>n>=250)],
    ['challenge1','종합 도전자','challenge','🚩','도전 모드 1라운드 클리어','accent','jade','제이드 포인트',s=>s.round>=1],
    ['challenge10','열 번의 완주','challenge','🎗️','도전 모드 10라운드 클리어','emblem','flag','깃발 엠블럼',s=>s.round>=10],
    ['challenge25','장거리 도전자','challenge','🏃','도전 모드 25라운드 클리어','bg','nightfall','나이트폴 배경',s=>s.round>=25],
    ['challenge50','종합 마스터','challenge','🪐','도전 모드 50라운드 클리어','frame','aurora','오로라 테두리',s=>s.round>=50],
    ['challenge100','아케이드의 전설','challenge','🥇','도전 모드 100라운드 완주','bg','champion','챔피언 배경',s=>s.round>=100]
  ].map(([id,name,category,icon,detail,type,rewardId,rewardName,test])=>({id,name,category,icon,detail,type,rewardId,rewardName,test}));

  const DEFAULT_REWARDS = {
    bg: [{id:'base',name:'기본 배경'}],
    frame:[{id:'base',name:'기본 테두리'}],
    accent:[{id:'base',name:'기본 포인트'}],
    emblem:[{id:'base',name:'기본 엠블럼'}]
  };
  const EMBLEMS = {base:'T.',dice:'🎲',hourglass:'⌛',sparkle:'✦',medal:'🏅',crown:'♛',baseball:'⚾',shikaku:'⬡',flag:'⚑'};
  const safeGet = (key, fallback) => {try {return JSON.parse(localStorage.getItem(key)) ?? fallback;}catch(_){return fallback;}};
  const safeSet = (key,value) => {try{localStorage.setItem(key,JSON.stringify(value));window.TaekinV32Save?.record(true);return true;}catch(_){window.TaekinV32Save?.record(false);return false;}};
  let appearance = Object.assign({bg:'base',frame:'base',accent:'base',emblem:'base'},safeGet(SETTINGS_KEY,{}));
  let extraUnlocks = new Set((safeGet(BONUS_KEY,[])||[]).filter(id=>BADGES.some(a=>a.id===id)));
  let filter='all';
  let lastEarned = new Set();
  let renderedOnce=false;

  function stats(){
    const game=Object.fromEntries(GAME_ORDER.map(key=>[key,Math.max(0,Number(arcadeProgress.stages?.[key])||0)]));
    const current=arcadeStats();
    return {game,total:current.cleared,stars:current.stars,perfect:current.perfect,boss:current.boss,games:current.gamesCleared,round:current.marathon};
  }
  function isNormalEarned(a,s){try{return !!a.test(s);}catch(_){return false;}}
  function status(a,s){if(isNormalEarned(a,s))return 'earned';return extraUnlocks.has(a.id)||isMasterUnlocked()?'special':'locked';}
  function isAvailable(a,s){return status(a,s)!=='locked';}
  function availableRewards(type,s){return [...DEFAULT_REWARDS[type],...BADGES.filter(a=>a.type===type&&isAvailable(a,s)).map(a=>({id:a.rewardId,name:a.rewardName,source:a.name}))];}
  function applyAppearance(){
    const s=stats();
    for(const type of ['bg','frame','accent','emblem']){
      if(!availableRewards(type,s).some(reward=>reward.id===appearance[type]))appearance[type]='base';
    }
    document.body.dataset.v20Bg=appearance.bg;
    document.body.dataset.v20Frame=appearance.frame;
    document.body.dataset.v20Accent=appearance.accent;
    document.body.dataset.v20Emblem=appearance.emblem;
    const mark=$v('v19-profile-mark');
    if(mark)mark.textContent=EMBLEMS[appearance.emblem]||'T.';
    safeSet(SETTINGS_KEY,appearance);
  }
  function makeText(tag,cls,content){const e=document.createElement(tag);if(cls)e.className=cls;e.textContent=content;return e;}
  function renderInventory(s){
    const root=$v('v20-inventory');if(!root)return;
    root.replaceChildren();
    for(const type of ['bg','frame','accent','emblem']){
      const section=document.createElement('section');section.className='v20-inventory-group';
      section.appendChild(makeText('h4','',TYPES[type]));
      const choices=document.createElement('div');choices.className='v20-reward-choices';
      for(const reward of [...DEFAULT_REWARDS[type],...BADGES.filter(a=>a.type===type).map(a=>({id:a.rewardId,name:a.rewardName,source:a.name,achievement:a}))]){
        const unlocked=!reward.achievement||isAvailable(reward.achievement,s);
        const current=appearance[type]===reward.id;
        const button=document.createElement('button');button.type='button';button.disabled=!unlocked;
        button.className='v20-choice'+(current?' selected':'');
        button.dataset.rewardType=type;button.dataset.rewardId=reward.id;
        const swatch=makeText('span','v20-swatch '+`v20-swatch-${type}-${reward.id}`,type==='emblem'?(EMBLEMS[reward.id]||'✦'):'');
        const label=makeText('span','v20-choice-label',(unlocked?'':'🔒 ')+reward.name);
        const hint=makeText('small','',current?'적용 중':unlocked?'선택 가능':`해금: ${reward.source}`);
        label.appendChild(hint);button.append(swatch,label);
        if(unlocked)button.addEventListener('click',()=>{appearance[type]=reward.id;applyAppearance();renderAll();});
        choices.appendChild(button);
      }
      section.appendChild(choices);root.appendChild(section);
    }
  }
  function badgeCard(a,s){
    const st=status(a,s),card=document.createElement('button');card.type='button';
    card.className=`v20-achievement ${st}`;
    card.dataset.category=a.category;card.dataset.badgeId=a.id;
    card.disabled=st==='locked';
    card.title=st==='earned'?'대표 배지로 설정':st==='special'?'마스터 특별 해금 · 대표 배지로 바로 선택 가능':'잠긴 배지 · 달성 조건 확인';
    card.append(makeText('span','v20-ach-icon',st==='locked'?'🔒':a.icon));
    const body=document.createElement('div');body.className='v20-ach-content';
    body.append(makeText('strong','',a.name),makeText('small','',a.detail),makeText('span','v20-ach-reward','트로피 컬렉션 · 성장 경험치 획득'));
    const badge=makeText('span','v20-ach-state',st==='earned'?'획득 완료':st==='special'?'특별 해금':'잠김');
    card.append(body,badge);
    if(st!=='locked')card.addEventListener('click',()=>window.TaekinHall?.selectBadge?.(a.id));
    return card;
  }
  function renderCollection(s){
    const root=$v('v20-collection');if(!root)return;
    root.replaceChildren();
    const count=BADGES.filter(a=>isAvailable(a,s)).length;
    $v('v20-total').textContent=`${count} / ${BADGES.length}개 해금`;
    $v('v20-total-bar').style.width=`${count/BADGES.length*100}%`;
    const category=filter;
    BADGES.filter(a=>category==='all'||category==='available'&&isAvailable(a,s)||category==='locked'&&!isAvailable(a,s)||a.category===category)
      .forEach(a=>root.appendChild(badgeCard(a,s)));
    if(root.childElementCount===0)root.appendChild(makeText('p','v20-empty','해당하는 업적이 없습니다.'));
    document.querySelectorAll('[data-v20-filter]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.v20Filter===filter)));
  }
  function renderAll(){
    const s=stats();applyAppearance();renderInventory(s);renderCollection(s);
    if(renderedOnce){
      const actual=BADGES.filter(a=>isNormalEarned(a,s)).map(a=>a.id);
      for(const id of actual){if(!lastEarned.has(id)){
        const badge=BADGES.find(a=>a.id===id);
        if(badge&&typeof v19Toast==='function')v19Toast(`🏅 업적 달성: ${badge.name} · ${badge.rewardName} 해금`);
      }}
    }
    lastEarned=new Set(BADGES.filter(a=>isNormalEarned(a,s)).map(a=>a.id));renderedOnce=true;window.dispatchEvent(new Event('taekin-achievements-updated'));
  }
  $v('v20-filter-bar').addEventListener('click',event=>{
    const button=event.target.closest('[data-v20-filter]');if(!button)return;
    filter=button.dataset.v20Filter;renderCollection(stats());
  });
  // 기존 스테이지 기록 저장 루틴을 유지하고 업적 화면만 업데이트합니다.
  const originalRenderHomeProgress=renderHomeProgress;
  renderHomeProgress=function(){originalRenderHomeProgress();renderAll();};
  renderAll();

  // 로컬에서만 동작하는 개인용 보상 관리 도구.
  // 브라우저 코드 자체는 누구든 열어볼 수 있으므로 서버 보안 기능은 아닙니다.
  let taps=0,tapTime=0;
  $v('brand-home').addEventListener('click',()=>{
    const now=Date.now();if(now-tapTime>8000)taps=0;
    tapTime=now;taps++;
    if(taps>=5){taps=0;openMaster();}
  });
  const dialog=$v('v20-master-dialog');
  const masterMessage=$v('v20-master-message');
  const masterCode=$v('v20-master-code');
  const masterConfirm=$v('v20-master-confirm-input');
  let authorized=false;
  function masterCredential(){return safeGet(MASTER_KEY,null);}
  function showMasterMessage(message){masterMessage.textContent=message;}
  function setMasterView(){
    const exists=!!masterCredential();
    $v('v20-master-title').textContent=exists?'마스터 코드 입력':'개인 마스터 코드 만들기';
    $v('v20-master-set').hidden=exists;
    $v('v20-master-login').hidden=!exists;
    $v('v20-master-tools').hidden=!authorized;
    $v('v20-master-confirm-wrap').hidden=exists;
    masterCode.value='';masterConfirm.value='';
    showMasterMessage(exists?'설정한 비밀 코드를 입력하세요.':'6자 이상 코드로 개인 해금 기능을 설정하세요.');
  }
  function openMaster(){authorized=false;setMasterView();if(!dialog.open)dialog.showModal();masterCode.focus();}
  $v('v20-master-close').addEventListener('click',()=>dialog.close());
  dialog.addEventListener('close',()=>{authorized=false;masterCode.value='';masterConfirm.value='';});
  const enc=new TextEncoder();
  // HTML 파일을 직접 열어 WebCrypto subtle을 사용할 수 없는 경우에도
  // 기존 SHA-256 저장값과 같은 결과를 만드는 순수 JS 경로를 제공합니다.
  function sha256Portable(input){
    const primes=[];
    for(let candidate=2;primes.length<64;candidate++){
      if(primes.every(prime=>candidate%prime!==0))primes.push(candidate);
    }
    const k=primes.map(prime=>Math.floor((Math.cbrt(prime)%1)*0x100000000)>>>0);
    const h=primes.slice(0,8).map(prime=>Math.floor((Math.sqrt(prime)%1)*0x100000000)>>>0);
    const size=Math.ceil((input.length+9)/64)*64;
    const padded=new Uint8Array(size);padded.set(input);padded[input.length]=0x80;
    const view=new DataView(padded.buffer),bits=input.length*8;
    view.setUint32(size-8,Math.floor(bits/0x100000000));
    view.setUint32(size-4,bits>>>0);
    const rotate=(value,shift)=>(value>>>shift)|(value<<(32-shift));
    for(let offset=0;offset<size;offset+=64){
      const w=new Uint32Array(64);
      for(let i=0;i<16;i++)w[i]=view.getUint32(offset+i*4);
      for(let i=16;i<64;i++){
        const x=w[i-15],y=w[i-2];
        const s0=rotate(x,7)^rotate(x,18)^(x>>>3);
        const s1=rotate(y,17)^rotate(y,19)^(y>>>10);
        w[i]=(w[i-16]+s0+w[i-7]+s1)>>>0;
      }
      let [a,b,c,d,e,f,g,hh]=h;
      for(let i=0;i<64;i++){
        const s1=rotate(e,6)^rotate(e,11)^rotate(e,25);
        const ch=(e&f)^(~e&g);
        const t1=(hh+s1+ch+k[i]+w[i])>>>0;
        const s0=rotate(a,2)^rotate(a,13)^rotate(a,22);
        const maj=(a&b)^(a&c)^(b&c);
        const t2=(s0+maj)>>>0;
        hh=g;g=f;f=e;e=(d+t1)>>>0;d=c;c=b;b=a;a=(t1+t2)>>>0;
      }
      const current=[a,b,c,d,e,f,g,hh];
      for(let i=0;i<8;i++)h[i]=(h[i]+current[i])>>>0;
    }
    return h.map(n=>n.toString(16).padStart(8,'0')).join('');
  }
  async function digest(text){
    const bytes=enc.encode(text);
    if(window.crypto?.subtle){
      try{
        const result=await window.crypto.subtle.digest('SHA-256',bytes);
        return [...new Uint8Array(result)].map(x=>x.toString(16).padStart(2,'0')).join('');
      }catch(_){/* 로컬 파일·보안 환경 차이로 실패하면 같은 SHA-256 계산을 사용 */ }
    }
    return sha256Portable(bytes);
  }
  function randomSalt(){
    const bytes=new Uint8Array(16);
    if(window.crypto?.getRandomValues)window.crypto.getRandomValues(bytes);
    else for(let i=0;i<bytes.length;i++)bytes[i]=Math.floor(Math.random()*256);
    return [...bytes].map(n=>n.toString(16).padStart(2,'0')).join('');
  }
  $v('v20-master-set').addEventListener('click',async()=>{
    const code=masterCode.value;
    if(code.length<6){showMasterMessage('코드는 최소 6자 이상이어야 합니다.');return;}
    if(code!==masterConfirm.value){showMasterMessage('비밀 코드 확인이 일치하지 않습니다.');return;}
    if(masterCredential()){setMasterView();return;}
    try{const salt=randomSalt();if(!safeSet(MASTER_KEY,{salt,hash:await digest(salt+'|'+code)}))throw Error('저장할 수 없습니다.');
      authorized=true;$v('v20-master-tools').hidden=false;window.TaekinMaster.setUnlocked(true);showMasterMessage('마스터 코드 설정 완료! 배지·꾸미기·트로피·레벨 보상·모든 단계·올클리어 기념패를 시연용으로 특별 해금했어요.');
      $v('v20-master-set').hidden=true;masterConfirm.value='';masterCode.value='';
    }catch(error){showMasterMessage(error.message);}
  });
  $v('v20-master-login').addEventListener('click',async()=>{
    const saved=masterCredential();if(!saved){setMasterView();return;}
    try{if(await digest(saved.salt+'|'+masterCode.value)!==saved.hash){showMasterMessage('코드가 일치하지 않습니다.');return;}
      authorized=true;$v('v20-master-tools').hidden=false;window.TaekinMaster.setUnlocked(true);showMasterMessage('인증 성공! 모든 해금 요소가 열렸어요. 실제 기록·XP·별은 변경되지 않습니다.');masterCode.value='';
    }catch(error){showMasterMessage(error.message);}
  });
  $v('v20-master-unlock').addEventListener('click',()=>{
    if(!authorized)return;
    if(!window.confirm('모든 잠금 요소를 특별 해금할까요? 실제 게임 기록·별·경험치는 변경되지 않습니다.'))return;
    extraUnlocks=new Set(BADGES.map(a=>a.id));safeSet(BONUS_KEY,[...extraUnlocks]);window.TaekinMaster.setUnlocked(true);renderAll();
    showMasterMessage('모든 해금 요소를 열었습니다. 실제 클리어 기록·경험치는 그대로입니다.');
  });
  $v('v20-master-relock').addEventListener('click',()=>{
    if(!authorized)return;
    if(!window.confirm('특별 해금만 해제할까요? 플레이로 달성한 업적은 유지됩니다.'))return;
    extraUnlocks.clear();safeSet(BONUS_KEY,[]);window.TaekinMaster.setUnlocked(false);renderAll();showMasterMessage('마스터 특별 해금을 해제했습니다. 실제 플레이로 얻은 보상은 유지돼요.');
  });
  // 명예의 전당에 업적 상태를 제공합니다. 비밀 코드 관련 정보는 제공하지 않습니다.
  window.TaekinAchievementCollection = {
    list: () => {const s=stats();return BADGES.map(a=>({id:a.id,name:a.name,category:a.category,icon:a.icon,detail:a.detail,type:a.type,rewardId:a.rewardId,rewardName:a.rewardName,state:status(a,s)}));},
    refresh: renderAll
  };
  // 모든 스크립트가 로드된 후 불러오기/초기화가 뒤따라도 화면을 맞춥니다.
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)renderAll();});
  window.addEventListener('storage',e=>{if([SETTINGS_KEY,BONUS_KEY].includes(e.key)){
    appearance=Object.assign({bg:'base',frame:'base',accent:'base',emblem:'base'},safeGet(SETTINGS_KEY,{}));
    extraUnlocks=new Set(safeGet(BONUS_KEY,[]));renderAll();
  }});
})();

;

/* ==========================================================================
   명예의 전당·레벨·칭호  (명예의 전당 모듈)
   ========================================================================== */
/* 명예의 전당·레벨·칭호·배지 도감
 * XP는 실제 플레이 기록과 미션 최초 보상으로 산출합니다.
 * 중복 플레이·마스터 특별 해금은 XP를 부풀리지 않습니다.
 * 기존 진행 상태, 35개 업적과 마스터 코드 저장 키는 그대로 유지합니다.
 */
(() => {
  'use strict';
  const $h = id => document.getElementById(id);
  const FEATURED_KEY = 'taekin.arcade.v22.featuredBadge';
  const trophies = [
    {id:'first',name:'첫 번째 발자국',icon:'🏅',detail:'첫 스테이지 클리어'},
    {id:'explorer',name:'육각형 탐험가',icon:'🧭',detail:'6종 게임 모두 도전'},
    {id:'hundred',name:'백 개의 계단',icon:'🥉',detail:'스테이지 100개 완수'},
    {id:'star200',name:'별빛 수집가',icon:'🌟',detail:'별 200개 수집'},
    {id:'boss10',name:'보스 사냥꾼',icon:'⚔️',detail:'보스 스테이지 10개 클리어'},
    {id:'challenge25',name:'끝없는 도전자',icon:'🥈',detail:'도전 모드 25라운드'},
    {id:'all600',name:'1,500단계 정복자',icon:'🏆',detail:'1,500개 스테이지 모두 완료'},
    {id:'challenge100',name:'아케이드의 전설',icon:'👑',detail:'도전 모드 100라운드 완주'}
  ];
  const titles = [
    [50,'신화의 아케이드 왕','모든 장르를 정복한 최상위 플레이어'],
    [40,'우주의 퍼즐 지배자','우주를 가로지르는 전설의 챔피언'],
    [30,'퍼즐의 전설','수많은 스테이지를 정복한 전설'],
    [25,'아케이드 챔피언','정교한 도전 기록을 세우는 챔피언'],
    [20,'전설의 도전자','어려운 퍼즐도 끝까지 해결하는 도전자'],
    [15,'별빛 전략가','별과 보스 기록을 쌓아가는 전략가'],
    [10,'숙련 해결사','여섯 가지 퍼즐을 능숙하게 풀어가는 해결사'],
    [5,'황금빛 모험가','아케이드에서 실력을 키워 가는 모험가'],
    [1,'견습 탐험가','첫 퍼즐에서 새로운 전설이 시작됩니다']
  ];
  const legendary = new Set(['all600','challenge100','boss30','star500']);
  const epic = new Set(['fivehundred','master1','challenge50','perfect80','star200','boss10','threehundred','challenge25']);
  const rare = new Set(['hundred','twohundred','fourhundred','perfect20','star75','boss1','explorer','challenge10','star15','twentyfive','fifty','g2048','baseball','mines','pipes','shikaku','blocks']);
  function badgeRarity(id){
    return legendary.has(id)?{label:'전설',icon:'💎',color:'#f3d78a'}:
      epic.has(id)?{label:'영웅',icon:'🔮',color:'#d7b1ef'}:
      rare.has(id)?{label:'희귀',icon:'🔷',color:'#a6d4ef'}:
      {label:'일반',icon:'◆',color:'#bfceb9'};
  }
  function actualBadges(){return window.TaekinAchievementCollection?.list?.()||[];}
  function num(value,max){return Math.min(max,Math.max(0,Number(value)||0));}
  function experience(s,badges){
    return num(s.cleared,1500)*10 + num(s.stars,4500)*4 + num(s.perfect,1500)*10 +
      num(s.boss,150)*50 + num(s.marathon,100)*30 + badges.filter(a=>a.state==='earned').length*55 +
      num(window.TaekinMissions?.earnedXP?.(),100000);
  }
  // 다음 레벨 도달 시 필요한 누적 XP. 최대 레벨 50.
  function xpAtLevel(level){const n=level-1;return 22*n*n+70*n;}
  function levelForXP(xp){let level=1;while(level<50&&xp>=xpAtLevel(level+1))level++;return level;}
  function savedFeatured(){try{return localStorage.getItem(FEATURED_KEY)||'';}catch(_){return '';}}
  let featuredId=savedFeatured();
  function featuredBadge(list){
    const earned=list.filter(a=>a.state!=='locked');
    return earned.find(a=>a.id===featuredId)||earned[0]||null;
  }
  function make(tag,cls,label){
    const el=document.createElement(tag);if(cls)el.className=cls;
    if(label!==undefined)el.textContent=label;return el;
  }
  function renderTrophies(list){
    const byId=new Map(list.map(a=>[a.id,a]));
    const root=$h('v22-trophy-grid');if(!root)return;
    const fragment=document.createDocumentFragment();
    let count=0;let next=null;
    for(const trophy of trophies){
      const badge=byId.get(trophy.id),earned=Boolean(badge&&badge.state!=='locked');
      if(earned)count++;else if(!next)next=trophy;
      const card=make('article','v22-trophy '+(earned?'earned':'locked'));
      card.append(make('span','v22-trophy-icon',earned?trophy.icon:'🔒'),
        make('strong','v22-trophy-name',trophy.name),
        make('small','v22-trophy-hint',trophy.detail),
        make('span','v22-trophy-state',earned?(badge?.state==='special'?'특별 해금':'획득 완료'):'미획득'));
      card.title=earned?'트로피 획득 완료':'달성 조건: '+(badge?.detail||trophy.detail);
      fragment.append(card);
    }
    root.replaceChildren(fragment);
    $h('v22-trophy-count').innerHTML=count+' <small>/ '+trophies.length+'</small>';
    $h('v22-next-goal').textContent=next?'다음 트로피 목표 · '+next.name+' — '+(byId.get(next.id)?.detail||next.detail):'축하해요! 모든 트로피를 수집했습니다.';
    const earnedCount=list.filter(a=>a.state==='earned').length;
    $h('v22-hall-badges').textContent='실제 획득 배지 '+earnedCount+' / '+list.length;
  }
  function renderBadges(list,featured){
    for(const card of document.querySelectorAll('.v20-achievement[data-badge-id]')){
      const badge=list.find(a=>a.id===card.dataset.badgeId);
      if(!badge)continue;
      const rarity=badgeRarity(badge.id);
      card.dataset.featured=String(!!featured&&featured.id===badge.id);
      card.querySelector('.v20-ach-reward').textContent=rarity.icon+' '+rarity.label+' 배지 · 실제 획득 시 +55 XP';
      card.querySelector('.v20-ach-reward').style.color=rarity.color;
      if(card.dataset.featured==='true')card.querySelector('.v20-ach-state').textContent='★ 대표 배지';
    }
  }
  // v47: 이미 존재하는 LV 5~50 꾸미기 해금을 프로필에서 바로 보여줍니다.
  // 레벨 보상은 외형 변경에만 사용되며, 게임 규칙/XP/진행 데이터는 그대로 유지됩니다.
  const LEVEL_MILESTONES=[
    [5,'◉','네온 링 · 스틸 프레임'],
    [10,'⌁','네온 게임룸 스킨'],
    [15,'◇','프리즘 오라 · 보석 프레임'],
    [20,'♛','로열 아케이드 스킨'],
    [25,'✦','코스믹 오라 · 사이버 프레임'],
    [30,'⬡','홀로그램 스킨'],
    [40,'✷','전설의 광휘 · 황제 프레임'],
    [50,'✺','미틱 오로라 스킨']
  ];
  function renderLevelRewards(level,actualLevel){
    const root=$h('v47-level-rewards-grid'),next=$h('v47-next-reward');
    if(!root||!next)return;
    const master=isMasterUnlocked();
    const unlocked=LEVEL_MILESTONES.filter(item=>level>=item[0]);
    const nextReward=LEVEL_MILESTONES.find(item=>level<item[0]);
    $h('v47-current-level').textContent='LV. '+actualLevel+(master?' · 시연 해금 중':'');
    next.textContent=nextReward
      ?`🎁 다음 보상: LV. ${nextReward[0]}에 「${nextReward[2]}」 해금${master?' · 마스터 코드는 미리보기만 제공합니다.':''}`
      :master?'🎉 모든 꾸미기 보상을 미리 볼 수 있어요. 실제 레벨 기록은 그대로 유지됩니다.':'🏆 모든 레벨 꾸미기 보상을 열었어요!';
    const fragment=document.createDocumentFragment();
    for(const [need,icon,name] of LEVEL_MILESTONES){
      const available=level>=need;
      const card=make('div','v47-perk-card'+(available?' is-unlocked':' is-locked'));
      const badge=make('span','v47-perk-icon',available?icon:'🔒');
      const label=make('div','v47-perk-detail');
      label.append(make('strong','',name),make('small','',`LV. ${need} · ${available?(master&&need>actualLevel?'특별 미리보기':'해금 완료'):'잠김'}`));
      card.append(badge,label);fragment.append(card);
    }
    root.replaceChildren(fragment);
    const profile=$h('player-growth');if(profile)profile.dataset.v47Glow=String(level>=40?4:level>=30?3:level>=20?2:level>=10?1:0);
  }
  const styleLink=$h('v47-show-style');
  styleLink?.addEventListener('click',()=>{
    const panel=$h('v29-style-studio');if(!panel)return;
    panel.open=true;
    panel.scrollIntoView({behavior:document.body.classList.contains('v19-reduced-motion')?'instant':'smooth',block:'start'});
    panel.querySelector('summary')?.focus({preventScroll:true});
  });
  function render(){
    const list=actualBadges();if(!list.length)return;
    const s=arcadeStats(),xp=experience(s,list),actualLevel=levelForXP(xp),level=isMasterUnlocked()?50:actualLevel;
    const title=titles.find(item=>level>=item[0]);
    $h('v22-level-mark').textContent=String(level).padStart(2,'0');
    $h('v22-level').textContent='LV. '+level;
    $h('v22-title').textContent=title[1];
    $h('v22-growth-description').textContent=isMasterUnlocked()?title[2]+' · 마스터 시연 해금 상태 (실제 성장 XP는 그대로 유지)':title[2]+' · 플레이 기록과 미션 보상으로 성장합니다.';
    $h('v22-xp-label').textContent=xp.toLocaleString()+' XP';
    const start=xpAtLevel(level),end=level<50?xpAtLevel(level+1):start;
    $h('v22-xp-next').textContent=isMasterUnlocked()?'마스터 해금 중 · 실제 LV. '+actualLevel:level===50?'최고 레벨 달성':'다음 레벨까지 '+(end-xp).toLocaleString()+' XP';
    $h('v22-xp-bar').style.width=(level===50?100:Math.max(0,Math.min(100,(xp-start)/(end-start)*100)))+'%';
    renderLevelRewards(level,actualLevel);
    const featured=featuredBadge(list),node=$h('v22-featured-badge');
    node.replaceChildren();
    if(featured){node.append(make('span','v22-featured-icon',featured.icon),make('span','',featured.name));}
    else node.textContent='아직 획득한 배지가 없어요';
    renderTrophies(list);
    renderBadges(list,featured);
    window.TaekinV29Rank?.refresh?.(level);
  }
  function selectBadge(id){
    if(!actualBadges().some(a=>a.id===id&&a.state!=='locked'))return;
    featuredId=id;
    arcadeStorageWrite(FEATURED_KEY,id);
    render();
    if(typeof v19Toast==='function')v19Toast('🏅 대표 배지가 변경되었습니다.');
  }
  window.TaekinHall={
    selectBadge,refresh:render,
    exportState:()=>({id:featuredId}),
    importState:value=>{
      if(!value||typeof value.id!=='string'||value.id.length>50)return;
      featuredId=value.id;
      arcadeStorageWrite(FEATURED_KEY,featuredId);
      render();
    }
  };
  $h('v22-open-badges').addEventListener('click',()=>window.TaekinV27UI?.openPanel('badges',true));
  window.addEventListener('taekin-achievements-updated',render);
  window.addEventListener('storage',event=>{if(event.key===FEATURED_KEY){featuredId=savedFeatured();render();}});
  render();
})();

;

/* ==========================================================================
   다음 목표·일일/주간 미션·플레이 분석·올클리어 기념패  (미션·통계·올클리어 기념패 모듈)
   ========================================================================== */
/* 다음 목표·일일/주간 미션·통계·올클리어 기념패
 * 게임 엔진·명예의 전당과 연결합니다.
 * 정적 웹/로컬 파일에서 동작하며 서버, 계정, 외부 라이브러리가 필요 없습니다.
 */
(() => {
  'use strict';
  const $25 = id => document.getElementById(id);
  const KEY = 'taekin.arcade.v25.progress';
  const GAME_KEYS = ['baseball','2048','mines','pipes','shikaku','blocks'];
  const GAME_NAMES = {baseball:'숫자야구','2048':'2048',mines:'지뢰찾기',pipes:'파이프 연결',shikaku:'시카쿠',blocks:'블록 퍼즐'};
  const legendary = new Set(['all600','challenge100','boss30','star500']);
  const epic = new Set(['fivehundred','master1','challenge50','perfect80','star200','boss10','threehundred','challenge25']);
  const DAILY_GROUPS = [
    [
      {id:'wins3',icon:'🎮',name:'퍼즐 3판 성공',desc:'단계·도전 모드에서 3판 성공',type:'wins',target:3,xp:75},
      {id:'stages2',icon:'🧩',name:'새 단계 2개 클리어',desc:'아직 완료하지 않은 단계 2개 진행',type:'stages',target:2,xp:90},
      {id:'stars6',icon:'⭐',name:'새 별 6개 획득',desc:'기존 최고 기록보다 별 6개 더 모으기',type:'stars',target:6,xp:75}
    ],
    [
      {id:'wins5',icon:'🎮',name:'퍼즐 5판 성공',desc:'단계·도전 모드에서 5판 성공',type:'wins',target:5,xp:90},
      {id:'stages3',icon:'🚩',name:'새 단계 3개 클리어',desc:'개별 단계 3개를 새로 진행',type:'stages',target:3,xp:100},
      {id:'perfect2',icon:'💎',name:'3성 클리어 2판',desc:'성공한 판에서 ★★★ 기록 2회',type:'perfect',target:2,xp:90}
    ],
    [
      {id:'stages4',icon:'🚀',name:'새 단계 4개 클리어',desc:'개별 단계 4개를 새로 진행',type:'stages',target:4,xp:110},
      {id:'stars9',icon:'🌟',name:'새 별 9개 획득',desc:'기존 최고 기록보다 별 9개 더 모으기',type:'stars',target:9,xp:90},
      {id:'games2',icon:'🎲',name:'서로 다른 게임 2종',desc:'두 종류의 게임에서 각각 성공',type:'games',target:2,xp:85}
    ]
  ];
  const WEEKLY = [
    {id:'weekwins12',icon:'🏃',name:'한 주에 12판 성공',desc:'단계·도전에서 성공 기록 12회',type:'wins',target:12,xp:250},
    {id:'weekgames4',icon:'🏅',name:'게임 4종 도전',desc:'서로 다른 게임 4종에서 성공',type:'games',target:4,xp:300}
  ];

  function clamp(value,limit=100000){const n=Number(value);return Number.isFinite(n)?Math.min(limit,Math.max(0,Math.floor(n))):0;}
  function dateKey(date){
    return date.getFullYear()+'-'+String(date.getMonth()+1).padStart(2,'0')+'-'+String(date.getDate()).padStart(2,'0');
  }
  function weekKey(date){
    const monday=new Date(date.getFullYear(),date.getMonth(),date.getDate());
    monday.setDate(monday.getDate()-(monday.getDay()+6)%7);
    return dateKey(monday);
  }
  function newEvents(){return {wins:0,stages:0,stars:0,perfect:0,games:{}};}
  function cleanEvents(raw){
    const e=newEvents();
    if(!raw||typeof raw!=='object')return e;
    for(const key of ['wins','stages','stars','perfect'])e[key]=clamp(raw[key],100000);
    for(const key of GAME_KEYS)e.games[key]=clamp(raw.games?.[key],100000);
    return e;
  }
  function blank(){
    const now=new Date();
    return {name:'',grants:[],daily:{key:dateKey(now),events:newEvents()},weekly:{key:weekKey(now),events:newEvents()},seconds:0};
  }
  function clean(raw){
    const empty=blank();
    if(!raw||typeof raw!=='object'||Array.isArray(raw))return empty;
    if(typeof raw.name==='string')empty.name=raw.name.slice(0,20).trim();
    if(Array.isArray(raw.grants)){
      const seen=new Set();
      empty.grants=raw.grants.slice(-500).filter(grant=>{
        if(!grant||typeof grant.id!=='string'||!(/^[DW]:\d{4}-\d{2}-\d{2}:[a-z0-9]+$/).test(grant.id)||seen.has(grant.id))return false;
        seen.add(grant.id);return true;
      }).map(grant=>({id:grant.id,xp:clamp(grant.xp,300)}));
    }
    for(const period of ['daily','weekly']){
      const value=raw[period];
      if(typeof value?.key==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(value.key)){
        empty[period]={key:value.key,events:cleanEvents(value.events)};
      }
    }
    empty.seconds=clamp(raw.seconds,1000000000);
    return empty;
  }
  function load(){try{return clean(JSON.parse(localStorage.getItem(KEY)||'null'));}catch(_){return blank();}}
  let state=load();
  function persist(){try{localStorage.setItem(KEY,JSON.stringify(state));window.TaekinV32Save?.record(true);}catch(_){window.TaekinV32Save?.record(false);}}
  function ensurePeriod(){
    const now=new Date(),today=dateKey(now),week=weekKey(now);
    let changed=false;
    if(state.daily.key!==today){state.daily={key:today,events:newEvents()};changed=true;}
    if(state.weekly.key!==week){state.weekly={key:week,events:newEvents()};changed=true;}
    if(changed)persist();
  }
  function dailyMissions(){
    const now=new Date();
    return DAILY_GROUPS[(now.getDate()+now.getMonth())%DAILY_GROUPS.length];
  }
  function missionCount(mission,events){
    if(mission.type==='games')return GAME_KEYS.filter(key=>events.games[key]>0).length;
    return clamp(events[mission.type]);
  }
  function missionKey(period,mission){
    return (period==='daily'?'D:':'W:')+state[period].key+':'+mission.id;
  }
  function hasGrant(id){return state.grants.some(item=>item.id===id);}
  function earnedXP(){return state.grants.reduce((sum,item)=>sum+item.xp,0);}
  function grantMissions(){
    let updated=false;
    for(const [period,list] of [['daily',dailyMissions()],['weekly',WEEKLY]]){
      const events=state[period].events;
      for(const mission of list){
        const id=missionKey(period,mission);
        if(missionCount(mission,events)<mission.target||hasGrant(id))continue;
        state.grants.push({id,xp:mission.xp});
        updated=true;
        if(typeof v19Toast==='function')v19Toast('🎉 미션 달성: '+mission.name+' · +'+mission.xp+' XP');
      }
    }
    if(updated){state.grants=state.grants.slice(-500);persist();}
    return updated;
  }
  function node(tag,cls,text){
    const element=document.createElement(tag);
    if(cls)element.className=cls;
    if(text!==undefined)element.textContent=text;
    return element;
  }
  function progressBar(ratio){
    const track=node('div','v25-progress');
    const bar=node('span','v25-progress-fill');
    bar.style.width=String(Math.max(0,Math.min(100,ratio*100)))+'%';
    track.append(bar);return track;
  }
  function badgeProgress(id,stats){
    const thresholds={first:1,three:3,six:6,ten:10,twentyfive:25,fifty:50,hundred:100,twohundred:200,threehundred:300,fourhundred:400,fivehundred:500,all600:1500};
    const starTargets={star15:15,star75:75,star200:200,star500:500};
    const perfectTargets={perfect1:1,perfect20:20,perfect80:80};
    const bossTargets={boss1:1,boss10:10,boss30:30};
    const challengeTargets={challenge1:1,challenge10:10,challenge25:25,challenge50:50,challenge100:100};
    if(id in thresholds)return {value:stats.cleared,target:thresholds[id],unit:'단계'};
    if(id in starTargets)return {value:stats.stars,target:starTargets[id],unit:'별'};
    if(id in perfectTargets)return {value:stats.perfect,target:perfectTargets[id],unit:'기록'};
    if(id in bossTargets)return {value:stats.boss,target:bossTargets[id],unit:'보스'};
    if(id in challengeTargets)return {value:stats.marathon,target:challengeTargets[id],unit:'라운드'};
    if(id==='explorer')return {value:stats.gamesCleared,target:6,unit:'게임'};
    const gameBadges={baseball:'baseball',g2048:'2048',mines:'mines',pipes:'pipes',shikaku:'shikaku',blocks:'blocks'};
    if(id in gameBadges)return {value:completedStages(gameBadges[id]),target:20,unit:'단계'};
    if(id==='master1')return {value:Math.max(...GAME_KEYS.map(key=>completedStages(key))),target:250,unit:'단계'};
    return null;
  }
  function renderGoals(){
    const root=$25('v25-goal-list'),stats=arcadeStats();
    const badges=window.TaekinAchievementCollection?.list?.()||[];
    const goals=badges.filter(a=>a.state!=='earned').map(badge=>{
      const progress=badgeProgress(badge.id,stats);
      if(!progress)return null;
      return {...badge,...progress,ratio:Math.min(1,progress.value/progress.target)};
    }).filter(Boolean).sort((a,b)=>b.ratio-a.ratio||(a.target-a.value)-(b.target-b.value)).slice(0,3);
    root.replaceChildren();
    if(!goals.length){
      root.append(node('p','v25-all-earned','🏆 모든 배지를 실제 플레이로 획득했어요. 아케이드의 전설입니다!'));
      return;
    }
    for(const badge of goals){
      const card=node('article','v25-goal-card');
      const heading=node('div','v25-goal-title');
      heading.append(node('span','v25-goal-emoji',badge.icon),node('strong','',badge.name));
      card.append(heading,node('p','',badge.detail));
      const label=node('div','v25-goal-label');
      label.append(node('span','',Math.min(badge.value,badge.target)+' / '+badge.target+' '+badge.unit),node('span','',Math.round(badge.ratio*100)+'%'));
      card.append(label,progressBar(badge.ratio),node('small','',badge.state==='special'?'특별 해금됨 · 실제 달성까지 '+Math.max(0,badge.target-badge.value)+' 남음':'앞으로 '+Math.max(0,badge.target-badge.value)+' '+badge.unit));
      root.append(card);
    }
  }
  function missionCard(mission,period){
    const current=Math.min(mission.target,missionCount(mission,state[period].events));
    const done=hasGrant(missionKey(period,mission));
    const card=node('article','v25-mission-card'+(done?' completed':''));
    const heading=node('div','v25-mission-top');
    heading.append(node('span','v25-mission-emoji',mission.icon),node('strong','',mission.name),node('span','v25-mission-reward',done?'완료 ✓':'+'+mission.xp+' XP'));
    card.append(heading,node('p','',mission.desc));
    const label=node('div','v25-goal-label');
    label.append(node('span','',current+' / '+mission.target),node('span','',done?'달성 완료':Math.floor(current/mission.target*100)+'%'));
    card.append(label,progressBar(current/mission.target));
    return card;
  }
  function renderMissions(){
    const daily=$25('v25-daily-missions'),weekly=$25('v25-weekly-missions');
    daily.replaceChildren(...dailyMissions().map(mission=>missionCard(mission,'daily')));
    weekly.replaceChildren(...WEEKLY.map(mission=>missionCard(mission,'weekly')));
    const count=WEEKLY.filter(mission=>hasGrant(missionKey('weekly',mission))).length;
    $25('v25-week-label').textContent=state.weekly.key+' 시작 · '+count+' / '+WEEKLY.length+' 완료';
    $25('v25-mission-xp').textContent=earnedXP().toLocaleString()+' XP';
    $25('v25-reset-note').textContent='오늘: '+state.daily.key+' · 일일 미션은 자정, 주간 미션은 월요일에 변경됩니다. 이 기기의 브라우저에만 저장됩니다.';
  }
  function renderAnalysis(){
    const stats=arcadeStats();
    const wins=GAME_KEYS.reduce((sum,key)=>sum+clamp(v19Playlog[key]?.wins),0);
    const records=GAME_KEYS.map(key=>{
      const cleared=completedStages(key),stars=Object.values(arcadeProgress.stars?.[key]||{}).reduce((sum,n)=>sum+clamp(n,3),0);
      return {key,cleared,stars,wins:clamp(v19Playlog[key]?.wins)};
    });
    const most=[...records].sort((a,b)=>b.cleared-a.cleared)[0];
    const least=[...records].sort((a,b)=>a.cleared-b.cleared)[0];
    const metrics=[
      ['총 성공 기록',wins.toLocaleString()+'판'],
      ['총 획득 별',stats.stars.toLocaleString()+'개'],
      ['가장 많이 진행한 게임',most.cleared?GAME_NAMES[most.key]:'아직 없음'],
      ['다음 추천 게임',least.cleared===250?'전체 완료!':GAME_NAMES[least.key]],
      ['성공 판 기록 시간',formatSeconds(state.seconds)]
    ];
    const grid=$25('v25-metric-grid');grid.replaceChildren();
    for(const [label,value] of metrics){
      const card=node('div','v25-metric');
      card.append(node('span','',label),node('strong','',value));grid.append(card);
    }
    const chart=$25('v25-analysis-chart');chart.replaceChildren();
    for(const entry of records){
      const row=node('div','v25-analysis-row');
      row.append(node('span','v25-analysis-game',GAME_NAMES[entry.key]));
      row.append(progressBar(entry.cleared/250));
      row.append(node('strong','v25-analysis-value',entry.cleared+' / 250'));
      chart.append(row);
    }
  }
  function formatSeconds(total){
    const hours=Math.floor(total/3600),minutes=Math.floor(total%3600/60),seconds=total%60;
    return hours?hours+'시간 '+minutes+'분':minutes?minutes+'분 '+seconds+'초':seconds+'초';
  }
  function completedFinal(stats){return stats.cleared>=1500&&stats.marathon>=100;}
  function playerName(){return state.name.trim()||'도전자';}
  function renderFinal(){
    const stats=arcadeStats(),complete=completedFinal(stats),preview=isMasterUnlocked()&&!complete;
    $25('v25-finale-state').textContent=complete?'축하합니다! 모든 필수 도전을 달성했습니다. 올클리어 기념패를 저장해 보세요.':preview?'마스터 코드로 올클리어 기념패 미리보기 해금 · 실제 도전 기록과 별개입니다.':'1,500단계와 도전 모드 100라운드를 모두 완료하면 올클리어 기념패가 열립니다.';
    $25('v25-finale-stages').textContent='단계 '+stats.cleared+' / 1500';
    $25('v25-finale-rounds').textContent='도전 '+stats.marathon+' / 100';
    const button=$25('v25-open-certificate');
    button.disabled=!(complete||preview);button.textContent=complete?'🏆 올클리어 기념패 보기':preview?'🏆 시연용 올클리어 기념패 보기':'🔒 올클리어 기념패 잠김';
    if(document.activeElement!==$25('v25-player-name'))$25('v25-player-name').value=state.name;
  }
  function render(){
    ensurePeriod();
    const awarded=grantMissions();
    renderGoals();renderMissions();renderAnalysis();renderFinal();
    if(awarded)window.TaekinHall?.refresh?.();
  }
  function registerWin(key,mode,practice,previousStats){
    const current=arcadeStats(),result=typeof v19LastResult!=='undefined'?v19LastResult:null;
    state.seconds+=clamp(result?.seconds,7200);
    if(mode==='stage'||mode==='marathon'&&!practice){
      for(const period of ['daily','weekly']){
        const events=state[period].events;
        events.wins+=1;
        events.stages+=Math.max(0,current.cleared-previousStats.cleared);
        events.stars+=Math.max(0,current.stars-previousStats.stars);
        if(result?.stars===3)events.perfect+=1;
        events.games[key]=clamp(events.games[key])+1;
      }
    }
    persist();render();
  }
  const originalWin=reportGameWin;
  reportGameWin=function(key){
    const before=arcadeStats(),prior=clamp(v19Playlog[key]?.wins),mode=challenge.mode,practice=!!challenge.practice;
    const result=originalWin(key);
    if(clamp(v19Playlog[key]?.wins)>prior){
      registerWin(key,mode,practice,before);
      if(!completedFinal(before)&&completedFinal(arcadeStats())&&typeof v19Toast==='function')v19Toast('🏆 올클리어 기념패 해금! 명예의 전당을 확인하세요.');
    }
    return result;
  };
  function showCeremony(badge){
    const dialog=$25('v25-achievement-dialog');
    if(dialog.open)return;
    const isLegendary=legendary.has(badge.id);
    $25('v25-achievement-icon').textContent=badge.icon;
    $25('v25-achievement-rarity').textContent=isLegendary?'LEGENDARY ACHIEVEMENT · 전설':'EPIC ACHIEVEMENT · 영웅';
    $25('v25-achievement-name').textContent=badge.name;
    $25('v25-achievement-description').textContent=badge.detail+' · 진짜 플레이로 달성했습니다!';
    dialog.dataset.rarity=isLegendary?'legendary':'epic';
    dialog.showModal();
    $25('v25-achievement-close').focus();
  }
  let seenEarned=new Set((window.TaekinAchievementCollection?.list?.()||[]).filter(a=>a.state==='earned').map(a=>a.id));
  let skipNextAchievementEvent=false;
  window.addEventListener('taekin-achievements-updated',()=>{
    const badges=window.TaekinAchievementCollection?.list?.()||[];
    const earned=badges.filter(a=>a.state==='earned');
    const latest=earned.filter(a=>!seenEarned.has(a.id));
    seenEarned=new Set(earned.map(a=>a.id));
    if(!skipNextAchievementEvent){
      const important=latest.find(a=>legendary.has(a.id))||latest.find(a=>epic.has(a.id));
      if(important)showCeremony(important);
    }
    skipNextAchievementEvent=false;render();
  });
  function drawCertificate(){
    const canvas=document.createElement('canvas');canvas.width=1200;canvas.height=800;
    const c=canvas.getContext('2d');if(!c)return;
    c.fillStyle='#f4f0e4';c.fillRect(0,0,1200,800);
    c.strokeStyle='#b69b62';c.lineWidth=16;c.strokeRect(32,32,1136,736);
    c.strokeStyle='#a3ab91';c.lineWidth=2;c.strokeRect(58,58,1084,684);
    c.textAlign='center';
    c.fillStyle='#65795e';c.font='bold 22px sans-serif';c.fillText('TAEKIN BRAIN ARCADE',600,145);
    c.fillStyle='#384944';c.font='bold 56px sans-serif';c.fillText('ARCADE ALL CLEAR',600,235);
    c.font='24px sans-serif';c.fillText(isMasterUnlocked()&&!completedFinal(arcadeStats())?'MASTER PREVIEW · 마스터 코드로 열린 시연용 올클리어 기념패':'모든 퍼즐 도전과 종합 도전을 완수하였습니다.',600,315);
    c.fillStyle='#99783e';c.font='bold 76px sans-serif';c.fillText(playerName(),600,445);
    c.fillStyle='#4c6458';c.font='bold 26px sans-serif';c.fillText(isMasterUnlocked()&&!completedFinal(arcadeStats())?'SHOWCASE PREVIEW · 기록과 별개':'1,500 STAGES · 100 CHALLENGE ROUNDS',600,540);
    c.font='22px sans-serif';c.fillText(dateKey(new Date())+'  |  PUZZLE MASTER',600,600);
    c.fillStyle='#c3a05e';c.font='bold 55px sans-serif';c.fillText('★  ★  ★',600,691);
    const link=document.createElement('a');link.download='TAEKIN_BRAIN_ARCADE_올클리어 기념패.png';link.href=canvas.toDataURL('image/png');link.click();
  }
  function refreshCertificate(){
    $25('v25-cert-name').textContent=playerName();
    $25('v25-cert-date').textContent=dateKey(new Date())+' · PUZZLE MASTER';
    $25('v25-cert-record').textContent=isMasterUnlocked()&&!completedFinal(arcadeStats())?'MASTER PREVIEW · 실제 완주 기록과 별개':'1,500 STAGES · 100 CHALLENGE ROUNDS';
  }
  $25('v25-show-codex').addEventListener('click',()=>window.TaekinV27UI?.openPanel('badges'));
  $25('v25-player-name').addEventListener('input',event=>{
    state.name=String(event.target.value||'').slice(0,20);persist();window.dispatchEvent(new Event('taekin-nickname-updated'));
  });
  $25('v25-achievement-close').addEventListener('click',()=>$25('v25-achievement-dialog').close());
  $25('v25-open-certificate').addEventListener('click',()=>{
    if(!completedFinal(arcadeStats())&&!isMasterUnlocked())return;
    refreshCertificate();$25('v25-certificate-dialog').showModal();
  });
  $25('v25-close-certificate').addEventListener('click',()=>$25('v25-certificate-dialog').close());
  $25('v25-download-certificate').addEventListener('click',drawCertificate);
  window.addEventListener('storage',event=>{
    if(event.key!==KEY)return;
    state=load();
    seenEarned=new Set((window.TaekinAchievementCollection?.list?.()||[]).filter(a=>a.state==='earned').map(a=>a.id));
    render();window.TaekinHall?.refresh?.();
  });
  window.TaekinMissions={earnedXP};
  window.TaekinV25={
    exportState:()=>JSON.parse(JSON.stringify(state)),
    beforeImport:()=>{skipNextAchievementEvent=true;},
    importState:value=>{
      const oldName=state.name;
      state=clean(value);
      if(!value)state.name=oldName;
      persist();render();window.TaekinHall?.refresh?.();window.dispatchEvent(new Event('taekin-nickname-updated'));
    },
    resetProgress:()=>{
      const name=state.name;
      state=blank();state.name=name;persist();
      skipNextAchievementEvent=true;
      render();window.TaekinHall?.refresh?.();window.dispatchEvent(new Event('taekin-nickname-updated'));
    },
    refresh:render
  };
  render();
  window.TaekinHall?.refresh?.();
})();

;

/* ==========================================================================
   5개 메뉴 전환·프로필 연동  (메뉴 전환 모듈)
   ========================================================================== */
/* ============================================================
   고정 상단 메뉴·화면 전환·프로필 연결
   - Preserve game-engine behavior and all persistent localStorage keys.
   - Home dashboard content is organized into five separate views.
   - Header stays visible when scrolling and has a live profile shortcut.
   - v16GoDestination remains an adapter for existing navigation handlers.
   ============================================================ */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const pageNames = new Set(['games','challenges','records','profile','more']);
  const pageNodes = new Map([...pageNames].map(key => [key,$('v26-view-'+key)]));
  const navButtons = [...document.querySelectorAll('.arcade-nav-btn')];
  const topbar = document.querySelector('.topbar');
  let currentPage = 'games';
  let navigatingFromGame = false;
  let scrollFrame = 0;
  function headerHeight(){return topbar?.getBoundingClientRect().height || 100;}
  function syncHeaderHeight(){
    document.documentElement.style.setProperty('--v26-header-height',Math.ceil(headerHeight())+'px');
  }
  syncHeaderHeight();
  if(typeof ResizeObserver === 'function'){
    new ResizeObserver(syncHeaderHeight).observe(topbar);
  } else window.addEventListener('resize',syncHeaderHeight,{passive:true});

  function updateHeaderProgress(){
    const l=$('v22-level')?.textContent || 'LV. 1';
    const t=$('v22-title')?.textContent || '견습 탐험가';
    const emblem=$('v19-profile-mark')?.textContent?.trim() || '✦';
    $('v26-header-level').textContent=($('v27-nickname-input')?.value.trim()||'플레이어')+' · '+l;
    $('v26-header-title').textContent=t;
    const avatar=document.querySelector('.v26-avatar');
    avatar.textContent=emblem;
    avatar.dataset.frame=$('v19-profile-mark')?.dataset.frame || 'default';
    $('v26-header-profile').setAttribute('aria-label',`프로필 · ${$('v26-header-level').textContent} ${t}`);
    try{
      const stats=arcadeStats();
      $('v26-home-progress').textContent=`${stats.cleared || 0} / 1,500단계`;
      const left=Math.max(0,1500-(stats.cleared || 0));
      $('v26-home-goal').textContent=left===0?'모든 개별 단계를 완수했어요! 🏆':`남은 ${left}단계 · 도전 메뉴에서 미션을 확인하세요`;
    } catch(_) { /* 불러온 기록이 없는 경우 기본 안내를 유지 */ }
  }

  function updateNav(page){
    for(const btn of navButtons){
      const active=btn.dataset.destination===page;
      btn.classList.toggle('active',active);
      btn.setAttribute('aria-current',active?'page':'false');
    }
  }
  function setPage(page,{scroll=true,anchor=null,changeHistory=true}={}){
    if(!pageNames.has(page))page='games';
    currentPage=page;
    for(const [key,el] of pageNodes){
      if(!el)continue;
      el.hidden=key!==page;
      el.setAttribute('aria-hidden',key===page?'false':'true');
    }
    updateNav(page);
    document.body.dataset.v26Page=page;
    if(page==='more' && anchor==='achievement-hub') $('achievement-hub').open=true;
    if(scroll){
      window.cancelAnimationFrame(scrollFrame);
      if(anchor){
        scrollFrame=requestAnimationFrame(()=>requestAnimationFrame(()=>{
          const target=$(anchor);
          if(target){
            const top=window.scrollY+target.getBoundingClientRect().top-headerHeight()-18;
            window.scrollTo({top:Math.max(0,top),behavior:'smooth'});
          }else window.scrollTo({top:0,behavior:'instant'});
        }));
      }else window.scrollTo({top:0,behavior:'instant'});
    }
    if(changeHistory){
      // The URL hash makes the active menu shareable and supports Back/Forward.
      try{
        if(location.hash!=='#'+page){
          history.pushState({v26Page:page},'',location.pathname+location.search+'#'+page);
        }
      } catch(_) { /* file:// 또는 제한된 브라우저에서는 화면 이동만 수행 */ }
    }
    updateHeaderProgress();
  }
  function go(destination){
    let page=destination;
    let anchor=null;
    if(destination==='hall'){page='more';anchor='hall-of-fame';}
    if(destination==='achievements'){page='more';anchor='achievement-hub';}
    if(!pageNames.has(page))page='games';
    if(!$('play-screen').classList.contains('hidden')){
      navigatingFromGame=true;
      try{showHome();}finally{navigatingFromGame=false;}
    }
    // 기존 화면 설정 버튼도 계속 작동하도록 연결합니다.
    try{if(typeof v16ToggleDisplay === 'function')v16ToggleDisplay(false);}catch(_){}
    setPage(page,{scroll:true,anchor});
  }
  // 기존 버튼의 화면 이동 호출은 공통 이동 함수로 연결합니다.
  v16GoDestination=go;

  // Returning from gameplay goes to the simplified game-selection view.
  const previousShowHome=showHome;
  showHome=function(){
    // 키보드·프로그램 화면 전환에도 포인터 이벤트와 무관하게 현재 판을 보존합니다.
    // 일시정지 중에는 일시정지 진입 시 저장한 상태를 유지합니다.
    if(activeGame && !v19Paused)v19StoreSnapshot();
    previousShowHome();
    setPage('games',{scroll:false,changeHistory:!navigatingFromGame});
  };
  const previousShowGame=showGame;
  showGame=function(...args){
    if(activeGame && activeGame!==args[0] && !v19Paused)v19StoreSnapshot();
    previousShowGame(...args);
    updateNav('games');
    updateHeaderProgress();
  };
  // The header badge uses existing achievement/emblem status: no new storage keys.
  $('v26-header-profile').addEventListener('click',()=>go('profile'));
  document.querySelectorAll('[data-v26-jump]').forEach(button=>{
    button.addEventListener('click',()=>go(button.dataset.v26Jump));
  });
  document.querySelectorAll('[data-v26-anchor]').forEach(button=>{
    button.addEventListener('click',()=>{
      const target=button.dataset.v26Anchor;
      setPage('more',{anchor:target});
    });
  });
  // After a badge reward, normal game progress, or sync, update the profile chip.
  window.addEventListener('taekin-achievements-updated',()=>{
    requestAnimationFrame(updateHeaderProgress);
  });
  window.addEventListener('storage',updateHeaderProgress);
  $('v20-inventory')?.addEventListener('click',()=>requestAnimationFrame(updateHeaderProgress));
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)updateHeaderProgress();});
  const previousRenderHomeProgress=renderHomeProgress;
  renderHomeProgress=function(){
    previousRenderHomeProgress();
    updateHeaderProgress();
  };
  window.addEventListener('popstate',()=>{
    let page=location.hash.slice(1);
    if(!pageNames.has(page))page='games';
    if(!$('play-screen').classList.contains('hidden'))showHome();
    setPage(page,{changeHistory:false});
  });
  // Preserve direct #records etc. when reloading the page.
  const openingPage=location.hash.slice(1);
  setPage(pageNames.has(openingPage)?openingPage:'games',{scroll:false,changeHistory:false});
  window.TaekinV26Navigation={go,page:()=>currentPage,refresh:updateHeaderProgress};
})();

;

;
/* ========================================================================
   닉네임·보관함 팝업·대표 배지 선택
   기존 게임/업적/레벨/미션의 ID와 저장 키를 유지합니다.
   ======================================================================== */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const dialogMap={hall:$('v27-hall-dialog'),badges:$('v27-badges-dialog'),certificate:$('v27-certificate-hub-dialog')};
  const targetMap={hall:['hall-of-fame','v27-hall-content'],badges:['achievement-hub','v27-badges-content'],certificate:['final-challenge','v27-certificate-content']};
  for (const [key,[sourceId,targetId]] of Object.entries(targetMap)) {
    const source=$(sourceId),target=$(targetId);
    if(source&&target)target.append(source);
  }
  const cabinet=$('achievement-hub');
  if(cabinet)cabinet.open=true;
  let selectingBadge=false;
  let previousFocus=null;
  const nickname=$('v27-nickname-input');
  const certificateNickname=$('v25-player-name');
  function syncNickname(){
    const val=certificateNickname?.value||'';
    if(nickname&&nickname!==document.activeElement)nickname.value=val;
    const message=$('v27-nickname-status');
    if(message)message.textContent=val.trim()?'✓ 저장됨 · '+val.trim():'닉네임을 설정하면 모든 화면에 적용돼요.';
    window.TaekinV26Navigation?.refresh?.();
  }
  nickname?.addEventListener('input',()=>{
    // 닉네임 변경은 통합 저장·백업 처리와 연동됩니다.
    certificateNickname.value=nickname.value;
    certificateNickname.dispatchEvent(new Event('input',{bubbles:true}));
  });
  window.addEventListener('taekin-nickname-updated',syncNickname);
  window.addEventListener('storage',()=>window.requestAnimationFrame(syncNickname));
  syncNickname();

  function openPanel(kind,selection=false){
    const popup=dialogMap[kind];if(!popup)return;
    if(kind==='badges'){
      selectingBadge=!!selection;
      $('v27-badges-dialog-title').textContent=selection?'🎖 대표 배지 선택':'🎖 배지 도감';
      $('v27-badges-dialog-desc').textContent=selection?'획득한 배지를 누르면 즉시 적용되고 이 창이 닫혀요.':'35개 배지의 해금 조건을 살펴보고 대표 배지를 고르세요.';
      const filter=document.querySelector(`[data-v20-filter="${selection?'available':'all'}"]`);
      filter?.click();
    }
    if(kind==='certificate')syncNickname();
    previousFocus=document.activeElement;
    if(!popup.open){
      try{popup.showModal();}catch(_){popup.setAttribute('open','');}
      popup.querySelector('.v27-dialog-close')?.focus();
    }
  }
  function closePanel(popup){
    if(popup?.open)popup.close();
    selectingBadge=false;
    if(previousFocus?.isConnected)previousFocus.focus({preventScroll:true});
  }
  for(const popup of Object.values(dialogMap)){
    popup?.querySelector('[data-v27-close]')?.addEventListener('click',()=>closePanel(popup));
    popup?.addEventListener('click',event=>{
      // Backdrop click closes while clicks on the inner panel do not.
      if(event.target!==popup)return;
      const box=popup.getBoundingClientRect();
      if(event.clientX<box.left||event.clientX>box.right||event.clientY<box.top||event.clientY>box.bottom)closePanel(popup);
    });
    popup?.addEventListener('close',()=>{selectingBadge=false;});
  }
  // 상단 '더보기'는 페이지로 이동하지 않고 BGM 선택창 같은 작은 빠른 보관함으로 엽니다.
  const moreButton=document.querySelector('.arcade-nav-btn[data-destination="more"]');
  const quickMenu=$('v27-quick-menu');
  moreButton?.setAttribute('aria-haspopup','menu');
  moreButton?.setAttribute('aria-controls','v27-quick-menu');
  moreButton?.setAttribute('aria-expanded','false');
  function closeQuickMenu(){
    if(!quickMenu)return;
    quickMenu.hidden=true;
    moreButton?.classList.remove('v27-quick-active');
    moreButton?.setAttribute('aria-expanded','false');
  }
  function toggleQuickMenu(){
    if(!quickMenu)return;
    const opening=quickMenu.hidden;
    quickMenu.hidden=!opening;
    moreButton?.classList.toggle('v27-quick-active',opening);
    moreButton?.setAttribute('aria-expanded',String(opening));
    if(opening)quickMenu.querySelector('button')?.focus({preventScroll:true});
  }
  moreButton?.addEventListener('click',event=>{
    event.preventDefault();event.stopImmediatePropagation();toggleQuickMenu();
  },true);
  document.addEventListener('pointerdown',event=>{
    if(!quickMenu||quickMenu.hidden)return;
    if(!quickMenu.contains(event.target)&&!moreButton?.contains(event.target))closeQuickMenu();
  });
  document.addEventListener('keydown',event=>{
    if(event.key==='Escape'&&!quickMenu?.hidden){event.preventDefault();closeQuickMenu();moreButton?.focus();}
  });
  document.querySelectorAll('[data-v27-panel]').forEach(btn=>btn.addEventListener('click',()=>{
    closeQuickMenu();openPanel(btn.dataset.v27Panel);
  }));
  // 보관함 링크는 페이지를 이동하지 않고 팝업으로 표시합니다.
  const previousGo=v16GoDestination;
  v16GoDestination=function(destination){
    if(destination==='hall')return openPanel('hall');
    if(destination==='achievements')return openPanel('badges');
    return previousGo(destination);
  };
  // Add 'close on choose' only when the dialog was opened for selecting a badge.
  const originalChoose=window.TaekinHall?.selectBadge;
  if(originalChoose&&window.TaekinHall){
    window.TaekinHall.selectBadge=function(id){
      const selected=window.TaekinAchievementCollection?.list?.().some(a=>a.id===id&&a.state!=='locked');
      const result=originalChoose(id);
      if(selected && selectingBadge && dialogMap.badges.open){
        closePanel(dialogMap.badges);
      }
      return result;
    };
  }
  window.TaekinV27UI={openPanel,closePanel,syncNickname};
})();


/* ======================== 레벨별 엠블럼·꾸미기 ======================== */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const ranks=[
    {min:1,id:'rookie',name:'루키',en:'ROOKIE',icon:'✦',description:'처음 시작한 모험가'},
    {min:5,id:'bronze',name:'브론즈',en:'BRONZE',icon:'◆',description:'첫 성장의 증표'},
    {min:10,id:'silver',name:'실버',en:'SILVER',icon:'❖',description:'단단해진 추리력'},
    {min:15,id:'gold',name:'골드',en:'GOLD',icon:'✧',description:'빛나는 전략가'},
    {min:20,id:'platinum',name:'플래티넘',en:'PLATINUM',icon:'⬡',description:'숙련된 퍼즐 장인'},
    {min:25,id:'diamond',name:'다이아몬드',en:'DIAMOND',icon:'💠',description:'찬란한 도전의 결정'},
    {min:30,id:'master',name:'마스터',en:'MASTER',icon:'♛',description:'모든 퍼즐에 도전'},
    {min:40,id:'legend',name:'레전드',en:'LEGEND',icon:'✷',description:'아케이드의 전설'},
    {min:50,id:'mythic',name:'미틱',en:'MYTHIC',icon:'✹',description:'신화 속 최고 등급'}
  ];
  const groups=[
    {type:'aura',name:'프로필 오라',items:[
      ['none','없음',1,'○'],['neon','네온 링',5,'◉'],['prism','프리즘 파동',15,'◇'],['cosmos','코스믹 헤일로',25,'✦'],['legend','전설의 광휘',40,'✷']
    ]},
    {type:'frame',name:'프로필 테두리',items:[
      ['classic','기본 프레임',1,'▢'],['steel','스틸 엣지',5,'⬡'],['gem','보석 컷',15,'💎'],['cyber','사이버 그리드',25,'⌗'],['crown','황제의 왕관',40,'♛']
    ]},
    {type:'skin',name:'사이트 스킨',items:[
      ['classic','클래식',1,'▦'],['neon','네온 게임룸',10,'⌁'],['royal','로열 아케이드',20,'♛'],['holo','홀로그램',30,'⬡'],['mythic','미틱 오로라',50,'✺']
    ]}
  ];
  const KEY='taekin.arcade.v29.style';
  let current={aura:'none',frame:'classic',skin:'classic'};
  try{current={...current,...JSON.parse(localStorage.getItem(KEY)||'{}')};}catch(_){}
  let activeLevel=1,renderedRank='';
  const next=document.getElementById('v29-rank-next');
  function levelNow(){return Math.max(1,Number(($('v22-level')?.textContent||'1').replace(/[^0-9]/g,''))||1);}
  function rankFor(level){return [...ranks].reverse().find(item=>level>=item.min)||ranks[0];}
  function sync(){
    document.body.dataset.v29Aura=current.aura;
    document.body.dataset.v29Frame=current.frame;
    document.body.dataset.v29Skin=current.skin;
    const mark=$('v29-crest-icon'),avatar=$('v29-preview-avatar');
    if(mark)mark.textContent=rankFor(activeLevel).icon;
    if(avatar)avatar.textContent=rankFor(activeLevel).icon;
    const nickname=$('v27-nickname-input')?.value.trim()||'플레이어';
    $('v29-preview-nickname').textContent=nickname;
    $('v29-preview-rank').textContent=rankFor(activeLevel).name+' · LV. '+activeLevel;
    try{localStorage.setItem(KEY,JSON.stringify(current));}catch(_){}
  }
  function updateRank(level){
    activeLevel=level;
    const rank=rankFor(level),crest=document.querySelector('.v22-growth-emblem');
    crest.dataset.rank=rank.id;document.body.dataset.v29Rank=rank.id;
    $('v29-crest-name').textContent=rank.en;
    const upcoming=ranks.find(item=>item.min>level);
    next.textContent=upcoming?`다음 ${upcoming.name} · LV. ${upcoming.min}`:'최종 미틱 등급 달성!';
    const root=$('v29-rank-roadmap');root.replaceChildren();
    for(const item of ranks){
      const cell=document.createElement('div');cell.className='v29-rank-item'+(level>=item.min?' earned':' locked')+(rank.id===item.id?' current':'');
      cell.dataset.rank=item.id;
      const glyph=document.createElement('span');glyph.className='v29-rank-glyph';glyph.textContent=item.icon;
      const name=document.createElement('strong');name.textContent=item.name;
      const levelLabel=document.createElement('small');levelLabel.textContent=`LV. ${item.min}`;
      cell.title=item.description;cell.append(glyph,name,levelLabel);root.append(cell);
    }
    const groupsRoot=$('v29-style-choices');groupsRoot.replaceChildren();
    for(const group of groups){
      const section=document.createElement('section');section.className='v29-studio-group';
      const heading=document.createElement('h4');heading.textContent=group.name;section.append(heading);
      const options=document.createElement('div');options.className='v29-studio-options';
      for(const [id,name,need,icon] of group.items){
        const allowed=activeLevel>=need||isMasterUnlocked();
        const btn=document.createElement('button');btn.type='button';btn.className='v29-studio-option';
        btn.dataset.active=String(current[group.type]===id);btn.dataset.styleName=id;btn.disabled=!allowed;
        const symbol=document.createElement('span');symbol.className='v29-style-symbol';symbol.textContent=allowed?icon:'🔒';
        const label=document.createElement('strong');label.textContent=name;
        const detail=document.createElement('small');detail.textContent=current[group.type]===id?'사용 중':allowed?'선택하기':`LV. ${need} 해금`;
        btn.append(symbol,label,detail);
        btn.addEventListener('click',()=>{current[group.type]=id;sync();updateRank(activeLevel);});
        options.append(btn);
      }
      section.append(options);groupsRoot.append(section);
    }
    if(!groups.find(g=>g.type==='aura').items.some(x=>x[0]===current.aura&&(activeLevel>=x[2]||isMasterUnlocked())))current.aura='none';
    if(!groups.find(g=>g.type==='frame').items.some(x=>x[0]===current.frame&&(activeLevel>=x[2]||isMasterUnlocked())))current.frame='classic';
    if(!groups.find(g=>g.type==='skin').items.some(x=>x[0]===current.skin&&(activeLevel>=x[2]||isMasterUnlocked())))current.skin='classic';
    sync();
  }
  document.querySelectorAll('#v29-tier-switch button[data-tier]').forEach(button=>{
    button.addEventListener('click',()=>selectTierAndLaunch(button.dataset.tier));
  });
  $('v27-nickname-input')?.addEventListener('input',sync);
  window.addEventListener('taekin-achievements-updated',()=>updateRank(levelNow()));
  window.TaekinV29Rank={refresh:updateRank,exportState:()=>({...current}),importState:(value)=>{
    if(!value||typeof value!=='object')return;
    const safe={...current};for(const group of groups){if(group.items.some(item=>item[0]===value[group.type]))safe[group.type]=value[group.type];}
    current=safe;updateRank(levelNow());
  }};
  updateRank(levelNow());
})();


/* =============== 첫 방문 가이드·기록 보호·모바일 터치 ===============
  첫 방문 가이드 / 기록 초기화 보호 / 진행 중 이탈 확인 / 모바일 터치 보완
  1,500단계와 저장 키를 변경하지 않습니다.
  ======================================================= */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const guide = $('v31-onboarding');
  const seenKey = 'taekin_arcade_onboarding_v31';
  const steps = [
    {icon:'🎮',title:'원하는 게임을 선택하세요',description:'홈 화면의 게임 카드 6개 중 원하는 것을 눌러 시작해요. 처음에는 쉬움 난이도를 추천해요.'},
    {icon:'🎯',title:'난이도를 고르고 도전하세요',description:'쉬움부터 전문가까지 바로 선택할 수 있어요. 각 난이도는 1~50단계를 순서대로 클리어하고, 10단계마다 보스가 등장해요.'},
    {icon:'🏆',title:'기록과 배지를 모아보세요',description:'내 기록에서 JSON 파일로 백업할 수 있어요. 프로필에서 닉네임을 바꾸고, 상단 더보기에서 배지와 트로피를 확인하세요.'}
  ];
  let step = 0;
  function showStep(){
    const data = steps[step];
    $('v31-guide-icon').textContent = data.icon;
    $('v31-guide-count').textContent = `STEP ${step + 1} / ${steps.length}`;
    $('v31-guide-title').textContent = data.title;
    $('v31-guide-description').textContent = data.description;
    $('v31-guide-dots').textContent = steps.map((_,i)=>i===step?'●':'○').join('  ');
    $('v31-guide-prev').disabled = step === 0;
    $('v31-guide-next').textContent = step === steps.length - 1 ? '게임 시작하기' : '다음';
  }
  function openGuide(){
    if(!guide || guide.open)return;
    step=0;
    showStep();
    guide.showModal();
  }
  function closeGuide(){
    if($('v31-guide-remember').checked){
      arcadeStorageWrite(seenKey,'1');
    }else{
      try{localStorage.removeItem(seenKey);}catch(_){}
    }
    if(guide.open)guide.close();
    $('v31-help-open')?.focus({preventScroll:true});
  }
  $('v31-help-open')?.addEventListener('click',openGuide);
  $('v31-guide-close')?.addEventListener('click',closeGuide);
  $('v31-guide-prev')?.addEventListener('click',()=>{step=Math.max(0,step-1);showStep();});
  $('v31-guide-next')?.addEventListener('click',()=>{
    if(step===steps.length-1)closeGuide();
    else{step++;showStep();}
  });
  guide?.addEventListener('cancel',event=>{event.preventDefault();closeGuide();});
  guide?.addEventListener('click',event=>{
    if(event.target!==guide)return;
    const rect=guide.getBoundingClientRect();
    if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom)closeGuide();
  });
  let visited=false;
  try{visited=localStorage.getItem(seenKey)==='1';}catch(_){}
  let automaticGuideEnabled=true;
  try{automaticGuideEnabled=localStorage.getItem('taekin_arcade_auto_guide_v32')!=='off';}catch(_){}
  if(!visited && (!location.hash || location.hash==='#games') && automaticGuideEnabled){
    // 첫 방문에 한 번 안내하고, 게임 조작을 방해하지 않도록 짧은 프레임 후 표시.
    requestAnimationFrame(()=>requestAnimationFrame(()=>{
      if(document.visibilityState!=='hidden'&&!activeGame)openGuide();
    }));
  }
  // 브라우저의 기본 confirm 대신 사이트 디자인에 맞춘 나가기 확인창.
  // 브라우저가 붙이는 출처 주소는 변경할 수 없지만, 앱 내부 확인창에는 표시되지 않습니다.
  const v55LeaveDialog=document.getElementById('v55-leave-dialog');
  const v55LeaveMessage=document.getElementById('v55-leave-message');
  let v55PendingDestination=null;
  let v55BypassLeave=false;
  function v55CloseLeave(){if(v55LeaveDialog.open)v55LeaveDialog.close();v55PendingDestination=null;}
  document.getElementById('v55-leave-stay').addEventListener('click',v55CloseLeave);
  document.getElementById('v55-leave-go').addEventListener('click',()=>{
    const destination=v55PendingDestination;
    if(!destination){v55CloseLeave();return;}
    if(!v19Paused && v19StoreSnapshot()==='failed'){
      v55LeaveMessage.textContent='현재 판을 저장하지 못했어요. 저장 공간을 확인하거나 게임 화면에서 다시 시도해 주세요.';
      return;
    }
    v55CloseLeave();
    v55BypassLeave=true;
    try{destination.click();}finally{v55BypassLeave=false;}
  });
  v55LeaveDialog.addEventListener('click',e=>{if(e.target===v55LeaveDialog)v55CloseLeave();});
  document.addEventListener('click',event=>{
    if(v55BypassLeave)return;
    const leaving=event.target.closest('#back-to-home,#header-back,#brand-home,.arcade-nav-btn[data-destination],#v19-pause-home');
    if(!leaving || !activeGame || !v19IsPlaying() || window.TaekinV32?.getPreference?.('leaveConfirm')===false)return;
    event.preventDefault();event.stopImmediatePropagation();
    v55PendingDestination=leaving;
    v55LeaveMessage.textContent=`${gameInfo[activeGame]?.name||'게임'} 진행 중이에요. 나가면 현재 게임판을 저장하고 게임 선택 화면으로 이동해요.`;
    if(!v55LeaveDialog.open)v55LeaveDialog.showModal();
    document.getElementById('v55-leave-stay').focus({preventScroll:true});
  }, true);
  window.TaekinV31 = {openGuide};
})();

// 전체 초기화는 2회 확인 + 정확한 문구 입력으로 보호합니다.
function v31FinalResetCheck(subject){
  const answer=window.prompt(`${subject}을(를) 영구 삭제하려면 '초기화'를 입력하세요.\n취소하거나 다른 글자를 입력하면 현재 기록은 유지됩니다.\n권장: 내 기록 → 기록 백업(JSON) 먼저 저장`, '');
  return answer === '초기화';
}


/* ==================== 통합 편의 설정 ====================
   모든 사용자 설정은 현재 브라우저에 저장됩니다. 마스터 인증 정보는 백업에서 제외합니다.
   기존 JSON 백업 호환을 위해 백업 형식 version=1을 유지합니다.
   ======================================================================= */
(() => {
  'use strict';
  const $=id=>document.getElementById(id);
  const KEY='taekin_arcade_preferences_v32';
  const AUTO='taekin_arcade_auto_guide_v32';
  const SEEN='taekin_arcade_onboarding_v31';
  const defaults={font:'normal',largeTargets:false,showGameTutorial:true,leaveConfirm:true,touchSpacing:true,fontPct:100,uiPct:100,compactGame:true,autoFit:true};
  function safeRead(k){try{return localStorage.getItem(k);}catch(_){return null;}}
  function safeWrite(k,v){try{localStorage.setItem(k,v);window.TaekinV32Save?.record(true);return true;}catch(_){window.TaekinV32Save?.record(false);return false;}}
  function obj(k){try{return JSON.parse(safeRead(k)||'null');}catch(_){return null;}}
  const raw=obj(KEY);let prefs={...defaults,...(raw&&typeof raw==='object'?raw:{})};
  if(raw && raw.fontPct==null && raw.font==='large')prefs.fontPct=115;
  const bounded=(n,lo,hi,step,fallback)=>Number.isFinite(Number(n))?Math.round(Math.max(lo,Math.min(hi,Number(n)))/step)*step:fallback;
  const modal=$('v32-settings-dialog');
  const top=$('v32-save-status'),detail=$('v32-save-detail-text');
  let lastSave=0, failed=false;
  function displaySave(){
    if(failed){top.textContent='⚠ 저장 실패';top.classList.add('is-failed');detail.textContent='저장 실패 · 브라우저의 저장 권한이나 공간을 확인하세요.';}
    else{top.textContent='✓ 저장 완료';top.classList.remove('is-failed');detail.textContent=lastSave?'최근 기록이 브라우저에 저장되었습니다.':'이 브라우저에서 기록 저장을 사용할 수 있습니다.';}
  }
  window.TaekinV32Save={record(ok){failed=!ok;if(ok)lastSave=Date.now();displaySave();}};
  try{const probe='taekin_arcade_v32_storage_probe';localStorage.setItem(probe,'ok');if(localStorage.getItem(probe)!=='ok')throw Error('storage');localStorage.removeItem(probe);displaySave();}
  catch(_){window.TaekinV32Save.record(false);}
  top.addEventListener('click',()=>openSettings(true));
  function applyPrefs(){
    prefs.fontPct=bounded(prefs.fontPct,25,200,5,100);
    prefs.uiPct=bounded(prefs.uiPct,70,130,5,100);
    document.body.dataset.v32Font='normal'; // 구버전 두 단계 스타일 대신 정확한 배율 이용
    document.documentElement.style.setProperty('--v48-font-scale','1'); // v49: 개별 고정 px 문구도 공통 배율로 처리
    document.documentElement.style.setProperty('--v48-ui-scale',String(prefs.uiPct/100));
    window.dispatchEvent(new CustomEvent('taekin-v49-display-sync',{detail:{fontPct:prefs.fontPct,uiPct:prefs.uiPct}}));
    document.body.classList.toggle('v48-compact-game',!!prefs.compactGame);
    document.body.classList.toggle('v48-auto-fit',!!prefs.autoFit);
    $('v48-compact-game').checked=!!prefs.compactGame;
    $('v48-auto-fit').checked=!!prefs.autoFit;
    document.body.classList.toggle('v32-large-targets',!!prefs.largeTargets);
    document.body.classList.toggle('v32-touch-spacing',!!prefs.touchSpacing);
    document.body.classList.toggle('v32-hide-game-tutorial',!prefs.showGameTutorial);
    for(const [id,value] of [ ['v32-large-targets',prefs.largeTargets],['v32-show-game-tutorial',prefs.showGameTutorial],['v32-leave-confirm',prefs.leaveConfirm],['v32-touch-spacing',prefs.touchSpacing]])$(id).checked=!!value;
    const auto=safeRead(AUTO)!=='off';$('v32-auto-guide').checked=auto;
    $('v31-guide-remember').checked=!auto;
    const cb=$('v19-colorblind'),motion=$('v19-motion');
    $('v32-colorblind').checked=cb.checked;
    $('v32-motion').checked=motion.checked;
    document.querySelectorAll('button[data-v32-font]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.v32Font===prefs.font)));
    document.querySelectorAll('button[data-v32-theme]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.v32Theme===document.body.dataset.theme)));
    document.querySelectorAll('button[data-v32-density]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.v32Density===document.body.dataset.density)));
  }
  function savePrefs(){safeWrite(KEY,JSON.stringify(prefs));applyPrefs();}
  function openSettings(backup=false){
    applyPrefs();if(!modal.open)modal.showModal();
    if(!backup)modal.querySelector(".v32-settings-scroll").scrollTop=0;
    if(backup)requestAnimationFrame(()=>$('v32-backup-section').scrollIntoView({block:'nearest'}));
    else $('v32-settings-close').focus({preventScroll:true});
  }
  function closeSettings(){if(modal.open)modal.close();}
  $('v32-settings-open').addEventListener('click',()=>openSettings());
  for(const id of ['v32-settings-close','v32-settings-done'])$(id).addEventListener('click',closeSettings);
  modal.addEventListener('click',event=>{if(event.target===modal)closeSettings();});
  // 기존 오디오 DOM을 옮기므로 기존 재생 이벤트/선택 값/저장 키 모두 그대로 사용
  $('v32-audio-slot').appendChild($('audio-settings'));
  // 글씨/화면 배율은 외부 빠른 조절 버튼 하나에서 관리하며 기존 저장 키는 유지합니다.
  for(const [id,key] of [['v48-compact-game','compactGame'],['v48-auto-fit','autoFit']]){
    $(id).addEventListener('change',e=>{prefs[key]=e.target.checked;savePrefs();
      if(key==='autoFit' && prefs[key] && activeGame && window.matchMedia('(max-width:720px)').matches){requestAnimationFrame(()=>v42FitBoardZoom(activeGame));}
    });
  }
  for(const name of ['theme','density'])document.querySelectorAll(`[data-v32-${name}]`).forEach(b=>b.addEventListener('click',()=>{
    document.querySelector(`[data-${name}-option="${b.dataset['v32'+name[0].toUpperCase()+name.slice(1)]}"]`)?.click();
    applyPrefs();
  }));
  for(const [id,key] of [['v32-large-targets','largeTargets'],['v32-show-game-tutorial','showGameTutorial'],['v32-leave-confirm','leaveConfirm'],['v32-touch-spacing','touchSpacing']])
    $(id).addEventListener('change',e=>{prefs[key]=e.target.checked;savePrefs();});
  for(const [id,original] of [['v32-colorblind','v19-colorblind'],['v32-motion','v19-motion']])$(id).addEventListener('change',e=>{
    $(original).checked=e.target.checked;$(original).dispatchEvent(new Event('change',{bubbles:true}));applyPrefs();
  });
  $('v32-auto-guide').addEventListener('change',e=>{
    safeWrite(AUTO,e.target.checked?'on':'off');
    try{if(e.target.checked)localStorage.removeItem(SEEN);else localStorage.setItem(SEEN,'1');}catch(_){window.TaekinV32Save?.record(false);}
    applyPrefs();
  });
  $('v32-guide-reopen').addEventListener('click',()=>{closeSettings();window.TaekinV31?.openGuide?.();});
  $('v32-backup-export').addEventListener('click',()=>{$('export-progress').click();});
  $('v32-backup-import').addEventListener('click',()=>{$('import-progress').click();});
  function exportSettings(){
    return {
      preferences:{...prefs},autoGuide:safeRead(AUTO)!=='off',
      display:obj('taekin_arcade_display_v16'),accessibility:obj('taekin_arcade_accessibility_v19'),
      bgm:obj('taekin_arcade_bgm_v13'),sfx:obj('taekin_arcade_sfx_v13'),
      appearance:obj('taekin.arcade.v20.appearance'),bonus:obj('taekin.arcade.v20.bonus'),style:obj('taekin.arcade.v29.style'),
      best:obj('taekin_arcade_best_v13')
    };
  }
  function importSettings(raw){
    if(!raw||typeof raw!=='object')return;
    if(raw.preferences&&typeof raw.preferences==='object'){
      prefs={...defaults,...Object.fromEntries(Object.keys(defaults).filter(k=>typeof raw.preferences[k]===typeof defaults[k]).map(k=>[k,raw.preferences[k]]))};
      safeWrite(KEY,JSON.stringify(prefs));
    }
    if(typeof raw.autoGuide==='boolean'){safeWrite(AUTO,raw.autoGuide?'on':'off');safeWrite(SEEN,raw.autoGuide?'0':'1');}
    for(const [name,key] of [['display','taekin_arcade_display_v16'],['accessibility','taekin_arcade_accessibility_v19'],['bgm','taekin_arcade_bgm_v13'],['sfx','taekin_arcade_sfx_v13'],['appearance','taekin.arcade.v20.appearance'],['style','taekin.arcade.v29.style'],['best','taekin_arcade_best_v13']]){
      const data=raw[name];if(data&&typeof data==='object'&&!Array.isArray(data))safeWrite(key,JSON.stringify(data));
    }
    if(Array.isArray(raw.bonus)){const ids=raw.bonus.filter(x=>typeof x==='string'&&x.length<=40).slice(0,40);safeWrite('taekin.arcade.v20.bonus',JSON.stringify(ids));}
    // 화면 설정/배지 꾸미기의 기존 클로저가 다시 저장 내용을 읽도록 새로고침을 안내합니다.
    applyPrefs();
    $('backup-message').textContent='백업 복원 완료. 테마·꾸미기·사운드까지 즉시 적용하려면 새로고침하세요.';
  }
  window.TaekinV49SetDisplay=(name,value)=>{if(!['fontPct','uiPct'].includes(name))return; prefs[name]=bounded(value,name==='fontPct'?25:70,name==='fontPct'?200:130,5,100);savePrefs();};
  window.TaekinV32={getPreference:key=>prefs[key],exportSettings,importSettings,openSettings};
  applyPrefs();
})();


/* ==================== 마스터 해금 상태와 화면 동기화 ==================== */
window.addEventListener('taekin-master-changed',()=>{
  try {window.TaekinAchievementCollection?.refresh?.();}catch(error){console.warn('업적 해금 갱신 실패',error);}
  try {window.TaekinHall?.refresh?.();}catch(error){console.warn('명예의 전당 갱신 실패',error);}
  try {window.TaekinV25?.refresh?.();}catch(error){console.warn('올클리어 기념패 갱신 실패',error);}
  try {v19RenderFrames();}catch(error){console.warn('프로필 테두리 갱신 실패',error);}
  try {renderMarathonHome(); if(activeGame)renderStageChallenge();}catch(error){console.warn('스테이지 해금 갱신 실패',error);}
  document.body.classList.toggle('v34-master-active',isMasterUnlocked());
});
document.body.classList.toggle('v34-master-active',isMasterUnlocked());


/* ====================== v46: 클릭형 ? 도움말 ======================
   설명 UI만 추가하며, 기존 퍼즐 규칙·진행 기록·저장 키를 변경하지 않습니다.
   홈 게임 설명과 게임 내부 도움말은 하나의 접근성 대화상자로 공유합니다. */
(() => {
  const dialog=document.getElementById('v46-help-dialog');
  const title=document.getElementById('v46-help-title');
  const body=document.getElementById('v46-help-text');
  const extra=document.getElementById('v46-help-extra');
  const close=document.getElementById('v46-help-close');
  const ok=document.getElementById('v46-help-ok');
  const tour=document.getElementById('v46-help-tour');
  if(!dialog||!title||!body||!extra||!close||!ok||!tour)return;
  let focusedBefore=null,helpGame='baseball';
  const textByGame={
    baseball:{goal:'서로 다른 숫자로 이루어진 정답을 추리해 입력하세요. 단계에 따라 자릿수와 기회 수가 달라져요.',controls:'입력창에 중복되지 않는 숫자를 입력하고 결과 확인을 누르세요. S는 숫자·자리 모두 일치, B는 숫자만 일치해요.',hint:'힌트는 추리에 필요한 정보를 알려주지만 사용 횟수에 따라 별점이 달라질 수 있어요. 정답 보기는 연습용이며 정상 클리어로 기록되지 않아요.'},
    '2048':{goal:'같은 숫자 타일을 합쳐 목표 숫자 타일을 만들고, 단계에 표시된 점수 조건도 충족하세요.',controls:'PC에서는 방향키나 WASD, 스마트폰에서는 타일판을 위·아래·왼쪽·오른쪽으로 밀거나, 게임판 아래 방향 버튼을 누르세요. 같은 숫자 타일이 만나면 합쳐져요.',hint:'힌트는 추천 이동 방향을 알려줘요. 되돌리기는 횟수 제한 없이 이전 수로 돌아갈 수 있어요.'},
    mines:{goal:'숫자가 알려주는 주변 8칸의 지뢰 개수를 추리하며, 지뢰가 없는 칸을 모두 열면 성공해요.',controls:'PC는 왼쪽 클릭으로 열기, 오른쪽 클릭으로 깃발 표시. 스마트폰은 게임판 위의 「칸 열기 / 깃발 놓기」를 먼저 선택하세요.',hint:'첫 칸을 열기 전에는 지뢰가 배치되지 않으므로 먼저 한 칸을 열어야 해요. 이후 힌트가 논리적으로 확인한 안전 칸을 알려줘요.'},
    pipes:{goal:'시작점에서 나온 물이 모든 배관을 지나 출구로 흐르도록 파이프를 연결하세요. 열린 배관 끝도 없어야 해요.',controls:'파이프를 터치하거나 클릭해 90도 회전하세요. 회전 방향 버튼으로 시계·반시계를 선택하고 필요하면 되돌리세요.',hint:'힌트는 파이프 하나의 올바른 방향을 알려주거나 맞춰 줘요. 힌트 사용 뒤 이전 회전의 되돌리기 기록이 초기화될 수 있어요.'},
    shikaku:{goal:'게임판 전체를 직사각형으로 나누세요. 각 영역에 숫자 하나만 포함하고 넓이가 그 숫자와 같아야 해요.',controls:'시작 칸과 끝 칸을 차례로 누르거나, 손가락·마우스로 드래그해 직사각형을 지정하세요. 지우개로 잘못 만든 영역을 지울 수 있어요.',hint:'힌트로 영역의 위치를 확인할 수 있어요. 영역이 겹치거나 숫자가 둘 이상 포함되면 유효한 선택이 아니에요.'},
    blocks:{goal:'블록 세 개를 게임판에 배치하고 가로·세로 줄을 완성해 목표 점수를 얻으세요.',controls:'블록을 끌어서 놓거나, 아래 블록을 먼저 선택한 후 게임판의 시작 칸을 누르세요. 초록/빨강 배치 미리보기를 참고하세요.',hint:'힌트는 놓기 좋은 위치를 안내하고, 되돌리기는 직전 배치를 취소해요. 단 클리어가 확정된 후에는 되돌릴 수 없어요.'}
  };
  function getText(game,topic){
    const name=gameInfo[game]?.name||'게임';
    const g=textByGame[game]||textByGame.baseball;
    switch(topic){
      case 'game':return [name+'은 어떤 게임인가요?',ARCADE_TOURS[game]?.[0]||g.goal,'처음 시작한다면 「3단계 튜토리얼 보기」로 조작과 팁까지 확인하세요.'];
      case 'controls':return [name+'은 어떻게 조작하나요?',g.controls,'PC에서는 마우스·키보드, 스마트폰에서는 터치 버튼과 게임판을 이용하세요.'];
      case 'goal':return ['🎯 목표는 무엇인가요?',g.goal,'현재 단계의 구체적인 성공 조건은 게임판 위 「현재 단계 목표」에서 확인할 수 있어요.'];
      case 'hint':return ['💡 힌트 버튼은 뭔가요?',g.hint,'별점이나 도전 기록에 영향을 줄 수 있으므로 도움이 필요할 때 사용하세요.'];
      case 'zoom':return ['🔍 게임판 크기는 어떻게 바꾸나요?','−는 축소, ＋는 확대, 「기본」은 초기 크기, 「화면 맞춤」은 현재 화면에 들어오도록 크기를 맞춰 줘요.','게임마다 크기가 따로 저장돼요. 확대된 판은 좌우로 스크롤하거나 좌우 이동 버튼을 사용하세요.'];
      case 'stages':return ['🗺 단계와 난이도는 뭔가요?','게임마다 쉬움·보통·어려움·매우 어려움·전문가 5개 난이도가 있고, 난이도당 50단계예요.','난이도는 자유롭게 선택하지만, 각 난이도의 단계는 기본적으로 순서대로 열려요. 10·20·30·40·50단계는 조금 더 어려운 보스 단계예요.'];
      default:return [name+' 도움말',g.controls,g.goal];
    }
  }
  function closeHelp(){if(dialog.open)dialog.close();}
  document.addEventListener('click',event=>{
    const fold=document.getElementById('v49-help-menu');
    if(event.target.closest('.v49-help-menu-links') && fold)fold.open=false;
    const target=event.target.closest('[data-v46-help]');
    if(!target)return;
    const game=target.dataset.v46Game||activeGame||'baseball';
    const topic=target.dataset.v46Help;
    if(!textByGame[game])return;
    const [heading,description,note]=getText(game,topic);
    helpGame=game;
    title.textContent=heading;body.textContent=description;extra.textContent=note;
    focusedBefore=target;
    if(!dialog.open)dialog.showModal();
    ok.focus();
  });
  close.addEventListener('click',closeHelp);
  ok.addEventListener('click',closeHelp);
  tour.addEventListener('click',()=>{closeHelp();openTutorial(helpGame);});
  dialog.addEventListener('click',event=>{if(event.target===dialog)closeHelp();});
  dialog.addEventListener('close',()=>{
    if(focusedBefore?.isConnected && !document.getElementById('tutorial-dialog')?.open)
      focusedBefore.focus({preventScroll:true});
  });
})();


/* v47 · 레벨업 알림은 기존 LV 표시에 연결. 저장 키를 늘리지 않습니다. */
(() => {
  let lastSeenLevel=null;
  const parseLevel=()=>Number((document.getElementById('v22-level')?.textContent||'1').replace(/[^0-9]/g,''))||1;
  const reveal=()=>{
    const now=parseLevel();
    if(lastSeenLevel!==null && now>lastSeenLevel && !isMasterUnlocked()){
      if(typeof v19Toast==='function')v19Toast(`✨ 레벨 업! LV. ${now} 달성 · 프로필에서 새 꾸미기 보상을 확인하세요.`);
    }
    lastSeenLevel=now;
  };
  document.addEventListener('DOMContentLoaded',reveal,{once:true});
  window.addEventListener('taekin-achievements-updated',()=>queueMicrotask(reveal));
})();

/* ==================== v48: 모바일 화면 맞춤, 터치 조작 ==================== */
(() => {
  'use strict';
  const $=id=>document.getElementById(id);
  // v52: 크기 조절 버튼은 PC·모바일 모두 상시 표시합니다.
  // 수동 확대/축소는 플레이 중 유지하고, 게임을 새로 열 때만 화면 맞춤을 적용합니다.
  const originalShowGame=showGame;
  showGame=function(...args){
    // 블록 드래그 도중 다른 게임을 열 때 미리보기 잔상을 즉시 지웁니다.
    if(activeGame==='blocks' && args[0]!=='blocks')v53CancelBlockDrag();
    originalShowGame(...args);
    let hasManualZoom=false;
    try{hasManualZoom=localStorage.getItem('taekin.arcade.v42.boardZoom.'+activeGame)!==null;}catch(_){}
    if(!hasManualZoom && window.TaekinV32?.getPreference?.('autoFit')!==false){
      requestAnimationFrame(()=>requestAnimationFrame(()=>{
        if(activeGame && document.getElementById('play-screen')?.classList.contains('hidden')===false){
          v42FitBoardZoom(activeGame,{save:false,shrinkOnly:true});
        }
      }));
    }
  };
  // 시카쿠: 터치 스크롤에 의해 포인터가 취소되지 않도록 게임판이 포인터를 붙잡습니다.
  const shikakuBoard=$('shikaku-board');
  shikakuBoard.addEventListener('pointerdown',e=>{
    if(e.isPrimary && e.button===0 && e.target.closest('.shikaku-cell')){
      try{shikakuBoard.setPointerCapture(e.pointerId);}catch(_){}
    }
  });
  // 블록 퍼즐: 트레이에서 손가락을 떼지 않고 판까지 움직여도 포인터를 유지합니다.
  const tray=$('block-tray');
  tray.addEventListener('pointerdown',e=>{
    if(e.isPrimary && e.button===0 && e.target.closest('.block-piece:not(:disabled)')){
      try{tray.setPointerCapture(e.pointerId);}catch(_){}
    }
  });
  // 2048: 버튼 조작과 별개로 게임판을 스와이프하면 한 수를 움직입니다.
  const board=$('g2048-board');
  let swipe=null;
  board.addEventListener('pointerdown',e=>{
    if(!e.isPrimary || e.button!==0 || activeGame!=='2048')return;
    swipe={id:e.pointerId,x:e.clientX,y:e.clientY};
    try{board.setPointerCapture(e.pointerId);}catch(_){}
  });
  board.addEventListener('pointerup',e=>{
    if(!swipe || swipe.id!==e.pointerId)return;
    const dx=e.clientX-swipe.x,dy=e.clientY-swipe.y;
    swipe=null;
    if(Math.max(Math.abs(dx),Math.abs(dy))<23 || activeGame!=='2048')return;
    move2048(Math.abs(dx)>Math.abs(dy)?(dx>0?'right':'left'):(dy>0?'down':'up'));
    e.preventDefault();
  });
  board.addEventListener('pointercancel',()=>{swipe=null;});
  // v50: 음악 선택은 화면 중앙의 독립 팝업에서 진행하여 설정창 스크롤과 분리합니다.
})();


/* ==================== v49: 모든 화면에서 사용하는 글씨 배율 + 바로 조절 ====================
   기존 taekin_arcade_preferences_v32의 fontPct/uiPct만 이용합니다.
   글씨 크기 대상은 요소별 원래 글씨 크기를 기억하여 100% 화면을 유지합니다.
   게임판 숫자·이모지·음악 그림 등은 퍼즐 레이아웃을 보호하기 위해 제외합니다. */
(() => {
  'use strict';
  const $=id=>document.getElementById(id);
  const pref=window.TaekinV32;
  if(!pref)return;
  const root=document.documentElement, panel=$('v49-display-panel');
  const launchers=[$('v49-header-display'),$('v49-float-display')];
  const textSelector='button,a,h1,h2,h3,h4,h5,h6,p,small,label,summary,output,select,textarea,input,li,td,th,strong,b,em,blockquote,div,span';
  const skip=':is(#mine-board,#pipe-board,#shikaku-board,#g2048-board,#block-board,#block-tray,.secret-slots,.card-preview,.hero-slide-art,.v47-perk-icon,.clear-emblem,.v19-profile-mark,.v26-nav-icon,.v26-avatar,.brand-mark,.game-icon,.music-track-art,.v25-cert-seal,.preview-tag)';
  const measured=new Set();
  function candidates(target){
    if(target.nodeType!==1)return [];
    const found=[];
    if(target.matches(textSelector))found.push(target);
    target.querySelectorAll(textSelector).forEach(el=>found.push(el));
    return found;
  }
  function eligible(el){
    if(el.closest('#v49-display-panel,#v49-float-display'))return false;
    if(el.closest(skip))return false;
    if(el.matches('div,span') && el.childElementCount>0)return false;
    if(el.matches('input')&&!['text','number','password','search','email',''].includes(el.type))return false;
    if(el.matches('.brand-mark,.game-icon,.v26-nav-icon,.v26-avatar,.arrow-main,.music-track-art,.clear-emblem'))return false;
    if(!el.matches('input,select,textarea')&&!el.textContent.trim())return false;
    return !!el.closest('.site-shell,dialog:not(#v49-display-panel)');
  }
  function measure(el){
    if(measured.has(el)||!eligible(el))return;
    const font=parseFloat(getComputedStyle(el).fontSize);
    if(!Number.isFinite(font)||font<=0)return;
    el.style.setProperty('--v49-base-px',font+'px');
    el.dataset.v49FontBase='';
    measured.add(el);
  }
  function scan(target){
    const prior=root.style.getPropertyValue('--v49-font-scale')||'1';
    root.style.setProperty('--v49-font-scale','1');
    try{for(const el of candidates(target))measure(el);}
    finally{root.style.setProperty('--v49-font-scale',prior);}
  }
  // v48에서 제한된 CSS 규칙 대신 하나의 공통 배율을 적용합니다.
  root.style.setProperty('--v48-font-scale','1');
  root.style.setProperty('--v49-font-scale',String((pref.getPreference('fontPct')||100)/100));
  scan(document.body);
  let pending=[],scheduled=false;
  const observer=new MutationObserver(mutations=>{
    for(const change of mutations)for(const node of change.addedNodes){
      if(node.nodeType!==1)continue;
      if(node.closest('#mine-board,#pipe-board,#shikaku-board,#g2048-board,#block-board,#block-tray'))continue;
      pending.push(node);
    }
    if(!scheduled&&pending.length){scheduled=true;requestAnimationFrame(()=>{
      scheduled=false;const nodes=pending;pending=[];for(const node of nodes)if(node.isConnected)scan(node);
    });}
  });
  observer.observe(document.body,{childList:true,subtree:true});
  const clamp=(x,lo,hi)=>Math.min(hi,Math.max(lo,Math.round(Number(x)/5)*5));
  function sync(){
    const font=pref.getPreference('fontPct')||100,ui=pref.getPreference('uiPct')||100;
    root.style.setProperty('--v49-font-scale',String(font/100));
    $('v49-font-range').value=font;$('v49-font-value').textContent=font+'%';
    $('v49-ui-range').value=ui;$('v49-ui-value').textContent=ui+'%';
  }
  function update(key,v){window.TaekinV49SetDisplay?.(key,clamp(v,key==='fontPct'?25:70,key==='fontPct'?200:130));}
  $('v49-font-range').addEventListener('input',e=>update('fontPct',e.target.value));
  $('v49-ui-range').addEventListener('input',e=>update('uiPct',e.target.value));
  document.querySelectorAll('[data-v49-target][data-v49-step]').forEach(b=>b.addEventListener('click',()=>{
    const font=b.dataset.v49Target==='font';update(font?'fontPct':'uiPct',Number(pref.getPreference(font?'fontPct':'uiPct'))+Number(b.dataset.v49Step));
  }));
  $('v49-font-reset').addEventListener('click',()=>update('fontPct',100));
  $('v49-ui-reset').addEventListener('click',()=>update('uiPct',100));
  $('v49-reset-both').addEventListener('click',()=>{update('fontPct',100);update('uiPct',100);});
  function hide(){panel.hidden=true;launchers.forEach(b=>b.setAttribute('aria-expanded','false'));}
  function show(){panel.hidden=false;launchers.forEach(b=>b.setAttribute('aria-expanded','true'));sync();$('v49-font-range').focus({preventScroll:true});}
  launchers.forEach(b=>b.addEventListener('click',()=>panel.hidden?show():hide()));
  $('v49-panel-close').addEventListener('click',hide);
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!panel.hidden){hide();e.stopPropagation();}});
  document.addEventListener('pointerdown',e=>{
    if(!panel.hidden&&!panel.contains(e.target)&&!launchers.some(b=>b.contains(e.target)))hide();
  });
  window.addEventListener('taekin-v49-display-sync',sync);
  // CSS 미디어쿼리 변경 시 원래 글씨 크기를 다시 측정해 기기 회전 대응.
  let resizeHandle;
  window.addEventListener('resize',()=>{
    clearTimeout(resizeHandle);
    resizeHandle=setTimeout(()=>{
      const old=[...measured].filter(el=>el.isConnected);
      const previous=root.style.getPropertyValue('--v49-font-scale')||'1';
      root.style.setProperty('--v49-font-scale','1');
      for(const el of old)el.removeAttribute('data-v49-font-base');
      for(const el of old){const font=parseFloat(getComputedStyle(el).fontSize);if(font>0)el.style.setProperty('--v49-base-px',font+'px');el.dataset.v49FontBase='';}
      root.style.setProperty('--v49-font-scale',previous);
    },180);
  });
  sync();
  window.TaekinV49Display={sync,scan,measuredCount:()=>measured.size};
})();


/* ==================== v53 · GitHub Pages 업데이트 안내 ====================
   version.json을 동일 출처에서 캐시 우회로 확인합니다.
   - 자동으로 새로고침하지 않습니다 (플레이 중 상태 보호).
   - 기존 저장 키, 경험치, 백업/복원 형식은 건드리지 않습니다.
   - 오래된 v51 이하 클라이언트에는 이 검사 기능이 없어 v52를 최초 한 번 게시해야 합니다.
*/
(() => {
  'use strict';
  const VERSION=56;
  const notice=document.getElementById('v52-update-notice');
  const detail=document.getElementById('v52-update-detail');
  const now=document.getElementById('v52-update-now');
  const later=document.getElementById('v52-update-later');
  const foot=document.getElementById('site-version');
  if(foot)foot.textContent='v'+VERSION;
  if(!notice||!detail||!now||!later)return;
  let latest=null,checking=false,lastCheck=0,ignored=null;
  const projectVersion=raw=>{
    const n=Number(typeof raw==='object'&&raw!==null?raw.version:raw);
    return Number.isSafeInteger(n)&&n>0&&n<100000?n:null;
  };
  const shouldCheck=()=>/^https?:$/.test(location.protocol) && !document.hidden;
  async function check(force=false){
    if(!shouldCheck()||checking||(!force&&Date.now()-lastCheck<60000))return false;
    checking=true;lastCheck=Date.now();
    try{
      const url=new URL('version.json',document.baseURI);
      url.searchParams.set('check',String(Date.now()));
      const response=await fetch(url.href,{cache:'no-store',credentials:'same-origin'});
      if(!response.ok)return false;
      const remote=projectVersion(await response.json());
      if(remote===null||remote<=VERSION)return false;
      latest=remote;
      if(ignored!==remote){
        detail.textContent=`v${VERSION} → v${remote} · 플레이 기록은 유지돼요.`;
        notice.hidden=false;
      }
      return true;
    }catch(_){return false;}finally{checking=false;}
  }
  function doUpdate(){
    if(!latest)return;
    try{
      if(typeof v19StoreSnapshot==='function' && v19StoreSnapshot()==='failed'){
        detail.textContent='현재 게임 저장에 실패했어요. 기록을 백업하거나 저장 문제를 해결한 뒤 다시 시도하세요.';
        return;
      }
    }catch(_){/* 저장 함수가 없는 화면에서는 기존 기록을 그대로 유지합니다. */}
    const url=new URL(location.href);
    url.searchParams.set('v',String(latest));
    url.searchParams.set('reload',String(Date.now()));
    location.assign(url.href);
  }
  now.addEventListener('click',doUpdate);
  later.addEventListener('click',()=>{ignored=latest;notice.hidden=true;});
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)void check(true);});
  window.addEventListener('focus',()=>void check());
  setTimeout(()=>void check(true),4000);
  setInterval(()=>void check(),240000);
  window.TaekinUpdate={version:VERSION,check};
})();

/* ====================== v55 · 게임 첫 방문 튜토리얼 ======================
 * 한 게임당 한 번만 질문합니다. 거절하거나 설명을 본 뒤에는 다시 묻지 않고,
 * 수동 도움말과 기존 3단계 튜토리얼은 계속 사용할 수 있습니다. */
(() => {
  'use strict';
  const info={
    baseball:{rule:'서로 다른 숫자를 추리해 정답을 맞히세요. S는 숫자·자리 일치, B는 숫자만 일치!',mobile:'숫자 입력칸을 터치해 번호를 입력하고 「확인」을 눌러요.',pc:'키보드로 숫자를 입력하고 「확인」을 누르세요.'},
    '2048':{rule:'같은 숫자 타일을 합쳐 목표 타일과 점수를 달성하세요.',mobile:'게임판을 상하좌우로 쓸어 움직여요. 방향 버튼도 사용할 수 있어요.',pc:'방향키 또는 W/A/S/D로 타일을 움직여요.'},
    mines:{rule:'숫자가 뜻하는 주변 지뢰 개수를 보고 안전한 칸을 모두 열면 성공!',mobile:'「열기 / 깃발」 모드를 선택한 뒤 칸을 터치해요.',pc:'왼쪽 클릭으로 열고, 오른쪽 클릭으로 깃발을 표시해요.'},
    pipes:{rule:'파이프를 돌려 시작점부터 끝점까지 누수 없이 물길을 연결해요.',mobile:'연결하려는 파이프를 손가락으로 톡톡 눌러 회전해요.',pc:'파이프 칸을 마우스로 클릭해 회전하세요.'},
    shikaku:{rule:'각 직사각형 안에 숫자를 하나만 넣고, 그 숫자만큼 칸을 차지하게 나눠요.',mobile:'처음·끝 칸을 차례로 누르거나, 손가락으로 드래그해 사각형을 선택해요.',pc:'두 모서리 칸을 클릭하거나 드래그해 직사각형을 선택해요.'},
    blocks:{rule:'블록을 놓아 가로·세로 한 줄을 완성하면 줄이 사라지고 점수를 얻어요.',mobile:'블록을 터치하고 게임판 칸을 누르거나, 손가락으로 끌어서 놓아요.',pc:'블록을 선택해 게임판을 클릭하거나, 마우스로 끌어서 배치하세요.'}
  };
  const dialog=document.getElementById('v55-first-guide');
  const heading=document.getElementById('v55-guide-heading');
  const summary=document.getElementById('v55-guide-summary');
  const controls=document.getElementById('v55-guide-controls');
  const reject=document.getElementById('v55-guide-skip');
  const agree=document.getElementById('v55-guide-show');
  const done=document.getElementById('v55-guide-done');
  const touchHint=document.getElementById('v55-mobile-hint');
  let shownFor=null;
  const visitedKey=key=>'taekin.arcade.v55.guideSeen.'+key;
  function markSeen(){if(shownFor){try{localStorage.setItem(visitedKey(shownFor),'1');}catch(_){}}}
  function dismiss(){markSeen();if(dialog.open)dialog.close();shownFor=null;}
  reject.addEventListener('click',dismiss);
  done.addEventListener('click',dismiss);
  agree.addEventListener('click',()=>{
    if(!shownFor)return;
    summary.hidden=false;controls.hidden=false;
    reject.hidden=true;agree.hidden=true;done.hidden=false;
    done.focus({preventScroll:true});
  });
  dialog.addEventListener('cancel',()=>markSeen());
  dialog.addEventListener('close',()=>{shownFor=null;});
  dialog.addEventListener('click',e=>{if(e.target===dialog)dismiss();});
  function schedulePrompt(key){
    if(!info[key])return;
    const mobile=window.matchMedia('(max-width:720px)').matches;
    touchHint.textContent='📱 '+info[key].mobile;
    let seen=false;
    try{seen=localStorage.getItem(visitedKey(key))==='1';}catch(_){}
    if(seen||dialog.open)return;
    const openWhenReady=()=>{
      if(activeGame!==key||document.getElementById('play-screen').classList.contains('hidden'))return;
      // 첫 방문 가이드나 다른 팝업이 열렸다면 종료 후 게임 설명을 보여줍니다.
      if([...document.querySelectorAll('dialog[open]')].some(d=>d!==dialog)){
        setTimeout(openWhenReady,250);
        return;
      }
      shownFor=key;
      heading.textContent=`${gameInfo[key].name} · 게임 방법이 필요하신가요?`;
      summary.textContent=info[key].rule;
      controls.textContent=mobile?'📱 '+info[key].mobile:'🖥️ '+info[key].pc;
      summary.hidden=true;controls.hidden=true;
      reject.hidden=false;agree.hidden=false;done.hidden=true;
      dialog.showModal();
      agree.focus({preventScroll:true});
    };
    setTimeout(openWhenReady,140);
  }
  const priorShowGame=showGame;
  showGame=function(...args){priorShowGame(...args);if(info[args[0]])schedulePrompt(args[0]);};
  window.TaekinV55Guide={info,visitedKey,open:key=>{
    const chosen=info[key]?key:activeGame;
    if(!info[chosen])return;
    try{localStorage.removeItem(visitedKey(chosen));}catch(_){}
    schedulePrompt(chosen);
  }};
})();

/* ====================== v55 · 모바일 글씨·화면 버튼 이동/숨기기 ======================
 * 짧게 탭: 조절창 열기 / 드래그: 위치 이동 / 3초 이상 누르기: 숨기기 확인창
 * 설정에서 버튼을 다시 표시할 수 있습니다. */
(() => {
  'use strict';
  const btn=document.getElementById('v49-float-display');
  const panel=document.getElementById('v49-display-panel');
  const restore=document.getElementById('v55-restore-display');
  const HIDE_KEY='taekin.arcade.v55.hideDisplayButton';
  const POSITION_KEY='taekin.arcade.v55.displayPosition';
  const hideDialog=document.getElementById('v56-hide-display-confirm');
  const cancelHide=document.getElementById('v56-hide-cancel');
  const confirmHide=document.getElementById('v56-hide-confirm');
  let dragging=false, longPress=false, suppressClick=false, pointerId=null;
  let startX=0,startY=0,rect=null,hold=null,last={x:0,y:0};
  const screen=()=>({w:innerWidth,h:innerHeight});
  function persist(key,value){try{localStorage.setItem(key,value);}catch(_){}}
  function syncHidden(){
    let hidden=false;try{hidden=localStorage.getItem(HIDE_KEY)==='1';}catch(_){}
    btn.classList.toggle('v55-quick-hidden',hidden);
    restore.hidden=!hidden;
    restore.setAttribute('aria-hidden',String(!hidden));
  }
  function clamp(v,min,max){return Math.max(min,Math.min(max,v));}
  function moveTo(x,y,save=true){
    const {w,h}=screen(),width=btn.offsetWidth||110,height=btn.offsetHeight||44;
    x=clamp(x,5,Math.max(5,w-width-5));
    y=clamp(y,5,Math.max(5,h-height-5));
    btn.style.left=x+'px';btn.style.top=y+'px';btn.style.right='auto';btn.style.bottom='auto';
    last={x,y};if(save)persist(POSITION_KEY,JSON.stringify(last));
  }
  try{const pos=JSON.parse(localStorage.getItem(POSITION_KEY)||'null');if(pos&&Number.isFinite(pos.x)&&Number.isFinite(pos.y))requestAnimationFrame(()=>moveTo(pos.x,pos.y,false));}catch(_){}
  syncHidden();
  btn.setAttribute('title','짧게 누르기: 글씨·화면 설정 / 끌기: 위치 이동 / 3초 이상 누르기: 숨기기 확인');
  // 기존 클릭 이벤트보다 먼저 실행하도록 캡처 단계에서 드래그/길게누르기 클릭을 차단합니다.
  btn.addEventListener('click',e=>{
    if(!suppressClick)return;
    e.preventDefault();e.stopImmediatePropagation();suppressClick=false;
  },true);
  btn.addEventListener('pointerdown',e=>{
    if(e.button!==0||e.isPrimary===false)return;
    startX=e.clientX;startY=e.clientY;pointerId=e.pointerId;
    rect=btn.getBoundingClientRect();dragging=false;longPress=false;
    // 시작 즉시 포인터를 붙잡아 손가락이 버튼 밖으로 나가도 이동을 계속 추적합니다.
    try{btn.setPointerCapture(pointerId);}catch(_){}
    hold=setTimeout(()=>{
      // 손가락이 실제로 3초 이상 같은 자리에서 눌린 경우에만 확인창을 띄웁니다.
      if(dragging||pointerId===null||!rect)return;
      longPress=true;suppressClick=true;
      if(!hideDialog.open){
        hideDialog.showModal();
        cancelHide.focus({preventScroll:true});
      }
      // 확인을 누르기 전에는 버튼 위치·표시·저장값을 변경하지 않습니다.
    },3000);
  });
  btn.addEventListener('pointermove',e=>{
    if(e.pointerId!==pointerId||!rect||longPress)return;
    const dx=e.clientX-startX,dy=e.clientY-startY;
    if(!dragging&&Math.hypot(dx,dy)>8){
      dragging=true;clearTimeout(hold);suppressClick=true;
      try{btn.setPointerCapture(pointerId);}catch(_){}
    }
    if(dragging){e.preventDefault();moveTo(rect.left+dx,rect.top+dy,false);}
  });
  function endPointer(e){
    if(e&&pointerId!==null&&e.pointerId!==pointerId)return;
    clearTimeout(hold);
    if(dragging)persist(POSITION_KEY,JSON.stringify(last));
    if(dragging||longPress){suppressClick=true;setTimeout(()=>{suppressClick=false;},550);}
    dragging=false;longPress=false;pointerId=null;rect=null;
  }
  btn.addEventListener('pointerup',endPointer);btn.addEventListener('pointercancel',endPointer);
  window.addEventListener('resize',()=>{if(btn.style.left)moveTo(last.x,last.y,false);});
  // 모바일 브라우저의 길게 누르기 메뉴가 확인창을 가리지 않도록 합니다.
  btn.addEventListener('contextmenu',e=>e.preventDefault());
  cancelHide.addEventListener('click',()=>hideDialog.close());
  confirmHide.addEventListener('click',()=>{
    persist(HIDE_KEY,'1');
    syncHidden();
    panel.hidden=true;
    document.getElementById('v49-panel-close')?.click();
    hideDialog.close();
  });
  restore.addEventListener('click',()=>{
    try{localStorage.removeItem(HIDE_KEY);}catch(_){}
    syncHidden();
    // 설정 팝업 뒤에 숨지 않도록 조절 버튼 위치를 유지한 채 다시 표시합니다.
  });
  window.TaekinV55Display={syncHidden,moveTo};
})();
