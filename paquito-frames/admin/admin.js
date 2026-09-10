const db=window.PF_SUPABASE;
const $=s=>document.querySelector(s);
const $$=s=>[...document.querySelectorAll(s)];
const state={user:null,projects:[],services:[],photos:[],requests:[]};
const ADMIN_NAME_HASH='1b0774cf41a44c5581377f92146efc34ebfc6ccf6a5e78c2ed5656d41bef0a04';
const ADMIN_PASSWORD_HASH='a1834cde554f4e4a79145fd3bcbedb034bcdc61e322c2a3606064633f0e8d0cb';
const ADMIN_EMAIL='paquitoframes-admin@internal.local';
const loginView=$('#loginView'),appView=$('#appView'),loginForm=$('#loginForm'),loginStatus=$('#loginStatus');
function msg(el,text,good=false){if(el){el.textContent=text;el.className='form-status '+(good?'good':'')}}
async function sha256(value){const data=new TextEncoder().encode(value);const hash=await crypto.subtle.digest('SHA-256',data);return [...new Uint8Array(hash)].map(b=>b.toString(16).padStart(2,'0')).join('')}
function showLogin(){loginView.hidden=false;appView.hidden=true}
function showApp(){loginView.hidden=true;appView.hidden=false}
async function trySupabaseAuth(password){
  try{
    const {data,error}=await db.auth.signInWithPassword({email:ADMIN_EMAIL,password});
    if(!error&&data?.session){state.user=data.user;return true}
  }catch(e){console.warn('Auth Supabase no disponible:',e)}
  return false;
}
async function loginWithCustomCredentials(username,password){
  const normalized=username.normalize('NFC').trim();
  const nameHash=await sha256(normalized);
  if(nameHash!==ADMIN_NAME_HASH)return {ok:false,error:'El nombre de administrador no es correcto.'};
  const passwordHash=await sha256(normalized+'\n'+password);
  if(passwordHash!==ADMIN_PASSWORD_HASH)return {ok:false,error:'La contraseña no es correcta.'};
  // La validación local es el acceso al panel. Intentamos además crear una sesión
  // Supabase si el usuario interno ya existe, pero nunca bloqueamos el acceso al panel
  // por un fallo de Auth: esto evita que un cambio de sesión deje inutilizado el panel.
  await trySupabaseAuth(password);
  return {ok:true};
}
async function boot(){
  if(sessionStorage.getItem('pf_admin_ok')==='1'){showApp();try{await refreshAll()}catch(e){console.error('Error cargando el panel:',e)}return}
  showLogin();
}
loginForm.addEventListener('submit',async e=>{
  e.preventDefault();
  const username=$('#adminName').value;
  const password=$('#adminPassword').value;
  const button=loginForm.querySelector('button[type="submit"]');
  if(button)button.disabled=true;
  msg(loginStatus,'Comprobando acceso…');
  try{
    const result=await loginWithCustomCredentials(username,password);
    if(!result.ok){msg(loginStatus,result.error);return}
    sessionStorage.setItem('pf_admin_ok','1');
    $('#adminPassword').value='';
    msg(loginStatus,'Acceso correcto. Cargando panel…',true);
    showApp();
    await refreshAll();
  }catch(error){
    console.error(error);
    // Si la base de datos no responde, el panel sigue siendo accesible y muestra
    // el error en cada sección en lugar de expulsar al administrador.
    sessionStorage.setItem('pf_admin_ok','1');
    showApp();
    msg(loginStatus,'Panel abierto. Algunas secciones no han podido cargar.',true);
    try{await refreshAll()}catch(e){console.error(e)}
  }finally{if(button)button.disabled=false}
});
$('#logoutBtn').addEventListener('click',async()=>{sessionStorage.removeItem('pf_admin_ok');try{await db.auth.signOut({scope:'local'})}catch(e){}location.reload()});
function showPanel(id){$$('.panel').forEach(p=>p.classList.toggle('active-panel',p.id===id));$$('.side-link').forEach(l=>l.classList.toggle('active',l.dataset.panel===id));window.scrollTo({top:0,behavior:'smooth'})}
$$('.side-link').forEach(l=>l.addEventListener('click',()=>showPanel(l.dataset.panel)));
$$('[data-panel-target]').forEach(b=>b.addEventListener('click',()=>showPanel(b.dataset.panelTarget)));
async function refreshAll(){await Promise.all([loadProjects(),loadServices(),loadRequests()]);await loadPhotoCount();updateCounts();loadLocalProfile()}
function updateCounts(){$('#countProjects').textContent=state.projects.length;$('#countServices').textContent=state.services.length;$('#countRequests').textContent=state.requests.length}
async function loadPhotoCount(){const {count,error}=await db.from('photos').select('id',{count:'exact',head:true});if(!error)$('#countPhotos').textContent=count||0}
async function loadProjects(){const {data,error}=await db.from('projects').select('*').order('created_at',{ascending:false});if(error){showDataError('projectList',error);return}state.projects=data||[];renderProjects();$('#photoProject').innerHTML=state.projects.map(p=>`<option value="${p.id}">${esc(p.name)}</option>`).join('')||'<option value="">Crea primero un proyecto</option>';if(state.projects.length)await loadProjectPhotos(state.projects[0].id)}
function renderProjects(){const el=$('#projectList');if(!state.projects.length){el.innerHTML='<div class="empty-table"><div class="empty-icon">00</div><h3>SIN PROYECTOS</h3><p>Crea el primer proyecto para comenzar.</p></div>';return}el.innerHTML=state.projects.map(p=>`<div class="data-row"><div><small>${esc(p.category)} · ${esc(p.location||'')}</small><strong>${esc(p.name)}</strong><span>${esc(p.description||'')}</span><span class="admin-badge">${p.published?'PUBLICADO':'OCULTO'}</span></div><div class="row-actions"><button data-edit-project="${p.id}">EDITAR</button><button data-delete-project="${p.id}" class="danger">ELIMINAR</button><button data-publish-project="${p.id}">${p.published?'OCULTAR':'PUBLICAR'}</button></div></div>`).join('');$$('[data-edit-project]').forEach(b=>b.onclick=()=>openProject(b.dataset.editProject));$$('[data-delete-project]').forEach(b=>b.onclick=()=>deleteProject(b.dataset.deleteProject));$$('[data-publish-project]').forEach(b=>b.onclick=()=>togglePublish(b.dataset.publishProject))}
$('#newProjectBtn').onclick=()=>openProject();
function openProject(id){const p=state.projects.find(x=>x.id===id);$('#projectId').value=p?.id||'';$('#projectName').value=p?.name||'';$('#projectCategory').value=p?.category||'BOXES';$('#projectLocation').value=p?.location||'';$('#projectDate').value=p?.event_date||'';$('#projectDescription').value=p?.description||'';$('#projectPublished').checked=p?.published??true;$('#modalTitle').textContent=p?'EDITAR PROYECTO':'NUEVO PROYECTO';$('#projectStatus').textContent='';$('#projectModal').hidden=false}
$$('[data-close]').forEach(b=>b.onclick=()=>document.getElementById(b.dataset.close).hidden=true);
window.addEventListener('keydown',e=>{if(e.key==='Escape'){$$('.modal').forEach(m=>m.hidden=true)}});
$('#projectForm').addEventListener('submit',async e=>{e.preventDefault();const payload={name:$('#projectName').value.trim(),category:$('#projectCategory').value,location:$('#projectLocation').value.trim(),event_date:$('#projectDate').value||null,description:$('#projectDescription').value.trim(),published:$('#projectPublished').checked,updated_at:new Date().toISOString()};const id=$('#projectId').value;const q=id?db.from('projects').update(payload).eq('id',id):db.from('projects').insert(payload).select().single();const {data,error}=await q;if(error){msg($('#projectStatus'),'No se pudo guardar: '+error.message);return}if(!id&&data)state.projects.unshift(data);$('#projectModal').hidden=true;await loadProjects();updateCounts()});
async function deleteProject(id){if(!confirm('¿Eliminar este proyecto y todas sus fotografías?'))return;const {data:photos}=await db.from('photos').select('storage_path').eq('project_id',id);const paths=(photos||[]).map(p=>p.storage_path).filter(Boolean);if(paths.length)await db.storage.from('paquito-photos').remove(paths);await db.from('photos').delete().eq('project_id',id);const {error}=await db.from('projects').delete().eq('id',id);if(error){alert('No se pudo eliminar: '+error.message);return}await refreshAll()}
async function togglePublish(id){const p=state.projects.find(x=>x.id===id);if(!p)return;const {error}=await db.from('projects').update({published:!p.published,updated_at:new Date().toISOString()}).eq('id',id);if(error){alert('No se pudo cambiar la publicación: '+error.message);return}await loadProjects()}
async function loadServices(){const {data,error}=await db.from('services').select('*').order('sort_order');if(error){showDataError('serviceList',error);return}state.services=data||[];const el=$('#serviceList');el.innerHTML=state.services.map(s=>`<div class="service-edit" data-service="${s.id}"><span>${String(s.sort_order).padStart(2,'0')}</span><div><input class="svc-name" value="${escAttr(s.name)}"><textarea class="svc-desc">${esc(s.description||'')}</textarea></div><input class="svc-price" value="${escAttr(s.price||'')}" placeholder="Precio"><label class="svc-active"><input class="svc-on" type="checkbox" ${s.active?'checked':''}> ACTIVO</label><button class="primary save-service">GUARDAR</button><button class="danger delete-service">ELIMINAR</button></div>`).join('')||'<div class="empty-table">No hay servicios.</div>';$$('.save-service').forEach(b=>b.onclick=()=>saveService(b.closest('.service-edit')));$$('.delete-service').forEach(b=>b.onclick=()=>deleteService(b.closest('.service-edit').dataset.service))}
$('#newServiceBtn').onclick=async()=>{const {error}=await db.from('services').insert({name:'NUEVO SERVICIO',description:'',price:'',sort_order:state.services.length+1,active:true});if(error)alert('No se pudo crear: '+error.message);else await loadServices()};
async function saveService(row){const id=row.dataset.service;const {error}=await db.from('services').update({name:row.querySelector('.svc-name').value.trim(),description:row.querySelector('.svc-desc').value.trim(),price:row.querySelector('.svc-price').value.trim(),active:row.querySelector('.svc-on').checked,updated_at:new Date().toISOString()}).eq('id',id);if(error){alert('No se pudo guardar: '+error.message);return}await loadServices()}
async function deleteService(id){if(!confirm('¿Eliminar este servicio?'))return;const {error}=await db.from('services').delete().eq('id',id);if(error)alert('No se pudo eliminar: '+error.message);else await loadServices()}
$('#photoProject').addEventListener('change',e=>loadProjectPhotos(e.target.value));
async function loadProjectPhotos(projectId){const box=$('#photoList');if(!box)return;if(!projectId){box.innerHTML='';return}const {data,error}=await db.from('photos').select('*').eq('project_id',projectId).order('sort_order');if(error){box.innerHTML=`<div class="empty-table">${esc(error.message)}</div>`;return}state.photos=data||[];box.innerHTML=state.photos.length?state.photos.map(p=>`<div class="photo-admin-row"><img src="${escAttr(p.public_url)}" alt=""><div><strong>${esc(p.caption||'Fotografía')}</strong><small>${esc(p.storage_path||'')}</small></div><button class="danger" data-delete-photo="${p.id}">ELIMINAR</button></div>`).join(''):'<div class="empty-table">Este proyecto todavía no tiene fotografías.</div>';$$('[data-delete-photo]').forEach(b=>b.onclick=()=>deletePhoto(b.dataset.deletePhoto))}
async function deletePhoto(id){if(!confirm('¿Eliminar esta fotografía?'))return;const photo=state.photos.find(p=>String(p.id)===String(id));if(!photo)return;if(photo.storage_path)await db.storage.from('paquito-photos').remove([photo.storage_path]);const {error}=await db.from('photos').delete().eq('id',id);if(error){alert('No se pudo eliminar: '+error.message);return}await loadProjectPhotos($('#photoProject').value);await loadPhotoCount()}
$('#uploadBtn').onclick=async()=>{const projectId=$('#photoProject').value,files=[...$('#photoFiles').files];if(!projectId){msg($('#uploadStatus'),'Selecciona un proyecto.');return}if(!files.length){msg($('#uploadStatus'),'Selecciona fotografías.');return}const valid=files.filter(f=>f.type.startsWith('image/'));msg($('#uploadStatus'),`Subiendo ${valid.length} fotografía(s)…`);let ok=0;for(let i=0;i<valid.length;i++){const f=valid[i];const ext=(f.name.split('.').pop()||'jpg').toLowerCase();const path=`projects/${projectId}/${crypto.randomUUID()}.${ext}`;const {error:up}=await db.storage.from('paquito-photos').upload(path,f,{cacheControl:'31536000',upsert:false,contentType:f.type});if(up){console.error(up);continue}const {data:urlData}=db.storage.from('paquito-photos').getPublicUrl(path);const {error:ins}=await db.from('photos').insert({project_id:projectId,storage_path:path,public_url:urlData.publicUrl,caption:f.name,sort_order:state.photos.length+i});if(ins){await db.storage.from('paquito-photos').remove([path]);continue}ok++;if(i===0){await db.from('projects').update({cover_url:urlData.publicUrl,updated_at:new Date().toISOString()}).eq('id',projectId)}}msg($('#uploadStatus'),`${ok} de ${valid.length} fotografías subidas.`,true);$('#photoFiles').value='';await loadProjectPhotos(projectId);await loadProjects();await loadPhotoCount()};
async function loadRequests(){const {data,error}=await db.from('requests').select('*').order('created_at',{ascending:false});const el=$('#requestList');if(error){showDataError('requestList',error);return}state.requests=data||[];if(!state.requests.length){el.innerHTML='<div class="empty-table"><div class="empty-icon">00</div><h3>SIN SOLICITUDES</h3><p>Aquí aparecerán los contactos de la web.</p></div>';return}el.innerHTML=state.requests.map(r=>`<div class="request-row"><div><small>${new Date(r.created_at).toLocaleString('es-ES')}</small><strong>${esc(r.name)} · ${esc(r.email)}</strong><span>${esc(r.organization||'')} · ${esc(r.project_type||'')}</span><p>${esc(r.message||'')}</p></div><select data-request-status="${r.id}"><option value="new" ${r.status==='new'?'selected':''}>Nueva</option><option value="contacted" ${r.status==='contacted'?'selected':''}>Contactada</option><option value="closed" ${r.status==='closed'?'selected':''}>Cerrada</option></select></div>`).join('');$$('[data-request-status]').forEach(s=>s.onchange=async()=>{const {error}=await db.from('requests').update({status:s.value}).eq('id',s.dataset.requestStatus);if(error)alert('No se pudo actualizar: '+error.message);else await loadRequests()})}
$('#saveProfile').onclick=()=>{const profile={brand:$('#profileBrand').value.trim(),instagram:$('#profileInstagram').value.trim(),email:$('#profileEmail').value.trim(),location:$('#profileLocation').value.trim(),bio:$('#profileBio').value.trim()};localStorage.setItem('paquito_profile',JSON.stringify(profile));msg($('#profileStatus'),'Perfil guardado en este navegador.',true)};
function loadLocalProfile(){try{const p=JSON.parse(localStorage.getItem('paquito_profile')||'null');if(!p)return;$('#profileBrand').value=p.brand||'';$('#profileInstagram').value=p.instagram||'';$('#profileEmail').value=p.email||'';$('#profileLocation').value=p.location||'';$('#profileBio').value=p.bio||''}catch(e){}}
function showDataError(id,error){const el=$('#'+id);if(el)el.innerHTML=`<div class="empty-table"><h3>ERROR DE DATOS</h3><p>${esc(error?.message||'No se pudo cargar la información.')}</p><small>La sesión de Supabase puede no estar activa o las políticas RLS pueden bloquear esta operación.</small></div>`}
function esc(v){return String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
function escAttr(v){return esc(v)}
loadLocalProfile();
boot();
