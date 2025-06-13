import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

type BlockType = 0 | 1 | 2; // 0 = air, 1 = dirt, 2 = grass


export class ChunkEngine {

    chunkSize;
    world: Record<string, BlockType[][][]>

    constructor() {



        this.chunkSize = 32;
        this.world = {};









    }

    generateChunk(cx: number, cy: number, cz: number) {
        const key = `${cx},${cy},${cz}`;
        const chunk: BlockType[][][] = [];

        for (let x = 0; x < this.chunkSize; x++) {
            chunk[x] = [];
            for (let y = 0; y < this.chunkSize; y++) {
                chunk[x][y] = [];
                for (let z = 0; z < this.chunkSize; z++) {
                    const type = y === 0 ? 1 :  Math.round(Math.random()-(y/(this.chunkSize)))
                    let yy=y
                    if(type>0 && y>0){
                        
                        while(chunk[x][yy-1][z]==0){
                            yy--;
                        }

                        
                    }
                    chunk[x][yy][z] = type   // ground layer
                }
            }
        }

        this.world[key] = chunk;
        return chunk;
    }


    buildChunkMesh(chunk: BlockType[][][], textures:Array<string>, scene: THREE.Scene) {

        this.createTextureAtlas(textures, (atlas: THREE.Texture, faces: Array<string>, uvs: Map<string, THREE.Vector4>) => {


            const geometries: THREE.BufferGeometry[] = [];

            for (let x = 0; x < this.chunkSize; x++) {
                for (let y = 0; y < this.chunkSize; y++) {
                    for (let z = 0; z < this.chunkSize; z++) {
                        const type = chunk[x][y][z];
                        if (type !== 0) {
                            const geom = this.createTexturedBox(faces, uvs)


                            geom.translate(x, y + 0.5, z);
                            geometries.push(geom);
                        }
                    }
                }
            }

            const merged = mergeGeometries(geometries, true);

            const material = new THREE.MeshBasicMaterial({ map: atlas,

                color: 0xffffff,       // base color, usually white if you use a texture
                roughness: 0.5,        // controls glossiness (0 = shiny, 1 = matte)
                metalness: 0.1     

                //  wireframe: true
                 });



            const mesh = new THREE.Mesh(merged, material);

            mesh.castShadow = true;
            mesh.receiveShadow = true;

            scene.add(mesh);

        })

    }



    setBlock(cx: number, cy: number, cz: number, x: number, y: number, z: number, type: BlockType, scene: THREE.Scene) {
        const chunkKey = `${cx},${cy},${cz}`;
        const chunk = this.world[chunkKey];
        if (!chunk) return;

        chunk[x][y][z] = type;

        // Remove old mesh
        scene.remove(chunk.mesh);

        // Rebuild and replace
        const newMesh = buildChunkMesh(chunk, yourMaterial);
        chunk.mesh = newMesh;
        newMesh.position.set(cx * chunkSize, cy * chunkSize, cz * chunkSize);
        scene.add(newMesh);
    }

    createBox() {
        return new THREE.BoxGeometry(1, 1, 1);
    }

    createTexturedBox(faces: string[], uvMap: Map<string, THREE.Vector4>) {
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

        // for (let face = 0; face < 6; face++) {
        //     const texture = faces[face];
        //     const uvRect = uvMap.get(texture); // Vector4(uMin, vMin, uMax, vMax)
        //     if (!uvRect) continue;

        //     const uvIndex = face * 8;
        //     const [u0, v0, u1, v1] = [uvRect.x, uvRect.y, uvRect.z, uvRect.w];

        //     uvAttr.setXY(uvIndex + 0, u1, v1);
        //     uvAttr.setXY(uvIndex + 1, u0, v1);
        //     uvAttr.setXY(uvIndex + 2, u0, v0);
        //     uvAttr.setXY(uvIndex + 3, u1, v1);
        //     uvAttr.setXY(uvIndex + 4, u0, v0);
        //     uvAttr.setXY(uvIndex + 5, u1, v0);
        //     uvAttr.setXY(uvIndex + 6, u1, v1);
        //     uvAttr.setXY(uvIndex + 7, u1, v0);
        // }

        for (let face = 0; face < 6; face++) {
            const texture = faces[face];
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
        console.log(geom.getAttribute('uv').array);
        return geom;
    }

    createTextureAtlas(texturePaths: string[], callback: (atlas: THREE.Texture, faces: Array<string>, uvs: Map<string, THREE.Vector4>) => void) {
        const images: HTMLImageElement[] = [];
        let loaded = 0;

        for (let i = 0; i < texturePaths.length; i++) {
            const img = new Image();
            img.crossOrigin = '';
            img.src = texturePaths[i];
            img.onload = () => {
                loaded++;
                if (loaded === texturePaths.length) buildAtlas();
            };
            images.push(img);
        }

        function buildAtlas() {
            const tileSize = 24; // assume square images
            const canvas = document.createElement('canvas');
            document.body.appendChild(canvas)
            canvas.width = tileSize;
            canvas.height = tileSize * texturePaths.length;

            const ctx = canvas.getContext('2d')!;
            const uvs = new Map<string, THREE.Vector4>();
            const faces: Array<string> = [];

            for (let i = 0; i < images.length; i++) {
                ctx.drawImage(images[i], 0, i * tileSize, tileSize, tileSize);
                ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
          
                ctx.lineWidth = 0.5;
                ctx.strokeRect(0.5, i * tileSize + 0.5, tileSize - 1, tileSize - 1);
                const v = i / texturePaths.length;
                const face = `${texturePaths[i]}${i}`;
                faces.push(face);
                uvs.set(face, new THREE.Vector4(0, 1 - v - 1 / texturePaths.length, 1, 1 - v)); // (uMin, vMin, uMax, vMax)
            }

            const atlas = new THREE.CanvasTexture(canvas);
            atlas.magFilter = THREE.NearestFilter;
            atlas.minFilter = THREE.NearestMipMapNearestFilter;

            callback(atlas, faces, uvs);
        }
    }



}
