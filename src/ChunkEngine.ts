import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';


type BlockType = number; // 0 = air, 1 = dirt, 2 = grass


import EventEmitter from 'eventemitter3';
import { Generators } from './Generators';

type MyEvents = {
    'chunk:update': { from: string; to: string };
};

export class ChunkEngine extends EventEmitter<MyEvents> {



    chunkSize;
    world: Record<string, BlockType[][][]>
    scene;

    atlas;
    faces;
    uvs;

    types;
    generator;

    current;

    constructor(scene) {

        super();

        this.scene = scene;

        this.current = '0,0,0';

        this.chunkSize = 16;
        this.world = {};

        this.generator=new Generators(this);




    }



    getSquareNeighbourChunks(cx, cy, cz, distance) {

        let dist = typeof distance == 'number' ? distance : 1;

        const neighbours = [];

        for (let x = -dist; x <= dist; x++) {
            for (let y = -dist; y <= dist; y++) {
                for (let z = -dist; z <= dist; z++) {
                    neighbours.push({ key: `${cx + x},${cy + y},${z}`, cx: cx + x, cy: cy + y, cz: cz + z })
                }
            }
        }



        return neighbours.filter(({ cy }) => cy >= 0);

    }

    getRadialNeighbourChunks(cx_, cy_, cz_, distance) {

        const d2 = distance ** 2;
        const neighbours = this.getSquareNeighbourChunks(cx_, cy_, cz_, distance);
        return neighbours.filter(({ cx, cy, cz }) => Math.pow(cx - cx_, 2) + Math.pow(cy - cy_, 2) + Math.pow(cz - cz_, 2) < d2);
    }


    clickableMeshesNearby(pos) {

        const { cx, cy, cz } = this.fromWorld(pos);
        const neighbours = this.getSquareNeighbourChunks(cx, cy, cz, 1).filter(({ key }) => !!this.world[key]);
        return neighbours.map(({ key }) => this.world[key].mesh); //.concat(Object.values(this.world).map(c => c.water));

    }


    generateEmptyChunk() {

        return this.generator.generateEmptyChunk();

    }

    generateChunkXZ(cx: number, cz: number) {


        const chunk: BlockType[][][] = [];



        this.generator.raise(cx, cz, {
            height: 2,
            type: 'mantle'
        })
    
        

        this.generator.addPerlin(cx, cz, {
            seed:99,
            scale: 0.005,
            height: 20,
            type: 'stone'
        })


        for(let i=0; i<1;i++){
            this.generator.insetPerlin(cx, cz, {
                seed: 1*i,
                scale: 0.1,
                height: 10,
                sub: 4,
                type: 'gold'
            })

            this.generator.insetPerlin(cx, cz, {
                seed: 2*i,
                scale: 0.1,
                height: 10,
                sub: 5,
                type: 'diamond'
            })


            this.generator.insetPerlin(cx, cz, {
                seed: 3*i,
                scale: 0.1,
                height: 10,
                sub: 4,
                type: 'gem'
            })


            
        }

        this.generator.addPerlin(cx, cz, {
            seed:99,
            scale: 0.005,
            height: 20,
            sub:14,
            extrude:4,
            type: 'stone'
        })

        this.generator.addPerlin(cx, cz, {
            seed:99,
            scale: 0.005,
            height: 18,
            sub:15,
            extrude:2,
            type: 'stone'
        })

       

        this.generator.add(cx, cz, {
            height: (wy)=>{ 
                return wy<10?1:0; 
            }, 
            type: 'mantle'
        })

        this.generator.add(cx, cz, {
            height: (wy)=>{ 
                return wy>12?1:0; 
            }, 
            type: 'dirt'
        })

        this.generator.insetPerlin(cx, cz, {
                seed: 89,
                scale: 0.2,
                height: (wy)=>{ 
                    return wy<11?15:0; 
                }, 
                sub: 4,
                type: 'mantle'
            })

        // this.generator.raise(cx, cz, {
        //     height: 10,
        //     type: 'water'
        // })

        // this.generator.add(cx, cz, {
        //     height: (wy)=>{ 
        //         return 5/Math.max(1, wy/3); 
        //     }, 
        //     type: 'dirt'
        // })




        /*
       

        

        


        this.generator.addPerlin(cx, cz, {
            seed: 3,
            scale: 0.1,
            height: 10,
            sub: 4,
            type: 'wood'
        })


   

        this.generator.addPerlin(cx, cz, {
            height: 4,
            type: 'stone'
        })

        this.generator.raise(cx, cz, {
            height: 6,
            type: 'dirt'
        })


        this.generator.subPerlin(cx, cz, {
            height: 5,
            sub: 2,
            extrude: 8,
            invert: true
        })

        this.generator.raise(cx, cz, {
            height: 5,
            type: 'water'
        })







       

        this.generator.addPerlin(cx, cy, {

            scale: 0.1,
            height: 10,
            sub: 4,
            type: 9
        })
        */
        this.generator.setGrassTop(cx, cz);
    }




