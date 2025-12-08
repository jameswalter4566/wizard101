import React, { useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { useGLTF, useAnimations } from '@react-three/drei';
import * as THREE from 'three';

const AnimationInspector = ({ modelPath }: { modelPath: string }) => {
  const { scene, animations } = useGLTF(modelPath);
  const { actions } = useAnimations(animations, scene);
  const [currentAnimation, setCurrentAnimation] = useState<string>('');
  
  useEffect(() => {
    console.log('=== ANIMATION DEBUGGER ===');
    console.log('Model Path:', modelPath);
    console.log('Total Animations:', animations.length);
    
    if (animations.length > 0) {
      console.log('Animation Details:');
      animations.forEach((anim, index) => {
        console.log(`Animation ${index}:`);
        console.log(`  Name: "${anim.name}"`);
        console.log(`  Duration: ${anim.duration} seconds`);
        console.log(`  Tracks: ${anim.tracks.length}`);
        if (anim.tracks.length > 0) {
          console.log(`  First track: ${anim.tracks[0].name}`);
        }
      });
    }
    
    console.log('Available Actions:', Object.keys(actions));
    console.log('=========================');
  }, [animations, actions, modelPath]);
  
  const playAnimation = (name: string) => {
    // Stop all animations
    Object.values(actions).forEach(action => action?.stop());
    
    // Play selected animation
    if (actions[name]) {
      actions[name].reset().play();
      setCurrentAnimation(name);
      console.log(`Playing animation: "${name}"`);
    }
  };
  
  return (
    <div>
      <div style={{ position: 'absolute', top: 10, left: 10, background: 'white', padding: 10, borderRadius: 5 }}>
        <h3>Animation Debugger</h3>
        <p>Model: {modelPath.split('/').pop()}</p>
        <p>Current: {currentAnimation || 'None'}</p>
        <div style={{ marginTop: 10 }}>
          {Object.keys(actions).map(name => (
            <button 
              key={name}
              onClick={() => playAnimation(name)}
              style={{ 
                display: 'block', 
                margin: '5px 0', 
                padding: '5px 10px',
                background: currentAnimation === name ? '#4CAF50' : '#2196F3',
                color: 'white',
                border: 'none',
                borderRadius: 3,
                cursor: 'pointer'
              }}
            >
              {name}
            </button>
          ))}
        </div>
      </div>
      <primitive object={scene} scale={1.5} />
    </div>
  );
};

export const AnimationDebugger = () => {
  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <Canvas camera={{ position: [0, 5, 10], fov: 60 }}>
        <ambientLight intensity={0.8} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <AnimationInspector modelPath="/FIREWIZARDAMeshy_Merged_Animations.glb" />
      </Canvas>
    </div>
  );
};