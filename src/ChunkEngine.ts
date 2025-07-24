import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { Item } from './Item';
import { BlockAtlas } from './BlockAtlas';
import { ChunkDB } from './ChuckDB';

type BlockType = number; // 0 = air, 1 = dirt, 2 = grass


import BlockFaces from './blocks.json';


type Chunk = number[][][] & {
    mesh?: THREE.Mesh;
    water?: THREE.Mesh;
    leaves?: THREE.Mesh;
    assets?: THREE.Group;
    key?: string,
    features?: boolean
    _throttle?: any
};


import { Generators } from './Generators';

import EventEmitter from 'eventemitter3';
import { ChunkLoader } from './ChunkLoader';
type MyEvents = {
    'activechunk:update': { from: string; to: string };
};

export class ChunkEngine extends EventEmitter<MyEvents> {



    chunkSize;


    world: Record<string, Chunk>

    scene;

    blockAtlas;


    //deprecated
    atlas;
    faces;
    uvs;

    types;


    generator;
    database;


    current;

    constructor(scene) {

        super();

        this.scene = scene;

        this.current = '0,0,0';

        this.chunkSize = 16;
        this.world = {};


        this.generator = new Generators(this);
        this.database = new ChunkDB();

       

    }

    mulberry32(a) {
        return function () {
            let t = a += 0x6D2B79F5;
            t = Math.imul(t ^ (t >>> 15), t | 1);
            t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
            return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
        }
    }



    getSquareNeighbourChunks(cx: number, cy: number, cz: number, distance: number) {

        let dist = typeof distance == 'number' ? distance : 1;
        dist = Math.ceil(dist);
        const neighbours = [];

        for (let x = -dist; x <= dist; x++) {
            for (let y = -dist; y <= dist; y++) {
                for (let z = -dist; z <= dist; z++) {
                    neighbours.push({ key: `${cx + x},${cy + y},${cz + z}`, cx: cx + x, cy: cy + y, cz: cz + z })
                }
            }
        }



        return neighbours.filter(({ cy }) => cy >= 0);

    }

    getSquareOutsideChunks(cx: number, cy: number, cz: number, distance: number) {

        throw 'Not implemented'

    }
    getSquareNeighbourBlocks(wx: number, wy: number, wz: number, distance: number) {

        let dist = typeof distance == 'number' ? distance : 1;
        dist = Math.ceil(dist);
        const neighbours = [];

        for (let x = -dist; x <= dist; x++) {
            for (let y = -dist; y <= dist; y++) {
                for (let z = -dist; z <= dist; z++) {
                    neighbours.push({ wx: wx + x, wy: wy + y, wz: wz + z })
                }
            }
        }



        return neighbours;

    }

    getRadialNeighbourChunks(cx_: number, cy_: number, cz_: number, distance: number) {

        const d2 = distance ** 2;
        const neighbours = this.getSquareNeighbourChunks(cx_, cy_, cz_, distance);
        return neighbours.filter(({ cx, cy, cz }) => Math.pow(cx - cx_, 2) + Math.pow(cy - cy_, 2) + Math.pow(cz - cz_, 2) <= d2);
    }

    getRadialOutsideChunks(cx_: number, cy_: number, cz_: number, distance: number) {

        const d2 = distance ** 2;
        return Object.keys(this.world).map(key => {
            const { cx, cy, cz } = this.fromKey(key);
            return { key, cx, cy, cz };
        }).filter(({ cx, cy, cz }) => Math.pow(cx - cx_, 2) + Math.pow(cy - cy_, 2) + Math.pow(cz - cz_, 2) > d2);
    }

    getRadialNeighbourBlocks(wx_: number, wy_: number, wz_: number, distance: number) {

        const d2 = distance ** 2;
        const neighbours = this.getSquareNeighbourBlocks(wx_, wy_, wz_, distance);
        return neighbours.filter(({ wx, wy, wz }) => Math.pow(wx - wx_, 2) + Math.pow(wy - wy_, 2) + Math.pow(wz - wz_, 2) <= d2);
    }


    clickableMeshesNearby(pos) {

        const { cx, cy, cz } = this.fromWorld(pos);
        const neighbours = this.getSquareNeighbourChunks(cx, cy, cz, 1.5).filter(({ key }) => !!this.world[key]);
        return neighbours.map(({ key }) => {
            return this.world[key].mesh
        }).filter(mesh => !!mesh).concat(neighbours.map(({ key }) => {
            return this.world[key].leaves
        }).filter(mesh => !!mesh));

    }


    generateEmptyChunk() {

        return this.generator.generateEmptyChunk();

    }

