import axios from "axios";
import {
  Bot,
  FileText,
  MessageSquare,
  Send,
  Sparkles,
  Trash2,
  User,
} from "lucide-react";
import {
  type FormEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import { useSearchParams } from "react-router-dom";

import LoadingSpinner from "../components/LoadingSpinner";
import {
  askContractQuestion,
  clearChatHistory,
  getChatHistory,
  getContracts,
} from "../services/api";
import type {
  ChatSource,
  Contract,
} from "../types";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: ChatSource[];
  disclaimer?: string;
  createdAt?: string;
}

function ChatPage() {
  const [searchParams, setSearchParams] =
    useSearchParams();

  const [contracts, setContracts] =
    useState<Contract[]>([]);

  const [question, setQuestion] =
    useState("");

  const [messages, setMessages] =
    useState<ChatMessage[]>([]);

  const [isLoadingContracts, setIsLoadingContracts] =
    useState(true);

  const [isLoadingHistory, setIsLoadingHistory] =
    useState(false);

  const [isSending, setIsSending] =
    useState(false);

  const [isClearing, setIsClearing] =
    useState(false);

  const [error, setError] =
    useState("");

  const messagesEndRef =
    useRef<HTMLDivElement | null>(null);

  const selectedContractId =
    searchParams.get("contractId") ?? "";

  useEffect(() => {
    async function loadContracts() {
      try {
        setIsLoadingContracts(true);
        setError("");

        const response = await getContracts();

        setContracts(response.contracts);
      } catch (loadError) {
        console.error(
          "Unable to load contracts:",
          loadError,
        );

        setError("Unable to load contracts.");
      } finally {
        setIsLoadingContracts(false);
      }
    }

    void loadContracts();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages, isSending]);

  useEffect(() => {
    async function loadHistory() {
      if (!selectedContractId) {
        setMessages([]);
        return;
      }

      try {
        setIsLoadingHistory(true);
        setError("");

        const response =
          await getChatHistory(
            selectedContractId,
          );

        const savedMessages: ChatMessage[] =
          response.history.flatMap((item) => [
            {
              id: `user-${item.chat_id}`,
              role: "user" as const,
              content: item.question,
              createdAt: item.created_at,
            },
            {
              id: `assistant-${item.chat_id}`,
              role: "assistant" as const,
              content: item.answer,
              sources: item.sources,
              createdAt: item.created_at,
              disclaimer:
                "This AI-generated response is for informational purposes only and is not legal advice.",
            },
          ]);

        setMessages(savedMessages);
      } catch (historyError) {
        console.error(
          "Unable to load chat history:",
          historyError,
        );

        setMessages([]);
        setError(
          "Unable to load saved chat history.",
        );
      } finally {
        setIsLoadingHistory(false);
      }
    }

    void loadHistory();
  }, [selectedContractId]);

  function handleContractChange(
    contractId: string,
  ) {
    setQuestion("");
    setMessages([]);
    setError("");

    if (contractId) {
      setSearchParams({
        contractId,
      });
    } else {
      setSearchParams({});
    }
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const trimmedQuestion = question.trim();

    if (!selectedContractId) {
      setError("Please select a contract.");
      return;
    }

    if (!trimmedQuestion) {
      setError("Please enter a question.");
      return;
    }

    const temporaryUserId =
      `user-${Date.now()}-${Math.random()}`;

    const userMessage: ChatMessage = {
      id: temporaryUserId,
      role: "user",
      content: trimmedQuestion,
      createdAt: new Date().toISOString(),
    };

    setMessages((currentMessages) => [
      ...currentMessages,
      userMessage,
    ]);

    setQuestion("");
    setError("");

    try {
      setIsSending(true);

      const response =
        await askContractQuestion(
          selectedContractId,
          trimmedQuestion,
          5,
        );

      const assistantMessage: ChatMessage = {
        id: `assistant-${response.chat_id}`,
        role: "assistant",
        content: response.answer,
        sources: response.sources,
        disclaimer: response.disclaimer,
        createdAt: response.created_at,
      };

      setMessages((currentMessages) => [
        ...currentMessages,
        assistantMessage,
      ]);
    } catch (chatError) {
      console.error(
        "Unable to generate answer:",
        chatError,
      );

      setMessages((currentMessages) =>
        currentMessages.filter(
          (message) =>
            message.id !== temporaryUserId,
        ),
      );

      if (axios.isAxiosError(chatError)) {
        setError(
          chatError.response?.data?.detail
            ?? "Unable to generate an answer.",
        );
      } else {
        setError(
          "Unable to generate an answer.",
        );
      }
    } finally {
      setIsSending(false);
    }
  }

  async function handleClearHistory() {
    if (!selectedContractId) {
      return;
    }

    const shouldClear = window.confirm(
      "Clear all chat history for this contract?",
    );

    if (!shouldClear) {
      return;
    }

    try {
      setIsClearing(true);
      setError("");

      await clearChatHistory(
        selectedContractId,
      );

      setMessages([]);
    } catch (clearError) {
      console.error(
        "Unable to clear chat history:",
        clearError,
      );

      if (axios.isAxiosError(clearError)) {
        setError(
          clearError.response?.data?.detail
            ?? "Unable to clear chat history.",
        );
      } else {
        setError(
          "Unable to clear chat history.",
        );
      }
    } finally {
      setIsClearing(false);
    }
  }

  const suggestedQuestions = [
    "What are the payment terms?",
    "What are the termination conditions?",
    "Does this agreement renew automatically?",
    "What are the major contract risks?",
    "What obligations does the supplier have?",
  ];

  if (isLoadingContracts) {
    return (
      <LoadingSpinner text="Loading contracts..." />
    );
  }

  return (
    <section className="chat-page">
      <div className="page-heading">
        <div>
          <h2>AI Contract Chat</h2>

          <p>
            Ask questions answered from the selected
            contract.
          </p>
        </div>
      </div>

      <article className="chat-contract-selector">
        <label>
          Active Contract

          <select
            value={selectedContractId}
            onChange={(event) =>
              handleContractChange(
                event.target.value,
              )
            }
          >
            <option value="">
              Select a contract
            </option>

            {contracts.map((contract) => (
              <option
                key={contract.contract_id}
                value={contract.contract_id}
              >
                {contract.filename}
              </option>
            ))}
          </select>
        </label>

        <div className="chat-status">
          <span
            className={
              selectedContractId
                ? "status-dot active"
                : "status-dot"
            }
          />

          {selectedContractId
            ? "Contract ready"
            : "No contract selected"}
        </div>
      </article>

      <div className="chat-layout">
        <article className="chat-window">
          <div className="chat-window-header">
            <div className="chat-window-title">
              <div className="chat-bot-avatar">
                <Bot size={22} />
              </div>

              <div>
                <h3>LegalAI Assistant</h3>

                <p>
                  Powered by Groq and contract RAG
                </p>
              </div>
            </div>

            <button
              type="button"
              className="secondary-button chat-clear-button"
              disabled={
                !selectedContractId
                || messages.length === 0
                || isClearing
              }
              onClick={() =>
                void handleClearHistory()
              }
            >
              <Trash2 size={16} />

              {isClearing
                ? "Clearing..."
                : "Clear"}
            </button>
          </div>

          <div className="chat-messages">
            {isLoadingHistory ? (
              <LoadingSpinner text="Loading chat history..." />
            ) : messages.length === 0 ? (
              <div className="chat-welcome">
                <Sparkles size={42} />

                <h3>Ask about your contract</h3>

                <p>
                  Answers are generated only from the
                  retrieved contract content.
                </p>

                <div className="chat-suggestions">
                  {suggestedQuestions.map(
                    (suggestion) => (
                      <button
                        key={suggestion}
                        type="button"
                        disabled={
                          !selectedContractId
                          || isSending
                        }
                        onClick={() =>
                          setQuestion(suggestion)
                        }
                      >
                        {suggestion}
                      </button>
                    ),
                  )}
                </div>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`chat-message-row ${
                    message.role
                  }`}
                >
                  <div className="message-avatar">
                    {message.role === "user" ? (
                      <User size={18} />
                    ) : (
                      <Bot size={18} />
                    )}
                  </div>

                  <div className="message-content">
                    <div className="message-bubble">
                      <p>{message.content}</p>
                    </div>

                    {message.createdAt && (
                      <span className="message-time">
                        {new Date(
                          message.createdAt,
                        ).toLocaleString()}
                      </span>
                    )}

                    {message.sources
                      && message.sources.length > 0 && (
                        <div className="message-sources">
                          <strong>
                            Sources
                          </strong>

                          {message.sources.map(
                            (source) => (
                              <details
                                key={`${message.id}-${source.source_number}`}
                                className="source-card"
                              >
                                <summary>
                                  <span>
                                    Source{" "}
                                    {
                                      source.source_number
                                    }
                                  </span>

                                  <span>
                                    Chunk{" "}
                                    {
                                      source.chunk_number
                                    }
                                  </span>
                                </summary>

                                <p>
                                  {source.text}
                                </p>

                                <div className="source-meta">
                                  <span>
                                    <FileText
                                      size={14}
                                    />

                                    {
                                      source.filename
                                    }
                                  </span>

                                  <span>
                                    Similarity:{" "}
                                    {source.similarity_score
                                      !== null
                                      ? `${Math.round(
                                          source.similarity_score
                                          * 100,
                                        )}%`
                                      : "N/A"}
                                  </span>
                                </div>
                              </details>
                            ),
                          )}
                        </div>
                      )}

                    {message.disclaimer && (
                      <p className="chat-disclaimer">
                        {message.disclaimer}
                      </p>
                    )}
                  </div>
                </div>
              ))
            )}

            {isSending && (
              <div className="chat-message-row assistant">
                <div className="message-avatar">
                  <Bot size={18} />
                </div>

                <div className="typing-indicator">
                  <span />
                  <span />
                  <span />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {error && (
            <div className="error-message chat-error">
              {error}
            </div>
          )}

          <form
            className="chat-input-form"
            onSubmit={handleSubmit}
          >
            <textarea
              value={question}
              placeholder={
                selectedContractId
                  ? "Ask a question about this contract..."
                  : "Select a contract before asking a question..."
              }
              rows={2}
              disabled={
                !selectedContractId
                || isSending
                || isLoadingHistory
              }
              onChange={(event) =>
                setQuestion(event.target.value)
              }
              onKeyDown={(event) => {
                if (
                  event.key === "Enter"
                  && !event.shiftKey
                ) {
                  event.preventDefault();

                  event.currentTarget.form
                    ?.requestSubmit();
                }
              }}
            />

            <button
              type="submit"
              className="chat-send-button"
              aria-label="Send question"
              disabled={
                !selectedContractId
                || !question.trim()
                || isSending
                || isLoadingHistory
              }
            >
              <Send size={20} />
            </button>
          </form>
        </article>

        <aside className="chat-info-panel">
          <article className="content-card">
            <h3>
              <MessageSquare size={19} />
              How It Works
            </h3>

            <div className="process-list">
              <span>
                1. Your question is converted to an
                embedding.
              </span>

              <span>
                2. ChromaDB retrieves relevant contract
                chunks.
              </span>

              <span>
                3. Groq generates a grounded answer.
              </span>

              <span>
                4. Supporting sources are displayed.
              </span>

              <span>
                5. Chat history is saved in PostgreSQL.
              </span>
            </div>
          </article>

          <article className="content-card">
            <h3>Important Notice</h3>

            <p className="muted-text">
              LegalAI provides automated analysis for
              informational purposes only. It does not
              replace advice from a qualified legal
              professional.
            </p>
          </article>
        </aside>
      </div>
    </section>
  );
}

export default ChatPage;