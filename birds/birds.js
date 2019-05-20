THREE.BirdGeometry = function() {
    var triangles = BIRDS * 3;
    var points = triangles * 3;

    THREE.BufferGeometry.call(this);

    var vertices = new THREE.BufferAttribute(new Float32Array(points * 3), 3);
    var birdColors = new THREE.BufferAttribute(new Float32Array(points * 3), 3);
    var references = new THREE.BufferAttribute(new Float32Array(points * 2), 2);
    var birdVertex = new THREE.BufferAttribute(new Float32Array(points), 1);

    this.addAttribute('position', vertices);
    this.addAttribute('birdColor', birdColors);
    this.addAttribute('reference', references);
    this.addAttribute('birdVertex', birdVertex);

    // this.addAttribute( 'normal', new Float32Array( points * 3 ), 3 );

    var v = 0;

    function verts_push() {
        for (var i = 0; i < arguments.length; i++) {
            vertices.array[v++] = arguments[i];
        }
    }

    for (var f = 0; f < BIRDS; f++) {
        // Body
        verts_push(0, -0, -20, 0, 4, -20, 0, 0, 30);
        // Left Wing
        verts_push(0, 0, -15, -WINGSPAN, 0, 0, 0, 0, 15);
        // Right Wing
        verts_push(0, 0, 15, WINGSPAN, 0, 0, 0, 0, -15);
    }

    for (var v = 0; v < triangles * 3; v++) {
        var i = ~~(v / 3);
        var x = (i % WIDTH) / WIDTH;
        var y = ~~(i / WIDTH) / WIDTH;

        // var c = new THREE.Color(0x444444 + (~~(v / 9) / BIRDS) * 0x666666);
        var c = new THREE.Color(0xff0000);

        birdColors.array[v * 3 + 0] = c.r;
        birdColors.array[v * 3 + 1] = c.g;
        birdColors.array[v * 3 + 2] = c.b;

        references.array[v * 2] = x;
        references.array[v * 2 + 1] = y;

        birdVertex.array[v] = v % 9;
    }

    // this.scale(0.2, 0.2, 0.2);
    this.scale(SCALE, SCALE, SCALE);
};

THREE.BirdGeometry.prototype = Object.create(THREE.BufferGeometry.prototype);

function initBirds() {
    var geometry = new THREE.BirdGeometry();

    // For Vertex and Fragment
    birdUniforms = {
        color: { value: new THREE.Color(0xffff00) },
        texturePosition: { value: null },
        textureVelocity: { value: null },
        time: { value: 1.0 },
        delta: { value: 0.0 }
    };

    // ShaderMaterial
    var material = new THREE.ShaderMaterial({
        uniforms: birdUniforms,
        vertexShader: document.getElementById('birdVS').textContent,
        fragmentShader: document.getElementById('birdFS').textContent,
        side: THREE.DoubleSide
    });

    var birdMesh = new THREE.Mesh(geometry, material);
    birdMesh.rotation.y = Math.PI / 2;
    birdMesh.matrixAutoUpdate = false;
    birdMesh.updateMatrix();

    scene.add(birdMesh);
}

function fillPositionTexture(texture) {
    var theArray = texture.image.data;

    for (var k = 0, kl = theArray.length; k < kl; k += 4) {
        var x = Math.random() * BOUNDS - BOUNDS_HALF;
        var y = Math.random() * BOUNDS - BOUNDS_HALF;
        var z = Math.random() * BOUNDS - BOUNDS_HALF;

        theArray[k + 0] = x;
        theArray[k + 1] = y;
        theArray[k + 2] = z;
        theArray[k + 3] = 1;
    }
}

function fillVelocityTexture(texture) {
    var theArray = texture.image.data;

    for (var k = 0, kl = theArray.length; k < kl; k += 4) {
        var x = Math.random() - 0.5;
        var y = Math.random() - 0.5;
        var z = Math.random() - 0.5;

        theArray[k + 0] = x * 10;
        theArray[k + 1] = y * 10;
        theArray[k + 2] = z * 10;
        theArray[k + 3] = 1;
    }
}

function initComputeRenderer() {
    gpuCompute = new GPUComputationRenderer(WIDTH, WIDTH, renderer);

    var dtPosition = gpuCompute.createTexture();
    var dtVelocity = gpuCompute.createTexture();
    fillPositionTexture(dtPosition);
    fillVelocityTexture(dtVelocity);

    velocityVariable = gpuCompute.addVariable('textureVelocity', document.getElementById('fragmentShaderVelocity').textContent, dtVelocity);
    positionVariable = gpuCompute.addVariable('texturePosition', document.getElementById('fragmentShaderPosition').textContent, dtPosition);

    gpuCompute.setVariableDependencies(velocityVariable, [positionVariable, velocityVariable]);
    gpuCompute.setVariableDependencies(positionVariable, [positionVariable, velocityVariable]);

    positionUniforms = positionVariable.material.uniforms;
    velocityUniforms = velocityVariable.material.uniforms;

    positionUniforms['time'] = { value: 0.0 };
    positionUniforms['delta'] = { value: 0.0 };
    velocityUniforms['time'] = { value: 1.0 };
    velocityUniforms['delta'] = { value: 0.0 };
    velocityUniforms['testing'] = { value: 1.0 };
    velocityUniforms['separationDistance'] = { value: 1.0 };
    velocityUniforms['alignmentDistance'] = { value: 1.0 };
    velocityUniforms['cohesionDistance'] = { value: 1.0 };
    velocityUniforms['freedomFactor'] = { value: 1.0 };
    velocityUniforms['predator'] = { value: new THREE.Vector3() };
    velocityVariable.material.defines.BOUNDS = BOUNDS.toFixed(2);

    velocityVariable.wrapS = THREE.RepeatWrapping;
    velocityVariable.wrapT = THREE.RepeatWrapping;
    positionVariable.wrapS = THREE.RepeatWrapping;
    positionVariable.wrapT = THREE.RepeatWrapping;

    var error = gpuCompute.init();
    if (error !== null) {
        console.error(error);
    }
}
