/**
 * Vanilla JS BorderGlow component.
 * Usage: new VanillaBorderGlow(element, options);
 */

class VanillaBorderGlow {
  constructor(el, options = {}) {
    this.el = el;
    this.options = {
      edgeSensitivity: options.edgeSensitivity || 30,
      glowColor: options.glowColor || '40 80 80',
      backgroundColor: options.backgroundColor || '#060010',
      borderRadius: options.borderRadius || 28,
      glowRadius: options.glowRadius || 40,
      glowIntensity: options.glowIntensity || 1.0,
      coneSpread: options.coneSpread || 25,
      animated: options.animated || false,
      colors: options.colors || ['#c084fc', '#f472b6', '#38bdf8'],
      fillOpacity: options.fillOpacity || 0.5,
      ...options
    };

    this.init();
  }

  parseHSL(hslStr) {
    const match = hslStr.match(/([\d.]+)\s*([\d.]+)%?\s*([\d.]+)%?/);
    if (!match) return { h: 40, s: 80, l: 80 };
    return { h: parseFloat(match[1]), s: parseFloat(match[2]), l: parseFloat(match[3]) };
  }

  buildGlowVars(glowColor, intensity) {
    const { h, s, l } = this.parseHSL(glowColor);
    const base = `${h}deg ${s}% ${l}%`;
    const opacities = [100, 60, 50, 40, 30, 20, 10];
    const keys = ['', '-60', '-50', '-40', '-30', '-20', '-10'];
    const vars = {};
    for (let i = 0; i < opacities.length; i++) {
      vars[`--glow-color${keys[i]}`] = `hsl(${base} / ${Math.min(opacities[i] * intensity, 100)}%)`;
    }
    return vars;
  }

  buildGradientVars(colors) {
    const positions = ['80% 55%', '69% 34%', '8% 6%', '41% 38%', '86% 85%', '82% 18%', '51% 4%'];
    const keys = ['--gradient-one', '--gradient-two', '--gradient-three', '--gradient-four', '--gradient-five', '--gradient-six', '--gradient-seven'];
    const colorMap = [0, 1, 2, 0, 1, 2, 1];
    const vars = {};
    for (let i = 0; i < 7; i++) {
        const c = colors[Math.min(colorMap[i], colors.length - 1)];
        vars[keys[i]] = `radial-gradient(at ${positions[i]}, ${c} 0px, transparent 50%)`;
    }
    vars['--gradient-base'] = `linear-gradient(${colors[0]} 0 100%)`;
    return vars;
  }

  getCenterOfElement(el) {
    const { width, height } = el.getBoundingClientRect();
    return [width / 2, height / 2];
  }

  getEdgeProximity(el, x, y) {
    const [cx, cy] = this.getCenterOfElement(el);
    const dx = x - cx;
    const dy = y - cy;
    let kx = Infinity;
    let ky = Infinity;
    if (dx !== 0) kx = cx / Math.abs(dx);
    if (dy !== 0) ky = cy / Math.abs(dy);
    return Math.min(Math.max(1 / Math.min(kx, ky), 0), 1);
  }

  getCursorAngle(el, x, y) {
    const [cx, cy] = this.getCenterOfElement(el);
    const dx = x - cx;
    const dy = y - cy;
    if (dx === 0 && dy === 0) return 0;
    const radians = Math.atan2(dy, dx);
    let degrees = radians * (180 / Math.PI) + 90;
    if (degrees < 0) degrees += 360;
    return degrees;
  }

  init() {
    this.el.classList.add('border-glow-card-v');
    
    // Set variables
    const glowVars = this.buildGlowVars(this.options.glowColor, this.options.glowIntensity);
    const gradientVars = this.buildGradientVars(this.options.colors);
    
    const allVars = {
        '--card-bg': this.options.backgroundColor,
        '--edge-sensitivity': this.options.edgeSensitivity,
        '--border-radius': `${this.options.borderRadius}px`,
        '--glow-padding': `${this.options.glowRadius}px`,
        '--cone-spread': this.options.coneSpread,
        '--fill-opacity': this.options.fillOpacity,
        ...glowVars,
        ...gradientVars
    };

    for (const [key, val] of Object.entries(allVars)) {
        this.el.style.setProperty(key, val);
    }

    // Add necessary DOM
    const edgeLight = document.createElement('span');
    edgeLight.className = 'edge-light-v';
    this.el.prepend(edgeLight);

    // Add pointer events
    this.el.addEventListener('pointermove', (e) => {
        const rect = this.el.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const edge = this.getEdgeProximity(this.el, x, y);
        const angle = this.getCursorAngle(this.el, x, y);

        this.el.style.setProperty('--edge-proximity', `${(edge * 100).toFixed(3)}`);
        this.el.style.setProperty('--cursor-angle', `${angle.toFixed(3)}deg`);
    });

    if (this.options.animated) {
        this.runSweep();
    }
  }

  runSweep() {
      // Simplified vanilla sweep without complex animation framework for now
      this.el.classList.add('sweep-active');
      this.el.style.setProperty('--edge-proximity', '100');
      let angle = 110;
      const step = () => {
          angle += 2;
          this.el.style.setProperty('--cursor-angle', `${angle}deg`);
          if (angle < 465) {
              requestAnimationFrame(step);
          } else {
              this.el.classList.remove('sweep-active');
              this.el.style.setProperty('--edge-proximity', '0');
          }
      };
      requestAnimationFrame(step);
  }
}

window.VanillaBorderGlow = VanillaBorderGlow;

// Auto-init
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('[data-border-glow]').forEach(el => {
        const options = {
            glowColor: el.getAttribute('data-bg-glow') || '40 80 80',
            colors: (el.getAttribute('data-bg-colors') || '').split(',').filter(Boolean) || undefined,
            animated: el.hasAttribute('data-bg-animated')
        };
        new VanillaBorderGlow(el, options);
    });
});
