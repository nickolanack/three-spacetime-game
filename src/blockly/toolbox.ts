
import * as Blockly from 'blockly';


const allBlocks = {};
Object.keys(Blockly.Blocks).forEach(type => {
  let name = type.split('_').shift();
  name = name.slice(0, 1).toUpperCase() + name.slice(1)
  const block = Blockly.Blocks[type];
  if (typeof allBlocks[name] == 'undefined') {
    allBlocks[name] = {

      kind: "category",
      name: name,
      contents: []
    };
  }

  allBlocks[name].contents.push({
    kind: "block",
    type: type
  })

});


export const toolbox = {
  kind: "categoryToolbox",
  contents: Object.values(allBlocks)
};

