# Advanced OCR Features - Developer Reference

## 🔧 New Functions & Components

### 1. Enhanced Image Quality Function

```javascript
async function enhanceImageQuality(file, {
  brightness = 0,      // -255 to 255
  contrast = 1,        // 0.5 to 3.0
  saturation = 1,      // 0 to 2.0
  rotation = 0,        // 0 to 360 degrees
  blur = 0,           // Optional: 0 to 10
  sharpness = 0       // Optional: 0 to 10
} = {})
```

**Usage:**
```javascript
// For handwritten text
const enhanced = await enhanceImageQuality(file, {
  brightness: 10,
  contrast: 1.5,
  saturation: 0.8,
  rotation: 0
});
```

**Returns:** Promise resolving to enhanced blob

---

### 2. Duplicate Detection

```javascript
function detectDuplicates(items)
```

**Detects by:**
- Item name (case-insensitive, trimmed)
- Exact price match

**Returns:**
```javascript
[
  { current: 2, original: 0 },  // Item at index 2 duplicates item 0
  { current: 5, original: 1 }   // Item at index 5 duplicates item 1
]
```

**Usage:**
```javascript
const duplicates = detectDuplicates(items);
if (duplicates.length > 0) {
  console.log(`Found ${duplicates.length} duplicates`);
}
```

---

### 3. Merge Duplicates

```javascript
function mergeDuplicates(items)
```

**Merges items with same name + price**
**Combines quantities**

**Returns:** Array of unique items with combined quantities

**Usage:**
```javascript
const merged = mergeDuplicates(items);
setItems(merged);  // Replace duplicates with merged version
```

---

### 4. Receipt Template Recognition

```javascript
function detectReceiptLayout(text)
```

**Analyzes receipt structure**

**Returns:**
```javascript
{
  hasHeader: true,              // Found invoice/receipt/bill header
  hasItemsSection: true,        // Found items list
  hasFooter: true,              // Found total/thank you
  isStructured: true,           // All three sections found
  headerLines: [...],           // First 3 lines
  bodyLines: [...],             // Middle section
  footerLines: [...]            // Last 3 lines
}
```

**Usage:**
```javascript
const layout = detectReceiptLayout(ocrText);
if (layout.isStructured) {
  console.log("Receipt structure recognized");
}
```

---

### 5. OCR Error Correction

```javascript
function correctCommonOCRErrors(text)
```

**Fixes common misreadings:**
- 0→O, 1→I, 5→S, 8→B
- rn→m, ni→m, ii→u, l1→ll

**Returns:** Corrected text string

**Usage:**
```javascript
let text = ocrResult.data.text;
text = correctCommonOCRErrors(text);
```

---

## 🎨 New UI Components

### 1. SliderControl Component

```jsx
<SliderControl
  label="Brightness"
  value={brightness}
  min={-255}
  max={255}
  step={5}
  onChange={(val) => setBrightness(val)}
/>
```

**Props:**
- `label`: Display label
- `value`: Current value
- `min`: Minimum value
- `max`: Maximum value
- `step`: Increment step
- `onChange`: Callback function

---

### 2. ConfidenceIndicator Component

```jsx
<ConfidenceIndicator confidence={87} size="lg" />
```

**Props:**
- `confidence`: 0-100 number
- `size`: "sm" | "lg"

**Colors:**
- 🟢 Green: ≥80%
- 🟡 Yellow: 60-79%
- 🔴 Red: <60%

**Output:** Colored badge with percentage and checkmark

---

## 📊 State Variables

### New State Variables Added

```javascript
// Image Enhancement Controls
const [imageEnhancement, setImageEnhancement] = useState({
  brightness: 0,
  contrast: 1,
  saturation: 1,
  rotation: 0,
  blur: 0,
  sharpness: 0
});

// Advanced OCR Features
const [duplicateDetection, setDuplicateDetection] = useState(true);
const [handwritingMode, setHandwritingMode] = useState(false);
const [receiptTemplate, setReceiptTemplate] = useState(null);
const [detectedDuplicates, setDetectedDuplicates] = useState([]);
const [itemConfidences, setItemConfidences] = useState({});
const [autoCorrectOCR, setAutoCorrectOCR] = useState(true);
const [ocrStats, setOcrStats] = useState({
  avgConfidence: 0,
  totalProcessed: 0
});
```

---

## 🔄 Enhanced OCR Pipeline

### New Processing Steps

```javascript
async function runOCR() {
  try {
    // 1. PREPROCESSING
    for (each image) {
      - General preprocessing (grayscale, contrast, etc.)
      - IF handwritingMode THEN apply handwriting enhancements
    }

    // 2. OCR RECOGNITION
    for (each image) {
      - Run Tesseract.recognize()
      - IF autoCorrectOCR THEN correctCommonOCRErrors()
      - Combine results
    }

    // 3. ANALYSIS
    - Detect receipt layout
    - IF duplicateDetection THEN:
      - Find duplicates
      - Auto-merge duplicates
      - Show alert
    
    // 4. PARSING
    - Extract items, prices, totals
    - Calculate metadata
    - Store confidence scores
  }
}
```

---

## 🎯 Usage Examples

### Example 1: Process Handwritten Bill

