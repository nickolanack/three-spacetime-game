import * as THREE from 'three';
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls';
export class Controls {

    controls: PointerLockControls;
    camera;
    scene;

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
        this.chunks=chunks;

        this.controls = new PointerLockControls(camera, document.body);
        const instructions = document.getElementById('instructions');

        if (!instructions) {
            throw 'Failed to find instructions element';
        }

        instructions.addEventListener('click', () => {
            this.controls.lock();
        });

        this.controls.addEventListener('lock', () => {
            instructions.style.display = 'none';
        });
        this.controls.addEventListener('unlock', () => {
            instructions.style.display = 'flex';
        });


        scene.add(this.controls.getObject());









        const onKeyDown = (event) => {
            switch (event.code) {
                case 'ArrowUp':
                case 'KeyW':

                    this.moveForward = true;
                    const now = performance.now();
                    if (now - this.lastForwardTap < 150) { // Double tap detected (within 300ms)
                        this.isRunning = true;
                    }
                    break;
                case 'ArrowLeft':
                case 'KeyA': this.moveLeft = true; break;
                case 'ArrowDown':
                case 'KeyS': this.moveBackward = true; break;
                case 'ArrowRight':
                case 'KeyD': this.moveRight = true; break;
                case 'ShiftLeft': this.isCrouching = true; break;
            }



            if (event.code === 'Space') {
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

            if (event.code === 'Space' && this.isOnGround) {

                this.velocityY = this.jumpStrength;
                this.isOnGround = false;
            }
        };

        const onKeyUp = (event) => {
            switch (event.code) {
                case 'ArrowUp':
                case 'KeyW':
                    this.moveForward = false;
                    const now = performance.now();
                    this.lastForwardTap = now;
                    this.isRunning = false;
                    break;
                case 'ArrowLeft':
                case 'KeyA': this.moveLeft = false; break;
                case 'ArrowDown':
                case 'KeyS': this.moveBackward = false; break;
                case 'ArrowRight':
                case 'KeyD': this.moveRight = false; break;
                case 'ShiftLeft': this.isCrouching = false; break;
            }

            if (event.code === 'Space') {
                const now = performance.now();
                this.lastSpaceTap = now;
                this.moveUp = false;
            }
        };








        document.addEventListener('keydown', onKeyDown);
        document.addEventListener('keyup', onKeyUp);

    }





    animate(clock) {

        const delta = clock.getDelta();
        let speed = this.playerSpeed;
        if (this.isRunning) {
            speed = speed * 2;
        }
        if (this.isCrouching) {
            speed = speed / 2;
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


        const last=[this.camera.position.x, this.camera.position.z];

        this.controls.moveRight(-this.velocity.x * delta);
        this.controls.moveForward(-this.velocity.z * delta);

        if(this.isOnGround&&(!this.isFlying)){
            let {g} = this.chunks.fromWorld(this.camera.position);

            const maxVert=this.isCrouching?0:1

            const vert=g-this.groundLevel;
            if(vert>maxVert){
                console.log(vert)
                this.camera.position.x=last[0];
                this.camera.position.z=last[1]
                
            }
            if(vert<-maxVert){
                if(this.isCrouching){

                }else{
                    console.log(vert)
                    this.isOnGround=false;
                }
               
            }
        }

        // if (this.moveUp || this.moveDown) {
        //     // this.controls.moveUp(this.velocity.y * delta);
        //     console.log(`up: ${this.velocity.y * delta}`)

        // }

        if (this.isFlying) {
            this.camera.position.y -= this.velocity.y * delta;
            return;
        }


        if (!this.isOnGround) {
            this.velocityY += this.gravity * delta;
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
