const links = document.querySelectorAll('.side-link');
const panels = document.querySelectorAll('.panel');
const quickActions = document.querySelectorAll('[data-panel-target]');

function showPanel(id){
  panels.forEach(panel => panel.classList.toggle('active-panel', panel.id === id));
  links.forEach(link => link.classList.toggle('active', link.dataset.panel === id));
  window.scrollTo({top:0,behavior:'smooth'});
}

links.forEach(link => link.addEventListener('click', () => showPanel(link.dataset.panel)));
quickActions.forEach(button => button.addEventListener('click', () => showPanel(button.dataset.panelTarget)));
