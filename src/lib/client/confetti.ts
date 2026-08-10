// src/lib/client/confetti.ts

/**
 * Launches a high-performance particle physics confetti burst from the bottom of the screen.
 * Dependency-free, lightweight, and automatically cleans up after animation completes.
 */
export function triggerConfetti() {
  if (typeof window === "undefined" || typeof document === "undefined") return;

  const container = document.createElement("div");
  container.style.position = "fixed";
  container.style.inset = "0";
  container.style.pointerEvents = "none";
  container.style.zIndex = "9999";
  document.body.appendChild(container);

  const colors = ["#8B5CF6", "#EC4899", "#3B82F6", "#10B981", "#F59E0B"];
  const particleCount = 80;

  for (let i = 0; i < particleCount; i++) {
    const p = document.createElement("div");
    p.style.position = "absolute";
    p.style.width = `${Math.random() * 8 + 6}px`;
    p.style.height = `${Math.random() * 12 + 6}px`;
    p.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
    p.style.borderRadius = "2px";

    // Launch from center bottom of the viewport
    p.style.left = "50vw";
    p.style.top = "100vh";

    container.appendChild(p);

    // Launch angle: 45 to 135 degrees (arc directed upwards)
    const angle = (Math.random() * 90 + 45) * (Math.PI / 180);
    // Initial velocity
    const velocity = Math.random() * 22 + 12;
    const vx = Math.cos(angle) * velocity;
    const vy = -Math.sin(angle) * velocity;

    let x = 0;
    let y = 0;
    const gravity = 0.55;
    let currentVx = vx;
    let currentVy = vy;

    let frame = 0;
    const maxFrames = 75;

    const updatePhysics = () => {
      x += currentVx;
      y += currentVy;
      currentVy += gravity; // Gravity pull down
      currentVx *= 0.98; // Air resistance

      p.style.transform = `translate(${x}px, ${y}px) rotate(${frame * 15}deg)`;
      p.style.opacity = String(Math.max(0, 1 - frame / maxFrames));

      frame++;
      if (frame < maxFrames) {
        requestAnimationFrame(updatePhysics);
      }
    };

    requestAnimationFrame(updatePhysics);
  }

  setTimeout(() => {
    container.remove();
  }, 2500);
}
