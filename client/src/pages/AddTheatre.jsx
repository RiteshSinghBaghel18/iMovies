import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../utils/api";
import { Tv, ArrowLeft, Plus, Trash2, Sparkles, Layers, DollarSign, Check } from "lucide-react";
import { toast } from "react-toastify";

const AddTheatre = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const [theatreName, setTheatreName] = useState("");
  const [theatreId, setTheatreId] = useState("");
  const [location, setLocation] = useState("");

  // Tier 1: Balcony (VIP)
  const [balconyPrice, setBalconyPrice] = useState(400);
  const [balconyRows, setBalconyRows] = useState("A, B");
  const [balconySeatsPerRow, setBalconySeatsPerRow] = useState(10);

  // Tier 2: Middle (Premium)
  const [middlePrice, setMiddlePrice] = useState(280);
  const [middleRows, setMiddleRows] = useState("C, D, E");
  const [middleSeatsPerRow, setMiddleSeatsPerRow] = useState(12);

  // Tier 3: Lower (Standard)
  const [lowerPrice, setLowerPrice] = useState(180);
  const [lowerRows, setLowerRows] = useState("F, G");
  const [lowerSeatsPerRow, setLowerSeatsPerRow] = useState(12);

  // Additional User-Defined Sections
  const [customSections, setCustomSections] = useState([]);

  const addCustomSection = () => {
    setCustomSections([
      ...customSections,
      {
        id: "sec-" + Date.now(),
        name: "recliners",
        label: "VIP Recliner Suite",
        price: 500,
        rows: "R1, R2",
        seatsPerRow: 8,
      },
    ]);
  };

  const removeCustomSection = (id) => {
    setCustomSections(customSections.filter((s) => s.id !== id));
  };

  const updateCustomSection = (id, field, value) => {
    setCustomSections(
      customSections.map((s) => (s.id === id ? { ...s, [field]: value } : s))
    );
  };

  // Helper to parse comma separated rows
  const parseRows = (rowStr) => {
    return rowStr
      .split(",")
      .map((r) => r.trim().toUpperCase())
      .filter((r) => r.length > 0);
  };

  // Total capacity calculation
  const bRowsParsed = parseRows(balconyRows);
  const mRowsParsed = parseRows(middleRows);
  const lRowsParsed = parseRows(lowerRows);

  const totalBalcony = bRowsParsed.length * Number(balconySeatsPerRow);
  const totalMiddle = mRowsParsed.length * Number(middleSeatsPerRow);
  const totalLower = lRowsParsed.length * Number(lowerSeatsPerRow);

  const totalCustom = customSections.reduce((acc, s) => {
    return acc + parseRows(s.rows).length * Number(s.seatsPerRow || 0);
  }, 0);

  const grandTotalCapacity = totalBalcony + totalMiddle + totalLower + totalCustom;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!theatreName.trim() || !location.trim()) {
      toast.error("Please fill in theatre name and physical location.");
      return;
    }

    if (bRowsParsed.length === 0 || mRowsParsed.length === 0 || lRowsParsed.length === 0) {
      toast.error("Please specify at least one row for each seating section.");
      return;
    }

    setLoading(true);
    try {
      const generatedId = theatreId.trim() || "th-" + Date.now().toString(36);

      const parsedCustom = customSections.map((s) => ({
        name: s.name.toLowerCase().replace(/\s+/g, "_"),
        label: s.label.trim(),
        price: Number(s.price),
        rows: parseRows(s.rows),
        seatsPerRow: Number(s.seatsPerRow),
      }));

      const payload = {
        theatreName: theatreName.trim(),
        theatreId: generatedId,
        location: location.trim(),
        balconySeatPrice: Number(balconyPrice),
        middleSeatPrice: Number(middlePrice),
        lowerSeatPrice: Number(lowerPrice),
        balconySeats: {
          rows: bRowsParsed,
          seatsPerRow: Number(balconySeatsPerRow),
          totalSeats: totalBalcony,
        },
        middleSeats: {
          rows: mRowsParsed,
          seatsPerRow: Number(middleSeatsPerRow),
          totalSeats: totalMiddle,
        },
        lowerSeats: {
          rows: lRowsParsed,
          seatsPerRow: Number(lowerSeatsPerRow),
          totalSeats: totalLower,
        },
        customSections: parsedCustom,
        amenities: ["4K Laser", "Dolby Atmos 7.1", "Air Conditioned", "Accessible Seating"],
      };

      const res = await api.post("/theatre", payload);
      if (res.data.success) {
        toast.success("Theatre registered with customized seating sections!");
        navigate("/admin");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to register theatre.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#000000] text-slate-100 pb-20">
      
      {/* Top Banner */}
      <div className="bg-[#09090b] border-b border-[#27272a] py-6">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <Link
            to="/admin"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#a1a1aa] hover:text-[#76b900] mb-2 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Dashboard
          </Link>
          <div className="flex items-center gap-2.5">
            <Tv className="w-6 h-6 text-[#76b900]" />
            <h1 className="text-2xl font-bold text-white">Create Cinema Theatre & Seating Sections</h1>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-8">
        <div className="bg-[#121216] border border-[#27272a] rounded-2xl p-6 sm:p-8 shadow-xl space-y-8">
          
          <form onSubmit={handleSubmit} className="space-y-8">
            
            {/* Basic Information */}
            <div className="space-y-4">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider border-b border-[#27272a] pb-2 flex items-center gap-2">
                <span>1. Theatre Information</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#a1a1aa] mb-1">
                    Theatre Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={theatreName}
                    onChange={(e) => setTheatreName(e.target.value)}
                    placeholder="e.g. iMovies PVR - Grand Plaza"
                    className="w-full bg-[#18181f] border border-[#27272a] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#76b900]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#a1a1aa] mb-1">
                    Theatre Identifier (theatreId)
                  </label>
                  <input
                    type="text"
                    value={theatreId}
                    onChange={(e) => setTheatreId(e.target.value)}
                    placeholder="e.g. th-grandplaza-01"
                    className="w-full bg-[#18181f] border border-[#27272a] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#76b900]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#a1a1aa] mb-1">
                  Physical Address / Location *
                </label>
                <input
                  type="text"
                  required
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. 4th Floor, Grand Central Mall, MG Road"
                  className="w-full bg-[#18181f] border border-[#27272a] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#76b900]"
                />
              </div>
            </div>

            {/* Default Seating Tiers Customization */}
            <div className="space-y-4">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider border-b border-[#27272a] pb-2 flex items-center gap-2">
                <span>2. Configure Seating Tiers & Rows</span>
              </h2>

              {/* Balcony / VIP Section */}
              <div className="p-4 rounded-xl bg-[#18181f] border border-[#27272a] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-400 uppercase tracking-wide flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    Balcony Tier (VIP / Recliners)
                  </span>
                  <span className="text-xs text-[#a1a1aa]">
                    Capacity: <strong className="text-white">{totalBalcony}</strong> seats
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] text-[#a1a1aa] font-semibold mb-1">Price per Seat (₹)</label>
                    <input
                      type="number"
                      required
                      min={0}
                      value={balconyPrice}
                      onChange={(e) => setBalconyPrice(e.target.value)}
                      className="w-full bg-[#09090b] border border-[#27272a] rounded-lg px-3 py-2 text-sm text-white focus:border-[#76b900]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-[#a1a1aa] font-semibold mb-1">Row Letters (Comma-separated)</label>
                    <input
                      type="text"
                      required
                      value={balconyRows}
                      onChange={(e) => setBalconyRows(e.target.value)}
                      placeholder="e.g. A, B"
                      className="w-full bg-[#09090b] border border-[#27272a] rounded-lg px-3 py-2 text-sm text-white focus:border-[#76b900]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-[#a1a1aa] font-semibold mb-1">Seats per Row</label>
                    <input
                      type="number"
                      required
                      min={1}
                      max={30}
                      value={balconySeatsPerRow}
                      onChange={(e) => setBalconySeatsPerRow(e.target.value)}
                      className="w-full bg-[#09090b] border border-[#27272a] rounded-lg px-3 py-2 text-sm text-white focus:border-[#76b900]"
                    />
                  </div>
                </div>
              </div>

              {/* Middle Tier (Premium) */}
              <div className="p-4 rounded-xl bg-[#18181f] border border-[#27272a] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#76b900] uppercase tracking-wide flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    Middle Tier (Premium)
                  </span>
                  <span className="text-xs text-[#a1a1aa]">
                    Capacity: <strong className="text-white">{totalMiddle}</strong> seats
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] text-[#a1a1aa] font-semibold mb-1">Price per Seat (₹)</label>
                    <input
                      type="number"
                      required
                      min={0}
                      value={middlePrice}
                      onChange={(e) => setMiddlePrice(e.target.value)}
                      className="w-full bg-[#09090b] border border-[#27272a] rounded-lg px-3 py-2 text-sm text-white focus:border-[#76b900]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-[#a1a1aa] font-semibold mb-1">Row Letters (Comma-separated)</label>
                    <input
                      type="text"
                      required
                      value={middleRows}
                      onChange={(e) => setMiddleRows(e.target.value)}
                      placeholder="e.g. C, D, E"
                      className="w-full bg-[#09090b] border border-[#27272a] rounded-lg px-3 py-2 text-sm text-white focus:border-[#76b900]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-[#a1a1aa] font-semibold mb-1">Seats per Row</label>
                    <input
                      type="number"
                      required
                      min={1}
                      max={30}
                      value={middleSeatsPerRow}
                      onChange={(e) => setMiddleSeatsPerRow(e.target.value)}
                      className="w-full bg-[#09090b] border border-[#27272a] rounded-lg px-3 py-2 text-sm text-white focus:border-[#76b900]"
                    />
                  </div>
                </div>
              </div>

              {/* Lower Tier (Standard / Front) */}
              <div className="p-4 rounded-xl bg-[#18181f] border border-[#27272a] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-300 uppercase tracking-wide flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    Lower Tier (Standard / Front Stalls)
                  </span>
                  <span className="text-xs text-[#a1a1aa]">
                    Capacity: <strong className="text-white">{totalLower}</strong> seats
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] text-[#a1a1aa] font-semibold mb-1">Price per Seat (₹)</label>
                    <input
                      type="number"
                      required
                      min={0}
                      value={lowerPrice}
                      onChange={(e) => setLowerPrice(e.target.value)}
                      className="w-full bg-[#09090b] border border-[#27272a] rounded-lg px-3 py-2 text-sm text-white focus:border-[#76b900]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-[#a1a1aa] font-semibold mb-1">Row Letters (Comma-separated)</label>
                    <input
                      type="text"
                      required
                      value={lowerRows}
                      onChange={(e) => setLowerRows(e.target.value)}
                      placeholder="e.g. F, G"
                      className="w-full bg-[#09090b] border border-[#27272a] rounded-lg px-3 py-2 text-sm text-white focus:border-[#76b900]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-[#a1a1aa] font-semibold mb-1">Seats per Row</label>
                    <input
                      type="number"
                      required
                      min={1}
                      max={30}
                      value={lowerSeatsPerRow}
                      onChange={(e) => setLowerSeatsPerRow(e.target.value)}
                      className="w-full bg-[#09090b] border border-[#27272a] rounded-lg px-3 py-2 text-sm text-white focus:border-[#76b900]"
                    />
                  </div>
                </div>
              </div>

            </div>

            {/* Custom User-Defined Additional Sections */}
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-[#27272a] pb-2">
                <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Layers className="w-4 h-4 text-[#76b900]" />
                  <span>3. Custom Additional Sections</span>
                </h2>
                <button
                  type="button"
                  onClick={addCustomSection}
                  className="px-3 py-1.5 rounded-lg bg-[#76b900]/15 text-[#76b900] border border-[#76b900]/30 hover:bg-[#76b900] hover:text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Section</span>
                </button>
              </div>

              {customSections.length === 0 ? (
                <p className="text-xs text-[#a1a1aa] italic p-4 rounded-xl bg-[#09090b] border border-dashed border-[#27272a]">
                  No additional sections created yet. Click "+ Add Section" above if this auditorium has special areas like Recliner Lounges, Executive Boxes, or Club Seating.
                </p>
              ) : (
                <div className="space-y-3">
                  {customSections.map((sec, idx) => (
                    <div key={sec.id} className="p-4 rounded-xl bg-[#18181f] border border-[#27272a] space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#76b900]">
                          Section #{idx + 1}: {sec.label || "Custom Section"}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeCustomSection(sec.id)}
                          className="p-1 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-md transition-colors"
                          title="Remove section"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                        <div>
                          <label className="block text-[11px] text-[#a1a1aa] font-semibold mb-1">Section Display Name</label>
                          <input
                            type="text"
                            required
                            value={sec.label}
                            onChange={(e) => updateCustomSection(sec.id, "label", e.target.value)}
                            placeholder="e.g. Royal Box"
                            className="w-full bg-[#09090b] border border-[#27272a] rounded-lg px-3 py-2 text-sm text-white focus:border-[#76b900]"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] text-[#a1a1aa] font-semibold mb-1">Price (₹)</label>
                          <input
                            type="number"
                            required
                            min={0}
                            value={sec.price}
                            onChange={(e) => updateCustomSection(sec.id, "price", e.target.value)}
                            className="w-full bg-[#09090b] border border-[#27272a] rounded-lg px-3 py-2 text-sm text-white focus:border-[#76b900]"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] text-[#a1a1aa] font-semibold mb-1">Row Letters (e.g. R1, R2)</label>
                          <input
                            type="text"
                            required
                            value={sec.rows}
                            onChange={(e) => updateCustomSection(sec.id, "rows", e.target.value)}
                            placeholder="e.g. R1, R2"
                            className="w-full bg-[#09090b] border border-[#27272a] rounded-lg px-3 py-2 text-sm text-white focus:border-[#76b900]"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] text-[#a1a1aa] font-semibold mb-1">Seats per Row</label>
                          <input
                            type="number"
                            required
                            min={1}
                            max={30}
                            value={sec.seatsPerRow}
                            onChange={(e) => updateCustomSection(sec.id, "seatsPerRow", e.target.value)}
                            className="w-full bg-[#09090b] border border-[#27272a] rounded-lg px-3 py-2 text-sm text-white focus:border-[#76b900]"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Total Capacity Summary Card */}
            <div className="p-4 rounded-xl bg-[#09090b] border border-[#27272a] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase font-bold text-[#a1a1aa]">Auditorium Capacity</p>
                <p className="text-2xl font-black text-[#76b900]">{grandTotalCapacity} Total Seats</p>
              </div>
              <div className="text-xs text-[#a1a1aa] space-y-0.5 text-left sm:text-right">
                <p>Balcony: {totalBalcony} • Middle: {totalMiddle} • Lower: {totalLower}</p>
                {totalCustom > 0 && <p className="text-[#76b900]">Custom Sections: +{totalCustom} seats</p>}
              </div>
            </div>

            {/* Submit & Cancel */}
            <div className="pt-4 border-t border-[#27272a] flex justify-end gap-3">
              <Link
                to="/admin"
                className="px-5 py-3 rounded-xl bg-[#18181f] hover:bg-[#3f3f46] border border-[#27272a] text-sm font-semibold text-slate-300"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 rounded-xl bg-[#76b900] hover:bg-[#8cd600] text-slate-950 font-black text-sm shadow-lg shadow-[#76b900]/30 flex items-center gap-2 transition-all disabled:opacity-50"
              >
                <Plus className="w-4 h-4" />
                <span>{loading ? "Registering..." : "Create Theatre & Layout"}</span>
              </button>
            </div>

          </form>

        </div>
      </div>

    </div>
  );
};

export default AddTheatre;
