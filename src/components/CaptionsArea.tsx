'use client';

import React, { useState, useEffect } from 'react';
import AnimatedText from './AnimatedText';

type CaptionsAreaProps = {
  isCaptionsOn: boolean;
  showEllipsis?: boolean;
  text: string;
  speaker?: string;
}

const CaptionsArea = ({ 
  isCaptionsOn, 
  showEllipsis = false, 
  text, 
  speaker 
}: CaptionsAreaProps) => {
  const [showText, setShowText] = useState(true);

  useEffect(() => {
    if (text) {
      setShowText(true);
      const timer = setTimeout(() => {
        setShowText(false);
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [text, isCaptionsOn, showEllipsis]);

  if (!isCaptionsOn) return null;

  return (
    <div className="absolute bottom-32 left-1/2 transform -translate-x-1/2 px-6 py-4 rounded-lg bg-black/60 text-white text-center max-w-md w-[90%] mx-auto min-h-[60px] flex flex-col items-center justify-center">
      {speaker && (
        <div className="font-bold">{speaker}</div>
      )}
      <div className="text-base">
        {showEllipsis || !showText ? (
          <AnimatedText text={'...'} speed={300} initialText="..." />
        ) : (
          <AnimatedText text={text} speed={30} />
        )}
      </div>
    </div>
  );
};

export default CaptionsArea;