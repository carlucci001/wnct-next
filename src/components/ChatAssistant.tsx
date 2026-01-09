"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { MessageCircle, X, Send, Minimize2, Sparkles, Volume2, VolumeX, RotateCcw, Mic, MicOff, Radio } from 'lucide-react';
import { getDb } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useTheme } from '@/contexts/ThemeContext';
import { Persona } from '@/types/persona';
import { getChatAvailablePersonas } from '@/lib/personas';
import PersonaSelector from '@/components/chat/PersonaSelector';

interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
}

// Web Speech API types
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: Event & { error: string }) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

// Strip markdown formatting (bold **text**, italic *text*) from responses
const stripMarkdown = (text: string): string => {
  return text
    .replace(/\*\*([^*]+)\*\*/g, '$1')  // Remove **bold**
    .replace(/\*([^*]+)\*/g, '$1')       // Remove *italic*
    .replace(/__([^_]+)__/g, '$1')       // Remove __bold__
    .replace(/_([^_]+)_/g, '$1');        // Remove _italic_
};

const ChatAssistant: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [welcomeMessage, setWelcomeMessage] = useState("Hi! I'm your assistant. Ask me about local news, find articles, or get help navigating the site.");

  // Persona state
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [selectedPersonaId, setSelectedPersonaId] = useState<string | null>(null);
  const [currentPersona, setCurrentPersona] = useState<Persona | null>(null);

  // Voice input state
  const [isListening, setIsListening] = useState(false);
  const [isLiveMode, setIsLiveMode] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');

  // Get theme colors from context
  const { currentTheme, colorMode } = useTheme();
  const primaryColor = colorMode === 'dark' ? currentTheme.colors.navBarDark : currentTheme.colors.navBar;

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const shouldRestartListening = useRef(false);
  const pendingSubmitRef = useRef<string | null>(null);
  const startListeningRef = useRef<() => void>(() => {});
  const submitMessageRef = useRef<(text: string) => void>(() => {});

  // Audio session management to prevent overlapping audio
  const ttsAbortControllerRef = useRef<AbortController | null>(null);
  const audioSessionIdRef = useRef<number>(0);

  // Load UI settings (welcome message)
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const settingsDoc = await getDoc(doc(getDb(), 'settings', 'config'));
        if (settingsDoc.exists()) {
          const data = settingsDoc.data();
          if (data.chatWelcomeMessage) setWelcomeMessage(data.chatWelcomeMessage);
        }
      } catch (error) {
        console.error('[ChatAssistant] Failed to load settings:', error);
        const savedSettings = localStorage.getItem('wnc_settings');
        if (savedSettings) {
          try {
            const parsed = JSON.parse(savedSettings);
            if (parsed.chatWelcomeMessage) setWelcomeMessage(parsed.chatWelcomeMessage);
          } catch (e) {
            console.error("Error parsing localStorage settings", e);
          }
        }
      }
    };

    loadSettings();
    loadPersonas();

    const savedVoiceEnabled = localStorage.getItem('wnc_voice_enabled') === 'true';
    setIsVoiceEnabled(savedVoiceEnabled);

    const savedLiveMode = localStorage.getItem('wnc_live_mode') === 'true';
    setIsLiveMode(savedLiveMode);

    // Check if speech recognition is supported
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    setSpeechSupported(!!SpeechRecognitionAPI);

    return () => {
      stopSpeaking();
      stopListening();
    };
  }, []);

  // Load chat-available personas
  const loadPersonas = async () => {
    try {
      const availablePersonas = await getChatAvailablePersonas();
      setPersonas(availablePersonas);

      // Set default persona (first one or saved preference)
      const savedPersonaId = localStorage.getItem('wnc_chat_persona_id');
      if (availablePersonas.length > 0) {
        const defaultPersona = savedPersonaId
          ? availablePersonas.find(p => p.id === savedPersonaId) || availablePersonas[0]
          : availablePersonas[0];
        setSelectedPersonaId(defaultPersona.id);
        setCurrentPersona(defaultPersona);
      }
    } catch (error) {
      console.error('[ChatAssistant] Failed to load personas:', error);
    }
  };

  // Handle persona selection
  const handlePersonaSelect = (personaId: string) => {
    const persona = personas.find(p => p.id === personaId);
    if (persona) {
      setSelectedPersonaId(personaId);
      setCurrentPersona(persona);
      localStorage.setItem('wnc_chat_persona_id', personaId);

      // Update welcome message and reset chat with new greeting
      const greeting = persona.promptConfig.chatGreeting || `Hi! I'm ${persona.name}. How can I help you?`;
      setWelcomeMessage(greeting);
      setMessages([{ id: 'init', role: 'model', text: greeting }]);
    }
  };

  // Update welcome message when persona changes
  useEffect(() => {
    if (currentPersona && currentPersona.promptConfig.chatGreeting) {
      setWelcomeMessage(currentPersona.promptConfig.chatGreeting);
    }
  }, [currentPersona]);

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

  const toggleLiveMode = () => {
    const newState = !isLiveMode;
    setIsLiveMode(newState);
    localStorage.setItem('wnc_live_mode', String(newState));
    // When enabling live mode, also enable voice output
    if (newState && !isVoiceEnabled) {
      setIsVoiceEnabled(true);
      localStorage.setItem('wnc_voice_enabled', 'true');
    }
    // Stop listening when disabling live mode
    if (!newState && isListening) {
      stopListening();
    }
  };

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.abort();
      recognitionRef.current = null;
    }
    setIsListening(false);
    setInterimTranscript('');
    shouldRestartListening.current = false;
  }, []);

  const startListening = useCallback(() => {
    if (!speechSupported || isLoading) return;

    // Stop any current speech
    stopSpeaking();

    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) return;

    // Stop existing recognition if any
    if (recognitionRef.current) {
      recognitionRef.current.abort();
    }

    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
      setInterimTranscript('');
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interimText = '';
      let finalText = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalText += transcript;
        } else {
          interimText += transcript;
        }
      }

      if (interimText) {
        setInterimTranscript(interimText);
      }

      if (finalText) {
        setInterimTranscript('');
        // In live mode, auto-submit when we get final text
        if (isLiveMode) {
          setInput(''); // Clear input immediately
          // Store for pending submit (will be processed by useEffect)
          pendingSubmitRef.current = finalText;
        } else {
          setInput(prev => prev + finalText);
        }
      }
    };

    recognition.onerror = (event: Event & { error: string }) => {
      console.error('Speech recognition error:', event.error);
      if (event.error !== 'aborted') {
        setIsListening(false);
        setInterimTranscript('');
      }
    };

    recognition.onend = () => {
      setIsListening(false);
      setInterimTranscript('');

      // In live mode, if we should restart (after AI finishes speaking)
      if (shouldRestartListening.current && isLiveMode) {
        shouldRestartListening.current = false;
        setTimeout(() => startListening(), 500);
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [speechSupported, isLoading, isLiveMode]);

  // Keep ref updated with latest startListening function
  useEffect(() => {
    startListeningRef.current = startListening;
  }, [startListening]);

  // Effect to handle pending voice submissions
  useEffect(() => {
    if (pendingSubmitRef.current && !isLoading && !isListening) {
      const text = pendingSubmitRef.current;
      pendingSubmitRef.current = null;
      submitMessageRef.current(text);
    }
  }, [isLoading, isListening]);

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, stopListening, startListening]);

  const stopSpeaking = () => {
    // Increment session ID to invalidate any pending audio
    audioSessionIdRef.current += 1;

    // Abort any in-flight TTS requests
    if (ttsAbortControllerRef.current) {
      ttsAbortControllerRef.current.abort();
      ttsAbortControllerRef.current = null;
    }

    // Stop HTML5 audio (Google Cloud TTS)
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current.onended = null; // Remove event listener to prevent callbacks
      audioRef.current.onerror = null;
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

    // Stop any current speech and get a new session ID
    stopSpeaking();
    const currentSessionId = audioSessionIdRef.current;
    setIsSpeaking(true);

    // Create new abort controller for this request
    const abortController = new AbortController();
    ttsAbortControllerRef.current = abortController;

    try {
      // Try Google Cloud TTS first, passing persona voice config if available
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          voiceConfig: currentPersona?.voiceConfig,
        }),
        signal: abortController.signal,
      });

      // Check if we've been interrupted during the fetch
      if (audioSessionIdRef.current !== currentSessionId) {
        console.log('[TTS] Session interrupted during fetch, skipping playback');
        return;
      }

      const data = await response.json();

      if (response.ok && data.audioContent) {
        // Check again before playing
        if (audioSessionIdRef.current !== currentSessionId) {
          console.log('[TTS] Session interrupted before playback, skipping');
          setIsSpeaking(false);
          return;
        }

        // Play the Google Cloud TTS audio
        const audio = new Audio(`data:audio/mp3;base64,${data.audioContent}`);
        audioRef.current = audio;

        audio.onended = () => {
          // Only handle if this is still the current session
          if (audioSessionIdRef.current === currentSessionId) {
            setIsSpeaking(false);
            audioRef.current = null;
            // In live mode, restart listening after AI finishes speaking
            if (isLiveMode) {
              shouldRestartListening.current = true;
              setTimeout(() => startListeningRef.current(), 500);
            }
          }
        };
        audio.onerror = () => {
          // Only handle if this is still the current session
          if (audioSessionIdRef.current === currentSessionId) {
            console.error('Audio playback error, falling back to browser TTS');
            setIsSpeaking(false);
            audioRef.current = null;
            speakWithBrowserTTS(text, currentSessionId);
          }
        };

        await audio.play();
        return;
      }

      // If Google TTS failed or returned fallback flag, use browser TTS
      if (data.fallback) {
        console.log('Google TTS not available, using browser TTS');
      }
      speakWithBrowserTTS(text, currentSessionId);

    } catch (error: unknown) {
      // Don't log or fallback if we were aborted
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('[TTS] Request aborted');
        return;
      }
      console.error('TTS Error:', error);
      // Only fallback if still current session
      if (audioSessionIdRef.current === currentSessionId) {
        speakWithBrowserTTS(text, currentSessionId);
      }
    }
  };

  // Browser TTS fallback
  const speakWithBrowserTTS = (text: string, sessionId?: number) => {
    if (typeof window === 'undefined') return;

    // Use current session if not provided
    const currentSessionId = sessionId ?? audioSessionIdRef.current;

    // Check if we've been interrupted
    if (audioSessionIdRef.current !== currentSessionId) {
      console.log('[Browser TTS] Session interrupted, skipping');
      return;
    }

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

      utterance.onend = () => {
        // Only handle if this is still the current session
        if (audioSessionIdRef.current === currentSessionId) {
          setIsSpeaking(false);
          // In live mode, restart listening after AI finishes speaking
          if (isLiveMode) {
            shouldRestartListening.current = true;
            setTimeout(() => startListeningRef.current(), 500);
          }
        }
      };
      utterance.onerror = () => {
        if (audioSessionIdRef.current === currentSessionId) {
          setIsSpeaking(false);
        }
      };

      window.speechSynthesis.speak(utterance);
    } catch (error) {
      console.error('Browser TTS Error:', error);
      setIsSpeaking(false);
    }
  };

  const resetChat = () => {
    stopSpeaking();
    stopListening();
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

  // Auto-submit in live mode when speech recognition ends with final text
  const submitMessage = useCallback(async (messageText: string) => {
    if (!messageText.trim() || isLoading) return;

    stopSpeaking();
    stopListening();

    const userMsg: Message = { id: Date.now().toString(), role: 'user', text: messageText };
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
          message: messageText,
          history: conversationHistory.slice(0, -1),
          personaId: selectedPersonaId,
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

      // Strip markdown formatting for clean display and speech
      const cleanText = stripMarkdown(responseText);

      const botMsg: Message = { id: (Date.now() + 1).toString(), role: 'model', text: cleanText };
      setMessages(prev => [...prev, botMsg]);

      if (isVoiceEnabled) {
        speakText(cleanText);
      } else if (isLiveMode) {
        // In live mode without voice, restart listening after response
        setTimeout(() => startListeningRef.current(), 500);
      }

    } catch (err) {
      console.error('[ChatAssistant] Error:', err);
      const errorMsg = err instanceof Error ? err.message : 'An error occurred';
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', text: errorMsg }]);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, messages, isVoiceEnabled, isLiveMode, stopSpeaking, stopListening, speakText]);

  // Keep submitMessage ref updated
  useEffect(() => {
    submitMessageRef.current = submitMessage;
  }, [submitMessage]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    stopSpeaking();
    stopListening();

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
          personaId: selectedPersonaId,
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

      // Strip markdown formatting for clean display and speech
      const cleanText = stripMarkdown(responseText);

      const botMsg: Message = { id: (Date.now() + 1).toString(), role: 'model', text: cleanText };
      setMessages(prev => [...prev, botMsg]);

      if (isVoiceEnabled) {
        speakText(cleanText);
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
                <h3 className="font-bold text-sm tracking-wide leading-none">
                  {currentPersona?.name || 'Assistant'}
                </h3>
                <span className="text-[10px] opacity-80 font-normal">
                  {currentPersona?.title || 'Reader Support'}
                </span>
              </div>
              {isSpeaking && (
                <div className="flex space-x-0.5 items-center h-3 ml-2" title="Speaking...">
                  <div className="w-0.5 bg-white h-full animate-pulse"></div>
                  <div className="w-0.5 bg-white h-2/3 animate-pulse delay-75"></div>
                  <div className="w-0.5 bg-white h-full animate-pulse delay-150"></div>
                </div>
              )}
              {isListening && (
                <div className="flex items-center gap-1 ml-2" title="Listening...">
                  <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
                  <span className="text-[10px] text-white/90 font-medium">LISTENING</span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-1">
              {/* Persona Selector */}
              {personas.length > 1 && (
                <PersonaSelector
                  personas={personas}
                  selectedPersonaId={selectedPersonaId}
                  onSelectPersona={handlePersonaSelect}
                />
              )}
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
                title={isVoiceEnabled ? "Turn off voice responses" : "Turn on voice responses (AI will speak)"}
              >
                {isVoiceEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
              </button>
              {speechSupported && (
                <button
                  onClick={toggleLiveMode}
                  className={`hover:bg-white/20 p-1.5 rounded transition flex items-center gap-1 ${isLiveMode ? 'text-white bg-white/20' : 'text-white/50'}`}
                  title={isLiveMode ? "Turn off hands-free mode" : "Hands-free mode: speak and AI responds automatically"}
                >
                  <Radio size={14} className={isLiveMode ? 'animate-pulse' : ''} />
                  {isLiveMode && <span className="text-[10px] font-medium">LIVE</span>}
                </button>
              )}
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

          <form onSubmit={handleSubmit} className="p-3 bg-white border-t border-gray-100 shrink-0 flex flex-col gap-2">
            {/* Interim transcript display */}
            {isListening && interimTranscript && (
              <div className="text-xs text-gray-500 italic px-2 animate-pulse">
                {interimTranscript}...
              </div>
            )}
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={handleInputChange}
                placeholder={
                  isListening
                    ? "Listening... speak now"
                    : isLiveMode
                      ? "Tap mic or type..."
                      : isVoiceEnabled
                        ? "Ask and I will speak..."
                        : "How can I help you today?"
                }
                className={`grow border rounded-full px-4 py-2.5 text-sm focus:outline-none focus:ring-1 transition-all bg-gray-50 focus:bg-white ${
                  isListening ? 'border-red-400 ring-1 ring-red-300' : 'border-gray-300'
                }`}
              />
              {speechSupported && (
                <button
                  type="button"
                  onClick={toggleListening}
                  disabled={isLoading}
                  className={`p-2.5 rounded-full transition-all shadow-sm shrink-0 ${
                    isListening
                      ? 'bg-red-500 text-white animate-pulse hover:bg-red-600'
                      : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                  } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  aria-label={isListening ? "Stop listening" : "Start voice input"}
                  title={isListening ? "Tap to stop" : "Tap to speak (press-to-talk)"}
                >
                  {isListening ? <MicOff size={18} /> : <Mic size={18} />}
                </button>
              )}
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="text-white p-2.5 rounded-full hover:brightness-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm shrink-0"
                style={{ backgroundColor: primaryColor }}
                aria-label="Send message"
              >
                <Send size={18} />
              </button>
            </div>
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
