# 🚀 Quick Start Guide - Smart Billing v2.0

## Get Started in 5 Minutes

### Step 1: Start the Services (2 min)

**Terminal 1 - Backend:**
```bash
cd backend
npm start
# Opens on http://localhost:5000
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
# Opens on http://localhost:5173
```

**Terminal 3 - MongoDB (if not running):**
```bash
net start MongoDB
```

---

## Step 2: Create Account (1 min)

1. Go to `http://localhost:5173/register`
2. Fill in:
   - **Name**: Your Name
   - **Email**: your@email.com
   - **Password**: YourPassword123
3. Click **Register** ✓
4. Go to Login page

---

## Step 3: Login (30 sec)

1. Enter your email and password
2. Click **Login** ✓
3. You're on the Dashboard!

---

## 🎤 Try Voice Input (The Fun Part!)

### Basic Examples

**Add Items by Voice:**
```
🎤 Say: "Add milk two hundred"
Result: 1 × milk @ ₹200 ✓

🎤 Say: "Bread 5 fifty"
Result: 5 × bread @ ₹50 ✓

🎤 Say: "Butter 2 hundred"
Result: 2 × butter @ ₹100 ✓
```

**Perform Math:**
```
🎤 Say: "Five plus three"
Result: = 8 ✓

🎤 Say: "Twenty divided by four"
Result: = 5 ✓

🎤 Say: "9 mod 5"
Result: = 4 ✓
```

**Commands:**
```
🎤 Say: "Total" → App speaks the bill total
🎤 Say: "Save" → Bill is saved to database
🎤 Say: "Clear" → All items removed
```

**Then:**
- 💾 Click "Save Bill to DB" to save
- 📥 Click "Download PDF" to export
- 📊 Click "Download Excel" for spreadsheet

---

## 🧮 Try Manual Calculator

1. Click "⌨️ Manual Entry" mode
2. Enter calculation: `5 + 3`
3. Click `=` → Shows `8`
4. Add to bill:
   - Type Item name: "Service"
   - Quantity: 1
   - Price: 8
   - Click "Add Item"
5. Click "Save Bill to DB"
6. Download as PDF or Excel

---

## 🖼️ Try OCR (Scan Bills)

1. Click "🖼️ OCR Scanning" mode
2. Upload a bill/receipt image
3. Select filter: **Enhanced** (for handwritten)
4. Click "Run OCR"
5. Wait for text extraction (shows confidence %)
6. Review extracted items
7. Edit if needed
8. Click "Save Bill to DB"
9. Download as PDF/Excel

---

## 📋 Check Your Dashboard

- **Header Stats**: Shows total bills, amount spent, average
- **Statistics Cards**: Visual summary of spending
- **Bills List**: All your saved bills with:
  - Date & amount
  - Item count
  - Preview of first 3 items
  - "View All" button to expand
  - Delete button to remove

---

## 🔐 Password Recovery Test

### Forgot Password Flow

1. Go to `http://localhost:5173/forgot`
2. Enter your email
3. Click "Next"
4. Select method:
   - **Email**: Receives OTP in inbox (usually 30 sec)
   - **SMS**: Requires Twilio setup (optional)
5. If SMS, enter phone number like `9876543210`
6. Click "Send OTP"
7. Check email/SMS for 6-digit OTP
8. Enter OTP in Step 3
9. Go to Reset page
10. Enter new password (6+ characters)
11. Confirm password
12. Click "Reset Password"
13. See success animation
14. Auto-redirected to Login (2 sec)
15. Login with new password ✓

---

## 📊 Bill Management

### View All Items in a Bill
1. Click "► View All" on any bill card
2. See complete item list
3. Quantity, rate, amount for each item
4. Total displayed at bottom
5. Click "▼ Hide" to collapse

### Delete a Bill
1. Click "🗑 Delete" on any bill
2. Confirm deletion
3. Bill removed from list and database
4. Dashboard stats auto-update

### Refresh Bills
1. Create new bills
2. Click "🔄 Refresh" button
3. Dashboard updates instantly

