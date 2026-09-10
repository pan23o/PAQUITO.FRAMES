(function(){
  const db=window.PF_SUPABASE;
  const token=()=>sessionStorage.getItem('pf_admin_token');
  let booted=false;
  const $=id=>document.getElementById(id);
  function status(text,good=false){const el=$('profileStatus');if(el){el.textContent=text;el.className='form-status '+(good?'good':'')}}
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
      status('Perfil cargado desde PAQUITO-FRAMES.',true);
    }catch(err){console.error(err);status('No se pudo cargar el perfil.');}
  }
  async function saveProfile(){
    const t=token();if(!t){status('La sesión de administración ha caducado.');return;}
    const button=$('saveProfile');if(button)button.disabled=true;
    status('GUARDANDO PERFIL…');
    try{
      const {data,error}=await db.rpc('pf_admin_profile_update',{p_token:t,p_brand:$('profileBrand').value.trim(),p_instagram:$('profileInstagram').value.trim(),p_email:$('profileEmail').value.trim(),p_location:$('profileLocation').value.trim(),p_bio:$('profileBio').value.trim()});
      if(error)throw error;
      if(data){
        $('profileBrand').value=data.brand||'';$('profileInstagram').value=data.instagram||'';$('profileEmail').value=data.email||'';$('profileLocation').value=data.location||'';$('profileBio').value=data.bio||'';
      }
      status('Perfil guardado correctamente en PAQUITO-FRAMES.',true);
    }catch(err){console.error(err);status('No se pudo guardar el perfil.');}
    finally{if(button)button.disabled=false;}
  }
  function boot(){if(booted)return;booted=true;const b=$('saveProfile');if(b)b.addEventListener('click',e=>{e.preventDefault();saveProfile()});window.pfProfileLoad=loadProfile;loadProfile();}
  window.pfProfileBoot=boot;
  if(document.readyState!=='loading')setTimeout(boot,0);else document.addEventListener('DOMContentLoaded',boot,{once:true});
})();