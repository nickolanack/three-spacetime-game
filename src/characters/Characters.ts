import type { CharacterController } from "../CharacterController";
import { Character } from "./Character";
import { Gnome } from "./Gnome"
import { Golem } from "./Golem"
import { Pumpkin } from "./Pumpkin";



export class Characters {

    camera;
    renderer;
    controllers = [];

    constructor(camera, renderer) {
        this.camera = camera;
        this.renderer = renderer;
    }

    createCharacter(type): Character {

        const character = this._loadCharacter(type)
        character.object.character = character;
        return character;

    }

    _loadCharacter(type): Character {

        if (type == 'gnome') {
            return new Gnome(this.camera, this.renderer);
        }
        if (type == 'golem') {
            return new Golem(this.camera, this.renderer);
        }

        if (type == 'pumpkin') {
            return new Pumpkin(this.camera, this.renderer);
        }

    }


    add(controller: CharacterController) {
        this.controllers.push(controller);
        controller.character.on('character:die', () => {
            this.controllers.splice(this.controllers.indexOf(controller), 1);
        });
    }

    animate(delta) {
        this.controllers.forEach(c => c.animate(delta))
    }


    clickableMeshesNearby(pos) {

        return this.controllers.map(character => character.object)

    }


}