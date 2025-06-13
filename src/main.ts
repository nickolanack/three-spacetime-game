import * as THREE from 'three';
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls';


import { ChunkEngine } from './chunks';

import * as Blockly from 'blockly';
import { toolbox } from './blockly/toolbox';

let camera, scene, renderer, controls;
let sun, skyUniforms;
let wireframe;
let moveForward = false, moveBackward = false, moveLeft = false, moveRight = false, crouch=false;
let velocity = new THREE.Vector3();
let direction = new THREE.Vector3();
let clock = new THREE.Clock();



const chunks=new ChunkEngine();

let pointerTarget;


const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2(0, 0); // center of screen


let velocityY = 0;
let isOnGround = true;

const gravity = -30;
const jumpStrength = 10;
const playerHeight = 2;
const groundLevel = 0;


let speedDamp=20.0;
let playerSpeed=200.0;
let crouchSpeed = 10; // higher = faster crouch

init();
animate();

function init() {
  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 1000);
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xaaaaaa);

  


  loadTextures();
  addSky();
  addSun();

  const light = new THREE.HemisphereLight(0xffffff, 0x444444);
  light.position.set(0, 200, 0);
  scene.add(light);

  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(2000, 2000),
    new THREE.MeshPhongMaterial({ color: 0x999999, depthWrite: false })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  const grid = new THREE.GridHelper(2000, 100, 0x000000, 0x000000);
  grid.material.opacity = 0.2;
  grid.material.linewidth = 2;
  grid.material.transparent = true;
  scene.add(grid);

  camera.position.y = 2;

  renderer = new THREE.WebGLRenderer();


  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  controls = new PointerLockControls(camera, document.body);
  const instructions = document.getElementById('instructions');
  instructions.addEventListener('click', () => {
    controls.lock();
  });

  controls.addEventListener('lock', () => {
    instructions.style.display = 'none';
  });
  controls.addEventListener('unlock', () => {
    instructions.style.display = 'flex';
  });

  scene.add(controls.getObject());

  const onKeyDown = function (event) {
    switch (event.code) {
      case 'ArrowUp':
      case 'KeyW': moveForward = true; break;
      case 'ArrowLeft':
      case 'KeyA': moveLeft = true; break;
      case 'ArrowDown':
      case 'KeyS': moveBackward = true; break;
      case 'ArrowRight':
      case 'KeyD': moveRight = true; break;
      case 'ShiftLeft': crouch = true; break;
    }

    if (event.code === 'Space' && isOnGround) {
      velocityY = jumpStrength;
      isOnGround = false;
    }
  };

  const onKeyUp = function (event) {
    switch (event.code) {
      case 'ArrowUp':
      case 'KeyW': moveForward = false; break;
      case 'ArrowLeft':
      case 'KeyA': moveLeft = false; break;
      case 'ArrowDown':
      case 'KeyS': moveBackward = false; break;
      case 'ArrowRight':
      case 'KeyD': moveRight = false; break;
      case 'ShiftLeft': crouch = false; break;
    }
  };



    
  const onClick =(event) => {
    if (event.button !== 0) return; // left click only

    if(pointerTarget){
       scene.remove(pointerTarget);
    }

   
  }

  document.addEventListener('mousedown', onClick);

  document.addEventListener('keydown', onKeyDown);
  document.addEventListener('keyup', onKeyUp);

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });


  addWireframe()
}

function animate() {
  requestAnimationFrame(animate);

  const delta = clock.getDelta();
  const speed = playerSpeed;

  velocity.x -= velocity.x * speedDamp * delta;
  velocity.z -= velocity.z * speedDamp * delta;

  direction.z = Number(moveForward) - Number(moveBackward);
  direction.x = Number(moveRight) - Number(moveLeft);
  direction.normalize(); // this ensures consistent movement in all directions

  if (moveForward || moveBackward) velocity.z -= direction.z * speed * delta;
  if (moveLeft || moveRight) velocity.x -= direction.x * speed * delta;

  controls.moveRight(-velocity.x * delta);
  controls.moveForward(-velocity.z * delta);

  
  if(!isOnGround){
    velocityY += gravity * delta;
    camera.position.y += velocityY * delta;

    // Clamp to ground
    if (camera.position.y <= playerHeight) {
      camera.position.y = playerHeight;
      velocityY = 0;
      isOnGround = true;
    }
  }

  

  if(isOnGround){
    const targetHeight = crouch?1:2;
    let currentHeight = camera.position.y;
    if(camera.position.y!=targetHeight){
      currentHeight = THREE.MathUtils.lerp(currentHeight, targetHeight, crouchSpeed * delta);
      camera.position.y = currentHeight;
    }
  }

  animateSky();
  // lookingAt()



  renderer.render(scene, camera);


   
}






