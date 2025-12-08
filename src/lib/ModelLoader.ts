import { GLTFLoader, GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { LoadingManager } from 'three';
import { SkeletonUtils } from 'three-stdlib';

class ModelLoader {
  private static instance: ModelLoader;
  private loader: GLTFLoader;
  private loadingManager: LoadingManager;
  private modelCache: Map<string, GLTF> = new Map();

  private constructor() {
    this.loadingManager = new LoadingManager();
    this.loader = new GLTFLoader(this.loadingManager);
  }

  static getInstance(): ModelLoader {
    if (!ModelLoader.instance) {
      ModelLoader.instance = new ModelLoader();
    }
    return ModelLoader.instance;
  }

  async loadModel(path: string): Promise<GLTF> {
    if (this.modelCache.has(path)) {
      return this.modelCache.get(path)!;
    }

    try {
      const gltf = await this.loader.loadAsync(path);
      this.modelCache.set(path, gltf);
      return gltf;
    } catch (error) {
      console.error(`Failed to load model: ${path}`, error);
      throw error;
    }
  }

  async loadModelWithClone(path: string): Promise<GLTF> {
    const originalGltf = await this.loadModel(path);
    
    return {
      ...originalGltf,
      scene: SkeletonUtils.clone(originalGltf.scene),
      animations: originalGltf.animations
    };
  }

  getLoadingManager(): LoadingManager {
    return this.loadingManager;
  }

  clearCache(): void {
    this.modelCache.clear();
  }

  removeFromCache(path: string): void {
    this.modelCache.delete(path);
  }
}

export default ModelLoader;