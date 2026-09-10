const filters = document.querySelectorAll('.filter');
const projects = document.querySelectorAll('.project');
const lightbox = document.getElementById('lightbox');
const close = document.getElementById('closeLightbox');
const lightboxVisual = document.getElementById('lightboxVisual');
const lightboxTitle = document.getElementById('lightboxTitle');
const lightboxMeta = document.getElementById('lightboxMeta');

function openProject(card){
  const image = card.querySelector('.project-image');
  const pseudo = getComputedStyle(image, '::before').background;
  lightboxVisual.style.background = getComputedStyle(image).background;
  lightboxVisual.style.backgroundImage = pseudo;
  lightboxTitle.textContent = card.dataset.title || 'PROJECT';
  lightboxMeta.textContent = card.dataset.meta || '';
  lightbox.classList.add('open');
  lightbox.setAttribute('aria-hidden','false');
  document.body.style.overflow='hidden';
}

projects.forEach(card => card.addEventListener('click', () => openProject(card)));

function closeProject(){
  lightbox.classList.remove('open');
  lightbox.setAttribute('aria-hidden','true');
  document.body.style.overflow='';
}

close?.addEventListener('click', closeProject);
lightbox?.addEventListener('click', e => { if(e.target === lightbox) closeProject(); });
document.addEventListener('keydown', e => { if(e.key === 'Escape') closeProject(); });

filters.forEach(filter => filter.addEventListener('click', () => {
  filters.forEach(f => f.classList.remove('active'));
  filter.classList.add('active');
  const value = filter.dataset.filter;
  projects.forEach(project => {
    const visible = value === 'all' || project.dataset.category === value;
    project.style.display = visible ? '' : 'none';
  });
}));
