var clock = new THREE.Clock();
var mouse = {x: 0, y: 0}
var water, waterGeometry;
var audioContext, panner;

window.onload = function(){
	scene = new THREE.Scene();
	scene.fog = new THREE.FogExp2(0x00ffff,0.0004);

	camera = new THREE.PerspectiveCamera(45,window.innerWidth/window.innerHeight,0.1,20000);
	camera.position.set(0,150,-960);
	camera.lookAt(scene.position);
		
	renderer = new THREE.WebGLRenderer({antialias:true,alpha:true});
	renderer.setSize(window.innerWidth,window.innerHeight);
	document.body.appendChild(renderer.domElement);

	addEnvironment();
	addWater();
	addAudio();
	render();
}

function addEnvironment() {
	sunMaterial = new THREE.MeshLambertMaterial({
		color:0x000000,
		opacity:0,
		transparent:true
	})
	sunGeometry = new THREE.SphereGeometry(20,20,20);
	sun = new THREE.Mesh(sunGeometry,sunMaterial);
	scene.add(sun);

	sunLight = new THREE.PointLight(0xff5300,40,2500);
	sun.add(sunLight);

	worldMaterial = new THREE.MeshPhongMaterial({side:THREE.DoubleSide,color:0xff0000});
	worldGeometry = new THREE.SphereGeometry(1000,50,50); 
	world = new THREE.Mesh(worldGeometry,worldMaterial);
	scene.add(world);
}

function addWater() {
	waterGeometry = new THREE.PlaneGeometry( 20000, 20000, 256 - 1, 256 - 1 );
	waterGeometry.applyMatrix( new THREE.Matrix4().makeRotationX( - Math.PI / 2 ) );
	for (var i = 0, il = waterGeometry.vertices.length; i < il; i++) {
		waterGeometry.vertices[i].y = 35 * Math.sin(i/2);
	}
	waterGeometry.computeFaceNormals();
	waterGeometry.computeVertexNormals();
	waterMaterial = new THREE.MeshBasicMaterial({color:0x8800ff,vertexColors: THREE.VertexColors});
	water = new THREE.Mesh(waterGeometry,waterMaterial);
	water.geometry.verticesNeedUpdate = true;
	scene.add(water);
}

function addAudio(){
	window.AudioContext = window.AudioContext||window.webkitAudioContext;

	audioContext = new AudioContext();
	var droneGain = audioContext.createGain();
	var dryGain = audioContext.createGain();
	var masterGain = audioContext.createGain();
	panner = audioContext.createPanner();

	panner.panningModel = "equalpower";

	droneGain.gain.value = 0.5;
	dryGain.gain.value = 0.4;

	droneGain.connect(panner);

	panner.connect(dryGain);
	panner.setPosition(0,0,0);

	dryGain.connect(masterGain);
	masterGain.connect(audioContext.destination);

	panner.refDistance = 100;
	panner.maxDistance = 1000;
	panner.rolloffFactor = 1;

	var oscillators = [];
	var detunes = [0,400,900,1200];
	var frequencies = [196.00,146.83,130.81];
	var env = audioContext.createGain();

	env.connect(droneGain);
	env.gain.value = 0;

	for (var i = 0; i < detunes.length; i++){
		var osc = "osc"+i;
		window[osc] = audioContext.createOscillator();
		window[osc].detune.value = detunes[i];
		window[osc].connect(env);
		window[osc].type = "sine";
		window[osc].start(audioContext.currentTime);
		oscillators.push(window[osc]);
	}

	function audioChange(){
		var now = audioContext.currentTime;
		var random = Math.round(Math.random() * (frequencies.length - 1));

		for (var i = 0; i < oscillators.length; i++){
			oscillators[i].frequency.value = frequencies[random];
		}
		
		env.gain.setValueAtTime(env.gain.value, now);
		env.gain.linearRampToValueAtTime(1, now + 4);
		env.gain.linearRampToValueAtTime(0, now + 9);
	}

	audioChange();
	setInterval(function(){
		audioChange();
	},10000);
}

function render() {
    //delta = clock.getElapsedTime();
    delta = (new Date).getTime()*0.001;
	angle = delta*0.05;
	time = clock.getElapsedTime();
	sun.position.set(0, -200 + 800*Math.cos(angle), 800*Math.sin(angle));
	
	var p1 = new THREE.Vector3();
	var p2 = new THREE.Vector3();
	
	sun.updateMatrixWorld();
	camera.updateMatrixWorld();
	
	p1.setFromMatrixPosition(sun.matrixWorld);
	p2.setFromMatrixPosition(camera.matrixWorld);
	panner.setPosition(p1.x,p1.y,p1.z);
	audioContext.listener.setPosition(p2.x,p2.y,p2.z);
	
	for (var i = 0, l = waterGeometry.vertices.length; i < l; i++) {
		waterGeometry.vertices[i].y = 20 * Math.sin( i / 5 + ( time + i ) / 7 );
	}
	
	water.geometry.verticesNeedUpdate = true;
	requestAnimationFrame(render,renderer.domElement);
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