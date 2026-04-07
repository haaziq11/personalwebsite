import * as THREE from "three";

const canvas = document.getElementById("c");
const hud = document.getElementById("hud");
const contentEl = document.getElementById("content");
const discCursor = document.getElementById("disc-cursor");

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  alpha: false,
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.12;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0x6ab8d8, 18, 55);

const camera = new THREE.PerspectiveCamera(
  48,
  window.innerWidth / window.innerHeight,
  0.1,
  200
);
const cameraZStart = 5.25;
const cameraZEnd = 2.65;
camera.position.set(0, 1.35, cameraZStart);
camera.lookAt(0, 1.55, 0);

const clock = new THREE.Clock();

const skyTop = new THREE.Color(0x3a9fd4);
const skyHorizon = new THREE.Color(0x89c4e1);
scene.background = new THREE.Color(0x6ab8d8);

const hemi = new THREE.HemisphereLight(0xe8f4ff, 0x5a8a5a, 0.72);
scene.add(hemi);

const ambient = new THREE.AmbientLight(0xffffff, 0.38);
scene.add(ambient);

const sun = new THREE.DirectionalLight(0xfff5e0, 1.15);
sun.position.set(-6, 14, 8);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.near = 0.5;
sun.shadow.camera.far = 40;
sun.shadow.camera.left = -12;
sun.shadow.camera.right = 12;
sun.shadow.camera.top = 12;
sun.shadow.camera.bottom = -12;
sun.shadow.bias = -0.0002;
scene.add(sun);

function makeGrassTexture() {
  const size = 512;
  const data = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      const n =
        Math.sin(x * 0.08) * Math.cos(y * 0.07) +
        Math.sin(x * 0.02 + y * 0.03) * 0.5;
      const g = 80 + n * 35 + (Math.random() - 0.5) * 18;
      const r = Math.max(0, g * 0.35);
      const b = Math.max(0, g * 0.25);
      data[i] = r;
      data[i + 1] = g;
      data[i + 2] = b;
      data[i + 3] = 255;
    }
  }
  const tex = new THREE.DataTexture(data, size, size);
  tex.needsUpdate = true;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(14, 14);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

const grassTex = makeGrassTexture();
const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(120, 120, 1, 1),
  new THREE.MeshStandardMaterial({
    map: grassTex,
    roughness: 0.92,
    metalness: 0,
  })
);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

/** Cross-section in (radius, height); revolved around Y — concave bottom, domed top, rolled rim. */
function discProfilePoints() {
  const ε = 0.008;
  return [
    new THREE.Vector2(ε, -0.071),
    new THREE.Vector2(0.36, -0.074),
    new THREE.Vector2(0.78, -0.068),
    new THREE.Vector2(1.12, -0.052),
    new THREE.Vector2(1.168, -0.022),
    new THREE.Vector2(1.175, 0.022),
    new THREE.Vector2(1.14, 0.064),
    new THREE.Vector2(1.05, 0.096),
    new THREE.Vector2(0.78, 0.114),
    new THREE.Vector2(0.38, 0.119),
    new THREE.Vector2(ε, 0.114),
  ];
}

