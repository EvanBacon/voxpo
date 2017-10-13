export default class VoxelData {
    x;
    y;
    z;
    color;
    constructor() {
    }

    create = (buffer, i, subSample) => {
        this.x = (subSample ? buffer[i] & 0xFF / 2 : buffer[i++] & 0xFF);
        this.y = (subSample ? buffer[i] & 0xFF / 2 : buffer[i++] & 0xFF);
        this.z = (subSample ? buffer[i] & 0xFF / 2 : buffer[i++] & 0xFF);
        this.color = buffer[i] & 0xFF;
    }
}
