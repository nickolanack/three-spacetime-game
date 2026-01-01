import type { Menu } from "./Menu";

export class Menus{

    menus:{[key: string]: Menu }
    current:string|null;

    addMenu(name:string, menu:Menu){
        this.menus[name]=menu
    }

    show(name){
        this.current=name
    }
    hide(){
        this.current=null
    }
    get(name){
        return this.menus[name]
    }



}