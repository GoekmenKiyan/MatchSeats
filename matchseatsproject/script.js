import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

// Szene, Kamera und Renderer einrichten
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

const renderer = new THREE.WebGLRenderer({ antialias: false });
renderer.setPixelRatio(window.devicePixelRatio * 0.5);
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

// Draco-Loader initialisieren und Pfad zum Decoder angeben
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.7/');

// GLTFLoader initialisieren und DRACOLoader hinzufügen
const loader = new GLTFLoader();
loader.setDRACOLoader(dracoLoader);

// Sitzplatz-Liste und Originalfarben speichern
let seatMeshes = [];
const seatOriginalColors = {};

// GLTF-Modell laden (Stadion mit Sitzplätzen)
loader.load('assets/stadium.glb', function (gltf) {
    const stadium = gltf.scene;
    stadium.traverse((child) => {
        if (child.isMesh && child.name.startsWith("Sitz")) { // Nur Sitzplätze identifizieren
            seatMeshes.push(child); // Füge den Sitzplatz zur Liste hinzu

            // Speichere die Originalfarbe des Sitzplatzes
            seatOriginalColors[child.name] = child.material.color.clone();
        }
    });
    scene.add(stadium);
    render();
}, undefined, function (error) {
    console.error('Fehler beim Laden des Modells:', error);
});

// Raycaster und Maus-Position für Sitzplatz-Erkennung
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let selectedSeat = null;

// Klick-Event hinzufügen
window.addEventListener('click', onSeatClick, false);

function onSeatClick(event) {
    // Mausposition im normalen 3D-Koordinatensystem berechnen
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    // Raycaster aufsetzen und nur die Sitzplätze abfragen
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(seatMeshes, true);

    if (intersects.length > 0) {
        const clickedObject = intersects[0].object;

        // Überprüfen, ob der angeklickte Sitz bereits ausgewählt wurde
        if (selectedSeat !== clickedObject) {
            // Setze die Farbe des vorherigen Sitzes auf die Originalfarbe zurück
            if (selectedSeat) {
                selectedSeat.material.color.copy(seatOriginalColors[selectedSeat.name]);
            }

            // Neuen Sitz auswählen und farblich markieren
            selectedSeat = clickedObject;
            selectedSeat.material.color.set(0xff0000); // Rot für ausgewählten Sitz

            console.log('Sitzplatz ausgewählt:', selectedSeat.name || selectedSeat.id);
        } else {
            // Falls derselbe Sitz erneut angeklickt wird, Auswahl aufheben
            selectedSeat.material.color.copy(seatOriginalColors[selectedSeat.name]);
            selectedSeat = null;
        }
    }
}

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
