// ═══════════════════════════════════════════
//  NovaTEch BD — Router + App Shell v2.1
//  Bottom Nav + Page switching + Topbar
//  FIX: page architecture, role-based DOM, worker drawer
// ═══════════════════════════════════════════

// ── Pages config ──
const PAGES = {
  admin: [
    { id: 'dash',     icon: '📊', label: 'ড্যাশবোর্ড' },
    { id: 'sale',     icon: '🧾', label: 'বিক্রয়'    },
    { id: 'cust',     icon: '👥', label: 'কাস্টমার'  },
    { id: 'stock',    icon: '📦', label: 'স্টক'       },
    { id: 'more',     icon: '☰',  label: 'আরো'        },
  ],
  manager: [
    { id: 'dash',     icon: '📊', label: 'ড্যাশবোর্ড' },
    { id: 'sale',     icon: '🧾', label: 'বিক্রয়'    },
    { id: 'cust',     icon: '👥', label: 'কাস্টমার'  },
    { id: 'att',      icon: '📍', label: 'হাজিরা'    },
    { id: 'more',     icon: '☰',  label: 'আরো'        },
  ],
  worker: [
    { id: 'dash',     icon: '🏠', label: 'হোম'        },
    { id: 'sale',     icon: '🧾', label: 'বিক্রয়'    },
    { id: 'cust',     icon: '👥', label: 'কাস্টমার'  },
    { id: 'att',      icon: '📍', label: 'হাজিরা'    },
    { id: 'profile',  icon: '👤', label: 'প্রোফাইল'  },
  ],
};

// ── [FIX ⑤] Worker এর MORE_ITEMS যোগ করা হয়েছে ──
const MORE_ITEMS = {
  admin: [
    { id: 'att',       icon: '📍', label: 'হাজিরা'        },
    { id: 'salary',    icon: '💰', label: 'বেতন'          },
    { id: 'exp',       icon: '💸', label: 'খরচ'           },
    { id: 'tasks',     icon: '✅', label: 'কাজ'           },
    { id: 'chat',      icon: '💬', label: 'চ্যাট'         },
    { id: 'replace',   icon: '🔄', label: 'রিপ্লেসমেন্ট' },
    { id: 'analytics', icon: '🤖', label: 'AI Analytics'  },
    { id: 'teams',     icon: '👥', label: 'টিম'           },
    { id: 'profile',   icon: '👤', label: 'প্রোফাইল'     },
  ],
  manager: [
    { id: 'salary',    icon: '💰', label: 'বেতন'          },
    { id: 'exp',       icon: '💸', label: 'খরচ'           },
    { id: 'tasks',     icon: '✅', label: 'কাজ'           },
    { id: 'chat',      icon: '💬', label: 'চ্যাট'         },
    { id: 'stock',     icon: '📦', label: 'স্টক'          },
    { id: 'replace',   icon: '🔄', label: 'রিপ্লেসমেন্ট' },
    { id: 'profile',   icon: '👤', label: 'প্রোফাইল'     },
    { id: 'teams',     icon: '👥', label: 'টিম'           },
  ],
  // [FIX ⑤] Worker drawer — profile + salary (নিজের) + tasks
  worker: [
    { id: 'salary',    icon: '💰', label: 'বেতন'          },
    { id: 'tasks',     icon: '✅', label: 'কাজ'           },
    { id: 'chat',      icon: '💬', label: 'চ্যাট'         },
    { id: 'profile',   icon: '👤', label: 'প্রোফাইল'     },
  ],
};

let _currentPage = 'dash';
let _drawerOpen  = false;

// ═══════════════════════════════════════════
//  [FIX ②] Role অনুযায়ী শুধু allowed pages দেখাও
// ═══════════════════════════════════════════
function getAllowedPages(role) {
  const common      = ['dash', 'sale', 'cust', 'att', 'profile'];
  const adminExtra  = ['stock', 'salary', 'exp', 'tasks', 'chat', 'replace', 'analytics', 'teams'];
  const managerExtra = ['salary', 'exp', 'tasks', 'chat', 'stock', 'replace', 'teams'];
  // worker এর জন্য more drawer items ও যোগ করো
  const workerExtra  = ['salary', 'tasks', 'chat'];

  if (role === 'admin')   return [...new Set([...common, ...adminExtra])];
  if (role === 'manager') return [...new Set([...common, ...managerExtra])];
  return [...new Set([...common, ...workerExtra])]; // worker
}

