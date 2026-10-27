'use strict';
/* ============================================================
   Instagram-style AI chat — all data stays on the device.
   ============================================================ */

// ---------- Utils ----------
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const escRe = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
const sleep = ms => new Promise(r => setTimeout(r, ms));
const clone = o => JSON.parse(JSON.stringify(o));
const trunc = (s, n) => (s = String(s || '')).length > n ? s.slice(0, n - 1) + '…' : s;
const isAndroid = !!window.AndroidBridge;

const ICONS = {
  back: '<path d="M15 5l-7 7 7 7"/>',
  compose: '<path d="M19 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h6"/><path d="M17.5 2.5a2.1 2.1 0 013 3L12 14l-4 1 1-4z"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 11-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 110-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 114 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 110 4h-.09a1.65 1.65 0 00-1.51 1z"/>',
  phone: '<path d="M22 16.9v3a2 2 0 01-2.2 2 19.8 19.8 0 01-8.6-3.1 19.5 19.5 0 01-6-6A19.8 19.8 0 012.1 4.2 2 2 0 014.1 2h3a2 2 0 012 1.7c.1.9.4 1.8.7 2.7a2 2 0 01-.5 2.1L8 9.8a16 16 0 006 6l1.3-1.3a2 2 0 012.1-.4c.9.3 1.8.6 2.7.7a2 2 0 011.7 2z"/>',
  video: '<path d="M23 7l-7 5 7 5V7z"/><rect x="1" y="5" width="15" height="14" rx="3"/>',
  info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>',
  camera: '<path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/>',
  image: '<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/>',
  heart: '<path d="M20.8 4.6a5.5 5.5 0 00-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 00-7.8 7.8l1 1.1L12 21l7.8-7.5 1-1.1a5.5 5.5 0 000-7.8z"/>',
  sparkle: '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/><path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  close: '<path d="M18 6L6 18M6 6l12 12"/>',
  chevdown: '<path d="M6 9l6 6 6-6"/>',
  chevright: '<path d="M9 6l6 6-6 6"/>',
  users: '<path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>',
  user: '<path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>',
  edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4z"/>',
  trash: '<path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6"/>',
  upload: '<path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"/>',
  download: '<path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/>',
  palette: '<circle cx="13.5" cy="6.5" r="1.5"/><circle cx="17.5" cy="10.5" r="1.5"/><circle cx="8.5" cy="7.5" r="1.5"/><circle cx="6.5" cy="12.5" r="1.5"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.9 0 1.7-.8 1.7-1.7 0-.4-.2-.8-.4-1.1-.3-.3-.4-.7-.4-1.1 0-.9.8-1.7 1.7-1.7h2c3.1 0 5.6-2.5 5.6-5.6C22 6 17.5 2 12 2z"/>',
  reply: '<path d="M9 14L4 9l5-5"/><path d="M20 20v-7a4 4 0 00-4-4H4"/>',
  copy: '<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>',
  refresh: '<path d="M23 4v6h-6M1 20v-6h6"/><path d="M3.5 9a9 9 0 0114.9-3.4L23 10M1 14l4.6 4.4A9 9 0 0020.5 15"/>',
  check: '<path d="M20 6L9 17l-5-5"/>',
  smile: '<circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01"/>',
  key: '<path d="M21 2l-2 2m-7.6 7.6a5.5 5.5 0 11-7.8 7.8 5.5 5.5 0 017.8-7.8zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/>',
  broom: '<path d="M3 21l7-7M14 4l6 6-7 7-6-6z"/>',
  moon: '<path d="M21 12.8A9 9 0 1111.2 3a7 7 0 009.8 9.8z"/>',
};
const ic = (n, s = 24, w = 2) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round">${ICONS[n] || ''}</svg>`;
const DEFAULT_AV = 'data:image/svg+xml,' + encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' fill='#c7c7c7'/><circle cx='50' cy='39' r='18' fill='#fff'/><path d='M13 95c3-21 18-32 37-32s34 11 37 32' fill='#fff'/></svg>`);

function toast(msg, ms = 2200) {
  $$('.toast').forEach(t => t.remove());
  const t = document.createElement('div');
  t.className = 'toast'; t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), ms);
}
function ago(ts) {
  const s = (Date.now() - ts) / 1000;
  if (s < 60) return 'now';
  if (s < 3600) return Math.floor(s / 60) + 'm';
  if (s < 86400) return Math.floor(s / 3600) + 'h';
  if (s < 604800) return Math.floor(s / 86400) + 'd';
  return Math.floor(s / 604800) + 'w';
}
function sepFmt(ts) {
  const d = new Date(ts), now = new Date();
  const time = d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  const day0 = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  if (ts >= day0) return time;
  if (ts >= day0 - 864e5) return 'Yesterday ' + time;
  if (ts >= day0 - 6 * 864e5) return d.toLocaleDateString([], { weekday: 'short' }) + ' ' + time;
  if (d.getFullYear() === now.getFullYear()) return d.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ', ' + time;
  return d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) + ', ' + time;
}
function linkify(s) {
  return esc(s).replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank" rel="noopener">$1</a>');
}
function isEmojiOnly(s) {
  const t = String(s || '').replace(/\s/g, '');
  if (!t || t.length > 24) return false;
  if (!/^(?:\p{Extended_Pictographic}(?:️|\p{Emoji_Modifier}|‍\p{Extended_Pictographic}️?)*)+$/u.test(t)) return false;
  return (t.match(/\p{Extended_Pictographic}/gu) || []).length <= 3;
}

// ---------- Storage (IndexedDB key/value) ----------
const DB = {
  db: null, mem: {},
  open() {
    return new Promise(res => {
      try {
        const r = indexedDB.open('ig-ai-chat', 1);
        r.onupgradeneeded = () => r.result.createObjectStore('kv');
        r.onsuccess = () => { this.db = r.result; res(); };
        r.onerror = () => res();
      } catch (e) { res(); }
    });
  },
  get(k) {
    return new Promise(res => {
      if (!this.db) return res(this.mem[k]);
      const q = this.db.transaction('kv').objectStore('kv').get(k);
      q.onsuccess = () => res(q.result); q.onerror = () => res(undefined);
    });
  },
  set(k, v) { if (!this.db) { this.mem[k] = v; return; } this.db.transaction('kv', 'readwrite').objectStore('kv').put(v, k); },
  del(k) { if (!this.db) { delete this.mem[k]; return; } this.db.transaction('kv', 'readwrite').objectStore('kv').delete(k); },
};

// ---------- State ----------
const PROVIDERS = {
  xai: { label: 'xAI — Grok', base: 'https://api.x.ai/v1', model: 'grok-4', fmt: 'openai', keyUrl: 'console.x.ai' },
  openai: { label: 'OpenAI — ChatGPT', base: 'https://api.openai.com/v1', model: 'gpt-4o-mini', fmt: 'openai', keyUrl: 'platform.openai.com' },
  anthropic: { label: 'Anthropic — Claude', base: 'https://api.anthropic.com/v1', model: 'claude-sonnet-5-5', fmt: 'anthropic', keyUrl: 'console.anthropic.com' },
  gemini: { label: 'Google — Gemini', base: 'https://generativelanguage.googleapis.com/v1beta/openai', model: 'gemini-2.5-flash', fmt: 'openai', keyUrl: 'aistudio.google.com' },
  openrouter: { label: 'OpenRouter (any model)', base: 'https://openrouter.ai/api/v1', model: 'x-ai/grok-4', fmt: 'openai', keyUrl: 'openrouter.ai' },
  groq: { label: 'Groq', base: 'https://api.groq.com/openai/v1', model: 'llama-3.3-70b-versatile', fmt: 'openai', keyUrl: 'console.groq.com' },
  deepseek: { label: 'DeepSeek', base: 'https://api.deepseek.com/v1', model: 'deepseek-chat', fmt: 'openai', keyUrl: 'platform.deepseek.com' },
  custom: { label: 'Custom (OpenAI-compatible)', base: '', model: '', fmt: 'openai', keyUrl: '' },
};
const DEFAULT_SETTINGS = {
  provider: 'xai', apiKey: '', baseUrl: PROVIDERS.xai.base, model: PROVIDERS.xai.model,
  temperature: 0.9, maxTokens: 600, historyLimit: 40, replyDelay: 1.2,
  typingDelay: true, sendImages: false, dark: true,
};
let S = null;      // { me, settings, bots, chats }
const M = {};      // chatId -> messages[]
const busy = {}, typing = {}, again = {}, replyTimers = {};
let replyTo = null;
const shown = {};

const dirty = new Set(); let saveT = null;
function save(key = 'state') {
  dirty.add(key);
  clearTimeout(saveT);
  saveT = setTimeout(flush, 250);
}
function flush() {
  for (const k of dirty) {
    if (k === 'state') DB.set('state', S);
    else if (k.startsWith('m:')) { const id = k.slice(2); if (M[id]) DB.set(k, M[id]); else DB.del(k); }
  }
  dirty.clear();
}
const saveMsgs = id => save('m:' + id);

function newBot(o = {}) {
  return Object.assign({
    id: 'b' + uid(), name: '', username: '', avatar: null, bio: '', note: '',
    personality: '', startLine: '', style: '', examples: '',
    model: '', temperature: null, multiBubble: true, reactions: true, active: true, created: Date.now(),
  }, o);
}
function seed() {
  S = { me: { name: 'You', username: 'me', avatar: null, about: '', note: '' }, settings: clone(DEFAULT_SETTINGS), bots: {}, chats: {} };
  const b = newBot({
    name: 'Mia', username: 'mia.wav', note: 'need coffee ☕', bio: 'art student · thrift queen · LA 🌴',
    personality: "You're Mia, 23, an art student in LA who loves indie music, thrifting and late-night talks. Warm, playful, a little sarcastic, and genuinely interested in the person you're talking to. You have your own opinions, moods and stories from your day.",
    style: 'lowercase texting, short messages, occasional emojis, casual slang like lol, ngl, fr',
    startLine: 'heyyy\nwhat are u up to rn',
  });
  S.bots[b.id] = b;
  createDM(b);
}

// ---------- Chats ----------
function createDM(bot) {
  const c = { id: 'c' + uid(), type: 'dm', botId: bot.id, theme: 'default', bgImage: null, bgDim: 0.25, updated: Date.now(), unread: 0, seenAt: 0 };
  S.chats[c.id] = c; M[c.id] = [];
  addStartLine(c, bot);
  save(); saveMsgs(c.id);
  return c;
}
function addStartLine(c, bot) {
  if (!bot.startLine?.trim() || M[c.id].length) return;
  const parts = bot.multiBubble === false ? [bot.startLine.trim()] : bot.startLine.split(/\n+/).map(s => s.trim()).filter(Boolean);
  let ts = Date.now() - parts.length * 1000;
  for (const p of parts) M[c.id].push({ id: uid(), from: bot.id, text: p, ts: ts += 1000 });
  c.updated = Date.now(); c.unread = (c.unread || 0) + 1;
}
const dmFor = botId => Object.values(S.chats).find(c => c.type === 'dm' && c.botId === botId);
const nameOf = id => id === 'me' ? (S.me.name || 'You') : (S.bots[id]?.name || 'Someone');
const avOf = id => (id === 'me' ? S.me.avatar : S.bots[id]?.avatar) || DEFAULT_AV;
function chatName(c) {
  if (c.type === 'dm') return S.bots[c.botId]?.name || 'Unknown';
  return c.name || c.members.map(nameOf).join(', ') || 'Group';
}
function chatAvatar(c, size) {
  if (c.type === 'dm') {
    const b = S.bots[c.botId];
    return `<div class="avwrap" style="width:${size}px;height:${size}px"><img class="av" src="${esc(avOf(c.botId))}" style="width:${size}px;height:${size}px">${b?.active !== false ? '<span class="on"></span>' : ''}</div>`;
  }
  if (c.avatar) return `<img class="av" src="${esc(c.avatar)}" style="width:${size}px;height:${size}px">`;
  const ms = c.members.slice(0, 2), s2 = Math.round(size * 0.72);
  if (ms.length < 2) return `<img class="av" src="${esc(avOf(ms[0]))}" style="width:${size}px;height:${size}px">`;
  return `<div class="gav" style="width:${size}px;height:${size}px">${ms.map(m => `<img src="${esc(avOf(m))}" style="width:${s2}px;height:${s2}px">`).join('')}</div>`;
}

