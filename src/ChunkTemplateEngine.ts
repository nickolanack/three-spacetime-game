import { ChunkEngine } from "./ChunkEngine";
import type { Chunk } from "./ChunkEngine";

import { BlockAtlas } from "./BlockAtlas";
import { ChunkLoader } from "./ChunkLoader";


import BlockFaces from './blocks.json';

export class ChunkTemplateEngine extends ChunkEngine{

 async generateChunkXZTerrain(cx: number, cz: number) {


        const chunk: Chunk = this.generator.generateEmptyChunk()
        this.world[`${cx},0,${cz}`] = chunk;


        this.generator.raise(cx, cz, {
            height: 1,
            type: 'white'
        })

        this.generator.inset(cx, cz, {
            height: (x, y, z, type)=>{
                if(x%4==0&&z%4==0){
                    return 1
                }
                if((15-x)%4==0&&z%4==0){
                    return 1
                }
                if(x%4==0&&(z-15)%4==0){
                    return 1
                }
                if((x-15)%4==0&&(z-15)%4==0){
                    return 1
                }
                return 0
            },
            type: 'light_gray'
        })
    }


    async generateChunkXZFeatures(cx: number, cz: number) {

        this.world[`${cx},0,${cz}`].features = true;
        // No features!
      
    }

    render() {


        this.blockAtlas = new BlockAtlas(BlockFaces);
        this.blockAtlas.onload(async () => {

            const loader = new ChunkLoader(this);
            await loader.loadChunks(1.5)
           

        });



    }




}
