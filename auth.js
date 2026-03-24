// ═══════════════════════════════════════════
//  NovaTEch BD — Auth Module v2.1
//  Email / Phone / EmpID login
//  Role detect: admin | manager | worker
//  FIX: memory leak (listener cleanup) + race condition
// ═══════════════════════════════════════════

import { auth, db }                              from "./firebase.js";
import { signInWithEmailAndPassword,
         signOut, onAuthStateChanged }           from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { ref, get, onValue }                     from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

// ── Current user state ──
window.CU   = null;   // Firebase user object
window.CR   = null;   // role: 'admin' | 'manager' | 'worker'
window.CN   = null;   // display name
window.CUID = null;   // uid
window.CUDATA = null; // full user data from DB

// ── [FIX ③] _usersUnsub — listener reference রাখো ──
let _usersUnsub = null;

// ═══════════════════════════════════════════
//  Phone/EmpID → Email lookup
//  Firebase এ users/ path এ খুঁজে email বের করে
// ═══════════════════════════════════════════
async function findEmailByPhone(phone) {
  const snap = await get(ref(db, 'users'));
  if (!snap.exists()) return null;
  const users = snap.val();
  for (const uid in users) {
    const u = users[uid];
    // phone match (normalize করে)
    const stored = String(u.phone || '').replace(/[\s\-\+]/g,'').replace(/^880/,'0');
    const input  = String(phone).replace(/[\s\-\+]/g,'').replace(/^880/,'0');
    if (stored === input && u.email) return u.email;
  }
  return null;
}

async function findEmailByEmpId(empId) {
  const snap = await get(ref(db, 'users'));
  if (!snap.exists()) return null;
  const users = snap.val();
  for (const uid in users) {
    const u = users[uid];
    if (String(u.empId || '').toUpperCase() === empId.toUpperCase() && u.email) return u.email;
  }
  return null;
}

// ═══════════════════════════════════════════
//  Main Login Function
//  index.html থেকে call হয়
// ═══════════════════════════════════════════
window._doLoginWithMethod = async (method, identifier, password) => {
  let email = '';

  if (method === 'email') {
    email = identifier;

  } else if (method === 'phone') {
    window.showToast('নম্বর যাচাই হচ্ছে...', false);
    email = await findEmailByPhone(identifier);
    if (!email) throw new Error('এই মোবাইল নম্বর দিয়ে কোনো অ্যাকাউন্ট পাওয়া যায়নি।');

  } else if (method === 'empid') {
    window.showToast('ID যাচাই হচ্ছে...', false);
    email = await findEmailByEmpId(identifier);
    if (!email) throw new Error('এই Employee ID দিয়ে কোনো অ্যাকাউন্ট পাওয়া যায়নি।');
  }

  // Firebase Auth
  await signInWithEmailAndPassword(auth, email, password);
  // onAuthStateChanged বাকি কাজ করবে
};

// ═══════════════════════════════════════════
//  [FIX ③] Logout — listener cleanup করো
// ═══════════════════════════════════════════
window.doLogout = async () => {
  const ok = confirm('লগআউট করবেন?');
  if (!ok) return;

  // _usersUnsub বন্ধ করো — memory leak বন্ধ
  if (_usersUnsub) {
    _usersUnsub();
    _usersUnsub = null;
  }

  await signOut(auth);
};

// ═══════════════════════════════════════════
//  Auth State Listener
//  login/logout হলে automatically চলে
// ═══════════════════════════════════════════
onAuthStateChanged(auth, async (user) => {
  const loader   = document.getElementById('pageLoader');
  const authScr  = document.getElementById('authScreen');
  const appScr   = document.getElementById('appScreen');
  const loginBtn = document.getElementById('loginBtn');

  if (loginBtn) loginBtn.classList.remove('loading');

  if (!user) {
    // ── Logged out ──
    window.CU = window.CR = window.CN = window.CUID = window.CUDATA = null;
    if (loader)  loader.style.display  = 'none';
    if (appScr)  appScr.style.display  = 'none';
    if (authScr) authScr.style.display = 'flex';
    return;
  }

  // ── Logged in — DB থেকে user data নাও ──
  try {
    const snap = await get(ref(db, 'users/' + user.uid));
    const data = snap.exists() ? snap.val() : {};

    window.CU     = user;
    window.CUID   = user.uid;
    window.CR     = data.role  || 'worker';
    window.CN     = data.name  || user.email;
    window.CUDATA = data;

    // Global expose (modules ব্যবহার করবে)
    window.allUsers = {};
    _loadAllUsers();

    // UI switch
    if (loader)  loader.style.display  = 'none';
    if (authScr) authScr.style.display = 'none';
    if (appScr)  appScr.style.display  = 'block';

    // [FIX ④] Race condition — router.js এখনো load না হলে retry করো
    callWhenReady(window.CR);

    window.showToast(`স্বাগতম, ${window.CN}! 👋`);

  } catch(e) {
    console.error('User data load error:', e);
    window.showToast('ডেটা লোড সমস্যা হয়েছে।', true);
    await signOut(auth);
  }
});

// ── [FIX ④] _onAuthReady race condition fix ──
// router.js এখনো load না হলে 50ms পরে retry করো
function callWhenReady(role) {
  if (typeof window._onAuthReady === 'function') {
    window._onAuthReady(role);
  } else {
    setTimeout(() => callWhenReady(role), 50);
  }
}

// ── [FIX ③] সব user realtime load — unsubscribe reference রাখো ──
function _loadAllUsers() {
  // আগের listener থাকলে আগে বন্ধ করো
  if (_usersUnsub) {
    _usersUnsub();
    _usersUnsub = null;
  }

  const r = ref(db, 'users');
  _usersUnsub = onValue(r, snap => {
    window.allUsers = snap.exists() ? snap.val() : {};
  });
}

// ── Safety timeout: 6s এ loader hide ──
setTimeout(() => {
  const loader  = document.getElementById('pageLoader');
  const authScr = document.getElementById('authScreen');
  if (loader && loader.style.display !== 'none') {
    loader.style.display = 'none';
    if (authScr) authScr.style.display = 'flex';
  }
}, 6000);
