// src/components/types.ts

import { Call, StreamVideoParticipant } from '@stream-io/video-react-sdk';

export interface VideoContentProps {
  call: Call;
  onLeaveCall: () => void;
}

export interface Position {
  x: number;
  y: number;
}

export interface DragOffset {
  x: number;
  y: number;
}

export interface ThumbnailProps {
  participant: StreamVideoParticipant;
  position: Position;
  isTransitioning: boolean;
  onMouseDown: (e: React.MouseEvent) => void;
}

export interface RemoteParticipantsProps {
  participants: StreamVideoParticipant[];
}