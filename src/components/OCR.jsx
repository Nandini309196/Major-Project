import React, { useEffect, useMemo, useRef, useState } from "react";
import Tesseract from "tesseract.js";
import axios from "axios";

/**
 * OCRPro.jsx
 * Fully updated OCR + Billing component with:
 *  - OCR (multi-image, preprocess)
 *  - smart parsing (items, qty, weight, tax, discount, total)
 *  - editable text + reparse
 *  - calculator + add-to-bill
 *  - persistent history (localStorage)
 *  - per-bill and bulk exports (CSV, XLSX via exceljs, PDF via html2pdf.js)
 *  - analytics (totals, monthly summary)
 *  - auto-categorization (keyword mapping)
 *  - placeholder for currency conversion (optional)
 *
 * NOTE: dynamic imports for exceljs and html2pdf.js are used.
 */

/* -------------------------
   Small UI helpers
   ------------------------- */
const Toast = ({ msg, onClose }) => {
  useEffect(() => {
    if (!msg) return;
    const t = setTimeout(onClose, 4200);
    return () => clearTimeout(t);
  }, [msg, onClose]);
  if (!msg) return null;
  return (
    <div className="fixed right-4 bottom-6 z-50">
      <div className="bg-black text-white px-4 py-2 rounded shadow">{msg}</div>
    </div>
  );
};

const Loader = ({ text = "Processing..." }) => (
  <div className="flex items-center gap-2 text-sm text-gray-900">
    <div className="animate-spin">⏳</div>
    <div>{text}</div>
  </div>
);

/* -------------------------
   Preprocess image (canvas) - ENHANCED FOR HANDWRITTEN TEXT
   ------------------------- */
async function preprocessImage(file, { maxWidth = 1600, filterType = "enhanced" } = {}) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const fr = new FileReader();
    fr.onload = (e) => (img.src = e.target.result);
    fr.onerror = () => reject(new Error("File read error"));
    img.onload = () => {
      const scale = Math.min(1, maxWidth / img.width);
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, w, h);

      // Get image data for processing
      const imgd = ctx.getImageData(0, 0, w, h);
      const data = imgd.data;

      // STEP 1: Convert to grayscale
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i], g = data[i + 1], b = data[i + 2];
        const l = 0.299 * r + 0.587 * g + 0.114 * b;
        data[i] = data[i + 1] = data[i + 2] = l;
      }

      // STEP 2: Increase contrast for better OCR (especially handwritten)
      if (filterType === "enhanced" || filterType === "contrast") {
        const contrast = 2.0; // Higher contrast for handwritten text
        const intercept = 128 * (1 - contrast) / 2;
        for (let i = 0; i < data.length; i += 4) {
          const val = Math.min(255, Math.max(0, data[i] * contrast + intercept));
          data[i] = data[i + 1] = data[i + 2] = val;
        }
      }

      // STEP 3: Apply adaptive thresholding for binary (black & white)
      // Better for handwritten text recognition
      if (filterType === "enhanced" || filterType === "binary") {
        const threshold = 140; // Adjusted threshold
        for (let i = 0; i < data.length; i += 4) {
          const val = data[i] > threshold ? 255 : 0;
          data[i] = data[i + 1] = data[i + 2] = val;
        }
      }

      // STEP 4: Denoise - remove salt and pepper noise
      if (filterType === "enhanced") {
        // Simple median filter for noise reduction
        const tempData = new Uint8ClampedArray(data);
        for (let i = 0; i < w * h; i++) {
          const pixelIdx = i * 4;
          const row = Math.floor(i / w);
          const col = i % w;

          // Skip edges
          if (row === 0 || row === h - 1 || col === 0 || col === w - 1) continue;

          // Get 3x3 neighborhood grayscale values
          const neighbors = [];
          for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
              const nIdx = ((row + dy) * w + (col + dx)) * 4;
              neighbors.push(tempData[nIdx]);
            }
          }

          // Get median
          neighbors.sort((a, b) => a - b);
          const median = neighbors[4]; // Middle value of 9 pixels
          data[pixelIdx] = data[pixelIdx + 1] = data[pixelIdx + 2] = median;
        }
      }

      ctx.putImageData(imgd, 0, 0);

      canvas.toBlob((blob) => {
        if (!blob) reject(new Error("Canvas toBlob failed"));
        else resolve(blob);
      }, "image/jpeg", 0.95); // Higher quality for better OCR
    };
    img.onerror = () => reject(new Error("Image load failed"));
    fr.readAsDataURL(file);
  });
}

/* -------------------------
   Parsing utilities
   ------------------------- */
function normalizeLine(line) {
  return line.replace(/\t/g, " ").replace(/\s+/g, " ").trim();
}