// ═══════════════════════════════════════════
//  App Shell inject (login হওয়ার পরে)
// ═══════════════════════════════════════════
function buildAppShell(role) {
  const appScr = document.getElementById('appScreen');
  if (!appScr) return;

  appScr.innerHTML = `
    <!-- Topbar -->
    <div class="topbar" id="topbar">
      <div class="topbar-left">
        <div class="topbar-logo">Nova<span>TEch</span></div>
        <div class="role-badge role-${role}" id="roleBadge">${getRoleLabel(role)}</div>
      </div>
      <div class="topbar-right">
        <div class="user-name" id="topbarName"></div>
        <button class="topbar-btn" onclick="doLogout()" title="লগআউট">⏻</button>
      </div>
    </div>

    <!-- [FIX ①] Pages container — fixed height + overflow hidden -->
    <div id="pagesWrap">
      ${buildPageDivs(role)}
    </div>

    <!-- Bottom Nav -->
    <nav class="bottom-nav" id="bottomNav">
      ${buildBottomNav(role)}
    </nav>

    <!-- Drawer Overlay -->
    <div class="drawer-overlay" id="drawerOverlay" onclick="closeDrawer()"></div>

    <!-- More Drawer -->
    <div class="drawer" id="drawer">
      <div class="drawer-handle"></div>
      <div class="drawer-title">সব মেনু</div>
      <div class="drawer-grid" id="drawerGrid"></div>
      <div class="drawer-logout">
        <button onclick="doLogout()">⏻ লগআউট</button>
      </div>
    </div>
  `;

  // Topbar name set
  document.getElementById('topbarName').textContent = window.CN || '';

  // Drawer items build
  buildDrawer(role);

  // প্রথম page দেখাও
  goTo('dash');
}

// ── [FIX ②] শুধু role-allowed page divs তৈরি করো ──
function buildPageDivs(role) {
  const allowed = getAllowedPages(role);
  return allowed.map(id => `<div class="page" id="page-${id}">
    <div class="page-loading"><div class="page-spinner"></div></div>
  </div>`).join('');
}

// ── Bottom Nav ──
function buildBottomNav(role) {
  const items = PAGES[role] || PAGES.worker;
  return items.map(p => `
    <button class="bnav-btn" id="bnav-${p.id}" onclick="${p.id === 'more' ? 'toggleDrawer()' : `goTo('${p.id}')`}">
      <span class="bnav-ico">${p.icon}</span>
      <span class="bnav-lbl">${p.label}</span>
      <span class="bnav-dot" id="dot-${p.id}"></span>
    </button>
  `).join('');
}

// ── [FIX ⑤] Drawer — worker এর জন্য MORE_ITEMS.worker ব্যবহার করো ──
function buildDrawer(role) {
  const items = MORE_ITEMS[role] || [];
  const grid  = document.getElementById('drawerGrid');
  if (!grid) return;

  if (items.length === 0) {
    grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:20px;font-size:12px;color:var(--text-muted);">কোনো অতিরিক্ত মেনু নেই।</div>`;
    return;
  }

  grid.innerHTML = items.map(p => `
    <button class="drawer-item" onclick="goTo('${p.id}');closeDrawer()">
      <span class="drawer-ico">${p.icon}</span>
      <span class="drawer-lbl">${p.label}</span>
    </button>
  `).join('');
}

function getRoleLabel(role) {
  return { admin: 'Admin', manager: 'Manager', worker: 'Worker' }[role] || role;
}

// ═══════════════════════════════════════════
//  Page Navigation
// ═══════════════════════════════════════════
window.goTo = function(pageId) {
  // [FIX ①] opacity + pointer-events দিয়ে hide (display:none নয়)
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.bnav-btn').forEach(b => b.classList.remove('active'));

  const pg = document.getElementById('page-' + pageId);
  if (pg) pg.classList.add('active');

  // bottom nav active
  const nb = document.getElementById('bnav-' + pageId);
  if (nb) nb.classList.add('active');

  _currentPage = pageId;

  // Module load করো
  loadPageModule(pageId);
};

window.getCurrentPage = () => _currentPage;

// ── Module lazy load ──
const _loadedModules = new Set();

