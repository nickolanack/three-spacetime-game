import type { ChunkEngine } from "./ChunkEngine";

export class ChunkLoader {

    chunks: ChunkEngine;

    constructor(chunks: ChunkEngine) {
        this.chunks = chunks


    }

    async loadChunks() {


        const size = 5;


        const loadInitalTasks = [];
        for (const { cx, cy, cz } of this.chunks.getRadialNeighbourChunks(0, 0, 0, size)) {

            if (cy == 0) {

                loadInitalTasks.push((async () => {
                    const hasBlock = await this.chunks.database.hasItem(`${cx},0,${cz}`);
                    if (hasBlock) {
                        await this.chunks.loadChunks(cx, cz);
                        return;
                    }
                    /**
                    * generateChunkXZTerrain only places blocks inside chunk bounds (x,z) and creates new chunks in y if needed
                    */
                    await this.chunks.generateChunkXZTerrain(cx, cz)
                })());
            }
        }

        await Promise.all(loadInitalTasks);

        /**
         * inset by one chunk (6 instead of 7 above) to avoid placing foliage in an ungenerated chunk
         */


        const renderInitialTasks = [];

        for (let { cx, cy, cz } of this.chunks.getRadialNeighbourChunks(0, 0, 0, size - 1)) {
            if (cy == 0) {

                renderInitialTasks.push((async () => {
                    const hasBlock = await this.chunks.database.hasItem(`${cx},0,${cz}`);
                    let key = `${cx},${cy},${cz}`;
                    if (hasBlock) {
                        while (this.chunks.world[key]) {
                            this.chunks.buildChunkMesh(this.chunks.world[key], cx, cy, cz);
                            cy++;
                            key = `${cx},${cy},${cz}`;
                        }
                        return;
                    }
                    /**
                     * generateChunkXZFeatures may place blocks outside of the current chunk cx,cz ie: foliage
                     */
                    await this.chunks.generateChunkXZFeatures(cx, cz)

                    while (this.chunks.world[key]) {
                        this.chunks.buildChunkMesh(this.chunks.world[key], cx, cy, cz);
                        this.chunks.database.setItem(key, this.chunks.getChunkData(key))
                        cy++;
                        key = `${cx},${cy},${cz}`;

                    }
                })());
            }
        }

        await Promise.all(renderInitialTasks);



        let isUpdating=false;

        this.chunks.on('activechunk:update', ({ to }) => {

            (async () => {

                if(isUpdating){
                    console.log('skip');
                    return;
                }
                isUpdating=true;
                console.log('update-chunks')

                const { cx: _cx, cy, cz: _cz } = this.chunks.fromKey(to)


                const loadNewChunkTasks = [];
                const loadedKeys=[]


                for (const { key, cx, cy, cz } of this.chunks.getRadialNeighbourChunks(_cx, 0, _cz, size)) { //}.forEach(() => {

                    if (cy == 0 && (!!!this.chunks.world[key])) {

                        loadNewChunkTasks.push((async () => {

                            loadedKeys.push(key)

                            const hasBlock = await this.chunks.database.hasItem(`${cx},0,${cz}`);
                            if (hasBlock) {
                                await this.chunks.loadChunks(cx, cz);
                                
                                return;
                            }
                            await this.chunks.generateChunkXZTerrain(cx, cz)
                        })());
                    }
                };

                await Promise.all(loadNewChunkTasks);


                const renderNewChunkTasks = [];

                for (let { key, cx, cy, cz } of this.chunks.getRadialNeighbourChunks(_cx, 0, _cz, size - 1)) { //}.forEach(({ key, cx, cy, cz }) => {
                    if (cy == 0) {


                        renderNewChunkTasks.push((async () => {


                            const hasBlock = await this.chunks.database.hasItem(`${cx},0,${cz}`);
                            let key = `${cx},${cy},${cz}`;
                            if (hasBlock&&loadedKeys.indexOf(key)>=0) {
                                while (this.chunks.world[key]) {
                                    this.chunks.buildChunkMesh(this.chunks.world[key], cx, cy, cz);
                                    cy++;
                                    key = `${cx},${cy},${cz}`;
                                }
                                return;
                            }


                            let chunk = this.chunks.world[key];
                            if (!chunk.features) {
                                await this.chunks.generateChunkXZFeatures(cx, cz)
                                while (this.chunks.world[key]) {
                                    this.chunks.buildChunkMesh(this.chunks.world[key], cx, cy, cz);
                                    this.chunks.database.setItem(key, this.chunks.getChunkData(key))
                                    cy++;
                                    key = `${cx},${cy},${cz}`;
                                }
                            }

                        })());
                    }
                };

                await Promise.all(renderNewChunkTasks);


                const unloadOldChunkTasks = [];


                this.chunks.getRadialOutsideChunks(_cx, 0, _cz, size * 2).forEach(({ key, cx, cy, cz }) => {

                    if (cy == 0) {

                        unloadOldChunkTasks.push((async () => {

                            key = `${cx},${0},${cz}`;
                            while (this.chunks.world[key]) {
                                this.chunks.unloadChunk(key);
                                cy++;
                                key = `${cx},${cy},${cz}`;
                            }

                        }));
                    }

                });

                unloadOldChunkTasks.forEach(async (fn)=>{
                    await fn();
                });


                isUpdating=false;

            })()





        })


    }

}