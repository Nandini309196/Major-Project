import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import html2pdf from "html2pdf.js";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

export default function Calculator({ onSaved }) {
  const [expression, setExpression] = useState("");
  const [history, setHistory] = useState([]);
  const [items, setItems] = useState([]);
  const [name, setName] = useState("");
  const [qty, setQty] = useState(1);
  const [price, setPrice] = useState(0);
  const [undoStack, setUndoStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);
  const historyRef = useRef(null);

  // ------------------------------------------------------------
  // 🗃️ LOAD HISTORY FROM LOCAL STORAGE
  // ------------------------------------------------------------
  useEffect(() => {
    const saved = localStorage.getItem("calc_history");
    if (saved) setHistory(JSON.parse(saved));
  }, []);

  // SAVE HISTORY
  const saveHistoryToLocal = (newHistory) => {
    localStorage.setItem("calc_history", JSON.stringify(newHistory));
  };

  // ------------------------------------------------------------
  // 🔢 EXPRESSION EVALUATION
  // ------------------------------------------------------------
  const evaluateExpression = (expr) => {
    try {
      let processed = expr
        .toLowerCase()
        .replace(/\bsqrt\b/g, "Math.sqrt")
        .replace(/\bpi\b/g, `${Math.PI}`)
        .replace(/\bsin\(/g, "Math.sin(")
        .replace(/\bcos\(/g, "Math.cos(")
        .replace(/\btan\(/g, "Math.tan(")
        .replace(/\blog\(/g, "Math.log10(")
        .replace(/\bln\(/g, "Math.log(")
        .replace(/\bpow\(/g, "Math.pow(")
        .replace(/\babs\(/g, "Math.abs(")
        .replace(/\^/g, "**");

      const result = Function('"use strict"; return (' + processed + ")")();
      return Math.round(result * 1e6) / 1e6;
    } catch {
      return null;
    }
  };

  // ------------------------------------------------------------
  // ➕ ADD MANUAL CALC TO HISTORY
  // ------------------------------------------------------------
  const handleCalculate = () => {
    if (!expression) return;
    const result = evaluateExpression(expression);
    if (result === null) return alert("Invalid Expression!");

    const entry = { expr: expression, result, time: new Date().toLocaleString() };
    const newHistory = [entry, ...history.slice(0, 99)];

    setHistory(newHistory);
    saveHistoryToLocal(newHistory);
    setExpression(result.toString());

    // auto-scroll
    setTimeout(() => {
      if (historyRef.current) historyRef.current.scrollTop = 0;
    }, 100);
  };

  // ------------------------------------------------------------
  // UNDO / REDO
  // ------------------------------------------------------------
  const push = () => {
    setUndoStack((prev) => [...prev, expression]);
    setRedoStack([]);
  };
  const undo = () => {
    if (!undoStack.length) return;
    const prev = undoStack.pop();
    setRedoStack((r) => [...r, expression]);
    setExpression(prev);
  };
  const redo = () => {
    if (!redoStack.length) return;
    const next = redoStack.pop();
    setUndoStack((u) => [...u, expression]);
    setExpression(next);
  };

  const appendValue = (v) => {
    push();
    setExpression((e) => e + v);
  };
  const backspace = () => {
    push();
    setExpression((e) => e.slice(0, -1));
  };
  const clear = () => {
    push();
    setExpression("");
  };

  // ------------------------------------------------------------
  // 🧾 BILL MANAGEMENT
  // ------------------------------------------------------------
  const addItem = () => {
    if (!name.trim()) return alert("Enter item name");

    setItems((prev) => [...prev, { name, qty: Number(qty), price: Number(price) }]);
    setName("");
    setQty(1);
    setPrice(0);
  };

  const removeItem = (i) => {
    setItems((prev) => prev.filter((_, idx) => idx !== i));
  };

  const saveBill = async () => {
    if (!items.length) return alert("No items added!");
    const total = items.reduce((s, i) => s + i.qty * i.price, 0);

    try {
      await axios.post(
        `${import.meta.env.VITE_API_URL}/bills`,
        { items, total },
        { headers: { Authorization: "Bearer " + localStorage.getItem("token") } }
      );

      alert("Bill saved!");
      setItems([]);
      setExpression("");
      onSaved && onSaved();
    } catch (err) {
      alert("Save failed: " + (err.response?.data?.message || err.message));
    }
  };

  // ------------------------------------------------------------
  // 📄 DOWNLOAD HISTORY AS PDF
  // ------------------------------------------------------------
  const downloadPDF = () => {
    const content = document.getElementById("history-section");
    const opt = {
      margin: 10,
      filename: "calculation-history.pdf",
      html2canvas: { scale: 2 },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
    };
    html2pdf().from(content).set(opt).save();
  };

  // ------------------------------------------------------------
  // 📊 DOWNLOAD EXCEL
  // ------------------------------------------------------------
  const downloadExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("History");

    sheet.addRow(["Expression", "Result", "Time"]);
    history.forEach((h) => sheet.addRow([h.expr, h.result, h.time]));

    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), "calculation-history.xlsx");
  };

  // ------------------------------------------------------------
  // 🗑 CLEAR HISTORY
  // ------------------------------------------------------------
  const clearHistory = () => {
    if (!window.confirm("Delete entire history?")) return;
    setHistory([]);
    localStorage.removeItem("calc_history");
  };

  return (
    <div className="space-y-6">

      {/* ------------------- CALCULATOR PANEL ------------------- */}
      <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100 p-6 rounded-xl shadow-lg border-2 border-blue-200">

        <div className="flex justify-between items-center mb-4">
          <h3 className="text-2xl font-bold text-gray-800">🧮 Scientific Calculator</h3>
          <span className="text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-semibold">
            {history.length} calculations
          </span>
        </div>

        <input
          type="text"
          value={expression}
          readOnly
          className="w-full text-right text-4xl font-mono p-4 bg-white border-3 border-blue-400 rounded-lg shadow-md font-bold text-blue-600"
          placeholder="0"
        />

        {/* Quick Stats */}
        {history.length > 0 && (
          <div className="grid grid-cols-3 gap-2 mt-3 text-center">
            <div className="bg-white p-2 rounded border border-blue-200">
              <div className="text-xs text-gray-600">Latest Result</div>
              <div className="text-lg font-bold text-blue-600">{history[0].result}</div>
            </div>
            <div className="bg-white p-2 rounded border border-blue-200">
              <div className="text-xs text-gray-600">Average</div>
              <div className="text-lg font-bold text-green-600">
                {(history.reduce((s, h) => s + h.result, 0) / history.length).toFixed(2)}
              </div>
            </div>
            <div className="bg-white p-2 rounded border border-blue-200">
              <div className="text-xs text-gray-600">Sum</div>
              <div className="text-lg font-bold text-purple-600">
                {history.reduce((s, h) => s + h.result, 0).toFixed(2)}
              </div>
            </div>
          </div>
        )}

        {/* BUTTONS */}
        <div className="grid grid-cols-4 gap-2 mt-4">
          {/* Row 1 - Functions */}
          <button className="btn-red font-bold text-lg" onClick={clear}>C</button>
          <button className="btn-orange font-bold text-lg" onClick={backspace}>⌫</button>
          <button className="btn-yellow font-bold text-lg" onClick={undo}>↶</button>
          <button className="btn-purple font-bold text-lg" onClick={redo}>↷</button>

          {/* Number Pad */}
          {"789/456*123-0.=+".split("").map((ch) =>
            ch === "=" ? (
              <button key={ch} className="btn-green font-bold text-lg col-span-1" onClick={handleCalculate}>=</button>
            ) : ["0", ".", "/", "*", "-", "+"].includes(ch) ? (
              <button key={ch} className="btn-dark font-bold text-lg" onClick={() => appendValue(ch)}>
                {ch === "/" ? "÷" : ch === "*" ? "×" : ch}
              </button>
            ) : (
              <button key={ch} className="btn-dark font-bold text-lg hover:shadow-lg" onClick={() => appendValue(ch)}>
                {ch}
              </button>
            )
          )}
        </div>

        {/* FUNCTIONS */}
        <div className="grid grid-cols-5 gap-2 mt-3">
          {["sqrt(", "sin(", "cos(", "tan(", "log(", "ln(", "abs(", "^", "(", ")"].map(
            (f) => (
              <button className="btn-blue text-sm font-semibold hover:shadow-md py-2" key={f} onClick={() => appendValue(f)}>
                {f.replace("(", "")}
              </button>
            )
          )}
        </div>

        {/* Additional Operations */}
        <div className="grid grid-cols-5 gap-2 mt-2">
          {["π", "e", "!", "∛", "log₂"].map((op, idx) => {
            const ops = ["Math.PI", "Math.E", "factorial", "Math.cbrt", "Math.log2"];
            return (
              <button
                key={op}
                className="btn-blue text-sm font-semibold hover:shadow-md py-2"
                onClick={() => appendValue(ops[idx] === "factorial" ? "fact(" : ops[idx] + "(")}
              >
                {op}
              </button>
            );
          })}
        </div>
      </div>

      {/* ------------------- HISTORY SECTION ------------------- */}
      <div className="bg-white p-6 rounded-xl shadow-lg border-2 border-gray-200" id="history-section">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-gray-800">📊 Calculation History</h3>
          <div className="flex gap-2">
            <button className="btn-blue text-sm px-3 py-1" onClick={downloadPDF}>📄 PDF</button>
            <button className="btn-green text-sm px-3 py-1" onClick={downloadExcel}>📊 Excel</button>
            <button className="btn-red text-sm px-3 py-1" onClick={clearHistory}>🗑 Clear</button>
          </div>
        </div>

        <div
          ref={historyRef}
          className="max-h-64 overflow-auto border-2 border-gray-200 p-3 rounded-lg bg-gray-50"
        >
          {history.length === 0 ? (
            <div className="text-center text-gray-500 py-8">No calculations yet</div>
          ) : (
            history.map((h, i) => (
              <div key={i} className="border-b border-gray-300 py-2 text-sm hover:bg-blue-50 px-2 rounded transition">
                <div className="flex justify-between">
                  <strong className="text-blue-600 font-mono">{h.expr}</strong>
                  <span className="text-green-600 font-bold text-lg">{h.result}</span>
                </div>
                <div className="text-gray-400 text-xs">{h.time}</div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ------------------- BILL ENTRY SECTION ------------------- */}
      <div className="bg-gradient-to-br from-green-50 to-emerald-100 p-6 rounded-xl shadow-lg border-2 border-green-300">

        <h3 className="text-2xl font-bold mb-4 text-gray-800">🧾 Billing Section</h3>

        {/* Item Input Form */}
        <div className="bg-white p-4 rounded-lg border border-green-200 mb-4">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mb-3">
            <input
              className="inp border-green-400 focus:ring-2 focus:ring-green-500"
              placeholder="Item Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <input
              className="inp border-green-400 focus:ring-2 focus:ring-green-500"
              type="number"
              placeholder="Quantity"
              value={qty}
              onChange={(e) => setQty(e.target.value)}
              min="1"
            />
            <input
              className="inp border-green-400 focus:ring-2 focus:ring-green-500"
              type="number"
              placeholder="Price"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              min="0"
              step="0.01"
            />
            <button className="btn-green font-bold hover:shadow-lg" onClick={addItem}>
              ➕ Add
            </button>
          </div>
        </div>

        {items.length > 0 && (
          <div className="mt-4">
            {/* Items Table */}
            <div className="overflow-x-auto mb-4">
              <table className="w-full text-sm">
                <thead className="bg-green-600 text-white">
                  <tr>
                    <th className="px-4 py-2 text-left">Item</th>
                    <th className="px-4 py-2 text-center">Qty</th>
                    <th className="px-4 py-2 text-right">Rate (₹)</th>
                    <th className="px-4 py-2 text-right">Amount (₹)</th>
                    <th className="px-4 py-2 text-center">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((it, i) => (
                    <tr key={i} className="border-b border-green-200 hover:bg-green-50 transition">
                      <td className="px-4 py-2 font-semibold">{it.name}</td>
                      <td className="px-4 py-2 text-center">{it.qty}</td>
                      <td className="px-4 py-2 text-right">₹{it.price.toFixed(2)}</td>
                      <td className="px-4 py-2 text-right font-bold text-green-600">
                        ₹{(it.qty * it.price).toFixed(2)}
                      </td>
                      <td className="px-4 py-2 text-center">
                        <button
                          className="text-red-500 hover:text-red-700 font-bold text-lg"
                          onClick={() => removeItem(i)}
                        >
                          ✕
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Bill Summary */}
            <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-4 text-white rounded-lg font-bold text-xl mb-4 shadow-lg">
              <div className="flex justify-between items-center">
                <span>💰 Total Amount</span>
                <span className="text-3xl">₹{items.reduce((s, i) => s + i.qty * i.price, 0).toFixed(2)}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button className="btn-blue font-bold py-3 hover:shadow-lg" onClick={saveBill}>
                💾 Save Bill to DB
              </button>
              <button className="btn-red font-bold py-3 hover:shadow-lg" onClick={() => setItems([])}>
                🗑 Clear Items
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* -------------------- GLOBAL BUTTON + INPUT CLASSES -------------------- */

const styles = `
.btn-red { background:#dc2626; color:white; padding:10px; border-radius:8px; }
.btn-green { background:#16a34a; color:white; padding:10px; border-radius:8px; }
.btn-blue { background:#2563eb; color:white; padding:10px; border-radius:8px; }
.btn-dark { background:#374151; color:white; padding:10px; border-radius:8px; }
.btn-orange { background:#ea580c; color:white; padding:10px; border-radius:8px; }
.btn-yellow { background:#ca8a04; color:white; padding:10px; border-radius:8px; }
.btn-purple { background:#9333ea; color:white; padding:10px; border-radius:8px; }

.inp {
  padding: 10px;
  border: 2px solid #6ee7b7;
  border-radius: 8px;
  outline: none;
}
`;

document.head.insertAdjacentHTML("beforeend", `<style>${styles}</style>`);
