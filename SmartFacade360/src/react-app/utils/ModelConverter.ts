
import * as THREE from 'three';
import { OBJLoader } from 'three-stdlib';
import { FBXLoader } from 'three-stdlib';
import { GLTFExporter } from 'three-stdlib';

export const convertModelToGLB = async (url: string, type: string): Promise<string> => {
    return new Promise((resolve, reject) => {
        let loader: any;

        if (type === 'obj') {
            loader = new OBJLoader();
        } else if (type === 'fbx') {
            loader = new FBXLoader();
        } else {
            return reject(new Error(`Unsupported type for conversion: ${type}`));
        }

        loader.load(
            url,
            (object: THREE.Object3D) => {
                const exporter = new GLTFExporter();
                const options = {
                    binary: true,
                    // embedImages: true, // Usually default for binary, but good to note
                    // animations: object.animations // If we had animations
                };

                exporter.parse(
                    object,
                    (result) => {
                        if (result instanceof ArrayBuffer) {
                            const blob = new Blob([result], { type: 'model/gltf-binary' });
                            const glbUrl = URL.createObjectURL(blob);
                            resolve(glbUrl);
                        } else {
                            // Should not happen with binary: true, but handling just in case
                            const blob = new Blob([JSON.stringify(result)], { type: 'model/gltf+json' });
                            const glbUrl = URL.createObjectURL(blob);
                            resolve(glbUrl);
                        }
                    },
                    (error) => {
                        console.error('An error happened during GLTF export:', error);
                        reject(error);
                    },
                    options
                );
            },
            (xhr: ProgressEvent) => {
                console.log((xhr.loaded / xhr.total * 100) + '% loaded');
            },
            (error: ErrorEvent) => {
                console.error('An error happened during loading:', error);
                reject(error);
            }
        );
    });
};
