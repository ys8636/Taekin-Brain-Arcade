"""v50 BGM 분리 팝업과 빠른 화면 조절 테스트 (PC/모바일 에뮬레이션)."""
import importlib.util
import shutil
from pathlib import Path
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parent.parent
spec=importlib.util.spec_from_file_location('reg',root/'tests/regression.py')
reg=importlib.util.module_from_spec(spec);spec.loader.exec_module(reg)
passed=[]
def check(label,condition):
    assert condition, label
    passed.append(label)
    print('[PASS]',label,flush=True)
with sync_playwright() as p:
    browser=p.chromium.launch(headless=True,executable_path=shutil.which('chromium'))
    try:
        for width,height in [(280,568),(320,640),(390,844),(1366,900)]:
            page,errors=reg.new_page(browser,width,height)
            page.wait_for_timeout(200)
            page.evaluate("if($('v31-onboarding').open)$('v31-onboarding').close()")
            check(f'{width}px 글씨·화면 빠른 설정 존재',page.locator('#v49-font-range').count()==1 and page.locator('#v49-ui-range').count()==1)
            page.locator('#v32-settings-open').click(timeout=8000)
            check(f'{width}px 기존 설정 중복 배율 입력 제거',page.locator('#v32-settings-dialog .v48-percent-setting').count()==0)
            page.locator('#music-picker-button').click(timeout=8000)
            check(f'{width}px 독립 음악 선택창 열림',page.evaluate("$('music-track-menu').open && $('music-track-menu').matches(':modal')"))
            check(f'{width}px 여섯 곡 선택 목록 표시',page.locator('#music-track-menu .music-track-item').count()==6)
            check(f'{width}px 음악 팝업 화면 안에 있음',page.evaluate("()=>{const a=$('music-track-menu').getBoundingClientRect();return a.left>=0&&a.top>=0&&a.right<=innerWidth+1&&a.bottom<=innerHeight+1;}"))
            page.locator('#music-track-menu .music-track-item').nth(5).click(timeout=8000)
            check(f'{width}px 음악 선택 및 팝업 닫기',page.evaluate("$('music-track').value==='space_lounge' && !$('music-track-menu').open"))
            check(f'{width}px 선택한 음악 전체 표시',page.evaluate("$('music-current-name').textContent==='스페이스 라운지' && $('music-current-name').scrollWidth<=$('music-current-name').clientWidth+1"))
            page.locator('#music-picker-button').click(timeout=8000)
            check(f'{width}px 선택 상태 표시 잘리지 않음',page.evaluate("()=>{const el=$('music-track-menu').querySelector('[aria-selected=true] .music-selected-indicator');if(!el)return false;const box=el.getBoundingClientRect(),parent=el.closest('.music-track-item').getBoundingClientRect();return box.left>=parent.left-1&&box.right<=parent.right+1&&el.textContent.includes('선택됨');}"))
            page.locator('#v50-music-close').click(timeout=8000)
            check(f'{width}px 닫기 버튼 정상 동작',page.evaluate("!$('music-track-menu').open"))
            check(f'{width}px 브라우저 자바스크립트 예외 없음',not errors)
            page.close()
        page,errors=reg.new_page(browser,320,640)
        page.wait_for_timeout(230)
        page.evaluate("if($('v31-onboarding').open)$('v31-onboarding').close()")
        page.locator('#v49-float-display').click(timeout=7000)
        page.locator('#v49-font-range').evaluate("e=>{e.value='200';e.dispatchEvent(new Event('input',{bubbles:true}));}")
        check('320px 글씨 200% 빠른 조절 유지',page.evaluate("TaekinV32.getPreference('fontPct')===200"))
        page.locator('#v49-panel-close').click(timeout=6000)
        page.locator('#v32-settings-open').click(timeout=7000)
        page.locator('#music-picker-button').click(timeout=7000)
        check('320px 200% 글씨 상태에서 음악창 열림',page.evaluate("$('music-track-menu').open"))
        check('320px 200% 선택음악 상태가 줄바꿈과 함께 표시',page.evaluate("()=>{let el=$('music-track-menu').querySelector('[aria-selected=true] .music-selected-indicator');let a=el.getBoundingClientRect(),b=el.closest('.music-track-item').getBoundingClientRect();return a.right<=b.right+2 && a.bottom<=b.bottom+2}"))
        check('200% 음악 선택 모드 JavaScript 예외 없음',not errors)
        page.close()
    finally:browser.close()
print('v50 테스트',len(passed),'개 통과')
