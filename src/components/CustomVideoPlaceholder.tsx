import React from 'react';
import { StreamVideoParticipant } from '@stream-io/video-react-sdk';

export const CustomVideoPlaceholder = ({ participant }: { participant: StreamVideoParticipant }) => {
  const initial = (participant.name?.[0] || 'A').toUpperCase();
  
  return (
    <div className="w-full h-full bg-[#0E0F12] flex items-center justify-center">
      <div className="w-16 h-16 rounded-full bg-[#1C1D21] flex items-center justify-center">
        <span className="text-2xl text-white font-medium">
          {initial}
        </span>
      </div>
    </div>
  );
};