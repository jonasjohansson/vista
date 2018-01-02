var structuralSprings = true;
var shearSprings = false;
var bendingSprings = true;

var DAMPING = 0.03;
var DRAG = 1 - DAMPING;
var MASS = .1;

var restDistanceB = 2;
var restDistanceS = Math.sqrt(2);

var xSegs = 22; // how many particles wide is the cloth
var ySegs = 22; // how many particles tall is the cloth

var fabricLength = 400; // sets the size of the cloth
var restDistance; // = fabricLength/xSegs;

var windStrength;
var windForce = new THREE.Vector3( 0, 0, 0 );

var clothInitialPosition = plane( 125, 125 );
var cloth = new Cloth( xSegs, ySegs, fabricLength );

var GRAVITY = 9.81 * 0; // zero gravity
var gravity = new THREE.Vector3( 0, - GRAVITY, 0 ).multiplyScalar( MASS );

var TIMESTEP = 24 / 1000;
var TIMESTEP_SQ = TIMESTEP * TIMESTEP;

var tmpForce = new THREE.Vector3();
var lastTime;
var pos;

var whereAmI, whereWasI;

var diff = new THREE.Vector3();
var objectCenter = new THREE.Vector3();

var a,b,c,d,e,f;

var nearestX, nearestY, nearestZ;
var currentX, currentY, currentZ;
var xDist, yDist, zDist;
var randomPoints = [];
var rand, randX, randY;

function plane( width, height ) {
	return function( u, v ) {
		var x = u * width - width/2;
		var y = 125; //height/2;
		var z = v * height - height/2;
		return new THREE.Vector3( x, y, z );
	};
}

function Particle( x, y, z, mass ) {
	this.position = clothInitialPosition( x, y ); // position
	this.previous = clothInitialPosition( x, y ); // previous
	this.original = clothInitialPosition( x, y ); // original
	this.a = new THREE.Vector3( 0, 0, 0 ); // acceleration
	this.mass = mass;
	this.invMass = 1 / mass;
	this.tmp = new THREE.Vector3();
	this.tmp2 = new THREE.Vector3();
}

Particle.prototype.lockToOriginal = function() {
	this.position.copy( this.original );
	this.previous.copy( this.original );
}

Particle.prototype.lock = function() {
	this.position.copy( this.previous );
	this.previous.copy( this.previous );
}

Particle.prototype.addForce = function( force ) {
	this.a.add(
		this.tmp2.copy( force ).multiplyScalar( this.invMass )
	);
};

Particle.prototype.integrate = function( timesq ) {
	var newPos = this.tmp.subVectors( this.position, this.previous );
	newPos.multiplyScalar( DRAG ).add( this.position );
	newPos.add( this.a.multiplyScalar( timesq ) );
	this.tmp = this.previous;
	this.previous = this.position;
	this.position = newPos;
	this.a.set( 0, 0, 0 );
};

function satisifyConstrains( p1, p2, distance) {
	diff.subVectors( p2.position, p1.position );
	var currentDist = diff.length();
	if ( currentDist == 0 ) return; // prevents division by 0
	var correction = diff.multiplyScalar( (currentDist - distance) / currentDist);
	var correctionHalf = correction.multiplyScalar( 0.5 );
	p1.position.add( correctionHalf );
	p2.position.sub( correctionHalf );
}

function repelParticles( p1, p2, distance) {
	diff.subVectors( p2.position, p1.position );
	var currentDist = diff.length();
	if ( currentDist == 0 ) return; // prevents division by 0
	if (currentDist < distance){
		var correction = diff.multiplyScalar( (currentDist - distance) / currentDist);
		var correctionHalf = correction.multiplyScalar( 0.5 );
		p1.position.add( correctionHalf );
		p2.position.sub( correctionHalf );
	}
}