function extractPricesAndMeta(fullText) {
  // returns { items, subtotal, total, taxBreakdown, taxSum, discount, currency }
  const lines = fullText.split("\n").map(normalizeLine).filter(Boolean);
  const priceRegex = /(?:₹|Rs\.?|INR|\$|€|£|¥)?\s*([0-9]+(?:[.,][0-9]{1,2})?)/gi;
  const currencyMap = { "₹": "INR", "Rs": "INR", "Rs.": "INR", "INR": "INR", "$": "USD", "€": "EUR", "£": "GBP", "¥": "JPY" };

  let items = [];
  let detectedTotal = null;
  let taxBreakdown = {};
  let detectedDiscount = 0;
  let currency = "INR";

  for (const raw of lines) {
    const ln = raw.replace(/[^a-zA-Z0-9₹\.\,\s\/@\-xXkgKGpcsPCS%:]/g, " ").trim();
    if (!ln) continue;

    const csym = ln.match(/(₹|Rs\.?|INR|\$|€|£|¥)/);
    if (csym) currency = currencyMap[csym[0].replace(".", "")] || currency;

    // total line detection
    if (/\b(total|amount payable|grand total|balance due|net amount)\b/i.test(ln)) {
      const ms = [...ln.matchAll(priceRegex)];
      if (ms.length) detectedTotal = parseFloat(ms[ms.length - 1][1].replace(/,/g, ""));
      continue;
    }

    // tax detection
    if (/\b(gst|sgst|cgst|igst|vat|tax)\b/i.test(ln)) {
      const ms = [...ln.matchAll(priceRegex)];
      if (ms.length) {
        const val = parseFloat(ms[ms.length - 1][1].replace(/,/g, ""));
        if (/sgst/i.test(ln)) taxBreakdown.SGST = (taxBreakdown.SGST || 0) + val;
        else if (/cgst/i.test(ln)) taxBreakdown.CGST = (taxBreakdown.CGST || 0) + val;
        else if (/igst/i.test(ln)) taxBreakdown.IGST = (taxBreakdown.IGST || 0) + val;
        else taxBreakdown.TAX = (taxBreakdown.TAX || 0) + val;
      }
      continue;
    }

    // discount detection
    if (/\b(discount|off|less)\b/i.test(ln)) {
      const ms = [...ln.matchAll(priceRegex)];
      if (ms.length) detectedDiscount += parseFloat(ms[ms.length - 1][1].replace(/,/g, ""));
      continue;
    }

    // item parsing patterns:
    const nums = [...ln.matchAll(priceRegex)].map(m => parseFloat(m[1].replace(/,/g, "")));
    if (nums.length === 0) continue;

    // weight-based: "0.5kg @ 120/kg"
    const weightMatch = ln.match(/([0-9]*\.?[0-9]+)\s*(kg|g|ltr|l)\s*@\s*([0-9]*\.?[0-9]+)/i);
    if (weightMatch) {
      const qty = parseFloat(weightMatch[1]);
      const per = parseFloat(weightMatch[3]);
      const name = ln.replace(weightMatch[0], "").replace(/[0-9@/kgKGltrLTR.]/g, "").trim() || "Item";
      items.push({ name, qty, price: +(qty * per) });
      continue;
    }

    // "2 x 50" pattern
    const xMatch = ln.match(/([0-9]+)\s*[xX]\s*([0-9]*\.?[0-9]+)/);
    if (xMatch) {
      const qty = parseInt(xMatch[1], 10);
      const price = parseFloat(xMatch[2]);
      const name = ln.replace(xMatch[0], "").trim() || "Item";
      items.push({ name, qty, price });
      continue;
    }

    // "2 pcs 50" pattern
    const pcsMatch = ln.match(/([0-9]+)\s*(pcs|pc|piece|pieces|qty)/i);
    if (pcsMatch && nums.length > 0) {
      const qty = parseInt(pcsMatch[1], 10);
      const price = nums[nums.length - 1];
      const name = ln.replace(pcsMatch[0], "").replace(price.toString(), "").trim() || "Item";
      items.push({ name, qty, price });
      continue;
    }

    // fallback: last number is price
    const price = nums[nums.length - 1];
    const name = ln.replace(price.toString(), "").trim() || "Item";
    const qMatch = ln.match(/([0-9]+)\s*[xX]/);
    const qty = qMatch ? parseInt(qMatch[1], 10) : 1;
    items.push({ name, qty, price });
  }

  const subtotal = items.reduce((s, it) => s + (it.qty || 1) * (it.price || 0), 0);
  const taxSum = Object.values(taxBreakdown).reduce((s, v) => s + v, 0);
  if (!detectedTotal) detectedTotal = +(subtotal + taxSum - detectedDiscount).toFixed(2);

  return {
    items,
    subtotal: +subtotal.toFixed(2),
    total: +detectedTotal,
    taxBreakdown,
    taxSum: +taxSum.toFixed(2),
    discount: +detectedDiscount.toFixed(2),
    currency
  };
}

/* -------------------------
   Export helpers (CSV, XLSX via exceljs, PDF via html2pdf)
   ------------------------- */
function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