// ---------- Themes ----------
const svgBg = svg => `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
const HEARTS = svgBg(`<svg xmlns='http://www.w3.org/2000/svg' width='80' height='80'><g fill='#fff' fill-opacity='.45'><path d='M20 30c-6-5-12-9-12-15a6 6 0 0112-2 6 6 0 0112 2c0 6-6 10-12 15z'/><path transform='translate(40 40) scale(.7)' d='M20 30c-6-5-12-9-12-15a6 6 0 0112-2 6 6 0 0112 2c0 6-6 10-12 15z'/></g></svg>`);
const STARS = svgBg(`<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120'><g fill='#fff'><circle cx='10' cy='20' r='1.2' opacity='.8'/><circle cx='60' cy='8' r='.8' opacity='.6'/><circle cx='95' cy='40' r='1.5' opacity='.9'/><circle cx='30' cy='70' r='.9' opacity='.5'/><circle cx='80' cy='95' r='1.1' opacity='.7'/><circle cx='110' cy='110' r='.7' opacity='.6'/><circle cx='50' cy='45' r='.6' opacity='.5'/><path d='M70 60l1.5 4 4 1.5-4 1.5-1.5 4-1.5-4-4-1.5 4-1.5z' opacity='.8'/></g></svg>`);
const DOTS = svgBg(`<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24'><circle cx='3' cy='3' r='1.2' fill='#000' fill-opacity='.07'/></svg>`);
const WAVES = svgBg(`<svg xmlns='http://www.w3.org/2000/svg' width='100' height='40'><path d='M0 20c25-14 25 14 50 0s25 14 50 0' fill='none' stroke='#fff' stroke-opacity='.12' stroke-width='2'/></svg>`);
const LEAVES = svgBg(`<svg xmlns='http://www.w3.org/2000/svg' width='90' height='90'><g fill='#386641' fill-opacity='.12'><ellipse cx='20' cy='22' rx='7' ry='13' transform='rotate(30 20 22)'/><ellipse cx='65' cy='60' rx='6' ry='11' transform='rotate(-35 65 60)'/></g></svg>`);
const THEMES = [
  { id: 'default', name: 'Default', grad: ['#a02ef5', '#6c4cf6', '#3c7dfb'] },
  { id: 'love', name: 'Love', bg: `${HEARTS}, linear-gradient(180deg,#ffc2d4,#ff8fab)`, grad: ['#ff4f8b', '#ff2e63'], other: 'rgba(255,255,255,.88)', otherText: '#2b0b16', meta: '#6b1d36' },
  { id: 'galaxy', name: 'Galaxy', bg: `${STARS}, radial-gradient(circle at 30% 20%,#4b1f80,#120a2e 60%,#05030f)`, grad: ['#d36bff', '#8a3cff', '#4a3cff'], other: 'rgba(255,255,255,.14)', otherText: '#fff', meta: '#c9b8ef' },
  { id: 'ocean', name: 'Ocean', bg: `${WAVES}, linear-gradient(180deg,#03396c,#0e6aa8 55%,#36a9d8)`, grad: ['#00d2ff', '#0077ff'], other: 'rgba(255,255,255,.18)', otherText: '#fff', meta: '#d6efff' },
  { id: 'tiedye', name: 'Tie-dye', bg: 'conic-gradient(from 200deg at 40% 40%,#ffb3c7,#ffe29a,#b4f1c9,#a7d8ff,#d6b4ff,#ffb3c7)', grad: ['#ff5fa2', '#9d5cff', '#4b7bff'], other: 'rgba(255,255,255,.85)', otherText: '#111', meta: '#333' },
  { id: 'lofi', name: 'Lo-fi', bg: `${DOTS}, #efe1c6`, grad: ['#d29a62', '#a0683a'], other: '#fffaf0', otherText: '#3b2a1a', meta: '#7a6045' },
  { id: 'citrus', name: 'Citrus', bg: 'linear-gradient(180deg,#fff6b7,#ffc24b)', grad: ['#ffab00', '#ff6a00'], other: 'rgba(255,255,255,.88)', otherText: '#2a1a00', meta: '#7a4b00' },
  { id: 'avocado', name: 'Avocado', bg: `${LEAVES}, #dfe8c8`, grad: ['#7fb25a', '#3e7a3a'], other: '#fbfdf5', otherText: '#1f2d14', meta: '#4b5e3a' },
  { id: 'berry', name: 'Berry', bg: 'linear-gradient(180deg,#2a0838,#5c1474 60%,#8e1f6b)', grad: ['#ff2f92', '#a03cff'], other: 'rgba(255,255,255,.15)', otherText: '#fff', meta: '#f0c6e6' },
  { id: 'sunset', name: 'Sunset', bg: 'linear-gradient(180deg,#ff9a8b,#ff6a88 50%,#ff99ac)', grad: ['#ff5e62', '#ff2a68'], other: 'rgba(255,255,255,.85)', otherText: '#2a0b10', meta: '#5a1622' },
  { id: 'mono', name: 'Monochrome', bg: '#f2f2f2', grad: ['#4a4a4a', '#111'], other: '#fff', otherText: '#000', meta: '#555' },
  { id: 'midnight', name: 'Midnight', bg: 'linear-gradient(180deg,#0b1020,#111a33)', grad: ['#3a8dff', '#1f5cff'], other: '#1d2742', otherText: '#e6ecff', meta: '#8a96b8' },
];
function themeOf(c) { return THEMES.find(t => t.id === c.theme) || THEMES[0]; }
function themeStyle(c) {
  const t = themeOf(c);
  let s = `--grad:linear-gradient(to bottom,${t.grad.join(',')});--grad-solid:${t.grad[t.grad.length - 1]};`;
  if (t.other) s += `--t-other:${t.other};--t-other-text:${t.otherText};--t-text:${c.bgImage ? '#fff' : t.otherText};`;
  else if (c.bgImage) s += `--t-text:#fff;`;
  if (t.meta && !c.bgImage) s += `--meta:${t.meta};`;
  if (c.bgImage) s += `--meta:#fff;`;
  return s;
}

// ---------- HTTP (native bridge on Android avoids CORS) ----------
const httpWait = {}; let httpN = 0;
window.__httpCb = (id, status, b64) => {
  const f = httpWait[id]; delete httpWait[id];
  let text = '';
  try { text = new TextDecoder().decode(Uint8Array.from(atob(b64), c => c.charCodeAt(0))); } catch (e) { text = ''; }
  f && f({ status, text });
};
function http(method, url, headers = {}, body = '') {
  if (window.AndroidBridge?.http) {
    return new Promise(res => {
      const id = 'h' + (++httpN);
      httpWait[id] = res;
      AndroidBridge.http(id, method, url, JSON.stringify(headers), body || '');
    });
  }
  return fetch(url, { method, headers, body: method === 'GET' ? undefined : body })
    .then(async r => ({ status: r.status, text: await r.text() }))
    .catch(e => ({ status: 0, text: 'Network error: ' + e.message + (location.protocol.startsWith('http') || location.protocol === 'file:' ? ' (in a desktop browser this is usually CORS — it works in the Android app)' : '') }));
}
function apiErr(r) {
  let msg = r.text;
  try { const j = JSON.parse(r.text); msg = j.error?.message || j.error || j.message || j.detail || r.text; if (typeof msg !== 'string') msg = JSON.stringify(msg); } catch (e) {}
  return new Error((r.status ? `HTTP ${r.status}: ` : '') + trunc(msg || 'No response', 300));
}

