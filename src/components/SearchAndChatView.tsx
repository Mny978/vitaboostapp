import React, { useState } from 'react';
import {
  MessageSquare,
  Search,
  Send,
  Sparkles,
  ExternalLink,
  User,
  Bot,
  AlertCircle,
  Lightbulb,
} from 'lucide-react';
import { UserProfile, GroundingSource, SupportedLanguage } from '../types';
import { translations } from '../utils/translations';
import { chatWithNutritionist, performHealthSearch } from '../services/geminiService';

interface SearchAndChatViewProps {
  profile: UserProfile;
  initialTab?: 'chat' | 'search';
  language: SupportedLanguage;
}

const CHAT_PROMPTS = [
  'What are low-GI snack options for 4 PM cravings?',
  'How do I meet my daily protein target on a vegetarian diet?',
  'Best dinner choices to prevent morning blood sugar spikes?',
  'What should I eat when dining out at an Indian restaurant?',
];

export const SearchAndChatView: React.FC<SearchAndChatViewProps> = ({
  profile,
  initialTab = 'chat',
  language,
}) => {
  const t = translations[language] || translations.en;
  const [activeTab, setActiveTab] = useState<'chat' | 'search'>(initialTab);

  // Chat State
  const [chatMessages, setChatMessages] = useState<
    { role: 'user' | 'model'; text: string; time?: string }[]
  >([
    {
      role: 'model',
      text: `Hello ${
        profile.name || 'there'
      }! I am your VitaBoost AI Clinical Dietitian. I'm here to answer any questions about your calorie targets, personalized meal swaps, or medical nutrition therapy for ${
        profile.medicalConditions || 'optimal vitality'
      }. How can I support your nutrition today?`,
      time: 'Now',
    },
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isSendingChat, setIsSendingChat] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);

  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<{
    text: string;
    sources: GroundingSource[];
  } | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);

  const handleSendMessage = async (customMessage?: string) => {
    const textToSend = customMessage || chatInput.trim();
    if (!textToSend || isSendingChat) return;

    const newMessages = [
      ...chatMessages,
      {
        role: 'user' as const,
        text: textToSend,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ];

    setChatMessages(newMessages);
    setChatInput('');
    setIsSendingChat(true);
    setChatError(null);

    try {
      const response = await chatWithNutritionist(
        newMessages.map((m) => ({ role: m.role, text: m.text })),
        profile
      );
      setChatMessages((prev) => [
        ...prev,
        {
          role: 'model',
          text: response,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } catch (err: any) {
      console.error('Chat error:', err);
      setChatError(err.message || 'Failed to get answer from AI dietitian.');
    } finally {
      setIsSendingChat(false);
    }
  };

  const handlePerformSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim() || isSearching) return;

    setIsSearching(true);
    setSearchError(null);
    setSearchResults(null);

    try {
      const data = await performHealthSearch(searchQuery.trim());
      setSearchResults(data);
    } catch (err: any) {
      console.error('Search error:', err);
      setSearchError(err.message || 'Failed to perform health search.');
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header with Switcher */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            {activeTab === 'chat' ? (
              <MessageSquare className="w-6 h-6 text-blue-600" />
            ) : (
              <Search className="w-6 h-6 text-emerald-600" />
            )}
            <span>{activeTab === 'chat' ? t.chatHeader : t.searchHeader}</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            {activeTab === 'chat'
              ? 'Real-time conversational dietitian assistant trained on clinical nutrition guidelines.'
              : 'Grounded search on scientific dietary evidence, clinical trials, and superfoods.'}
          </p>
        </div>

        <div className="flex space-x-2">
          <button
            onClick={() => setActiveTab('chat')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'chat'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>AI Dietitian Chat</span>
          </button>

          <button
            onClick={() => setActiveTab('search')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'search'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            <span>Health Search</span>
          </button>
        </div>
      </div>

      {/* CHAT TAB */}
      {activeTab === 'chat' && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs overflow-hidden flex flex-col h-[650px]">
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            {chatMessages.map((msg, index) => {
              const isUser = msg.role === 'user';
              return (
                <div
                  key={index}
                  className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : ''}`}
                >
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                      isUser
                        ? 'bg-blue-600 text-white'
                        : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                    }`}
                  >
                    {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                  </div>

                  <div
                    className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-3 text-xs sm:text-sm leading-relaxed ${
                      isUser
                        ? 'bg-blue-600 text-white rounded-tr-none'
                        : 'bg-slate-100 dark:bg-slate-900/60 text-slate-800 dark:text-slate-200 rounded-tl-none border border-slate-200/60 dark:border-slate-800'
                    }`}
                  >
                    <div className="whitespace-pre-line">{msg.text}</div>
                    {msg.time && (
                      <span
                        className={`text-[10px] mt-1.5 block ${
                          isUser ? 'text-blue-200 text-right' : 'text-slate-400'
                        }`}
                      >
                        {msg.time}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}

            {isSendingChat && (
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 flex items-center justify-center">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="bg-slate-100 dark:bg-slate-900/60 rounded-2xl rounded-tl-none px-4 py-3 text-xs text-slate-500 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce" />
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce [animation-delay:0.2s]" />
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce [animation-delay:0.4s]" />
                  <span className="ml-1 text-slate-400">Dietitian is formulating personalized response...</span>
                </div>
              </div>
            )}
          </div>

          {/* Quick Prompt Chips */}
          <div className="p-3 bg-slate-50 dark:bg-slate-900/40 border-t border-slate-100 dark:border-slate-800/80">
            <span className="text-[11px] font-semibold text-slate-500 block mb-1.5 flex items-center gap-1">
              <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
              <span>Suggested Inquiries:</span>
            </span>
            <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {CHAT_PROMPTS.map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(prompt)}
                  className="text-xs px-2.5 py-1 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-blue-400 whitespace-nowrap transition cursor-pointer"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>

          {/* Input Box */}
          <div className="p-4 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700">
            {chatError && (
              <div className="mb-2 p-2 rounded-lg bg-rose-50 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{chatError}</span>
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder={t.chatPlaceholder}
                className="flex-1 px-4 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                disabled={isSendingChat || !chatInput.trim()}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/20 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                <span className="hidden sm:inline">Send</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* SEARCH TAB */}
      {activeTab === 'search' && (
        <div className="space-y-6">
          <form
            onSubmit={handlePerformSearch}
            className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-3"
          >
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Ask any clinical or scientific nutrition question:
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t.searchPlaceholder}
                className="flex-1 px-4 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <button
                type="submit"
                disabled={isSearching || !searchQuery.trim()}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Sparkles className={`w-4 h-4 ${isSearching ? 'animate-spin' : ''}`} />
                <span>{isSearching ? 'Searching...' : t.btnSearch}</span>
              </button>
            </div>
          </form>

          {searchError && (
            <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{searchError}</span>
            </div>
          )}

          {searchResults && (
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-4">
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-emerald-600" />
                <span>Evidence-Based Synthesis</span>
              </h3>

              <div className="prose dark:prose-invert max-w-none text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                {searchResults.text}
              </div>

              {searchResults.sources && searchResults.sources.length > 0 && (
                <div className="pt-4 border-t border-slate-100 dark:border-slate-700">
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400 block mb-2">
                    Referenced Grounded Sources:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {searchResults.sources.map((source, i) => (
                      <a
                        key={i}
                        href={source.uri}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>{source.title || 'Evidence Source'}</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
