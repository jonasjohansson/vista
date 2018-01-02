window.onload = function(){
	scene = new THREE.Scene();
	scene.fog = new THREE.FogExp2(0x0000ff,0.0005);

	camera = new THREE.PerspectiveCamera(45,window.innerWidth/window.innerHeight,0.1,20000);
	camera.position.set(0,0,-900);
	camera.lookAt(scene.position);
		
    renderer = new THREE.WebGLRenderer({antialias:true,alpha:true});
    renderer.setSize(window.innerWidth,window.innerHeight);

    clock = new THREE.Clock();

    document.body.appendChild(renderer.domElement);

    addEnvironment();
	addTerrain();
	render();
}

function addEnvironment(){
	sunMaterial = new THREE.MeshLambertMaterial({
		color:0xffffff,
		side:THREE.DoubleSide
	});
	sunGeometry = new THREE.SphereGeometry(20,20,20);
	sun = new THREE.Mesh(new THREE.SphereGeometry(20,20,20),sunMaterial);
	sun.add(new THREE.PointLight(0xff5300,10,1500));
	scene.add(sun);

    worldMaterial = new THREE.MeshPhongMaterial({
    	side:THREE.DoubleSide,
    	color:0x0000ff
    });
    world = new THREE.Mesh(new THREE.SphereGeometry(1000,50,50),worldMaterial);
    scene.add(world);
}

function addTerrain(){
	var inParameters = {
		alea:RAND_MT,
		generator:PN_GENERATOR,
		width:400,
		height:800,
		widthSegments:10,
		heightSegments:20,
		depth:1600,
		param:1,
		filterparam:1,
		filter:[CIRCLE_FILTER],
		postgen:[MOUNTAINS_COLORS],
		effect:[DESTRUCTURE_EFFECT]
	}

	var terrainGeometry = TERRAINGEN.Get(inParameters);
	var terrainMaterial = new THREE.MeshPhongMaterial({
		vertexColors:THREE.VertexColors,
		shading:THREE.FlatShading,
		side:THREE.DoubleSide
	});
	
	terrain = new THREE.Mesh(terrainGeometry, terrainMaterial);
	terrain.position.y = - inParameters.depth * 0.35;
	scene.add(terrain);
}


function render() {
    delta = clock.getElapsedTime();
    delta = (new Date).getTime()*0.001;
	angle = delta*0.1;
	sun.position.set(650*Math.cos(angle), 0, 650*Math.sin(angle));
    requestAnimationFrame(render,renderer.domElement);
    renderer.render(scene,camera);
}

window.addEventListener('resize',function(event){
    camera.aspect = window.innerWidth/window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth,window.innerHeight);
},false);