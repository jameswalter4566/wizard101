import React, { useRef, useEffect, useState, Suspense, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html, useGLTF, useAnimations } from '@react-three/drei';
import * as THREE from 'three';
import { SkeletonUtils } from 'three-stdlib';
import { getModelById, schoolModels } from '../lib/schoolModels';
import { ErrorBoundary } from 'react-error-boundary';

interface SchoolWizardProps {
  position: number[];
  rotation: number;
  chatMessage?: string;
  chatTime?: number;
  username?: string;
  modelId: string;
  isMoving?: boolean;
  isLocal?: boolean;
  usernameXOffset?: number;
  usernameYOffset?: number;
  modelXOffset?: number;
  modelYOffset?: number;
}

// Model component with animations
const AnimatedWizard = ({ 
  modelPath, 
  position, 
  rotation,
  isMoving,
  isLocal = false,
  modelId,
  modelXOffset = 0,
  modelYOffset = 0
}: { 
  modelPath: string;
  position: number[];
  rotation: number;
  isMoving: boolean;
  isLocal?: boolean;
  modelId?: string;
  modelXOffset?: number;
  modelYOffset?: number;
}) => {
  const group = useRef<THREE.Group>(null);
  const previousModelPath = useRef(modelPath);
  const currentActionRef = useRef<string | null>(null);
  
  
  // Load GLTF with error handling
  let gltfData;
  try {
    console.log(`[AnimatedWizard] 💾 Loading GLTF:`, { modelPath, isLocal });
    gltfData = useGLTF(modelPath);
    
    // Verify we got the correct model
    if (gltfData && gltfData.nodes) {
      const nodeNames = Object.keys(gltfData.nodes).slice(0, 5); // First 5 node names
      console.log(`[AnimatedWizard] 🔍 Loaded model verification:`, {
        requestedPath: modelPath,
        nodeCount: Object.keys(gltfData.nodes).length,
        sampleNodes: nodeNames,
        hasAnimations: !!gltfData.animations && gltfData.animations.length > 0,
        animationCount: gltfData.animations?.length || 0
      });
    }
  } catch (error) {
    console.error(`[AnimatedWizard] ❌ GLTF LOAD ERROR:`, {
      modelPath,
      error: error.message,
      stack: error.stack
    });
    throw error;
  }
  
  const { scene, animations } = gltfData;
  
  // Clone the scene using SkeletonUtils to preserve animations properly
  const clonedScene = useMemo(() => {
    try {
      console.log(`[AnimatedWizard] 🔧 Cloning scene:`, {
        modelPath,
        isLocal,
        sceneChildren: scene.children.length,
        sceneName: scene.name || 'unnamed'
      });
      
      // Use SkeletonUtils.clone for proper skeletal animation cloning
      const clone = SkeletonUtils.clone(scene);
      
      // Log model bounds to understand positioning
      const box = new THREE.Box3().setFromObject(clone);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());
      
      // Calculate ideal username position based on model
      const modelHeight = size.y;
      const modelTop = box.max.y;
      const suggestedUsernameOffset = modelTop + 0.5; // 0.5 units above model
      
      console.log(`[AnimatedWizard] 📏 Model bounds & Username Positioning:`, {
        modelPath,
        '=== MODEL MEASUREMENTS ===': '',
        center: [center.x.toFixed(2), center.y.toFixed(2), center.z.toFixed(2)],
        size: [size.x.toFixed(2), size.y.toFixed(2), size.z.toFixed(2)],
        bounds: {
          min: [box.min.x.toFixed(2), box.min.y.toFixed(2), box.min.z.toFixed(2)],
          max: [box.max.x.toFixed(2), box.max.y.toFixed(2), box.max.z.toFixed(2)]
        },
        '=== USERNAME SUGGESTIONS ===': '',
        modelHeight: modelHeight.toFixed(2),
        modelTop: modelTop.toFixed(2),
        currentUsernameY: '0.8',
        suggestedUsernameY: suggestedUsernameOffset.toFixed(2),
        adjustment: (suggestedUsernameOffset - 0.8).toFixed(2)
      });
      
      return clone;
    } catch (error) {
      console.error(`[AnimatedWizard] ❌ SKELETONUTILS CLONE ERROR:`, {
        error: error.message,
        stack: error.stack,
        sceneType: scene?.type,
        modelPath,
        errorName: error.name,
        errorString: error.toString()
      });
      // Try regular clone as fallback
      try {
        console.warn(`[AnimatedWizard] ⚠️ Falling back to regular clone...`);
        return scene.clone();
      } catch (fallbackError) {
        console.error(`[AnimatedWizard] ❌ FALLBACK CLONE ALSO FAILED:`, fallbackError);
        return scene; // Last resort: use original
      }
    }
  }, [scene, animations.length, modelPath]);
  
  // Use animations with the cloned scene
  let actions;
  let mixer;
  try {
    const animResult = useAnimations(animations, clonedScene);
    actions = animResult.actions;
    mixer = animResult.mixer;
  } catch (error) {
    console.error(`[AnimatedWizard] ❌ ANIMATION SETUP ERROR:`, {
      error: error.message,
      stack: error.stack,
      hasClonedScene: !!clonedScene,
      animationCount: animations?.length
    });
    actions = {};
  }
  
  useEffect(() => {
    
    // Stop all previous animations when model changes
    if (previousModelPath.current !== modelPath) {
      Object.values(actions).forEach(action => {
        action?.stop();
      });
      previousModelPath.current = modelPath;
      currentActionRef.current = null; // Reset current action tracking
    }
    
    // Track current action
    let selectedAction = null;
    let selectedActionName = 'none';
    
    // Handle merged animation file
    if (modelPath.includes('Merged') || modelPath.includes('merged')) {
      if (actions && Object.keys(actions).length > 0) {
        // For merged files, select animation based on movement state
        Object.entries(actions).forEach(([name, action]) => {
          if (action) {
            action.stop();
          }
        });
        
        if (isMoving) {
          const runningAction = actions['Running'] || actions['running'] || actions['Walking'] || actions['walking'];
          selectedAction = runningAction;
          selectedActionName = 'Running/Walking';
          
          // Only switch if we're not already playing running animation
          if (currentActionRef.current !== 'running' && runningAction) {
            console.log(`[AnimatedWizard] Switching to RUNNING animation for ${isLocal ? 'LOCAL' : 'REMOTE'} player`);
            // Stop idle if playing
            const idleAction = actions['Idle_11'] || actions['idle_11'] || actions['Idle'] || actions['idle'];
            if (idleAction) idleAction.stop();
            
            runningAction.reset();
            runningAction.fadeIn(0.2);
            runningAction.play();
            runningAction.setLoop(THREE.LoopRepeat, Infinity);
            runningAction.clampWhenFinished = false;
            currentActionRef.current = 'running';
          }
        } else {
          const idleAction = actions['Idle_11'] || actions['idle_11'] || actions['Idle'] || actions['idle'];
          selectedAction = idleAction;
          selectedActionName = 'Idle';
          
          // Only switch if we're not already playing idle animation
          if (currentActionRef.current !== 'idle' && idleAction) {
            console.log(`[AnimatedWizard] Switching to IDLE animation for ${isLocal ? 'LOCAL' : 'REMOTE'} player`);
            // Stop running if playing
            const runningAction = actions['Running'] || actions['running'] || actions['Walking'] || actions['walking'];
            if (runningAction) runningAction.stop();
            
            idleAction.reset();
            idleAction.fadeIn(0.2);
            idleAction.play();
            idleAction.setLoop(THREE.LoopRepeat, Infinity);
            idleAction.clampWhenFinished = false;
            currentActionRef.current = 'idle';
          }
        }
      } else {
        console.error(`[AnimatedWizard] ❌ NO ACTIONS AVAILABLE for merged animation file`);
      }
    } else {
      // Single animation file - play the first animation if available
      if (actions && Object.keys(actions).length > 0) {
        const firstActionName = Object.keys(actions)[0];
        const firstAction = actions[firstActionName];
        selectedAction = firstAction;
        selectedActionName = firstActionName;
        
        // Only play if not already playing
        if (currentActionRef.current !== firstActionName && firstAction) {
          console.log(`[AnimatedWizard] Playing single animation: ${firstActionName}`);
          firstAction.reset();
          firstAction.fadeIn(0.2);
          firstAction.play();
          firstAction.setLoop(THREE.LoopRepeat, Infinity);
          firstAction.clampWhenFinished = false;
          currentActionRef.current = firstActionName;
        }
      } else {
        console.error(`[AnimatedWizard] ❌ NO ACTIONS AVAILABLE for single animation file`);
      }
    }
    
  }, [actions, modelPath, isMoving]); // Removed position and isLocal dependencies

  // Track frame count for debugging
  const frameCount = useRef(0);
  
  useFrame(() => {
    if (group.current) {
      // Position is now handled by parent SchoolWizard group
      // Only handle rotation here
      group.current.rotation.y = rotation;
      
      // Log model transform details every 90 frames
      if (frameCount.current % 90 === 0 && isLocal) {
        const worldPos = new THREE.Vector3();
        const worldScale = new THREE.Vector3();
        const worldQuat = new THREE.Quaternion();
        
        group.current.getWorldPosition(worldPos);
        group.current.getWorldScale(worldScale);
        group.current.getWorldQuaternion(worldQuat);
        
        console.log(`[AnimatedWizard Transform] Local player model:`, {
          frame: frameCount.current,
          localScale: group.current.scale.toArray().map(v => v.toFixed(2)),
          worldScale: worldScale.toArray().map(v => v.toFixed(2)),
          localPosition: group.current.position.toArray().map(v => v.toFixed(2)),
          worldPosition: worldPos.toArray().map(v => v.toFixed(2)),
          rotation: rotation.toFixed(2)
        });
      }
    }
    frameCount.current++;
  });


  // Wrap in try-catch to see if primitive rendering is failing
  try {
    // Use debug offsets from props
    const modelOffset = [modelXOffset, modelYOffset, 0];
    
    return (
      <group ref={group} frustumCulled={false}>
        <primitive 
          object={clonedScene} 
          scale={1.5}
          position={modelOffset}  // Use adjustable offsets
          frustumCulled={false}
          renderOrder={isLocal ? 1000 : 0}  // Ensure local player renders on top
        />
      </group>
    );
  } catch (renderError) {
    console.error(`[AnimatedWizard] ❌ RENDER ERROR:`, {
      error: renderError.message,
      stack: renderError.stack,
      isLocal,
      modelPath,
      hasClonedScene: !!clonedScene
    });
    throw renderError;
  }
};

