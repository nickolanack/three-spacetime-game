import * as THREE from 'three';
import { PixelMesh } from '../PixelMesh';
import { BlockAtlas } from '../BlockAtlas';
import { Character } from './Character';

export class Pumpkin extends Character {

    showWireFrame: boolean = false;

    constructor(camera, renderer) {

        super(camera, renderer)




        this.name = `Gnome${Math.floor(Math.random() * 9999)}`



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

                    "characters/Pumpkin/pumpkin_head_side.png",
                    "characters/Pumpkin/pumpkin_head_face.png",
                    "characters/Pumpkin/pumpkin_head_side.png",
                    "characters/Pumpkin/pumpkin_head_side.png",
                    "characters/Pumpkin/pumpkin_head_side.png",
                    "characters/Pumpkin/pumpkin_head_side.png",
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



            this.createLabel()



        })();

        _add(group, groupOuter);

        group.position.set(-0.15, -1, -0.15)
        this.object = groupOuter;
        this.object.name = 'pumpkin'


    }

    

}