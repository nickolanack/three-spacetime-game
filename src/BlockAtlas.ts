import * as THREE from 'three';
import EventEmitter from 'eventemitter3';

type MyEvents = {
    'loaded': { atlas: THREE.Texture, faces: Array<string>, uvs: Map<string, THREE.Vector4> };
};
export class BlockAtlas extends EventEmitter<MyEvents> {

    texturePathSets;
    types;

    atlas;
    faces;
    uvs;

    aliases: number[][] = [];

    constructor(pathSets: Record<string, string[]>) {
        super();
        this.texturePathSets = Object.values(pathSets);
        this.types = Object.keys(pathSets);

        this.types.forEach((name, i) => {
            this.aliases[i] = [];
            this.types.slice(i + 1).forEach((name_2, j) => {

                if (name_2.indexOf(name) === 0 && parseInt(name_2.split('_').pop()) > 1) {
                    this.aliases[i].push(i + j + 1);
                }
            })
        })


        this.createTextureAtlas();

    }

    onload(callback: (data: { atlas: THREE.Texture, faces: Array<string>, uvs: Map<string, THREE.Vector4> }) => void) {

        if (this.atlas) {
            callback({ atlas: this.atlas, faces: this.faces, uvs: this.uvs })
            return;
        }
        this.once('loaded', callback);
    }


    createTextureAtlas() {
        const images: HTMLImageElement[] = [];
        let loaded = 0;

        const totalImages = this.texturePathSets.length * 6;
        const countSets = this.texturePathSets.length;
        const countFaces = 6;

        let buildAtlas;

        this.texturePathSets.forEach((texturePaths) => {

            while (texturePaths.length < 6) {
                texturePaths.push(texturePaths[0]);
            }

            texturePaths.forEach((path) => {

                const img = new Image();
                img.crossOrigin = '';
                img.src = path;
                img.onload = () => {
                    loaded++;
                    if (loaded === totalImages) buildAtlas();
                };

                images.push(img);

            });


        });


        buildAtlas = () => {
            const tileSize = 48; // assume square images
            const canvas = document.createElement('canvas');
            //document.body.appendChild(canvas)

            const insetX = 1 / (tileSize * countSets);
            const insetY = 1 / (tileSize * countFaces);

            canvas.id = 'mesh-atlas';

            const padd = 10;

            const slotW = tileSize + 2*padd
            const slotH = tileSize + 2*padd

            const width = slotW * countSets;
            const height = slotH * countFaces;
            canvas.width = width;
            canvas.height = height;

            const ctx = canvas.getContext('2d')!;
            const uvs = new Map<string, THREE.Vector4>();
            const faces: Array<string> = [];


            for (let index = 0; index < images.length; index++) {
                let faceIndex = index % countFaces;


                let j = Math.floor(index / countFaces);
                let setIndex = j;

                let pj = padd * (1 + 2 * setIndex)
                let pi = padd * (1 + 2 * faceIndex)

                const x = setIndex * slotW + padd;
                const y = faceIndex * slotH + padd;

                ctx.drawImage(images[index], x, y, tileSize, tileSize);
                ctx.drawImage(images[index],
                    0, 0, tileSize, 1,        // take the first row of pixels
                    x, y - padd, tileSize, padd // draw it just above the tile
                );

                // --- Bottom edge
                ctx.drawImage(images[index],
                    0, tileSize - 1, tileSize, 1,    // last row
                    x, y + tileSize, tileSize, padd   // below the tile
                );

                // --- Left edge
                ctx.drawImage(images[index],
                    0, 0, 1, tileSize,     // first column
                    x - padd, y, padd, tileSize
                );

                // --- Right edge
                ctx.drawImage(images[index],
                    tileSize - 1, 0, 1, tileSize,    // last column
                    x + tileSize, y, padd, tileSize
                );

                // --- Corners (optional but cleaner for mipmaps)
                ctx.drawImage(images[index],
                    0, 0, 1, 1,
                    x - padd, y - padd, padd, padd // top-left
                );
                ctx.drawImage(images[index],
                    tileSize - 1, 0, 1, 1,
                    x + tileSize, y - padd, padd, padd // top-right
                );
                ctx.drawImage(images[index],
                    0, tileSize - 1, 1, 1,
                    x - padd, y + tileSize, padd, padd // bottom-left
                );
                ctx.drawImage(images[index],
                    tileSize - 1, tileSize - 1, 1, 1,
                    x + tileSize, y + tileSize, padd, padd // bottom-right
                );

                // if (j != this.getTypeId('water') - 1) {
                //     ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
                //     ctx.lineWidth = 1;
                //     let inset = 4;
                //     ctx.strokeRect(x+inset, y+inset, tileSize - 2 * inset, tileSize - 2 * inset);
                // }


                const faceId = `${setIndex}.${faceIndex}`;
                faces.push(faceId);

                const uMin = x / width;
                const uMax = (x + tileSize) / width;

                const vMin = 1 - (y + tileSize) / height;
                const vMax = 1 - y / height;

                uvs.set(faceId, new THREE.Vector4(uMin + insetX, vMin + insetY, uMax - insetX, vMax - insetY)); // (uMin, vMin, uMax, vMax)
            }

            const atlas = new THREE.CanvasTexture(canvas);
            atlas.magFilter = THREE.NearestFilter;
            atlas.minFilter = THREE.NearestMipMapNearestFilter;

            this.atlas = atlas;
            this.faces = faces;
            this.uvs = uvs;

            this.emit('loaded', { atlas, faces, uvs })


        }
    }

