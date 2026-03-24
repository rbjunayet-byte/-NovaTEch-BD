// ═══════════════════════════════════════════
//  NovaTEch BD — Firebase Core v2.0
//  শুধু init + expose করে, অন্য কিছু না
// ═══════════════════════════════════════════

import { initializeApp }                          from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth }                                from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getDatabase, ref, set, push, get,
         onValue, update, remove,
         runTransaction, off }                    from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

// ── Config ──
const FC = {
  apiKey:            "AIzaSyAHdK7zelJcBFc8fOFSgH8G_6jEjZdNoSI",
  authDomain:        "novatech-bd-10421.firebaseapp.com",
  databaseURL:       "https://novatech-bd-10421-default-rtdb.firebaseio.com",
  projectId:         "novatech-bd-10421",
  storageBucket:     "novatech-bd-10421.firebasestorage.app",
  messagingSenderId: "1098950143887",
  appId:             "1:1098950143887:web:bb7014007540c878b165fa"
};

// ── Init ──
const firebaseApp = initializeApp(FC);
const auth        = getAuth(firebaseApp);
const db          = getDatabase(firebaseApp);

// ── Global expose (সব module ব্যবহার করবে) ──
window._auth   = auth;
window._db     = db;
window._ref    = ref;
window._set    = set;
window._push   = push;
window._get    = get;
window._onValue  = onValue;
window._update   = update;
window._remove   = remove;
window._runTx    = runTransaction;
window._off      = off;

// ── Helper: একটা path থেকে একবার data নাও ──
window.dbGet = async (path) => {
  const snap = await get(ref(db, path));
  return snap.exists() ? snap.val() : null;
};

// ── Helper: realtime listener (unsubscribe function return করে) ──
window.dbListen = (path, cb) => {
  const r = ref(db, path);
  onValue(r, snap => cb(snap.exists() ? snap.val() : null));
  return () => off(r);
};

// ── Helper: data লেখা ──
window.dbSet    = (path, data)         => set(ref(db, path), data);
window.dbPush   = (path, data)         => push(ref(db, path), data);
window.dbUpdate = (path, data)         => update(ref(db, path), data);
window.dbRemove = (path)               => remove(ref(db, path));

console.log("✅ Firebase initialized — NovaTEch BD v2.0");

export { auth, db };