    buildChunkMesh(chunk: BlockType[][][], cx: number, cy: number, cz: number) {

        const key = `${cx},${cy},${cz}`;
        this.world[key] = chunk;

        this.updateChunkMesh(chunk);



        chunk.mesh.position.set(cx * this.chunkSize, cy * this.chunkSize, cz * this.chunkSize);
        chunk.water.position.copy(chunk.mesh.position);
        return chunk.mesh;



    }

    updateChunkMesh(chunk: BlockType[][][]) {

        const solidGeometries: THREE.BufferGeometry[] = [];
        const waterGeometries: THREE.BufferGeometry[] = [];

        for (let x = 0; x < this.chunkSize; x++) {
            for (let y = 0; y < this.chunkSize; y++) {
                for (let z = 0; z < this.chunkSize; z++) {
                    const type = chunk[x][y][z];
                    if (type !== 0) {
                        const geom = this.createTexturedBox(this.faces, this.uvs, type - 1)


                        geom.translate(x, y + 0.5, z);
                        if (type == 8 || type == 9) {
                            waterGeometries.push(geom)
                            if (type == 9) {
                                waterGeometries.push(geom.clone().scale(0.5, 0.5, 0.5))
                            }
                        } else {
                            solidGeometries.push(geom);
                        }
                    }
                }
            }
        }

        const solidMerged = solidGeometries.length > 0 ? mergeGeometries(solidGeometries, true) : (new THREE.BufferGeometry());
        const waterMerged = waterGeometries.length > 0 ? mergeGeometries(waterGeometries, true) : (new THREE.BufferGeometry());

        const material = new THREE.MeshStandardMaterial({
            map: this.atlas,
            transparent: true,
            color: 0xffffff,       // base color, usually white if you use a texture
            roughness: 0.5,        // controls glossiness (0 = shiny, 1 = matte)
            metalness: 0.1

            //  wireframe: true
        });



        const mesh = new THREE.Mesh(solidMerged, material);
        mesh.renderOrder = 0;
        const water = new THREE.Mesh(waterMerged, material);
        water.renderOrder = 1;
        water.depthWrite = false;
        mesh.castShadow = true;
        mesh.receiveShadow = true;

        water.castShadow = true;
        water.receiveShadow = true;

        this.scene.add(mesh);
        this.scene.add(water);
        if (chunk.mesh) {


            this.scene.remove(chunk.mesh);
            this.scene.remove(chunk.water);

            const oldMesh = chunk.mesh;
            mesh.position.copy(oldMesh.position);
            water.position.copy(mesh.position);

        }
        chunk.mesh = mesh;
        chunk.water = water;

        return mesh;

    }


    takeBlock(key, x: number, y: number, z: number, type: BlockType): number {

        if (this.getYNeighbourTypes(key, x, y, z).indexOf(8) >= 0) {
            return this.setBlock(key, x, y, z, 8)

        }
        return this.setBlock(key, x, y, z, 0)

    }

    getNeighboursXZ(key, x, z) {
        return [[x - 1, z], [x + 1, z], [x, z - 1], [x, z + 1]]
    }
    getYNeighbourTypes(key, x, y, z) {
        return this.getNeighboursXZ(key, x, z).map((n) => {
            return this.getBlock(key, n[0], y, n[1]);
        })
    }

    getBlock(key, x: number, y: number, z: number) {



        ({ key, x, y, z } = this.resolveBlock(key, x, y, z));


        const chunk = this.world[key];
        if (!chunk) {
            return 0;
        }

        return chunk[x][y][z];

    }

    fromKey(key) {
        const [cx, cy, cz] = key.split(',').map(c => parseInt(c));
        return {
            cx, cy, cz
        }
    }

    resolveBlock(key, x: number, y: number, z: number) {


        if (x < 0 || x >= this.chunkSize || y < 0 || y >= this.chunkSize || z < 0 || z >= this.chunkSize) {

            const { cx, cy, cz } = this.fromKey(key);
            ({ key, x, y, z } = this.fromWorldBlock(cx * this.chunkSize + x, cy * this.chunkSize + y, cz * this.chunkSize + z))

        }


        return {
            key: key,
            x: x,
            y: y,
            z: z,
        }

    }

