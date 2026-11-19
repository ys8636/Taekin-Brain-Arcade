"""v48 모바일 사용성 자동 점검 (Chromium+Playwright).

실행: python tests/mobile_v48.py
브라우저에 로컬 원본 소스를 직접 주입하며, 실제 스마트폰·오디오 재생·GitHub Pages 접속을 대신하지는 않습니다.
"""
from pathlib import Path
import importlib.util
import shutil
from playwright.sync_api import sync_playwright

root=Path(__file__).resolve().parent.parent
spec=importlib.util.spec_from_file_location('reg',root/'tests'/'regression.py')
reg=importlib.util.module_from_spec(spec)
spec.loader.exec_module(reg)
checks=[]
def check(label,value):
    assert value, f'FAIL: {label}'
    checks.append(label)
    print('[PASS]',label,flush=True)

with sync_playwright() as playwright:
    browser=playwright.chromium.launch(headless=True,executable_path=shutil.which('chromium'))
    try:
        for width,height in [(280,568),(320,640),(390,844),(1366,900)]:
            p,errors=reg.new_page(browser,width,height)
            p.evaluate("if(document.getElementById('v31-onboarding').open)document.getElementById('v31-onboarding').close()")
            check(f'{width}px 게임 6종 진입',p.evaluate('''()=>{for(const game of ['baseball','2048','mines','pipes','shikaku','blocks'])showGame(game);return activeGame==='blocks';}'''))
            check(f'{width}px 기본 가로 넘침 없음',p.evaluate('document.documentElement.scrollWidth<=innerWidth+1'))
            p.evaluate("document.getElementById('v32-settings-open').click()")
            # v50부터 배율 설정은 팝업 밖의 빠른 조절 버튼에서만 관리합니다.
            check(f'{width}px 기존 설정창의 중복 글자·화면 설정 제거',p.locator('.v48-percent-setting').count()==0)
            p.evaluate("$('v32-settings-dialog').close()")
            quick='#v49-float-display' if width<720 else '#v49-header-display'
            p.locator(quick).click()
            check(f'{width}px 빠른 글자 25~200 범위',p.evaluate("$('v49-font-range').min==='25'&&$('v49-font-range').max==='200'"))
            check(f'{width}px 빠른 화면 70~130 범위',p.evaluate("$('v49-ui-range').min==='70'&&$('v49-ui-range').max==='130'"))
            p.locator('#v49-font-range').evaluate("e=>{e.value='200';e.dispatchEvent(new Event('input',{bubbles:true}));}")
            p.locator('#v49-ui-range').evaluate("e=>{e.value='130';e.dispatchEvent(new Event('input',{bubbles:true}));}")
            check(f'{width}px 200%/130% 저장',p.evaluate('''()=>{
              const x=TaekinV32.exportSettings().preferences;
              return x.fontPct===200 && x.uiPct===130 && localStorage.getItem('taekin_arcade_preferences_v32')?.includes('"fontPct":200');
            }'''))
            p.locator('#v49-reset-both').click()
            check(f'{width}px 100% 복구',p.evaluate('TaekinV32.getPreference("fontPct")===100 && TaekinV32.getPreference("uiPct")===100'))
            p.locator('#v49-panel-close').click()
            p.locator('#v32-settings-open').click()
            p.locator('#music-picker-button').click()
            check(f'{width}px BGM 6곡 선택창',p.evaluate('''()=>$('music-track-menu').open&&$('music-track-menu').querySelectorAll('.music-track-item').length===6'''))
            check(f'{width}px 음악 목록이 모바일 화면 안에 있음',p.evaluate('''()=>{
              const menu=$('music-track-menu').getBoundingClientRect();
              return menu.left>=-1&&menu.right<=innerWidth+1&&menu.top>=-1&&menu.bottom<=innerHeight+1;
            }'''))
            p.locator('.music-track-item').nth(1).click()
            check(f'{width}px 곡 선택 및 음악 팝업 닫기',p.evaluate("$('music-track').value==='neon_drive'&&!$('music-track-menu').open"))
            check(f'{width}px JavaScript 예외 없음',len(errors)==0)
            if width<720:
                check(f'{width}px 모바일 헤더 고정 안 됨',p.evaluate("getComputedStyle(document.querySelector('.topbar')).position==='relative'"))
                check(f'{width}px 모바일 두 줄 메뉴',p.evaluate("getComputedStyle(document.querySelector('.topbar')).gridTemplateRows.split(' ').length===2"))
            p.close()
        p,errors=reg.new_page(browser,320,640)
        p.evaluate('''()=>{
          TaekinV32.importSettings({preferences:{fontPct:175,uiPct:80,compactGame:false,autoFit:false}})
        }''')
        check('기존 백업 형식에 사용자 화면 설정 추가/복원',p.evaluate('''()=>{
          const prefs=TaekinV32.exportSettings().preferences;
          return prefs.fontPct===175 && prefs.uiPct===80 && prefs.compactGame===false && prefs.autoFit===false;
        }'''))
        p.evaluate('''()=>TaekinV32.importSettings({preferences:{fontPct:999,uiPct:-99,compactGame:true,autoFit:true}})''')
        check('잘못된 설정값 범위 제한',p.evaluate('TaekinV32.getPreference("fontPct")===200 && TaekinV32.getPreference("uiPct")===70'))
        check('기존 기록 키 유지',"taekin-brain-arcade-progress" in (root/'script.js').read_text())
        check('게임 클리어 판정 원본 함수 존재',p.evaluate('typeof v41ValidateSession==="function"'))
        check('2048 도움말 스와이프 안내',"위·아래·왼쪽·오른쪽으로 밀거나" in (root/'script.js').read_text())
        check('GitHub README 공개 서비스 중심',all(q not in (root/'README.md').read_text() for q in ['과제','교수','2주차','3주차','?']))
        p.close()
    finally:browser.close()
print(f'\n전체 {len(checks)}개 v48 사용성 검사 통과')
