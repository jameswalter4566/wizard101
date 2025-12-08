import React, { memo } from 'react';
import SchoolWizard from './SchoolWizard';

interface LocalPlayerProps {
  position: number[];
  rotation: number;
  chatMessage?: string;
  chatTime?: number;
  username: string;
  modelId: string;
  isMoving: boolean;
  usernameXOffset?: number;
  usernameYOffset?: number;
  modelXOffset?: number;
  modelYOffset?: number;
}

// Memoized local player to prevent unnecessary re-renders
const LocalPlayer = memo(({ 
  position, 
  rotation, 
  chatMessage, 
  chatTime, 
  username, 
  modelId, 
  isMoving,
  usernameXOffset = 0,
  usernameYOffset = 0,
  modelXOffset = 0,
  modelYOffset = 0
}: LocalPlayerProps) => {
  // Reduced logging - only log on significant changes
  // console.log(`[LocalPlayer] 👤 Rendering local player:`, {
  //   username,
  //   modelId,
  //   position,
  //   isMoving
  // });
  
  return (
    <SchoolWizard
      position={position}
      rotation={rotation}
      chatMessage={chatMessage}
      chatTime={chatTime}
      username={username}
      modelId={modelId}
      isMoving={isMoving}
      isLocal={true}
      usernameXOffset={usernameXOffset}
      usernameYOffset={usernameYOffset}
      modelXOffset={modelXOffset}
      modelYOffset={modelYOffset}
    />
  );
});

LocalPlayer.displayName = 'LocalPlayer';

export default LocalPlayer;