function Cloth( w, h, l ) {

	this.w = w;
	this.h = h;
	restDistance = l/w; // assuming square cloth for now

	var particles = [];
	var constrains = [];

	var u, v;

	// Create particles
	for (v=0; v<=h; v++) {
		for (u=0; u<=w; u++) {
			particles.push(
				new Particle(u/w, v/h, 0, MASS)
			);
		}
	}

	for (v=0; v<=h; v++) {
		for (u=0; u<=w; u++) {
			if(v<h && (u == 0 || u == w)){
				constrains.push( [
					particles[ index( u, v ) ],
					particles[ index( u, v + 1 ) ],
					restDistance
				] );
			}
			if(u<w && (v == 0 || v == h)){
				constrains.push( [
					particles[ index( u, v ) ],
					particles[ index( u + 1, v ) ],
					restDistance
				] );
			}
		}
	}

	// Structural
	if (structuralSprings){
		for (v=0; v<h; v++) {
			for (u=0; u<w; u++) {
				if(u!=0){
					constrains.push( [
						particles[ index( u, v ) ],
						particles[ index( u, v+1 ) ],
						restDistance
					] );
				}
				if(v!=0){
					constrains.push( [
						particles[ index( u, v ) ],
						particles[ index( u+1, v ) ],
						restDistance
					] );
				}
			}
		}
	}

	// Shear
	if(shearSprings){
		for (v=0;v<=h;v++){
			for (u=0;u<=w;u++){
				if(v<h && u<w){
					constrains.push([
						particles[index(u, v)],
						particles[index(u+1, v+1)],
						restDistanceS*restDistance
					]);
					constrains.push([
						particles[index(u+1, v)],
						particles[index(u, v+1)],
						restDistanceS*restDistance
					]);
				}
			}
		}
	}

	// Bending springs
	if (bendingSprings){
		for (v=0; v<h; v++){
			for (u=0; u<w; u++){
				if(v<h-1){
					constrains.push( [
						particles[ index( u, v ) ],
						particles[ index( u, v+2 ) ],
						restDistanceB*restDistance
					] );
				}
				if(u<w-1){
					constrains.push( [
						particles[ index( u, v ) ],
						particles[ index( u+2, v ) ],
						restDistanceB*restDistance
					] );
				}
			}
		}
	}

	this.particles = particles;
	this.constrains = constrains;

	function index( u, v ) {
		return u + v * ( w + 1 );
	}

	this.index = index;
}

function map(n, start1, stop1, start2, stop2) {
	return ((n-start1)/(stop1-start1))*(stop2-start2)+start2;
}

function simulate( time ) {

	if ( ! lastTime ) {
		lastTime = time;
		return;
	}

	var i, il, particles, particle, pt, constrains, constrain;

	// Aerodynamics forces
	//windStrength = Math.cos( time / 7000 ) * 20 + 40;
	windStrength = Math.cos( time / 7000 ) * 20 + 40;
	windStrength = 5;
	windForce.set(
		Math.sin( time / 2000 ),
		Math.cos( time / 3000 ),
		Math.sin( time / 1000 )
		).normalize().multiplyScalar( windStrength);

	emit('windForce', windForce)

	// apply the wind force to the cloth particles
	var face, faces = clothGeometry.faces, normal;
	particles = cloth.particles;
	for ( i = 0, il = faces.length; i < il; i ++ ) {
		face = faces[ i ];
		normal = face.normal;
		tmpForce.copy( normal ).normalize().multiplyScalar( normal.dot( windForce ) );
		particles[ face.a ].addForce( tmpForce );
		particles[ face.b ].addForce( tmpForce );
		particles[ face.c ].addForce( tmpForce );
	}

	for ( particles = cloth.particles, i = 0, il = particles.length ; i < il; i ++ ){
		particle = particles[ i ];
		particle.addForce( gravity );
		particle.integrate( TIMESTEP_SQ ); // performs verlet integration
	}

	// Start Constrains
	constrains = cloth.constrains,
	il = constrains.length;
	for ( i = 0; i < il; i ++ ) {
		constrain = constrains[ i ];
		satisifyConstrains( constrain[ 0 ], constrain[ 1 ], constrain[ 2 ], constrain[ 3] );
	}

	for ( i = 0; i < particles.length; i ++ ){
		p_i = particles[i];
		for ( j = 0; j < particles.length; j ++ ){
			p_j = particles[j];
			repelParticles(p_i,p_j,restDistance);
		}
	}

	for ( particles = cloth.particles, i = 0, il = particles.length; i < il; i ++ ){
		particle = particles[ i ];
		whereAmI = particle.position;
		whereWasI = particle.previous;
	}
}