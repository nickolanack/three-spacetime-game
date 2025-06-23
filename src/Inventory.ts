import * as THREE from 'three';

type InventoryItem = { type: number, count: number }; // 0 = air, 1 = dirt, 2 = grass


export class Inventory {

    items: (InventoryItem|null)[] = []
    lastType = -1;
    selectedItem = 0;
    chunks;
    inifinityItems=false;

    constructor(chunks) {

        this.chunks=chunks;

        const onKeyDown = (event) => {
            switch (event.code) {
                case 'Digit1':
                case 'Digit2':
                case 'Digit3':
                case 'Digit4':
                case 'Digit5':
                case 'Digit6':
                case 'Digit7':
                case 'Digit8':
                case 'Digit9':
                    this.selectedItem=parseInt(event.code.substring(5))-1;
                    break;
                case 'Digit0':
                    this.selectedItem=9

            }

            this._update()


        };


        document.addEventListener('keydown', onKeyDown);

        if(this.inifinityItems){
            setTimeout(()=>{
                for(let i=1;i<=11;i++){
                    this.addItem(i);
                }
            }, 5000);
        }
            

    }


    addItem(type: number, count?: number) {

        if (typeof count == 'undefined') {
            count = 1;
        }

        this._addItem(type, count);
        this.lastType = type;
        this._update();

    }


    removeItem() {

        let type=-1;

        
        if(this.items[this.selectedItem]){
            type=this.items[this.selectedItem].type;
            this.items[this.selectedItem].count--;
            if(this.items[this.selectedItem].count==0){
            this.items[this.selectedItem]=null;
            }
        }
        


        this._update()
        return type;

    }


    _addItem(type: number, count: number) {



        let firstEmpty = -1;
        const items = this.items.filter((item, i) => {
            if ((!item) && firstEmpty == -1) {
                firstEmpty = i;
            }

            return item && item.type == type;
        })

        let item = null;

        if (items.length > 0) {
            item = items[0]
            item.count+=count;
        } else {
            item = {
                type: type,
                count: count
            }
            if (firstEmpty != -1) {
                this.items[firstEmpty] = item
            } else {
                this.items.push(item);
            }

        }




    }


    _update() {

        const inventoryBar = document.getElementById('inventory-bar');
        if (inventoryBar) {


            let childNodes = Array.from(inventoryBar.childNodes);

            for(let i=childNodes.length; i<Math.max(10, this.items.length);i++) {
                inventoryBar.appendChild(document.createElement('div'))   
            }

            childNodes = Array.from(inventoryBar.childNodes);

            childNodes.forEach((child, i) => {
        
                if(i>=this.items.length){
                    child.innerHTML = "";
                }
                child.className = "";
                delete child.dataset.itemCount;
                delete child.dataset.key;
                

                if(this.items[i]){
                    child.className = this.items[i].type
                    child.dataset.itemCount = this.inifinityItems?"∞":this.items[i].count;
                }

                if(child.firstChild){
                    if(!this.items[i]){
                        child.removeChild(child.firstChild);
                    }
                }

                if(!child.firstChild){
                    if(this.items[i]){
                        this.chunks.renderStaticCubePreview(this.items[i].type, child)
                    }
                }
                
                if(i<=9){
                    child.dataset.key = i+1;
                }
                if (this.selectedItem == i) {
                    child.classList.add('selected');
                }

            });

        }

    }

}