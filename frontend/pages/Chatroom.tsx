// frontend/pages/Chatroom.tsx
// Module C — Multi-Agent Chatroom UI

import React, { useState, useEffect, useRef, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { rolesApi } from "../api/client";
import type { AgentRole } from "../api/client";

const SOCKET_SERVER = import.meta.env.VITE_CHATROOM_URL || "http://localhost:5001";

interface ChatMessage {
  id: string;
  from: string;
  agentId?: string;
  to: string;
  text: string;
  type: "text" | "mention" | "system";
  timestamp: string;
  isOwn?: boolean;
}

interface OnlineAgent {
  agentId: string;
  agentName: string;
}

export default function Chatroom() {
  const [roles, setRoles] = useState<AgentRole[]>([]);
  const [selectedAgents, setSelectedAgents] = useState<string[]>([]);
  const [connected, setConnected] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [onlineAgents, setOnlineAgents] = useState<OnlineAgent[]>([]);
  const [input, setInput] = useState("");
  const [mentionQuery, setMentionQuery] = useState("");
  const [showMentions, setShowMentions] = useState(false);
  const [room] = useState("default");
  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const MY_AGENT_ID = "user-" + Math.random().toString(36).slice(2, 8);

  // Load roles for agent selector
  useEffect(() => {
    rolesApi.list().then(setRoles).catch(() => setRoles([]));
  }, []);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Socket.IO connection
  useEffect(() => {
    if (selectedAgents.length === 0) {
      socketRef.current?.disconnect();
      setConnected(false);
      return;
    }

    const socket = io(SOCKET_SERVER, { transports: ["websocket"] });
    socketRef.current = socket;

    socket.on("connect", () => {
      setConnected(true);
      // Join as multiple agents (for demo, join as first selected)
      const firstAgent = roles.find(r => selectedAgents.includes(r.id));
      socket.emit("room:join", {
        agentId: MY_AGENT_ID,
        agentName: firstAgent?.name || "User",
        room,
      });
    });

    socket.on("disconnect", () => {
      setConnected(false);
    });

    socket.on("message:receive", (msg: ChatMessage) => {
      setMessages(prev => [...prev, { ...msg, isOwn: msg.agentId === MY_AGENT_ID }]);
    });

    socket.on("agents:list", (data: { agents: OnlineAgent[] }) => {
      setOnlineAgents(data.agents || []);
    });

    socket.on("agent:left", (data: { agentId: string; agentName: string }) => {
      setMessages(prev => [...prev, {
        id: "sys-" + Date.now(),
        from: "System",
        text: `${data.agentName} 離開了聊天室`,
        type: "system",
        timestamp: new Date().toISOString(),
      }]);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [selectedAgents.length]);

  function handleMention(query: string) {
    setMentionQuery(query);
    setShowMentions(query.length > 0);
  }

  const filteredMentions = onlineAgents.filter(a =>
    a.agentName.toLowerCase().includes(mentionQuery.toLowerCase())
  );

  function insertMention(name: string) {
    setInput(prev => prev.replace(/@\w*$/, `@${name} `));
    setShowMentions(false);
    setMentionQuery("");
  }

  function sendMessage() {
    if (!input.trim() || !socketRef.current) return;

    // Parse @mentions
    const mentionMatches = input.match(/@(\w+)/g) || [];
    const mentions = mentionMatches.map(m => m.slice(1));

    socketRef.current.emit("message:send", {
      room,
      text: input,
      type: mentions.length > 0 ? "mention" : "text",
    });

    setMessages(prev => [...prev, {
      id: "local-" + Date.now(),
      from: "You",
      agentId: MY_AGENT_ID,
      to: "all",
      text: input,
      type: mentions.length > 0 ? "mention" : "text",
      timestamp: new Date().toISOString(),
      isOwn: true,
    }]);
    setInput("");
  }

  function formatTime(ts: string) {
    try {
      return new Date(ts).toLocaleTimeString("zh-TW", { hour: "2-digit", minute: "2-digit" });
    } catch {
      return "";
    }
  }

  return (
    <div className="flex h-[calc(100vh-64px)] max-w-7xl mx-auto">
      {/* Agent Selector Sidebar */}
      <div className="w-56 bg-gray-50 border-r border-gray-200 p-4 flex-shrink-0 overflow-y-auto">
        <h2 className="text-sm font-bold text-gray-700 mb-3">選擇參與 Agent</h2>
        <div className="space-y-1.5">
          {roles.map(role => (
            <label key={role.id}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition text-sm
                ${selectedAgents.includes(role.id)
                  ? "bg-blue-100 border border-blue-300 text-blue-800"
                  : "bg-white border border-gray-200 hover:bg-gray-50"}`}>
              <input type="checkbox"
                checked={selectedAgents.includes(role.id)}
                onChange={e => {
                  setSelectedAgents(prev =>
                    e.target.checked
                      ? [...prev, role.id]
                      : prev.filter(id => id !== role.id)
                  );
                }}
                className="rounded accent-blue-600" />
              <img
                src={role.avatarPath || `https://api.dicebear.com/7.x/bottts-neutral/svg?seed=${role.id}`}
                className="w-5 h-5 rounded-full bg-gray-200"
                alt={role.name}
              />
              <span className="truncate">{role.name}</span>
            </label>
          ))}
        </div>

        {/* Online agents */}
        {onlineAgents.length > 0 && (
          <div className="mt-6">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">在線 Agent</h3>
            <div className="space-y-1">
              {onlineAgents.map(a => (
                <div key={a.agentId} className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full flex-shrink-0" />
                  <span className="text-xs text-gray-700 truncate">{a.agentName}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Connection status */}
        <div className="mt-6">
          <div className={`flex items-center gap-1.5 text-xs font-medium
            ${connected ? "text-green-600" : "text-gray-400"}`}>
            <span className={`w-2 h-2 rounded-full ${connected ? "bg-green-500" : "bg-gray-300"}`} />
            {connected ? "已連線" : "未連線"}
          </div>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Chat Header */}
        <div className="px-6 py-3 border-b border-gray-200 bg-white flex items-center justify-between">
          <div>
            <h1 className="font-bold text-gray-900">多 Agent 聊天室</h1>
            <p className="text-xs text-gray-500">
              {selectedAgents.length} 個 Agent 參與中 · 房間：{room}
            </p>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
          {selectedAgents.length === 0 && (
            <div className="text-center text-gray-400 mt-16 text-sm">
              左側勾選要參與聊天的 Agent 以開始
            </div>
          )}

          {messages.map(msg => (
            <div key={msg.id} className={`flex ${msg.isOwn ? "justify-end" : "justify-start"}`}>
              {msg.type === "system" ? (
                <div className="w-full text-center text-xs text-gray-400 py-1">
                  {msg.text}
                </div>
              ) : (
                <div className={`max-w-[70%] ${msg.isOwn ? "order-2" : ""}`}>
                  {!msg.isOwn && (
                    <div className="text-xs font-medium text-gray-600 mb-0.5 ml-1">
                      {msg.from}
                    </div>
                  )}
                  <div className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed
                    ${msg.isOwn
                      ? "bg-blue-600 text-white rounded-br-md"
                      : "bg-white border border-gray-200 text-gray-800 rounded-bl-md shadow-sm"}`}>
                    {msg.text}
                  </div>
                  <div className={`text-xs text-gray-400 mt-0.5 ${msg.isOwn ? "text-right mr-1" : "ml-1"}`}>
                    {formatTime(msg.timestamp)}
                  </div>
                </div>
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-gray-200 bg-white">
          {showMentions && filteredMentions.length > 0 && (
            <div className="mb-2 bg-white border border-gray-200 rounded-lg shadow-md p-2 max-h-32 overflow-y-auto">
              {filteredMentions.map(a => (
                <button key={a.agentId}
                  onClick={() => insertMention(a.agentName)}
                  className="w-full text-left px-3 py-1.5 text-sm hover:bg-blue-50 rounded-lg flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                  {a.agentName}
                </button>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <input
                value={input}
                onChange={e => { setInput(e.target.value); handleMention(e.target.value.split(/@\S*$/).pop() || ""); }}
                onKeyDown={e => {
                  if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
                  if (e.key === "Escape") setShowMentions(false);
                }}
                placeholder="輸入訊息…使用 @ 名稱提及 Agent"
                disabled={!connected}
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              />
            </div>
            <button
              onClick={sendMessage}
              disabled={!connected || !input.trim()}
              className="px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed font-medium text-sm"
            >
              發送
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
