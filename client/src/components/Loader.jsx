import React from "react";
import { Film } from "lucide-react";

const Loader = ({ message = "Loading iMovies..." }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] p-8">
      <div className="relative flex items-center justify-center">
        {/* Outer glowing pulsing ring */}
        <div className="w-16 h-16 rounded-full border-4 border-red-600/20 border-t-red-600 animate-spin" />
        {/* Film reel center icon */}
        <Film className="w-7 h-7 text-red-500 absolute animate-pulse" />
      </div>
      <p className="mt-4 text-slate-400 font-medium tracking-wide text-sm animate-pulse">
        {message}
      </p>
    </div>
  );
};

export default Loader;
