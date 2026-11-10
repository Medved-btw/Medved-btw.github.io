/* Функции страниц: чек-лист, тест, вопросы глав, прогресс Академии, словарь, лаборатория */
(() => {
  "use strict";
  const $ = (s, el) => (el || document).querySelector(s);
  const $$ = (s, el) => [...(el || document).querySelectorAll(s)];
  const FX = window.FX || { decode() {}, isCalm: () => true, onCalm() {}, glitch() {} };
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  };
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  /* ---------- перекладка «Счёт.pdf» в «Счёт.pdf.exe» ---------- */
  $$("[data-swap]").forEach((el) => {
    const [a, b] = el.dataset.swap.split("|");
    let on = false;
    setInterval(() => {
      if (FX.isCalm()) { el.textContent = b; el.closest(".fico").classList.add("bad"); return; }
      on = !on;
      el.dataset.final = on ? b : a;
      el.closest(".fico").classList.toggle("bad", on);
      FX.decode(el, 420);
    }, 2600);
  });

  /* ---------- чек-лист ---------- */
  const ck = $("[data-checklist]");
  if (ck) {
    const boxes = $$("input[type=checkbox]", ck);
    const saved = store.get("checklist", {});
    boxes.forEach((b) => { b.checked = !!saved[b.id]; });
    const meter = $("[data-meter] i"), doneEl = $("[data-done]"), pctEl = $("[data-pct]"), rankEl = $("[data-rank]");
    let lastRank = "";
    function upd() {
      const st = {};
      let n = 0;
      boxes.forEach((b) => { st[b.id] = b.checked; if (b.checked) n++; });
      store.set("checklist", st);
      const p = Math.round((n / boxes.length) * 100);
      meter.style.width = p + "%";
      doneEl.textContent = n;
      pctEl.textContent = p;
      const rank = p === 100 ? "почти невидимка" : p >= 75 ? "осторожный" : p >= 40 ? "на полпути" : p > 0 ? "начало положено" : "открытая книга";
      if (rank !== lastRank) { rankEl.dataset.final = rank; if (lastRank) FX.decode(rankEl, 500); else rankEl.textContent = rank; lastRank = rank; }
    }
    boxes.forEach((b) => b.addEventListener("change", upd));
    const reset = $("[data-reset]");
    if (reset) reset.addEventListener("click", () => { boxes.forEach((b) => { b.checked = false; }); upd(); });
    upd();
  }

  /* ---------- тест «Найди подвох» ---------- */
  const qz = $("[data-quiz]");
  if (qz) {
    const Q = JSON.parse($("#quiz-data").textContent);
    const ui = {
      num: $("[data-q-num]", qz), score: $("[data-q-score]", qz), kind: $("[data-q-kind]", qz), text: $("[data-q-text]", qz),
      ans: $("[data-q-ans]", qz), ver: $("[data-q-verdict]", qz), vt: $("[data-q-vt]", qz), why: $("[data-q-why]", qz),
      next: $("[data-q-next]", qz), card: $("[data-q-card]", qz), res: $("[data-q-result]"), rs: $("[data-q-rs]"), rank: $("[data-q-rank]"), again: $("[data-q-again]"), errs: $("[data-q-errs]")
    };
    let i = 0, score = 0, picked = false, wrong = [];
    function show() {
      const q = Q[i];
      picked = false;
      ui.num.textContent = i + 1;
      ui.score.textContent = score;
      ui.kind.textContent = q.kind;
      ui.text.dataset.final = q.text;
      FX.decode(ui.text, 500);
      ui.ans.hidden = false;
      ui.ver.hidden = true;
    }
    function pick(trap) {
      if (picked) return;
      picked = true;
      const q = Q[i], ok = trap === q.trap;
      if (ok) score++; else { wrong.push(q); FX.glitch(ui.card); }
      ui.score.textContent = score;
      ui.ans.hidden = true;
      ui.ver.hidden = false;
      ui.ver.classList.toggle("bad", !ok);
      ui.ver.classList.toggle("good", ok);
      ui.vt.textContent = (ok ? "Верно. " : "Мимо. ") + (q.trap ? "Это подвох." : "Это безопасно.");
      ui.why.textContent = q.why;
      ui.next.textContent = i === Q.length - 1 ? "Показать результат" : "Следующий вопрос";
      ui.next.focus();
    }
    function result() {
      ui.card.hidden = true;
      ui.res.hidden = false;
      ui.rs.textContent = score + " из " + Q.length;
      const r = score === Q.length ? "параноик" : score >= Q.length * 0.75 ? "осторожный" : score >= Q.length * 0.45 ? "внимательный новичок" : "лёгкая добыча";
      ui.rank.dataset.final = r;
      FX.decode(ui.rank, 800);
      ui.errs.innerHTML = wrong.length ? wrong.map((q) => '<li><a href="' + esc(q.more) + '">' + esc(q.kind) + ": " + esc(q.short) + "</a></li>").join("") : "<li>Ошибок нет. Можно идти в Академию.</li>";
      store.set("quiz-best", Math.max(store.get("quiz-best", 0), score));
      ui.res.scrollIntoView({ behavior: FX.isCalm() ? "auto" : "smooth", block: "center" });
    }
    $("[data-q-safe]", qz).addEventListener("click", () => pick(false));
    $("[data-q-trap]", qz).addEventListener("click", () => pick(true));
    ui.next.addEventListener("click", () => { if (i < Q.length - 1) { i++; show(); } else result(); });
    ui.again.addEventListener("click", () => { i = 0; score = 0; wrong = []; ui.res.hidden = true; ui.card.hidden = false; show(); ui.card.scrollIntoView({ block: "center" }); });
    show();
  }

  /* ---------- вопросы в конце главы и прогресс Академии ---------- */
  const chap = document.body.dataset.chapter;
  $$(".cq").forEach((q) => {
    const right = Number(q.dataset.answer), res = $(".res", q);
    $$("input", q).forEach((inp, k) => inp.addEventListener("change", () => {
      const ok = k === right;
      res.hidden = false;
      res.innerHTML = (ok ? '<b>Верно.</b> ' : '<b class="red">Мимо.</b> ') + esc(q.dataset.why || "");
      if (!ok) FX.glitch(q);
      const answered = $$(".cq").filter((x) => !$(".res", x).hidden).length;
      if (chap && answered === $$(".cq").length) { const r = store.get("read", []); if (!r.includes(chap)) { r.push(chap); store.set("read", r); } }
    }));
  });
  if (chap) {
    const endMark = $("#sources");
    if (endMark) new IntersectionObserver((es) => { if (es[0].isIntersecting) { const r = store.get("read", []); if (!r.includes(chap)) { r.push(chap); store.set("read", r); } } }).observe(endMark);
  }
  const acad = $("[data-academy]");
  if (acad) {
    const r = store.get("read", []);
    $$("[data-ch]", acad).forEach((a) => { const m = $(".rd", a); if (r.includes(a.dataset.ch)) m.textContent = "[ ПРОЧИТАНО ]"; });
    const n = r.filter((x) => /^\d\d$/.test(x)).length;
    const m = $("[data-acad-meter] i"); if (m) m.style.width = Math.round((n / 12) * 100) + "%";
    const t = $("[data-acad-done]"); if (t) t.textContent = n;
  }

  /* ---------- словарь ---------- */
  const gl = $("[data-gloss]");
  if (gl) {
    const inp = $("#gl-search"), chips = $$("[data-g]", gl), cards = $$(".term-c"), cnt = $("[data-gl-count]");
    let group = "all";
    function filt() {
      const q = inp.value.trim().toLowerCase();
      let n = 0;
      cards.forEach((c) => {
        const ok = (group === "all" || c.dataset.group === group) && (!q || c.textContent.toLowerCase().includes(q));
        c.hidden = !ok;
        if (ok) n++;
      });
      cnt.textContent = n;
    }
    inp.addEventListener("input", filt);
    chips.forEach((b) => b.addEventListener("click", () => { group = b.dataset.g; chips.forEach((x) => x.setAttribute("aria-pressed", String(x === b))); filt(); }));
    if (location.hash && location.hash.length > 1) { const el = document.getElementById(location.hash.slice(1)); if (el) el.classList.add("hl"); }
    filt();
  }

  /* ---------- лаборатория: разбор ссылки ---------- */
  const SHORT = ["bit.ly", "clck.ru", "tinyurl.com", "t.co", "goo.su", "cutt.ly", "vk.cc", "is.gd", "ow.ly", "rb.gy", "shorturl.at", "u.to", "qps.ru"];
  const SL2 = ["com.ru", "net.ru", "org.ru", "pp.ru", "msk.ru", "spb.ru", "co.uk", "org.uk", "com.ua", "co.jp", "com.br", "com.au", "com.tr", "co.in", "com.cn"];
  const TRACK = /^(utm_|fbclid$|gclid$|yclid$|ysclid$|_openstat$|mc_cid$|mc_eid$|igshid$|si$|ref$|clickid$)/i;
  function analyzeUrl(raw) {
    raw = raw.trim();
    if (!raw) return null;
    let s = /^[a-z][a-z0-9+.-]*:\/\//i.test(raw) ? raw : "http://" + raw;
    let u;
    try { u = new URL(s); } catch (e) { return { error: "Это не похоже на адрес. Проверь, что скопировал ссылку целиком." }; }
    const rawHost = (s.split("//")[1] || "").split(/[\/?#]/)[0].split("@").pop().split(":")[0];
    const host = u.hostname.replace(/\.$/, "");
    const labels = host.split(".");
    const isIP = /^\d{1,3}(\.\d{1,3}){3}$/.test(host) || host.startsWith("[");
    let reg = host;
    if (!isIP && labels.length >= 2) {
      const l2 = labels.slice(-2).join(".");
      reg = SL2.includes(l2) && labels.length >= 3 ? labels.slice(-3).join(".") : l2;
    }
    const sub = host.length > reg.length ? host.slice(0, host.length - reg.length - 1) : "";
    const flags = [], ok = [];
    if (u.protocol === "http:" && /^https?:/i.test(raw)) flags.push("нет HTTPS: данные идут открытым текстом");
    else if (u.protocol === "https:") ok.push("есть HTTPS, но это значит только, что канал шифруется. Мошеннические сайты тоже бывают с HTTPS");
    if (isIP) flags.push("вместо имени сайта IP-адрес");
    if (u.username || /@/.test((s.split("//")[1] || "").split(/[\/?#]/)[0])) flags.push("в адресе есть «@»: всё, что слева от него, не адрес сайта");
    if (/xn--/.test(host)) flags.push("адрес с «xn--»: в нём буквы из другого алфавита, похожие на латинские");
    if (/[^\x00-\x7F]/.test(rawHost)) {
      const lat = /[a-z]/i.test(rawHost), cyr = /[а-яё]/i.test(rawHost);
      flags.push(lat && cyr ? "в адресе смешаны латиница и кириллица" : "в адресе не латинские буквы: проверь, нет ли подмены");
    }
    if (SHORT.includes(host)) flags.push("короткая ссылка: настоящий адрес спрятан");
    if (sub && /\.(ru|com|рф|net|org|su)(\.|$)/i.test(sub)) flags.push("в начале адреса стоит чужой домен для маскировки: " + sub);
    if (/(secure|login|verify|account|support|update|bonus|prize|gift|pay|check|confirm|vhod|oplata|podtverd)/i.test(host)) flags.push("слова-приманки в адресе: «безопасность», «вход», «оплата» и похожие");
    if (/[a-z][01][a-z]|rn/i.test(reg.split(".")[0]) && !isIP) flags.push("цифры или сочетания букв, похожие на другие буквы (0 и o, 1 и l, rn и m)");
    if (labels.length > 4) flags.push("очень длинная цепочка поддоменов");
    const tracks = [...u.searchParams.keys()].filter((k) => TRACK.test(k));
    if (tracks.length) flags.push("метки слежки: " + tracks.join(", ") + ". По ним отправитель узнаёт, кто и откуда кликнул");
    return { u, host, reg, sub, flags, ok, isIP };
  }
  const urlIn = $("#lab-url");
  if (urlIn) {
    const out = $("#lab-url-out"), tags = $("#lab-url-tags");
    function go() {
      const r = analyzeUrl(urlIn.value);
      if (!r) { out.innerHTML = '<span class="k">Вставь адрес и нажми «Разобрать».</span>'; tags.innerHTML = ""; return; }
      if (r.error) { out.innerHTML = '<span class="r">' + esc(r.error) + "</span>"; tags.innerHTML = ""; return; }
      out.innerHTML =
        '<div><span class="k">протокол ......... </span>' + esc(r.u.protocol.replace(":", "")) + "</div>" +
        (r.sub ? '<div><span class="k">поддомен ......... </span>' + esc(r.sub) + "</div>" : "") +
        '<div><span class="k">настоящий домен .. </span><span class="r">' + esc(r.reg) + "</span></div>" +
        (r.u.pathname && r.u.pathname !== "/" ? '<div><span class="k">путь ............. </span>' + esc(r.u.pathname) + "</div>" : "") +
        (r.u.search ? '<div><span class="k">параметры ........ </span>' + esc(r.u.search) + "</div>" : "");
      tags.innerHTML = r.flags.length
        ? r.flags.map((f) => '<span class="tag">' + esc(f) + "</span>").join("")
        : '<span class="tag ok">явных признаков подвоха нет. Это не гарантия: сравни настоящий домен с адресом, который знаешь сам</span>';
      if (r.ok.length) tags.innerHTML += r.ok.map((f) => '<span class="tag ok">' + esc(f) + "</span>").join("");
    }
    $("#lab-url-go").addEventListener("click", go);
    urlIn.addEventListener("keydown", (e) => { if (e.key === "Enter") go(); });
    $$("[data-try]").forEach((b) => b.addEventListener("click", () => { urlIn.value = b.dataset.try; go(); }));
  }

  /* ---------- лаборатория: стойкость пароля ---------- */
  const COMMON = ["123456", "password", "12345678", "qwerty", "123456789", "12345", "1234", "111111", "1234567", "123123", "qwerty123", "1q2w3e4r", "1q2w3e", "000000", "iloveyou", "1234567890", "qwertyuiop", "654321", "666666", "7777777", "zaq12wsx", "dragon", "monkey", "letmein", "football", "admin", "password1", "abc123", "йцукен", "пароль", "привет", "любовь", "q1w2e3r4", "asdfgh", "aa123456", "11111111", "121212", "555555", "qazwsx"];
  const pass = $("#lab-pass");
  if (pass) {
    const meter = $("#lab-pass-meter i"), out = $("#lab-pass-out");
    const human = (sec) => {
      if (sec < 1) return "меньше секунды";
      // формы: 1 год, 2 года, 5 лет, 1,5 года
      const u = [[["год", "года", "лет"], 31557600], [["день", "дня", "дней"], 86400], [["час", "часа", "часов"], 3600], [["минута", "минуты", "минут"], 60], [["секунда", "секунды", "секунд"], 1]];
      const form = (v, f) => {
        if (!Number.isInteger(v)) return f[1];
        const a = v % 100, b = v % 10;
        if (a >= 11 && a <= 14) return f[2];
        return b === 1 ? f[0] : b >= 2 && b <= 4 ? f[1] : f[2];
      };
      if (sec > 31557600 * 1e6) return "больше миллиона лет";
      for (const [f, s] of u) if (sec >= s) {
        let v = sec / s;
        v = v >= 10 ? Math.round(v) : Math.round(v * 10) / 10;
        return v.toLocaleString("ru-RU", { maximumFractionDigits: 1 }) + " " + form(v, f);
      }
      return "мгновенно";
    };
    pass.addEventListener("input", () => {
      const p = pass.value;
      if (!p) { meter.style.width = "0%"; out.innerHTML = '<span class="k">Введи пароль для проверки.</span>'; return; }
      let pool = 0;
      if (/[a-z]/.test(p)) pool += 26;
      if (/[A-Z]/.test(p)) pool += 26;
      if (/[0-9]/.test(p)) pool += 10;
      if (/[а-яё]/.test(p)) pool += 33;
      if (/[А-ЯЁ]/.test(p)) pool += 33;
      if (/[^a-zA-Z0-9а-яёА-ЯЁ]/.test(p)) pool += 33;
      let bits = p.length * Math.log2(Math.max(pool, 2));
      const why = [];
      const low = p.toLowerCase();
      if (COMMON.includes(low)) { bits = Math.min(bits, 8); why.push("он есть в списках самых популярных паролей, его пробуют первым"); }
      if (/(.)\1{2,}/.test(p)) { bits *= 0.75; why.push("повторы одного символа"); }
      if (/(0123|1234|2345|3456|4567|5678|6789|abcd|qwer|asdf|zxcv|йцук|фыва)/i.test(p)) { bits *= 0.7; why.push("последовательности с клавиатуры или по порядку"); }
      if (/(19|20)\d\d/.test(p)) { bits *= 0.9; why.push("похоже на год: часто это дата рождения, её легко найти"); }
      if (p.length < 10) why.push("короткий: длина важнее сложных символов");
      if (!why.length) why.push("длина и набор символов хорошие");
      const sec = Math.pow(2, bits) / 2 / 1e10;
      meter.style.width = Math.min(100, Math.round(bits)) + "%";
      out.innerHTML = '<div><span class="k">подберут примерно за .. </span><span class="' + (sec < 3e7 ? "r" : "ok") + '">' + human(sec) + "</span></div>" +
        '<div><span class="k">почему ............... </span>' + esc(why.join("; ")) + "</div>" +
        '<div class="k" style="margin-top:6px">Расчёт для перебора 10 миллиардов вариантов в секунду, если базу паролей украли.</div>';
    });
  }

  /* ---------- лаборатория: шифрование и хэш ---------- */
  const ptxt = $("#lab-text");
  if (ptxt) {
    const key = $("#lab-key"), cOut = $("#lab-cipher"), hOut = $("#lab-hash"), dOut = $("#lab-dec");
    const enc = new TextEncoder(), dec = new TextDecoder();
    const b64 = (u8) => btoa(String.fromCharCode(...u8));
    const ub64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
    const subtle = window.crypto && window.crypto.subtle;
    async function aesKey(pw, salt) {
      const base = await subtle.importKey("raw", enc.encode(pw), "PBKDF2", false, ["deriveKey"]);
      return subtle.deriveKey({ name: "PBKDF2", salt, iterations: 100000, hash: "SHA-256" }, base, { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]);
    }
    let tmr = 0;
    async function upd() {
      if (!subtle) { cOut.textContent = "Браузер не дал доступ к шифрованию на этой странице."; return; }
      const t = ptxt.value, k = key.value || " ";
      const h = new Uint8Array(await subtle.digest("SHA-256", enc.encode(t)));
      hOut.textContent = [...h].map((x) => x.toString(16).padStart(2, "0")).join("");
      const salt = crypto.getRandomValues(new Uint8Array(16)), iv = crypto.getRandomValues(new Uint8Array(12));
      const ak = await aesKey(k, salt);
      const ct = new Uint8Array(await subtle.encrypt({ name: "AES-GCM", iv }, ak, enc.encode(t)));
      const all = new Uint8Array(salt.length + iv.length + ct.length);
      all.set(salt); all.set(iv, 16); all.set(ct, 28);
      const packed = b64(all);
      cOut.dataset.final = packed;
      FX.decode(cOut, 400);
      const raw = ub64(packed), dk = await aesKey(k, raw.slice(0, 16));
      const pt = await subtle.decrypt({ name: "AES-GCM", iv: raw.slice(16, 28) }, dk, raw.slice(28));
      dOut.textContent = dec.decode(pt);
    }
    const sched = () => { clearTimeout(tmr); tmr = setTimeout(() => upd().catch(() => { cOut.textContent = "Не получилось зашифровать в этом браузере."; }), 250); };
    ptxt.addEventListener("input", sched);
    key.addEventListener("input", sched);
    sched();
  }

  /* ---------- лаборатория: метаданные фото ---------- */
  function readExif(buf) {
    const v = new DataView(buf);
    if (v.byteLength < 4 || v.getUint16(0) !== 0xffd8) return null;
    let off = 2;
    while (off + 4 < v.byteLength) {
      const mk = v.getUint16(off), len = v.getUint16(off + 2);
      if (mk === 0xffe1 && v.getUint32(off + 4) === 0x45786966) { return parseTiff(v, off + 10); }
      if ((mk & 0xff00) !== 0xff00) break;
      off += 2 + len;
    }
    return {};
  }
  function parseTiff(v, t) {
    const le = v.getUint16(t) === 0x4949;
    const u16 = (o) => v.getUint16(t + o, le), u32 = (o) => v.getUint32(t + o, le);
    const out = {};
    const SZ = { 1: 1, 2: 1, 3: 2, 4: 4, 5: 8, 7: 1, 9: 4, 10: 8 };
    function val(e) {
      const type = u16(e + 2), cnt = u32(e + 4), size = (SZ[type] || 1) * cnt;
      const p = size <= 4 ? e + 8 : u32(e + 8);
      if (type === 2) { let s = ""; for (let i = 0; i < cnt - 1 && t + p + i < v.byteLength; i++) s += String.fromCharCode(v.getUint8(t + p + i)); return s.trim(); }
      if (type === 3) return u16(p);
      if (type === 4) return u32(p);
      if (type === 5) { const a = []; for (let i = 0; i < cnt; i++) { const d = u32(p + i * 8 + 4); a.push(d ? u32(p + i * 8) / d : 0); } return a; }
      return null;
    }
    function ifd(o, map) {
      if (!o || t + o + 2 > v.byteLength) return;
      const n = u16(o);
      for (let i = 0; i < n; i++) {
        const e = o + 2 + i * 12;
        if (t + e + 12 > v.byteLength) return;
        const tag = u16(e);
        if (map[tag]) out[map[tag]] = val(e);
      }
    }
    const IFD0 = { 0x010f: "make", 0x0110: "model", 0x0131: "software", 0x0132: "date", 0x8769: "exif", 0x8825: "gps" };
    ifd(u32(4), IFD0);
    if (out.exif) ifd(out.exif, { 0x9003: "taken" });
    if (out.gps) ifd(out.gps, { 1: "latRef", 2: "lat", 3: "lonRef", 4: "lon" });
    return out;
  }
  const ph = $("#lab-photo");
  if (ph) {
    const drop = $("#lab-drop"), out = $("#lab-exif"), prev = $("#lab-prev"), cleanBtn = $("#lab-clean"), dl = $("#lab-dl");
    let curImg = null, curName = "photo";
    async function handle(f) {
      if (!f || !/^image\//.test(f.type)) { out.innerHTML = '<span class="r">Нужен файл картинки.</span>'; return; }
      curName = f.name.replace(/\.[^.]+$/, "");
      const buf = await f.arrayBuffer();
      const ex = readExif(buf);
      const rows = [];
      if (ex === null) rows.push('<div class="k">Это не JPEG. Метаданные такого формата этот инструмент не читает, но чистая копия всё равно без них.</div>');
      else {
        if (ex.lat && ex.lon && ex.lat.length === 3 && ex.lon.length === 3) {
          let la = ex.lat[0] + ex.lat[1] / 60 + ex.lat[2] / 3600, lo = ex.lon[0] + ex.lon[1] / 60 + ex.lon[2] / 3600;
          if (ex.latRef === "S") la = -la;
          if (ex.lonRef === "W") lo = -lo;
          rows.push('<div><span class="k">GPS ........ </span><span class="r">' + la.toFixed(5) + ", " + lo.toFixed(5) + '</span></div><div class="k">По этим цифрам место съёмки находится на любой карте с точностью до дома.</div>');
        } else rows.push('<div><span class="k">GPS ........ </span>нет</div>');
        rows.push('<div><span class="k">Телефон .... </span>' + esc([ex.make, ex.model].filter(Boolean).join(" ") || "нет") + "</div>");
        rows.push('<div><span class="k">Снято ...... </span>' + esc(ex.taken || ex.date || "нет") + "</div>");
        if (ex.software) rows.push('<div><span class="k">Программа .. </span>' + esc(ex.software) + "</div>");
      }
      out.innerHTML = rows.join("");
      const url = URL.createObjectURL(f);
      const img = new Image();
      img.onload = () => { curImg = img; prev.src = url; prev.hidden = false; cleanBtn.hidden = false; };
      img.src = url;
    }
    ph.addEventListener("change", () => handle(ph.files && ph.files[0]));
    ["dragenter", "dragover"].forEach((e) => drop.addEventListener(e, (ev) => { ev.preventDefault(); drop.classList.add("over"); }));
    ["dragleave", "drop"].forEach((e) => drop.addEventListener(e, (ev) => { ev.preventDefault(); drop.classList.remove("over"); }));
    drop.addEventListener("drop", (ev) => handle(ev.dataTransfer.files[0]));
    cleanBtn.addEventListener("click", () => {
      if (!curImg) return;
      const c = document.createElement("canvas");
      c.width = curImg.naturalWidth; c.height = curImg.naturalHeight;
      c.getContext("2d").drawImage(curImg, 0, 0);
      c.toBlob((b) => {
        if (!b) return;
        dl.href = URL.createObjectURL(b);
        dl.download = curName + "-bez-metadannyh.jpg";
        dl.hidden = false;
        dl.focus();
      }, "image/jpeg", 0.92);
    });
  }
})();
