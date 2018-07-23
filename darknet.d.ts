/// <reference types="node" />
export declare class DarknetBase {
    darknet: any;
    meta: any;
    net: any;
    netSize: number;
    names: string[];
    private memoryIndex;
    private memorySlotsUsed;
    private memoryCount;
    private memory;
    /**
     * A new instance of pjreddie's darknet. Create an instance as soon as possible in your app, because it takes a while to init.
     * @param config
     */
    constructor(config: IDarknetConfig);
    resetMemory(): void;
    private makeMemory;
    private rememberNet;
    private avgPrediction;
    private getArrayFromBuffer;
    private bufferToDetections;
    predictionBufferToDetections(buffer: Buffer, length: number): Detection[];
    protected _detectAsync(net: any, meta: any, image: any, thresh?: number, hier_thresh?: number, nms?: number): Promise<Detection[]>;
    /**
     * Get a Darknet Image async from path
     * @param path
     * @returns Promise<IMAGE>
     */
    getImageFromPathAsync(path: String): Promise<{}>;
    /**
     * convert darknet image to rgb buffer
     * @param {IMAGE} image
     * @returns {Buffer}
     */
    imageToRGBBuffer(image: any): Buffer;
    private rgbToDarknet;
    getImageFromDarknetBuffer(buffer: Float32Array, w: number, h: number, c: number): any;
    /**
     * Transform an RGB buffer to a darknet encoded image
     * @param buffer - rgb buffer
     * @param w - width
     * @param h - height
     * @param c - channels
     * @returns {Promise<IMAGE>}
     */
    RGBBufferToImageAsync(buffer: Buffer, w: number, h: number, c: number): Promise<any>;
    /**
     * Asynchronously detect objects in an image.
     * @param image
     * @param config
     * @returns A promise
     */
    detectAsync(image: string | IBufferImage, config?: IConfig): Promise<Detection[]>;
    detectFromImageAsync(image: any, config?: IConfig): Promise<Detection[]>;
}
export interface IConfig {
    thresh?: number;
    hier_thresh?: number;
    nms?: number;
}
export interface IBufferImage {
    b: Buffer;
    w: number;
    h: number;
    c: number;
}
export declare type IClasses = string[];
export interface IDarknetConfig {
    weights: string;
    config: string;
    names?: string[];
    namefile?: string;
    memory?: number;
}
export interface Detection {
    name: string;
    prob: number;
    box: {
        x: number;
        y: number;
        w: number;
        h: number;
    };
}
export { Darknet } from './detector';
export { Darknet as DarknetExperimental } from './detector';
