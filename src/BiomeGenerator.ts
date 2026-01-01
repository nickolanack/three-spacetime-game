import type { Chunk } from "./ChunkEngine";


export class BiomeGenerator {

    generator;
    world;

    seed = 250;

    constructor(generator, world) {
        this.generator = generator;
        this.world = world;
    }

    async generateChunkXZTerrain(cx: number, cz: number) {

        const value = this.generator.getPerlinValue(cx, cz, {
            seed: 1,
            scale: 0.005,
        })



        const chunk: Chunk = this.generator.generateEmptyChunk()
        this.world[`${cx},0,${cz}`] = chunk;


        this.defaultChunkXZTerrain(cx, cz);

        if (Math.round(value * 10) == 0) {
            this.forestChunkXZTerrain(cx, cz)
            return;
        }

        this.islandChunkXZTerrain(cx, cz)


    }

    async generateChunkXZFeatures(cx: number, cz: number) {

        this.world[`${cx},0,${cz}`].features = true;
        this.defaultChunkXZFeatures(cx, cz)
    }


    async defaultChunkXZTerrain(cx: number, cz: number) {
        this.generator.raise(cx, cz, {
            height: 3,
            type: 'mantle'
        })

        const seed = this.seed;

        this.generator.addPerlin(cx, cz, {
            seed: seed,
            scale: 0.005,
            height: 10,
            type: 'mantle'
        })



        this.generator.insetPerlin(cx, cz, {
            seed: seed+1,
            scale: 0.005,
            height: 5,
            type: 'stone_dark'
        })
        this.generator.raise(cx, cz, {
            height: 10,
            type: 'stone_dark'
        })
        this.generator.addPerlin(cx, cz, {
            seed: seed+2,
            scale: 0.005,
            height: 22,
            type: 'stone_dark'
        })

       


        this.generator.insetPerlin(cx, cz, {
            seed: seed + 3,
            scale: 0.1,
            height: 13,
            sub: 4,
            type: 'lava'
        })

        this.generator.raise(cx, cz, {
            height: 20,
            type: 'stone'
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

        this.generator.add(cx, cz, {
            height: 1,
            type: 'dirt_dark'
        })

        this.generator.add(cx, cz, {
            height: (wy) => {
                return wy < 20 ? 1 : 0;
            },
            type: 'dirt_dark'
        })

        this.generator.insetPerlin(cx, cz, {
            seed: seed + 3,
            // scale: 1,
            height: 13,
            sub: 4,
            type: 'water'
        })

        this.generator.addPerlin(cx, cz, {
            seed: seed + 3,
            // scale: 1,
            height:6,
            sub: 2,
            type: 'leaves'
        })
        this.generator.addPerlin(cx, cz, {
            seed: seed + 5,
            // scale: 1,
            height:4,
            sub: 2,
            type: 'leaves'
        })

    }


    async forestChunkXZTerrain(cx: number, cz: number) {

        const seed = this.seed;

        this.generator.raise(cx, cz, {
            height: 2,
            type: 'water'
        })

    }


    async islandChunkXZTerrain(cx: number, cz: number) {

        const seed = this.seed;


        this.generator.raise(cx, cz, {
            height: 20,
            type: 'water'
        })

    }




    async defaultChunkXZFeatures(cx: number, cz: number) {

        this.generator.addRandom(cx, cz, {
            probability: 0.02,
            height: (wy, type) => {
                return this.generator.isTypeOf(type, 'dirt') ? Math.round(2 + Math.random()*3) : 0
            },
            type: 'wood_dark',
            ignoreWater: false
        })
        this.generator.addRandom(cx, cz, {
            probability: 0.005,
            height: (wy, type) => {
                return this.generator.isTypeOf(type, 'dirt') ? Math.round(2 + Math.random()*20) : 0
            },
            type: 'wood_dark',
            ignoreWater: false
        })
        this.generator.addRandom(cx, cz, {
            probability: 0.005,
            height: (wy, type) => {
                return this.generator.isTypeOf(type, 'dirt') ? Math.round(2 + Math.random()*2) : 0
            },
            type: 'wood',
            ignoreWater: false
        })



        this.generator.addRandom(cx, cz, {
            probability: 0.005,
            height: (wy, type) => {
                return this.generator.isTypeOf(type, 'dirt') ? Math.round(2 + Math.random()*15) : 0
            },
            type: 'wood_birtch',
            ignoreWater: false
        })


        
        this.generator.setGrassTop(cx, cz);
        this.generator.setLeaves(cx, cz);
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





}