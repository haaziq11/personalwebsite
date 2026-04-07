import * as THREE from "three";

const canvas = document.getElementById("c");

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.12;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0x6ab8d8, 18, 55);

const camera = new THREE.PerspectiveCamera(48, window.innerWidth / window.innerHeight, 0.1, 200);
camera.position.set(0, 1.5, 6.0);
camera.lookAt(0, 2.2, 0);

const skyTop = new THREE.Color(0x3a9fd4);
const skyHorizon = new THREE.Color(0x89c4e1);
scene.background = skyHorizon.clone().lerp(skyTop, 0.55);

scene.add(new THREE.HemisphereLight(0xe8f4ff, 0x5a8a5a, 0.72));
scene.add(new THREE.AmbientLight(0xffffff, 0.38));

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

const size = 512;
const data = new Uint8Array(size * size * 4);
for (let y = 0; y < size; y++) {
  for (let x = 0; x < size; x++) {
    const i = (y * size + x) * 4;
    const n = Math.sin(x * 0.08) * Math.cos(y * 0.07) + Math.sin(x * 0.02 + y * 0.03) * 0.5;
    const g = 80 + n * 35 + (Math.random() - 0.5) * 18;
    data[i]     = Math.max(0, g * 0.35);
    data[i + 1] = g;
    data[i + 2] = Math.max(0, g * 0.25);
    data[i + 3] = 255;
  }
}
const grassTex = new THREE.DataTexture(data, size, size);
grassTex.needsUpdate = true;
grassTex.wrapS = grassTex.wrapT = THREE.RepeatWrapping;
grassTex.repeat.set(14, 14);
grassTex.colorSpace = THREE.SRGBColorSpace;

const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(120, 120),
  new THREE.MeshStandardMaterial({ map: grassTex, roughness: 0.92, metalness: 0 })
);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

const discCursor = document.getElementById("disc-cursor");
document.addEventListener("mousemove", (e) => {
  discCursor.style.display = "block";
  discCursor.style.left = e.clientX + "px";
  discCursor.style.top = e.clientY + "px";
});

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

(function tick() {
  renderer.render(scene, camera);
  requestAnimationFrame(tick);
})();