async function exportCSV(items, meta = {}, filename = "invoice.csv") {
  const rows = [["Name", "Qty", "Price", "Total"]];
  items.forEach(i => rows.push([i.name, i.qty, i.price, (i.qty * i.price).toFixed(2)]));
  rows.push([]);
  rows.push(["Subtotal", meta.subtotal ?? ""]);
  rows.push(["Tax", meta.tax ?? ""]);
  rows.push(["Discount", meta.discount ?? ""]);
  rows.push(["Total", meta.total ?? ""]);
  const csv = rows.map(r => r.map(c => `"${String(c ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  downloadBlob(blob, filename);
}

async function exportXLSX(items, meta = {}, filename = "invoice.xlsx") {
  // dynamic import exceljs
  const ExcelJSModule = await import("exceljs");
  const ExcelJS = ExcelJSModule?.default || ExcelJSModule;
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Invoice");
  ws.addRow(["Name", "Qty", "Price", "Total"]);
  items.forEach(i => ws.addRow([i.name, i.qty, i.price, (i.qty * i.price)]));
  ws.addRow([]);
  ws.addRow(["Subtotal", meta.subtotal ?? ""]);
  ws.addRow(["Tax", meta.tax ?? ""]);
  ws.addRow(["Discount", meta.discount ?? ""]);
  ws.addRow(["Total", meta.total ?? ""]);
  const buf = await wb.xlsx.writeBuffer();
  const blob = new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  downloadBlob(blob, filename);
}

async function exportPDF(node, filename = "invoice.pdf") {
  try {
    const h2pModule = await import("html2pdf.js");
    const html2pdf = h2pModule?.default || h2pModule;
    // some builds expose window.html2pdf: handle both
    (html2pdf || window.html2pdf)().from(node).set({
      margin: 0.4,
      filename,
      html2canvas: { scale: 2 },
      jsPDF: { unit: "in", format: "a4", orientation: "portrait" }
    }).save();
  } catch (err) {
    // fallback print window
    const w = window.open("", "_blank");
    w.document.write(`<html><head><title>Invoice</title></head><body>${node.outerHTML}</body></html>`);
    w.document.close();
    w.print();
  }
}

/* -------------------------
   Auto-categorization (keyword mapping)
   ------------------------- */
const CATEGORY_KEYWORDS = {
  Groceries: ["grocery", "groceries", "walmart", "supermarket", "bigbasket", "flipkart grocery", "dairy", "milk", "bread", "vegetable", "fruit"],
  Restaurant: ["restaurant", "cafe", "dine", "food", "burger", "pizza", "dominos", "restaurant"],
  Pharmacy: ["pharmacy", "med", "medic", "pharm", "tablet", "syrup", "paracetamol"],
  Electronics: ["electronics", "mobile", "charger", "headphone", "tv", "television", "phone"],
  Clothing: ["shirt", "t-shirt", "jeans", "clothes", "garment"],
  Travel: ["taxi", "uber", "ola", "flight", "train", "bus", "hotel"],
  Services: ["service", "repair", "clean", "maintenance"],
  Fruits:["apple","banana","orange","grape","mango","pineapple","kiwi","watermelon","peach","pear"],
  Vegetables:["carrot","broccoli","spinanch","potato","tomato","onion","cabbage","lettuce","cucumber","pepper"],
  Other: []
};

function categorizeBillText(text) {
  const t = (text || "").toLowerCase();
  for (const [cat, keys] of Object.entries(CATEGORY_KEYWORDS)) {
    for (const k of keys) {
      if (t.includes(k)) return cat;
    }
  }
  return "Other";
}

/* -------------------------
   Helper: compute analytics
   ------------------------- */
function computeAnalytics(history) {
  const totalSpent = history.reduce((s, r) => s + (Number(r.total) || 0), 0);
  const count = history.length;
  const avg = count ? totalSpent / count : 0;
  // monthly buckets YYYY-MM
  const monthly = {};
  for (const r of history) {
    const key = new Date(r.createdAt).toISOString().slice(0, 7);
    monthly[key] = (monthly[key] || 0) + (Number(r.total) || 0);
  }
  const months = Object.keys(monthly).sort();
  return { totalSpent, count, avg, monthly, months };
}

/* -------------------------
   Currency conversion placeholder
   ------------------------- */
async function fetchRatesPlaceholder(base = "INR") {
  // Placeholder: user can implement their own API. This function returns null if not configured.
  // Example (not enabled): fetch("https://api.exchangerate.host/latest?base=INR")
  return null;
}

/* -------------------------
   Main Component
   ------------------------- */
export default function OCRPro({ onSaved }) {
  // images & OCR
  const [images, setImages] = useState([]); // [{file, preview, processed}]
  const [processing, setProcessing] = useState(false);
  const [ocrText, setOcrText] = useState("");
  const [editingText, setEditingText] = useState("");

  // parsed items/meta
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState({ subtotal: 0, taxSum: 0, taxBreakdown: {}, discount: 0, total: 0, currency: "INR" });

  // ui & extras
  const [lang, setLang] = useState("eng");
  const [toast, setToast] = useState("");
  const [dark, setDark] = useState(false);

  // calculator
  const [expression, setExpression] = useState("");
  const [calcResult, setCalcResult] = useState(null);

  // history
  const [history, setHistory] = useState([]); // array of bills
  const [filters, setFilters] = useState({
    query: "",
    category: "All",
    from: "",
    to: "",
    minAmount: "",
    maxAmount: ""
  });

  // Advanced features
  const [filterType, setFilterType] = useState("enhanced");
  const [confidence, setConfidence] = useState(0);
  const [batchMode, setBatchMode] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [ocrStats, setOcrStats] = useState({ avgConfidence: 0, totalProcessed: 0 });

  // printable ref
  const printableRef = useRef();

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("ocrpro_history_v1") || "[]");
    setHistory(stored);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  const addToast = (m) => setToast(m);

  /* -------------------------
     File + Drag-drop handlers
     ------------------------- */
  const handleFilesSelected = (fileList) => {
    const arr = Array.from(fileList).slice(0, 6);
    const mapped = arr.map(f => ({ file: f, preview: URL.createObjectURL(f), processed: null }));
    setImages(prev => [...prev, ...mapped]);
    addToast(`${mapped.length} images added`);
  };

  const onFileChange = (e) => {
    if (!e.target.files) return;
    handleFilesSelected(e.target.files);
  };

  const onDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer?.files) handleFilesSelected(e.dataTransfer.files);
  };

  /* -------------------------
     OCR pipeline
     ------------------------- */
  const runOCR = async () => {
    if (!images.length) return addToast("Upload at least one image");
    setProcessing(true);
    setOcrText("");
    setEditingText("");
    setItems([]);
    setMeta({ subtotal: 0, taxSum: 0, taxBreakdown: {}, discount: 0, total: 0, currency: "INR" });
    setConfidence(0);

    try {
      // preprocess each image with selected filter
      for (let i = 0; i < images.length; i++) {
        setUploadProgress(Math.round((i / images.length) * 30));
        addToast(`Preprocessing ${i + 1}/${images.length} with ${filterType} filter`);
        images[i].processed = await preprocessImage(images[i].file, { maxWidth: 1600, filterType });
      }

      // OCR sequentially
      let combined = "";
      let confidenceSum = 0;
      for (let i = 0; i < images.length; i++) {
        setUploadProgress(30 + Math.round((i / images.length) * 70));
        addToast(`Running OCR ${i + 1}/${images.length}`);
        const res = await Tesseract.recognize(images[i].processed || images[i].file, lang, {
          logger: (m) => {
            // optional progress logging
          }
        });
        combined += "\n\n" + (res?.data?.text || "");
        if (res?.data?.confidence) {
          confidenceSum += res.data.confidence;
        }
      }

      const avgConfidence = images.length > 0 ? confidenceSum / images.length : 0;
      setConfidence(Math.round(avgConfidence));
      setOcrStats({ avgConfidence: Math.round(avgConfidence), totalProcessed: images.length });

      const clean = combined.trim();
      setOcrText(clean);
      setEditingText(clean);

      const parsed = extractPricesAndMeta(clean);
      setItems(parsed.items);
      setMeta({
        subtotal: parsed.subtotal,
        taxSum: parsed.taxSum,
        taxBreakdown: parsed.taxBreakdown,
        discount: parsed.discount,
        total: parsed.total,
        currency: parsed.currency
      });

      setUploadProgress(100);
      addToast(`✅ OCR complete - ${parsed.items.length} items detected (${Math.round(avgConfidence)}% confidence)`);
    } catch (err) {
      console.error(err);
      addToast("❌ OCR failed: " + (err.message || err));
    } finally {
      setProcessing(false);
      setUploadProgress(0);
      setTimeout(() => setToast(""), 3500);
    }
  };

  /* -------------------------
     Reparse
     ------------------------- */
  const reparse = () => {
    const parsed = extractPricesAndMeta(editingText || ocrText);
    setItems(parsed.items);
    setMeta({
      subtotal: parsed.subtotal,
      taxSum: parsed.taxSum,
      taxBreakdown: parsed.taxBreakdown,
      discount: parsed.discount,
      total: parsed.total,
      currency: parsed.currency
    });
    addToast("Reparsed text");
  };

  /* -------------------------
     Items edit
     ------------------------- */
  const addItem = (name = "Item", qty = 1, price = 0) => {
    if (!name) return addToast("Provide item name");
    setItems(prev => [...prev, { name, qty: Number(qty), price: Number(price) }]);
  };
  const editItem = (index, field, value) => {
    setItems(prev => {
      const cp = [...prev];
      cp[index] = { ...cp[index], [field]: field === "name" ? value : Number(value) };
      return cp;
    });
  };
  const removeItem = (index) => setItems(prev => prev.filter((_, i) => i !== index));

  /* -------------------------
     Save bill (local + remote attempt)
     ------------------------- */
  const saveBillLocal = (payload) => {
    const existing = JSON.parse(localStorage.getItem("ocrpro_history_v1") || "[]");
    existing.unshift(payload);
    localStorage.setItem("ocrpro_history_v1", JSON.stringify(existing.slice(0, 500)));
    setHistory(existing.slice(0, 500));
    addToast("Saved to local history");
  };

  const saveBillRemote = async (payload) => {
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/bills`, payload, { headers: { Authorization: "Bearer " + localStorage.getItem("token") } });
      addToast("Saved to server");
    } catch (err) {
      console.warn("remote save failed", err);
      addToast("Server save failed (saved locally)");
    }
  };

  const saveBill = async () => {
    if (items.length === 0) return addToast("No items to save");
    const computedTotal = items.reduce((s, it) => s + (it.qty || 1) * (it.price || 0), 0);
    const category = categorizeBillText(editingText || ocrText);
    const payload = {
      id: Date.now().toString(36),
      items,
      subtotal: meta.subtotal,
      tax: meta.taxSum,
      discount: meta.discount,
      total: +computedTotal.toFixed(2),
      currency: meta.currency,
      createdAt: new Date().toISOString(),
      rawText: editingText || ocrText,
      category
    };
    saveBillLocal(payload);
    saveBillRemote(payload); // non-blocking
    // reset UI
    setItems([]);
    setImages([]);
    setOcrText("");
    setEditingText("");
    setMeta({ subtotal: 0, taxSum: 0, taxBreakdown: {}, discount: 0, total: 0, currency: "INR" });
    if (onSaved) onSaved();
  };

  /* -------------------------
     Calculator
     ------------------------- */
  const evaluateExpression = () => {
    try {
      if (!/^[0-9+\-*/().\s%]+$/.test(expression)) return addToast("Invalid characters");
      const exp = expression.replace(/([0-9]+(?:\.[0-9]+)?)%/g, "($1/100)");
      const res = Function(`"use strict"; return (${exp})`)();
      setCalcResult(res);
    } catch {
      addToast("Invalid expression");
    }
  };
  const addCalcToBill = (value) => {
    if (isNaN(value)) return addToast("No numeric result");
    addItem("Calculated Result", 1, Number(value));
    setExpression("");
    setCalcResult(null);
  };

  /* -------------------------
     Exports (single bill)
     ------------------------- */
  const exportSingleCSV = (bill) => {
    exportCSV(bill.items, { subtotal: bill.subtotal, tax: bill.tax, discount: bill.discount, total: bill.total }, `bill_${bill.id}.csv`);
    addToast("CSV downloaded");
  };
  const exportSingleXLSX = async (bill) => {
    try {
      await exportXLSX(bill.items, { subtotal: bill.subtotal, tax: bill.tax, discount: bill.discount, total: bill.total }, `bill_${bill.id}.xlsx`);
      addToast("XLSX downloaded");
    } catch (err) {
      addToast("XLSX export failed, CSV fallback");
    }
  };
  const exportSinglePDF = async (bill) => {
    // build a mini HTML node
    const container = document.createElement("div");
    const head = `<h2>Invoice</h2><div>Category: ${bill.category}</div><div>Date: ${new Date(bill.createdAt).toLocaleString()}</div><table border="1" cellpadding="6" cellspacing="0"><thead><tr><th>Name</th><th>Qty</th><th>Price</th><th>Total</th></tr></thead><tbody>`;
    const rows = bill.items.map(i => `<tr><td>${i.name}</td><td>${i.qty}</td><td>${i.price}</td><td>${(i.qty * i.price).toFixed(2)}</td></tr>`).join("");
    const foot = `</tbody></table><div>Subtotal: ${bill.subtotal}</div><div>Tax: ${bill.tax}</div><div>Discount: ${bill.discount}</div><div>Total: ${bill.total}</div>`;
    container.innerHTML = head + rows + foot;
    await exportPDF(container, `bill_${bill.id}.pdf`);
    addToast("PDF export triggered");
  };

  /* -------------------------
     Bulk exports (history)
     ------------------------- */
  const exportHistoryCSV = (filtered = []) => {
    // Flatten all bills into a single CSV
    const rows = [["BillID", "Date", "Category", "Name", "Qty", "Price", "Total", "BillSubtotal", "BillTax", "BillDiscount", "BillTotal"]];
    (filtered.length ? filtered : history).forEach(b => {
      b.items.forEach(it => rows.push([b.id, b.createdAt, b.category, it.name, it.qty, it.price, (it.qty * it.price).toFixed(2), b.subtotal, b.tax, b.discount, b.total]));
    });
    const csv = rows.map(r => r.map(c => `"${String(c ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
    downloadBlob(new Blob([csv], { type: "text/csv" }), `history_${Date.now()}.csv`);
    addToast("History CSV exported");
  };

  const exportHistoryXLSX = async (filtered = []) => {
    // Build sheet with ExcelJS
    try {
      const ExcelJSModule = await import("exceljs");
      const ExcelJS = ExcelJSModule?.default || ExcelJSModule;
      const wb = new ExcelJS.Workbook();
      const ws = wb.addWorksheet("History");
      ws.addRow(["BillID", "Date", "Category", "Name", "Qty", "Price", "ItemTotal", "BillSubtotal", "BillTax", "BillDiscount", "BillTotal"]);
      (filtered.length ? filtered : history).forEach(b => {
        b.items.forEach(it => ws.addRow([b.id, b.createdAt, b.category, it.name, it.qty, it.price, (it.qty * it.price), b.subtotal, b.tax, b.discount, b.total]));
      });
      const buf = await wb.xlsx.writeBuffer();
      downloadBlob(new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), `history_${Date.now()}.xlsx`);
      addToast("History XLSX exported");
    } catch (err) {
      addToast("History XLSX export failed");
    }
  };

  const exportHistoryPDF = async (filtered = []) => {
    // Create a large HTML node summarizing bills (simple list)
    const container = document.createElement("div");
    container.innerHTML = `<h2>History Export</h2><div>Total bills: ${(filtered.length ? filtered : history).length}</div>`;
    (filtered.length ? filtered : history).forEach(b => {
      const block = document.createElement("div");
      block.style.margin = "8px 0";
      block.innerHTML = `<div><b>Bill ${b.id}</b> — ${new Date(b.createdAt).toLocaleString()} — ${b.category} — Total: ${b.total}</div>`;
      container.appendChild(block);
    });
    await exportPDF(container, `history_${Date.now()}.pdf`);
    addToast("History PDF exported");
  };

  /* -------------------------
     Filters & derived data
     ------------------------- */
  const filteredHistory = useMemo(() => {
    return history.filter(b => {
      const q = filters.query.trim().toLowerCase();
      if (q) {
        const hay = (JSON.stringify(b) || "").toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (filters.category && filters.category !== "All" && b.category !== filters.category) return false;
      if (filters.from) {
        if (new Date(b.createdAt) < new Date(filters.from)) return false;
      }
      if (filters.to) {
        if (new Date(b.createdAt) > new Date(filters.to)) return false;
      }
      if (filters.minAmount) if (Number(b.total) < Number(filters.minAmount)) return false;
      if (filters.maxAmount) if (Number(b.total) > Number(filters.maxAmount)) return false;
      return true;
    });
  }, [history, filters]);

  const analytics = useMemo(() => computeAnalytics(history), [history]);

  /* -------------------------
     History actions
     ------------------------- */
  const loadFromHistory = (bill) => {
    setItems(bill.items || []);
    setMeta({ subtotal: bill.subtotal || 0, taxSum: bill.tax || 0, taxBreakdown: bill.taxBreakdown || {}, discount: bill.discount || 0, total: bill.total || 0, currency: bill.currency || "INR" });
    setEditingText(bill.rawText || "");
    addToast("Loaded bill into editor");
  };

  const deleteFromHistory = (id) => {
    const copy = history.filter(h => h.id !== id);
    localStorage.setItem("ocrpro_history_v1", JSON.stringify(copy));
    setHistory(copy);
    addToast("Deleted bill");
  };

  const clearHistory = () => {
    if (!confirm("Clear all saved bills? This cannot be undone.")) return;
    localStorage.removeItem("ocrpro_history_v1");
    setHistory([]);
    addToast("History cleared");
  };

  /* -------------------------
     Cloud upload placeholder
     ------------------------- */
  const uploadToCloud = async () => {
    addToast("Cloud upload placeholder - configure Cloudinary/S3/etc.");
  };

  /* -------------------------
     Render
     ------------------------- */
  return (
    <div className="p-4 space-y-6">
      <Toast msg={toast} onClose={() => setToast("")} />

      {/* Upload area */}
      <div className="bg-indigo-50 p-4 rounded shadow">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">OCR Pro — Smart Billing</h2>
          <div className="flex items-center gap-2">
            <label className="bg-white px-3 py-1 rounded cursor-pointer">
              <input type="file" accept="image/*" multiple onChange={onFileChange} className="hidden" />
              Choose Images
            </label>
            <button onClick={uploadToCloud} className="px-3 py-1 bg-yellow-900 text-white rounded">Cloud Upload</button>
            <button onClick={() => { setImages([]); addToast("Cleared images"); }} className="px-3 py-1 bg-gray-500 rounded">Clear</button>
          </div>
        </div>

        <div onDrop={onDrop} onDragOver={(e) => e.preventDefault()} className="mt-3 border-2 border-dashed p-4 rounded text-center">
          <div>Drag & drop up to 6 images here, or click Choose Images.</div>
          <div className="mt-3 flex gap-3 overflow-x-auto">
            {images.map((im, idx) => <img key={idx} src={im.preview} alt={`img-${idx}`} className="w-24 h-20 object-cover rounded" />)}
          </div>
          <div className="mt-3 flex gap-2 justify-center">
            <select value={lang} onChange={(e) => setLang(e.target.value)} className="p-2 border rounded">
              <option value="eng">English</option>
              <option value="eng+hin">English + Hindi</option>
              <option value="eng+tel">English + Telugu</option>
              <option value="eng+hin+tel">eng+hin+tel</option>
            </select>
            <button disabled={processing} onClick={runOCR} className="px-4 py-2 bg-indigo-900 text-white rounded">
              {processing ? <Loader text="Running OCR..." /> : "Run OCR"}
            </button>
          </div>
        </div>
      </div>

      {/* OCR Text & Reparse */}
      {ocrText && (
        <div className="bg-yellow-50 p-4 rounded shadow">
          <div className="flex justify-between">
            <h3 className="text-lg font-semibold">Extracted Text</h3>
            <div className="flex gap-2">
              <button onClick={() => { navigator.clipboard.writeText(editingText || ocrText); addToast("Copied text"); }} className="px-3 py-1 bg-white rounded">Copy</button>
              <button onClick={() => { setEditingText(""); setOcrText(""); setItems([]); addToast("Cleared"); }} className="px-3 py-1 bg-red-500 rounded">Clear</button>
            </div>
          </div>
          <textarea className="w-full mt-3 p-3 border rounded" rows={8} value={editingText} onChange={(e) => setEditingText(e.target.value)} />
          <div className="mt-3 flex gap-2">
            <button onClick={reparse} className="px-4 py-2 bg-yellow-900 text-white rounded">Re-Parse</button>
            <button onClick={() => { setEditingText(ocrText); reparse(); }} className="px-4 py-2 bg-white border rounded">Reset to OCR</button>
          </div>
        </div>
      )}

      {/* Calculator */}
      <div className="bg-purple-50 p-4 rounded shadow">
        <h3 className="text-lg font-semibold">Calculator</h3>
        <div className="flex gap-3 mt-3">
          <input value={expression} onChange={(e) => setExpression(e.target.value)} className="flex-1 p-2 border rounded" placeholder="100*0.18, 200-15%" />
          <button onClick={() => { evaluateExpression(); }} className="px-3 py-1 bg-purple-900 text-white rounded">Calc</button>
        </div>
        {calcResult !== null && (
          <div className="mt-3">
            <div className="p-3 bg-white border rounded">Result: <b>{calcResult}</b></div>
            <div className="mt-2 flex gap-2">
              <button onClick={() => addCalcToBill(calcResult)} className="px-3 py-1 bg-green-900 text-white rounded">Add to Bill</button>
              <button onClick={() => { setCalcResult(null); setExpression(""); }} className="px-3 py-1 bg-gray-500 rounded">Clear</button>
            </div>
          </div>
        )}
      </div>

      {/* Items & Save / Exports */}
      <div className="bg-green-50 p-4 rounded shadow">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Items</h3>
          <div className="flex gap-2">
            <button onClick={() => { addItem("Manual Item", 1, 0); }} className="px-3 py-1 bg-white rounded">Add Item</button>
          </div>
        </div>

        {items.length === 0 ? (
          <div className="p-4 bg-white rounded text-center">No items</div>
        ) : (
          <>
            <div className="overflow-x-auto mt-3">
              <table className="w-full border-collapse">
                <thead className="bg-green-600 text-white">
                  <tr>
                    <th className="p-2 text-left">Item</th>
                    <th className="p-2">Qty</th>
                    <th className="p-2">Price</th>
                    <th className="p-2">Total</th>
                    <th className="p-2">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((it, idx) => (
                    <tr key={idx} className="bg-white border-b">
                      <td className="p-2"><input value={it.name} onChange={(e) => editItem(idx, "name", e.target.value)} className="w-full p-1 border rounded" /></td>
                      <td className="p-2"><input type="number" value={it.qty} onChange={(e) => editItem(idx, "qty", e.target.value)} className="w-20 p-1 border rounded text-center" /></td>
                      <td className="p-2"><input type="number" value={it.price} onChange={(e) => editItem(idx, "price", e.target.value)} className="w-28 p-1 border rounded text-center" /></td>
                      <td className="p-2 font-semibold text-right">₹{((it.qty || 1) * (it.price || 0)).toFixed(2)}</td>
                      <td className="p-2 text-center"><button onClick={() => removeItem(idx)} className="text-red-900">✕</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 p-3 bg-green-900 text-white rounded text-right">
              <div>Subtotal: ₹{items.reduce((s, it) => s + (it.qty || 1) * (it.price || 0), 0).toFixed(2)}</div>
              <div>Detected Tax: ₹{meta.taxSum?.toFixed?.(2) ?? "0.00"}</div>
              <div>Discount: ₹{meta.discount?.toFixed?.(2) ?? "0.00"}</div>
              <div className="text-xl font-bold mt-2">Total: ₹{items.reduce((s, it) => s + (it.qty || 1) * (it.price || 0), 0).toFixed(2)}</div>
            </div>

            <div className="mt-3 flex gap-2">
              <button onClick={saveBill} className="flex-1 px-3 py-2 bg-emerald-600 text-white rounded">Save Bill</button>
              <button onClick={() => exportCSV(items, { subtotal: meta.subtotal, tax: meta.taxSum, discount: meta.discount, total: meta.total }, `invoice_${Date.now()}.csv`)} className="px-3 py-2 bg-gray-100 rounded">Export CSV</button>
              <button onClick={() => exportXLSX(items, { subtotal: meta.subtotal, tax: meta.taxSum, discount: meta.discount, total: meta.total }, `invoice_${Date.now()}.xlsx`)} className="px-3 py-2 bg-gray-100 rounded">Export XLSX</button>
              <button onClick={async () => { await exportPDF(printableRef.current || document.createElement("div"), `invoice_${Date.now()}.pdf`); addToast("PDF export triggered"); }} className="px-3 py-2 bg-gray-100 rounded">Export PDF</button>
            </div>
          </>
        )}
      </div>

      {/* Hidden printable invoice node */}
      <div style={{ display: "none" }}>
        <div ref={printableRef} id="invoice-printable">
          <h2>Invoice</h2>
          <div>Items</div>
          <table border="1" cellPadding="4" cellSpacing="0">
            <thead>
              <tr><th>Name</th><th>Qty</th><th>Price</th><th>Total</th></tr>
            </thead>
            <tbody>
              {items.map((it, i) => <tr key={i}><td>{it.name}</td><td>{it.qty}</td><td>{it.price}</td><td>{(it.qty*it.price).toFixed(2)}</td></tr>)}
            </tbody>
          </table>
          <div>Subtotal: {meta.subtotal}</div>
          <div>Tax: {meta.taxSum}</div>
          <div>Discount: {meta.discount}</div>
          <div>Total: {meta.total}</div>
        </div>
      </div>

      {/* Analytics */}
      <div className="bg-white p-4 rounded shadow">
        <h3 className="text-lg font-semibold">Analytics</h3>
        <div className="mt-3 grid grid-cols-2 gap-4">
          <div className="p-3 border rounded">
            <div className="text-sm text-gray-900">Total Spent</div>
            <div className="text-xl font-bold">₹{analytics.totalSpent.toFixed(2)}</div>
          </div>
          <div className="p-3 border rounded">
            <div className="text-sm text-gray-900">Bills</div>
            <div className="text-xl font-bold">{analytics.count}</div>
          </div>
          <div className="p-3 border rounded">
            <div className="text-sm text-gray-900">Average Bill</div>
            <div className="text-xl font-bold">₹{analytics.avg.toFixed(2)}</div>
          </div>
          <div className="p-3 border rounded">
            <div className="text-sm text-gray-900">Monthly (simple)</div>
            <div className="text-sm mt-2">
              {analytics.months.slice(-6).map(m => (
                <div key={m}><b>{m}</b>: ₹{analytics.monthly[m].toFixed(2)}</div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* History & Filters */}
      <div className="bg-white p-4 rounded shadow">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">History</h3>
          <div className="flex gap-2 items-center">
            <input placeholder="Search..." value={filters.query} onChange={(e) => setFilters(f => ({ ...f, query: e.target.value }))} className="p-2 border rounded" />
            <select value={filters.category} onChange={(e) => setFilters(f => ({ ...f, category: e.target.value }))} className="p-2 border rounded">
              <option>All</option>
              {Object.keys(CATEGORY_KEYWORDS).map(c => <option key={c}>{c}</option>)}
            </select>
            <input type="date" value={filters.from} onChange={(e) => setFilters(f => ({ ...f, from: e.target.value }))} className="p-2 border rounded" />
            <input type="date" value={filters.to} onChange={(e) => setFilters(f => ({ ...f, to: e.target.value }))} className="p-2 border rounded" />
            <button onClick={() => exportHistoryCSV(filteredHistory)} className="px-3 py-1 bg-gray-500 rounded">Export CSV</button>
            <button onClick={() => exportHistoryXLSX(filteredHistory)} className="px-3 py-1 bg-gray-500 rounded">Export XLSX</button>
            <button onClick={() => exportHistoryPDF(filteredHistory)} className="px-3 py-1 bg-gray-500 rounded">Export PDF</button>
            <button onClick={clearHistory} className="px-3 py-1 bg-red-500 rounded">Clear All</button>
          </div>
        </div>

        <div className="mt-3 max-h-56 overflow-auto">
          {filteredHistory.length === 0 ? (
            <div className="p-3 text-sm text-gray-500">No bills found</div>
          ) : (
            filteredHistory.map(b => (
              <div key={b.id} className="p-2 border-b flex items-center justify-between">
                <div>
                  <div className="font-semibold">₹{b.total.toFixed(2)} — {b.category}</div>
                  <div className="text-xs text-gray-600">{new Date(b.createdAt).toLocaleString()}</div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => loadFromHistory(b)} className="px-2 py-1 bg-blue-300 rounded">Load</button>
                  <button onClick={() => exportSingleCSV(b)} className="px-2 py-1 bg-gray-300 rounded">CSV</button>
                  <button onClick={() => exportSingleXLSX(b)} className="px-2 py-1 bg-gray-300 rounded">XLSX</button>
                  <button onClick={() => exportSinglePDF(b)} className="px-2 py-1 bg-gray-300 rounded">PDF</button>
                  <button onClick={() => deleteFromHistory(b.id)} className="px-2 py-1 bg-red-100 rounded">Delete</button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Footer: dark mode toggle */}
      <div className="flex justify-between items-center">
        <div className="text-sm text-gray-600">OCRPro • Smart Billing</div>
        <div>
          <button onClick={() => setDark(d => !d)} className="px-3 py-1 bg-gray-100 rounded">{dark ? "Light" : "Dark"}</button>
        </div>
      </div>
    </div>
  );
}
