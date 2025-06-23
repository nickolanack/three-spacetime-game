import * as THREE from 'three';

export class Chicken {

    constructor(scene) {

        const group = new THREE.Group();

        // Helper to create cube parts
        function makeCube(w, h, d, color, x, y, z) {
            const geom = new THREE.BoxGeometry(w, h, d);
            const mat = new THREE.MeshStandardMaterial({ color });
            const mesh = new THREE.Mesh(geom, mat);
            mesh.position.set(x, y, z);
            group.add(mesh);
        }

        // Body
        makeCube(0.6, 0.6, 1, 0xffffff, 0, 0.5, 0); // white body

        // Head
        makeCube(0.3, 0.3, 0.4, 0xffffff, 0, 1.0, .2); // white head

        // Beak
        makeCube(0.1, 0.1, 0.1, 0xffcc00, 0, 1.0, 0.4); // yellow beak

        // Eyes
        makeCube(0.1, 0.1, 0.1, 0x000000, -0.2, 1.4, 0.25); // left eye
        makeCube(0.1, 0.1, 0.1, 0x000000, 0.2, 1.4, 0.25); // right eye

        // Wings
        makeCube(0.1, 0.4, 0.4, 0xffffff, -0.55, 0.5, 0); // left wing
        makeCube(0.1, 0.4, 0.4, 0xffffff, 0.55, 0.5, 0);  // right wing

        // Legs
        makeCube(0.1, 0.3, 0.1, 0xff9900, -0.2, 0.15, 0); // left leg
        makeCube(0.1, 0.3, 0.1, 0xff9900, 0.2, 0.15, 0);  // right leg

        // Optional: Tail
        makeCube(0.3, 0.3, 0.1, 0xffffff, 0, 0.8, -0.55); // stubby tail
        group.position.set(-1, 0, -1)
        scene.add(group);
    }

}