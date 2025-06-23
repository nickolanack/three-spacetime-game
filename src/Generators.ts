
import { Noise } from 'noisejs';
import type { ChunkEngine } from './ChunkEngine';

type BlockType = number; // 0 = air, 1 = dirt, 2 = grass ...

export class Generators {
    chunks;
    chunkSize: number;
    noise: Noise;

    constructor(chunks: ChunkEngine) {
        this.chunks = chunks;
        this.chunkSize = chunks.chunkSize;
        this.noise = new Noise(42); // seedable
    }

    getTypeId(type: string | number) {
        return this.chunks.getTypeId(type);
    }

    getChunk(cx: number, cy: number, cz: number) {
        const key = `${cx},${cy},${cz}`;
        let chunk = this.chunks.world[key];
        if (!chunk) {
            chunk = this.generateEmptyChunk();
            this.chunks.world[key] = chunk;
        }

        return chunk;
    }

    addPerlin(cx: number, cz: number, opt) {


        let noise = this.noise;
        if (opt.seed) {
            noise = new Noise(opt.seed); // seedable
        }

        for (let x = 0; x < this.chunkSize; x++) {
            for (let z = 0; z < this.chunkSize; z++) {

                let scale = opt.scale ? opt.scale : 0.05

                let value = noise.perlin2((cx * this.chunkSize + x) * scale, (cz * this.chunkSize + z) * scale) / 1.5;
                scale *= 2;
                value = value + noise.perlin2((cx * this.chunkSize + x) * scale, (cz * this.chunkSize + z) * scale) / 1.5;
                let height = Math.round((value) * opt.height); // scale to 0–10 height
                if (typeof opt.sub == 'number') {
                    height = Math.max(0, height - opt.sub);
                }

                if (typeof opt.extrude == 'number' && height > 0) {
                    height = height + opt.extrude;
                }

                let worldY = 0;

                while (height > 0) {

                    const cy = Math.floor(worldY / this.chunkSize);
                    const chunk = this.getChunk(cx, cy, cz);
                    let y = ((Math.floor(worldY) % this.chunkSize) + this.chunkSize) % this.chunkSize;

                    const type = chunk[x][y][z]
                    if (type == 0 && height > 0) {
                        chunk[x][y][z] = this.getTypeId(opt.type)
                        height--;
                    }

                    worldY++;

                }

            }
        }

    }


    insetPerlin(cx: number, cz: number, opt) {


        let noise = this.noise;
        if (opt.seed) {
            noise = new Noise(opt.seed); // seedable
        }

        for (let x = 0; x < this.chunkSize; x++) {
            for (let z = 0; z < this.chunkSize; z++) {

                let scale = opt.scale ? opt.scale : 0.05

                let value = noise.perlin2((cx * this.chunkSize + x) * scale, (cz * this.chunkSize + z) * scale) / 1.5;
                scale *= 4;
                value = value + noise.perlin2((cx * this.chunkSize + x) * scale, (cz * this.chunkSize + z) * scale) / 1.5;


                let worldY = 0;
                let type = 0;


                while (true) {

                    const cy = Math.floor(worldY / this.chunkSize);
                    const chunk = this.getChunk(cx, cy, cz);
                    let y = ((Math.floor(worldY) % this.chunkSize) + this.chunkSize) % this.chunkSize;

                    type = chunk[x][y][z]
                    if (type == 0) {
                        worldY--;
                        break;
                    }
                    worldY++;

                }

                if (typeof opt.height == 'function') {
                    opt.height = opt.height(worldY, type)
                }

                let height = Math.round((value) * opt.height); // scale to 0–10 height
                if (typeof opt.sub == 'number') {
                    height = Math.max(0, height - opt.sub);
                }

                while (height > 0 && worldY >= 0) {

                    const cy = Math.floor(worldY / this.chunkSize);
                    const chunk = this.getChunk(cx, cy, cz);
                    let y = ((Math.floor(worldY) % this.chunkSize) + this.chunkSize) % this.chunkSize;


                    chunk[x][y][z] = this.getTypeId(opt.type)
                    height--;
                    worldY--;

                }

            }
        }

    }

