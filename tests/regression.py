"""TAEKIN BRAIN ARCADE v45 — 브라우저 회귀 검사.

실행: pip install playwright && python -m playwright install chromium
      python tests/regression.py

일부 샌드박스에서는 file:// / localhost 탐색이 막힙니다. 따라서 원본 HTML과
CSS·JS를 독립된 브라우저 문서에 주입하고 localStorage를 메모리로 대체합니다.
저장 실패 시나리오를 재현할 수 있지만 실제 파일 오디오/GitHub Pages 테스트는 아닙니다.
"""
import os
import re
import shutil
import sys
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parent.parent
HTML = (ROOT / 'index.html').read_text(encoding='utf-8')
HTML = re.sub(r'<link\b[^>]*href="style.css"[^>]*>', '', HTML)
HTML = re.sub(r'<script\b[^>]*src="script.js"[^>]*></script>', '', HTML)
CSS = (ROOT / 'style.css').read_text(encoding='utf-8')
JS = (ROOT / 'script.js').read_text(encoding='utf-8')
STORE = r'''() => {
  const saved = new Map();
  const api = {
    get length(){return saved.size;},
    key(i){return Array.from(saved.keys())[i] ?? null;},
    getItem(k){return saved.get(String(k)) ?? null;},
    setItem(k,v){saved.set(String(k), String(v));},
    removeItem(k){saved.delete(String(k));},
    clear(){saved.clear();}
  };
  Object.defineProperty(window,'localStorage',{configurable:true,value:api});
}'''
passed = []

def ok(label, value):
    assert value, label
    passed.append(label)
    print('[PASS]', label)

def new_page(browser, width=1366, height=900):
    page = browser.new_page(viewport={'width':width,'height':height})
    errors = []
    page.on('pageerror',lambda error:errors.append(str(error)))
    page.set_content(HTML)
    page.evaluate(STORE)
    page.add_style_tag(content=CSS)
    page.add_script_tag(content=JS)
    return page,errors

