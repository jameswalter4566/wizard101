import React, { useState, useEffect } from 'react';
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { getIdleOffsets, setIdleOffsets } from './SchoolWizard';

export const IdleAnimationDebug = () => {
  const [offsets, setOffsetsState] = useState(getIdleOffsets());
  const [showDebug, setShowDebug] = useState(false);

  const updateOffset = (key: keyof typeof offsets, delta: number) => {
    const newOffsets = {
      ...offsets,
      [key]: offsets[key] + delta
    };
    setOffsetsState(newOffsets);
    setIdleOffsets(newOffsets);
  };

  if (!showDebug) {
    return (
      <button
        onClick={() => setShowDebug(true)}
        className="absolute bottom-4 right-4 bg-purple-600 text-white px-4 py-2 rounded-lg shadow-lg hover:bg-purple-700 transition-colors z-50"
      >
        Debug Idle Animation
      </button>
    );
  }

  return (
    <div className="absolute bottom-4 right-4 bg-black/80 text-white p-4 rounded-lg shadow-lg z-50 min-w-[300px]">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold">Idle Animation Debug</h3>
        <button
          onClick={() => setShowDebug(false)}
          className="text-gray-400 hover:text-white"
        >
          ✕
        </button>
      </div>

      {/* X Position */}
      <div className="mb-3">
        <div className="flex justify-between items-center">
          <span className="text-sm">X Position: {offsets.x.toFixed(2)}</span>
          <div className="flex gap-1">
            <button
              onClick={() => updateOffset('x', -0.1)}
              className="bg-purple-600 hover:bg-purple-700 p-1 rounded"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => updateOffset('x', 0.1)}
              className="bg-purple-600 hover:bg-purple-700 p-1 rounded"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Y Position */}
      <div className="mb-3">
        <div className="flex justify-between items-center">
          <span className="text-sm">Y Position: {offsets.y.toFixed(2)}</span>
          <div className="flex gap-1">
            <button
              onClick={() => updateOffset('y', -0.1)}
              className="bg-purple-600 hover:bg-purple-700 p-1 rounded"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
            <button
              onClick={() => updateOffset('y', 0.1)}
              className="bg-purple-600 hover:bg-purple-700 p-1 rounded"
            >
              <ChevronUp className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Z Position */}
      <div className="mb-3">
        <div className="flex justify-between items-center">
          <span className="text-sm">Z Position: {offsets.z.toFixed(2)}</span>
          <div className="flex gap-1">
            <button
              onClick={() => updateOffset('z', -0.1)}
              className="bg-purple-600 hover:bg-purple-700 p-1 rounded"
            >
              <ChevronUp className="w-4 h-4" />
            </button>
            <button
              onClick={() => updateOffset('z', 0.1)}
              className="bg-purple-600 hover:bg-purple-700 p-1 rounded"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Scale */}
      <div className="mb-3">
        <div className="flex justify-between items-center">
          <span className="text-sm">Scale: {offsets.scale.toFixed(2)}</span>
          <div className="flex gap-1">
            <button
              onClick={() => updateOffset('scale', -0.1)}
              className="bg-purple-600 hover:bg-purple-700 p-1 rounded"
            >
              -
            </button>
            <button
              onClick={() => updateOffset('scale', 0.1)}
              className="bg-purple-600 hover:bg-purple-700 p-1 rounded"
            >
              +
            </button>
          </div>
        </div>
      </div>

      {/* Rotation */}
      <div className="mb-3">
        <div className="flex justify-between items-center">
          <span className="text-sm">Rotation: {(offsets.rotation * 180 / Math.PI).toFixed(1)}°</span>
          <div className="flex gap-1">
            <button
              onClick={() => updateOffset('rotation', -0.1)}
              className="bg-purple-600 hover:bg-purple-700 p-1 rounded"
            >
              ↶
            </button>
            <button
              onClick={() => updateOffset('rotation', 0.1)}
              className="bg-purple-600 hover:bg-purple-700 p-1 rounded"
            >
              ↷
            </button>
          </div>
        </div>
      </div>

      {/* Fine adjustment controls */}
      <div className="mt-4 pt-4 border-t border-gray-600">
        <p className="text-xs text-gray-400 mb-2">Fine Adjustment (0.01 steps)</p>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => updateOffset('x', -0.01)}
            className="bg-gray-700 hover:bg-gray-600 px-2 py-1 rounded text-xs"
          >
            X -0.01
          </button>
          <button
            onClick={() => updateOffset('x', 0.01)}
            className="bg-gray-700 hover:bg-gray-600 px-2 py-1 rounded text-xs"
          >
            X +0.01
          </button>
          <button
            onClick={() => updateOffset('y', -0.01)}
            className="bg-gray-700 hover:bg-gray-600 px-2 py-1 rounded text-xs"
          >
            Y -0.01
          </button>
          <button
            onClick={() => updateOffset('y', 0.01)}
            className="bg-gray-700 hover:bg-gray-600 px-2 py-1 rounded text-xs"
          >
            Y +0.01
          </button>
        </div>
      </div>

      {/* Current values display */}
      <div className="mt-4 pt-4 border-t border-gray-600">
        <p className="text-xs text-gray-400">Copy these values when aligned:</p>
        <pre className="text-xs bg-gray-900 p-2 rounded mt-1">
{`idleOffsets = {
  x: ${offsets.x.toFixed(2)},
  y: ${offsets.y.toFixed(2)},
  z: ${offsets.z.toFixed(2)},
  scale: ${offsets.scale.toFixed(2)},
  rotation: ${offsets.rotation.toFixed(2)}
}`}
        </pre>
      </div>
    </div>
  );
};