'use strict';
/* ================= admin.js：站内后台面板（右上角「后台」按钮 → 右侧编辑面板，实时预览） ================= */

const ADM_SCHEMA = [
  { sec:'基本信息', fields:[
    {path:'site.title', t:'input', l:'浏览器标题'},
    {path:'site.logoA', t:'input', l:'Logo 前半（普通色）'},
    {path:'site.logoB', t:'input', l:'Logo 后半（渐变色）'},
    {path:'site.footer', t:'input', l:'页脚文字'}
  ]},
  { sec:'首屏 Hero', fields:[
    {path:'hero.hello', t:'input', l:'打招呼语'},
    {path:'hero.nameCn', t:'input', l:'名字（中文）'},
    {path:'hero.nameEn', t:'input', l:'名字（英文）'},
    {path:'hero.intro', t:'area', l:'一句话介绍', wide:true},
    {path:'hero.btnPrimary', t:'input', l:'主按钮文字'},
    {path:'hero.btnGhost', t:'input', l:'次按钮文字'}
  ], lists:[{path:'hero.tags', t:'lines', l:'标签（每行一个）', wide:true}]},
  { sec:'关于我', fields:[
    {path:'about.title', t:'input', l:'标题'},
    {path:'about.subtitle', t:'input', l:'副标题（英文）'},
    {path:'about.avatar', t:'input', l:'头像字（圆形里的字）'}
  ], lists:[{path:'about.paragraphs', t:'lines', l:'介绍段落（每行一段）', wide:true}]},
  { sec:'技能栈', fields:[
    {path:'skills.title', t:'input', l:'栏目标题'},
    {path:'skills.subtitle', t:'input', l:'栏目副标题（英文）'}
  ], items:{path:'skills.items',
    fields:[ {k:'icon',l:'图标（emoji）'},{k:'name',l:'名称'},{k:'desc',l:'描述',t:'area',wide:true},{k:'level',l:'熟练度 0-100',t:'num'} ]}},
  { sec:'项目', fields:[
    {path:'projects.title', t:'input', l:'栏目标题'},
    {path:'projects.subtitle', t:'input', l:'栏目副标题（英文）'}
  ], items:{path:'projects.items',
    fields:[ {k:'icon',l:'图标（emoji）'},{k:'name',l:'名称'},{k:'desc',l:'描述',t:'area',wide:true},{k:'chips',l:'标签（逗号分隔）',wide:true},{k:'link',l:'链接（可选，填了卡片就能点击访问）',wide:true} ]}},
  { sec:'博客', fields:[
    {path:'blog.title', t:'input', l:'栏目标题'},
    {path:'blog.subtitle', t:'input', l:'栏目副标题（英文）'}
  ], items:{path:'blog.items',
    fields:[ {k:'title',l:'文章标题',wide:true},{k:'meta',l:'日期 · 分类'},{k:'link',l:'链接（可选）'} ]}},
  { sec:'联系方式', fields:[
    {path:'contact.title', t:'input', l:'标题'},
    {path:'contact.subtitle', t:'input', l:'副标题（英文）'},
    {path:'contact.heading', t:'input', l:'主文案'},
    {path:'contact.email', t:'input', l:'邮箱'},
    {path:'contact.githubUser', t:'input', l:'GitHub 显示名'}
  ]}
];

const ADM = { data: null, built: false };

