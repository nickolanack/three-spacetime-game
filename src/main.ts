import * as THREE from 'three';


import { ChunkEngine } from './ChunkEngine';
import { Controls } from './Controls';
import { Environment } from './Environment';
import { Item } from './Item';
import { Inventory } from './Inventory';

import * as Blockly from 'blockly';
import { toolbox } from './blockly/toolbox';

import { Characters } from './characters/Characters';
import { CharacterController } from './CharacterController';



import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { FXAAShader } from 'three/examples/jsm/shaders/FXAAShader.js';


let camera, scene, renderer, controls, composer, blueFadePass, bloomPass;
let wireframeTarget, wireframeDestination;

let clock = new THREE.Clock();



let chunks;
let inventory;
let environment;
let characters;

let pointerTarget, pointerDestination;


const onClick = (event) => {


  if (event.button == 0) {
     document.getElementById('button-left').classList.add('selected');
  }
  if (event.button == 2) {
     document.getElementById('button-right').classList.add('selected');
  }


  if(!controls.enabled){
    return;
  }


  

  if (event.button == 0) {
    if (pointerTarget) {
      const {key,  x, y, z, type} = chunks.fromWorld(pointerTarget)
      pointerTarget=null;
      if(type=='air'){
        throw 'Tried to take air!';
      }
      inventory.addItem(chunks.takeBlock(key, x, y, z))
    }
  }

  if (event.button == 2) {
    if (pointerDestination) {
      const loc = chunks.fromWorld(pointerDestination)

      const item = inventory.removeItem();
      if (item > 0) {
        chunks.createBlock(loc.key, loc.x, loc.y, loc.z, item)
      }

    }
  }

}

document.addEventListener('mousedown', onClick);
document.addEventListener('mouseup', (event)=>{
  if (event.button == 0) {
     document.getElementById('button-left').classList.remove('selected');
  }
  if (event.button == 2) {
     document.getElementById('button-right').classList.remove('selected');
  }
});

window.addEventListener('keydown', (e) => {
  const isCtrl = e.metaKey || e.ctrlKey

  if (isCtrl && e.key === 's') {
    e.preventDefault();
    chunks.save()
  }

  if (isCtrl && e.key === 'd') {
    e.preventDefault();
    chunks.reset()
  }
});


const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2(0, 0); // center of screen




init();
animate();

