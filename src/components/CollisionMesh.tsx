import React, { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';

interface CollisionMeshProps {
  modelPath: string;
  onCollisionCheck?: (position: THREE.Vector3) => THREE.Vector3;
}

export const CollisionMesh: React.FC<CollisionMeshProps> = ({ modelPath, onCollisionCheck }) => {
  const { scene } = useGLTF(modelPath);
  const raycaster = useRef(new THREE.Raycaster());
  const { camera } = useThree();
  
  useEffect(() => {
    // Make collision mesh invisible but still check for collisions
    scene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.visible = false;
      }
    });
  }, [scene]);

  // Export collision check function
  useEffect(() => {
    if (onCollisionCheck) {
      const checkGroundHeight = (position: THREE.Vector3): THREE.Vector3 => {
        // Cast ray downward from above the player
        const origin = new THREE.Vector3(position.x, position.y + 10, position.z);
        const direction = new THREE.Vector3(0, -1, 0);
        
        raycaster.current.set(origin, direction);
        
        // Check intersection with the scene
        const intersections = raycaster.current.intersectObject(scene, true);
        
        if (intersections.length > 0) {
          // Get the highest point (first intersection)
          const groundY = intersections[0].point.y;
          // Add offset for player height
          return new THREE.Vector3(position.x, groundY + 2.8, position.z);
        }
        
        // Return original position if no collision
        return position;
      };
      
      // Pass the function to parent
      onCollisionCheck(checkGroundHeight);
    }
  }, [scene, onCollisionCheck]);

  return <primitive object={scene} />;
};

// Collision handler hook
export const useCollisionDetection = (townModelPath: string) => {
  const collisionCheckRef = useRef<((pos: THREE.Vector3) => THREE.Vector3) | null>(null);
  
  const setCollisionCheck = (checkFn: (pos: THREE.Vector3) => THREE.Vector3) => {
    collisionCheckRef.current = checkFn;
  };
  
  const checkCollision = (position: number[]): number[] => {
    if (collisionCheckRef.current) {
      const pos = new THREE.Vector3(position[0], position[1], position[2]);
      const adjustedPos = collisionCheckRef.current(pos);
      return [adjustedPos.x, adjustedPos.y, adjustedPos.z];
    }
    return position;
  };
  
  return { setCollisionCheck, checkCollision };
};