async function loadPageModule(pageId) {
  if (_loadedModules.has(pageId)) return;
  _loadedModules.add(pageId);

  const moduleMap = {
    dash:      './modules/dashboard.js',
    sale:      './modules/sales/index.js',
    cust:      './modules/customers/index.js',
    stock:     './modules/stock.js',
    att:       './modules/attendance.js',
    salary:    './modules/salary.js',
    exp:       './modules/expense.js',
    tasks:     './modules/tasks.js',
    chat:      './modules/chat.js',
    replace:   './modules/replacement.js',
    analytics: './modules/analytics.js',
    teams:     './modules/teams.js',
    profile:   './modules/profile.js',
  };

  const path = moduleMap[pageId];
  if (!path) return;

  try {
    await import(path);
  } catch(e) {
    // Module এখনো নেই — placeholder দেখাও
    const pg = document.getElementById('page-' + pageId);
    if (pg) pg.innerHTML = `
      <div style="padding:40px 20px;text-align:center;">
        <div style="font-size:40px;margin-bottom:12px;">🚧</div>
        <div style="font-size:15px;font-weight:700;color:var(--text-primary);margin-bottom:6px;">শীঘ্রই আসছে</div>
        <div style="font-size:12px;color:var(--text-muted);">এই module এখনো তৈরি হচ্ছে।</div>
      </div>`;
  }
}

// ═══════════════════════════════════════════
//  Drawer
// ═══════════════════════════════════════════
window.toggleDrawer = function() {
  _drawerOpen ? closeDrawer() : openDrawer();
};

window.openDrawer = function() {
  _drawerOpen = true;
  document.getElementById('drawer')?.classList.add('open');
  document.getElementById('drawerOverlay')?.classList.add('open');
};

window.closeDrawer = function() {
  _drawerOpen = false;
  document.getElementById('drawer')?.classList.remove('open');
  document.getElementById('drawerOverlay')?.classList.remove('open');
};

// ── Back button → close drawer ──
window.addEventListener('popstate', () => {
  if (_drawerOpen) { closeDrawer(); history.pushState(null, ''); }
});

// ═══════════════════════════════════════════
//  Auth ready → shell build
// ═══════════════════════════════════════════
window._onAuthReady = function(role) {
  buildAppShell(role);
};

