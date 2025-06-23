import * as THREE from 'three';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';
export class Item {

    constructor(scene, asset:string, x:number, y:number, z:number, depth?:number) {

        if(typeof depth=='undefined'){
            depth=4;
        }

        const image = new Image();
        image.src = asset;
        image.onload = () => {
            const mask = this.getPixelMask(image);
            const geometry = this.createExtrudedGeometryFromMask(mask, depth);
            const material = new THREE.MeshStandardMaterial({
                vertexColors: true,
                roughness: 0.4,
                metalness: 0,
            });
            const mesh = new THREE.Mesh(geometry, material);
            scene.add(mesh);
            mesh.scale.set(1 / 64, 1 / 64, 1 / 64)
            mesh.position.set(x, y, z);

        };

    }


    getPixelMask(image: HTMLImageElement): boolean[][] {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d')!;
        canvas.width = image.width;
        canvas.height = image.height;
        ctx.drawImage(image, 0, 0);

        const imageData = ctx.getImageData(0, 0, image.width, image.height);
        const data = imageData.data;

        const mask: (THREE.Color|null)[][] = [];

        for (let y = 0; y < image.height; y++) {
            const row: (THREE.Color|null)[] = [];
            for (let x = 0; x < image.width; x++) {
                const index = (y * image.width + x) * 4;
                const alpha = data[index + 3]; // 0-255

                let color = null;
                if (alpha > 0) {
                    const r = data[index];
                    const g = data[index + 1];
                    const b = data[index + 2];
                    color = new THREE.Color(`rgb(${r}, ${g}, ${b})`);

                }



                row.push(alpha > 0 ? color : null);
            }
            mask.push(row);
        }

        return mask;
    }

    createExtrudedGeometryFromMask(mask: (THREE.Color|null)[][], depth = 1): THREE.BufferGeometry {
        const geometries: THREE.BufferGeometry[] = [];

        const h = mask.length;
        const w = mask[0].length;

        for (let y = 0; y < h; y++) {
            for (let x = 0; x < w; x++) {
                if (mask[y][x]) {
                    // Create a thin box for this pixel
                    const geom = new THREE.BoxGeometry(1, 1, depth);
                    const color=mask[y][x];
                    const colorAttr = new Float32Array(geom.attributes.position.count * 3);
                    for (let i = 0; i < colorAttr.length; i += 3) {
                        colorAttr[i] = color.r;
                        colorAttr[i + 1] = color.g;
                        colorAttr[i + 2] = color.b;
                    }
                    geom.setAttribute('color', new THREE.BufferAttribute(colorAttr, 3));
                  
                    // Position it
                    geom.translate(x + 0.5, h - y - 0.5, depth / 2); // shift to center of pixel, flip Y
                    geometries.push(geom);
                }
            }
        }

        return BufferGeometryUtils.mergeGeometries(geometries);
    }


}