    async generateChunkXZTerrain(cx: number, cz: number) {


        const chunk: Chunk = this.generateEmptyChunk()
        this.world[`${cx},0,${cz}`] = chunk;


        this.generator.raise(cx, cz, {
            height: 3,
            type: 'mantle'
        })

        const seed = 25;

        this.generator.addPerlin(cx, cz, {
            seed: seed,
            scale: 0.005,
            height: 5,
            type: 'mantle'
        })



        this.generator.addPerlin(cx, cz, {
            seed: seed,
            scale: 0.005,
            height: 22,
            type: 'stone'
        })
        this.generator.raise(cx, cz, {
            height: 1,
            type: 'dirt'
        })


        this.generator.insetPerlin(cx, cz, {
            seed: seed + 1,
            scale: 0.1,
            height: 13,
            sub: 4,
            type: 'lava'
        })

        this.generator.raise(cx, cz, {
            height: 1,
            type: 'dirt'
        })

        this.generator.raise(cx, cz, {
            height: 1,
            type: 'dirt'
        })

        this.generator.addPerlin(cx, cz, {
            seed: seed,
            scale: 0.005,
            height: 3,
            type: 'stone'
        })


        for (let i = 0; i < 1; i++) {
            this.generator.insetPerlin(cx, cz, {
                seed: 1 * i,
                scale: 0.1,
                height: 11,
                sub: 4,
                type: 'gold'
            })

            this.generator.insetPerlin(cx, cz, {
                seed: 2 * i,
                scale: 0.1,
                height: 11,
                sub: 5,
                type: 'diamond'
            })


            this.generator.insetPerlin(cx, cz, {
                seed: 3 * i,
                scale: 0.1,
                height: 11,
                sub: 4,
                type: 'gem'
            })



        }

        this.generator.addPerlin(cx, cz, {
            seed: seed,
            scale: 0.005,
            height: 20,
            sub: 14,
            extrude: 4,
            type: 'stone'
        })

        this.generator.addPerlin(cx, cz, {
            seed: 99,
            scale: 0.005,
            height: 18,
            sub: 15,
            extrude: 2,
            type: 'stone'
        })



        this.generator.add(cx, cz, {
            height: (wy) => {
                return wy < 10 ? 1 : 0;
            },
            type: 'mantle'
        })

        this.generator.add(cx, cz, {
            height: (wy) => {
                return wy > 12 ? 1 : 0;
            },
            type: 'dirt'
        })

        this.generator.add(cx, cz, {
            height: (wy, type) => {
                return wy < 11 ? 1 : 0 //||type==this.getTypeId('stone')?
            },
            inset: 1,
            type: 'sand'
        })

        this.generator.insetPerlin(cx, cz, {
            seed: 89,
            scale: 0.2,
            height: (wy) => {
                return wy < 11 ? 15 : 0;
            },
            sub: 3,
            type: 'dirt'
        })

        this.generator.raise(cx, cz, {
            height: 8,
            type: 'water'
        })

    }
    async generateChunkXZFeatures(cx: number, cz: number) {

        this.world[`${cx},0,${cz}`].features = true;

        this.generator.addRandom(cx, cz, {
            probability: 0.03,
            height: (wy, type) => {
                return type == this.getTypeId('dirt') ? Math.round(2 + Math.random()) : 0
            },
            type: 'wood',
            ignoreWater: false
        })


        this.generator.addRandom(cx, cz, {
            probability: 0.03,
            height: (wy, type) => {
                return type == this.getTypeId('stone') ? 1 : 0
            },
            type: 'slime',
            ignoreWater: false
        })

        this.generator.addRandom(cx, cz, {
            probability: 0.01,
            height: (wy, type) => {
                return type == this.getTypeId('dirt') ? Math.round(2 + Math.random()) : 0
            },
            type: 'birtch',
            ignoreWater: false
        })


        this.generator.setLeaves(cx, cz);
        this.generator.setGrassTop(cx, cz);
        this.generator.grow('grass', cx, cz, {
            probability: 0.05,
        });

        this.generator.grow('wheat', cx, cz, {
            probability: 0.01,
        });

        this.generator.growSeaweed(cx, cz, {
            probability: 0.05,
        });


    }




    buildChunkMesh(chunk: Chunk, cx: number, cy: number, cz: number) {

        const key = `${cx},${cy},${cz}`;
        this.world[key] = chunk;
        chunk.key = `${cx},${cy},${cz}`

        this.updateChunkMesh(chunk);



        chunk.mesh.position.set(cx * this.chunkSize, cy * this.chunkSize, cz * this.chunkSize);
        chunk.water.position.copy(chunk.mesh.position);
        chunk.leaves.position.copy(chunk.mesh.position);
        chunk.assets.position.copy(chunk.mesh.position);

        return chunk.mesh;



    }

