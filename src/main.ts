import * as THREE from 'three';


import { ChunkEngine } from './ChunkEngine';
import { Controls } from './Controls';
import { Environment } from './Environment';
import { Item } from './Item';
import { Inventory } from './Inventory';

import * as Blockly from 'blockly';
import { toolbox } from './blockly/toolbox';

let camera, scene, renderer, controls;
let wireframeTarget, wireframeDestination;

let clock = new THREE.Clock();



let chunks;
let inventory;
let environment;

let pointerTarget, pointerDestination;


const onClick = (event) => {
  if (event.button == 0) {
    if (pointerTarget) {
      const loc = chunks.fromWorld(pointerTarget)
      inventory.addItem(chunks.takeBlock(loc.key, loc.x, loc.y, loc.z))
    }
  }

  if (event.button == 2) {
    if (pointerDestination) {
      const loc = chunks.fromWorld(pointerDestination)

      const item=inventory.removeItem();
      if(item>0){
        chunks.createBlock(loc.key, loc.x, loc.y, loc.z, item)
      }
   
    }
  }

}

document.addEventListener('mousedown', onClick);

window.addEventListener('keydown', (e) => {
  const isMacShortcut = e.metaKey && e.key === 's';
  const isWinShortcut = e.ctrlKey && e.key === 's';

  if (isMacShortcut || isWinShortcut) {
    e.preventDefault();
    chunks.save()
  }
});


const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2(0, 0); // center of screen




init();
animate();

function init() {
  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.001, 1000);
  // const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.01, 1000);

  scene = new THREE.Scene();
  scene.fog = new THREE.Fog(
    0xcccccc, // Fog color
    30,       // Near distance (start fading)
    200       // Far distance (completely invisible)
  );
  scene.background = new THREE.Color(0xaaaaaa);

  chunks = new ChunkEngine(scene);
  chunks.render();
  
  inventory=new Inventory(chunks);

  environment = new Environment(scene);
  environment.render();

  controls = new Controls(camera, scene, chunks);

  new Item(scene, '/apple-gold.png', -0, 1, -1);
  new Item(scene, '/apple.png', -1, 1, -1);
  new Item(scene, '/grass.png', -2, 1, -1);
  new Item(scene, '/seeds.png', -3, 1, -1, 2);
  new Item(scene, '/glow.png', -4, 1, -1, 2);



  // new Chicken(scene);


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





  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });


  addWireframe()
}

function animate() {
  requestAnimationFrame(animate);

  controls.animate(clock)
  environment.animate(clock);

  try{
    lookingAt()
  }catch(e){

  }


  const loc = chunks.fromCamera(camera.position);
  controls.groundLevel = loc.g;
  document.getElementById('debug-console').innerHTML = `chunk: ${loc.chunk} block: ${loc.block} [${loc.g}]`;

  renderer.render(scene, camera);



}


function addWireframe() {
  const wireframeGeometry = new THREE.BoxGeometry(1.01, 1.01, 1.01);
  const wireframeMaterial = new THREE.LineBasicMaterial({ color: 0x000000 });
  wireframeTarget = new THREE.LineSegments(
    new THREE.EdgesGeometry(wireframeGeometry),
    wireframeMaterial
  );
  wireframeTarget.visible = false;
  scene.add(wireframeTarget);

  const wireframeMaterialDest = new THREE.LineBasicMaterial({ color: 0x22CC22 });
  wireframeDestination = new THREE.LineSegments(
    new THREE.EdgesGeometry(wireframeGeometry),
    wireframeMaterialDest
  );
  wireframeDestination.visible = false;
  scene.add(wireframeDestination);
}


function lookingAt() {
  raycaster.setFromCamera(pointer, camera);

  // Assuming you know which mesh holds the blocks:
  let intersects = raycaster.intersectObjects(chunks.clickableMeshesNearby(camera.position), false); // or scene.children if still scanning all

  intersects = intersects.filter(hit => hit.distance <= 10);

  if (intersects.length === 0) {
    wireframeTarget.visible = false;
    wireframeDestination.visible = false;
    pointerTarget = null;
    pointerDestination = null;
    return;
  }

  const hit = intersects[0];

  const hitPoint = hit.point;
  const faceNormal = hit.face?.normal ?? new THREE.Vector3();

  // Offset slightly into the block to avoid rounding errors on the face boundary
  const offset = faceNormal.clone().multiplyScalar(-0.5);
  const insidePoint = hitPoint.clone().add(offset);
  const outsidePoint = hitPoint.clone().sub(offset);

  // Compute block coordinates by flooring the insidePoint
  const blockPos = new THREE.Vector3(
    Math.floor(insidePoint.x + 0.5),
    Math.floor(insidePoint.y) + 0.5,
    Math.floor(insidePoint.z + 0.5)
  );

  const blockPosOutside = new THREE.Vector3(
    Math.floor(outsidePoint.x + 0.5),
    Math.floor(outsidePoint.y) + 0.5,
    Math.floor(outsidePoint.z + 0.5)
  );





  // Update your wireframe or highlighter cube
  wireframeTarget.position.copy(blockPos); //.addScalar(0.5); // center in block
  wireframeTarget.visible = true;

  wireframeDestination.position.copy(blockPosOutside); //.addScalar(0.5); // center in block
  wireframeDestination.visible = true;

  pointerTarget = blockPos;
  pointerDestination = blockPosOutside;
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