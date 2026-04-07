
import React from 'react';

/**
 * Logo CP GESTÃO - Standalone Component
 * Reprodução exata utilizada na Landing Page para o seu MVP.
 */
export const LogoCPGestao: React.FC<{ 
  className?: string; 
  light?: boolean;
}> = ({ 
  className = "h-12", 
  light = true
}) => {
  const title = "CP GESTÃO";
  const subtitle = "CREATIVE PRINT";

  return (
    <div className={`flex items-center gap-4 flex-shrink-0 ${className}`}>
      {/* 4 Colored Blocks Logo Mark */}
      <div className="grid grid-cols-2 gap-[3px] w-12 h-12 flex-shrink-0">
        {/* Top Left: Large Magenta */}
        <div className="bg-[#E5157A] rounded-[2px]"></div>

        {/* Top Right: Mini Grid */}
        <div className="grid grid-cols-2 gap-[2px]">
          <div className="bg-[#FFF200] rounded-[1px]"></div> {/* Small Yellow */}
          <div className=""></div> {/* Empty Top-Right */}
          <div className="bg-[#38b6ff] rounded-[1px]"></div> {/* Small Blue */}
          <div className="bg-[#E5157A] rounded-[1px]"></div> {/* Small Magenta */}
        </div>

        {/* Bottom Left: Large Blue */}
        <div className="bg-[#38b6ff] rounded-[2px]"></div>

        {/* Bottom Right: Large Yellow */}
        <div className="bg-[#FFF200] rounded-[2px]"></div>
      </div>

      {/* Text Part */}
      <div className="flex flex-col justify-center select-none whitespace-nowrap">
        {/* Main Title */}
        <div className={`text-[34px] font-black tracking-[-0.02em] leading-none ${light ? 'text-white' : 'text-slate-900'}`}>
          {title}
        </div>

        {/* Subtitle - Justified to match title width */}
        <div className={`flex justify-between items-center text-[10px] font-bold mt-1.5 ${light ? 'text-[#38b6ff]' : 'text-slate-500'}`}>
          {subtitle.split("").map((char, index) => (
            <span key={index} className="flex-shrink-0">
              {char === " " ? "\u00A0" : char}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};
