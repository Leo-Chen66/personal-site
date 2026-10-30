'use strict';
/* ================= main.js：星空背景 / 入场动画 / 导航高亮 / 内容数据渲染 ================= */

/* 截图模式：?shot=1 关闭平滑滚动与入场动画 */
if (new URLSearchParams(location.search).has('shot')) {
  document.documentElement.style.scrollBehavior = 'auto';
  document.querySelectorAll('.reveal').forEach(el => el.classList.add('in'));
}

/* 星空 Canvas 粒子背景 */
(function(){
  const cv = document.getElementById('stars'), ctx = cv.getContext('2d');
  let W, H, stars = [];
  function resize(){
    W = cv.width = innerWidth; H = cv.height = innerHeight;
    stars = Array.from({length: Math.min(220, W*H/9000)}, ()=>({
      x: Math.random()*W, y: Math.random()*H,
      r: Math.random()*1.4 + .3,
      vy: Math.random()*.18 + .04,
      a: Math.random()*.6 + .25,
      tw: Math.random()*.02 + .004
    }));
  }
  addEventListener('resize', resize); resize();
  (function loop(){
    ctx.clearRect(0,0,W,H);
    for (const s of stars){
      s.y += s.vy; if (s.y > H+2){ s.y = -2; s.x = Math.random()*W; }
      s.a += s.tw * (Math.random()>.5?1:-1);
      if (s.a > .9) s.a = .9; if (s.a < .15) s.a = .15;
      ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, 6.283);
      ctx.fillStyle = 'rgba(200,214,255,' + s.a.toFixed(3) + ')'; ctx.fill();
    }
    requestAnimationFrame(loop);
  })();
})();

/* 滚动入场动画 */
(function(){
  const io = new IntersectionObserver(es=>{
    es.forEach(e=>{ if(e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); } });
  }, {threshold:.12});
  document.querySelectorAll('.reveal').forEach(el=>io.observe(el));
})();

/* 导航高亮 */
(function(){
  const links = document.querySelectorAll('.nav-in a[href^="#"]');
  const io = new IntersectionObserver(es=>{
    es.forEach(e=>{
      if (e.isIntersecting){
        links.forEach(l=>l.classList.toggle('on', l.getAttribute('href')==='#'+e.target.id));
      }
    });
  }, {rootMargin:'-40% 0px -55% 0px'});
  document.querySelectorAll('section[id]').forEach(s=>io.observe(s));
})();

/* ===== 内容数据驱动：加载 content.json 覆盖默认内容 ===== */
function setText(id, v){ const el = document.getElementById(id); if (el && v != null) el.textContent = v; }
function rebuildList(id, n, fn){
  const box = document.getElementById(id); if (!box || !Array.isArray(n)) return;
  box.textContent = '';
  n.forEach(item => box.appendChild(fn(item)));
}
function applyContent(d){
  try {
    if (d.site){
      document.title = d.site.title;
      setText('logo-a', d.site.logoA); setText('logo-b', d.site.logoB); setText('footer-text', d.site.footer);
    }
    if (d.hero){
      setText('hero-hello', d.hero.hello); setText('hero-name-cn', d.hero.nameCn); setText('hero-name-en', d.hero.nameEn);
      setText('hero-intro', d.hero.intro); setText('cta-projects', d.hero.btnPrimary); setText('cta-contact', d.hero.btnGhost);
      rebuildList('hero-tags', d.hero.tags, t => { const s = document.createElement('span'); s.className = 'tag'; s.textContent = t; return s; });
    }
    if (d.about){
      setText('about-title', d.about.title); setText('about-sub', d.about.subtitle); setText('about-avatar', d.about.avatar);
      rebuildList('about-paras', d.about.paragraphs, p => { const el = document.createElement('p'); el.textContent = p; return el; });
    }
    if (d.skills){
      setText('skills-title', d.skills.title); setText('skills-sub', d.skills.subtitle);
      rebuildList('skills-grid', d.skills.items, it => {
        const c = document.createElement('div'); c.className = 'card';
        c.innerHTML = '<div class="ic"></div><h3></h3><p></p><div class="bar"><i></i></div>';
        c.querySelector('.ic').textContent = it.icon;
        c.querySelector('h3').textContent = it.name;
        c.querySelector('p').textContent = it.desc;
        c.querySelector('.bar i').style.width = (it.level || 0) + '%';
        return c;
      });
    }
    if (d.projects){
      setText('projects-title', d.projects.title); setText('projects-sub', d.projects.subtitle);
      rebuildList('projects-grid', d.projects.items, it => {
        const c = document.createElement('div'); c.className = 'card proj';
        c.innerHTML = '<div class="top"></div><div class="bd"><h3></h3><p></p><div class="chips"></div></div>';
        c.querySelector('.top').textContent = it.icon;
        c.querySelector('h3').textContent = it.name;
        c.querySelector('p').textContent = it.desc;
        const chips = c.querySelector('.chips');
        (it.chips || []).forEach(ch => { const s = document.createElement('span'); s.className = 'chip'; s.textContent = ch; chips.appendChild(s); });
        if (it.link){ c.style.cursor = 'pointer'; c.addEventListener('click', () => window.open(it.link, '_blank', 'noopener')); }
        return c;
      });
    }
    if (d.blog){
      setText('blog-title', d.blog.title); setText('blog-sub', d.blog.subtitle);
      rebuildList('blog-list', d.blog.items, it => {
        const a = document.createElement('a'); a.className = 'post'; a.href = it.link || '#blog';
        a.innerHTML = '<div class="t"></div><div class="m"></div>';
        a.querySelector('.t').textContent = it.title;
        a.querySelector('.m').textContent = it.meta;
        return a;
      });
    }
    if (d.contact){
      setText('contact-title', d.contact.title); setText('contact-sub', d.contact.subtitle);
      setText('contact-heading', d.contact.heading); setText('contact-email', d.contact.email); setText('contact-github', d.contact.githubUser);
      const mail = document.getElementById('contact-mailto'); if (mail && d.contact.email) mail.href = 'mailto:' + d.contact.email;
    }
  } catch (e) { console.warn('applyContent error', e); }
}
window.applyContent = applyContent;
window.PSContentLoaded = Promise.resolve(
  fetch('content.json', {cache: 'no-store'})
    .then(r => r.ok ? r.json() : null)
    .then(d => { if (d) { window.PSData = d; applyContent(d); } return d; })
    .catch(err => { console.info('使用默认内容（content.json 不可用）', err); return null; })
);
