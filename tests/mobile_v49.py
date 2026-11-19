"""v49 빠른 화면 조절, 도움말 위치, 글씨 확대 테스트.

로컬 HTML/CSS/JS를 Chromium에 주입해 실제 DOM 스타일과 조작을 점검합니다.
실제 단말의 시스템 글꼴 크기·GitHub Pages 캐시는 별도로 확인해야 합니다.
"""
from pathlib import Path
import importlib.util,shutil
from playwright.sync_api import sync_playwright
r=Path(__file__).resolve().parent.parent
sp=importlib.util.spec_from_file_location('reg',r/'tests'/'regression.py')
reg=importlib.util.module_from_spec(sp);sp.loader.exec_module(reg)
n=0
def check(label,cond):
 global n
 assert cond, label
 print('[PASS]',label,flush=True)
 n+=1
with sync_playwright() as p:
 b=p.chromium.launch(headless=True,executable_path=shutil.which('chromium'))
 try:
  for width,height in [(280,568),(320,640),(390,844),(1366,900)]:
   page,errors=reg.new_page(b,width,height)
   page.evaluate("localStorage.setItem('taekin_arcade_onboarding_v31','1');if($('v31-onboarding').open)$('v31-onboarding').close()")
   page.evaluate("showGame('2048')")
   page.wait_for_timeout(160)
   page.evaluate("if($('v31-onboarding').open)$('v31-onboarding').close()")
   mobile=width<720
   selector='#v49-float-display' if mobile else '#v49-header-display'
   check(f'{width}px 화면 크기 조절 외부 버튼 표시',page.locator(selector).is_visible())
   check(f'{width}px 기존 게임 내 중앙 질문바 제거',page.locator('.v46-what-bar').count()==0)
   check(f'{width}px 게임 제목 옆 도움말 존재',page.locator('#v49-help-menu summary').count()==1)
   check(f'{width}px 기존 게임판 옆 ? 제거',page.locator('#play-screen .v46-help-icon').count()==0)
   font_before=page.evaluate("parseFloat(getComputedStyle($('g2048-status')).fontSize)")
   heading_before=page.evaluate("parseFloat(getComputedStyle($('active-title')).fontSize)")
   page.locator(selector).click()
   check(f'{width}px 빠른 조절창 열림',not page.locator('#v49-display-panel').get_attribute('hidden')=='') # bool attr hidden returns none on open
   page.locator('#v49-font-range').evaluate("e=>{e.value='200';e.dispatchEvent(new Event('input',{bubbles:true}));}")
   check(f'{width}px 일반 메시지 200% 크기 반영',page.evaluate("v=>Math.abs(parseFloat(getComputedStyle($('g2048-status')).fontSize)-v*2)<1",font_before))
   check(f'{width}px 게임 제목 200% 크기 반영',page.evaluate("v=>Math.abs(parseFloat(getComputedStyle($('active-title')).fontSize)-v*2)<1",heading_before))
   check(f'{width}px 빠른 조절창 글씨 가독성 유지',page.evaluate("parseFloat(getComputedStyle($('v49-display-panel')).fontSize)===14"))
   check(f'{width}px 글씨/화면 설정 기존 저장키 동기화',page.evaluate("TaekinV32.getPreference('fontPct')===200 && JSON.parse(localStorage.getItem('taekin_arcade_preferences_v32')).fontPct===200"))
   page.locator('#v49-font-range').evaluate("e=>{e.value='25';e.dispatchEvent(new Event('input',{bubbles:true}));}")
   check(f'{width}px 25% 축소 반영',page.evaluate("v=>Math.abs(parseFloat(getComputedStyle($('g2048-status')).fontSize)-v*.25)<1",font_before))
   page.locator('#v49-ui-range').evaluate("e=>{e.value='80';e.dispatchEvent(new Event('input',{bubbles:true}));}")
   check(f'{width}px 전체 배율 저장',page.evaluate("TaekinV32.getPreference('uiPct')===80 && getComputedStyle(document.querySelector('.site-shell')).zoom==='0.8'"))
   page.locator('#v49-reset-both').click()
   check(f'{width}px 빠른 모두 기본 복구',page.evaluate("TaekinV32.getPreference('fontPct')===100 && TaekinV32.getPreference('uiPct')===100"))
   check(f'{width}px 배율 초기화 뒤 기본 가로 넘침 없음',page.evaluate('document.documentElement.scrollWidth<=innerWidth+1'))
   page.locator('#v49-panel-close').click()
   page.locator('#v49-help-menu summary').click()
   check(f'{width}px 도움말 드롭다운 열림',page.evaluate("$('v49-help-menu').open"))
   page.locator('#v49-help-menu [data-v46-help="controls"]').click()
   check(f'{width}px 조작 방법 팝업 연결',page.evaluate("$('v46-help-dialog').open && $('v46-help-title').textContent.includes('2048') && !$('v49-help-menu').open"))
   page.evaluate("$('v46-help-dialog').close()")
   check(f'{width}px 자바스크립트 오류 없음',not errors)
   if mobile:
    check(f'{width}px 조절창이 화면 안에 있음',page.evaluate("()=>{const r=$('v49-display-panel').getBoundingClientRect();return r.left>=0&&r.right<=innerWidth+1;}"))
   page.close()
  page,errors=reg.new_page(b,390,844)
  page.evaluate("localStorage.setItem('taekin_arcade_onboarding_v31','1');if($('v31-onboarding').open)$('v31-onboarding').close()")
  # all six games' help use active game automatically
  for game in ['baseball','2048','mines','pipes','shikaku','blocks']:
   page.evaluate('(name)=>{showGame(name);if($("v31-onboarding").open)$("v31-onboarding").close();}',game)
   page.locator('#v49-help-menu summary').click()
   page.locator('#v49-help-menu [data-v46-help="game"]').click()
   check(f'{game} 도움말 게임 내용 연결',page.evaluate("x=>$('v46-help-dialog').open && $('v46-help-title').textContent.includes(gameInfo[x].name)",game))
   page.evaluate("$('v46-help-dialog').close()")
  check('게임 6종 도움말 테스트 오류 없음',not errors)
  page.close()
 finally:b.close()
print(f'전체 v49 추가 검사 {n}개 통과')
