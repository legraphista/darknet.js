"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = y[op[0] & 2 ? "return" : op[0] ? "throw" : "next"]) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [0, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var ffi = require("ffi");
var ref = require("ref");
var Struct = require("ref-struct");
var fs_1 = require("fs");
var debug = require('debug')('darknet');
var char_pointer = ref.refType('char');
var float_pointer = ref.refType('float');
var float_pointer_pointer = ref.coerceType('float **');
var int_pointer = ref.refType('int');
var BBOX = Struct({
    'x': 'float',
    'y': 'float',
    'w': 'float',
    'h': 'float'
});
var DETECTION = Struct({
    'bbox': BBOX,
    'classes': 'int',
    'prob': float_pointer,
    'mask': float_pointer,
    'objectness': 'float',
    'sort_class': 'int'
});
var IMAGE = Struct({
    'w': 'int',
    'h': 'int',
    'c': 'int',
    'data': float_pointer
});
var METADATA = Struct({
    'classes': 'int',
    'names': 'string'
});
var detection_pointer = ref.refType(DETECTION);
var library = __dirname + "/libdarknet";
var DarknetBase = /** @class */ (function () {
    /**
     * A new instance of pjreddie's darknet. Create an instance as soon as possible in your app, because it takes a while to init.
     * @param config
     */
    function DarknetBase(config) {
        this.memoryIndex = 0;
        this.memorySlotsUsed = 0;
        if (!config)
            throw new Error("A config file is required");
        if (!config.names && !config.namefile)
            throw new Error("Config must include detection class names");
        if (!config.names && config.namefile)
            config.names = fs_1.readFileSync(config.namefile, 'utf8').split('\n');
        if (!config.names)
            throw new Error("No names detected.");
        if (!config.config)
            throw new Error("Config must include location to yolo config file");
        if (!config.weights)
            throw new Error("config must include the path to trained weights");
        this.names = config.names.filter(function (a) { return a.split("").length > 0; });
        this.memoryCount = config.memory || 3;
        this.meta = new METADATA;
        this.meta.classes = this.names.length;
        this.meta.names = this.names.join('\n');
        this.darknet = ffi.Library(library, {
            'float_to_image': [IMAGE, ['int', 'int', 'int', float_pointer]],
            'load_image_color': [IMAGE, ['string', 'int', 'int']],
            'network_predict_image': [float_pointer, ['pointer', IMAGE]],
            'get_network_boxes': [detection_pointer, ['pointer', 'int', 'int', 'float', 'float', int_pointer, 'int', int_pointer]],
            'do_nms_obj': ['void', [detection_pointer, 'int', 'int', 'float']],
            'free_image': ['void', [IMAGE]],
            'free_detections': ['void', [detection_pointer, 'int']],
            'load_network': ['pointer', ['string', 'string', 'int']],
            'get_metadata': [METADATA, ['string']],
            'network_output_size': ['int', ['pointer']],
            'network_remember_memory': ['void', ['pointer', float_pointer_pointer, 'int']],
            'network_avg_predictions': [detection_pointer, ['pointer', 'int', float_pointer_pointer, 'int', int_pointer, 'int', 'int', 'float', 'float']],
            'network_memory_make': [float_pointer_pointer, ['int', 'int']],
            'network_memory_free': ['void', [float_pointer_pointer, 'int']]
        });
        this.net = this.darknet.load_network(config.config, config.weights, 0);
        this.netSize = this.darknet.network_output_size(this.net);
        this.makeMemory();
    }
    DarknetBase.prototype.resetMemory = function () {
        debug('resetting memory');
        this.darknet.network_memory_free(this.memory, this.memoryCount);
        this.makeMemory();
    };
    DarknetBase.prototype.makeMemory = function () {
        debug('making memory');
        this.memoryIndex = 0;
        this.memory = this.darknet.network_memory_make(this.memoryCount, this.netSize);
        this.memorySlotsUsed = 0;
    };
    DarknetBase.prototype.rememberNet = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        debug('remember net', { index: this.memoryIndex, slots: this.memorySlotsUsed });
                        return [4 /*yield*/, new Promise(function (res, rej) { return _this.darknet.network_remember_memory.async(_this.net, _this.memory, _this.memoryIndex, function (e) { return e ? rej(e) : res(); }); })];
                    case 1:
                        _a.sent();
                        this.memoryIndex = (this.memoryIndex + 1) % this.memoryCount;
                        this.memorySlotsUsed = Math.min(this.memorySlotsUsed + 1, this.memoryCount);
                        return [2 /*return*/];
                }
            });
        });
    };
    DarknetBase.prototype.avgPrediction = function (_a) {
        var w = _a.w, h = _a.h, thresh = _a.thresh, hier = _a.hier;
        return __awaiter(this, void 0, void 0, function () {
            var pnum, buff;
            var _this = this;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        debug('predicting');
                        pnum = ref.alloc('int');
                        return [4 /*yield*/, new Promise(function (res, rej) { return _this.darknet.network_avg_predictions.async(_this.net, _this.netSize, _this.memory, _this.memorySlotsUsed, pnum, w, h, thresh, hier, function (e, d) { return e ? rej(e) : res(d); }); })];
                    case 1:
                        buff = _b.sent();
                        return [2 /*return*/, { buff: buff, num: pnum.deref() }];
                }
            });
        });
    };
    DarknetBase.prototype.getArrayFromBuffer = function (buffer, length, type) {
        var array = [];
        for (var i = 0; i < length; i++) {
            array.push(ref.get(ref.reinterpret(buffer, type.size, i * type.size), 0, type));
        }
        return array;
    };
    DarknetBase.prototype.bufferToDetections = function (buffer, length) {
        var detections = [];
        for (var i = 0; i < length; i++) {
            var det = ref.get(ref.reinterpret(buffer, 48, i * DETECTION.size), 0, DETECTION);
            var prob = this.getArrayFromBuffer(det.prob, this.meta.classes, ref.types.float);
            for (var j = 0; j < this.meta.classes; j++) {
                if (prob[j] > 0) {
                    var b = det.bbox;
                    detections.push({
                        name: this.names[j],
                        prob: prob[j],
                        box: {
                            x: b.x,
                            y: b.y,
                            w: b.w,
                            h: b.h
                        }
                    });
                }
            }
        }
        return detections;
    };
    DarknetBase.prototype.predictionBufferToDetections = function (buffer, length) {
        return this.bufferToDetections(buffer, length);
    };
    DarknetBase.prototype._detectAsync = function (net, meta, image, thresh, hier_thresh, nms) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, dets, num, detections;
            var _this = this;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, new Promise(function (res, rej) {
                            return _this.darknet.network_predict_image.async(net, image, function (e) { return e ? rej(e) : res(); });
                        })];
                    case 1:
                        _b.sent();
                        return [4 /*yield*/, this.rememberNet()];
                    case 2:
                        _b.sent();
                        return [4 /*yield*/, this.avgPrediction({
                                w: image.w,
                                h: image.h,
                                hier: hier_thresh,
                                thresh: thresh
                            })];
                    case 3:
                        _a = _b.sent(), dets = _a.buff, num = _a.num;
                        return [4 /*yield*/, new Promise(function (res, rej) {
                                return _this.darknet.do_nms_obj.async(dets, num, meta.classes, nms, function (e) { return e ? rej(e) : res(); });
                            })];
                    case 4:
                        _b.sent();
                        detections = this.bufferToDetections(dets, num);
                        this.darknet.free_detections(dets, num);
                        return [2 /*return*/, detections];
                }
            });
        });
    };
    /**
     * Get a Darknet Image async from path
     * @param path
     * @returns Promise<IMAGE>
     */
    DarknetBase.prototype.getImageFromPathAsync = function (path) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                return [2 /*return*/, new Promise(function (res, rej) {
                        return _this.darknet.load_image_color.async(path, 0, 0, function (e, image) { return e ? rej(e) : res(image); });
                    })];
            });
        });
    };
    /**
     * convert darknet image to rgb buffer
     * @param {IMAGE} image
     * @returns {Buffer}
     */
    DarknetBase.prototype.imageToRGBBuffer = function (image) {
        var w = image.w;
        var h = image.h;
        var c = image.c;
        var imageElements = w * h * c;
        var imageData = new Float32Array(image.data.reinterpret(imageElements * Float32Array.BYTES_PER_ELEMENT, 0).buffer, 0, imageElements);
        var rgbBuffer = Buffer.allocUnsafe(imageData.length);
        var step = c * w;
        var i, k, j;
        for (i = 0; i < h; ++i) {
            for (k = 0; k < c; ++k) {
                for (j = 0; j < w; ++j) {
                    rgbBuffer[i * step + j * c + k] = imageData[k * w * h + i * w + j] * 255;
                }
            }
        }
        return rgbBuffer;
    };
    DarknetBase.prototype.rgbToDarknet = function (buffer, w, h, c) {
        var imageElements = w * h * c;
        var floatBuff = new Float32Array(imageElements);
        var step = w * c;
        var i, k, j;
        for (i = 0; i < h; ++i) {
            for (k = 0; k < c; ++k) {
                for (j = 0; j < w; ++j) {
                    floatBuff[k * w * h + i * w + j] = buffer[i * step + j * c + k] / 255;
                }
            }
        }
        return floatBuff;
    };
    DarknetBase.prototype.getImageFromDarknetBuffer = function (buffer, w, h, c) {
        return this.darknet.float_to_image(w, h, c, new Uint8Array(buffer.buffer, 0, buffer.length * Float32Array.BYTES_PER_ELEMENT));
    };
    /**
     * Transform an RGB buffer to a darknet encoded image
     * @param buffer - rgb buffer
     * @param w - width
     * @param h - height
     * @param c - channels
     * @returns {Promise<IMAGE>}
     */
    DarknetBase.prototype.RGBBufferToImageAsync = function (buffer, w, h, c) {
        return __awaiter(this, void 0, void 0, function () {
            var floatBuff;
            var _this = this;
            return __generator(this, function (_a) {
                floatBuff = this.rgbToDarknet(buffer, w, h, c);
                return [2 /*return*/, new Promise(function (res, rej) { return _this.darknet.float_to_image.async(w, h, c, new Uint8Array(floatBuff.buffer, 0, floatBuff.length * Float32Array.BYTES_PER_ELEMENT), function (e, image) { return e ? rej(e) : res(image); }); })];
            });
        });
    };
    /**
     * Asynchronously detect objects in an image.
     * @param image
     * @param config
     * @returns A promise
     */
    DarknetBase.prototype.detectAsync = function (image, config) {
        return __awaiter(this, void 0, void 0, function () {
            var thresh, hier_thresh, nms, darkNetLoadedImage, imageData, _a, detection;
            var _this = this;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!config)
                            config = {};
                        thresh = (config.thresh) ? config.thresh : 0.5;
                        hier_thresh = (config.hier_thresh) ? config.hier_thresh : 0.5;
                        nms = (config.nms) ? config.nms : 0.5;
                        darkNetLoadedImage = typeof image === 'string';
                        if (!(typeof image === 'string')) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.getImageFromPathAsync(image)];
                    case 1:
                        _a = _b.sent();
                        return [3 /*break*/, 4];
                    case 2: return [4 /*yield*/, this.RGBBufferToImageAsync(image.b, image.w, image.h, image.c)];
                    case 3:
                        _a = _b.sent();
                        _b.label = 4;
                    case 4:
                        imageData = _a;
                        return [4 /*yield*/, this._detectAsync(this.net, this.meta, imageData, thresh, hier_thresh, nms)];
                    case 5:
                        detection = _b.sent();
                        if (!darkNetLoadedImage) return [3 /*break*/, 7];
                        // memory is owned by the darknet lib
                        return [4 /*yield*/, new Promise(function (res, rej) {
                                return _this.darknet.free_image.async(imageData, function (e) { return e ? rej(e) : res(); });
                            })];
                    case 6:
                        // memory is owned by the darknet lib
                        _b.sent();
                        return [3 /*break*/, 7];
                    case 7: return [2 /*return*/, detection];
                }
            });
        });
    };
    DarknetBase.prototype.detectFromImageAsync = function (image, config) {
        return __awaiter(this, void 0, void 0, function () {
            var thresh, hier_thresh, nms;
            return __generator(this, function (_a) {
                if (!config)
                    config = {};
                thresh = (config.thresh) ? config.thresh : 0.5;
                hier_thresh = (config.hier_thresh) ? config.hier_thresh : 0.5;
                nms = (config.nms) ? config.nms : 0.5;
                return [2 /*return*/, this._detectAsync(this.net, this.meta, image, thresh, hier_thresh, nms)];
            });
        });
    };
    return DarknetBase;
}());
exports.DarknetBase = DarknetBase;
var detector_1 = require("./detector");
exports.Darknet = detector_1.Darknet;
var detector_2 = require("./detector");
exports.DarknetExperimental = detector_2.Darknet;
