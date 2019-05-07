const WIDTH = 32;
const BIRDS = WIDTH * WIDTH;
const WINGSPAN = 10;
const SCALE = 0.1;
const DIST = 740;

const WINDOW_HALF_X = window.innerWidth / 2;
const WINDOW_HALF_Y = window.innerHeight / 2;

var BOUNDS = 2560,
	BOUNDS_HALF = BOUNDS / 2;

var last = performance.now();

var gpuCompute;
var velocityVariable;
var positionVariable;
var positionUniforms;
var velocityUniforms;
var birdUniforms;
var container, stats;

var camera, controls, scene, renderer;

var mesh, texture;

var worldWidth = 256,
	worldDepth = 256;
var worldHalfWidth = worldWidth / 2;
var worldHalfDepth = worldDepth / 2;

var clock = new THREE.Clock();

var mainEl;

AFRAME.registerComponent('birds', {
	schema: {
		// ... Define schema to pass properties from DOM to this component
	},

	init: function() {
		sceneEl = this.el.sceneEl;

		mainEl = this.el;

		// scene = new THREE.Scene();
		// scene.fog = new THREE.FogExp2(0x0000ff, 0.0005);

		// renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
		// renderer.setSize(window.innerWidth, window.innerHeight);

		// document.body.appendChild(renderer.domElement);

		// camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 10000);
		console.log('init computer render init');

		// sceneEl.renderer is now set.
		renderer = sceneEl.renderer;
		console.log('asd', renderer);

		initComputeRenderer();

		velocityUniforms['separationDistance'].value = 20.0;
		velocityUniforms['alignmentDistance'].value = 30.0;
		velocityUniforms['cohesionDistance'].value = 30.0;
		velocityUniforms['freedomFactor'].value = 10.75;

		console.log('call init');
		initBirds();
		console.log('init called');
		animate();
	}
});

function animate() {
	requestAnimationFrame(animate);
	render();
}

function render() {
	var now = performance.now();
	var delta = (now - last) / 1000;

	if (delta > 1) delta = 1; // safety cap on large deltas
	last = now;

	let angle = new Date().getTime() * 0.00005;
	// sun.position.set(Math.cos(angle) * DIST, 300, Math.sin(angle) * DIST);

	velocityUniforms['separationDistance'].value = Math.sin(angle) * 50 + 20;
	velocityUniforms['cohesionDistance'].value = Math.sin(angle) * 30;
	positionUniforms['time'].value = now;
	positionUniforms['delta'].value = delta;
	velocityUniforms['time'].value = now;
	velocityUniforms['delta'].value = delta;
	birdUniforms['time'].value = now;
	birdUniforms['delta'].value = delta;

	var px = (0.5 * 10000) / WINDOW_HALF_X;
	var py = (-0.5 * 10000) / WINDOW_HALF_Y;
	velocityUniforms['predator'].value.set(px, py, 0);

	gpuCompute.compute();

	birdUniforms['texturePosition'].value = gpuCompute.getCurrentRenderTarget(positionVariable).texture;
	birdUniforms['textureVelocity'].value = gpuCompute.getCurrentRenderTarget(velocityVariable).texture;

	// renderer.render(scene, camera);
}

// window.addEventListener(
// 	'resize',
// 	function(event) {
// 		camera.aspect = window.innerWidth / window.innerHeight;
// 		camera.updateProjectionMatrix();
// 		renderer.setSize(window.innerWidth, window.innerHeight);
// 	},
// 	false
// );
