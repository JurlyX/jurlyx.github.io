
(function () {
  'use strict';

  /************************************************************************
   * Configuration (change CDN URLs if you self-host CodeMirror)
   ************************************************************************/
  const CM_CSS = 'https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.13/codemirror.min.css';
  const CM_JS = 'https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.13/codemirror.min.js';
  const CM_MODE_JS = 'https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.13/mode/javascript/javascript.min.js';

  /************************************************************************
   * Small helper to dynamically load CSS/JS
   ************************************************************************/
  function loadCss(url) {
    return new Promise((resolve, reject) => {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = url;
      link.onload = () => resolve();
      link.onerror = () => reject(new Error('Failed to load CSS: ' + url));
      document.head.appendChild(link);
    });
  }
  function loadScript(url) {
    return new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = url;
      s.async = false;
      s.onload = () => resolve();
      s.onerror = () => reject(new Error('Failed to load script: ' + url));
      document.head.appendChild(s);
    });
  }

  /************************************************************************
   * Build the floating console UI (HTML + CSS)
   ************************************************************************/
  function injectUI() {
    if (document.getElementById('page-devconsole-panel')) return;

    const styleText = `
#page-devconsole-panel { position: fixed; right: 12px; bottom: 12px; width: 780px; max-height: 86vh; z-index: 2147483647; font-family: Inter, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial; box-shadow: 0 12px 48px rgba(0,0,0,.45); border-radius: 8px; overflow: hidden; display:flex; flex-direction:column; background: linear-gradient(180deg,#fafafa,#eee); border:1px solid rgba(0,0,0,0.08); }
#page-devconsole-header{display:flex;align-items:center;padding:8px 10px;border-bottom:1px solid rgba(0,0,0,0.06);cursor:grab}
#page-devconsole-title{font-weight:600;font-size:13px}
#page-devconsole-controls{margin-left:auto;display:flex;gap:8px;align-items:center}
#page-devconsole-body{display:flex;gap:8px;padding:10px;flex:1;min-height:260px}
#page-devconsole-left{width:62%;display:flex;flex-direction:column;gap:8px}
#page-devconsole-right{width:38%;display:flex;flex-direction:column;gap:8px}
.page-ug-section{background:white;padding:8px;border-radius:6px;border:1px solid rgba(0,0,0,0.04)}
#page-devconsole-input-area{height:160px;resize:vertical;border-radius:6px;border:1px solid rgba(0,0,0,0.06);font-family:monospace;padding:6px;box-sizing:border-box}
#page-devconsole-run{padding:6px 10px;border-radius:6px;border:1px solid rgba(0,0,0,0.06);cursor:pointer;background:white}
#page-devconsole-output{background:#0b1220;color:#eaf3ff;padding:10px;border-radius:6px;height:320px;overflow:auto;font-family:monospace;font-size:13px}
.page-log-entry{padding:8px;margin-bottom:8px;border-radius:6px;background:rgba(255,255,255,0.02);display:flex;gap:10px;align-items:flex-start}
.page-log-meta{min-width:82px;font-size:11px;opacity:0.85;color:#a8b3c1}
.page-log-body{flex:1;white-space:pre-wrap;word-break:break-word;color:#dbe9ff}
.page-log-actions{display:flex;gap:6px;align-items:center}
.page-btn{padding:4px 8px;border-radius:6px;border:1px solid rgba(0,0,0,0.04);cursor:pointer;background:rgba(255,255,255,0.02)}
.page-log-warn{border-left:4px solid #f59e0b}
.page-log-error{border-left:4px solid #ef4444}
.page-log-info{border-left:4px solid #3b82f6}
#page-devconsole-tree{max-height:360px;overflow:auto;font-family:monospace;white-space:pre}
#page-devconsole-snippets{height:120px;resize:vertical;font-family:monospace}
#page-devconsole-footer{display:flex;gap:8px;padding:8px 10px;border-top:1px solid rgba(0,0,0,0.04);background:rgba(255,255,255,0.6);align-items:center}
`;

    const style = document.createElement('style');
    style.id = 'page-devconsole-style';
    style.textContent = styleText;
    document.head.appendChild(style);

    const panel = document.createElement('div');
    panel.id = 'page-devconsole-panel';
    panel.innerHTML = `
      <div id="page-devconsole-header">
        <div id="page-devconsole-title">DevConsole — Embedded</div>
        <div id="page-devconsole-controls">
          <div style="font-size:12px;color:#333;opacity:.8">Ctrl+Shift+E</div>
          <button id="page-devconsole-clear" class="page-btn">Clear</button>
          <button id="page-devconsole-export" class="page-btn">Export</button>
        </div>
      </div>
      <div id="page-devconsole-body">
        <div id="page-devconsole-left">
          <div class="page-ug-section">
            <div style="font-weight:600;margin-bottom:6px">JS Input (Ctrl+Enter)</div>
            <textarea id="page-devconsole-input-area" placeholder="// Type JS here. Use await; Ctrl+Enter to run."></textarea>
            <div style="display:flex;gap:8px;margin-top:8px;align-items:center">
              <button id="page-devconsole-run" class="page-btn">Run ▶</button>
              <div style="font-size:12px;color:#333;opacity:.8">(Up/Down: history • Tab: indent)</div>
            </div>
          </div>
          <div class="page-ug-section">
            <div style="font-weight:600;margin-bottom:6px">Console Output (page console intercepted)</div>
            <div id="page-devconsole-output" role="log"></div>
          </div>
        </div>
        <div id="page-devconsole-right">
          <div class="page-ug-section">
            <div style="font-weight:600;margin-bottom:6px">Snippets</div>
            <textarea id="page-devconsole-snippets" placeholder="// Save snippets here"></textarea>
            <div style="display:flex;gap:8px;margin-top:8px">
              <button id="page-devconsole-save-snippet" class="page-btn">Save Selection</button>
              <button id="page-devconsole-load-snippet" class="page-btn">Load Snippet</button>
            </div>
          </div>
          <div class="page-ug-section">
            <div style="font-weight:600;margin-bottom:6px">Inspector / Last Result</div>
            <pre id="page-devconsole-tree">(Run to show result)</pre>
          </div>
        </div>
      </div>
      <div id="page-devconsole-footer">
        <div>Logs: <span id="page-devconsole-count">0</span></div>
        <div style="margin-left:auto"><button id="page-devconsole-collapse" class="page-btn">Minimize</button></div>
      </div>
    `;
    document.body.appendChild(panel);

    // make header draggable
    (function makeDraggable() {
      const headerEl = panel.querySelector('#page-devconsole-header');
      let down = false, sx=0, sy=0, origRight=12, origBottom=12;
      headerEl.addEventListener('mousedown', (e) => {
        down = true; sx = e.clientX; sy = e.clientY;
        const rect = panel.getBoundingClientRect();
        origRight = window.innerWidth - rect.right;
        origBottom = window.innerHeight - rect.bottom;
        document.body.style.userSelect = 'none';
        headerEl.style.cursor = 'grabbing';
      });
      window.addEventListener('mousemove', (e) => {
        if (!down) return;
        const dx = e.clientX - sx, dy = e.clientY - sy;
        panel.style.right = (origRight - dx) + 'px';
        panel.style.bottom = (origBottom - dy) + 'px';
      });
      window.addEventListener('mouseup', () => { down = false; document.body.style.userSelect = ''; headerEl.style.cursor = 'grab'; });
    })();
  }

  /************************************************************************
   * Console interception (override methods on console and capture errors)
   ************************************************************************/
  function interceptConsole(logHandler) {
    const methods = ['log','info','warn','error','debug','dir','table'];
    const original = {};
    methods.forEach(m => {
      try {
        original[m] = console[m];
        console[m] = function(...args) {
          try { logHandler({ level: m, args: args, time: Date.now(), source: 'page' }); } catch(e) {}
          try { original[m].apply(console, args); } catch(e) {}
        };
      } catch(e) {}
    });
    if (console.trace) {
      const origTrace = console.trace;
      console.trace = function(...args){
        try { logHandler({ level: 'trace', args: args, time: Date.now(), stack: (new Error()).stack }); } catch(e){}
        try { origTrace.apply(console, args); } catch(e){}
      };
    }

    window.addEventListener('error', function(ev) {
      const err = ev && ev.error ? ev.error : { message: ev.message, filename: ev.filename, lineno: ev.lineno, colno: ev.colno };
      try { logHandler({ level: 'error', args: [err], time: Date.now(), source: 'uncaught' }); } catch(e) {}
    }, true);

    window.addEventListener('unhandledrejection', function(ev) {
      try { logHandler({ level: 'error', args: [ev.reason], time: Date.now(), source: 'unhandledrejection' }); } catch(e) {}
    }, true);

    // return a restore function
    return function restore() {
      methods.forEach(m => { if (original[m]) console[m] = original[m]; });
      if (original.trace) console.trace = original.trace;
    };
  }

  /************************************************************************
   * Main behaviour: create UI, load CodeMirror (optionally), wire events
   ************************************************************************/
  async function init() {
    injectUI();

    // Elements
    const panel = document.getElementById('page-devconsole-panel');
    const inputArea = document.getElementById('page-devconsole-input-area');
    const runBtn = document.getElementById('page-devconsole-run');
    const output = document.getElementById('page-devconsole-output');
    const tree = document.getElementById('page-devconsole-tree');
    const snippets = document.getElementById('page-devconsole-snippets');
    const saveSnippetBtn = document.getElementById('page-devconsole-save-snippet');
    const loadSnippetBtn = document.getElementById('page-devconsole-load-snippet');
    const clearBtn = document.getElementById('page-devconsole-clear');
    const exportBtn = document.getElementById('page-devconsole-export');
    const countEl = document.getElementById('page-devconsole-count');
    const collapseBtn = document.getElementById('page-devconsole-collapse');

    // attempt to load CodeMirror - if succeed, replace textarea with editor
    let editor = null;
    try {
      await loadCss(CM_CSS);
      await loadScript(CM_JS);
      await loadScript(CM_MODE_JS);
      if (window.CodeMirror) {
        editor = window.CodeMirror.fromTextArea(inputArea, {
          lineNumbers: true,
          mode: 'javascript',
          indentUnit: 2,
          tabSize: 2,
          extraKeys: {
            'Ctrl-Enter': function(cm) { runButtonAction(); },
            'Cmd-Enter': function(cm) { runButtonAction(); },
            'Tab': function(cm) { if (cm.somethingSelected()) cm.indentSelection('add'); else cm.replaceSelection('  '); }
          }
        });
        editor.setSize('100%', 160);
      }
    } catch (e) {
      // CodeMirror failed; fall back to textarea already present
      console.warn('CodeMirror load failed — falling back to textarea:', e);
      editor = null;
    }

    function getEditorValue() {
      return editor ? editor.getValue() : inputArea.value;
    }
    function setEditorValue(v) {
      if (editor) editor.setValue(v); else inputArea.value = v;
    }

    // logging store & render
    const logs = [];
    function formatArg(arg) {
      try {
        if (arg === null) return 'null';
        if (arg === undefined) return 'undefined';
        if (typeof arg === 'string') return arg;
        if (typeof arg === 'number' || typeof arg === 'boolean') return String(arg);
        if (arg instanceof Element) return '<' + (arg.tagName||'el').toLowerCase() + (arg.id ? '#'+arg.id : '') + '>';
        return JSON.stringify(arg, getCircularReplacer(), 2);
      } catch (e) {
        return String(arg);
      }
    }
    function getCircularReplacer() {
      const seen = new WeakSet();
      return function(key, value) {
        if (typeof value === 'object' && value !== null) {
          if (seen.has(value)) return '[Circular]';
          seen.add(value);
        }
        return value;
      };
    }
    function addLog(entry) {
      logs.unshift(entry);
      renderLogs();
      renderCount();
    }
    function renderCount() { countEl.textContent = String(logs.length); }
    function renderLogs() {
      output.innerHTML = '';
      for (const entry of logs) {
        const row = document.createElement('div');
        row.className = 'page-log-entry ' + (entry.level ? ('page-log-' + entry.level) : '');
        const meta = document.createElement('div'); meta.className = 'page-log-meta';
        meta.textContent = new Date(entry.time).toLocaleTimeString() + (entry.source ? (' • ' + entry.source) : '');
        const body = document.createElement('div'); body.className = 'page-log-body';
        const parts = (entry.args || []).map(a => formatArg(a));
        body.textContent = parts.join('    ');
        const actions = document.createElement('div'); actions.className = 'page-log-actions';
        const copyBtn = document.createElement('button'); copyBtn.className = 'page-btn'; copyBtn.textContent = 'Copy';
        copyBtn.addEventListener('click', () => {
          try { navigator.clipboard.writeText(parts.join('    ')); } catch(e) { prompt('Copy:', parts.join('    ')); }
        });
        const inspectBtn = document.createElement('button'); inspectBtn.className = 'page-btn'; inspectBtn.textContent = 'Inspect';
        inspectBtn.addEventListener('click', () => {
          const a0 = entry.args && entry.args[0];
          if (a0 instanceof Element) {
            const sel = a0.id ? ('#' + a0.id) : (a0.className ? (a0.tagName.toLowerCase() + '.' + String(a0.className).split(/\s+/)[0]) : a0.tagName.toLowerCase());
            // highlight & scroll
            try {
              const el = document.querySelector(sel) || a0;
              if (el) {
                const orig = el.style.outline;
                el.style.outline = '3px solid rgba(255,165,0,0.9)';
                el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
                setTimeout(()=> el.style.outline = orig, 2000);
              }
            } catch(e){}
          } else {
            tree.textContent = (entry.args && entry.args.length === 1) ? formatArg(entry.args[0]) : formatArg(entry.args);
          }
        });
        actions.appendChild(copyBtn);
        actions.appendChild(inspectBtn);
        row.appendChild(meta);
        row.appendChild(body);
        row.appendChild(actions);
        output.appendChild(row);
      }
    }

    // intercept console
    const restoreConsole = interceptConsole(addLog);

    // eval runner in page context
    let history = [], historyIndex = -1;
    async function runInPage(code) {
      // wrap in async function to allow top-level await
      try {
        const fn = new Function('return (async function(){\n' + code + '\n})();');
        const res = await fn();
        addLog({ id: 'eval_' + Date.now(), level: 'info', args: [res], time: Date.now(), source: 'eval' });
        try { tree.textContent = JSON.stringify(res, getCircularReplacer(), 2); } catch(e) { tree.textContent = String(res); }
      } catch (err) {
        const errText = (err && err.stack) ? err.stack : String(err);
        addLog({ id: 'evalerr_' + Date.now(), level: 'error', args: [errText], time: Date.now(), source: 'eval' });
        tree.textContent = errText;
      }
    }

    async function runButtonAction() {
      const code = getEditorValue();
      if (!code || !code.trim()) return;
      history.unshift(code);
      historyIndex = -1;
      addLog({ id: 'run_' + Date.now(), level: 'info', args: ['> ' + (code.split('\n')[0] || code)], time: Date.now(), source: 'local' });
      await runInPage(code);
    }
    runBtn.addEventListener('click', runButtonAction);

    // keyboard: Ctrl+Enter to run; history navigation & tab indent
    window.addEventListener('keydown', function(e) {
      if (e.ctrlKey && e.shiftKey && (e.key === 'E' || e.key === 'e')) {
        panel.style.display = (panel.style.display === 'none') ? '' : 'none';
      }
      const active = document.activeElement;
      // run when focus in editor area
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        if (editor) {
          // CodeMirror captures Ctrl-Enter via extraKeys; no need here
        } else {
          if (panel.contains(active)) {
            e.preventDefault();
            runButtonAction();
          }
        }
      }
    }, false);

    // textarea history & tab for fallback (if CodeMirror not available)
    if (!editor) {
      inputArea.addEventListener('keydown', function(ev) {
        if (ev.key === 'Enter' && ev.ctrlKey) { ev.preventDefault(); runButtonAction(); }
        else if (ev.key === 'ArrowUp') {
          if (inputArea.selectionStart === 0 && inputArea.selectionEnd === 0) {
            if (history.length === 0) return;
            historyIndex = Math.min(historyIndex + 1, history.length - 1);
            inputArea.value = history[historyIndex];
            ev.preventDefault();
          }
        } else if (ev.key === 'ArrowDown') {
          if (inputArea.selectionStart === inputArea.value.length) {
            if (historyIndex <= 0) { historyIndex = -1; inputArea.value = ''; return; }
            historyIndex = Math.max(historyIndex - 1, -1);
            inputArea.value = historyIndex === -1 ? '' : history[historyIndex];
            ev.preventDefault();
          }
        } else if (ev.key === 'Tab') {
          ev.preventDefault();
          const start = inputArea.selectionStart, end = inputArea.selectionEnd;
          inputArea.value = inputArea.value.substring(0, start) + '  ' + inputArea.value.substring(end);
          inputArea.selectionStart = inputArea.selectionEnd = start + 2;
        }
      });
    } else {
      // CodeMirror history navigation (simple)
      editor.on('keydown', function(cm, ev) {
        if (ev.key === 'ArrowUp') {
          const cursor = cm.getCursor();
          if (cursor.line === 0 && cursor.ch === 0) {
            if (history.length === 0) return;
            historyIndex = Math.min(historyIndex + 1, history.length - 1);
            cm.setValue(history[historyIndex]);
            ev.preventDefault();
          }
        } else if (ev.key === 'ArrowDown') {
          const cursor = cm.getCursor();
          const last = cm.lastLine();
          const lastLen = cm.getLine(last).length;
          if (cursor.line === last && cursor.ch === lastLen) {
            if (historyIndex <= 0) { historyIndex = -1; cm.setValue(''); return; }
            historyIndex = Math.max(historyIndex - 1, -1);
            cm.setValue(historyIndex === -1 ? '' : history[historyIndex]);
            ev.preventDefault();
          }
        }
      });
    }

    // snippets
    saveSnippetBtn.addEventListener('click', () => {
      const sel = window.getSelection();
      const text = (sel && sel.toString()) ? sel.toString() : getEditorValue();
      if (!text || !text.trim()) return alert('Nothing to save.');
      snippets.value = snippets.value + "\n\n// SNIPPET\n" + text;
      alert('Saved to snippets panel.');
    });
    loadSnippetBtn.addEventListener('click', () => {
      if (!snippets.value || !snippets.value.trim()) return alert('No snippet available.');
      setEditorValue(snippets.value);
    });

    // clear & export
    clearBtn.addEventListener('click', () => { logs.length = 0; output.innerHTML = ''; renderCount(); tree.textContent = '(Run to show result)'; });
    exportBtn.addEventListener('click', () => {
      try {
        const blob = new Blob([JSON.stringify(logs.slice().reverse(), null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = 'devconsole-logs.json'; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
      } catch (e) { alert('Export failed: ' + e); }
    });

    // collapse
    collapseBtn.addEventListener('click', () => {
      if (panel.style.height) { panel.style.height = ''; collapseBtn.textContent = 'Minimize'; }
      else { panel.style.height = '40px'; collapseBtn.textContent = 'Expand'; }
    });

    // initial message
    addLog({ id: 'ready', level: 'info', args: ['Embedded DevConsole ready — intercepting page console and errors. Use Ctrl+Enter to run code.'], time: Date.now(), source: 'system' });

    // expose global API for convenience
    try {
      window.PageDevConsole = {
        open: () => panel.style.display = '',
        close: () => panel.style.display = 'none',
        run: (code) => runInPage(code),
        logs: () => logs
      };
    } catch (e) { /* ignore */ }
  }

  // start
  init().catch(err => console.error('DevConsole init error:', err));

})();
