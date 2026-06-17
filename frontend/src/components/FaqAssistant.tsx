import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { Bot, ExternalLink, Loader2, MessageCircle, Send, User, X } from "lucide-react";

type ChatRole = "assistant" | "user";

type Citation = {
  id?: string;
  title?: string;
};

type ChatMessage = {
  id: string;
  role: ChatRole;
  text: string;
  citations?: Citation[];
  // legacy
  matches?: Citation[];
};

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:5000";

const starterMessage: ChatMessage = {
  id: "assistant-starter",
  role: "assistant",
  text: "Ask me about existing CrowdFAQ questions and answers. I will search the knowledge base first.",
};

const buildId = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`;

export const FaqAssistant = () => {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([starterMessage]);
  const inputRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const trimmedInput = input.trim();
  const canSend = trimmedInput.length > 0 && !loading;

  // Auto-scroll to latest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const recentCitations = useMemo(() => {
    const assistantMessages = messages.filter((m) => m.role === "assistant");
    const last = assistantMessages[assistantMessages.length - 1];
    return (last?.citations ?? last?.matches ?? []).slice(0, 3);
  }, [messages]);

  const toggleOpen = () => {
    setOpen((value) => !value);
    window.setTimeout(() => inputRef.current?.focus(), 0);
  };

  const submitMessage = async (event: FormEvent) => {
    event.preventDefault();

    if (!canSend) {
      return;
    }

    const userMessage: ChatMessage = {
      id: buildId(),
      role: "user",
      text: trimmedInput,
    };

    setMessages((current) => [...current, userMessage]);
    setInput("");
    setLoading(true);

    try {
      // Build history from current messages for multi-turn RAG
      const history = messages
        .filter((m) => m.role === "user" || m.role === "assistant")
        .map((m) => ({ role: m.role, text: m.text }));

      const response = await fetch(`${API_BASE_URL}/api/v1/ai/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ message: trimmedInput, history }),
      });

      const payload = await response.json();

      if (!response.ok || !payload.success) {
        throw new Error(payload?.error?.message || "FAQ assistant is unavailable");
      }

      setMessages((current) => [
        ...current,
        {
          id: buildId(),
          role: "assistant",
          text: payload.data.answer,
          citations: payload.data.citations || payload.data.matches || [],
        },
      ]);
    } catch (error) {
      setMessages((current) => [
        ...current,
        {
          id: buildId(),
          role: "assistant",
          text:
            error instanceof Error
              ? error.message
              : "FAQ assistant is unavailable right now. Please try again in a moment.",
        },
      ]);
    } finally {
      setLoading(false);
      window.setTimeout(() => inputRef.current?.focus(), 0);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-[70] w-[calc(100vw-2rem)] max-w-[390px] sm:bottom-6 sm:right-6 sm:w-[390px]">
      {open && (
        <section
          className="mb-3 border border-brand-ink bg-white shadow-[0_18px_60px_rgba(17,17,16,0.16)]"
          aria-label="FAQ assistant"
          data-testid="faq-assistant-panel"
        >
          <div className="flex h-14 items-center justify-between border-b border-brand-line px-4">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center bg-brand-ink text-brand-paper">
                <Bot size={16} />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-brand-ink">FAQ Assistant</p>
                <p className="truncate text-[11px] text-brand-mute">Searches community answers</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="flex h-8 w-8 items-center justify-center border border-brand-line text-brand-body hover:border-brand-ink hover:text-brand-ink"
              title="Close assistant"
              aria-label="Close assistant"
            >
              <X size={15} />
            </button>
          </div>

          <div className="max-h-[390px] space-y-3 overflow-y-auto bg-brand-paper p-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-2 ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {message.role === "assistant" && (
                  <div className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center border border-brand-line bg-white text-brand-blue">
                    <Bot size={14} />
                  </div>
                )}
                <div
                  className={`max-w-[78%] border px-3 py-2 text-sm leading-6 ${
                    message.role === "user"
                      ? "border-brand-ink bg-brand-ink text-brand-paper"
                      : "border-brand-line bg-white text-brand-body"
                  }`}
                >
                  {message.text}
                </div>
                {message.role === "user" && (
                  <div className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center border border-brand-line bg-white text-brand-ink">
                    <User size={14} />
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-brand-mute">
                <Loader2 size={14} className="animate-spin" />
                Searching
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {recentCitations.length > 0 && (
            <div className="border-t border-brand-line bg-white px-4 py-3">
              <p className="label-eyebrow mb-2">Sources</p>
              <div className="space-y-1.5">
                {recentCitations.map((c, i) => (
                  <div key={c.id || i} className="flex items-start gap-1.5 text-xs text-brand-body">
                    <ExternalLink size={11} className="mt-0.5 shrink-0 text-brand-mute" />
                    <span className="truncate">{c.title}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <form onSubmit={submitMessage} className="flex border-t border-brand-line bg-white p-3">
            <input
              ref={inputRef}
              value={input}
              onChange={(event) => setInput(event.target.value)}
              className="min-w-0 flex-1 border border-brand-line px-3 py-2 text-sm outline-none focus:border-brand-ink"
              placeholder="Ask a FAQ question..."
              aria-label="Ask the FAQ assistant"
              data-testid="faq-assistant-input"
            />
            <button
              type="submit"
              disabled={!canSend}
              className="ml-2 flex h-10 w-10 items-center justify-center bg-brand-ink text-brand-paper transition-colors hover:bg-brand-blue disabled:cursor-not-allowed disabled:opacity-50"
              title="Send message"
              aria-label="Send message"
              data-testid="faq-assistant-send"
            >
              <Send size={15} />
            </button>
          </form>
        </section>
      )}

      <button
        type="button"
        onClick={toggleOpen}
        className="ml-auto flex h-12 w-12 items-center justify-center bg-brand-vermilion text-white shadow-[0_12px_30px_rgba(217,56,30,0.28)] transition-colors hover:bg-brand-blue"
        title={open ? "Close FAQ assistant" : "Open FAQ assistant"}
        aria-label={open ? "Close FAQ assistant" : "Open FAQ assistant"}
        data-testid="faq-assistant-toggle"
      >
        {open ? <X size={19} /> : <MessageCircle size={20} />}
      </button>
    </div>
  );
};
