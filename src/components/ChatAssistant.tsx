"use client";

import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Minimize2, Sparkles, Volume2, VolumeX, RotateCcw } from 'lucide-react';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
}

const ChatAssistant: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [primaryColor, setPrimaryColor] = useState('#1d4ed8');
  const [welcomeMessage, setWelcomeMessage] = useState("Hi! I'm your WNC Times assistant. Ask me about local news, find articles, or get help navigating the site.");

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Load UI settings (theme, welcome message)
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const settingsDoc = await getDoc(doc(db, 'settings', 'config'));
        if (settingsDoc.exists()) {
          const data = settingsDoc.data();
          if (data.primaryColor) setPrimaryColor(data.primaryColor);
          if (data.chatWelcomeMessage) setWelcomeMessage(data.chatWelcomeMessage);
        }
      } catch (error) {
        console.error('[ChatAssistant] Failed to load settings:', error);
        const savedSettings = localStorage.getItem('wnc_settings');
        if (savedSettings) {
          try {
            const parsed = JSON.parse(savedSettings);
            if (parsed.primaryColor) setPrimaryColor(parsed.primaryColor);
            if (parsed.chatWelcomeMessage) setWelcomeMessage(parsed.chatWelcomeMessage);
          } catch (e) {
            console.error("Error parsing localStorage settings", e);
          }
        }
      }
    };

    loadSettings();

    const savedVoiceEnabled = localStorage.getItem('wnc_voice_enabled') === 'true';
    setIsVoiceEnabled(savedVoiceEnabled);

    return () => {
      stopSpeaking();
    };
  }, []);

  // Set initial welcome message when it's loaded
  useEffect(() => {
    if (welcomeMessage && messages.length === 0) {
      setMessages([{ id: 'init', role: 'model', text: welcomeMessage }]);
    }
  }, [welcomeMessage, messages.length]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen, isSpeaking]);

  const toggleVoice = () => {
    const newState = !isVoiceEnabled;
    setIsVoiceEnabled(newState);
    localStorage.setItem('wnc_voice_enabled', String(newState));
    if (!newState) {
      stopSpeaking();
    }
  };

  const stopSpeaking = () => {
    // Stop HTML5 audio (Google Cloud TTS)
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    // Stop browser TTS
    if (typeof window !== 'undefined' && window.speechSynthesis?.speaking) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  };

  // Speak using Google Cloud TTS with fallback to browser TTS
  const speakText = async (text: string) => {
    if (!isVoiceEnabled || typeof window === 'undefined') return;

    stopSpeaking();
    setIsSpeaking(true);

    try {
      // Try Google Cloud TTS first
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });

      const data = await response.json();

      if (response.ok && data.audioContent) {
        // Play the Google Cloud TTS audio
        const audio = new Audio(`data:audio/mp3;base64,${data.audioContent}`);
        audioRef.current = audio;

        audio.onended = () => {
          setIsSpeaking(false);
          audioRef.current = null;
        };
        audio.onerror = () => {
          console.error('Audio playback error, falling back to browser TTS');
          setIsSpeaking(false);
          audioRef.current = null;
          speakWithBrowserTTS(text);
        };

        await audio.play();
        return;
      }

      // If Google TTS failed or returned fallback flag, use browser TTS
      if (data.fallback) {
        console.log('Google TTS not available, using browser TTS');
      }
      speakWithBrowserTTS(text);

    } catch (error) {
      console.error('TTS Error:', error);
      // Fallback to browser TTS
      speakWithBrowserTTS(text);
    }
  };

  // Browser TTS fallback
  const speakWithBrowserTTS = (text: string) => {
    if (typeof window === 'undefined') return;

    try {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;

      const voices = window.speechSynthesis.getVoices();
      // Prefer American English voices (en-US)
      const preferredVoice =
        voices.find(v => v.lang === 'en-US' && v.name.toLowerCase().includes('samantha')) ||
        voices.find(v => v.lang === 'en-US' && v.name.toLowerCase().includes('jenny')) ||
        voices.find(v => v.lang === 'en-US' && v.name.toLowerCase().includes('aria')) ||
        voices.find(v => v.lang === 'en-US' && !v.name.toLowerCase().includes('zira')) ||
        voices.find(v => v.lang === 'en-US') ||
        voices.find(v => v.lang.startsWith('en-US'));

      if (preferredVoice) {
        utterance.voice = preferredVoice;
      } else {
        utterance.lang = 'en-US';
      }

      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      window.speechSynthesis.speak(utterance);
    } catch (error) {
      console.error('Browser TTS Error:', error);
      setIsSpeaking(false);
    }
  };

  const resetChat = () => {
    stopSpeaking();
    setMessages([{ id: 'init', role: 'model', text: welcomeMessage }]);
  };

  // Handle input change - stop speaking when user starts typing (interruption)
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    // If user starts typing while assistant is speaking, interrupt
    if (isSpeaking && newValue.length > input.length) {
      stopSpeaking();
    }
    setInput(newValue);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    stopSpeaking();

    const userMsg: Message = { id: Date.now().toString(), role: 'user', text: input };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput('');
    setIsLoading(true);

    try {
      const conversationHistory = updatedMessages
        .filter(m => m.id !== 'init')
        .map(m => ({ role: m.role, text: m.text }));

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: input,
          history: conversationHistory.slice(0, -1),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Chat service unavailable');
      }

      const responseText = data.response;

      if (!responseText) {
        throw new Error('No response received from AI. Please try again.');
      }

      const botMsg: Message = { id: (Date.now() + 1).toString(), role: 'model', text: responseText };
      setMessages(prev => [...prev, botMsg]);

      if (isVoiceEnabled) {
        speakText(responseText);
      }

    } catch (err) {
      console.error('[ChatAssistant] Error:', err);
      const errorMsg = err instanceof Error ? err.message : 'An error occurred';
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', text: errorMsg }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans flex flex-col items-end">
      {isOpen && (
        <div className="bg-white rounded-lg shadow-2xl w-80 sm:w-96 mb-4 flex flex-col border border-gray-200 overflow-hidden transition-all duration-300 origin-bottom-right relative" style={{height: '500px', maxHeight: '80vh'}}>

          <div
            className="text-white p-3 flex justify-between items-center shrink-0 shadow-sm relative z-20"
            style={{ backgroundColor: primaryColor }}
          >
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-white/80" />
              <div className="flex flex-col">
                <h3 className="font-bold text-sm tracking-wide leading-none">WNC Assistant</h3>
                <span className="text-[10px] opacity-80 font-normal">Reader Support</span>
              </div>
              {isSpeaking && (
                <div className="flex space-x-0.5 items-center h-3 ml-2">
                  <div className="w-0.5 bg-white h-full animate-pulse"></div>
                  <div className="w-0.5 bg-white h-2/3 animate-pulse delay-75"></div>
                  <div className="w-0.5 bg-white h-full animate-pulse delay-150"></div>
                </div>
              )}
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={resetChat}
                className="hover:bg-white/20 p-1.5 rounded transition text-white/70 hover:text-white"
                title="Reset conversation"
              >
                <RotateCcw size={14} />
              </button>
              <button
                onClick={toggleVoice}
                className={`hover:bg-white/20 p-1.5 rounded transition ${isVoiceEnabled ? 'text-white' : 'text-white/50'}`}
                title={isVoiceEnabled ? "Mute Voice" : "Enable Voice"}
              >
                {isVoiceEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="hover:bg-white/20 p-1.5 rounded transition text-white/90 hover:text-white"
                aria-label="Minimize chat"
              >
                <Minimize2 size={16} />
              </button>
            </div>
          </div>

          <div className="grow overflow-y-auto p-4 bg-gray-50 space-y-4">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
                    msg.role === 'user'
                      ? 'text-white rounded-br-sm'
                      : 'bg-white border border-gray-200 text-gray-800 rounded-bl-sm'
                  }`}
                  style={msg.role === 'user' ? { backgroundColor: primaryColor } : {}}
                >
                  <div className="whitespace-pre-wrap">{msg.text}</div>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-sm px-4 py-4 shadow-sm">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSubmit} className="p-3 bg-white border-t border-gray-100 shrink-0 flex gap-2">
            <input
              type="text"
              value={input}
              onChange={handleInputChange}
              placeholder={isVoiceEnabled ? "Ask and I will speak..." : "How can I help you today?"}
              className="grow border border-gray-300 rounded-full px-4 py-2.5 text-sm focus:outline-none focus:ring-1 transition-all bg-gray-50 focus:bg-white"
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="text-white p-2.5 rounded-full hover:brightness-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm shrink-0"
              style={{ backgroundColor: primaryColor }}
              aria-label="Send message"
            >
              <Send size={18} />
            </button>
          </form>
        </div>
      )}

      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`h-14 w-14 rounded-full shadow-xl flex items-center justify-center transition-all duration-300 transform hover:scale-105 active:scale-95 ${
          isOpen ? 'bg-gray-700 text-white rotate-90' : 'text-white'
        }`}
        style={!isOpen ? { backgroundColor: primaryColor } : {}}
        aria-label={isOpen ? "Close assistant" : "Open assistant"}
      >
        {isOpen ? <X size={24} /> : <MessageCircle size={28} />}
      </button>
    </div>
  );
};

export default ChatAssistant;
