var camera, scene, renderer;
var clothGeometry;
var object;
var sun, light, world, worldMaterial;
var keyboard = {};
			var mixers = [];
var fadeInOut = false;

var character;

var player = { height:1.8, speed:8.2, turnSpeed:Math.PI*0.02 }

var clock = new THREE.Clock();

window.onload = function(){
	scene = new THREE.Scene();

	camera = new THREE.PerspectiveCamera( 90, window.innerWidth / window.innerHeight, 1, 5000 );
	camera.position.set( 0, 20, 300 );

	renderer = new THREE.WebGLRenderer();
	renderer.setSize(window.innerWidth, window.innerHeight);

	renderer.gammaInput = true;
	renderer.gammaOutput = true;
	renderer.shadowMap.enabled = true;

	document.body.appendChild(renderer.domElement);

	document.addEventListener( 'keydown', onKeyDown, false );
	document.addEventListener( 'keyup', onKeyUp, false );

	addEnvironment();
	addRunner();
}

function addEnvironment(){

	let floor = new THREE.Mesh(
		new THREE.PlaneGeometry(10000,10000,10,10),
		new THREE.MeshBasicMaterial({color:0xffffff, wireframe:true})
	);
	scene.add(new THREE.PointLight(0xff5300,24,1500));

	floor.rotation.x -= Math.PI / 2;
	scene.add(floor);

}

function addRunner(){

	
	var loader = new THREE.FBXLoader();
	loader.load( 'Running (1).fbx', function ( object ) {

		object.mixer = new THREE.AnimationMixer( object );
		mixers.push( object.mixer );

		object.mixer.timeScale = 1.1;

		var action = object.mixer.clipAction( object.animations[ 0 ] );
		action.play();

		object.traverse( function ( child ) {

			if ( child.isMesh ) {
				child.castShadow = true;
				child.receiveShadow = true;

			}

		} );

		character = object;

	scene.add(character);
	animate();


	} );

}

function animate(){

	requestAnimationFrame(animate);

	if (keyboard[87]){
		character.position.x += Math.sin(character.rotation.y) * player.speed;
		character.position.z += Math.cos(character.rotation.y) * player.speed;
	}
	if (keyboard[65]){
		character.rotation.y -= player.turnSpeed;
	}
	if (keyboard[68]){
		character.rotation.y += player.turnSpeed;
	}

	if ( mixers.length > 0 ) {

		for ( var i = 0; i < mixers.length; i ++ ) {

			mixers[ i ].update( clock.getDelta() );

		}

	}
        var relativeCameraOffset = new THREE.Vector3(0,150,-200);

	var cameraOffset = relativeCameraOffset.applyMatrix4( character.matrixWorld );

	camera.position.x = cameraOffset.x;
	camera.position.y = cameraOffset.y;
	camera.position.z = cameraOffset.z;
        camera.lookAt(character.position);


	render();
}

function render(){
	renderer.render(scene,camera);
}

window.addEventListener('resize',function(event){
	camera.aspect = window.innerWidth/window.innerHeight;
	camera.updateProjectionMatrix();
	renderer.setSize(window.innerWidth,window.innerHeight);
},false);

function onKeyDown ( event ) {
	keyboard[event.keyCode] = true;
}
function onKeyUp ( event ) {
	keyboard[event.keyCode] = false;
}