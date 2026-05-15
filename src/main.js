import './style.css';
import * as THREE from 'three';

// 1. 建立場景
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xeeeeee);

// 2. 建立相機
const camera = new THREE.PerspectiveCamera(
  60,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);

camera.position.set(0, 0, 8);
camera.lookAt(0, 0, 0);

// 3. 建立 renderer
const renderer = new THREE.WebGLRenderer({
  antialias: true,
});

renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// 4. 畫座標軸，確認場景有東西
const axes = new THREE.AxesHelper(4);
scene.add(axes);

// 5. 控制點
const controlPoints = [
  new THREE.Vector3(-3, -1, 0),
  new THREE.Vector3(-2, 2, 0),
  new THREE.Vector3(0, -2, 0),
  new THREE.Vector3(2, 2, 0),
  new THREE.Vector3(3, -1, 0),
];

// 6. 畫控制多邊形
const polygonGeometry = new THREE.BufferGeometry().setFromPoints(controlPoints);
const polygonMaterial = new THREE.LineBasicMaterial({
  color: 0x333333,
});
const polygon = new THREE.Line(polygonGeometry, polygonMaterial);
scene.add(polygon);

// 7. 畫控制點
for (const p of controlPoints) {
  const pointGeometry = new THREE.SphereGeometry(0.1, 24, 24);
  const pointMaterial = new THREE.MeshBasicMaterial({
    color: 0xff0000,
  });

  const point = new THREE.Mesh(pointGeometry, pointMaterial);
  point.position.copy(p);
  scene.add(point);
}

// 8. 暫時用 Three.js 內建曲線測試
const curve = new THREE.CatmullRomCurve3(controlPoints);
const curvePoints = curve.getPoints(100);

const curveGeometry = new THREE.BufferGeometry().setFromPoints(curvePoints);
const curveMaterial = new THREE.LineBasicMaterial({
  color: 0x0066ff,
});
const curveLine = new THREE.Line(curveGeometry, curveMaterial);
scene.add(curveLine);

// 9. resize
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
});

// 10. render loop
function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}

animate();