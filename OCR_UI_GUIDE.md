# OCR Advanced Features - UI Guide

## 📍 Feature Locations in OCR.jsx

```
┌─────────────────────────────────────────────────────────────────┐
│                   IMAGE UPLOAD SECTION                          │
├─────────────────────────────────────────────────────────────────┤
│  📂 Choose Images  |  ☁️  Cloud Upload  |  🗑️  Clear           │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Drag & drop area with image previews                   │   │
│  │  [🖼️] [🖼️] [🖼️]                                          │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓   │
│  ┃ ⚙️ ADVANCED SETTINGS                    [Batch: OFF]  ┃   │
│  ┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫   │
│  ┃                                                        ┃   │
│  ┃ ☑️ ✍️  Handwriting Mode                                ┃   │
│  ┃ ☑️ 🔍 Detect Duplicates                                ┃   │
│  ┃ ☑️ ✏️  Auto Correct OCR                                ┃   │
│  ┃ 🎨 Filter Type: [Enhanced ▼]                         ┃   │
│  ┃                                                        ┃   │
│  ┃ OCR Confidence: 87% ✓                                 ┃   │
│  ┃ 📋 Receipt Structure:                                 ┃   │
│  ┃    Header: ✓ | Items: ✓ | Footer: ✓                 ┃   │
│  ┃ ⚠️ 2 Duplicate(s) Found                                ┃   │
│  ┃                                                        ┃   │
│  ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛   │
│                                                                 │
│  [🌍 English ▼]  [🚀 Run OCR]                                   │
│                                                                 │
│  Progress: ████████████░░░░░░░░░ 60%                          │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│              EXTRACTED TEXT & REPARSE SECTION                   │
├─────────────────────────────────────────────────────────────────┤
│  📝 Extracted Text      [📋 Copy]  [🗑️  Clear]               │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ [Editable text area]                                    │   │
│  │ Bill No: 12345                                          │   │
│  │ Apple x 2 - 100                                         │   │
│  │ ...                                                      │   │
│  └─────────────────────────────────────────────────────────┘   │
│  [Re-Parse]  [Reset to OCR]                                    │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                   ITEMS TABLE (ENHANCED)                        │
├─────────────────────────────────────────────────────────────────┤
│ Item          │ Qty        │ Price │ Total   │ Confidence │ Ac │
├─────────────────────────────────────────────────────────────────┤
│ [Apple      ] │ [−] 2 [+]  │ 50    │ ₹100.00 │ 95% ✓     │ ✕  │
│ [Banana     ] │ [−] 1 [+]  │ 40    │ ₹40.00  │ 87% ✓     │ ✕  │
│ [Milk       ] │ [−] 1 [+]  │ 35    │ ₹35.00  │ 72% ◐     │ ✕  │
│ [Bread      ] │ [−] 2 [+]  │ 25    │ ₹50.00  │ 60% ⚠     │ ✕  │
└─────────────────────────────────────────────────────────────────┘
     ↑                                    ↑
  +/- Buttons                     Confidence Color Coding
  for easy qty                     🟢 Green: ≥80% (Excellent)
  adjustment                       🟡 Yellow: 60-79% (Good)
                                  🔴 Red: <60% (Low)

┌─────────────────────────────────────────────────────────────────┐
│                      EXPORT OPTIONS                             │
├─────────────────────────────────────────────────────────────────┤
│ [💾 Save Bill] [📄 Export CSV] [📊 Export XLSX]                │
│ [📑 Export PDF]                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## 🎯 Feature Quick Reference

### Advanced Settings Panel (Blue Gradient Box)
```
Location: Above the "Run OCR" button
Contains:
├─ Handwriting Mode toggle ✍️
├─ Duplicate Detection toggle 🔍
├─ Auto Correct OCR toggle ✏️
├─ Filter Type selector 🎨
├─ Batch Mode status indicator
├─ Confidence display 📈
├─ Receipt Structure info 📋
└─ Duplicate alerts ⚠️
```

### Items Table Enhancements
```
Original: Item | Qty | Price | Total | Action
Enhanced: Item | Qty | Price | Total | Confidence | Action
                 ↑
            +/- Buttons added for easy
            quantity adjustment without
            manually typing
```

### Key Visual Indicators
```
🟢 Green Badge    → Confidence ≥ 80% (High)
🟡 Yellow Badge   → Confidence 60-79% (Medium)
🔴 Red Badge      → Confidence < 60% (Low)
⚠️ Alert Box      → Duplicates detected
📋 Info Box       → Receipt structure detected
📈 Progress Bar   → Upload/OCR progress
```

## 🎮 Interactive Controls

### Toggle Switches (Checkboxes)
- ✍️ Handwriting Mode: For handwritten receipts
- 🔍 Detect Duplicates: Auto-merge duplicate items
- ✏️ Auto Correct OCR: Fix common OCR mistakes

### Dropdown Selectors
- 🌍 Language: Select OCR language
- 🎨 Filter Type: Choose preprocessing filter

### Buttons
- ➕ Plus Button: Increase item quantity
- ➖ Minus Button: Decrease item quantity
- ✕ Delete Button: Remove item from list
- 🚀 Run OCR: Execute OCR processing

## 📊 Settings Combinations (Recommended)

### 1. Standard Printed Receipts
```
✓ Duplicate Detection
✓ Auto Correct OCR
○ Handwriting Mode
Filter: Enhanced
Language: English
Result: High accuracy, fast processing
```

### 2. Handwritten Receipts
```
✓ Handwriting Mode
✓ Duplicate Detection
✓ Auto Correct OCR
Filter: High Contrast
Language: Appropriate for content
Result: Optimized for cursive text
```

### 3. Poor Quality Images
```
✓ Duplicate Detection
✓ Auto Correct OCR
○ Handwriting Mode
Filter: High Contrast
Adjust: Increase brightness/contrast
Result: Better text extraction
```

### 4. Bilingual Documents
```
✓ Duplicate Detection
✓ Auto Correct OCR
○ Handwriting Mode
Filter: Enhanced
Language: Bilingual option (e.g., eng+hin)
Result: Support for multiple languages
```

## 🔧 Troubleshooting via Advanced Settings

| Problem | Solution |
|---------|----------|
| Low text clarity | Try "High Contrast" filter |
| Handwritten text not recognized | Enable "Handwriting Mode" |
| Duplicate items detected | System auto-merges, or uncheck "Detect Duplicates" |
| Confidence too low | Try different filter or image quality |
| Numbers misread as letters | Enable "Auto Correct OCR" |
| Receipt not recognized | Check "Receipt Structure" info box |

---

**Visual Guide Last Updated**: December 8, 2025
**UI Status**: ✅ Production Ready
