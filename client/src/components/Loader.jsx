import React from 'react';

function Loader() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black z-50">
      <div className="text-center p-8 rounded-3xl bg-[#121216] border border-zinc-800 shadow-2xl">
        <div className="text-5xl mb-3 animate-pulse">🎬</div>
        <div className="text-2xl font-black bg-gradient-to-r from-[#ff6600] via-[#ff7700] to-[#ffa333] bg-clip-text text-transparent mb-4 tracking-wider">
          iMovies
        </div>
        <div className="flex gap-2 justify-center">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-3 h-3 bg-primary rounded-full animate-bounce shadow-orange-sm"
              style={{ animationDelay: `${i * 0.15}s` }}
            ></div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Loader;
