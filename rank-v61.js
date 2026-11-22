/* TAEKIN BRAIN ARCADE v61: 기존 레벨/닉네임/대표 배지를 상단에 시각화합니다. */
(()=>{"use strict";
const $=id=>document.getElementById(id);
const stages=[[1,"rookie","기본","✦"],[5,"bronze","브론즈","◆"],[10,"silver","실버","✧"],[15,"gold","골드","★"],[20,"platinum","플래티넘","❖"],[30,"diamond","다이아","💎"],[40,"aurora","오로라","✴"],[50,"legend","레전드","♛"]];
const el=(tag,cls,txt)=>{const x=document.createElement(tag);if(cls)x.className=cls;if(txt!==undefined)x.textContent=txt;return x;};
const realLevel=()=>{const v=$("v22-xp-label")?.textContent||"";if(!v.trim())return Math.max(1,Math.min(50,parseInt($("v22-level")?.textContent.match(/\d+/)?.[0])||1));const xp=Number(v.replace(/,/g,"").match(/\d+/)?.[0])||0;let l=1;while(l<50&&xp>=22*l*l+70*l)l++;return l;};
function init(){
 const chip=$("v26-header-profile"),top=document.querySelector(".topbar"),growth=$("player-growth");
 if(!chip||!top||!growth)return;
 chip.classList.add("v61-player");
 const detail=el("span","v61-head-detail"),heading=el("span","v61-head-top"),name=el("strong","v61-head-name"),lvl=el("b","v61-head-level");
 heading.append(name,lvl);const title=el("span","v61-head-title"),badge=el("span","v61-head-badge"),progress=el("span","v61-progress");
 const fill=el("span","v61-progress-fill");progress.append(fill);detail.append(heading,title,badge);chip.append(detail,progress);
 const label=el("span","v61-rank-name");chip.append(label);
 const mobile=el("button","v61-mobile");mobile.type="button";mobile.id="v61-mobile";
 const avatar=el("span","v61-mobile-avatar v26-avatar"),summary=el("span","v61-mobile-detail"),main=el("span","v61-mobile-main"),mname=el("strong","v61-mobile-name"),mlvl=el("b","v61-mobile-level");
 main.append(mname,mlvl);const mtitle=el("small","v61-mobile-title"),mbadge=el("span","v61-mobile-badge"),mtier=el("span","v61-mobile-rank");
 summary.append(main,mtitle);mobile.append(avatar,summary,mbadge,mtier);
 const ribbon=el("div","v61-ribbon");ribbon.id="v61-ribbon";ribbon.append(mobile);top.append(ribbon);
 mobile.addEventListener("click",()=>chip.click());
 const box=el("section","v61-rank-guide"),h=el("h3","", "✨ 레벨별 프로필 테두리"),p=el("p","", "기존 경험치로 자동 진화합니다. 선택한 업적 테두리와 오라 효과는 유지돼요."),grid=el("div","v61-rank-grid"),foot=el("p","v61-rank-next");
 box.append(h,p,grid,foot);growth.after(box);
 let pending=false;
 function render(){
   const n=$("v25-player-name")?.value.trim().slice(0,20)||"플레이어",level=realLevel(),rank=stages.reduce((v,t)=>level>=t[0]?t:v,stages[0]),next=stages.find(t=>t[0]>level);
   const t=$("v22-title")?.textContent.trim()||"견습 탐험가",b=$("v22-featured-badge"),icon=b?.querySelector(".v22-featured-icon")?.textContent.trim()||"",bn=icon?b.textContent.trim().slice(icon.length).trim():"";
   const symbol=$("v19-profile-mark")?.textContent.trim()||"T.",frame=$("v19-profile-mark")?.dataset.frame||"default";
   const xp=Math.max(0,Math.min(100,parseFloat($("v22-xp-bar")?.style.width)||0));
   for(const x of [chip,ribbon,box])x.dataset.v61Rank=rank[1];
   name.textContent=n;lvl.textContent="LV."+level;title.textContent=t;
   label.textContent=rank[2];badge.textContent=(icon||"🎖")+" "+(bn||"대표 배지 미설정");
   fill.style.width=xp+"%";
   chip.title=n+" · LV."+level+" · "+t+" · "+rank[2]+" 테두리"+(bn?" · 배지 "+bn:"")+" · 클릭하여 프로필 보기";
   mname.textContent=n;mlvl.textContent="LV."+level;mtitle.textContent=t;
   mbadge.textContent=icon||"🎖";mbadge.title=bn||"프로필에서 대표 배지 선택";
   mtier.textContent=rank[2];avatar.textContent=symbol;avatar.dataset.frame=frame;
   mobile.setAttribute("aria-label",n+" LV."+level+" "+t+", "+rank[2]+" 테두리, "+(bn?"대표 배지 "+bn:"대표 배지 없음")+". 내 프로필 보기");
   grid.replaceChildren();
   for(const r of stages){const ok=level>=r[0],cur=r===rank,c=el("div","v61-rank-card"+(ok?" is-open":" is-locked")+(cur?" is-current":""));c.dataset.v61Rank=r[1];c.append(el("span","v61-rank-icon",ok?r[3]:"🔒"));const words=el("span","v61-rank-desc");words.append(el("strong","",r[2]),el("small","", "LV."+r[0]+" · "+(cur?"적용 중":ok?"해금":"잠김")));c.append(words);grid.append(c);}
   foot.textContent=next?"다음 테두리는 LV."+next[0]+"에 "+next[2]+" 디자인으로 바뀝니다.":"🏆 최고 단계 테두리 달성!";
 }
 const schedule=()=>{if(pending)return;pending=true;requestAnimationFrame(()=>{pending=false;render();});};
 const observer=new MutationObserver(schedule);
 for(const [id,opts] of [
  ["v22-level",{childList:true,subtree:true,characterData:true}],
  ["v22-title",{childList:true,subtree:true,characterData:true}],
  ["v22-xp-label",{childList:true,subtree:true,characterData:true}],
  ["v22-xp-bar",{attributes:true,attributeFilter:["style"]}],
  ["v22-featured-badge",{childList:true,subtree:true,characterData:true}],
  ["v19-profile-mark",{attributes:true,attributeFilter:["data-frame"],childList:true,subtree:true,characterData:true}],
  ["v26-header-level",{childList:true,subtree:true,characterData:true}]
 ]){const x=$(id);if(x)observer.observe(x,opts);}
 $("v27-nickname-input")?.addEventListener("input",schedule);
 $("v27-nickname-input")?.addEventListener("change",schedule);
 for(const ev of ["taekin-achievements-updated","taekin-nickname-updated","taekin-master-changed"])window.addEventListener(ev,schedule);
 render();window.TaekinV61={refresh:schedule,levels:stages.map(x=>x[0])};
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();
})();