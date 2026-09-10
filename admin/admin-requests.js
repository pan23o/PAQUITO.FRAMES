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
      list.innerHTML=rows.map(r=>`<article class="admin-request" data-id="${esc(r.id)}">
        <div><strong>${esc(r.name)}</strong> <span class="muted">${esc(r.email)}</span></div>
        ${r.organization?`<div>${esc(r.organization)}</div>`:''}
        ${r.project_type?`<div>${esc(r.project_type)}</div>`:''}
        ${r.message?`<p>${esc(r.message).replace(/\n/g,'<br>')}</p>`:''}
        <div class="admin-request-footer"><small>${r.created_at?new Date(r.created_at).toLocaleString('es-ES'):''}</small>
          <select class="request-status" aria-label="Estado de solicitud">
            <option value="new" ${r.status==='new'?'selected':''}>Nueva</option>
            <option value="contacted" ${r.status==='contacted'?'selected':''}>Contactada</option>
            <option value="closed" ${r.status==='closed'?'selected':''}>Cerrada</option>
          </select>
        </div></article>`).join('');
    }catch(err){console.error(err);list.innerHTML='<div class="muted">NO SE HAN PODIDO CARGAR LAS SOLICITUDES.</div>';}
  }
  async function updateStatus(id,status,select){
    const t=token(); if(!t)return;
    select.disabled=true;
    try{
      const {error}=await db.rpc('pf_admin_request_update_status',{p_token:t,p_id:id,p_status:status});
      if(error)throw error;
    }catch(err){console.error(err);alert('No se pudo actualizar el estado.');await loadRequests();}
    finally{select.disabled=false;}
  }
  function bind(){
    const list=document.getElementById('requestList'); if(!list)return;
    list.addEventListener('change',e=>{const s=e.target.closest('.request-status');if(!s)return;const row=s.closest('.admin-request');if(row)updateStatus(row.dataset.id,s.value,s);});
  }
  function boot(){if(booted)return;booted=true;bind();loadRequests();window.pfRequestsLoad=loadRequests;}
  window.pfRequestsBoot=boot;
  if(document.readyState!=='loading')setTimeout(boot,0);else document.addEventListener('DOMContentLoaded',boot,{once:true});
})();