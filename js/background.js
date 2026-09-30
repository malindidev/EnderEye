const PARTICLE_COLORS = ["181,108,255", "220,188,255", "232,121,249", "52,213,195"];

function createParticle(width, height, spawnAtBottom) {
  return {
    x: Math.random() * width,
    y: spawnAtBottom ? height + Math.random() * 40 : Math.random() * height,
    size: Math.random() < 0.25 ? 4 : Math.random() < 0.6 ? 3 : 2,
    speed: 0.15 + Math.random() * 0.45,
    sway: Math.random() * Math.PI * 2,
    swaySpeed: 0.004 + Math.random() * 0.01,
    swayRange: 0.2 + Math.random() * 0.5,
    alpha: 0.15 + Math.random() * 0.5,
    color: PARTICLE_COLORS[Math.floor(Math.random() * PARTICLE_COLORS.length)]
  };
}

export function initBackground(canvas) {
  if (!canvas || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const ctx = canvas.getContext("2d");
  let width = 0;
  let height = 0;
  let particles = [];
  let frame = 0;

  const resize = () => {
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width * ratio;
    canvas.height = height * ratio;
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);

    const target = Math.min(90, Math.round((width * height) / 18000));
    particles = Array.from({ length: target }, () => createParticle(width, height, false));
  };

  const tick = () => {
    ctx.clearRect(0, 0, width, height);

    particles.forEach((p, index) => {
      p.y -= p.speed;
      p.sway += p.swaySpeed;
      p.x += Math.sin(p.sway) * p.swayRange;

      if (p.y < -10) {
        particles[index] = createParticle(width, height, true);
        return;
      }

      const fade = Math.min(1, p.y / (height * 0.25));
      ctx.fillStyle = `rgba(${p.color},${(p.alpha * fade).toFixed(3)})`;
      ctx.fillRect(Math.round(p.x), Math.round(p.y), p.size, p.size);
    });

    frame = requestAnimationFrame(tick);
  };

  const start = () => {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(tick);
  };

  resize();
  start();

  window.addEventListener("resize", resize);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) cancelAnimationFrame(frame);
    else start();
  });
}
