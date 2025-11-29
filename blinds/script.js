// Three.js scene variables
let scene, camera, renderer, terrain, sun, world, water, particles, morphingShapes;
let clock = new THREE.Clock();
let mouse = { x: 0, y: 0 };
let time = 0;

// Enhanced noise function with multiple octaves
function noise(x, z, time = 0) {
  return (
    Math.sin(x * 0.01 + time) * Math.cos(z * 0.01 + time) * 0.5 +
    Math.sin(x * 0.02 + time * 0.5) * Math.cos(z * 0.02 + time * 0.5) * 0.25 +
    Math.sin(x * 0.04 + time * 0.25) * Math.cos(z * 0.04 + time * 0.25) * 0.125 +
    Math.sin(x * 0.08 + time * 0.125) * Math.cos(z * 0.08 + time * 0.125) * 0.0625
  );
}

// Zach Lieberman-esque morphing function
function morphingNoise(x, z, time) {
  const scale1 = 0.02;
  const scale2 = 0.05;
  const scale3 = 0.1;

  const n1 = Math.sin(x * scale1 + time) * Math.cos(z * scale1 + time);
  const n2 = Math.sin(x * scale2 + time * 0.7) * Math.cos(z * scale2 + time * 0.7);
  const n3 = Math.sin(x * scale3 + time * 0.3) * Math.cos(z * scale3 + time * 0.3);

  return n1 * 0.5 + n2 * 0.3 + n3 * 0.2;
}

// Generate terrain height data with time-based animation
function generateTerrain(width, height, time = 0) {
  const data = [];
  for (let i = 0; i < width; i++) {
    for (let j = 0; j < height; j++) {
      const x = (i / width) * 200 - 100;
      const z = (j / height) * 200 - 100;
      const distance = Math.sqrt(x * x + z * z);
      const heightValue = morphingNoise(x, z, time) * (1 - distance / 100) * 80;
      data.push(Math.max(0, heightValue));
    }
  }
  return data;
}

// Initialize Three.js scene
function initThreeScene() {
  // Create scene with beautiful fog inspired by Glommen
  scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x00ffff, 0.0004);

  // Create camera
  camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 2000);
  camera.position.set(0, 150, 100);

  // Create renderer with enhanced settings
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;

  // Add renderer to DOM
  const threeContainer = document.createElement("div");
  threeContainer.id = "three-scene";
  threeContainer.appendChild(renderer.domElement);
  document.body.appendChild(threeContainer);

  // Add lighting
  addLighting();

  // Add terrain
  addTerrain();

  // Add water surface like Glommen
  addWater();

  // Add morphing shapes
  addMorphingShapes();

  // Add atmospheric elements
  addAtmosphere();

  // Start animation loop
  animate();
}

function addLighting() {
  // Ambient light with Glommen-inspired colors
  const ambientLight = new THREE.AmbientLight(0x00ffff, 0.4);
  scene.add(ambientLight);

  // Sun light with warm orange like Glommen
  const sunGeometry = new THREE.SphereGeometry(30, 20, 20);
  const sunMaterial = new THREE.MeshBasicMaterial({
    color: 0xff5300,
    transparent: true,
    opacity: 0.9,
  });
  sun = new THREE.Mesh(sunGeometry, sunMaterial);
  sun.add(new THREE.PointLight(0xff5300, 40, 2500));
  sun.position.set(200, 400, 200);
  scene.add(sun);

  // Additional point lights for dramatic effect
  const light1 = new THREE.PointLight(0x8800ff, 20, 1000);
  light1.position.set(-200, 200, -200);
  scene.add(light1);

  const light2 = new THREE.PointLight(0xff0000, 15, 800);
  light2.position.set(200, 100, -200);
  scene.add(light2);

  // Directional light for shadows
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);
  directionalLight.position.set(100, 300, 100);
  directionalLight.castShadow = true;
  directionalLight.shadow.mapSize.width = 2048;
  directionalLight.shadow.mapSize.height = 2048;
  scene.add(directionalLight);
}

