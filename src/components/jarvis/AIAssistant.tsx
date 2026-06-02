import { useState, useRef, useEffect, useCallback } from 'react';
import { Mic, MicOff, Send, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import ReactMarkdown from 'react-markdown';

type Message = { role: 'user' | 'assistant'; content: string };

interface AIAssistantProps {
  onCommand?: (command: string) => void;
  systemState?: { cameraActive?: boolean; isScanning?: boolean; suitMode?: boolean; gestureEnabled?: boolean };
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/jarvis-ai`;

const AIAssistant = ({ onCommand, systemState }: AIAssistantProps) => {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Good day, Sir. J.A.R.V.I.S. at your service. All systems nominal. How may I assist you today?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const speak = useCallback((text: string) => {
    if (!ttsEnabled || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const clean = text.replace(/[*#_`>]/g, '').replace(/\[.*?\]\(.*?\)/g, '');
    const utterance = new SpeechSynthesisUtterance(clean);
    utterance.rate = 1.05;
    utterance.pitch = 0.85;
    const voices = window.speechSynthesis.getVoices();
    const preferred = voices.find(v =>
      v.name.includes('Google UK English Male') || v.name.includes('Daniel') || v.name.includes('Microsoft Mark')
    );
    if (preferred) utterance.voice = preferred;
    window.speechSynthesis.speak(utterance);
  }, [ttsEnabled]);

  // Enhanced command parsing with flexible phrasing
  const parseCommand = (text: string): string | null => {
    const lower = text.toLowerCase().trim();
    if (/scan.*analy[sz]e|analy[sz]e.*scan/.test(lower)) return 'scan';
    if (/open\s*(the\s*)?camera|start\s*(the\s*)?camera|activate\s*(the\s*)?camera|camera\s*on|show\s*(me\s*)?camera|turn\s*on\s*camera|launch\s*camera|visual\s*feed/i.test(lower)) return 'camera';
    if (/start\s*(the\s*)?scan|begin\s*scan|scan\s*(now|mode|it|this)?$|run\s*scan|initiate\s*scan|detection\s*mode/i.test(lower)) return 'scan';
    if (/suit\s*(mode|up|on)|activate\s*suit|enable\s*suit|armor\s*(up|on|mode)/i.test(lower)) return 'suit';
    if (/gesture\s*(control|mode|on)|enable\s*gesture|hand\s*control/i.test(lower)) return 'gesture';
    if (/hologram|holo\s*mode|full\s*mode|everything\s*on|all\s*systems/i.test(lower)) return 'hologram';
    if (/system\s*status|status\s*report|diagnostics?|how.*system|health\s*check|sys\s*stat/i.test(lower)) return 'status';
    if (/show\s*(the\s*)?dashboard|go\s*to\s*dashboard|open\s*dashboard|main\s*screen/i.test(lower)) return 'dashboard';
    if (/stop|close|shut\s*down|deactivate|power\s*down|end\s*session|stand\s*down/i.test(lower)) return 'stop';
    return null;
  };

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMsg: Message = { role: 'user', content: text.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    const cmd = parseCommand(text);
    if (cmd && onCommand) onCommand(cmd);

    // Build context-aware messages - include system state
    const contextNote = systemState ? `[System state: camera=${systemState.cameraActive ? 'active' : 'off'}, scanning=${systemState.isScanning ? 'active' : 'off'}, suit=${systemState.suitMode ? 'on' : 'off'}, gesture=${systemState.gestureEnabled ? 'on' : 'off'}]` : '';
    const allMessages = [...messages, userMsg];
    if (contextNote) {
      allMessages[allMessages.length - 1] = {
        ...userMsg,
        content: `${contextNote}\n${userMsg.content}`
      };
    }

    let assistantSoFar = '';

    try {
      const resp = await fetch(CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: allMessages }),
      });

      if (!resp.ok || !resp.body) throw new Error('Stream failed');

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);
          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') break;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              assistantSoFar += content;
              setMessages(prev => {
                const last = prev[prev.length - 1];
                if (last?.role === 'assistant' && prev.length > 1 && prev[prev.length - 2]?.role === 'user') {
                  return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantSoFar } : m);
                }
                return [...prev, { role: 'assistant', content: assistantSoFar }];
              });
            }
          } catch {
            textBuffer = line + '\n' + textBuffer;
            break;
          }
        }
      }

      if (assistantSoFar) speak(assistantSoFar);
    } catch (e) {
      console.error('AI error:', e);
      const errorMsg = 'I apologize, Sir. I seem to be experiencing a temporary disruption in my neural network. Shall I try again?';
      setMessages(prev => [...prev, { role: 'assistant', content: errorMsg }]);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleVoice = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
      sendMessage(transcript);
      setIsListening(false);
    };

    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] px-4 py-2 rounded-xl text-sm ${
              msg.role === 'user'
                ? 'bg-cyan-500/20 text-cyan-100 border border-cyan-500/30'
                : 'bg-blue-900/30 text-blue-100 border border-blue-500/20'
            }`}>
              {msg.role === 'assistant' ? (
                <div className="prose prose-invert prose-sm max-w-none">
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
              ) : msg.content}
            </div>
          </div>
        ))}
        {isLoading && messages[messages.length - 1]?.role === 'user' && (
          <div className="flex justify-start">
            <div className="bg-blue-900/30 text-blue-300 border border-blue-500/20 px-4 py-2 rounded-xl text-sm">
              <span className="inline-flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                <span className="ml-2 text-xs font-mono">Processing...</span>
              </span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-cyan-500/20">
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTtsEnabled(!ttsEnabled)}
            className={`shrink-0 ${ttsEnabled ? 'text-cyan-400' : 'text-gray-500'}`}
          >
            {ttsEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleVoice}
            className={`shrink-0 ${isListening ? 'text-red-400 animate-pulse' : 'text-cyan-400'}`}
          >
            {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          </Button>
          <Input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendMessage(input)}
            placeholder="Speak or type a command..."
            className="bg-slate-900/50 border-cyan-500/30 text-cyan-100 placeholder:text-cyan-700 focus-visible:ring-cyan-500/50"
          />
          <Button
            onClick={() => sendMessage(input)}
            disabled={isLoading || !input.trim()}
            size="icon"
            className="shrink-0 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 border border-cyan-500/30"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AIAssistant;
