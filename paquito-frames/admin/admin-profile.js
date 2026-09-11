(function(){
  const db=window.PF_SUPABASE;
  const API=`${window.PF_SUPABASE_URL}/functions/v1/admin-profile-photo`;
  const token=()=>sessionStorage.getItem('pf_admin_token');
  let booted=false;
  let aboutPhotoUrl='';
  const $=id=>document.getElementById(id);
  function status(text,good=false){const el=$('profileStatus');if(el){el.textContent=text;el.className='form-status '+(good?'good':'')}}
  function photoStatus(text,good=false){const el=$('aboutPhotoStatus');if(el){el.textContent=text;el.className='form-status '+(good?'good':'')}}
  function ensurePhotoUI(){
    if($('aboutPhotoManager'))return;
    const form=document.querySelector('#profile .profile-form');
    const save=$('saveProfile');
    if(!form||!save)return;
    const box=document.createElement('div');
    box.id='aboutPhotoManager';
    box.className='about-photo-manager';
    box.innerHTML=`<div class="about-photo-preview"><img id="aboutPhotoPreview" alt="Vista previa de la foto de Sobre mí" hidden><div id="aboutPhotoEmpty" class="about-photo-empty"><strong>SIN FOTO</strong><span>La imagen aparecerá aquí cuando la subas.</span></div></div><div class="about-photo-controls"><span class="about-photo-label">FOTO DE “SOBRE MÍ”</span><p>Sube la fotografía que aparecerá en el marco de la sección “Sobre mí” de la web. JPG, PNG o WEBP · máximo 15 MB.</p><label class="about-photo-picker"><span>SELECCIONAR FOTO</span><input id="aboutPhotoFile" type="file" accept="image/jpeg,image/png,image/webp"></label><div class="about-photo-actions"><button class="primary" id="uploadAboutPhoto" type="button">SUBIR / CAMBIAR FOTO ↗</button><button class="danger" id="removeAboutPhoto" type="button" disabled>ELIMINAR FOTO</button></div><p id="aboutPhotoStatus" class="form-status"></p></div>`;
    form.insertBefore(box,save);
  }
  function renderPhoto(url){
    aboutPhotoUrl=url||'';
    const img=$('aboutPhotoPreview');
    const empty=$('aboutPhotoEmpty');
    const remove=$('removeAboutPhoto');
    if(img){img.src=aboutPhotoUrl||'';img.hidden=!aboutPhotoUrl}
    if(empty)empty.hidden=!!aboutPhotoUrl;
    if(remove)remove.disabled=!aboutPhotoUrl;
  }
  async function loadProfile(){
    if(!db||!token())return;
    try{
      const {data,error}=await db.rpc('pf_admin_profile_get',{p_token:token()});
      if(error)throw error;
      const p=data;
      if(!p)return;
      $('profileBrand').value=p.brand||'';
      $('profileInstagram').value=p.instagram||'';
      $('profileEmail').value=p.email||'';
      $('profileLocation').value=p.location||'';
      $('profileBio').value=p.bio||'';
      renderPhoto(p.about_photo_url||'');
      status('Perfil cargado desde PAQUITO-FRAMES.',true);
    }catch(err){console.error(err);status('No se pudo cargar el perfil.');}
  }
  async function saveProfile(){
    const t=token();if(!t){status('La sesión de administración ha caducado.');return;}
    const button=$('saveProfile');if(button)button.disabled=true;
    status('GUARDANDO PERFIL…');
    try{
      const {data,error}=await db.rpc('pf_admin_profile_update',{p_token:t,p_brand:$('profileBrand').value.trim(),p_instagram:$('profileInstagram').value.trim(),p_email:$('profileEmail').value.trim(),p_location:$('profileLocation').value.trim(),p_bio:$('profileBio').value.trim(),p_about_photo_url:aboutPhotoUrl||null});
      if(error)throw error;
      if(data){$('profileBrand').value=data.brand||'';$('profileInstagram').value=data.instagram||'';$('profileEmail').value=data.email||'';$('profileLocation').value=data.location||'';$('profileBio').value=data.bio||'';renderPhoto(data.about_photo_url||aboutPhotoUrl)}
      status('Perfil guardado correctamente en PAQUITO-FRAMES.',true);
    }catch(err){console.error(err);status('No se pudo guardar el perfil.');}
    finally{if(button)button.disabled=false;}
  }
  async function uploadAboutPhoto(){
    const t=token();if(!t){photoStatus('La sesión de administración ha caducado.');return;}
    const input=$('aboutPhotoFile');const file=input?.files?.[0];
    if(!file){photoStatus('Selecciona una fotografía.');return;}
    if(!['image/jpeg','image/png','image/webp'].includes(file.type)){photoStatus('Solo se admiten JPG, PNG o WEBP.');return;}
    if(file.size>15*1024*1024){photoStatus('La imagen no puede superar 15 MB.');return;}
    const button=$('uploadAboutPhoto');if(button)button.disabled=true;
    photoStatus('SUBIENDO FOTOGRAFÍA…');
    try{
      const form=new FormData();form.append('file',file,file.name);
      const res=await fetch(API,{method:'POST',headers:{'x-admin-token':t,'apikey':window.PF_SUPABASE_KEY},body:form});
      const body=await res.json().catch(()=>({}));
      if(!res.ok)throw new Error(body.detail||body.error||'No se pudo subir la fotografía');
      renderPhoto(body.about_photo_url||body.profile?.about_photo_url||'');
      if(input)input.value='';
      photoStatus('Fotografía de “Sobre mí” actualizada correctamente.',true);
    }catch(err){console.error(err);photoStatus('No se pudo subir la fotografía.');}
    finally{if(button)button.disabled=false;}
  }
  async function removeAboutPhoto(){
    const t=token();if(!t){photoStatus('La sesión de administración ha caducado.');return;}
    if(!aboutPhotoUrl)return;
    if(!confirm('¿Eliminar la fotografía de “Sobre mí”?'))return;
    const button=$('removeAboutPhoto');if(button)button.disabled=true;
    photoStatus('ELIMINANDO FOTOGRAFÍA…');
    try{
      const res=await fetch(API,{method:'POST',headers:{'Content-Type':'application/json','x-admin-token':t,'apikey':window.PF_SUPABASE_KEY},body:JSON.stringify({action:'delete'})});
      const body=await res.json().catch(()=>({}));
      if(!res.ok)throw new Error(body.detail||body.error||'No se pudo eliminar la fotografía');
      renderPhoto('');photoStatus('Fotografía eliminada.',true);
    }catch(err){console.error(err);photoStatus('No se pudo eliminar la fotografía.');if(button)button.disabled=false;}
  }
  function boot(){
    if(booted)return;booted=true;ensurePhotoUI();
    const save=$('saveProfile');if(save)save.addEventListener('click',e=>{e.preventDefault();saveProfile()});
    const upload=$('uploadAboutPhoto');if(upload)upload.addEventListener('click',e=>{e.preventDefault();uploadAboutPhoto()});
    const remove=$('removeAboutPhoto');if(remove)remove.addEventListener('click',e=>{e.preventDefault();removeAboutPhoto()});
    const input=$('aboutPhotoFile');if(input)input.addEventListener('change',()=>{const f=input.files?.[0];photoStatus(f?`Seleccionada: ${f.name}`:'')});
    window.pfProfileLoad=loadProfile;loadProfile();
  }
  window.pfProfileBoot=boot;
  if(document.readyState!=='loading')setTimeout(boot,0);else document.addEventListener('DOMContentLoaded',boot,{once:true});
})();