// src/components/FloatingToolbar.tsx

import React from 'react';
import { Button } from './ui/button';
import {
  Mic, MicOff, PhoneOff, Video, VideoOff,
  Subtitles, Settings, Globe
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
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
} from './ui/select';
import { Switch } from './ui/switch';

interface FloatingToolbarProps {
  isMuted: boolean;
  handleToggleMute: () => void;
  isVideoOff: boolean;
  handleToggleVideo: () => void;
  isCaptionsOn: boolean;
  setIsCaptionsOn: (value: boolean) => void;
  isTranslationOn: boolean;
  setIsTranslationOn: (value: boolean) => void;
  sourceLanguage: string;
  setSourceLanguage: (language: string) => void;
  targetLanguage: string;
  setTargetLanguage: (language: string) => void;
  leaveCall: () => void;
}

const languageOptions = {
  captions: [
    { value: 'eng', label: 'English' },
    { value: 'spa', label: 'Spanish' },
    { value: 'fra', label: 'French' },
    { value: 'rus', label: 'Russian' },
  ],
  translation: [
    { value: 'eng', label: 'English' },
    { value: 'spa', label: 'Spanish' },
    { value: 'fra', label: 'French' },
    { value: 'deu', label: 'German' },
    { value: 'rus', label: 'Russian' },
    { value: 'cmn', label: 'Mandarin' },
    { value: 'jpn', label: 'Japanese' },
    { value: 'kor', label: 'Korean' },
    { value: 'ara', label: 'Arabic' },
    { value: 'hin', label: 'Hindi' }
  ]
} as const;

const FloatingToolbar: React.FC<FloatingToolbarProps> = ({
  // Audio/Video controls
  isMuted,
  handleToggleMute,
  isVideoOff,
  handleToggleVideo,
  
  // Caption settings
  isCaptionsOn,
  setIsCaptionsOn,
  captionLanguage,
  setCaptionLanguage,
  
  // Translation settings
  isTranslationOn,
  setIsTranslationOn,
  targetLanguage,
  setTargetLanguage,
  
  leaveCall,
}) => {
  const [isSettingsOpen, setIsSettingsOpen] = React.useState(false);
  const iconSize = 20;

  const getLanguageLabel = (type: keyof typeof languageOptions, value: string) => {
    return languageOptions[type].find(lang => lang.value === value)?.label || 'Select Language';
  };

  return (
    <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 px-6 py-4 rounded-full bg-white bg-opacity-20 backdrop-filter backdrop-blur-lg flex items-center space-x-4">
      {/* Microphone toggle */}
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

      {/* Video toggle */}
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

      {/* Captions toggle */}
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

      {/* Translation toggle */}
      <Button
        variant="ghost"
        size="icon"
        className="rounded-full bg-white bg-opacity-20 hover:bg-opacity-30 transition-colors"
        onClick={() => setIsTranslationOn(!isTranslationOn)}
      >
        <Globe
          style={{ width: iconSize, height: iconSize }}
          className={isTranslationOn ? 'text-blue-500' : 'text-white'}
        />
      </Button>

      {/* Settings menu */}
      <DropdownMenu open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full bg-white bg-opacity-20 hover:bg-opacity-30 transition-colors"
          >
            <Settings style={{ width: iconSize, height: iconSize }} className="text-white" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-72 mb-4" side="top" align="center">
          <DropdownMenuLabel>Settings</DropdownMenuLabel>
          <DropdownMenuSeparator />

          <div className="p-2 space-y-4">
            {/* Caption Settings */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Captions</label>
                <Switch 
                  checked={isCaptionsOn}
                  onCheckedChange={setIsCaptionsOn}
                />
              </div>
              {isCaptionsOn && (
                <div className="space-y-1">
                  <label className="text-xs text-gray-500">Caption Language:</label>
                  <Select value={captionLanguage} onValueChange={setCaptionLanguage}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select Language">
                        {getLanguageLabel('captions', captionLanguage)}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {languageOptions.captions.map((lang) => (
                        <SelectItem key={lang.value} value={lang.value}>
                          {lang.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            {/* Live Translation Settings */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Live Translation</label>
                <Switch
                  checked={isTranslationOn}
                  onCheckedChange={(checked) => setIsTranslationOn(checked)}
                />
              </div>
              {isTranslationOn && (
                <div className="space-y-1">
                  <label className="text-xs text-gray-500">Translate to:</label>
                  <Select value={targetLanguage} onValueChange={setTargetLanguage}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select Language">
                        {getLanguageLabel('translation', targetLanguage)}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {languageOptions.translation.map((lang) => (
                        <SelectItem key={lang.value} value={lang.value}>
                          {lang.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Leave call button */}
      <Button
        variant="destructive"
        size="icon"
        className="rounded-full"
        onClick={leaveCall}
      >
        <PhoneOff style={{ width: iconSize, height: iconSize }} />
      </Button>
    </div>
  );
};

export default FloatingToolbar;