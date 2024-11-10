import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

// Szene, Kamera und Renderer einrichten
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

// Angepasster Renderer für bessere Performance
const renderer = new THREE.WebGLRenderer({ antialias: false }); // Antialiasing deaktiviert für bessere Leistung
renderer.setPixelRatio(window.devicePixelRatio * 0.5); // Reduzierte Renderauflösung
renderer.setSize(window.innerWidth, window.innerHeight);
document.getElementById('canvas-container').appendChild(renderer.domElement);

// Kamera-Position
camera.position.set(0, 15, 30);
camera.lookAt(0, 0, 0);

// OrbitControls für Kameranavigation
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.minDistance = 10;
controls.maxDistance = 50;

// Licht hinzufügen
const ambientLight = new THREE.AmbientLight(0x404040, 2);
scene.add(ambientLight);
const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(0, 10, 10);
scene.add(directionalLight);

// DRACOLoader initialisieren und Pfad zum Decoder angeben
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.7/'); // Pfad zu den Draco-Decoder-Dateien

// GLTFLoader initialisieren und DRACOLoader hinzufügen
const loader = new GLTFLoader();
loader.setDRACOLoader(dracoLoader);

// Draco-komprimiertes GLB-Modell laden
loader.load('assets/stadium.glb', function (gltf) {
    scene.add(gltf.scene);
    renderer.render(scene, camera);
}, undefined, function (error) {
    console.error('Fehler beim Laden des Modells:', error);
});

// Animationsfunktion
function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}

animate();

// Fenstergröße dynamisch anpassen
window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
});
