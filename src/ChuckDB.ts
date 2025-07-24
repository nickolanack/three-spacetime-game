


const DB_NAME = 'chunkDB1';
const STORE_NAME = 'chunkStore';
const DB_VERSION = 2;


import EventEmitter from 'eventemitter3';

type MyEvents = {
    'connect': { from: string; to: string };
};

export class ChunkDB extends EventEmitter<MyEvents> {

    database: IDBDatabase;

    constructor() {

        super();

        (async () => {
            this.database = await this._openDB();
            this.emit('connect', {});
        })();


    }


    erase(){
        indexedDB.deleteDatabase(DB_NAME);
    }

    async connect(): Promise<IDBDatabase> {
        return new Promise((resolve, reject) => {

            if (this.database) {
                resolve(this.database);
                return;
            }

            this.once('connect', () => resolve(this.database));

        });
    }

    _openDB(): Promise<IDBDatabase> {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onupgradeneeded = () => {
                const db = request.result;
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    db.createObjectStore(STORE_NAME);
                }
            };

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async setItem(key: string, value: number[][]): Promise<void> {
        const db = await this.connect();
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        store.put(value, key); // manually assign key here
        return new Promise((resolve, reject) => {
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        });
    }

    async getItem<T = any>(key: string): Promise<T | undefined> {
        const db = await this.connect();
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);

        return new Promise((resolve, reject) => {
            const request = store.get(key);
            request.onsuccess = () => resolve(request.result as T | undefined);
            request.onerror = () => reject(request.error);
        });
    }


    async hasItem(key: string): Promise<boolean> {
        const db = await this.connect();
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);

        return new Promise((resolve, reject) => {
            const request = store.getKey(key);
            request.onsuccess = () => resolve(request.result !== undefined);
            request.onerror = () => reject(request.error);
        });
        }


}