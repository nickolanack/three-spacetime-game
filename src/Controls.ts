import * as THREE from 'three';
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls.js';
export class Controls {

    controls: PointerLockControls;
    camera;
    scene;

    enabled = false;

    moveForward = false;
    moveBackward = false;
    moveLeft = false;
    moveRight = false;
    moveUp = false;
    moveDown = false;

    isCrouching = false;
    velocity = new THREE.Vector3();
    direction = new THREE.Vector3();

    velocityY = 0;
    isOnGround = true;

    lastSpaceTap = 0;
    isFlying = false;

    lastForwardTap = 0
    isRunning = false;
    isInLiquid = false;

    gravity = -30;
    jumpStrength = 10;
    playerHeight = 2;
    groundLevel = 0;


    speedDamp = 20.0;
    playerSpeed = 150.0;
    crouchSpeed = 10; // higher = faster crouch

    chunks;


    constructor(camera: THREE.PerspectiveCamera, scene: THREE.Scene, chunks) {
        this.camera = camera;
        this.scene = scene;
        this.chunks = chunks;

        this.controls = new PointerLockControls(camera, document.body);
        const instructions = document.getElementById('instructions');

        if (!instructions) {
            throw 'Failed to find instructions element';
        }

        instructions.addEventListener('click', () => {
            this.controls.lock();
        });

        this.controls.addEventListener('lock', () => {
            this.enabled = true;
            instructions.style.display = 'none';
        });
        this.controls.addEventListener('unlock', () => {
            this.enabled = false;
            instructions.style.display = 'flex';
        });

        let rot = 0
        this.controls.addEventListener('change', function () {
            let newRot = camera.rotation.y;
            // console.log(newRot - rot);
            let diff = newRot - rot;
            let right = 0;
            let left = 0;
            if (diff > 0) {
                right=Math.min(Math.floor(diff*50*800), 255);
            }
            if (diff < 0) {
                left=Math.min(Math.floor(-diff*50*800), 255);
            }
            let el=document.getElementById('mouse')
            el.style.cssText=`--left:${left}; --right:${right};`;
           

            rot = newRot;


        });



        scene.add(this.controls.object);









        const onKeyDown = (event) => {
            switch (event.code) {
                case 'ArrowUp':
                case 'KeyW':

                    document.getElementById('key-w').classList.add('selected');

                    this.moveForward = true;
                    const now = performance.now();
                    if (now - this.lastForwardTap < 150) { // Double tap detected (within 300ms)
                        this.isRunning = true;
                    }
                    break;
                case 'ArrowLeft':
                case 'KeyA':

                    document.getElementById('key-a').classList.add('selected');

                    this.moveLeft = true; break;
                case 'ArrowDown':
                case 'KeyS':

                    document.getElementById('key-s').classList.add('selected');

                    this.moveBackward = true; break;
                case 'ArrowRight':
                case 'KeyD':

                    document.getElementById('key-d').classList.add('selected');

                    this.moveRight = true; break;
                case 'ShiftLeft':

                    document.getElementById('key-shift').classList.add('selected');

                    this.isCrouching = true; break;
            }



            if (event.code === 'Space') {

                document.getElementById('key-space').classList.add('selected');

                const now = performance.now();
                if (now - this.lastSpaceTap < 300) { // Double tap detected (within 300ms)
                    this.isFlying = !this.isFlying;
                }

                if (this.isFlying) {
                    this.moveUp = true;
                } else {
                    this.moveUp = false;
                }
            }

            if (event.code === 'Space' && (this.isOnGround || this.isInLiquid)) {

                this.velocityY = this.jumpStrength;
                this.isOnGround = false;
            }
        };

        const onKeyUp = (event) => {
            switch (event.code) {
                case 'ArrowUp':
                case 'KeyW':

                    document.getElementById('key-w').classList.remove('selected');

                    this.moveForward = false;
                    const now = performance.now();
                    this.lastForwardTap = now;
                    this.isRunning = false;
                    break;
                case 'ArrowLeft':
                case 'KeyA':

                    document.getElementById('key-a').classList.remove('selected');

                    this.moveLeft = false; break;
                case 'ArrowDown':
                case 'KeyS':

                    document.getElementById('key-s').classList.remove('selected');

                    this.moveBackward = false; break;
                case 'ArrowRight':
                case 'KeyD':

                    document.getElementById('key-d').classList.remove('selected');

                    this.moveRight = false; break;
                case 'ShiftLeft':

                    document.getElementById('key-shift').classList.remove('selected');

                    this.isCrouching = false; break;
            }

            if (event.code === 'Space') {


                document.getElementById('key-space').classList.remove('selected');

                const now = performance.now();
                this.lastSpaceTap = now;
                this.moveUp = false;
            }
        };








        document.addEventListener('keydown', onKeyDown);
        document.addEventListener('keyup', onKeyUp);

    }





