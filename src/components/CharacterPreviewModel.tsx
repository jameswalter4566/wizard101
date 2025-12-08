import React, { useEffect, useMemo } from 'react';
import { useGLTF, useAnimations } from '@react-three/drei';
import * as THREE from 'three';
import { SkeletonUtils } from 'three-stdlib';
import { getModelById } from '../lib/schoolModels';

interface CharacterPreviewModelProps {
  modelId: string;
  position: [number, number, number];
  rotation: number;
  scale: number;
}

export const CharacterPreviewModel: React.FC<CharacterPreviewModelProps> = ({ 
  modelId, 
  position, 
  rotation,
  scale
}) => {
  console.log('[CharacterPreviewModel] Rendering with props:', {
    modelId,
    position,
    rotation,
    scale
  });
  
  const model = getModelById(modelId);
  
  if (!model) {
    console.error(`[CharacterPreviewModel] Model not found: ${modelId}`);
    return null;
  }
  
  console.log('[CharacterPreviewModel] Loading model:', {
    modelId: model.id,
    path: model.idleAnimation
  });
  
  const { scene, animations } = useGLTF(model.idleAnimation);
  
  // Clone the scene using SkeletonUtils
  const clonedScene = useMemo(() => {
    console.log('[CharacterPreviewModel] Cloning scene...');
    const clone = SkeletonUtils.clone(scene);
    
    // Check bounds
    const box = new THREE.Box3().setFromObject(clone);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    
    console.log('[CharacterPreviewModel] Model bounds:', {
      size: [size.x.toFixed(2), size.y.toFixed(2), size.z.toFixed(2)],
      center: [center.x.toFixed(2), center.y.toFixed(2), center.z.toFixed(2)],
      min: [box.min.x.toFixed(2), box.min.y.toFixed(2), box.min.z.toFixed(2)],
      max: [box.max.x.toFixed(2), box.max.y.toFixed(2), box.max.z.toFixed(2)]
    });
    
    // Force update bounds
    clone.updateMatrixWorld(true);
    
    return clone;
  }, [scene]);
  
  const { actions } = useAnimations(animations, clonedScene);
  
  useEffect(() => {
    console.log('[CharacterPreviewModel] Setting up animations...', {
      hasActions: !!actions,
      actionCount: Object.keys(actions || {}).length,
      actionNames: Object.keys(actions || {})
    });
    
    // Play idle animation
    if (actions && Object.keys(actions).length > 0) {
      // Stop all animations first
      Object.values(actions).forEach(action => action?.stop());
      
      // Play idle animation
      const idleAction = actions['Idle_11'] || actions['idle_11'] || actions['Idle'] || actions['idle'] || Object.values(actions)[0];
      if (idleAction) {
        console.log('[CharacterPreviewModel] Playing idle animation');
        idleAction.reset();
        idleAction.play();
        idleAction.setLoop(THREE.LoopRepeat, Infinity);
      }
    }
  }, [actions, modelId]);
  
  console.log('[CharacterPreviewModel] Rendering group with:', {
    position,
    rotation: rotation * 180 / Math.PI,
    scale,
    innerScale: 1.5,
    innerPosition: [0.10, -3.60, 0]
  });
  
  return (
    <group position={position} rotation={[0, rotation, 0]} scale={[scale, scale, scale]}>
      <primitive 
        object={clonedScene}
        scale={1.5}
        position={[0.10, -3.60, 0]}
      />
      {/* Add a debug box to see if anything renders */}
      <mesh position={[0, 1, 0]}>
        <boxGeometry args={[1, 2, 1]} />
        <meshBasicMaterial color="red" wireframe />
      </mesh>
    </group>
  );
};