    getMaterial() {
        return new THREE.MeshStandardMaterial({
            map: this.atlas,
            transparent: true,
            color: 0xffffff,
            roughness: 0.5,  //  (0 = shiny, 1 = matte)
            metalness: 0.1
        });
    }


    getTypeName(type: number) {

        if (type == 0) {
            return 'air';
        }
        return this.types[type - 1]
    }
    getTypeId(name: string | number) {

        if (typeof name == 'number') {
            return name;
        }

        if (name == 'air') {
            return 0;
        }

        let index = this.types.indexOf(name);
        if (index >= 0) {
            index++; //air is 0
        }

        return index;
    }


    createTexturedBoxVariation(type: number | string, seed: number) {

        if (typeof type == 'string') {
            type = this.getTypeId(type);
        }

        if (typeof type != 'number') {
            throw 'Invalid';
        }

        type--; //faces are 0 indexed but externally we consider air as 0


        if (this.aliases[type].length > 0) {
            // console.log('has alias')
            let variant = [type].concat(this.aliases[type])[Math.floor(this._mulberry32(seed)() * (1 + this.aliases[type].length))];
            type = variant;
        }


        return this.createTexturedBox(type + 1)

    }
    createTexturedBox(type: number | string) {

        if (typeof type == 'string') {
            type = this.getTypeId(type);
        }

        if (typeof type != 'number') {
            throw 'Invalid';
        }

        type--; //faces are 0 indexed but externally we consider air as 0

        const faces = this.faces;
        const uvMap = this.uvs;
        const geom = new THREE.BoxGeometry(1, 1, 1);
        const uvAttr = geom.getAttribute('uv') as THREE.BufferAttribute;

        // 6 faces × 2 triangles × 3 vertices = 36 vertices, 12 uv coords per face (4 vertices * 2 coords)
        const faceVertexUvs = [
            0, // px
            1, // nx
            2, // py
            3, // ny
            4, // pz
            5  // nz
        ];

        for (let face = 0; face < 6; face++) {
            const texture = faces[face + type * 6];
            const uvRect = uvMap.get(texture); // Vector4(uMin, vMin, uMax, vMax)
            if (!uvRect) continue;

            const uvIndex = face * 4;
            const [u0, v0, u1, v1] = [uvRect.x, uvRect.y, uvRect.z, uvRect.w];

            // Match vertex order expected by BoxGeometry
            uvAttr.setXY(uvIndex + 1, u1, v1); // top-right
            uvAttr.setXY(uvIndex + 0, u0, v1); // top-left
            uvAttr.setXY(uvIndex + 2, u0, v0); // bottom-left
            uvAttr.setXY(uvIndex + 3, u1, v0); // bottom-right
        }
        // console.log(geom.getAttribute('uv').array);
        return geom;
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