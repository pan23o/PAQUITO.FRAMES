(function(){
  const db=window.PF_SUPABASE;
  const token=()=>sessionStorage.getItem('pf_admin_token');
  const esc=v=>String(v??'').replace(/[&<>\"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[m]));
  let booted=false;
  async function loadRequests(){
    const list=document.getElementById('requestList'); if(!list||!db)return;
    const t=token(); if(!t){list.innerHTML='';return;}
    list.innerHTML='<div class="muted">CARGANDO SOLICITUDES…</div>';
    try{
      const {data,error}=await db.rpc('pf_admin_requests_list',{p_token:t});
      if(error)throw error;
      const rows=data||[];
      const count=document.getElementById('countRequests'); if(count)count.textContent=rows.length;
      if(!rows.length){list.innerHTML='<div class="muted">NO HAY SOLICITUDES.</div>';return;}
      list.innerHTML=rows.map(r=>{
        const status=['new','contacted','closed'].includes(r.status)?r.status:'new';
        const label=status==='new'?'NUEVA':status==='contacted'?'CONTACTADA':'CERRADA';
        return `<article class="admin-request request-status-${status}" data-id="${esc(r.id)}">
          <div class="request-main">
            <div class="request-head"><div><strong>${esc(r.name)}</strong> <span class="muted">${esc(r.email)}</span></div><span class="request-state">${label}</span></div>
            ${r.organization?`<div>${esc(r.organization)}</div>`:''}
            ${r.project_type?`<div>${esc(r.project_type)}</div>`:''}
            ${r.message?`<p>${esc(r.message).replace(/\n/g,'<br>')}</p>`:''}
          </div>
          <div class="admin-request-footer">
            <small>${r.created_at?new Date(r.created_at).toLocaleString('es-ES'):''}</small>
            <div class="request-actions">
              <select class="request-status" aria-label="Estado de solicitud">
                <option value="new" ${status==='new'?'selected':''}>Nueva</option>
                <option value="contacted" ${status==='contacted'?'selected':''}>Contactada</option>
                <option value="closed" ${status==='closed'?'selected':''}>Cerrada</option>
              </select>
              <button type="button" class="request-delete danger" data-delete-request="${esc(r.id)}">ELIMINAR</button>
            </div>
          </div>
        </article>`;
      }).join('');
    }catch(err){console.error(err);list.innerHTML='<div class="muted">NO SE HAN PODIDO CARGAR LAS SOLICITUDES.</div>';}
  }
  async function updateStatus(id,status,select){
    const t=token(); if(!t)return;
    select.disabled=true;
    try{
      const {error}=await db.rpc('pf_admin_request_update_status',{p_token:t,p_id:id,p_status:status});
      if(error)throw error;
      const row=select.closest('.admin-request');
      if(row){row.classList.remove('request-status-new','request-status-contacted','request-status-closed');row.classList.add('request-status-'+status);const badge=row.querySelector('.request-state');if(badge)badge.textContent=status==='new'?'NUEVA':status==='contacted'?'CONTACTADA':'CERRADA';}
    }catch(err){console.error(err);alert('No se pudo actualizar el estado.');await loadRequests();}
    finally{select.disabled=false;}
  }
  async function deleteRequest(id,button){
    if(!confirm('¿Eliminar esta solicitud? Esta acción no se puede deshacer.'))return;
    const t=token(); if(!t)return;
    if(button)button.disabled=true;
    try{
      const {error}=await db.rpc('pf_admin_request_delete',{p_token:t,p_id:id});
      if(error)throw error;
      await loadRequests();
    }catch(err){console.error(err);alert('No se pudo eliminar la solicitud.');if(button)button.disabled=false;}
  }
  function bind(){
    const list=document.getElementById('requestList'); if(!list)return;
    list.addEventListener('change',e=>{const s=e.target.closest('.request-status');if(!s)return;const row=s.closest('.admin-request');if(row)updateStatus(row.dataset.id,s.value,s);});
    list.addEventListener('click',e=>{const b=e.target.closest('[data-delete-request]');if(b)deleteRequest(b.dataset.deleteRequest,b);});
  }
  function boot(){if(booted)return;booted=true;bind();loadRequests();window.pfRequestsLoad=loadRequests;}
  window.pfRequestsBoot=boot;
  if(document.readyState!=='loading')setTimeout(boot,0);else document.addEventListener('DOMContentLoaded',boot,{once:true});
})();