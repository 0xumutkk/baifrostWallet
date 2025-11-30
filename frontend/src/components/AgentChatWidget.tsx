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

  return (
    <>
      {/* Floating Button */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={handleToggle}
        className={`fixed bottom-6 right-6 w-16 h-16 rounded-full ${getStatusColor()} shadow-2xl flex items-center justify-center z-40 transition-all`}
      >
        {isOpen ? (
          <X className="w-6 h-6 text-white" />
        ) : (
          <MessageCircle className="w-6 h-6 text-white" />
        )}
        {/* Status indicator */}
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-white rounded-full flex items-center justify-center">
          {getStatusIcon()}
        </div>
      </motion.button>

      {/* Chat Widget */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-24 right-6 w-96 h-[600px] bg-gray-800 rounded-2xl shadow-2xl border border-baifrost-teal/30 z-50 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-baifrost p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                  <MessageCircle className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-white font-bold">heima</h3>
                  <p className="text-white/80 text-xs">
                    {status === 'connected' ? 'Connected' : status === 'connecting' ? 'Connecting...' : 'Disconnected'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {/* Microphone toggle */}
                <button
                  onClick={() => setMicMuted(!micMuted)}
                  className={`p-2 rounded-lg transition-colors ${
                    micMuted ? 'bg-red-500/20 hover:bg-red-500/30' : 'bg-white/20 hover:bg-white/30'
                  }`}
                  title={micMuted ? 'Unmute microphone' : 'Mute microphone'}
                >
                  {micMuted ? (
                    <MicOff className="w-4 h-4 text-white" />
                  ) : (
                    <Mic className="w-4 h-4 text-white" />
                  )}
                </button>
                {/* Disconnect button */}
                {status === 'connected' && (
                  <button
                    onClick={endSession}
                    className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
                    title="Disconnect"
                  >
                    <X className="w-4 h-4 text-white" />
                  </button>
                )}
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-900/50">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <MessageCircle className="w-12 h-12 text-gray-600 mb-4" />
                  <p className="text-gray-400 text-sm">
                    {status === 'disconnected' 
                      ? 'Click to start a conversation with heima'
                      : status === 'connecting'
                      ? 'Connecting to heima...'
                      : 'Start chatting with heima'}
                  </p>
                  {status === 'disconnected' && (
                    <button
                      onClick={startSession}
                      className="mt-4 px-4 py-2 bg-gradient-baifrost rounded-lg text-white font-semibold hover:opacity-90 transition-opacity"
                    >
                      Connect
                    </button>
                  )}
                </div>
              ) : (
                messages.map((message, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg px-4 py-2 ${
                        message.role === 'user'
                          ? 'bg-gradient-baifrost text-white'
                          : message.role === 'agent'
                          ? 'bg-gray-700 text-white'
                          : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                      }`}
                    >
                      <div className="text-sm whitespace-pre-wrap break-words">
                        {message.content.split(/(https?:\/\/[^\s]+)/g).map((part, i) => {
                          if (part.match(/^https?:\/\//)) {
                            return (
                              <a
                                key={i}
                                href={part}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-baifrost-teal hover:text-baifrost-teal-light underline break-all"
                              >
                                {part}
                              </a>
                            );
                          }
                          return <span key={i}>{part}</span>;
                        })}
                      </div>
                      <p className="text-xs opacity-70 mt-1">
                        {message.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                  </motion.div>
                ))
              )}
              <div ref={messagesEndRef} />
              
              {/* Speaking indicator */}
              {isSpeaking && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center gap-2 text-baifrost-teal text-sm"
                >
                  <Volume2 className="w-4 h-4 animate-pulse" />
                  <span>heima is speaking...</span>
                </motion.div>
              )}
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-gray-700 bg-gray-800">
              {status === 'connected' ? (
                <div className="flex gap-2">
                  <input
                    ref={inputRef}
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type a message or speak..."
                    className="flex-1 px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-baifrost-teal transition-colors"
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!inputMessage.trim()}
                    className="px-4 py-2 bg-gradient-baifrost rounded-lg text-white font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={startSession}
                  disabled={status === 'connecting'}
                  className="w-full px-4 py-2 bg-gradient-baifrost rounded-lg text-white font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {status === 'connecting' ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    'Start Conversation'
                  )}
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

