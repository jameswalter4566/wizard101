import React, { useState, useRef, useEffect } from 'react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Send } from 'lucide-react';

interface ChatBoxProps {
  onSendMessage: (message: string) => void;
  isConnected: boolean;
}

const ChatBox: React.FC<ChatBoxProps> = ({ onSendMessage, isConnected }) => {
  const [message, setMessage] = useState('');
  const [isMinimized, setIsMinimized] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  

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
    <div className="absolute bottom-4 left-4 z-50">
      {isMinimized ? (
        <Button
          onClick={() => setIsMinimized(false)}
          className="bg-card/90 backdrop-blur-sm text-foreground hover:bg-card"
          size="sm"
        >
          💬 Chat
        </Button>
      ) : (
        <div className="bg-card/90 backdrop-blur-sm border border-border rounded-lg shadow-lg p-3 w-80">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-foreground">Chat</h3>
            <Button
              onClick={() => setIsMinimized(true)}
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
            >
              —
            </Button>
          </div>
          
          <div className="flex gap-2">
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
              className="px-2"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          
          {!isConnected && (
            <p className="text-xs text-muted-foreground mt-1">
              Waiting for connection...
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default ChatBox;