function loadTextures(){
  // Load textures
  const loader = new THREE.TextureLoader();
  const paths = [
   '/textures/grass_side.png', // px
    '/textures/grass_side.png', // nx
    '/textures/grass_top.png',  // py
   '/textures/grass_side.png',  // ny
    '/textures/grass_side.png', // pz
    '/textures/grass_side.png', // nz
  ];
  // const textures = paths.map(p=>loader.load(p));
  // const grassMaterials = textures.map(texture => new THREE.MeshBasicMaterial({ map: texture }));
  
  addBlocks(paths);
}


function addBlocks(materials){

  chunks.buildChunkMesh(chunks.generateChunk(0,0,0), materials, scene);
  
}


function addSky(){
  skyUniforms = {
    topColor: { value: new THREE.Color(0x87ceeb) },    // Day sky
    bottomColor: { value: new THREE.Color(0xfdf6e3) }, // Day horizon
  };

  const skyMat = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    uniforms: skyUniforms,
    vertexShader: `
      varying vec3 vWorldPosition;
      void main() {
        vec4 worldPosition = modelMatrix * vec4(position, 1.0);
        vWorldPosition = worldPosition.xyz;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 topColor;
      uniform vec3 bottomColor;
      varying vec3 vWorldPosition;

      void main() {
        float h = normalize(vWorldPosition).y;
        vec3 color = mix(bottomColor, topColor, max(h, 0.0));
        gl_FragColor = vec4(color, 1.0);
      }
    `,
    depthWrite: false,
  });

  const sky = new THREE.Mesh(
    new THREE.SphereGeometry(500, 32, 15),
    skyMat
  );
  scene.add(sky);
}


function addSun(){

  sun = new THREE.DirectionalLight(0xffffff, 1.0);
  sun.position.set(100, 200, 100);
  scene.add(sun);
}


function animateSky(){

  const time = clock.getElapsedTime();
  const t = (Math.sin(time * 0.1) + 1) / 2; // oscillates between 0 and 1

  // Define day/night colors
  const dayTop = new THREE.Color(0x87ceeb);    // Sky blue
  const nightTop = new THREE.Color(0x00001a);  // Midnight blue
  const dayBottom = new THREE.Color(0xfdf6e3); // Warm horizon
  const nightBottom = new THREE.Color(0x000000); // Ground

  // Interpolate sky colors
  skyUniforms.topColor.value.lerpColors(nightTop, dayTop, t);
  skyUniforms.bottomColor.value.lerpColors(nightBottom, dayBottom, t);

  // Interpolate sun light color and intensity
  sun.intensity = THREE.MathUtils.lerp(0.2, 1.0, t);
  sun.color.lerpColors(new THREE.Color(0x444488), new THREE.Color(0xffffff), t);
}



function addWireframe(){
  const wireframeGeometry = new THREE.BoxGeometry(1.01, 1.01, 1.01);
  const wireframeMaterial = new THREE.LineBasicMaterial({ color: 0x00aa00 });
  wireframe = new THREE.LineSegments(
    new THREE.EdgesGeometry(wireframeGeometry),
    wireframeMaterial
  );
  wireframe.visible = false;
  scene.add(wireframe);
}


function lookingAt(){
  raycaster.setFromCamera(pointer, camera);
  const intersects = raycaster.intersectObjects(scene.children, false);

  // Assume your blocks are all added to scene directly.
  // You may want to use a group or filter only block objects by tag.

  let blockFound = false;

  for (const intersect of intersects) {
    const obj = intersect.object;
    
    if (obj.geometry instanceof THREE.BoxGeometry) {

      pointerTarget=obj

      wireframe.position.copy(obj.position);
      wireframe.visible = true;
      blockFound = true;
      break;
    }
  }

  if (!blockFound) {
    wireframe.visible = false;
    pointerTarget=null;
  }
}





const blocklyDiv = document.getElementById('blocklyDiv') as HTMLElement;

const workspace = Blockly.inject(blocklyDiv, {
  toolbox: toolbox as any,
  collapse: false,
  comments: true,
  disable: false,
  maxBlocks: Infinity,
  trashcan: true,
  horizontalLayout: false,
  toolboxPosition: 'start',
  css: true,
  media: 'https://unpkg.com/blockly/media/',
});