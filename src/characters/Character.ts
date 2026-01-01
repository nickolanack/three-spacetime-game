import * as THREE from 'three';
import { gsap } from 'gsap';
import type { CharacterController } from '../CharacterController';

import EventEmitter from 'eventemitter3';

type CharacterEvents = {
    'character:damage': { amount:number, health:number };
    'character:die': { };
    
};


export class Character  extends EventEmitter<CharacterEvents>  {
    object: any;
    name: string = "Character"

    groups: { [key: string]: any } = {};
    animations: (() => void)[] = [];


    lookingAt: any;
    isRunning: boolean = false;

    _idle:any

    controller: CharacterController;

    camera;
    renderer;

    health=100;

    randomAngle: number = 0;
    randomDist1: number = 0;
    randomDist2: number = 0;
    randomDist3: number = 0;

    constructor(camera, renderer) {
        super();
        const randomAngle = () => {
            const maxAngle = THREE.MathUtils.degToRad(30);
            this.randomAngle = THREE.MathUtils.randFloatSpread(maxAngle * 2); // random in [-maxAngle, +maxAngle]
            this.randomDist1 = 5 + (Math.random() * 4 - 2)
            this.randomDist2 = this.randomDist1 + 5 + (Math.random() * 10 - 3)
            this.randomDist3 = this.randomDist2 + 5 + (Math.random() * 10 - 3)
            setTimeout(randomAngle, Math.ceil(Math.random() * 5000));
        };

        randomAngle();

        this.camera = camera;
        this.renderer = renderer;



    }



    damage(x){
        this.health-=x;
        this.emit('character:damage', {amount:x, health:this.health});
        if(this.health<=0){
            this.health=0;
            this.die();
        }else{
            this.playSound('damage');
        }

        if(this.groups.health){
            this.groups.health.style.setProperty('--health',this.health+'%');
        }
    }

    die(){
        this.emit('character:die', {});
        this.playSound('die');
        this.removeLabel();
    }


    async playSound(clip:string){



        if(clip=='die'){
            const audio = new Audio('sounds/impactWood_heavy_000.ogg');
            audio.volume=0.5;
            audio.play();
            return
        }

        const audio = new Audio('sounds/impactPlate_light_003.ogg');
        audio.volume=0.2;
        audio.play();


    }
   

    animate(delta) {

        if (this.groups.label) {
            this.updateHtmlPosition(this.groups.label);
        }

        if (this.groups.head && this.lookingAt) {

            let d = this.distanceToXZ(this.lookingAt);

            if (d < this.randomDist3) {



                const camPos = new THREE.Vector3();
                this.lookingAt.getWorldPosition(camPos);

                this.turnToward(camPos, delta);
                this.groups.head.lookAt(camPos)


                if (d > this.randomDist1) {

                    if (d > this.randomDist2) {
                        this.controller.isRunning = true;
                    } else {
                        this.controller.isRunning = false;
                    }

                    if (this._idle) {
                        clearInterval(this._idle)
                        this._idle = null;
                    }

                    if (this.controller) {
                        this.controller.moveForward = true;
                    }
                    this.run();
                    return;
                }



            }

            if (this.controller) {
                this.controller.moveForward = false;
            }

            if (this._idle) {
                return
            }
            this._idle = setTimeout(() => {
                this._idle = null;
                this.idle();
            }, 200)
        }



    }


    turnToward(target, delta) {


        const dummy = new THREE.Vector3();
        this.object.getWorldPosition(dummy);

        // Compute direction on XZ plane
        const dx = target.x - dummy.x;
        const dz = target.z - dummy.z;

        // Compute angle in radians
        const angle = Math.atan2(dx, dz);

        // Set Y rotation
        this.object.rotation.y = angle;
        let speed = 0.0001

        function lerpAngle(a: number, b: number, t: number): number {
            const delta = ((b - a + Math.PI) % (Math.PI * 2)) - Math.PI;
            return a + delta * t;
        }
        this.object.rotation.y = lerpAngle(this.object.rotation.y, angle, speed * delta);

    }

    idle() {

        this.animations.forEach(kill => kill());
        this.animations = [];

    }

