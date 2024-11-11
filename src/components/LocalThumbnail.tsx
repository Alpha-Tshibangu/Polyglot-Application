import React from 'react';
import { DefaultParticipantViewUI, ParticipantView } from '@stream-io/video-react-sdk';
import { ThumbnailProps } from './types';
import { THUMBNAIL_HEIGHT, THUMBNAIL_WIDTH } from './styles';
import { ParticipantOverlay } from './ParticipantOverlay';
import { CustomVideoPlaceholder } from './CustomVideoPlaceholder';

export const LocalThumbnail: React.FC<ThumbnailProps> = ({
  participant,
  position,
  isTransitioning,
  onMouseDown,
}) => {
  return (
    <div
      className={`absolute z-50 cursor-move local-thumbnail ${isTransitioning ? 'transitioning' : ''}`}
      style={{
        transform: `translate(${position.x}px, ${position.y}px)`,
        width: `${THUMBNAIL_WIDTH}px`,
        height: `${THUMBNAIL_HEIGHT}px`,
      }}
      onMouseDown={onMouseDown}
    >
      <div className="relative w-full h-full rounded-xl overflow-hidden">
        <ParticipantView
          participant={participant}
          ParticipantViewUI={DefaultParticipantViewUI}
          VideoPlaceholder={CustomVideoPlaceholder}
          trackType="videoTrack"
        />
        <ParticipantOverlay 
          participant={participant} 
          isLocal={true}
        />
      </div>
    </div>
  );
};