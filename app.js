const TAGS = {
  skills: ['BIM','Revit','Navisworks','Lean Construction','Last Planner System','S10','Costos','Valorizaciones','Contrataciones Públicas','Ley 32069','SEACE','MS Project','Primavera P6','Calidad','ISO 9001','Seguridad / SSOMA','Power BI','Excel Avanzado','IA aplicada','Gestión de proyectos','PMBOK','Residencia de obra','Supervisión'],
  learning: ['BIM','Revit','Navisworks','Lean Construction','Last Planner System','S10','Costos','Valorizaciones','Contrataciones Públicas','Ley 32069','SEACE','MS Project','Primavera P6','Calidad','ISO 9001','Seguridad / SSOMA','Power BI','IA aplicada','Gestión de proyectos','PMBOK'],
  offers: ['Mentoría','Proveedores','Contactos laborales','Asesoría técnica','Revisión de CV','Apoyo en tesis','Consultoría','Revisión BIM','Experiencia en obra','Revisión de expedientes','Networking'],
  goals: ['Conseguir trabajo','Buscar socios','Conseguir clientes','Emprender','Consultoría','Investigación','Docencia','Networking','Certificaciones','Aprender nuevas tecnologías'],
  projects: ['Obras públicas','Edificaciones','Hospitales','Colegios','Carreteras','Puentes','Minería','Industria','Vivienda','Hidráulica','Saneamiento','Infraestructura educativa']
};

const TOPICS = [
  {id:'bim-publico',icon:'🏗️',title:'BIM y Transformación Digital',subtitle:'BIM aplicado a obras y coordinación digital',keywords:['BIM','Revit','Navisworks','IA aplicada','Power BI'],projects:['Obras públicas','Edificaciones','Hospitales'],goals:['Aprender nuevas tecnologías','Networking','Consultoría']},
  {id:'lean',icon:'📈',title:'Lean Construction',subtitle:'Productividad, Last Planner y mejora continua',keywords:['Lean Construction','Last Planner System','Gestión de proyectos'],projects:['Edificaciones','Obras públicas','Industria'],goals:['Networking','Consultoría','Aprender nuevas tecnologías']},
  {id:'ia',icon:'🤖',title:'IA aplicada a la Construcción',subtitle:'Automatización, datos y herramientas inteligentes',keywords:['IA aplicada','Power BI','Excel Avanzado','BIM'],projects:['Edificaciones','Obras públicas','Industria'],goals:['Aprender nuevas tecnologías','Investigación','Emprender']},
  {id:'costos',icon:'💰',title:'Costos y Planeamiento',subtitle:'Presupuestos, valorizaciones y programación',keywords:['S10','Costos','Valorizaciones','MS Project','Primavera P6'],projects:['Obras públicas','Edificaciones','Carreteras'],goals:['Consultoría','Conseguir clientes','Networking']},
  {id:'contratos',icon:'📑',title:'Contrataciones y Obras Públicas',subtitle:'Ley 32069, SEACE, expedientes y contratación',keywords:['Contrataciones Públicas','Ley 32069','SEACE','Gestión de proyectos'],projects:['Obras públicas','Infraestructura educativa','Saneamiento'],goals:['Consultoría','Conseguir clientes','Networking']},
  {id:'calidad',icon:'🦺',title:'Calidad y Seguridad',subtitle:'QA/QC, ISO 9001 y SSOMA en obra',keywords:['Calidad','ISO 9001','Seguridad / SSOMA','Supervisión'],projects:['Minería','Industria','Edificaciones'],goals:['Certificaciones','Networking','Consultoría']},
  {id:'pmo',icon:'🎯',title:'Gestión de Proyectos y PMO',subtitle:'Dirección, PMBOK, control y liderazgo',keywords:['Gestión de proyectos','PMBOK','MS Project','Primavera P6','Supervisión'],projects:['Obras públicas','Edificaciones','Hospitales'],goals:['Networking','Consultoría','Buscar socios']}
];

const defaultUser = {
  name:'', phone:'', email:'', city:'', company:'', role:'', sector:'', specialty:'', experience:0,
  linkedin:'', bio:'', avatar:'', skills:[], learning:[], offers:[], goals:[], projects:[], availability:[]
};

const ACCOUNTS_KEY='constructnet_accounts_v4';
const SESSION_KEY='constructnet_session_v4';
const CLOUD = window.CONSTRUCTNET_CLOUD || {url:'',anonKey:''};
const cloudEnabled = Boolean(CLOUD.url && CLOUD.anonKey);
let currentEmail = localStorage.getItem(SESSION_KEY) || '';
let communityCache = [];
let topicMembershipCache = {};
let cloudOpportunities = [];
let state = {
  route:'dashboard', user:{...defaultUser}, connections:[], score:0, profileCompleted:false,
  notifications:[], history:[], opportunities:[], joinedTopics:[], selectedTopic:'bim-publico', selectedOpportunityType:'Todos'
};

const app=document.getElementById('app');
const toast=document.getElementById('toast');
const authHost=document.getElementById('authHost');
const onboardingHost=document.getElementById('onboardingHost');

