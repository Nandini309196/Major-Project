import React, { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";

export default function Forgot() {
  const [step, setStep] = useState(1); // 1: email, 2: method, 3: otp
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [otpMethod, setOtpMethod] = useState("email");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(false);
  const [error, setError] = useState("");
  const nav = useNavigate();

  const validateEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const validatePhone = (phone) => {
    return /^\d{10}$/.test(phone.replace(/\D/g, ""));
  };

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 600);
  };

  // Step 1: Verify Email
  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!validateEmail(email)) {
      setError("Please enter a valid email address");
      triggerShake();
      return;
    }

    setLoading(true);
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/auth/forgot`, { email });
      setStep(2); // Move to method selection
    } catch (err) {
      const errorMsg = err?.response?.data?.message || "Email not found";
      setError(errorMsg);
      triggerShake();
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Send OTP
  const handleSendOTP = async () => {
    setError("");

    if (otpMethod === "sms" && !phone) {
      setError("Please enter your phone number");
      triggerShake();
      return;
    }

    if (otpMethod === "sms" && !validatePhone(phone)) {
      setError("Please enter a valid 10-digit phone number");
      triggerShake();
      return;
    }

    setLoading(true);
    try {
      const payload = { email, method: otpMethod };
      if (otpMethod === "sms") {
        payload.phone = phone;
      }
      await axios.post(`${import.meta.env.VITE_API_URL}/auth/forgot`, payload);
      setStep(3); // Move to OTP verification
    } catch (err) {
      const errorMsg = err?.response?.data?.message || "Failed to send OTP";
      setError(errorMsg);
      triggerShake();
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Verify OTP
  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setError("");

    if (!otp || otp.length !== 6) {
      setError("Please enter a valid 6-digit OTP");
      triggerShake();
      return;
    }

    setLoading(true);
    try {
      // Store email and otp for reset page
      localStorage.setItem("resetEmail", email);
      localStorage.setItem("resetOTP", otp);
      nav("/reset");
    } catch (err) {
      const errorMsg = err?.response?.data?.message || "Invalid OTP";
      setError(errorMsg);
      triggerShake();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-amber-900 via-red-900 to-purple-900 p-4">
      {/* Animated Background Elements */}
      <div className="absolute w-96 h-96 bg-red-500/30 blur-3xl rounded-full top-0 right-0 animate-pulse"></div>
      <div className="absolute w-96 h-96 bg-orange-500/30 blur-3xl rounded-full bottom-0 left-0 animate-pulse"></div>

      {/* Floating Particles */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(15)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animation: `float ${3 + Math.random() * 5}s infinite`,
              animationDelay: `${Math.random() * 4}s`,
              opacity: Math.random() * 0.7 + 0.3,
            }}
          ></div>
        ))}
      </div>

      {/* Main Card */}
      <div className={`relative z-10 w-full max-w-md transform transition-all duration-300 ${shake ? "animate-shake" : ""}`}>
        <div className="bg-white/10 backdrop-blur-2xl rounded-3xl p-8 shadow-2xl border border-white/20 hover:border-orange-400/50 transition">
          {/* Progress Indicator */}
          <div className="flex justify-center gap-2 mb-8">
            {[1, 2, 3].map((num) => (
              <div
                key={num}
                className={`w-3 h-3 rounded-full transition ${
                  step >= num ? "bg-orange-400 scale-125" : "bg-white/30"
                }`}
              ></div>
            ))}
          </div>

          {/* STEP 1: Email Input */}
          {step === 1 && (
            <>
              <div className="text-center mb-8">
                <div className="text-5xl mb-3">📧</div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">
                  Reset Password
                </h1>
                <p className="text-gray-300 text-sm mt-2">Enter your email to get started</p>
              </div>

              {error && (
                <div className="bg-red-500/20 border border-red-500/50 text-red-200 p-3 rounded-lg mb-4 text-sm animate-fadeIn">
                  ⚠️ {error}
                </div>
              )}

              <form onSubmit={handleEmailSubmit} className="space-y-4">
                <div>
                  <label className="block text-gray-300 text-sm font-semibold mb-2">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full p-3 rounded-lg bg-white/10 text-white placeholder-gray-400 border border-white/20 focus:border-orange-400 focus:outline-none transition"
                    placeholder="you@example.com"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-bold rounded-lg shadow-lg transform hover:scale-105 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Verifying...
                    </span>
                  ) : (
                    "Continue"
                  )}
                </button>

                <p className="text-center text-gray-400 text-sm">
                  Remember your password?{" "}
                  <Link to="/" className="text-orange-400 hover:text-orange-300 font-semibold transition">
                    Login
                  </Link>
                </p>
              </form>
            </>
          )}

          {/* STEP 2: OTP Method Selection */}
          {step === 2 && (
            <>
              <div className="text-center mb-8">
                <div className="text-5xl mb-3">📨</div>
                <h1 className="text-3xl font-bold text-white">How to receive OTP?</h1>
                <p className="text-gray-300 text-sm mt-2">Choose your preferred method</p>
              </div>

              {error && (
                <div className="bg-red-500/20 border border-red-500/50 text-red-200 p-3 rounded-lg mb-4 text-sm animate-fadeIn">
                  ⚠️ {error}
                </div>
              )}

              <div className="space-y-4 mb-6">
                {/* Email Option */}
                <label className={`p-4 rounded-lg border-2 cursor-pointer transition ${
                  otpMethod === "email"
                    ? "bg-orange-500/20 border-orange-400 ring-2 ring-orange-400/50"
                    : "bg-white/10 border-white/20 hover:border-orange-400/50"
                }`}>
                  <input
                    type="radio"
                    value="email"
                    checked={otpMethod === "email"}
                    onChange={(e) => setOtpMethod(e.target.value)}
                    className="mr-3"
                  />
                  <span className="text-white font-semibold">📧 Email</span>
                  <p className="text-gray-300 text-sm mt-1">OTP will be sent to your email</p>
                </label>

                {/* SMS Option */}
                <label className={`p-4 rounded-lg border-2 cursor-pointer transition ${
                  otpMethod === "sms"
                    ? "bg-orange-500/20 border-orange-400 ring-2 ring-orange-400/50"
                    : "bg-white/10 border-white/20 hover:border-orange-400/50"
                }`}>
                  <input
                    type="radio"
                    value="sms"
                    checked={otpMethod === "sms"}
                    onChange={(e) => setOtpMethod(e.target.value)}
                    className="mr-3"
                  />
                  <span className="text-white font-semibold">📱 SMS</span>
                  <p className="text-gray-300 text-sm mt-1">OTP will be sent to your phone</p>
                </label>

                {/* Phone Input for SMS */}
                {otpMethod === "sms" && (
                  <div className="mt-4 pt-4 border-t border-white/10">
                    <label className="block text-gray-300 text-sm font-semibold mb-2">Phone Number</label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full p-3 rounded-lg bg-white/10 text-white placeholder-gray-400 border border-white/20 focus:border-orange-400 focus:outline-none transition"
                      placeholder="1234567890"
                    />
                  </div>
                )}
              </div>

              <button
                onClick={handleSendOTP}
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-bold rounded-lg shadow-lg transform hover:scale-105 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Sending...
                  </span>
                ) : (
                  "Send OTP"
                )}
              </button>

              <button
                onClick={() => {
                  setStep(1);
                  setError("");
                }}
                className="w-full mt-3 py-2 text-gray-300 hover:text-white transition"
              >
                ← Go Back
              </button>
            </>
          )}

          {/* STEP 3: OTP Verification */}
          {step === 3 && (
            <>
              <div className="text-center mb-8">
                <div className="text-5xl mb-3">🔐</div>
                <h1 className="text-3xl font-bold text-white">Enter OTP</h1>
                <p className="text-gray-300 text-sm mt-2">We sent a 6-digit code to your {otpMethod === "email" ? "email" : "phone"}</p>
              </div>

              {error && (
                <div className="bg-red-500/20 border border-red-500/50 text-red-200 p-3 rounded-lg mb-4 text-sm animate-fadeIn">
                  ⚠️ {error}
                </div>
              )}

              <form onSubmit={handleVerifyOTP} className="space-y-4">
                <div>
                  <label className="block text-gray-300 text-sm font-semibold mb-2">OTP Code</label>
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    className="w-full p-4 rounded-lg bg-white/10 text-white placeholder-gray-400 border border-white/20 focus:border-orange-400 focus:outline-none transition text-center text-3xl tracking-widest font-bold"
                    placeholder="000000"
                    maxLength="6"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-bold rounded-lg shadow-lg transform hover:scale-105 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Verifying...
                    </span>
                  ) : (
                    "Verify & Continue"
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setStep(2);
                    setOtp("");
                    setError("");
                  }}
                  className="w-full mt-3 py-2 text-gray-300 hover:text-white transition"
                >
                  ← Change Method
                </button>
              </form>
            </>
          )}
        </div>
      </div>

      {/* Animations */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }

        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-10px); }
          75% { transform: translateX(10px); }
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .animate-fadeIn {
          animation: fadeIn 0.4s ease-in-out;
        }

        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
      `}</style>
    </div>
  );
}