    createBlock(key, x: number, y: number, z: number, type: BlockType): number {

        ({ key, x, y, z } = this.resolveBlock(key, x, y, z));

        const chunk = this.world[key];
        if (!chunk) {
            const { cx, cy, cz } = this.fromKey(key)
            this.buildChunkMesh(this.generateEmptyChunk(), cx, cy, cz);
        }


        return this.setBlock(key, x, y, z, type);

    }

    setBlock(key, x: number, y: number, z: number, type: BlockType): number {


        ({ key, x, y, z } = this.resolveBlock(key, x, y, z));

        const chunk = this.world[key];
        if (!chunk) {
            return 0;
        }
        const current = chunk[x][y][z];
        chunk[x][y][z] = type;

        this.updateChunkMesh(chunk);
        return current;
    }

    getTypeName(type:number) {

        if(type==0){
            return 'air';
        }
        return this.types[type-1]
    }
    getTypeId(name:string|number) {

        if(typeof name=='number'){
            return name;
        }

        if(name=='air'){
            return 0;
        }

        let index = this.types.indexOf(name);
        if (index >= 0) {
            index++; //air is 0
        }

        return index;
    }

    createTexturedBox(faces: string[], uvMap: Map<string, THREE.Vector4>, type: number) {
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


    renderStaticCubePreview(type:number, container) {
        // Set up scene
        const scene = new THREE.Scene();

        const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
        scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(2, 4, 3);
        scene.add(directionalLight);


        const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 10);
        camera.position.z = 3;

        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setSize(256, 256);
        container.appendChild(renderer.domElement);

        // Create cube
        const geometry = this.createTexturedBox(this.faces, this.uvs, type - 1);
        const material = new THREE.MeshStandardMaterial({
            map: this.atlas,
            transparent: true,
            color: 0xffffff,
            roughness: 0.5,
            metalness: 0.1

        });
        const cube = new THREE.Mesh(geometry, material);
        scene.add(cube);

        // Set preset rotation (example: isometric-style)
        cube.rotation.set(THREE.MathUtils.degToRad(35), THREE.MathUtils.degToRad(45), 0);

        // Render once
        renderer.render(scene, camera);
    }