function notify(message){toast.textContent=message;toast.classList.add('show');setTimeout(()=>toast.classList.remove('show'),2500)}
function esc(v=''){return String(v).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
function initials(name=''){const parts=name.trim().split(/\s+/).filter(Boolean);return parts.length?parts.slice(0,2).map(x=>x[0]).join('').toUpperCase():'?'}
function cloneTpl(id){return document.getElementById(id).content.cloneNode(true)}
function unique(arr){return [...new Set(arr)]}
function getAccounts(){try{return JSON.parse(localStorage.getItem(ACCOUNTS_KEY)||'[]')}catch{return []}}
function putAccounts(a){localStorage.setItem(ACCOUNTS_KEY,JSON.stringify(a))}
function getCurrentAccount(){return getAccounts().find(x=>x.email===currentEmail)}
function profileCompletion(u){
  const simple=['name','phone','city','company','role','sector','specialty','experience','bio'];
  let score=simple.filter(k=>String(u[k]||'').trim() && !(k==='experience' && Number(u[k])===0)).length;
  score += ['skills','learning','offers','goals','projects','availability'].filter(k=>(u[k]||[]).length).length;
  if(u.avatar) score++;
  return Math.round(score/16*100);
}
function loadAccount(email){
  const a=getAccounts().find(x=>x.email===email); if(!a) return false;
  currentEmail=email; localStorage.setItem(SESSION_KEY,email);
  state={route:'dashboard',user:{...defaultUser,...(a.user||{}),email:a.email},connections:a.connections||[],score:Number(a.score||0),profileCompleted:!!a.profileCompleted,notifications:a.notifications||[],history:a.history||[],opportunities:a.opportunities||[],joinedTopics:a.joinedTopics||[],selectedTopic:a.selectedTopic||'bim-publico',selectedOpportunityType:'Todos'};
  return true;
}
function persistAccount(){
  if(!currentEmail)return;
  const accounts=getAccounts(); const i=accounts.findIndex(x=>x.email===currentEmail); if(i<0)return;
  accounts[i]={...accounts[i],user:{...state.user,email:currentEmail},connections:state.connections,score:state.score,profileCompleted:state.profileCompleted,notifications:state.notifications,history:state.history,opportunities:state.opportunities,joinedTopics:state.joinedTopics,selectedTopic:state.selectedTopic};
  putAccounts(accounts);
  syncProfileCloud().catch(()=>{});
}
function localCommunity(){
  return getAccounts().filter(a=>a.email!==currentEmail && a.profileCompleted).map(a=>accountToPerson(a));
}
function accountToPerson(a){const u={...defaultUser,...(a.user||{}),email:a.email};return {id:a.email,email:a.email,name:u.name||a.email,phone:u.phone||'',initials:initials(u.name),avatar:u.avatar||'',city:u.city||'',specialty:u.specialty||'',company:u.company||'',role:u.role||'',sector:u.sector||'',experience:Number(u.experience||0),bio:u.bio||'',linkedin:u.linkedin||'',skills:u.skills||[],learning:u.learning||[],offers:u.offers||[],goals:u.goals||[],projects:u.projects||[],availability:u.availability||[]}}
function currentPerson(){return accountToPerson({email:currentEmail,user:state.user})}

async function cloudFetch(path,options={}){
  if(!cloudEnabled) throw new Error('Cloud disabled');
  const headers={'apikey':CLOUD.anonKey,'Authorization':`Bearer ${CLOUD.anonKey}`,'Content-Type':'application/json',...(options.headers||{})};
  const r=await fetch(`${CLOUD.url.replace(/\/$/,'')}/rest/v1/${path}`,{...options,headers});
  if(!r.ok) throw new Error(await r.text());
  const text=await r.text(); return text?JSON.parse(text):null;
}
async function syncProfileCloud(){
  if(!cloudEnabled || !currentEmail || !state.profileCompleted)return;
  const u=state.user;
  const body={email:currentEmail,name:u.name,phone:u.phone,city:u.city,company:u.company,role:u.role,sector:u.sector,specialty:u.specialty,experience:Number(u.experience||0),bio:u.bio,linkedin:u.linkedin,avatar:u.avatar,skills:u.skills,learning:u.learning,offers:u.offers,goals:u.goals,projects:u.projects,availability:u.availability,updated_at:new Date().toISOString()};
  await cloudFetch('profiles?on_conflict=email',{method:'POST',headers:{'Prefer':'resolution=merge-duplicates,return=minimal'},body:JSON.stringify(body)});
}
async function refreshCommunity(){
  try{
    if(cloudEnabled){
      const rows=await cloudFetch('profiles?select=*');
      communityCache=(rows||[]).filter(r=>r.email!==currentEmail).map(r=>({id:r.email,email:r.email,name:r.name||r.email,phone:r.phone||'',initials:initials(r.name),avatar:r.avatar||'',city:r.city||'',specialty:r.specialty||'',company:r.company||'',role:r.role||'',sector:r.sector||'',experience:Number(r.experience||0),bio:r.bio||'',linkedin:r.linkedin||'',skills:r.skills||[],learning:r.learning||[],offers:r.offers||[],goals:r.goals||[],projects:r.projects||[],availability:r.availability||[]}));
      const joins=await cloudFetch('topic_members?select=topic_id,email');
      topicMembershipCache={}; (joins||[]).forEach(j=>{(topicMembershipCache[j.topic_id] ||= []).push(j.email)});
      cloudOpportunities=await cloudFetch('opportunities?select=*&order=created_at.desc');
    } else {
      communityCache=localCommunity();
      topicMembershipCache={}; getAccounts().forEach(a=>(a.joinedTopics||[]).forEach(t=>(topicMembershipCache[t] ||= []).push(a.email)));
      cloudOpportunities=getAccounts().flatMap(a=>(a.opportunities||[]).map(o=>({...o,author_email:a.email}))).sort((a,b)=>(b.id||0)-(a.id||0));
    }
  }catch(e){console.warn('Cloud sync:',e);communityCache=localCommunity();}
}
async function joinTopicCloud(topicId){if(!cloudEnabled)return;await cloudFetch('topic_members?on_conflict=topic_id,email',{method:'POST',headers:{'Prefer':'resolution=merge-duplicates,return=minimal'},body:JSON.stringify({topic_id:topicId,email:currentEmail})})}

function avatarMarkup(p,cls='person-avatar'){return p.avatar?`<div class="${cls} avatar-image"><img src="${p.avatar}" alt="Foto de ${esc(p.name)}"></div>`:`<div class="${cls}">${esc(p.initials||initials(p.name))}</div>`}
function setAppVisible(visible){document.querySelector('.topbar').classList.toggle('app-hidden',!visible);document.querySelector('.app-shell').classList.toggle('app-hidden',!visible);document.querySelector('.bottom-nav').classList.toggle('app-hidden',!visible)}
function setRoute(route){state.route=route;persistAccount();render();document.getElementById('sidebar').classList.remove('open');window.scrollTo({top:0,behavior:'smooth'})}
function bindRouteButtons(){document.querySelectorAll('[data-route]').forEach(el=>{el.onclick=e=>{e.preventDefault();setRoute(el.dataset.route)}})}

function personCard(p,{connect=true,contact=false}={}){
  const connected=state.connections.includes(p.id);
  return `<article class="person-card">${avatarMarkup(p)}<div><h3>${esc(p.name)}</h3><p>${esc(p.role||p.specialty||'Profesional')}</p><small>${esc(p.company||'')} ${p.city?'· '+esc(p.city):''}</small></div><div class="tag-list">${(p.skills||[]).slice(0,3).map(t=>`<span class="tag">${esc(t)}</span>`).join('')}</div>${p.offers?.length?`<p><strong>Puede aportar:</strong> ${esc(p.offers.slice(0,2).join(', '))}</p>`:''}${p.learning?.length?`<p><strong>Busca:</strong> ${esc(p.learning.slice(0,2).join(', '))}</p>`:''}<div class="person-actions">${contact?`<button class="primary-btn" onclick="showContact('${encodeURIComponent(p.id)}')">Contactar</button>`:''}${connect?`<button class="secondary-btn" onclick="toggleConnection('${encodeURIComponent(p.id)}')">${connected?'Quitar conexión':'Conectar'}</button>`:''}</div></article>`
}
function showContact(encoded){const id=decodeURIComponent(encoded);const p=communityCache.find(x=>x.id===id);if(!p)return notify('Contacto no disponible');const d=document.createElement('dialog');d.className='contact-dialog';d.innerHTML=`<div class="dialog-card"><div class="panel-head"><div><span class="eyebrow">CONTACTO PROFESIONAL</span><h2>${esc(p.name)}</h2></div><button class="icon-btn" id="closeContact">✕</button></div>${avatarMarkup(p,'profile-photo')}<p><strong>📱 Celular:</strong><br>${p.phone?`<a href="tel:${esc(p.phone)}">${esc(p.phone)}</a>`:'No registrado'}</p><p><strong>✉️ Correo:</strong><br><a href="mailto:${esc(p.email)}">${esc(p.email)}</a></p>${p.linkedin?`<p><strong>LinkedIn:</strong><br><a href="${esc(p.linkedin)}" target="_blank" rel="noopener">Abrir perfil</a></p>`:''}<button class="primary-btn full" id="closeContact2">Cerrar</button></div>`;document.body.appendChild(d);d.querySelector('#closeContact').onclick=()=>d.close();d.querySelector('#closeContact2').onclick=()=>d.close();d.addEventListener('close',()=>d.remove());d.showModal()}
window.showContact=showContact;
function toggleConnection(encoded){const id=decodeURIComponent(encoded);if(state.connections.includes(id)){state.connections=state.connections.filter(x=>x!==id);notify('Conexión eliminada')}else{state.connections.push(id);state.score+=40;state.notifications.unshift({icon:'🤝',text:'Nueva conexión profesional guardada',time:'Ahora'});notify('¡Nueva conexión profesional! +40 puntos')}persistAccount();render()}
window.toggleConnection=toggleConnection;

function opportunityCard(o){return `<article class="op-card"><span class="pill">${esc(o.type)}</span><h3>${esc(o.title)}</h3><p>${esc(o.description)}</p><div class="op-meta"><span>📍 ${esc(o.location||'Virtual')}</span><span>👤 ${esc(o.author_name||o.author||'Comunidad')}</span></div></article>`}
function calcSynergy(user,p){const a=(user.learning||[]).filter(x=>(p.skills||[]).includes(x)).length,b=(p.learning||[]).filter(x=>(user.skills||[]).includes(x)).length,c=(user.goals||[]).filter(x=>(p.goals||[]).includes(x)).length,d=(user.projects||[]).filter(x=>(p.projects||[]).includes(x)).length,e=(user.availability||[]).filter(x=>(p.availability||[]).includes(x)).length;return Math.min(99,35+a*12+b*10+c*7+d*5+e*5)}
function topicEligibility(user,topic){
  const skills=unique([...(user.skills||[]),...(user.learning||[])]);
  const knowledge=skills.filter(x=>topic.keywords.includes(x));
  const project=(user.projects||[]).filter(x=>topic.projects.includes(x));
  const goals=(user.goals||[]).filter(x=>topic.goals.includes(x));
  const completion=profileCompletion(user);
  let score=Math.min(100,knowledge.length*18+project.length*10+goals.length*8+Math.round(completion*.25));
  const reasons=[]; if(knowledge.length)reasons.push(`Afinidad técnica: ${knowledge.slice(0,3).join(', ')}`);if(project.length)reasons.push(`Experiencia relacionada: ${project.slice(0,2).join(', ')}`);if(goals.length)reasons.push(`Objetivo compatible: ${goals.slice(0,2).join(', ')}`);if(!reasons.length)reasons.push('Completa o ajusta tu ADN Profesional para mejorar la afinidad.');
  return {score,eligible:completion>=45 && score>=45,reasons,completion};
}
function topicMembers(topicId){const emails=topicMembershipCache[topicId]||[];const all=[...communityCache,currentPerson()];return emails.map(email=>all.find(p=>p.email===email)).filter(Boolean).slice(0,6)}
function emptyState(title,text,button=''){return `<div class="empty-state"><div class="empty-icon">◇</div><h3>${title}</h3><p>${text}</p>${button}</div>`}

function updateHeader(){
  const top=document.getElementById('topAvatar');if(top){if(state.user.avatar){top.innerHTML=`<img src="${state.user.avatar}" alt="Foto">`;top.classList.add('avatar-image')}else{top.textContent=initials(state.user.name);top.classList.remove('avatar-image')}}
  const badge=document.getElementById('notificationBadge');if(badge){const n=state.notifications.length;badge.textContent=n;badge.style.display=n?'inline-grid':'none'}
}
function renderDashboard(){
  app.replaceChildren(cloneTpl('dashboardTpl'));updateHeader();
  app.querySelector('[data-user-name]').textContent=(state.user.name||'Estudiante').split(' ')[0];
  document.getElementById('dashCompletion').textContent=profileCompletion(state.user)+'%';document.getElementById('dashConnections').textContent=state.connections.length;document.getElementById('dashScore').textContent=state.score;document.getElementById('dashJoinedTopics').textContent=state.joinedTopics.length;
  const summary=document.getElementById('dashRoomSummary');
  summary.innerHTML=state.joinedTopics.length?`<h3>${state.joinedTopics.length} mesa(s) en seguimiento</h3><p>${state.joinedTopics.map(id=>TOPICS.find(t=>t.id===id)?.title).filter(Boolean).join(' · ')}</p>`:`<h3>Aún no te has inscrito</h3><p>Explora los 7 temas, evalúa tu perfil y postúlate a las mesas donde puedas aportar y aprender.</p>`;
  const act=document.getElementById('activityList');act.innerHTML=state.notifications.length?state.notifications.slice(0,4).map(a=>`<div class="activity-item"><span class="activity-icon">${a.icon}</span><div><p>${esc(a.text)}</p><small>${esc(a.time)}</small></div></div>`).join(''):emptyState('Sin novedades','Tu actividad aparecerá aquí conforme uses la plataforma.');
  const opp=[...cloudOpportunities,...state.opportunities].filter((v,i,a)=>a.findIndex(x=>(x.id||x.created_at)===(v.id||v.created_at))===i).slice(0,3);document.getElementById('featuredOpportunities').innerHTML=opp.length?opp.map(opportunityCard).join(''):emptyState('Sin oportunidades todavía','Las publicaciones de la comunidad aparecerán aquí.');
  document.getElementById('heroFindRoom').onclick=()=>setRoute('matching');document.getElementById('heroCompleteProfile').onclick=()=>setRoute('profile');document.getElementById('dashExploreRooms').onclick=()=>setRoute('matching');
}
function renderProfile(){
  app.replaceChildren(cloneTpl('profileTpl'));updateHeader();const form=document.getElementById('profileForm');
  const fields=['name','phone','city','company','role','sector','specialty','experience','linkedin','bio'];fields.forEach(k=>{if(form.elements[k])form.elements[k].value=state.user[k]??''});form.elements.email.value=currentEmail;
  const paintSummary=()=>{const p=currentPerson(),photo=document.getElementById('profilePhoto');if(p.avatar){photo.innerHTML=`<img src="${p.avatar}" alt="Foto">`;photo.classList.add('avatar-image')}else{photo.textContent=initials(p.name);photo.classList.remove('avatar-image')}document.getElementById('profileDisplayName').textContent=p.name||'Sin nombre';document.getElementById('profileDisplayRole').textContent=p.role||'Sin cargo';document.getElementById('profileCity').textContent='📍 '+(p.city||'Sin ciudad');document.getElementById('profileSector').textContent='🏢 '+(p.sector||p.company||'Sin sector');document.getElementById('profileSpecialty').textContent='🧱 '+(p.specialty||'Sin especialidad');const pct=profileCompletion(state.user);document.getElementById('completionText').textContent=pct+'%';document.getElementById('completionBar').style.width=pct+'%'};paintSummary();
  document.querySelectorAll('.chip-picker').forEach(box=>{const field=box.dataset.field;box.innerHTML=TAGS[field].map(t=>`<button type="button" class="choice-chip ${(state.user[field]||[]).includes(t)?'selected':''}" data-tag="${esc(t)}">${esc(t)}</button>`).join('');box.onclick=e=>{const b=e.target.closest('[data-tag]');if(!b)return;const t=b.dataset.tag,arr=state.user[field]||[];if(arr.includes(t))state.user[field]=arr.filter(x=>x!==t);else if(arr.length<5 || field==='goals'||field==='projects')state.user[field]=[...arr,t];else return notify('Máximo 5 opciones');b.classList.toggle('selected')}});
  const slots=['Lunes 20:00','Martes 20:00','Miércoles 20:00','Jueves 20:00','Viernes 20:30','Sábado 10:00'];document.getElementById('availability').innerHTML=slots.map(t=>`<button type="button" class="choice-chip ${(state.user.availability||[]).includes(t)?'selected':''}" data-slot="${t}">${t}</button>`).join('');document.getElementById('availability').onclick=e=>{const b=e.target.closest('[data-slot]');if(!b)return;const t=b.dataset.slot;state.user.availability=state.user.availability.includes(t)?state.user.availability.filter(x=>x!==t):[...state.user.availability,t];b.classList.toggle('selected')};
  document.getElementById('avatarInput').onchange=e=>{const f=e.target.files?.[0];if(!f)return;if(f.size>2_000_000)return notify('Usa una imagen menor a 2 MB');const r=new FileReader();r.onload=()=>{state.user.avatar=r.result;paintSummary();notify('Foto lista. Guarda los cambios.')};r.readAsDataURL(f)};
  document.getElementById('saveProfileBtn').onclick=async()=>{const d=new FormData(form);fields.forEach(k=>state.user[k]=k==='experience'?Number(d.get(k)||0):String(d.get(k)||'').trim());state.user.email=currentEmail;const firstFull=!state.profileCompleted && profileCompletion(state.user)>=45;state.profileCompleted=profileCompletion(state.user)>=45;if(firstFull){state.score+=10;state.notifications.unshift({icon:'✅',text:'Completaste tu ADN Profesional',time:'Ahora'})}persistAccount();await refreshCommunity();notify('Perfil guardado correctamente');renderProfile()};
}
function renderMatching(){
  app.replaceChildren(cloneTpl('matchingTpl'));updateHeader();const grid=document.getElementById('topicsGrid');
  grid.innerHTML=TOPICS.map(t=>{const e=topicEligibility(state.user,t),members=topicMembers(t.id),joined=state.joinedTopics.includes(t.id);return `<article class="topic-card"><div class="topic-icon">${t.icon}</div><div class="topic-main"><span class="eyebrow">MESA ESTRATÉGICA</span><h2>${esc(t.title)}</h2><p>${esc(t.subtitle)}</p><div class="tag-list">${t.keywords.slice(0,3).map(k=>`<span class="tag">${esc(k)}</span>`).join('')}</div><div class="topic-meta"><span>${members.length}/6 inscritos</span><span>Tu afinidad: <strong>${e.score}%</strong></span></div><div class="topic-actions"><button class="secondary-btn" data-eval="${t.id}">Evaluar perfil</button><button class="primary-btn" data-open="${t.id}">${joined?'Ver mi mesa':'Ver mesa'}</button></div></div></article>`}).join('');
  grid.onclick=e=>{const ev=e.target.closest('[data-eval]'),op=e.target.closest('[data-open]');if(ev){const id=ev.dataset.eval,t=TOPICS.find(x=>x.id===id),r=topicEligibility(state.user,t);showEligibility(t,r)}if(op){state.selectedTopic=op.dataset.open;persistAccount();setRoute('rooms')}};
}
function showEligibility(topic,res){const d=document.createElement('dialog');d.innerHTML=`<div class="dialog-card"><div class="panel-head"><div><span class="eyebrow">EVALUACIÓN DE PERFIL</span><h2>${esc(topic.title)}</h2></div><button id="x" class="icon-btn">✕</button></div><div class="eligibility-score ${res.eligible?'ok':'warn'}"><strong>${res.score}%</strong><span>${res.eligible?'Perfil compatible':'Aún puedes fortalecer tu perfil'}</span></div><div class="reason-box"><strong>¿Por qué?</strong>${res.reasons.map(x=>`<p>✓ ${esc(x)}</p>`).join('')}<p>Perfil general completado: ${res.completion}%</p></div><button id="goRoom" class="primary-btn full">${res.eligible?'Ir a la mesa':'Ver mesa y requisitos'}</button></div>`;document.body.appendChild(d);d.querySelector('#x').onclick=()=>d.close();d.querySelector('#goRoom').onclick=()=>{state.selectedTopic=topic.id;persistAccount();d.close();setRoute('rooms')};d.addEventListener('close',()=>d.remove());d.showModal()}
function renderRooms(){
  app.replaceChildren(cloneTpl('roomsTpl'));updateHeader();const t=TOPICS.find(x=>x.id===state.selectedTopic)||TOPICS[0],elig=topicEligibility(state.user,t);let members=topicMembers(t.id);const joined=state.joinedTopics.includes(t.id);document.getElementById('roomPageTitle').textContent=t.title;document.getElementById('roomTitle').textContent=t.title;document.getElementById('roomPageDescription').textContent=t.subtitle;document.getElementById('roomCount').textContent=`${members.length}/6`;document.getElementById('roomStatus').textContent=members.length>=3?'● LISTA PARA PROGRAMAR':'EN FORMACIÓN';document.getElementById('roomSchedule').textContent=members.length>=3?'La fecha se coordina según disponibilidad común':'La sala se activa al llegar a 3 participantes';
  document.getElementById('eligibilityBox').innerHTML=`<strong>Tu evaluación: ${elig.score}%</strong><p>${elig.reasons.map(esc).join(' · ')}</p><p>${elig.eligible?'Cumples el perfil recomendado para postularte.':'Completa tu perfil o añade experiencia/intereses relacionados para mejorar tu afinidad.'}</p>`;
  document.getElementById('roomRoster').innerHTML=members.length?members.map(p=>`<div class="roster-person">${avatarMarkup(p)}<strong>${esc(p.name)}</strong><p>${esc(p.specialty||p.role)}</p><small>${p.email===currentEmail?'Tú':`Sinergia ${calcSynergy(state.user,p)}%`}</small></div>`).join(''):emptyState('Aún no hay inscritos','Los participantes aparecerán conforme se registren y se postulen a esta mesa.');
  const btn=document.getElementById('joinRoomBtn');btn.textContent=joined?'Ya estás inscrito':(elig.eligible?'Postularme a esta mesa':'Evaluar mi perfil');btn.disabled=joined || members.length>=6;
  btn.onclick=async()=>{if(!elig.eligible)return showEligibility(t,elig);if(members.length>=6)return notify('La mesa ya alcanzó 6 participantes');if(!state.joinedTopics.includes(t.id)){state.joinedTopics.push(t.id);state.score+=10;state.notifications.unshift({icon:'👥',text:`Te inscribiste en: ${t.title}`,time:'Ahora'});persistAccount();try{await joinTopicCloud(t.id)}catch{}await refreshCommunity();notify('¡Inscripción registrada!');renderRooms()}};
  members=topicMembers(t.id);const others=members.filter(p=>p.email!==currentEmail);document.getElementById('connectList').innerHTML=others.length?others.map(p=>`<label class="connect-choice"><input type="checkbox" value="${esc(p.id)}" ${state.connections.includes(p.id)?'checked':''}><div><strong>${esc(p.name)}</strong><small>${esc(p.specialty||p.role)}</small></div></label>`).join(''):emptyState('Todavía no hay contactos para seleccionar','Cuando se inscriban otros participantes podrás guardarlos en tu red.');
  document.getElementById('saveConnectionsBtn').disabled=!others.length;document.getElementById('saveConnectionsBtn').onclick=()=>{const ids=[...document.querySelectorAll('#connectList input:checked')].map(x=>x.value);const added=ids.filter(id=>!state.connections.includes(id)).length;state.connections=unique([...state.connections,...ids]);state.score+=added*40;if(added)state.notifications.unshift({icon:'🤝',text:`Guardaste ${added} nueva(s) conexión(es)`,time:'Ahora'});persistAccount();notify(`${added} conexiones nuevas guardadas`);renderRooms()};
}
function renderDirectory(){app.replaceChildren(cloneTpl('directoryTpl'));updateHeader();const specs=unique(communityCache.map(p=>p.specialty).filter(Boolean)),cities=unique(communityCache.map(p=>p.city).filter(Boolean));document.getElementById('specialtyFilter').innerHTML='<option value="">Todas las especialidades</option>'+specs.map(x=>`<option>${esc(x)}</option>`).join('');document.getElementById('cityFilter').innerHTML='<option value="">Todas las ciudades</option>'+cities.map(x=>`<option>${esc(x)}</option>`).join('');const update=()=>{const q=document.getElementById('directorySearch').value.toLowerCase(),s=document.getElementById('specialtyFilter').value,c=document.getElementById('cityFilter').value;const list=communityCache.filter(p=>(!q||JSON.stringify(p).toLowerCase().includes(q))&&(!s||p.specialty===s)&&(!c||p.city===c));document.getElementById('directoryGrid').innerHTML=list.length?list.map(p=>personCard(p)).join(''):emptyState('Directorio vacío','Los perfiles aparecerán conforme otras personas se registren y completen su ADN Profesional.')};['directorySearch','specialtyFilter','cityFilter'].forEach(id=>document.getElementById(id).addEventListener('input',update));update()}
function renderNetwork(){app.replaceChildren(cloneTpl('networkTpl'));updateHeader();const list=communityCache.filter(p=>state.connections.includes(p.id));document.getElementById('networkGrid').innerHTML=list.length?list.map(p=>personCard(p,{connect:false,contact:true})).join(''):emptyState('Aún no tienes conexiones','Participa en una Mesa Estratégica y guarda los contactos que quieras mantener.','<button class="primary-btn" data-route="matching">Explorar mesas</button>')}
function allOpportunities(){const local=state.opportunities||[];return [...cloudOpportunities,...local].filter((v,i,a)=>a.findIndex(x=>(x.id||x.created_at)===(v.id||v.created_at))===i)}
function renderOpportunities(){app.replaceChildren(cloneTpl('opportunitiesTpl'));updateHeader();const types=['Todos','Vacante','Proyecto','Consultoría','Evento','Investigación'];document.getElementById('opportunityTabs').innerHTML=types.map(t=>`<button class="tab-btn ${state.selectedOpportunityType===t?'active':''}" data-type="${t}">${t}</button>`).join('');const update=()=>{const all=allOpportunities(),list=state.selectedOpportunityType==='Todos'?all:all.filter(o=>o.type===state.selectedOpportunityType);document.getElementById('opportunityList').innerHTML=list.length?list.map(o=>`<article class="opportunity-row"><div class="op-type">${o.type==='Vacante'?'💼':o.type==='Evento'?'📅':o.type==='Investigación'?'🔬':'🏗️'}</div><div><span class="pill">${esc(o.type)}</span><h3>${esc(o.title)}</h3><p>${esc(o.description)}</p><small>📍 ${esc(o.location||'Virtual')} · ${esc(o.author_name||o.author||'Comunidad')}</small></div></article>`).join(''):emptyState('Sin publicaciones','Las oportunidades aparecerán conforme la comunidad las publique.')};document.getElementById('opportunityTabs').onclick=e=>{const b=e.target.closest('[data-type]');if(!b)return;state.selectedOpportunityType=b.dataset.type;renderOpportunities()};document.getElementById('newOpportunityBtn').onclick=()=>document.getElementById('opportunityDialog').showModal();update()}
function renderHistory(){app.replaceChildren(cloneTpl('historyTpl'));updateHeader();document.getElementById('historyTimeline').innerHTML=state.history.length?state.history.map(h=>`<article class="timeline-item"><div class="timeline-dot">✓</div><div class="timeline-card"><span class="pill">${esc(h.date)}</span><h3>${esc(h.title)}</h3><p>${esc(h.note||'')}</p></div></article>`).join(''):emptyState('Historial vacío','Tus mesas realizadas y conexiones futuras aparecerán aquí.')}
function renderScore(){app.replaceChildren(cloneTpl('scoreTpl'));updateHeader();document.getElementById('scoreValue').textContent=state.score;document.getElementById('scoreActivity').innerHTML=state.notifications.length?state.notifications.map(a=>`<div class="activity-item"><span class="activity-icon">${a.icon}</span><div><p>${esc(a.text)}</p><small>${esc(a.time)}</small></div></div>`).join(''):emptyState('Sin movimientos','Empieza a completar tu perfil, postularte a mesas y crear conexiones.')}
function renderNotifications(){app.replaceChildren(cloneTpl('notificationsTpl'));updateHeader();document.getElementById('notificationsList').innerHTML=state.notifications.length?state.notifications.map(a=>`<div class="activity-item"><span class="activity-icon">${a.icon}</span><div><p>${esc(a.text)}</p><small>${esc(a.time)}</small></div></div>`).join(''):emptyState('No tienes notificaciones','Las novedades aparecerán aquí conforme participes en la comunidad.')}

function passwordField(name,label){return `<label>${label}<div class="password-wrap"><input type="password" name="${name}" required minlength="4"><button type="button" class="password-toggle">👁</button></div></label>`}
function bindPasswordToggles(root){root.querySelectorAll('.password-toggle').forEach(b=>b.onclick=()=>{const i=b.previousElementSibling;i.type=i.type==='password'?'text':'password'})}
function authError(msg){const e=document.getElementById('authError');e.textContent=msg;e.classList.add('show')}
function showAuth(mode='login'){
  setAppVisible(false);onboardingHost.innerHTML='';authHost.innerHTML=`<div class="auth-layer"><section class="auth-phone"><div class="auth-hero"><div class="auth-logo">CN</div><h1>ConstructNet UTP</h1><p>Construyendo conexiones que construyen proyectos.</p></div><div class="auth-body"><div class="auth-tabs"><button class="auth-tab ${mode==='login'?'active':''}" data-auth-tab="login">Iniciar sesión</button><button class="auth-tab ${mode==='register'?'active':''}" data-auth-tab="register">Crear cuenta</button></div>${mode==='login'?`<form id="loginForm" class="auth-form"><h2>Bienvenido</h2><p>Ingresa para continuar con tu red profesional.</p><label>Correo electrónico<input type="email" name="email" required autocomplete="email"></label>${passwordField('password','Contraseña')}<div id="authError" class="auth-error"></div><button class="primary-btn full" type="submit">Iniciar sesión</button><div class="auth-note">Tus datos quedan guardados al actualizar la página. ${cloudEnabled?'La sincronización compartida está activada.':'Para compartir perfiles entre distintos celulares, activa Supabase con la guía incluida.'}</div></form>`:`<form id="registerForm" class="auth-form"><h2>Crea tu cuenta</h2><p>Después completarás tu ADN Profesional.</p><label>Nombres y apellidos<input name="name" required></label><label>Celular<input type="tel" name="phone" required placeholder="+51 999 999 999"></label><label>Correo electrónico<input type="email" name="email" required autocomplete="email"></label>${passwordField('password','Contraseña')}${passwordField('confirm','Confirmar contraseña')}<div id="authError" class="auth-error"></div><button class="primary-btn full" type="submit">Crear cuenta</button></form>`}</div></section></div>`;
  authHost.querySelectorAll('[data-auth-tab]').forEach(b=>b.onclick=()=>showAuth(b.dataset.authTab));bindPasswordToggles(authHost);
  const login=document.getElementById('loginForm');if(login)login.onsubmit=async e=>{e.preventDefault();const d=new FormData(login),email=String(d.get('email')).trim().toLowerCase(),pass=String(d.get('password'));const a=getAccounts().find(x=>x.email===email);if(!a||a.password!==pass)return authError('Correo o contraseña incorrectos.');loadAccount(email);authHost.innerHTML='';await refreshCommunity();if(state.profileCompleted){setAppVisible(true);render()}else showOnboarding(1)};
  const reg=document.getElementById('registerForm');if(reg)reg.onsubmit=e=>{e.preventDefault();const d=new FormData(reg),name=String(d.get('name')).trim(),phone=String(d.get('phone')).trim(),email=String(d.get('email')).trim().toLowerCase(),pass=String(d.get('password')),conf=String(d.get('confirm'));if(pass!==conf)return authError('Las contraseñas no coinciden.');if(getAccounts().some(x=>x.email===email))return authError('Ese correo ya tiene una cuenta en este dispositivo.');const accounts=getAccounts();accounts.push({email,password:pass,user:{...defaultUser,name,phone,email},connections:[],score:0,profileCompleted:false,notifications:[],history:[],opportunities:[],joinedTopics:[]});putAccounts(accounts);loadAccount(email);authHost.innerHTML='';showOnboarding(1)}
}
function chipHtml(items,selected=[],field=''){return `<div class="wizard-chips" data-wizard-field="${field}">${items.map(x=>`<button type="button" class="wizard-chip ${selected.includes(x)?'selected':''}" data-value="${esc(x)}">${esc(x)}</button>`).join('')}</div>`}
function bindWizardChips(root,field,max=5){root.querySelectorAll(`[data-wizard-field="${field}"] .wizard-chip`).forEach(b=>b.onclick=()=>{const arr=state.user[field]||[],v=b.dataset.value;if(arr.includes(v)){state.user[field]=arr.filter(x=>x!==v);b.classList.remove('selected')}else if(arr.length<max){state.user[field]=[...arr,v];b.classList.add('selected')}else notify(`Máximo ${max} opciones`)})}
function showOnboarding(step=1){
  setAppVisible(false);authHost.innerHTML='';const total=6,pct=Math.round(step/total*100);let body='';
  if(step===1)body=`<h1>Completa tu perfil base</h1><p>Estos datos serán visibles para otros estudiantes cuando formes parte de la comunidad.</p><div class="wizard-grid"><label>Nombre completo<input id="obName" value="${esc(state.user.name)}"></label><label>Celular<input id="obPhone" value="${esc(state.user.phone)}"></label><label>Ciudad<input id="obCity" value="${esc(state.user.city)}" placeholder="Ej. Chiclayo"></label><label>Empresa / entidad<input id="obCompany" value="${esc(state.user.company)}"></label><label>Cargo<input id="obRole" value="${esc(state.user.role)}"></label><label>Sector<input id="obSector" value="${esc(state.user.sector)}" placeholder="Ej. Construcción"></label><label>Especialidad<select id="obSpecialty"><option value="">Seleccionar</option><option>Gestión de proyectos</option><option>Gestión pública</option><option>BIM</option><option>Calidad</option><option>Costos y planeamiento</option><option>Residencia de obra</option><option>Seguridad / SSOMA</option><option>Contrataciones</option><option>Arquitectura y diseño</option></select></label><label>Años de experiencia<input id="obExperience" type="number" min="0" value="${state.user.experience||''}"></label></div>`;
  if(step===2)body=`<h1>¿Qué dominas?</h1><p>Selecciona hasta 5 conocimientos que puedes aportar a otros profesionales.</p>${chipHtml(TAGS.skills,state.user.skills,'skills')}`;
  if(step===3)body=`<h1>¿Qué quieres aprender?</h1><p>El motor buscará complementariedad, no perfiles idénticos.</p>${chipHtml(TAGS.learning,state.user.learning,'learning')}<div class="wizard-section"><h3>¿Qué puedes aportar además?</h3>${chipHtml(TAGS.offers,state.user.offers,'offers')}</div>`;
  if(step===4)body=`<h1>¿Qué estás buscando?</h1><p>Selecciona objetivos y tipos de proyectos que te interesan.</p><div class="wizard-section"><h3>Objetivos</h3>${chipHtml(TAGS.goals,state.user.goals,'goals')}</div><div class="wizard-section"><h3>Proyectos</h3>${chipHtml(TAGS.projects,state.user.projects,'projects')}</div>`;
  if(step===5){const slots=['Lunes 20:00','Martes 20:00','Miércoles 20:00','Jueves 20:00','Viernes 20:30','Sábado 10:00'];body=`<h1>Disponibilidad</h1><p>Selecciona tus horarios habituales para networking.</p>${chipHtml(slots,state.user.availability,'availability')}<div class="auth-note">Podrás editar todo después, incluida tu foto, celular y descripción profesional.</div>`}
  if(step===6)body=`<div class="welcome-result"><div class="big-check">✓</div><h1>¡Tu ADN Profesional está listo!</h1><p>Ahora puedes explorar los 7 temas, evaluar tu afinidad y postularte a las Mesas Estratégicas.</p><div class="value-preview"><div><strong>${profileCompletion(state.user)}%</strong><span>perfil completado</span></div><div><strong>${state.user.learning.length}</strong><span>temas por aprender</span></div><div><strong>${state.user.skills.length}</strong><span>conocimientos que aportas</span></div><div><strong>3–6</strong><span>personas por mesa</span></div></div></div>`;
  onboardingHost.innerHTML=`<div class="onboarding-layer"><section class="onboarding-phone"><div class="onboarding-head"><div class="auth-logo">CN</div><div><strong>Construye tu ADN Profesional</strong><small>Paso ${step} de ${total}</small></div></div><div class="onboarding-progress"><i style="width:${pct}%"></i></div><div class="onboarding-body">${body}</div><div class="onboarding-actions">${step>1&&step<6?'<button id="obBack" class="secondary-btn">Atrás</button>':''}<button id="obNext" class="primary-btn">${step===6?'Entrar a ConstructNet':'Continuar'}</button></div></section></div>`;
  if(step===1)document.getElementById('obSpecialty').value=state.user.specialty||'';['skills','learning','offers','goals','projects','availability'].forEach(f=>{if(onboardingHost.querySelector(`[data-wizard-field="${f}"]`))bindWizardChips(onboardingHost,f,f==='availability'?6:(f==='goals'||f==='projects'?10:5))});document.getElementById('obBack')?.addEventListener('click',()=>showOnboarding(step-1));document.getElementById('obNext').onclick=async()=>{if(step===1){state.user.name=document.getElementById('obName').value.trim();state.user.phone=document.getElementById('obPhone').value.trim();state.user.city=document.getElementById('obCity').value.trim();state.user.company=document.getElementById('obCompany').value.trim();state.user.role=document.getElementById('obRole').value.trim();state.user.sector=document.getElementById('obSector').value.trim();state.user.specialty=document.getElementById('obSpecialty').value;state.user.experience=Number(document.getElementById('obExperience').value||0);if(!state.user.name||!state.user.phone)return notify('Completa nombre y celular')}persistAccount();if(step<6)return showOnboarding(step+1);state.profileCompleted=true;persistAccount();await refreshCommunity();onboardingHost.innerHTML='';setAppVisible(true);render();notify('¡Bienvenido a ConstructNet UTP!')}
}
async function publishOpportunity(form){const d=new FormData(form),o={id:Date.now(),type:String(d.get('type')),title:String(d.get('title')),description:String(d.get('description')),location:String(d.get('location')||'Virtual'),author_name:state.user.name,author_email:currentEmail};state.opportunities.unshift(o);state.score+=15;state.notifications.unshift({icon:'💼',text:`Publicaste: ${o.title}`,time:'Ahora'});persistAccount();if(cloudEnabled){try{await cloudFetch('opportunities',{method:'POST',headers:{'Prefer':'return=minimal'},body:JSON.stringify(o)})}catch{}}await refreshCommunity();return o}
function logout(){currentEmail='';localStorage.removeItem(SESSION_KEY);state={route:'dashboard',user:{...defaultUser},connections:[],score:0,profileCompleted:false,notifications:[],history:[],opportunities:[],joinedTopics:[],selectedTopic:'bim-publico',selectedOpportunityType:'Todos'};showAuth('login')}
function render(){const map={dashboard:renderDashboard,profile:renderProfile,matching:renderMatching,rooms:renderRooms,directory:renderDirectory,network:renderNetwork,opportunities:renderOpportunities,history:renderHistory,score:renderScore,notifications:renderNotifications};(map[state.route]||renderDashboard)();bindRouteButtons();updateHeader();document.querySelectorAll('.nav-item,.bottom-item').forEach(n=>n.classList.toggle('active',n.dataset.route===state.route));app.focus({preventScroll:true})}


// ================================================================
// CONSTRUCTNET UTP v5 CLOUD - Supabase Auth + PostgreSQL
// ================================================================
const supa = (window.supabase && cloudEnabled) ? window.supabase.createClient(CLOUD.url, CLOUD.anonKey) : null;
let currentUserId = '';
const CLOUD_UI_KEY = 'constructnet_cloud_ui_v5';

function cloudTime(iso){
  if(!iso) return 'Ahora';
  const d=new Date(iso), diff=Math.max(0,Date.now()-d.getTime()),m=Math.floor(diff/60000);
  if(m<1)return 'Ahora'; if(m<60)return `Hace ${m} min`; const h=Math.floor(m/60); if(h<24)return `Hace ${h} h`; return d.toLocaleDateString('es-PE');
}
function cloudTopicByRoom(roomId){return TOPICS.find(t=>Number(t.roomId)===Number(roomId))}
function cloudTopicByName(name){return TOPICS.find(t=>t.title===name)}
function rowToPerson(r){return {id:r.id,email:r.email||'',name:r.nombre||r.email||'Profesional',phone:r.celular||'',initials:initials(r.nombre||r.email||''),avatar:r.foto_url||'',city:r.ciudad||'',specialty:r.especialidad||'',company:r.empresa||'',role:r.cargo||'',sector:r.sector||'',experience:Number(r.anios_experiencia||0),bio:r.descripcion||'',linkedin:r.linkedin||'',skills:r.conocimientos||[],learning:r.quiere_aprender||[],offers:r.puede_aportar||[],goals:r.objetivos||[],projects:r.tipos_proyecto||[],availability:r.disponibilidad||[]}}
function rowToUser(r,email=''){return {...defaultUser,name:r?.nombre||'',phone:r?.celular||'',email:r?.email||email||'',city:r?.ciudad||'',company:r?.empresa||'',role:r?.cargo||'',sector:r?.sector||'',specialty:r?.especialidad||'',experience:Number(r?.anios_experiencia||0),linkedin:r?.linkedin||'',bio:r?.descripcion||'',avatar:r?.foto_url||'',skills:r?.conocimientos||[],learning:r?.quiere_aprender||[],offers:r?.puede_aportar||[],goals:r?.objetivos||[],projects:r?.tipos_proyecto||[],availability:r?.disponibilidad||[]}}
function userToProfileRow(){const u=state.user;return {id:currentUserId,email:currentEmail,nombre:u.name||'',celular:u.phone||'',foto_url:u.avatar||'',ciudad:u.city||'',empresa:u.company||'',cargo:u.role||'',sector:u.sector||'',especialidad:u.specialty||'',anios_experiencia:Number(u.experience||0),linkedin:u.linkedin||'',descripcion:u.bio||'',conocimientos:u.skills||[],quiere_aprender:u.learning||[],puede_aportar:u.offers||[],objetivos:u.goals||[],tipos_proyecto:u.projects||[],disponibilidad:u.availability||[],networking_score:Number(state.score||0),updated_at:new Date().toISOString()}}
function currentPerson(){return {...rowToPerson(userToProfileRow()),id:currentUserId,email:currentEmail}}
function persistAccount(){
  try{localStorage.setItem(CLOUD_UI_KEY,JSON.stringify({route:state.route,selectedTopic:state.selectedTopic,selectedOpportunityType:state.selectedOpportunityType}))}catch{}
}
async function saveProfileCloud(){
  if(!supa||!currentUserId) return;
  const {error}=await supa.from('profiles').upsert(userToProfileRow(),{onConflict:'id'});
  if(error) throw error;
}
async function addCloudNotification(title,message){
  if(!supa||!currentUserId)return;
  await supa.from('notifications').insert({user_id:currentUserId,titulo:title,mensaje:message,leida:false});
}
async function changeCloudScore(delta){
  state.score=Math.max(0,Number(state.score||0)+Number(delta||0));
  if(supa&&currentUserId) await supa.from('profiles').update({networking_score:state.score,updated_at:new Date().toISOString()}).eq('id',currentUserId);
}
async function refreshConnections(){
  if(!supa||!currentUserId){state.connections=[];return}
  const {data,error}=await supa.from('connections').select('*').or(`requester_id.eq.${currentUserId},receiver_id.eq.${currentUserId}`).eq('estado','aceptada');
  if(error){console.warn(error);state.connections=[];return}
  state.connections=unique((data||[]).map(c=>c.requester_id===currentUserId?c.receiver_id:c.requester_id));
}
async function refreshCommunity(){
  if(!supa)return;
  const [{data:profiles,error:pe},{data:rooms,error:re},{data:members,error:me},{data:opps,error:oe}] = await Promise.all([
    supa.from('profiles').select('*'),
    supa.from('networking_rooms').select('*').order('id'),
    supa.from('room_members').select('*'),
    supa.from('opportunities').select('*').order('created_at',{ascending:false})
  ]);
  if(pe)console.warn(pe); if(re)console.warn(re); if(me)console.warn(me); if(oe)console.warn(oe);
  communityCache=(profiles||[]).filter(r=>r.id!==currentUserId).map(rowToPerson);
  (rooms||[]).forEach(r=>{const t=cloudTopicByName(r.nombre);if(t)t.roomId=r.id});
  topicMembershipCache={};
  (members||[]).forEach(m=>{const t=cloudTopicByRoom(m.room_id);if(t)(topicMembershipCache[t.id] ||= []).push(m.user_id)});
  cloudOpportunities=(opps||[]).map(o=>{const p=(profiles||[]).find(x=>x.id===o.user_id);return {id:o.id,type:o.tipo||'Oportunidad',title:o.titulo||'',description:o.descripcion||'',location:o.ubicacion||'Virtual',author_name:p?.nombre||'Comunidad',author_email:p?.email||'',created_at:o.created_at}});
  state.opportunities=[];
}
function topicMembers(topicId){const ids=topicMembershipCache[topicId]||[];const all=[...communityCache,currentPerson()];return ids.map(id=>all.find(p=>p.id===id)).filter(Boolean).slice(0,6)}
async function joinTopicCloud(topicId,synergy=0){
  const t=TOPICS.find(x=>x.id===topicId);if(!supa||!currentUserId||!t?.roomId)throw new Error('Mesa no disponible');
  const {error}=await supa.from('room_members').insert({room_id:t.roomId,user_id:currentUserId,sinergia:synergy,estado:'postulado'});
  if(error && !String(error.message).toLowerCase().includes('duplicate'))throw error;
}
async function createCloudConnection(otherId){
  if(!supa||!currentUserId||!otherId||otherId===currentUserId)return false;
  if(state.connections.includes(otherId))return false;
  const {error}=await supa.from('connections').insert({requester_id:currentUserId,receiver_id:otherId,estado:'aceptada'});
  if(error){console.warn(error);return false}
  state.connections.push(otherId);return true;
}
async function removeCloudConnection(otherId){
  if(!supa||!currentUserId)return;
  await supa.from('connections').delete().or(`and(requester_id.eq.${currentUserId},receiver_id.eq.${otherId}),and(requester_id.eq.${otherId},receiver_id.eq.${currentUserId})`);
  state.connections=state.connections.filter(x=>x!==otherId);
}
async function toggleConnection(encoded){
  const id=decodeURIComponent(encoded);
  try{
    if(state.connections.includes(id)){await removeCloudConnection(id);notify('Conexión eliminada')}
    else if(await createCloudConnection(id)){await changeCloudScore(40);await addCloudNotification('🤝 Nueva conexión','Guardaste una nueva conexión profesional.');notify('¡Nueva conexión profesional! +40 puntos')}
    await loadCloudNotifications();render();
  }catch(e){console.error(e);notify('No se pudo actualizar la conexión')}
}
window.toggleConnection=toggleConnection;
async function loadCloudNotifications(){
  if(!supa||!currentUserId){state.notifications=[];return}
  const {data}=await supa.from('notifications').select('*').eq('user_id',currentUserId).order('created_at',{ascending:false});
  state.notifications=(data||[]).map(n=>({icon:(n.titulo||'🔔').split(' ')[0],text:n.mensaje||n.titulo||'Notificación',time:cloudTime(n.created_at)}));
}
async function loadCloudHistory(){
  if(!supa||!currentUserId){state.history=[];return}
  const {data}=await supa.from('networking_history').select('*, networking_rooms(nombre)').eq('user_id',currentUserId).order('created_at',{ascending:false});
  state.history=(data||[]).map(h=>({date:new Date(h.created_at).toLocaleDateString('es-PE'),title:h.networking_rooms?.nombre||'Mesa Estratégica',note:`+${h.puntos||0} puntos`}));
}
async function loadCloudState(sessionUser){
  currentUserId=sessionUser.id;currentEmail=sessionUser.email||'';
  let ui={};try{ui=JSON.parse(localStorage.getItem(CLOUD_UI_KEY)||'{}')}catch{}
  const {data:profile,error}=await supa.from('profiles').select('*').eq('id',currentUserId).maybeSingle();
  if(error)console.warn(error);
  const metadata=sessionUser.user_metadata||{};
  state={route:ui.route||'dashboard',user:profile?rowToUser(profile,currentEmail):{...defaultUser,name:metadata.name||'',phone:metadata.phone||'',email:currentEmail},connections:[],score:Number(profile?.networking_score||0),profileCompleted:false,notifications:[],history:[],opportunities:[],joinedTopics:[],selectedTopic:ui.selectedTopic||'bim-publico',selectedOpportunityType:ui.selectedOpportunityType||'Todos'};
  state.profileCompleted=profileCompletion(state.user)>=45;
  await refreshCommunity();
  const {data:joins}=await supa.from('room_members').select('room_id').eq('user_id',currentUserId);
  state.joinedTopics=(joins||[]).map(j=>cloudTopicByRoom(j.room_id)?.id).filter(Boolean);
  await Promise.all([refreshConnections(),loadCloudNotifications(),loadCloudHistory()]);
}
async function fileToSmallAvatar(file){
  return new Promise((resolve,reject)=>{const reader=new FileReader();reader.onerror=reject;reader.onload=()=>{const img=new Image();img.onerror=reject;img.onload=()=>{const c=document.createElement('canvas'),size=320;c.width=size;c.height=size;const ctx=c.getContext('2d');const scale=Math.max(size/img.width,size/img.height),w=img.width*scale,h=img.height*scale;ctx.drawImage(img,(size-w)/2,(size-h)/2,w,h);resolve(c.toDataURL('image/jpeg',0.72))};img.src=reader.result};reader.readAsDataURL(file)})
}
function renderProfile(){
  app.replaceChildren(cloneTpl('profileTpl'));updateHeader();const form=document.getElementById('profileForm');
  const fields=['name','phone','city','company','role','sector','specialty','experience','linkedin','bio'];fields.forEach(k=>{if(form.elements[k])form.elements[k].value=state.user[k]??''});form.elements.email.value=currentEmail;
  const paintSummary=()=>{const p=currentPerson(),photo=document.getElementById('profilePhoto');if(p.avatar){photo.innerHTML=`<img src="${p.avatar}" alt="Foto">`;photo.classList.add('avatar-image')}else{photo.textContent=initials(p.name);photo.classList.remove('avatar-image')}document.getElementById('profileDisplayName').textContent=p.name||'Sin nombre';document.getElementById('profileDisplayRole').textContent=p.role||'Sin cargo';document.getElementById('profileCity').textContent='📍 '+(p.city||'Sin ciudad');document.getElementById('profileSector').textContent='🏢 '+(p.sector||p.company||'Sin sector');document.getElementById('profileSpecialty').textContent='🧱 '+(p.specialty||'Sin especialidad');const pct=profileCompletion(state.user);document.getElementById('completionText').textContent=pct+'%';document.getElementById('completionBar').style.width=pct+'%'};paintSummary();
  document.querySelectorAll('.chip-picker').forEach(box=>{const field=box.dataset.field;box.innerHTML=TAGS[field].map(t=>`<button type="button" class="choice-chip ${(state.user[field]||[]).includes(t)?'selected':''}" data-tag="${esc(t)}">${esc(t)}</button>`).join('');box.onclick=e=>{const b=e.target.closest('[data-tag]');if(!b)return;const t=b.dataset.tag,arr=state.user[field]||[];if(arr.includes(t))state.user[field]=arr.filter(x=>x!==t);else if(arr.length<5 || field==='goals'||field==='projects')state.user[field]=[...arr,t];else return notify('Máximo 5 opciones');b.classList.toggle('selected')}});
  const slots=['Lunes 20:00','Martes 20:00','Miércoles 20:00','Jueves 20:00','Viernes 20:30','Sábado 10:00'];document.getElementById('availability').innerHTML=slots.map(t=>`<button type="button" class="choice-chip ${(state.user.availability||[]).includes(t)?'selected':''}" data-slot="${t}">${t}</button>`).join('');document.getElementById('availability').onclick=e=>{const b=e.target.closest('[data-slot]');if(!b)return;const t=b.dataset.slot;state.user.availability=state.user.availability.includes(t)?state.user.availability.filter(x=>x!==t):[...state.user.availability,t];b.classList.toggle('selected')};
  document.getElementById('avatarInput').onchange=async e=>{const f=e.target.files?.[0];if(!f)return;if(f.size>5_000_000)return notify('Usa una imagen menor a 5 MB');try{state.user.avatar=await fileToSmallAvatar(f);paintSummary();notify('Foto lista. Guarda los cambios.')}catch{notify('No se pudo procesar la foto')}};
  document.getElementById('saveProfileBtn').onclick=async()=>{const d=new FormData(form);fields.forEach(k=>state.user[k]=k==='experience'?Number(d.get(k)||0):String(d.get(k)||'').trim());state.user.email=currentEmail;const firstFull=!state.profileCompleted && profileCompletion(state.user)>=45;state.profileCompleted=profileCompletion(state.user)>=45;try{if(firstFull){await changeCloudScore(10);await addCloudNotification('✅ Perfil completado','Completaste tu ADN Profesional.')}await saveProfileCloud();await refreshCommunity();await loadCloudNotifications();notify('Perfil guardado en la nube');renderProfile()}catch(e){console.error(e);notify('No se pudo guardar el perfil. Revisa la configuración de Supabase.')}};
}
function renderRooms(){
  app.replaceChildren(cloneTpl('roomsTpl'));updateHeader();const t=TOPICS.find(x=>x.id===state.selectedTopic)||TOPICS[0],elig=topicEligibility(state.user,t);let members=topicMembers(t.id);const joined=state.joinedTopics.includes(t.id);document.getElementById('roomPageTitle').textContent=t.title;document.getElementById('roomTitle').textContent=t.title;document.getElementById('roomPageDescription').textContent=t.subtitle;document.getElementById('roomCount').textContent=`${members.length}/6`;document.getElementById('roomStatus').textContent=members.length>=3?'● LISTA PARA PROGRAMAR':'EN FORMACIÓN';document.getElementById('roomSchedule').textContent=members.length>=3?'La fecha se coordina según disponibilidad común':'La sala se activa al llegar a 3 participantes';
  document.getElementById('eligibilityBox').innerHTML=`<strong>Tu evaluación: ${elig.score}%</strong><p>${elig.reasons.map(esc).join(' · ')}</p><p>${elig.eligible?'Cumples el perfil recomendado para postularte.':'Completa tu perfil o añade experiencia/intereses relacionados para mejorar tu afinidad.'}</p>`;
  document.getElementById('roomRoster').innerHTML=members.length?members.map(p=>`<div class="roster-person">${avatarMarkup(p)}<strong>${esc(p.name)}</strong><p>${esc(p.specialty||p.role)}</p><small>${p.id===currentUserId?'Tú':`Sinergia ${calcSynergy(state.user,p)}%`}</small></div>`).join(''):emptyState('Aún no hay inscritos','Los participantes aparecerán conforme se registren y se postulen a esta mesa.');
  const btn=document.getElementById('joinRoomBtn');btn.textContent=joined?'Ya estás inscrito':(elig.eligible?'Postularme a esta mesa':'Evaluar mi perfil');btn.disabled=joined || members.length>=6;
  btn.onclick=async()=>{if(!elig.eligible)return showEligibility(t,elig);if(members.length>=6)return notify('La mesa ya alcanzó 6 participantes');try{await joinTopicCloud(t.id,elig.score);if(!state.joinedTopics.includes(t.id))state.joinedTopics.push(t.id);await changeCloudScore(10);await addCloudNotification('👥 Mesa Estratégica',`Te inscribiste en ${t.title}.`);await refreshCommunity();await loadCloudNotifications();notify('¡Inscripción registrada en la nube!');renderRooms()}catch(e){console.error(e);notify('No se pudo registrar la inscripción')}};
  members=topicMembers(t.id);const others=members.filter(p=>p.id!==currentUserId);document.getElementById('connectList').innerHTML=others.length?others.map(p=>`<label class="connect-choice"><input type="checkbox" value="${esc(p.id)}" ${state.connections.includes(p.id)?'checked':''}><div><strong>${esc(p.name)}</strong><small>${esc(p.specialty||p.role)}</small></div></label>`).join(''):emptyState('Todavía no hay contactos para seleccionar','Cuando se inscriban otros participantes podrás guardarlos en tu red.');
  document.getElementById('saveConnectionsBtn').disabled=!others.length;document.getElementById('saveConnectionsBtn').onclick=async()=>{const ids=[...document.querySelectorAll('#connectList input:checked')].map(x=>x.value),newIds=ids.filter(id=>!state.connections.includes(id));let added=0;for(const id of newIds)if(await createCloudConnection(id))added++;if(added){await changeCloudScore(added*40);await addCloudNotification('🤝 Conexiones',`Guardaste ${added} nueva(s) conexión(es) profesional(es).`)}await refreshConnections();await loadCloudNotifications();notify(`${added} conexiones nuevas guardadas`);renderRooms()};
}
function allOpportunities(){return cloudOpportunities}
async function publishOpportunity(form){
  const d=new FormData(form),row={user_id:currentUserId,tipo:String(d.get('type')),titulo:String(d.get('title')),descripcion:String(d.get('description')),ubicacion:String(d.get('location')||'Virtual')};
  const {error}=await supa.from('opportunities').insert(row);if(error)throw error;await changeCloudScore(15);await addCloudNotification('💼 Oportunidad publicada',`Publicaste: ${row.titulo}`);await refreshCommunity();await loadCloudNotifications();return row;
}
function showAuth(mode='login'){
  setAppVisible(false);onboardingHost.innerHTML='';authHost.innerHTML=`<div class="auth-layer"><section class="auth-phone"><div class="auth-hero"><div class="auth-logo">CN</div><h1>ConstructNet UTP</h1><p>Construyendo conexiones que construyen proyectos.</p></div><div class="auth-body"><div class="auth-tabs"><button class="auth-tab ${mode==='login'?'active':''}" data-auth-tab="login">Iniciar sesión</button><button class="auth-tab ${mode==='register'?'active':''}" data-auth-tab="register">Crear cuenta</button></div>${mode==='login'?`<form id="loginForm" class="auth-form"><h2>Bienvenido</h2><p>Tu cuenta funciona en computadora y celular.</p><label>Correo electrónico<input type="email" name="email" required autocomplete="email"></label>${passwordField('password','Contraseña')}<div id="authError" class="auth-error"></div><button class="primary-btn full" type="submit">Iniciar sesión</button><div class="auth-note">Tus datos se sincronizan mediante Supabase.</div></form>`:`<form id="registerForm" class="auth-form"><h2>Crea tu cuenta</h2><p>Después completarás tu ADN Profesional.</p><label>Nombres y apellidos<input name="name" required></label><label>Celular<input type="tel" name="phone" required placeholder="+51 999 999 999"></label><label>Correo electrónico<input type="email" name="email" required autocomplete="email"></label>${passwordField('password','Contraseña')}${passwordField('confirm','Confirmar contraseña')}<div id="authError" class="auth-error"></div><button class="primary-btn full" type="submit">Crear cuenta</button></form>`}</div></section></div>`;
  authHost.querySelectorAll('[data-auth-tab]').forEach(b=>b.onclick=()=>showAuth(b.dataset.authTab));bindPasswordToggles(authHost);
  const login=document.getElementById('loginForm');if(login)login.onsubmit=async e=>{e.preventDefault();const d=new FormData(login),email=String(d.get('email')).trim().toLowerCase(),pass=String(d.get('password'));try{const {data,error}=await supa.auth.signInWithPassword({email,password:pass});if(error)throw error;authHost.innerHTML='';await loadCloudState(data.user);if(state.profileCompleted){setAppVisible(true);render()}else showOnboarding(1)}catch(err){console.error(err);authError('Correo o contraseña incorrectos, o la cuenta aún no fue confirmada.')}};
  const reg=document.getElementById('registerForm');if(reg)reg.onsubmit=async e=>{e.preventDefault();const d=new FormData(reg),name=String(d.get('name')).trim(),phone=String(d.get('phone')).trim(),email=String(d.get('email')).trim().toLowerCase(),pass=String(d.get('password')),conf=String(d.get('confirm'));if(pass!==conf)return authError('Las contraseñas no coinciden.');try{const {data,error}=await supa.auth.signUp({email,password:pass,options:{data:{name,phone}}});if(error)throw error;if(!data.session){authError('Cuenta creada. Revisa tu correo para confirmar la cuenta y luego inicia sesión.');return}currentUserId=data.user.id;currentEmail=data.user.email;state={route:'dashboard',user:{...defaultUser,name,phone,email},connections:[],score:0,profileCompleted:false,notifications:[],history:[],opportunities:[],joinedTopics:[],selectedTopic:'bim-publico',selectedOpportunityType:'Todos'};authHost.innerHTML='';showOnboarding(1)}catch(err){console.error(err);authError(err.message||'No se pudo crear la cuenta.')}};
}
function showOnboarding(step=1){
  setAppVisible(false);authHost.innerHTML='';const total=6,pct=Math.round(step/total*100);let body='';
  if(step===1)body=`<h1>Completa tu perfil base</h1><p>Estos datos serán visibles para otros estudiantes.</p><div class="wizard-grid"><label>Nombre completo<input id="obName" value="${esc(state.user.name)}"></label><label>Celular<input id="obPhone" value="${esc(state.user.phone)}"></label><label>Ciudad<input id="obCity" value="${esc(state.user.city)}" placeholder="Ej. Chiclayo"></label><label>Empresa / entidad<input id="obCompany" value="${esc(state.user.company)}"></label><label>Cargo<input id="obRole" value="${esc(state.user.role)}"></label><label>Sector<input id="obSector" value="${esc(state.user.sector)}" placeholder="Ej. Construcción"></label><label>Especialidad<select id="obSpecialty"><option value="">Seleccionar</option><option>Gestión de proyectos</option><option>Gestión pública</option><option>BIM</option><option>Calidad</option><option>Costos y planeamiento</option><option>Residencia de obra</option><option>Seguridad / SSOMA</option><option>Contrataciones</option><option>Arquitectura y diseño</option></select></label><label>Años de experiencia<input id="obExperience" type="number" min="0" value="${state.user.experience||''}"></label></div>`;
  if(step===2)body=`<h1>¿Qué dominas?</h1><p>Selecciona hasta 5 conocimientos que puedes aportar.</p>${chipHtml(TAGS.skills,state.user.skills,'skills')}`;
  if(step===3)body=`<h1>¿Qué quieres aprender?</h1><p>El motor buscará complementariedad.</p>${chipHtml(TAGS.learning,state.user.learning,'learning')}<div class="wizard-section"><h3>¿Qué puedes aportar además?</h3>${chipHtml(TAGS.offers,state.user.offers,'offers')}</div>`;
  if(step===4)body=`<h1>¿Qué estás buscando?</h1><p>Selecciona objetivos y tipos de proyectos.</p><div class="wizard-section"><h3>Objetivos</h3>${chipHtml(TAGS.goals,state.user.goals,'goals')}</div><div class="wizard-section"><h3>Proyectos</h3>${chipHtml(TAGS.projects,state.user.projects,'projects')}</div>`;
  if(step===5){const slots=['Lunes 20:00','Martes 20:00','Miércoles 20:00','Jueves 20:00','Viernes 20:30','Sábado 10:00'];body=`<h1>Disponibilidad</h1><p>Selecciona tus horarios habituales.</p>${chipHtml(slots,state.user.availability,'availability')}<div class="auth-note">Podrás editar todo después, incluida tu foto y descripción profesional.</div>`}
  if(step===6)body=`<div class="welcome-result"><div class="big-check">✓</div><h1>¡Tu ADN Profesional está listo!</h1><p>Tu información se guardará en Supabase y estará disponible en todos tus dispositivos.</p><div class="value-preview"><div><strong>${profileCompletion(state.user)}%</strong><span>perfil completado</span></div><div><strong>${state.user.learning.length}</strong><span>temas por aprender</span></div><div><strong>${state.user.skills.length}</strong><span>conocimientos que aportas</span></div><div><strong>3–6</strong><span>personas por mesa</span></div></div></div>`;
  onboardingHost.innerHTML=`<div class="onboarding-layer"><section class="onboarding-phone"><div class="onboarding-head"><div class="auth-logo">CN</div><div><strong>Construye tu ADN Profesional</strong><small>Paso ${step} de ${total}</small></div></div><div class="onboarding-progress"><i style="width:${pct}%"></i></div><div class="onboarding-body">${body}</div><div class="onboarding-actions">${step>1&&step<6?'<button id="obBack" class="secondary-btn">Atrás</button>':''}<button id="obNext" class="primary-btn">${step===6?'Entrar a ConstructNet':'Continuar'}</button></div></section></div>`;
  if(step===1)document.getElementById('obSpecialty').value=state.user.specialty||'';['skills','learning','offers','goals','projects','availability'].forEach(f=>{if(onboardingHost.querySelector(`[data-wizard-field="${f}"]`))bindWizardChips(onboardingHost,f,f==='availability'?6:(f==='goals'||f==='projects'?10:5))});document.getElementById('obBack')?.addEventListener('click',()=>showOnboarding(step-1));document.getElementById('obNext').onclick=async()=>{if(step===1){state.user.name=document.getElementById('obName').value.trim();state.user.phone=document.getElementById('obPhone').value.trim();state.user.city=document.getElementById('obCity').value.trim();state.user.company=document.getElementById('obCompany').value.trim();state.user.role=document.getElementById('obRole').value.trim();state.user.sector=document.getElementById('obSector').value.trim();state.user.specialty=document.getElementById('obSpecialty').value;state.user.experience=Number(document.getElementById('obExperience').value||0);if(!state.user.name||!state.user.phone)return notify('Completa nombre y celular')}if(step<6)return showOnboarding(step+1);try{state.profileCompleted=profileCompletion(state.user)>=45;await saveProfileCloud();if(state.profileCompleted){await changeCloudScore(10);await saveProfileCloud();await addCloudNotification('✅ Bienvenido','Tu ADN Profesional fue registrado correctamente.')}await refreshCommunity();await loadCloudNotifications();onboardingHost.innerHTML='';setAppVisible(true);render();notify('¡Perfil guardado en la nube!')}catch(e){console.error(e);notify('No se pudo guardar el perfil')}};
}
async function logout(){try{await supa?.auth.signOut()}catch{}currentUserId='';currentEmail='';state={route:'dashboard',user:{...defaultUser},connections:[],score:0,profileCompleted:false,notifications:[],history:[],opportunities:[],joinedTopics:[],selectedTopic:'bim-publico',selectedOpportunityType:'Todos'};showAuth('login')}

document.getElementById('menuBtn').onclick=()=>document.getElementById('sidebar').classList.toggle('open');
document.getElementById('logoutBtn').onclick=logout;
document.getElementById('opportunityForm').addEventListener('submit',async e=>{if(e.submitter?.value==='cancel')return;e.preventDefault();await publishOpportunity(e.currentTarget);document.getElementById('opportunityDialog').close();e.currentTarget.reset();notify('Oportunidad publicada');renderOpportunities()});

(async()=>{if(!supa){showAuth('login');notify('Supabase no está configurado');return}const {data:{session}}=await supa.auth.getSession();if(session?.user){await loadCloudState(session.user);if(state.profileCompleted){setAppVisible(true);render()}else showOnboarding(1)}else showAuth('login')})();
