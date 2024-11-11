// src/components/JoinMeeting.tsx
"use client";

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mic, MicOff, Video, VideoOff, User, Check } from 'lucide-react';

export default function JoinMeeting() {
  const [isMobile, setIsMobile] = useState(false);
  const [meetingIdCopied, setMeetingIdCopied] = useState(false);
  const [name, setName] = useState('');
  const [meetingId, setMeetingId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Media states
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isAudioEnabled, setIsAudioEnabled] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const router = useRouter();

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Initialize camera/microphone
  useEffect(() => {
    async function initializeMedia() {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true
        });
        
        setStream(mediaStream);
        setIsVideoEnabled(true);
        setIsAudioEnabled(true);
        
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      } catch (error) {
        console.error('Error accessing media devices:', error);
      }
    }

    initializeMedia();

    // Cleanup
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const toggleVideo = () => {
    if (stream) {
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoEnabled(videoTrack.enabled);
      }
    }
  };

  const toggleAudio = () => {
    if (stream) {
      const audioTrack = stream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioEnabled(audioTrack.enabled);
      }
    }
  };

  const handleCreateMeeting = () => {
    const newMeetingId = crypto.randomUUID();
    setMeetingId(newMeetingId);
    setMeetingIdCopied(false);
  };

  const handleCopyMeetingId = async () => {
    await navigator.clipboard.writeText(meetingId);
    setMeetingIdCopied(true);
    setTimeout(() => setMeetingIdCopied(false), 2000);
  };

  const handleJoin = async () => {
    if (!name.trim() || !meetingId.trim()) return;
    
    setIsLoading(true);
    try {
      const userId = crypto.randomUUID();
      
      // Store all necessary information
      localStorage.setItem('userName', name);
      localStorage.setItem('userId', userId);
      localStorage.setItem('meetingId', meetingId);
      localStorage.setItem('isAudioEnabled', String(isAudioEnabled));
      localStorage.setItem('isVideoEnabled', String(isVideoEnabled));
      
      router.push(`/meeting/${meetingId}`);
    } catch (error) {
      console.error('Failed to join meeting:', error);
      setIsLoading(false);
    }
  };
  
  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-800 to-gray-900 text-white overflow-hidden">
      {/* Video Preview Section */}
      {!isMobile && (
        <div className="flex-1 flex flex-col">
          <div className="flex-1 relative">
            {isVideoEnabled && stream ? (
              <video
                ref={videoRef}
                className="absolute inset-0 w-full h-full object-cover"
                autoPlay
                muted
                playsInline
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                <User className="h-32 w-32 text-gray-400" />
              </div>
            )}
            <div className="absolute bottom-6 left-6 flex space-x-4">
              <Button
                variant={isAudioEnabled ? 'default' : 'secondary'}
                size="icon"
                className="rounded-full"
                onClick={toggleAudio}
                aria-label={isAudioEnabled ? 'Mute audio' : 'Unmute audio'}
              >
                {isAudioEnabled ? <Mic className="h-6 w-6" /> : <MicOff className="h-6 w-6" />}
              </Button>
              <Button
                variant={isVideoEnabled ? 'default' : 'secondary'}
                size="icon"
                className="rounded-full"
                onClick={toggleVideo}
                aria-label={isVideoEnabled ? 'Turn off video' : 'Turn on video'}
              >
                {isVideoEnabled ? <Video className="h-6 w-6" /> : <VideoOff className="h-6 w-6" />}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Join Meeting Form */}
      <div className={`${isMobile ? 'w-full' : 'w-96'} bg-gray-900 p-8 flex flex-col justify-center`}>
        <h1 className="text-3xl font-bold mb-8 text-center">Welcome</h1>
        <div className="space-y-4">
          <Input
            type="text"
            placeholder="Enter Meeting ID"
            value={meetingId}
            onChange={(e) => setMeetingId(e.target.value)}
            className="bg-gray-800 border-gray-600 text-white placeholder-gray-400 focus:border-gray-400 focus:ring-gray-400"
          />
          <div className="flex space-x-2">
            {!meetingId && (
              <Button
                className="flex-1 bg-secondary text-secondary-foreground hover:bg-secondary/90"
                size="lg"
                onClick={handleCreateMeeting}
              >
                Create Meeting
              </Button>
            )}
            {meetingId && (
              <Button
                className={`flex-1 transition-all duration-100 ${
                  meetingIdCopied 
                    ? "bg-green-500 text-white hover:bg-green-600" 
                    : "bg-secondary text-secondary-foreground hover:bg-secondary/90"
                }`}
                size="lg"
                onClick={handleCopyMeetingId}
              >
                {meetingIdCopied ? <Check className="h-5 w-5" /> : "Copy Meeting ID"}
              </Button>
            )}
          </div>
          <Input
            type="text"
            placeholder="Enter your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="bg-gray-800 border-gray-600 text-white placeholder-gray-400 focus:border-gray-400 focus:ring-gray-400"
          />
          <Button
            className="w-full bg-transparent text-white border border-white hover:border-gray-300 hover:text-gray-300"
            size="lg"
            disabled={!name.trim() || !meetingId.trim() || isLoading}
            onClick={handleJoin}
          >
            {isLoading ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </span>
            ) : (
              'Join Meeting'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}