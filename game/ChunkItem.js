
export default class ChunkItem {
    mesh;
    blocks = 0;
    triangles = 0;
    dirty = false;
    fromX = 0;
    fromY = 0;
    fromZ = 0;
    toX = 0;
    toY = 0;
    toZ = 0;
    x = 0;
    y = 0;
    z = 0;
    type = 0; // 0 = world, 1 = object
    blockList = 0;
    constructor() {

    }
}