    run() {

        if (this.isRunning) {
            return;
        }

        this.isRunning = true;

        const proxy = { phase: 0 };

        let t = 0.4;
        const tweenA = gsap.to(proxy, {
            phase: Math.PI * 2,
            duration: t,
            repeat: -1,
            ease: "power1.inOut",
            onUpdate: () => {
                try {
                    this.groups.leftLeg.rotation.x = Math.sin(proxy.phase) * THREE.MathUtils.degToRad(30);
                    this.groups.leftArm.rotation.x = Math.sin(proxy.phase) * THREE.MathUtils.degToRad(20);
                } catch (e) {

                }
            }
        });


        const proxyB = { phase: 0 };
        const tweenB = gsap.to(proxyB, {
            phase: Math.PI * 2,
            duration: t,
            repeat: -1,
            ease: "power1.inOut",
            delay: t / 2,
            onUpdate: () => {
                try {
                    this.groups.rightLeg.rotation.x = Math.sin(proxyB.phase) * THREE.MathUtils.degToRad(30);
                    this.groups.rightArm.rotation.x = Math.sin(proxyB.phase) * THREE.MathUtils.degToRad(20);
                } catch (e) {

                }
            }
        })

        this.animations.push(() => {

            this.isRunning = false;
            tweenA.kill();
            tweenB.kill();
            try {
                this.groups.rightLeg.rotation.x = 0;
                this.groups.leftLeg.rotation.x = 0;
            } catch (e) {

            }
        });

    }

    lookAt(object) {
        setTimeout(() => {
            this.lookingAt = object
        }, 3000);
    }

    removeLabel(){
        if(this.groups.label){
            document.body.removeChild(this.groups.label);
            delete this.groups.label;
            delete this.groups.health;
            delete this.groups.target
        }   
    }

    createLabel() {

        const label = document.createElement('div');
        label.className = 'character label';
        label.style.position = 'absolute';
        label.style.color = 'white';
        label.style.pointerEvents = 'none';
        document.body.appendChild(label);

        this.groups.label = label;

        const health = document.createElement('span');
        health.className='health';
        // this.health= Math.round(Math.random()*100)
        health.style.setProperty('--health',this.health+'%');
        this.groups.health=health

        label.appendChild(health);

        const name = document.createElement('span');
        name.innerHTML = `${this.name}`
        label.appendChild(name);

        const target = document.createElement('span');
        this.groups.target=target
        label.appendChild(target);
    }


    updateHtmlPosition(htmlElement: HTMLElement) {
        const vector = new THREE.Vector3();
        this.object.getWorldPosition(vector); // get 3D position of object
        vector.y += .3;
        vector.project(this.camera); // project to normalized device coordinates (NDC)

        const widthHalf = this.renderer.domElement.clientWidth / 2;
        const heightHalf = this.renderer.domElement.clientHeight / 2;

        const x_ = vector.x * widthHalf + widthHalf;
        const y_ = -vector.y * heightHalf - heightHalf;

        htmlElement.style.transform = `translate(-50%, -50%) translate(${x_}px, ${y_}px)`;
        htmlElement.style.display = vector.z < 1 ? 'block' : 'none'; // hide if behind camera
        const { x, y, z } = this.object.position;

        this.groups.target.innerHTML = ` ${(this.lookingAt ? Math.round(this.distanceTo(this.lookingAt)) : '')}`

  
    }




    distanceTo(object) {

        const objectPos = new THREE.Vector3();
        const targetPos = new THREE.Vector3();

        // Get world positions
        this.object.getWorldPosition(objectPos);
        object.getWorldPosition(targetPos);

        return objectPos.distanceTo(targetPos);
    }

    distanceToXZ(object) {

        const objectPos = new THREE.Vector3();
        const targetPos = new THREE.Vector3();

        // Get world positions
        this.object.getWorldPosition(objectPos);
        object.getWorldPosition(targetPos);

        objectPos.y = 0;
        targetPos.y = 0;

        return objectPos.distanceTo(targetPos);
    }

    setController(controller: CharacterController) {
        this.controller = controller;
    }

    

}
