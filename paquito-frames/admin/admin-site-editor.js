(function(){
  const db=window.PF_SUPABASE;
  const $=id=>document.getElementById(id);
  let booted=false;
  let content={};
  const fields=[
    {group:'Navegación',key:'nav_portfolio',label:'Portfolio',selector:'.nav a:nth-child(1)',type:'text'},
    {group:'Navegación',key:'nav_services',label:'Servicios',selector:'.nav a:nth-child(2)',type:'text'},
    {group:'Navegación',key:'nav_about',label:'Sobre mí',selector:'.nav a:nth-child(3)',type:'text'},
    {group:'Navegación',key:'nav_contact',label:'Contacto',selector:'.nav .nav-cta',type:'text'},
    {group:'Inicio',key:'hero_eyebrow',label:'Texto superior',selector:'.hero-copy .eyebrow',type:'text'},
    {group:'Inicio',key:'hero_title',label:'Título principal (HTML)',selector:'.hero-copy h1',type:'html'},
    {group:'Inicio',key:'hero_text',label:'Descripción',selector:'.hero-copy .hero-text',type:'text'},
    {group:'Inicio',key:'hero_button',label:'Botón principal',selector:'.hero-copy .button',type:'text'},
    {group:'Trabajos',key:'work_eyebrow',label:'Texto superior',selector:'#work .section-heading .eyebrow',type:'text'},
    {group:'Trabajos',key:'work_title',label:'Título',selector:'#work .section-heading h2',type:'html'},
    {group:'Trabajos',key:'work_intro',label:'Descripción',selector:'#work .section-intro',type:'text'},
    {group:'Trabajos',key:'work_link',label:'Enlace',selector:'#work .text-link',type:'text'},
    {group:'Servicios',key:'services_eyebrow',label:'Texto superior',selector:'#services .services-top .eyebrow',type:'text'},
    {group:'Servicios',key:'services_title',label:'Título',selector:'#services .services-top h2',type:'html'},
    {group:'Servicios',key:'services_intro',label:'Descripción',selector:'#services .services-top .section-intro',type:'text'},
    {group:'Sobre mí',key:'about_eyebrow',label:'Texto superior',selector:'#about .about-copy .eyebrow',type:'text'},
    {group:'Sobre mí',key:'about_title',label:'Título',selector:'#about .about-copy h2',type:'html'},
    {group:'Sobre mí',key:'about_text_1',label:'Primer párrafo',selector:'#about .about-copy p:nth-of-type(2)',type:'text'},
    {group:'Sobre mí',key:'about_text_2',label:'Segundo párrafo',selector:'#about .about-copy p:nth-of-type(3)',type:'text'},
    {group:'Sobre mí',key:'about_link',label:'Enlace',selector:'#about .text-link',type:'text'},
    {group:'Contacto',key:'contact_eyebrow',label:'Texto superior',selector:'#contact .eyebrow',type:'text'},
    {group:'Contacto',key:'contact_title',label:'Título',selector:'#contact h2',type:'html'},
    {group:'Contacto',key:'contact_button',label:'Botón',selector:'#contact .button',type:'text'},
    {group:'Contacto',key:'contact_social',label:'Instagram',selector:'#contact .social-link',type:'text'},
    {group:'Formulario',key:'request_eyebrow',label:'Texto superior',selector:'#request .eyebrow',type:'text'},
    {group:'Formulario',key:'request_title',label:'Título',selector:'#request h2',type:'html'},
    {group:'Formulario',key:'request_intro',label:'Descripción',selector:'#request .section-intro',type:'text'},
    {group:'Formulario',key:'request_name',label:'Placeholder nombre',selector:'#request input[name="name"]',type:'placeholder'},
    {group:'Formulario',key:'request_email',label:'Placeholder email',selector:'#request input[name="email"]',type:'placeholder'},
    {group:'Formulario',key:'request_org',label:'Placeholder empresa',selector:'#request input[name="organization"]',type:'placeholder'},
    {group:'Formulario',key:'request_message',label:'Placeholder mensaje',selector:'#request textarea[name="message"]',type:'placeholder'},
    {group:'Formulario',key:'request_button',label:'Botón enviar',selector:'#request .button',type:'text'},
    {group:'Pie de página',key:'footer_back',label:'Enlace volver arriba',selector:'.site-footer a:last-child',type:'text'}
  ];
  function defaults(){const out={};fields.forEach(f=>{const el=document.querySelector(f.selector);if(!el)return;out[f.key]=f.type==='placeholder'?el.getAttribute('placeholder')||'':f.type==='html'?el.innerHTML:el.textContent.trim()});return out}
  function token(){return sessionStorage.getItem('pf_admin_token')||''}
  function apply(next){content={...defaults(),...(next||{})};fields.forEach(f=>{const el=document.querySelector(f.selector);if(!el)return;const v=content[f.key]??'';if(f.type==='placeholder')el.setAttribute('placeholder',v);else if(f.type==='html')el.innerHTML=v;else el.textContent=v});const iframe=$('sitePreviewFrame');if(iframe?.contentWindow)iframe.contentWindow.postMessage({type:'pf-preview-content',content},location.origin)}
  function render(){const box=$('siteEditorFields');if(!box)return;let group='';let html='';fields.forEach(f=>{if(f.group!==group){group=f.group;html+=`<div class="site-editor-group"><h3>${f.group}</h3>`}html+=`<label class="site-editor-field"><span>${f.label}</span>${f.type==='html'?`<textarea data-content-key="${f.key}" rows="3"></textarea>`:`<input data-content-key="${f.key}" type="text">`}</label>`;const next=fields[fields.indexOf(f)+1];if(!next||next.group!==group)html+='</div>'});box.innerHTML=html;fields.forEach(f=>{const el=box.querySelector(`[data-content-key="${f.key}"]`);if(el)el.value=content[f.key]??''});box.querySelectorAll('[data-content-key]').forEach(el=>{el.addEventListener('input',()=>{content[el.dataset.contentKey]=el.value;apply(content)})})}
  async function load(){if(!db||!token())return;try{const {data,error}=await db.rpc('pf_admin_profile_get',{p_token:token()});if(error)throw error;apply(data?.site_content||{});render()}catch(e){console.error(e);apply({});render()}}
  async function save(){const button=$('saveSiteContent');const status=$('siteEditorStatus');if(button)button.disabled=true;if(status)status.textContent='GUARDANDO CAMBIOS…';try{const {data:profile,error}=await db.rpc('pf_admin_profile_update',{p_token:token(),p_brand:document.getElementById('profileBrand')?.value.trim()||'',p_instagram:document.getElementById('profileInstagram')?.value.trim()||'',p_email:document.getElementById('profileEmail')?.value.trim()||'',p_location:document.getElementById('profileLocation')?.value.trim()||'',p_bio:document.getElementById('profileBio')?.value.trim()||'',p_about_photo_url:null,p_site_content:content});if(error)throw error;if(profile?.site_content)content=profile.site_content;apply(content);render();if(status){status.textContent='CAMBIOS GUARDADOS CORRECTAMENTE.';status.className='form-status good'}}catch(e){console.error(e);if(status){status.textContent='NO SE PUDIERON GUARDAR LOS CAMBIOS.';status.className='form-status'}}finally{if(button)button.disabled=false}}
  function bind(){const save=$('saveSiteContent');if(save)save.onclick=save;const iframe=$('sitePreviewFrame');if(iframe)iframe.addEventListener('load',()=>iframe.contentWindow.postMessage({type:'pf-preview-content',content},location.origin));window.addEventListener('message',e=>{if(e.origin!==location.origin||e.data?.type!=='pf-preview-ready')return;iframe?.contentWindow.postMessage({type:'pf-preview-content',content},location.origin)})}
  function boot(){if(booted)return;booted=true;bind();apply({});render();load()}
  window.pfSiteEditorBoot=boot;
  if(document.readyState!=='loading')setTimeout(boot,0);else document.addEventListener('DOMContentLoaded',boot,{once:true});
})();
