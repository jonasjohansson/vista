const WIDTH = 32;
const BIRDS = WIDTH * WIDTH;
const WINGSPAN = 10;
const SCALE = 0.1;

var windowHalfX = window.innerWidth / 2;
var windowHalfY = window.innerHeight / 2;

var BOUNDS = 2560,
	BOUNDS_HALF = BOUNDS / 2;

var last = performance.now();

var gpuCompute;
var velocityVariable;
var positionVariable;
var positionUniforms;
var velocityUniforms;
var birdUniforms;var container, stats;

var camera, controls, scene, renderer;

var mesh, texture;

var worldWidth = 256,
	worldDepth = 256;
var worldHalfWidth = worldWidth / 2;
var worldHalfDepth = worldDepth / 2;

var clock = new THREE.Clock();

window.onload = () => {
	scene = new THREE.Scene();
	scene.fog = new THREE.FogExp2(0x0000ff, 0.0005);

	renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
	renderer.setSize(window.innerWidth, window.innerHeight);

	document.body.appendChild(renderer.domElement);

	camera = new THREE.PerspectiveCamera(45,window.innerWidth/window.innerHeight,0.1,10000);

	initComputeRenderer();

	// var gui = new dat.GUI();

	var effectController = {
		separation: 20.0,
		alignment: 30.0,
		cohesion: 30.0,
		freedom: 10.75
	};

	var valuesChanger = function() {
		velocityUniforms['separationDistance'].value = effectController.separation;
		velocityUniforms['alignmentDistance'].value = effectController.alignment;
		velocityUniforms['cohesionDistance'].value = effectController.cohesion;
		velocityUniforms['freedomFactor'].value = effectController.freedom;
	};

	valuesChanger();

	// gui.add(effectController, 'separation', 0.0, 100.0, 1.0).onChange(valuesChanger);
	// gui.add(effectController, 'alignment', 0.0, 100, 0.001).onChange(valuesChanger);
	// gui.add(effectController, 'cohesion', 0.0, 100, 0.025).onChange(valuesChanger);
	// gui.close();

	addEnvironment();
	addTerrain();
	initBirds();
	animate();
}

function addEnvironment(){

	sunMaterial = new THREE.MeshLambertMaterial({
		color: 0xffffff,
		side: THREE.DoubleSide,
		transparent: true,
		opacity: 0
	});

	sun = new THREE.Mesh(new THREE.SphereGeometry(20, 20, 20), sunMaterial);
	sun.add(new THREE.PointLight(0xff5300, 30, 1100));
	scene.add(sun);

	worldMaterial = new THREE.MeshPhongMaterial({
		side: THREE.DoubleSide,
		color: 0x0000ff
	});

	world = new THREE.Mesh(new THREE.SphereGeometry(1000, 50, 50), worldMaterial);
	scene.add(world);

}
function addTerrain() {
    var data = generateHeight(worldWidth, worldDepth);


	var geometry = new THREE.PlaneBufferGeometry(7500, 7500, worldWidth - 1, worldDepth - 1);
	geometry.rotateX(-Math.PI / 2);

	var vertices = geometry.attributes.position.array;

	for (var i = 0, j = 0, l = vertices.length; i < l; i++, j += 3) {
		vertices[j + 1] = data[i] * 10;
	}

	texture = new THREE.CanvasTexture(generateTexture(data, worldWidth, worldDepth));
	texture.wrapS = THREE.ClampToEdgeWrapping;
	texture.wrapT = THREE.ClampToEdgeWrapping;

	mesh = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({
		map: texture,
		wireframe: false,
		reflectivity:0.6,
		color:0x550000,
		// envMap:textureCube,
		// combine:THREE.MixOperation,
		opacity:0.5,
		transparent:true,
		specular:0xff5300,
			side: THREE.DoubleSide
		}));

	mesh.scale.y = -1;
	
	scene.add(mesh);
}

function animate() {
	requestAnimationFrame(animate);
	render();
}

function render() {
	var now = performance.now();
	var delta = (now - last) / 1000;

	if (delta > 1) delta = 1; // safety cap on large deltas
	last = now;
	const distance = 740;

	let angle = new Date().getTime() * 0.0001;
	sun.position.set(Math.cos(angle) * distance, 0, Math.sin(angle) * distance);

	velocityUniforms['separationDistance'].value = Math.sin(angle) * 50 + 50;

	positionUniforms['time'].value = now;
	positionUniforms['delta'].value = delta;
	velocityUniforms['time'].value = now;
	velocityUniforms['delta'].value = delta;
	birdUniforms['time'].value = now;
	birdUniforms['delta'].value = delta;

	velocityUniforms['predator'].value.set((0.5 * 10000) / windowHalfX, (-0.5 * 10000) / windowHalfY, 0);

	gpuCompute.compute();

	birdUniforms['texturePosition'].value = gpuCompute.getCurrentRenderTarget(positionVariable).texture;
	birdUniforms['textureVelocity'].value = gpuCompute.getCurrentRenderTarget(velocityVariable).texture;

	renderer.render(scene,camera);
}
