import React from 'react';
import Type from '../enums/Type';
import ChunkItem from './ChunkItem'
import Expo from 'expo';
import Chunk from '../enums/Chunk';
import VoxelData from './VoxelData';

export default class Vox {
    constructor(scene, world) {
        this.scene = scene;
        this.world = world;
    }
    voxColors = [
        0x00000000, 0xffffffff, 0xffccffff, 0xff99ffff, 0xff66ffff, 0xff33ffff, 0xff00ffff, 0xffffccff, 0xffccccff, 0xff99ccff, 0xff66ccff, 0xff33ccff, 0xff00ccff, 0xffff99ff, 0xffcc99ff, 0xff9999ff,
        0xff6699ff, 0xff3399ff, 0xff0099ff, 0xffff66ff, 0xffcc66ff, 0xff9966ff, 0xff6666ff, 0xff3366ff, 0xff0066ff, 0xffff33ff, 0xffcc33ff, 0xff9933ff, 0xff6633ff, 0xff3333ff, 0xff0033ff, 0xffff00ff,
        0xffcc00ff, 0xff9900ff, 0xff6600ff, 0xff3300ff, 0xff0000ff, 0xffffffcc, 0xffccffcc, 0xff99ffcc, 0xff66ffcc, 0xff33ffcc, 0xff00ffcc, 0xffffcccc, 0xffcccccc, 0xff99cccc, 0xff66cccc, 0xff33cccc,
        0xff00cccc, 0xffff99cc, 0xffcc99cc, 0xff9999cc, 0xff6699cc, 0xff3399cc, 0xff0099cc, 0xffff66cc, 0xffcc66cc, 0xff9966cc, 0xff6666cc, 0xff3366cc, 0xff0066cc, 0xffff33cc, 0xffcc33cc, 0xff9933cc,
        0xff6633cc, 0xff3333cc, 0xff0033cc, 0xffff00cc, 0xffcc00cc, 0xff9900cc, 0xff6600cc, 0xff3300cc, 0xff0000cc, 0xffffff99, 0xffccff99, 0xff99ff99, 0xff66ff99, 0xff33ff99, 0xff00ff99, 0xffffcc99,
        0xffcccc99, 0xff99cc99, 0xff66cc99, 0xff33cc99, 0xff00cc99, 0xffff9999, 0xffcc9999, 0xff999999, 0xff669999, 0xff339999, 0xff009999, 0xffff6699, 0xffcc6699, 0xff996699, 0xff666699, 0xff336699,
        0xff006699, 0xffff3399, 0xffcc3399, 0xff993399, 0xff663399, 0xff333399, 0xff003399, 0xffff0099, 0xffcc0099, 0xff990099, 0xff660099, 0xff330099, 0xff000099, 0xffffff66, 0xffccff66, 0xff99ff66,
        0xff66ff66, 0xff33ff66, 0xff00ff66, 0xffffcc66, 0xffcccc66, 0xff99cc66, 0xff66cc66, 0xff33cc66, 0xff00cc66, 0xffff9966, 0xffcc9966, 0xff999966, 0xff669966, 0xff339966, 0xff009966, 0xffff6666,
        0xffcc6666, 0xff996666, 0xff666666, 0xff336666, 0xff006666, 0xffff3366, 0xffcc3366, 0xff993366, 0xff663366, 0xff333366, 0xff003366, 0xffff0066, 0xffcc0066, 0xff990066, 0xff660066, 0xff330066,
        0xff000066, 0xffffff33, 0xffccff33, 0xff99ff33, 0xff66ff33, 0xff33ff33, 0xff00ff33, 0xffffcc33, 0xffcccc33, 0xff99cc33, 0xff66cc33, 0xff33cc33, 0xff00cc33, 0xffff9933, 0xffcc9933, 0xff999933,
        0xff669933, 0xff339933, 0xff009933, 0xffff6633, 0xffcc6633, 0xff996633, 0xff666633, 0xff336633, 0xff006633, 0xffff3333, 0xffcc3333, 0xff993333, 0xff663333, 0xff333333, 0xff003333, 0xffff0033,
        0xffcc0033, 0xff990033, 0xff660033, 0xff330033, 0xff000033, 0xffffff00, 0xffccff00, 0xff99ff00, 0xff66ff00, 0xff33ff00, 0xff00ff00, 0xffffcc00, 0xffcccc00, 0xff99cc00, 0xff66cc00, 0xff33cc00,
        0xff00cc00, 0xffff9900, 0xffcc9900, 0xff999900, 0xff669900, 0xff339900, 0xff009900, 0xffff6600, 0xffcc6600, 0xff996600, 0xff666600, 0xff336600, 0xff006600, 0xffff3300, 0xffcc3300, 0xff993300,
        0xff663300, 0xff333300, 0xff003300, 0xffff0000, 0xffcc0000, 0xff990000, 0xff660000, 0xff330000, 0xff0000ee, 0xff0000dd, 0xff0000bb, 0xff0000aa, 0xff000088, 0xff000077, 0xff000055, 0xff000044,
        0xff000022, 0xff000011, 0xff00ee00, 0xff00dd00, 0xff00bb00, 0xff00aa00, 0xff008800, 0xff007700, 0xff005500, 0xff004400, 0xff002200, 0xff001100, 0xffee0000, 0xffdd0000, 0xffbb0000, 0xffaa0000,
        0xff880000, 0xff770000, 0xff550000, 0xff440000, 0xff220000, 0xff110000, 0xffeeeeee, 0xffdddddd, 0xffbbbbbb, 0xffaaaaaa, 0xff888888, 0xff777777, 0xff555555, 0xff444444, 0xff222222, 0xff111111
    ];


