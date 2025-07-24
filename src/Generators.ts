
import { Noise } from 'noisejs';
import type { ChunkEngine } from './ChunkEngine';

type BlockType = number; // 0 = air, 1 = dirt, 2 = grass ...

type TopOptions={ ignoreLeaves?: boolean, ignoreWater?: boolean}

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

            if(cy==0){
                throw 'Generating empty root chunk will make a hole!';
            }

            chunk = this.generateEmptyChunk();
            this.chunks.world[key] = chunk;
        }

        return chunk;
    }
    fromWorldBlock(worldX: number, worldY: number, worldZ: number) {
        return this.chunks.fromWorldBlock(worldX, worldY, worldZ);
    }

    _eachXZ(cb: (coord: { x: number, z: number }) => void) {
        for (let x = 0; x < this.chunkSize; x++) {
            for (let z = 0; z < this.chunkSize; z++) {
                cb({ x, z });
            }
        }
    }
    _eachWXZ(cx: number, cz: number, cb: (coord: { wx: number, wz: number, x: number, z: number }) => void) {
        for (let x = 0; x < this.chunkSize; x++) {
            for (let z = 0; z < this.chunkSize; z++) {
                cb({ wx: cx * this.chunkSize + x, wz: cz * this.chunkSize + z, x, z });
            }
        }
    }

    addPerlin(cx: number, cz: number, opt:{type:string|number, height:number, sub?:number, extrude?:number}) {


        this._eachWXZ(cx, cz, ({ wx, wz }) => {

            let value = this.getPerlinValue(wx, wz, opt);



            let { wy } = this._topWorldBlock(wx, wz, opt);

            let height = Math.round((value) * opt.height); // scale to 0–10 height

            if (typeof opt.sub == 'number') {
                height = Math.max(0, height - opt.sub);
            }

            if (typeof opt.extrude == 'number' && height > 0) {
                height = height + opt.extrude;
            }

            wy++;

            while (height > 0) {

                this.setWBlock(wx, wy, wz, opt.type);

                height--;
                wy++;

            }


        })

    }


    addRandom(cx: number, cz: number, opt) {


        this._eachWXZ(cx, cz, ({ wx, wz }) => {



            let { wy, type } = this._topWorldBlock(wx, wz, opt);

            if (Math.random() > opt.probability) {
                return;
            }

            let height = opt.height;
            if (typeof height == 'function') {
                height = height(wy, type);
            }


            wy++;

            while (height > 0) {

                this.setWBlock(wx, wy, wz, opt.type);

                height--;
                wy++;

            }


        })

    }

    _getNoise(opt) {

        if (opt.seed) {
            return new Noise(opt.seed); // seedable
        }
        return this.noise;
    }


    getPerlinValue(wx: number, wz: number, opt) {

        const noise = this._getNoise(opt);

        let scale = opt.scale ? opt.scale : 0.05

        let value = noise.perlin2(wx * scale, wz * scale) / 1.5;
        scale *= 4;
        value = value - noise.perlin2(wx * scale, wz * scale) / 1.5;


        if (typeof opt.invert == 'boolean' && opt.invert) {
            value = 1 - value;
        }

        return value;
    }




    insetPerlin(cx: number, cz: number, opt) {

        this._eachWXZ(cx, cz, ({ wx, wz }) => {


            let value = this.getPerlinValue(wx, wz, opt);

            let { wy, type } = this._topWorldBlock(wx, wz, opt);

            let height = opt.height;

            if (typeof height == 'function') {
                height = height(wy, type)
            }

            height = Math.round((value) * height); // scale to 0–10 height
            if (typeof opt.sub == 'number') {
                height = Math.max(0, height - opt.sub);
            }

            while (height > 0 && wy >= 0) {
                this.setWBlock(wx, wy, wz, opt.type)
                height--;
                wy--;
            }


        });

    }

    subPerlin(cx: number, cz: number, opt) {


        this._eachWXZ(cx, cz, ({ wx, wz }) => {

            let value = this.getPerlinValue(wx, wz, opt);

            let { wy } = this._topWorldBlock(wx, wz, opt);

            let height = Math.round((value) * opt.height); // scale to 0–10 height
            if (typeof opt.sub == 'number') {
                height = Math.max(0, height - opt.sub);
            }

            if (typeof opt.extrude == 'number' && height > 0) {
                height = height + opt.extrude;
            }

            while (height > 0 && wy >= 0) {
                this.setWBlock(wx, wy, wz, 'air');
                height--;
                wy--;
            }

        });

    }



    _topWorldBlock(worldX: number, worldZ: number, opt?: TopOptions|any) {

        if (typeof opt == 'undefined') {
            opt = {};
        }

        let { cx, cy, cz, x, z } = this.fromWorldBlock(worldX, 0, worldZ);

        while (this.chunks.world[`${cx},${cy + 1},${cz}`]) {
            cy++;
        }

        let air = this.getTypeId('air');
        const ignoreLeaves = opt?.ignoreLeaves ?? true;
        const ignoreTypes = [air];

        if (opt?.ignoreLeaves ?? true) {
            ignoreTypes.push(this.getTypeId('leaves'));
        }
        if (opt?.ignoreWater ?? true) {
            ignoreTypes.push(this.getTypeId('water'));
        }


        let wy = cy * this.chunkSize + 15;
        while (wy > 0) {
            cy = Math.floor(wy / this.chunkSize);
            const chunk = this.getChunk(cx, cy, cz);
            let y = ((Math.floor(wy) % this.chunkSize) + this.chunkSize) % this.chunkSize;
            const type = chunk[x][y][z];
            if (ignoreTypes.indexOf(type) ==-1) {
                return { wy, cy, y, type };
            }
            wy--;
        }

        return { wy: 0, cy: 0, y: 0, type: air };

    }


    raise(cx: number, cz: number, opt) {


        this._eachWXZ(cx, cz, ({ wx, wz }) => {

            let { wy } = this._topWorldBlock(wx, wz, opt);
            while (wy < opt.height) {
                this.setWBlock(wx, wy, wz, opt.type);
                wy++;
            }

        });

    }


    add(cx: number, cz: number, opt) {


        this._eachWXZ(cx, cz, ({ wx, wz }) => {

            let { wy, type } = this._topWorldBlock(wx, wz, opt);

            let height = opt.height;
            if (typeof height == 'function') {
                height = height(wy, type);
            }

            wy++
            if (opt.inset) {
                wy -= opt.inset;
            }

            while (height > 0) {

                if (wy >= 0) {
                    this.setWBlock(wx, wy, wz, opt.type);
                }

                height--;
                wy++;

            }
        });

    }


    setWBlock(wx: number, wy: number, wz: number, type: number | string) {
        const { cx, cy, cz, x, y, z } = this.fromWorldBlock(wx, wy, wz);
        const chunk = this.getChunk(cx, cy, cz);
        chunk[x][y][z] = this.getTypeId(type)
    }

    getWBlockType(wx: number, wy: number, wz: number) {
        const { cx, cy, cz, x, y, z } = this.fromWorldBlock(wx, wy, wz);
        const chunk = this.getChunk(cx, cy, cz);
        return chunk[x][y][z];
    }


    setGrassTop(cx: number, cz: number) {

        this._eachWXZ(cx, cz, ({ wx, wz }) => {

            const { wy, type } = this._topWorldBlock(wx, wz, { ignoreWater: false });

            if (type == this.getTypeId('dirt')) {
                this.setWBlock(wx, wy, wz, 'grass')
            }

        });
    }


    setLeaves(cx: number, cz: number) {

        this._eachWXZ(cx, cz, ({ wx, wz }) => {

            const { wy, type } = this._topWorldBlock(wx, wz, { ignoreWater: false });

            if (type == this.getTypeId('wood') || type == this.getTypeId('birtch')) {
                let count = Math.round(12 + Math.random() * 12);
                let neighbours = this.chunks.getRadialNeighbourBlocks(wx, wy, wz, 3);

                let apply = (b) => {
                    if (b.wy >= wy && this.getWBlockType(b.wx, b.wy, b.wz) != type) {
                        this.setWBlock(b.wx, b.wy, b.wz, 'leaves');
                    }
                };

                for (let i = 0; i < count; i++) {

                    apply(neighbours[Math.floor(Math.random() * neighbours.length)]);

                }

                neighbours = this.chunks.getRadialNeighbourBlocks(wx, wy, wz, 2);
                for (let i = 0; i < count; i++) {
                    apply(neighbours[Math.floor(Math.random() * neighbours.length)]);
                }

                apply({ wx, wy: wy + 1, wz });
                apply({ wx: wx + 1, wy, wz });
                apply({ wx: wx - 1, wy, wz });
                apply({ wx, wy, wz: wz + 1 });
                apply({ wx, wy, wz: wz - 1 });
            }


        });
    }


    grow(type:string, cx: number, cz: number, opt) {

        this.addRandom(cx, cz, {
            probability: opt.probability,
            height: (wy, type) => {
                return type == this.getTypeId('grass') ? 1 : 0
            },
            type: `${type}_item`
        });
    }

    growSeaweed(cx: number, cz: number, opt) {

        this.addRandom(cx, cz, {
            probability: opt.probability,
            height: (wy, type) => {
               
                return this.getWBlockType(cx, wy+1, cz) == this.getTypeId('water') ? 1 : 0
            },
            type: 'wheat_item'
        });
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


