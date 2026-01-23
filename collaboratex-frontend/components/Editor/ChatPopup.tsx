import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Send } from 'lucide-react';
import { useUser } from '@clerk/clerk-react';

interface ChatMessage {
  sender: string;
  content: string;
  isOwn?: boolean; 
}

interface ChatPopupProps {
  roomId: string;
  projectName: string;
  wsUrl?: string;
  isOpen: boolean;
  onToggle: () => void;
  onNewMessage?: () => void;
}

const ChatPopup: React.FC<ChatPopupProps> = ({ 
  roomId,
  projectName,
  wsUrl = 'ws://localhost:8080',
  isOpen,
  onToggle,
  onNewMessage
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  
  const wsRef = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const { user, isSignedIn } = useUser();
  const userName = isSignedIn && user 
    ? `${user.firstName} ${user.lastName}`.trim() 
    : 'Anonymous';

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const connectWebSocket = () => {
    try {
      const ws = new WebSocket(`${wsUrl}/ws/${roomId}`);
      
      ws.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
        
        const joinMsg = {
          sender: userName,
          content: `${userName} joined the chat`
        };
        ws.send(JSON.stringify(joinMsg));
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          const newMessage: ChatMessage = {
            sender: data.sender || 'Unknown',
            content: data.content || '',
          };
          
          setMessages(prev => [...prev, newMessage]);
          
          // Notify parent about new message
          if (!isOpen && onNewMessage) {
            onNewMessage();
          }
        } catch (err) {
          console.error('Failed to parse message:', err);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setIsConnected(false);
      };

      ws.onclose = () => {
        console.log('WebSocket disconnected');
        setIsConnected(false);
        
        reconnectTimeoutRef.current = setTimeout(() => {
          console.log('Attempting to reconnect...');
          connectWebSocket();
        }, 3000);
      };

      wsRef.current = ws;
    } catch (err) {
      console.error('Failed to connect WebSocket:', err);
      setIsConnected(false);
    }
  };

  useEffect(() => {
    connectWebSocket();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [roomId]);

  const sendMessage = () => {
    if (!inputMessage.trim() || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      return;
    }

    const message = {
      sender: userName,
      content: inputMessage.trim()
    };

    const optimisticMessage: ChatMessage = {
      sender: userName,
      content: inputMessage.trim(),
      isOwn: true
    };
		setMessages(prev => [...prev, optimisticMessage]);

    wsRef.current.send(JSON.stringify(message));
    setInputMessage('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      {isOpen && (
        <div className="fixed bottom-12 right-6 z-50 w-96 bg-white rounded-lg shadow-2xl flex flex-col border border-slate-200" style={{ height: '60vh' }}>
          <div className="bg-blue-600 text-white px-4 py-3 rounded-t-lg flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare size={20} />
              <div>
                <h3 className="font-semibold text-sm">Project Chat</h3>
                <p className="text-xs text-blue-100">{projectName}</p>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 bg-slate-50 space-y-3">
            {messages.length === 0 ? (
              <div className="text-center text-slate-400 mt-8">
                <MessageSquare size={48} className="mx-auto mb-2 opacity-50" />
                <p className="text-sm">No messages yet</p>
                <p className="text-xs mt-1">Start the conversation!</p>
              </div>
            ) : (
              messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.isOwn ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg px-3 py-2 ${
                      msg.isOwn
                        ? 'bg-blue-600 text-white'
                        : 'bg-white border border-slate-200 text-slate-800'
                    }`}
                  >
                    <div className={`text-xs font-semibold mb-1 ${
                      msg.isOwn ? 'text-blue-100' : 'text-blue-600'
                    }`}>
                      {msg.sender}
                    </div>
                    <div className="text-sm break-words whitespace-pre-wrap">
                      {msg.content}
                    </div>
                    <div className={`text-xs mt-1 ${
                      msg.isOwn ? 'text-blue-200' : 'text-slate-400'
                    }`}>
                    </div>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {!isConnected && (
            <div className="bg-amber-50 border-t border-amber-200 px-4 py-2 text-xs text-amber-800 flex items-center gap-2">
              <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
              Reconnecting...
            </div>
          )}

          <div className="border-t border-slate-200 p-3 bg-white rounded-b-lg">
            <div className="flex gap-2">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type a message..."
                disabled={!isConnected}
                className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-slate-100 disabled:cursor-not-allowed"
              />
              <button
                onClick={sendMessage}
                disabled={!inputMessage.trim() || !isConnected}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-slate-300 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Send size={16} />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatPopup;