const SchoolWizard: React.FC<SchoolWizardProps> = React.memo(({ 
  position, 
  rotation, 
  chatMessage, 
  chatTime, 
  username,
  modelId,
  isMoving = false,
  isLocal = false,
  usernameXOffset = 0,
  usernameYOffset = 0,
  modelXOffset,
  modelYOffset
}) => {
  const wizardRef = useRef<THREE.Group>(null);
  const model = getModelById(modelId);
  const previousMovingState = useRef(isMoving);
  const previousRotation = useRef(rotation);
  const mountCount = useRef(0);
  const frameCount = useRef(0);
  
  // Log model selection
  console.log(`[SchoolWizard] 🎮 MODEL SELECTION:`, {
    username,
    modelId,
    modelFound: !!model,
    modelDetails: model ? {
      id: model.id,
      name: model.name,
      idleAnimation: model.idleAnimation,
      runningAnimation: model.runningAnimation,
      cameraXOffset: model.cameraXOffset,
      modelYOffset: model.modelYOffset
    } : 'NO MODEL FOUND',
    isLocal,
    position,
    timestamp: new Date().toISOString()
  });
  
  // Special logging for fire/ice model confusion
  if (modelId === 'fire-a' && model?.idleAnimation?.includes('ICE')) {
    console.error(`[SchoolWizard] ⚠️ CRITICAL: Fire model loading ICE animation!`, {
      requestedModelId: modelId,
      actualModel: model
    });
  }
  if (modelId === 'ice-a' && model?.idleAnimation?.includes('FIRE')) {
    console.error(`[SchoolWizard] ⚠️ CRITICAL: Ice model loading FIRE animation!`, {
      requestedModelId: modelId,
      actualModel: model
    });
  }
  
  // Log mount/unmount
  useEffect(() => {
    mountCount.current++;
    console.log(`[SchoolWizard] 🚀 ${username || 'Unknown'} MOUNTED:`, {
      mountCount: mountCount.current,
      position,
      modelId,
      model: model?.name,
      isLocal
    });
    
    return () => {
      console.log(`[SchoolWizard] 🚪 ${username || 'Unknown'} UNMOUNTED (was mounted ${mountCount.current} times)`);
    };
  }, []); // Only run on mount/unmount
  
  // Track positions every frame for debugging
  useFrame(() => {
    if (wizardRef.current && username && frameCount.current % 30 === 0) { // Log every 30 frames
      const worldPos = new THREE.Vector3();
      wizardRef.current.getWorldPosition(worldPos);
      
      const box = new THREE.Box3().setFromObject(wizardRef.current);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());
      
      // Calculate where the username should be positioned
      const modelScale = 1.5; // From AnimatedWizard component
      const usernameLocalY = 0.8 + usernameYOffset;
      const modelHeight = size.y;
      const modelTop = box.max.y;
      const idealUsernameY = modelTop + 0.5; // 0.5 units above model top
      const currentUsernameY = worldPos.y + usernameLocalY;
      const yAdjustmentNeeded = idealUsernameY - currentUsernameY;
      
      console.log(`[USERNAME POSITIONING DEBUG] ${username}:`, {
        frame: frameCount.current,
        '=== GROUP POSITIONS ===': '',
        groupLocalPos: position,
        groupWorldPos: [worldPos.x.toFixed(2), worldPos.y.toFixed(2), worldPos.z.toFixed(2)],
        '=== MODEL BOUNDS ===': '',
        modelBounds: {
          min: [box.min.x.toFixed(2), box.min.y.toFixed(2), box.min.z.toFixed(2)],
          max: [box.max.x.toFixed(2), box.max.y.toFixed(2), box.max.z.toFixed(2)],
          center: [center.x.toFixed(2), center.y.toFixed(2), center.z.toFixed(2)],
          size: [size.x.toFixed(2), size.y.toFixed(2), size.z.toFixed(2)]
        },
        modelHeight: modelHeight.toFixed(2),
        modelTop: modelTop.toFixed(2),
        modelScale: modelScale,
        '=== USERNAME CALCULATIONS ===': '',
        usernameLocalY: usernameLocalY.toFixed(2),
        currentUsernameWorldY: currentUsernameY.toFixed(2),
        idealUsernameWorldY: idealUsernameY.toFixed(2),
        yAdjustmentNeeded: yAdjustmentNeeded.toFixed(2),
        '=== OFFSETS ===': '',
        usernameXOffset: usernameXOffset.toFixed(2),
        usernameYOffset: usernameYOffset.toFixed(2),
        modelCenterOffset: [(center.x - worldPos.x).toFixed(2), (center.y - worldPos.y).toFixed(2)],
        '=== HTML COMPONENT ===': '',
        htmlPosition: [usernameXOffset, usernameLocalY, 0],
        distanceFactor: 8,
        sprite: true,
        transform: true
      });
    }
    frameCount.current++;
  });
  
  // Calculate model bounds and positioning (removed excessive logging)
  
  
  if (!model) {
    // Fallback to default wizard if model not found
    return <DefaultWizard position={position} rotation={rotation} chatMessage={chatMessage} chatTime={chatTime} username={username} />;
  }

  // Log animation and rotation changes
  useEffect(() => {
    if (previousMovingState.current !== isMoving) {
      console.log(`[SchoolWizard Animation State] ${username}: isMoving changed from ${previousMovingState.current} to ${isMoving}`);
      previousMovingState.current = isMoving;
    }
  }, [isMoving, username]);
  
  useEffect(() => {
    if (Math.abs(previousRotation.current - rotation) > 0.01) {
      console.log(`[ROTATION CHANGE] ${username}: rotation changed from ${previousRotation.current.toFixed(2)} to ${rotation.toFixed(2)}, delta: ${(rotation - previousRotation.current).toFixed(2)}`);
      previousRotation.current = rotation;
    }
  }, [rotation, username]);

  // Select animation based on movement state
  const modelPath = isMoving ? model.runningAnimation : model.idleAnimation;
  
  // Log model path changes
  useEffect(() => {
    console.log(`[SchoolWizard] ${username} modelPath changed to:`, modelPath, 'isMoving:', isMoving);
  }, [modelPath, username, isMoving]);

  return (
    <group ref={wizardRef} position={position}>
      
      <ErrorBoundary
        fallback={
          <group>
            <DefaultWizard position={position} rotation={rotation} username={username} />
          </group>
        }
        onError={(error, errorInfo) => {
          console.error(`[SchoolWizard] ❌ ERROR BOUNDARY CAUGHT ERROR:`, {
            username,
            isLocal,
            errorMessage: error?.message || 'Unknown error',
            errorStack: error?.stack,
            errorInfo: errorInfo,
            componentStack: errorInfo?.componentStack,
            modelPath: model?.idleAnimation,
            modelId,
            timestamp: new Date().toISOString()
          });
          // Log the raw error too
          console.error(`[SchoolWizard] RAW ERROR:`, error);
        }}
      >
        <Suspense fallback={
          <group>
            <mesh position={[0, 0, 0]}>
              <boxGeometry args={[0.5, 1.5, 0.5]} />
              <meshStandardMaterial color="#999" />
            </mesh>
          </group>
        }>
          <AnimatedWizard 
            key={`${username}-${modelId}-${modelPath}`} // Include modelPath to force re-render on model change
            modelPath={modelPath}
            position={[0, 0, 0]}  // Position is handled by parent group
            rotation={rotation}
            isMoving={isMoving}
            isLocal={isLocal}
            modelId={modelId}
            modelXOffset={modelXOffset !== undefined ? modelXOffset : 0.10}
            modelYOffset={modelYOffset !== undefined ? modelYOffset : -3.60}
          />
        </Suspense>
      </ErrorBoundary>

      {/* Username Label */}
      {username && (
        <Html
          position={[usernameXOffset, 4.5 + (usernameYOffset || -4.90), 0]}  // Apply default offset for all wizards
          center
          transform // Re-enable transform for position following
          occlude={false} // Disable occlusion to prevent blocking
          distanceFactor={8} // Adjusted for better sizing
          sprite // Make it always face camera like a sprite
          style={{
            color: 'white',
            fontSize: '18px',  // Slightly larger
            fontWeight: 'bold',
            textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
            userSelect: 'none',
          }}
        >
          {username}
        </Html>
      )}

      {/* Chat Bubble */}
      {chatMessage && chatTime && Date.now() - chatTime < 5000 && (
        <Html
          position={[0, 5.2 + (usernameYOffset || -4.90), 0]}  // Adjusted to match username offset
          center
          transform // Re-enable transform for position following
          occlude={false} // Disable occlusion to prevent blocking
          distanceFactor={8} // Match username distance factor
          sprite // Make it always face camera
          style={{
            background: 'rgba(255, 255, 255, 0.95)',
            padding: '8px 12px',
            borderRadius: '12px',
            color: '#333',
            fontSize: '14px',
            maxWidth: '200px',
            wordWrap: 'break-word',
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
            pointerEvents: 'none',
            userSelect: 'none',
          }}
        >
          {chatMessage}
        </Html>
      )}
    </group>
  );
});