function addTerrain() {
  const width = 200;
  const height = 200;
  const data = generateTerrain(width, height, time);

  // Create geometry
  const geometry = new THREE.PlaneGeometry(400, 400, width - 1, height - 1);
  geometry.rotateX(-Math.PI / 2);

  // Apply height data
  const vertices = geometry.attributes.position.array;
  for (let i = 0, j = 0; i < vertices.length; i += 3, j++) {
    vertices[i + 1] = data[j] || 0;
  }

  // Create material with enhanced colors inspired by your projects
  const material = new THREE.MeshPhongMaterial({
    vertexColors: true,
    side: THREE.DoubleSide,
    shininess: 100,
    specular: 0x222222,
  });

  // Add vertex colors with Glommen/Berg/Pilgrim inspired palette
  const colors = [];
  const colorAttribute = geometry.getAttribute("position");
  for (let i = 0; i < colorAttribute.count; i++) {
    const y = colorAttribute.getY(i);
    const normalizedHeight = Math.max(0, Math.min(1, y / 80));

    // Enhanced color gradient inspired by your projects
    let color = new THREE.Color();
    if (normalizedHeight < 0.15) {
      color.setHSL(0.6, 0.9, 0.2); // Deep ocean blue
    } else if (normalizedHeight < 0.3) {
      color.setHSL(0.7, 0.8, 0.4); // Purple depths
    } else if (normalizedHeight < 0.5) {
      color.setHSL(0.8, 0.7, 0.5); // Magenta
    } else if (normalizedHeight < 0.7) {
      color.setHSL(0.1, 0.8, 0.6); // Orange
    } else if (normalizedHeight < 0.85) {
      color.setHSL(0.05, 0.9, 0.7); // Yellow
    } else {
      color.setHSL(0.0, 0.0, 0.9); // White peaks
    }

    colors.push(color.r, color.g, color.b);
  }
  geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));

  terrain = new THREE.Mesh(geometry, material);
  terrain.receiveShadow = true;
  terrain.castShadow = true;
  scene.add(terrain);
}

// Add water surface like Glommen
function addWater() {
  const waterGeometry = new THREE.PlaneGeometry(2000, 2000, 128, 128);
  waterGeometry.rotateX(-Math.PI / 2);

  // Initialize water vertices
  for (let i = 0; i < waterGeometry.attributes.position.count; i++) {
    const y = waterGeometry.attributes.position.getY(i);
    waterGeometry.attributes.position.setY(i, 35 * Math.sin(i / 2));
  }

  waterGeometry.computeFaceNormals();
  waterGeometry.computeVertexNormals();

  const waterMaterial = new THREE.MeshBasicMaterial({
    color: 0x8800ff,
    transparent: true,
    opacity: 0.8,
    side: THREE.DoubleSide,
  });

  water = new THREE.Mesh(waterGeometry, waterMaterial);
  water.position.y = 20;
  scene.add(water);
}

// Add morphing shapes inspired by Zach Lieberman
function addMorphingShapes() {
  morphingShapes = [];

  for (let i = 0; i < 5; i++) {
    const geometry = new THREE.SphereGeometry(10, 16, 16);
    const material = new THREE.MeshPhongMaterial({
      color: new THREE.Color().setHSL(0.8 + i * 0.1, 0.8, 0.6),
      transparent: true,
      opacity: 0.7,
    });

    const shape = new THREE.Mesh(geometry, material);
    shape.position.set((Math.random() - 0.5) * 300, Math.random() * 100 + 50, (Math.random() - 0.5) * 300);

    morphingShapes.push(shape);
    scene.add(shape);
  }
}

function addAtmosphere() {
  // Add sky sphere with gradient
  const skyGeometry = new THREE.SphereGeometry(1500, 32, 32);
  const skyMaterial = new THREE.MeshBasicMaterial({
    color: 0x00ffff,
    side: THREE.BackSide,
    transparent: true,
    opacity: 0.8,
  });
  const sky = new THREE.Mesh(skyGeometry, skyMaterial);
  scene.add(sky);

  // Add floating particles with enhanced colors
  const particleCount = 200;
  const particles = new THREE.BufferGeometry();
  const positions = new Float32Array(particleCount * 3);
  const colors = new Float32Array(particleCount * 3);

  for (let i = 0; i < particleCount; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 600;
    positions[i * 3 + 1] = Math.random() * 300 + 50;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 600;

    // Color particles with vibrant colors
    const color = new THREE.Color().setHSL(Math.random(), 0.8, 0.7);
    colors[i * 3] = color.r;
    colors[i * 3 + 1] = color.g;
    colors[i * 3 + 2] = color.b;
  }

  particles.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  particles.setAttribute("color", new THREE.BufferAttribute(colors, 3));

  const particleMaterial = new THREE.PointsMaterial({
    size: 3,
    transparent: true,
    opacity: 0.8,
    vertexColors: true,
  });

  const particleSystem = new THREE.Points(particles, particleMaterial);
  scene.add(particleSystem);
}

