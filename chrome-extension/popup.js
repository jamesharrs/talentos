// popup.js — Vercentic Chrome Extension Popup
document.addEventListener('DOMContentLoaded', () => {
  const apiUrlInput = document.getElementById('apiUrl');
  const envSelect = document.getElementById('envSelect');
  const testBtn = document.getElementById('testBtn');
  const saveBtn = document.getElementById('saveBtn');
  const statusBar = document.getElementById('status-bar');
  const statusText = document.getElementById('status-text');
  const importsList = document.getElementById('imports-list');
  const openApp = document.getElementById('openApp');
  const toast = document.getElementById('toast');

  chrome.storage.sync.get(['apiUrl','environmentId','environmentName'], data => {
    if (data.apiUrl) {
      apiUrlInput.value = data.apiUrl;
      loadEnvironments(data.apiUrl, data.environmentId);
      openApp.href = data.apiUrl.replace(/:\d+$/,':3000').replace('/api','');
    }
    if (data.environmentName) updateStatus('connected', `Connected · ${data.environmentName}`);
  });

  chrome.storage.local.get(['recentImports'], data => { renderImports(data.recentImports || []); });

  testBtn.addEventListener('click', async () => {
    const url = apiUrlInput.value.trim().replace(/\/$/,'');
    if (!url) { showToast('Enter an API URL first','error'); return; }
    testBtn.textContent = 'Testing…'; testBtn.disabled = true;
    try {
      const r = await fetch(`${url}/api/health`, { signal: AbortSignal.timeout(5000) });
      const data = await r.json();
      if (data.status === 'ok') {
        updateStatus('connected', `Connected · v${data.version || '?'}`);
        showToast('Connection successful!','success');
        loadEnvironments(url);
      } else throw new Error('Unexpected response');
    } catch (err) {
      updateStatus('disconnected','Connection failed');
      showToast(err.message || 'Could not reach server','error');
    } finally { testBtn.textContent = 'Test Connection'; testBtn.disabled = false; }
  });

  async function loadEnvironments(apiUrl, selectedId) {
    try {
      const r = await fetch(`${apiUrl}/api/chrome-import/environments`);
      const envs = await r.json();
      envSelect.innerHTML = ''; envSelect.disabled = false;
      if (!envs.length) { envSelect.innerHTML = '<option value="">No environments found</option>'; return; }
      envs.forEach(env => {
        const opt = document.createElement('option');
        opt.value = env.id;
        opt.textContent = env.name + (env.is_default ? ' (default)' : '');
        if (env.id === selectedId || (!selectedId && env.is_default)) opt.selected = true;
        envSelect.appendChild(opt);
      });
    } catch { envSelect.innerHTML = '<option value="">Failed to load</option>'; }
  }

  saveBtn.addEventListener('click', () => {
    const url = apiUrlInput.value.trim().replace(/\/$/,'');
    const envId = envSelect.value;
    const envName = envSelect.options[envSelect.selectedIndex]?.textContent || '';
    if (!url) { showToast('API URL is required','error'); return; }
    chrome.storage.sync.set({ apiUrl: url, environmentId: envId, environmentName: envName }, () => {
      updateStatus('connected', `Connected · ${envName}`);
      showToast('Settings saved!','success');
      openApp.href = url.replace(/:\d+$/,':3000').replace('/api','');
    });
  });

  let urlTimeout;
  apiUrlInput.addEventListener('input', () => {
    clearTimeout(urlTimeout);
    urlTimeout = setTimeout(() => {
      const url = apiUrlInput.value.trim().replace(/\/$/,'');
      if (url.startsWith('http')) loadEnvironments(url);
    }, 800);
  });

  function renderImports(imports) {
    if (!imports.length) { importsList.innerHTML = '<div class="empty-state">No profiles imported yet.</div>'; return; }
    importsList.innerHTML = imports.slice(0,8).map(imp => {
      const initials = imp.name.split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2);
      return `<div class="import-item"><div class="import-avatar">${initials}</div><div style="flex:1;min-width:0"><div class="import-name">${imp.name}</div><div class="import-time">${timeAgo(imp.timestamp)}</div></div></div>`;
    }).join('');
  }

  function updateStatus(state, text) { statusBar.className = `status-bar ${state}`; statusText.textContent = text; }
  function showToast(message, type) {
    toast.textContent = message; toast.style.display = 'block';
    toast.style.background = type === 'error' ? '#ef4444' : '#0CAF77';
    setTimeout(() => { toast.style.display = 'none'; }, 2500);
  }
  function timeAgo(timestamp) {
    const diff = Date.now() - timestamp;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  }
});