    subPerlin(cx: number, cz: number, opt) {


        for (let x = 0; x < this.chunkSize; x++) {
            for (let z = 0; z < this.chunkSize; z++) {

                let scale = opt.scale ? opt.scale : 0.05

                let value = this.noise.perlin2((cx * this.chunkSize + x) * scale, (cz * this.chunkSize + z) * scale) / 2.0;
                scale *= 4;
                value = value + this.noise.perlin2((cx * this.chunkSize + x) * scale, (cz * this.chunkSize + z) * scale) / 2.0;

                if (typeof opt.invert == 'boolean' && opt.invert) {
                    value = 1 - value;
                }

                let height = Math.round((value) * opt.height); // scale to 0–10 height
                if (typeof opt.sub == 'number') {
                    height = Math.max(0, height - opt.sub);
                }

                if (typeof opt.extrude == 'number' && height > 0) {
                    height = height + opt.extrude;
                }

                for (let y = 0; y < this.chunkSize; y++) {
                    let type = chunk[x][this.chunkSize - y - 1][z];
                    if (height > 0) {
                        chunk[x][this.chunkSize - y - 1][z] = 0
                        height--;
                    }
                }
            }
        }

    }


    raise(cx: number, cz: number, opt) {


        for (let x = 0; x < this.chunkSize; x++) {
            for (let z = 0; z < this.chunkSize; z++) {


                let worldY = 0;

                while (worldY < opt.height) {

                    const cy = Math.floor(worldY / this.chunkSize);
                    const chunk = this.getChunk(cx, cy, cz);
                    let y = ((Math.floor(worldY) % this.chunkSize) + this.chunkSize) % this.chunkSize;

                    const type = chunk[x][y][z]
                    if (type == 0) {
                        chunk[x][y][z] = this.getTypeId(opt.type)
                    }

                    worldY++;

                }

            }
        }

    }


    add(cx: number, cz: number, opt) {


        for (let x = 0; x < this.chunkSize; x++) {
            for (let z = 0; z < this.chunkSize; z++) {


                let height = opt.height; // scale to 0–10 height
                let worldY = 0;

                while (typeof height == 'function' || height > 0) {

                    const cy = Math.floor(worldY / this.chunkSize);
                    const chunk = this.getChunk(cx, cy, cz);
                    let y = ((Math.floor(worldY) % this.chunkSize) + this.chunkSize) % this.chunkSize;

                    const type = chunk[x][y][z]
                    if (type == 0) {

                        if (typeof height == 'function') {
                            height = height(worldY, type);
                        }

                        if (height > 0) {
                            chunk[x][y][z] = this.getTypeId(opt.type)
                            height--;
                        }
                    }

                    worldY++;

                }

            }
        }

    }


    setGrassTop(cx: number, cz: number) {

        for (let x = 0; x < this.chunkSize; x++) {
            for (let z = 0; z < this.chunkSize; z++) {


                let worldY = 0;
                let type = 0;
                let last = 0


                while (true) {

                    const cy = Math.floor(worldY / this.chunkSize);
                    const chunk = this.getChunk(cx, cy, cz);
                    let y = ((Math.floor(worldY) % this.chunkSize) + this.chunkSize) % this.chunkSize;
                    last = type;
                    type = chunk[x][y][z]
                    if (type == 0) {
                        worldY--;
                        break;
                    }
                    worldY++;

                }

                if (last != this.getTypeId('grass')) {
                    continue;
                }

                const cy = Math.floor(worldY / this.chunkSize);
                const chunk = this.getChunk(cx, cy, cz);
                let y = ((Math.floor(worldY) % this.chunkSize) + this.chunkSize) % this.chunkSize;


                chunk[x][y][z] = this.getTypeId('grass')


            }
        }
    }







    generateEmptyChunk() {

        const chunk: BlockType[][][] = [];


        for (let x = 0; x < this.chunkSize; x++) {
            chunk[x] = [];
            for (let y = 0; y < this.chunkSize; y++) {
                chunk[x][y] = [];
                for (let z = 0; z < this.chunkSize; z++) {
                    let type = 0;
                    chunk[x][y][z] = type;
                }
            }
        }

        return chunk;

    }




}


