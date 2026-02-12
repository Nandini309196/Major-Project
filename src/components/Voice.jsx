import React, { useRef, useState, useEffect } from "react";
import axios from "axios";
import html2pdf from "html2pdf.js";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

export default function Voice({ onSaved }) {
  const recRef = useRef(null);
  const [transcript, setTranscript] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [items, setItems] = useState([]);
  const [expression, setExpression] = useState("");
  const [calcResults, setCalcResults] = useState([]);
  const [billHistory, setBillHistory] = useState([]);
  const [confidence, setConfidence] = useState(0);

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech Recognition not supported in your browser");
      return;
    }

    const rec = new SpeechRecognition();
    rec.continuous = true;
    rec.interimResults = false;
    rec.lang = "en-US";

    rec.onstart = () => setIsListening(true);
    rec.onend = () => setIsListening(false);

    rec.onresult = (e) => {
      let finalTranscript = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const trans = e.results[i][0].transcript;
        if (e.results[i].isFinal) {
          finalTranscript += trans + " ";
        }
      }

      if (finalTranscript) {
        const text = finalTranscript.trim().toLowerCase();
        setTranscript((prev) => prev + " " + text);
        processVoiceCommand(text);
      }
    };

    rec.onerror = (e) => {
      console.error("Speech recognition error:", e.error);
      alert("Voice input error: " + e.error);
    };

    recRef.current = rec;

    return () => {
      try {
        rec.stop();
      } catch {}
    };
  }, []);

  // ---- Advanced Voice to Math Conversion ----
  const voiceToMath = (text) => {
    const numberWords = {
      zero: "0", one: "1", two: "2", three: "3", four: "4",
      five: "5", six: "6", seven: "7", eight: "8", nine: "9",
      ten: "10", eleven: "11", twelve: "12", thirteen: "13",
      fourteen: "14", fifteen: "15", sixteen: "16", seventeen: "17",
      eighteen: "18", nineteen: "19", twenty: "20",
      thirty: "30", forty: "40", fifty: "50", sixty: "60",
      seventy: "70", eighty: "80", ninety: "90", hundred: "100",
      thousand: "1000"
    };

    let expr = text;
    Object.entries(numberWords).forEach(([word, num]) => {
      expr = expr.replace(new RegExp(`\\b${word}\\b`, "g"), num);
    });

    expr = expr
      .replace(/\bplus\b/g, "+")
      .replace(/\bminus\b/g, "-")
      .replace(/\btimes\b/g, "*")
      .replace(/\bmultiplied by\b/g, "*")
      .replace(/\binto\b/g, "*")
      .replace(/\bdivide\b/g, "/")
      .replace(/\bdivided by\b/g, "/")
      .replace(/\bmod\b/g, "%")
      .replace(/\bmodulo\b/g, "%")
      .replace(/\bpower\b/g, "**")
      .replace(/\bto the power of\b/g, "**")
      .replace(/\bpoint\b/g, ".")
      .replace(/\bopen bracket\b/g, "(")
      .replace(/\bclose bracket\b/g, ")")
      .replace(/\bopen paren\b/g, "(")
      .replace(/\bclose paren\b/g, ")")
      .replace(/\bsqrt\b/g, "sqrt(")
      .replace(/\bsquare root\b/g, "sqrt(")
      .replace(/\bsin\b/g, "sin(")
      .replace(/\bcos\b/g, "cos(")
      .replace(/\btan\b/g, "tan(")
      .replace(/\blog\b/g, "log(")
      .replace(/\bln\b/g, "ln(")
      .replace(/\bpi\b/g, Math.PI.toString())
      .replace(/\bpercent\b/g, "%");

    return expr;
  };

  // ---- Advanced Item Parser from Voice ----
  const parseItemFromVoice = (text) => {
    // Patterns: "item_name quantity amount" or "amount for quantity item_name" or "item_name amount"
    // Examples: "bread 2 fifty" = 2 bread @ 50, "hundred for 5 milk" = 5 milk @ 100, "butter hundred" = 1 butter @ 100
    
    const numberWords = {
      zero: "0", one: "1", two: "2", three: "3", four: "4", five: "5",
      six: "6", seven: "7", eight: "8", nine: "9", ten: "10",
      eleven: "11", twelve: "12", thirteen: "13", fourteen: "14", fifteen: "15",
      sixteen: "16", seventeen: "17", eighteen: "18", nineteen: "19", twenty: "20",
      thirty: "30", forty: "40", fifty: "50", sixty: "60", seventy: "70",
      eighty: "80", ninety: "90", hundred: "100"
    };

    const words = text.toLowerCase().split(/\s+/);
    const numbers = [];
    const itemWords = [];

    words.forEach((word) => {
      if (numberWords[word]) {
        numbers.push(parseFloat(numberWords[word]));
      } else if (!isNaN(parseFloat(word))) {
        numbers.push(parseFloat(word));
      } else {
        itemWords.push(word);
      }
    });

    if (itemWords.length === 0 || numbers.length === 0) return null;

    let quantity = 1;
    let price = 0;
    let itemName = itemWords.join(" ");

    if (numbers.length === 1) {
      price = numbers[0];
    } else if (numbers.length === 2) {
      quantity = numbers[0];
      price = numbers[1];
    } else if (numbers.length >= 3) {
      quantity = numbers[0];
      price = numbers[1];
    }

    return { name: itemName, qty: Math.max(1, quantity), price: Math.max(0, price) };
  };

  // ---- Math Evaluation ----
  const evaluateExpression = (expr) => {
    try {
      let processed = expr
        .toLowerCase()
        .replace(/\bsqrt\b/g, "Math.sqrt")
        .replace(/\bsin\b/g, "Math.sin")
        .replace(/\bcos\b/g, "Math.cos")
        .replace(/\btan\b/g, "Math.tan")
        .replace(/\blog\b/g, "Math.log10")
        .replace(/\bln\b/g, "Math.log")
        .replace(/\bpow\b/g, "Math.pow")
        .replace(/\babs\b/g, "Math.abs")
        .replace(/\^/g, "**");

      const result = Function('"use strict"; return (' + processed + ")")();
      return Math.round(result * 1000000) / 1000000;
    } catch (e) {
      return null;
    }
  };

  // ---- Process Voice Commands ----
  const processVoiceCommand = (text) => {
    const words = text.split(/\s+/);
    const lowerText = text.toLowerCase();

    // Math calculation check
    const mathKeywords = ["plus", "minus", "times", "divide", "divided by", "mod", "modulo", "power", "sqrt"];
    const hasMathKeyword = mathKeywords.some(k => lowerText.includes(k));

    if (hasMathKeyword) {
      const mathExpr = voiceToMath(lowerText).replace(/\s+/g, "");
      const result = evaluateExpression(mathExpr);
      if (result !== null) {
        setExpression(mathExpr);
        setCalcResults((prev) => [
          { expr: mathExpr, result, time: new Date().toLocaleTimeString() },
          ...prev.slice(0, 9),
        ]);
        speak(`Result is ${result}`);
      }
      return;
    }

    // Clear/Reset commands
    if (["clear", "reset", "remove all"].some(cmd => lowerText.includes(cmd))) {
      setItems([]);
      speak("Items cleared");
      return;
    }

    // Save command
    if (["save", "save bill"].some(cmd => lowerText.includes(cmd))) {
      if (items.length > 0) saveBill();
      return;
    }

    // Show total command
    if (lowerText.includes("total") || lowerText.includes("sum")) {
      const total = items.reduce((s, i) => s + i.qty * i.price, 0);
      speak(`Total bill amount is rupees ${total.toFixed(2)}`);
      return;
    }

    // Add item command
    if (words[0] === "add" || lowerText.includes("add")) {
      const commandText = words.slice(1).join(" ");
      const parsed = parseItemFromVoice(commandText);
      if (parsed) {
        setItems((prev) => [...prev, parsed]);
        speak(`Added ${parsed.qty} ${parsed.name} at rupees ${parsed.price} each`);
        setConfidence(95);
        return;
      }
    }

    // Direct item entry (without "add" keyword)
    const parsed = parseItemFromVoice(lowerText);
    if (parsed && parsed.price > 0) {
      setItems((prev) => [...prev, parsed]);
      speak(`Added ${parsed.qty} ${parsed.name} at rupees ${parsed.price}`);
      setConfidence(90);
    }
  };

  // ---- Text-to-Speech ----
  const speak = (text) => {
    if ("speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1;
      utterance.pitch = 1;
      speechSynthesis.speak(utterance);
    }
  };

  // ---- UI Actions ----
  const toggleListening = () => {
    if (!recRef.current) return;
    if (isListening) {
      recRef.current.stop();
    } else {
      setTranscript("");
      recRef.current.start();
    }
  };

  const stopListening = () => {
    if (recRef.current) recRef.current.stop();
  };

  const removeItem = (i) => {
    setItems((prev) => prev.filter((_, idx) => idx !== i));
  };

  const removeCalcResult = (i) => {
    setCalcResults((prev) => prev.filter((_, idx) => idx !== i));
  };

  // ---- Download Bill as PDF ----
  const downloadBillPDF = () => {
    if (items.length === 0) return alert("No bill to download");
    const billContent = `
      <h1 style="text-align:center; color:#2563eb;">Smart Billing Invoice</h1>
      <hr/>
      <p><strong>Date:</strong> ${new Date().toLocaleString()}</p>
      <table style="width:100%; border-collapse:collapse; margin:20px 0;">
        <tr style="background:#f3f4f6; border:1px solid #d1d5db;">
          <th style="border:1px solid #d1d5db; padding:8px; text-align:left;">Item</th>
          <th style="border:1px solid #d1d5db; padding:8px; text-align:center;">Qty</th>
          <th style="border:1px solid #d1d5db; padding:8px; text-align:right;">Rate</th>
          <th style="border:1px solid #d1d5db; padding:8px; text-align:right;">Amount</th>
        </tr>
        ${items.map(it => `
          <tr style="border:1px solid #d1d5db;">
            <td style="border:1px solid #d1d5db; padding:8px;">${it.name}</td>
            <td style="border:1px solid #d1d5db; padding:8px; text-align:center;">${it.qty}</td>
            <td style="border:1px solid #d1d5db; padding:8px; text-align:right;">₹${it.price.toFixed(2)}</td>
            <td style="border:1px solid #d1d5db; padding:8px; text-align:right;"><strong>₹${(it.qty * it.price).toFixed(2)}</strong></td>
          </tr>
        `).join('')}
      </table>
      <div style="text-align:right; font-size:18px; font-weight:bold; margin-top:20px;">
        Total: ₹${items.reduce((s, i) => s + i.qty * i.price, 0).toFixed(2)}
      </div>
    `;
    
    html2pdf().from(billContent).set({
      margin: 10,
      filename: `voice-bill-${Date.now()}.pdf`,
      html2canvas: { scale: 2 },
      jsPDF: { unit: "mm", format: "a4" }
    }).save();
    speak("Bill downloaded as PDF");
  };

  // ---- Download Bill as Excel ----
  const downloadBillExcel = async () => {
    if (items.length === 0) return alert("No bill to download");
    
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Bill");
    
    sheet.columns = [
      { header: "Item", width: 25 },
      { header: "Quantity", width: 12 },
      { header: "Rate (₹)", width: 12 },
      { header: "Amount (₹)", width: 12 }
    ];
    
    items.forEach(it => {
      sheet.addRow([it.name, it.qty, it.price.toFixed(2), (it.qty * it.price).toFixed(2)]);
    });
    
    const total = items.reduce((s, i) => s + i.qty * i.price, 0);
    sheet.addRow(["", "", "Total:", total.toFixed(2)]);
    
    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer], { type: "application/vnd.ms-excel" }), `voice-bill-${Date.now()}.xlsx`);
    speak("Bill downloaded as Excel");
  };

  // ---- Download Calculations as PDF ----
  const downloadCalcPDF = () => {
    if (calcResults.length === 0) return alert("No calculations to download");
    
    const calcContent = `
      <h1 style="text-align:center; color:#2563eb;">Voice Calculation History</h1>
      <hr/>
      <table style="width:100%; border-collapse:collapse; margin:20px 0;">
        <tr style="background:#f3f4f6; border:1px solid #d1d5db;">
          <th style="border:1px solid #d1d5db; padding:8px;">Expression</th>
          <th style="border:1px solid #d1d5db; padding:8px;">Result</th>
          <th style="border:1px solid #d1d5db; padding:8px;">Time</th>
        </tr>
        ${calcResults.map(c => `
          <tr style="border:1px solid #d1d5db;">
            <td style="border:1px solid #d1d5db; padding:8px;"><code>${c.expr}</code></td>
            <td style="border:1px solid #d1d5db; padding:8px;"><strong>${c.result}</strong></td>
            <td style="border:1px solid #d1d5db; padding:8px;">${c.time}</td>
          </tr>
        `).join('')}
      </table>
    `;
    
    html2pdf().from(calcContent).set({
      margin: 10,
      filename: `voice-calculations-${Date.now()}.pdf`,
      html2canvas: { scale: 2 },
      jsPDF: { unit: "mm", format: "a4" }
    }).save();
    speak("Calculations downloaded as PDF");
  };

  const saveBill = async () => {
    if (items.length === 0) return alert("No items to save");
    const total = items.reduce((s, i) => s + i.qty * i.price, 0);
    try {
      await axios.post(
        `${import.meta.env.VITE_API_URL}/bills`,
        { items, total },
        { headers: { Authorization: "Bearer " + localStorage.getItem("token") } }
      );
      alert("✅ Bill saved successfully!");
      
      // Add to bill history
      setBillHistory(prev => [{
        id: Date.now(),
        items,
        total,
        timestamp: new Date().toLocaleString(),
        source: "Voice"
      }, ...prev.slice(0, 19)]);
      
      setItems([]);
      setTranscript("");
      setExpression("");
      setCalcResults([]);
      speak("Bill saved successfully. Creating digital invoice");
      if (onSaved) onSaved();
    } catch (e) {
      alert("❌ Save failed: " + (e.response?.data?.message || e.message));
      speak("Failed to save bill");
    }
  };

  return (
    <div className="space-y-6">
      {/* Voice Control Section */}
      <div className="bg-gradient-to-br from-purple-50 to-pink-100 p-6 rounded-lg shadow-lg border-2 border-purple-200">
        <h3 className="text-2xl font-bold mb-4 text-gray-800">🎤 Advanced Voice Billing</h3>

        {/* Status Indicator with Confidence */}
        <div className="mb-4 p-4 bg-white rounded-lg border-2 border-purple-300 shadow-md">
          <div className="flex items-center gap-3 mb-3">
            <div
              className={`w-4 h-4 rounded-full ${
                isListening ? "bg-red-500 animate-pulse" : "bg-gray-400"
              }`}
            ></div>
            <span className="font-semibold text-gray-700">
              {isListening ? "🎤 Listening..." : "✓ Ready"}
            </span>
            {confidence > 0 && (
              <span className="ml-auto text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-semibold">
                🎯 {confidence}% Confidence
              </span>
            )}
          </div>
        </div>

        {/* Control Buttons */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
          <button
            onClick={toggleListening}
            className={`font-semibold py-2 px-3 rounded-lg transition transform hover:scale-105 ${
              isListening
                ? "bg-red-600 text-white hover:bg-red-500 shadow-lg"
                : "bg-blue-600 text-white hover:bg-blue-500 shadow-lg"
            }`}
          >
            {isListening ? "⏹ Stop" : "▶ Start"}
          </button>
          <button
            onClick={stopListening}
            className="bg-gray-600 text-white font-semibold py-2 px-3 rounded-lg hover:bg-gray-500 transition shadow-lg"
          >
            ⏸ Pause
          </button>
          <button
            onClick={() => { setTranscript(""); setConfidence(0); }}
            className="bg-orange-600 text-white font-semibold py-2 px-3 rounded-lg hover:bg-orange-500 transition shadow-lg"
          >
            🗑 Clear
          </button>
          <button
            onClick={() => speak("Say items like: add milk two hundred, or calculate like five plus three")}
            className="bg-purple-600 text-white font-semibold py-2 px-3 rounded-lg hover:bg-purple-500 transition shadow-lg"
          >
            ℹ️ Help
          </button>
        </div>

        {/* Transcript Display */}
        <div className="bg-white p-4 rounded-lg border-2 border-purple-200 mb-4 shadow-md">
          <div className="text-sm font-semibold text-gray-600 mb-2">
            📝 Live Transcript:
          </div>
          <div className="text-sm text-gray-700 min-h-24 p-3 bg-purple-50 rounded max-h-32 overflow-auto font-mono border border-purple-100">
            {transcript || "— Your speech will appear here in real-time —"}
          </div>
        </div>

        {/* Voice Help Text */}
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-lg text-sm text-gray-700 border border-purple-200 shadow-md">
          <div className="font-bold mb-2 text-purple-700">💡 Examples:</div>
          <ul className="space-y-1 grid grid-cols-1 md:grid-cols-2 gap-2">
            <li><strong>Items:</strong> "add milk two hundred" (1 milk @ ₹200)</li>
            <li><strong>Items:</strong> "bread 5 fifty" (5 breads @ ₹50)</li>
            <li><strong>Math:</strong> "five plus three" → 8</li>
            <li><strong>Math:</strong> "twenty divided by four" → 5</li>
            <li><strong>Math:</strong> "9 mod 5" → 4</li>
            <li><strong>Commands:</strong> "total", "save", "clear"</li>
          </ul>
        </div>
      </div>

      {/* Calculation Results Section */}
      {calcResults.length > 0 && (
        <div className="bg-gradient-to-br from-yellow-50 to-orange-100 p-6 rounded-lg shadow-lg border-2 border-yellow-300">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-gray-800">
              📊 Calculations ({calcResults.length})
            </h3>
            <button
              onClick={downloadCalcPDF}
              className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-500 transition text-sm font-semibold"
            >
              📥 Download PDF
            </button>
          </div>
          <div className="space-y-2 max-h-60 overflow-auto">
            {calcResults.map((c, i) => (
              <div
                key={i}
                className="flex justify-between items-center bg-white p-3 rounded-lg border border-yellow-300 hover:shadow-md transition"
              >
                <div className="flex-1">
                  <span className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                    {c.expr}
                  </span>
                  <span className="mx-2">=</span>
                  <span className="text-orange-600 font-bold text-lg">{c.result}</span>
                  <span className="text-gray-400 text-xs ml-2">{c.time}</span>
                </div>
                <button
                  onClick={() => removeCalcResult(i)}
                  className="text-red-500 hover:text-red-700 font-bold text-lg ml-2"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Items Section */}
      <div className="bg-gradient-to-br from-green-50 to-emerald-100 p-6 rounded-lg shadow-lg border-2 border-green-300">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-gray-800">📝 Bill Items ({items.length})</h3>
          {items.length > 0 && (
            <span className="text-xl font-bold text-green-600">
              ₹{items.reduce((s, i) => s + i.qty * i.price, 0).toFixed(2)}
            </span>
          )}
        </div>
        {items.length === 0 ? (
          <div className="p-6 text-center text-gray-500 bg-white rounded-lg border border-green-200">
            <div className="text-5xl mb-2">📦</div>
            No items added yet. Say "add [item] [quantity] [price]"
          </div>
        ) : (
          <>
            <div className="space-y-2 mb-4 max-h-64 overflow-auto">
              {items.map((it, i) => (
                <div
                  key={i}
                  className="flex justify-between items-center bg-white p-3 rounded-lg border border-green-300 hover:shadow-md transition"
                >
                  <div className="flex-1">
                    <div className="font-semibold text-gray-800">{it.name}</div>
                    <div className="text-sm text-gray-600">
                      {it.qty} × ₹{it.price.toFixed(2)} = <span className="text-green-600 font-bold">₹{(it.qty * it.price).toFixed(2)}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => removeItem(i)}
                    className="text-red-500 hover:text-red-700 font-bold text-lg"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
            
            {/* Bill Total */}
            <div className="bg-green-600 text-white p-4 rounded-lg font-bold text-lg text-right mb-4 shadow-lg">
              💰 Total: ₹{items.reduce((s, i) => s + i.qty * i.price, 0).toFixed(2)}
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={saveBill}
                className="bg-emerald-600 text-white font-semibold py-3 rounded-lg hover:bg-emerald-500 transition shadow-lg transform hover:scale-105"
              >
                💾 Save Bill to DB
              </button>
              <button
                onClick={downloadBillPDF}
                className="bg-blue-600 text-white font-semibold py-3 rounded-lg hover:bg-blue-500 transition shadow-lg transform hover:scale-105"
              >
                📄 Download PDF
              </button>
              <button
                onClick={downloadBillExcel}
                className="bg-indigo-600 text-white font-semibold py-3 rounded-lg hover:bg-indigo-500 transition shadow-lg transform hover:scale-105"
              >
                📊 Download Excel
              </button>
              <button
                onClick={() => setItems([])}
                className="bg-red-600 text-white font-semibold py-3 rounded-lg hover:bg-red-500 transition shadow-lg"
              >
                🗑 Clear Items
              </button>
            </div>
          </>
        )}
      </div>

      {/* Bill History Section */}
      {billHistory.length > 0 && (
        <div className="bg-gradient-to-br from-blue-50 to-indigo-100 p-6 rounded-lg shadow-lg border-2 border-blue-300">
          <h3 className="text-lg font-bold text-gray-800 mb-4">📋 Recent Bills ({billHistory.length})</h3>
          <div className="space-y-2 max-h-48 overflow-auto">
            {billHistory.map((bill) => (
              <div key={bill.id} className="bg-white p-3 rounded-lg border border-blue-200 text-sm">
                <div className="flex justify-between">
                  <span className="font-semibold">{bill.items.length} items</span>
                  <span className="text-blue-600 font-bold">₹{bill.total.toFixed(2)}</span>
                </div>
                <div className="text-gray-500 text-xs">{bill.timestamp}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
