/* Движок эффектов: спокойный режим, расшифровка, HUD, сборка блоков, шаги по прокрутке, курсоры, терминал, ASCII */
(() => {
  "use strict";
  const root = document.documentElement;
  const GL = "#%&@*+=-:/\\|<>[]{}01$?";
  const C = { ink: "#ffffff", gray: "#a3a3a3", mid: "#737373", dim: "#383838", red: "#ff2a2a" };
  const T = (ms, fn) => setTimeout(fn, ms);
  const rg = () => GL[(Math.random() * GL.length) | 0];
  const $$ = (s, el) => [...(el || document).querySelectorAll(s)];
  function hash(x, y, z) {
    let h = Math.imul(x | 0, 374761393) ^ Math.imul(y | 0, 668265263) ^ Math.imul(z | 0, 2246822519);
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  }

  /* ---------- спокойный режим ---------- */
  let calm = false;
  try { calm = matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) {}
  try { const s = localStorage.getItem("calm"); if (s !== null) calm = s === "1"; } catch (e) {}
  const calmFns = [];
  const btnCalm = document.getElementById("calm");
  function applyCalm() {
    root.classList.toggle("calm", calm);
    if (btnCalm) {
      btnCalm.setAttribute("aria-pressed", String(calm));
      btnCalm.textContent = calm ? "эффекты выключены" : "спокойный режим";
    }
  }
  if (btnCalm) btnCalm.addEventListener("click", () => {
    calm = !calm;
    try { localStorage.setItem("calm", calm ? "1" : "0"); } catch (e) {}
    applyCalm();
    calmFns.forEach((f) => f(calm));
  });
  applyCalm();

  /* ---------- расшифровка текста ---------- */
  function decode(el, dur) {
    const fin = el.dataset.final || el.textContent;
    el.dataset.final = fin;
    if (calm) { el.textContent = fin; return; }
    const n = fin.length;
    const th = Array.from(fin, (_, i) => (i / n) * 0.7 + Math.random() * 0.3);
    const t0 = performance.now();
    function step(t) {
      const p = Math.min(1, (t - t0) / (dur || 700));
      let s = "";
      for (let i = 0; i < n; i++) { const ch = fin[i]; s += (ch === " " || p >= th[i]) ? ch : rg(); }
      el.textContent = p >= 1 ? fin : s;
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  /* ---------- печать текста ---------- */
  $$("[data-type]").forEach((el) => {
    const txt = el.dataset.type;
    if (calm) { el.textContent = txt; return; }
    let i = 0;
    T(500, function tick() { el.textContent = txt.slice(0, ++i); if (i < txt.length) T(55 + Math.random() * 60, tick); });
  });
  $$("h1[data-decode]").forEach((h) => decode(h, 900));

  /* ---------- HUD: этап по прокрутке ---------- */
  const STAGES = ["ТЗ", "ПРОТОТИП", "ДИЗАЙН", "ВЁРСТКА", "ДЕПЛОЙ"];
  const hudLabel = document.getElementById("hud-label");
  const hudCells = $$("#hud-cells span");
  const hudPc = document.getElementById("hud-pc");
  let hudStage = -1;
  function updHud() {
    if (!hudLabel) return;
    const max = Math.max(1, root.scrollHeight - innerHeight);
    const p = Math.min(1, Math.max(0, scrollY / max));
    const s = Math.min(4, Math.floor(p * 5));
    hudPc.textContent = Math.round(p * 100) + "%";
    if (s !== hudStage) {
      hudStage = s;
      hudCells.forEach((c, i) => c.classList.toggle("on", i <= s));
      hudLabel.dataset.final = "[ ЭТАП 0" + (s + 1) + " · " + STAGES[s] + " ]";
      decode(hudLabel, 350);
    }
  }

  /* ---------- эффект сборки блока ---------- */
  const builds = $$(".build");
  builds.forEach((b) => {
    const ui = document.createElement("div");
    ui.className = "bf-ui";
    ui.setAttribute("aria-hidden", "true");
    ui.innerHTML = '<div class="bf-tag"></div><div class="bf-corners"><i></i><i></i><i></i><i></i></div><div class="bf-codebox"></div><div class="bf-strips"><div></div><div></div><div></div></div>';
    b.appendChild(ui);
  });
  const BF = ["bf-pending", "bf-frame", "bf-sketch", "bf-design", "bf-code", "bf-glitch"];
  function codeLines(b) {
    const out = [["t", '<section class="' + (b.dataset.slug || "block") + '">']];
    const els = $$("h2,h3,p,.lbl,.st,.btn,li,td", b).filter((e) => !e.closest(".bf-ui")).slice(0, 9);
    for (const el of els) {
      const tg = el.tagName.toLowerCase();
      const cls = el.classList[0] ? ' class="' + el.classList[0] + '"' : "";
      let tx = (el.dataset.final || el.textContent || "").trim().replace(/\s+/g, " ");
      if (tx.length > 30) tx = tx.slice(0, 30) + "…";
      out.push(["x", "  <" + tg + cls + ">" + tx + "</" + tg + ">"]);
    }
    out.push(["t", "</section>"]);
    out.push(["c", ".card { background: #141414; border-radius: 8px; }"]);
    out.push(["c", ".lbl  { font: 500 12px 'JetBrains Mono'; }"]);
    return out;
  }
  function typeCode(b, dur) {
    const box = b.querySelector(".bf-codebox");
    const ls = codeLines(b);
    box.innerHTML = "";
    const per = dur / ls.length;
    ls.forEach((l, i) => T(i * per, () => { const d = document.createElement("div"); d.className = "cl-" + l[0]; d.textContent = l[1]; box.appendChild(d); }));
  }
  function strips(b) {
    $$(".bf-strips div", b).forEach((d) => {
      let s = "";
      for (let i = 0; i < 160; i++) s += Math.random() < 0.25 ? " " : rg();
      d.textContent = s;
      d.style.top = (5 + Math.random() * 85) + "%";
    });
  }
  function setStage(b, cls, i) {
    b.classList.remove(...BF);
    if (cls) b.classList.add(cls);
    b.querySelector(".bf-tag").textContent = "[ ЭТАП 0" + (i + 1) + " · " + STAGES[i] + " · " + (b.dataset.name || "БЛОК") + " ]";
  }
  function markBuilt(b) {
    if (b.dataset.state === "done") return;
    b.dataset.state = "done";
    b.dispatchEvent(new Event("built"));
  }
  function run(b) {
    if (b.dataset.state) return;
    b.dataset.state = "run";
    b.classList.add("bf-run");
    setStage(b, "bf-frame", 0);
    T(400, () => setStage(b, "bf-sketch", 1));
    T(1150, () => { setStage(b, "bf-design", 2); $$("[data-decode]", b).forEach((h) => decode(h, 650)); });
    T(1500, () => { setStage(b, "bf-code", 3); typeCode(b, 520); });
    T(2120, () => { setStage(b, "bf-glitch", 4); strips(b); });
    T(2440, () => { setStage(b, null, 4); b.querySelector(".bf-tag").textContent = "[ ГОТОВО · " + (b.dataset.name || "БЛОК") + " ]"; markBuilt(b); });
    T(3500, () => b.classList.remove("bf-run"));
  }
  function finishAll() {
    builds.forEach((b) => { b.classList.remove(...BF, "bf-run"); if (b.dataset.state !== "done") { b.dataset.state = ""; markBuilt(b); } });
  }
  if (calm) builds.forEach(markBuilt);
  else builds.forEach((b) => { if (b.getBoundingClientRect().top > innerHeight * 0.85) b.classList.add("bf-pending"); else markBuilt(b); });
  const bio = new IntersectionObserver((es) => es.forEach((e) => {
    if (e.isIntersecting && e.target.classList.contains("bf-pending") && !calm) run(e.target);
  }), { threshold: 0.08, rootMargin: "0px 0px -8% 0px" });
  builds.forEach((b) => bio.observe(b));
  calmFns.push((v) => { if (v) finishAll(); });
  const builtOf = (el) => { const b = el.closest(".build"); return !b || b.dataset.state === "done"; };

  /* ---------- шаги, которые открываются по прокрутке ---------- */
  const unlocks = $$("[data-unlock]").map((box) => {
    const items = $$(box.dataset.unlock || ".step", box);
    const rail = box.querySelector("[data-unlock-rail]");
    const pct = document.querySelector(box.dataset.pct || "#__none");
    items.forEach((s) => { const t = s.querySelector(".st"); if (t) t.dataset.final = t.textContent; });
    return { box, items, rail, pct, open: 0 };
  });
  setInterval(() => {
    if (calm) return;
    unlocks.forEach((u) => u.items.forEach((s, i) => {
      if (i < u.open) return;
      const t = s.querySelector(".st");
      if (t) t.textContent = Array.from(t.dataset.final, (c) => (c === " " ? " " : rg())).join("");
    }));
  }, 140);
  function openItem(u, s, instant) {
    s.classList.remove("locked");
    s.classList.add("open");
    const t = s.querySelector(".st");
    if (t) { t.textContent = t.dataset.final; if (!instant) decode(t, 480); }
  }
  function updUnlocks() {
    unlocks.forEach((u) => {
      let p;
      if (calm) p = 1;
      else if (!builtOf(u.box)) p = 0;
      else {
        const r = u.box.getBoundingClientRect();
        p = (innerHeight * 0.75 - r.top) / (r.height + innerHeight * 0.1);
        p = Math.max(0, Math.min(1, p));
      }
      const n = u.items.length;
      const k = Math.min(n, Math.floor(p * (n + 0.15)));
      while (u.open < k) { openItem(u, u.items[u.open], calm); u.open++; }
      if (u.rail) u.rail.style.height = (p * 100) + "%";
      if (u.pct) u.pct.textContent = Math.round(p * 100);
    });
  }
  unlocks.forEach((u) => { const b = u.box.closest(".build"); if (b) b.addEventListener("built", updUnlocks); });

  /* ---------- курсоры «ты» и «мошенник» на макете ---------- */
  $$("[data-demo]").forEach((stage) => {
    const curYou = stage.querySelector(".cur.you");
    const curBad = stage.querySelector(".cur.bad");
    const link = stage.querySelector(".link");
    const flags = $$(".flag", stage);
    const items = $$(".fl li", stage);
    if (!curYou || !curBad || !link) return;
    const pos = (el, ax, ay) => { const s = stage.getBoundingClientRect(), r = el.getBoundingClientRect(); return [r.left - s.left + r.width * ax, r.top - s.top + r.height * ay]; };
    const ease = (x) => (x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2);
    function along(w, k) {
      for (let i = 0; i < w.length - 1; i++) {
        const a = w[i], b = w[i + 1];
        if (k >= a[0] && k <= b[0]) { const u = ease((k - a[0]) / Math.max(1, b[0] - a[0])); return [a[1][0] + (b[1][0] - a[1][0]) * u, a[1][1] + (b[1][1] - a[1][1]) * u]; }
      }
      return w[w.length - 1][1];
    }
    const FT = [2300, 3050, 3800];
    const IT = [2300, 3050, 3800, 4600];
    function setDemo(k) {
      link.classList.toggle("hot", k >= 1150 && k < 6700);
      flags.forEach((f, i) => f.classList.toggle("on", k >= (FT[i] || 9e9) && k < 6700));
      items.forEach((li, i) => li.classList.toggle("on", k >= (IT[i] || 9e9) && k < 6700));
    }
    let vis = false, running = false, t0 = performance.now(), lastK = 0;
    function start() { if (vis && !running) { running = true; requestAnimationFrame(frame); } }
    function frame(t) {
      if (!vis) { running = false; return; }
      if (calm) { setDemo(5000); running = false; return; }
      if (!builtOf(stage)) { requestAnimationFrame(frame); return; }
      const L = 7400, k = (t - t0) % L;
      const sw = stage.clientWidth, sh = stage.clientHeight;
      const badStart = [sw * 0.92, sh * 0.96], youStart = [sw * 0.02, sh * 0.92];
      const pLink = pos(link, 0.6, 0.6);
      const pf = flags.map((f) => pos(f, 0.4, 0.5));
      while (pf.length < 3) pf.push(pLink);
      const pTodo = items[3] ? pos(items[3], 0.08, 0.5) : pf[2];
      const bad = along([[0, badStart], [1100, pLink], [4200, pLink], [5400, [sw * 1.02, sh * 0.1]], [L, badStart]], k);
      const you = along([[0, youStart], [1400, youStart], [2300, pf[0]], [3050, pf[1]], [3800, pf[2]], [4600, pTodo], [6600, pTodo], [L, youStart]], k);
      curBad.style.transform = "translate(" + bad[0] + "px," + bad[1] + "px)";
      curYou.style.transform = "translate(" + you[0] + "px," + you[1] + "px)";
      if (lastK < 1100 && k >= 1100) { curBad.classList.add("click"); T(220, () => curBad.classList.remove("click")); }
      IT.forEach((m) => { if (lastK < m && k >= m) { curYou.classList.add("click"); T(200, () => curYou.classList.remove("click")); } });
      lastK = k;
      setDemo(k);
      requestAnimationFrame(frame);
    }
    new IntersectionObserver((es) => { vis = es[0].isIntersecting; start(); }, { threshold: 0.2 }).observe(stage);
    calmFns.push(() => start());
  });

  /* ---------- терминал с настоящими данными устройства ---------- */
  function deviceInfo() {
    let ua = "";
    try { ua = navigator.userAgent || ""; } catch (e) {}
    let sys = "не определено", br = "не определено", lang = "-", tz = "-", scr = "-", cores = "-", ck = "-";
    if (/Android/.test(ua)) sys = "Android"; else if (/iPhone|iPad/.test(ua)) sys = "iOS"; else if (/Windows/.test(ua)) sys = "Windows"; else if (/Mac OS X/.test(ua)) sys = "macOS"; else if (/Linux/.test(ua)) sys = "Linux";
    if (/YaBrowser/.test(ua)) br = "Яндекс Браузер"; else if (/Edg\//.test(ua)) br = "Edge"; else if (/OPR\//.test(ua)) br = "Opera"; else if (/Firefox\//.test(ua)) br = "Firefox"; else if (/Chrome\//.test(ua)) br = "Chrome"; else if (/Safari\//.test(ua)) br = "Safari";
    try { lang = navigator.language || "-"; } catch (e) {}
    try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "-"; } catch (e) {}
    try { scr = screen.width + " x " + screen.height; } catch (e) {}
    try { cores = navigator.hardwareConcurrency ? String(navigator.hardwareConcurrency) : "-"; } catch (e) {}
    try { ck = navigator.cookieEnabled ? "включены" : "выключены"; } catch (e) {}
    return [["система", sys], ["браузер", br], ["язык", lang], ["часовой пояс", tz], ["экран", scr], ["ядер процессора", cores], ["cookies", ck]];
  }
  $$("[data-term]").forEach((box) => {
    let done = false;
    function go() {
      if (done) return;
      done = true;
      const rows = deviceInfo().map(([k, v]) => ["> " + k + " " + ".".repeat(Math.max(2, 18 - k.length)) + " ", v]);
      box.innerHTML = "";
      const fin = () => box.insertAdjacentHTML("beforeend", '<div><span class="k">&gt; </span><span class="caret"></span></div>');
      if (calm) {
        rows.forEach(([k, v]) => { const d = document.createElement("div"); d.innerHTML = '<span class="k"></span><span class="v"></span>'; d.children[0].textContent = k; d.children[1].textContent = v; box.appendChild(d); });
        fin();
        return;
      }
      let r = 0;
      (function line() {
        if (r >= rows.length) { fin(); return; }
        const [k, v] = rows[r++];
        const d = document.createElement("div");
        d.innerHTML = '<span class="k"></span><span class="v"></span><span class="caret"></span>';
        box.appendChild(d);
        d.children[0].textContent = k;
        let i = 0;
        (function ch() { d.children[1].textContent = v.slice(0, ++i); if (i < v.length) T(28, ch); else { d.children[2].remove(); T(140, line); } })();
      })();
    }
    const b = box.closest(".build");
    if (b) b.addEventListener("built", () => { if (box.getBoundingClientRect().top < innerHeight) go(); });
    new IntersectionObserver((es) => { if (es[0].isIntersecting && builtOf(box)) go(); }, { threshold: 0.3 }).observe(box);
    calmFns.push((v) => { if (v) go(); });
  });

  /* ---------- ASCII-движок ---------- */
  const canvases = [];
  class Ascii {
    constructor(cv, draw, opt) {
      this.cv = cv; this.ctx = cv.getContext("2d"); this.draw = draw; this.opt = opt || {};
      this.fs = this.opt.fs || 12; this.fps = this.opt.fps || 30;
      this.visible = false; this.last = 0; this.t0 = performance.now(); this.raf = 0;
      canvases.push(this);
      new ResizeObserver(() => this.resize()).observe(cv);
      new IntersectionObserver((es) => { this.visible = es[0].isIntersecting; this.kick(); }).observe(cv);
      this.resize();
    }
    resize() {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const w = this.cv.clientWidth, h = this.cv.clientHeight;
      if (!w || !h) return;
      this.cv.width = Math.round(w * dpr); this.cv.height = Math.round(h * dpr);
      this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      this.W = w; this.H = h;
      const fs = w < 420 ? Math.max(9, this.fs - 3) : this.fs;
      this.cfs = fs; this.cw = fs * 0.6; this.ch = fs;
      this.cols = Math.floor(w / this.cw); this.rows = Math.floor(h / this.ch);
      if (this.opt.onResize) this.opt.onResize(this);
      this.kick();
    }
    kick() { if (!this.raf) this.raf = requestAnimationFrame((t) => this.loop(t)); }
    loop(t) {
      this.raf = 0;
      if (!this.W) return;
      const live = this.visible && !calm;
      if (!live) { this.render(3, false); return; }
      if (t - this.last >= 1000 / this.fps) { this.last = t; this.render((t - this.t0) / 1000, true); }
      this.kick();
    }
    render(time, live) {
      const ctx = this.ctx;
      ctx.clearRect(0, 0, this.W, this.H);
      ctx.font = "500 " + this.cfs + "px 'JetBrains Mono', ui-monospace, Menlo, monospace";
      ctx.textBaseline = "top";
      const buckets = new Map();
      const put = (c, r, ch, col) => { if (ch === " ") return; let b = buckets.get(col); if (!b) { b = []; buckets.set(col, b); } b.push(c, r, ch); };
      this.draw(this, time, put, live);
      for (const [col, arr] of buckets) {
        ctx.fillStyle = col;
        for (let i = 0; i < arr.length; i += 3) ctx.fillText(arr[i + 2], arr[i] * this.cw, arr[i + 1] * this.ch);
      }
    }
  }
  calmFns.push(() => canvases.forEach((a) => a.kick()));

  /* глаз, который следит за курсором */
  const pointer = { x: 0, y: 0, last: -1e9 };
  addEventListener("pointermove", (e) => { pointer.x = e.clientX; pointer.y = e.clientY; pointer.last = performance.now(); }, { passive: true });
  function eyeDraw(a, time, put, live) {
    const { cols, rows, cw, ch, W, H } = a;
    const s = a.st || (a.st = { blinkAt: 2.6, gUntil: 0, gRow: 0, gOff: 0, gNext: 1.6 });
    const cx = W / 2, cy = H / 2, A = W * 0.45, B = H * 0.27;
    let bl = 1;
    if (live && time > s.blinkAt) {
      const k = (time - s.blinkAt) / 0.2;
      if (k >= 1) s.blinkAt = time + 3 + Math.random() * 3.5;
      else bl = Math.max(0.05, Math.abs(1 - 2 * k));
    }
    let lx = 0, ly = 0;
    if (live) {
      if (performance.now() - pointer.last > 2500) { lx = Math.sin(time * 0.7) * 0.7; ly = Math.sin(time * 1.13) * 0.4; }
      else {
        const r = a.cv.getBoundingClientRect();
        lx = Math.max(-1, Math.min(1, (pointer.x - (r.left + r.width / 2)) / (innerWidth * 0.35)));
        ly = Math.max(-1, Math.min(1, (pointer.y - (r.top + r.height / 2)) / (innerHeight * 0.35)));
      }
    }
    const R = B * 1.05, ix = cx + lx * A * 0.42, iy = cy + ly * B * 0.4;
    const intro = live ? Math.min(1, time / 1.4) : 1;
    if (live && time > s.gNext) { s.gRow = (Math.random() * rows) | 0; s.gOff = ((Math.random() * 10) | 0) - 5; s.gUntil = time + 0.13; s.gNext = time + 1.4 + Math.random() * 2.4; }
    const gOn = live && time < s.gUntil;
    const fr = live ? (time * 7) | 0 : 0;
    for (let r = 0; r < rows; r++) {
      const band = gOn && r >= s.gRow && r < s.gRow + 3;
      const off = band ? s.gOff : 0;
      for (let c = 0; c < cols; c++) {
        const px = (c + off + 0.5) * cw - cx, py = (r + 0.5) * ch - cy, xr = px / A;
        let chr = " ", col = C.dim;
        if (Math.abs(xr) < 1) {
          const lid = B * bl * Math.pow(1 - xr * xr, 0.85), ay = Math.abs(py);
          if (ay < lid) {
            const dx = px + cx - ix, dy = py + cy - iy, d = Math.hypot(dx, dy);
            if (d < R) {
              if (d < R * 0.38) {
                if (Math.hypot(dx + R * 0.17, dy + R * 0.17) < R * 0.11) { chr = "@"; col = C.ink; }
              } else {
                const ang = Math.atan2(dy, dx), k = (d - R * 0.38) / (R * 0.62), v = 0.5 + 0.5 * Math.sin(ang * 17 + d * 0.09);
                chr = k < 0.1 ? "@" : k > 0.86 ? "%" : v > 0.62 ? "#" : v > 0.33 ? "*" : "+";
                col = C.red;
              }
            } else {
              const e = (lid - ay) / Math.max(1, lid);
              chr = e < 0.14 ? "=" : e < 0.36 ? "-" : e < 0.7 ? ":" : ".";
              col = C.mid;
            }
          } else if (ay - lid < ch * 0.9 && Math.abs(xr) < 0.985) { chr = ay - lid < ch * 0.45 ? "#" : "="; col = C.ink; }
        }
        if (chr === " ") { const n = hash(c, r, fr); if (n < 0.045) { chr = GL[((n * 99991) | 0) % GL.length]; col = n < 0.01 ? C.mid : C.dim; } }
        if (intro < 1 && Math.random() > intro) { chr = rg(); col = Math.random() < 0.15 ? C.red : C.dim; }
        if (band && chr !== " " && Math.random() < 0.5) col = Math.random() < 0.5 ? C.red : C.ink;
        put(c, r, chr, col);
      }
    }
  }

  /* трёхмерный замок (raymarching) и режим фото */
  const RAMP = " .:-=+*#%@";
  function lockSDF(x, y, z) {
    const bx = Math.abs(x) - 0.62, by = Math.abs(y + 0.38) - 0.42, bz = Math.abs(z) - 0.2;
    let body = Math.hypot(Math.max(bx, 0), Math.max(by, 0), Math.max(bz, 0)) + Math.min(Math.max(bx, Math.max(by, bz)), 0) - 0.1;
    const kc = Math.hypot(x, y + 0.3) - 0.1;
    const kbx = Math.abs(x) - 0.045, kby = Math.abs(y + 0.47) - 0.13;
    const kb = Math.hypot(Math.max(kbx, 0), Math.max(kby, 0)) + Math.min(Math.max(kbx, kby), 0);
    body = Math.max(body, -Math.min(kc, kb));
    const y0 = 0.14, Rr = 0.46, r = 0.095;
    let sh;
    if (y > y0) { const q = Math.hypot(x, y - y0) - Rr; sh = Math.hypot(q, z) - r; }
    else { const dy = y < -0.2 ? -0.2 - y : 0; sh = Math.hypot(Math.abs(x) - Rr, z, dy) - r; }
    return Math.min(body, sh);
  }
  function photoGrid(a) {
    const img = a.photoImg, cols = a.cols, rows = a.rows;
    const off = document.createElement("canvas");
    off.width = cols; off.height = rows;
    const o = off.getContext("2d");
    const ta = (cols * a.cw) / (rows * a.ch), ia = img.width / img.height;
    let sw, sh, sx, sy;
    if (ia > ta) { sh = img.height; sw = sh * ta; sx = (img.width - sw) / 2; sy = 0; } else { sw = img.width; sh = sw / ta; sx = 0; sy = (img.height - sh) / 2; }
    o.drawImage(img, sx, sy, sw, sh, 0, 0, cols, rows);
    const d = o.getImageData(0, 0, cols, rows).data, lum = new Float32Array(cols * rows);
    let mn = 1, mx = 0;
    for (let i = 0; i < cols * rows; i++) { const v = (0.2126 * d[i * 4] + 0.7152 * d[i * 4 + 1] + 0.0722 * d[i * 4 + 2]) / 255; lum[i] = v; if (v < mn) mn = v; if (v > mx) mx = v; }
    const span = Math.max(0.05, mx - mn);
    for (let i = 0; i < lum.length; i++) lum[i] = (lum[i] - mn) / span;
    a.photo = { cols, rows, lum };
  }
  function lockDraw(a, time, put, live) {
    const { cols, rows, cw, ch, W, H } = a;
    if (a.photoImg) {
      if (!a.photo || a.photo.cols !== cols || a.photo.rows !== rows) photoGrid(a);
      const intro = live ? Math.min(1, (performance.now() - a.photoT0) / 1200) : 1, fr = live ? (time * 8) | 0 : 0;
      for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
        const L = a.photo.lum[r * cols + c];
        let chr = RAMP[Math.min(9, (L * 9.99) | 0)], col = L > 0.72 ? C.ink : L > 0.42 ? C.gray : C.mid;
        if (live && hash(c, r, fr) < 0.012) { chr = rg(); col = C.red; }
        if (intro < 1 && Math.random() > intro) { chr = rg(); col = C.dim; }
        put(c, r, chr, col);
      }
      return;
    }
    const th = live ? time * 0.9 : 0.7, ph = 0.32, ct = Math.cos(th), st = Math.sin(th), cp = Math.cos(ph), sp = Math.sin(ph);
    const toObj = (x, y, z) => { const x1 = x * ct - z * st, z1 = x * st + z * ct; return [x1, y * cp - z1 * sp, y * sp + z1 * cp]; };
    let L = [-0.55, 0.65, -0.75]; const ln = Math.hypot(L[0], L[1], L[2]); L = toObj(L[0] / ln, L[1] / ln, L[2] / ln);
    const sc = 2.0 / Math.min(W, H), fr = live ? (time * 6) | 0 : 0, e = 0.004;
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const sx = ((c + 0.5) * cw - W / 2) * sc, sy = -((r + 0.5) * ch - H / 2) * sc;
      let dx = sx * 0.36, dy = sy * 0.36 + 0.02, dz = 1;
      const dl = Math.hypot(dx, dy, dz); dx /= dl; dy /= dl; dz /= dl;
      const oy = -0.1, oz = -3.4, b = oz * dz, cc = oz * oz - 1.69, disc = b * b - cc;
      let chr = " ", col = C.dim;
      if (disc > 0) {
        let t = -b - Math.sqrt(disc); const tmax = -b + Math.sqrt(disc);
        let hit = false, px = 0, py = 0, pz = 0;
        for (let i = 0; i < 42 && t < tmax; i++) {
          const o = toObj(dx * t, oy + dy * t, oz + dz * t), d = lockSDF(o[0], o[1], o[2]);
          if (d < 0.004) { hit = true; px = o[0]; py = o[1]; pz = o[2]; break; }
          t += d;
        }
        if (hit) {
          const a1 = lockSDF(px + e, py - e, pz - e), a2 = lockSDF(px - e, py - e, pz + e), a3 = lockSDF(px - e, py + e, pz - e), a4 = lockSDF(px + e, py + e, pz + e);
          let nx = a1 - a2 - a3 + a4, ny = -a1 - a2 + a3 + a4, nz = -a1 + a2 - a3 + a4;
          const nl = Math.hypot(nx, ny, nz) || 1; nx /= nl; ny /= nl; nz /= nl;
          const v = toObj(-dx, -dy, -dz), dif = Math.max(0, nx * L[0] + ny * L[1] + nz * L[2]);
          const lum = Math.min(1, 0.1 + 0.9 * dif), rim = 1 - Math.max(0, nx * v[0] + ny * v[1] + nz * v[2]);
          chr = RAMP[Math.max(1, Math.min(9, (lum * 9.99) | 0))];
          col = rim > 0.78 ? C.red : lum > 0.7 ? C.ink : lum > 0.38 ? C.gray : C.mid;
        }
      }
      if (chr === " ") { const n = hash(c, r, fr); if (n < 0.03) { chr = GL[((n * 99991) | 0) % GL.length]; col = C.dim; } }
      put(c, r, chr, col);
    }
  }

  /* глобус */
  function globeDraw(a, time, put, live) {
    const { cols, rows, cw, ch, W, H } = a;
    const cx = W / 2, cy = H / 2, Rr = Math.min(W, H) * 0.4;
    const th = live ? time * 0.35 : 0.9, tilt = 0.42, ctl = Math.cos(tilt), stl = Math.sin(tilt), cth = Math.cos(th), sth = Math.sin(th);
    const blink = live ? ((time * 2) | 0) % 2 === 0 : true;
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const x = ((c + 0.5) * cw - cx) / Rr, y = ((r + 0.5) * ch - cy) / Rr, q = x * x + y * y;
      let chr = " ", col = C.dim;
      if (q < 1) {
        const z = Math.sqrt(1 - q), Y = -y, Y1 = Y * ctl - z * stl, Z1 = Y * stl + z * ctl;
        const X2 = x * cth + Z1 * sth, Z2 = -x * sth + Z1 * cth;
        const lat = Math.asin(Math.max(-1, Math.min(1, Y1))) * 57.2958, lon = Math.atan2(X2, Z2) * 57.2958;
        const dLat = Math.abs(((lat % 15) + 15) % 15 - 7.5), dLon = Math.abs(((lon % 20) + 20) % 20 - 10);
        const onLat = 7.5 - dLat < 1.4, onLon = (10 - dLon) * Math.cos(lat / 57.2958) < 1.6, light = 0.25 + 0.75 * z;
        if (onLat || onLon) { chr = light > 0.72 ? "#" : light > 0.48 ? "+" : "-"; col = light > 0.72 ? C.ink : C.gray; }
        else if (hash(c, r, 7) < 0.07 * light) { chr = "."; col = C.mid; }
        if (Math.hypot(lat - 22, (((lon - 34) % 360) + 540) % 360 - 180) < 5) { chr = "@"; col = blink ? C.red : C.ink; }
      } else {
        const ex = x / 1.42, ey = (y + x * 0.18) / 0.32, e = Math.abs(ex * ex + ey * ey - 1);
        if (e < 0.07) { if (Math.sin(Math.atan2(ey, ex) * 14 - (live ? time * 3 : 0)) > 0.2) { chr = "."; col = C.red; } }
        else if (hash(c, r, live ? (time * 5) | 0 : 0) < 0.02) { chr = rg(); col = C.dim; }
      }
      put(c, r, chr, col);
    }
  }

  /* крупный текст или номер из символов: обложки страниц и глав */
  function textMask(a) {
    const off = document.createElement("canvas");
    off.width = a.cols; off.height = a.rows;
    const o = off.getContext("2d");
    const txt = a.cv.dataset.text || "?";
    o.fillStyle = "#000"; o.fillRect(0, 0, a.cols, a.rows);
    o.save();
    o.scale(1, a.cw / a.ch);
    const fsz = Math.min(a.rows * (a.ch / a.cw) * 0.86, (a.cols * 1.2) / Math.max(1, txt.length));
    o.font = "700 " + fsz + "px Unbounded, 'Arial Black', sans-serif";
    o.textAlign = "center"; o.textBaseline = "middle"; o.fillStyle = "#fff";
    o.fillText(txt, a.cols / 2, (a.rows * (a.ch / a.cw)) / 2);
    o.restore();
    const d = o.getImageData(0, 0, a.cols, a.rows).data, m = new Float32Array(a.cols * a.rows);
    for (let i = 0; i < m.length; i++) m[i] = d[i * 4] / 255;
    a.mask = m;
  }
  function textDraw(a, time, put, live) {
    const { cols, rows } = a;
    if (!a.mask || a.mask.length !== cols * rows) textMask(a);
    const red = a.cv.dataset.tone === "red";
    const s = a.st || (a.st = { gNext: 1 + Math.random() * 2, gUntil: 0, gRow: 0, gOff: 0 });
    if (live && time > s.gNext) { s.gRow = (Math.random() * rows) | 0; s.gOff = ((Math.random() * 6) | 0) - 3; s.gUntil = time + 0.12; s.gNext = time + 1.8 + Math.random() * 3; }
    const gOn = live && time < s.gUntil, fr = live ? (time * 6) | 0 : 0;
    const intro = live ? Math.min(1, time / 1.2) : 1;
    const sweep = live ? ((time * 0.35) % 1.3) * rows : -99;
    for (let r = 0; r < rows; r++) {
      const band = gOn && r >= s.gRow && r < s.gRow + 2, off = band ? s.gOff : 0;
      for (let c = 0; c < cols; c++) {
        const cc = Math.min(cols - 1, Math.max(0, c + off)), v = a.mask[r * cols + cc];
        let chr = " ", col = C.dim;
        if (v > 0.35) {
          const n = hash(c, r, (fr / 3) | 0);
          chr = v > 0.85 ? (n < 0.5 ? "#" : "@") : v > 0.6 ? "%" : "+";
          col = red ? C.red : (Math.abs(r - sweep) < 1.2 ? C.red : v > 0.85 ? C.ink : C.gray);
        } else {
          const n = hash(c, r, fr);
          if (n < 0.05) { chr = GL[((n * 99991) | 0) % GL.length]; col = n < 0.012 ? C.mid : C.dim; }
        }
        if (intro < 1 && Math.random() > intro) { chr = rg(); col = C.dim; }
        if (band && chr !== " " && Math.random() < 0.5) col = Math.random() < 0.5 ? C.red : C.ink;
        put(c, r, chr, col);
      }
    }
  }

  const DRAW = { eye: eyeDraw, lock: lockDraw, globe: globeDraw, text: textDraw };
  $$("canvas[data-ascii]").forEach((cv) => {
    const kind = cv.dataset.ascii, fn = DRAW[kind];
    if (!fn) return;
    const a = new Ascii(cv, fn, { fs: Number(cv.dataset.fs) || 12, fps: kind === "text" ? 18 : kind === "eye" ? 30 : 24, onResize: (x) => { x.mask = null; x.photo = null; } });
    if (kind === "text" && document.fonts && document.fonts.ready) document.fonts.ready.then(() => { a.mask = null; a.kick(); });
    const inp = cv.dataset.photoInput && document.getElementById(cv.dataset.photoInput);
    const rst = cv.dataset.photoReset && document.getElementById(cv.dataset.photoReset);
    if (inp) inp.addEventListener("change", () => {
      const f = inp.files && inp.files[0];
      if (!f) return;
      const url = URL.createObjectURL(f), img = new Image();
      img.onload = () => { a.photoImg = img; a.photo = null; a.photoT0 = performance.now(); if (rst) rst.hidden = false; a.kick(); URL.revokeObjectURL(url); };
      img.onerror = () => URL.revokeObjectURL(url);
      img.src = url;
    });
    if (rst) rst.addEventListener("click", () => { a.photoImg = null; a.photo = null; rst.hidden = true; if (inp) inp.value = ""; a.kick(); });
  });

  /* ---------- прокрутка ---------- */
  let ticking = false;
  addEventListener("scroll", () => { if (ticking) return; ticking = true; requestAnimationFrame(() => { ticking = false; updHud(); updUnlocks(); }); }, { passive: true });
  addEventListener("resize", () => { updHud(); updUnlocks(); });
  calmFns.push(() => updUnlocks());
  updHud();
  updUnlocks();

  window.FX = { decode, isCalm: () => calm, onCalm: (f) => calmFns.push(f), glitch: (el) => { if (calm) return; el.classList.remove("shake"); void el.offsetWidth; el.classList.add("shake"); } };
})();