function animate() {
  requestAnimationFrame(animate);

  const elapsedTime = clock.getElapsedTime();
  time = elapsedTime;

  // Animate sun with orbital motion like Glommen
  if (sun) {
    const angle = elapsedTime * 0.05;
    sun.position.x = Math.cos(angle) * 400;
    sun.position.y = 200 + 200 * Math.sin(angle * 0.5);
    sun.position.z = Math.sin(angle) * 400;
  }

  // Animate camera with smooth mouse following
  if (camera) {
    camera.position.x += (mouse.x * 100 - camera.position.x) * 0.02;
    camera.position.y += (150 + mouse.y * 50 - camera.position.y) * 0.02;
    camera.lookAt(0, 0, 0);
  }

  // Animate terrain with morphing
  if (terrain) {
    terrain.rotation.y = elapsedTime * 0.02;

    // Update terrain vertices for morphing effect
    const vertices = terrain.geometry.attributes.position.array;
    for (let i = 0; i < vertices.length; i += 3) {
      const x = vertices[i];
      const z = vertices[i + 2];
      vertices[i + 1] = morphingNoise(x, z, elapsedTime) * 80;
    }
    terrain.geometry.attributes.position.needsUpdate = true;
    terrain.geometry.computeVertexNormals();
  }

  // Animate water surface like Glommen
  if (water) {
    const vertices = water.geometry.attributes.position.array;
    for (let i = 0; i < vertices.length; i += 3) {
      vertices[i + 1] = 20 * Math.sin(i / 5 + elapsedTime + i / 7);
    }
    water.geometry.attributes.position.needsUpdate = true;
    water.geometry.computeVertexNormals();
  }

  // Animate morphing shapes with Zach Lieberman-esque transformations
  if (morphingShapes) {
    morphingShapes.forEach((shape, index) => {
      // Morphing scale
      const scale = 1 + Math.sin(elapsedTime * 2 + index) * 0.5;
      shape.scale.setScalar(scale);

      // Floating motion
      shape.position.y += Math.sin(elapsedTime * 0.5 + index) * 0.1;
      shape.position.x += Math.cos(elapsedTime * 0.3 + index) * 0.05;
      shape.position.z += Math.sin(elapsedTime * 0.4 + index) * 0.05;

      // Rotation
      shape.rotation.x = elapsedTime * 0.5 + index;
      shape.rotation.y = elapsedTime * 0.3 + index;
      shape.rotation.z = elapsedTime * 0.2 + index;

      // Color pulsing
      const hue = (0.8 + index * 0.1 + Math.sin(elapsedTime + index) * 0.1) % 1;
      shape.material.color.setHSL(hue, 0.8, 0.6);
    });
  }

  // Animate particles
  const particleSystem = scene.children.find((child) => child instanceof THREE.Points);
  if (particleSystem) {
    const positions = particleSystem.geometry.attributes.position.array;
    for (let i = 0; i < positions.length; i += 3) {
      positions[i + 1] += Math.sin(elapsedTime + i) * 0.1;
    }
    particleSystem.geometry.attributes.position.needsUpdate = true;
  }

  renderer.render(scene, camera);
}

// Venetian blinds interaction
document.addEventListener("DOMContentLoaded", function () {
  const blindsContainer = document.querySelector(".blinds-container");
  const blindSlabs = document.querySelectorAll(".blind-slab");

  // Initialize rotation and height
  let currentRotation = 0;
  let currentHeight = 100;

  // Mouse X position controls rotation (0 to 180 degrees)
  document.addEventListener("mousemove", function (e) {
    const mouseX = e.clientX;
    const windowWidth = window.innerWidth;
    const rotationPercent = (mouseX / windowWidth) * 100;
    currentRotation = (rotationPercent / 100) * 180;

    // Update global mouse for Three.js
    mouse.x = (e.clientX / windowWidth) * 2 - 1;
    mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

    // Apply rotation to all blind slabs
    blindSlabs.forEach((slab, index) => {
      slab.style.transform = `rotateX(${currentRotation}deg)`;

      // Add subtle shadow that responds to rotation
      const normalizedRotation = Math.abs(currentRotation);
      const shadowIntensity = Math.sin((normalizedRotation * Math.PI) / 90);
      const shadowBlur = 1 + shadowIntensity * 3;
      const shadowSpread = shadowIntensity * 2;
      const shadowOpacity = 0.05 + shadowIntensity * 0.1;

      // Shadow direction changes based on rotation
      const shadowX = Math.sin((currentRotation * Math.PI) / 90) * shadowSpread;
      const shadowY = Math.abs(Math.cos((currentRotation * Math.PI) / 90)) * shadowSpread;

      slab.style.boxShadow = `
        inset 0 1px 0 rgba(255, 255, 255, 0.3),
        inset 0 -1px 0 rgba(0, 0, 0, 0.1),
        ${shadowX}px ${shadowY}px ${shadowBlur}px rgba(0, 0, 0, ${shadowOpacity})
      `;
    });
  });

  // Scroll controls height
  document.addEventListener("wheel", function (e) {
    e.preventDefault();
    const scrollDelta = e.deltaY;
    const heightChange = scrollDelta * 0.5;
    currentHeight = Math.max(0, Math.min(100, currentHeight - heightChange));

    // Calculate the offset based on height percentage
    const maxOffset = window.innerHeight * 0.6;
    const heightOffset = -maxOffset * (1 - currentHeight / 100);

    blindsContainer.style.setProperty("--height-offset", `${heightOffset}px`);
    blindsContainer.classList.add("height-adjusted");
  });

  // Initialize blinds
  blindSlabs.forEach((slab, index) => {
    slab.style.transform = `rotateX(0deg)`;
  });

  // Initialize Three.js scene
  initThreeScene();
});

// Handle window resize
window.addEventListener("resize", function () {
  if (camera && renderer) {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }
});
