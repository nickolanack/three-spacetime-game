import { Gnome } from "./Gnome"
import { Golem } from "./Golem"


export type Character={
    object:any;
    lookAt:(object:any)=>void,
    name?:string
}

export class Characters{
    
    camera;
    renderer;

    constructor(camera, renderer){
        this.camera=camera;
        this.renderer=renderer;
    }

    createCharacter(type):Character{

        if(type=='gnome'){
            return new Gnome(this.camera, this.renderer);
        }
        if(type=='golem'){
            return new Golem(this.camera, this.renderer);
        }


    }





}