"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.getEmbeddingProvider = getEmbeddingProvider;
exports.getEmbeddingModelName = getEmbeddingModelName;
exports.generateEmbedding = generateEmbedding;
const MODEL_NAME = "Xenova/all-MiniLM-L6-v2";
let embedderPromise = null;
async function loadEmbedder() {
    if (!embedderPromise) {
        embedderPromise = Promise.resolve().then(() => __importStar(require("@xenova/transformers"))).then(({ pipeline }) => pipeline("feature-extraction", MODEL_NAME));
    }
    return embedderPromise;
}
function toNumberArray(value) {
    if (value instanceof Float32Array) {
        return Array.from(value);
    }
    if (Array.isArray(value)) {
        return value.map((item) => Number(item));
    }
    if (value && typeof value === "object" && "data" in value) {
        const data = value.data;
        if (data !== undefined) {
            return toNumberArray(data);
        }
    }
    throw new Error("Unsupported embedding output");
}
class LocalEmbeddingProvider {
    getModelName() {
        return MODEL_NAME;
    }
    async embed(text) {
        const embedder = await loadEmbedder();
        const output = await embedder(text, { pooling: "mean", normalize: true });
        return toNumberArray(output);
    }
}
const provider = new LocalEmbeddingProvider();
function getEmbeddingProvider() {
    return provider;
}
function getEmbeddingModelName() {
    return provider.getModelName();
}
async function generateEmbedding(text) {
    return provider.embed(text);
}