    needsUpdateChunkMesh(chunk: Chunk) {

        if (chunk._throttle) {
            clearTimeout(chunk._throttle);
        }

        chunk._throttle = setTimeout(() => {
            delete chunk._throttle;
            this.updateChunkMesh(chunk);
        }, 1);

    }

    updateChunkMesh(chunk: Chunk) {

        console.log(`Update Chunk Mesh: ${chunk.key}`)

        const solidGeometries: THREE.BufferGeometry[] = [];
        const waterGeometries: THREE.BufferGeometry[] = [];
        const leavesGeometries: THREE.BufferGeometry[] = [];
        const assetGeometries: THREE.Group = new THREE.Group();

        for (let x = 0; x < this.chunkSize; x++) {
            for (let z = 0; z < this.chunkSize; z++) {
                for (let y = this.chunkSize - 1; y >= 0; y--) {
                    const type = chunk[x][y][z];
                    if (type !== 0) {


                        let geom = this.blockAtlas.createTexturedBoxVariation(type, parseInt(`${x}${y}${z}`));

                        if (type == this.getTypeId('grass_item')) {

                            new Item(assetGeometries, 'grass.png', x, y, z, 2, {});
                            continue;

                        } else {

                        }

                        if (type == this.getTypeId('wheat_item')) {

                            new Item(assetGeometries, 'wheat.png', x, y, z, 2, { maxClones: 0 });
                            continue;

                        } else {

                        }

                        if (type == this.getTypeId('sword_item')) {

                            new Item(assetGeometries, 'wood_sword.png', x, y, z, 2, { maxClones: 0, scale: [1, 1] });
                            continue;

                        } else {

                        }



                        geom.translate(x, y + 0.5, z);
                        if (type == this.getTypeId('water')) {

                            if (y >= this.chunkSize - 1 || chunk[x][y + 1][z] != type) {
                                // if((!chunk.key)||this.getBlock(chunk.key, x, y+1, z)!=this.getTypeId('water')){
                                waterGeometries.push(geom)
                            }


                            continue;



                        }

                        if (type == this.getTypeId('leaves')) {
                            leavesGeometries.push(geom)
                            continue;
                        }


                        solidGeometries.push(geom);

                    }
                }
            }


            (async () => {

                let data = this.getChunkData(chunk.key);
                await this.database.setItem(chunk.key, data);
                let current = await this.database.getItem(chunk.key)

                if (JSON.stringify(current) !== JSON.stringify(data)) {
                    throw 'Not consistent!';
                }

            })();

        }

        const solidMerged = solidGeometries.length > 0 ? mergeGeometries(solidGeometries, true) : (new THREE.BufferGeometry());
        const waterMerged = waterGeometries.length > 0 ? mergeGeometries(waterGeometries, true) : (new THREE.BufferGeometry());
        const leavesMerged = leavesGeometries.length > 0 ? mergeGeometries(leavesGeometries, true) : (new THREE.BufferGeometry());

        const material = this.blockAtlas.getMaterial()



        const mesh = new THREE.Mesh(solidMerged, material);
        mesh.renderOrder = 0;
        const water = new THREE.Mesh(waterMerged, material);
        water.renderOrder = 1;
        const leaves = new THREE.Mesh(leavesMerged, material);
        leaves.renderOrder = 2;

        mesh.castShadow = true;
        mesh.receiveShadow = true;

        water.castShadow = true;
        water.receiveShadow = true;

        leaves.castShadow = true;
        leaves.receiveShadow = true;

        if (chunk.mesh) {
            const position = chunk.mesh.position;
            mesh.position.copy(position);
            water.position.copy(position);
            leaves.position.copy(position);
            assetGeometries.position.copy(position);
        }


        this.scene.add(mesh);
        this.scene.add(water);
        this.scene.add(leaves);
        this.scene.add(assetGeometries);

        if (chunk.mesh) {


            this.scene.remove(chunk.mesh);
            this.scene.remove(chunk.water);
            this.scene.remove(chunk.leaves);
            this.scene.remove(chunk.assets);



        }
        chunk.mesh = mesh;
        chunk.water = water;
        chunk.leaves = leaves;
        chunk.assets = assetGeometries;

        return mesh;

    }