// Fallback wizard component (original simple wizard)
const DefaultWizard: React.FC<Omit<SchoolWizardProps, 'modelId' | 'isMoving'>> = ({ 
  position, 
  rotation, 
  chatMessage, 
  chatTime, 
  username 
}) => {
  const wizardRef = useRef<THREE.Group>(null);
  const staffRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    // Position is handled by parent group prop
    if (wizardRef.current) {
      wizardRef.current.rotation.y = rotation;
    }

    if (staffRef.current) {
      staffRef.current.rotation.y += 0.02;
      staffRef.current.position.y = 2.5 + Math.sin(state.clock.elapsedTime * 2) * 0.1;
    }
  });

  return (
    <group ref={wizardRef} castShadow position={position}>
      {/* Simple wizard geometry */}
      <mesh position={[0, 0.5, 0]} castShadow>
        <cylinderGeometry args={[0.4, 0.5, 1.5, 8]} />
        <meshStandardMaterial color="#4c1d95" roughness={0.7} metalness={0.1} />
      </mesh>
      <mesh position={[0, 1.5, 0]} castShadow>
        <sphereGeometry args={[0.3, 16, 16]} />
        <meshStandardMaterial color="#fbbf24" roughness={0.8} metalness={0.0} />
      </mesh>
      <mesh position={[0, 2.2, 0]} castShadow>
        <coneGeometry args={[0.4, 1.2, 8]} />
        <meshStandardMaterial color="#7c3aed" roughness={0.6} metalness={0.2} />
      </mesh>

      {/* Username and chat */}
      {username && (
        <Html position={[0, 3, 0]} center style={{ color: 'white', fontSize: '14px', fontWeight: 'bold', textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}>
          {username}
        </Html>
      )}
      {chatMessage && chatTime && Date.now() - chatTime < 5000 && (
        <Html position={[0, 3.5, 0]} center style={{ background: 'rgba(255, 255, 255, 0.95)', padding: '8px 12px', borderRadius: '12px' }}>
          {chatMessage}
        </Html>
      )}
    </group>
  );
};

// Preload all wizard models to avoid loading errors
console.log('[SchoolWizard] 📦 Preloading models...');
schoolModels.forEach(model => {
  console.log(`[SchoolWizard] Preloading: ${model.id} - idle: ${model.idleAnimation}, running: ${model.runningAnimation}`);
  useGLTF.preload(model.idleAnimation);
  useGLTF.preload(model.runningAnimation);
});

export default SchoolWizard;