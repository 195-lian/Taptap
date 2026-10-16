/* cover.js — 封面页交互（无玩法逻辑） */
(function () {
  const ASSETS = {
    bg: [
      "assets/bg_cover.jpg",
      "assets/bg_home_user.jpg",
      "assets/bg_home.jpg",
    ],
    egg: ["assets/cover_egg.png", "assets/web/icon_egg_full.webp"],
    logo: ["assets/cover_logo.png"],
  };

  const cover = document.getElementById("screen-cover");
  const home = document.getElementById("screen-home");
  const stage = document.getElementById("stage3d");
  const parallax = document.getElementById("parallax-wrap");
  const eggStage = document.getElementById("egg-stage");
  const eggBody = document.getElementById("egg-body");
  const logoTitle = document.getElementById("logo-title");
  const logoImg = document.getElementById("logo-img");
  const eggImg = document.getElementById("egg-img");
  const btnStart = document.getElementById("btn-start");
  const loadFill = document.getElementById("load-fill");
  const loadText = document.getElementById("load-text");
  const flash = document.getElementById("flash");
  const canvas = document.getElementById("cover-particles");
  const soundBtn = document.getElementById("sound-btn");
  const homeCta = document.getElementById("home-cta");
  const homeToast = document.getElementById("home-toast");
  const versionEl = document.getElementById("version");

  let soundOn = true;
  let entered = false;
  let progress = 0;

  function tryImage(paths) {
    return new Promise((resolve) => {
      let i = 0;
      const next = () => {
        if (i >= paths.length) {
          resolve(null);
          return;
        }
        const src = paths[i++];
        const img = new Image();
        img.onload = () => resolve(src);
        img.onerror = next;
        img.src = src;
      };
      next();
    });
  }

  function setProgress(p, label) {
    progress = Math.max(progress, Math.min(100, p));
    if (loadFill) loadFill.style.width = progress + "%";
    if (loadText) loadText.textContent = label || ("加载中 " + Math.round(progress) + "%");
  }

  function spawnParticles() {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!canvas || reduced) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let w, h, parts;

    function size() {
      const r = canvas.getBoundingClientRect();
      w = canvas.width = Math.max(1, Math.floor(r.width));
      h = canvas.height = Math.max(1, Math.floor(r.height));
    }
    function make() {
      parts = Array.from({ length: 42 }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        r: 0.6 + Math.random() * 1.6,
        s: 0.2 + Math.random() * 0.5,
        a: 0.15 + Math.random() * 0.4,
        d: (Math.random() - 0.5) * 0.2,
      }));
    }
    function tick() {
      ctx.clearRect(0, 0, w, h);
      for (const p of parts) {
        p.y -= p.s;
        p.x += p.d;
        if (p.y < -4) {
          p.y = h + 4;
          p.x = Math.random() * w;
        }
        ctx.beginPath();
        ctx.fillStyle = "rgba(255,214,120," + p.a + ")";
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
      requestAnimationFrame(tick);
    }
    size();
    make();
    tick();
    window.addEventListener("resize", () => {
      size();
      make();
    });
  }

  function bindParallax() {
    if (!parallax || !cover) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    cover.addEventListener("pointermove", (e) => {
      const r = cover.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      parallax.style.transform =
        "translate(" + px * -12 + "px," + py * -10 + "px) rotateY(" + px * 6 + "deg) rotateX(" + -py * 4 + "deg)";
      if (stage) stage.style.transform = "translate(" + px * 6 + "px," + py * 4 + "px) scale(1.02)";
    });
    cover.addEventListener("pointerleave", () => {
      parallax.style.transform = "";
      if (stage) stage.style.transform = "";
    });
  }

  function enterHome() {
    if (entered) return;
    entered = true;
    if (btnStart) btnStart.disabled = true;
    if (eggStage) eggStage.classList.add("punch");
    if (flash) {
      flash.classList.remove("on");
      void flash.offsetWidth;
      flash.classList.add("on");
    }
    setTimeout(() => {
      if (cover) {
        cover.classList.add("leave");
        setTimeout(() => {
          cover.style.display = "none";
          if (home) home.classList.add("active");
        }, 400);
      } else if (home) {
        home.classList.add("active");
      }
    }, 280);
  }

  function showToast(msg) {
    if (!homeToast) return;
    homeToast.textContent = msg;
    homeToast.classList.add("show");
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => homeToast.classList.remove("show"), 1600);
  }

  async function boot() {
    if (versionEl) versionEl.textContent = "v0.1.0 · 交互预览";
    setProgress(12, "加载舞台…");
    spawnParticles();

    const bgSrc = await tryImage(ASSETS.bg);
    setProgress(40, "加载主视觉…");
    if (bgSrc && stage) stage.style.setProperty("--cover-bg", 'url("' + bgSrc + '")');
    else {
      const bgEl = stage && stage.querySelector(".bg");
      if (bgEl) bgEl.classList.add("fallback");
    }

    const eggSrc = await tryImage(ASSETS.egg);
    setProgress(65, "加载标题…");
    if (eggSrc && eggImg) {
      eggImg.src = eggSrc;
      eggImg.style.display = "block";
    }

    const logoSrc = await tryImage(ASSETS.logo);
    setProgress(88, "就绪");
    if (logoSrc && logoImg && logoTitle) {
      logoImg.src = logoSrc;
      logoImg.style.display = "block";
      logoTitle.style.display = "none";
    }

    await new Promise((r) => setTimeout(r, 400));
    setProgress(100, "点按开始");
    if (btnStart) btnStart.disabled = false;
  }

  if (btnStart) btnStart.addEventListener("click", enterHome);
  if (eggStage) eggStage.addEventListener("click", enterHome);
  if (cover) cover.addEventListener("click", (e) => {
    if (e.target === cover || e.target.classList.contains("stage3d")) enterHome();
  });

  if (soundBtn) {
    soundBtn.addEventListener("click", () => {
      soundOn = !soundOn;
      soundBtn.textContent = soundOn ? "♪ 开" : "♪ 关";
      showToast(soundOn ? "音效开" : "音效关");
    });
  }

  if (homeCta) {
    homeCta.addEventListener("click", () => {
      showToast("主页交互占位 · 逻辑后置");
    });
  }
  document.querySelectorAll(".home-tile").forEach((el) => {
    el.addEventListener("click", () => {
      const n = el.getAttribute("data-name") || el.textContent.trim();
      showToast("入口：" + n + " · 逻辑后置");
    });
  });

  bindParallax();
  boot();
})();
