import React, { useState, useEffect, Suspense, memo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, useGLTF } from '@react-three/drei';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './ui/button';
import { schoolModels, getModelsBySchool } from '../lib/schoolModels';
import { SimpleCharacterPreview } from './SimpleCharacterPreview';

// Preload all school models
schoolModels.forEach(model => {
  console.log(`[CharacterPreview] Preloading model: ${model.id}`);
  useGLTF.preload(model.idleAnimation);
  useGLTF.preload(model.runningAnimation);
});

interface CharacterPreviewProps {
  selectedSchool: string;
  onSchoolChange: (schoolId: string) => void;
  selectedModelId: string;
  onModelChange: (modelId: string) => void;
}

export const CharacterPreview: React.FC<CharacterPreviewProps> = memo(({
  selectedSchool,
  onSchoolChange,
  selectedModelId,
  onModelChange
}) => {
  const [currentModelIndex, setCurrentModelIndex] = useState(0);
  // Perfect values for all wizard models
  const [modelPosition, setModelPosition] = useState({ x: 0, y: 0, z: 0 });
  const [modelRotation, setModelRotation] = useState({ x: -6 * Math.PI / 180, y: 0, z: 0 });
  const [modelScale, setModelScale] = useState(1.855); // 70% of 2.65
  const [showDebug, setShowDebug] = useState(false); // Hide debug by default
  const availableModels = selectedSchool ? getModelsBySchool(selectedSchool) : [];
  const currentModel = availableModels[currentModelIndex];
  const hasMultipleTypes = availableModels.length > 1;

  // Get all unique schools that have models
  const schools = ['fire', 'ice', 'myth', 'life', 'balance', 'death'];
  const currentSchoolIndex = schools.indexOf(selectedSchool);

  useEffect(() => {
    // Reset model index when school changes
    setCurrentModelIndex(0);
    if (availableModels.length > 0) {
      const defaultModel = availableModels[0];
      console.log(`[CharacterPreview] School changed to ${selectedSchool}, setting model to ${defaultModel.id}`);
      console.log('[CharacterPreview] Model details:', {
        id: defaultModel.id,
        name: defaultModel.name,
        idleAnimation: defaultModel.idleAnimation,
        isMerged: defaultModel.idleAnimation.includes('Merged')
      });
      onModelChange(defaultModel.id);
    }
  }, [selectedSchool, availableModels.length, onModelChange]);

  useEffect(() => {
    // Update selected model when index changes
    if (currentModel) {
      onModelChange(currentModel.id);
    }
  }, [currentModelIndex, currentModel]);

  const handlePreviousSchool = () => {
    const newIndex = currentSchoolIndex <= 0 ? schools.length - 1 : currentSchoolIndex - 1;
    onSchoolChange(schools[newIndex]);
  };

  const handleNextSchool = () => {
    const newIndex = currentSchoolIndex >= schools.length - 1 ? 0 : currentSchoolIndex + 1;
    onSchoolChange(schools[newIndex]);
  };

  const handleTypeChange = (type: 'A' | 'B') => {
    const index = availableModels.findIndex(m => m.type === type);
    if (index !== -1) {
      setCurrentModelIndex(index);
    }
  };

  if (!currentModel) {
    console.error('[CharacterPreview] No current model found!');
    return null;
  }
  
  // Commented out to reduce console noise
  // console.log('[CharacterPreview] Rendering with model:', {
  //   currentModel,
  //   modelPosition,
  //   modelRotation: {
  //     x: modelRotation.x * 180 / Math.PI,
  //     y: modelRotation.y * 180 / Math.PI,
  //     z: modelRotation.z * 180 / Math.PI
  //   },
  //   modelScale
  // });

  return (
    <div className="flex flex-col items-center gap-4 relative">
      {/* Debug Controls */}
      {showDebug && (
        <div className="absolute top-0 right-[-320px] bg-black/90 text-white p-4 rounded-lg z-10 min-w-[300px] max-h-[90vh] overflow-y-auto">
          <h3 className="text-lg font-bold mb-3 text-yellow-400">Character Preview Debug</h3>
          <div className="text-xs text-gray-400 mb-2">Model: {currentModel?.name}</div>
          
          {/* X Position */}
          <div className="mb-3">
            <label className="text-sm">X Position: {modelPosition.x.toFixed(2)}</label>
            <div className="flex gap-2 mt-1">
              <button
                className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm"
                onMouseDown={() => {
                  const interval = setInterval(() => setModelPosition(prev => ({ ...prev, x: prev.x - 0.05 })), 50);
                  const handleMouseUp = () => {
                    clearInterval(interval);
                    document.removeEventListener('mouseup', handleMouseUp);
                  };
                  document.addEventListener('mouseup', handleMouseUp);
                }}
              >
                ← Left
              </button>
              <button
                className="px-2 py-1 bg-gray-600 hover:bg-gray-700 text-white rounded text-sm"
                onClick={() => setModelPosition(prev => ({ ...prev, x: 0 }))}
              >
                Reset
              </button>
              <button
                className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm"
                onMouseDown={() => {
                  const interval = setInterval(() => setModelPosition(prev => ({ ...prev, x: prev.x + 0.05 })), 50);
                  const handleMouseUp = () => {
                    clearInterval(interval);
                    document.removeEventListener('mouseup', handleMouseUp);
                  };
                  document.addEventListener('mouseup', handleMouseUp);
                }}
              >
                Right →
              </button>
            </div>
          </div>

          {/* Y Position */}
          <div className="mb-3">
            <label className="text-sm">Y Position: {modelPosition.y.toFixed(2)}</label>
            <div className="flex gap-2 mt-1">
              <button
                className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm"
                onMouseDown={() => {
                  const interval = setInterval(() => setModelPosition(prev => ({ ...prev, y: prev.y - 0.05 })), 50);
                  const handleMouseUp = () => {
                    clearInterval(interval);
                    document.removeEventListener('mouseup', handleMouseUp);
                  };
                  document.addEventListener('mouseup', handleMouseUp);
                }}
              >
                ↓ Down
              </button>
              <button
                className="px-2 py-1 bg-gray-600 hover:bg-gray-700 text-white rounded text-sm"
                onClick={() => setModelPosition(prev => ({ ...prev, y: 0 }))}
              >
                Reset
              </button>
              <button
                className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm"
                onMouseDown={() => {
                  const interval = setInterval(() => setModelPosition(prev => ({ ...prev, y: prev.y + 0.05 })), 50);
                  const handleMouseUp = () => {
                    clearInterval(interval);
                    document.removeEventListener('mouseup', handleMouseUp);
                  };
                  document.addEventListener('mouseup', handleMouseUp);
                }}
              >
                ↑ Up
              </button>
            </div>
          </div>

          {/* Z Position */}
          <div className="mb-3">
            <label className="text-sm">Z Position: {modelPosition.z.toFixed(2)}</label>
            <div className="flex gap-2 mt-1">
              <button
                className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm"
                onMouseDown={() => {
                  const interval = setInterval(() => setModelPosition(prev => ({ ...prev, z: prev.z - 0.05 })), 50);
                  const handleMouseUp = () => {
                    clearInterval(interval);
                    document.removeEventListener('mouseup', handleMouseUp);
                  };
                  document.addEventListener('mouseup', handleMouseUp);
                }}
              >
                ← Back
              </button>
              <button
                className="px-2 py-1 bg-gray-600 hover:bg-gray-700 text-white rounded text-sm"
                onClick={() => setModelPosition(prev => ({ ...prev, z: 0 }))}
              >
                Reset
              </button>
              <button
                className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm"
                onMouseDown={() => {
                  const interval = setInterval(() => setModelPosition(prev => ({ ...prev, z: prev.z + 0.05 })), 50);
                  const handleMouseUp = () => {
                    clearInterval(interval);
                    document.removeEventListener('mouseup', handleMouseUp);
                  };
                  document.addEventListener('mouseup', handleMouseUp);
                }}
              >
                Forward →
              </button>
            </div>
          </div>

          {/* Rotation X */}
          <div className="mb-3">
            <label className="text-sm text-red-400">Rotation X (Pitch): {(modelRotation.x * 180 / Math.PI).toFixed(0)}°</label>
            <div className="flex gap-2 mt-1">
              <button
                className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm"
                onMouseDown={() => {
                  const interval = setInterval(() => setModelRotation(prev => ({ ...prev, x: prev.x - 0.05 })), 50);
                  const handleMouseUp = () => {
                    clearInterval(interval);
                    document.removeEventListener('mouseup', handleMouseUp);
                  };
                  document.addEventListener('mouseup', handleMouseUp);
                }}
              >
                ↓ Tilt Back
              </button>
              <button
                className="px-2 py-1 bg-gray-600 hover:bg-gray-700 text-white rounded text-sm"
                onClick={() => setModelRotation(prev => ({ ...prev, x: 0 }))}
              >
                Reset
              </button>
              <button
                className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm"
                onMouseDown={() => {
                  const interval = setInterval(() => setModelRotation(prev => ({ ...prev, x: prev.x + 0.05 })), 50);
                  const handleMouseUp = () => {
                    clearInterval(interval);
                    document.removeEventListener('mouseup', handleMouseUp);
                  };
                  document.addEventListener('mouseup', handleMouseUp);
                }}
              >
                ↑ Tilt Forward
              </button>
            </div>
          </div>

          {/* Rotation Y */}
          <div className="mb-3">
            <label className="text-sm text-green-400">Rotation Y (Turn): {(modelRotation.y * 180 / Math.PI).toFixed(0)}°</label>
            <div className="flex gap-2 mt-1">
              <button
                className="px-2 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-sm"
                onMouseDown={() => {
                  const interval = setInterval(() => setModelRotation(prev => ({ ...prev, y: prev.y - 0.05 })), 50);
                  const handleMouseUp = () => {
                    clearInterval(interval);
                    document.removeEventListener('mouseup', handleMouseUp);
                  };
                  document.addEventListener('mouseup', handleMouseUp);
                }}
              >
                ← Turn Left
              </button>
              <button
                className="px-2 py-1 bg-gray-600 hover:bg-gray-700 text-white rounded text-sm"
                onClick={() => setModelRotation(prev => ({ ...prev, y: 0 }))}
              >
                Reset
              </button>
              <button
                className="px-2 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-sm"
                onMouseDown={() => {
                  const interval = setInterval(() => setModelRotation(prev => ({ ...prev, y: prev.y + 0.05 })), 50);
                  const handleMouseUp = () => {
                    clearInterval(interval);
                    document.removeEventListener('mouseup', handleMouseUp);
                  };
                  document.addEventListener('mouseup', handleMouseUp);
                }}
              >
                Turn Right →
              </button>
            </div>
          </div>

          {/* Rotation Z */}
          <div className="mb-3">
            <label className="text-sm text-purple-400">Rotation Z (Roll): {(modelRotation.z * 180 / Math.PI).toFixed(0)}°</label>
            <div className="flex gap-2 mt-1">
              <button
                className="px-2 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded text-sm"
                onMouseDown={() => {
                  const interval = setInterval(() => setModelRotation(prev => ({ ...prev, z: prev.z - 0.05 })), 50);
                  const handleMouseUp = () => {
                    clearInterval(interval);
                    document.removeEventListener('mouseup', handleMouseUp);
                  };
                  document.addEventListener('mouseup', handleMouseUp);
                }}
              >
                ↶ Roll Left
              </button>
              <button
                className="px-2 py-1 bg-gray-600 hover:bg-gray-700 text-white rounded text-sm"
                onClick={() => setModelRotation(prev => ({ ...prev, z: 0 }))}
              >
                Reset
              </button>
              <button
                className="px-2 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded text-sm"
                onMouseDown={() => {
                  const interval = setInterval(() => setModelRotation(prev => ({ ...prev, z: prev.z + 0.05 })), 50);
                  const handleMouseUp = () => {
                    clearInterval(interval);
                    document.removeEventListener('mouseup', handleMouseUp);
                  };
                  document.addEventListener('mouseup', handleMouseUp);
                }}
              >
                ↷ Roll Right
              </button>
            </div>
          </div>

          {/* Scale */}
          <div className="mb-3">
            <label className="text-sm">Scale: {modelScale.toFixed(2)}</label>
            <div className="flex gap-2 mt-1">
              <button
                className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm"
                onMouseDown={() => {
                  const interval = setInterval(() => setModelScale(prev => Math.max(0.1, prev - 0.05)), 50);
                  const handleMouseUp = () => {
                    clearInterval(interval);
                    document.removeEventListener('mouseup', handleMouseUp);
                  };
                  document.addEventListener('mouseup', handleMouseUp);
                }}
              >
                - Smaller
              </button>
              <button
                className="px-2 py-1 bg-gray-600 hover:bg-gray-700 text-white rounded text-sm"
                onClick={() => setModelScale(1)}
              >
                Reset
              </button>
              <button
                className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm"
                onMouseDown={() => {
                  const interval = setInterval(() => setModelScale(prev => prev + 0.05), 50);
                  const handleMouseUp = () => {
                    clearInterval(interval);
                    document.removeEventListener('mouseup', handleMouseUp);
                  };
                  document.addEventListener('mouseup', handleMouseUp);
                }}
              >
                + Larger
              </button>
            </div>
          </div>

          {/* Reset All */}
          <button
            className="w-full px-2 py-1 bg-orange-600 hover:bg-orange-700 text-white rounded text-sm mt-2"
            onClick={() => {
              setModelPosition({ x: 0, y: 0, z: 0 });
              setModelRotation({ x: -6 * Math.PI / 180, y: 0, z: 0 });
              setModelScale(1.855);
            }}
          >
            Reset All to Defaults
          </button>

          {/* Log Values */}
          <button
            className="w-full px-2 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-sm mt-2"
            onClick={() => {
              const values = {
                model: currentModel?.name,
                position: modelPosition,
                rotation: {
                  x: (modelRotation.x * 180 / Math.PI).toFixed(1),
                  y: (modelRotation.y * 180 / Math.PI).toFixed(1),
                  z: (modelRotation.z * 180 / Math.PI).toFixed(1)
                },
                scale: modelScale
              };
              console.log('=== PREVIEW DEBUG VALUES ===', values);
              console.log('Copy these for this model:', {
                position: `{ x: ${modelPosition.x.toFixed(2)}, y: ${modelPosition.y.toFixed(2)}, z: ${modelPosition.z.toFixed(2)} }`,
                rotation: `{ x: ${modelRotation.x.toFixed(2)}, y: ${modelRotation.y.toFixed(2)}, z: ${modelRotation.z.toFixed(2)} }`,
                scale: modelScale.toFixed(2)
              });
              alert(`${currentModel?.name}\n\nPosition: X=${modelPosition.x.toFixed(2)}, Y=${modelPosition.y.toFixed(2)}, Z=${modelPosition.z.toFixed(2)}\nRotation: X=${(modelRotation.x * 180 / Math.PI).toFixed(0)}°, Y=${(modelRotation.y * 180 / Math.PI).toFixed(0)}°, Z=${(modelRotation.z * 180 / Math.PI).toFixed(0)}°\nScale: ${modelScale.toFixed(2)}`);
            }}
          >
            Log Current Values
          </button>

          {/* Close button */}
          <button
            className="absolute top-2 right-2 text-gray-400 hover:text-gray-200"
            onClick={() => setShowDebug(false)}
          >
            ×
          </button>
        </div>
      )}

      <div className="flex items-center gap-4">
        {/* Previous Arrow */}
        <button
          onClick={handlePreviousSchool}
          className="
            w-16 h-16 flex items-center justify-center
            transition-all duration-200 transform hover:scale-110
            text-yellow-400 hover:text-yellow-300
          "
          style={{
            filter: 'drop-shadow(2px 2px 4px rgba(0,0,0,0.8))'
          }}
        >
          <ChevronLeft className="h-12 w-12" strokeWidth={4} />
        </button>

        {/* 3D Model Preview */}
        <div className="w-[500px] h-[600px] bg-transparent rounded-lg overflow-hidden">
          <Canvas
            camera={{ 
              position: [0, 0, 5], 
              fov: 60,
              near: 1,
              far: 100
            }}
            gl={{ 
              antialias: true,
              alpha: true,
              powerPreference: "high-performance" 
            }}
            frameloop="always"
          >
            <ambientLight intensity={0.8} color="#ffffff" />
            <directionalLight 
              position={[5, 5, 5]} 
              intensity={1.2} 
              color="#fff8dc"
              castShadow
            />
            <pointLight position={[0, 3, 2]} intensity={0.5} color="#c084fc" />
            
            <Suspense fallback={
              <mesh position={[0, 0, 0]}>
                <boxGeometry args={[1, 2, 1]} />
                <meshStandardMaterial color="#999" />
              </mesh>
            }>
              <SimpleCharacterPreview 
                key={`${currentModel.id}-${Date.now()}`}
                modelId={currentModel.id}
                position={modelPosition}
                rotation={modelRotation}
                scale={modelScale}
              />
            </Suspense>
            
            <OrbitControls 
              enablePan={true}
              enableZoom={true}
              minDistance={2}
              maxDistance={10}
              minPolarAngle={0}
              maxPolarAngle={Math.PI}
              autoRotate={false}
              enableDamping={true}
              dampingFactor={0.05}
              target={[0, 0, 0]}
            />
          </Canvas>
        </div>

        {/* Next Arrow */}
        <button
          onClick={handleNextSchool}
          className="
            w-16 h-16 flex items-center justify-center
            transition-all duration-200 transform hover:scale-110
            text-yellow-400 hover:text-yellow-300
          "
          style={{
            filter: 'drop-shadow(2px 2px 4px rgba(0,0,0,0.8))'
          }}
        >
          <ChevronRight className="h-12 w-12" strokeWidth={4} />
        </button>
      </div>

      {/* Follow Us Button */}
      <a
        href="https://x.com/wizard101dotfun"
        target="_blank"
        rel="noopener noreferrer"
        className="
          px-8 py-3 rounded-lg font-bold text-xl uppercase tracking-wider
          transition-all duration-200 transform hover:scale-105
          bg-gradient-to-b from-red-700 to-red-900 text-yellow-400 
          shadow-lg shadow-red-900/50 hover:from-red-600 hover:to-red-800
          border-2 border-yellow-600/50
          mt-2
        "
        style={{
          fontFamily: "'Comic Sans MS', 'Comic Sans', cursive",
          textShadow: '2px 2px 4px rgba(0,0,0,0.8)'
        }}
      >
        FOLLOW US ON X
      </a>

      {/* Type Selection if multiple models exist */}
      {hasMultipleTypes && (
        <div className="flex gap-3">
          <button
            onClick={() => handleTypeChange('A')}
            className={`
              px-6 py-3 rounded-lg font-bold text-xl uppercase tracking-wider
              transition-all duration-200 transform hover:scale-105
              bg-gradient-to-b from-red-700 to-red-900 shadow-lg shadow-red-900/50 border-2 border-red-800
              ${currentModel.type === 'A' ? 'text-yellow-400' : 'text-white'}
            `}
            style={{
              fontFamily: "'Comic Sans MS', 'Comic Sans', cursive",
              textShadow: currentModel.type === 'A' ? '1px 1px 2px rgba(0,0,0,0.5)' : '2px 2px 4px rgba(0,0,0,0.8)'
            }}
          >
            STYLE A
          </button>
          <button
            onClick={() => handleTypeChange('B')}
            className={`
              px-6 py-3 rounded-lg font-bold text-xl uppercase tracking-wider
              transition-all duration-200 transform hover:scale-105
              bg-gradient-to-b from-red-700 to-red-900 shadow-lg shadow-red-900/50 border-2 border-red-800
              ${currentModel.type === 'B' ? 'text-yellow-400' : 'text-white'}
            `}
            style={{
              fontFamily: "'Comic Sans MS', 'Comic Sans', cursive",
              textShadow: currentModel.type === 'B' ? '1px 1px 2px rgba(0,0,0,0.5)' : '2px 2px 4px rgba(0,0,0,0.8)'
            }}
          >
            STYLE B
          </button>
        </div>
      )}
    </div>
  );
});

CharacterPreview.displayName = 'CharacterPreview';
