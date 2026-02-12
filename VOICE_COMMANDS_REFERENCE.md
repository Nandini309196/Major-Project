# 🎤 Voice Commands Reference Guide

## Complete Voice Command List

### 📝 Adding Items via Voice

#### Basic Format
```
"add [item_name] [quantity] [price]"

Examples:
✅ "add milk two hundred" → 1 × milk @ ₹200
✅ "add bread five fifty" → 5 × bread @ ₹50
✅ "add butter two hundred" → 2 × butter @ ₹100
✅ "add juice three hundred" → 3 × juice @ ₹300
```

#### Alternative Formats
```
"[item_name] [quantity] [price]"

Examples:
✅ "rice 2 hundred" → 2 × rice @ ₹100
✅ "oil 1 500" → 1 × oil @ ₹500
✅ "sugar 5 hundred" → 5 × sugar @ ₹100
✅ "flour 3 eighty" → 3 × flour @ ₹80
```

#### Advanced Format
```
"[quantity] [item_name] [price]"

Examples:
✅ "5 bread fifty" → 5 × bread @ ₹50
✅ "2 eggs hundred" → 2 × eggs @ ₹100
✅ "10 chips thirty" → 10 × chips @ ₹30
```

---

## ➕ Math Operations

### Basic Arithmetic
```
"[number] [operation] [number]"

Operations:
✅ plus → "five plus three" = 8
✅ minus → "ten minus two" = 8
✅ times → "four times five" = 20
✅ multiplied by → "six multiplied by three" = 18
✅ into → "eight into two" = 16
✅ divided by → "twenty divided by four" = 5
✅ divide → "fifty divide five" = 10
```

### Modulo Operation
```
✅ "nine mod five" = 4
✅ "fifteen modulo three" = 0
✅ "ten percent three" = 1 (using %)
```

### Power Operations
```
✅ "two power three" = 8
✅ "five to the power of two" = 25
✅ "ten caret two" = 100
```

---

## 🔢 Scientific Functions

### Trigonometric Functions
```
✅ "sin forty five" = 0.707
✅ "cos zero" = 1
✅ "tan thirty" = 0.577

Note: Angles in radians or degrees (varies by browser)
```

### Square Root & Power
```
✅ "square root sixteen" = 4
✅ "sqrt twenty five" = 5
✅ "square root one hundred" = 10
```

### Logarithmic Functions
```
✅ "log ten" = 1 (base 10)
✅ "log hundred" = 2
✅ "ln two point seven one eight" = 1
```

### Absolute Value
```
✅ "abs negative five" = 5
✅ "absolute value minus ten" = 10
```

---

## 🔤 Number Words Supported

### Basic Numbers
```
✅ zero, one, two, three, four, five
✅ six, seven, eight, nine, ten
✅ eleven through nineteen
```

### Tens
```
✅ twenty, thirty, forty, fifty
✅ sixty, seventy, eighty, ninety
```

### Large Numbers
```
✅ hundred = 100
✅ thousand = 1000
```

### Examples with Words
```
"twenty five" = 25
"one hundred fifty" = 150
"three thousand" = 3000
"five hundred twelve" = 512
```

---

## 💰 Bill Management Commands

### Total Command
```
Syntax: "total" or "show total" or "bill total"

Effect: App speaks the current bill total amount

Examples:
🎤 Say: "total"
📢 App says: "Total bill amount is rupees 700"

🎤 Say: "what's the total"
📢 App says: "Total bill amount is rupees 500"
```

### Save Command
```
Syntax: "save" or "save bill" or "save the bill"

Effect: Saves current bill to database

Examples:
🎤 Say: "save"
✓ Bill saved successfully to database

🎤 Say: "save bill"
✓ Saved 5 items, total ₹1200

Status: Check Dashboard for saved bill
```

### Clear Command
```
Syntax: "clear" or "reset" or "remove all" or "clear items"

Effect: Removes all items from current bill

Examples:
🎤 Say: "clear"
✓ Items cleared, ready for new bill

🎤 Say: "reset"
✓ All items removed from bill
```

---

## 🎯 Advanced Voice Features

### Confidence Scoring
```
✅ Voice commands show confidence %
✅ Ranges from 85-95%
✅ Higher = better parsing accuracy
✅ Shows in real-time on screen
```

### Item Quantity Recognition
```
Automatic qty calculation from voice:

Examples:
"add bread 5 fifty" automatically detects:
- Item: bread
- Quantity: 5
- Price: ₹50

"rice 2 hundred" automatically detects:
- Item: rice
- Quantity: 2
- Price: ₹100
```

### Amount Calculation
```
System automatically calculates:
Item × Quantity × Price = Amount

Example:
"add milk 2 hundred"
- Milk: 2 units
- Price: ₹100 per unit
- Total: 2 × 100 = ₹200 ✓
```

---

## 📊 Calculation History Features

### Auto-Display
```
✅ Shows last 10 calculations
✅ Displays expression and result
✅ Shows timestamp for each calc
✅ Updates in real-time
```

### Download Calculations
```
Steps:
1. Perform calculations via voice
2. Click "📥 Download PDF"
3. Get formatted PDF with all calcs
4. Each calc includes timestamp
```

---

## 🔗 Punctuation & Formatting

