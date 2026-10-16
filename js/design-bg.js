/* design-bg.js — 静态封面 → 动态 3D 展台 */
(function () {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function resolveBg() {
    // 主页背景只有一个最终资源，缺失时保留纯色+光效预览。
    return new Promise((resolve) => {
      const tryList = ["assets/home/background/home_background_v2.png"];
      let i = 0;
      const tryNext = () => {
        if (i >= tryList.length) {
          resolve(null);
          return;
        }
        const path = tryList[i++];
        const img = new Image();
        img.onload = () => resolve(path);
        img.onerror = tryNext;
        img.src = path;
      };
      tryNext();
    });
  }

  function spawnParticles(canvas) {
    if (!canvas || reduced) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let w, h, parts, raf;

    function size() {
      const r = canvas.getBoundingClientRect();
      w = canvas.width = Math.max(1, Math.floor(r.width));
      h = canvas.height = Math.max(1, Math.floor(r.height));
    }

    function make() {
      const n = 48;
      parts = Array.from({ length: n }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        r: 0.6 + Math.random() * 1.8,
        s: 0.15 + Math.random() * 0.45,
        a: 0.15 + Math.random() * 0.45,
        drift: (Math.random() - 0.5) * 0.25,
      }));
    }

    function tick() {
      ctx.clearRect(0, 0, w, h);
      for (const p of parts) {
        p.y -= p.s;
        p.x += p.drift;
        if (p.y < -4) {
          p.y = h + 4;
          p.x = Math.random() * w;
        }
        if (p.x < -4) p.x = w + 4;
        if (p.x > w + 4) p.x = -4;
        ctx.beginPath();
        ctx.fillStyle = `rgba(255, 214, 120, ${p.a})`;
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
      raf = requestAnimationFrame(tick);
    }

    size();
    make();
    tick();
    window.addEventListener("resize", () => {
      size();
      make();
    });
    return () => cancelAnimationFrame(raf);
  }

  function bindParallax(phone) {
    if (reduced) return;
    const inner = phone.querySelector(".parallax");
    if (!inner) return;
    phone.addEventListener("pointermove", (e) => {
      const r = phone.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      inner.style.transform = `translate(${px * -10}px, ${py * -8}px) scale(1.02)`;
    });
    phone.addEventListener("pointerleave", () => {
      inner.style.transform = "";
    });
  }

  resolveBg().then((url) => {
    if (!url) return;
    document.querySelectorAll(".bg3d").forEach((bg) => {
      bg.style.setProperty("--bgurl", `url("${url}")`);
      const img = bg.querySelector(".bg-img");
      if (img) img.style.backgroundImage = `url("${url}")`;
      spawnParticles(bg.querySelector("canvas"));
    });
    document.querySelectorAll(".phone").forEach(bindParallax);
  });
})();
