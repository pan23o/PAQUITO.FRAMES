const db=window.PF_SUPABASE;
const grid=document.getElementById('projectGrid');
const lightbox=document.getElementById('lightbox');
const close=document.getElementById('closeLightbox');
const visual=document.getElementById('lightboxVisual');
const titleEl=document.getElementById('lightboxTitle');
const metaEl=document.getElementById('lightboxMeta');
const galleryEl=document.getElementById('lightboxGallery');

const categoryNames={boxes:'BOXES',box:'BOXES',training:'ENTRENAMIENTO',competition:'COMPETICIÓN',athletes:'ATLETAS',events:'EVENTOS',event:'EVENTOS',other:'OTROS'};
const translateCategory=v=>categoryNames[String(v??'').trim().toLowerCase()]||String(v||'PROYECTO').toUpperCase();
const esc=v=>String(v??'').replace(/[&<>\"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[m]));
const escAttr=v=>esc(v).replace(/'/g,'%27');

let cards=[];
let currentPhotos=[];
let currentIndex=-1;

const demo=[
  ['training','EL DÍA A DÍA','Entrenamiento · Gibraltar · 2026','tone-a'],
  ['athletes','SIN REPETICIONES FÁCILES','Atletas · Gibraltar · 2026','tone-b'],
  ['boxes','HECHO EN COMUNIDAD','Boxes · Gibraltar · 2026','tone-c'],
  ['competition','CUANDO IMPORTA','Competición · Gibraltar · 2026','tone-d']
];

function renderDemo(){
  if(!grid)return;
  grid.innerHTML=demo.map((x,i)=>`<article class="project ${i===0?'project-large':''}" data-category="${x[0]}" data-title="${x[1]}" data-meta="${x[2]}"><div class="project-image ${x[3]}"><span>${String(i+1).padStart(2,'0')}</span></div><div class="project-meta"><span>${translateCategory(x[0])}</span><strong>${esc(x[1])}</strong></div></article>`).join('');
  cards=[...grid.querySelectorAll('.project')];
  cards.forEach(c=>c.addEventListener('click',()=>openCard(c,[])));
}

function renderProjects(projects,photos){
  if(!grid||!Array.isArray(projects)||!projects.length){renderDemo();return;}
  const firstPhoto=new Map();
  (photos||[]).forEach(ph=>{if(ph?.public_url&&!firstPhoto.has(ph.project_id))firstPhoto.set(ph.project_id,ph.public_url)});
  grid.innerHTML=projects.map((p,i)=>{
    const cover=p.cover_url||firstPhoto.get(p.id)||'';
    const category=(p.category||'other').toLowerCase();
    const meta=[translateCategory(p.category),p.location,p.event_date].filter(Boolean).join(' · ');
    return `<article class="project ${i===0?'project-large':''}" data-id="${escAttr(p.id)}" data-category="${escAttr(category)}" data-title="${escAttr(p.name||'PROYECTO')}" data-meta="${escAttr(meta)}"><div class="project-image ${cover?'has-cover':''}">${cover?`<img src="${escAttr(cover)}" alt="${escAttr(p.name||'Proyecto')}" loading="lazy">`:''}<span>${String(i+1).padStart(2,'0')}</span></div><div class="project-meta"><span>${translateCategory(p.category)}</span><strong>${esc(p.name||'PROYECTO')}</strong></div></article>`;
  }).join('');
  cards=[...grid.querySelectorAll('.project')];
  cards.forEach(c=>c.addEventListener('click',()=>openCard(c,(photos||[]).filter(p=>p.project_id===c.dataset.id))));
  const hash=decodeURIComponent(location.hash.slice(1));
  if(hash){const card=cards.find(c=>c.dataset.id===hash);if(card)openCard(card,(photos||[]).filter(p=>p.project_id===hash));}
}

async function loadProjects(){
  if(!grid)return;
  if(!db){renderDemo();return;}
  try{
    let projects=null;
    let error=null;
    ({data:projects,error}=await db.from('projects').select('id,name,category,location,event_date,cover_url').eq('published',true).order('created_at',{ascending:false}).limit(100));
    if(error){
      ({data:projects,error}=await db.from('projects').select('id,name,category,location,event_date,cover_url').eq('published',true).limit(100));
    }
    if(error)throw error;
    projects=projects||[];
    if(!projects.length){renderDemo();return;}
    let photos=[];
    try{
      const ids=projects.map(p=>p.id).filter(Boolean);
      if(ids.length){
        const result=await db.from('photos').select('project_id,public_url,caption,sort_order').in('project_id',ids).order('sort_order',{ascending:true});
        if(!result.error)photos=result.data||[];
      }
    }catch(photoError){console.warn('No se pudieron cargar las fotos del portfolio:',photoError);}
    renderProjects(projects,photos);
  }catch(error){
    console.error('No se pudo cargar el portfolio:',error);
    try{
      const result=await db.from('projects').select('id,name,category,location,event_date,cover_url').eq('published',true).limit(100);
      if(!result.error&&result.data?.length){renderProjects(result.data,[]);return;}
    }catch(fallbackError){console.error('Fallback del portfolio falló:',fallbackError);}
    renderDemo();
  }
}

function setMainImage(src,alt,index=-1){
  if(!src||!visual)return;
  currentIndex=index;
  visual.innerHTML='';
  visual.className='lightbox-visual';
  const img=document.createElement('img');
  img.src=src;
  img.alt=alt||'Proyecto';
  img.className='lightbox-main-image';
  visual.appendChild(img);
  galleryEl?.querySelectorAll('img').forEach(x=>x.classList.remove('selected'));
  if(index>=0)galleryEl?.querySelectorAll('img')[index]?.classList.add('selected');
}

function openCard(card,photos){
  if(!lightbox)return;
  titleEl.textContent=card.dataset.title||'PROYECTO';
  metaEl.textContent=card.dataset.meta||'';
  galleryEl.innerHTML='';
  currentPhotos=Array.isArray(photos)?photos.filter(p=>p?.public_url):[];
  currentIndex=-1;
  const source=card.querySelector('.project-image img');
  if(source){
    setMainImage(source.src,card.dataset.title||'Proyecto',-1);
  }else{
    visual.innerHTML='';
    visual.className='lightbox-visual';
    const tone=card.querySelector('.project-image')?.className.split(' ').find(x=>x.startsWith('tone-'));
    if(tone)visual.classList.add(tone);
  }
  currentPhotos.forEach((p,i)=>{
    const img=document.createElement('img');
    img.src=p.public_url;
    img.alt=p.caption||`${card.dataset.title||'Proyecto'} — foto ${i+1}`;
    img.loading='lazy';
    img.title='Pulsa para verla en grande';
    img.addEventListener('click',e=>{e.stopPropagation();setMainImage(p.public_url,img.alt,i);});
    galleryEl.appendChild(img);
  });
  if(!currentPhotos.length&&source){
    const img=document.createElement('img');
    img.src=source.src;
    img.alt=card.dataset.title||'Proyecto';
    galleryEl.appendChild(img);
  }
  lightbox.classList.add('open');
  lightbox.setAttribute('aria-hidden','false');
  document.body.style.overflow='hidden';
}

function closeProject(){
  lightbox?.classList.remove('open');
  lightbox?.setAttribute('aria-hidden','true');
  document.body.style.overflow='';
}

close?.addEventListener('click',closeProject);
lightbox?.addEventListener('click',e=>{if(e.target===lightbox)closeProject();});
document.addEventListener('keydown',e=>{
  if(e.key==='Escape')closeProject();
  if(!lightbox?.classList.contains('open')||!currentPhotos.length)return;
  if(e.key==='ArrowDown'||e.key==='ArrowRight'){
    const next=currentIndex<0?0:Math.min(currentIndex+1,currentPhotos.length-1);
    const p=currentPhotos[next];
    if(p)setMainImage(p.public_url,p.caption||`Foto ${next+1}`,next);
  }
  if(e.key==='ArrowUp'||e.key==='ArrowLeft'){
    const next=currentIndex<=0?0:currentIndex-1;
    const p=currentPhotos[next];
    if(p)setMainImage(p.public_url,p.caption||`Foto ${next+1}`,next);
  }
});

document.querySelectorAll('.filter').forEach(f=>f.addEventListener('click',()=>{
  document.querySelectorAll('.filter').forEach(x=>x.classList.remove('active'));
  f.classList.add('active');
  const v=f.dataset.filter;
  cards.forEach(c=>c.style.display=v==='all'||c.dataset.category===v?'':'none');
}));

loadProjects();
