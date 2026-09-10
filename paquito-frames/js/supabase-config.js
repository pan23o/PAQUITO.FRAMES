window.PF_SUPABASE_URL='https://djfjqecahztogacliavh.supabase.co';
window.PF_SUPABASE_KEY='sb_publishable_tm8Tid_HSYtu6cxXQ3ddKA_RWN15BSB';
window.PF_SUPABASE=window.supabase.createClient(window.PF_SUPABASE_URL,window.PF_SUPABASE_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});

// El panel de administración usa admin.js como controlador principal.
// Dejamos un controlador de respaldo para el bloque de Proyectos por si el
// navegador conserva una versión antigua de admin.js.
document.addEventListener('DOMContentLoaded',()=>{
  const projectButton=document.getElementById('newProjectBtn');
  if(!projectButton)return;
  if(document.querySelector('script[data-pf-project-fallback]'))return;
  const script=document.createElement('script');
  script.src='../admin/admin-projects.js?v=20260910-2';
  script.async=false;
  script.dataset.pfProjectFallback='1';
  document.body.appendChild(script);
});
