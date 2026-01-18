
import React, { useState, useRef, useEffect, useCallback } from 'react';
// Fix: Added Cpu to the imports from lucide-react
import { Plus, Send, Menu, X, Trash2, MessageSquare, Shield, Sparkles, Cpu } from 'lucide-react';
import { Message, ChatSession } from './types';
import { chatWithAI } from './services/aiService';
import ChatMessage from './components/ChatMessage';

const App: React.FC = () => {
  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    const saved = localStorage.getItem('zai_sessions');
    return saved ? JSON.parse(saved) : [];
  });
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeSession = sessions.find(s => s.id === activeSessionId);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [activeSession?.messages, isLoading]);

  useEffect(() => {
    localStorage.setItem('zai_sessions', JSON.stringify(sessions));
  }, [sessions]);

  const createNewSession = useCallback(() => {
    const newSession: ChatSession = {
      id: Date.now().toString(),
      title: 'New Conversation',
      messages: [],
      updatedAt: Date.now(),
    };
    setSessions(prev => [newSession, ...prev]);
    setActiveSessionId(newSession.id);
    setIsSidebarOpen(false);
  }, []);

  const deleteSession = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setSessions(prev => prev.filter(s => s.id !== id));
    if (activeSessionId === id) {
      setActiveSessionId(null);
    }
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    let currentSessionId = activeSessionId;
    let targetSession = activeSession;

    // Create session if none active
    if (!currentSessionId) {
      const newSession: ChatSession = {
        id: Date.now().toString(),
        title: inputValue.trim().slice(0, 30) + (inputValue.length > 30 ? '...' : ''),
        messages: [],
        updatedAt: Date.now(),
      };
      setSessions(prev => [newSession, ...prev]);
      setActiveSessionId(newSession.id);
      currentSessionId = newSession.id;
      targetSession = newSession;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue.trim(),
      timestamp: Date.now(),
    };

    const updatedMessages = [...(targetSession?.messages || []), userMessage];
    
    // Update local state with user message
    setSessions(prev => prev.map(s => 
      s.id === currentSessionId 
        ? { 
            ...s, 
            messages: updatedMessages, 
            updatedAt: Date.now(),
            title: s.messages.length === 0 ? userMessage.content.slice(0, 30) : s.title 
          } 
        : s
    ));
    
    setInputValue('');
    setIsLoading(true);
    setError(null);

    try {
      const aiResponse = await chatWithAI(updatedMessages);
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: aiResponse,
        timestamp: Date.now(),
      };

      setSessions(prev => prev.map(s => 
        s.id === currentSessionId 
          ? { ...s, messages: [...s.messages, assistantMessage], updatedAt: Date.now() } 
          : s
      ));
    } catch (err: any) {
      setError(err.message || 'An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-[#030712] overflow-hidden text-slate-200">
      {/* Sidebar - Desktop */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-72 glass border-r border-white/5 transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex flex-col h-full p-4">
          <div className="flex items-center justify-between mb-8 px-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-pink-600 flex items-center justify-center font-bold text-white shadow-lg shadow-violet-500/20">
                z
              </div>
              <span className="font-outfit text-xl font-bold tracking-tight">z.ai</span>
            </div>
            <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden p-1 text-slate-400 hover:text-white">
              <X size={20} />
            </button>
          </div>

          <button 
            onClick={createNewSession}
            className="flex items-center gap-2 w-full p-3 mb-6 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-sm font-medium group"
          >
            <Plus size={18} className="group-hover:rotate-90 transition-transform" />
            New Chat
          </button>

          <div className="flex-1 overflow-y-auto space-y-2 pr-2">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-widest px-2 mb-2">Recent Chats</div>
            {sessions.length === 0 ? (
              <div className="px-3 py-4 text-sm text-slate-500 italic">No history yet...</div>
            ) : (
              sessions.map(session => (
                <div 
                  key={session.id}
                  onClick={() => { setActiveSessionId(session.id); setIsSidebarOpen(false); }}
                  className={`group flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all ${
                    activeSessionId === session.id 
                      ? 'bg-violet-600/20 border border-violet-500/30 text-violet-200' 
                      : 'hover:bg-white/5 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <MessageSquare size={16} className={activeSessionId === session.id ? 'text-violet-400' : 'text-slate-500'} />
                    <span className="text-sm truncate font-medium">{session.title}</span>
                  </div>
                  <button 
                    onClick={(e) => deleteSession(e, session.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-red-400 transition-all"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))
            )}
          </div>

          <div className="mt-auto pt-4 border-t border-white/5 px-2">
            <div className="flex items-center gap-3 p-2 rounded-xl bg-gradient-to-r from-violet-600/10 to-pink-600/10 border border-violet-500/20">
              <Shield size={16} className="text-violet-400" />
              <div className="text-xs">
                <p className="font-semibold text-violet-200">Enterprise Core</p>
                {/* Updated model label */}
                <p className="opacity-60">Gemini 3 Pro</p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col relative min-w-0">
        {/* Header */}
        <header className="h-16 flex items-center justify-between px-4 lg:px-8 border-b border-white/5 glass sticky top-0 z-30">
          <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-2 text-slate-400 hover:text-white">
            <Menu size={24} />
          </button>
          
          <div className="flex flex-col items-center">
             <h2 className="font-outfit font-semibold text-sm lg:text-base flex items-center gap-2">
              {activeSession ? activeSession.title : 'Assistant'}
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
            </h2>
          </div>

          <div className="flex items-center gap-3">
             <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] uppercase tracking-tighter font-bold text-slate-400">
               <Sparkles size={12} className="text-violet-400" />
               Premium
             </div>
          </div>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-8 space-y-2">
          {!activeSessionId || (activeSession && activeSession.messages.length === 0) ? (
            <div className="h-full flex flex-col items-center justify-center text-center max-w-xl mx-auto space-y-8 animate-in fade-in zoom-in duration-700">
              <div className="relative">
                <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-violet-600 to-pink-600 flex items-center justify-center shadow-2xl shadow-violet-500/40 relative z-10">
                   {/* Cpu icon now correctly imported */}
                   <Cpu size={48} className="text-white" />
                </div>
                <div className="absolute inset-0 bg-violet-600 blur-3xl opacity-20 -z-0"></div>
              </div>
              
              <div>
                <h1 className="text-4xl lg:text-5xl font-bold font-outfit mb-4 tracking-tight">
                  Experience <span className="gradient-text">Pure Intelligence</span>
                </h1>
                {/* Updated model description */}
                <p className="text-slate-400 leading-relaxed text-lg">
                  Powered by the next-generation Gemini 3 Pro model, z.ai is designed for high-stakes productivity and creative exploration.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                {[
                  "Draft a technical architecture for a SaaS",
                  "Explain quantum entanglement like I'm five",
                  "Refactor this React hook for performance",
                  "Create a strategic marketing plan for 2025"
                ].map((suggestion, idx) => (
                  <button 
                    key={idx}
                    onClick={() => {
                      setInputValue(suggestion);
                    }}
                    className="p-4 rounded-2xl glass border border-white/10 hover:border-violet-500/50 hover:bg-violet-500/5 text-left text-sm transition-all group"
                  >
                    <span className="text-slate-400 group-hover:text-violet-300 transition-colors">"{suggestion}"</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto w-full">
              {activeSession.messages.map((msg) => (
                <ChatMessage key={msg.id} message={msg} />
              ))}
              
              {isLoading && (
                <div className="flex w-full mb-6 justify-start animate-pulse">
                  <div className="flex max-w-[85%] md:max-w-[70%]">
                    <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-slate-800 mr-3 flex items-center justify-center">
                      {/* Cpu icon now correctly imported */}
                      <Cpu size={18} className="text-violet-400" />
                    </div>
                    <div className="px-4 py-3 rounded-2xl glass rounded-tl-none flex items-center gap-2">
                       <div className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce"></div>
                       <div className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce [animation-delay:-0.15s]"></div>
                       <div className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce [animation-delay:-0.3s]"></div>
                    </div>
                  </div>
                </div>
              )}

              {error && (
                <div className="flex justify-center my-4">
                  <div className="px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
                    <Shield size={14} />
                    {error}
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input area */}
        <div className="p-4 lg:p-8 border-t border-white/5 bg-[#030712]/80 backdrop-blur-xl">
          <form 
            onSubmit={handleSendMessage}
            className="max-w-4xl mx-auto relative group"
          >
            <div className="absolute -inset-1 bg-gradient-to-r from-violet-600/20 to-pink-600/20 rounded-2xl blur opacity-0 group-focus-within:opacity-100 transition duration-500"></div>
            <div className="relative flex items-center bg-[#0d1117] border border-white/10 rounded-2xl p-1 shadow-2xl overflow-hidden focus-within:border-violet-500/50 transition-all">
              <textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder="Message z.ai..."
                className="flex-1 bg-transparent border-none focus:ring-0 text-slate-100 placeholder-slate-500 py-3 px-4 resize-none max-h-40 overflow-y-auto"
                rows={1}
              />
              <button 
                type="submit"
                disabled={!inputValue.trim() || isLoading}
                className={`flex items-center justify-center w-10 h-10 rounded-xl mr-1 transition-all ${
                  inputValue.trim() && !isLoading 
                    ? 'bg-gradient-to-tr from-violet-600 to-pink-600 text-white shadow-lg shadow-violet-500/30 hover:scale-105 active:scale-95' 
                    : 'bg-white/5 text-slate-600 cursor-not-allowed'
                }`}
              >
                <Send size={18} />
              </button>
            </div>
            <p className="mt-3 text-[10px] text-center text-slate-600 font-medium tracking-wide">
              z.ai can make mistakes. Check important info.
            </p>
          </form>
        </div>
      </main>
    </div>
  );
};

export default App;
