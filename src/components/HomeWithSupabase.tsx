import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { useToast } from './ui/use-toast';
import { supabase } from '../integrations/supabase/client';
import { ImageLoader } from '../lib/imageLoader';

interface HomeProps {
  onStartGame: (username: string, userId: string) => void;
}

const HomeWithSupabase: React.FC<HomeProps> = ({ onStartGame }) => {
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [bgUrl, setBgUrl] = useState('');
  const [bgLoaded, setBgLoaded] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Load optimized background from Supabase
    const loadBackground = async () => {
      try {
        // Load tiny placeholder first
        const tinyUrl = await ImageLoader.loadFromSupabase('login-bg.jpg', {
          transform: { width: 20, height: 20, quality: 20 }
        });
        
        // Then load full image
        const fullUrl = await ImageLoader.loadFromSupabase('login-bg.jpg', {
          transform: { width: 1920, height: 1080, quality: 85 }
        });
        
        // Preload full image
        await ImageLoader.preload(fullUrl);
        setBgUrl(fullUrl);
        setBgLoaded(true);
      } catch (error) {
        console.error('Failed to load background:', error);
        // Fall back to gradient
      }
    };

    loadBackground();
  }, []);

  const handlePlayNow = async () => {
    if (!username.trim()) {
      toast({
        title: "Username required",
        description: "Please enter a username for your wizard",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const { data: existingUser } = await supabase
        .from('users')
        .select('id, username')
        .eq('username', username.trim())
        .maybeSingle();

      if (existingUser) {
        onStartGame(existingUser.username, existingUser.id);
      } else {
        const { data: newUser, error } = await supabase
          .from('users')
          .insert({
            username: username.trim(),
            wallet_public_key: `pk_${Math.random().toString(36).substring(7)}`,
            wallet_private_key: `sk_${Math.random().toString(36).substring(7)}`
          })
          .select()
          .single();

        if (error) throw error;
        if (newUser) onStartGame(newUser.username, newUser.id);
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 relative overflow-hidden">
      {/* Optimized background with progressive loading */}
      {bgUrl && (
        <div 
          className={`absolute inset-0 transition-opacity duration-1000 ${
            bgLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          style={{
            backgroundImage: `url(${bgUrl})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            willChange: 'opacity'
          }}
        />
      )}
      
      <div className="absolute inset-0 bg-black/40" />
      
      <Card className="w-full max-w-md mx-4 relative z-10 bg-card/95 backdrop-blur">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
            Wizard Wander
          </CardTitle>
          <p className="text-muted-foreground mt-2">
            Enter the magical realm of Wizard Commons
          </p>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Input
              type="text"
              placeholder="Name your wizard"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handlePlayNow()}
              disabled={isLoading}
              className="text-center text-lg placeholder:text-gray-600"
              maxLength={20}
            />
            <p className="text-xs text-muted-foreground text-center">
              Choose wisely, this will be your identity in the realm
            </p>
          </div>
          
          <Button
            onClick={handlePlayNow}
            disabled={isLoading || !username.trim()}
            className="w-full text-lg py-6"
            size="lg"
          >
            {isLoading ? 'Creating Wizard...' : 'Play Now'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default HomeWithSupabase;