def main():
    with sync_playwright() as playwright:
        chrome = os.environ.get('PLAYWRIGHT_CHROMIUM') or shutil.which('chromium') or shutil.which('google-chrome')
        options = {'headless':True}
        if chrome: options['executable_path'] = chrome
        browser = playwright.chromium.launch(**options)
        try:
            page,errors = new_page(browser)
            page.on('console',lambda message: print('[BROWSER]',message.text) if message.type=='error' else None)
            ok('파일 3종 로드 및 게임 카드 6개', page.locator('.game-card').count()==6 and len(errors)==0)
            ok('5개 난이도 × 50단계 × 6게임 = 1,500단계 설정',page.evaluate('''() => {
              if(ARCADE_ORDER.length!==6 || LEVEL_KEYS.length!==5 || STAGE_COUNT!==250)return false;
              for(const name of ARCADE_ORDER)for(let index=0;index<250;index++){
                const config=getStageConfig(name,index);
                if(!config||config.level!==index%50+1||config.tier!==LEVEL_KEYS[Math.floor(index/50)])return false;
              }
              return true;
            }'''))
            ok('난이도별 보스 10·20·30·40·50',page.evaluate('''() => {
              return ARCADE_ORDER.every(g=>LEVEL_KEYS.every((tier,t)=>[10,20,30,40,50].every(level=>getStageConfig(g,t*50+level-1).boss)));
            }'''))

            # 모든 게임을 시작하고 현재 상태/저장 데이터의 내부 판 구조까지 검사
            for name in ['baseball','2048','mines','pipes','shikaku','blocks']:
                ok(name+' 시작·저장·구조 검증',page.evaluate('''name=>{
                  showGame(name);
                  if(activeGame!==name||v19StoreSnapshot()!=='saved')return false;
                  return v41ValidateSession(name,v19Saves[name]).key===name;
                }''',name))
            ok('각 게임의 이어하기 기록 6개 저장',page.evaluate('Object.keys(v19Saves).length===6'))
            # 문법/구조 검사와 별개로 실제 '이어하기' 함수를 여섯 게임 모두 실행합니다.
            for name in ['baseball','2048','mines','pipes','shikaku','blocks']:
                ok(name+' 실제 이어하기 복원',page.evaluate('''name=>{
                  const snapshot=v19Saves[name];if(!snapshot)return false;
                  showGame(name);v19ResumeSaved(name);
                  return activeGame===name&&$('v19-toast').textContent.includes('이어하기 완료');
                }''',name))

            ok('숫자야구 0 포함 스트라이크·볼 계산',page.evaluate("baseballJudge(['0','1','2','3'],'1032').text==='0S 4B'"))
            ok('2048 타일 합치기 및 무제한 되돌리기',page.evaluate('''() => {
              showGame('2048');game2048.board=[[2,2,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0]];
              const before=JSON.stringify(game2048.board);
              move2048('left');
              if(game2048.board[0][0]!==4||!game2048.history.length)return false;
              undo2048();return JSON.stringify(game2048.board)===before;
            }'''))
            ok('지뢰찾기 첫 클릭 안전 및 깃발 모드 전환',page.evaluate('''() => {
              showGame('mines');revealMines(0,0);
              if(mineGame.mines[0][0]||!mineGame.open[0][0])return false;
              mineGame.mode='flag';syncMineMode();
              const text=$('v41-mine-mode-note').textContent;
              const cell=mineGame.open.flat().indexOf(0);
              if(cell>=0){const r=Math.floor(cell/mineGame.size),c=cell%mineGame.size;flagMine(r,c);}
              return text.includes('깃발 모드')&&$('mine-mode-flag').getAttribute('aria-pressed')==='true';
            }'''))
            ok('파이프 회전 후 이전 회전 복원',page.evaluate('''() => {
              showGame('pipes');const size=pipeGame.size;
              let found=null;for(let r=0;r<size;r++)for(let c=0;c<size;c++)if(!(r===0&&c===size-1)&&pipeBits(pipeGame.board[r][c])!==4&&!found)found=[r,c];
              if(!found)return false;
              const [r,c]=found,original=pipeGame.board[r][c];rotatePipeAt(r,c);
              if(!pipeGame.history.length)return false;
              undoPipeTurn();return pipeGame.board[r][c]===original;
            }'''))
            ok('시카쿠 힌트 및 직사각형 정답 선택',page.evaluate('''() => {
              showGame('shikaku');shikakuHint();
              const rect=shikaku.solution[0];
              if(!rect||shikakuValidate(rect))return false;
              shikakuCommit(rect);
              return shikaku.history.length===1;
            }'''))
            ok('블록 퍼즐 배치·미리보기·되돌리기',page.evaluate('''() => {
              showGame('blocks');selectBlockPiece(0);
              const shape=blockShapes[blockGame.tray[0].shapeId],legal=blockLegalMoves(blockGame.board,shape)[0];
              if(!legal)return false;
              blockGame.hover={r:legal[0],c:legal[1]};updateBlockPreview();
              if(!$('v41-block-preview-note').textContent.includes('배치 가능'))return false;
              placeBlock(...legal);if(blockGame.moves!==1)return false;
              undoBlocks();return blockGame.moves===0;
            }'''))
            ok('지뢰찾기 실제 모드 버튼·칸 클릭 이벤트',page.evaluate('''() => {
              showGame('mines');$('mine-mode-flag').click();
              $('mine-board').querySelector('.mine-cell').click();
              return mineGame.flagCount===1&&mineGame.flags[0][0]===1;
            }'''))
            ok('블록 퍼즐 실제 선택 버튼·게임판 클릭 이벤트',page.evaluate('''() => {
              showGame('blocks');$('block-tray').querySelector('.block-piece').click();
              if(blockGame.selected!==0)return false;
              $('block-board').querySelector('.block-cell').click();
              return blockGame.moves===1;
            }'''))
            ok('시카쿠 두 번 누르기 포인터 이벤트',page.evaluate('''() => {
              showGame('shikaku');const rect=shikaku.solution[0];
              function tap(r,c,id){
                const cell=$('shikaku-board').querySelector(`[data-row="${r}"][data-col="${c}"]`);
                cell.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,pointerId:id,button:0}));
                document.dispatchEvent(new PointerEvent('pointerup',{bubbles:true,pointerId:id,button:0}));
              }
              tap(rect.r1,rect.c1,21);tap(rect.r2,rect.c2,22);
              return shikaku.history.length===1;
            }'''))
            ok('도전 10라운드가 계산용 23단계로 잘못 표시되지 않음',page.evaluate('''() => {
              launchMarathonRound(9,true);
              return $('rules-content').textContent.includes('도전 모드 10라운드')&&!$('rules-content').textContent.includes('23라운드');
            }'''))
            ok('도전 100라운드 및 개별 스테이지 구조 유지',page.evaluate('''() =>
              arcadeProgress.arcadeRun.round<=100&&STAGE_COUNT*ARCADE_ORDER.length===1500'''))

            # 정상 저장 및 기존 JSON 백업에 포함된 6종 세션 검증
            ok('정상 v40 형식의 JSON 진행도·이어하기 검증',page.evaluate('''() => {
              // 미리 완료된 퍼즐은 완료 처리로 세이브가 삭제될 수 있으므로 여섯 판을 다시 저장한다.
              for(const name of ARCADE_ORDER){if(!v19Saves[name]){showGame(name);if(v19StoreSnapshot()!=='saved')return false;}}
              const progress=JSON.parse(JSON.stringify(arcadeProgress));
              const root={format:'taekin-brain-arcade-progress',version:1,progress};
              const validated=validateImportedProgress(root);
              let extra;try{extra=v39ValidateImportExtras({sessions:v19Saves});}
              catch(error){console.error('VALIDATION',error.message);return false;}
              return Boolean(validated&&Object.keys(extra.sessions).length===6);
            }'''))
            ok('잘못된 지뢰 숫자 백업을 복원 전에 거부',page.evaluate('''() => {
              const old=JSON.stringify(v19Saves),bad=JSON.parse(old);
              bad.mines.data.adjacent[0][0]=99;
              try{v39ValidateImportExtras({sessions:bad});return false;}
              catch(error){return error.message.includes('adjacent')&&old===JSON.stringify(v19Saves);}
            }'''))
            ok('6종 게임판 손상 데이터 모두 거부',page.evaluate('''() => {
              const problems={
                baseball:d=>{d.answer=['?'];},
                '2048':d=>{d.board=[[2]];},
                mines:d=>{d.adjacent=[[99]];},
                pipes:d=>{d.start.r=99;},
                shikaku:d=>{d.regions=[[42]];},
                blocks:d=>{d.tray[0].shapeId=999;}
              };
              return Object.entries(problems).every(([key,change])=>{
                const bad=JSON.parse(JSON.stringify(v19Saves[key]));change(bad.data);
                try{v41ValidateSession(key,bad);return false;}catch(_){return true;}
              });
            }'''))
            ok('구버전 100단계 진행 기록의 난이도별 이관',page.evaluate('''() => {
              const legacy={format:'taekin-brain-arcade-progress',version:1,progress:{
                stageVersion:0,stages:{baseball:25},stars:{baseball:{0:3,12:2}},
                daily:{},arcadeRun:{round:2,step:3}}};
              const data=validateImportedProgress(legacy);
              return data.stageVersion===29&&data.tierStages.baseball.easy===10&&data.tierStages.baseball.normal===15&&data.arcadeRun.round===2;
            }'''))
            ok('과거 이어하기 선택적 필드 누락 호환',page.evaluate('''() => {
              const old=JSON.parse(JSON.stringify(v19Saves));
              delete old['2048'].data.goalScore;
              delete old.pipes.data.turnDirection;
              delete old.blocks.data.combo;
              return v41ValidateSession('2048',old['2048']).data.goalScore===0&&
                v41ValidateSession('pipes',old.pipes).data.turnDirection===1&&
                v41ValidateSession('blocks',old.blocks).data.combo===0;
            }'''))
            ok('잘못된 블록 배열 백업을 복원 전에 거부',page.evaluate('''() => {
              const bad=JSON.parse(JSON.stringify(v19Saves));bad.blocks.data.board=[[1]];
              try{v39ValidateImportExtras({sessions:bad});return false;}catch(_){return true;}
            }'''))
            ok('이어하기 손상 시 현재 게임을 바꾸지 않고 원본 유지',page.evaluate('''() => {
              const prior=v19Saves.mines;
              const corrupt=JSON.parse(JSON.stringify(prior));corrupt.data.mines=[[]];
              v19Saves.mines=corrupt;const before=activeGame;
              v19ResumeSaved('mines');
              const result=activeGame===before&&v19Saves.mines===corrupt&&$('v19-toast').textContent.includes('손상');
              v19Saves.mines=prior;return result;
            }'''))
            ok('실제 저장 쓰기 실패 시 성공 안내 금지 및 이전 데이터 보호',page.evaluate('''() => {
              showGame('2048');if(v19StoreSnapshot()!=='saved')return false;
              const before=JSON.stringify(v19Saves['2048']);
              const original=localStorage.setItem;
              localStorage.setItem=function(key,value){if(key===V19_STATE_KEY)throw new Error('test quota');return original.call(this,key,value);};
              $('v19-save-now').click();
              const message=$('v19-toast').textContent;
              const unchanged=JSON.stringify(v19Saves['2048'])===before;
              localStorage.setItem=original;
              return message.includes('저장에 실패')&&!message.includes('저장했습니다')&&unchanged;
            }'''))
            ok('정상 기록 JSON 백업 복원 후 저장 유지',page.evaluate('''() => {
              const root={format:'taekin-brain-arcade-progress',version:1,progress:JSON.parse(JSON.stringify(arcadeProgress)),
                extra:{sessions:v19Saves,playlog:v19Playlog,profileFrame:v19Frame,
                  featuredBadge:window.TaekinHall?.exportState?.(),
                  v25:window.TaekinV25?.exportState?.(),v29:window.TaekinV29Rank?.exportState?.(),
                  v32:window.TaekinV32?.exportSettings?.()}};
              const validated=validateImportedProgress(root),extra=v39ValidateImportExtras(root.extra);
              v39ImportSafely(validated,extra);
              return Boolean(JSON.parse(localStorage.getItem(V19_STATE_KEY))['2048']);
            }'''))
            ok('복원 도중 저장 오류 발생 시 기존 핵심 기록 롤백',page.evaluate('''() => {
              const before=localStorage.getItem(PROGRESS_STORAGE);
              const beforeSaves=localStorage.getItem(V19_STATE_KEY);
              const beforePlay=localStorage.getItem(V19_LOG_KEY);
              const original=localStorage.setItem;let failOnce=true;
              localStorage.setItem=function(key,value){if(key===V19_LOG_KEY&&failOnce){failOnce=false;throw new Error('one-time test failure');}return original.call(this,key,value);};
              const root={format:'taekin-brain-arcade-progress',version:1,progress:JSON.parse(JSON.stringify(arcadeProgress))};
              let rolledBack=false;
              try{v39ImportSafely(validateImportedProgress(root),{playlog:v19Playlog});}
              catch(e){rolledBack=e.message.includes('되돌렸습니다');}
              finally{localStorage.setItem=original;}
              return rolledBack&&localStorage.getItem(PROGRESS_STORAGE)===before&&localStorage.getItem(V19_STATE_KEY)===beforeSaves&&localStorage.getItem(V19_LOG_KEY)===beforePlay;
            }'''))
            ok('마스터 해금이 별·단계 진행 기록을 조작하지 않음',page.evaluate('''() => {
              const before=JSON.stringify(arcadeProgress);TaekinMaster.setUnlocked(true);
              const stable=JSON.stringify(arcadeProgress)===before;
              TaekinMaster.setUnlocked(false);return stable;
            }'''))
            # v42: UI buttons must affect actual element dimensions (not merely the percentage label).
            for name, selector in [('baseball','.secret-slots span'),('2048','#g2048-board'),
                                   ('mines','#mine-board .mine-cell'),('pipes','.pipe-board-wrap'),
                                   ('shikaku','#shikaku-board'),('blocks','#block-board')]:
                ok(name+' 게임판 실측 확대·축소·기본 크기',page.evaluate('''({name,selector})=>{
                  showGame(name);v42SetBoardZoom(name,1);
                  const before=document.querySelector('#panel-'+name+' '+selector).getBoundingClientRect().width;
                  document.querySelector('[data-v42-game="'+name+'"] [data-v42-action="in"]').click();
                  const after=document.querySelector('#panel-'+name+' '+selector).getBoundingClientRect().width;
                  document.querySelector('[data-v42-game="'+name+'"] [data-v42-action="reset"]').click();
                  const reset=document.querySelector('#panel-'+name+' '+selector).getBoundingClientRect().width;
                  return after>before*1.06&&Math.abs(reset-before)<1;
                }''',{'name':name,'selector':selector}))
            ok('게임별 확대 설정 독립 유지·localStorage 저장',page.evaluate('''() => {
              v42SetBoardZoom('mines',1.6);v42SetBoardZoom('2048',.7);
              showGame('shikaku');showGame('mines');
              return v42Zoom.mines===1.6&&v42Zoom['2048']===.7&&v42Zoom.shikaku===1&&
                localStorage.getItem('taekin.arcade.v42.boardZoom.mines')==='1.6';
            }'''))
            ok('지뢰찾기 화면 맞춤 시 게임판이 가로 폭 안에 들어옴',page.evaluate('''() => {
              showGame('mines');mineGame.size=12;mineGame.open=Array.from({length:12},()=>Array(12).fill(0));
              mineGame.flags=Array.from({length:12},()=>Array(12).fill(0));
              mineGame.mines=Array.from({length:12},()=>Array(12).fill(0));
              mineGame.adjacent=Array.from({length:12},()=>Array(12).fill(0));
              renderMines();v42FitBoardZoom('mines');
              return $('mine-board').getBoundingClientRect().width <=$('v39-mine-viewport').clientWidth+1;
            }'''))
            ok('신규 게임판 확대 설정 JSON 내보내기·검증 가능',page.evaluate('''() => {
              const data=v39ValidateImportExtras({v42Zoom:{mines:1.7,blocks:.8}});
              return data.v42Zoom.mines===1.7&&data.v42Zoom.blocks===.8;
            }'''))
            ok('손상된 게임판 확대 설정 백업 거부',page.evaluate('''() => {
              try{v39ValidateImportExtras({v42Zoom:{mines:200}});return false;}catch(e){return e.message.includes('게임판 크기');}
            }'''))
            ok('게임판 확대 설정 JSON 복원 후 게임별 값 유지',page.evaluate('''() => {
              const state={...v42Zoom};
              const imported=validateImportedProgress({format:'taekin-brain-arcade-progress',version:1,progress:JSON.parse(JSON.stringify(arcadeProgress))});
              v39ImportSafely(imported,v39ValidateImportExtras({v42Zoom:{mines:1.3,shikaku:.85}}));
              const result=v42Zoom.mines===1.3&&v42Zoom.shikaku===.85&&localStorage.getItem('taekin.arcade.v42.boardZoom.shikaku')==='0.85';
              for(const [g,val] of Object.entries(state))v42SetBoardZoom(g,val);
              return result;
            }'''))
            ok('게임판 이동 버튼 확대 시 표시',page.evaluate('''() => {
              showGame('blocks');v42SetBoardZoom('blocks',2);
              const pane=v42BoardViewport('blocks');v42UpdatePanControls('blocks');
              return pane.scrollWidth>pane.clientWidth&&document.querySelector('[data-v42-pan-game="blocks"]').hidden===false;
            }'''))
            # v43: the 16×16 expert mine board must truly FIT at mobile width.
            ok('v43 지뢰찾기 16×16 화면 맞춤 실측',page.evaluate('''() => {
              showGame('mines');const cfg=getStageConfig('mines',249);
              mineGame.size=cfg.size;mineGame.count=cfg.mines;
              for(const key of ['mines','open','flags','adjacent'])mineGame[key]=newEmptyGrid(cfg.size);
              renderMines();v42FitBoardZoom('mines');
              return mineGame.size===16&&v42Zoom.mines>=V42_ZOOM_MIN&&
                $('mine-board').getBoundingClientRect().width<=$('v39-mine-viewport').clientWidth+1;
            }'''))
            ok('v44 150개 대표 스테이지 실제 초기화·저장 구조·정답 퍼즐 검사',page.evaluate('''() => {
              const samples=[0,50,100,150,200].flatMap(base=>[0,9,24,39,49].map(i=>base+i));
              const prior=TaekinMaster.isUnlocked();
              TaekinMaster.setUnlocked(true);
              let count=0;
              try{
                for(const game of ARCADE_ORDER){
                  showGame(game,false);
                  for(const index of samples){
                    launchStage(index);
                    if(activeGame!==game||challenge.stage!==index)return false;
                    const data=v19SnapshotPayload(game);
                    v41ValidateSession(game,{key:game,when:Date.now(),stageSchema:29,
                      mode:{mode:'stage',stage:index,reported:false},data,run:{...runStats}});
                    if(game==='pipes'&&!pipeReachable(pipeGame.solution).solved)return false;
                    if(game==='shikaku'&&shikaku.solution.reduce((sum,r)=>sum+rectArea(r),0)!==shikaku.size*shikaku.size)return false;
                    count++;
                  }
                }
                return count===150;
              }finally{TaekinMaster.setUnlocked(prior);}
            }'''))
            ok('데스크톱 JavaScript 오류 없음',len(errors)==0)
            page.close()

            # 320px·390px 모바일 시뮬레이션과 PC 폭 검증
            for width in [320,390,1366]:
                phone,errs=new_page(browser,width,844)
                ok(f'화면 {width}px 게임 6종 진입·가로 넘침 없음',phone.evaluate('''() => {
                  for(const name of ARCADE_ORDER){showGame(name);
                    if(activeGame!==name||document.documentElement.scrollWidth>window.innerWidth+1)return false;
                  }return true;
                }'''))
                if width<=390:
                    ok(f'모바일 {width}px 난이도 선택 접기·게임판 이동 버튼',phone.evaluate('''() => {
                      showGame('mines');return !$('v41-tier-fold').open&&$('v41-jump-board')!==null;
                    }'''))
                    ok(f'모바일 {width}px 지뢰찾기 확대·축소 실제 셀 크기 변화',phone.evaluate('''() => {
                      showGame('mines');v42SetBoardZoom('mines',1);
                      const before=$('mine-board').querySelector('.mine-cell').getBoundingClientRect().width;
                      document.querySelector('[data-v42-game="mines"] [data-v42-action="in"]').click();
                      const after=$('mine-board').querySelector('.mine-cell').getBoundingClientRect().width;
                      document.querySelector('[data-v42-game="mines"] [data-v42-action="out"]').click();
                      const again=$('mine-board').querySelector('.mine-cell').getBoundingClientRect().width;
                      return after>before+2&&Math.abs(again-before)<1;
                    }'''))
                ok(f'화면 {width}px 여섯 게임 화면 맞춤·확대 후 가로 이동',phone.evaluate('''() => {
                  for(const name of ARCADE_ORDER){
                    showGame(name);v42SetBoardZoom(name,2);v42FitBoardZoom(name);
                    const viewport=v42BoardViewport(name);
                    const board=name==='baseball'?document.querySelector('#panel-baseball .secret-slots'):
                      name==='mines'?$('mine-board'):
                      name==='pipes'?document.querySelector('#panel-pipes .pipe-board-wrap'):
                      $(name==='2048'?'g2048-board':name==='shikaku'?'shikaku-board':'block-board');
                    if(board.getBoundingClientRect().width>viewport.clientWidth+2)return false;
                    v42SetBoardZoom(name,2);
                    const nav=document.querySelector('[data-v42-pan-game="'+name+'"]');
                    v42UpdatePanControls(name);
                    if(viewport.scrollWidth>viewport.clientWidth+2){
                      if(nav.hidden)return false;
                      const before=viewport.scrollLeft;nav.querySelector('[data-v42-pan="right"]').click();
                      if(viewport.scrollLeft<=before)return false;
                    }
                  }return true;
                }'''))
                if width==320:
                    ok('v43 320px 전문가 16×16 지뢰찾기 화면 맞춤 실측',phone.evaluate('''() => {
                      showGame('mines');const cfg=getStageConfig('mines',249);
                      mineGame.size=cfg.size;mineGame.count=cfg.mines;
                      for(const key of ['mines','open','flags','adjacent'])mineGame[key]=newEmptyGrid(cfg.size);
                      renderMines();v42FitBoardZoom('mines');
                      return cfg.size===16&&v42Zoom.mines<V42_ZOOM_MAX&&
                        $('mine-board').getBoundingClientRect().width<=$('v39-mine-viewport').clientWidth+1;
                    }'''))
                ok(f'화면 {width}px JavaScript 오류 없음',len(errs)==0)
                phone.close()
            # v43: validate actual stage completion and timer cancellation, isolated from other tests.
            integrity,integrity_errors=new_page(browser,390,844)
            ok('v43 마스터로 높은 단계만 클리어해도 미완료 단계는 그대로',integrity.evaluate('''() => {
              arcadeProgress=upgradeProgressV29({stageVersion:29,stages:{},stars:{},skipped:{},tierStages:{},selectedTiers:{},arcadeRun:{round:0,step:0}});
              TaekinMaster.setUnlocked(true);
              showGame('baseball',false);launchStage(49);
              $('bb-input').value=baseball.answer.join('');$('bb-form').requestSubmit();
              const advanced=completedTierStages('baseball','easy')===0&&getSavedStars('baseball',49)>0&&
                $('clear-title').textContent.includes('보스 클리어')&&
                !$('clear-title').textContent.includes('올클리어');
              launchStage(0);$('bb-input').value=baseball.answer.join('');$('bb-form').requestSubmit();
              return advanced&&completedTierStages('baseball','easy')===1&&getSavedStars('baseball',0)>0;
            }'''))
            ok('v43 마스터 단계 테스트 JavaScript 오류 없음',len(integrity_errors)==0)
            integrity.close()
            pipes_page,pipe_errors=new_page(browser)
            ok('v43 배관 물 흐름 중 게임 변경 즉시 애니메이션 취소',pipes_page.evaluate('''() => {
              showGame('pipes',false);pipeGame.board=copyGrid(pipeGame.solution);
              pipeGame.info=pipeReachable(pipeGame.board);
              beginPipeFlowVictory();
              if(pipeGame.state!=='flowing')return false;
              showGame('2048',false);
              return pipeGame.state==='playing'&&pipeGame.flowTimer===null&&
                $('clear-overlay').classList.contains('hidden');
            }'''))
            pipes_page.wait_for_timeout(280)
            ok('v43 지연된 배관 클리어 및 JavaScript 오류 없음',pipes_page.evaluate('''() => activeGame==='2048'&&
              $('clear-overlay').classList.contains('hidden')&&pipeGame.state==='playing' ''') and len(pipe_errors)==0)
            pipes_page.close()
            paused,paused_errors=new_page(browser)
            paused.evaluate('''() => {showGame('pipes',false);pipeGame.board=copyGrid(pipeGame.solution);
              pipeGame.info=pipeReachable(pipeGame.board);beginPipeFlowVictory();v19PauseOn();}''')
            before=paused.evaluate('pipeGame.animatedSeen?.size')
            paused.wait_for_timeout(350)
            ok('v43 일시정지 동안 물 흐름 애니메이션 멈춤',paused.evaluate('pipeGame.animatedSeen?.size')==before)
            paused.evaluate('v19PauseOff()')
            paused.wait_for_timeout(450)
            ok('v43 일시정지 해제 후 물 흐름 및 JavaScript 오류 없음',paused.evaluate('pipeGame.animatedSeen?.size')>before and len(paused_errors)==0)
            paused.close()
            # v44: 실수로 남길 수 있는 중간 게임판은 화면 전환 직전에 저장합니다.
            nav,nav_errors=new_page(browser,390,844)
            ok('v44 키보드/직접 홈 이동에서도 진행 중 게임 자동 저장',nav.evaluate('''() => {
              showGame('baseball',false);baseball.hints=1;baseball.known=[0];
              const before=v19Saves.baseball;
              showHome();
              return !before&&v19Saves.baseball?.data?.hints===1&&
                localStorage.getItem(V19_STATE_KEY)?.includes('baseball');
            }'''))
            ok('v44 게임 A→B 전환 때 A의 진행 기록 유지',nav.evaluate('''() => {
              showGame('baseball',false);baseball.hints=2;
              showGame('mines',false);
              return v19Saves.baseball?.data?.hints===2&&activeGame==='mines';
            }'''))
            ok('v44 저장소 쓰기 실패 때 이전 세이브 메모리/저장소 모두 보존',nav.evaluate('''() => {
              showGame('baseball',false);v19StoreSnapshot();
              const before=localStorage.getItem(V19_STATE_KEY);
              const old=localStorage.setItem;
              localStorage.setItem=(key,value)=>{if(key===V19_STATE_KEY)throw Error('quota');return old(key,value);};
              let result;
              try{result=v19RemoveSave('baseball');}finally{localStorage.setItem=old;}
              return result===false&&Boolean(v19Saves.baseball)&&localStorage.getItem(V19_STATE_KEY)===before;
            }'''))
            ok('v44 화면 전환·저장 실패 테스트 JavaScript 오류 없음',len(nav_errors)==0)
            nav.close()

            # 기초 실행뿐 아니라 실제 승리 경로로 6개 게임의 단계/별/클리어 UI를 검사합니다.
            win_scripts={
              'baseball':"$('bb-input').value=baseball.answer.join('');$('bb-form').requestSubmit();",
              '2048':"game2048.score=Math.max(0,game2048.goalScore-game2048.target);game2048.board=newEmptyGrid(4);game2048.board[0][0]=game2048.target/2;game2048.board[0][1]=game2048.target/2;move2048('left');",
              'mines':"placeMines(0,0);mineGame.startedAt=Date.now();for(let r=0;r<mineGame.size;r++)for(let c=0;c<mineGame.size;c++)if(!mineGame.mines[r][c]&&mineGame.state==='playing')revealMines(r,c);",
              'pipes':"pipeGame.board=copyGrid(pipeGame.solution);pipeGame.info=pipeReachable(pipeGame.board);beginPipeFlowVictory();",
              'shikaku':"for(const rect of shikaku.solution)shikakuCommit(rect);",
              'blocks':"blockGame.score=blockGame.target-10;const i=blockGame.tray.findIndex(p=>!p.used&&blockLegalMoves(blockGame.board,blockShapes[p.shapeId]).length);selectBlockPiece(i);placeBlock(...blockLegalMoves(blockGame.board,blockShapes[blockGame.tray[i].shapeId])[0]);"
            }
            for name,code in win_scripts.items():
                won,win_errors=new_page(browser,390,844)
                won.evaluate("game=>{showGame(game,false);launchStage(0);}",name)
                won.evaluate("() => {"+code+"}")
                if name=='pipes':
                    won.wait_for_function("() => pipeGame.state==='won' && challenge.reported",timeout=4500)
                ok('v44 '+name+' 실제 승리→별·1단계 진행·클리어 UI',won.evaluate('''game => challenge.reported===true&&completedTierStages(game,'easy')===1&&
                  getSavedStars(game,0)>=1&&v19Playlog[game]?.wins===1&&
                  !$('clear-overlay').classList.contains('hidden')
                ''',name))
                if name in ('shikaku','blocks'):
                    ok('v44 '+name+' 클리어 뒤 되돌리기로 완성판 변경 방지',won.evaluate('''game => {
                      const before=game==='shikaku'?JSON.stringify(shikaku.regions):JSON.stringify(blockGame.board);
                      if(game==='shikaku')shikakuUndo();else undoBlocks();
                      const after=game==='shikaku'?JSON.stringify(shikaku.regions):JSON.stringify(blockGame.board);
                      const button=$(game==='shikaku'?'shikaku-undo':'block-undo');
                      return before===after&&button.disabled===true&&challenge.reported;
                    }''',name))
                ok('v44 '+name+' 승리 중 JavaScript 오류 없음',len(win_errors)==0)
                won.close()

            lose,lose_errors=new_page(browser)
            ok('v44 숫자야구 기회 소진 시 패배·진행도 유지',lose.evaluate('''() => {
              showGame('baseball',false);launchStage(0);baseball.maxAttempts=1;
              $('bb-input').value=baseball.answer.slice(1).concat(baseball.answer[0]).join('');
              $('bb-form').requestSubmit();
              return baseball.finished&&!challenge.reported&&completedTierStages('baseball','easy')===0;
            }'''))
            ok('v44 지뢰 발견 시 게임 종료·단계 진행도 유지',lose.evaluate('''() => {
              showGame('mines',false);launchStage(0);placeMines(0,0);
              const r=mineGame.mines.findIndex(row=>row.some(Boolean)),c=mineGame.mines[r].findIndex(Boolean);
              revealMines(r,c);
              return mineGame.state==='lost'&&!challenge.reported&&completedTierStages('mines','easy')===0;
            }'''))
            ok('v44 시카쿠 잘못된 직사각형은 선택 기록에 반영하지 않음',lose.evaluate('''() => {
              showGame('shikaku',false);launchStage(0);
              const rect=shikaku.solution.find(r=>(r.r2-r.r1+1)*(r.c2-r.c1+1)>1);
              if(!rect)return true; // 생성된 정답이 모두 1칸인 예외 판
              const invalid={r1:rect.r1,c1:rect.c1,r2:rect.r1,c2:rect.c1};
              shikakuCommit(invalid);
              return shikaku.history.length===0&&!challenge.reported&&runStats.misses===1;
            }'''))
            ok('v44 파이프 START는 회전되지 않음',lose.evaluate('''() => {
              showGame('pipes',false);const {r,c}=pipeGame.start,before=pipeGame.board[r][c];
              rotatePipeAt(r,c);return pipeGame.board[r][c]===before&&pipeGame.history.length===0;
            }'''))
            ok('v44 패배·오입력 시 JavaScript 오류 없음',len(lose_errors)==0)
            lose.close()

            # 280px 같은 매우 좁은 화면에서도 전문가 지뢰찾기 전체가 맞춰지는지 확인합니다.
            narrow,narrow_errors=new_page(browser,280,780)
            ok('v44 280px 전문가 지뢰찾기 16×16 화면 맞춤',narrow.evaluate('''() => {
              showGame('mines');const c=getStageConfig('mines',249);mineGame.size=c.size;
              for(const key of ['mines','open','flags','adjacent'])mineGame[key]=newEmptyGrid(c.size);
              renderMines();v42FitBoardZoom('mines');
              return $('mine-board').getBoundingClientRect().width<=$('v39-mine-viewport').clientWidth+1&&
                document.documentElement.scrollWidth<=innerWidth+1;
            }'''))
            ok('v44 280px 모바일 JavaScript 오류 없음',len(narrow_errors)==0)
            narrow.close()

            # v45: 외부 접근성 지적과 첫 클릭 전 힌트 부정확성을 실제로 재현 후 회귀 검증.
            a11y,a11y_errors=new_page(browser,1366,900)
            ok('v45 설정 데이터 속성이 body에 ARIA 토글 속성을 주입하지 않음',
               a11y.locator('body').get_attribute('aria-pressed') is None)
            ok('v45 홈 화면 h1 존재 및 브랜드 접근성 이름에 가시 텍스트 포함',
               a11y.locator('#v26-view-games > h1').count()==1 and
               'TAEKIN BRAIN ARCADE' in a11y.locator('#brand-home').get_attribute('aria-label'))
            ok('v45 프로필 버튼은 실제 표시 문구로 접근성 이름 구성',a11y.evaluate('''() => {
              const button=$('v26-header-profile');
              return button.getAttribute('aria-label')?.includes($('v26-header-level').innerText) &&
                button.textContent.includes('프로필') &&
                button.innerText.includes($('v26-header-level').innerText);
            }'''))
            ok('v45 5개 게임판에 부정확한 grid/gridcell ARIA 역할 없음',a11y.evaluate('''() => {
              for(const id of ['g2048-board','mine-board','pipe-board','shikaku-board','block-board']){
                showGame(({ 'g2048-board':'2048','mine-board':'mines','pipe-board':'pipes','shikaku-board':'shikaku','block-board':'blocks' })[id],false);
                const board=$(id);
                if(board.getAttribute('role')!=='group'||board.querySelector('[role="gridcell"]'))return false;
                if(id!=='g2048-board' && !board.querySelector('button'))return false;
              }
              return true;
            }'''))
            ok('v45 첫 클릭 전 지뢰찾기 힌트는 위치/횟수/별점에 영향 없음',a11y.evaluate('''() => {
              showGame('mines',false);const hints=runStats.hints;
              hintMines();
              return !mineGame.placed && mineGame.hint===null && mineGame.hintCount===0 &&
                runStats.hints===hints && $('mine-hint-count').textContent==='0' &&
                $('mine-status').textContent.includes('먼저 원하는 칸');
            }'''))
            ok('v45 첫 클릭 이후 지뢰찾기 힌트는 표시되며 안전 칸을 안내',a11y.evaluate('''() => {
              revealMines(0,0);hintMines();
              return mineGame.placed && mineGame.hint!==null &&
                !mineGame.mines[mineGame.hint[0]][mineGame.hint[1]];
            }'''))
            ok('v45 데스크톱 난이도 패널 기본 접힘·사용자 펼치기 유지',a11y.evaluate('''() => {
              showGame('baseball',false);const fold=$('v41-tier-fold');
              if(fold.open)return false;
              const before=baseball.answer.join('');fold.querySelector('summary').click();
              return fold.open && getComputedStyle(fold.querySelector('summary')).display!=='none' &&
                before===baseball.answer.join('');
            }'''))
            ok('v45 데스크톱 숫자야구 입력은 1366×900 첫 화면에 충분히 표시',a11y.evaluate('''() => {
              $('v41-tier-fold').open=false;window.scrollTo({top:0,behavior:'instant'});
              const r=$('bb-input').getBoundingClientRect();
              return r.top>=0&&r.bottom<740;
            }'''))
            ok('v45 메타 설명과 파비콘 및 6곡 음원 참조 유지',a11y.evaluate('''() => {
              return Boolean(document.querySelector('meta[name="description"]')?.content) &&
                document.querySelector('link[rel="icon"]')?.getAttribute('href')==='favicon.svg' &&
                document.querySelectorAll('#music-track option').length===6;
            }''') and (ROOT/'favicon.svg').is_file())
            ok('v45 가이드 체크박스 기본값과 자동 안내 설정 일치',a11y.evaluate('''() => {
              return !$('v31-guide-remember').checked && $('v32-auto-guide').checked;
            }'''))
            ok('v45 접근성/첫 힌트 테스트 JavaScript 오류 없음',len(a11y_errors)==0)
            a11y.close()

            # 새 모바일 헤더는 로고와 프로필이 최소 버튼 크기를 지키며 가로 넘침을 일으키지 않습니다.
            for width in [390,320,280]:
                compact,compact_errors=new_page(browser,width,844)
                ok(f'v45 {width}px 모바일 로고·프로필·메뉴 가로 넘침 방지',compact.evaluate('''() => {
                  const brand=$('brand-home').getBoundingClientRect();
                  const profile=$('v26-header-profile').getBoundingClientRect();
                  const header=document.querySelector('.topbar').getBoundingClientRect();
                  return brand.width>125 && profile.width>=35 &&
                    brand.right<=innerWidth && profile.right<=innerWidth &&
                    header.height<205 && document.documentElement.scrollWidth<=innerWidth+1;
                }''') and len(compact_errors)==0)
                compact.close()
        finally:
            browser.close()
    print(f'\n전체 {len(passed)}개 테스트 통과')

if __name__=='__main__':
    try:main()
    except Exception as error:
        print('[FAIL]',type(error).__name__+':',error,file=sys.stderr)
        sys.exit(1)
