import React, { useState, useEffect } from "react";
import axios from "axios";
import Voice from "../components/Voice.jsx";
import Calculator from "../components/Calculator.jsx";
import OCR from "../components/OCR.jsx";

export default function Dashboard() {
  const [mode, setMode] = useState("voice");
  const [bills, setBills] = useState([]);
  const [userName, setUserName] = useState("User");
  const [expandedBill, setExpandedBill] = useState(null);
  const [stats, setStats] = useState({ total: 0, count: 0, avg: 0, lastBill: null });

  // ---- Fetch Bills ----
  const fetchBills = async () => {
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/bills`,
        {
          headers: { Authorization: "Bearer " + localStorage.getItem("token") },
        }
      );
      const billsData = res.data || [];
      setBills(billsData);
      
      // Calculate stats
      const total = billsData.reduce((s, b) => s + (b.total || 0), 0);
      const count = billsData.length;
      const avg = count > 0 ? total / count : 0;
      const lastBill = billsData.length > 0 ? billsData[0] : null;
      
      setStats({ total: Number(total.toFixed(2)), count, avg: Number(avg.toFixed(2)), lastBill });
    } catch (e) {
      console.error("Failed to fetch bills:", e);
    }
  };

  useEffect(() => {
    fetchBills();
    try {
      const token = localStorage.getItem("token");
      if (token) {
        const decoded = JSON.parse(atob(token.split(".")[1]));
        setUserName(decoded.name || "User");
      }
    } catch {}
  }, []);

  // ---- Logout ----
  const handleLogout = () => {
    if (confirm("Are you sure you want to logout?")) {
      localStorage.removeItem("token");
      window.location.href = "/";
    }
  };

  // ---- Delete Bill ----
  const deleteBill = async (id) => {
    if (!confirm("Delete this bill permanently?")) return;
    try {
      await axios.delete(
        `${import.meta.env.VITE_API_URL}/bills/${id}`,
        {
          headers: { Authorization: "Bearer " + localStorage.getItem("token") },
        }
      );
      fetchBills();
    } catch (e) {
      alert("Delete failed");
    }
  };

  const modeConfig = {
    voice: {
      icon: "🎤",
      label: "Voice Input",
      color: "from-purple-600 to-pink-600",
      description: "Speak to add items and perform calculations",
    },
    manual: {
      icon: "⌨️",
      label: "Manual Entry",
      color: "from-blue-600 to-cyan-600",
      description: "Manually enter items and use the calculator",
    },
    image: {
      icon: "🖼️",
      label: "OCR Scanning",
      color: "from-indigo-600 to-blue-600",
      description: "Upload bill/receipt images for automatic extraction",
    },
  };

  const currentMode = modeConfig[mode];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white shadow-lg border-b-4 border-gradient-to-r from-purple-500 via-blue-500 to-indigo-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex justify-between items-center">
            <div className="flex-1">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent">
                💼 Smart Billing
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Welcome, <span className="font-semibold text-blue-600">{userName}</span> 👋
              </p>
            </div>
            
            {/* Quick Stats */}
            <div className="hidden md:flex gap-6 mr-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{stats.count}</div>
                <div className="text-xs text-gray-600">Bills</div>
              </div>
              <div className="text-center border-l-2 border-gray-300 pl-6">
                <div className="text-2xl font-bold text-green-600">₹{stats.total.toLocaleString()}</div>
                <div className="text-xs text-gray-600">Total</div>
              </div>
              <div className="text-center border-l-2 border-gray-300 pl-6">
                <div className="text-2xl font-bold text-purple-600">₹{stats.avg.toLocaleString()}</div>
                <div className="text-xs text-gray-600">Average</div>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-700 text-white font-semibold px-6 py-2 rounded-lg shadow-md transition transform hover:scale-105 active:scale-95"
            >
              🚪 Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Mode Selector */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            ⚙️ Choose Input Method
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.entries(modeConfig).map(([key, config]) => (
              <button
                key={key}
                onClick={() => setMode(key)}
                className={`p-6 rounded-xl shadow-lg transition transform hover:scale-105 border-4 cursor-pointer ${
                  mode === key
                    ? `bg-gradient-to-br ${config.color} text-white border-white shadow-2xl scale-105`
                    : "bg-white text-gray-700 border-gray-200 hover:border-gray-400"
                }`}
              >
                <div className="text-4xl mb-2">{config.icon}</div>
                <div className="text-xl font-bold">{config.label}</div>
                <div className="text-sm mt-2 opacity-90">{config.description}</div>
              </button>
            ))}
          </div>
        </section>

        {/* Current Mode Banner */}
        <section className="mb-6">
          <div
            className={`bg-gradient-to-r ${currentMode.color} text-white p-6 rounded-xl shadow-lg border-4 border-white`}
          >
            <div className="flex items-center gap-3">
              <span className="text-4xl animate-bounce">{currentMode.icon}</span>
              <div>
                <h3 className="text-2xl font-bold">{currentMode.label}</h3>
                <p className="text-sm opacity-90">{currentMode.description}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Input Component */}
        <section className="mb-8">
          <div className="bg-white rounded-xl shadow-2xl p-6 md:p-8 border-2 border-gray-100">
            {mode === "voice" && <Voice onSaved={fetchBills} />}
            {mode === "manual" && <Calculator onSaved={fetchBills} />}
            {mode === "image" && <OCR onSaved={fetchBills} />}
          </div>
        </section>

        {/* Bills Statistics Section */}
        {bills.length > 0 && (
          <section className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-xl shadow-lg">
              <div className="text-4xl font-bold mb-2">{stats.count}</div>
              <div className="text-sm opacity-90">Total Bills Created</div>
              <div className="mt-3 text-xs opacity-75">📊 Tracking all transactions</div>
            </div>
            <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-6 rounded-xl shadow-lg">
              <div className="text-4xl font-bold mb-2">₹{stats.total.toLocaleString()}</div>
              <div className="text-sm opacity-90">Total Amount</div>
              <div className="mt-3 text-xs opacity-75">💰 Sum of all bills</div>
            </div>
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-6 rounded-xl shadow-lg">
              <div className="text-4xl font-bold mb-2">₹{stats.avg.toLocaleString()}</div>
              <div className="text-sm opacity-90">Average per Bill</div>
              <div className="mt-3 text-xs opacity-75">📈 Mean transaction value</div>
            </div>
          </section>
        )}

        {/* Bills History */}
        <section>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-gray-800">
              📋 Your Bills ({bills.length})
            </h2>
            {bills.length > 0 && (
              <button
                onClick={fetchBills}
                className="text-blue-600 hover:text-blue-800 font-semibold text-sm bg-blue-50 px-4 py-2 rounded-lg transition"
              >
                🔄 Refresh
              </button>
            )}
          </div>

          {bills.length === 0 ? (
            <div className="bg-white rounded-xl shadow-lg p-12 text-center border-2 border-dashed border-gray-300">
              <div className="text-6xl mb-4">📭</div>
              <p className="text-xl text-gray-600 font-semibold">
                No bills yet. Create your first bill!
              </p>
              <p className="text-gray-500 mt-2">
                Use Voice, Manual, or OCR mode to add items and save bills.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {bills.map((b) => (
                <div
                  key={b._id}
                  className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition transform hover:scale-105 border-2 border-transparent hover:border-blue-300 group"
                >
                  {/* Bill Header */}
                  <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-4 group-hover:from-blue-600 group-hover:to-indigo-700 transition">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="text-sm opacity-90">
                          📅 {new Date(b.createdAt).toLocaleDateString()}
                        </div>
                        <div className="text-2xl font-bold mt-1">
                          ₹{(b.total || 0).toFixed(2)}
                        </div>
                      </div>
                      <div className="text-right text-sm opacity-90">
                        🕐 {new Date(b.createdAt).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>

                  {/* Bill Content */}
                  <div className="p-4">
                    <div className="mb-3">
                      <span className="inline-block bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-semibold">
                        {b.items?.length || 0} items
                      </span>
                    </div>

                    {/* Items Preview */}
                    <div className="max-h-48 overflow-auto mb-4">
                      {b.items && b.items.length > 0 ? (
                        <ul className="space-y-1 text-sm">
                          {b.items.slice(0, 3).map((item, i) => (
                            <li key={i} className="flex justify-between text-gray-700 hover:text-blue-600">
                              <span className="font-medium">{item.name}</span>
                              <span className="text-gray-600">
                                {item.qty} × ₹{item.price.toFixed(2)} = <strong>₹{(item.qty * item.price).toFixed(2)}</strong>
                              </span>
                            </li>
                          ))}
                          {b.items.length > 3 && (
                            <li className="text-gray-500 italic">
                              +{b.items.length - 3} more items
                            </li>
                          )}
                        </ul>
                      ) : (
                        <p className="text-gray-500 text-center py-4">No items</p>
                      )}
                    </div>

                    {/* Expand/Delete Buttons */}
                    <div className="flex gap-2 pt-2 border-t border-gray-200">
                      <button
                        onClick={() =>
                          setExpandedBill(expandedBill === b._id ? null : b._id)
                        }
                        className="flex-1 bg-blue-100 hover:bg-blue-200 text-blue-700 font-semibold py-2 rounded-lg transition text-sm"
                      >
                        {expandedBill === b._id ? "▼ Hide" : "► View All"}
                      </button>
                      <button
                        onClick={() => deleteBill(b._id)}
                        className="flex-1 bg-red-100 hover:bg-red-200 text-red-700 font-semibold py-2 rounded-lg transition text-sm"
                      >
                        🗑 Delete
                      </button>
                    </div>

                    {/* Expanded View */}
                    {expandedBill === b._id && (
                      <div className="mt-4 pt-4 border-t-2 border-gray-200 bg-gray-50 p-4 rounded-lg">
                        <h4 className="font-bold text-gray-800 mb-3">📦 All Items:</h4>
                        <div className="space-y-2 max-h-64 overflow-auto">
                          {b.items && b.items.map((item, i) => (
                            <div
                              key={i}
                              className="flex justify-between bg-white p-2 rounded border border-gray-200 text-sm"
                            >
                              <div>
                                <div className="font-semibold text-gray-800">{item.name}</div>
                                <div className="text-xs text-gray-600">
                                  Qty: {item.qty} | Rate: ₹{item.price.toFixed(2)}
                                </div>
                              </div>
                              <div className="text-right font-bold text-blue-600">
                                ₹{(item.qty * item.price).toFixed(2)}
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="mt-3 pt-3 border-t-2 border-gray-300 bg-white p-3 rounded font-bold text-lg text-right">
                          💰 Total: ₹{(b.total || 0).toFixed(2)}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Footer */}
      <footer className="mt-12 bg-gray-800 text-white py-6 text-center">
        <p className="text-sm opacity-75">
          Smart Billing © 2025 | All bills are securely stored in your 🩷 database
        </p>
      </footer>
    </div>
  );
}
