import {
  AgXToneMapping, DirectionalLight, HemisphereLight, MeshBasicMaterial,
  PerspectiveCamera, PMREMGenerator, Scene, Spherical, Vector3, WebGLRenderer
} from 'three';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {MeshoptDecoder} from 'three/addons/libs/meshopt_decoder.module.js';
import modelBytes from './laptop-perspective-assets/macbook-pro-m3.glb';

// Bounds of the rig's normalized Screen mesh. Its plane is tilted back 20 degrees.
const screenHalfHeight = .608234;
const screenHalfDepth = .221076;

async function mountOrbit(studio, project) {
  const holder = studio.$('[data-lp-orbit]');
  if (!holder || !project) return;
  const canvas = document.createElement('canvas');
  canvas.className = 'lp-orbit-canvas';
  canvas.hidden = true;
  canvas.tabIndex = 0;
  canvas.setAttribute('aria-label', studio.ui.lpOrbitLabel);
  canvas.setAttribute('aria-keyshortcuts', 'ArrowLeft ArrowRight ArrowUp ArrowDown Home');
  const gl = canvas.getContext('webgl2', {alpha: true, antialias: true});
  if (!gl) return;

  const reset = document.createElement('button');
  reset.type = 'button';
  reset.className = 'lp-orbit-reset';
  reset.title = studio.ui.lpOrbitReset;
  reset.setAttribute('aria-label', studio.ui.lpOrbitReset);
  reset.innerHTML = studio.icon('undo');
  reset.hidden = true;
  holder.append(canvas, reset);

  const renderer = new WebGLRenderer({canvas, context: gl, alpha: true, antialias: true});
  renderer.setPixelRatio(Math.min(Math.max(window.devicePixelRatio, 1.25), 1.6));
  renderer.toneMapping = AgXToneMapping;
  const scene = new Scene();
  const camera = new PerspectiveCamera(35, 1, .15, 40);
  const center = new Vector3(0, .68, -.18);
  const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
  const {scene: model} = await loader.parseAsync(modelBytes.buffer, '');
  const display = model.getObjectByName('Screen');
  if (!display?.isMesh) throw new Error('The MacBook model has no screen mesh.');
  display.material = new MeshBasicMaterial({color: 0x101217});
  model.scale.setScalar(.093);
  scene.add(model);
  scene.add(new HemisphereLight(0xf5f8ff, 0x616475, .95));
  const keyLight = new DirectionalLight(0xffffff, 2.25);
  keyLight.position.set(-3, 6, 4);
  scene.add(keyLight);
  const rim = new DirectionalLight(0xdce6ff, 1.25);
  rim.position.set(3, 3, -5);
  scene.add(rim);

  let environment;
  function lightEnvironment() {
    const room = new RoomEnvironment();
    const generator = new PMREMGenerator(renderer);
    environment?.dispose();
    environment = generator.fromScene(room, .04);
    scene.environment = environment.texture;
    scene.environmentIntensity = 1.1;
    room.dispose();
    generator.dispose();
  }
  lightEnvironment();

  const initial = {theta: .43, phi: 1.12};
  const orbit = new Spherical(7, initial.phi, initial.theta);
  const relative = new Vector3();
  const screenCenter = new Vector3();
  const normal = new Vector3();
  const worldPoint = new Vector3();
  const corners = [
    [-1, screenHalfHeight, -screenHalfDepth],
    [1, screenHalfHeight, -screenHalfDepth],
    [1, -screenHalfHeight, screenHalfDepth],
    [-1, -screenHalfHeight, screenHalfDepth]
  ];
  let frame = 0;
  let lost = false;
  let pointer = null;
  let lastWidth = 0;
  let lastHeight = 0;

  function draw() {
    frame = 0;
    const {width, height} = holder.getBoundingClientRect();
    if (lost || !width || !height) return;
    if (width !== lastWidth || height !== lastHeight) {
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      orbit.radius = 7.4 / Math.min(1, camera.aspect);
      lastWidth = width;
      lastHeight = height;
    }
    camera.position.setFromSpherical(orbit).add(center);
    camera.lookAt(center);
    renderer.render(scene, camera);
    display.localToWorld(screenCenter.set(0, 0, 0));
    normal.set(0, screenHalfDepth, screenHalfHeight).transformDirection(display.matrixWorld);
    relative.subVectors(camera.position, screenCenter).normalize();
    // Below the keyboard deck, leave the screen behind the opaque chassis.
    const facing = normal.dot(relative) > .055 && camera.position.y >= .10;
    canvas.dataset.screenVisible = String(facing);
    canvas.hidden = false;
    if (facing) {
      project(corners.map(([x, y, z]) => {
        display.localToWorld(worldPoint.set(x, y, z)).project(camera);
        return [(worldPoint.x + 1) * width / 2, (1 - worldPoint.y) * height / 2];
      }));
    }
    reset.hidden = false;
  }

  function refresh() {
    if (!frame && !lost) frame = requestAnimationFrame(draw);
  }

  function rotate(horizontal, vertical) {
    orbit.theta = (orbit.theta + horizontal) % (Math.PI * 2);
    orbit.phi = Math.max(.035, Math.min(Math.PI - .035, orbit.phi + vertical));
    refresh();
  }

  function resetView() {
    orbit.theta = initial.theta;
    orbit.phi = initial.phi;
    refresh();
  }

  canvas.addEventListener('pointerdown', event => {
    if (pointer || event.button !== 0) return;
    pointer = {id: event.pointerId, x: event.clientX, y: event.clientY};
    canvas.setPointerCapture(event.pointerId);
  });
  canvas.addEventListener('pointermove', event => {
    if (pointer?.id !== event.pointerId) return;
    const sensitivity = Math.PI * 2 / Math.max(200, holder.clientWidth);
    rotate((pointer.x - event.clientX) * sensitivity, (pointer.y - event.clientY) * sensitivity);
    pointer.x = event.clientX;
    pointer.y = event.clientY;
  });
  canvas.addEventListener('lostpointercapture', () => { pointer = null; });
  const keys = {ArrowLeft: [.18, 0], ArrowRight: [-.18, 0], ArrowUp: [0, -.18], ArrowDown: [0, .18]};
  canvas.addEventListener('keydown', event => {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    if (event.key === 'Home') resetView();
    else if (Object.hasOwn(keys, event.key)) rotate(...keys[event.key]);
    else return;
    event.preventDefault();
  });
  reset.addEventListener('click', resetView);
  canvas.addEventListener('webglcontextlost', event => {
    event.preventDefault();
    lost = true;
    canvas.hidden = true;
    reset.hidden = true;
    project(null);
  });
  canvas.addEventListener('webglcontextrestored', () => {
    lightEnvironment();
    lost = false;
    refresh();
  });
  new ResizeObserver(refresh).observe(holder);
  refresh();
}

if (window.LienzoStudio?.root.dataset.kind === 'laptop-perspective') {
  mountOrbit(window.LienzoStudio, window.LienzoLaptopProjection).catch(error => {
    console.warn('Lienzo laptop 3D preview is unavailable.', error);
  });
}
