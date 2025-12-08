import { useState } from 'react';
import WizardGame from '@/components/WizardGame';
import Home from '@/components/Home';

const Index = () => {
  const [gameState, setGameState] = useState<'home' | 'game'>('home');
  const [username, setUsername] = useState('');
  const [userId, setUserId] = useState('');
  const [modelId, setModelId] = useState('');
  const [isSignedIn, setIsSignedIn] = useState(false);

  const handleStartGame = (username: string, userId: string, modelId: string) => {
    console.log(`[Index] 🎮 STARTING GAME:`, {
      username,
      userId,
      modelId,
      timestamp: new Date().toISOString()
    });
    
    // Set user data first
    setUsername(username);
    setUserId(userId);
    setModelId(modelId);
    
    // Then set signed in to true
    setIsSignedIn(true);
    
    // Finally change game state
    setGameState('game');
    
    console.log(`[Index] ✅ Game state changed to 'game', rendering WizardGame component`);
  };

  if (gameState === 'home') {
    return <Home onStartGame={handleStartGame} />;
  }

  return <WizardGame username={username} userId={userId} modelId={modelId} isSignedIn={isSignedIn} />;
};

export default Index;