function init() {
  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.001, 1000);
  camera.focus = 2.0
  // const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.01, 1000);

  scene = new THREE.Scene();
  scene.fog = new THREE.Fog(
    0xcccccc, // Fog color
    50,       // Near distance (start fading)
    200       // Far distance (completely invisible)
  );
  scene.background = new THREE.Color(0xffffff);







  chunks = new ChunkEngine(scene);
  chunks.render();
  camera.position.set(-20, 13, -15)
  camera.rotation.set(
        0,
       1.1 * Math.PI,
        0
    );


  inventory = new Inventory(chunks);

  environment = new Environment(scene);
  environment.render();

  controls = new Controls(camera, scene, chunks);

  // new Item(scene, 'apple-gold.png', -0, 1, -1);
  // new Item(scene, 'apple.png', -1, 1, -1);
  // new Item(scene, 'grass.png', -2, 1, -1);
  // new Item(scene, 'seeds.png', -3, 1, -1, 2);
  // new Item(scene, 'glow.png', -4, 1, -1, 2);



  // new Chicken(scene);




  // const grid = new THREE.GridHelper(2000, 100, 0x000000, 0x000000);
  // grid.material.opacity = 0.2;
  // grid.material.linewidth = 2;
  // grid.material.transparent = true;
  // scene.add(grid);


  camera.position.set(-20, 13, -15)

  // camera.position.set({x:-16, y:26, z:-80})
  renderer = new THREE.WebGLRenderer();


   characters=[];

  let gnome=(new Characters(camera, renderer)).createCharacter('gnome')
  gnome.name='Timmy';
  gnome.object.position.set(-20, 13, -15)
  gnome.lookAt(camera);
  scene.add(gnome.object);

  characters.push(new CharacterController(gnome, chunks));

  gnome=(new Characters(camera, renderer)).createCharacter('gnome')
  gnome.name='Bob';
  gnome.object.position.set(-23, 13, -15)
  gnome.lookAt(camera);
  scene.add(gnome.object);

  characters.push(new CharacterController(gnome, chunks));

  gnome=(new Characters(camera, renderer)).createCharacter('gnome')
  gnome.name='Tommy';
  gnome.object.position.set(-27, 13, -13)
  gnome.lookAt(camera);
  scene.add(gnome.object);

  characters.push(new CharacterController(gnome, chunks));


  let golem=(new Characters(camera, renderer)).createCharacter('golem')
  golem.name='Giboej';
  golem.object.position.set(-27, 13, -10)
  golem.lookAt(camera);
  scene.add(golem.object);

  characters.push(new CharacterController(golem, chunks));



  composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));


 


  const blueFadeShader = {
    uniforms: {
      tDiffuse: { value: null },
      opacity: { value: 0.3 },
      color: { value: new THREE.Vector3(0.0, 0.5, 0.6) } // RGB blue-ish
    },
    vertexShader: `
        varying vec2 vUv;
        void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
        }
    `,
    fragmentShader: `
        uniform sampler2D tDiffuse;
        uniform float opacity;
        uniform vec3 color;
        varying vec2 vUv;
        void main() {
            vec4 tex = texture2D(tDiffuse, vUv);
            vec3 tinted = mix(tex.rgb, color, opacity);
            gl_FragColor = vec4(tinted, tex.a);
        }
    `
  };

  blueFadePass = new ShaderPass(blueFadeShader);
  composer.addPass(blueFadePass);



  bloomPass = new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    0.1, // strength
    0.5, // radius
    0.2  // threshold
  );
  composer.addPass(bloomPass);









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
  const delta=clock.getDelta();
  controls.animate(delta)
  characters.forEach(c=>c.animate(delta))
  environment.animate(clock, camera.position);

  
  lookingAt()


  const loc = chunks.fromCamera(camera.position);

  if (loc.type == 'water') {
    blueFadePass.enabled = true;
    bloomPass.enabled = true
  } else {
    blueFadePass.enabled = false;
    bloomPass.enabled = false
  }

  controls.groundLevel = loc.g;

  document.getElementById('debug-console').innerHTML = `chunk: ${loc.chunk} block: ${loc.block} [${loc.g}]<br/> 
    ${(Math.round((performance as any).memory.usedJSHeapSize*10/Math.pow(1024,2))/10)}MB ${Object.values(chunks.world).filter((c:{mesh:any})=>!!c.mesh).length}/${Object.values(chunks.world).length}`;



  // renderer.render(scene, camera);

  composer.render()



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






const dark=Blockly.Theme.defineTheme('dark', {
  name: 'dark',
  base: Blockly.Themes.Classic,
  componentStyles: {
    workspaceBackgroundColour: '#1e1e1e44',
    toolboxBackgroundColour: '#33333344',
    toolboxForegroundColour: '#fff',
    flyoutBackgroundColour: '#252526',
    flyoutForegroundColour: '#ccc',
    flyoutOpacity: 1,
    scrollbarColour: '#797979',
    insertionMarkerColour: '#fff',
    insertionMarkerOpacity: 0.3,
    scrollbarOpacity: 0.4,
    cursorColour: '#d0d0d0',
  },
});




const blocklyDiv = document.getElementById('blocklyDiv') as HTMLElement;

const workspace = Blockly.inject(blocklyDiv, {
  toolbox: toolbox as any,
  collapse: false,
  comments: true,
  disable: false,
  maxBlocks: Infinity,
  trashcan: false,
  horizontalLayout: false,
  toolboxPosition: 'start',
  css: true,
  media: 'https://unpkg.com/blockly/media/',
  theme: dark
});

document.getElementById('runButton').addEventListener('click', () => {
  const code = Blockly.JavaScript.workspaceToCode(workspace);
  console.log('Generated code:', code);
  try {
    eval(code); // ⚠️ Runs the code
  } catch (e) {
    console.error('Error running code:', e);
  }
});