### Supported Punctuation
```
✅ "open bracket" = (
✅ "close bracket" = )
✅ "open paren" = (
✅ "close paren" = )
✅ "point" = .
```

### Complex Expressions
```
✅ "open bracket five plus three close bracket times two"
   = (5+3)*2 = 16

✅ "square root open paren nine times four close paren"
   = sqrt(9*4) = 6
```

---

## ⚠️ Limitations & Tips

### What Works Best
```
✅ Slow, clear speech
✅ Short sentences
✅ Number words vs digits
✅ Standard English pronunciation
✅ Quiet environment (minimal background noise)
```

### What Doesn't Work
```
❌ Rapid speech
❌ Heavy accents (may vary)
❌ Very long sentences
❌ Background noise/music
❌ Special characters beyond basic math
```

### Troubleshooting
```
If not recognized:
1. Speak more slowly
2. Use simpler commands
3. Check microphone is on
4. Reduce background noise
5. Use standard English pronunciation
```

---

## 📱 Voice Features

### Real-Time Features
```
✅ Live transcript display
✅ Confidence percentage
✅ Listening indicator (pulsing dot)
✅ Instant item addition
✅ Auto-calculation
```

### Feedback Features
```
✅ Text-to-Speech (TTS) confirmation
✅ Bill total spoken aloud
✅ Success messages
✅ Error notifications
```

---

## 🎓 Learning Examples

### Complete Workflow
```
Step 1: Say "add milk two hundred"
✓ Item added: 1 × milk @ ₹200

Step 2: Say "bread five fifty"
✓ Item added: 5 × bread @ ₹50

Step 3: Say "total"
📢 App says: "Total bill amount is rupees 450"

Step 4: Say "five plus three"
✓ Calculation: 5+3 = 8

Step 5: Say "save"
✓ Bill saved to database

Step 6: Click "Download PDF"
✓ Bill exported as PDF
```

### Math Intensive Workflow
```
Say: "five plus three"
✓ Result: 8

Say: "twenty divided by four"
✓ Result: 5

Say: "sqrt sixteen"
✓ Result: 4

Say: "nine mod five"
✓ Result: 4

Click: "📥 Download PDF"
✓ All 4 calculations exported
```

### Shopping List Workflow
```
Say: "add rice 5 hundred"
Say: "add oil 2 500"
Say: "add sugar 3 hundred"
Say: "add flour 2 eighty"
Say: "total"
Say: "save"
✓ 4-item bill saved ₹1560
```

---

## 🔊 Audio & Speech Recognition

### Browser Support
```
✅ Chrome/Chromium - Full support
✅ Edge - Full support
✅ Firefox - Limited (varies)
✅ Safari - Limited (iOS/macOS)
```

### Microphone Requirements
```
✅ Microphone must be enabled
✅ Browser permission needed (first time)
✅ "Allow" access when prompted
✅ Check permissions in browser settings
```

### Speech Settings
```
Language: English (US) - Default
- Can be changed in OCR component lang selector
Rate: Normal speed (1.0x)
Pitch: Normal (1.0x)
```

---

## 💡 Pro Tips

### Tip 1: Use Number Words
```
✅ Say "five" instead of "5"
✅ Say "fifty" instead of "50"
✅ Say "two hundred" instead of "200"
Increases recognition accuracy
```

### Tip 2: Speak Naturally
```
✅ "add milk two hundred" (natural)
❌ "m-i-l-k, two, hundred" (unnatural)
Natural speech has better accuracy
```

### Tip 3: Short Commands
```
✅ "add rice 2 hundred" (short, clear)
❌ "can you please add some rice, I need 2 units of rice at hundred rupees" (too long)
Shorter = More accurate
```

### Tip 4: Use Context
```
App remembers:
- Current items in bill
- Bill total amount
- Calculation history
- Recent items added
Use this to refine commands
```

### Tip 5: Verification
```
✅ Always check displayed items
✅ Confidence % shows accuracy
✅ Expand bill to verify
✅ Edit before saving if needed
```

---

## 🎤 Testing Voice

### Quick Test Script
```
1. Start Voice mode
2. Say "add milk two hundred"
   ✓ Should show: 1 × milk @ ₹200
   
3. Say "five plus three"
   ✓ Should show: 5+3 = 8
   
4. Say "total"
   ✓ App should speak: "Total is 200"
   
5. Say "clear"
   ✓ Items should be removed
```

---

## 📚 Advanced References

### Math Operations Reference
```
+ (plus) → Addition
- (minus) → Subtraction
* (times) → Multiplication
/ (divided by) → Division
% (mod/modulo) → Remainder
** (power) → Exponentiation
sqrt → Square root
sin, cos, tan → Trig functions
log → Base 10 logarithm
ln → Natural logarithm
```

### Constants Available
```
π (pi) ≈ 3.14159
e (euler) ≈ 2.71828
```

---

## 🚀 Getting Started

To start using voice commands:
1. Go to Dashboard
2. Click "🎤 Voice Input" mode
3. Click "▶ Start" button
4. Microphone will activate
5. Speak your command clearly
6. Transcript appears in real-time
7. Items added automatically
8. Review and save when done

---

**Happy Voice Billing! 🎤** 

For more help, check QUICK_START.md or SETUP_AND_VERIFICATION.md
