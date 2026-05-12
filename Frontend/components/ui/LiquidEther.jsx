import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import './LiquidEther.css';

export default function LiquidEther({
  mouseForce = 20,
  cursorSize = 100,
  isViscous = false,
  viscous = 30,
  iterationsViscous = 32,
  iterationsPoisson = 32,
  dt = 0.014,
  BFECC = true,
  resolution = 0.5,
  isBounce = false,
  colors = ['#00E5FF', '#dd8bfb', '#060010'],
  style = {},
  className = '',
  autoDemo = true,
  autoSpeed = 0.5,
  autoIntensity = 2.2,
  takeoverDuration = 0.25,
  autoResumeDelay = 1000,
  autoRampDuration = 0.6
}) {
  const mountRef = useRef(null);
  const webglRef = useRef(null);
  const resizeObserverRef = useRef(null);
  const rafRef = useRef(null);
  const intersectionObserverRef = useRef(null);
  const isVisibleRef = useRef(true);
  const resizeRafRef = useRef(null);

  useEffect(() => {
    if (!mountRef.current) return;
    console.log("LiquidEther: Initializing full shader simulation...");

    function makePaletteTexture(stops) {
      let arr = (Array.isArray(stops) && stops.length > 0) ? (stops.length === 1 ? [stops[0], stops[0]] : stops) : ['#ffffff', '#ffffff'];
      const w = arr.length;
      const data = new Uint8Array(w * 4);
      for (let i = 0; i < w; i++) {
        const c = new THREE.Color(arr[i]);
        data[i * 4 + 0] = Math.round(c.r * 255);
        data[i * 4 + 1] = Math.round(c.g * 255);
        data[i * 4 + 2] = Math.round(c.b * 255);
        data[i * 4 + 3] = 255;
      }
      const tex = new THREE.DataTexture(data, w, 1, THREE.RGBAFormat);
      tex.magFilter = THREE.LinearFilter;
      tex.minFilter = THREE.LinearFilter;
      tex.wrapS = THREE.ClampToEdgeWrapping;
      tex.wrapT = THREE.ClampToEdgeWrapping;
      tex.generateMipmaps = false;
      tex.needsUpdate = true;
      return tex;
    }

    const paletteTex = makePaletteTexture(colors);
    const bgVec4 = new THREE.Vector4(0, 0, 0, 0);

    class CommonClass {
      constructor() { this.width = 0; this.height = 0; this.aspect = 1; this.pixelRatio = 1; this.renderer = null; this.clock = null; this.time = 0; this.delta = 0; }
      init(container) {
        this.container = container;
        this.pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
        this.resize();
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.autoClear = false;
        this.renderer.setClearColor(0x000000, 0);
        this.renderer.setPixelRatio(this.pixelRatio);
        this.renderer.setSize(this.width, this.height);
        this.clock = new THREE.Clock();
        this.clock.start();
      }
      resize() {
        if (!this.container) return;
        const rect = this.container.getBoundingClientRect();
        this.width = Math.max(1, Math.floor(rect.width));
        this.height = Math.max(1, Math.floor(rect.height));
        this.aspect = this.width / this.height;
        if (this.renderer) this.renderer.setSize(this.width, this.height, false);
      }
      update() { this.delta = this.clock.getDelta(); this.time += this.delta; }
    }
    const Common = new CommonClass();

    class MouseClass {
      constructor() {
        this.mouseMoved = false; this.coords = new THREE.Vector2(); this.coords_old = new THREE.Vector2(); this.diff = new THREE.Vector2();
        this.isHoverInside = false; this.hasUserControl = false; this.isAutoActive = false; this.autoIntensity = 2.0;
        this._onMouseMove = (e) => this.onMove(e.clientX, e.clientY);
        this._onTouchMove = (e) => e.touches[0] && this.onMove(e.touches[0].clientX, e.touches[0].clientY);
      }
      init(container) {
        this.container = container;
        window.addEventListener('mousemove', this._onMouseMove);
        window.addEventListener('touchmove', this._onTouchMove, { passive: true });
      }
      dispose() { window.removeEventListener('mousemove', this._onMouseMove); window.removeEventListener('touchmove', this._onTouchMove); }
      onMove(x, y) {
        if (!this.container) return;
        const rect = this.container.getBoundingClientRect();
        this.isHoverInside = x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
        if (!this.isHoverInside) return;
        this.coords.set((x - rect.left) / rect.width * 2 - 1, -((y - rect.top) / rect.height * 2 - 1));
        this.mouseMoved = true; this.hasUserControl = true;
      }
      update() { this.diff.subVectors(this.coords, this.coords_old); this.coords_old.copy(this.coords); }
    }
    const Mouse = new MouseClass();

    // Shaders (Full implementation)
    const face_vert = `attribute vec3 position; uniform vec2 px; uniform vec2 boundarySpace; varying vec2 uv; void main(){ vec3 pos=position; vec2 scale=1.0-boundarySpace*2.0; pos.xy*=scale; uv=vec2(0.5)+pos.xy*0.5; gl_Position=vec4(pos,1.0); }`;
    const mouse_vert = `precision highp float; attribute vec3 position; attribute vec2 uv; uniform vec2 center; uniform vec2 scale; uniform vec2 px; varying vec2 vUv; void main(){ vec2 pos=position.xy*scale*2.0*px+center; vUv=uv; gl_Position=vec4(pos,0.0,1.0); }`;
    const advection_frag = `precision highp float; uniform sampler2D velocity; uniform float dt; uniform bool isBFECC; uniform vec2 fboSize; uniform vec2 px; varying vec2 uv; void main(){ vec2 ratio=max(fboSize.x,fboSize.y)/fboSize; if(!isBFECC){ vec2 vel=texture2D(velocity,uv).xy; gl_FragColor=vec4(texture2D(velocity,uv-vel*dt*ratio).xy,0.0,0.0); } else { vec2 spot_new=uv; vec2 vel_old=texture2D(velocity,uv).xy; vec2 spot_old=spot_new-vel_old*dt*ratio; vec2 vel_new1=texture2D(velocity,spot_old).xy; vec2 spot_new2=spot_old+vel_new1*dt*ratio; vec2 error=spot_new2-spot_new; vec2 spot_new3=spot_new-error/2.0; vec2 vel_2=texture2D(velocity,spot_new3).xy; gl_FragColor=vec4(texture2D(velocity,spot_new3-vel_2*dt*ratio).xy,0.0,0.0); } }`;
    const color_frag = `precision highp float; uniform sampler2D velocity; uniform sampler2D palette; uniform vec4 bgColor; varying vec2 uv; void main(){ vec2 vel=texture2D(velocity,uv).xy; float lenv=clamp(length(vel)*3.0,0.0,1.0); vec3 c=texture2D(palette,vec2(lenv,0.5)).rgb; gl_FragColor=vec4(mix(bgColor.rgb,c,lenv),mix(bgColor.a,1.0,lenv)); }`;
    const divergence_frag = `precision highp float; uniform sampler2D velocity; uniform float dt; uniform vec2 px; varying vec2 uv; void main(){ float x0=texture2D(velocity,uv-vec2(px.x,0.0)).x; float x1=texture2D(velocity,uv+vec2(px.x,0.0)).x; float y0=texture2D(velocity,uv-vec2(0.0,px.y)).y; float y1=texture2D(velocity,uv+vec2(0.0,px.y)).y; gl_FragColor=vec4((x1-x0+y1-y0)/2.0/dt); }`;
    const externalForce_frag = `precision highp float; uniform vec2 force; varying vec2 vUv; void main(){ float d=1.0-min(length((vUv-0.5)*2.0),1.0); gl_FragColor=vec4(force*d*d*3.0,0.0,1.0); }`;
    const poisson_frag = `precision highp float; uniform sampler2D pressure; uniform sampler2D divergence; uniform vec2 px; varying vec2 uv; void main(){ float p0=texture2D(pressure,uv+vec2(px.x*2.0,0.0)).r; float p1=texture2D(pressure,uv-vec2(px.x*2.0,0.0)).r; float p2=texture2D(pressure,uv+vec2(0.0,px.y*2.0)).r; float p3=texture2D(pressure,uv-vec2(0.0,px.y*2.0)).r; float div=texture2D(divergence,uv).r; gl_FragColor=vec4((p0+p1+p2+p3)/4.0-div); }`;
    const pressure_frag = `precision highp float; uniform sampler2D pressure; uniform sampler2D velocity; uniform vec2 px; uniform float dt; varying vec2 uv; void main(){ float p0=texture2D(pressure,uv+vec2(px.x,0.0)).r; float p1=texture2D(pressure,uv-vec2(px.x,0.0)).r; float p2=texture2D(pressure,uv+vec2(0.0,px.y)).r; float p3=texture2D(pressure,uv-vec2(0.0,px.y)).r; vec2 v=texture2D(velocity,uv).xy; gl_FragColor=vec4(v-vec2(p0-p1,p2-p3)*0.5*dt,0.0,1.0); }`;

    class ShaderPass {
      constructor(props) { this.props = props; this.uniforms = props.material?.uniforms; }
      init() {
        this.scene = new THREE.Scene(); this.camera = new THREE.Camera();
        if (this.uniforms) {
          this.material = new THREE.RawShaderMaterial(this.props.material);
          this.scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.material));
        }
      }
      update() { Common.renderer.setRenderTarget(this.props.output || null); Common.renderer.render(this.scene, this.camera); Common.renderer.setRenderTarget(null); }
    }

    class Advection extends ShaderPass {
      constructor(simProps) { super({ material: { vertexShader: face_vert, fragmentShader: advection_frag, uniforms: { boundarySpace: { value: simProps.cellScale }, px: { value: simProps.cellScale }, fboSize: { value: simProps.fboSize }, velocity: { value: simProps.src.texture }, dt: { value: simProps.dt }, isBFECC: { value: true } } }, output: simProps.dst }); this.init(); }
      update({ dt }) { this.uniforms.dt.value = dt; super.update(); }
    }

    class ExternalForce extends ShaderPass {
      constructor(simProps) { super({ output: simProps.dst }); this.init(simProps); }
      init(simProps) {
        super.init();
        this.mouse = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.RawShaderMaterial({ vertexShader: mouse_vert, fragmentShader: externalForce_frag, blending: THREE.AdditiveBlending, depthWrite: false, uniforms: { px: { value: simProps.cellScale }, force: { value: new THREE.Vector2() }, center: { value: new THREE.Vector2() }, scale: { value: new THREE.Vector2(simProps.cursor_size, simProps.cursor_size) } } }));
        this.scene.add(this.mouse);
      }
      update(props) {
        const u = this.mouse.material.uniforms;
        u.force.value.set((Mouse.diff.x / 2) * props.mouse_force, (Mouse.diff.y / 2) * props.mouse_force);
        u.center.value.set(Mouse.coords.x, Mouse.coords.y);
        u.scale.value.set(props.cursor_size, props.cursor_size);
        super.update();
      }
    }

    class Simulation {
      constructor(options) {
        this.options = { resolution: 0.5, dt: 0.014, mouse_force: 25, cursor_size: 100, iterations_poisson: 32, ...options };
        this.fboSize = new THREE.Vector2(); this.cellScale = new THREE.Vector2(); this.fbos = {}; this.init();
      }
      init() {
        this.calcSize();
        const type = /(iPad|iPhone|iPod)/i.test(navigator.userAgent) ? THREE.HalfFloatType : THREE.FloatType;
        const opts = { type, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter };
        ['v0', 'v1', 'div', 'p0', 'p1'].forEach(k => this.fbos[k] = new THREE.WebGLRenderTarget(this.fboSize.x, this.fboSize.y, opts));
        this.advection = new Advection({ cellScale: this.cellScale, fboSize: this.fboSize, dt: this.options.dt, src: this.fbos.v0, dst: this.fbos.v1 });
        this.externalForce = new ExternalForce({ cellScale: this.cellScale, cursor_size: this.options.cursor_size, dst: this.fbos.v1 });
        this.divergence = new Divergence({ cellScale: this.cellScale, src: this.fbos.v1, dst: this.fbos.div, dt: this.options.dt });
        this.poisson = new Poisson({ cellScale: this.cellScale, src: this.fbos.div, dst: this.fbos.p1, dst_: this.fbos.p0 });
        this.pressure = new Pressure({ cellScale: this.cellScale, src_p: this.fbos.p0, src_v: this.fbos.v1, dst: this.fbos.v0, dt: this.options.dt });
      }
      calcSize() {
        const w = Math.max(1, Math.round(this.options.resolution * Common.width));
        const h = Math.max(1, Math.round(this.options.resolution * Common.height));
        this.fboSize.set(w, h); this.cellScale.set(1 / w, 1 / h);
      }
      update() {
        this.advection.update({ dt: this.options.dt });
        this.externalForce.update({ cursor_size: this.options.cursor_size, mouse_force: this.options.mouse_force });
        this.divergence.update({ vel: this.fbos.v1 });
        const p = this.poisson.update({ iterations: this.options.iterations_poisson });
        this.pressure.update({ vel: this.fbos.v1, pressure: p });
      }
    }

    class Divergence extends ShaderPass {
      constructor(simProps) { super({ material: { vertexShader: face_vert, fragmentShader: divergence_frag, uniforms: { boundarySpace: { value: simProps.cellScale }, velocity: { value: simProps.src.texture }, px: { value: simProps.cellScale }, dt: { value: simProps.dt } } }, output: simProps.dst }); this.init(); }
      update({ vel }) { this.uniforms.velocity.value = vel.texture; super.update(); }
    }

    class Poisson extends ShaderPass {
      constructor(simProps) { super({ material: { vertexShader: face_vert, fragmentShader: poisson_frag, uniforms: { boundarySpace: { value: simProps.cellScale }, pressure: { value: simProps.dst_.texture }, divergence: { value: simProps.src.texture }, px: { value: simProps.cellScale } } }, output: simProps.dst, output0: simProps.dst_, output1: simProps.dst }); this.init(); }
      update({ iterations }) {
        let p_in, p_out;
        for (let i = 0; i < iterations; i++) {
          p_in = i % 2 === 0 ? this.props.output0 : this.props.output1;
          p_out = i % 2 === 0 ? this.props.output1 : this.props.output0;
          this.uniforms.pressure.value = p_in.texture; this.props.output = p_out; super.update();
        }
        return p_out;
      }
    }

    class Pressure extends ShaderPass {
      constructor(simProps) { super({ material: { vertexShader: face_vert, fragmentShader: pressure_frag, uniforms: { boundarySpace: { value: simProps.cellScale }, pressure: { value: simProps.src_p.texture }, velocity: { value: simProps.src_v.texture }, px: { value: simProps.cellScale }, dt: { value: simProps.dt } } }, output: simProps.dst }); this.init(); }
      update({ vel, pressure }) { this.uniforms.velocity.value = vel.texture; this.uniforms.pressure.value = pressure.texture; super.update(); }
    }

    class Output {
      constructor() {
        this.simulation = new Simulation(); this.scene = new THREE.Scene(); this.camera = new THREE.Camera();
        this.mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.RawShaderMaterial({ vertexShader: face_vert, fragmentShader: color_frag, transparent: true, uniforms: { velocity: { value: this.simulation.fbos.v0.texture }, boundarySpace: { value: new THREE.Vector2() }, palette: { value: paletteTex }, bgColor: { value: bgVec4 } } }));
        this.scene.add(this.mesh);
      }
      update() { this.simulation.update(); Common.renderer.render(this.scene, this.camera); }
    }

    const container = mountRef.current;
    if (!container) return;
    Common.init(container);
    Mouse.init(container);
    container.appendChild(Common.renderer.domElement);
    const output = new Output();

    const loop = () => {
      if (!isVisibleRef.current) { rafRef.current = requestAnimationFrame(loop); return; }
      Mouse.update(); Common.update(); output.update();
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);

    const io = new IntersectionObserver(entries => { isVisibleRef.current = entries[0].isIntersecting; }, { threshold: 0.1 });
    io.observe(container);

    return () => {
      cancelAnimationFrame(rafRef.current); Mouse.dispose();
      if (Common.renderer && container.contains(Common.renderer.domElement)) container.removeChild(Common.renderer.domElement);
      Common.renderer?.dispose();
    };
  }, [colors]);

  return <div ref={mountRef} className={`liquid-ether-container ${className}`} style={{ ...style, position: 'absolute', inset: 0, zIndex: 0 }} />;
}
