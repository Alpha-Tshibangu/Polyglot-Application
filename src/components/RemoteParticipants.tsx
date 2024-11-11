import React from 'react';
import { DefaultParticipantViewUI, ParticipantView, hasScreenShare } from '@stream-io/video-react-sdk';
import { RemoteParticipantsProps } from './types';
import { ParticipantOverlay } from './ParticipantOverlay';
import { CustomVideoPlaceholder } from './CustomVideoPlaceholder';

export const RemoteParticipants: React.FC<RemoteParticipantsProps> = ({ participants }) => {
  if (participants.length <= 2) {
    return (
      <div className="flex h-full w-full">
        {participants.map((participant) => (
          <div 
            key={participant.sessionId}
            className={`relative h-full ${participants.length === 2 ? 'w-1/2' : 'w-full'}`}
          >
            <ParticipantView 
              participant={participant}
              ParticipantViewUI={DefaultParticipantViewUI}
              trackType={hasScreenShare(participant) ? 'screenShareTrack' : 'videoTrack'}
              VideoPlaceholder={CustomVideoPlaceholder}
            />
            <ParticipantOverlay participant={participant} />
          </div>
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-row items-center gap-2.5 h-40 min-h-40 px-4 overflow-x-auto scrollbar-hide">
        {participants.slice(1).map((participant) => (
          <div 
            key={participant.sessionId}
            className="relative w-60 min-w-60 first:ml-auto last:mr-auto"
          >
            <ParticipantView 
              participant={participant}
              ParticipantViewUI={DefaultParticipantViewUI}
              trackType="videoTrack"
              VideoPlaceholder={CustomVideoPlaceholder}
            />
            <ParticipantOverlay participant={participant} />
          </div>
        ))}
      </div>
      <div className="flex-1 min-h-0 flex items-center justify-center">
        {participants[0] && (
          <div className="relative h-full w-auto">
            <ParticipantView
              participant={participants[0]}
              ParticipantViewUI={DefaultParticipantViewUI}
              trackType={hasScreenShare(participants[0]) ? 'screenShareTrack' : 'videoTrack'}
              VideoPlaceholder={CustomVideoPlaceholder}
            />
            <ParticipantOverlay participant={participants[0]} />
          </div>
        )}
      </div>
    </>
  );
};