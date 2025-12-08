import React, { useEffect } from 'react';
import { useGLTF, useAnimations } from '@react-three/drei';
import * as THREE from 'three';

interface AnimationTesterProps {
  modelPath: string;
}

export const AnimationTester: React.FC<AnimationTesterProps> = ({ modelPath }) => {
  const { scene, animations } = useGLTF(modelPath);
  const { actions } = useAnimations(animations, scene);
  
  useEffect(() => {
    console.log(`[AnimationTester] Loading model: ${modelPath}`);
    console.log(`[AnimationTester] Found ${animations.length} animations:`);
    
    animations.forEach((animation, index) => {
      console.log(`[AnimationTester] Animation ${index}: "${animation.name}"`);
      console.log(`  - Duration: ${animation.duration} seconds`);
      console.log(`  - Tracks: ${animation.tracks.length}`);
    });
    
    console.log(`[AnimationTester] Available actions:`, Object.keys(actions));
    
    // Look for idle and walking animations
    const idleAction = actions['idle 11'] || actions['Idle 11'] || actions['idle'] || actions['Idle'];
    const walkingAction = actions['walking'] || actions['Walking'] || actions['walk'] || actions['Walk'] || actions['running'] || actions['Running'];
    
    console.log(`[AnimationTester] Idle action found:`, !!idleAction);
    console.log(`[AnimationTester] Walking action found:`, !!walkingAction);
  }, [animations, actions, modelPath]);
  
  return (
    <primitive 
      object={scene} 
      scale={1.5}
    />
  );
};