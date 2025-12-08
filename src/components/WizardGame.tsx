import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Environment, useGLTF, Html } from '@react-three/drei';
import * as THREE from 'three';
import SchoolWizard from './SchoolWizard';
import LocalPlayer from './LocalPlayer';
import GameControls from './GameControls';
import { useSocketMultiplayer } from '../hooks/useSocketMultiplayer';
import OtherPlayer from './multiplayer/OtherPlayer';
import ChatBox from './ChatBox';
import { supabase } from '../integrations/supabase/client';
import { CollisionMesh, useCollisionDetection } from './CollisionMesh';
import { getModelById } from '../lib/schoolModels';

// Town Environment Component with Collision
const TownEnvironment = ({ onCollisionReady, yOffset = 0 }: { onCollisionReady?: (checkFn: any) => void; yOffset?: number }) => {
  const { scene } = useGLTF('/models/wizard_101_commons_area.glb');
  
  return (
    <>
      {/* Visible town model */}
      <primitive 
        object={scene} 
        position={[0, yOffset, 0]} 
        scale={1}
        receiveShadow
        castShadow
      />
      {/* Collision detection temporarily disabled - was making environment invisible */}
      {/* <CollisionMesh 
        modelPath="/models/wizard_101_commons_area.glb"
        onCollisionCheck={onCollisionReady}
      /> */}
    </>
  );
};

// Preload the town model
useGLTF.preload('/models/wizard_101_commons_area.glb');

interface WizardGameProps {
  username: string;
  userId: string;
  modelId: string;
  isSignedIn: boolean;
}

