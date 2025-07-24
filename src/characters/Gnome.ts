import * as THREE from 'three';
import { PixelMesh } from '../PixelMesh';
import { BlockAtlas } from '../BlockAtlas';

import { gsap } from 'gsap';
import type { CharacterController } from '../CharacterController';


export class Gnome {

    object;
    showWireFrame: boolean = false;
    groups: { [key: string]: any } = {};
    animations: (() => void)[] = [];

    name: string = "Gnome"

    lookingAt: any;
    isRunning: boolean = false;


    camera;
    renderer;
    controller: CharacterController;

    randomAngle: number = 0;
    randomDist1: number = 0;
    randomDist2: number = 0;
    randomDist3: number = 0;


    _idle:any

    constructor(camera, renderer) {


        const randomAngle = () => {
            const maxAngle = THREE.MathUtils.degToRad(30);
            this.randomAngle = THREE.MathUtils.randFloatSpread(maxAngle * 2); // random in [-maxAngle, +maxAngle]
            this.randomDist1 = 5 + (Math.random() * 4 - 2)
            this.randomDist2 = this.randomDist1+ 5 + (Math.random() * 10 - 3)
            this.randomDist3 = this.randomDist2 + 5 + (Math.random() * 10 - 3)
            setTimeout(randomAngle, Math.ceil(Math.random() * 5000));
        };

        randomAngle();


        this.name = `Gnome${Math.floor(Math.random() * 9999)}`

        this.camera = camera;
        this.renderer = renderer;

        const group = new THREE.Group();
        const groupOuter = new THREE.Group();


        const _add = (item: THREE.Mesh | THREE.Group, parent?: THREE.Group) => {
            if (typeof parent == "undefined") {
                parent = group;
            }
            if (this.showWireFrame) {
                const pivot = _createPivotDot();
                parent.add(pivot)
            }
            parent.add(item)
        }
        const _addGroup = (item: THREE.Mesh | THREE.Group, parent?: THREE.Group): THREE.Group => {
            if (typeof parent == "undefined") {
                parent = group;
            }

            const middle = new THREE.Group();
            middle.add(item);



            if (this.showWireFrame) {
                const pivot = _createPivotDot();
                middle.add(pivot);
            } else {

            }

            parent.add(middle)

            return middle;
        }

        const _createPivotDot = (color = 0xff00ff, radius = 0.1): THREE.LineSegments => {
            const geometry = new THREE.SphereGeometry(radius, 4, 4); // low-res sphere
            const wireframe = new THREE.WireframeGeometry(geometry);
            const material = new THREE.LineBasicMaterial({ color });
            return new THREE.LineSegments(wireframe, material);
        }


        const _centerZ = (item, group, s) => {
            item.position.z = s / 2
            group.position.z = -s / 2
        }

        const _centerX = (item, group, s) => {
            item.position.x = -s / 2
            group.position.x = s / 2
        }

        const _top = (item, group, h, offset?) => {
            item.position.y = -h + (offset ?? 0);
            group.position.y = h;
        }

        const _bottom = (item, group, offset?) => {

            item.position.y = 0 - (offset ?? 0);
            group.position.y = 0 + (offset ?? 0);

        }

        const _alignOffset = (a, b, offset) => {
            a.position.x = b.position.x + (offset.x ?? 0);
            a.position.y = b.position.y + (offset.y ?? 0);
            a.position.z = b.position.z + (offset.z ?? 0);
        }

        (async () => {

            let legHeight;
            let legCenterZ;
            let legCenterX;


            await (new PixelMesh()).createFromAsset('characters/Gnome/gnome_leg.png', 16, 32, 'auto').then(({ mesh: rightLeg, w, h, d }) => {

                const scale = 128

                rightLeg.scale.set(1 / 128, 1 / 128, 1 / 128);
                rightLeg.rotation.y = Math.PI / 2


                let w_ = d / scale;
                let d_ = w / scale;
                let h_ = h / scale


                const rightLegGroup = _addGroup(rightLeg)


                legHeight = h_ - w_ / 2;
                legCenterX = w_ + w_ / 4;
                legCenterZ = -d_ / 2;



                _top(rightLeg, rightLegGroup, h_, w_ / 4)
                _centerX(rightLeg, rightLegGroup, w_)
                _centerZ(rightLeg, rightLegGroup, d_)

                rightLegGroup.position.y -= w_ / 4;

                const leftLeg = rightLeg.clone();
                const leftLegGroup = _addGroup(leftLeg);

                _alignOffset(leftLegGroup, rightLegGroup, { x: w_ + w_ / 2 })




                this.groups.leftLeg = leftLegGroup;
                this.groups.rightLeg = rightLegGroup;




            });


            let bodyTop;
            let bodyWidth;

            await (new PixelMesh()).createFromAsset('characters/Gnome/gnome_body.png', 32, 32, 'auto').then(({ mesh: chest, w, h, d }) => {

                const scale = 96

                chest.scale.set(1 / scale, 1 / scale, 1 / scale);
                chest.rotation.y = Math.PI / 2

                let w_ = w / scale;
                let d_ = d / scale;
                let h_ = h / scale


                const chestGroup = _addGroup(chest)
                _centerX(chest, chestGroup, w_)
                _centerZ(chest, chestGroup, d_)
                _bottom(chest, chestGroup, w_ / 8)



                chestGroup.position.y = legHeight;
                chestGroup.position.z = legCenterZ;
                chestGroup.position.x = legCenterX;

                bodyTop = legHeight + h_ - w_ / 8
                bodyWidth = w_

                // chestGroup.rotation.y = Math.PI / 2

            });

            await (new PixelMesh()).createFromAsset('characters/Gnome/gnome_arm.png', 24, 32, 'auto').then(({ mesh: rightArm, w, h, d }) => {

                const scale = 256;
                rightArm.scale.set(1 / scale, 1 / scale, 1 / scale);
                rightArm.rotation.y = Math.PI / 2

                let w_ = d / scale;
                let d_ = w / scale;
                let h_ = h / scale


                const rightArmGroup = _addGroup(rightArm)

                _top(rightArm, rightArmGroup, h_, w_ / 4)
                _centerX(rightArm, rightArmGroup, w_)
                _centerZ(rightArm, rightArmGroup, d_)

                rightArmGroup.position.x -= w_;
                rightArmGroup.position.z = legCenterZ
                rightArmGroup.position.y = bodyTop - w_ / 2;

                const leftArm = rightArm.clone();
                const leftArmGroup = _addGroup(leftArm)

                _alignOffset(leftArmGroup, rightArmGroup, { x: bodyWidth + w_ / 2 })


                this.groups.leftArm = leftArmGroup;
                this.groups.rightArm = rightArmGroup;

            });



            let blockAtlas = new BlockAtlas({
                "gnome": [

                    "characters/Gnome/gnome_head_back.png",
                    "characters/Gnome/gnome_head_face.png",
                    "characters/Gnome/gnome_head_side.png",
                    "characters/Gnome/gnome_head_side.png",
                    "characters/Gnome/gnome_head_side.png",
                    "characters/Gnome/gnome_head_side2.png",
                ]
            });
            blockAtlas.onload(() => {

                const scale = 0.35
                const geom = blockAtlas.createTexturedBoxVariation('gnome', 1);
                const head = new THREE.Mesh(geom, blockAtlas.getMaterial());
                head.scale.set(scale, scale, scale)



                const headGroup = _addGroup(head);
                head.position.y = scale / 2;
                head.rotation.y = Math.PI / 2

                headGroup.position.y = bodyTop
                headGroup.position.z = legCenterZ
                headGroup.position.x = legCenterX

                this.groups.head = headGroup;

            });



            const label = document.createElement('div');
            label.className = 'label';
            label.style.position = 'absolute';
            label.style.color = 'white';
            label.style.pointerEvents = 'none';
            document.body.appendChild(label);

            this.groups.label = label;



        })();

        _add(group, groupOuter);

        group.position.set(-0.15, -1, -0.15)
        this.object = groupOuter;


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

                    if(d> this.randomDist2){
                        this.controller.isRunning=true;
                    }else{
                        this.controller.isRunning=false;
                    }

                    if(this._idle){
                        clearInterval(this._idle)
                        this._idle=null;
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
            
            if(this._idle){
                return
            }
            this._idle=setTimeout(()=>{
                this._idle=null;
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
        
        htmlElement.innerHTML = `${this.name} ${(this.lookingAt?Math.round(this.distanceTo(this.lookingAt)):'')}`
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

        objectPos.y=0;
        targetPos.y=0;

        return objectPos.distanceTo(targetPos);
    }

    setController(controller: CharacterController) {
        this.controller = controller;
    }



}