    animate(delta) {

       
        let speed = this.playerSpeed;
        if (this.isRunning) {
            speed = speed * 2;
        }
        if (this.isCrouching) {
            speed = speed / 2;
        }

        if (this.isInLiquid) {
            speed = this.playerSpeed / 3;
        }

        this.velocity.x -= this.velocity.x * this.speedDamp * delta;
        this.velocity.z -= this.velocity.z * this.speedDamp * delta;

        this.direction.z = Number(this.moveForward) - Number(this.moveBackward);
        this.direction.x = Number(this.moveRight) - Number(this.moveLeft);



        this.velocity.y -= this.velocity.y * this.speedDamp * delta;
        this.direction.y = Number(this.moveUp) - Number(this.moveDown);



        this.direction.normalize(); // this ensures consistent movement in all directions

        if (this.moveForward || this.moveBackward) {
            this.velocity.z -= this.direction.z * speed * delta;
        }
        if (this.moveLeft || this.moveRight) {
            this.velocity.x -= this.direction.x * speed * delta;
        }
        if (this.moveUp || this.moveDown) {
            this.velocity.y -= this.direction.y * speed * delta;
        }


        const last = [this.camera.position.x, this.camera.position.z];

        this.controls.moveRight(-this.velocity.x * delta);
        this.controls.moveForward(-this.velocity.z * delta);

        let { g, type } = this.chunks.fromWorld(this.camera.position);


        if (type == 'water' && (!this.isInLiquid) && (!this.isOnGround)) {
            this.velocityY = 0
        }

        this.isInLiquid = type == 'water';



        if (this.isOnGround && (!this.isFlying)) {
            let { g } = this.chunks.fromWorld(this.camera.position);

            const maxVert = this.isCrouching ? 0 : 1

            const vert = g - this.groundLevel;
            if (vert > maxVert) {
                this.camera.position.x = last[0];
                this.camera.position.z = last[1]

            }
            if (vert < -maxVert) {
                if (this.isCrouching) {

                } else {
                    this.isOnGround = false;
                }

            }
        }

        if (this.isFlying) {
            this.camera.position.y -= this.velocity.y * delta;
            return;
        }


        if (!this.isOnGround) {
            let gravity = this.gravity;
            if (this.isInLiquid && this.velocityY < 0) {
                gravity = gravity / 20;
            }
            this.velocityY += gravity * delta;



            this.camera.position.y += this.velocityY * delta;

            // Clamp to ground
            if (this.camera.position.y <= this.playerHeight + this.groundLevel) {
                this.camera.position.y = this.playerHeight + this.groundLevel;
                this.velocityY = 0;
                this.isOnGround = true;
            }
        }



        if (this.isOnGround) {
            const targetHeight = (this.isCrouching ? 1 : 2) + this.groundLevel;
            let currentHeight = this.camera.position.y; //+ this.groundLevel;
            if (this.camera.position.y != targetHeight) {
                currentHeight = THREE.MathUtils.lerp(currentHeight, targetHeight, this.crouchSpeed * delta);
                this.camera.position.y = currentHeight; //+ this.groundLevel;
            }
        }
    }


}
