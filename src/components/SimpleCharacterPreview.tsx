import React, { useEffect, useMemo } from 'react';
import { useGLTF, useAnimations } from '@react-three/drei';
import * as THREE from 'three';
import { SkeletonUtils } from 'three-stdlib';
import { getModelById } from '../lib/schoolModels';
import { useFrame } from '@react-three/fiber';

interface SimpleCharacterPreviewProps {
  modelId: string;
  position?: { x: number; y: number; z: number };
  rotation?: { x: number; y: number; z: number };
  scale?: number;
}

export const SimpleCharacterPreview: React.FC<SimpleCharacterPreviewProps> = ({ 
  modelId,
  position = { x: 0, y: 0, z: 0 },
  rotation = { x: -6 * Math.PI / 180, y: 0, z: 0 },
  scale = 2.65
}) => {
  const model = getModelById(modelId);
  
  if (!model) {
    return (
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[1, 2, 1]} />
        <meshStandardMaterial color="gray" />
      </mesh>
    );
  }
  
  const { scene, animations } = useGLTF(model.idleAnimation);
  
  const clonedScene = useMemo(() => {
    const clone = SkeletonUtils.clone(scene);
    
    // Reset skeleton to bind pose and ensure visibility
    clone.traverse((child) => {
      if (child.isSkinnedMesh && child.skeleton) {
        child.skeleton.pose();
      }
      // Force visibility
      child.visible = true;
      child.frustumCulled = false;
      
      // Update matrix
      child.updateMatrix();
      child.updateMatrixWorld(true);
    });
    
    // Force update on clone itself
    clone.visible = true;
    clone.frustumCulled = false;
    clone.updateMatrixWorld(true);
    
    return clone;
  }, [scene]);
  
  const { actions, mixer } = useAnimations(animations, clonedScene);
  
  // Clean up mixer on unmount or model change
  useEffect(() => {
    return () => {
      mixer?.stopAllAction();
      mixer?.setTime(0);
    };
  }, [mixer, modelId]);
  
  useEffect(() => {
    if (actions && mixer) {
      // Stop all actions first
      mixer.stopAllAction();
      mixer.setTime(0);
      
      const idleAction = actions['Idle_11'] || actions['idle_11'] || actions['Idle'] || actions['idle'] || Object.values(actions)[0];
      if (idleAction) {
        // Ensure we start from the beginning
        idleAction.time = 0;
        idleAction.enabled = true;
        idleAction.setEffectiveTimeScale(1);
        idleAction.setEffectiveWeight(1);
        idleAction.paused = false;
        
        idleAction.reset();
        idleAction.fadeIn(0.2);
        idleAction.play();
        idleAction.setLoop(THREE.LoopRepeat, Infinity);
        idleAction.clampWhenFinished = false;
      }
    }
  }, [actions, mixer, modelId]);
  
  // Force continuous rendering and update animation
  useFrame((state, delta) => {
    // Update animation mixer
    if (mixer) {
      mixer.update(delta);
    }
  });
  
  return (
    <>
      <group 
        position={[position.x + 0.10, position.y + -3.60, position.z]}
        rotation={[rotation.x, rotation.y, rotation.z]}
        scale={[scale * 1.5, scale * 1.5, scale * 1.5]}
        frustumCulled={false}
      >
        <primitive 
          object={clonedScene}
          frustumCulled={false}
        />
      </group>
    </>
  );
};