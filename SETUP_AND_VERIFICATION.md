# Smart Billing - Complete Setup & Verification Guide

## 🚀 Quick Start

### Prerequisites
- Node.js (v14+)
- MongoDB (local or cloud)
- Twilio Account (optional, for SMS)
- Gmail Account (for Email OTP)

---

## 📋 Step 1: Backend Setup

### 1.1 Install Dependencies
```bash
cd backend
npm install
```

### 1.2 Create `.env` File
Copy from `.env.example` and fill in your credentials:

```env
# Server
PORT=5000

# Database
MONGO_URI=mongodb://127.0.0.1:27017/smart_billing

# JWT
JWT_SECRET=fa9b1e4c7d8a2f65bb48c3d197eab902f7346f8c21234f69d1efba78ad12c6f

# Email (Gmail)
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# Twilio (Optional - for SMS OTP)
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890

# Frontend
CLIENT_URL=http://localhost:5173
```

**📧 Gmail App Password Setup:**
1. Go to [Google Account Settings](https://myaccount.google.com/security)
2. Enable 2-Factor Authentication
3. Generate App Password for "Mail"
4. Use this 16-character password in `EMAIL_PASS`

**📱 Twilio Setup (Optional):**
1. Go to [Twilio Console](https://www.twilio.com/console)
2. Get `Account SID`, `Auth Token`, and `Phone Number`
3. Add to `.env` for SMS OTP delivery

### 1.3 Start MongoDB
```bash
# Windows
net start MongoDB

# Or use MongoDB Compass (GUI)
```

### 1.4 Start Backend Server
```bash
npm start
# Server runs on http://localhost:5000
```

---

## 📋 Step 2: Frontend Setup

### 2.1 Install Dependencies
```bash
cd frontend
npm install
```

### 2.2 Verify `.env.local`
```env
VITE_API_URL=http://localhost:5000/api
```

### 2.3 Start Frontend
```bash
npm run dev
# Frontend runs on http://localhost:5173
```

---

## ✅ Verification Checklist

### 1️⃣ Backend API Endpoints

Test these endpoints with Postman/Curl:

**Register:**
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "password123",
    "phone": "9876543210"
  }'

# Expected: 201 Created
```

**Login:**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'

# Expected: 200 OK with JWT token
```

**Forgot Password (Email):**
```bash
curl -X POST http://localhost:5000/api/auth/forgot \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "method": "email"
  }'

# Expected: 200 OK + Email sent
# Check: test@example.com inbox for OTP
```

**Forgot Password (SMS):**
```bash
curl -X POST http://localhost:5000/api/auth/forgot \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "phone": "+919876543210",
    "method": "sms"
  }'

# Expected: 200 OK + SMS sent
# Check: Phone number for OTP SMS
# Falls back to Email if Twilio not configured
```

**Reset Password:**
```bash
curl -X POST http://localhost:5000/api/auth/reset \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "otp": "123456",
    "password": "newpassword123"
  }'

# Expected: 200 OK + Confirmation email sent
```

### 2️⃣ Frontend Authentication Flow

1. **Register Page** (`http://localhost:5173/register`)
   - ✅ Fill form with name, email, phone (optional), password
   - ✅ Click "Register"
   - ✅ Navigate to Login page
   - ✅ Check email for confirmation (optional)

2. **Login Page** (`http://localhost:5173/login`)
   - ✅ Enter registered email and password
   - ✅ Click "Login"
   - ✅ Navigate to Dashboard

3. **Forgot Password Flow** (`http://localhost:5173/forgot`)
   - ✅ Step 1: Enter email → Click "Next"
   - ✅ Step 2: Select method (Email/SMS) → Enter phone if SMS → Click "Send OTP"
   - ✅ **Verify:** Check email inbox or SMS for OTP
   - ✅ Step 3: Enter 6-digit OTP → Click "Verify"
   - ✅ Navigate to Reset page

4. **Reset Password Page** (`http://localhost:5173/reset`)
   - ✅ Email pre-filled from Forgot flow
   - ✅ Enter new password (6+ chars, shows strength)
   - ✅ Confirm password
   - ✅ Click "Reset Password"
   - ✅ Success animation + auto-redirect to Login
   - ✅ **Verify:** Check email for confirmation message

### 3️⃣ Dashboard Features

#### Voice Input (Advanced)
- ✅ Click "Start" to listen
- ✅ Try: "Add milk two hundred" → Item added with qty 1, price 200
- ✅ Try: "Bread 5 fifty" → Item added with qty 5, price 50
- ✅ Try: "Five plus three" → Calculates 5 + 3 = 8 ✓ Display result
- ✅ Try: "Twenty divided by four" → Calculates 20 ÷ 4 = 5 ✓
- ✅ Try: "9 mod 5" → Calculates 9 % 5 = 4 ✓
- ✅ "Total" → Speaks bill total
- ✅ "Save" → Saves bill to database
- ✅ Download bill as PDF ✓
- ✅ Download bill as Excel ✓
- ✅ Download calculations as PDF ✓

#### Manual Calculator (Enhanced)
- ✅ Input: 5 + 3 = 8 ✓
- ✅ Input: 20 / 4 = 5 ✓
- ✅ Functions: sin(0), cos(0), sqrt(16) = 4 ✓
- ✅ History displays with timestamps ✓
- ✅ Download history as PDF ✓
- ✅ Download history as Excel ✓
- ✅ Add item from calculator result ✓
- ✅ Save bill to database ✓

#### OCR (Image Upload)
- ✅ Upload receipt/bill image
- ✅ Select filter: "Enhanced" (recommended for handwritten)
- ✅ Click "Run OCR"
- ✅ Displays confidence score
- ✅ Shows extracted text
- ✅ Parses items, quantity, price, total
- ✅ Edit text if needed, re-parse
- ✅ Save bill to database
- ✅ Download as PDF, Excel, CSV ✓
- ✅ View bill history ✓

### 4️⃣ Database Bill Verification

After saving bills via Voice/Calculator/OCR, verify in MongoDB:

```bash
# Connect to MongoDB
mongo

# Select database
use smart_billing

# View saved bills
db.bills.find().pretty()

# Expected: Bills with items, total, source (voice/ocr/calculator)
```

---

## 🔍 OTP Delivery Verification

### Email OTP
1. **Prerequisites:**
   - Gmail account with App Password configured
   - `EMAIL_USER` and `EMAIL_PASS` in `.env`

2. **Test:**
   - Go to Forgot page
   - Enter registered email
   - Select "Email" method
   - Click "Send OTP"
   - **Check:** Email inbox within 30 seconds
   - Should receive: "Smart Billing - Password Reset OTP"
   - Contains: 6-digit OTP + validity info

3. **Troubleshoot:**
   - Check spam folder
   - Verify EMAIL_USER/EMAIL_PASS in `.env`
   - Check backend logs: `[DEV EMAIL] from email, subject, html`

### SMS OTP (Optional)
1. **Prerequisites:**
   - Twilio account with SID, Token, Phone Number
   - `TWILIO_*` configured in `.env`
   - Valid phone number with country code (+91 for India)

2. **Test:**
   - Go to Forgot page
   - Enter email + phone number
   - Select "SMS" method
   - Click "Send OTP"
   - **Check:** SMS received within 30 seconds
   - Should contain: "Your Smart Billing OTP is: XXXXXX. Valid for 10 minutes."

3. **Fallback (No Twilio):**
   - If Twilio not configured, falls back to Email
   - OTP still sent, no error shown
   - Check email instead

---

## 🚨 Troubleshooting

### ❌ "Email not working"
**Solution:**
```
1. Verify EMAIL_USER has Gmail address format
2. Confirm EMAIL_PASS is 16-char App Password (not regular password)
3. Check `.env` has no extra spaces
4. Restart backend server
5. Check backend console logs for [DEV EMAIL] message
6. Try sending again
```

### ❌ "SMS not received"
**Solution:**
```
1. Verify phone number: +91 for India, +1 for USA, etc.
2. Confirm Twilio Account SID & Auth Token are correct
3. Check Twilio phone number is active
4. If error, automatic fallback to Email occurs
5. Check email instead
```

### ❌ "OTP expired"
**Solution:**
```
1. OTP valid for 10 minutes from generation
2. If expired: Go back to Forgot page and send new OTP
3. Check system time on server & local machine are in sync
```

### ❌ "Database connection failed"
**Solution:**
```
1. Verify MongoDB is running: net start MongoDB
2. Check MONGO_URI in .env
3. For cloud: Use MongoDB Atlas URI
4. Test: mongo command should connect
```

### ❌ "CORS error on frontend"
**Solution:**
```
1. Verify VITE_API_URL=http://localhost:5000/api
2. Backend has CORS configured to allow *
3. Frontend and backend running on correct ports
4. Clear browser cache and reload
```

---

## 📊 Advanced Testing

### Load Testing (Multiple Bills)

```bash
# Script: Create 10 test bills via API

for i in {1..10}; do
  curl -X POST http://localhost:5000/api/bills \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer YOUR_JWT_TOKEN" \
    -d "{
      \"items\": [
        {\"name\": \"Item $i\", \"qty\": $((RANDOM % 10 + 1)), \"price\": $((RANDOM % 1000 + 100))}
      ],
      \"total\": $((RANDOM % 5000 + 500))
    }"
done
```

### OTP Rate Limiting Test
- Forgot page should limit OTP requests to 1 per 60 seconds
- Prevents spam/abuse

---

## 🎯 Success Criteria

✅ **All 4 phases complete:**
1. ✅ User Registration with validation
2. ✅ User Login with JWT token
3. ✅ Password Recovery via Email OTP
4. ✅ Password Reset with confirmation

✅ **Dashboard Features:**
1. ✅ Voice input recognizes items & math
2. ✅ Calculator processes expressions
3. ✅ OCR extracts handwritten text (Enhanced filter)
4. ✅ All bills save to database
5. ✅ Download bills as PDF/Excel/CSV

✅ **Email/SMS Delivery:**
1. ✅ OTP sent within 30 seconds
2. ✅ Email received in inbox (not spam)
3. ✅ SMS received if Twilio configured
4. ✅ Fallback works if one method unavailable

---

## 📞 Support

For issues, check:
1. Backend logs: `node server.js` output
2. Browser console: F12 → Console tab
3. MongoDB: `mongo` → `use smart_billing` → `db.users.find()`
4. Email logs: Check `.env` EMAIL credentials
5. Twilio: Check Account SID & Phone Number

---

**Happy Billing! 🎉**
