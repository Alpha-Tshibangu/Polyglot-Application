// src/components/JoinMeeting.tsx
"use client";

import React, { useState, useRef, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Mic, MicOff, Video, VideoOff, User, Check, Copy, Plus, Mail, X 
} from 'lucide-react';
import { useForm, Controller } from 'react-hook-form';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { DatePickerWithPresets } from './date-picker';
import { ToastProvider } from "@/components/ui/toast";
import { useToast } from '@/hooks/use-toast';

type FormData = {
  meetingId: string;
  name: string;
  title: string;
  description: string;
  dateTime: Date | null;
};

const EmailInput: React.FC<{
  emails: string[];
  setEmails: React.Dispatch<React.SetStateAction<string[]>>;
}> = ({ emails, setEmails }) => {
  const [input, setInput] = useState('');
  const [invalidEmail, setInvalidEmail] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const addEmail = (email: string) => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail) return;

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setInvalidEmail(trimmedEmail);
      return;
    }

    if (emails.includes(trimmedEmail)) {
      setInvalidEmail(trimmedEmail);
      return;
    }

    setEmails([...emails, trimmedEmail]);
    setInvalidEmail(null);
    setInput('');
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addEmail(input);
    }
  };

  const removeEmail = (emailToRemove: string) => {
    setEmails(emails.filter(email => email !== emailToRemove));
  };

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 bg-gray-200 border border-gray-300 rounded-md px-3 py-2 text-sm placeholder-gray-500 focus-within:border-gray-400 focus-within:ring-gray-400">
        {emails.map((email) => (
          <span
            key={email}
            className="flex items-center bg-gray-300 text-black px-3 py-1 rounded-md shadow text-sm"
          >
            {email}
            <X
              className="ml-1 h-4 w-4 cursor-pointer text-gray-500 hover:text-gray-700"
              onClick={() => removeEmail(email)}
            />
          </span>
        ))}

        <input
          ref={inputRef}
          type="text"
          placeholder="Optional: Add Attendee Emails"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          className="bg-transparent flex-grow text-black placeholder-gray-500 focus:outline-none text-sm"
          aria-label="Add attendee emails"
        />
      </div>
  
      {invalidEmail && (
        <p className="text-red-500 text-sm mt-2">
          Invalid or duplicate email: {invalidEmail}
        </p>
      )}
    </div>
  );
};

