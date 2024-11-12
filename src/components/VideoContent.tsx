'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  useCallStateHooks,
  combineComparators,
  dominantSpeaker,
  speaking,
  publishingVideo,
  publishingAudio,
  screenSharing,
  pinned,
  conditional,
  VisibilityState,
  ParticipantView,
  DefaultParticipantViewUI,
  StreamVideoParticipant,
} from '@stream-io/video-react-sdk';
import { VideoContentProps, Position, DragOffset } from './types';
import { thumbnailStyles, INITIAL_POSITION, THUMBNAIL_WIDTH, THUMBNAIL_HEIGHT } from './styles';
import { LocalThumbnail } from './LocalThumbnail';
import { RemoteParticipants } from './RemoteParticipants';
import FloatingToolbar from './FloatingToolbar';
import CaptionsArea from './CaptionsArea';
import { TranscriptionService } from '../app/TranscriptionService';

const VideoContent = ({ call, onLeaveCall }: VideoContentProps) => {
  const {
    useParticipants,
    useDominantSpeaker,
    useLocalParticipant,
    useCallSettings,
    useCameraState,
    useMicrophoneState,
  } = useCallStateHooks();

  const participants = useParticipants();
  const localParticipant = useLocalParticipant();
  const dominantSpeakerParticipant = useDominantSpeaker();
  const { camera, isMute: isCameraMuted } = useCameraState();
  const { microphone, isMute: isMicMuted } = useMicrophoneState();
  
  // Layout State
  const [thumbnailPosition, setThumbnailPosition] = useState<Position>(INITIAL_POSITION);
  const [isDragging, setIsDragging] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const dragOffset = useRef<DragOffset>({ x: 0, y: 0 });

  // Transcription State
  const [isCaptionsOn, setIsCaptionsOn] = useState(false);
  const [showTranscriptionDots, setShowTranscriptionDots] = useState(false);
  const [currentTranscription, setCurrentTranscription] = useState<{
    text: string;
    speaker: string | undefined;
  } | null>(null);
  const transcriptionService = useRef<TranscriptionService | null>(null);

  // Participant State
  const isSingleParticipant = participants.length === 1;
  const hasRemoteParticipants = participants.length > 1;
  const remoteParticipants = hasRemoteParticipants 
    ? participants.filter(p => p.sessionId !== localParticipant?.sessionId)
    : [];
  const showLocalThumbnail = hasRemoteParticipants;

  // Initialize styles
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = thumbnailStyles;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  // Handle caption toggle
  const handleCaptionToggle = async () => {
    const newState = !isCaptionsOn;
    setIsCaptionsOn(newState);
    
    if (newState) {
      setShowTranscriptionDots(true);
      setCurrentTranscription(null);
      
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        
        transcriptionService.current = new TranscriptionService();
        await transcriptionService.current.start(
          stream,
          localParticipant?.sessionId || '',
          (message) => {
            console.log('Received transcription in VideoContent:', message);
            setShowTranscriptionDots(false);
            setCurrentTranscription({
              text: message.text,
              speaker: message.speaker.name
            });
          }
        );
  
        transcriptionService.current.updateParticipants(participants);
        transcriptionService.current.setMuted(isMicMuted);
  
      } catch (error) {
        console.error('Failed to start transcription:', error);
        setIsCaptionsOn(false);
        setShowTranscriptionDots(false);
      }
    } else {
      if (transcriptionService.current) {
        transcriptionService.current.stop();
        transcriptionService.current = null;
      }
      setShowTranscriptionDots(false);
      setCurrentTranscription(null);
    }
  };

  // Update participants for transcription
  useEffect(() => {
    if (transcriptionService.current && isCaptionsOn) {
      transcriptionService.current.updateParticipants(participants);
    }
  }, [participants, isCaptionsOn]);

  // Handle thumbnail dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    const rect = e.currentTarget.getBoundingClientRect();
    dragOffset.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      const maxX = window.innerWidth - THUMBNAIL_WIDTH;
      const maxY = window.innerHeight - THUMBNAIL_HEIGHT;
      
      setThumbnailPosition({
        x: Math.min(Math.max(0, e.clientX - dragOffset.current.x), maxX),
        y: Math.min(Math.max(0, e.clientY - dragOffset.current.y), maxY),
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  // Handle thumbnail transition
  useEffect(() => {
    if (showLocalThumbnail) {
      setIsTransitioning(true);
      const timer = setTimeout(() => setIsTransitioning(false), 500);
      return () => clearTimeout(timer);
    }
  }, [showLocalThumbnail]);

  // Set participant sorting
  useEffect(() => {
    if (!call) return;
    const customSorting = getCustomSortingPreset(participants.length <= 2);
    call.setSortParticipantsBy(customSorting);
  }, [call, participants.length]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (transcriptionService.current) {
        transcriptionService.current.stop();
      }
    };
  }, []);

  // Handle media toggles
  const handleToggleMicrophone = async () => {
    try {
      if (isMicMuted) {
        await call.microphone.enable();
      } else {
        await call.microphone.disable();
      }
    } catch (error) {
      console.error('Failed to toggle microphone:', error);
    }
  };

  const handleToggleCamera = async () => {
    try {
      if (isCameraMuted) {
        await call.camera.enable();
      } else {
        await call.camera.disable();
      }
    } catch (error) {
      console.error('Failed to toggle camera:', error);
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-black">
      <div className="relative flex flex-col h-full w-full">
        {isSingleParticipant && localParticipant ? (
          // Single participant view
          <div className="h-full w-full">
            <ParticipantView
              participant={localParticipant}
              ParticipantViewUI={DefaultParticipantViewUI}
              trackType="videoTrack"
            />
          </div>
        ) : (
          // Multi-participant view
          <>
            <RemoteParticipants participants={remoteParticipants} />
            
            {showLocalThumbnail && localParticipant && (
              <LocalThumbnail
                participant={localParticipant}
                position={thumbnailPosition}
                isTransitioning={isTransitioning}
                onMouseDown={handleMouseDown}
              />
            )}
          </>
        )}
      </div>

      {/* Captions */}
      <CaptionsArea
        isCaptionsOn={isCaptionsOn}
        showEllipsis={showTranscriptionDots}
        text={currentTranscription?.text || ''}
        speaker={currentTranscription?.speaker}
      />

      {/* Controls */}
      <FloatingToolbar
        isMuted={isMicMuted}
        handleToggleMute={handleToggleMicrophone}
        isVideoOff={isCameraMuted}
        handleToggleVideo={handleToggleCamera}
        isCaptionsOn={isCaptionsOn}
        setIsCaptionsOn={handleCaptionToggle}
        isAudioTranslationOn={false}
        setIsAudioTranslationOn={() => {}}
        spokenLanguage="en"
        setSpokenLanguage={() => {}}
        captionLanguage="en"
        setCaptionLanguage={() => {}}
        audioTranslationLanguage="en"
        setAudioTranslationLanguage={() => {}}
        callAccepted={true}
        callEnded={false}
        leaveCall={onLeaveCall}
        participantCount={participants.length}
      />
    </div>
  );
};

const getCustomSortingPreset = (isOneToOneCall: boolean = false) => {
  if (isOneToOneCall) {
    return (a: StreamVideoParticipant, b: StreamVideoParticipant) => {
      if (a.isLocalParticipant) return 1;
      if (b.isLocalParticipant) return -1;
      return 0;
    };
  }

  const ifInvisibleBy = conditional(
    (a: StreamVideoParticipant, b: StreamVideoParticipant) =>
      a.viewportVisibilityState?.videoTrack === VisibilityState.INVISIBLE ||
      b.viewportVisibilityState?.videoTrack === VisibilityState.INVISIBLE,
  );

  return combineComparators(
    screenSharing,
    dominantSpeaker,
    pinned,
    ifInvisibleBy(speaking),
    ifInvisibleBy(publishingVideo),
    ifInvisibleBy(publishingAudio),
  );
};

export default VideoContent;