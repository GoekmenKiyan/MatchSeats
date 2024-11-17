import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { gsap } from 'gsap'; // GSAP für Animationen einfügen

// Szene, Kamera und Renderer einrichten
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true });
renderer.setPixelRatio(window.devicePixelRatio * 0.6);
renderer.setSize(window.innerWidth, window.innerHeight);
document.getElementById('canvas-container').appendChild(renderer.domElement);

camera.position.set(0, 15, 30);
camera.lookAt(0, 0, 0);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.minDistance = 10;
controls.maxDistance = 50;

// Invertiere die Drehsteuerung
controls.rotateSpeed = -1.0;
controls.zoomSpeed = 1.0;

const ambientLight = new THREE.AmbientLight(0x404040, 8);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 3.5);
directionalLight.position.set(0, 10, 10);
scene.add(directionalLight);

const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.7/');

const loader = new GLTFLoader();
loader.setDRACOLoader(dracoLoader);

let seatMeshes = [];
const seatOriginalColors = {};
const seatStatus = {};
const seatPrice = 60; // Preis für jeden Sitzplatz in Euro


loader.load('/stadium.glb', function (gltf) {
    const stadium = gltf.scene;
    stadium.traverse((child) => {
        if (child.isMesh && child.name.startsWith("Sitz")) {
            seatMeshes.push(child);
            seatOriginalColors[child.name] = child.material.color.clone();
            seatStatus[child.name] = seatStatus[child.name] || 'available';
        }
    });
    scene.add(stadium);
    loadSeatStatus();
    applySeatStatus();
    render();
}, undefined, function (error) {
    console.error('Fehler beim Laden des Modells:', error);
});

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let selectedSeat = null;

const statusDisplay = document.getElementById('status-display');
const bookButton = document.getElementById('book-button');
const resetCameraButton = document.getElementById('reset-camera-button');
const deselectSeatButton = document.getElementById('deselect-seat-button');

// Buchungs-Button Event Listener
bookButton.addEventListener('click', () => {
    if (selectedSeat) {
        seatStatus[selectedSeat.name] = 'booked';
        selectedSeat.material.color.set(0x808080);
        saveSeatStatus();
        selectedSeat = null;
        updateStatusDisplay();
        alert(`Gesamtkosten: €${seatPrice}`); // Zeige Gesamtkosten für den aktuellen Sitz an
        moveCameraToDefault();
    } else {
        alert("Bitte einen Sitz auswählen, bevor du buchst!");
    }
});


// Event-Listener für Kamera zurücksetzen
resetCameraButton.addEventListener('click', () => {
    moveCameraToDefault();
});

// Event-Listener für Auswahl zurücksetzen
deselectSeatButton.addEventListener('click', () => {
    if (selectedSeat) {
        selectedSeat.material.color.copy(seatOriginalColors[selectedSeat.name]);
        selectedSeat = null;
        updateStatusDisplay();
    }
});

window.addEventListener('click', onSeatClick, false);

function onSeatClick(event) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(seatMeshes, true);

    if (intersects.length > 0) {
        const clickedObject = intersects[0].object;

        if (seatStatus[clickedObject.name] === 'booked') {
            alert('Dieser Sitzplatz ist bereits gebucht.');
            return;
        }

        if (selectedSeat && selectedSeat !== clickedObject) {
            selectedSeat.material.color.copy(seatOriginalColors[selectedSeat.name]);
        }

        selectedSeat = clickedObject;
        selectedSeat.material.color.set(0xff0000);
        moveCameraToSeat(selectedSeat);
        updateStatusDisplay();
    }
}

// Kamera-Bewegungsfunktion zur Sitzplatz-Position
function moveCameraToSeat(seat) {
    const seatPosition = seat.position.clone();

    const cameraTargetPosition = new THREE.Vector3(
        seatPosition.x,
        seatPosition.y + 2,
        seatPosition.z - 1.5
    );

    const lookAtTarget = new THREE.Vector3(0, 1, 0);

    gsap.to(camera.position, {
        duration: 1.5,
        x: cameraTargetPosition.x,
        y: cameraTargetPosition.y,
        z: cameraTargetPosition.z,
        ease: "power2.out",
        onUpdate: () => camera.lookAt(lookAtTarget),
        onComplete: () => lockCameraToSeat(seat)
    });
}

// Funktion, um die Kamera auf den Sitz zu "locken" und 360°-Rotation um den Sitz zu ermöglichen
function lockCameraToSeat(seat) {
    const adjustedTarget = new THREE.Vector3(seat.position.x, seat.position.y + 1, seat.position.z);

    controls.target.copy(adjustedTarget);
    controls.enablePan = false;
    controls.enableZoom = false;
    controls.minDistance = - 1;
    controls.maxDistance = 0.4;
    controls.update();
}

// Kamera zurück zur Standardposition mit sanfter Animation
function moveCameraToDefault() {
    const defaultPosition = new THREE.Vector3(0, 15, 30);
    const lookAtTarget = new THREE.Vector3(0, 0, 0);

    gsap.to(camera.position, {
        duration: 1.5,
        x: defaultPosition.x,
        y: defaultPosition.y,
        z: defaultPosition.z,
        ease: "power2.inOut",
        onUpdate: () => camera.lookAt(lookAtTarget),
        onComplete: () => unlockCamera()
    });
}

// Kamera-Einstellungen zurücksetzen
function unlockCamera() {
    controls.target.set(0, 0, 0);
    controls.enablePan = true;
    controls.enableZoom = true;
    controls.minDistance = 10;
    controls.maxDistance = 50;
    controls.update();
}

function updateStatusDisplay() {
    if (selectedSeat) {
        statusDisplay.textContent = `Ausgewählter Sitz: ${selectedSeat.name} | Preis: €${seatPrice}`;
    } else {
        statusDisplay.textContent = 'Ausgewählter Sitz: keiner';
    }
}


function saveSeatStatus() {
    localStorage.setItem('seatStatus', JSON.stringify(seatStatus));
}

function loadSeatStatus() {
    const savedStatus = localStorage.getItem('seatStatus');
    if (savedStatus) {
        const parsedStatus = JSON.parse(savedStatus);
        for (let seatName in parsedStatus) {
            seatStatus[seatName] = parsedStatus[seatName];
        }
    }
}

function applySeatStatus() {
    seatMeshes.forEach(seat => {
        const status = seatStatus[seat.name];
        if (status === 'booked') {
            seat.material.color.set(0x808080);
        } else {
            seat.material.color.copy(seatOriginalColors[seat.name]);
        }
    });
}

function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}

animate();

window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
});