    readInt = (buffer, from) => {
        return buffer[from] | (buffer[from + 1] << 8) | (buffer[from + 2] << 16) | (buffer[from + 3] << 24);
    }

    loadModel = async (filename, type) => {
        return new Promise(async (res, rej) => {


            const asset = Expo.Asset.fromModule(filename);
            if (!asset.localUri) {
                await asset.downloadAsync();
            }

            const oReq = new XMLHttpRequest();
            oReq.open("GET", asset.localUri, true);
            oReq.responseType = "arraybuffer";

            let chunk = 0;
            if (type == Type.object) {
                chunk = new ChunkItem();
                chunk.type = 1; // TBD: OBJECT ( MAGIC NUMBER)
                chunk.blockList = new Array();
            }



            oReq.onload = async (oEvent) => {
                let colors = [];
                let colors2 = undefined;
                let voxelData = [];

                console.log("Loaded model: " + oReq.responseURL);
                let arrayBuffer = oReq.response;
                if (arrayBuffer) {
                    let buffer = new Uint8Array(arrayBuffer);
                    let voxId = this.readInt(buffer, 0);
                    let version = this.readInt(buffer, 4);
                    // TBD: Check version to support
                    let i = 8;
                    while (i < buffer.length) {
                        let subSample = false;
                        let sizex = 0, sizey = 0, sizez = 0;
                        let id = String.fromCharCode(parseInt(buffer[i++])) +
                            String.fromCharCode(parseInt(buffer[i++])) +
                            String.fromCharCode(parseInt(buffer[i++])) +
                            String.fromCharCode(parseInt(buffer[i++]));

                        let chunkSize = this.readInt(buffer, i) & 0xFF;
                        i += 4;
                        let childChunks = this.readInt(buffer, i) & 0xFF;
                        i += 4;

                        if (id == "SIZE") {
                            sizex = this.readInt(buffer, i) & 0xFF;
                            i += 4;
                            sizey = this.readInt(buffer, i) & 0xFF;
                            i += 4;
                            sizez = this.readInt(buffer, i) & 0xFF;
                            i += 4;
                            if (sizex > 32 || sizey > 32) {
                                subSample = true;
                            }
                            i += chunkSize - 4 * 3;
                        } else if (id == "XYZI") {
                            let numVoxels = Math.abs(this.readInt(buffer, i));
                            i += 4;
                            voxelData = new Array(numVoxels);
                            for (let n = 0; n < voxelData.length; n++) {
                                ;
                                voxelData[n] = new VoxelData();
                                voxelData[n].create(buffer, i, subSample); // Read 4 bytes
                                i += 4;
                            }
                        } else if (id == "RGBA") {
                            colors2 = new Array(256);
                            for (let n = 0; n < 256; n++) {
                                let r = buffer[i++] & 0xFF;
                                let g = buffer[i++] & 0xFF;
                                let b = buffer[i++] & 0xFF;
                                let a = buffer[i++] & 0xFF;
                                colors2[n] = { 'r': r, 'g': g, 'b': b, 'a': a };
                            }
                        } else {
                            i += chunkSize;
                        }
                    }

                    if (voxelData == null || voxelData.length == 0) {
                        // return null;
                        res({});
                    }

                    for (let n = 0; n < voxelData.length; n++) {
                        if (colors2 == undefined) {
                            let c = voxColors[Math.abs(voxelData[n].color - 1)];
                            let cRGBA = {
                                b: (c & 0xff0000) >> 16,
                                g: (c & 0x00ff00) >> 8,
                                r: (c & 0x0000ff),
                                a: 1
                            };
                            // for(var x = (voxelData[n].x*size)-size; x < (voxelData[n].x*size)+size; x++) {
                            //     this.world.addBlock(x, voxelData[n].z*size, voxelData[n].y*size, [cRGBA.r,cRGBA.g,cRGBA.b]);
                            //     for(var z = (voxelData[n].z*size)-size; z < (voxelData[n].z*size)+size; z++) {
                            //         this.world.addBlock(voxelData[n].x*size, z, voxelData[n].y*size, [cRGBA.r,cRGBA.g,cRGBA.b]);
                            //         for(var y = (voxelData[n].y*size)-size; y < (voxelData[n].y*size)+size; y++) {
                            //             this.world.addBlock(voxelData[n].x*size, voxelData[n].z*size, y, [cRGBA.r,cRGBA.g,cRGBA.b]);
                            //             this.world.addBlock(voxelData[n].x*size, z, y, [cRGBA.r,cRGBA.g,cRGBA.b]);
                            //             this.world.addBlock(x, z, y, [cRGBA.r,cRGBA.g,cRGBA.b]);
                            //         }
                            //     }
                            // }
                            // this.world.addBlock(voxelData[n].x*size, voxelData[n].z*size, voxelData[n].y*size, [cRGBA.r,cRGBA.g,cRGBA.b]);
                            //       this.world.addBlock(voxelData[n].x, voxelData[n].z, voxelData[n].y, [cRGBA.r,cRGBA.g,cRGBA.b]);
                        } else {
                            let color = colors2[Math.abs(voxelData[n].color - 1)];
                            // for(var x = (voxelData[n].x*size)-size; x < (voxelData[n].x*size)+size; x++) {
                            //     this.world.addBlock(x, voxelData[n].z*size, voxelData[n].y*size, [color.r,color.g,color.b]);
                            //     for(var z = (voxelData[n].z*size)-size; z < (voxelData[n].z*size)+size; z++) {
                            //         this.world.addBlock(voxelData[n].x*size, z, voxelData[n].y*size, [color.r,color.g,color.b]);
                            //         for(var y = (voxelData[n].y*size)-size; y < (voxelData[n].y*size)+size; y++) {
                            //             this.world.addBlock(voxelData[n].x*size, voxelData[n].z*size, y, [color.r,color.g,color.b]);
                            //             this.world.addBlock(voxelData[n].x*size, z, y, [color.r,color.g,color.b]);
                            //             this.world.addBlock(x, z, y, [color.r,color.g,color.b]);
                            //         }
                            //     }
                            // }
                            //this.world.addBlock(voxelData[n].x*size, voxelData[n].z*size, voxelData[n].y*size, [color.r,color.g,color.b]);

                            //this.world.addBlock(voxelData[n].x, voxelData[n].z, 100-voxelData[n].y, [color.r,color.g,color.b]);
                            let x = voxelData[n].x;
                            let y = voxelData[n].y;
                            let z = voxelData[n].z;
                            if (type == Type.map) {
                                for (let x1 = x * 2 + 1; x1 < x * 2 + 3; x1++) {
                                    for (let z1 = z * 2 + 1; z1 < z * 2 + 3; z1++) {
                                        for (let y1 = y * 2 + 1; y1 < y * 2 + 3; y1++) {
                                            this.world.addBlock(x1, z1, 200 - y1, [color.r, color.g, color.b]); // TBD: 200 just for this map size.
                                        }
                                    }
                                }
                            } else if (type == Type.object) {
                                let b = new Object();
                                b.x = x + 5;
                                b.y = y + 10;
                                b.z = z + 5;
                                b.color = [color.r, color.g, color.b];
                                // b.val = (color.r & 0xFF) << 24 | (color.g & 0xFF) << 16 | (color.b & 0xFF) << 8;
                                this.world.addBlock(x + 5, z + 5, y + 10, [color.r, color.g, color.b]);
                                chunk.blockList.push(b);
                            }
                        }
                    }
                    if (type == Type.object) {
                        chunk.dirty = true;
                        chunk.fromX = 1000; // just some large value 
                        chunk.fromZ = 1000;
                        chunk.fromY = 1000;
                        chunk.type = Chunk.object;

                        for (let q = 0; q < chunk.blockList.length; q++) {
                            let b = chunk.blockList[q];
                            b.val = this.world.blocks[b.x][b.y][b.z];
                            if (b.x < chunk.fromX) {
                                chunk.fromX = b.x;
                            }
                            if (b.x > chunk.toX) {
                                chunk.toX = b.x;
                            }
                            if (b.y > chunk.toY) {
                                chunk.toY = b.y;
                            }
                            if (b.y < chunk.fromY) {
                                chunk.fromY = b.y;
                            }
                            if (b.z < chunk.fromZ) {
                                chunk.fromZ = b.z;
                            }
                            if (b.z > chunk.toZ) {
                                chunk.toZ = b.z;
                            }
                        }
                        // Increase area to view all voxels for mesh creation
                        chunk.fromX -= 2;
                        chunk.fromY -= 6;
                        chunk.fromZ -= 2;
                        chunk.toX += 2;
                        chunk.toY += 4;
                        chunk.toZ += 8;
                        this.world.rebuildChunk(chunk);
                        chunk.mesh.visible = false;

                        res({ vox: this, chunk })

                    } else {
                        this.world.rebuildDirtyChunks(1);
                        res({ vox: this });
                    }
                }
            }

            oReq.send(null);
        })
    }
}


