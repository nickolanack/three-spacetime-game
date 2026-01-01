import * as THREE from 'three';
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls.js';
export class CharacterController {

    character;
    object;

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
    isOnGround = false;

    lastSpaceTap = 0;
    isFlying = false;

    lastForwardTap = 0
    isRunning = false;
    isInLiquid = false;

    gravity = -30;
    jumpStrength = 10;
    playerHeight = 1;
    groundLevel = 0;


    speedDamp = 20.0;
    playerSpeed = 80.0;
    crouchSpeed = 10; // higher = faster crouch
    chunks;




    constructor(character: { object: THREE.PerspectiveCamera, setController?: (controller: CharacterController) => void }, chunks) {
        this.character = character;
        this.object = character.object;
        this.chunks = chunks;


        if (character.setController) {
            character.setController(this);
        }





    }





    animate(delta) {


        // return

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


        const last = [this.object.position.x, this.object.position.z];

        this._moveRight(-this.velocity.x * delta);
        this._moveForward(-this.velocity.z * delta);

        let { g, type } = this.chunks.fromWorld(this.object.position);
        this.groundLevel = g;

        if ((type == 'water' || type == 'lava') && (!this.isInLiquid) && (!this.isOnGround)) {
            this.velocityY = 0
        }

        this.isInLiquid = type == 'water' || type == 'lava';



        if (this.isOnGround && (!this.isFlying)) {
            let { g } = this.chunks.fromWorld(this.object.position);

            const maxVert = this.isCrouching ? 0 : 1

            const vert = g - this.groundLevel;
            if (vert > maxVert) {
                this.object.position.x = last[0];
                this.object.position.z = last[1]

            }
            if (vert < -maxVert) {
                if (this.isCrouching) {

                } else {
                    this.isOnGround = false;
                }

            }
        }


        if (this.character.animate) {
            this.character.animate(delta);
        }


        if (this.isFlying) {
            this.object.position.y -= this.velocity.y * delta;
            return;
        }


        if (!this.isOnGround) {
            let gravity = this.gravity;
            if (this.isInLiquid && this.velocityY < 0) {
                gravity = gravity / 20;
            }
            this.velocityY += gravity * delta;



            this.object.position.y += this.velocityY * delta;

            // Clamp to ground
            if (this.object.position.y <= this.playerHeight + this.groundLevel) {
                this.object.position.y = this.playerHeight + this.groundLevel;
                this.velocityY = 0;
                this.isOnGround = true;
            }
        }



        if (this.isOnGround) {
            const targetHeight = (this.isCrouching ? this.playerHeight / 2 : this.playerHeight) + this.groundLevel;
            let currentHeight = this.object.position.y; //+ this.groundLevel;
            if (this.object.position.y != targetHeight) {
                currentHeight = THREE.MathUtils.lerp(currentHeight, targetHeight, this.crouchSpeed * delta);
                this.object.position.y = currentHeight; //+ this.groundLevel;
            }
        }




    }




    _moveForward(distance: number) {
        const obj = this.object;
        const direction = new THREE.Vector3();
        obj.getWorldDirection(direction);


        // Get a random angle in radians (e.g. between -30° and +30°)

        // Rotate direction around Y-axis
        direction.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.character.randomAngle);
        obj.position.add(direction.multiplyScalar(distance));
    }

    _moveRight(distance: number) {
        const obj = this.object;
        const right = new THREE.Vector3();
        obj.getWorldDirection(right);
        right.crossVectors(obj.up, right).normalize(); // get right vector from up × forward
        obj.position.add(right.multiplyScalar(distance));
    }




}
