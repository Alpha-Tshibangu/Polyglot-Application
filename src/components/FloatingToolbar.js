// src/components/FloatingToolbar.js

import React from 'react';
import { Button } from './ui/button';
import {
  Mic,
  MicOff,
  PhoneOff,
  Video,
  VideoOff,
  Subtitles,
  Settings,
  Globe,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/DropdownMenu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/Select';
import { Switch } from './ui/Switch';

const FloatingToolbar = ({
  isMuted,
  handleToggleMute,
  isVideoOff,
  handleToggleVideo,
  isCaptionsOn,
  setIsCaptionsOn,
  isAudioTranslationOn,
  setIsAudioTranslationOn,
  isSettingsOpen,
  setIsSettingsOpen,
  spokenLanguage,
  setSpokenLanguage,
  captionLanguage,
  setCaptionLanguage,
  audioTranslationLanguage,
  setAudioTranslationLanguage,
  callAccepted,
  callEnded,
  leaveCall,
  callUser,
  idToCall,
}) => {

  const iconSize = 20; 

  return (
    <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 px-6 py-4 rounded-full bg-white bg-opacity-20 backdrop-filter backdrop-blur-lg flex items-center space-x-4">
      <Button
        variant="ghost"
        size="icon"
        className="rounded-full bg-white bg-opacity-20 hover:bg-opacity-30 transition-colors"
        onClick={handleToggleMute}
      >
        {isMuted ? (
          <MicOff style={{ width: iconSize, height: iconSize }} className="text-red-500" />
        ) : (
          <Mic style={{ width: iconSize, height: iconSize }} className="text-white" />
        )}
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="rounded-full bg-white bg-opacity-20 hover:bg-opacity-30 transition-colors"
        onClick={handleToggleVideo}
      >
        {isVideoOff ? (
          <VideoOff style={{ width: iconSize, height: iconSize }} className="text-red-500" />
        ) : (
          <Video style={{ width: iconSize, height: iconSize }} className="text-white" />
        )}
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="rounded-full bg-white bg-opacity-20 hover:bg-opacity-30 transition-colors"
        onClick={() => setIsCaptionsOn(!isCaptionsOn)}
      >
        <Subtitles
          style={{ width: iconSize, height: iconSize }}
          className={isCaptionsOn ? 'text-blue-500' : 'text-white'}
        />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="rounded-full bg-white bg-opacity-20 hover:bg-opacity-30 transition-colors"
        onClick={() => setIsAudioTranslationOn(!isAudioTranslationOn)}
      >
        <Globe
          style={{ width: iconSize, height: iconSize }}
          className={isAudioTranslationOn ? 'text-blue-500' : 'text-white'}
        />
      </Button>
      <DropdownMenu
        open={isSettingsOpen}
        onOpenChange={setIsSettingsOpen}
      >
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full bg-white bg-opacity-20 hover:bg-opacity-30 transition-colors"
          >
            <Settings style={{ width: iconSize, height: iconSize }} className="text-white" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          className="w-56 mb-4"
          onCloseAutoFocus={(e) => e.preventDefault()}
          side="top"
          align="center"
        >
          <DropdownMenuLabel>Language Settings</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
            <div className="flex items-center justify-between w-full">
              <span>Spoken Language</span>
            </div>
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
            <Select
              onValueChange={setSpokenLanguage}
              value={spokenLanguage}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Spoken Language" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="es">Spanish</SelectItem>
                <SelectItem value="fr">French</SelectItem>
              </SelectContent>
            </Select>
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
            <div className="flex items-center justify-between w-full">
              <span>Captions</span>
              <Switch
                checked={isCaptionsOn}
                onCheckedChange={setIsCaptionsOn}
              />
            </div>
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
            <Select
              onValueChange={setCaptionLanguage}
              value={captionLanguage}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Caption Language" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="es">Spanish</SelectItem>
                <SelectItem value="fr">French</SelectItem>
              </SelectContent>
            </Select>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
            <div className="flex items-center justify-between w-full">
              <span>Translation</span>
              <Switch
                checked={isAudioTranslationOn}
                onCheckedChange={setIsAudioTranslationOn}
              />
            </div>
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
            <Select
              onValueChange={setAudioTranslationLanguage}
              value={audioTranslationLanguage}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Translation Language" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="French">French</SelectItem>
                <SelectItem value="Spanish">Spanish</SelectItem>
                <SelectItem value="German">German</SelectItem>
              </SelectContent>
            </Select>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      {callAccepted && !callEnded ? (
        <Button
          variant="destructive"
          size="icon"
          className="rounded-full"
          onClick={leaveCall}
        >
          <PhoneOff style={{ width: iconSize, height: iconSize }} />
        </Button>
      ) : (
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full bg-white bg-opacity-20 hover:bg-opacity-30 transition-colors"
          onClick={() => callUser(idToCall)}
        >
          <PhoneOff style={{ width: iconSize, height: iconSize }} className="text-white" />
        </Button>
      )}
    </div>
  );
};

export default FloatingToolbar;
