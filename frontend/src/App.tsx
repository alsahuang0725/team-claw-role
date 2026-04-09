import React from "react";
import { BrowserRouter, Routes, Route, Link, useLocation } from "react-router-dom";
import Roles from "./pages/Roles";
import Policies from "./pages/Policies";
import Chatroom from "./pages/Chatroom";
import VoiceCatalog from "./pages/VoiceCatalog";

const NAV_ITEMS = [
  { path: "/roles", label: "角色總表", icon: "🤖" },
  { path: "/policies", label: "政策設定", icon: "🔐" },
  { path: "/chatroom", label: "共同聊天室", icon: "💬" },
  { path: "/voices", label: "語音系統", icon: "🔊" },
];

function NavBar() {
  const loc = useLocation();
  return (
    <nav className="bg-white border-b border-gray-200 px-6 py-3 flex items-center gap-6">
      <div className="font-bold text-indigo-600 text-lg">team-claw-role</div>
      <div className="flex gap-1">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              loc.pathname === item.path
                ? "bg-indigo-50 text-indigo-700"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            <span className="mr-1">{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50">
        <NavBar />
        <main className="p-6">
          <Routes>
            <Route path="/" element={
              <div className="text-center mt-20 text-gray-500">
                <h1 className="text-3xl font-bold text-gray-800 mb-4">team-claw-role</h1>
                <p className="text-lg">Enterprise Multi-Agent Dashboard</p>
                <div className="mt-8 space-y-2 text-sm text-gray-400">
                  <p>v0.1.0 · development</p>
                  <p>Powered by NemoClaw + OpenClaw</p>
                </div>
              </div>
            } />
            <Route path="/roles" element={<Roles />} />
            <Route path="/policies" element={<Policies />} />
            <Route path="/chatroom" element={<Chatroom />} />
            <Route path="/voices" element={<VoiceCatalog />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
