var clock = new THREE.Clock();
var mouse = {x: 0, y: 0};
var scene, camera;
var glow, cave;
var colors = {
	col1: 0xff5353,
	col2: 0xff5353,
	col3: 0x261dd6,
}

window.onload = function() {
	scene = new THREE.Scene();
	
	camera = new THREE.PerspectiveCamera(45,window.innerWidth/window.innerHeight,0.1,40000);
	camera.position.set(0,0,-3000);
	camera.lookAt(scene.position);

    renderer = new THREE.WebGLRenderer({clearAlpha:1,antialias:true});
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);
	addEnvironment();
	//addGUI();
}

function addEnvironment(){
	scene.add(new THREE.AmbientLight(colors.col1,0.5));
	//scene.fog = new THREE.FogExp2(colors.col1,0.00015);

	/*directionalLight = new THREE.DirectionalLight(colors.col1,1.15);
	directionalLight.position.set(500,2000,0);
	scene.add(directionalLight);*/

	var glowGeometry = new THREE.SphereGeometry(40,40,40);
	var glowMaterial = new THREE.MeshLambertMaterial({color:0x000000,transparent:true});
	glow = new THREE.Mesh(glowGeometry,glowMaterial);
	scene.add(glow)
	
	var glowLight = new THREE.PointLight(colors.col2,5,3000);
	glow.add(glowLight);

	var manager = new THREE.LoadingManager();
	var loader = new THREE.OBJLoader(manager);
	loader.load('object.obj', function(object) {
		cave = object;
		object.traverse(function(child) {
			if (child instanceof THREE.Mesh) {
				child.material = new THREE.MeshLambertMaterial({
					color:colors.col3,
					emissive:0x000000,
					side:THREE.DoubleSide,
				});
			}
		});
		scene.add(object);
		render();
	});
}

function addGUI(){
  	var gui = new dat.GUI();
  	gui.addColor(colors,'col1').onChange(update);
  	gui.addColor(colors,'col2').onChange(update);
  	gui.addColor(colors,'col3').onChange(update);
  	//gui.remember(colors);
}

function update(){
	scene.children[0].color = new THREE.Color(colors.col1);
	scene.children[1].color = new THREE.Color(colors.col1);
	glow.children[0].color = new THREE.Color(colors.col2);
	cave.traverse(function(child) {
		if (child instanceof THREE.Mesh) {
			child.material.color = new THREE.Color(colors.col3);
		}
	});
}

function render(){
	var delta = clock.getElapsedTime();
	var speed = delta * 0.3;
	var xPos = -mouse.x * Math.sin(speed) * 120;
	var yPos = mouse.y * Math.sin(speed) * 120;
	//glow.position.set(xPos,yPos,-600+Math.cos(speed)*2200);
	glow.position.set(0,0,-600+Math.cos(speed)*2200);
    requestAnimationFrame(render);
    renderer.render(scene,camera);
}

document.addEventListener('mousemove',function(event){
	event.preventDefault();
	mouse.x = (event.clientX/window.innerWidth)*2-1;
	mouse.y = -(event.clientY/window.innerHeight)*2+1;
},false);

window.addEventListener('resize',function(event){
    camera.aspect = window.innerWidth/window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth,window.innerHeight);
},false);