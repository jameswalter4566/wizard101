import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { useToast } from './ui/use-toast';
import { supabase } from '../integrations/supabase/client';
import { CharacterPreview } from './CharacterPreview';

interface HomeProps {
  onStartGame: (username: string, userId: string, modelId: string) => void;
}

const Home: React.FC<HomeProps> = ({ onStartGame }) => {
  const [username, setUsername] = useState('');
  const [selectedSchool, setSelectedSchool] = useState<string>('fire');
  const [selectedModelId, setSelectedModelId] = useState<string>('fire-a');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  

  const schools = [
    { id: 'fire', name: 'Fire', color: 'from-red-500 to-orange-500', icon: '🔥' },
    { id: 'ice', name: 'Ice', color: 'from-cyan-500 to-blue-400', icon: '❄️' },
    { id: 'myth', name: 'Myth', color: 'from-yellow-500 to-amber-500', icon: '🦅' },
    { id: 'life', name: 'Life', color: 'from-green-500 to-emerald-500', icon: '🌿' },
    { id: 'balance', name: 'Balance', color: 'from-amber-600 to-yellow-600', icon: '⚖️' },
    { id: 'death', name: 'Death', color: 'from-gray-700 to-purple-900', icon: '💀' }
  ];

  const handlePlayNow = async () => {
    if (!username.trim()) {
      toast({
        title: "Username required",
        description: "Please enter a username for your wizard",
        variant: "destructive"
      });
      return;
    }

    if (!selectedSchool) {
      toast({
        title: "School required",
        description: "Please select a school for your wizard",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    
    try {
      // Check if username already exists
      const { data: existingUser } = await supabase
        .from('users')
        .select('id, username, character_model')
        .eq('username', username.trim())
        .maybeSingle();

      if (existingUser) {
        // User exists, use their ID
        // Always use the currently selected model
        const modelToUse = selectedModelId;
        console.log(`[Home] 🔍 EXISTING USER FLOW:`);
        console.log(`  - Username: "${existingUser.username}"`);
        console.log(`  - User ID: "${existingUser.id}"`);
        console.log(`  - Stored model in DB: "${existingUser.character_model}"`);
        console.log(`  - Currently selected model: "${selectedModelId}"`);
        console.log(`  - Model being passed to game: "${modelToUse}"`);
        
        // Update the database with the new model selection
        if (existingUser.character_model !== selectedModelId) {
          console.log(`[Home] 📝 Updating database - changing model from "${existingUser.character_model}" to "${selectedModelId}"`);
          await supabase
            .from('users')
            .update({ character_model: selectedModelId })
            .eq('id', existingUser.id);
          console.log(`[Home] ✅ Database updated with new model: ${selectedModelId}`);
        }
        
        console.log(`[Home] 🚀 Starting game with:`, { username: existingUser.username, userId: existingUser.id, modelId: modelToUse });
        onStartGame(existingUser.username, existingUser.id, modelToUse);
      } else {
        // Create new user with minimal data
        const { data: newUser, error } = await supabase
          .from('users')
          .insert({
            username: username.trim(),
            character_model: selectedModelId, // Store specific model ID
            // Generate placeholder wallet keys (not used for now)
            wallet_public_key: `pk_${Math.random().toString(36).substring(7)}`,
            wallet_private_key: `sk_${Math.random().toString(36).substring(7)}`
          })
          .select()
          .single();

        if (error) {
          throw error;
        }

        if (newUser) {
          console.log(`[Home] 🆕 NEW USER CREATED:`);
          console.log(`  - Username: "${newUser.username}"`);
          console.log(`  - User ID: "${newUser.id}"`);
          console.log(`  - Model saved to DB: "${selectedModelId}"`);
          console.log(`[Home] 🚀 Starting game with:`, { username: newUser.username, userId: newUser.id, modelId: selectedModelId });
          onStartGame(newUser.username, newUser.id, selectedModelId);
        }
      }
    } catch (error: any) {
      console.error('Error creating/finding user:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create wizard",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handlePlayNow();
    }
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{
        backgroundImage: 'url(/images/wizardbackround.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      <div className="absolute inset-0 bg-black/40" />
      
      {/* Main Container */}
      <div className="relative z-10 flex items-center justify-center gap-12 px-4 w-full">
        {/* Left Side - Character Preview with Input */}
        <div className="flex flex-col items-center gap-4">
          <CharacterPreview
            selectedSchool={selectedSchool}
            onSchoolChange={setSelectedSchool}
            selectedModelId={selectedModelId}
            onModelChange={setSelectedModelId}
          />
          
          {/* Input and Button below wizard */}
          <div className="w-full max-w-sm space-y-4">
            <input
              type="text"
              placeholder="NAME YOUR WIZARD"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isLoading}
              className={`
                w-full px-4 py-3 rounded-lg text-center
                text-yellow-400 placeholder:text-yellow-400/70
                border-2 border-yellow-600/50 shadow-lg shadow-red-900/50
                font-bold text-xl uppercase tracking-wider
                transition-all duration-200
                focus:outline-none focus:border-yellow-500 focus:shadow-yellow-500/25
                disabled:opacity-50 disabled:cursor-not-allowed
                ${username.length === 0 
                  ? 'bg-gradient-to-b from-gray-600 to-gray-700' 
                  : 'bg-gradient-to-b from-red-700 to-red-900'}
              `}
              style={{
                fontFamily: "'Comic Sans MS', 'Comic Sans', cursive",
                textShadow: '1px 1px 2px rgba(0,0,0,0.8)'
              }}
              maxLength={20}
            />
            
            <button
              onClick={handlePlayNow}
              disabled={isLoading || !username.trim() || !selectedSchool}
              className="
                w-full py-4 rounded-lg font-bold text-2xl uppercase tracking-wider
                transition-all duration-200 transform hover:scale-105
                bg-gradient-to-b from-red-700 to-red-900 text-yellow-400 
                shadow-lg shadow-red-900/50 hover:from-red-600 hover:to-red-800
                border-2 border-yellow-600/50
              "
              style={{
                fontFamily: "'Comic Sans MS', 'Comic Sans', cursive",
                textShadow: '2px 2px 4px rgba(0,0,0,0.8)'
              }}
            >
              {isLoading ? 'CREATING WIZARD...' : 'PLAY NOW'}
            </button>
          </div>
        </div>

        {/* Right Side - School Selection */}
        <div className="bg-black/20 backdrop-blur-sm rounded-xl p-8 border border-white/10">
          <h2 className="text-2xl font-bold text-white mb-6 text-center">Choose Your School</h2>
          <div className="grid grid-cols-2 gap-4">
            {schools.map((school) => (
              <button
                key={school.id}
                onClick={() => setSelectedSchool(school.id)}
                className={`
                  relative p-6 rounded-lg border-2 transition-all duration-200
                  ${selectedSchool === school.id 
                    ? 'border-white scale-105 shadow-lg' 
                    : 'border-white/20 hover:border-white/40 hover:scale-102'
                  }
                `}
              >
                <div
                  className={`
                    absolute inset-0 bg-gradient-to-br ${school.color} rounded-lg opacity-80
                    ${selectedSchool === school.id ? 'opacity-100' : ''}
                  `}
                />
                <div className="relative text-center">
                  <div className="text-5xl mb-3">{school.icon}</div>
                  <div className="text-white font-semibold text-lg">{school.name}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
      
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-32 h-32 bg-purple-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-10 w-48 h-48 bg-blue-500/20 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl animate-pulse delay-2000" />
      </div>
    </div>
  );
};

export default Home;