// ---------- AI ----------
function apiConf(modelOverride) {
  const st = S.settings, P = PROVIDERS[st.provider] || PROVIDERS.custom;
  return { P, base: (st.baseUrl || P.base).replace(/\/+$/, ''), key: st.apiKey.trim(), model: (modelOverride || st.model || P.model).trim() };
}
async function callAI({ system, messages, model, temperature, maxTokens }) {
  const { P, base, key, model: mdl } = apiConf(model);
  if (!key && S.settings.provider !== 'custom') throw new Error('Add your API key in Settings (gear icon on the inbox).');
  if (!base) throw new Error('Set an API base URL in Settings.');
  if (!mdl) throw new Error('Set a model name in Settings.');
  const temp = temperature ?? S.settings.temperature, max = maxTokens || S.settings.maxTokens;

  if (P.fmt === 'anthropic') {
    const msgs = messages.map(m => ({
      role: m.role,
      content: m.images?.length
        ? [...m.images.map(u => ({ type: 'image', source: { type: 'base64', media_type: u.slice(5, u.indexOf(';')), data: u.slice(u.indexOf(',') + 1) } })), { type: 'text', text: m.text || '(photo)' }]
        : (m.text || '…'),
    }));
    if (!msgs.length || msgs[0].role !== 'user') msgs.unshift({ role: 'user', content: '[conversation start]' });
    const r = await http('POST', base + '/messages', { 'Content-Type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' },
      JSON.stringify({ model: mdl, system, messages: msgs, max_tokens: max, temperature: Math.min(temp, 1) }));
    if (r.status !== 200) throw apiErr(r);
    const j = JSON.parse(r.text);
    return (j.content || []).filter(p => p.type === 'text').map(p => p.text).join('\n');
  }

  const msgs = [{ role: 'system', content: system }, ...messages.map(m => ({
    role: m.role,
    content: m.images?.length ? [{ type: 'text', text: m.text || '(photo)' }, ...m.images.map(u => ({ type: 'image_url', image_url: { url: u } }))] : (m.text || '…'),
  }))];
  const headers = { 'Content-Type': 'application/json' };
  if (key) headers.Authorization = 'Bearer ' + key;
  if (S.settings.provider === 'openrouter') { headers['HTTP-Referer'] = 'https://ig-ai-chat.local'; headers['X-Title'] = 'AI DMs'; }
  const body = { model: mdl, messages: msgs, temperature: temp, max_tokens: max };
  for (let attempt = 0; attempt < 3; attempt++) {
    const r = await http('POST', base + '/chat/completions', headers, JSON.stringify(body));
    if (r.status === 200) {
      const j = JSON.parse(r.text);
      let c = j.choices?.[0]?.message?.content;
      if (Array.isArray(c)) c = c.map(p => p.text || '').join('');
      if (c == null) throw new Error('Empty response from model');
      return c;
    }
    // Some newer models reject these params — adapt and retry.
    const t = r.text.toLowerCase();
    if (r.status === 400 && t.includes('max_tokens') && body.max_tokens) { body.max_completion_tokens = body.max_tokens; delete body.max_tokens; continue; }
    if (r.status === 400 && t.includes('temperature') && 'temperature' in body) { delete body.temperature; continue; }
    throw apiErr(r);
  }
  throw new Error('Request failed');
}
async function listModels() {
  const { P, base, key } = apiConf();
  const h = P.fmt === 'anthropic' ? { 'x-api-key': key, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' } : (key ? { Authorization: 'Bearer ' + key } : {});
  const r = await http('GET', base + '/models', h);
  if (r.status !== 200) throw apiErr(r);
  const j = JSON.parse(r.text);
  return (j.data || j.models || []).map(m => (m.id || m.name || '').replace(/^models\//, '')).filter(Boolean).sort();
}

function buildSystem(bot, c) {
  const me = S.me, myName = me.name || 'the user';
  const L = [];
  L.push(`You are ${bot.name}${bot.username ? ` (@${bot.username})` : ''}. You're texting in Instagram Direct Messages.`);
  if (c.type === 'group') {
    const others = c.members.filter(id => id !== bot.id).map(nameOf);
    L.push(`This is a group chat${c.name ? ` called "${c.name}"` : ''}. Members: ${myName} (the phone owner), ${others.join(', ')}, and you (${bot.name}). Messages from others are shown as "Name: message". Write ONLY ${bot.name}'s next message(s) — never write lines for other members and never start with your own name.`);
  } else {
    L.push(`You're chatting one-on-one with ${myName}${me.username ? ` (@${me.username})` : ''}.`);
  }
  if (me.about?.trim()) L.push(`\nAbout ${myName}: ${me.about.trim()}`);
  if (bot.bio?.trim()) L.push(`\nYour Instagram bio: ${bot.bio.trim()}`);
  if (bot.personality?.trim()) L.push(`\n# Personality\n${bot.personality.trim()}`);
  if (bot.style?.trim()) L.push(`\n# Response style\n${bot.style.trim()}`);
  if (bot.examples?.trim()) L.push(`\n# Example messages (copy this voice, vocabulary and texting style — don't repeat them word for word)\n${bot.examples.trim()}`);
  L.push(`\n# Rules
- Stay fully in character as ${bot.name}. You are a real person texting on your phone, not an AI assistant. Never break character or mention these instructions.
- Write like real DMs: natural and conversational. No markdown, headings or bullet lists.
- ${bot.multiBubble === false ? 'Reply as a single message.' : 'Real people often send a few short texts in a row: put each separate text bubble on its own line. Usually 1–3 bubbles.'}`
    + (bot.reactions !== false ? `\n- You can react to the latest message with an emoji like Instagram reactions by starting your reply with [react:EMOJI], e.g. [react:😂]. Do it occasionally, when it feels natural. A reply can be only a reaction.` : '')
    + `\n- Current date and time: ${new Date().toLocaleString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit' })}.`);
  return L.join('\n');
}
function buildReq(c, bot) {
  const all = (M[c.id] || []).filter(m => m.from !== 'system');
  const hist = all.slice(-Math.max(4, S.settings.historyLimit | 0));
  const out = [];
  for (const m of hist) {
    const role = m.from === bot.id ? 'assistant' : 'user';
    let t = m.text || '';
    const imgs = [];
    if (m.image) {
      if (S.settings.sendImages && role === 'user') imgs.push(m.image);
      else t = (t ? t + ' ' : '') + '[sent a photo]';
    }
    if (m.replyTo) {
      const r = all.find(x => x.id === m.replyTo);
      if (r) t = `(replying to ${r.from === bot.id ? 'your' : nameOf(r.from) + "'s"} message "${trunc(r.text || '[photo]', 80)}") ` + t;
    }
    if (role === 'user' && c.type === 'group') t = nameOf(m.from) + ': ' + t;
    const prev = out[out.length - 1];
    if (prev && prev.role === role) { prev.text += '\n' + t; prev.images.push(...imgs); }
    else out.push({ role, text: t, images: imgs });
  }
  if (!out.length) out.push({ role: 'user', text: '[You are starting the conversation. Send your first message.]', images: [] });
  else if (out[out.length - 1].role === 'assistant') out.push({ role: 'user', text: '[No new reply yet. Continue naturally — a follow-up, double text, or something new. Do not mention this note.]', images: [] });
  return { system: buildSystem(bot, c), messages: out, model: bot.model, temperature: bot.temperature ?? undefined };
}
function parseReply(raw, bot, c) {
  let t = String(raw || '').replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
  let react = null;
  const rm = t.match(/^\s*\[react:\s*([^\]]{1,16})\]\s*/i);
  if (rm) { react = rm[1].trim(); t = t.slice(rm[0].length); }
  t = t.replace(/\[react:[^\]]*\]/gi, '').trim();
  if (/^"[^"]+"$/.test(t)) t = t.slice(1, -1);
  const selfPrefix = new RegExp('^\\s*\\**' + escRe(bot.name) + '\\**\\s*:\\s*', 'i');
  let lines = bot.multiBubble === false ? [t] : t.split(/\n+/);
  if (c.type === 'group') {
    const others = [S.me.name, ...c.members.filter(id => id !== bot.id).map(nameOf)].filter(Boolean);
    const otherRe = new RegExp('^\\s*\\**(' + others.map(escRe).join('|') + ')\\**\\s*:', 'i');
    const cut = lines.findIndex(l => otherRe.test(l));
    if (cut > 0) lines = lines.slice(0, cut); else if (cut === 0) lines = [];
  }
  let parts = lines.map(l => l.replace(selfPrefix, '').trim()).filter(Boolean);
  if (parts.length > 8) parts = [...parts.slice(0, 7), parts.slice(7).join('\n')];
  return { react, parts };
}

// ---------- Conversation engine ----------
function viewing(chatId) { const top = stack[stack.length - 1]; return top.name === 'chat' && top.id === chatId && !document.hidden; }
function refresh(chatId) {
  const top = stack[stack.length - 1];
  if (top.name === 'chat' && top.id === chatId) renderMsgs();
  else if (top.name === 'inbox') renderInboxList();
}
function pushMsg(c, m) {
  M[c.id].push(m);
  c.updated = m.ts;
  if (m.from !== 'me' && m.from !== 'system' && !viewing(c.id)) c.unread = (c.unread || 0) + 1;
  save(); saveMsgs(c.id);
}
function scheduleReply(c) {
  clearTimeout(replyTimers[c.id]);
  replyTimers[c.id] = setTimeout(() => autoReply(c.id), Math.max(0.2, +S.settings.replyDelay || 0) * 1000);
}
function pickResponders(c) {
  const last = [...M[c.id]].reverse().find(m => m.from === 'me');
  const text = (last?.text || '').toLowerCase();
  const mentioned = c.members.filter(id => {
    const b = S.bots[id]; if (!b) return false;
    const first = b.name.split(/\s+/)[0].toLowerCase();
    return (first && new RegExp('(^|[^\\p{L}])@?' + escRe(first) + '($|[^\\p{L}])', 'iu').test(text)) || (b.username && text.includes('@' + b.username.toLowerCase()));
  });
  const mode = c.replyMode || 'auto';
  if (mention_only(mode)) return mentioned;
  if (mentioned.length) return mentioned;
  const sh = c.members.filter(id => S.bots[id]).sort(() => Math.random() - 0.5);
  if (mode === 'all') return sh;
  const r = Math.random(), n = r < 0.55 ? 1 : r < 0.9 ? 2 : 3;
  return sh.slice(0, Math.min(n, sh.length));
}
const mention_only = m => m === 'mention';
async function autoReply(chatId) {
  const c = S.chats[chatId]; if (!c) return;
  if (busy[chatId]) { again[chatId] = true; return; }
  const last = M[chatId][M[chatId].length - 1];
  if (!last || last.from !== 'me') return;
  const who = c.type === 'dm' ? [c.botId] : pickResponders(c);
  busy[chatId] = true;
  try { for (const id of who) { if (!S.chats[chatId]) break; await runBot(c, id); } }
  finally { busy[chatId] = false; }
  if (again[chatId]) { again[chatId] = false; autoReply(chatId); }
}
async function nudge(c, botId) {
  if (busy[c.id]) return toast('Someone is already typing…');
  busy[c.id] = true;
  try { await runBot(c, botId); } finally { busy[c.id] = false; }
  if (again[c.id]) { again[c.id] = false; autoReply(c.id); }
}
async function runBot(c, botId) {
  const bot = S.bots[botId]; if (!bot) return;
  c.seenAt = Date.now(); save();
  typing[c.id] = botId; refresh(c.id);
  let raw;
  try {
    raw = await callAI(buildReq(c, bot));
  } catch (e) {
    typing[c.id] = null;
    pushMsg(c, { id: uid(), from: 'system', err: true, retry: botId, text: `Couldn't get ${bot.name}'s reply — ${e.message}. Tap to retry.`, ts: Date.now() });
    refresh(c.id);
    return;
  }
  const { react, parts } = parseReply(raw, bot, c);
  if (react) {
    const target = [...M[c.id]].reverse().find(m => m.from !== botId && m.from !== 'system');
    if (target) { target.reactions = Object.assign(target.reactions || {}, { [botId]: react }); saveMsgs(c.id); }
  }
  for (let i = 0; i < parts.length; i++) {
    if (!S.chats[c.id]) return;
    if (S.settings.typingDelay) {
      typing[c.id] = botId; refresh(c.id);
      await sleep(Math.min(i === 0 ? 900 : 3200, 350 + parts[i].length * (i === 0 ? 12 : 38)));
    }
    pushMsg(c, { id: uid(), from: botId, text: parts[i], ts: Date.now() });
    refresh(c.id);
  }
  typing[c.id] = null; refresh(c.id);
}

// ---------- Overlays ----------
let curOverlay = null;
function overlay(html, center) {
  closeOverlay();
  const o = document.createElement('div');
  o.className = 'overlay' + (center ? ' center' : '');
  o.innerHTML = html;
  o.addEventListener('click', e => { if (e.target === o) closeOverlay(); });
  document.body.appendChild(o);
  curOverlay = o;
  return o;
}
function closeOverlay() { if (curOverlay) { curOverlay.remove(); curOverlay = null; } }
function sheet(title, items) {
  const o = overlay(`<div class="sheet"><div class="grab"></div>${title ? `<h4>${esc(title)}</h4>` : ''}${items.map((it, i) =>
    `<button class="list-btn ${it.danger ? 'danger' : ''}" data-i="${i}">${it.icon ? `<span class="ic">${it.icon.startsWith('<') ? it.icon : ic(it.icon)}</span>` : ''}${esc(it.label)}${it.right ? `<span class="r">${esc(it.right)}</span>` : ''}</button>`).join('')}</div>`);
  $$('.list-btn', o).forEach(b => b.onclick = () => { closeOverlay(); items[+b.dataset.i].fn(); });
}
function confirmBox(title, msg, ok = 'OK', danger = false) {
  return new Promise(res => {
    const o = overlay(`<div class="modal"><h4>${esc(title)}</h4>${msg ? `<p>${esc(msg)}</p>` : ''}<div class="btns">
      <button class="pbtn wide" id="ok" style="${danger ? 'background:var(--danger)' : ''}">${esc(ok)}</button><button class="sbtn wide" id="no" style="padding:12px">Cancel</button></div></div>`, true);
    $('#ok', o).onclick = () => { closeOverlay(); res(true); };
    $('#no', o).onclick = () => { closeOverlay(); res(false); };
  });
}
function promptBox(title, value = '', multiline = false, placeholder = '') {
  return new Promise(res => {
    const o = overlay(`<div class="modal"><h4>${esc(title)}</h4><div class="fld">${multiline
      ? `<textarea id="pv" placeholder="${esc(placeholder)}">${esc(value)}</textarea>`
      : `<input type="text" id="pv" value="${esc(value)}" placeholder="${esc(placeholder)}">`}</div>
      <div class="btns"><button class="pbtn wide" id="ok">Save</button><button class="sbtn wide" id="no" style="padding:12px">Cancel</button></div></div>`, true);
    const inp = $('#pv', o); setTimeout(() => inp.focus(), 50);
    $('#ok', o).onclick = () => { closeOverlay(); res(inp.value); };
    $('#no', o).onclick = () => { closeOverlay(); res(null); };
  });
}
function viewImage(src) {
  const v = document.createElement('div');
  v.className = 'viewer';
  v.innerHTML = `<img src="${esc(src)}"><button class="ibtn">${ic('close', 28)}</button>`;
  v.onclick = () => { v.remove(); if (curOverlay === v) curOverlay = null; };
  document.body.appendChild(v);
  curOverlay = v;
}

// ---------- Files ----------
function pickFile(accept) {
  return new Promise(res => {
    const inp = $('#filepick');
    inp.value = ''; inp.accept = accept;
    inp.onchange = () => res(inp.files[0] || null);
    inp.click();
  });
}
function readImage(file, max, square) {
  return new Promise((res, rej) => {
    const url = URL.createObjectURL(file), img = new Image();
    img.onload = () => {
      let sx = 0, sy = 0, sw = img.width, sh = img.height;
      if (square) { const m = Math.min(sw, sh); sx = (sw - m) / 2; sy = (sh - m) / 2; sw = sh = m; }
      const s = Math.min(1, max / Math.max(sw, sh)), w = Math.round(sw * s), h = Math.round(sh * s);
      const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
      cv.getContext('2d').drawImage(img, sx, sy, sw, sh, 0, 0, w, h);
      URL.revokeObjectURL(url);
      res(cv.toDataURL('image/jpeg', 0.86));
    };
    img.onerror = () => rej(new Error('Could not read that image'));
    img.src = url;
  });
}
async function pickImage(max = 1280, square = false) {
  const f = await pickFile('image/*');
  if (!f) return null;
  try { return await readImage(f, max, square); } catch (e) { toast(e.message); return null; }
}
function saveFile(name, text) {
  if (window.AndroidBridge?.saveFile) {
    const r = AndroidBridge.saveFile(name, text);
    toast(r && !r.startsWith('ERR') ? 'Saved to Downloads/' + name : 'Could not save: ' + r, 3000);
    return;
  }
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
  a.download = name; a.click();
}

// ---------- Chat history import ----------
function fixMojibake(s) {
  if (typeof s !== 'string' || !/[À-ÿ]/.test(s)) return s;
  try { return decodeURIComponent(escape(s)); } catch (e) { return s; }
}
function parseChatJSON(text) {
  let j;
  try { j = JSON.parse(text); } catch (e) { throw new Error('That file is not valid JSON.'); }
  let arr = Array.isArray(j) ? j : (j.messages || j.chat || j.history || j.conversation || j.data);
  if (!Array.isArray(arr)) throw new Error('Could not find a list of messages in this file.');
  const isIG = !Array.isArray(j) && Array.isArray(j.participants);
  let msgs = [];
  for (const m of arr) {
    if (!m || typeof m !== 'object') continue;
    let sender = m.sender_name ?? m.sender ?? m.from ?? m.author ?? m.name ?? m.speaker ?? m.user ?? m.role;
    let txt = m.content ?? m.text ?? m.message ?? m.body ?? m.mes ?? m.msg;
    if (Array.isArray(txt)) txt = txt.map(p => typeof p === 'string' ? p : p.text || '').join(' ');
    if (sender && typeof sender === 'object') sender = sender.name || sender.username || JSON.stringify(sender);
    if (typeof txt !== 'string' || !txt.trim() || sender == null) continue;
    if (/^\s*(<Media omitted>|\[[\w ,]*attachment\]|Message unavailable|This message was deleted)\s*$/i.test(txt)) continue;
    if (isIG) { sender = fixMojibake(sender); txt = fixMojibake(txt); if (/^(Liked a message|Reacted .{1,8} to your message|.* sent an attachment\.)$/.test(txt)) continue; }
    if (m.is_user === true) sender = 'user'; else if (m.is_user === false && !m.name) sender = 'assistant';
    if (sender === 'system') continue;
    let ts = m.timestamp_ms ?? m.timestamp ?? m.ts ?? m.time ?? m.date ?? m.created_at ?? m.send_date;
    if (typeof ts === 'string') ts = Date.parse(ts);
    if (typeof ts === 'number' && ts < 1e12) ts *= 1000;
    msgs.push({ sender: String(sender), text: txt.trim(), ts: Number.isFinite(ts) ? ts : null });
  }
  if (!msgs.length) throw new Error('No text messages found in this file.');
  if (msgs.every(m => m.ts) ) msgs.sort((a, b) => a.ts - b.ts);
  const senders = [...new Set(msgs.map(m => m.sender))];
  return { msgs, senders };
}
function importDialog(botName) {
  return new Promise(async res => {
    const f = await pickFile('application/json,.json,text/plain,*/*');
    if (!f) return res(null);
    let parsed;
    try { parsed = parseChatJSON(await f.text()); } catch (e) { toast(e.message, 3500); return res(null); }
    const { msgs, senders } = parsed;
    const guess = senders.find(s => /^(user|me|you|human)$/i.test(s)) || senders.find(s => s.toLowerCase() === (S.me.name || '').toLowerCase()) || senders[senders.length > 1 ? 1 : 0];
    const o = overlay(`<div class="modal"><h4>Import chat history</h4>
      <p>Found ${msgs.length} messages from ${senders.length} sender${senders.length > 1 ? 's' : ''}.</p>
      <div class="fld"><label>Which sender is you?</label><select id="me">${senders.map(s => `<option ${s === guess ? 'selected' : ''}>${esc(s)}</option>`).join('')}</select>
      <div class="hint">Everyone else becomes ${esc(botName || 'this person')}.</div></div>
      <div class="tog"><div class="l">Add messages to the chat<small>They'll show up as past messages in the conversation.</small></div><div class="sw on" data-k="add"></div></div>
      <div class="tog"><div class="l">Learn the texting style<small>Adds them to "Example messages" so the AI copies how they text.</small></div><div class="sw on" data-k="learn"></div></div>
      <div class="btns"><button class="pbtn wide" id="ok">Import</button><button class="sbtn wide" id="no" style="padding:12px">Cancel</button></div></div>`, true);
    $$('.sw', o).forEach(s => s.onclick = () => s.classList.toggle('on'));
    $('#no', o).onclick = () => { closeOverlay(); res(null); };
    $('#ok', o).onclick = () => {
      const meName = $('#me', o).value;
      const r = { msgs, meName, add: $('[data-k=add]', o).classList.contains('on'), learn: $('[data-k=learn]', o).classList.contains('on') };
      closeOverlay(); res(r);
    };
  });
}
function applyImport(imp, bot, c) {
  if (!imp) return;
  if (imp.learn) {
    let lines = imp.msgs.map(m => `${m.sender === imp.meName ? (S.me.name || 'User') : bot.name}: ${m.text}`);
    let txt = '', i = lines.length - 1;
    while (i >= 0 && txt.length + lines[i].length < 6000) { txt = lines[i] + '\n' + txt; i--; }
    bot.examples = ((bot.examples || '').trim() + '\n' + txt.trim()).trim();
  }
  if (imp.add && c) {
    const n = imp.msgs.length, first = M[c.id][0]?.ts || Date.now();
    const base = Math.min(first, Date.now()) - n * 60000 - 3600e3;
    const add = imp.msgs.map((m, i) => ({ id: uid(), from: m.sender === imp.meName ? 'me' : bot.id, text: m.text, ts: m.ts && m.ts < first ? m.ts : base + i * 60000 }));
    M[c.id] = [...add, ...M[c.id]].sort((a, b) => a.ts - b.ts);
    c.updated = Math.max(c.updated, M[c.id][M[c.id].length - 1].ts);
    c.seenAt = Date.now();
    saveMsgs(c.id);
  }
  save();
}

// ---------- Router ----------
let stack = [{ name: 'inbox' }];
const app = $('#app');
function go(name, p = {}) { stack.push({ name, ...p }); render(true); }
function replace(name, p = {}) { stack[stack.length - 1] = { name, ...p }; render(true); }
function back() {
  if (curOverlay) { closeOverlay(); return true; }
  if (stack.length > 1) { stack.pop(); render(); return true; }
  return false;
}
window.__onBack = back;
function render(fwd) {
  const top = stack[stack.length - 1];
  replyTo = null;
  SCREENS[top.name](top);
  if (fwd) { const s = $('.screen', app); s && s.animate([{ transform: 'translateX(24px)', opacity: 0.6 }, { transform: 'none', opacity: 1 }], { duration: 160, easing: 'ease-out' }); }
}
const hdr = (title, right = '', opts = {}) => `<div class="hdr ${opts.border ? 'bordered' : ''}"><button class="ibtn" data-back>${ic('back', 28)}</button><div class="title ${opts.center ? 'center' : ''}"><span>${esc(title)}</span></div>${right || (opts.center ? '<div style="width:40px"></div>' : '')}</div>`;
function bindBack() { $$('[data-back]', app).forEach(b => b.onclick = back); }

const SCREENS = {};

// ---------- Inbox ----------
SCREENS.inbox = () => {
  const noKey = !S.settings.apiKey && S.settings.provider !== 'custom';
  const bots = Object.values(S.bots).filter(b => b.note?.trim()).sort((a, b) => b.created - a.created);
  app.innerHTML = `<div class="screen">
    <div class="hdr"><button class="title" id="meBtn" style="text-align:left"><span>${esc(S.me.username || S.me.name || 'you')}</span>${ic('chevdown', 18, 2.4)}</button>
      <button class="ibtn" id="setBtn">${ic('gear', 25, 1.8)}</button><button class="ibtn" id="newBtn">${ic('compose', 26, 1.8)}</button></div>
    <div class="scroll" id="inboxScroll">
      <div class="search">${ic('search', 16)}<input id="q" placeholder="Search"></div>
      ${noKey ? `<div style="margin:8px 16px;padding:12px 14px;border-radius:12px;background:var(--bg3);display:flex;gap:10px;align-items:center" id="keyBanner">${ic('key', 22)}<div style="flex:1;font-size:14px"><b>Add your AI API key</b><br><span style="color:var(--text2)">Grok, ChatGPT, Claude, Gemini and more</span></div>${ic('chevright', 18)}</div>` : ''}
      <div class="notes">
        <button class="note" id="myNote"><div class="bubble ${S.me.note ? '' : 'empty'}">${esc(S.me.note || 'Note...')}</div><img class="av" src="${esc(S.me.avatar || DEFAULT_AV)}" style="width:76px;height:76px"><div class="nm">Your note</div></button>
        ${bots.map(b => `<button class="note" data-bot="${b.id}"><div class="bubble">${esc(b.note)}</div><img class="av" src="${esc(avOf(b.id))}" style="width:76px;height:76px"><div class="nm">${esc(b.name)}</div></button>`).join('')}
      </div>
      <div class="sec"><span>Messages</span><span class="r">Requests</span></div>
      <div id="list"></div>
    </div></div>`;
  $('#meBtn').onclick = () => go('me');
  $('#setBtn').onclick = () => go('settings');
  $('#newBtn').onclick = () => go('new');
  if ($('#keyBanner')) $('#keyBanner').onclick = () => go('settings');
  $('#myNote').onclick = async () => { const v = await promptBox('Your note', S.me.note, false, 'Share a thought...'); if (v != null) { S.me.note = v.slice(0, 60); save(); render(); } };
  $$('[data-bot]').forEach(b => b.onclick = () => openDM(b.dataset.bot));
  $('#q').oninput = renderInboxList;
  renderInboxList();
};
function preview(c) {
  if (typing[c.id]) return c.type === 'group' ? `${nameOf(typing[c.id])} is typing...` : 'Typing...';
  const ms = M[c.id] || [];
  const m = [...ms].reverse().find(x => x.from !== 'system');
  if (!m) return c.type === 'group' ? 'Group created' : 'Say hi 👋';
  const body = m.image && !m.text ? 'Sent a photo' : (m.text || '');
  if (m.from === 'me') return 'You: ' + body;
  if (c.type === 'group') return nameOf(m.from) + ': ' + body;
  return body;
}
function renderInboxList() {
  const el = $('#list'); if (!el) return;
  const q = ($('#q')?.value || '').toLowerCase();
  const chats = Object.values(S.chats).filter(c => !q || chatName(c).toLowerCase().includes(q)).sort((a, b) => b.updated - a.updated);
  if (!chats.length) {
    el.innerHTML = q ? `<div class="empty-state">No results</div>` : `<div class="empty-state">${ic('compose', 56, 1.2)}<h3>Your messages</h3><div>Create an AI person and start chatting.</div><br><button class="pbtn" id="firstBtn">Create AI person</button></div>`;
    if ($('#firstBtn')) $('#firstBtn').onclick = () => go('editBot', {});
    return;
  }
  el.innerHTML = chats.map(c => `<div class="row ${c.unread ? 'unread' : ''}" data-c="${c.id}">${chatAvatar(c, 56)}
    <div class="mid"><div class="nm">${esc(chatName(c))}</div><div class="sub"><span class="t">${esc(preview(c))}</span><span>· ${ago(c.updated)}</span></div></div>
    ${c.unread ? '<span class="dot"></span>' : `<span class="cam">${ic('camera', 24, 1.6)}</span>`}</div>`).join('');
  $$('.row', el).forEach(r => {
    r.onclick = () => go('chat', { id: r.dataset.c });
    longPress(r, () => {
      const c = S.chats[r.dataset.c];
      sheet(chatName(c), [
        { label: 'Mark as ' + (c.unread ? 'read' : 'unread'), icon: 'check', fn: () => { c.unread = c.unread ? 0 : 1; save(); renderInboxList(); } },
        { label: 'Delete chat', icon: 'trash', danger: true, fn: () => deleteChat(c) },
      ]);
    });
  });
}
function openDM(botId) {
  const c = dmFor(botId) || createDM(S.bots[botId]);
  go('chat', { id: c.id });
}
async function deleteChat(c) {
  if (!(await confirmBox('Delete chat?', 'This deletes all messages in this chat. The AI person is kept.', 'Delete', true))) return;
  delete S.chats[c.id]; delete M[c.id]; save(); saveMsgs(c.id);
  while (stack.length > 1 && stack[stack.length - 1].id === c.id) stack.pop();
  render();
}

// ---------- Long press helper ----------
function longPress(el, fn, ms = 450) {
  let t = null, x = 0, y = 0;
  el.addEventListener('touchstart', e => { x = e.touches[0].clientX; y = e.touches[0].clientY; t = setTimeout(() => { t = null; el.dataset.lp = '1'; fn(e); }, ms); }, { passive: true });
  el.addEventListener('touchmove', e => { if (t && (Math.abs(e.touches[0].clientX - x) > 10 || Math.abs(e.touches[0].clientY - y) > 10)) { clearTimeout(t); t = null; } }, { passive: true });
  el.addEventListener('touchend', () => { clearTimeout(t); t = null; });
  el.addEventListener('contextmenu', e => { e.preventDefault(); if (!el.dataset.lp) fn(e); });
  el.addEventListener('click', e => { if (el.dataset.lp) { e.stopImmediatePropagation(); e.preventDefault(); delete el.dataset.lp; } }, true);
}

// ---------- Chat ----------
SCREENS.chat = ({ id }) => {
  const c = S.chats[id];
  if (!c) { stack.pop(); return render(); }
  c.unread = 0; save();
  const isG = c.type === 'group', bot = S.bots[c.botId];
  const sub = isG ? c.members.map(nameOf).join(', ') : (bot?.active !== false ? 'Active now' : (bot?.username || ''));
  const t = themeOf(c);
  const bg = c.bgImage ? `background-image:url('${c.bgImage}')` : (t.bg ? `background:${t.bg}` : '');
  app.innerHTML = `<div class="screen" id="chatScreen" style="${themeStyle(c)}">
    <div class="hdr chat-hdr"><button class="ibtn" data-back>${ic('back', 28)}</button>
      <button class="who" id="who">${chatAvatar(c, 36)}<div style="min-width:0;text-align:left"><div class="n">${esc(chatName(c))}</div><div class="s">${esc(sub)}</div></div></button>
      <button class="ibtn" id="call">${ic('phone', 24, 1.8)}</button><button class="ibtn" id="vid">${ic('video', 26, 1.8)}</button>${isG ? `<button class="ibtn" id="inf">${ic('info', 24, 1.8)}</button>` : ''}</div>
    <div class="chat-body"><div class="chat-bg" style="${esc(bg)}">${c.bgImage ? `<div class="dim" style="opacity:${c.bgDim ?? 0.25}"></div>` : ''}</div><div class="msgs" id="msgs"></div>
    <div id="replybar"></div>
    <div class="composer"><div class="pill">
      <button class="cam" id="camBtn">${ic('camera', 20, 2)}</button>
      <textarea id="inp" rows="1" placeholder="Message..."></textarea>
      <div class="icons" id="icons"><button class="ibtn" id="nudgeBtn" title="Let them text">${ic('sparkle', 23, 1.7)}</button><button class="ibtn" id="galBtn">${ic('image', 24, 1.7)}</button><button class="ibtn" id="heartBtn">${ic('heart', 24, 1.7)}</button></div>
      <button class="send" id="sendBtn" style="display:none">Send</button></div></div></div></div>`;
  bindBack();
  $('#who').onclick = () => go('info', { id });
  if ($('#inf')) $('#inf').onclick = () => go('info', { id });
  $('#call').onclick = $('#vid').onclick = () => toast("Calls aren't available here");
  const inp = $('#inp'), msgs = $('#msgs');
  inp.value = c.draft || '';
  const sync = () => {
    inp.style.height = '38px'; inp.style.height = Math.min(120, inp.scrollHeight) + 'px';
    const has = inp.value.trim().length > 0;
    $('#sendBtn').style.display = has ? '' : 'none'; $('#icons').style.display = has ? 'none' : '';
    c.draft = inp.value;
  };
  inp.oninput = () => { sync(); if (replyTimers[c.id]) scheduleReply(c); };
  inp.onkeydown = e => { if (e.key === 'Enter' && !e.shiftKey && !isAndroid) { e.preventDefault(); doSend(); } };
  const doSend = () => {
    const v = inp.value.trim(); if (!v) return;
    inp.value = ''; c.draft = ''; sync(); inp.focus();
    sendMine(c, { text: v });
  };
  $('#sendBtn').onclick = doSend;
  $('#sendBtn').addEventListener('mousedown', e => e.preventDefault());
  $('#heartBtn').onclick = () => sendMine(c, { text: '❤️' });
  $('#camBtn').onclick = $('#galBtn').onclick = async () => { const img = await pickImage(1280); if (img) sendMine(c, { image: img, text: '' }); };
  $('#nudgeBtn').onclick = () => {
    if (!isG) return nudge(c, c.botId);
    sheet('Who should text?', [
      { label: 'Anyone', icon: 'sparkle', fn: () => { const ids = c.members.filter(i => S.bots[i]); nudge(c, ids[Math.floor(Math.random() * ids.length)]); } },
      ...c.members.filter(i => S.bots[i]).map(i => ({ label: nameOf(i), icon: `<img class="av" src="${esc(avOf(i))}" style="width:24px;height:24px">`, fn: () => nudge(c, i) })),
    ]);
  };
  sync();
  msgs.addEventListener('scroll', () => requestAnimationFrame(updGrad), { passive: true });
  bindMsgEvents(c);
  renderMsgs(true);
};
function sendMine(c, data) {
  const m = { id: uid(), from: 'me', ts: Date.now(), text: '', ...data };
  if (replyTo) { m.replyTo = replyTo; setReply(null); }
  pushMsg(c, m);
  renderMsgs(true);
  scheduleReply(c);
}
function setReply(mid) {
  replyTo = mid;
  const el = $('#replybar'); if (!el) return;
  if (!mid) { el.innerHTML = ''; return; }
  const c = S.chats[stack[stack.length - 1].id], m = M[c.id].find(x => x.id === mid);
  el.innerHTML = `<div class="replybar"><div class="t">Replying to <b>${m.from === 'me' ? 'yourself' : esc(nameOf(m.from))}</b><br>${esc(trunc(m.text || 'Photo', 80))}</div><button class="ibtn" id="rx">${ic('close', 18)}</button></div>`;
  $('#rx').onclick = () => setReply(null);
  $('#inp')?.focus();
}
function msgHTML(c, list, i) {
  const m = list[i], prev = list[i - 1], next = list[i + 1];
  let h = '';
  if (!prev || m.ts - prev.ts > 3600e3) h += `<div class="tsep">${esc(sepFmt(m.ts))}</div>`;
  if (m.from === 'system') return h + `<div class="sysmsg ${m.err ? 'err' : ''}" data-sys="${m.id}">${esc(m.text)}</div>`;
  const near = (a, b) => a && b && a.from === b.from && Math.abs(b.ts - a.ts) < 3600e3;
  const sp = near(prev, m) && !m.replyTo && !(prev.reactions && Object.keys(prev.reactions).length);
  const sn = near(m, next) && !next.replyTo && !(m.reactions && Object.keys(m.reactions).length);
  const pos = sp ? (sn ? 'mid' : 'last') : (sn ? 'first' : 'single');
  const mine = m.from === 'me';
  let quote = '';
  if (m.replyTo) {
    const r = list.find(x => x.id === m.replyTo) || M[c.id].find(x => x.id === m.replyTo);
    if (r) {
      const who = mine ? (r.from === 'me' ? 'You replied to yourself' : `You replied to ${nameOf(r.from)}`) : (r.from === m.from ? `${nameOf(m.from)} replied to themself` : `${nameOf(m.from)} replied to ${r.from === 'me' ? 'you' : nameOf(r.from)}`);
      quote = `<div class="quote">${esc(who)}<br><span class="q">${esc(trunc(r.text || 'Photo', 60))}</span></div>`;
    }
  }
  let bub;
  if (m.image) bub = `<div class="bub img"><img src="${esc(m.image)}" data-img>${m.text ? `<div class="cap">${linkify(m.text)}</div>` : ''}</div>`;
  else if (isEmojiOnly(m.text)) bub = `<div class="bub emoji">${esc(m.text)}</div>`;
  else bub = `<div class="bub">${linkify(m.text)}</div>`;
  const rs = Object.values(m.reactions || {});
  const reacts = rs.length ? `<div class="reacts">${esc([...new Set(rs)].join(''))}${rs.length > 1 ? ' ' + rs.length : ''}</div>` : '';
  const showSender = c.type === 'group' && !mine && !sp;
  const avatar = !mine ? `<div class="avs">${!sn ? `<img class="av" src="${esc(avOf(m.from))}" style="width:28px;height:28px">` : ''}</div>` : '';
  return h + `<div class="m ${mine ? 'me' : 'them'} ${pos} ${sp ? '' : 'gap'} ${m._new ? 'pop' : ''}" data-mid="${m.id}">${avatar}<div class="col">${showSender ? `<div class="sender">${esc(nameOf(m.from))}</div>` : ''}${quote}${bub}${reacts}</div></div>`;
}
function renderMsgs(forceBottom) {
  const box = $('#msgs'); if (!box) return;
  const c = S.chats[stack[stack.length - 1].id]; if (!c) return;
  const atBottom = forceBottom || box.scrollHeight - box.scrollTop - box.clientHeight < 120;
  const all = M[c.id] || [];
  const n = shown[c.id] || 150, start = Math.max(0, all.length - n), list = all.slice(start);
  let h = '<div class="spacer"></div>';
  if (start > 0) h += `<div style="text-align:center;padding:10px"><button class="sbtn" id="more">Load earlier messages</button></div>`;
  else {
    if (c.type === 'dm') {
      const b = S.bots[c.botId] || {};
      h += `<div class="intro"><img class="av" src="${esc(avOf(c.botId))}" style="width:96px;height:96px"><div class="n">${esc(b.name)}</div><div class="u">${esc(b.username || '')} · Instagram</div>${b.bio ? `<div class="b">${esc(b.bio)}</div>` : ''}<button class="sbtn" id="vp">View profile</button></div>`;
    } else {
      h += `<div class="intro">${chatAvatar(c, 96)}<div class="n">${esc(chatName(c))}</div><div class="u">${c.members.length + 1} members</div><button class="sbtn" id="vp">Group details</button></div>`;
    }
  }
  for (let i = 0; i < list.length; i++) h += msgHTML(c, list, i);
  const lastReal = [...all].reverse().find(m => m.from !== 'system');
  if (lastReal && lastReal.from === 'me' && c.seenAt >= lastReal.ts && !typing[c.id]) h += `<div class="seen">Seen</div>`;
  if (typing[c.id]) h += `<div class="m them single gap typing"><div class="avs"><img class="av" src="${esc(avOf(typing[c.id]))}" style="width:28px;height:28px"></div><div class="col"><div class="bub"><i></i><i></i><i></i></div></div></div>`;
  box.innerHTML = h;
  all.forEach(m => delete m._new);
  if ($('#more', box)) $('#more', box).onclick = () => { const old = box.scrollHeight; shown[c.id] = n + 150; renderMsgs(); box.scrollTop = box.scrollHeight - old; };
  if ($('#vp', box)) $('#vp', box).onclick = () => go('info', { id: c.id });
  if (atBottom) box.scrollTop = box.scrollHeight;
  updGrad();
}
function updGrad() {
  const box = $('#msgs'); if (!box) return;
  const br = box.getBoundingClientRect(), h = box.clientHeight;
  $$('.m.me .bub:not(.emoji):not(.img), .m.me .bub.img .cap', box).forEach(b => {
    const r = b.getBoundingClientRect();
    if (r.bottom < br.top - 40 || r.top > br.bottom + 40) return;
    b.style.backgroundSize = `100% ${h}px`;
    b.style.backgroundPosition = `0 ${br.top - r.top}px`;
  });
}
window.addEventListener('resize', () => { const box = $('#msgs'); if (box) { box.scrollTop = box.scrollHeight; updGrad(); } });

function bindMsgEvents(c) {
  const box = $('#msgs');
  let lpT = null, sx = 0, sy = 0, lastTap = { id: null, t: 0 }, lpFired = false;
  const midOf = e => e.target.closest('.m[data-mid]')?.dataset.mid;
  box.addEventListener('touchstart', e => {
    const mid = midOf(e); lpFired = false;
    if (!mid || !e.target.closest('.bub')) return;
    sx = e.touches[0].clientX; sy = e.touches[0].clientY;
    lpT = setTimeout(() => { lpT = null; lpFired = true; navigator.vibrate?.(15); msgMenu(c, mid); }, 430);
  }, { passive: true });
  box.addEventListener('touchmove', e => { if (lpT && (Math.abs(e.touches[0].clientX - sx) > 8 || Math.abs(e.touches[0].clientY - sy) > 8)) { clearTimeout(lpT); lpT = null; } }, { passive: true });
  box.addEventListener('touchend', () => { clearTimeout(lpT); lpT = null; });
  box.addEventListener('contextmenu', e => { const mid = midOf(e); if (mid && e.target.closest('.bub')) { e.preventDefault(); if (!lpFired) msgMenu(c, mid); } });
  box.addEventListener('click', e => {
    if (lpFired) { lpFired = false; return; }
    const sys = e.target.closest('[data-sys]');
    if (sys) {
      const m = M[c.id].find(x => x.id === sys.dataset.sys);
      if (m?.retry) { M[c.id] = M[c.id].filter(x => x !== m); saveMsgs(c.id); renderMsgs(); busy[c.id] ? toast('Already typing…') : nudge(c, m.retry); }
      return;
    }
    if (e.target.closest('a')) return;
    const img = e.target.closest('[data-img]'); if (img) return viewImage(img.src);
    const mid = midOf(e); if (!mid || !e.target.closest('.bub')) return;
    const now = Date.now();
    if (lastTap.id === mid && now - lastTap.t < 320) {
      lastTap = { id: null, t: 0 };
      const m = M[c.id].find(x => x.id === mid);
      m.reactions = m.reactions || {};
      if (m.reactions.me === '❤️') delete m.reactions.me; else { m.reactions.me = '❤️'; heartBurst(e.clientX, e.clientY); }
      saveMsgs(c.id); renderMsgs();
    } else lastTap = { id: mid, t: now };
  });
}
function heartBurst(x, y) {
  const h = document.createElement('div');
  h.className = 'heartburst'; h.textContent = '❤️';
  h.style.left = (x - 24) + 'px'; h.style.top = (y - 30) + 'px'; h.style.position = 'fixed';
  document.body.appendChild(h); setTimeout(() => h.remove(), 700);
}
function msgMenu(c, mid) {
  const m = M[c.id].find(x => x.id === mid); if (!m) return;
  const mine = m.from === 'me', isBot = !!S.bots[m.from];
  const idx = M[c.id].indexOf(m);
  const trailing = isBot && M[c.id].slice(idx + 1).every(x => x.from === m.from || x.from === 'system');
  const EM = ['❤️', '😂', '😮', '😢', '😡', '👍', '🔥'];
  const items = [
    { label: 'Reply', icon: 'reply', fn: () => setReply(mid) },
    ...(m.text ? [{ label: 'Copy', icon: 'copy', fn: () => { navigator.clipboard?.writeText(m.text).then(() => toast('Copied'), () => toast("Couldn't copy")); } }] : []),
    ...(m.text ? [{ label: 'Edit', icon: 'edit', fn: async () => { const v = await promptBox('Edit message', m.text, true); if (v != null && v.trim()) { m.text = v.trim(); saveMsgs(c.id); renderMsgs(); } } }] : []),
    ...(trailing ? [{ label: 'Regenerate reply', icon: 'refresh', fn: () => regenerate(c, m) }] : []),
    { label: mine ? 'Unsend' : 'Delete', icon: 'trash', danger: true, fn: () => { M[c.id] = M[c.id].filter(x => x.id !== mid); saveMsgs(c.id); renderMsgs(); } },
  ];
  const o = overlay(`<div class="sheet"><div class="grab"></div>
    <div class="react-row">${EM.map(e => `<button class="${m.reactions?.me === e ? 'on' : ''}" data-e="${e}">${e}</button>`).join('')}</div>
    ${items.map((it, i) => `<button class="list-btn ${it.danger ? 'danger' : ''}" data-i="${i}"><span class="ic">${ic(it.icon)}</span>${esc(it.label)}</button>`).join('')}</div>`);
  $$('[data-e]', o).forEach(b => b.onclick = () => {
    m.reactions = m.reactions || {};
    if (m.reactions.me === b.dataset.e) delete m.reactions.me; else m.reactions.me = b.dataset.e;
    saveMsgs(c.id); closeOverlay(); renderMsgs();
  });
  $$('[data-i]', o).forEach(b => b.onclick = () => { closeOverlay(); items[+b.dataset.i].fn(); });
}
function regenerate(c, m) {
  if (busy[c.id]) return toast('Wait until they finish typing');
  let i = M[c.id].indexOf(m);
  while (i > 0 && (M[c.id][i - 1].from === m.from)) i--;
  M[c.id] = M[c.id].slice(0, i);
  M[c.id].forEach(x => { if (x.reactions) delete x.reactions[m.from]; });
  saveMsgs(c.id); renderMsgs();
  nudge(c, m.from);
}

// ---------- Chat info ----------
SCREENS.info = ({ id }) => {
  const c = S.chats[id];
  if (!c) { stack.pop(); return render(); }
  const isG = c.type === 'group', b = S.bots[c.botId];
  const modeLbl = { auto: 'Random 1–3 + mentioned', all: 'Everyone', mention: 'Only when @mentioned' }[c.replyMode || 'auto'];
  app.innerHTML = `<div class="screen">${hdr(isG ? 'Details' : '', '', { center: true })}<div class="scroll">
    <div class="profile-top">${chatAvatar(c, 96)}<div class="n">${esc(chatName(c))}</div>
      ${isG ? `<div class="u">${c.members.length + 1} members</div>` : `<div class="u">${esc(b?.username || '')}</div>${b?.bio ? `<div class="b">${esc(b.bio)}</div>` : ''}`}</div>
    <div class="profile-actions">
      <button id="edit"><span class="c">${ic(isG ? 'edit' : 'user', 20)}</span>${isG ? 'Edit' : 'Profile'}</button>
      <button id="theme"><span class="c">${ic('palette', 20)}</span>Theme</button>
      <button id="search"><span class="c">${ic('search', 20)}</span>Search</button>
    </div>
    <div style="height:10px"></div>
    ${isG ? `<div class="group-title" style="margin:16px 16px 4px">Members</div>
      ${c.members.map(mid => `<div class="row" style="min-height:60px" data-m="${mid}"><img class="av" src="${esc(avOf(mid))}" style="width:44px;height:44px"><div class="mid"><div class="nm">${esc(nameOf(mid))}</div><div class="sub">${esc(S.bots[mid]?.username || '')}</div></div>${ic('chevright', 18)}</div>`).join('')}
      <div class="row" style="min-height:60px"><img class="av" src="${esc(S.me.avatar || DEFAULT_AV)}" style="width:44px;height:44px"><div class="mid"><div class="nm">${esc(S.me.name)}</div><div class="sub">You</div></div></div>
      <button class="list-btn" id="addm"><span class="ic">${ic('plus')}</span>Add or remove people</button>
      <button class="list-btn" id="mode"><span class="ic">${ic('users')}</span>Who replies<span class="r">${modeLbl}</span></button>` : ''}
    ${!isG ? `<button class="list-btn" id="imp"><span class="ic">${ic('upload')}</span>Import chat history (JSON)</button>` : ''}
    <button class="list-btn" id="exp"><span class="ic">${ic('download')}</span>Export chat (JSON)</button>
    <button class="list-btn danger" id="clr"><span class="ic">${ic('broom')}</span>Clear chat</button>
    <button class="list-btn danger" id="del"><span class="ic">${ic('trash')}</span>${isG ? 'Delete group' : 'Delete chat'}</button>
    ${!isG ? `<button class="list-btn danger" id="delbot"><span class="ic">${ic('user')}</span>Delete ${esc(b?.name || 'person')} completely</button>` : ''}
  </div></div>`;
  bindBack();
  $('#edit').onclick = () => isG ? go('editGroup', { id }) : go('editBot', { id: c.botId });
  $('#theme').onclick = () => themeSheet(c);
  $('#search').onclick = async () => {
    const q = await promptBox('Search in chat', '', false, 'Search...'); if (!q) return;
    const hits = M[c.id].filter(m => (m.text || '').toLowerCase().includes(q.toLowerCase())).slice(-30).reverse();
    if (!hits.length) return toast('No results');
    sheet(`${hits.length} result${hits.length > 1 ? 's' : ''}`, hits.map(m => ({ label: `${nameOf(m.from)}: ${trunc(m.text, 70)}`, right: ago(m.ts), fn: () => { stack.pop(); render(); setTimeout(() => { const el = $(`[data-mid="${m.id}"]`); if (el) { el.scrollIntoView({ block: 'center' }); el.animate([{ opacity: .3 }, { opacity: 1 }], { duration: 900, iterations: 2 }); } else toast('Message is further up — tap "Load earlier"'); }, 60); } })));
  };
  $$('[data-m]').forEach(r => r.onclick = () => S.bots[r.dataset.m] && go('editBot', { id: r.dataset.m }));
  if ($('#addm')) $('#addm').onclick = () => go('editGroup', { id });
  if ($('#mode')) $('#mode').onclick = () => sheet('Who replies to your messages?', [
    { label: 'Random 1–3 (and anyone you @mention)', fn: () => { c.replyMode = 'auto'; save(); render(); } },
    { label: 'Everyone replies', fn: () => { c.replyMode = 'all'; save(); render(); } },
    { label: 'Only people you mention by name', fn: () => { c.replyMode = 'mention'; save(); render(); } },
  ]);
  if ($('#imp')) $('#imp').onclick = async () => { const imp = await importDialog(b.name); if (imp) { applyImport(imp, b, c); toast(`Imported ${imp.msgs.length} messages`); } };
  $('#exp').onclick = () => {
    const out = { chat: chatName(c), exported: new Date().toISOString(), messages: M[c.id].filter(m => m.from !== 'system').map(m => ({ sender: nameOf(m.from), role: m.from === 'me' ? 'user' : 'assistant', text: m.text || (m.image ? '[photo]' : ''), timestamp: new Date(m.ts).toISOString() })) };
    saveFile(`chat-${chatName(c).replace(/[^\w-]+/g, '_')}-${Date.now()}.json`, JSON.stringify(out, null, 2));
  };
  $('#clr').onclick = async () => {
    if (!(await confirmBox('Clear chat?', 'All messages in this chat will be removed.', 'Clear', true))) return;
    M[c.id] = []; c.seenAt = 0;
    if (!isG) addStartLine(c, b);
    c.unread = 0; save(); saveMsgs(c.id); toast('Chat cleared');
  };
  $('#del').onclick = () => deleteChat(c);
  if ($('#delbot')) $('#delbot').onclick = () => deleteBot(c.botId);
};
async function deleteBot(botId) {
  const b = S.bots[botId];
  if (!(await confirmBox(`Delete ${b.name}?`, 'Their profile and DM chat will be deleted, and they will be removed from groups.', 'Delete', true))) return;
  for (const c of Object.values(S.chats)) {
    if (c.type === 'dm' && c.botId === botId) { delete S.chats[c.id]; delete M[c.id]; saveMsgs(c.id); }
    if (c.type === 'group') c.members = c.members.filter(m => m !== botId);
  }
  delete S.bots[botId]; save();
  stack = [{ name: 'inbox' }]; render();
}
function themeSheet(c) {
  const o = overlay(`<div class="sheet"><div class="grab"></div><h4>Theme</h4>
    <div class="themes">${THEMES.map(t => {
      const bg = t.bg || 'var(--bg)';
      return `<button class="theme ${c.theme === t.id ? 'on' : ''}" data-t="${t.id}" style="background:${esc(bg)}"><div class="b1" style="background:${t.other || 'var(--other)'}"></div><div class="b2" style="background:linear-gradient(${t.grad.join(',')})"></div><div class="lbl">${t.name}</div></button>`;
    }).join('')}</div>
    <div class="pad"><div class="group-title">Background photo</div></div>
    <button class="list-btn" id="bgp"><span class="ic">${ic('image')}</span>${c.bgImage ? 'Change background photo' : 'Choose background photo'}</button>
    ${c.bgImage ? `<div class="pad fld"><label>Darken photo</label><input type="range" id="dim" min="0" max="0.8" step="0.05" value="${c.bgDim ?? 0.25}"></div>
      <button class="list-btn danger" id="bgr"><span class="ic">${ic('trash')}</span>Remove background photo</button>` : ''}
  </div>`);
  $$('[data-t]', o).forEach(b => b.onclick = () => { c.theme = b.dataset.t; save(); closeOverlay(); toast('Theme changed to ' + themeOf(c).name); });
  $('#bgp', o).onclick = async () => { const img = await pickImage(1440); if (img) { c.bgImage = img; save(); closeOverlay(); toast('Background updated'); } };
  if ($('#dim', o)) $('#dim', o).oninput = e => { c.bgDim = +e.target.value; save(); };
  if ($('#bgr', o)) $('#bgr', o).onclick = () => { c.bgImage = null; save(); closeOverlay(); };
}

// ---------- New message ----------
SCREENS.new = () => {
  const bots = Object.values(S.bots).sort((a, b) => a.name.localeCompare(b.name));
  app.innerHTML = `<div class="screen">${hdr('New message', '', { center: true })}<div class="scroll">
    <div class="search" style="margin-top:8px"><span style="color:var(--text)">To:</span><input id="q" placeholder="Search"></div>
    <button class="row" id="nb" style="width:100%;min-height:64px"><span class="c" style="width:48px;height:48px;border-radius:50%;background:var(--bg3);display:flex;align-items:center;justify-content:center">${ic('plus', 22)}</span><div class="mid" style="text-align:left"><div class="nm" style="font-weight:600">Create a new AI person</div><div class="sub">Name, photo, personality, style…</div></div></button>
    <button class="row" id="ng" style="width:100%;min-height:64px"><span class="c" style="width:48px;height:48px;border-radius:50%;background:var(--bg3);display:flex;align-items:center;justify-content:center">${ic('users', 22)}</span><div class="mid" style="text-align:left"><div class="nm" style="font-weight:600">Create group chat</div><div class="sub">Chat with several AI people at once</div></div></button>
    <div class="sec"><span>Your AI people</span><span class="r">${bots.length}</span></div>
    <div id="bl">${bots.map(b => `<div class="row" data-b="${b.id}" data-n="${esc(b.name.toLowerCase())}"><img class="av" src="${esc(avOf(b.id))}" style="width:48px;height:48px"><div class="mid"><div class="nm">${esc(b.name)}</div><div class="sub">${esc(b.username || '')}</div></div><button class="sbtn" data-e="${b.id}" style="padding:6px 12px">Edit</button></div>`).join('') || '<div class="empty-state">No AI people yet.</div>'}</div>
  </div></div>`;
  bindBack();
  $('#nb').onclick = () => go('editBot', {});
  $('#ng').onclick = () => go('editGroup', {});
  $('#q').oninput = e => $$('[data-n]').forEach(r => r.style.display = r.dataset.n.includes(e.target.value.toLowerCase()) ? '' : 'none');
  $$('[data-b]').forEach(r => r.onclick = e => { if (e.target.closest('[data-e]')) return go('editBot', { id: r.dataset.b }); const c = dmFor(r.dataset.b) || createDM(S.bots[r.dataset.b]); replace('chat', { id: c.id }); });
};

// ---------- Bot editor ----------
const STYLE_CHIPS = ['Short replies', 'lowercase texting', 'Uses lots of emojis', 'No emojis', 'Uses slang (lol, ngl, fr)', 'Flirty', 'Sarcastic', 'Wholesome & supportive', 'Dry humor', 'Long detailed replies', 'Asks lots of questions', 'Typos sometimes', 'Proper grammar', 'Gen Z', 'Mysterious'];
SCREENS.editBot = (p) => {
  const isNew = !p.id;
  const d = p.draft || (p.draft = isNew ? newBot() : clone(S.bots[p.id]));
  const sw = (k, label, sub) => `<div class="tog"><div class="l">${label}<small>${sub}</small></div><div class="sw ${d[k] !== false ? 'on' : ''}" data-t="${k}"></div></div>`;
  app.innerHTML = `<div class="screen">${hdr(isNew ? 'New AI person' : 'Edit profile', `<button class="tbtn" id="save">${isNew ? 'Create' : 'Done'}</button>`, { border: true })}<div class="scroll"><div class="form">
    <div class="avedit"><img class="av" id="av" src="${esc(d.avatar || DEFAULT_AV)}" style="width:96px;height:96px"><button class="tbtn" id="avb">${d.avatar ? 'Change picture' : 'Add profile picture'}</button></div>
    <div class="fld"><label>Name</label><input type="text" data-k="name" value="${esc(d.name)}" placeholder="e.g. Jake"></div>
    <div class="fld"><label>Username</label><input type="text" data-k="username" value="${esc(d.username)}" placeholder="e.g. jake.lifts" autocapitalize="off"></div>
    <div class="fld"><label>Bio</label><textarea data-k="bio" style="min-height:60px" placeholder="Shown on their profile">${esc(d.bio)}</textarea></div>
    <div class="fld"><label>Note</label><input type="text" data-k="note" value="${esc(d.note)}" maxlength="60" placeholder="Short status shown above your inbox"></div>

    <div class="group-title">AI character</div>
    <div class="fld"><label>Personality</label><textarea class="big" data-k="personality" placeholder="Who are they? Age, job, background, interests, how they feel about you, quirks, secrets…&#10;&#10;e.g. You're Jake, 26, a personal trainer from Chicago. Confident, funny, protective. You've had a crush on the user since college but play it cool.">${esc(d.personality)}</textarea></div>
    <div class="fld"><label>Starting line</label><textarea data-k="startLine" style="min-height:64px" placeholder="Their first message when the chat starts. Each line = separate bubble.">${esc(d.startLine)}</textarea></div>
    <div class="fld"><label>Response style</label><textarea data-k="style" placeholder="How do they text? Length, emojis, capitalization, slang…">${esc(d.style)}</textarea>
      <div class="chips">${STYLE_CHIPS.map(s => `<button class="chip" data-chip="${esc(s)}">+ ${esc(s)}</button>`).join('')}</div></div>
    <div class="fld"><label>Example chat</label><textarea class="big" data-k="examples" placeholder="Paste example messages so the AI copies their voice:&#10;&#10;You: what are you doing tonight&#10;${esc(d.name || 'Jake')}: nothing much lol wbu&#10;${esc(d.name || 'Jake')}: wanna get food?">${esc(d.examples)}</textarea>
      <div class="hint">Or import a real chat export — Instagram's "Download your information" JSON works, as do most chat JSON files.</div>
      <button class="sbtn" id="imp" style="margin-top:10px;display:flex;align-items:center;gap:8px">${ic('upload', 18)}Import JSON chat history</button>
      ${p.imp ? `<div class="hint" style="color:var(--blue)">✓ ${p.imp.msgs.length} messages ready to import on ${isNew ? 'Create' : 'Done'}.</div>` : ''}</div>

    <div class="group-title">Behaviour</div>
    ${sw('multiBubble', 'Multiple message bubbles', 'Sends several short texts in a row like a real person')}
    ${sw('reactions', 'Emoji reactions', 'Can react to your messages with ❤️ 😂 etc.')}
    ${sw('active', 'Show "Active now"', 'Green dot on their profile picture')}
    <div class="fld"><label>Model (optional)</label><input type="text" data-k="model" value="${esc(d.model)}" placeholder="Default: ${esc(S.settings.model)}" autocapitalize="off"><div class="hint">Use a different model just for this person.</div></div>
    <div class="fld"><label>Creativity: <span id="tv">${d.temperature ?? 'default'}</span></label><input type="range" min="0" max="1.5" step="0.05" id="temp" value="${d.temperature ?? S.settings.temperature}"><button class="tbtn" id="tdef" style="padding:4px 0;font-size:13px">Use default</button></div>
    ${!isNew ? `<button class="list-btn danger" id="del" style="padding:14px 0">${ic('trash')}Delete this person</button>` : ''}
  </div></div></div>`;
  bindBack();
  $$('[data-k]').forEach(el => el.oninput = () => { d[el.dataset.k] = el.value; });
  $$('[data-t]').forEach(el => el.onclick = () => { el.classList.toggle('on'); d[el.dataset.t] = el.classList.contains('on'); });
  $$('[data-chip]').forEach(el => el.onclick = () => {
    const ta = $('[data-k=style]'); const add = el.dataset.chip.toLowerCase();
    ta.value = ta.value.trim() ? ta.value.trim().replace(/[,.]?$/, ', ') + add : add.charAt(0).toUpperCase() + add.slice(1);
    d.style = ta.value; el.style.opacity = .4;
  });
  $('#avb').onclick = $('#av').onclick = async () => { const img = await pickImage(400, true); if (img) { d.avatar = img; $('#av').src = img; $('#avb').textContent = 'Change picture'; } };
  $('#temp').oninput = e => { d.temperature = +e.target.value; $('#tv').textContent = d.temperature; };
  $('#tdef').onclick = () => { d.temperature = null; $('#tv').textContent = 'default'; $('#temp').value = S.settings.temperature; };
  $('#imp').onclick = async () => { const imp = await importDialog(d.name); if (imp) { p.imp = imp; render(); toast(`${imp.msgs.length} messages will be imported`); } };
  if ($('#del')) $('#del').onclick = () => deleteBot(p.id);
  $('#save').onclick = () => {
    d.name = d.name.trim(); d.username = d.username.trim().replace(/^@/, '');
    if (!d.name) return toast('Give them a name');
    if (!d.username) d.username = d.name.toLowerCase().replace(/[^a-z0-9._]+/g, '') || 'user';
    S.bots[d.id] = d;
    let c = dmFor(d.id);
    if (!c) c = createDM(d);
    applyImport(p.imp, d, c);
    if (!M[c.id].length) addStartLine(c, d);
    save(); saveMsgs(c.id);
    if (isNew) replace('chat', { id: c.id });
    else { toast('Saved'); back(); }
  };
};

// ---------- Group editor ----------
SCREENS.editGroup = (p) => {
  const isNew = !p.id, c = isNew ? null : S.chats[p.id];
  const d = p.draft || (p.draft = isNew ? { name: '', avatar: null, members: [] } : { name: c.name || '', avatar: c.avatar, members: [...c.members] });
  const bots = Object.values(S.bots).sort((a, b) => a.name.localeCompare(b.name));
  app.innerHTML = `<div class="screen">${hdr(isNew ? 'New group' : 'Edit group', `<button class="tbtn" id="save">${isNew ? 'Create' : 'Done'}</button>`, { border: true })}<div class="scroll"><div class="form">
    <div class="avedit"><img class="av" id="av" src="${esc(d.avatar || DEFAULT_AV)}" style="width:88px;height:88px"><button class="tbtn" id="avb">${d.avatar ? 'Change group photo' : 'Add group photo'}</button>${d.avatar ? '<button class="tbtn" id="avr" style="color:var(--danger);font-size:13px">Remove photo</button>' : ''}</div>
    <div class="fld"><label>Group name</label><input type="text" id="gn" value="${esc(d.name)}" placeholder="e.g. the besties 💅"></div>
    <div class="group-title">Members (${d.members.length})</div>
    ${bots.map(b => `<div class="row" data-b="${b.id}" style="padding-left:0;padding-right:0;min-height:60px"><img class="av" src="${esc(avOf(b.id))}" style="width:44px;height:44px"><div class="mid"><div class="nm">${esc(b.name)}</div><div class="sub">${esc(b.username)}</div></div><span class="check ${d.members.includes(b.id) ? 'on' : ''}">${d.members.includes(b.id) ? ic('check', 14, 3) : ''}</span></div>`).join('') || '<div class="empty-state">Create some AI people first.</div>'}
    <button class="sbtn" id="nb" style="margin-top:12px">+ New AI person</button>
  </div></div></div>`;
  bindBack();
  $('#gn').oninput = e => d.name = e.target.value;
  $('#avb').onclick = $('#av').onclick = async () => { const img = await pickImage(400, true); if (img) { d.avatar = img; render(); } };
  if ($('#avr')) $('#avr').onclick = () => { d.avatar = null; render(); };
  $('#nb').onclick = () => go('editBot', {});
  $$('[data-b]').forEach(r => r.onclick = () => {
    const id = r.dataset.b, i = d.members.indexOf(id);
    i >= 0 ? d.members.splice(i, 1) : d.members.push(id);
    render();
  });
  $('#save').onclick = () => {
    if (d.members.length < 1) return toast('Pick at least one member');
    if (isNew) {
      const g = { id: 'c' + uid(), type: 'group', name: d.name.trim(), avatar: d.avatar, members: d.members, theme: 'default', bgImage: null, bgDim: 0.25, replyMode: 'auto', updated: Date.now(), unread: 0, seenAt: 0 };
      S.chats[g.id] = g;
      M[g.id] = [{ id: uid(), from: 'system', text: `You created the group${g.name ? ` "${g.name}"` : ''}.`, ts: Date.now() }];
      save(); saveMsgs(g.id);
      stack = [{ name: 'inbox' }, { name: 'chat', id: g.id }]; render(true);
    } else {
      const added = d.members.filter(m => !c.members.includes(m)), removed = c.members.filter(m => !d.members.includes(m));
      const sys = t => M[c.id].push({ id: uid(), from: 'system', text: t, ts: Date.now() });
      if (d.name.trim() !== (c.name || '')) sys(`You named the group "${d.name.trim()}".`);
      if (added.length) sys(`You added ${added.map(nameOf).join(', ')} to the group.`);
      if (removed.length) sys(`You removed ${removed.map(nameOf).join(', ')} from the group.`);
      Object.assign(c, { name: d.name.trim(), avatar: d.avatar, members: d.members });
      save(); saveMsgs(c.id); back();
    }
  };
};

// ---------- My profile ----------
SCREENS.me = (p) => {
  const d = p.draft || (p.draft = clone(S.me));
  app.innerHTML = `<div class="screen">${hdr('Your profile', `<button class="tbtn" id="save">Done</button>`, { border: true })}<div class="scroll"><div class="form">
    <div class="avedit"><img class="av" id="av" src="${esc(d.avatar || DEFAULT_AV)}" style="width:96px;height:96px"><button class="tbtn" id="avb">${d.avatar ? 'Change picture' : 'Add profile picture'}</button></div>
    <div class="fld"><label>Name</label><input type="text" data-k="name" value="${esc(d.name)}"><div class="hint">AI people will call you this.</div></div>
    <div class="fld"><label>Username</label><input type="text" data-k="username" value="${esc(d.username)}" autocapitalize="off"><div class="hint">Shown at the top of your inbox.</div></div>
    <div class="fld"><label>About you</label><textarea class="big" data-k="about" placeholder="Optional. Everything here is shared with every AI person — e.g. your age, where you live, hobbies, relationship to them…">${esc(d.about)}</textarea></div>
    <div class="fld"><label>Note</label><input type="text" data-k="note" value="${esc(d.note)}" maxlength="60" placeholder="Share a thought..."></div>
  </div></div></div>`;
  bindBack();
  $$('[data-k]').forEach(el => el.oninput = () => d[el.dataset.k] = el.value);
  $('#avb').onclick = $('#av').onclick = async () => { const img = await pickImage(400, true); if (img) { d.avatar = img; $('#av').src = img; } };
  $('#save').onclick = () => { d.name = d.name.trim() || 'You'; d.username = d.username.trim().replace(/^@/, ''); S.me = d; save(); back(); };
};

// ---------- Settings ----------
SCREENS.settings = (p) => {
  const st = S.settings, P = PROVIDERS[st.provider];
  const sw = (k, label, sub) => `<div class="tog"><div class="l">${label}<small>${sub}</small></div><div class="sw ${st[k] ? 'on' : ''}" data-t="${k}"></div></div>`;
  app.innerHTML = `<div class="screen">${hdr('Settings', '', { border: true, center: true })}<div class="scroll"><div class="form">
    <div class="group-title" style="margin-top:12px">AI connection</div>
    <div class="fld"><label>Provider</label><select id="prov">${Object.entries(PROVIDERS).map(([k, v]) => `<option value="${k}" ${k === st.provider ? 'selected' : ''}>${esc(v.label)}</option>`).join('')}</select></div>
    <div class="fld"><label>API key</label><div class="inline"><input type="password" id="key" value="${esc(st.apiKey)}" placeholder="Paste your API key" autocapitalize="off" autocomplete="off"><button class="sbtn" id="show">Show</button></div>
      ${P.keyUrl ? `<div class="hint">Get a key at ${esc(P.keyUrl)}. It's stored only on this phone.</div>` : ''}</div>
    <div class="fld"><label>Model</label><div class="inline"><input type="text" id="model" value="${esc(st.model)}" autocapitalize="off"><button class="sbtn" id="fetch">List</button></div><div class="hint">Tap List to load the models your key can use.</div></div>
    <div class="fld"><label>API base URL</label><input type="text" id="base" value="${esc(st.baseUrl)}" autocapitalize="off"><div class="hint">Only change for custom/self-hosted OpenAI-compatible servers (e.g. LM Studio, Ollama: http://192.168.x.x:11434/v1).</div></div>
    <button class="pbtn wide" id="test">Test connection</button>

    <div class="group-title">Chat</div>
    ${sw('typingDelay', 'Realistic typing', 'Show "typing…" and send bubbles one by one')}
    <div class="fld"><label>Wait before replying: <span id="rdv">${st.replyDelay}s</span></label><input type="range" id="rd" min="0" max="6" step="0.2" value="${st.replyDelay}"><div class="hint">Gives you time to send several messages before they answer.</div></div>
    ${sw('sendImages', 'Let AI see photos you send', 'Needs a vision model (e.g. grok-4, gpt-4o, claude, gemini)')}
    <div class="fld"><label>Default creativity (temperature): <span id="tv">${st.temperature}</span></label><input type="range" id="temp" min="0" max="1.5" step="0.05" value="${st.temperature}"></div>
    <div class="fld"><label>Max reply length (tokens)</label><input type="number" id="mt" value="${st.maxTokens}" min="50" max="8000"></div>
    <div class="fld"><label>Memory (messages sent to AI)</label><input type="number" id="hl" value="${st.historyLimit}" min="4" max="500"><div class="hint">More = better memory but slower and more expensive.</div></div>

    <div class="group-title">Appearance</div>
    ${sw('dark', 'Dark mode', 'Instagram dark theme')}

    <div class="group-title">Data</div>
    <button class="list-btn" id="bk" style="padding:14px 0">${ic('download')}Back up everything (JSON)</button>
    <button class="list-btn" id="rs" style="padding:14px 0">${ic('upload')}Restore from backup</button>
    <button class="list-btn danger" id="wipe" style="padding:14px 0">${ic('trash')}Erase all data</button>
    <div class="hint" style="margin-top:16px;text-align:center">All chats, profiles and your API key are stored only on this device.</div>
  </div></div></div>`;
  bindBack();
  const keep = () => { st.apiKey = $('#key').value.trim(); st.model = $('#model').value.trim(); st.baseUrl = $('#base').value.trim(); save(); };
  ['#key', '#model', '#base'].forEach(s => $(s).oninput = keep);
  $('#prov').onchange = e => { keep(); st.provider = e.target.value; const P2 = PROVIDERS[st.provider]; st.baseUrl = P2.base; st.model = P2.model; save(); render(); };
  $('#show').onclick = () => { const k = $('#key'); k.type = k.type === 'password' ? 'text' : 'password'; $('#show').textContent = k.type === 'password' ? 'Show' : 'Hide'; };
  $$('[data-t]').forEach(el => el.onclick = () => { el.classList.toggle('on'); st[el.dataset.t] = el.classList.contains('on'); save(); if (el.dataset.t === 'dark') applyTheme(); });
  $('#rd').oninput = e => { st.replyDelay = +e.target.value; $('#rdv').textContent = st.replyDelay + 's'; save(); };
  $('#temp').oninput = e => { st.temperature = +e.target.value; $('#tv').textContent = st.temperature; save(); };
  $('#mt').onchange = e => { st.maxTokens = Math.max(50, +e.target.value || 600); save(); };
  $('#hl').onchange = e => { st.historyLimit = Math.max(4, +e.target.value || 40); save(); };
  $('#fetch').onclick = async () => {
    keep(); const b = $('#fetch'); b.innerHTML = '<span class="spin"></span>';
    try {
      const ms = await listModels();
      if (!ms.length) toast('No models returned');
      else sheet('Choose a model', ms.map(m => ({ label: m, right: m === st.model ? '✓' : '', fn: () => { st.model = m; save(); $('#model').value = m; } })));
    } catch (e) { toast(e.message, 4000); }
    b.textContent = 'List';
  };
  $('#test').onclick = async () => {
    keep(); const b = $('#test'); b.innerHTML = '<span class="spin" style="border-color:#fff;border-top-color:transparent"></span>';
    try {
      const r = await callAI({ system: 'You are a friendly person texting. Reply in under 10 words.', messages: [{ role: 'user', text: 'hey! is this working?' }] });
      overlay(`<div class="modal"><h4>✅ Connected</h4><p>${esc(st.model)} replied:</p><div class="code">${esc(trunc(r, 300))}</div><div class="btns"><button class="pbtn wide" onclick="closeOverlay()">Nice</button></div></div>`, true);
    } catch (e) {
      overlay(`<div class="modal"><h4>Connection failed</h4><div class="code">${esc(e.message)}</div><div class="btns"><button class="sbtn wide" style="padding:12px" onclick="closeOverlay()">OK</button></div></div>`, true);
    }
    b.textContent = 'Test connection';
  };
  $('#bk').onclick = () => saveFile(`ai-dms-backup-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify({ app: 'ai-dms', version: 1, state: S, messages: M }));
  $('#rs').onclick = async () => {
    const f = await pickFile('application/json,.json,*/*'); if (!f) return;
    let j; try { j = JSON.parse(await f.text()); } catch (e) { return toast('Not a valid backup file'); }
    if (j.app !== 'ai-dms' || !j.state) return toast('Not a backup from this app');
    if (!(await confirmBox('Restore backup?', 'This replaces all current chats and profiles.', 'Restore', true))) return;
    Object.keys(M).forEach(k => { delete M[k]; DB.del('m:' + k); });
    S = j.state; S.settings = Object.assign(clone(DEFAULT_SETTINGS), S.settings);
    for (const [k, v] of Object.entries(j.messages || {})) { M[k] = v; saveMsgs(k); }
    for (const id of Object.keys(S.chats)) if (!M[id]) M[id] = [];
    save(); applyTheme(); stack = [{ name: 'inbox' }]; render(); toast('Backup restored');
  };
  $('#wipe').onclick = async () => {
    if (!(await confirmBox('Erase everything?', 'All AI people, chats, and settings (including your API key) will be deleted.', 'Erase', true))) return;
    Object.keys(M).forEach(k => { delete M[k]; DB.del('m:' + k); });
    seed(); save(); applyTheme(); stack = [{ name: 'inbox' }]; render();
  };
};

// ---------- Boot ----------
function applyTheme() {
  document.documentElement.classList.toggle('light', !S.settings.dark);
  try { window.AndroidBridge?.setDarkMode?.(!!S.settings.dark); } catch (e) {}
}
document.addEventListener('visibilitychange', () => { if (document.hidden) flush(); else { const top = stack[stack.length - 1]; if (top.name === 'chat') { const c = S.chats[top.id]; if (c && c.unread) { c.unread = 0; save(); } } } });
window.addEventListener('pagehide', flush);
window.__flush = flush;
(async function boot() {
  await DB.open();
  try { navigator.storage?.persist?.(); } catch (e) {}
  const st = await DB.get('state');
  if (st) {
    S = st;
    S.settings = Object.assign(clone(DEFAULT_SETTINGS), S.settings);
    for (const id of Object.keys(S.chats)) M[id] = (await DB.get('m:' + id)) || [];
  } else { seed(); }
  applyTheme();
  render();
  setInterval(() => { if (stack[stack.length - 1].name === 'inbox') renderInboxList(); }, 60000);
})();
