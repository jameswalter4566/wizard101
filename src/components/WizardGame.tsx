import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Environment, useGLTF, Html } from '@react-three/drei';
import * as THREE from 'three';
import { Backpack, Sparkles, User } from 'lucide-react';
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

type HudIconSettings = {
  offsetX: number;
  offsetY: number;
  scale: number;
};

const HUD_ICON_BASE_SIZE = 72;
const HUD_HOVER_SCALE = 1.08;

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
  const [hudContainerOffset, setHudContainerOffset] = useState({ x: 0, y: 0 });
  const [shopIconSettings, setShopIconSettings] = useState<HudIconSettings>({ offsetX: 0, offsetY: 0, scale: 1 });
  const [inventoryIconSettings, setInventoryIconSettings] = useState<HudIconSettings>({ offsetX: 0, offsetY: 0, scale: 1 });
  const [isShopHovered, setIsShopHovered] = useState(false);
  const [isInventoryHovered, setIsInventoryHovered] = useState(false);
  const [isShopOpen, setIsShopOpen] = useState(false);
  const [isInventoryOpen, setIsInventoryOpen] = useState(false);
  const [showHudDebug, setShowHudDebug] = useState(false);
  const [selectedShopItem, setSelectedShopItem] = useState<string | null>(null);
  const [inventoryTab, setInventoryTab] = useState<'character' | 'backpack' | 'spells'>('character');
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { setCollisionCheck, checkCollision } = useCollisionDetection('/models/wizard_101_commons_area.glb');
  
  // Get model-specific offsets
  const currentModel = getModelById(modelId);
  const modelYOffsetFromConfig = currentModel?.modelYOffset || 0;
  const schoolLabel = currentModel?.schoolId ? currentModel.schoolId.charAt(0).toUpperCase() + currentModel.schoolId.slice(1) : 'Unknown School';

  const shopItems = useMemo(() => ([
    { id: 'giant-spell-pack', name: 'Giant Magic Spell Pack', detail: 'Premium cache of spells', price: '10,000 $WIZ', image: '/hud/giant-spell-pack.png' },
    { id: 'medium-spell-pack', name: 'Medium Magic Spell Pack', detail: 'Solid bundle of spells', price: '8,000 $WIZ', image: '/hud/medium-spell-pack.png' },
    { id: 'small-spell-pack', name: 'Small Magic Spell Pack', detail: 'Starter spell picks', price: '6,000 $WIZ', image: '/hud/small-spell-pack.png' },
    { id: 'snack-pack', name: 'Snack Pack Bundle', detail: 'A tasty haul for your pets', price: '10,000 $WIZ', image: '/hud/snack-pack.png' },
    { id: 'spell-bundle', name: 'Spell Bundle', detail: 'Unlocks premium spell cards', price: '20,000 $WIZ', image: '/hud/spell-bundle.png' },
    { id: 'coin-bundle', name: 'Coin Bundle', detail: 'Stock up your coffers', price: '30,000 $WIZ', image: '/hud/coin-bundle.png' },
    { id: 'ember-staff', name: 'Arcane Ember Staff', detail: '+20% fire damage', price: '250g' },
    { id: 'frostleaf-cloak', name: 'Frostleaf Cloak', detail: 'Cold resist + comfy', price: '180g' },
    { id: 'storm-charm', name: 'Storm Sprite Charm', detail: 'Summon storm ally', price: '95g' },
    { id: 'mythic-tome', name: 'Mythic Tome', detail: 'Unlocks a rare spell', price: '320g' },
    { id: 'life-amulet', name: 'Vitality Amulet', detail: 'Small heal over time', price: '140g' },
    { id: 'balance-sigil', name: 'Balance Sigil', detail: '+5% crit chance', price: '210g' },
  ]), []);

  const inventoryTabs = useMemo(() => ([
    { id: 'character', label: 'Character', icon: User },
    { id: 'backpack', label: 'Backpack', icon: Backpack },
    { id: 'spells', label: 'Spells Deck', icon: Sparkles },
  ]), []);
  
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

  const updateIconSetting = (icon: 'shop' | 'inventory', key: keyof HudIconSettings, value: number) => {
    if (icon === 'shop') {
      setShopIconSettings(prev => ({ ...prev, [key]: value }));
      return;
    }
    setInventoryIconSettings(prev => ({ ...prev, [key]: value }));
  };

  const resetHudIconSettings = () => {
    setHudContainerOffset({ x: 0, y: 0 });
    setShopIconSettings({ offsetX: 0, offsetY: 0, scale: 1 });
    setInventoryIconSettings({ offsetX: 0, offsetY: 0, scale: 1 });
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

      {/* HUD Debug Toggle */}
      <button
        className="absolute top-4 left-4 z-20 px-3 py-2 text-xs font-semibold rounded-lg border border-border bg-card/80 text-foreground shadow-sm backdrop-blur-sm hover:bg-card/95 transition-colors"
        onClick={() => setShowHudDebug(prev => !prev)}
        type="button"
      >
        {showHudDebug ? 'Close HUD Icon Debug' : 'HUD Icon Debug'}
      </button>

      {/* Chat Box */}
      <ChatBox
        onSendMessage={handleSendMessage}
        isConnected={isConnected}
        containerClassName="absolute bottom-6 left-1/2 -translate-x-1/2"
        username={username || 'Wizard'}
        schoolName={schoolLabel}
      />

      {/* HUD Buttons & Volume */}
      <div className="absolute bottom-4 right-4 flex flex-col items-end gap-3 z-20">
        <div
          className="flex items-end gap-3"
          style={{ transform: `translate(${hudContainerOffset.x}px, ${hudContainerOffset.y}px)` }}
        >
          <button
            type="button"
            aria-label="Open Item Shop"
            className="relative overflow-hidden rounded-xl border border-border bg-white/90 shadow-lg backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-primary/60"
            style={{
              width: `${HUD_ICON_BASE_SIZE}px`,
              height: `${HUD_ICON_BASE_SIZE}px`,
              transform: `translate(${shopIconSettings.offsetX}px, ${shopIconSettings.offsetY}px) scale(${shopIconSettings.scale * (isShopHovered ? HUD_HOVER_SCALE : 1)})`,
              transition: 'transform 180ms ease, box-shadow 180ms ease'
            }}
            onMouseEnter={() => setIsShopHovered(true)}
            onMouseLeave={() => setIsShopHovered(false)}
            onClick={() => setIsShopOpen(true)}
          >
            <img
              src="/hud/item-shop.png"
              alt="Item Shop"
              className="w-full h-full object-contain pointer-events-none select-none"
              draggable={false}
            />
            <div className="absolute inset-0 rounded-xl ring-1 ring-white/40" />
          </button>

          <button
            type="button"
            aria-label="Open Item Inventory"
            className="relative overflow-hidden rounded-xl border border-border bg-white/90 shadow-lg backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-primary/60"
            style={{
              width: `${HUD_ICON_BASE_SIZE}px`,
              height: `${HUD_ICON_BASE_SIZE}px`,
              transform: `translate(${inventoryIconSettings.offsetX}px, ${inventoryIconSettings.offsetY}px) scale(${inventoryIconSettings.scale * (isInventoryHovered ? HUD_HOVER_SCALE : 1)})`,
              transition: 'transform 180ms ease, box-shadow 180ms ease'
            }}
            onMouseEnter={() => setIsInventoryHovered(true)}
            onMouseLeave={() => setIsInventoryHovered(false)}
            onClick={() => setIsInventoryOpen(true)}
          >
            <img
              src="/hud/item-inventory.png"
              alt="Item Inventory"
              className="w-full h-full object-contain pointer-events-none select-none"
              draggable={false}
            />
            <div className="absolute inset-0 rounded-xl ring-1 ring-white/40" />
          </button>
        </div>

        <div className="bg-card/90 backdrop-blur-sm p-3 rounded-lg border border-border shadow-lg w-full flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm text-foreground">🎵</span>
            <span className="text-xs text-muted-foreground">Music</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            defaultValue="30"
            className="w-28"
            onChange={(e) => {
              if (audioRef.current) {
                audioRef.current.volume = parseInt(e.target.value) / 100;
              }
            }}
          />
        </div>
      </div>

      {/* Item Shop Menu */}
      {isShopOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsShopOpen(false)}
            role="presentation"
          />
          <div
            className="relative bg-black/85 text-white border border-white/20 rounded-3xl shadow-2xl p-6 w-[min(95vw,1040px)] h-[80vh] max-h-[85vh] overflow-hidden flex flex-col"
            style={{ fontFamily: 'Inter, sans-serif' }}
          >
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h2 className="text-3xl font-bold text-white">Item Shop</h2>
                <p className="text-sm text-white/80">Pick your gear, then purchase when ready.</p>
              </div>
              <button
                type="button"
                className="text-lg text-white/70 hover:text-white transition-colors"
                onClick={() => setIsShopOpen(false)}
              >
                ×
              </button>
            </div>

            <div className="flex-1 overflow-y-auto pr-2">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {shopItems.map((item) => {
                  const isSelected = selectedShopItem === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setSelectedShopItem(item.id)}
                      className={`relative group rounded-xl border border-white/25 bg-white/5 overflow-hidden text-left transition-all duration-200 ${isSelected ? 'ring-2 ring-white shadow-xl bg-white/10' : 'hover:border-white/50 hover:bg-white/10'}`}
                      style={{ minHeight: '220px' }}
                    >
                      <div className="absolute top-3 right-3">
                        <div className={`h-5 w-5 rounded-md border ${isSelected ? 'border-white bg-white/80' : 'border-white/40 bg-black/60'}`} />
                      </div>
                      <div className="aspect-[4/3] w-full bg-gradient-to-br from-white/10 via-black/40 to-black/70 flex items-center justify-center overflow-hidden">
                        {item.image ? (
                          <img src={item.image} alt={item.name} className="w-full h-full object-contain" />
                        ) : (
                          <div className="text-xs text-white/80">Preview coming soon</div>
                        )}
                      </div>
                      <div className="p-3 space-y-1">
                        <p className="text-base font-semibold text-white">{item.name}</p>
                        <p className="text-xs text-white/80">{item.detail}</p>
                        <p className="text-sm font-semibold text-white mt-1">{item.price}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="pt-4 flex items-center justify-between gap-3">
              <div className="text-sm text-white/80">
                {selectedShopItem ? 'Ready to purchase selected item.' : 'Select an item to enable purchase.'}
              </div>
              <button
                type="button"
                disabled={!selectedShopItem}
                className={`px-6 py-3 rounded-xl font-semibold uppercase tracking-wide transition-all duration-200 border ${selectedShopItem ? 'bg-white/20 text-white border-white shadow-lg shadow-white/20 hover:bg-white/30' : 'bg-white/5 text-white/50 border-white/20 opacity-70 cursor-not-allowed'}`}
              >
                Buy Selected
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Inventory Menu */}
      {isInventoryOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsInventoryOpen(false)}
            role="presentation"
          />
          <div
            className="relative bg-black/85 text-white border border-white/20 rounded-3xl shadow-2xl p-6 w-[min(95vw,1040px)] h-[80vh] max-h-[85vh] overflow-hidden flex flex-col"
            style={{ fontFamily: 'Inter, sans-serif' }}
          >
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h2 className="text-3xl font-bold text-white">Inventory</h2>
                <p className="text-sm text-white/80">Manage your gear, deck, and stats.</p>
              </div>
              <button
                type="button"
                className="text-lg text-white/70 hover:text-white transition-colors"
                onClick={() => setIsInventoryOpen(false)}
              >
                ×
              </button>
            </div>

            <div className="flex-1 flex gap-4 overflow-hidden">
              <div className="flex-1 bg-white/5 rounded-2xl border border-white/20 p-4 overflow-y-auto">
                {inventoryTab === 'character' && (
                  <div className="space-y-4 text-white">
                    <div className="flex justify-center">
                      <div className="flex items-center gap-4 bg-white/5 border border-white/20 rounded-2xl px-4 py-3">
                        <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-white shadow-lg">
                          <img src="/hud/avatar-placeholder.jpg" alt="Avatar" className="w-full h-full object-cover" />
                        </div>
                        <div className="text-center">
                          <div className="text-xl font-bold">{username || 'Wizard'}</div>
                          <div className="text-sm text-white/80">School: {schoolLabel} • Level 1</div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {[
                        { label: 'Health', value: '100' },
                        { label: 'Mana', value: '0' },
                        { label: 'Experience', value: '0' },
                        { label: 'Training Points', value: '0' },
                        { label: 'Gold', value: '0' },
                        { label: '$WIZ', value: '0' },
                      ].map(stat => (
                        <div key={stat.label} className="rounded-xl border border-white/20 bg-white/5 p-3 text-center">
                          <div className="text-sm text-white/80">{stat.label}</div>
                          <div className="text-xl font-bold text-white mt-1">{stat.value}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {inventoryTab === 'backpack' && (
                  <div className="space-y-3 text-white">
                    <p className="text-center text-sm text-white/80">Your items will appear here.</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {Array.from({ length: 12 }).map((_, idx) => (
                        <div key={idx} className="h-24 rounded-lg border border-dashed border-white/30 bg-white/5" />
                      ))}
                    </div>
                  </div>
                )}

                {inventoryTab === 'spells' && (
                  <div className="space-y-3 text-white">
                    <p className="text-center text-sm text-white/80">Your spells will display here.</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {Array.from({ length: 12 }).map((_, idx) => (
                        <div key={idx} className="h-24 rounded-lg border border-dashed border-white/30 bg-white/5" />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="w-40 flex flex-col items-stretch gap-2">
                {inventoryTabs.map((tab, index) => {
                  const Icon = tab.icon;
                  const isActive = inventoryTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setInventoryTab(tab.id as typeof inventoryTab)}
                      className={`flex items-center justify-between gap-2 px-3 py-3 rounded-xl border transition-all duration-200 ${isActive ? 'bg-white/15 text-white border-white shadow-lg shadow-white/15' : 'bg-white/5 text-white/80 border-white/20 hover:border-white/40 hover:bg-white/10'}`}
                      style={{ marginTop: index === 0 ? 0 : 6 }}
                    >
                      <span className="text-sm font-semibold">{tab.label}</span>
                      <Icon className="h-4 w-4" />
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* HUD Icon Debugger */}
      {showHudDebug && (
        <div className="absolute top-16 left-4 z-30 bg-card/95 backdrop-blur-lg p-4 rounded-xl border border-border shadow-xl w-80">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div>
              <h3 className="text-lg font-bold text-primary">HUD Icon Debug</h3>
              <p className="text-xs text-muted-foreground">Fine-tune placement and scaling live.</p>
            </div>
            <button
              type="button"
              className="text-sm text-muted-foreground hover:text-foreground"
              onClick={() => setShowHudDebug(false)}
            >
              ×
            </button>
          </div>

          <div className="space-y-3">
            <div>
              <div className="text-sm font-semibold mb-1">HUD Stack Offset</div>
              <div className="flex flex-col gap-2">
                <label className="flex flex-col text-xs gap-1">
                  X Position ({hudContainerOffset.x.toFixed(0)}px)
                  <input
                    type="range"
                    min={-200}
                    max={200}
                    step={1}
                    value={hudContainerOffset.x}
                    onChange={(e) => setHudContainerOffset(prev => ({ ...prev, x: parseFloat(e.target.value) }))}
                  />
                </label>
                <label className="flex flex-col text-xs gap-1">
                  Y Position ({hudContainerOffset.y.toFixed(0)}px)
                  <input
                    type="range"
                    min={-200}
                    max={200}
                    step={1}
                    value={hudContainerOffset.y}
                    onChange={(e) => setHudContainerOffset(prev => ({ ...prev, y: parseFloat(e.target.value) }))}
                  />
                </label>
              </div>
            </div>

            <div className="border-t border-border pt-3">
              <div className="text-sm font-semibold mb-1">Item Shop Icon</div>
              <div className="flex flex-col gap-2">
                <label className="flex flex-col text-xs gap-1">
                  X Offset ({shopIconSettings.offsetX.toFixed(0)}px)
                  <input
                    type="range"
                    min={-150}
                    max={150}
                    step={1}
                    value={shopIconSettings.offsetX}
                    onChange={(e) => updateIconSetting('shop', 'offsetX', parseFloat(e.target.value))}
                  />
                </label>
                <label className="flex flex-col text-xs gap-1">
                  Y Offset ({shopIconSettings.offsetY.toFixed(0)}px)
                  <input
                    type="range"
                    min={-150}
                    max={150}
                    step={1}
                    value={shopIconSettings.offsetY}
                    onChange={(e) => updateIconSetting('shop', 'offsetY', parseFloat(e.target.value))}
                  />
                </label>
                <label className="flex flex-col text-xs gap-1">
                  Scale ({shopIconSettings.scale.toFixed(2)}x)
                  <input
                    type="range"
                    min={0.6}
                    max={1.6}
                    step={0.02}
                    value={shopIconSettings.scale}
                    onChange={(e) => updateIconSetting('shop', 'scale', parseFloat(e.target.value))}
                  />
                </label>
              </div>
            </div>

            <div className="border-t border-border pt-3">
              <div className="text-sm font-semibold mb-1">Inventory Icon</div>
              <div className="flex flex-col gap-2">
                <label className="flex flex-col text-xs gap-1">
                  X Offset ({inventoryIconSettings.offsetX.toFixed(0)}px)
                  <input
                    type="range"
                    min={-150}
                    max={150}
                    step={1}
                    value={inventoryIconSettings.offsetX}
                    onChange={(e) => updateIconSetting('inventory', 'offsetX', parseFloat(e.target.value))}
                  />
                </label>
                <label className="flex flex-col text-xs gap-1">
                  Y Offset ({inventoryIconSettings.offsetY.toFixed(0)}px)
                  <input
                    type="range"
                    min={-150}
                    max={150}
                    step={1}
                    value={inventoryIconSettings.offsetY}
                    onChange={(e) => updateIconSetting('inventory', 'offsetY', parseFloat(e.target.value))}
                  />
                </label>
                <label className="flex flex-col text-xs gap-1">
                  Scale ({inventoryIconSettings.scale.toFixed(2)}x)
                  <input
                    type="range"
                    min={0.6}
                    max={1.6}
                    step={0.02}
                    value={inventoryIconSettings.scale}
                    onChange={(e) => updateIconSetting('inventory', 'scale', parseFloat(e.target.value))}
                  />
                </label>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                onClick={resetHudIconSettings}
              >
                Reset to defaults
              </button>
              <div className="text-[11px] text-muted-foreground">
                Tip: keep inventory on the far right.
              </div>
            </div>
          </div>
        </div>
      )}

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
