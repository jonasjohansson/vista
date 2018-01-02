var camera, scene, renderer;
var clothGeometry;
var object;
var sun, light, world, worldMaterial;

var fadeInOut = false;

var clock = new THREE.Clock();

window.onload = function(){
	scene = new THREE.Scene();
	scene.fog = new THREE.FogExp2(0x33004f,0.0009);

	camera = new THREE.PerspectiveCamera(45,window.innerWidth/window.innerHeight,0.1,10000);
	camera.position.set(0,0,-1200);
	camera.lookAt(scene.position);

	renderer = new THREE.WebGLRenderer({antialias:true,alpha:true});
	renderer.setSize(window.innerWidth, window.innerHeight);

	renderer.gammaInput = true;
	renderer.gammaOutput = true;
	renderer.shadowMap.enabled = true;

	document.body.appendChild(renderer.domElement);

	addEnvironment();
	addDrape();
	animate();
}

function addEnvironment(){

	sunMaterial = new THREE.MeshLambertMaterial({
		visible:false
	});
	sunGeometry = new THREE.SphereGeometry(20,20,20);
	sun = new THREE.Mesh(sunGeometry,sunMaterial);
	scene.add(sun);

	sun.add(new THREE.PointLight(0xD4AF37,60,1000));

	worldMaterial = new THREE.MeshPhongMaterial({
		side:THREE.DoubleSide,
		color:0x0000ff
	});
	worldGeometry = new THREE.SphereGeometry(1500,200,200);
	world = new THREE.Mesh(worldGeometry,worldMaterial);
	scene.add(world);
}

function addDrape(){

	var textureCube = new THREE.CubeTextureLoader()
		.load(['px.jpg', 'nx.jpg', 'py.jpg', 'ny.jpg', 'pz.jpg', 'nz.jpg']);
	textureCube.mapping = THREE.CubeRefractionMapping;

	clothMaterial = new THREE.MeshPhongMaterial({
		color:0x550000,
		specular:0xff5300,
		envMap:textureCube,
		combine:THREE.MixOperation,
		reflectivity:0.6,
		//refractionRatio:0.1,
		side:THREE.DoubleSide,
		transparent:true,
		opacity:1,
	});

	clothGeometry = new THREE.ParametricGeometry(clothInitialPosition,cloth.w,cloth.h);
	clothGeometry.dynamic = true;

	object = new THREE.Mesh(clothGeometry,clothMaterial);
	object.position.set(0,0,0);
	object.castShadow = true;

	scene.add(object);
}

function animate(){

	requestAnimationFrame(animate);

	var time = Date.now();
	var angle = time * 0.0001;
	
	if (fadeInOut){

		var timeElapsed = clock.getElapsedTime();
		var delta = timeElapsed * 0.5;
		var opacity = 0.5*(1+Math.sin(delta+10.9));
		
		if (opacity >= 0 && opacity <= 1)
			//clothMaterial.opacity = opacity;
			scene.fog.density = (opacity + 1) * 0.0009;
	}

	sun.position.set(0, 1200*Math.sin(angle*5), 0);
	emit('sun.position.y', sun.position.y)

	simulate(time);
	render();
}

function render(){
	var p = cloth.particles;
	for ( var i = 0, il = p.length; i < il; i ++ ) {
		clothGeometry.vertices[i].copy( p[i].position );
	}

	clothGeometry.computeFaceNormals();
	clothGeometry.computeVertexNormals();
	clothGeometry.normalsNeedUpdate = true;
	clothGeometry.verticesNeedUpdate = true;

	renderer.render(scene,camera);
}

window.addEventListener('resize',function(event){
	camera.aspect = window.innerWidth/window.innerHeight;
	camera.updateProjectionMatrix();
	renderer.setSize(window.innerWidth,window.innerHeight);
},false);