import React from 'react';
import { StreamVideoParticipant, useCallStateHooks } from '@stream-io/video-react-sdk';
import { MicOff, VideoOff } from 'lucide-react';

interface ParticipantOverlayProps {
  participant: StreamVideoParticipant;
  isLocal?: boolean;
}

export const ParticipantOverlay: React.FC<ParticipantOverlayProps> = ({ 
  participant,
  isLocal = false
}) => {
  const { useMicrophoneState, useCameraState } = useCallStateHooks();
  const { isMute: isMicMuted } = useMicrophoneState();
  const { isMute: isCameraMuted } = useCameraState();

  // Use local state for local participant, otherwise use participant state
  const isAudioMuted = isLocal ? isMicMuted : participant.isMuted;
  const isVideoMuted = isLocal ? isCameraMuted : !participant.publishingVideo;

  const hasIndicators = isAudioMuted || isVideoMuted;

  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Frosted name tag with status indicators */}
      <div className="absolute top-4 left-4 flex items-center gap-2">
        <div className="h-8 px-3 flex items-center rounded-lg bg-black/30 backdrop-blur-md">
          <div className={`flex items-center gap-2 ${!hasIndicators ? 'justify-center w-full' : ''}`}>
            <span className="text-white text-sm font-medium">
              {participant.name || 'Anonymous'}
            </span>
            {hasIndicators && (
              <div className="flex gap-1.5 items-center">
                {isAudioMuted && (
                  <div className="bg-red-500 rounded-full p-1">
                    <MicOff className="w-3.5 h-3.5 text-white" />
                  </div>
                )}
                {isVideoMuted && (
                  <div className="bg-red-500 rounded-full p-1">
                    <VideoOff className="w-3.5 h-3.5 text-white" />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};