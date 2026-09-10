(function(){
  const db=window.PF_SUPABASE;
  const API=`${window.PF_SUPABASE_URL}/functions/v1/admin-photos`;
  let photos=[];
  const $=s=>document.querySelector(s);
  const token=()=>sessionStorage.getItem('pf_admin_token')||'';
  const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const escAttr=esc;
  const setStatus=(text,good=false)=>{const el=$('#uploadStatus');if(!el)return;el.textContent=text;el.className='form-status '+(good?'good':'')};

  async function validSession(){
    const t=token();
    if(!t)return false;
    const {data,error}=await db.rpc('pf_admin_check',{p_token:t});
    return !error&&data===true;
  }

  async function loadProjects(){
    const select=$('#photoProject');
    if(!select)return;
    const t=token();
    if(!t){select.innerHTML='<option value="">Inicia sesión</option>';return}
    const previous=select.value;
    const {data,error}=await db.rpc('pf_admin_projects_list',{p_token:t});
    if(error){select.innerHTML='<option value="">No se pudieron cargar los proyectos</option>';return}
    const projects=data||[];
    select.innerHTML=projects.length?projects.map(p=>`<option value="${escAttr(p.id)}">${esc(p.name)}</option>`).join(''):'<option value="">Crea primero un proyecto</option>';
    if(previous&&projects.some(p=>String(p.id)===String(previous)))select.value=previous;
    if(select.value)await loadPhotos(select.value);else render([]);
  }

  async function loadPhotos(projectId){
    const box=$('#photoList');if(!box)return;
    if(!projectId){render([]);return}
    box.innerHTML='<div class="empty-table">Cargando fotografías…</div>';
    const {data,error}=await db.rpc('pf_admin_photos_list',{p_token:token(),p_project_id:projectId});
    if(error){box.innerHTML=`<div class="empty-table"><h3>NO SE PUDIERON CARGAR</h3><p>${esc(error.message)}</p></div>`;return}
    photos=data||[];render(photos);updateCount();
  }

  function render(items){
    const box=$('#photoList');if(!box)return;
    if(!items.length){box.innerHTML='<div class="empty-table"><div class="empty-icon">00</div><h3>SIN FOTOGRAFÍAS</h3><p>Este proyecto todavía no tiene fotografías.</p></div>';return}
    box.innerHTML=items.map(p=>`<div class="photo-admin-row"><img src="${escAttr(p.public_url||'')}" alt="${escAttr(p.caption||'Fotografía')}" loading="lazy"><div><strong>${esc(p.caption||'Fotografía')}</strong><small>${esc(p.storage_path||'')}</small></div><button class="danger" type="button" data-pf-delete-photo="${escAttr(p.id)}">ELIMINAR</button></div>`).join('');
    box.querySelectorAll('[data-pf-delete-photo]').forEach(btn=>btn.addEventListener('click',()=>deletePhoto(btn.dataset.pfDeletePhoto)));
  }

  async function updateCount(){
    const {data,error}=await db.rpc('pf_admin_photos_list',{p_token:token(),p_project_id:null});
    if(!error&&$('#countPhotos'))$('#countPhotos').textContent=(data||[]).length;
  }

  async function upload(){
    const projectId=$('#photoProject')?.value||'';
    const input=$('#photoFiles');
    const files=[...(input?.files||[])];
    if(!projectId){setStatus('Selecciona un proyecto.');return}
    if(!files.length){setStatus('Selecciona una o varias fotografías.');return}
    const valid=files.filter(f=>['image/jpeg','image/png','image/webp'].includes(f.type));
    if(!valid.length){setStatus('Solo se admiten JPG, PNG o WEBP.');return}
    const btn=$('#uploadBtn');if(btn)btn.disabled=true;
    let ok=0;
    setStatus(`Subiendo ${valid.length} fotografía(s)…`);
    for(let i=0;i<valid.length;i++){
      const file=valid[i];
      if(file.size>15*1024*1024){console.warn('Archivo demasiado grande:',file.name);continue}
      const form=new FormData();form.append('project_id',projectId);form.append('file',file,file.name);
      try{
        const res=await fetch(API,{method:'POST',headers:{'x-admin-token':token(),'apikey':window.PF_SUPABASE_KEY},body:form});
        const body=await res.json().catch(()=>({}));
        if(!res.ok){console.error('Error subiendo',file.name,body);continue}
        ok++;
        setStatus(`Subiendo… ${ok}/${valid.length}`);
      }catch(err){console.error(err)}
    }
    if(input)input.value='';
    setStatus(`${ok} de ${valid.length} fotografía(s) subidas.`,ok>0);
    await loadPhotos(projectId);await updateCount();
    if(window.pfProjectsBoot)window.pfProjectsBoot();
    if(btn)btn.disabled=false;
  }

  async function deletePhoto(id){
    if(!confirm('¿Eliminar esta fotografía definitivamente?'))return;
    const btn=$(`[data-pf-delete-photo="${CSS.escape(String(id))}"]`);if(btn)btn.disabled=true;
    try{
      const res=await fetch(API,{method:'POST',headers:{'Content-Type':'application/json','x-admin-token':token(),'apikey':window.PF_SUPABASE_KEY},body:JSON.stringify({action:'delete',photo_id:id})});
      const body=await res.json().catch(()=>({}));
      if(!res.ok){alert('No se pudo eliminar la fotografía: '+(body.detail||body.error||'Error desconocido'));return}
      await loadPhotos($('#photoProject')?.value||'');await updateCount();
      if(window.pfProjectsBoot)window.pfProjectsBoot();
    }catch(err){console.error(err);alert('No se pudo eliminar la fotografía.')}
    finally{if(btn)btn.disabled=false}
  }

  async function boot(){
    if(!(await validSession()))return;
    const oldSelect=$('#photoProject');
    if(oldSelect&&!oldSelect.dataset.pfSecure){const fresh=oldSelect.cloneNode(true);fresh.dataset.pfSecure='1';oldSelect.replaceWith(fresh);fresh.addEventListener('change',()=>loadPhotos(fresh.value))}
    const oldBtn=$('#uploadBtn');
    if(oldBtn&&!oldBtn.dataset.pfSecure){const fresh=oldBtn.cloneNode(true);fresh.dataset.pfSecure='1';oldBtn.replaceWith(fresh);fresh.addEventListener('click',upload)}
    await loadProjects();await updateCount();
  }

  window.pfPhotosBoot=boot;
  boot();
})();