---

## 📥 Download Options

### From Voice
- 📄 **PDF**: Bill with items, quantities, rates
- 📊 **Excel**: Formatted spreadsheet
- 📄 **Calculation PDF**: All math operations

### From Calculator
- 📄 **PDF**: History with expressions & results
- 📊 **Excel**: Spreadsheet format
- 📋 **Clear**: Remove all history

### From OCR
- 📄 **PDF**: Professional invoice
- 📊 **Excel**: Spreadsheet
- 📋 **CSV**: Raw data
- 📦 **Bulk Export**: All bills at once

---

## 🎯 Pro Tips

### Voice Tips
```
✅ Speak clearly and slowly
✅ Say numbers as words: "two" not "2"
✅ Use natural language: "add milk two hundred"
✅ For math, use: "plus", "minus", "divided by"
✅ Confidence % shows parsing accuracy
```

### Calculator Tips
```
✅ Scientific functions: sin(45), sqrt(16), log(100)
✅ Use parentheses for complex: (5+3)*2
✅ Constants available: π (pi), e (euler)
✅ Undo (↶) and Redo (↷) buttons for fixing
✅ History auto-saves in browser
```

### OCR Tips
```
✅ Use "Enhanced" filter for handwritten text
✅ Use "Binary" for very low contrast
✅ Use "Contrast" for faded receipts
✅ Upload clear, well-lit images
✅ Confidence % shows OCR accuracy
✅ Edit extracted text before saving
```

---

## 🐛 Quick Troubleshooting

| Issue | Solution |
|-------|----------|
| Voice not working | Check microphone, browser support |
| OTP not received | Check email spam, verify Gmail App Password |
| OCR not accurate | Try "Enhanced" filter, check image quality |
| Bills not saving | Check database connection, verify backend logs |
| Download not working | Enable downloads in browser, check file size |

---

## 📊 Sample Workflow

```
1. Say: "Add rice 2 hundred"
   ↓
2. Say: "Add oil 1 500"
   ↓
3. Say: "Total"
   → App says: "Total bill amount is rupees 700"
   ↓
4. Click "Save Bill to DB"
   ✓ Bill saved
   ↓
5. Click "Download PDF"
   ✓ Download complete
```

---

## 🎓 Advanced Usage

### Calculate with Voice Then Add to Bill
```
1. Say: "5 plus 3"
   ↓ Result: 8 shown in Calculations
2. Add to bill as item amount
3. Continue adding items via voice
4. Save bill
```

### Upload Receipt → Extract Items → Verify → Save
```
1. Switch to OCR mode
2. Upload receipt image
3. Select "Enhanced" filter
4. OCR runs automatically
5. Review extracted items
6. Edit quantities if needed
7. Save to database
8. Download as required format
```

### Manual Entry with Scientific Calculations
```
1. Calculate: sin(45) = 0.707
2. Add to bill: "Service charge" @ 0.707 × 100 = 70.7
3. Save bill
4. Download for record
```

---

## ✅ Verification Checklist

After setup, verify:
- [ ] Can login with credentials
- [ ] Voice recognizes "Add bread 5 fifty"
- [ ] Calculator shows 5+3=8
- [ ] OCR extracts text from image
- [ ] Bill saves to database
- [ ] Can download as PDF/Excel
- [ ] Can delete bills
- [ ] Dashboard shows statistics
- [ ] Forgot password sends email OTP
- [ ] Can reset password with OTP

---

## 🎉 You're All Set!

Enjoy the advanced Smart Billing experience with:
- 🎤 Voice input for quick entry
- 🧮 Scientific calculator
- 🖼️ Bill scanning via OCR
- 💾 Multiple export formats
- 🔐 Secure authentication
- 📊 Beautiful dashboard

**Happy Billing! 🚀**

---

**Questions?** Check:
1. `SETUP_AND_VERIFICATION.md` - Detailed setup guide
2. `FEATURES_SUMMARY.md` - Complete feature list
3. Backend logs: Check console output
4. Frontend console: F12 → Console tab
