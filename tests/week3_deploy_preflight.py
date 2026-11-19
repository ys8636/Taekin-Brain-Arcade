"""3주차 GitHub Pages 정적 배포 사전 점검 (stdlib, 네트워크 불필요).
실행: python tests/week3_deploy_preflight.py
실제 GitHub Pages 또는 실기기 테스트를 대체하지 않습니다.
"""
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urljoin, urlparse, unquote
from hashlib import sha256
import re
import subprocess
import sys

ROOT = Path(__file__).resolve().parent.parent
PASS = []


def check(label, condition):
    if not condition:
        raise AssertionError(label)
    PASS.append(label)
    print('[PASS]',label)

class Refs(HTMLParser):
    def __init__(self):
        super().__init__();self.refs=[]
    def handle_starttag(self,tag,attrs):
        attrs=dict(attrs)
        if tag in ('script','img','audio','video','source','iframe') and attrs.get('src'):
            self.refs.append((tag, attrs['src']))
        if tag=='link' and attrs.get('href'):
            self.refs.append((tag, attrs['href']))

html=(ROOT/'index.html').read_text(encoding='utf-8')
js=(ROOT/'script.js').read_text(encoding='utf-8')
css=(ROOT/'style.css').read_text(encoding='utf-8')
refs=Refs();refs.feed(html)
check('HTML, CSS, JavaScript, 파비콘, .nojekyll 파일',all((ROOT/f).is_file() for f in ('index.html','style.css','script.js','favicon.svg','.nojekyll')))
check('HTML lang=ko 및 모바일 viewport',bool(re.search(r'<html\s+lang="ko"',html)) and 'name="viewport"' in html)
check('페이지 설명 및 title 설정',bool(re.search(r'<title>[^<]+</title>',html)) and 'name="description"' in html)
check('HTML에서 JS/CSS 파일 분리 및 상대 경로 사용',('script.js' in [ref for tag,ref in refs.refs if tag=='script']) and ('style.css' in [ref for tag,ref in refs.refs if tag=='link']))

# Project Pages URLs typically use https://username.github.io/repository/
# These checks emulate URL resolution only; they do not perform remote deployment.
base='https://example.github.io/taekin-brain-arcade/'
allowed=set()
for tag, ref in refs.refs:
    if ref.startswith(('#','data:')):continue
    url=urljoin(base,ref)
    path=urlparse(url).path
    check(f'상대 경로 유지: {tag} {ref}',urlparse(url).netloc=='example.github.io' and path.startswith('/taekin-brain-arcade/'))
    relative=unquote(path[len('/taekin-brain-arcade/'):])
    check(f'참조 파일 존재: {ref}',(ROOT/relative).is_file())
    allowed.add(relative)

paths = re.findall(r'file\s*:\s*["\'](assets/[^"\']+\.mp3)["\']',js)
check('음악 6곡 코드 참조 존재', len(paths)==6 and len(set(paths))==6)
for path in paths:
    check('음악 파일 존재: '+path,(ROOT/path).is_file() and (ROOT/path).stat().st_size>100_000)
    check('GitHub Pages 하위 경로: '+path,urlparse(urljoin(base,path)).path.startswith('/taekin-brain-arcade/'))
check('모든 음악 참조는 상대 경로',all(not s.startswith('/') for s in paths))
check('내부 정적 리소스에 외부 CDN 의존 없음',not re.search(r'<(?:script|link)\b[^>]+(?:src|href)="https?://',html,re.I))
check('기존 6개 게임 카드',html.count('class="game-card ')==6)
check('기존 로컬 저장 키 유지',"taekin-brain-arcade-progress" in js)
check('기존 백업 version:1 유지',"version:1" in js or 'version: 1' in js)
check('테스트와 README 문서 포함',(ROOT/'tests/regression.py').exists() and (ROOT/'README.md').exists())

try:
    result=subprocess.run(['node','--check',str(ROOT/'script.js')],capture_output=True,text=True,timeout=20)
except (FileNotFoundError,subprocess.TimeoutExpired):
    print('[NOT TESTED] Node.js 문법 검사 도구 없음 또는 시간 초과')
else:
    check('node --check JavaScript 문법',result.returncode==0)

print('\n결과: 총',len(PASS),'개 정적 배포 사전 검사 통과')
print('※ 실제 GitHub Pages 게시/저장/스마트폰 터치/오디오 재생은 별도 검증 필요')