function JoinMeetingForm() {
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [isMobile, setIsMobile] = useState(false);
  const [meetingIdCopied, setMeetingIdCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Media states
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isAudioEnabled, setIsAudioEnabled] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const { register, handleSubmit, control, watch, setValue, formState: { errors } } = useForm<FormData>({
    defaultValues: {
      meetingId: '',
      name: '',
      title: '',
      description: '',
      dateTime: null,
    },
  });

  const meetingId = watch('meetingId');
  const [emails, setEmails] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'immediate' | 'scheduled'>('immediate');

  // Check URL for meeting ID
  useEffect(() => {
    const meetingIdFromUrl = searchParams.get('id');
    if (meetingIdFromUrl) {
      setValue('meetingId', meetingIdFromUrl);
    }
  }, [searchParams, setValue]);

  // Mobile check
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Media initialization
  useEffect(() => {
    if (isMobile) {
      setStream(null);
      return;
    }

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
        toast({
          title: 'Media Access Error',
          description: 'Unable to access camera and/or microphone.',
          variant: 'destructive',
        });
      }
    }

    initializeMedia();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [isMobile, toast]);

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

  const getMeetingLink = (meetingId: string) => {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || window.location.origin;
    return `${baseUrl}/meeting/${meetingId}`;
  };

  const handleCreateMeeting = () => {
    const newMeetingId = crypto.randomUUID();
    setValue('meetingId', newMeetingId);
    setMeetingIdCopied(false);
  };

  const handleCopyMeetingId = async () => {
    const currentMeetingId = watch('meetingId');
    if (currentMeetingId) {
      const meetingLink = getMeetingLink(currentMeetingId);
      await navigator.clipboard.writeText(meetingLink);
      setMeetingIdCopied(true);
      setTimeout(() => setMeetingIdCopied(false), 2000);
      toast({
        title: 'Meeting Link Copied',
        description: 'The meeting link has been copied to your clipboard.',
        variant: 'default',
      });
    }
  };

  const handleInviteAttendees = async () => {
    if (emails.length === 0) {
      toast({
        title: 'No Emails Provided',
        description: 'Please add at least one attendee email.',
        variant: 'destructive',
      });
      return;
    }
    try {
      // Replace with actual API call to send invitations
      console.log('Inviting Attendees:', emails);
      toast({
        title: 'Invitations Sent',
        description: 'Invitation emails have been sent successfully!',
        variant: 'default',
      });
    } catch (error) {
      console.error(error);
      toast({
        title: 'Error',
        description: 'There was an error sending the invitations.',
        variant: 'destructive',
      });
    }
  };

  const onSubmit = async (data: FormData) => {
    if (!data.name.trim() || !data.meetingId.trim()) return;
    if (activeTab === 'scheduled' && !data.dateTime) {
      toast({
        title: 'Date & Time Required',
        description: 'Please select a date and time for the scheduled meeting.',
        variant: 'destructive',
      });
      return;
    }
    
    setIsLoading(true);
    try {
      const userId = crypto.randomUUID();
      
      localStorage.setItem('userName', data.name);
      localStorage.setItem('userId', userId);
      localStorage.setItem('meetingId', data.meetingId);
      localStorage.setItem('isAudioEnabled', String(isAudioEnabled));
      localStorage.setItem('isVideoEnabled', String(isVideoEnabled));
      localStorage.setItem('meetingTitle', data.title);
      localStorage.setItem('meetingDescription', data.description);
      localStorage.setItem('meetingDateTime', data.dateTime?.toISOString() || '');
      localStorage.setItem('meetingType', activeTab);
      
      router.push(`/meeting/${data.meetingId}`);
    } catch (error) {
      console.error('Failed to join meeting:', error);
      setIsLoading(false);
      toast({
        title: 'Error',
        description: 'There was an error joining the meeting.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="relative w-full h-full">
      {!isMobile && (
        <>
          <video
            ref={videoRef}
            className="fixed top-0 left-0 w-full h-full object-cover z-0"
            autoPlay
            muted
            playsInline
          />
          {!isVideoEnabled && (
            <div className="flex absolute inset-0 items-center justify-center bg-gray-800 bg-opacity-50 z-0">
              <User className="h-32 w-32 text-gray-400" />
            </div>
          )}
        </>
      )}
      
      <div className={cn(
        "fixed top-0 right-0 h-full z-10 p-6",
        "bg-white bg-opacity-50 backdrop-blur-md",
        "w-full md:w-1/3", 
        "overflow-auto flex justify-center items-center"
      )}>
        <div className="flex flex-col space-y-6 w-full max-w-md">
          <h1 className={`text-3xl font-bold ${isMobile ? "text-gray-300" : "text-black"} text-center`}>
            POLYGLOT BETA
          </h1>
          
          <Tabs 
            defaultValue="immediate" 
            onValueChange={(value) => setActiveTab(value as 'immediate' | 'scheduled')}
            className="mb-4"
          >
            <TabsList className="w-full">
              <TabsTrigger value="immediate" className="w-1/2 font-normal">Start Meeting</TabsTrigger>
              <TabsTrigger value="scheduled" className="w-1/2 font-normal">Schedule Meeting</TabsTrigger>
            </TabsList>
          </Tabs>
          
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="relative">
              <div
                className="bg-gray-200 border border-gray-300 text-sm text-black placeholder-gray-500 focus:border-gray-400 focus:ring-gray-400 pr-10 rounded-md px-3 py-2"
                aria-label="Meeting ID"
              >
                {meetingId || <span className="text-gray-500">Create Meeting ID</span>}
              </div>

              <div
                className="absolute inset-y-0 right-0 flex items-center pr-3 cursor-pointer"
                onClick={meetingId ? handleCopyMeetingId : handleCreateMeeting}
                title={meetingId ? 'Copy Meeting ID' : 'Create Meeting'}
              >
                {meetingId ? (
                  meetingIdCopied ? (
                    <Check className="h-5 w-5 text-green-500" />
                  ) : (
                    <Copy className="h-5 w-5 text-gray-500 hover:text-gray-700" />
                  )
                ) : (
                  <Plus className="h-5 w-5 text-gray-500 hover:text-gray-700" />
                )}
              </div>
            </div>

            {errors.meetingId && <p className="text-red-500 text-sm">Meeting ID is required.</p>}

            {activeTab === 'scheduled' && (
              <>
                <div className="flex flex-wrap items-center gap-2 bg-gray-200 border border-gray-300 rounded-md px-3 py-2 text-sm placeholder-gray-500 focus-within:border-gray-400 focus-within:ring-gray-400">
                  <input
                    type="text"
                    placeholder="Meeting Title"
                    {...register('title', { required: true })}
                    className="bg-transparent flex-grow text-black placeholder-gray-500 focus:outline-none text-sm"
                    aria-label="Meeting Title"
                  />
                </div>
                {errors.title && <p className="text-red-500 text-sm">Meeting title is required.</p>}

                <Textarea
                  placeholder="Meeting Description"
                  {...register('description')}
                  className="bg-gray-200 border border-gray-300 text-black placeholder-gray-500 focus:border-gray-400 focus:ring-gray-400"
                  rows={3}
                  aria-label="Meeting Description"
                />

                <Controller
                  control={control}
                  name="dateTime"
                  rules={{ required: activeTab === 'scheduled' }}
                  render={({ field, fieldState }) => (
                    <div className="relative">
                      <DatePickerWithPresets
                        value={field.value}
                        onChange={field.onChange}
                      />
                      {fieldState.error && (
                        <p className="text-red-500 text-sm mt-1">Date and time are required for scheduled meetings.</p>
                      )}
</div>
                  )}
                />
              </>
            )}

            <EmailInput emails={emails} setEmails={setEmails} />

            <Button
              type="button"
              variant="secondary"
              onClick={handleInviteAttendees}
              className="w-full flex items-center justify-center font-normal"
              disabled={emails.length === 0}
            >
              <Mail className="h-5 w-5 mr-2" />
              <span>Invite Attendees</span>
            </Button>

            <div className="flex flex-wrap items-center gap-2 bg-gray-200 border border-gray-300 rounded-md px-3 py-2 text-sm placeholder-gray-500 focus-within:border-gray-400 focus-within:ring-gray-400">
              <input
                type="text"
                placeholder="Enter Your Name"
                {...register('name', { required: true })}
                className="bg-transparent flex-grow text-black placeholder-gray-500 focus:outline-none text-sm"
                aria-label="Your Name"
              />
            </div>
            {errors.name && <p className="text-red-500 text-sm">Your name is required.</p>}

            <Button
              type="submit"
              variant="secondary"
              className="w-full flex items-center justify-center font-normal"
              disabled={
                !watch('name').trim() ||
                !watch('meetingId').trim() ||
                (activeTab === 'scheduled' && !watch('dateTime')) ||
                isLoading
              }
            >
              {isLoading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Joining...
                </span>
              ) : (
                'Join Meeting'
              )}
            </Button>
          </form>
        </div>
      </div>

      {!isMobile && (
        <div className="fixed bottom-6 left-6 flex space-x-4 z-10">
          <Button
            variant={isAudioEnabled ? 'default' : 'secondary'}
            size="icon"
            className="rounded-full bg-white bg-opacity-50 hover:bg-white"
            onClick={toggleAudio}
            aria-label={isAudioEnabled ? 'Mute audio' : 'Unmute audio'}
          >
            {isAudioEnabled ? <Mic className="h-6 w-6 text-black" /> : <MicOff className="h-6 w-6 text-black" />}
          </Button>
          <Button
            variant={isVideoEnabled ? 'default' : 'secondary'}
            size="icon"
            className="rounded-full bg-white bg-opacity-50 hover:bg-white"
            onClick={toggleVideo}
            aria-label={isVideoEnabled ? 'Turn off video' : 'Turn on video'}
          >
            {isVideoEnabled ? <Video className="h-6 w-6 text-black" /> : <VideoOff className="h-6 w-6 text-black" />}
          </Button>
        </div>
      )}
    </div>
  );
}

export function JoinMeetingWrapper() {
  return (
    <ToastProvider>
      <JoinMeetingForm />
    </ToastProvider>
  );
}