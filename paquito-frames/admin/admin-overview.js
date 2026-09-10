(function(){
  'use strict';
  const db=window.PF_SUPABASE;
  const $=s=>document.querySelector(s);
  async function count(table){
    const {count,error}=await db.from(table).select('id',{count:'exact',head:true});
    if(error) throw error;
    return Number(count||0);
  }
  async function refreshOverview(){
    if(!db)return;
    const targets={projects:$('#countProjects'),photos:$('#countPhotos'),services:$('#countServices'),requests:$('#countRequests')};
    try{
      const results=await Promise.all([
        count('projects'),count('photos'),count('services'),count('requests')
      ]);
      targets.projects.textContent=results[0];
      targets.photos.textContent=results[1];
      targets.services.textContent=results[2];
      targets.requests.textContent=results[3];
      [targets.projects,targets.photos,targets.services,targets.requests].forEach(el=>el?.removeAttribute('data-error'));
    }catch(error){
      console.error('Error actualizando resumen:',error);
      [targets.projects,targets.photos,targets.services,targets.requests].forEach(el=>{if(el)el.setAttribute('data-error','1')});
    }
  }
  window.PF_REFRESH_OVERVIEW=refreshOverview;
  document.addEventListener('DOMContentLoaded',()=>{
    refreshOverview();
    document.addEventListener('visibilitychange',()=>{if(!document.hidden)refreshOverview()});
  });
})();
