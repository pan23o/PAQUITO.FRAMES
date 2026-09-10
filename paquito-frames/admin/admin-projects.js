(function(){
  const db=window.PF_SUPABASE;
  const token=()=>sessionStorage.getItem('pf_admin_token')||'';
  const $=s=>document.querySelector(s);
  const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const msg=(el,text,good=false)=>{if(el){el.textContent=text;el.className='form-status '+(good?'good':'')}};
  let projects=[];
  async function call(name,args={}){const {data,error}=await db.rpc(name,args);if(error)throw error;return data}
  async function loadProjects(){
    try{
      projects=await call('pf_admin_projects_list',{p_token:token()})||[];
      renderProjects();
      const select=$('#photoProject');
      if(select)select.innerHTML=projects.map(p=>`<option value="${p.id}">${esc(p.name)}</option>`).join('')||'<option value="">Crea primero un proyecto</option>';
      const count=$('#countProjects');if(count)count.textContent=projects.length;
      if(window.state)window.state.projects=projects;
      return projects;
    }catch(e){
      const el=$('#projectList');if(el)el.innerHTML=`<div class="empty-table"><h3>ERROR DE DATOS</h3><p>${esc(e.message||'No se pudieron cargar los proyectos.')}</p></div>`;
      return [];
    }
  }
  function renderProjects(){
    const el=$('#projectList');if(!el)return;
    if(!projects.length){el.innerHTML='<div class="empty-table"><div class="empty-icon">00</div><h3>SIN PROYECTOS</h3><p>Crea el primer proyecto para comenzar.</p></div>';return}
    el.innerHTML=projects.map(p=>`<div class="data-row"><div><small>${esc(p.category)} · ${esc(p.location||'')}</small><strong>${esc(p.name)}</strong><span>${esc(p.description||'')}</span><span class="admin-badge">${p.published?'PUBLICADO':'OCULTO'}</span></div><div class="row-actions"><button data-pf-edit="${p.id}">EDITAR</button><button data-pf-delete="${p.id}" class="danger">ELIMINAR</button><button data-pf-publish="${p.id}">${p.published?'OCULTAR':'PUBLICAR'}</button></div></div>`).join('');
    el.querySelectorAll('[data-pf-edit]').forEach(b=>b.onclick=()=>openProject(b.dataset.pfEdit));
    el.querySelectorAll('[data-pf-delete]').forEach(b=>b.onclick=()=>deleteProject(b.dataset.pfDelete));
    el.querySelectorAll('[data-pf-publish]').forEach(b=>b.onclick=()=>togglePublish(b.dataset.pfPublish));
  }
  function openProject(id){
    const p=projects.find(x=>x.id===id);
    $('#projectId').value=p?.id||'';$('#projectName').value=p?.name||'';$('#projectCategory').value=p?.category||'BOXES';$('#projectLocation').value=p?.location||'';$('#projectDate').value=p?.event_date||'';$('#projectDescription').value=p?.description||'';$('#projectPublished').checked=p?.published??true;$('#modalTitle').textContent=p?'EDITAR PROYECTO':'NUEVO PROYECTO';$('#projectStatus').textContent='';$('#projectModal').hidden=false;
  }
  async function saveProject(e){
    e.preventDefault();
    const payload={p_token:token(),p_name:$('#projectName').value.trim(),p_category:$('#projectCategory').value,p_location:$('#projectLocation').value.trim(),p_event_date:$('#projectDate').value||'',p_description:$('#projectDescription').value.trim(),p_published:$('#projectPublished').checked};
    try{if($('#projectId').value){await call('pf_admin_project_update',{...payload,p_id:$('#projectId').value})}else{await call('pf_admin_project_create',payload)}$('#projectModal').hidden=true;await loadProjects();}
    catch(err){msg($('#projectStatus'),'No se pudo guardar: '+(err.message||err))}
  }
  async function deleteProject(id){
    if(!confirm('¿Eliminar este proyecto y todas sus fotografías?'))return;
    try{await call('pf_admin_project_delete',{p_token:token(),p_id:id});await loadProjects();}
    catch(err){alert('No se pudo eliminar: '+(err.message||err))}
  }
  async function togglePublish(id){
    const p=projects.find(x=>x.id===id);if(!p)return;
    try{await call('pf_admin_project_update',{p_token:token(),p_id:id,p_name:p.name,p_category:p.category,p_location:p.location||'',p_event_date:p.event_date||'',p_description:p.description||'',p_published:!p.published});await loadProjects();}
    catch(err){alert('No se pudo cambiar la publicación: '+(err.message||err))}
  }
  function boot(){
    const form=$('#projectForm');if(form){const clone=form.cloneNode(true);form.replaceWith(clone);$('#projectForm').addEventListener('submit',saveProject)}
    const btn=$('#newProjectBtn');if(btn){const clone=btn.cloneNode(true);btn.replaceWith(clone);$('#newProjectBtn').onclick=()=>openProject()}
    window.pfProjects={loadProjects,openProject,saveProject,deleteProject,togglePublish};
    loadProjects();
  }
  window.pfProjectsBoot=boot;
  document.addEventListener('DOMContentLoaded',boot,{once:true});
})();