```javascript
// User selects image and enables handwriting mode
const handleProcessHandwritten = async () => {
  setHandwritingMode(true);
  setAutoCorrectOCR(true);
  setDuplicateDetection(true);
  
  await runOCR();
  
  // System automatically:
  // - Applies handwriting optimization
  // - Corrects OCR errors
  // - Merges duplicates
  // - Shows confidence scores
};
```

### Example 2: Batch Process Multiple Receipts

```javascript
const handleBatchProcess = async () => {
  setBatchMode(true);
  
  for (let i = 0; i < images.length; i++) {
    // Process each image
    await runOCR();
    
    // Save current bill
    await saveBill();
    
    // Move to next
    setImages(prev => [...prev.slice(1)]);
  }
  
  setBatchMode(false);
};
```

### Example 3: Custom Image Enhancement

```javascript
const enhanceImage = async (file) => {
  const enhanced = await enhanceImageQuality(file, {
    brightness: 15,      // Brighten
    contrast: 1.4,       // Increase contrast
    saturation: 0.9,     // Slightly desaturate
    rotation: 2          // Slight rotation correction
  });
  
  return enhanced;
};
```

### Example 4: Detect & Handle Duplicates

```javascript
const processItems = (items) => {
  // Check for duplicates
  const dups = detectDuplicates(items);
  
  if (dups.length > 0) {
    // Alert user
    addToast(`⚠️ Found ${dups.length} duplicate items`);
    
    // Auto-merge
    const merged = mergeDuplicates(items);
    setItems(merged);
  }
};
```

---

## 📈 Performance Notes

### Processing Time Estimates (Per Image)

| Operation | Time | Notes |
|-----------|------|-------|
| Image Preprocessing | 100-200ms | Varies by size |
| OCR Recognition | 2-5 seconds | Language dependent |
| Error Correction | 50-100ms | Per item |
| Duplicate Detection | <50ms | Fast algorithm |
| Receipt Analysis | 50-100ms | Pattern matching |
| **Total** | **3-6 seconds** | Full pipeline |

### Memory Optimization

- Images are compressed before OCR (max 1600px width)
- Processed images are stored in component state
- History uses localStorage (limited to available space)
- Batch processing handles one image at a time

---

## 🐛 Debugging Tips

### Check OCR Confidence

```javascript
console.log(ocrStats.avgConfidence);
// Good: 80-100
// Acceptable: 60-80
// Poor: <60
```

### View Detected Structure

```javascript
console.log(receiptTemplate);
// Check: hasHeader, hasItemsSection, hasFooter
```

### Monitor Duplicates

```javascript
console.log(detectedDuplicates);
// Array of { current, original } indices
```

### Verify Corrections

```javascript
const original = ocrResult.data.text;
const corrected = correctCommonOCRErrors(original);
console.log({ original, corrected });
```

---

## 🎓 Best Practices

### 1. Always Enable Duplicate Detection
```javascript
setDuplicateDetection(true);  // Default
```

### 2. Use Appropriate Filter Based on Input
```javascript
if (isHandwritten) setFilterType("contrast");
else if (isDarkImage) setFilterType("binary");
else setFilterType("enhanced");
```

### 3. Enable Auto Correct for Printed Text
```javascript
if (!handwritingMode) setAutoCorrectOCR(true);
```

### 4. Check Confidence Before Saving
```javascript
if (ocrStats.avgConfidence < 60) {
  addToast("⚠️ Low confidence - review items carefully");
}
```

### 5. Validate Receipt Structure
```javascript
if (!receiptTemplate.isStructured) {
  addToast("⚠️ Unusual receipt format - check parsing");
}
```

---

## 🔗 Integration Points

### Existing Functions Still Used
- `extractPricesAndMeta()`: Parses items after OCR
- `categorizeBillText()`: Auto-categorization
- `saveBill()`: Saves to backend
- `computeAnalytics()`: Analytics calculation

### Compatible With
- Voice input component
- Manual entry component
- Dashboard analytics
- Backend API endpoints

---

## 📝 Constants & Configuration

### Common OCR Error Mappings
```javascript
const COMMON_OCR_ERRORS = {
  "0": "O",      // Zero → Letter O
  "1": "I",      // One → Letter I
  "5": "S",      // Five → Letter S
  "8": "B",      // Eight → Letter B
  "rn": "m",     // rn → m (common misread)
  "ni": "m",     // ni → m (common misread)
  "ii": "u",     // ii → u (common misread)
  "l1": "ll"     // l1 → ll (common misread)
};
```

### Filter Types
```javascript
{
  "enhanced": "Default - best for most receipts",
  "contrast": "High contrast - emphasizes text",
  "binary": "Black & white conversion",
  "normal": "Minimal preprocessing"
}
```

---

## 🚀 Future Enhancements

Potential additions for future versions:
- [ ] Custom error dictionary editor
- [ ] Machine learning duplicate detection
- [ ] Handwriting style training
- [ ] Cloud-based preprocessing
- [ ] Parallel OCR processing
- [ ] Real-time confidence feedback
- [ ] Advanced receipt templating
- [ ] Currency conversion integration

---

**Developer Guide Last Updated**: December 8, 2025
**Version**: 2.0 Enhanced
**Status**: ✅ Production Ready
