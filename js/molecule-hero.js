//done

const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;
  
const container = document.getElementById("molecule-canvas");

const scene = new THREE.Scene();

const molecule = new THREE.Group();
scene.add(molecule);

const camera = new THREE.PerspectiveCamera(
  45,
  container.clientWidth / container.clientHeight,
  0.1,
  100
);
camera.position.z = 6;

const renderer = new THREE.WebGLRenderer({
  alpha: true,
  antialias: true,
});
renderer.setSize(container.clientWidth, container.clientHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
container.appendChild(renderer.domElement);

scene.add(new THREE.AmbientLight(0xffffff, 0.6));

const keyLight = new THREE.DirectionalLight(0xffffff, 1);
keyLight.position.set(5, 5, 5);
scene.add(keyLight);

const atomMatO = new THREE.MeshStandardMaterial({ color: 0xff0d0d });
const atomMatH = new THREE.MeshStandardMaterial({ color: 0xffffff });
const bondMat  = new THREE.MeshStandardMaterial({ color: 0x6b7280 });

const atomGeoO = new THREE.SphereGeometry(0.5, 32, 32);
const atomGeoH = new THREE.SphereGeometry(0.25, 32, 32);
const bondGeo  = new THREE.CylinderGeometry(0.07, 0.07, 1.3, 16);

// Kislorod
const oxygen = new THREE.Mesh(atomGeoO, atomMatO);
molecule.add(oxygen);

// Vodorod
const h1 = new THREE.Mesh(atomGeoH, atomMatH);
const h2 = new THREE.Mesh(atomGeoH, atomMatH);

h1.position.set(-1, -0.6, 0);
h2.position.set(1, -0.6, 0);

molecule.add(h1, h2);

// vrskite
function bondBetween(a, b) {
  const bond = new THREE.Mesh(bondGeo, bondMat);
  bond.position.copy(a.position).lerp(b.position, 0.5);
  bond.lookAt(b.position);
  bond.rotateX(Math.PI / 2);
  molecule.add(bond);
}

bondBetween(oxygen, h1);
bondBetween(oxygen, h2);

//pogolema molekula
molecule.scale.set(1.5,1.5,1.5);

function animate() {
    requestAnimationFrame(animate);
  
    scene.rotation.y += 0.003;
    scene.rotation.x = Math.sin(Date.now() * 0.0005) * 0.05;
  
    renderer.render(scene, camera);
  }
  
  animate();
  window.addEventListener("resize", () => {
    const w = container.clientWidth;
    const h = container.clientHeight;
  
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  });
    
  if (!prefersReducedMotion) {
    animate();
  } else {
    renderer.render(scene, camera);
  }
  