function drawStarPath(ctx, cx, cy, outerR, innerR, spikes) {
  ctx.beginPath();
  for (let i = 0; i < spikes * 2; i++) {
    const r = i % 2 === 0 ? outerR : innerR;
    const a = (i * Math.PI) / spikes - Math.PI / 2;
    const x = cx + Math.cos(a) * r;
    const y = cy + Math.sin(a) * r;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
}

/** Ultra-Star–inspired top art (optional PNG `ultrastar-top.png` overrides). */
function createUltraStarCanvasTexture() {
  const size = 1024;
  const canvasEl = document.createElement("canvas");
  canvasEl.width = canvasEl.height = size;
  const ctx = canvasEl.getContext("2d");
  const cx = size / 2;
  const cy = size / 2;
  const R = size * 0.48;

  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, R, 0, Math.PI * 2);
  ctx.clip();

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, size, size);

  for (let i = 0; i < 5; i++) {
    const a0 = (i * 2 * Math.PI) / 5 - Math.PI / 2;
    const a1 = a0 + (2 * Math.PI) / 5;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, R * 0.94, a0, a1);
    ctx.closePath();
    const mx = cx + Math.cos((a0 + a1) / 2) * R * 0.85;
    const my = cy + Math.sin((a0 + a1) / 2) * R * 0.85;
    const g = ctx.createLinearGradient(cx, cy, mx, my);
    g.addColorStop(0, "rgba(255, 200, 230, 0.5)");
    g.addColorStop(0.45, "rgba(255, 230, 160, 0.4)");
    g.addColorStop(1, "rgba(160, 230, 255, 0.35)");
    ctx.fillStyle = g;
    ctx.fill();
  }

  for (let j = 1; j <= 7; j++) {
    ctx.strokeStyle = `rgba(180, 210, 255, ${0.06 + j * 0.015})`;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(cx, cy, R * 0.22 + j * 14, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.restore();

  ctx.beginPath();
  ctx.arc(cx, cy, R * 0.9, 0, Math.PI * 2);
  ctx.arc(cx, cy, R * 0.56, 0, Math.PI * 2, true);
  ctx.fillStyle = "#1a4fbf";
  ctx.fill();

  ctx.beginPath();
  ctx.arc(cx, cy, R * 0.54, 0, Math.PI * 2);
  ctx.fillStyle = "#fafafa";
  ctx.fill();

  ctx.save();
  ctx.font = `700 ${Math.round(R * 0.09)}px Outfit, system-ui, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "rgba(255,255,255,0.92)";
  ctx.fillText("DISCRAFT ULTRASTAR", cx, cy - R * 0.42);
  ctx.fillStyle = "rgba(180, 230, 255, 0.95)";
  ctx.font = `500 ${Math.round(R * 0.055)}px Outfit, system-ui, sans-serif`;
  ctx.fillText("THE ULTIMATE 175g SPORTDISC", cx, cy + R * 0.42);
  ctx.restore();

  drawStarPath(ctx, cx, cy, R * 0.2, R * 0.082, 5);
  ctx.strokeStyle = "#0a1a44";
  ctx.lineWidth = 12;
  ctx.lineJoin = "round";
  ctx.stroke();
  ctx.fillStyle = "#ffffff";
  ctx.fill();

  const tex = new THREE.CanvasTexture(canvasEl);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  tex.needsUpdate = true;
  return tex;
}

function createFrisbee() {
  const group = new THREE.Group();

  const latheGeom = new THREE.LatheGeometry(discProfilePoints(), 96);
  latheGeom.computeVertexNormals();

  const bodyMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.22,
    metalness: 0.02,
  });
  const body = new THREE.Mesh(latheGeom, bodyMat);
  body.castShadow = true;
  body.receiveShadow = true;
  group.add(body);

  const grooveMat = new THREE.MeshStandardMaterial({
    color: 0xf0f0f0,
    roughness: 0.48,
    metalness: 0.02,
  });
  const grooveRadii = [0.52, 0.64, 0.76, 0.88];
  for (const r of grooveRadii) {
    const groove = new THREE.Mesh(
      new THREE.TorusGeometry(r, 0.0085, 10, 96),
      grooveMat
    );
    groove.rotation.x = Math.PI / 2;
    groove.position.y = 0.118;
    groove.castShadow = true;
    group.add(groove);
  }

  const topMap = createUltraStarCanvasTexture();
  const decalMat = new THREE.MeshStandardMaterial({
    map: topMap,
    color: 0xffffff,
    roughness: 0.3,
    metalness: 0.06,
    transparent: true,
    opacity: 1,
    side: THREE.DoubleSide,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
  });
  const decal = new THREE.Mesh(new THREE.CircleGeometry(0.9, 96), decalMat);
  decal.rotation.x = -Math.PI / 2;
  decal.position.y = 0.124;
  decal.receiveShadow = false;
  group.add(decal);

  const loader = new THREE.TextureLoader();
  loader.load(
    "ultrastar-top.png",
    (tex) => {
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
      decalMat.map = tex;
      decalMat.needsUpdate = true;
    },
    undefined,
    () => {}
  );

  return group;
}

const frisbee = createFrisbee();
frisbee.position.set(0, 1.55, 0);
frisbee.rotation.set(0.18, 0.35, 0.08);
scene.add(frisbee);

let scrollProgressTarget = 0;
let scrollProgress = 0;
const SCROLL_PER_FULL = 2200;
const ZOOM_SMOOTHING = 7.5;
let contentRevealed = false;

function easeOutCubic(t) {
  return 1 - (1 - t) ** 3;
}

/** Hand off to the second page before the disc fills the whole view (avoids rim/sky "sliver"). */
const REVEAL_AT = 0.82;

function updateFrisbeeFromProgress() {
  const t = easeOutCubic(scrollProgress);
  const scaleMin = 0.85;
  const scaleMax = 12.8;
  const s = scaleMin + (scaleMax - scaleMin) * t;
  frisbee.scale.setScalar(s);

  camera.position.z = THREE.MathUtils.lerp(cameraZStart, cameraZEnd, t);
  camera.lookAt(0, 1.55, 0);

  const motion = 1 - Math.min(1, t / REVEAL_AT);
  const bob = Math.sin(performance.now() * 0.0011) * 0.04 * motion;
  const sway = Math.sin(performance.now() * 0.00085) * 0.06 * motion;
  frisbee.position.y = 1.55 + bob;
  frisbee.position.x = sway * 0.5;
  frisbee.rotation.z =
    0.08 + Math.sin(performance.now() * 0.0009) * 0.05 * motion;

  const shouldReveal =
    !contentRevealed && (t >= REVEAL_AT || scrollProgressTarget >= REVEAL_AT);
  if (shouldReveal) {
    contentRevealed = true;
    scrollProgress = 1;
    scrollProgressTarget = 1;
    hud.classList.add("hidden");
    contentEl.classList.add("visible");
    contentEl.setAttribute("aria-hidden", "false");
    frisbee.visible = false;
    setupFadeIns();
  }
}

function setupFadeIns() {
  const meRight = document.querySelector('.me-right');
  const els = document.querySelectorAll('.fade-up');
  let delay = 0;
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.transitionDelay = entry.target.dataset.fadeDelay || '0s';
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { root: meRight, threshold: 0.08 });

  els.forEach((el, i) => {
    if (!el.dataset.fadeDelay) el.dataset.fadeDelay = (i * 0.08) + 's';
    observer.observe(el);
  });
}

function addScrollDelta(delta) {
  if (contentRevealed) return;
  scrollProgressTarget += delta / SCROLL_PER_FULL;
  scrollProgressTarget = Math.max(0, Math.min(1, scrollProgressTarget));
}

function onWheel(e) {
  if (contentRevealed) return;
  e.preventDefault();
  addScrollDelta(-e.deltaY);
}

window.addEventListener("wheel", onWheel, { passive: false });

let touchLastY = null;
canvas.addEventListener(
  "touchstart",
  (e) => {
    if (contentRevealed) return;
    touchLastY = e.touches[0].clientY;
  },
  { passive: true }
);
canvas.addEventListener(
  "touchmove",
  (e) => {
    if (contentRevealed || touchLastY == null) return;
    e.preventDefault();
    const y = e.touches[0].clientY;
    const dy = touchLastY - y;
    touchLastY = y;
    addScrollDelta(-dy * 1.4);
  },
  { passive: false }
);
canvas.addEventListener("touchend", () => {
  touchLastY = null;
});

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

const ibiomedLink = document.querySelector(".tagline__tag--preview");
document.addEventListener("mousemove", (e) => {
  if (!contentRevealed) return;
  discCursor.style.display = "block";
  discCursor.style.left = e.clientX + "px";
  discCursor.style.top = e.clientY + "px";
  if (ibiomedLink) {
    const pw = 216, ph = 135;
    let x = e.clientX + 16;
    let y = e.clientY + 16;
    if (x + pw > window.innerWidth - 8) x = e.clientX - pw - 16;
    if (y + ph > window.innerHeight - 8) y = e.clientY - ph - 16;
    ibiomedLink.style.setProperty("--ibiomed-x", x + "px");
    ibiomedLink.style.setProperty("--ibiomed-y", y + "px");
  }
});

// ── Project detail modals ──
document.querySelectorAll(".project-card[data-project]").forEach((card) => {
  card.addEventListener("click", () => {
    const detail = document.getElementById("project-" + card.dataset.project);
    if (!detail) return;
    detail.classList.add("visible");
    detail.setAttribute("aria-hidden", "false");
    detail.querySelector(".project-detail__scroll").scrollTop = 0;
    
    // Auto-unmute videos when opening the modal
    detail.querySelectorAll("video").forEach(v => {
      v.muted = false;
      v.play().catch(e => console.warn("Autoplay blocked:", e));
    });
    
    // Reset toggle button icons to unmuted state
    const iconMuted = detail.querySelector('[id$="audio-icon-muted"]');
    const iconUnmuted = detail.querySelector('[id$="audio-icon-unmuted"]');
    if (iconMuted && iconUnmuted) {
      iconMuted.style.display = 'none';
      iconUnmuted.style.display = 'block';
    }
  });
});

document.querySelectorAll(".project-back").forEach((btn) => {
  btn.addEventListener("click", () => {
    const detail = btn.closest(".project-detail");
    detail.classList.remove("visible");
    detail.setAttribute("aria-hidden", "true");

    // Auto-mute videos when closing the modal
    detail.querySelectorAll("video").forEach(v => {
      v.muted = true;
    });

    // Reset toggle button icons to muted state
    const iconMuted = detail.querySelector('[id$="audio-icon-muted"]');
    const iconUnmuted = detail.querySelector('[id$="audio-icon-unmuted"]');
    if (iconMuted && iconUnmuted) {
      iconMuted.style.display = 'block';
      iconUnmuted.style.display = 'none';
    }
  });
});

// ── Video Audio Toggle ──
const tntVideo = document.getElementById('tnt-prototype-video');
const audioToggle = document.getElementById('tnt-audio-toggle');
if (tntVideo && audioToggle) {
  const iconMuted = document.getElementById('audio-icon-muted');
  const iconUnmuted = document.getElementById('audio-icon-unmuted');
  
  audioToggle.addEventListener('click', (e) => {
    e.stopPropagation();
    tntVideo.muted = !tntVideo.muted;
    if (tntVideo.muted) {
      iconMuted.style.display = 'block';
      iconUnmuted.style.display = 'none';
    } else {
      iconMuted.style.display = 'none';
      iconUnmuted.style.display = 'block';
    }
  });
}

// ── UpLift Video Audio Toggle ──
const upliftVideo = document.getElementById('uplift-prototype-video');
const upliftAudioToggle = document.getElementById('uplift-audio-toggle');
if (upliftVideo && upliftAudioToggle) {
  const iconMuted = document.getElementById('uplift-audio-icon-muted');
  const iconUnmuted = document.getElementById('uplift-audio-icon-unmuted');

  upliftAudioToggle.addEventListener('click', (e) => {
    e.stopPropagation();
    upliftVideo.muted = !upliftVideo.muted;
    if (upliftVideo.muted) {
      iconMuted.style.display = 'block';
      iconUnmuted.style.display = 'none';
    } else {
      iconMuted.style.display = 'none';
      iconUnmuted.style.display = 'block';
    }
  });
}

// ── Zzz-P30 Video Audio Toggle ──
const zzzVideo = document.getElementById('zzz-prototype-video');
const zzzAudioToggle = document.getElementById('zzz-audio-toggle');
if (zzzVideo && zzzAudioToggle) {
  const iconMuted = document.getElementById('zzz-audio-icon-muted');
  const iconUnmuted = document.getElementById('zzz-audio-icon-unmuted');

  zzzAudioToggle.addEventListener('click', (e) => {
    e.stopPropagation();
    zzzVideo.muted = !zzzVideo.muted;
    if (zzzVideo.muted) {
      iconMuted.style.display = 'block';
      iconUnmuted.style.display = 'none';
    } else {
      iconMuted.style.display = 'none';
      iconUnmuted.style.display = 'block';
    }
  });
}

// ── Link preview popup ──
const linkPreview = document.getElementById("link-preview");
const previewFrame = document.getElementById("preview-frame");
const PREVIEW_OFFSET_X = 16;
const PREVIEW_OFFSET_Y = 16;
let previewHideTimer = null;

function positionPreview(x, y) {
  const pw = 216, ph = 135;
  let left = x + PREVIEW_OFFSET_X;
  let top = y + PREVIEW_OFFSET_Y;
  if (left + pw > window.innerWidth - 8) left = x - pw - PREVIEW_OFFSET_X;
  if (top + ph > window.innerHeight - 8) top = y - ph - PREVIEW_OFFSET_Y;
  linkPreview.style.left = left + "px";
  linkPreview.style.top = top + "px";
}

document.querySelectorAll("[data-preview]").forEach((el) => {
  el.addEventListener("mouseenter", (e) => {
    if (previewHideTimer) { clearTimeout(previewHideTimer); previewHideTimer = null; }
    const url = el.dataset.preview;
    if (previewFrame.dataset.loaded !== url) {
      previewFrame.src = url;
      previewFrame.dataset.loaded = url;
    }
    positionPreview(e.clientX, e.clientY);
    linkPreview.classList.add("visible");
  });

  el.addEventListener("mousemove", (e) => {
    positionPreview(e.clientX, e.clientY);
  });

  el.addEventListener("mouseleave", () => {
    linkPreview.classList.remove("visible");
    previewHideTimer = setTimeout(() => {
      previewFrame.src = "";
      previewFrame.dataset.loaded = "";
      previewHideTimer = null;
    }, 300);
  });
});

function tick() {
  const dt = clock.getDelta();
  if (!contentRevealed) {
    const alpha = 1 - Math.exp(-ZOOM_SMOOTHING * Math.min(dt, 0.1));
    scrollProgress += (scrollProgressTarget - scrollProgress) * alpha;
    updateFrisbeeFromProgress();
  } else {
    // Smoothly pull camera back; tilt slightly upward so sky dominates
    // the background and the horizon sits in the lower third.
    camera.position.x += (0 - camera.position.x) * 0.04;
    camera.position.y += (1.5 - camera.position.y) * 0.04;
    camera.position.z += (6.0 - camera.position.z) * 0.04;
    camera.lookAt(0, 2.2, 0);
  }
  renderer.render(scene, camera);
  requestAnimationFrame(tick);
}

updateFrisbeeFromProgress();
tick();
