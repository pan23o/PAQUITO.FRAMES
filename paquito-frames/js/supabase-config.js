window.PF_SUPABASE_URL='https://djfjqeiahztogacliavh.supabase.co';
window.PF_SUPABASE_KEY='sb_publishable_tm8Tid_HSYtu6cxXQ3ddKA_RWN15BSB';
window.PF_SUPABASE=window.supabase.createClient(window.PF_SUPABASE_URL,window.PF_SUPABASE_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});

// El panel de administración usa admin.js como controlador principal.
// Si ese archivo no carga por caché/ruta, levantamos un controlador de respaldo
// para que el bloque de Proyectos siga siendo utilizable.
document.addEventListener('DOMContentLoaded',()=>{
  const projectButton=document.getElementById('newProjectBtn');
  if(!projectButton)return;
  const script=document.createElement('script');
  script.src='../admin/admin-projects.js?v=20260910-1';
  script.async=false;
  document.body.appendChild(script);
});
