(() => {
  'use strict';

  document.addEventListener('DOMContentLoaded', async () => {
    const db = window.PF_SUPABASE;
    const $ = (s) => document.querySelector(s);
    const $$ = (s) => [...document.querySelectorAll(s)];
    const newBtn = $('#newProjectBtn');
    const form = $('#projectForm');
    const list = $('#projectList');
    const modal = $('#projectModal');

    if (!db || !newBtn || !form || !list || !modal) return;

    // admin.js ya está funcionando: no duplicamos sus listeners.
    if (typeof newBtn.onclick === 'function') return;

    let projects = [];

    const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (m) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[m]));

    const escAttr = esc;

    const setStatus = (text, ok = false) => {
      const el = $('#projectStatus');
      if (!el) return;
      el.textContent = text;
      el.className = `form-status ${ok ? 'good' : ''}`;
    };

    const setCount = () => {
      const el = $('#countProjects');
      if (el) el.textContent = String(projects.length);
    };

    const showPanel = (id) => {
      $$('.panel').forEach((panel) => {
        panel.classList.toggle('active-panel', panel.id === id);
      });
      $$('.side-link').forEach((link) => {
        link.classList.toggle('active', link.dataset.panel === id);
      });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    $$('.side-link').forEach((link) => {
      link.addEventListener('click', () => showPanel(link.dataset.panel));
    });
    $$('[data-panel-target]').forEach((button) => {
      button.addEventListener('click', () => showPanel(button.dataset.panelTarget));
    });

    const loadProjects = async () => {
      list.innerHTML = '<div class="empty-table"><p>CARGANDO PROYECTOS…</p></div>';

      const { data, error } = await db
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        list.innerHTML = `<div class="empty-table"><h3>ERROR DE DATOS</h3><p>${esc(error.message)}</p></div>`;
        projects = [];
        setCount();
        return;
      }

      projects = Array.isArray(data) ? data : [];
      setCount();
      renderProjects();

      const photoProject = $('#photoProject');
      if (photoProject) {
        photoProject.innerHTML = projects.length
          ? projects.map((p) => `<option value="${escAttr(p.id)}">${esc(p.name)}</option>`).join('')
          : '<option value="">Crea primero un proyecto</option>';
      }
    };

    const renderProjects = () => {
      if (!projects.length) {
        list.innerHTML = '<div class="empty-table"><div class="empty-icon">00</div><h3>SIN PROYECTOS</h3><p>Crea el primer proyecto para comenzar.</p></div>';
        return;
      }

      list.innerHTML = projects.map((p) => `
        <div class="data-row">
          <div>
            <small>${esc(p.category || '')}${p.location ? ` · ${esc(p.location)}` : ''}</small>
            <strong>${esc(p.name)}</strong>
            <span>${esc(p.description || '')}</span>
            <span class="admin-badge">${p.published ? 'PUBLICADO' : 'OCULTO'}</span>
          </div>
          <div class="row-actions">
            <button type="button" data-pf-edit="${escAttr(p.id)}">EDITAR</button>
            <button type="button" data-pf-publish="${escAttr(p.id)}">${p.published ? 'OCULTAR' : 'PUBLICAR'}</button>
            <button type="button" class="danger" data-pf-delete="${escAttr(p.id)}">ELIMINAR</button>
          </div>
        </div>
      `).join('');

      $$('[data-pf-edit]').forEach((b) => b.addEventListener('click', () => openProject(b.dataset.pfEdit)));
      $$('[data-pf-publish]').forEach((b) => b.addEventListener('click', () => togglePublish(b.dataset.pfPublish)));
      $$('[data-pf-delete]').forEach((b) => b.addEventListener('click', () => deleteProject(b.dataset.pfDelete)));
    };

    const openProject = (id = '') => {
      const project = projects.find((p) => String(p.id) === String(id));
      $('#projectId').value = project?.id || '';
      $('#projectName').value = project?.name || '';
      $('#projectCategory').value = project?.category || 'BOXES';
      $('#projectLocation').value = project?.location || '';
      $('#projectDate').value = project?.event_date || '';
      $('#projectDescription').value = project?.description || '';
      $('#projectPublished').checked = project?.published ?? true;
      $('#modalTitle').textContent = project ? 'EDITAR PROYECTO' : 'NUEVO PROYECTO';
      setStatus('');
      modal.hidden = false;
      $('#projectName').focus();
    };

    const togglePublish = async (id) => {
      const project = projects.find((p) => String(p.id) === String(id));
      if (!project) return;
      const button = document.querySelector(`[data-pf-publish="${CSS.escape(String(id))}"]`);
      if (button) button.disabled = true;

      const { error } = await db.from('projects').update({
        published: !project.published,
        updated_at: new Date().toISOString()
      }).eq('id', id);

      if (button) button.disabled = false;
      if (error) {
        window.alert(`No se pudo cambiar la publicación: ${error.message}`);
        return;
      }
      await loadProjects();
    };

    const deleteProject = async (id) => {
      const project = projects.find((p) => String(p.id) === String(id));
      if (!project) return;
      if (!window.confirm(`¿Eliminar el proyecto "${project.name}" y todas sus fotografías?`)) return;

      const { data: photos } = await db.from('photos').select('storage_path').eq('project_id', id);
      const paths = (photos || []).map((p) => p.storage_path).filter(Boolean);
      if (paths.length) {
        await db.storage.from('paquito-photos').remove(paths);
      }
      await db.from('photos').delete().eq('project_id', id);

      const { error } = await db.from('projects').delete().eq('id', id);
      if (error) {
        window.alert(`No se pudo eliminar: ${error.message}`);
        return;
      }
      await loadProjects();
    };

    newBtn.onclick = () => openProject();

    $$('[data-close="projectModal"]').forEach((button) => {
      button.addEventListener('click', () => { modal.hidden = true; });
    });

    window.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') modal.hidden = true;
    });

    form.addEventListener('submit', async (event) => {
      event.preventDefault();

      const name = $('#projectName').value.trim();
      if (!name) {
        setStatus('El nombre del proyecto es obligatorio.');
        $('#projectName').focus();
        return;
      }

      const saveButton = form.querySelector('button[type="submit"]');
      if (saveButton) saveButton.disabled = true;
      setStatus('GUARDANDO PROYECTO…');

      const payload = {
        name,
        category: $('#projectCategory').value,
        location: $('#projectLocation').value.trim(),
        event_date: $('#projectDate').value || null,
        description: $('#projectDescription').value.trim(),
        published: $('#projectPublished').checked,
        updated_at: new Date().toISOString()
      };

      const id = $('#projectId').value;
      const result = id
        ? await db.from('projects').update(payload).eq('id', id).select().single()
        : await db.from('projects').insert(payload).select().single();

      if (saveButton) saveButton.disabled = false;

      if (result.error) {
        console.error('Error guardando proyecto:', result.error);
        setStatus(`NO SE PUDO GUARDAR: ${result.error.message}`);
        return;
      }

      modal.hidden = true;
      await loadProjects();
    });

    await loadProjects();
  });
})();
