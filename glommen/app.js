const SUN_COLOR = 0x000000;
const SUN_LIGHT_COLOR = 0xff5300;
const WORLD_COLOR = 0xff0000;
const WATER_COLOR = 0x8800ff;

const CAMERA_POSITION = new THREE.Vector3(0, 150, -960);
const WATER_SIZE = 20000;
const WATER_DETAIL = 256;
const SUN_RADIUS = 20;
const WORLD_RADIUS = 1000;

let scene, camera, renderer, sun, sunLight, world, water, sunMaterial, sunGeometry, worldMaterial, worldGeometry, waterMaterial, waterGeometry;
let audioContext, panner;

document.addEventListener('DOMContentLoaded', function () {
  initScene();
  addEnvironment();
  addWater();
  render();
});

function initScene() {
  scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x00ffff, 0.0004);

  camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 20000);
  camera.position.copy(CAMERA_POSITION);
  camera.lookAt(scene.position);

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  window.addEventListener('click', addAudio);
}

function addEnvironment() {
  sunMaterial = new THREE.MeshLambertMaterial({ color: SUN_COLOR, opacity: 0, transparent: true });
  sunGeometry = new THREE.SphereGeometry(SUN_RADIUS, 20, 20);
  sun = new THREE.Mesh(sunGeometry, sunMaterial);
  scene.add(sun);

  sunLight = new THREE.PointLight(SUN_LIGHT_COLOR, 40, 2500);
  sun.add(sunLight);

  worldMaterial = new THREE.MeshPhongMaterial({ side: THREE.DoubleSide, color: WORLD_COLOR });
  worldGeometry = new THREE.SphereGeometry(WORLD_RADIUS, 50, 50);
  world = new THREE.Mesh(worldGeometry, worldMaterial);
  scene.add(world);
}

function addWater() {
  waterGeometry = new THREE.PlaneGeometry(WATER_SIZE, WATER_SIZE, WATER_DETAIL - 1, WATER_DETAIL - 1);
  waterGeometry.applyMatrix(new THREE.Matrix4().makeRotationX(-Math.PI / 2));
  for (let i = 0, il = waterGeometry.vertices.length; i < il; i++) {
    waterGeometry.vertices[i].y = 35 * Math.sin(i / 2);
  }
  waterGeometry.computeFaceNormals();
  waterGeometry.computeVertexNormals();
  waterMaterial = new THREE.MeshBasicMaterial({ color: WATER_COLOR, vertexColors: THREE.VertexColors });
  water = new THREE.Mesh(waterGeometry, waterMaterial);
  water.geometry.verticesNeedUpdate = true;
  scene.add(water);
}

function addAudio() {
  window.AudioContext = window.AudioContext || window.webkitAudioContext;

  audioContext = new AudioContext();

  document.addEventListener('click', function () {
    if (audioContext.state === 'suspended') {
      audioContext.resume();
    }
  });
}

function render() {
  const delta = clock.getElapsedTime();
  const angle = delta * 0.05;
  const time = clock.getElapsedTime();

  requestAnimationFrame(render);
  renderer.render(scene, camera);
}
