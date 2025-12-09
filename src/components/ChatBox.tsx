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
  const profileInitial = username?.charAt(0)?.toUpperCase() || '?';

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
        <div className="bg-card/90 backdrop-blur-sm border border-border rounded-lg shadow-lg p-3 w-[720px] max-w-[95vw]">
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

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-3 bg-muted/30 rounded-lg border border-border px-3 py-2 min-w-[180px]">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/70 to-purple-600/70 flex items-center justify-center text-lg font-bold text-foreground shadow-md">
                {profileInitial}
              </div>
              <div>
                <div className="text-sm font-semibold text-foreground leading-tight">{username}</div>
                <div className="text-xs text-muted-foreground leading-tight">School: {schoolName}</div>
              </div>
            </div>

            <div className="flex-1 flex gap-2">
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
