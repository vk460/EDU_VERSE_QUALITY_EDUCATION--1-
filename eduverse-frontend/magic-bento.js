/**
 * Vanilla JS MagicBento component.
 * Requires GSAP.
 */

class MagicBento {
  constructor(gridSelector, options = {}) {
    this.grid = document.querySelector(gridSelector);
    if (!gridSelector) return;

    this.options = {
      spotlightRadius: options.spotlightRadius || 300,
      glowColor: options.glowColor || '132, 0, 255',
      particleCount: options.particleCount || 12,
      enableStars: options.enableStars !== false,
      enableSpotlight: options.enableSpotlight !== false,
      enableTilt: options.enableTilt || false,
      clickEffect: options.clickEffect !== false,
      enableMagnetism: options.enableMagnetism !== false,
      ...options
    };

    this.isMobile = window.innerWidth <= 768;
    this.spotlight = null;
    this.particles = [];
    this.isHoveredMap = new Map();

    this.init();
  }

  createParticleElement(x, y, color) {
    const el = document.createElement('div');
    el.className = 'bento-particle';
    el.style.cssText = `
      position: absolute;
      width: 4px;
      height: 4px;
      border-radius: 50%;
      background: rgba(${color}, 1);
      box-shadow: 0 0 6px rgba(${color}, 0.6);
      pointer-events: none;
      z-index: 100;
      left: ${x}px;
      top: ${y}px;
    `;
    return el;
  }

  updateCardGlowProperties(card, mouseX, mouseY, intensity, radius) {
    const rect = card.getBoundingClientRect();
    const relativeX = ((mouseX - rect.left) / rect.width) * 100;
    const relativeY = ((mouseY - rect.top) / rect.height) * 100;

    card.style.setProperty('--glow-x', `${relativeX}%`);
    card.style.setProperty('--glow-y', `${relativeY}%`);
    card.style.setProperty('--glow-intensity', intensity.toString());
    card.style.setProperty('--glow-radius', `${radius}px`);
  }

  init() {
    if (this.options.enableSpotlight && !this.isMobile) {
      this.initSpotlight();
    }

    const cards = this.grid.querySelectorAll('.magic-bento-card-v');
    cards.forEach(card => this.initCard(card));
  }

  initSpotlight() {
    this.spotlight = document.createElement('div');
    this.spotlight.className = 'global-spotlight-v';
    this.spotlight.style.cssText = `
      position: fixed;
      width: 800px;
      height: 800px;
      border-radius: 50%;
      pointer-events: none;
      background: radial-gradient(circle,
        rgba(${this.options.glowColor}, 0.15) 0%,
        rgba(${this.options.glowColor}, 0.08) 15%,
        rgba(${this.options.glowColor}, 0.04) 25%,
        rgba(${this.options.glowColor}, 0.02) 40%,
        rgba(${this.options.glowColor}, 0.01) 65%,
        transparent 70%
      );
      z-index: 200;
      opacity: 0;
      transform: translate(-50%, -50%);
      mix-blend-mode: screen;
    `;
    document.body.appendChild(this.spotlight);

    document.addEventListener('mousemove', (e) => {
      const rect = this.grid.getBoundingClientRect();
      const mouseInside = e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom;

      if (!mouseInside) {
        gsap.to(this.spotlight, { opacity: 0, duration: 0.3 });
        this.grid.querySelectorAll('.magic-bento-card-v').forEach(c => c.style.setProperty('--glow-intensity', '0'));
        return;
      }

      const radius = this.options.spotlightRadius;
      const proximity = radius * 0.5;
      const fadeDistance = radius * 0.75;
      let minDistance = Infinity;

      const cards = this.grid.querySelectorAll('.magic-bento-card-v');
      cards.forEach(card => {
        const carRect = card.getBoundingClientRect();
        const centerX = carRect.left + carRect.width / 2;
        const centerY = carRect.top + carRect.height / 2;
        const distance = Math.hypot(e.clientX - centerX, e.clientY - centerY) - Math.max(carRect.width, carRect.height) / 2;
        const effectiveDistance = Math.max(0, distance);
        minDistance = Math.min(minDistance, effectiveDistance);

        let intensity = 0;
        if (effectiveDistance <= proximity) intensity = 1;
        else if (effectiveDistance <= fadeDistance) intensity = (fadeDistance - effectiveDistance) / (fadeDistance - proximity);

        this.updateCardGlowProperties(card, e.clientX, e.clientY, intensity, radius);
      });

      gsap.to(this.spotlight, { left: e.clientX, top: e.clientY, duration: 0.1 });
      const targetOpacity = minDistance <= proximity ? 0.8 : minDistance <= fadeDistance ? ((fadeDistance - minDistance) / (fadeDistance - proximity)) * 0.8 : 0;
      gsap.to(this.spotlight, { opacity: targetOpacity, duration: 0.2 });
    });
  }

  initCard(card) {
    if (this.options.enableStars && !this.isMobile) {
      card.addEventListener('mouseenter', () => {
        this.isHoveredMap.set(card, true);
        this.animateParticles(card);
      });
      card.addEventListener('mouseleave', () => {
        this.isHoveredMap.set(card, false);
        this.clearParticles(card);
      });
    }

    if (this.options.enableTilt && !this.isMobile) {
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const rX = ((y - centerY) / centerY) * -10;
        const rY = ((x - centerX) / centerX) * 10;
        gsap.to(card, { rotateX: rX, rotateY: rY, duration: 0.1, transformPerspective: 1000 });
      });
      card.addEventListener('mouseleave', () => {
        gsap.to(card, { rotateX: 0, rotateY: 0, duration: 0.3 });
      });
    }

    if (this.options.clickEffect) {
      card.addEventListener('click', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const maxD = Math.max(Math.hypot(x, y), Math.hypot(x - rect.width, y - rect.height));
        const ripple = document.createElement('div');
        ripple.style.cssText = `
          position: absolute;
          width: ${maxD * 2}px;
          height: ${maxD * 2}px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(${this.options.glowColor}, 0.4) 0%, transparent 70%);
          left: ${x - maxD}px;
          top: ${y - maxD}px;
          pointer-events: none;
          z-index: 1000;
        `;
        card.appendChild(ripple);
        gsap.fromTo(ripple, { scale: 0, opacity: 1 }, { scale: 1, opacity: 0, duration: 0.8, onComplete: () => ripple.remove() });
      });
    }
  }

  animateParticles(card) {
    const { width, height } = card.getBoundingClientRect();
    for (let i = 0; i < this.options.particleCount; i++) {
      setTimeout(() => {
        if (!this.isHoveredMap.get(card)) return;
        const p = this.createParticleElement(Math.random() * width, Math.random() * height, this.options.glowColor);
        card.appendChild(p);
        gsap.fromTo(p, { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.3 });
        gsap.to(p, {
          x: (Math.random() - 0.5) * 100,
          y: (Math.random() - 0.5) * 100,
          opacity: 0.3,
          duration: 2 + Math.random() * 2,
          repeat: -1,
          yoyo: true
        });
      }, i * 100);
    }
  }

  clearParticles(card) {
    card.querySelectorAll('.bento-particle').forEach(p => {
        gsap.to(p, { opacity: 0, scale: 0, duration: 0.3, onComplete: () => p.remove() });
    });
  }
}

window.MagicBento = MagicBento;
