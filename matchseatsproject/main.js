// main.js
import * as THREE from 'three';

// Szene und Kamera einrichten
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 30, 50);
camera.lookAt(0, 0, 0);

// Renderer einrichten
const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('stadiumCanvas') });
renderer.setSize(window.innerWidth, window.innerHeight);

// Tennisplatz hinzufügen (Boden)
const fieldGeometry = new THREE.PlaneGeometry(40, 20);  // Dimensionen des Tennisfelds
const fieldMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });  // Grüner Boden
const field = new THREE.Mesh(fieldGeometry, fieldMaterial);
field.rotation.x = -Math.PI / 2;  // Platz flach hinlegen
scene.add(field);

// Raycaster und Mausposition einrichten
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

// Sitzplatz-Geometrie und Material
const seatGeometry = new THREE.BoxGeometry(1, 1, 1);
const defaultSeatMaterial = new THREE.MeshBasicMaterial({ color: 0x0000ff });  // Blaue Sitzplätze
const selectedSeatMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 }); // Rote Sitzplätze (für Auswahl)

const seats = []; // Array zum Speichern aller Sitzplätze

// Sitzreihen erstellen (Boxen um das Spielfeld herum) mit Rotation
function createSeatRow(positionX, positionZ, rotationY = 0) {
    for (let i = -10; i <= 10; i += 2) {
        const seat = new THREE.Mesh(seatGeometry, defaultSeatMaterial.clone()); // Kopie des Materials
        seat.position.set(positionX + (rotationY === 0 ? i : 0), 0.5, positionZ + (rotationY !== 0 ? i : 0));
        seat.rotation.y = rotationY;
        seat.userData.isSelected = false; // Status des Sitzplatzes
        scene.add(seat);
        seats.push(seat); // Sitz zum Array hinzufügen
    }
}

// Sitzreihen um das Spielfeld herum platzieren
createSeatRow(0, -12);           // Vorderseite
createSeatRow(0, 12);            // Rückseite
createSeatRow(-22, 0, Math.PI / 2);  // Linke Seite
createSeatRow(22, 0, Math.PI / 2);   // Rechte Seite

// Punktlicht hinzufügen
const pointLight = new THREE.PointLight(0xffffff, 1);
pointLight.position.set(0, 50, 0);
scene.add(pointLight);

// Maus-Event-Listener hinzufügen
window.addEventListener('click', onMouseClick, false);

function onMouseClick(event) {
    // Mauskoordinaten auf Normalized Device Coordinates (NDC) umrechnen
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    // Raycaster aktualisieren
    raycaster.setFromCamera(mouse, camera);

    // Raycaster-Intersektionen mit Sitzplätzen prüfen
    const intersects = raycaster.intersectObjects(seats);

    if (intersects.length > 0) {
        const selectedSeat = intersects[0].object;

        // Sitzplatz auswählen oder abwählen
        if (selectedSeat.userData.isSelected) {
            selectedSeat.material = defaultSeatMaterial.clone(); // Rücksetzen auf Standardfarbe
            selectedSeat.userData.isSelected = false;
        } else {
            selectedSeat.material = selectedSeatMaterial.clone(); // Farbe auf "ausgewählt" ändern
            selectedSeat.userData.isSelected = true;
        }
    }
}

// Animationsschleife
function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}
animate();

// Anpassung bei Fenstergrößenänderung
window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
});
