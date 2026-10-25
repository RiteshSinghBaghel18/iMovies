import React, { useState, useEffect } from "react";
import confetti from "canvas-confetti";
import api from "../utils/api";
import { useAuth } from "../context/AuthContext";
import { 
  X, 
  ShieldCheck, 
  Lock, 
  Loader2,
  Sparkles,
  Zap,
  CheckCircle2,
  CreditCard,
  Smartphone,
  Info
} from "lucide-react";
import { toast } from "react-toastify";

const PaymentModal = ({ show, movie, selectedSeats, totalSeatPrice, onPaymentSuccess, onClose }) => {
  const { user } = useAuth();
  const [processing, setProcessing] = useState(false);
  const [razorpayKey, setRazorpayKey] = useState("");

  const convenienceFee = Math.round(totalSeatPrice * 0.05);
  const taxes = Math.round(totalSeatPrice * 0.025);
  const grandTotal = totalSeatPrice + convenienceFee + taxes;

  // Fetch Razorpay public key on mount
  useEffect(() => {
    api.get("/payment/get-key")
      .then((res) => {
        if (res.data?.key) setRazorpayKey(res.data.key);
      })
      .catch(() => {
        setRazorpayKey(import.meta.env.VITE_RAZORPAY_KEY_ID || "rzp_test_TrN3oYMB1qro7m");
      });
  }, []);

  /**
   * Strict 5-Step Transaction Flow with Razorpay:
   * Step 1: User reviews seats and clicks "Proceed to Pay with Razorpay"
   * Step 2: Frontend calls POST /api/payment/create-order
   * Step 3: Backend creates order on Razorpay servers & returns order_id
   * Step 4: Open Razorpay Checkout modal; on success, verify via POST /api/payment/verify
   * Step 5: Trigger confirmation, confetti celebration & ticket generation
   */
  const handleRazorpayPayment = async () => {
    setProcessing(true);

    try {
      // Step 2 & 3: Create Order on backend
      const orderRes = await api.post("/payment/create-order", {
        showId: show.showId,
        selectedSeats,
        amount: grandTotal,
      });

      if (!orderRes.data.success) {
        throw new Error(orderRes.data.message || "Failed to initialize payment order.");
      }

      const { order, keyId, bookingId } = orderRes.data;
      const activeKey = keyId || razorpayKey || "rzp_test_TrN3oYMB1qro7m";

      // Verify that Razorpay checkout script is loaded
      if (typeof window.Razorpay === "undefined") {
        await new Promise((resolve, reject) => {
          const script = document.createElement("script");
          script.src = "https://checkout.razorpay.com/v1/checkout.js";
          script.async = true;
          script.onload = resolve;
          script.onerror = () => reject(new Error("Unable to load Razorpay checkout script. Check network/ad-blocker."));
          document.body.appendChild(script);
        });
      }

      // Step 4: Configure Razorpay Checkout options with Amazon Prime cyan theme
      const options = {
        key: activeKey,
        amount: order.amount, // in paise
        currency: order.currency || "INR",
        name: "iMovies Box Office",
        description: `Booking for ${movie?.movieName || "Movie"} (${selectedSeats.length} Seats)`,
        image: "https://cdn-icons-png.flaticon.com/512/2809/2809590.png",
        order_id: order.id,
        prefill: {
          name: user?.username || "Movie Fan",
          email: user?.email || "demo@imovies.com",
          contact: "9876543210",
        },
        notes: {
          bookingId,
          showId: show.showId,
          seats: selectedSeats.join(", "),
        },
        theme: {
          color: "#ff6600", // Amazon Prime Cyan signature
        },
        modal: {
          ondismiss: function () {
            setProcessing(false);
            toast.info("Payment window closed. Your seats remain reserved until the timer expires.");
          },
        },
        handler: async function (response) {
          try {
            // Step 4 (continued): Cryptographic Signature Verification
            const verifyRes = await api.post("/payment/verify", {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              bookingId,
            });

            if (verifyRes.data.success) {
              setProcessing(false);

              // Step 5: Confetti celebration & confirmation
              confetti({
                particleCount: 140,
                spread: 90,
                origin: { y: 0.6 },
              });

              toast.success("Payment verified! Your ticket has been confirmed.");
              onPaymentSuccess({
                booking: verifyRes.data.booking,
                paymentMethod: "Razorpay (Test Mode)",
                paymentId: response.razorpay_payment_id,
              });
            } else {
              throw new Error(verifyRes.data.message || "Cryptographic signature mismatch.");
            }
          } catch (verifyErr) {
            setProcessing(false);
            console.error("[Verification Failed]:", verifyErr);
            toast.error(verifyErr.response?.data?.message || verifyErr.message || "Payment verification failed.");
          }
        },
      };

      const razorpayInstance = new window.Razorpay(options);

      razorpayInstance.on("payment.failed", function (failResponse) {
        setProcessing(false);
        toast.error(`Payment failed: ${failResponse.error.description || "Authorization declined."}`);
      });

      razorpayInstance.open();
    } catch (err) {
      setProcessing(false);
      console.error("[Razorpay Order Error]:", err);
      toast.error(err.response?.data?.message || err.message || "Failed to start Razorpay checkout.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-lg bg-[#121216] border border-[#27272a] rounded-2xl shadow-2xl overflow-hidden my-6">
        
        {/* Amazon Prime Styled Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#27272a] bg-[#09090b]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#ff6600]/15 text-[#ff6600] flex items-center justify-center border border-[#ff6600]/30">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-white text-base">Secure Gateway Checkout</h3>
              </div>
              <p className="text-xs text-[#a1a1aa]">Razorpay 256-Bit SSL Encrypted Verification</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={processing}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          
          {/* Order Summary Card */}
          <div className="p-5 rounded-xl bg-[#18181f] border border-[#27272a] space-y-3">
            <div className="flex justify-between items-start pb-2 border-b border-[#23324a]">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-[#ff6600]">Show Details</span>
                <h4 className="text-base font-bold text-white truncate max-w-[280px]">
                  {movie?.movieName || "Movie"}
                </h4>
                <p className="text-xs text-slate-300">
                  {show.theatreName} • {show.showDate} at {show.showTime}
                </p>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#ff6600]/20 text-[#ff6600] border border-[#ff6600]/30">
                Live Reserved
              </span>
            </div>

            <div className="flex justify-between items-center text-xs">
              <span className="text-[#a1a1aa]">Selected Seats ({selectedSeats.length}):</span>
              <span className="font-mono font-bold text-emerald-400">{selectedSeats.join(", ")}</span>
            </div>

            <div className="flex justify-between items-center text-xs">
              <span className="text-[#a1a1aa]">Tickets Base Price:</span>
              <span className="text-slate-200">₹{totalSeatPrice}</span>
            </div>

            <div className="flex justify-between items-center text-xs">
              <span className="text-[#a1a1aa]">Convenience Fee (5%):</span>
              <span className="text-slate-200">₹{convenienceFee}</span>
            </div>

            <div className="flex justify-between items-center text-xs">
              <span className="text-[#a1a1aa]">Integrated Taxes (2.5%):</span>
              <span className="text-slate-200">₹{taxes}</span>
            </div>

            <div className="pt-3 border-t border-[#23324a] flex justify-between items-center">
              <span className="font-bold text-white text-sm">Total Payable:</span>
              <span className="text-2xl font-black text-[#ff6600]">₹{grandTotal}</span>
            </div>
          </div>

          {/* Direct Payment Channel Info */}
          <div className="p-4 rounded-xl bg-[#09090b] border border-[#27272a] flex items-start gap-3">
            <Zap className="w-5 h-5 text-[#ff6600] flex-shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <p className="text-white font-semibold">Official Razorpay Test Gateway</p>
              <p className="text-[#a1a1aa]">
                Proceed directly to the Razorpay modal to pay using <span className="text-slate-200 font-medium">UPI (Google Pay, PhonePe, Paytm, QR)</span>, <span className="text-slate-200 font-medium">Credit/Debit Cards</span>, <span className="text-slate-200 font-medium">Net Banking</span>, or <span className="text-slate-200 font-medium">Wallets</span>.
              </p>
            </div>
          </div>

          {/* Action Button: Single Direct Razorpay Trigger */}
          <div className="space-y-3 pt-2">
            <button
              onClick={handleRazorpayPayment}
              disabled={processing}
              className="w-full py-4 px-6 rounded-xl font-black text-slate-950 bg-[#ff6600] hover:bg-[#ff7700] transition-all shadow-lg shadow-[#ff6600]/30 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed group text-base"
            >
              {processing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Contacting Payment Gateway...</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>Pay ₹{grandTotal} with Razorpay</span>
                </>
              )}
            </button>

            <div className="flex items-center justify-center gap-2 text-[11px] text-[#a1a1aa]">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Instant refund & Brevo email ticket confirmation guarantee</span>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

export default PaymentModal;
