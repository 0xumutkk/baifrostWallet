import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageCircle, 
  X, 
  Mic, 
  MicOff, 
  Send, 
  Loader2,
  Volume2,
  VolumeX,
  Wifi,
  WifiOff
} from 'lucide-react';
import { useAgent } from '../contexts/AgentContext';

export const AgentChatWidget: React.FC = () => {
  const {
    status,
    isSpeaking,
    messages,
    startSession,
    endSession,
    sendUserMessage,
    micMuted,
    setMicMuted,
  } = useAgent();

  const [isOpen, setIsOpen] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Initialize with safe defaults
  const getInitialPosition = () => {
    if (typeof window !== 'undefined') {
      return { 
        x: window.innerWidth - 100, 
        y: window.innerHeight - 100 
      };
    }
    return { x: 100, y: 100 };
  };
  
  const getInitialWindowSize = () => {
    if (typeof window !== 'undefined') {
      return { 
        width: window.innerWidth, 
        height: window.innerHeight 
      };
    }
    return { width: 1920, height: 1080 };
  };
  
  const [position, setPosition] = useState(getInitialPosition);
  const [windowSize, setWindowSize] = useState(getInitialWindowSize);
  const [isMounted, setIsMounted] = useState(false);

  // Initialize position and window size on mount
  useEffect(() => {
    setIsMounted(true);
    const initPosition = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const initialX = Math.max(20, width - 100);
      const initialY = Math.max(20, height - 100);
      console.log('🎈 [AgentChatWidget] Initializing position:', { width, height, initialX, initialY });
      setWindowSize({ width, height });
      setPosition({ x: initialX, y: initialY });
    };
    initPosition();
  }, []);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when widget opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleToggle = () => {
    if (isOpen) {
      setIsOpen(false);
    } else {
      setIsOpen(true);
      // Auto-start session if not connected
      if (status === 'disconnected') {
        startSession();
      }
    }
  };

  const handleSendMessage = () => {
    if (inputMessage.trim() && sendUserMessage) {
      sendUserMessage(inputMessage.trim());
      setInputMessage('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'connected':
        return 'bg-baifrost-teal';
      case 'connecting':
        return 'bg-yellow-500';
      case 'disconnected':
        return 'bg-gray-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'connected':
        return <Wifi className="w-4 h-4" />;
      case 'connecting':
        return <Loader2 className="w-4 h-4 animate-spin" />;
      case 'disconnected':
        return <WifiOff className="w-4 h-4" />;
      default:
        return <WifiOff className="w-4 h-4" />;
    }
  };

  // Update position on window resize
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      setWindowSize({ width, height });
      setPosition(prev => ({
        x: Math.min(prev.x, width - 80),
        y: Math.min(prev.y, height - 80)
      }));
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Debug log
  useEffect(() => {
    console.log('🎈 [AgentChatWidget] Render state:', {
      isMounted,
      windowSize,
      position,
      status,
      isOpen
    });
  }, [isMounted, windowSize, position, status, isOpen]);

  // Don't render until mounted to avoid SSR issues
  if (!isMounted) {
    return null;
  }

  return (
    <>
      {/* Siri-style Draggable Floating Sphere */}
      <motion.div
        drag
        dragMomentum={false}
        dragElastic={0.1}
        dragConstraints={{
          left: 0,
          right: Math.max(0, windowSize.width - 80),
          top: 0,
          bottom: Math.max(0, windowSize.height - 80),
        }}
        onDragEnd={(event, info) => {
          setPosition({
            x: Math.max(0, Math.min(info.point.x, windowSize.width - 80)),
            y: Math.max(0, Math.min(info.point.y, windowSize.height - 80))
          });
        }}
        initial={{ scale: 0, rotate: -180, opacity: 0 }}
        animate={{ 
          scale: 1, 
          rotate: 0,
          opacity: 1,
        }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleToggle}
        className="fixed w-20 h-20 rounded-full shadow-2xl flex items-center justify-center z-[9999] cursor-grab active:cursor-grabbing relative overflow-visible pointer-events-auto"
        style={{
          left: `${Math.max(0, position.x)}px`,
          top: `${Math.max(0, position.y)}px`,
          willChange: 'transform',
          position: 'fixed',
        }}
      >
        {/* Animated gradient sphere - Siri style */}
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{
            backgroundImage: status === 'connected'
              ? 'linear-gradient(135deg, #60E8D8 0%, #FFA500 50%, #60E8D8 100%)'
              : 'linear-gradient(135deg, #9CA3AF 0%, #6B7280 50%, #9CA3AF 100%)',
            backgroundSize: '200% 200%',
            backgroundColor: status === 'connected' ? '#60E8D8' : '#9CA3AF', // Fallback
          }}
          animate={status === 'connected' ? {
            backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
          } : {}}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "linear"
          }}
        />

        {/* Pulsing glow rings */}
        {status === 'connected' && !isOpen && (
          <>
            <motion.div
              className="absolute inset-0 rounded-full border-2 border-baifrost-teal/60"
              animate={{
                scale: [1, 1.4, 1],
                opacity: [0.8, 0, 0.8],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeOut"
              }}
            />
            <motion.div
              className="absolute inset-0 rounded-full border-2 border-baifrost-orange/60"
              animate={{
                scale: [1, 1.6, 1],
                opacity: [0.6, 0, 0.6],
              }}
              transition={{
                duration: 2.5,
                repeat: Infinity,
                ease: "easeOut",
                delay: 0.3
              }}
            />
          </>
        )}

        {/* Inner glow effect */}
        <motion.div
          className="absolute inset-2 rounded-full bg-white/20 backdrop-blur-sm"
          animate={isSpeaking && !isOpen ? {
            scale: [1, 1.1, 1],
            opacity: [0.3, 0.6, 0.3],
          } : {
            opacity: 0.2
          }}
          transition={{
            duration: 1,
            repeat: isSpeaking && !isOpen ? Infinity : 0,
            ease: "easeInOut"
          }}
        />

        {/* Icon with 3D effect */}
        <motion.div
          className="relative z-10 drop-shadow-lg"
          animate={isSpeaking && !isOpen ? {
            scale: [1, 1.15, 1],
          } : {}}
          transition={{
            duration: 0.6,
            repeat: isSpeaking && !isOpen ? Infinity : 0,
            ease: "easeInOut"
          }}
        >
          {isOpen ? (
            <X className="w-8 h-8 text-white" strokeWidth={2.5} />
          ) : (
            <MessageCircle className="w-8 h-8 text-white" strokeWidth={2.5} />
          )}
        </motion.div>

        {/* Status indicator dot */}
        <motion.div
          className={`absolute -top-0.5 -right-0.5 w-5 h-5 ${getStatusColor()} rounded-full flex items-center justify-center shadow-xl z-20 border-2 border-white`}
          animate={status === 'connected' ? {
            scale: [1, 1.3, 1],
            boxShadow: [
              '0 0 0 0 rgba(96, 232, 216, 0.7)',
              '0 0 0 8px rgba(96, 232, 216, 0)',
              '0 0 0 0 rgba(96, 232, 216, 0)',
            ],
          } : {}}
          transition={{
            duration: 2,
            repeat: status === 'connected' ? Infinity : 0,
            ease: "easeOut"
          }}
        >
          {getStatusIcon()}
        </motion.div>

        {/* Notification badge */}
        {messages.length > 0 && !isOpen && (
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            className="absolute -top-1 -left-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-xl border-2 border-white z-30"
          >
            {messages.length > 9 ? '9+' : messages.length}
          </motion.div>
        )}

        {/* Drag hint - subtle glow when dragging */}
        <motion.div
          className="absolute inset-0 rounded-full pointer-events-none"
          animate={{
            boxShadow: [
              status === 'connected' 
                ? '0 0 20px rgba(96, 232, 216, 0.4), 0 0 40px rgba(255, 165, 0, 0.2), inset 0 0 20px rgba(255, 255, 255, 0.1)'
                : '0 0 15px rgba(0, 0, 0, 0.3), inset 0 0 15px rgba(255, 255, 255, 0.05)',
              status === 'connected'
                ? '0 0 30px rgba(96, 232, 216, 0.6), 0 0 60px rgba(255, 165, 0, 0.3), inset 0 0 25px rgba(255, 255, 255, 0.15)'
                : '0 0 20px rgba(0, 0, 0, 0.4), inset 0 0 20px rgba(255, 255, 255, 0.08)',
              status === 'connected'
                ? '0 0 20px rgba(96, 232, 216, 0.4), 0 0 40px rgba(255, 165, 0, 0.2), inset 0 0 20px rgba(255, 255, 255, 0.1)'
                : '0 0 15px rgba(0, 0, 0, 0.3), inset 0 0 15px rgba(255, 255, 255, 0.05)',
            ],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </motion.div>

      {/* Enhanced Chat Widget - Speech Bubble Style */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 30 }}
            transition={{ 
              type: "spring", 
              damping: 20, 
              stiffness: 300,
              mass: 0.5
            }}
            className="fixed w-[420px] h-[650px] bg-gradient-to-br from-gray-800 via-gray-800 to-gray-900 rounded-3xl shadow-2xl border-2 border-baifrost-teal/40 z-50 flex flex-col overflow-hidden backdrop-blur-xl"
            style={{
              bottom: windowSize.height > 0 
                ? `${Math.max(20, windowSize.height - position.y - 80)}px`
                : '20px',
              right: windowSize.width > 0
                ? (position.x + 100 > windowSize.width - 420 
                    ? `${Math.max(20, windowSize.width - position.x - 420)}px`
                    : `${Math.max(20, windowSize.width - position.x - 100)}px`)
                : '20px',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5), 0 0 40px rgba(96, 232, 216, 0.2)'
            }}
          >
            {/* Enhanced Header */}
            <div className="bg-gradient-baifrost p-5 flex items-center justify-between relative overflow-hidden">
              {/* Animated background pattern */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute inset-0" style={{
                  backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
                  backgroundSize: '20px 20px'
                }} />
              </div>
              
              <div className="flex items-center gap-4 relative z-10">
                <motion.div
                  className="w-12 h-12 bg-white/25 rounded-2xl flex items-center justify-center backdrop-blur-md border border-white/30 shadow-lg"
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={{ type: "spring", stiffness: 400 }}
                >
                  <MessageCircle className="w-6 h-6 text-white" />
                </motion.div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-white font-bold text-lg tracking-tight">heima</h3>
                    {status === 'connected' && (
                      <motion.div
                        className="w-2 h-2 bg-baifrost-teal rounded-full"
                        animate={{ opacity: [1, 0.5, 1] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      />
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <p className="text-white/90 text-xs font-medium">
                      {status === 'connected' ? 'AI Assistant Ready' : status === 'connecting' ? 'Connecting...' : 'Disconnected'}
                    </p>
                    {isSpeaking && (
                      <motion.div
                        className="flex items-center gap-1 text-baifrost-teal text-xs"
                        animate={{ opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 1, repeat: Infinity }}
                      >
                        <Volume2 className="w-3 h-3" />
                        <span>Speaking</span>
                      </motion.div>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 relative z-10">
                {/* Enhanced Microphone toggle */}
                <motion.button
                  onClick={() => setMicMuted(!micMuted)}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className={`p-2.5 rounded-xl transition-all ${
                    micMuted 
                      ? 'bg-red-500/30 hover:bg-red-500/40 border border-red-500/50' 
                      : 'bg-white/20 hover:bg-white/30 border border-white/30'
                  } backdrop-blur-sm shadow-lg`}
                  title={micMuted ? 'Unmute microphone' : 'Mute microphone'}
                >
                  {micMuted ? (
                    <MicOff className="w-5 h-5 text-white" />
                  ) : (
                    <Mic className="w-5 h-5 text-white" />
                  )}
                </motion.button>
                {/* Enhanced Disconnect button */}
                {status === 'connected' && (
                  <motion.button
                    onClick={endSession}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="p-2.5 bg-white/20 hover:bg-white/30 rounded-xl transition-all backdrop-blur-sm border border-white/30 shadow-lg"
                    title="Disconnect"
                  >
                    <X className="w-5 h-5 text-white" />
                  </motion.button>
                )}
              </div>
            </div>

            {/* Enhanced Messages Area */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-gradient-to-b from-gray-900/80 to-gray-800/80 backdrop-blur-sm">
              {/* Custom scrollbar */}
              <style>{`
                .chat-scrollbar::-webkit-scrollbar {
                  width: 6px;
                }
                .chat-scrollbar::-webkit-scrollbar-track {
                  background: rgba(0, 0, 0, 0.1);
                  border-radius: 10px;
                }
                .chat-scrollbar::-webkit-scrollbar-thumb {
                  background: linear-gradient(180deg, #60E8D8, #FFA500);
                  border-radius: 10px;
                }
                .chat-scrollbar::-webkit-scrollbar-thumb:hover {
                  background: linear-gradient(180deg, #7FFFD4, #FFB347);
                }
              `}</style>
              <div className="chat-scrollbar h-full">
              {messages.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col items-center justify-center h-full text-center px-6"
                >
                  <motion.div
                    animate={{ 
                      scale: [1, 1.1, 1],
                      rotate: [0, 5, -5, 0]
                    }}
                    transition={{ 
                      duration: 3,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  >
                    <div className="w-20 h-20 bg-gradient-baifrost rounded-3xl flex items-center justify-center mb-6 shadow-2xl">
                      <MessageCircle className="w-10 h-10 text-white" />
                    </div>
                  </motion.div>
                  <h4 className="text-white font-bold text-lg mb-2">Welcome to heima</h4>
                  <p className="text-gray-400 text-sm mb-6 leading-relaxed">
                    {status === 'disconnected' 
                      ? 'Your AI-powered crypto assistant is ready to help. Start a conversation to get started!'
                      : status === 'connecting'
                      ? 'Connecting to heima...'
                      : 'Ask me anything about your wallet, transactions, or crypto!'}
                  </p>
                  {status === 'disconnected' && (
                    <motion.button
                      onClick={startSession}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="px-6 py-3 bg-gradient-baifrost rounded-xl text-white font-semibold hover:opacity-90 transition-opacity shadow-lg"
                    >
                      Start Conversation
                    </motion.button>
                  )}
                </motion.div>
              ) : (
                messages.map((message, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ 
                      delay: index * 0.03,
                      type: "spring",
                      stiffness: 500,
                      damping: 30
                    }}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} items-end gap-3 mb-3`}
                  >
                    {/* Agent Avatar */}
                    {message.role === 'agent' && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="w-10 h-10 bg-gradient-baifrost rounded-full flex items-center justify-center flex-shrink-0 shadow-lg border-2 border-white/20"
                      >
                        <MessageCircle className="w-5 h-5 text-white" />
                      </motion.div>
                    )}
                    
                    {/* Message Bubble */}
                    <motion.div
                      whileHover={{ scale: 1.01 }}
                      className={`relative max-w-[78%] ${
                        message.role === 'user'
                          ? 'bg-gradient-baifrost text-white'
                          : message.role === 'agent'
                          ? 'bg-gray-700/95 text-white backdrop-blur-sm border border-gray-600/30'
                          : 'bg-yellow-500/20 text-yellow-400 border-2 border-yellow-500/40'
                      } rounded-3xl px-5 py-3 shadow-xl ${
                        message.role === 'user' 
                          ? 'rounded-br-md' 
                          : 'rounded-bl-md'
                      }`}
                      style={{
                        filter: message.role === 'user' ? 'drop-shadow(0 4px 12px rgba(96, 232, 216, 0.3))' : 'drop-shadow(0 4px 12px rgba(0, 0, 0, 0.2))'
                      }}
                    >
                      {/* Message Content */}
                      <div className="text-sm whitespace-pre-wrap break-words leading-relaxed font-medium">
                        {message.content.split(/(https?:\/\/[^\s]+)/g).map((part, i) => {
                          if (part.match(/^https?:\/\//)) {
                            return (
                              <a
                                key={i}
                                href={part}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`${
                                  message.role === 'user' 
                                    ? 'text-white underline decoration-white/50' 
                                    : 'text-baifrost-teal hover:text-baifrost-teal-light underline'
                                } break-all font-semibold`}
                              >
                                {part}
                              </a>
                            );
                          }
                          return <span key={i}>{part}</span>;
                        })}
                      </div>
                      
                      {/* Timestamp */}
                      <div className={`flex items-center justify-end mt-2 ${
                        message.role === 'user' ? 'text-white/70' : 'text-gray-400'
                      }`}>
                        <span className="text-xs font-medium">
                          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </motion.div>
                    
                    {/* User Avatar */}
                    {message.role === 'user' && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="w-10 h-10 bg-baifrost-orange/30 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg border-2 border-baifrost-orange/40 backdrop-blur-sm"
                      >
                        <span className="text-baifrost-orange text-sm font-bold">U</span>
                      </motion.div>
                    )}
                  </motion.div>
                ))
              )}
              <div ref={messagesEndRef} />
              
              {/* Enhanced Speaking indicator */}
              {isSpeaking && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-3 text-baifrost-teal text-sm bg-baifrost-teal/10 px-4 py-2 rounded-xl border border-baifrost-teal/30 backdrop-blur-sm"
                >
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  >
                    <Volume2 className="w-5 h-5" />
                  </motion.div>
                  <span className="font-medium">heima is speaking...</span>
                </motion.div>
              )}
              </div>
            </div>

            {/* Enhanced Input Area */}
            <div className="p-5 border-t border-gray-700/50 bg-gradient-to-b from-gray-800 to-gray-900 backdrop-blur-sm">
              {status === 'connected' ? (
                <div className="flex gap-3">
                  <div className="flex-1 relative">
                    <input
                      ref={inputRef}
                      type="text"
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Ask heima anything..."
                      className="w-full px-5 py-3 bg-gray-700/80 border-2 border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-baifrost-teal focus:bg-gray-700 transition-all shadow-lg backdrop-blur-sm"
                    />
                    {!micMuted && (
                      <motion.div
                        className="absolute right-3 top-1/2 -translate-y-1/2"
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        <Mic className="w-4 h-4 text-baifrost-teal opacity-50" />
                      </motion.div>
                    )}
                  </div>
                  <motion.button
                    onClick={handleSendMessage}
                    disabled={!inputMessage.trim()}
                    whileHover={{ scale: inputMessage.trim() ? 1.05 : 1 }}
                    whileTap={{ scale: inputMessage.trim() ? 0.95 : 1 }}
                    className="px-5 py-3 bg-gradient-baifrost rounded-xl text-white font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg min-w-[60px]"
                  >
                    <Send className="w-5 h-5" />
                  </motion.button>
                </div>
              ) : (
                <motion.button
                  onClick={startSession}
                  disabled={status === 'connecting'}
                  whileHover={{ scale: status !== 'connecting' ? 1.02 : 1 }}
                  whileTap={{ scale: status !== 'connecting' ? 0.98 : 1 }}
                  className="w-full px-5 py-3 bg-gradient-baifrost rounded-xl text-white font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-lg"
                >
                  {status === 'connecting' ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Connecting...</span>
                    </>
                  ) : (
                    <>
                      <MessageCircle className="w-5 h-5" />
                      <span>Start Conversation</span>
                    </>
                  )}
                </motion.button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

