import React, { useEffect, useRef, useState } from 'react';
import { useTripContext } from '../lib/TripContext';
import { ChatApi, ChatMessage } from '../lib/chatApi';
import { formatDuration } from '../lib/commuteFormatters';
import { ModeAvailabilityStatus, SheetSnapPoint } from '../lib/types';
import { CloseXIcon, SendArrowIcon, SparkleIcon } from './Icons';

const SUGGESTION_CHIPS = [
  'Which modes are available here?',
  'Compare Local vs Ola/Uber fares',
  'What if I miss my connection?',
  'Leave by what time?',
];

export const ChatBar: React.FC = () => {
  const trip = useTripContext();

  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome_msg',
      role: 'assistant',
      text: 'Hi! Ask me about routes, Metro/Bus availability in any Indian city, Local Auto vs Ola/Uber fares, or departure times.',
    },
  ]);

  const listRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const s = trip.startPlace;
    const e = trip.endPlace;
    const r = trip.recommendedRoute;
    if (!s || !e || !r) return;

    const availModes = trip.modeAvailability
      .filter((a) => a.status === ModeAvailabilityStatus.AVAILABLE)
      .map((a) => a.mode)
      .join(', ');
    const unavailModes = trip.modeAvailability
      .filter((a) => a.status === ModeAvailabilityStatus.NOT_AVAILABLE)
      .map((a) => a.mode)
      .join(', ');

    const welcomeSummary =
      `Active Trip: ${s.name} to ${e.name}.\n` +
      `• Recommended: ${r.summary} (${formatDuration(r.durationMinutes)}, ₹${r.fareInr}).\n` +
      `• Available Modes: ${availModes || 'Mix, Bus, Car'}` +
      (unavailModes ? ` (Not in this city: ${unavailModes})` : '') +
      '.\nAsk me anything about this journey or any other route in India!';

    setMessages((prev) =>
      prev.length === 1 && prev[0].id === 'welcome_msg'
        ? [{ ...prev[0], text: welcomeSummary }]
        : prev
    );
  }, [
    trip.startPlace?.id,
    trip.endPlace?.id,
    trip.recommendedRoute?.id,
    trip.modeAvailability,
  ]);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages, isSending, trip.isChatExpanded]);

  const sendMessage = async (questionRaw: string) => {
    const clean = questionRaw.trim();
    if (!clean || isSending) return;

    const userMsg: ChatMessage = {
      id: `user_${Date.now()}`,
      role: 'user',
      text: clean,
    };
    const assistantMsgId = `assistant_${Date.now()}`;
    const placeholderMsg: ChatMessage = {
      id: assistantMsgId,
      role: 'assistant',
      text: '',
      isStreaming: true,
    };

    setMessages((prev) => [...prev, userMsg, placeholderMsg]);
    setInputText('');
    setIsSending(true);

    try {
      await ChatApi.streamChatMessage(
        clean,
        trip.startPlace,
        trip.endPlace,
        trip.routes,
        trip.reachByTime,
        (partialText) => {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMsgId ? { ...m, text: partialText } : m
            )
          );
        }
      );
    } finally {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMsgId ? { ...m, isStreaming: false } : m
        )
      );
      setIsSending(false);
    }
  };

  if (!trip.isChatExpanded) {
    return (
      <div
        data-testid="chat_bar_collapsed"
        onClick={() => {
          trip.setIsChatExpanded(true);
          if (trip.isRoutesSheetOpen) {
            trip.setSheetSnapPoint(SheetSnapPoint.PEEK);
          }
        }}
        className="w-full h-[48px] bg-[#ffffff] border-t border-[#dadce0] px-[16px] flex items-center justify-between cursor-pointer shrink-0"
      >
        <div className="flex items-center gap-[8px]">
          <SparkleIcon color="#1a73e8" size={18} />
          <span className="text-[14px] leading-[20px] text-[#5f6368]">
            Ask about your trip
          </span>
        </div>

        <span className="px-[8px] py-[4px] rounded-full bg-[#e8f0fe] text-[12px] leading-[16px] font-medium text-[#1a73e8]">
          Gemini AI
        </span>
      </div>
    );
  }

  return (
    <div
      data-testid="chat_bar_expanded"
      className="w-full h-[64%] rounded-t-[16px] bg-[#ffffff] border-t border-[#dadce0] gmaps-shadow flex flex-col shrink-0 overflow-hidden"
    >
      {/* Header */}
      <div className="w-full px-[16px] pt-[8px] pb-[4px] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-[8px] flex-1 min-w-0">
          <SparkleIcon color="#1a73e8" size={18} />
          <div className="min-w-0">
            <div className="text-[16px] leading-[24px] font-medium text-[#202124]">
              Ask about your trip
            </div>
            <div className="text-[12px] leading-[16px] text-[#5f6368] truncate">
              Gemini AI • Live route & fare context
            </div>
          </div>
        </div>

        <div className="flex items-center shrink-0">
          {trip.routes.length > 0 && (
            <button
              type="button"
              data-testid="chat_back_to_routes_button"
              onClick={() => {
                trip.setIsChatExpanded(false);
                trip.setIsRoutesSheetOpen(true);
                trip.setSheetSnapPoint(SheetSnapPoint.HALF);
              }}
              className="h-[36px] px-[12px] rounded-full bg-[#e8f0fe] border border-[#1a73e8] text-[12px] leading-[16px] font-medium text-[#1a73e8] flex items-center justify-center cursor-pointer"
            >
              Routes
            </button>
          )}

          <button
            type="button"
            data-testid="close_chat_button"
            onClick={() => trip.setIsChatExpanded(false)}
            className="w-[48px] h-[48px] rounded-full flex items-center justify-center hover:bg-[#f1f3f4] cursor-pointer"
            aria-label="Close chat"
          >
            <CloseXIcon color="#5f6368" size={20} />
          </button>
        </div>
      </div>

      <div className="h-[1px] bg-[#dadce0] shrink-0" />

      {/* Message list */}
      <div
        ref={listRef}
        data-testid="chat_messages_list"
        className="w-full flex-1 overflow-y-auto px-[16px] py-[12px] flex flex-col gap-[8px]"
      >
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={msg.id}
              className={`w-full flex ${isUser ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[88%] rounded-[12px] p-[12px] ${
                  isUser
                    ? 'bg-[#e8f0fe] border border-[#1a73e8]'
                    : 'bg-[#f1f3f4] border border-[#dadce0]'
                }`}
              >
                {msg.isStreaming && msg.text.length === 0 ? (
                  <TypingDotsIndicator />
                ) : (
                  <div className="text-[14px] leading-[20px] text-[#202124] whitespace-pre-line">
                    {msg.text}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Suggestion chips */}
      <div className="w-full px-[16px] py-[6px] flex items-center gap-[8px] overflow-x-auto no-scrollbar shrink-0">
        {SUGGESTION_CHIPS.map((suggestion) => (
          <button
            key={suggestion}
            type="button"
            onClick={() => sendMessage(suggestion)}
            className="h-[32px] px-[12px] rounded-full bg-[#f1f3f4] border border-[#dadce0] text-[12px] leading-[16px] text-[#202124] flex items-center shrink-0 hover:bg-[#e8f0fe] cursor-pointer"
          >
            {suggestion}
          </button>
        ))}
      </div>

      {/* Input row */}
      <div className="w-full px-[16px] py-[8px] flex items-center gap-[8px] shrink-0">
        <div className="flex-1 h-[48px] rounded-full bg-[#f1f3f4] border border-[#dadce0] px-[16px] flex items-center">
          <input
            type="text"
            data-testid="chat_input_field"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && inputText.trim().length > 0 && !isSending) {
                sendMessage(inputText);
              }
            }}
            placeholder="Ask about fares, metro, or timing..."
            className="w-full bg-transparent outline-none text-[14px] leading-[20px] text-[#202124] placeholder-[#5f6368]"
          />
        </div>

        <button
          type="button"
          data-testid="chat_send_button"
          disabled={!inputText.trim() || isSending}
          onClick={() => {
            if (inputText.trim() && !isSending) {
              sendMessage(inputText);
            }
          }}
          className={`w-[48px] h-[48px] rounded-full flex items-center justify-center shrink-0 cursor-pointer transition-colors ${
            inputText.trim() && !isSending ? 'bg-[#1a73e8]' : 'bg-[#dadce0]'
          }`}
          aria-label="Send message"
        >
          <SendArrowIcon color="#ffffff" size={18} />
        </button>
      </div>
    </div>
  );
};

const TypingDotsIndicator: React.FC = () => {
  return (
    <div
      data-testid="typing_dots_indicator"
      className="py-[4px] flex items-center gap-[4px]"
    >
      <span className="w-[8px] h-[8px] rounded-full bg-[#5f6368] animate-pulse" />
      <span
        className="w-[8px] h-[8px] rounded-full bg-[#5f6368] animate-pulse"
        style={{ animationDelay: '150ms' }}
      />
      <span
        className="w-[8px] h-[8px] rounded-full bg-[#5f6368] animate-pulse"
        style={{ animationDelay: '300ms' }}
      />
    </div>
  );
};
