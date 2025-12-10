import React, { useState, useRef, useEffect } from 'react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Send } from 'lucide-react';

interface ChatBoxProps {
  onSendMessage: (message: string) => void;
  isConnected: boolean;
  containerClassName?: string;
  username?: string;
  schoolName?: string;
}

const ChatBox: React.FC<ChatBoxProps> = ({ onSendMessage, isConnected, containerClassName = '', username = 'Wizard', schoolName = 'School TBD' }) => {
  const [message, setMessage] = useState('');
  const [isMinimized, setIsMinimized] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const profileImage = '/hud/avatar-placeholder.webp';

  const handleSend = () => {
    if (message.trim() && isConnected) {
      onSendMessage(message.trim());
      setMessage('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Focus input when chat is opened
  useEffect(() => {
    if (!isMinimized && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isMinimized]);

  return (
    <div className={`z-50 ${containerClassName}`}>
      {isMinimized ? (
        <Button
          onClick={() => setIsMinimized(false)}
          className="bg-card/90 backdrop-blur-sm text-foreground hover:bg-card"
          size="sm"
        >
          💬 Chat
        </Button>
      ) : (
        <div className="flex items-end gap-3">
          <div className="bg-card/90 backdrop-blur-sm border border-border rounded-lg shadow-lg px-3 py-2 min-w-[180px] text-white">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full overflow-hidden border border-white/40 shadow-md bg-black/40">
                <img src={profileImage} alt={`${username} avatar`} className="w-full h-full object-cover" />
              </div>
              <div className="leading-tight">
                <div className="text-sm font-semibold text-white">{username}</div>
                <div className="text-xs text-white/80">School: {schoolName}</div>
              </div>
            </div>
          </div>

          <div className="bg-card/90 backdrop-blur-sm border border-border rounded-lg shadow-lg p-2 w-[620px] max-w-[85vw]">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-sm font-semibold text-white">Chat</h3>
              <Button
                onClick={() => setIsMinimized(true)}
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
              >
                —
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <Input
                ref={inputRef}
                type="text"
                placeholder={isConnected ? "Type a message..." : "Connecting..."}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={!isConnected}
                className="flex-1 text-sm"
                maxLength={100}
              />
              <Button
                onClick={handleSend}
                disabled={!isConnected || !message.trim()}
                size="sm"
                className="px-3"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
            
            {!isConnected && (
              <p className="text-xs text-white/80 mt-1">
                Waiting for connection...
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatBox;
