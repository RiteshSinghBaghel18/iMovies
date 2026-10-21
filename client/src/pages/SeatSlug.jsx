import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { io } from 'socket.io-client';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Loader from '../components/Loader';
import { api, API_URL } from '../utils/api';
import { useTheme } from '../utils/ThemeContext';
import dayjs from 'dayjs';

const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

function SeatSlug() {
  const { showId } = useParams();
  const navigate = useNavigate();

  const [show, setShow] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [bookedSeats, setBookedSeats] = useState(new Set());
  const [lockedSeats, setLockedSeats] = useState(new Set());
  const [bookingInProgress, setBookingInProgress] = useState(false);

  // 10-Minute Countdown Timer (600s)
  const [timeLeft, setTimeLeft] = useState(600);
  const timerRef = useRef(null);
  const socketRef = useRef(null);

  // Fetch show details — API returns { show, movie, theatre }
  const fetchShow = async () => {
    try {
      setLoading(true);
      const res = await api.getShowById(showId);
      const payload = res.data || {};
      const showObj = payload.show || payload.data?.show || payload;
      const movieObj = payload.movie || payload.data?.movie || null;
      const theatreObj = payload.theatre || payload.data?.theatre || null;

      setShow({ ...showObj, _movie: movieObj, _theatre: theatreObj });

      // Derive locked/booked from the tickets map stored on the show
      const tickets = showObj?.tickets || {};
      const booked = new Set();
      const locked = new Set();
      Object.entries(tickets).forEach(([seatId, seat]) => {
        if (seat.status === 'booked') booked.add(seatId);
        else if (seat.status === 'locked') locked.add(seatId);
      });
      setBookedSeats(booked);
      setLockedSeats(locked);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load show seating details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (showId) {
      fetchShow();
    }

    // Preload Razorpay Checkout Script
    loadRazorpayScript();

    // Socket.io connection to backend
    try {
      const socket = io(API_URL || 'http://localhost:5000', {
        transports: ['websocket', 'polling'],
        reconnectionAttempts: 3,
      });
      socketRef.current = socket;

      socket.on('connect', () => {
        socket.emit('join-show', showId);
      });

      socket.on('seat-update', (update) => {
        if (!update || (update.showId && update.showId !== showId)) return;
        if (update.tickets && typeof update.tickets === 'object') {
          const newBooked = new Set();
          const newLocked = new Set();
          Object.entries(update.tickets).forEach(([seatId, seat]) => {
            if (seat.status === 'booked') newBooked.add(seatId);
            else if (seat.status === 'locked') newLocked.add(seatId);
          });
          setBookedSeats(newBooked);
          setLockedSeats(newLocked);
          // Deselect any seats that are now taken by someone else
          setSelectedSeats(prev => prev.filter(s => !newBooked.has(s.id) && !newLocked.has(s.id)));
        }
      });
    } catch (socketErr) {
      console.warn('Socket connection warning:', socketErr);
    }

    // Countdown Timer Interval
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          toast.warning('Seat selection session timed out. Please reselect your seats.');
          setSelectedSeats([]);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [showId]);

  // Format time remaining
  const formattedTime = useMemo(() => {
    const mins = Math.floor(timeLeft / 60);
    const secs = timeLeft % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, [timeLeft]);

  // Theatre and pricing calculations
  const theatre = show?._theatre || show?.theatre || show?.theatreInfo || {};
  const movie = show?._movie || show?.movie || {};

  const pricing = useMemo(() => {
    return {
      balcony: Number(theatre?.balconySeatPrice || show?.balconyPrice || 350),
      middle: Number(theatre?.middleSeatPrice || show?.middlePrice || 250),
      lower: Number(theatre?.lowerSeatPrice || show?.lowerPrice || 150),
    };
  }, [theatre, show]);

  // Total amount calculated from selectedSeats array
  const totalAmount = useMemo(() => {
    return selectedSeats.reduce((acc, seat) => {
      const price = pricing[seat.tier] || 0;
      return acc + price;
    }, 0);
  }, [selectedSeats, pricing]);

  // Generate matrix for a section
  const generateSectionGrid = (tierKey, prefix, defaultRows, defaultCols) => {
    const rowsCount = Number(theatre?.[`${tierKey}Rows`] || show?.[`${tierKey}Rows`] || defaultRows);
    const colsCount = Number(theatre?.[`${tierKey}Cols`] || show?.[`${tierKey}Cols`] || defaultCols);

    const rows = [];
    for (let r = 0; r < rowsCount; r++) {
      const rowLetter = String.fromCharCode(65 + r); // A, B, C...
      const seatRow = [];
      for (let c = 1; c <= colsCount; c++) {
        seatRow.push({
          id: `${prefix}-${rowLetter}${c}`,
          label: `${rowLetter}${c}`,
          tier: tierKey,
          price: pricing[tierKey],
        });
      }
      rows.push({ rowLetter, seats: seatRow });
    }
    return rows;
  };

  const balconyRows = useMemo(() => generateSectionGrid('balcony', 'B', 3, 10), [theatre, show, pricing]);
  const middleRows = useMemo(() => generateSectionGrid('middle', 'M', 5, 12), [theatre, show, pricing]);
  const lowerRows = useMemo(() => generateSectionGrid('lower', 'L', 3, 10), [theatre, show, pricing]);

  const handleSeatClick = (seat) => {
    if (bookedSeats.has(seat.id) || lockedSeats.has(seat.id)) return;

    if (selectedSeats.some((s) => s.id === seat.id)) {
      setSelectedSeats(selectedSeats.filter((s) => s.id !== seat.id));
    } else {
      if (selectedSeats.length >= 8) {
        toast.warning('Maximum 8 tickets allowed per single transaction');
        return;
      }
      setSelectedSeats([...selectedSeats, seat]);
    }
  };

  const getSeatStatusClass = (seatId) => {
    if (bookedSeats.has(seatId)) return 'seat-booked';
    if (lockedSeats.has(seatId)) return 'seat-locked';
    if (selectedSeats.some((s) => s.id === seatId)) return 'seat-selected';
    return 'seat-available';
  };

  /**
   * STRICT 5-STEP RAZORPAY TRANSACTION FLOW
   * Step 1 — Selection: User selected seats and clicks "Proceed to Pay (Razorpay)"
   * Step 2 — Frontend API Call: POST /api/payment/create-order
   * Step 3 — Gateway Communication: Razorpay order generated with order_id
   * Step 4 — Checkout Modal & Verification: window.Razorpay checkout -> POST /api/payment/verify
   * Step 5 — Confirmation & Notification: Redirect to /bookings with digital ticket
   */
  const handleRazorpayPayment = async () => {
    if (selectedSeats.length === 0) {
      toast.error('Please select at least one seat to proceed to checkout');
      return;
    }

    const token = localStorage.getItem('imovies-token');
    if (!token) {
      toast.error('Session expired. Please log in to complete your booking.');
      navigate('/login');
      return;
    }

    const userStr = localStorage.getItem('imovies-user');
    let userEmail = 'user@imovies.com';
    let userName = 'Moviegoer';
    if (userStr) {
      try {
        const u = JSON.parse(userStr);
        userEmail = u.email || userEmail;
        userName = u.username || userName;
      } catch {
        userEmail = userStr;
      }
    }

    // Ensure Razorpay SDK is ready
    const isScriptLoaded = await loadRazorpayScript();
    if (!isScriptLoaded || !window.Razorpay) {
      toast.error('Razorpay payment gateway failed to load. Please check your network connection.');
      return;
    }

    try {
      setBookingInProgress(true);
      const seatIds = selectedSeats.map((s) => s.id);

      // Step 2a: Temporarily lock seats on the server
      try {
        await api.lockSeats({
          showId,
          selectedSeats: seatIds,
          userEmail,
        });
      } catch (lockErr) {
        console.warn('Seat lock notice:', lockErr);
      }

      // Step 2b: Create Razorpay Order on backend
      const orderPayload = {
        showId,
        selectedSeats: seatIds,
        totalAmount,
        movieId: movie?._id || movie?.id || show?.movieId,
        theatreName: theatre?.theatreName || show?.theatreName || 'iMovies Grand Cineplex',
        showDate: show?.showDate || new Date().toISOString().split('T')[0],
        showTime: show?.showTime || '18:00',
        userEmail,
        ticketsData: Object.fromEntries(
          selectedSeats.map((s) => [s.id, { seatId: s.id, tier: s.tier, price: s.price, status: 'locked', lockedBy: userEmail }])
        ),
      };

      const orderRes = await api.createPaymentOrder(orderPayload);
      if (!orderRes.data?.success) {
        throw new Error(orderRes.data?.message || 'Failed to initialize payment order');
      }

      const { orderId, amount, currency, keyId, bookingId } = orderRes.data;

      // Step 4: Configure and open Razorpay Checkout modal
      const razorpayKey = keyId || import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_TqZowQCQ3E5us4';

      const options = {
        key: razorpayKey,
        amount,
        currency: currency || 'INR',
        name: 'iMovies Ticket Booking',
        description: `Booking for ${movie?.movieName || 'Cinema Film'} (${seatIds.join(', ')})`,
        image: 'https://cdn-icons-png.flaticon.com/512/2809/2809590.png',
        order_id: orderId,
        prefill: {
          name: userName,
          email: userEmail,
          contact: '9876543210',
        },
        notes: {
          bookingId,
          showId,
          seats: seatIds.join(', '),
        },
        theme: {
          color: '#ff6b00',
          backdrop_color: 'rgba(0, 0, 0, 0.9)',
        },
        modal: {
          ondismiss: function () {
            setBookingInProgress(false);
            toast.info('Payment window closed. Your seats remain reserved temporarily.');
          },
        },
        handler: async function (response) {
          try {
            setBookingInProgress(true);
            toast.info('Verifying secure payment authorization...');

            // Step 4b: Cryptographic signature verification on backend
            const verifyRes = await api.verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              bookingId,
            });

            if (verifyRes.data?.success) {
              // Step 5: Confirmation & Notification
              toast.success(`🎉 Payment Verified! Tickets booked & e-ticket emailed. (Didn't receive the email? Please check your spam or junk folder.)`);
              navigate('/bookings');
            } else {
              toast.error(verifyRes.data?.message || 'Payment verification failed');
            }
          } catch (verifyErr) {
            console.error('Verification error:', verifyErr);
            toast.error(verifyErr.response?.data?.message || 'Error completing payment verification');
          } finally {
            setBookingInProgress(false);
          }
        },
      };

      const razorpayInstance = new window.Razorpay(options);
      razorpayInstance.on('payment.failed', function (failureResponse) {
        console.error('Razorpay payment failed:', failureResponse);
        toast.error(`Payment failed: ${failureResponse.error?.description || 'Transaction declined'}`);
        setBookingInProgress(false);
      });

      razorpayInstance.open();
    } catch (err) {
      console.error('Checkout error:', err);
      toast.error(err.response?.data?.message || err.message || 'Error initializing Razorpay checkout');
      setBookingInProgress(false);
    }
  };

  const { theme } = useTheme();
  const isDark = theme === 'dark';

  if (loading) return <Loader />;

  return (
    <div className={`min-h-screen flex flex-col transition-colors ${isDark ? 'bg-[#000000] text-white' : 'bg-white text-zinc-900'}`}>
      <Header />

      {/* Show Information Bar */}
      <div className={`border-b py-4 px-4 sm:px-6 lg:px-8 sticky top-16 z-30 shadow-xl transition-colors ${
        isDark ? 'bg-[#09090b] border-zinc-800' : 'bg-zinc-50 border-zinc-200'
      }`}>
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              to={`/movieshows/${movie?._id || show?.movieId || ''}`}
              className="p-2 rounded-lg bg-card border border-gray-700 text-gray-300 hover:text-white"
            >
              <i className="fa-solid fa-arrow-left"></i>
            </Link>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                {movie?.movieName || 'Movie Screening'}
                {movie?.certification && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/20 text-primary border border-primary/40">
                    {movie.certification}
                  </span>
                )}
              </h2>
              <p className="text-xs text-gray-400">
                {theatre?.theatreName || show?.theatreName} • {show?.showDate && dayjs(show.showDate).format('ddd, D MMM')} at{' '}
                <span className="text-primary font-bold">{show?.showTime}</span>
              </p>
            </div>
          </div>

          {/* Session Timer & Razorpay Badge */}
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-700 text-zinc-300 text-xs font-semibold">
              <i className="fa-solid fa-shield-halved text-primary"></i>
              <span>Razorpay Test Mode</span>
            </div>

            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-card border border-gray-700 text-sm">
              <i className="fa-regular fa-clock text-primary animate-pulse"></i>
              <span className="text-xs text-gray-400">Session:</span>
              <span className="font-mono font-bold text-primary">{formattedTime}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Seat Map Area */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 flex flex-col items-center">
        {/* Tier Pricing Legend */}
        <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-8 mb-8 text-xs font-semibold text-gray-300 bg-card/60 px-6 py-3 rounded-2xl border border-gray-800">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-[#18181b] border border-[#3f3f46]"></div>
            <span>Available</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-primary shadow-sm shadow-orange-950/50"></div>
            <span>Selected</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-[#27272a] border border-orange-500/50"></div>
            <span>Locked</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-[#09090b] border border-[#1f1f23] opacity-40"></div>
            <span>Booked</span>
          </div>
        </div>

        {/* ─── SEATING LAYOUT GRID ──────────────────────────────── */}
        <div className="w-full max-w-4xl bg-card/40 rounded-3xl border border-gray-800 p-6 sm:p-10 flex flex-col items-center shadow-2xl relative overflow-x-auto">
          {/* SECTION 1: BALCONY */}
          <div className="w-full mb-10">
            <div className="flex items-center justify-between border-b border-gray-800 pb-2 mb-4">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-primary/20 text-primary border border-primary/40">
                  PREMIUM
                </span>
                <h3 className="font-bold text-sm text-gray-200 uppercase tracking-wider">
                  Balcony Section
                </h3>
              </div>
              <span className="text-sm font-bold text-primary font-mono">
                ₹{pricing.balcony}
              </span>
            </div>

            <div className="flex flex-col items-center gap-2.5">
              {balconyRows.map((row) => (
                <div key={row.rowLetter} className="flex items-center gap-3">
                  <span className="w-5 text-right font-mono text-xs text-gray-500 font-bold">
                    {row.rowLetter}
                  </span>
                  <div className="flex items-center gap-2">
                    {row.seats.map((seat) => (
                      <button
                        key={seat.id}
                        onClick={() => handleSeatClick(seat)}
                        disabled={bookedSeats.has(seat.id) || lockedSeats.has(seat.id)}
                        className={`w-7 h-7 sm:w-8 sm:h-8 rounded text-[10px] font-bold flex items-center justify-center transition-all ${getSeatStatusClass(
                          seat.id
                        )}`}
                        title={`${seat.id} • ₹${seat.price}`}
                      >
                        {seat.label.replace(/^[A-Z]/, '')}
                      </button>
                    ))}
                  </div>
                  <span className="w-5 font-mono text-xs text-gray-500 font-bold">
                    {row.rowLetter}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* SECTION 2: MIDDLE */}
          <div className="w-full mb-10">
            <div className="flex items-center justify-between border-b border-gray-800 pb-2 mb-4">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-primary/20 text-primary border border-primary/40">
                  STANDARD
                </span>
                <h3 className="font-bold text-sm text-gray-200 uppercase tracking-wider">
                  Middle Section
                </h3>
              </div>
              <span className="text-sm font-bold text-primary font-mono">
                ₹{pricing.middle}
              </span>
            </div>

            <div className="flex flex-col items-center gap-2.5">
              {middleRows.map((row) => (
                <div key={row.rowLetter} className="flex items-center gap-3">
                  <span className="w-5 text-right font-mono text-xs text-gray-500 font-bold">
                    {row.rowLetter}
                  </span>
                  <div className="flex items-center gap-2">
                    {row.seats.map((seat) => (
                      <button
                        key={seat.id}
                        onClick={() => handleSeatClick(seat)}
                        disabled={bookedSeats.has(seat.id) || lockedSeats.has(seat.id)}
                        className={`w-7 h-7 sm:w-8 sm:h-8 rounded text-[10px] font-bold flex items-center justify-center transition-all ${getSeatStatusClass(
                          seat.id
                        )}`}
                        title={`${seat.id} • ₹${seat.price}`}
                      >
                        {seat.label.replace(/^[A-Z]/, '')}
                      </button>
                    ))}
                  </div>
                  <span className="w-5 font-mono text-xs text-gray-500 font-bold">
                    {row.rowLetter}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* SECTION 3: LOWER */}
          <div className="w-full mb-12">
            <div className="flex items-center justify-between border-b border-gray-800 pb-2 mb-4">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-primary/20 text-primary border border-primary/40">
                  VALUE
                </span>
                <h3 className="font-bold text-sm text-gray-200 uppercase tracking-wider">
                  Lower Section
                </h3>
              </div>
              <span className="text-sm font-bold text-primary font-mono">
                ₹{pricing.lower}
              </span>
            </div>

            <div className="flex flex-col items-center gap-2.5">
              {lowerRows.map((row) => (
                <div key={row.rowLetter} className="flex items-center gap-3">
                  <span className="w-5 text-right font-mono text-xs text-gray-500 font-bold">
                    {row.rowLetter}
                  </span>
                  <div className="flex items-center gap-2">
                    {row.seats.map((seat) => (
                      <button
                        key={seat.id}
                        onClick={() => handleSeatClick(seat)}
                        disabled={bookedSeats.has(seat.id) || lockedSeats.has(seat.id)}
                        className={`w-7 h-7 sm:w-8 sm:h-8 rounded text-[10px] font-bold flex items-center justify-center transition-all ${getSeatStatusClass(
                          seat.id
                        )}`}
                        title={`${seat.id} • ₹${seat.price}`}
                      >
                        {seat.label.replace(/^[A-Z]/, '')}
                      </button>
                    ))}
                  </div>
                  <span className="w-5 font-mono text-xs text-gray-500 font-bold">
                    {row.rowLetter}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* CINEMA SCREEN INDICATOR (Bottom) */}
          <div className="w-full max-w-xl text-center pt-8">
            <div className="screen-curve h-6 w-full mb-3 flex items-center justify-center"></div>
            <span className="text-xs font-black tracking-[0.4em] text-gray-400 uppercase">
              🎬 ALL EYES THIS WAY • SCREEN 🎬
            </span>
          </div>
        </div>

        {/* Selected Seats Bottom Checkout Dock */}
        <div className="w-full max-w-4xl mt-8 bg-card rounded-2xl border border-gray-800 p-5 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="w-full md:w-auto">
            <span className="text-xs text-gray-400 uppercase tracking-wider block mb-1">
              Selected Seats ({selectedSeats.length})
            </span>
            {selectedSeats.length === 0 ? (
              <span className="text-sm text-gray-500 italic">Select seats above to proceed</span>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {selectedSeats.map((seat) => (
                  <span
                    key={seat.id}
                    className="px-2.5 py-1 rounded bg-primary/20 border border-primary/40 text-primary text-xs font-bold"
                  >
                    {seat.id}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 pt-3 md:pt-0 border-gray-800">
            <div>
              <span className="text-[10px] text-gray-400 uppercase block">Total Amount</span>
              <span className="text-2xl font-black text-white font-mono">₹{totalAmount}</span>
            </div>

            <button
              onClick={handleRazorpayPayment}
              disabled={selectedSeats.length === 0 || bookingInProgress || timeLeft === 0}
              className="px-8 py-3.5 bg-primary hover:bg-[#ff7700] text-black font-black rounded-none shadow-xl transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2.5 text-sm sm:text-base"
            >
              {bookingInProgress ? (
                <>
                  <div className="w-4 h-4 border-2 border-black border-t-transparent animate-spin"></div>
                  <span>Processing Razorpay...</span>
                </>
              ) : (
                <>
                  <i className="fa-solid fa-credit-card"></i>
                  <span>Pay with Razorpay (₹{totalAmount})</span>
                </>
              )}
            </button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default SeatSlug;
