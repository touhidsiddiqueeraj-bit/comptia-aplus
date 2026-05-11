(function(){
let completed=new Set(JSON.parse(localStorage.getItem('cpt_done')||'[]'));
let subChecks=JSON.parse(localStorage.getItem('cpt_subs')||'{}');
let testScores=JSON.parse(localStorage.getItem('cpt_scores')||'{}');
let totalXP=parseInt(localStorage.getItem('cpt_xp')||'0');
let achievements=JSON.parse(localStorage.getItem('cpt_ach')||'[]');
let currentTab='dashboard';
let currentDay=null;
let activeQuiz=null;
let quizAnswers={};
let quizCorrect=0;

function save(){
  localStorage.setItem('cpt_done',JSON.stringify([...completed]));
  localStorage.setItem('cpt_subs',JSON.stringify(subChecks));
  localStorage.setItem('cpt_xp',String(totalXP));
  localStorage.setItem('cpt_ach',JSON.stringify(achievements));
}

// ── GAMIFICATION ──────────────────────────────────────────────────────────
function lvl(xp){return Math.floor(xp/500)+1;}
function xpInLvl(xp){return xp%500;}
function recordToday(){
  const t=new Date().toDateString();
  const dates=JSON.parse(localStorage.getItem('cpt_dates')||'[]');
  if(!dates.includes(t)){dates.push(t);localStorage.setItem('cpt_dates',JSON.stringify(dates));}
  localStorage.setItem('cpt_lastdate',t);
}
function getStreak(){
  const dates=JSON.parse(localStorage.getItem('cpt_dates')||'[]');
  if(!dates.length)return 0;
  const uniq=[...new Set(dates)].sort((a,b)=>new Date(b)-new Date(a));
  const t=new Date().toDateString(),y=new Date(Date.now()-86400000).toDateString();
  if(uniq[0]!==t&&uniq[0]!==y)return 0;
  let s=0;
  for(let i=0;i<uniq.length;i++){
    if(uniq[i]===new Date(Date.now()-i*86400000).toDateString())s++;
    else break;
  }
  return s;
}
function giveXP(n,lbl){
  totalXP+=n;
  localStorage.setItem('cpt_xp',String(totalXP));
  showXPToast('+'+n+' XP'+(lbl?' · '+lbl:''));
  const newLvl=lvl(totalXP),old=parseInt(localStorage.getItem('cpt_level')||'1');
  if(newLvl>old){localStorage.setItem('cpt_level',newLvl);showAch('⬆️','Level '+newLvl+'!','You leveled up!');}
  updateStats();
}

// ── ACHIEVEMENTS ──────────────────────────────────────────────────────────
const ACHS=[
  {id:'d1',icon:'🚀',name:'First Step',desc:'Day 1 complete',check:()=>completed.size>=1},
  {id:'d7',icon:'📅',name:'One Week',desc:'7 days done',check:()=>completed.size>=7},
  {id:'d30',icon:'💪',name:'One Month',desc:'30 days done',check:()=>completed.size>=30},
  {id:'d45',icon:'⚡',name:'Halfway',desc:'45 days done',check:()=>completed.size>=45},
  {id:'c1',icon:'💻',name:'Core 1 Done',desc:'All Core 1 days',check:()=>{for(let d=1;d<=45;d++)if(!completed.has(d))return false;return true;}},
  {id:'c2',icon:'🔒',name:'Core 2 Done',desc:'All Core 2 days',check:()=>{for(let d=46;d<=85;d++)if(!completed.has(d))return false;return true;}},
  {id:'all90',icon:'🏆',name:'Zero to Hero',desc:'All 90 days!',check:()=>completed.size>=90},
  {id:'s3',icon:'🔥',name:'On Fire',desc:'3-day streak',check:()=>getStreak()>=3},
  {id:'s7',icon:'💎',name:'Study Warrior',desc:'7-day streak',check:()=>getStreak()>=7},
  {id:'s14',icon:'🌟',name:'Unstoppable',desc:'14-day streak',check:()=>getStreak()>=14},
  {id:'q1',icon:'📝',name:'Test Drive',desc:'First test done',check:()=>Object.keys(testScores).length>=1},
  {id:'qperfect',icon:'💯',name:'Perfect Score',desc:'100% on a test',check:()=>Object.values(testScores).some(s=>s===20)},
  {id:'xp1k',icon:'⚡',name:'Power User',desc:'1000 XP earned',check:()=>totalXP>=1000},
  {id:'xp5k',icon:'👑',name:'Champion',desc:'5000 XP earned',check:()=>totalXP>=5000},
];
function checkAchs(){
  ACHS.forEach(a=>{
    if(!achievements.includes(a.id)&&a.check()){
      achievements.push(a.id);
      localStorage.setItem('cpt_ach',JSON.stringify(achievements));
      setTimeout(()=>showAch(a.icon,a.name,a.desc),500);
    }
  });
}
let achT;
function showAch(icon,name,desc){
  const t=document.getElementById('ach-toast');
  document.getElementById('at-icon').textContent=icon;
  document.getElementById('at-name').textContent=name;
  document.getElementById('at-desc').textContent=desc;
  t.classList.add('show');clearTimeout(achT);
  achT=setTimeout(()=>t.classList.remove('show'),4500);
}
let xpT,genT;
function showXPToast(m){const t=document.getElementById('xp-toast');t.textContent=m;t.classList.add('show');clearTimeout(xpT);xpT=setTimeout(()=>t.classList.remove('show'),2500);}
function showToast(m){const t=document.getElementById('gen-toast');t.textContent=m;t.classList.add('show');clearTimeout(genT);genT=setTimeout(()=>t.classList.remove('show'),2800);}

// ── STATS ─────────────────────────────────────────────────────────────────
function phColor(cls){return{c1:'#2355E8',c1r:'#B45309',c2:'#15803D',c2r:'#6D28D9',pbq:'#C41E1E',final:'#0E7490'}[cls]||'#2355E8';}
function phaseOf(d){return PHASES.find(p=>d>=p.days[0]&&d<=p.days[1]);}
function updateStats(){
  const c=completed.size,s=getStreak(),lv=lvl(totalXP),xpLv=xpInLvl(totalXP);
  // Topbar
  document.getElementById('ps-num').textContent=s;
  document.getElementById('ps-xp').textContent=totalXP;
  document.getElementById('ps-done').textContent=c;
  // Dashboard
  document.getElementById('big-bar').style.width=(c/90*100)+'%';
  document.getElementById('bar-days').textContent=c+' of 90 days';
  document.getElementById('bar-pct').textContent=Math.round(c/90*100)+'%';
  document.getElementById('lvl-n').textContent=lv;
  document.getElementById('lvl-bar').style.width=(xpLv/500*100)+'%';
  document.getElementById('lvl-xp-next').textContent=500-xpLv;
  document.getElementById('d-done').textContent=c;
  document.getElementById('d-streak').textContent=s;
  document.getElementById('d-xp').textContent=totalXP;
  // Phase rows
  const pr=document.getElementById('phase-rows');
  if(pr){
    pr.innerHTML='';
    PHASES.forEach(p=>{
      let t=p.days[1]-p.days[0]+1,d=0;
      for(let i=p.days[0];i<=p.days[1];i++)if(completed.has(i))d++;
      const pct=Math.round(d/t*100);
      pr.innerHTML+='<div class="phase-row"><div class="ph-dot dot-'+p.cls+'"></div><div class="ph-name">'+p.label+'</div><div class="ph-bar-wrap"><div class="ph-bar-fill fill-'+p.cls+'" style="width:'+pct+'%"></div></div><div class="ph-pct">'+pct+'%</div></div>';
    });
  }
  // Heatmap
  const hm=document.getElementById('heatmap');
  if(hm){
    hm.innerHTML='';
    for(let d=1;d<=90;d++){
      const ph=phaseOf(d),done=completed.has(d);
      const cell=document.createElement('div');
      cell.className='hm-cell'+(done?' done':'');
      if(done)cell.style.background=phColor(ph.cls);
      cell.title='Day '+d;
      cell.onclick=()=>goToDay(d);
      hm.appendChild(cell);
    }
  }
  // Sidebar marks
  document.querySelectorAll('.sb-day').forEach(el=>{
    const d=parseInt(el.dataset.day);
    const chk=el.querySelector('.sb-chk');
    if(completed.has(d)){el.classList.add('done');if(chk)chk.textContent='✓';}
    else{el.classList.remove('done');if(chk)chk.textContent='';}
  });
  // Day complete btn
  if(currentDay){
    const btn=document.getElementById('cbtn-'+currentDay);
    if(btn){
      btn.classList.toggle('done',completed.has(currentDay));
      btn.textContent=completed.has(currentDay)?'✓  Day Complete':'○  Mark Day Complete (+50 XP)';
    }
  }
  // Test cards
  document.querySelectorAll('.test-card[data-core]').forEach(card=>{
    const key=card.dataset.core+'_'+card.dataset.idx,s=testScores[key];
    if(s!==undefined){
      const pct=Math.round(s/20*100);
      const sc=card.querySelector('.tc-score');
      const fill=card.querySelector('.tc-bar-fill');
      if(sc){sc.textContent=s+'/20  '+pct+'%';sc.className='tc-score '+(pct>=80?'good':pct>=60?'ok':'bad');}
      if(fill){fill.style.width=pct+'%';fill.style.background=pct>=80?'var(--green)':pct>=60?'var(--amber)':'var(--red)';}
    }
  });
}

// ── TABS ──────────────────────────────────────────────────────────────────
function switchTab(t){
  currentTab=t;
  document.querySelectorAll('.tab').forEach(v=>{v.classList.remove('active');});
  const tv=document.getElementById('tab-'+t);
  if(tv)tv.classList.add('active');
  // Bottom nav
  document.querySelectorAll('.bnav-btn').forEach(b=>b.classList.remove('active'));
  const bn=document.getElementById('bnav-'+t);if(bn)bn.classList.add('active');
  // Side nav
  document.querySelectorAll('.snav-btn').forEach(b=>b.classList.remove('active'));
  const sn=document.getElementById('snav-'+t);if(sn)sn.classList.add('active');
  updateStats();
  closeSidebar();
}
function showDash(){switchTab('dashboard');}
function goToNextDay(){
  let next=1;for(let d=1;d<=90;d++){if(!completed.has(d)){next=d;break;}}
  goToDay(next);
}

// ── STUDY NAV ─────────────────────────────────────────────────────────────
function goToDay(d){
  currentDay=d;
  switchTab('study');
  document.querySelectorAll('.sb-day').forEach(el=>el.classList.toggle('active',parseInt(el.dataset.day)===d));
  document.querySelectorAll('.day-card').forEach(c=>c.style.display='none');
  buildDayCard(d); // lazy-render on demand
  const dc=document.getElementById('dc-'+d);
  if(dc){dc.style.display='block';}
  document.getElementById('study-main').scrollTo({top:0,behavior:'smooth'});
  const si=document.querySelector('.sb-day[data-day="'+d+'"]');
  if(si)si.scrollIntoView({block:'nearest'});
  updateStats();
}
function toggleComplete(d){
  if(completed.has(d)){
    completed.delete(d);save();showToast('Day '+d+' unmarked');updateStats();
  }else{
    completed.add(d);recordToday();
    giveXP(50,'Day '+d+' complete');
    save();checkAchs();
    const s=getStreak();
    if(s>0&&(s===3||s===7||s===14||s===30))setTimeout(openStreakModal,900);
    else showToast('Day '+d+' done! '+completed.size+'/90');
    if(d<90)setTimeout(()=>goToDay(d+1),750);
  }
}
function toggleSub(d,i){
  const k=d+'_'+i,was=!!subChecks[k];
  subChecks[k]=!was;
  const el=document.getElementById('sc-'+d+'-'+i);
  if(el)el.classList.toggle('checked',subChecks[k]);
  if(!was){totalXP+=2;localStorage.setItem('cpt_xp',String(totalXP));}
  localStorage.setItem('cpt_subs',JSON.stringify(subChecks));
  updateStats();
}
function prevDay(d){if(d>1)goToDay(d-1);}
function nextDay(d){if(d<90)goToDay(d+1);}

// ── SIDEBAR ───────────────────────────────────────────────────────────────
function closeSidebar(){
  document.getElementById('study-sb').classList.remove('open');
  document.getElementById('mob-ov').classList.remove('show');
}
function closeAll(){
  document.getElementById('overlay').classList.remove('show');
  document.getElementById('streak-modal').classList.remove('show');
}

// ── STREAK MODAL ──────────────────────────────────────────────────────────
function openStreakModal(){
  const s=getStreak();
  document.getElementById('modal-streak-num').textContent=s;
  const msgs=['Start your streak today!','Great start!','You are on fire!','One week strong!','Two weeks — incredible!','One month! Legendary!'];
  document.getElementById('modal-streak-msg').textContent=s>=30?msgs[5]:s>=14?msgs[4]:s>=7?msgs[3]:s>=3?msgs[2]:s>=1?msgs[1]:msgs[0];
  const cal=document.getElementById('week-cal');
  cal.innerHTML='';
  const days=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const dates=JSON.parse(localStorage.getItem('cpt_dates')||'[]');
  for(let i=6;i>=0;i--){
    const d=new Date(Date.now()-i*86400000);
    const done=dates.includes(d.toDateString()),today=i===0;
    const el=document.createElement('div');
    el.className='wc'+(done?' done':'')+(today?' today':'');
    el.textContent=days[d.getDay()].slice(0,1);
    cal.appendChild(el);
  }
  document.getElementById('overlay').classList.add('show');
  document.getElementById('streak-modal').classList.add('show');
}

// ── BUILD SIDEBAR ─────────────────────────────────────────────────────────
function buildSidebar(){
  const sb=document.getElementById('sb-days');
  PHASES.forEach(phase=>{
    const g=document.createElement('div');
    g.className='sb-phase';
    g.innerHTML='<div class="sb-ph-hdr"><div class="sb-ph-dot dot-'+phase.cls+'"></div><div class="sb-ph-lbl">'+phase.label+'</div></div><div class="sb-mini-bar"><div class="sb-mini-fill fill-'+phase.cls+'" style="width:0%"></div></div>';
    for(let d=phase.days[0];d<=phase.days[1];d++){
      const dd=DAYS[d-1];
      const short=dd.topic.length>27?dd.topic.slice(0,27)+'…':dd.topic;
      const item=document.createElement('div');
      item.className='sb-day';item.dataset.day=d;
      item.innerHTML='<div class="sb-chk"></div><div class="sb-dn">D'+String(d).padStart(2,'0')+'</div><div class="sb-topic">'+short+'</div>';
      item.onclick=()=>goToDay(d);
      g.appendChild(item);
    }
    sb.appendChild(g);
  });
}

// ── BUILD DAY CARDS ───────────────────────────────────────────────────────
const _builtDays=new Set();
function buildDayCard(d){
  if(_builtDays.has(d))return;
  _builtDays.add(d);
  const container=document.getElementById('day-cards');
  const dd=DAYS[d-1];
  {
    const phase=phaseOf(d);
    const div=document.createElement('div');
    div.className='day-card';div.id='dc-'+d;div.style.display='none';

    // YouTube iframe embed using real video IDs
    // Uses youtube-nocookie.com for privacy-enhanced mode (no tracking cookies)
    const vids=VIDEO_SEARCHES[d];
    let vidHTML='';
    if(vids&&vids.length){
      const buildIframe=(v,active)=>{
        const embedSrc='https://www.youtube-nocookie.com/embed/'+v.id+'?rel=0&modestbranding=1';
        const ytLink='https://www.youtube.com/watch?v='+v.id;
        return `<div class="vid-iframe-wrap" style="${active?'':'display:none'}" data-vidpane="${d}">
          <div class="vid-iframe-container">
            <iframe src="${embedSrc}"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowfullscreen
              title="${v.title}">
            </iframe>
          </div>
          <div class="vid-open-row">
            <a class="vid-open-link" href="${ytLink}" target="_blank" rel="noopener">↗ Open in YouTube</a>
          </div>
        </div>`;
      };

      const tabsHTML=vids.length>1
        ?'<div class="vid-tab-row">'+vids.map((vv,vi)=>
            `<button class="vid-tab-btn${vi===0?' active':''}" onclick="switchVideoPane(this,${d},${vi})">${vv.title}</button>`
          ).join('')+'</div>'
        :'';

      vidHTML='<div class="dc card">'
        +'<div class="dc-hdr"><span class="dc-icon">▶</span><span class="dc-title">Professor Messer — Watch the Video</span><span class="dc-hint">Embedded</span></div>'
        +tabsHTML
        +vids.map((vv,vi)=>buildIframe(vv,vi===0)).join('')
        +'</div>';
    }

    // Class notes
    const notes=DAY_NOTES[d]||'';
    let notesHTML='';
    if(notes){
      notesHTML='<div class="dc card"><div class="dc-hdr"><span class="dc-icon">📖</span><span class="dc-title">Class Notes</span></div><div class="dc-body" style="padding:14px">'+notes+'</div></div>';
    }

    // Checklist
    const clHTML=dd.checklist.map((item,i)=>{
      const k=d+'_'+i,chk=subChecks[k]?'checked':'';
      return '<div class="ci '+chk+'" id="sc-'+d+'-'+i+'" onclick="toggleSub('+d+','+i+')">'
        +'<div class="ci-box"></div><div class="ci-txt">'+item+'</div></div>';
    }).join('');

    // Chips
    const chips=dd.practice.split('|').map(s=>s.trim()).filter(Boolean).map(c=>{
      if(c.includes('=')){
        const eq=c.indexOf('=');
        return '<span class="chip"><em>'+c.slice(0,eq).trim()+'</em> = '+c.slice(eq+1).trim()+'</span>';
      }
      return '<span class="chip">'+c+'</span>';
    }).join('');

    // Links
    const links=dd.links.map(l=>'<a class="res-link" href="'+l.url+'" target="_blank" rel="noopener">↗ '+l.label+'</a>').join('');

    div.innerHTML='<div class="day-page">'
      +'<div class="day-hdr"><div class="day-num-bg">'+d+'</div><div class="day-hdr-r">'
      +'<div class="phase-badge badge-'+phase.cls+'">'+phase.label+'</div>'
      +'<div class="day-title">'+dd.topic+'</div>'
      +'<div class="day-meta">Day '+d+' of 90 &nbsp;·&nbsp; '+(d<=45?'220-1201 Core 1':'220-1202 Core 2')+'</div>'
      +'</div></div>'
      +vidHTML
      +notesHTML
      +'<div class="dc card"><div class="dc-hdr"><span class="dc-icon">✓</span><span class="dc-title">Today&#39;s Checklist</span><span class="dc-hint">+2 XP each</span></div><div class="checklist">'+clHTML+'</div></div>'
      +'<div class="dc card"><div class="dc-hdr"><span class="dc-icon">💡</span><span class="dc-title">Note-Taking Objective</span></div><div class="dc-body" style="padding:12px 14px"><p>'+dd.note+'</p></div></div>'
      +'<div class="dc card"><div class="dc-hdr"><span class="dc-icon">🔤</span><span class="dc-title">Acronyms &amp; Terms</span></div><div class="chips">'+chips+'</div></div>'
      +'<div class="dc card"><div class="dc-hdr"><span class="dc-icon">🔗</span><span class="dc-title">External Resources</span></div><div class="res-links">'+links
      +'<a class="res-link" href="https://www.examcompass.com/comptia/a-plus-certification/free-a-plus-practice-tests" target="_blank">ExamCompass</a>'
      +'<a class="res-link" href="https://crucialexams.com/exams/comptia/a-plus/" target="_blank">Crucial Exams</a>'
      +'<a class="res-link" href="https://www.comptia.org/certifications/a" target="_blank">CompTIA</a>'
      +'<a class="res-link" href="https://www.professormesser.com/free-a-plus-training/220-1201/220-1201-training-course/" target="_blank">Prof. Messer</a>'
      +'</div></div>'
      +'<div class="complete-row">'
      +'<button class="complete-btn'+(completed.has(d)?' done':'')+'" id="cbtn-'+d+'" onclick="toggleComplete('+d+')">'
      +(completed.has(d)?'✓  Day Complete':'○  Mark Day Complete (+50 XP)')+'</button>'
      +'<div class="nav-btns"><button class="nav-btn"'+(d===1?' disabled':'')+' onclick="prevDay('+d+')">← Prev</button>'
      +'<button class="nav-btn"'+(d===90?' disabled':'')+' onclick="nextDay('+d+')">Next →</button></div>'
      +'</div></div>';
    container.appendChild(div);
  }
}
function buildDayCards(){
  // Lazy: only pre-build first 3 days and the next incomplete day for fast start
  let next=1;for(let d=1;d<=90;d++){if(!completed.has(d)){next=d;break;}}
  [1,2,3,next].forEach(d=>{if(d>=1&&d<=90)buildDayCard(d);});
}

// ── NOTES ─────────────────────────────────────────────────────────────────
function buildNotes(){
  const nc=document.getElementById('notes-content');
  nc.innerHTML=ALL_NOTES.map(sec=>{
    const rows=sec.items.map(([k,v])=>'<tr class="notes-row"><td>'+k+'</td><td>'+v+'</td></tr>').join('');
    return '<div class="notes-section"><div class="notes-section-title">'+sec.title+'</div>'
      +'<table class="notes-table">'+rows+'</table></div>';
  }).join('');
}
function filterNotes(q){
  const lq=q.toLowerCase().trim();
  document.querySelectorAll('.notes-row').forEach(r=>{
    r.classList.toggle('hidden-row',lq.length>0&&!r.textContent.toLowerCase().includes(lq));
  });
  document.querySelectorAll('.notes-section').forEach(s=>{
    s.classList.toggle('hidden-section',lq.length>0&&!s.querySelectorAll('.notes-row:not(.hidden-row)').length);
  });
}

// ── TESTS ─────────────────────────────────────────────────────────────────
function buildTests(){
  const c1Total=TESTS.core1.reduce((a,s)=>a+s.questions.length,0);
  const c2Total=TESTS.core2.reduce((a,s)=>a+s.questions.length,0);
  document.getElementById('tests-sub-label').textContent=
    TESTS.core1.length+' Core 1 sets + '+TESTS.core2.length+' Core 2 sets · '+(c1Total+c2Total)+' total questions · full explanations';
  ['c1','c2'].forEach(core=>{
    const arr=core==='c1'?TESTS.core1:TESTS.core2;
    const grid=document.getElementById(core+'-grid');
    arr.forEach((set,i)=>{
      const key=core+'_'+i,s=testScores[key];
      const pct=s!==undefined?Math.round(s/20*100):-1;
      const card=document.createElement('div');
      card.className='test-card';card.dataset.core=core;card.dataset.idx=i;
      card.innerHTML='<div class="tc-lbl">'+core.toUpperCase()+' · Set '+(i+1)+'</div>'
        +'<div class="tc-title">'+set.title.replace(/Core [12] — /,'')+'</div>'
        +'<div class="tc-score '+(pct>=80?'good':pct>=60?'ok':pct>=0?'bad':'')+'">'+
        (s!==undefined?s+'/20  '+pct+'%':'Not attempted')+'</div>'
        +'<div class="tc-bar"><div class="tc-bar-fill" style="width:'+(pct>0?pct:0)+'%;background:'+(pct>=80?'var(--green)':pct>=60?'var(--amber)':'var(--red)')+'"></div></div>';
      card.onclick=()=>startQuiz(core,i);
      grid.appendChild(card);
    });
  });
}

// ── QUIZ ENGINE ───────────────────────────────────────────────────────────
function startQuiz(core,idx){
  activeQuiz={core,idx};quizAnswers={};quizCorrect=0;
  document.querySelectorAll('.test-card').forEach(c=>c.classList.remove('active'));
  const tc=document.querySelector('.test-card[data-core="'+core+'"][data-idx="'+idx+'"]');
  if(tc)tc.classList.add('active');
  renderQuiz();
  setTimeout(()=>document.getElementById('quiz-area').scrollIntoView({behavior:'smooth',block:'start'}),100);
}
function renderQuiz(){
  const q=activeQuiz,arr=q.core==='c1'?TESTS.core1:TESTS.core2,set=arr[q.idx];
  const LTR=['A','B','C','D'];
  let html='<div class="quiz-hdr"><div class="quiz-title">'+set.title+'</div>'
    +'<div class="quiz-prog-row"><div class="qp-bar"><div class="qp-fill" id="qpf" style="width:0%"></div></div>'
    +'<div class="qp-count"><span id="qpc">0</span>/'+set.questions.length+'</div>'
    +'<div class="qp-correct"><span id="qps">0</span> ✓</div></div></div>'
    +'<div class="kbd-tip">Press 1 2 3 4 on keyboard to answer</div>';
  set.questions.forEach((ques,i)=>{
    html+='<div class="q-block" id="qb-'+i+'">'
      +'<div class="q-num">Q'+(i+1)+' / '+set.questions.length+'</div>'
      +'<div class="q-text">'+ques.q+'</div><div class="q-opts" id="qo-'+i+'">';
    ques.opts.forEach((o,oi)=>{
      html+='<button class="opt" onclick="answerQ('+i+','+oi+')">'
        +'<span class="opt-ltr">'+LTR[oi]+'.</span><span class="opt-txt">'+o+'</span></button>';
    });
    html+='</div><div class="explanation" id="exp-'+i+'">💡 '+ques.exp+'</div></div>';
  });
  html+='<div class="results-card" id="rc">'
    +'<div class="res-score" id="r-score">—</div>'
    +'<div class="res-pct" id="r-pct">—</div>'
    +'<div class="res-grid">'
    +'<div class="res-card"><div class="res-card-val c-green" id="r-c">0</div><div class="res-card-lbl">Correct</div></div>'
    +'<div class="res-card"><div class="res-card-val c-red" id="r-w">0</div><div class="res-card-lbl">Wrong</div></div>'
    +'<div class="res-card"><div class="res-card-val c-purple" id="r-xp">0</div><div class="res-card-lbl">XP</div></div>'
    +'</div><div class="res-msg" id="r-msg"></div>'
    +'<button class="retry-btn" id="retry-btn">↺ Retry</button>'
    +'</div>';
  document.getElementById('quiz-area').innerHTML=html;
  document.getElementById('retry-btn').onclick=()=>startQuiz(activeQuiz.core,activeQuiz.idx);
}
function answerQ(qIdx,optIdx){
  if(quizAnswers[qIdx]!==undefined)return;
  const q=activeQuiz,arr=q.core==='c1'?TESTS.core1:TESTS.core2,set=arr[q.idx],ques=set.questions[qIdx];
  const correct=optIdx===ques.ans;
  quizAnswers[qIdx]=optIdx;
  if(correct){quizCorrect++;giveXP(10,'Correct');}
  const btns=document.querySelectorAll('#qo-'+qIdx+' .opt');
  btns.forEach((b,oi)=>{
    b.disabled=true;b.onclick=null;
    if(oi===ques.ans)b.classList.add('reveal');
    if(oi===optIdx&&!correct)b.classList.add('wrong');
    if(oi===optIdx&&correct){b.classList.remove('reveal');b.classList.add('correct');}
  });
  document.getElementById('exp-'+qIdx).classList.add('show');
  const ans=Object.keys(quizAnswers).length;
  const pf=document.getElementById('qpf'),pc=document.getElementById('qpc'),ps=document.getElementById('qps');
  if(pf)pf.style.width=(ans/set.questions.length*100)+'%';
  if(pc)pc.textContent=ans;
  if(ps)ps.textContent=quizCorrect;
  if(ans===set.questions.length)finaliseQuiz(q.core,q.idx,set);
}
function finaliseQuiz(core,idx,set){
  const s=quizCorrect,t=set.questions.length,pct=Math.round(s/t*100);
  testScores[core+'_'+idx]=s;
  localStorage.setItem('cpt_scores',JSON.stringify(testScores));
  let bonus=0;
  if(pct===100){bonus=50;giveXP(50,'Perfect score!');}
  else if(pct>=80){bonus=25;giveXP(25,'80%+ bonus');}
  const sc=pct>=80?'c-green':pct>=60?'c-amber':'c-red';
  const rs=document.getElementById('r-score');if(rs){rs.textContent=s+'/'+t;rs.className='res-score '+sc;}
  const rp=document.getElementById('r-pct');if(rp)rp.textContent=pct+'% Correct';
  const rc=document.getElementById('r-c');if(rc)rc.textContent=s;
  const rw=document.getElementById('r-w');if(rw)rw.textContent=t-s;
  const rx=document.getElementById('r-xp');if(rx)rx.textContent=s*10+bonus;
  const rm=document.getElementById('r-msg');
  if(rm)rm.textContent=pct>=80?'Excellent! You are exam-ready on this topic.':pct>=60?'Good work. Review explanations for wrong answers.':'Keep studying. Hit the Notes tab for a quick review.';
  const rcEl=document.getElementById('rc');
  if(rcEl){rcEl.classList.add('show');setTimeout(()=>rcEl.scrollIntoView({behavior:'smooth'}),100);}
  updateStats();checkAchs();
}
document.addEventListener('keydown',e=>{
  if(!activeQuiz||currentTab!=='tests')return;
  const arr=activeQuiz.core==='c1'?TESTS.core1:TESTS.core2,set=arr[activeQuiz.idx];
  const map={'1':0,'2':1,'3':2,'4':3};
  if(map[e.key]!==undefined)for(let i=0;i<set.questions.length;i++){if(quizAnswers[i]===undefined){answerQ(i,map[e.key]);break;}}
});

// ── INIT ──────────────────────────────────────────────────────────────────
// These are called after auth in loginUser(), or here if already logged in
// Init only if user is already logged in (overlay hidden) - lazy load handles the rest
if(localStorage.getItem('cpt_current_user')){
  // loginUser() will be called by initAuth() which runs at bottom - no need to build here
}
// Auto streak popup on return visits
(function(){
  const today=new Date().toDateString();
  if(localStorage.getItem('cpt_streak_shown')!==today&&getStreak()>1&&completed.size>0){
    localStorage.setItem('cpt_streak_shown',today);
    setTimeout(openStreakModal,2200);
  }
})();


// ══════════════════════════════════════════════════════════════════
// DARK MODE
// ══════════════════════════════════════════════════════════════════
function toggleDarkMode(){
  const dm=document.documentElement.classList.toggle('dark-mode');
  document.getElementById('dm-btn').textContent=dm?'☀️':'🌙';
  localStorage.setItem('cpt_darkmode',dm?'1':'0');
}
(function initDarkMode(){
  if(localStorage.getItem('cpt_darkmode')==='1'){
    document.documentElement.classList.add('dark-mode');
    // btn may not exist yet during early init; will be patched by DOMContentLoaded too
    const b=document.getElementById('dm-btn');if(b)b.textContent='☀️';
  }
})();

// ══════════════════════════════════════════════════════════════════
// GOOGLE SHEETS BACKEND AUTH
// ══════════════════════════════════════════════════════════════════
// CONFIGURE THIS: Paste your GAS Web App URL here after deploying the GAS script
const GAS_URL = 'https://script.google.com/macros/s/AKfycbyF9FlSWvmlTzm65xftC9zmdpjBG3epUp3AVtTwPASy2yVLNO1-aBVkJG06_PCMr-KR/exec';

function setSyncStatus(state, text){
  const el=document.getElementById('sync-status');
  if(!el)return;
  el.className='sync-status'+(state?' '+state:'');
  el.textContent=state==='syncing'?'⏳ '+text:state==='synced'?'✓ '+text:state==='error'?'⚠ '+text:'☁ '+text;
}

async function gasCall(action, payload={}){
  setSyncStatus('syncing','Syncing...');
  try{
    const params=new URLSearchParams({action,...payload});
    const res=await fetch(GAS_URL+'?'+params.toString(),{redirect:'follow'});
    const json=await res.json();
    setSyncStatus(json.ok?'synced':'error', json.ok?'Saved':'Sync error');
    setTimeout(()=>setSyncStatus('','Cloud'),3000);
    return json;
  }catch(e){
    setSyncStatus('error','Offline');
    setTimeout(()=>setSyncStatus('','Cloud'),5000);
    return{ok:false,error:e.message};
  }
}

// ══════════════════════════════════════════════════════════════════
// AUTH SYSTEM (GAS-backed with localStorage fallback)
// ══════════════════════════════════════════════════════════════════
let currentUser = null; // {username, name, prefix}

// LocalStorage fallback helpers (used when GAS_URL not configured or offline)
function getUsers(){return JSON.parse(localStorage.getItem('cpt_users')||'{}');}
function saveUsers(u){localStorage.setItem('cpt_users',JSON.stringify(u));}
function userKey(prefix,k){return prefix+'_'+k;}
function getUD(k,def=''){const v=localStorage.getItem(userKey(currentUser.prefix,k));return v!==null?v:def;}
function setUD(k,v){localStorage.setItem(userKey(currentUser.prefix,k),v);}

const GAS_CONFIGURED = GAS_URL && GAS_URL !== 'YOUR_GAS_WEB_APP_URL_HERE';

function switchAuthTab(tab){
  document.getElementById('atab-login').classList.toggle('active',tab==='login');
  document.getElementById('atab-register').classList.toggle('active',tab==='register');
  document.getElementById('auth-login-form').style.display=tab==='login'?'':'none';
  document.getElementById('auth-register-form').style.display=tab==='register'?'':'none';
  document.getElementById('auth-err').textContent='';
}

async function doLogin(){
  const u=document.getElementById('login-user').value.trim().toLowerCase();
  const p=document.getElementById('login-pass').value;
  const err=document.getElementById('auth-err');
  if(!u||!p){err.textContent='Please fill in all fields.';return;}

  err.textContent='Signing in…';

  if(GAS_CONFIGURED){
    // Try cloud auth first
    const r=await gasCall('login',{username:u,password:simpleHash(p)});
    if(r.ok){
      // Merge cloud data into localStorage
      const userData={name:r.name||u,hash:simpleHash(p),prefix:'cpt_'+u,created:r.created||Date.now()};
      const users=getUsers();users[u]=userData;saveUsers(users);
      // Restore cloud progress if available
      if(r.data){
        Object.entries(r.data).forEach(([k,v])=>localStorage.setItem('cpt_'+u+'_'+k,v));
      }
      loginUser(u,userData);
      return;
    } else if(r.error&&r.error.includes('not found')){
      err.textContent='Account not found. Please register.';return;
    } else if(r.error&&r.error.includes('password')){
      err.textContent='Incorrect password.';return;
    }
    // Fall through to local if GAS unreachable
  }

  // Local fallback
  const users=getUsers();
  if(!users[u]){err.textContent='Account not found. Please register.';return;}
  if(users[u].hash!==simpleHash(p)){err.textContent='Incorrect password.';return;}
  loginUser(u,users[u]);
}

async function doRegister(){
  const u=document.getElementById('reg-user').value.trim().toLowerCase().replace(/[^a-z0-9_]/g,'');
  const n=document.getElementById('reg-name').value.trim()||u;
  const p=document.getElementById('reg-pass').value;
  const err=document.getElementById('auth-err');
  if(!u||!p){err.textContent='Username and password required.';return;}
  if(u.length<3){err.textContent='Username must be at least 3 characters.';return;}
  if(p.length<6){err.textContent='Password must be at least 6 characters.';return;}

  const users=getUsers();
  if(users[u]){err.textContent='Username already taken.';return;}

  err.textContent='Creating account…';

  if(GAS_CONFIGURED){
    const r=await gasCall('register',{username:u,name:n,password:simpleHash(p)});
    if(!r.ok){
      if(r.error&&r.error.includes('taken')){err.textContent='Username already taken.';return;}
      // If offline, continue with local only
    }
  }

  users[u]={name:n,hash:simpleHash(p),prefix:'cpt_'+u,created:Date.now()};
  saveUsers(users);
  loginUser(u,users[u]);
}

function loginUser(username,userData){
  currentUser={username,name:userData.name,prefix:userData.prefix};
  localStorage.setItem('cpt_current_user',JSON.stringify(currentUser));
  document.getElementById('auth-overlay').classList.add('hidden');
  updateUserUI();
  loadUserData();
  pushNotif('👋','Welcome back, '+currentUser.name+'!','Study session started.');
  _builtDays.clear();document.getElementById('day-cards').innerHTML='';
  buildSidebar();buildDayCards();buildNotes();buildTests();updateStats();
  initNotifScheduler();
}

function updateUserUI(){
  if(!currentUser)return;
  const initials=currentUser.name.slice(0,1).toUpperCase();
  document.getElementById('user-avatar').textContent=initials;
  document.getElementById('user-pill-name').textContent=currentUser.name.split(' ')[0];
  document.getElementById('um-name').textContent=currentUser.name;
  document.getElementById('um-user').textContent='@'+currentUser.username;
  document.getElementById('dash-greeting-name').textContent=currentUser.name.split(' ')[0];
}

function loadUserData(){
  // Load from user-scoped localStorage keys
  completed=new Set(JSON.parse(getUD('done','[]')));
  subChecks=JSON.parse(getUD('subs','{}'));
  totalXP=parseInt(getUD('xp','0'))||0;
  achievements=JSON.parse(getUD('ach','[]'));
  testScores=JSON.parse(getUD('scores','{}'));
}

function toggleUserMenu(e){
  e.stopPropagation();
  const m=document.getElementById('user-menu');
  const np=document.getElementById('notif-panel');
  np.classList.remove('open');
  m.classList.toggle('open');
}

function confirmLogout(){
  if(confirm('Sign out? Your progress is saved.')){
    closeAll();
    currentUser=null;
    localStorage.removeItem('cpt_current_user');
    completed=new Set();subChecks={};totalXP=0;achievements=[];testScores={};
    document.getElementById('auth-overlay').classList.remove('hidden');
  }
}

function switchAccount(){
  closeAll();
  currentUser=null;
  localStorage.removeItem('cpt_current_user');
  document.getElementById('auth-overlay').classList.remove('hidden');
  switchAuthTab('login');
}

function skipLogin(){
  // Guest mode: use a local-only guest account
  const guestUser={username:'guest',name:'Student',prefix:'cpt_guest'};
  currentUser=guestUser;
  localStorage.setItem('cpt_current_user',JSON.stringify(currentUser));
  document.getElementById('auth-overlay').classList.add('hidden');
  updateUserUI();
  loadUserData();
  buildSidebar();buildDayCards();buildNotes();buildTests();updateStats();
  initNotifScheduler();
  showToast('Welcome! Progress saved locally.');
}

function exportData(){
  if(!currentUser)return;
  const data={user:currentUser,completed:[...completed],subChecks,totalXP,achievements,testScores,exported:new Date().toISOString()};
  const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
  const a=document.createElement('a');
  a.href=URL.createObjectURL(blob);
  a.download='comptia-progress-'+currentUser.username+'.json';
  a.click();
  closeAll();showToast('Progress exported!');
}

function simpleHash(str){
  let h=5381;
  for(let i=0;i<str.length;i++){h=((h<<5)+h)+str.charCodeAt(i);}
  return (h>>>0).toString(36);
}

// Override save() to use user-scoped storage + async cloud sync
function save(){
  if(!currentUser)return;
  setUD('done',JSON.stringify([...completed]));
  setUD('subs',JSON.stringify(subChecks));
  setUD('xp',String(totalXP));
  setUD('ach',JSON.stringify(achievements));
  setUD('scores',JSON.stringify(testScores));
  // Debounced cloud sync
  clearTimeout(save._t);
  save._t=setTimeout(()=>{
    if(GAS_CONFIGURED&&currentUser){
      gasCall('saveProgress',{
        username:currentUser.username,
        done:JSON.stringify([...completed]),
        subs:JSON.stringify(subChecks),
        xp:String(totalXP),
        ach:JSON.stringify(achievements),
        scores:JSON.stringify(testScores)
      });
    }
  },2000);
}

// ══════════════════════════════════════════════════════════════════
// NOTIFICATION SYSTEM
// ══════════════════════════════════════════════════════════════════
let notifications=[]; // [{id,icon,text,time,read}]
let notifPermGranted=false;

function loadNotifs(){
  if(!currentUser)return;
  notifications=JSON.parse(getUD('notifications','[]'));
  renderNotifList();
  updateNotifBadge();
  // Load toggle state
  const on=getUD('notif_on','0')==='1';
  notifPermGranted=on;
  document.getElementById('notif-toggle').classList.toggle('on',on);
}

function saveNotifState(){
  if(!currentUser)return;
  setUD('notifications',JSON.stringify(notifications.slice(0,30)));
  setUD('notif_on',notifPermGranted?'1':'0');
}

function saveNotifTime(){
  if(!currentUser)return;
  setUD('notif_time',document.getElementById('notif-time').value);
}

function pushNotif(icon,text,sub){
  const n={id:Date.now(),icon,text,sub:sub||'',time:new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'}),read:false};
  notifications.unshift(n);
  renderNotifList();
  updateNotifBadge();
  saveNotifState();
}

function renderNotifList(){
  const list=document.getElementById('notif-list');
  if(!list)return;
  if(!notifications.length){
    list.innerHTML='<div class="notif-empty">No notifications yet.<br>Complete a day to earn some!</div>';
    return;
  }
  list.innerHTML=notifications.slice(0,15).map(n=>
    '<div class="notif-item'+(n.read?'':' unread')+'" onclick="markRead('+n.id+')">'
    +'<div class="notif-item-icon">'+n.icon+'</div>'
    +'<div class="notif-item-text">'+n.text+(n.sub?'<br><span style="font-weight:400;color:var(--text3)">'+n.sub+'</span>':'')+'</div>'
    +'<div class="notif-item-time">'+n.time+'</div>'
    +'</div>'
  ).join('');
}

function markRead(id){
  const n=notifications.find(x=>x.id===id);
  if(n)n.read=true;
  renderNotifList();
  updateNotifBadge();
  saveNotifState();
}

function clearNotifs(){
  notifications=[];
  renderNotifList();
  updateNotifBadge();
  saveNotifState();
}

function updateNotifBadge(){
  const count=notifications.filter(n=>!n.read).length;
  const badge=document.getElementById('notif-badge');
  if(!badge)return;
  badge.textContent=count>9?'9+':String(count);
  badge.classList.toggle('show',count>0);
}

function toggleNotifPanel(e){
  e.stopPropagation();
  const panel=document.getElementById('notif-panel');
  const menu=document.getElementById('user-menu');
  menu.classList.remove('open');
  panel.classList.toggle('open');
  if(panel.classList.contains('open')){
    // Mark visible as read
    const savedTime=getUD('notif_time','09:00');
    document.getElementById('notif-time').value=savedTime;
    document.getElementById('notif-toggle').classList.toggle('on',notifPermGranted);
  }
}

async function toggleNotifPerm(){
  if(notifPermGranted){
    notifPermGranted=false;
    document.getElementById('notif-toggle').classList.remove('on');
    saveNotifState();
    showToast('Reminders disabled');
  } else {
    if('Notification' in window){
      const perm=await Notification.requestPermission();
      if(perm==='granted'){
        notifPermGranted=true;
        document.getElementById('notif-toggle').classList.add('on');
        saveNotifState();
        showToast('Daily reminders enabled!');
        // Send test notification
        new Notification('CompTIA A+ Study Reminder',{
          body:'Your reminder is set! Keep up the streak. 🔥',
          icon:'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>📚</text></svg>'
        });
      } else {
        showToast('Notification permission denied.');
      }
    } else {
      showToast('Notifications not supported in this browser.');
    }
  }
}

function initNotifScheduler(){
  // Check every minute if it's time for a reminder
  setInterval(()=>{
    if(!notifPermGranted||!currentUser)return;
    const now=new Date();
    const hm=now.getHours().toString().padStart(2,'0')+':'+now.getMinutes().toString().padStart(2,'0');
    const target=getUD('notif_time','09:00');
    if(hm===target){
      const lastKey='notif_last_'+hm;
      const lastDate=getUD(lastKey,'');
      const today=now.toDateString();
      if(lastDate!==today){
        setUD(lastKey,today);
        sendDailyReminder();
      }
    }
  },60000);
}

function sendDailyReminder(){
  const streak=getStreak();
  const done=completed.size;
  const msg=streak>0?'🔥 '+streak+' day streak! Keep it going — Day '+(done+1)+' awaits.':'📚 Time to study! Day '+(done+1)+' of 90 is waiting for you.';
  if(Notification.permission==='granted'){
    new Notification('CompTIA A+ Daily Reminder',{
      body:msg,
      icon:'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>📚</text></svg>'
    });
  }
  pushNotif('⏰','Daily Reminder',msg);
}

// Hook into giveXP and achievements to push in-app notifications
const _origGiveXP=giveXP;
// Patch is done at bottom after definition

// ══════════════════════════════════════════════════════════════════
// YOUTUBE IFRAME TAB SWITCHING
// ══════════════════════════════════════════════════════════════════
function switchVideoPane(btn,day,vidIdx){
  btn.parentElement.querySelectorAll('.vid-tab-btn').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  const dc=document.getElementById('dc-'+day);
  if(dc){
    dc.querySelectorAll('[data-vidpane]').forEach((pane,i)=>{
      pane.style.display=i===vidIdx?'':'none';
    });
  }
}

// ══════════════════════════════════════════════════════════════════
// CLOSE PANELS ON OUTSIDE CLICK
// ══════════════════════════════════════════════════════════════════
document.addEventListener('click',()=>{
  document.getElementById('notif-panel').classList.remove('open');
  document.getElementById('user-menu').classList.remove('open');
});

// ══════════════════════════════════════════════════════════════════
// INIT AUTH
// ══════════════════════════════════════════════════════════════════
(function initAuth(){
  // Check if already logged in
  const saved=localStorage.getItem('cpt_current_user');
  if(saved){
    try{
      const cu=JSON.parse(saved);
      currentUser=cu;
      document.getElementById('auth-overlay').classList.add('hidden');
      updateUserUI();
      loadUserData();
      buildSidebar();buildDayCards();buildNotes();buildTests();updateStats();
      loadNotifs();
      initNotifScheduler();
      // Push return notification
      const today=new Date().toDateString();
      const lastSeen=getUD('last_seen','');
      if(lastSeen!==today){
        setUD('last_seen',today);
        const streak=getStreak();
        if(streak>0)pushNotif('🔥','Welcome back!',streak+' day streak — keep it going!');
      }
    }catch(e){
      localStorage.removeItem('cpt_current_user');
    }
  }
  // Enter key support for auth inputs
  ['login-user','login-pass'].forEach(id=>{
    const el=document.getElementById(id);
    if(el)el.addEventListener('keydown',e=>{if(e.key==='Enter')doLogin();});
  });
  ['reg-user','reg-name','reg-pass'].forEach(id=>{
    const el=document.getElementById(id);
    if(el)el.addEventListener('keydown',e=>{if(e.key==='Enter')doRegister();});
  });
})();

// ── EXPOSE GLOBALS ──────────────────────────────────────────────────────
window.answerQ=answerQ;
window.clearNotifs=clearNotifs;
window.closeAll=closeAll;
window.closeSidebar=closeSidebar;
window.confirmLogout=confirmLogout;
window.doLogin=doLogin;
window.doRegister=doRegister;
window.exportData=exportData;
window.filterNotes=filterNotes;
window.goToNextDay=goToNextDay;
window.markRead=markRead;
window.nextDay=nextDay;
window.openStreakModal=openStreakModal;
window.prevDay=prevDay;
window.saveNotifTime=saveNotifTime;
window.showDash=showDash;
window.switchAccount=switchAccount;
window.switchAuthTab=switchAuthTab;
window.switchTab=switchTab;
window.switchVideoPane=switchVideoPane;
window.toggleComplete=toggleComplete;
window.toggleDarkMode=toggleDarkMode;
window.toggleNotifPanel=toggleNotifPanel;
window.toggleNotifPerm=toggleNotifPerm;
window.toggleSub=toggleSub;
window.toggleUserMenu=toggleUserMenu;
window.skipLogin=skipLogin;

})();
