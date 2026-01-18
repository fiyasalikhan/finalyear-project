
import React from 'react';
import { Message } from '../types';
import { User, Cpu } from 'lucide-react';

interface ChatMessageProps {
  message: Message;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isUser = message.role === 'user';

  return (
    <div className={`flex w-full mb-6 ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex max-w-[85%] md:max-w-[70%] ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${
          isUser ? 'ml-3 bg-violet-600' : 'mr-3 bg-slate-800'
        }`}>
          {isUser ? <User size={18} /> : <Cpu size={18} className="text-violet-400" />}
        </div>
        
        <div className={`px-4 py-3 rounded-2xl ${
          isUser 
            ? 'bg-violet-600/20 border border-violet-500/30 rounded-tr-none text-violet-50' 
            : 'glass rounded-tl-none text-slate-100'
        }`}>
          <div className="text-sm leading-relaxed whitespace-pre-wrap break-words">
            {message.content}
          </div>
          <div className={`text-[10px] mt-2 opacity-40 font-mono ${isUser ? 'text-right' : 'text-left'}`}>
            {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;
