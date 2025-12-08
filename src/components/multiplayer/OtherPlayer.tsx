import React, { useRef, useEffect } from 'react';
import { PlayerState } from '../../hooks/useSocketMultiplayer';
import SchoolWizard from '../SchoolWizard';

interface OtherPlayerProps {
  player: PlayerState;
}

const OtherPlayer: React.FC<OtherPlayerProps> = ({ player }) => {
  const lastMovingState = useRef(player.isMoving);
  
  // Force Y position to 6.3 for all other players
  const fixedPosition = [player.position.x, 6.3, player.position.z];
  
  return (
    <SchoolWizard
      position={fixedPosition}
      rotation={player.rotation}
      username={player.username}
      modelId={player.modelId || 'fire-a'} // Default to fire-a if no model specified
      isMoving={player.isMoving || false} // Ensure boolean
      chatMessage={player.chatMessage}
      chatTime={player.chatMessageTime}
      isLocal={false}  // CRITICAL: Mark as remote player!
    />
  );
};

export default OtherPlayer;