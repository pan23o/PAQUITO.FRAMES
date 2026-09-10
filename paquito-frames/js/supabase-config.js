window.PF_SUPABASE_URL='https://ehbtqqphpoglufwoazwp.supabase.co';
window.PF_SUPABASE_KEY='sb_publishable_qMuZQMoKd3wjJeMfktLfmw_7E8NL5pY';
window.PF_SUPABASE=window.supabase.createClient(window.PF_SUPABASE_URL,window.PF_SUPABASE_KEY,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}});

(function(){
  const db=window.PF_SUPABASE;
  document.addEventListener('submit',async function(e){
    const form=e.target;if(!form||form.id!=='loginForm')return;
    e.preventDefault();e.stopImmediatePropagation();
    const name=document.getElementById('adminName'),pass=document.getElementById('adminPassword'),status=document.getElementById('loginStatus');
    const button=form.querySelector('button[type="submit"]');if(button)button.disabled=true;
    if(status)status.textContent='COMPROBANDO ACCESO…';
    try{
      const {data,error}=await db.rpc('pf_admin_login',{p_username:name.value,p_password:pass.value});
      if(error||!data){if(status)status.textContent='NOMBRE O CONTRASEÑA INCORRECTOS.';return}
      sessionStorage.setItem('pf_admin_token',data);
      sessionStorage.removeItem('pf_admin_ok');
      pass.value='';
      document.getElementById('loginView').hidden=true;document.getElementById('appView').hidden=false;
      if(status)status.textContent='ACCESO CORRECTO.';
      if(window.pfProjectsBoot)window.pfProjectsBoot();
      if(window.pfPhotosBoot)window.pfPhotosBoot();
    }catch(err){console.error(err);if(status)status.textContent='ERROR AL COMPROBAR EL ACCESO.'}
    finally{if(button)button.disabled=false}
  },true);

  document.addEventListener('click',async function(e){
    const btn=e.target.closest?.('#logoutBtn');if(!btn)return;
    e.preventDefault();e.stopImmediatePropagation();
    const t=sessionStorage.getItem('pf_admin_token');
    if(t){try{await db.rpc('pf_admin_logout',{p_token:t})}catch(err){console.warn(err)}}
    sessionStorage.removeItem('pf_admin_token');sessionStorage.removeItem('pf_admin_ok');
    document.getElementById('appView').hidden=true;document.getElementById('loginView').hidden=false;
    const s=document.getElementById('loginStatus');if(s)s.textContent='SESIÓN CERRADA.';
  },true);

  document.addEventListener('DOMContentLoaded',()=>{
    const projects=document.createElement('script');projects.src='../admin/admin-projects.js?v=20260910-12';projects.defer=false;document.body.appendChild(projects);
    const photos=document.createElement('script');photos.src='../admin/admin-photos.js?v=20260910-1';photos.defer=false;document.body.appendChild(photos);
  },{once:true});
})();
