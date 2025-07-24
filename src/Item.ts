import * as THREE from 'three';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { PixelMesh } from './PixelMesh';

export class Item {

    constructor(scene, asset: string, x: number, y: number, z: number, depth?: number, opt?: any) {

        if (typeof depth != 'number') {
            depth = 4;
        }

        if (typeof opt == 'undefined') {

            if (typeof depth == 'object') {
                opt = depth;
            } else {
                opt = {};
            }
        }


        (async () => {

            const {mesh} = await (new PixelMesh()).createFromAsset(asset, depth);
            const rand = this._mulberry32(parseInt(`${x}${y}${z}`));

            const scale = 2 + Math.floor(rand() * 3 - 1);

            mesh.scale.set(scale / 128, scale / 128, scale / 128)
            mesh.position.set(x, y, z);
            scene.add(mesh);


            const cloneCount = Math.floor(rand() * (opt.maxClones ?? 3)); // 0 to 3

            for (let i = 0; i < cloneCount; i++) {
                const clone = mesh.clone();

                // Optionally: clone the geometry if you need independent transforms
                clone.geometry = clone.geometry.clone();

                // Set position (e.g., same as original or slightly offset)
                clone.position.set(x + (rand() - 0.8), y, z + (rand() - 0.5)); // or add slight random offset if desired

                const scale = 2 + Math.floor(rand() * 3 - 1);
                clone.scale.set(scale / 128, scale / 128, scale / 128);

                clone.rotation.set(
                    0,
                    rand() * Math.PI * 2,
                    0
                );

                scene.add(clone);
            }

        })();


    }



    _mulberry32(a) {
        return function () {
            let t = a += 0x6D2B79F5;
            t = Math.imul(t ^ (t >>> 15), t | 1);
            t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
            return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
        }
    }


}