// ═══════════════════════════════════════════
//  CSS inject
// ═══════════════════════════════════════════
(function injectRouterCSS() {
  if (document.getElementById('router-css')) return;
  const s = document.createElement('style');
  s.id = 'router-css';
  s.textContent = `
/* ── App Screen ── */
#appScreen {
  display: none;
  min-height: 100vh;
  background: var(--bg-base);
  max-width: 430px;
  margin: 0 auto;
}

/* ── Topbar ── */
.topbar {
  position: sticky; top: 0; z-index: 100;
  height: 52px;
  background: var(--bg-surface);
  border-bottom: 1px solid var(--border);
  padding: 12px 16px 10px;
  display: flex; align-items: center; justify-content: space-between;
}
.topbar-logo {
  font-family: var(--font-en);
  font-size: 17px; font-weight: 800;
  color: var(--text-primary);
}
.topbar-logo span { color: var(--gold-bright); }
.role-badge {
  font-size: 10px; font-weight: 700;
  padding: 2px 8px; border-radius: 20px;
  display: inline-block; margin-top: 2px;
}
.role-admin   { background: rgba(245,200,66,.12); color: var(--gold-bright); }
.role-manager { background: rgba(59,130,246,.12);  color: #60a5fa; }
.role-worker  { background: rgba(16,185,129,.12); color: #34d399; }
.topbar-right { display: flex; align-items: center; gap: 10px; }
.user-name { font-size: 11px; color: var(--text-muted); }
.topbar-btn {
  background: none; border: 1px solid var(--border);
  border-radius: 8px; color: var(--text-muted);
  font-size: 14px; padding: 5px 9px; cursor: pointer;
  transition: all .2s;
}
.topbar-btn:hover { border-color: var(--red); color: #f87171; }

/* ── [FIX ①] Pages — position:absolute + opacity transition ── */
#pagesWrap {
  position: relative;
  height: calc(100vh - 52px - 64px); /* topbar + bottom-nav */
  overflow: hidden;
}
.page {
  position: absolute;
  inset: 0;
  overflow-y: auto;
  opacity: 0;
  pointer-events: none;
  transform: translateX(12px);
  transition: opacity .22s ease, transform .22s ease;
  /* scroll position আলাদা রাখার জন্য */
  overscroll-behavior: contain;
}
.page.active {
  opacity: 1;
  pointer-events: all;
  transform: translateX(0);
}
.page-loading {
  display: flex; align-items: center; justify-content: center;
  padding: 60px;
}
.page-spinner {
  width: 28px; height: 28px;
  border: 2px solid var(--border);
  border-top-color: var(--gold-bright);
  border-radius: 50%;
  animation: spin .7s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* ── Bottom Nav ── */
.bottom-nav {
  position: fixed; bottom: 0; left: 50%;
  transform: translateX(-50%);
  width: 100%; max-width: 430px;
  height: 64px;
  background: var(--bg-surface);
  border-top: 1px solid var(--border);
  display: flex; align-items: stretch;
  z-index: 150;
  padding-bottom: env(safe-area-inset-bottom, 0px);
}
.bnav-btn {
  flex: 1; display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  padding: 8px 4px 6px; gap: 3px;
  background: none; border: none; cursor: pointer;
  font-family: var(--font-bn);
  position: relative; transition: background .15s;
}
.bnav-btn:active { background: rgba(255,255,255,.03); }
.bnav-ico { font-size: 20px; line-height: 1; transition: transform .2s; }
.bnav-lbl { font-size: 10px; font-weight: 600; color: var(--text-muted); }
.bnav-btn.active .bnav-lbl { color: var(--gold-bright); }
.bnav-btn.active .bnav-ico { transform: scale(1.15); filter: drop-shadow(0 0 6px var(--gold-bright)); }
.bnav-dot {
  position: absolute; top: 5px; right: calc(50% - 16px);
  width: 7px; height: 7px; border-radius: 50%;
  background: var(--red); border: 1.5px solid var(--bg-surface);
  display: none;
}
.bnav-dot.show { display: block; }

/* ── Drawer ── */
.drawer-overlay {
  display: none; position: fixed; inset: 0;
  background: rgba(0,0,0,.6); z-index: 160;
  backdrop-filter: blur(3px);
}
.drawer-overlay.open { display: block; }
.drawer {
  position: fixed; bottom: 0; left: 50%;
  transform: translateX(-50%) translateY(100%);
  width: 100%; max-width: 430px;
  background: var(--bg-surface);
  border-radius: 22px 22px 0 0;
  border-top: 1px solid var(--border);
  z-index: 170; padding: 0 16px 80px;
  transition: transform .32s cubic-bezier(.32,1,.6,1);
  max-height: 85vh; overflow-y: auto;
}
.drawer.open { transform: translateX(-50%) translateY(0); }
.drawer-handle {
  width: 40px; height: 4px; border-radius: 2px;
  background: var(--border); margin: 12px auto 8px;
}
.drawer-title {
  font-size: 12px; font-weight: 700;
  color: var(--text-muted); text-transform: uppercase;
  letter-spacing: .5px; margin-bottom: 14px;
  padding-top: 4px;
}
.drawer-grid {
  display: grid; grid-template-columns: repeat(4, 1fr);
  gap: 8px; margin-bottom: 16px;
}
.drawer-item {
  background: var(--bg-card); border: 1px solid var(--border);
  border-radius: var(--r-md); padding: 14px 8px;
  display: flex; flex-direction: column;
  align-items: center; gap: 6px;
  cursor: pointer; font-family: var(--font-bn);
  transition: all .18s;
}
.drawer-item:active { background: var(--bg-elevated); border-color: var(--border-gold); }
.drawer-ico { font-size: 22px; }
.drawer-lbl { font-size: 10px; font-weight: 600; color: var(--text-secondary); }
.drawer-logout {
  border-top: 1px solid var(--border); padding-top: 14px;
}
.drawer-logout button {
  width: 100%; padding: 12px;
  background: rgba(239,68,68,.08);
  border: 1px solid rgba(239,68,68,.2);
  border-radius: var(--r-md);
  color: #f87171; font-family: var(--font-bn);
  font-size: 13px; font-weight: 700; cursor: pointer;
  transition: all .18s;
}
.drawer-logout button:active { background: rgba(239,68,68,.15); }
  `;
  document.head.appendChild(s);
})();
