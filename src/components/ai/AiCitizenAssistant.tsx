import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { ReportCategory, ReportPriority } from '../../types';
import { sendChatMessageToAi, classifyIssueWithAi, GroundingSource } from '../../services/api';
import {
  Bot,
  MessageSquare,
  X,
  Send,
  Sparkles,
  Droplet,
  Droplets,
  CheckCircle2,
  Minimize2,
  Maximize2,
  Loader2,
  AlertCircle,
  HelpCircle,
  Search,
  Compass,
  Zap,
} from 'lucide-react';

interface ChatMessage {
  id: string;
  role: 'assistant' | 'user';
  text: string;
  modelUsed?: string;
  quickActions?: string[];
  isWaterAlert?: boolean;
}

export const AiCitizenAssistant: React.FC = () => {
  const {
    isAiAssistantOpen,
    setIsAiAssistantOpen,
    setIsReportModalOpen,
    setReportCategoryPreset,
    setSelectedReportId,
    setActivePage,
  } = useApp();

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-init',
      role: 'assistant',
      text: 'Namaste! I am your MB Urban Water AI Assistant for Mira-Bhayandar Municipal Corporation. I specialize strictly in urban water services: reporting pipeline leaks, checking water supply timetables, investigating low pressure, testing turbid water, or scheduling emergency water tankers.',
      modelUsed: 'gemini-3.5-flash',
      quickActions: [
        'Report a Pipeline Leak',
        'Check Water Supply Schedule',
        'Low Water Pressure Help',
        'Water Quality Lab Sampling',
      ],
    },
  ]);

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isAiAssistantOpen) {
      scrollToBottom();
    }
  }, [messages, isAiAssistantOpen]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || input).trim();
    if (!text || isLoading) return;

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      role: 'user',
      text,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const history = messages.slice(-6).map((m) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        text: m.text,
      }));

      const response = await sendChatMessageToAi(text, history);

      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        role: 'assistant',
        text: response.reply,
        modelUsed: response.modelUsed || 'gemini-3.5-flash',
        quickActions: response.quickActions || [
          'Report Water Issue',
          'Track Water Report',
          'Water Supply Timetable',
        ],
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        {
          id: `bot-${Date.now()}`,
          role: 'assistant',
          text: 'This platform currently handles urban water-related issues. For emergency water leakages, please file a report directly with the Water Service Department.',
          quickActions: ['Report Water Issue'],
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickAction = (actionText: string) => {
    const act = actionText.toLowerCase();
    if (act.includes('report') && act.includes('leak')) {
      setReportCategoryPreset('Water Leakage');
      setIsReportModalOpen(true);
      return;
    }
    if (act.includes('report')) {
      setIsReportModalOpen(true);
      return;
    }
    if (act.includes('track')) {
      setActivePage('track');
      return;
    }
    handleSendMessage(actionText);
  };

  if (!isAiAssistantOpen) {
    return (
      <button
        onClick={() => setIsAiAssistantOpen(true)}
        className="fixed bottom-6 right-6 z-40 p-3.5 bg-blue-700 hover:bg-blue-800 text-white rounded-full shadow-xl flex items-center gap-2.5 transition-transform hover:scale-105 group"
        aria-label="Open AI Water Assistant"
      >
        <Droplets className="w-5 h-5 text-cyan-300 animate-pulse" />
        <span className="text-xs font-bold pr-1 hidden sm:inline">
          Water AI Assistant
        </span>
      </button>
    );
  }

  return (
    <div
      className={`fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden transition-all duration-200 ${
        isExpanded
          ? 'w-[95vw] sm:w-[680px] h-[85vh]'
          : 'w-[92vw] sm:w-[420px] h-[580px]'
      }`}
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-900 to-cyan-950 text-white p-3.5 sm:p-4 flex items-center justify-between border-b border-cyan-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-cyan-700 text-white flex items-center justify-center font-bold">
            <Droplets className="w-4 h-4 text-cyan-200" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-xs sm:text-sm">MB Urban Water AI</span>
              <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
            </div>
            <span className="text-[10px] text-cyan-300 font-medium">
              Water Service Department · MBMC
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 text-slate-300 hover:text-white rounded-md hover:bg-white/10"
            title={isExpanded ? 'Restore' : 'Expand'}
          >
            {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
          <button
            onClick={() => setIsAiAssistantOpen(false)}
            className="p-1.5 text-slate-300 hover:text-white rounded-md hover:bg-white/10"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50 text-xs">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${
              msg.role === 'user' ? 'items-end' : 'items-start'
            }`}
          >
            <div
              className={`max-w-[85%] p-3 rounded-xl leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-blue-600 text-white rounded-br-none shadow-xs'
                  : 'bg-white text-slate-800 border border-slate-200 rounded-bl-none shadow-xs'
              }`}
            >
              <p className="whitespace-pre-wrap">{msg.text}</p>
            </div>

            {/* Quick Actions */}
            {msg.role === 'assistant' && msg.quickActions && msg.quickActions.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2 max-w-[90%]">
                {msg.quickActions.map((qa, i) => (
                  <button
                    key={i}
                    onClick={() => handleQuickAction(qa)}
                    className="px-2.5 py-1 rounded-full bg-cyan-50 border border-cyan-200 text-cyan-900 text-[11px] font-semibold hover:bg-cyan-100 hover:border-cyan-300 transition-colors"
                  >
                    {qa} →
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex items-center gap-2 text-slate-400 p-2 text-xs">
            <Loader2 className="w-4 h-4 animate-spin text-cyan-600" />
            <span>Water Assistant is analyzing...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Field */}
      <div className="p-3 bg-white border-t border-slate-200">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about water supply, pipeline leaks, low pressure..."
            className="flex-1 px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-cyan-500 bg-slate-50"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="p-2 bg-blue-700 hover:bg-blue-800 text-white rounded-xl disabled:opacity-40 transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
        <span className="text-[10px] text-slate-400 text-center block mt-1.5">
          Specialized for Mira-Bhayandar Urban Water Services only.
        </span>
      </div>
    </div>
  );
};
