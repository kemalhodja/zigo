/**
 * Light-weight Canvas Confetti Burst Engine for Quiz Celebrations & XP Rewards
 */

export function triggerCelebrationConfetti() {
  if (typeof window === "undefined") return;

  const canvas = document.createElement("canvas");
  canvas.style.position = "fixed";
  canvas.style.top = "0";
  canvas.style.left = "0";
  canvas.style.width = "100vw";
  canvas.style.height = "100vh";
  canvas.style.pointerEvents = "none";
  canvas.style.zIndex = "99999";
  document.body.appendChild(canvas);

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    canvas.remove();
    return;
  }

  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const particles: Array<{
    x: number;
    y: number;
    size: number;
    color: string;
    vx: number;
    vy: number;
    alpha: number;
    rotation: number;
    vRot: number;
  }> = [];

  const colors = ["#F59E0B", "#10B981", "#6366F1", "#EC4899", "#8B5CF6", "#3B82F6"];

  for (let i = 0; i < 70; i++) {
    particles.push({
      x: canvas.width / 2 + (Math.random() * 200 - 100),
      y: canvas.height / 2 + (Math.random() * 100 - 50),
      size: Math.random() * 8 + 4,
      color: colors[Math.floor(Math.random() * colors.length)]!,
      vx: (Math.random() - 0.5) * 12,
      vy: Math.random() * -12 - 4,
      alpha: 1,
      rotation: Math.random() * Math.PI * 2,
      vRot: (Math.random() - 0.5) * 0.2,
    });
  }

  let animationFrameId: number;

  function render() {
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    let activeParticles = 0;

    for (const p of particles) {
      if (p.alpha <= 0) continue;

      activeParticles++;
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.3; // Gravity
      p.alpha -= 0.015; // Fade
      p.rotation += p.vRot;

      ctx.save();
      ctx.globalAlpha = Math.max(0, p.alpha);
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
      ctx.restore();
    }

    if (activeParticles > 0) {
      animationFrameId = requestAnimationFrame(render);
    } else {
      cancelAnimationFrame(animationFrameId);
      canvas.remove();
    }
  }

  render();
}