    createTextureAtlas(texturePathSets: string[][], callback: (atlas: THREE.Texture, faces: Array<string>, uvs: Map<string, THREE.Vector4>) => void) {
        const images: HTMLImageElement[] = [];
        let loaded = 0;

        const totalImages = texturePathSets.length * 6;
        const countSets = texturePathSets.length;
        const countFaces = 6;

        texturePathSets.forEach((texturePaths) => {

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


        function buildAtlas() {
            const tileSize = 24; // assume square images
            const canvas = document.createElement('canvas');
            document.body.appendChild(canvas)
            canvas.id = 'mesh-atlas';
            canvas.width = tileSize * countSets;
            canvas.height = tileSize * countFaces

            const ctx = canvas.getContext('2d')!;
            const uvs = new Map<string, THREE.Vector4>();
            const faces: Array<string> = [];

            for (let index = 0; index < images.length; index++) {
                let i = index % countFaces;

                let j = Math.floor(index / countFaces);
                let setIndex = j;
                ctx.drawImage(images[index], j * tileSize, i * tileSize, tileSize, tileSize);

                if (index != 7) {
                    ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
                    ctx.lineWidth = 0.3;
                    let inset = 0.5;
                    ctx.strokeRect(j * tileSize + inset, i * tileSize + inset, tileSize - 2 * inset, tileSize - 2 * inset);
                }

                const v = i / countFaces;
                const faceId = `${setIndex}.${i}`;
                faces.push(faceId);
                uvs.set(faceId, new THREE.Vector4(setIndex / countSets, 1 - v - 1 / countFaces, (1 + setIndex) / countSets, 1 - v)); // (uMin, vMin, uMax, vMax)
            }

            const atlas = new THREE.CanvasTexture(canvas);
            atlas.magFilter = THREE.NearestFilter;
            atlas.minFilter = THREE.NearestMipMapNearestFilter;

            callback(atlas, faces, uvs);
        }
    }




    render() {



        const dirt = [
            '/textures/grass_side.png', // px
        ];

        const grass = [
            '/textures/grass_side.png', // px
            '/textures/grass_side.png', // nx
            '/textures/grass_top.png',  // py
        ];

        const stone = [
            '/textures/gravel_side.png', // px
        ];

        const mantle = [
            '/textures/compact_side.png', // px
        ];

        const diamond = [
            '/textures/diamond_side.png'
        ];

        const gold = [
            '/textures/gold_side.png'
        ];
        const gem = [
            '/textures/gem_side.png'
        ];
        const water = [
            '/textures/trans_side.png',
            '/textures/trans_side.png',
            '/textures/water_side.png'
        ];

        const leaves = [
            '/textures/leaves_side.png',
        ]

        const wood = [
            '/textures/trunk_side.png',
            '/textures/trunk_side.png',
            '/textures/trunk_top.png',
        ];

        const birtch = [
            '/textures/trunk_white_side.png',
            '/textures/trunk_white_side.png',
            '/textures/trunk_white_top.png',
        ];

        const player = [
            '/textures/player_back.png',
            '/textures/player_face.png',
            '/textures/player_top.png',
            '/textures/player_neck.png',
            '/textures/player_left.png',
            '/textures/player_right.png',
        ]




        const pathSets = { dirt, grass, stone, mantle, diamond, gold, gem, water, leaves, wood, birtch }
        this.types = Object.keys(pathSets);

        this.createTextureAtlas(Object.values(pathSets), (atlas: THREE.Texture, faces: Array<string>, uvs: Map<string, THREE.Vector4>) => {
            this.atlas = atlas;
            this.faces = faces;
            this.uvs = uvs;



            this.getRadialNeighbourChunks(0, 0, 0, 8).forEach(({ cx, cy, cz }) => {
                if (cy == 0) {
                    this.generateChunkXZ(cx, cz)
                    let key=`${cx},${cy},${cz}`;
                    while(this.world[key]){
                        this.buildChunkMesh(this.world[key], cx, cy, cz);
                        cy++;
                        key=`${cx},${cy},${cz}`;
                    }
                }
            });

            // this.on('chunk:update', ({ to }) => {
            //     const { cx, cy, cz } = this.fromKey(to)

            //     this.getRadialNeighbourChunks(cx, cy, cz, 10).forEach(({ key, cx, cy, cz }) => {
            //         if (cy == 0 && (!!this.world[key])) {
            //             this.buildChunkMesh(this.generateChunkXZ(cx, cz), cx, cy, cz);
            //         }
            //     });
            // })


        });



    }


    // world block are x,y,z coordinates of blocks if there were no chunks (or relative to 0,0,0 chunk)
    fromWorldBlock(worldX:number, worldY:number, worldZ:number):{key:string, cx:number, cy:number, cz:number, x:number, y:number, z:number} {

        const chunkSize = this.chunkSize;

        const cx = Math.floor(worldX / chunkSize);
        const cy = Math.floor(worldY / chunkSize);
        const cz = Math.floor(worldZ / chunkSize);

        const x = ((Math.floor(worldX) % chunkSize) + chunkSize) % chunkSize;
        const y = ((Math.floor(worldY) % chunkSize) + chunkSize) % chunkSize;
        const z = ((Math.floor(worldZ) % chunkSize) + chunkSize) % chunkSize;

        let key = `${cx},${cy},${cz}`;

        return {
            key: key,
            cx: cx,
            cy: cy,
            cz: cz,
            x: x,
            y: y,
            z: z
        }


    }

    getWorldGround(wx:number, wy:number, wz:number):number {

        let { key, cy, x, y, z } = this.fromWorldBlock(wx, wy, wz);

        if (typeof this.world[key] == 'undefined') {

            if (cy > 0) {
                return this.getWorldGround(wx, cy * this.chunkSize - 1, wz);
            }
            return 0;
        }

        while (y >= 0) {
            let type = this.world[key][x][y][z];
            if (!(type == 0 || type == 8 || type == 9)) {
                return cy * this.chunkSize + y;
            }
            y--;
        }

        if (cy > 0) {
            return this.getWorldGround(wx, cy * this.chunkSize - 1, wz);
        }



        return 0;
    }

    fromCamera(pos:{x:number,y:number,z:number}) {
        const location = this.fromWorld(pos);

        if (this.current !== location.key) {
            const from = this.current;
            const to = location.key;
            this.current = to;
            this.emit('chunk:update', { from, to })
        }

        return location;
    }

    fromWorld(pos:{x:number,y:number,z:number}) {


        const worldX = pos.x + 0.5;
        const worldY = pos.y;
        const worldZ = pos.z + 0.5;




        const { key, cx, cy, cz, x, y, z } = this.fromWorldBlock(worldX, worldY, worldZ)




        function pad(num: number): string {
            return num.toString().padStart(2, '0');
        }

        return {
            key: key,
            chunk: `${pad(cx)},${pad(cy)},${pad(cz)}`,
            block: `${pad(x)},${pad(y)},${pad(z)}`,
            cx: cx,
            cy: cy,
            cz: cz,
            x: x,
            y: y,
            z: z,
            g: this.getWorldGround(worldX, worldY, worldZ)
        }
    }

    save() {

        const blob = new Blob([JSON.stringify(this.world, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = 'world.json';
        a.click();

        URL.revokeObjectURL(url);

    }

}
