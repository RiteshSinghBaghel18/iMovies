import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import api from "../utils/api";
import { useSocket } from "../context/SocketContext";
import { useAuth } from "../context/AuthContext";
import { isShowPast } from "../utils/dateTime";
import Loader from "../components/Loader";
import PaymentModal from "../components/PaymentModal";
import DigitalTicketModal from "../components/DigitalTicketModal";
import { 
  Clock, 
  MapPin, 
  Calendar, 
  Sparkles, 
  Lock, 
  Check, 
  ArrowLeft,
  ShieldCheck,
  Zap,
  Info,
  AlertTriangle
} from "lucide-react";
import { toast } from "react-toastify";

const SeatMap = () => {
  const { showId } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { socket, joinShowRoom, leaveShowRoom } = useSocket();

  const [show, setShow] = useState(null);
  const [movie, setMovie] = useState(null);
  const [tickets, setTickets] = useState({});
  const [loading, setLoading] = useState(true);

  // User's temporary selection
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [isLockedByMe, setIsLockedByMe] = useState(false);
  const [lockExpiresAt, setLockExpiresAt] = useState(null);
  const [timeLeft, setTimeLeft] = useState("");

  // Modals
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [confirmedBooking, setConfirmedBooking] = useState(null);

  // Fetch show details
  const fetchShowDetails = useCallback(async () => {
    try {
      const res = await api.get(`/shows/${showId}`);
      if (res.data.success) {
        setShow(res.data.show);
        setMovie(res.data.movie);
        setTickets(res.data.show.tickets || {});

        // Check if user already has active locks in this show
        const userLocks = [];
        let expAt = null;
        Object.values(res.data.show.tickets || {}).forEach((t) => {
          if (t.status === "locked" && t.lockedBy === user?.email && new Date(t.lockExpiresAt) > new Date()) {
            userLocks.push(t.seatNumber);
            expAt = t.lockExpiresAt;
          }
        });

        if (userLocks.length > 0) {
          setSelectedSeats(userLocks);
          setIsLockedByMe(true);
          setLockExpiresAt(expAt);
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load show seating map.");
    } finally {
      setLoading(false);
    }
  }, [showId, user?.email]);

  useEffect(() => {
    fetchShowDetails();
  }, [fetchShowDetails]);

  // Real-time WebSocket connection to show room
  useEffect(() => {
    if (!socket || !showId) return;

    joinShowRoom(showId);

    const handleSeatsUpdated = (data) => {
      if (data.showId === showId && data.tickets) {
        setTickets(data.tickets);

        // If another user locked a seat that I was considering, notify and deselect
        if (data.action === "locked") {
          const lockedBySomeoneElse = data.seats?.filter(
            (s) => selectedSeats.includes(s) && data.tickets[s]?.lockedBy !== user?.email
          );
          if (lockedBySomeoneElse && lockedBySomeoneElse.length > 0) {
            setSelectedSeats((prev) => prev.filter((s) => !lockedBySomeoneElse.includes(s)));
            toast.warn(`Seats ${lockedBySomeoneElse.join(", ")} were just reserved by another customer.`);
          }
        }
      }
    };

    socket.on("seatsUpdated", handleSeatsUpdated);

    return () => {
      socket.off("seatsUpdated", handleSeatsUpdated);
      leaveShowRoom(showId);
    };
  }, [socket, showId, selectedSeats, user, joinShowRoom, leaveShowRoom]);

  // TTL Countdown Timer effect
  useEffect(() => {
    if (!lockExpiresAt) return;

    const interval = setInterval(() => {
      const distance = new Date(lockExpiresAt).getTime() - new Date().getTime();

      if (distance <= 0) {
        clearInterval(interval);
        setTimeLeft("00:00");
        setIsLockedByMe(false);
        setLockExpiresAt(null);
        setSelectedSeats([]);
        toast.error("Seat reservation expired! Please select your seats again.");
        fetchShowDetails();
      } else {
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);
        setTimeLeft(`${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [lockExpiresAt, fetchShowDetails]);

  // Check if show has already passed
  const isShowEnded = useMemo(() => {
    if (!show) return false;
    return isShowPast(show.showDate, show.showTime);
  }, [show]);

  // Group tickets by Tier and Rows for rendering
  const { balconyRows, middleRows, lowerRows } = useMemo(() => {
    const b = {};
    const m = {};
    const l = {};

    Object.values(tickets).forEach((seat) => {
      if (!seat) return;
      const target = seat.tier === "balcony" ? b : seat.tier === "middle" ? m : l;
      if (!target[seat.row]) {
        target[seat.row] = [];
      }
      target[seat.row].push(seat);
    });

    // Sort cols inside each row
    const sortRow = (obj) => {
      Object.keys(obj).forEach((row) => {
        obj[row].sort((a, b) => a.col - b.col);
      });
      return obj;
    };

    return {
      balconyRows: sortRow(b),
      middleRows: sortRow(m),
      lowerRows: sortRow(l),
    };
  }, [tickets]);

  // Toggle seat selection
  const handleSeatClick = (seat) => {
    if (isShowEnded) {
      toast.warn("This show has ended. You cannot book seats for past shows.");
      return;
    }

    // Cannot click booked
    if (seat.status === "booked") return;

    // Cannot click if locked by someone else
    const isLockedByOther =
      seat.status === "locked" &&
      seat.lockedBy !== user?.email &&
      seat.lockExpiresAt &&
      new Date(seat.lockExpiresAt) > new Date();

    if (isLockedByOther) {
      toast.info(`Seat ${seat.seatNumber} is currently held by another user.`);
      return;
    }

    if (selectedSeats.includes(seat.seatNumber)) {
      setSelectedSeats((prev) => prev.filter((s) => s !== seat.seatNumber));
    } else {
      if (selectedSeats.length >= 8) {
        toast.warn("You can select a maximum of 8 seats per booking.");
        return;
      }
      setSelectedSeats((prev) => [...prev, seat.seatNumber]);
    }
  };

  // Calculate Subtotal
  const totalSeatPrice = useMemo(() => {
    return selectedSeats.reduce((sum, seatId) => {
      const seat = tickets[seatId];
      return sum + (seat?.price || 200);
    }, 0);
  }, [selectedSeats, tickets]);

  // Lock selected seats
  const handleLockAndProceed = async () => {
    if (isShowEnded) {
      toast.error("This showtime has already passed. Booking is closed.");
      return;
    }

    if (!isAuthenticated) {
      toast.info("Please sign in to proceed with booking.");
      navigate("/login", { state: { from: { pathname: `/seatslug/${showId}` } } });
      return;
    }

    if (selectedSeats.length === 0) {
      toast.warn("Please select at least one seat.");
      return;
    }

    try {
      const res = await api.post("/bookings/lock", {
        showId: show.showId,
        seats: selectedSeats,
      });

      if (res.data.success) {
        setIsLockedByMe(true);
        setLockExpiresAt(res.data.lockExpiresAt);
        setShowPaymentModal(true);
        toast.success(res.data.message || "Seats locked! Complete payment within 10 minutes.");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to lock selected seats. They may have been taken.");
      fetchShowDetails();
    }
  };

  // Confirm booking & payment
  const handlePaymentSuccess = async (paymentData) => {
    setShowPaymentModal(false);

    // If Razorpay already verified on backend and returned the confirmed booking:
    if (paymentData?.booking) {
      setConfirmedBooking(paymentData.booking);
      setIsLockedByMe(false);
      setLockExpiresAt(null);
      setSelectedSeats([]);
      fetchShowDetails();
      toast.success("🎟️ Booking Confirmed via Razorpay! Digital ticket pass generated.");
      return;
    }

    // Fallback confirmation
    try {
      const res = await api.post("/bookings/confirm", {
        showId: show.showId,
        selectedSeats,
        paymentMethod: paymentData.paymentMethod || "Razorpay (Test Mode)",
      });

      if (res.data.success) {
        setConfirmedBooking(res.data.booking);
        setIsLockedByMe(false);
        setLockExpiresAt(null);
        setSelectedSeats([]);
        fetchShowDetails();
        toast.success("🎟️ Booking Confirmed! Digital ticket generated.");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Payment confirmation failed.");
      fetchShowDetails();
    }
  };

  if (loading) {
    return <Loader message="Setting up live interactive cinema seating map..." />;
  }

  if (!show) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <h2 className="text-2xl font-bold text-white mb-2">Show Not Found</h2>
        <Link to="/home" className="px-5 py-2.5 rounded-xl bg-[#ff6600] text-slate-950 font-bold text-sm">
          Return to Movies
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#000000] text-slate-100 pb-24">
      
      {/* Top Header Bar */}
      <div className="bg-[#09090b] border-b border-[#27272a] py-4 sticky top-16 sm:top-20 z-30 backdrop-blur-md bg-opacity-95">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            
            <div className="flex items-center gap-3">
              <Link
                to={`/movieshows/${movie?._id || show.movieId}`}
                className="p-2 rounded-lg bg-[#18181f] border border-[#27272a] text-[#a1a1aa] hover:text-white transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
              </Link>
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-white truncate max-w-xs sm:max-w-md">
                  {movie?.movieName || "Movie"}
                </h1>
                <p className="text-xs text-[#a1a1aa]">
                  {show.theatreName} • {show.showDate} at {show.showTime}
                </p>
              </div>
            </div>

            {/* TTL Timer if locked */}
            {lockExpiresAt && timeLeft && (
              <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-[#ff6600]/15 border border-[#ff6600]/30 text-[#ff6600] animate-pulse">
                <Clock className="w-4 h-4" />
                <span className="text-xs font-semibold uppercase tracking-wider">Seats Reserved:</span>
                <span className="text-base font-black tracking-widest">{timeLeft}</span>
              </div>
            )}

          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        
        {/* Past Showtime Alert Banner */}
        {isShowEnded && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center gap-3 text-rose-300">
            <AlertTriangle className="w-5 h-5 flex-shrink-0 text-rose-400" />
            <div className="text-sm">
              <span className="font-bold">Showtime Closed: </span>
              This show was scheduled for {show.showDate} at {show.showTime} and has already ended or passed. Seat selection and ticket booking are disabled. Please choose an upcoming showtime.
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Seating Map Container (8 cols) */}
          <div className="lg:col-span-8 bg-[#121216] border border-[#27272a] rounded-3xl p-6 sm:p-8 shadow-2xl overflow-x-auto">
            
            {/* Seating Tiers Layout:
                In realistic auditorium arrangement:
                TOP: Balcony (VIP / Recliners - furthest from screen)
                MIDDLE: Middle Tier (Premium)
                BOTTOM: Lower Tier (Standard - nearest to screen)
                FOLLOWED BY: Curved Cinema Screen at the BOTTOM facing audience!
            */}
            <div className="space-y-10 min-w-[500px]">
              
              {/* Balcony Tier (Top / Back of auditorium) */}
              {Object.keys(balconyRows).length > 0 && (
                <div>
                  <div className="flex items-center justify-between border-b border-[#27272a] pb-2 mb-4">
                    <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      Balcony (VIP) — ₹{show.pricing?.balcony || 350}
                    </span>
                    <span className="text-[10px] text-[#a1a1aa]">Back Tier • Recliner Lounge</span>
                  </div>

                  <div className="space-y-2.5">
                    {Object.entries(balconyRows).map(([rowName, seats]) => (
                      <div key={rowName} className="flex items-center justify-center gap-2">
                        <span className="w-6 text-xs font-bold text-[#a1a1aa] text-right mr-2">
                          {rowName}
                        </span>
                        <div className="flex gap-2">
                          {seats.map((seat) => renderSeat(seat))}
                        </div>
                        <span className="w-6 text-xs font-bold text-[#a1a1aa] text-left ml-2">
                          {rowName}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Middle Tier (Center of auditorium) */}
              {Object.keys(middleRows).length > 0 && (
                <div>
                  <div className="flex items-center justify-between border-b border-[#27272a] pb-2 mb-4">
                    <span className="text-xs font-bold text-[#ff6600] uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-[#ff6600]" />
                      Middle Tier (Premium) — ₹{show.pricing?.middle || 250}
                    </span>
                    <span className="text-[10px] text-[#a1a1aa]">Center Tier • Premium Viewing Angle</span>
                  </div>

                  <div className="space-y-2.5">
                    {Object.entries(middleRows).map(([rowName, seats]) => (
                      <div key={rowName} className="flex items-center justify-center gap-2">
                        <span className="w-6 text-xs font-bold text-[#a1a1aa] text-right mr-2">
                          {rowName}
                        </span>
                        <div className="flex gap-2">
                          {seats.map((seat) => renderSeat(seat))}
                        </div>
                        <span className="w-6 text-xs font-bold text-[#a1a1aa] text-left ml-2">
                          {rowName}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Lower Tier (Front of auditorium, right by the screen) */}
              {Object.keys(lowerRows).length > 0 && (
                <div>
                  <div className="flex items-center justify-between border-b border-[#27272a] pb-2 mb-4">
                    <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      Lower Tier (Standard) — ₹{show.pricing?.lower || 150}
                    </span>
                    <span className="text-[10px] text-[#a1a1aa]">Front Tier • Closest to Screen</span>
                  </div>

                  <div className="space-y-2.5">
                    {Object.entries(lowerRows).map(([rowName, seats]) => (
                      <div key={rowName} className="flex items-center justify-center gap-2">
                        <span className="w-6 text-xs font-bold text-[#a1a1aa] text-right mr-2">
                          {rowName}
                        </span>
                        <div className="flex gap-2">
                          {seats.map((seat) => renderSeat(seat))}
                        </div>
                        <span className="w-6 text-xs font-bold text-[#a1a1aa] text-left ml-2">
                          {rowName}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>

            {/* Cinema Screen positioned correctly at FRONT / BOTTOM (facing seats) */}
            <div className="text-center mt-12 mb-4">
              <div className="cinema-screen-bottom" />
              <p className="text-[11px] font-black uppercase tracking-[0.25em] text-[#ff6600] flex items-center justify-center gap-2">
                <span>▼</span>
                <span>ALL EYES THIS WAY • CINEMA SCREEN</span>
                <span>▼</span>
              </p>
              <p className="text-[10px] text-[#a1a1aa] mt-1">
                Auditorium Front Screen (Lower Tier is closest to screen • Balcony is at the back)
              </p>
            </div>

            {/* Seat Legend */}
            <div className="mt-10 pt-6 border-t border-[#27272a] flex flex-wrap items-center justify-center gap-6 text-xs text-[#a1a1aa]">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-[#18181f] border border-[#243550]" />
                <span>Available</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-[#ff6600] text-black font-extrabold flex items-center justify-center text-[10px] shadow-glow-prime" />
                <span className="text-white font-semibold">Selected</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-amber-500/25 border border-amber-500/50 flex items-center justify-center">
                  <Lock className="w-3 h-3 text-amber-400" />
                </div>
                <span>Held by Customer</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-[#09090b] border border-[#27272a] opacity-40" />
                <span className="line-through text-slate-500">Booked</span>
              </div>
            </div>

          </div>

          {/* Right Summary Sidebar (4 cols) */}
          <div className="lg:col-span-4 space-y-6 sticky top-36">
            <div className="bg-[#121216] border border-[#27272a] rounded-3xl p-6 space-y-6 shadow-xl">
              
              <div className="flex items-center gap-3 border-b border-[#27272a] pb-4">
                <div className="w-14 h-20 rounded-lg overflow-hidden border border-[#27272a] flex-shrink-0 bg-[#09090b]">
                  <img
                    src={movie?.posterUrl}
                    alt={movie?.movieName}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="min-w-0">
                  <div className="mb-0.5">
                    <span className="text-[10px] text-[#ff6600] font-bold uppercase tracking-wider">
                      Ticket Pass
                    </span>
                  </div>
                  <h3 className="font-bold text-white text-base truncate">{movie?.movieName}</h3>
                  <p className="text-xs text-[#a1a1aa] mt-0.5">{show.theatreName}</p>
                  <p className="text-xs text-[#ff6600] font-semibold mt-1">
                    {show.showDate} • {show.showTime}
                  </p>
                </div>
              </div>

              {/* Selected Seats Listing */}
              <div>
                <p className="text-xs font-semibold text-[#a1a1aa] uppercase tracking-wider mb-2">
                  Selected Seats ({selectedSeats.length})
                </p>
                {selectedSeats.length === 0 ? (
                  <p className="text-xs text-[#a1a1aa] italic py-2">
                    Click on available seats on the map above to select your reservation.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {selectedSeats.map((seatId) => {
                      const seat = tickets[seatId];
                      return (
                        <div
                          key={seatId}
                          className="px-2.5 py-1 rounded-lg bg-[#ff6600]/20 text-[#ff6600] border border-[#ff6600]/30 text-xs font-bold flex items-center gap-1.5"
                        >
                          <span>{seatId}</span>
                          <span className="text-[10px] text-slate-300 font-normal">
                            (₹{seat?.price || 200})
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Price Breakdown */}
              <div className="space-y-2 pt-2 border-t border-[#27272a] text-xs text-slate-300">
                <div className="flex justify-between">
                  <span className="text-[#a1a1aa]">Tickets Subtotal:</span>
                  <span className="font-semibold text-white">₹{totalSeatPrice}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#a1a1aa]">Convenience Fee (5%):</span>
                  <span>₹{Math.round(totalSeatPrice * 0.05)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#a1a1aa]">Integrated Taxes (2.5%):</span>
                  <span>₹{Math.round(totalSeatPrice * 0.025)}</span>
                </div>
                <div className="flex justify-between text-base font-extrabold text-[#ff6600] pt-2 border-t border-[#27272a]">
                  <span>Grand Total:</span>
                  <span>
                    ₹{totalSeatPrice + Math.round(totalSeatPrice * 0.05) + Math.round(totalSeatPrice * 0.025)}
                  </span>
                </div>
              </div>

              {/* Action Button */}
              <button
                type="button"
                onClick={handleLockAndProceed}
                disabled={selectedSeats.length === 0 || isShowEnded}
                className="w-full py-4 rounded-xl bg-[#ff6600] hover:bg-[#ff7700] text-slate-950 font-black text-sm shadow-xl shadow-[#ff6600]/30 flex items-center justify-center gap-2 transition-all hover:scale-[1.02] disabled:opacity-40 disabled:hover:scale-100 disabled:cursor-not-allowed"
              >
                <Lock className="w-4 h-4" />
                <span>{isShowEnded ? "Showtime Closed" : "Lock Seats & Checkout"}</span>
              </button>

              <p className="text-[11px] text-[#a1a1aa] text-center leading-relaxed">
                ⚡ Locked seats are held for 10 minutes in real time with official Razorpay test payments.
              </p>

            </div>
          </div>

        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <PaymentModal
          show={show}
          movie={movie}
          selectedSeats={selectedSeats}
          totalSeatPrice={totalSeatPrice}
          onPaymentSuccess={handlePaymentSuccess}
          onClose={() => setShowPaymentModal(false)}
        />
      )}

      {/* Digital Ticket Modal on Confirmation */}
      {confirmedBooking && (
        <DigitalTicketModal
          booking={confirmedBooking}
          onClose={() => setConfirmedBooking(null)}
        />
      )}

    </div>
  );

  // Helper render for individual seat button
  function renderSeat(seat) {
    const isSelected = selectedSeats.includes(seat.seatNumber);
    const isBooked = seat.status === "booked";
    const isLockedOther =
      seat.status === "locked" &&
      seat.lockedBy !== user?.email &&
      seat.lockExpiresAt &&
      new Date(seat.lockExpiresAt) > new Date();

    let btnClass = "seat w-8 h-8 rounded-lg text-[10px] font-bold flex items-center justify-center cursor-pointer border transition-all ";

    if (isBooked) {
      btnClass += "bg-[#09090b] border-[#141d2c] text-slate-600 opacity-40 cursor-not-allowed";
    } else if (isSelected) {
      btnClass += "bg-[#ff6600] border-[#ff6600] text-black font-black shadow-glow-prime scale-110";
    } else if (isLockedOther) {
      btnClass += "bg-amber-500/20 border-amber-500/50 text-amber-400 cursor-not-allowed";
    } else {
      btnClass += "bg-[#18181f] border-[#3f3f46] text-slate-300 hover:border-[#ff6600] hover:text-white";
    }

    return (
      <button
        key={seat.seatNumber}
        type="button"
        title={`Seat ${seat.seatNumber} (${seat.tier}) - ₹${seat.price}`}
        disabled={isBooked || isLockedOther || isShowEnded}
        onClick={() => handleSeatClick(seat)}
        className={btnClass}
      >
        {isLockedOther ? (
          <Lock className="w-3 h-3 text-amber-400" />
        ) : (
          seat.col
        )}
      </button>
    );
  }
};

export default SeatMap;