const WizardGame: React.FC<WizardGameProps> = React.memo(({ username, userId, modelId, isSignedIn }) => {
  const [wizardPosition, setWizardPosition] = useState([0, 6.3, 0]);
  const [wizardRotation, setWizardRotation] = useState(0);
  const [isMoving, setIsMoving] = useState(false);
  const [localChatMessage, setLocalChatMessage] = useState<string>('');
  const [localChatTime, setLocalChatTime] = useState<number>(0);
  const [yOffset, setYOffset] = useState(0); // Debug Y offset
  const [showDebug, setShowDebug] = useState(false); // Hide debug menu by default
  const [playerXOffset, setPlayerXOffset] = useState(0); // Player X offset - start at 0 for proper centering
  const [playerYOffset, setPlayerYOffset] = useState(0); // Player Y offset
  const [usernameXOffset, setUsernameXOffset] = useState(0); // Username X offset
  const [usernameYOffset, setUsernameYOffset] = useState(-4.90); // Username Y offset - perfect positioning
  const [cameraLookXOffset, setCameraLookXOffset] = useState(0); // Camera look target X offset (0 for rotation-relative)
  const [cameraLookYOffset, setCameraLookYOffset] = useState(1.7); // Camera look target Y offset (adjusted for ground level)
  const [useLerp, setUseLerp] = useState(true); // Toggle lerp for camera movement
  const [mapYOffset, setMapYOffset] = useState(-0.30); // Map Y position offset
  const [playerScreenPos, setPlayerScreenPos] = useState({ x: 0, y: 0 }); // Track player screen position
  const [modelXOffset, setModelXOffset] = useState(0.10); // Model internal X offset - perfect for fire wizard
  const [modelYOffset, setModelYOffset] = useState(-3.60); // Model internal Y offset - perfect for fire wizard
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { setCollisionCheck, checkCollision } = useCollisionDetection('/models/wizard_101_commons_area.glb');
  
  // Get model-specific offsets
  const currentModel = getModelById(modelId);
  const modelYOffsetFromConfig = currentModel?.modelYOffset || 0;
  
  // Memoize initial position to prevent re-renders
  const initialPosition = useMemo(() => ({ x: 0, y: 6.3, z: 0 }), []);
  
  // Wrapped position setter with collision detection
  const setWizardPositionWithCollision = useCallback((newPosition: number[]) => {
    const adjustedPosition = checkCollision(newPosition);
    setWizardPosition(adjustedPosition);
  }, [checkCollision]);
  
  // Initialize multiplayer
  const { players, isConnected, latency, updateLocalPlayer, sendChatMessage } = useSocketMultiplayer({
    username,
    roomId: 'wizard-commons',
    isSignedIn,
    userId,
    modelId,
    initialPosition,
    serverUrl: 'https://wizard-wander-server.onrender.com'
  });


  // Initialize background music
  useEffect(() => {
    // Create and play background music
    const audio = new Audio('/background-music.mp3');
    audio.loop = true;
    audio.volume = 0.3; // Set to 30% volume so it's not too loud
    audioRef.current = audio;
    
    // Play music (with user interaction handling for browsers)
    const playMusic = async () => {
      try {
        await audio.play();
      } catch (error) {
        console.log('Autoplay prevented, waiting for user interaction');
        // If autoplay is blocked, try playing on first user interaction
        const handleInteraction = async () => {
          try {
            await audio.play();
            document.removeEventListener('click', handleInteraction);
            document.removeEventListener('keydown', handleInteraction);
          } catch (e) {
            console.error('Failed to play audio:', e);
          }
        };
        document.addEventListener('click', handleInteraction);
        document.addEventListener('keydown', handleInteraction);
      }
    };
    
    playMusic();
    
    // Cleanup on unmount
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
        audioRef.current = null;
      }
    };
  }, []);

  // Update multiplayer position when local wizard moves
  useEffect(() => {
    if (!isConnected) return;
    
    const position = { x: wizardPosition[0], y: wizardPosition[1], z: wizardPosition[2] };
    updateLocalPlayer(position, wizardRotation, isMoving);
  }, [wizardPosition, wizardRotation, isMoving, updateLocalPlayer, isConnected]);

  // Handle sending chat messages
  const handleSendMessage = async (message: string) => {
    if (!isConnected || !message.trim()) return;

    // Send via Socket.io for real-time display
    sendChatMessage(message);
    
    // Show on local wizard
    setLocalChatMessage(message);
    setLocalChatTime(Date.now());
    
    // Clear local chat after 5 seconds
    setTimeout(() => {
      setLocalChatMessage('');
      setLocalChatTime(0);
    }, 5000);

    // Save to Supabase for persistence
    try {
      await supabase.from('player_chats').insert({
        player_id: userId,
        message: message.trim(),
        x: wizardPosition[0],
        y: wizardPosition[1],
        screen_name: username,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to save chat message:', error);
    }
  };


  return (
    <div className="w-full h-screen bg-gradient-sky relative overflow-hidden">
      
      {/* Game Controls */}
      <GameControls
        wizardPosition={wizardPosition}
        setWizardPosition={setWizardPosition}
        wizardRotation={wizardRotation}
        setWizardRotation={setWizardRotation}
        setIsMoving={setIsMoving}
      />
      
      {/* 3D Scene */}
      <Canvas
        camera={{ 
          position: [0, 10, 20], 
          fov: 60,
          near: 1,
          far: 2000
        }}
        shadows
        className="absolute inset-0"
        gl={{ 
          antialias: true,
          alpha: true,
          powerPreference: "high-performance" 
        }}
        onCreated={({ gl }) => {
          gl.setClearColor('#87CEEB', 0.8); // Baby blue sky
        }}
      >
        {/* Bright ambient lighting */}
        <ambientLight intensity={0.8} color="#ffffff" />
        
        {/* Main sun light */}
        <directionalLight
          position={[50, 50, 30]}
          intensity={1.2}
          color="#fff8dc"
          castShadow
          shadow-mapSize-width={4096}
          shadow-mapSize-height={4096}
          shadow-camera-far={200}
          shadow-camera-left={-100}
          shadow-camera-right={100}
          shadow-camera-top={100}
          shadow-camera-bottom={-100}
        />
        
        {/* Secondary fill light */}
        <directionalLight
          position={[-10, 15, 5]}
          intensity={0.6}
          color="#e6f3ff"
        />
        
        {/* Magical accent light */}
        <pointLight
          position={[0, 8, 0]}
          intensity={0.4}
          color="#c084fc"
          distance={30}
        />

        {/* Town Environment */}
        <TownEnvironment onCollisionReady={setCollisionCheck} yOffset={mapYOffset} />
        

        {/* Local Player - Always visible */}
        <group 
          renderOrder={9999}  // Maximum render order to ensure it's always on top
          visible={true}
          position={[0, 0, 0]}  // Group at origin, player handles its own position
        >
          <LocalPlayer
            key={`local-player-${username}-${modelId}`}  // More stable key
            position={[wizardPosition[0] + playerXOffset, wizardPosition[1] + playerYOffset, wizardPosition[2]]} 
            rotation={wizardRotation} 
            chatMessage={localChatMessage}
            chatTime={localChatTime}
            username={username}
            modelId={modelId}
            isMoving={isMoving}
            usernameXOffset={usernameXOffset}
            usernameYOffset={usernameYOffset}
            modelXOffset={modelXOffset}
            modelYOffset={modelYOffset}
          />
          {/* Debug: Log calculated positions */}
          {(() => {
            if (Math.random() < 0.01) { // Log occasionally
              console.log(`[WizardGame Position Calc] ${username}:`, {
                basePosition: wizardPosition,
                playerXOffset,
                playerYOffset,
                modelYOffset,
                finalPosition: [
                  wizardPosition[0] + playerXOffset,
                  wizardPosition[1] + playerYOffset + modelYOffset,
                  wizardPosition[2]
                ],
                usernameOffsets: { X: usernameXOffset, Y: usernameYOffset }
              });
            }
            return null;
          })()}
        </group>

        {/* Other Players - Add to same parent group */}
        <group position={[0, 0, 0]}>
          {Array.from(players.values()).map((player) => (
            <OtherPlayer key={player.id} player={player} />
          ))}
        </group>

        {/* Third-person camera controls */}
        <ThirdPersonCamera 
          wizardPosition={[wizardPosition[0] + playerXOffset, wizardPosition[1] + playerYOffset, wizardPosition[2]]} 
          wizardRotation={wizardRotation}
          lookXOffset={cameraLookXOffset}
          lookYOffset={cameraLookYOffset}
          useLerp={useLerp}
          onScreenPosUpdate={setPlayerScreenPos}
        />

      </Canvas>


      {/* Multiplayer Status */}
      <div className="absolute top-4 right-4 text-foreground bg-card/90 backdrop-blur-sm p-4 rounded-lg border border-border shadow-lg">
        <h3 className="text-lg font-bold mb-2 text-primary">Multiplayer</h3>
        <p className="text-sm">Status: {isConnected ? '🟢 Connected' : '🔴 Disconnected'}</p>
        <p className="text-sm">Players Online: {players.size + 1}</p>
        <p className="text-sm">Your Name: {username}</p>
        {isConnected && latency > 0 && (
          <p className="text-sm">Latency: {latency}ms</p>
        )}
      </div>

      {/* Chat Box */}
      <ChatBox onSendMessage={handleSendMessage} isConnected={isConnected} />
      
      {/* Music Volume Control */}
      <div className="absolute bottom-4 right-4 bg-card/90 backdrop-blur-sm p-3 rounded-lg border border-border shadow-lg">
        <div className="flex items-center gap-2">
          <span className="text-sm text-foreground">🎵</span>
          <input
            type="range"
            min="0"
            max="100"
            defaultValue="30"
            className="w-24"
            onChange={(e) => {
              if (audioRef.current) {
                audioRef.current.volume = parseInt(e.target.value) / 100;
              }
            }}
          />
        </div>
      </div>

      {/* Debug Position Controls - Hidden */}
      {showDebug && (
        <div className="absolute top-20 left-4 bg-card/95 backdrop-blur-sm p-4 rounded-lg border border-border shadow-lg">
          <h3 className="text-lg font-bold mb-3 text-primary">Debug Position Controls</h3>
          
          {/* Player Position */}
          <div className="mb-4">
            <h4 className="text-md font-semibold mb-2">Player Position</h4>
            <div className="space-y-2">
              {/* Player X */}
              <div className="flex items-center gap-2">
                <span className="text-sm w-16">X:</span>
                <button
                  className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded"
                  onMouseDown={() => {
                    const interval = setInterval(() => setPlayerXOffset(prev => prev - 0.1), 50);
                    const handleMouseUp = () => {
                      clearInterval(interval);
                      document.removeEventListener('mouseup', handleMouseUp);
                    };
                    document.addEventListener('mouseup', handleMouseUp);
                  }}
                >
                  ←
                </button>
                <span className="text-sm font-mono w-16 text-center">{playerXOffset.toFixed(2)}</span>
                <button
                  className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded"
                  onMouseDown={() => {
                    const interval = setInterval(() => setPlayerXOffset(prev => prev + 0.1), 50);
                    const handleMouseUp = () => {
                      clearInterval(interval);
                      document.removeEventListener('mouseup', handleMouseUp);
                    };
                    document.addEventListener('mouseup', handleMouseUp);
                  }}
                >
                  →
                </button>
              </div>
              
              {/* Player Y */}
              <div className="flex items-center gap-2">
                <span className="text-sm w-16">Y:</span>
                <button
                  className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded"
                  onMouseDown={() => {
                    const interval = setInterval(() => setPlayerYOffset(prev => prev - 0.1), 50);
                    const handleMouseUp = () => {
                      clearInterval(interval);
                      document.removeEventListener('mouseup', handleMouseUp);
                    };
                    document.addEventListener('mouseup', handleMouseUp);
                  }}
                >
                  ↓
                </button>
                <span className="text-sm font-mono w-16 text-center">{playerYOffset.toFixed(2)}</span>
                <button
                  className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded"
                  onMouseDown={() => {
                    const interval = setInterval(() => setPlayerYOffset(prev => prev + 0.1), 50);
                    const handleMouseUp = () => {
                      clearInterval(interval);
                      document.removeEventListener('mouseup', handleMouseUp);
                    };
                    document.addEventListener('mouseup', handleMouseUp);
                  }}
                >
                  ↑
                </button>
              </div>
            </div>
          </div>
          
          {/* Username Position */}
          <div className="mb-4">
            <h4 className="text-md font-semibold mb-2">Username Position</h4>
            <div className="space-y-2">
              {/* Username X */}
              <div className="flex items-center gap-2">
                <span className="text-sm w-16">X:</span>
                <button
                  className="px-2 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded"
                  onMouseDown={() => {
                    const interval = setInterval(() => setUsernameXOffset(prev => prev - 0.1), 50);
                    const handleMouseUp = () => {
                      clearInterval(interval);
                      document.removeEventListener('mouseup', handleMouseUp);
                    };
                    document.addEventListener('mouseup', handleMouseUp);
                  }}
                >
                  ←
                </button>
                <span className="text-sm font-mono w-16 text-center">{usernameXOffset.toFixed(2)}</span>
                <button
                  className="px-2 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded"
                  onMouseDown={() => {
                    const interval = setInterval(() => setUsernameXOffset(prev => prev + 0.1), 50);
                    const handleMouseUp = () => {
                      clearInterval(interval);
                      document.removeEventListener('mouseup', handleMouseUp);
                    };
                    document.addEventListener('mouseup', handleMouseUp);
                  }}
                >
                  →
                </button>
              </div>
              
              {/* Username Y */}
              <div className="flex items-center gap-2">
                <span className="text-sm w-16">Y:</span>
                <button
                  className="px-2 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded"
                  onMouseDown={() => {
                    const interval = setInterval(() => setUsernameYOffset(prev => prev - 0.1), 50);
                    const handleMouseUp = () => {
                      clearInterval(interval);
                      document.removeEventListener('mouseup', handleMouseUp);
                    };
                    document.addEventListener('mouseup', handleMouseUp);
                  }}
                >
                  ↓
                </button>
                <span className="text-sm font-mono w-16 text-center">{usernameYOffset.toFixed(2)}</span>
                <button
                  className="px-2 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded"
                  onMouseDown={() => {
                    const interval = setInterval(() => setUsernameYOffset(prev => prev + 0.1), 50);
                    const handleMouseUp = () => {
                      clearInterval(interval);
                      document.removeEventListener('mouseup', handleMouseUp);
                    };
                    document.addEventListener('mouseup', handleMouseUp);
                  }}
                >
                  ↑
                </button>
              </div>
            </div>
          </div>
          
          {/* Camera Look Target */}
          <div className="mb-4">
            <h4 className="text-md font-semibold mb-2">Camera Look Target</h4>
            <div className="space-y-2">
              {/* Camera X */}
              <div className="flex items-center gap-2">
                <span className="text-sm w-16">X:</span>
                <button
                  className="px-2 py-1 bg-orange-600 hover:bg-orange-700 text-white rounded"
                  onMouseDown={() => {
                    const interval = setInterval(() => setCameraLookXOffset(prev => prev - 0.1), 50);
                    const handleMouseUp = () => {
                      clearInterval(interval);
                      document.removeEventListener('mouseup', handleMouseUp);
                    };
                    document.addEventListener('mouseup', handleMouseUp);
                  }}
                >
                  ←
                </button>
                <span className="text-sm font-mono w-16 text-center">{cameraLookXOffset.toFixed(2)}</span>
                <button
                  className="px-2 py-1 bg-orange-600 hover:bg-orange-700 text-white rounded"
                  onMouseDown={() => {
                    const interval = setInterval(() => setCameraLookXOffset(prev => prev + 0.1), 50);
                    const handleMouseUp = () => {
                      clearInterval(interval);
                      document.removeEventListener('mouseup', handleMouseUp);
                    };
                    document.addEventListener('mouseup', handleMouseUp);
                  }}
                >
                  →
                </button>
              </div>
              
              {/* Camera Y */}
              <div className="flex items-center gap-2">
                <span className="text-sm w-16">Y:</span>
                <button
                  className="px-2 py-1 bg-orange-600 hover:bg-orange-700 text-white rounded"
                  onMouseDown={() => {
                    const interval = setInterval(() => setCameraLookYOffset(prev => prev - 0.1), 50);
                    const handleMouseUp = () => {
                      clearInterval(interval);
                      document.removeEventListener('mouseup', handleMouseUp);
                    };
                    document.addEventListener('mouseup', handleMouseUp);
                  }}
                >
                  ↓
                </button>
                <span className="text-sm font-mono w-16 text-center">{cameraLookYOffset.toFixed(2)}</span>
                <button
                  className="px-2 py-1 bg-orange-600 hover:bg-orange-700 text-white rounded"
                  onMouseDown={() => {
                    const interval = setInterval(() => setCameraLookYOffset(prev => prev + 0.1), 50);
                    const handleMouseUp = () => {
                      clearInterval(interval);
                      document.removeEventListener('mouseup', handleMouseUp);
                    };
                    document.addEventListener('mouseup', handleMouseUp);
                  }}
                >
                  ↑
                </button>
              </div>
            </div>
            
            {/* Lerp Toggle */}
            <div className="flex items-center gap-2 mt-2">
              <input
                type="checkbox"
                id="useLerp"
                checked={useLerp}
                onChange={(e) => setUseLerp(e.target.checked)}
                className="w-4 h-4"
              />
              <label htmlFor="useLerp" className="text-sm">
                Use smooth camera movement (lerp)
              </label>
            </div>
          </div>
          
          {/* Map Y Position */}
          <div className="mb-4">
            <h4 className="text-md font-semibold mb-2 text-green-400">Map Y Position</h4>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-sm w-16">Y:</span>
                <button
                  className="px-2 py-1 bg-green-600 hover:bg-green-700 text-white rounded"
                  onMouseDown={() => {
                    const interval = setInterval(() => setMapYOffset(prev => prev - 0.1), 50);
                    const handleMouseUp = () => {
                      clearInterval(interval);
                      document.removeEventListener('mouseup', handleMouseUp);
                    };
                    document.addEventListener('mouseup', handleMouseUp);
                  }}
                >
                  ↓
                </button>
                <span className="text-sm font-mono w-16 text-center">{mapYOffset.toFixed(2)}</span>
                <button
                  className="px-2 py-1 bg-green-600 hover:bg-green-700 text-white rounded"
                  onMouseDown={() => {
                    const interval = setInterval(() => setMapYOffset(prev => prev + 0.1), 50);
                    const handleMouseUp = () => {
                      clearInterval(interval);
                      document.removeEventListener('mouseup', handleMouseUp);
                    };
                    document.addEventListener('mouseup', handleMouseUp);
                  }}
                >
                  ↑
                </button>
              </div>
            </div>
          </div>
          
          {/* Actions */}
          <div className="flex gap-2">
            <button
              className="px-2 py-1 bg-gray-600 hover:bg-gray-700 text-white rounded text-sm"
              onClick={() => {
                setPlayerXOffset(0);
                setPlayerYOffset(0);
                setUsernameXOffset(0);
                setUsernameYOffset(-4.90);
                setCameraLookXOffset(0);
                setCameraLookYOffset(1.7);
                setMapYOffset(-0.30);
                setModelXOffset(0.10);
                setModelYOffset(-3.60);
                setUseLerp(true);
              }}
            >
              Reset All
            </button>
            <button
              className="px-2 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-sm"
              onClick={() => {
                console.log('=== OPTIMAL POSITIONS & SCREEN CENTER ===');
                console.log(`Screen Dimensions: ${window.innerWidth} x ${window.innerHeight}`);
                console.log(`Screen Center: (${window.innerWidth/2}, ${window.innerHeight/2})`);
                console.log(`Player X Offset: ${playerXOffset.toFixed(2)}`);
                console.log(`Player Y Offset: ${playerYOffset.toFixed(2)}`);
                console.log(`Username X Offset: ${usernameXOffset.toFixed(2)}`);
                console.log(`Username Y Offset: ${usernameYOffset.toFixed(2)}`);
                console.log(`Model X Offset: ${modelXOffset.toFixed(2)}`);
                console.log(`Model Y Offset: ${modelYOffset.toFixed(2)}`);
                console.log(`Camera Look X Offset: ${cameraLookXOffset.toFixed(2)}`);
                console.log(`Camera Look Y Offset: ${cameraLookYOffset.toFixed(2)}`);
                console.log(`Map Y Offset: ${mapYOffset.toFixed(2)}`);
                console.log('=====================================');
                alert(`Positions logged to console!\n\nScreen: ${window.innerWidth}x${window.innerHeight}\nCenter: (${(window.innerWidth/2).toFixed(0)}, ${(window.innerHeight/2).toFixed(0)})\n\nPlayer: X=${playerXOffset.toFixed(2)}, Y=${playerYOffset.toFixed(2)}\nUsername: X=${usernameXOffset.toFixed(2)}, Y=${usernameYOffset.toFixed(2)}\nModel: X=${modelXOffset.toFixed(2)}, Y=${modelYOffset.toFixed(2)}\nCamera: X=${cameraLookXOffset.toFixed(2)}, Y=${cameraLookYOffset.toFixed(2)}\nMap Y: ${mapYOffset.toFixed(2)}`);
              }}
            >
              Log Values
            </button>
          </div>
          
          <div className="mt-2 text-xs text-muted-foreground">
            Hold arrows to adjust continuously
          </div>
          
          <button
            className="absolute top-2 right-2 text-gray-400 hover:text-gray-200"
            onClick={() => setShowDebug(false)}
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
});

// Third-person camera component
const ThirdPersonCamera = ({ wizardPosition, wizardRotation, lookXOffset = 0, lookYOffset = 2, useLerp = true, onScreenPosUpdate }: { 
  wizardPosition: number[]; 
  wizardRotation: number;
  lookXOffset?: number;
  lookYOffset?: number;
  useLerp?: boolean;
  onScreenPosUpdate?: (pos: { x: number; y: number }) => void;
}) => {
  const cameraRef = useRef<THREE.Camera>();
  const frameCount = useRef(0);
  const previousRotation = useRef(wizardRotation);

  useFrame(({ camera }) => {
    if (!cameraRef.current) cameraRef.current = camera;

    frameCount.current++;
    
    // Check for invalid position
    if (wizardPosition.some(pos => isNaN(pos) || pos === undefined || pos === null)) {
      console.error('[ThirdPersonCamera] ❌ Invalid wizard position detected!', wizardPosition);
      return; // Don't update camera with invalid position
    }

    // Calculate camera position behind the wizard
    const distance = 10; // Closer view
    const height = 7; // Lower height
    
    const wizardPos = new THREE.Vector3(wizardPosition[0], wizardPosition[1], wizardPosition[2]);
    
    // Position camera behind wizard based on rotation
    const cameraPosition = new THREE.Vector3(
      wizardPos.x - Math.sin(wizardRotation) * distance,
      wizardPos.y + height,
      wizardPos.z - Math.cos(wizardRotation) * distance
    );

    // Look at wizard position with rotation-relative offset
    // Apply the offset in the player's local space, not world space
    const lookTarget = new THREE.Vector3(
      wizardPos.x + Math.sin(wizardRotation) * lookXOffset,
      wizardPos.y + lookYOffset,
      wizardPos.z + Math.cos(wizardRotation) * lookXOffset
    );

    // Camera debugging every 60 frames
    if (frameCount.current % 60 === 0) {
      const currentCamPos = camera.position;
      const distanceToPlayer = currentCamPos.distanceTo(wizardPos);
      const angleToPlayer = Math.atan2(
        currentCamPos.x - wizardPos.x,
        currentCamPos.z - wizardPos.z
      );
      
      // Calculate screen projection of player
      // wizardPos already includes playerXOffset from the prop
      const playerScreenPos = wizardPos.clone();
      playerScreenPos.project(camera);
      const screenX = (playerScreenPos.x + 1) * window.innerWidth / 2;
      const screenY = (-playerScreenPos.y + 1) * window.innerHeight / 2;
      const screenCenterX = window.innerWidth / 2;
      const screenCenterY = window.innerHeight / 2;
      
      // Update parent component with player screen position
      if (onScreenPosUpdate) {
        onScreenPosUpdate({ x: screenX, y: screenY });
      }
      
      console.log('[CAMERA & SCREEN CENTER DEBUG]:', {
        frame: frameCount.current,
        '=== CAMERA POSITION ===': '',
        wizardRotation: wizardRotation.toFixed(2),
        rotationDelta: (wizardRotation - previousRotation.current).toFixed(2),
        playerPos: [wizardPos.x.toFixed(2), wizardPos.y.toFixed(2), wizardPos.z.toFixed(2)],
        currentCameraPos: [currentCamPos.x.toFixed(2), currentCamPos.y.toFixed(2), currentCamPos.z.toFixed(2)],
        targetCameraPos: [cameraPosition.x.toFixed(2), cameraPosition.y.toFixed(2), cameraPosition.z.toFixed(2)],
        distanceToPlayer: distanceToPlayer.toFixed(2),
        expectedDistance: distance,
        '=== SCREEN PROJECTION ===': '',
        screenCenter: [screenCenterX, screenCenterY],
        playerScreenPosition: [screenX.toFixed(2), screenY.toFixed(2)],
        offsetFromCenter: [
          (screenX - screenCenterX).toFixed(2),
          (screenY - screenCenterY).toFixed(2)
        ],
        '=== CAMERA SETTINGS ===': '',
        fov: camera.fov,
        aspect: camera.aspect.toFixed(2),
        near: camera.near,
        far: camera.far,
        angleToPlayer: angleToPlayer.toFixed(2),
        lookTargetOffset: [lookXOffset, lookYOffset],
        lookTargetPos: [lookTarget.x.toFixed(2), lookTarget.y.toFixed(2), lookTarget.z.toFixed(2)],
        cameraPositionError: [
          (currentCamPos.x - cameraPosition.x).toFixed(2),
          (currentCamPos.y - cameraPosition.y).toFixed(2),
          (currentCamPos.z - cameraPosition.z).toFixed(2)
        ],
        useLerp: useLerp
      });
      
      previousRotation.current = wizardRotation;
    }

    // Camera movement - either lerped or direct
    if (useLerp) {
      camera.position.lerp(cameraPosition, 0.1);
    } else {
      camera.position.copy(cameraPosition);
    }
    camera.lookAt(lookTarget);
  });

  return null;
};

export default WizardGame;