function admEl(tag, cls, text){ const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
function admGet(obj, path){ return path.split('.').reduce((o,k)=>o && o[k], obj); }
function admSet(obj, path, v){ const ks = path.split('.'); let o = obj; for (let i=0;i<ks.length-1;i++){ if (typeof o[ks[i]] !== 'object' || o[ks[i]] === null) o[ks[i]] = {}; o = o[ks[i]]; } o[ks[ks.length-1]] = v; }
function admStatus(msg, cls){ const s = document.getElementById('adm-status'); if (s){ s.textContent = msg; s.className = 'adm-status ' + (cls || ''); } }

/* ---------- 表单渲染 ---------- */
function admField(path, label, type, wide){
  const d = admEl('div', 'f' + (wide ? ' wide' : ''));
  d.appendChild(admEl('label', null, label));
  let inp;
  if (type === 'area') inp = document.createElement('textarea');
  else { inp = document.createElement('input'); inp.type = (type === 'num') ? 'number' : 'text'; }
  inp.dataset.path = path;
  inp.addEventListener('input', admLivePreview);
  d.appendChild(inp);
  return d;
}
function admLines(path, label, wide){
  const d = admEl('div', 'f' + (wide ? ' wide' : ''));
  d.appendChild(admEl('label', null, label));
  const ta = document.createElement('textarea'); ta.rows = 4; ta.dataset.lines = path;
  ta.addEventListener('input', admLivePreview);
  d.appendChild(ta);
  return d;
}
function admBlank(cfg){
  const it = {};
  cfg.fields.forEach(f => { it[f.k] = f.t === 'num' ? 50 : (f.k === 'chips' ? [] : ''); });
  if (cfg.path.indexOf('skills') >= 0) it.icon = '✨';
  if (cfg.path.indexOf('projects') >= 0) it.icon = '🆕';
  return it;
}
function admItemCard(cfg, item, idx){
  const d = admEl('div', 'admin-item');
  const del = admEl('button', 'del', '删除'); del.type = 'button';
  del.addEventListener('click', () => {
    const arr = admGet(ADM.data, cfg.path); arr.splice(idx, 1);
    admFillItems(cfg); admLivePreview();
  });
  d.appendChild(del);
  const row = admEl('div', 'row');
  cfg.fields.forEach(f => {
    if (f.t === 'area' || f.wide){
      const w = admEl('div', 'f' + (f.wide ? ' wide' : ''));
      w.appendChild(admEl('label', null, f.l));
      const ta = document.createElement('textarea'); ta.rows = 2; ta.dataset.k = f.k; ta.value = admValToText(item[f.k]);
      ta.addEventListener('input', admLivePreview);
      w.appendChild(ta); d.appendChild(w);
    } else {
      const w = admField('', f.l, f.t);
      const inp = w.querySelector('input'); inp.dataset.k = f.k; inp.value = admValToText(item[f.k]);
      if (f.t === 'num'){ inp.min = 0; inp.max = 100; }
      row.appendChild(w);
    }
  });
  d.appendChild(row);
  return d;
}
function admValToText(v){
  if (Array.isArray(v)) return v.join(',');
  return v != null ? v : '';
}
function admValFromText(txt, f){
  if (f.k === 'chips') return txt.split(/[,，]/).map(s => s.trim()).filter(Boolean);
  if (f.t === 'num') return Math.max(0, Math.min(100, parseInt(txt, 10) || 0));
  return txt.trim();
}
function admFillItems(cfg){
  const wrap = document.querySelector('[data-adm-items="' + cfg.path + '"]');
  wrap.textContent = '';
  (admGet(ADM.data, cfg.path) || []).forEach((it, i) => wrap.appendChild(admItemCard(cfg, it, i)));
}
function admRenderForm(){
  const root = document.getElementById('adm-form'); root.textContent = '';
  ADM_SCHEMA.forEach(sec => {
    const card = admEl('div', 'adm-sec');
    card.appendChild(admEl('h3', null, sec.sec));
    if (sec.fields && sec.fields.length){
      const row = admEl('div', 'row');
      sec.fields.forEach(f => row.appendChild(admField(f.path, f.l, f.t, f.wide)));
      card.appendChild(row);
    }
    (sec.lists || []).forEach(ls => { const row = admEl('div', 'row'); row.appendChild(admLines(ls.path, ls.l, ls.wide)); card.appendChild(row); });
    if (sec.items){
      const cfg = sec.items;
      const listWrap = admEl('div'); listWrap.dataset.admItems = cfg.path;
      const addBtn = admEl('button', 'admin-add', '＋ 添加一项'); addBtn.type = 'button';
      addBtn.addEventListener('click', () => {
        const arr = admGet(ADM.data, cfg.path) || [];
        arr.push(admBlank(cfg)); admSet(ADM.data, cfg.path, arr);
        admFillItems(cfg); admLivePreview();
      });
      card.appendChild(listWrap); card.appendChild(addBtn);
    }
    root.appendChild(card);
  });
}
function admFillForm(){
  ADM_SCHEMA.forEach(sec => {
    (sec.fields || []).forEach(f => {
      const n = document.querySelector('[data-path="' + f.path + '"]');
      if (n) n.value = admGet(ADM.data, f.path) || '';
    });
    (sec.lists || []).forEach(ls => {
      const n = document.querySelector('[data-lines="' + ls.path + '"]');
      if (n) n.value = (admGet(ADM.data, ls.path) || []).join('\n');
    });
    if (sec.items) admFillItems(sec.items);
  });
}
function admCollect(){
  ADM_SCHEMA.forEach(sec => {
    (sec.fields || []).forEach(f => {
      const n = document.querySelector('[data-path="' + f.path + '"]');
      if (n) admSet(ADM.data, f.path, n.value.trim());
    });
    (sec.lists || []).forEach(ls => {
      const n = document.querySelector('[data-lines="' + ls.path + '"]');
      if (n) admSet(ADM.data, ls.path, n.value.split('\n').map(s => s.trim()).filter(Boolean));
    });
    if (sec.items){
      const cfg = sec.items;
      const wrap = document.querySelector('[data-adm-items="' + cfg.path + '"]');
      const arr = [];
      wrap.querySelectorAll('.admin-item').forEach(card => {
        const it = {};
        cfg.fields.forEach(f => {
          const n = card.querySelector('[data-k="' + f.k + '"]');
          it[f.k] = admValFromText(n.value, f);
        });
        arr.push(it);
      });
      admSet(ADM.data, cfg.path, arr);
    }
  });
  return ADM.data;
}
/* 实时预览：编辑任意字段 → 左侧页面立即更新 */
let admPreviewTimer = null;
function admLivePreview(){
  clearTimeout(admPreviewTimer);
  admPreviewTimer = setTimeout(() => {
    try { window.applyContent(admCollect()); } catch(e){}
  }, 120);
}

/* ---------- GitHub API ---------- */
function admApi(repo){ return 'https://api.github.com/repos/' + repo + '/contents/content.json'; }
async function admGetRemote(repo, token){
  const r = await fetch(admApi(repo) + '?ref=main&t=' + Date.now(), { headers: { Authorization: 'Bearer ' + token, Accept: 'application/vnd.github+json' } });
  if (r.status === 404) return null;
  if (!r.ok) throw new Error('读取失败 HTTP ' + r.status);
  return r.json();
}
async function admPutRemote(repo, token, text, sha){
  const body = { message: 'update site content via in-page admin', branch: 'main', content: btoa(unescape(encodeURIComponent(text))) };
  if (sha) body.sha = sha;
  const r = await fetch(admApi(repo), { method: 'PUT', headers: { Authorization: 'Bearer ' + token, Accept: 'application/vnd.github+json', 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  if (!r.ok){ const e = await r.json().catch(()=>({})); throw new Error('保存失败 HTTP ' + r.status + (e.message ? '：' + e.message : '')); }
  return r.json();
}

/* ---------- 加载 / 保存 ---------- */
async function admLoad(){
  admStatus('加载中…', 'busy');
  try {
    let d = window.PSData || null;
    const r = await fetch('content.json', { cache: 'no-store' });
    if (r.ok) d = await r.json();
    if (!d) throw new Error('content.json 不可用');
    ADM.data = d;
    admRenderForm(); admFillForm();
    admStatus('已加载', 'ok');
  } catch(e){ admStatus('加载失败：' + e.message, 'err'); }
}
async function admSave(){
  const repo = document.getElementById('adm-repo').value.trim();
  const token = document.getElementById('adm-token').value.trim();
  if (!repo || !token){ admStatus('请先填写仓库和 Token', 'err'); return; }
  if (document.getElementById('adm-remember').checked)
    localStorage.setItem('ps_admin', JSON.stringify({ repo, token }));
  else localStorage.removeItem('ps_admin');
  admStatus('保存中…', 'busy');
  try {
    const text = JSON.stringify(admCollect(), null, 2);
    JSON.parse(text);
    const meta = await admGetRemote(repo, token);
    await admPutRemote(repo, token, text, meta ? meta.sha : null);
    admStatus('已保存 ✓ 约 1～2 分钟后全网生效', 'ok');
  } catch(e){ admStatus(e.message, 'err'); }
}
function admExport(){
  const blob = new Blob([JSON.stringify(admCollect(), null, 2)], { type: 'application/json' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'content-backup.json'; a.click();
}

/* ---------- 面板构建与开关 ---------- */
function admBuild(){
  const layer = admEl('div', 'admin-layer'); layer.id = 'admin-layer';
  const mask = admEl('div', 'admin-mask');
  const panel = admEl('div', 'admin-panel');
  const head = admEl('div', 'admin-head');
  head.appendChild(admEl('h2', null, '网站后台'));
  const x = admEl('button', 'admin-x', '×'); x.type = 'button'; x.title = '关闭';
  head.appendChild(x);
  panel.appendChild(head);
  panel.appendChild(admEl('p', 'admin-desc', '在这里修改内容，左侧页面实时预览；点「保存到 GitHub」后约 1～2 分钟对全网访客生效。Token 只保存在你自己的浏览器里。'));

  const conn = admEl('div', 'adm-sec');
  conn.appendChild(admEl('h3', null, '连接设置'));
  const crow = admEl('div', 'adm-conn');
  const fRepo = admEl('div', 'f'); fRepo.appendChild(admEl('label', null, '仓库（owner/repo）'));
  const repo = document.createElement('input'); repo.type = 'text'; repo.id = 'adm-repo'; repo.value = 'Leo-Chen66/personal-site';
  fRepo.appendChild(repo);
  const fTok = admEl('div', 'f'); fTok.appendChild(admEl('label', null, 'Token（repo 权限）'));
  const tok = document.createElement('input'); tok.type = 'password'; tok.id = 'adm-token'; tok.placeholder = 'ghp_...';
  fTok.appendChild(tok);
  crow.appendChild(fRepo); crow.appendChild(fTok);
  const ck = document.createElement('label'); ck.className = 'ck';
  const ckb = document.createElement('input'); ckb.type = 'checkbox'; ckb.id = 'adm-remember';
  ck.appendChild(ckb); ck.appendChild(document.createTextNode('记住 Token'));
  crow.appendChild(ck);
  conn.appendChild(crow);
  panel.appendChild(conn);

  const actions = admEl('div', 'adm-actions');
  const save = admEl('button', 'abtn pri', '保存到 GitHub'); save.type = 'button';
  const reload = admEl('button', 'abtn ghost', '放弃修改，重新加载'); reload.type = 'button';
  const exp = admEl('button', 'abtn ghost', '导出备份'); exp.type = 'button';
  save.addEventListener('click', admSave);
  reload.addEventListener('click', admLoad);
  exp.addEventListener('click', admExport);
  actions.appendChild(save); actions.appendChild(reload); actions.appendChild(exp);
  const st = admEl('span', 'adm-status', ''); st.id = 'adm-status';
  actions.appendChild(st);
  panel.appendChild(actions);

  const form = admEl('div'); form.id = 'adm-form';
  panel.appendChild(form);
  const note = admEl('p', 'adm-note');  note.innerHTML = '没有 Token？<a href="https://github.com/settings/tokens/new?scopes=repo&description=personal-site-admin" target="_blank">点这里一键创建</a>（已自动勾好 repo 权限，过期时间随意选），生成后复制 ghp_ 开头的一整串，粘贴到上面的 Token 框即可。';  panel.appendChild(note);

  layer.appendChild(mask); layer.appendChild(panel);
  document.body.appendChild(layer);

  x.addEventListener('click', admClose);
  mask.addEventListener('click', admClose);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') admClose(); });
  ADM.built = true;
}
function admOpen(){
  if (!ADM.built) admBuild();
  const saved = localStorage.getItem('ps_admin');
  if (saved){ try { const s = JSON.parse(saved); document.getElementById('adm-repo').value = s.repo || 'Leo-Chen66/personal-site'; document.getElementById('adm-token').value = s.token || ''; document.getElementById('adm-remember').checked = true; } catch(e){} }
  document.getElementById('admin-layer').classList.add('open');
  document.body.style.overflow = 'hidden';
  admLoad();
}
function admClose(){
  const l = document.getElementById('admin-layer');
  if (l) l.classList.remove('open');
  document.body.style.overflow = '';
}
document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('admin-btn');
  if (btn) btn.addEventListener('click', admOpen);
});