    unloadChunk(key) {
        let chunk = this.world[key];
        if (!chunk) {
            return;
        }

        this.scene.remove(chunk.mesh);
        this.scene.remove(chunk.water);
        this.scene.remove(chunk.leaves);
        this.scene.remove(chunk.assets);

        delete this.world[key];

    }

    takeBlock(key, x: number, y: number, z: number): number {

        let type;
        if (this.getHorizontalNeighbourTypes(key, x, y, z).indexOf(this.getTypeId('water')) >= 0) {
            type = this.setBlock(key, x, y, z, this.getTypeId('water'))
        }


        if (this.getBlock(key, x, y + 1, z) == this.getTypeId('grass_item')) {
            this.setBlock(key, x, y + 1, z, this.getTypeId('air'))
        }


        type = this.setBlock(key, x, y, z, this.getTypeId('air'));

        if (this.getTypeName(type) == 'grass') {
            return this.getTypeId('dirt');
        }

        return type;

    }

    getNeighboursXZ(key, x, z) {
        return [[x - 1, z], [x + 1, z], [x, z - 1], [x, z + 1]]
    }
    getHorizontalNeighbourTypes(key, x, y, z) {
        return this.getNeighboursXZ(key, x, z).map((n) => {
            return this.getBlock(key, n[0], y, n[1]);
        })
    }

    getWorldBlock(wx: number, wy: number, wz: number) {
        const { key, x, y, z } = this.fromWorldBlock(wx, wy, wz);
        const chunk = this.world[key];
        if (!chunk) {
            return 0;
        }
        return chunk[x][y][z];

    }
    getBlock(key: string, x: number, y: number, z: number) {



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
        const oldType = chunk[x][y][z];
        chunk[x][y][z] = type;

        this.needsUpdateChunkMesh(chunk);
        return oldType;
    }

    getTypeName(type: number) {
        return this.blockAtlas.getTypeName(type);
    }
    getTypeId(name: string | number) {
        return this.blockAtlas.getTypeId(name);
    }

    /**
     * @deprecated
     */
    renderStaticCubePreview(type: number, container) {
        this.blockAtlas.renderStaticCubePreview(type, container);
    }

    render() {


        this.blockAtlas = new BlockAtlas(BlockFaces);
        this.blockAtlas.onload(() => {

            (new ChunkLoader(this)).loadChunks()

        });



    }


    // world block are x,y,z coordinates of blocks if there were no chunks (or relative to 0,0,0 chunk)
    fromWorldBlock(worldX: number, worldY: number, worldZ: number): { key: string, cx: number, cy: number, cz: number, x: number, y: number, z: number } {

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

    getChunkData(key) {


        const data: BlockType[][][] = [];

        for (let x = 0; x < this.chunkSize; x++) {
            data[x] = this.world[key][x];
        }

        return data;
    }


    async loadChunks(cx, cz) {

        let cy = 0;
        let key = `${cx},${0},${cz}`;
        while (await this.database.hasItem(key)) {
            this.world[key] = await this.database.getItem(key)
            cy++;
            key = `${cx},${cy},${cz}`;
        }

    }

    getWorldGround(wx: number, wy: number, wz: number): number {

        let { key, cy, x, y, z } = this.fromWorldBlock(wx, wy, wz);

        if (typeof this.world[key] == 'undefined') {

            if (cy > 0) {
                return this.getWorldGround(wx, cy * this.chunkSize - 1, wz);
            }
            return 0;
        }

        while (y >= 0) {
            let type = this.world[key][x][y][z];
            if (!(type == this.getTypeId('air') || type == this.getTypeId('water'))) {
                return cy * this.chunkSize + y + 1;
            }
            y--;
        }

        if (cy > 0) {
            return this.getWorldGround(wx, cy * this.chunkSize - 1, wz);
        }



        return 0;
    }

    /**
     * call this from the animate loop once, to keep track of the current location.
     * this is the same fromWorld, but keeps track of the active block for generating/culling 
     * 
     * @param pos camera position
     * @returns chunk/block location info
     */
    fromCamera(pos: { x: number, y: number, z: number }) {
        const location = this.fromWorld(pos);

        if (this.current !== location.key) {
            const from = this.current;
            const to = location.key;
            this.current = to;
            this.emit('activechunk:update', { from, to })
        }

        return location;
    }

    fromWorld(pos: { x: number, y: number, z: number }) {


        const worldX = pos.x + 0.5;
        const worldY = pos.y - 0.1;
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
            g: this.getWorldGround(worldX, worldY, worldZ),
            type: this.getTypeName(this.getWorldBlock(worldX, worldY, worldZ))
        }
    }

    reset(){
         this.database.erase();
         document.location=''
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
