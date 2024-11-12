// src/app/AudioPlayer.ts

import { StreamVideoParticipant } from '@stream-io/video-react-sdk';

interface ActiveAudio {
  source: AudioBufferSourceNode;
  gain: GainNode;
  startTime: number;
}

export class AudioPlayer {
  private audioContext: AudioContext | null = null;
  private mainGainNode: GainNode | null = null;
  private activeAudioStreams: Map<string, ActiveAudio> = new Map();
  private compressor: DynamicsCompressorNode | null = null;
  private isShuttingDown = false;
  
  // Audio settings
  private readonly NORMAL_VOLUME = 1.0;
  private readonly DUCKING_VOLUME = 0.3;
  private readonly FADE_DURATION = 0.1;
  private readonly MAX_CONCURRENT_STREAMS = 3;

  constructor() {
    console.log('Initializing AudioPlayer');
    try {
      this.initializeAudioContext();
      console.log('AudioPlayer initialized successfully');
    } catch (error) {
      console.error('Error initializing AudioPlayer:', error);
    }
  }

  private initializeAudioContext() {
    this.audioContext = new AudioContext();
    
    // Create and configure compressor for better audio dynamics
    this.compressor = this.audioContext.createDynamicsCompressor();
    this.compressor.threshold.value = -24;
    this.compressor.knee.value = 30;
    this.compressor.ratio.value = 12;
    this.compressor.attack.value = 0.003;
    this.compressor.release.value = 0.25;
    
    // Create main gain node
    this.mainGainNode = this.audioContext.createGain();
    this.mainGainNode.gain.value = this.NORMAL_VOLUME;
    
    // Connect the audio chain
    this.compressor.connect(this.mainGainNode);
    this.mainGainNode.connect(this.audioContext.destination);
  }

  public async playAudio(audioData: ArrayBuffer, speaker: StreamVideoParticipant): Promise<void> {
    if (this.isShuttingDown) {
      console.log('AudioPlayer is shutting down, skipping playback');
      return;
    }

    if (!this.audioContext || !this.mainGainNode || !this.compressor) {
      console.error('AudioPlayer not properly initialized');
      try {
        this.initializeAudioContext();
      } catch (error) {
        console.error('Failed to reinitialize AudioPlayer:', error);
        return;
      }
    }

    console.log('Playing audio for speaker:', speaker.name);
    console.log('Audio data size:', audioData.byteLength);

    try {
      // Resume AudioContext if it's suspended
      if (this.audioContext!.state === 'suspended') {
        console.log('Resuming AudioContext');
        await this.audioContext!.resume();
      }

      // Manage concurrent streams
      if (this.activeAudioStreams.size >= this.MAX_CONCURRENT_STREAMS) {
        console.log('Max concurrent streams reached, removing oldest stream');
        const oldestStream = Array.from(this.activeAudioStreams.entries())[0];
        if (oldestStream) {
          await this.fadeOutAndStop(oldestStream[1]);
          this.activeAudioStreams.delete(oldestStream[0]);
        }
      }

      // Decode the audio data
      const audioBuffer = await this.audioContext!.decodeAudioData(audioData);
      console.log('Audio decoded successfully. Duration:', audioBuffer.duration);

      return new Promise<void>((resolve) => {
        // Create audio nodes
        const source = this.audioContext!.createBufferSource();
        const gainNode = this.audioContext!.createGain();
        
        // Create filter for voice enhancement
        const filter = this.audioContext!.createBiquadFilter();
        filter.type = 'peaking';
        filter.frequency.value = 2500;
        filter.Q.value = 1;
        filter.gain.value = 3;

        // Set up audio buffer
        source.buffer = audioBuffer;

        // Connect the audio processing chain
        source.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(this.compressor!);

        // Setup gain envelope
        gainNode.gain.setValueAtTime(0, this.audioContext!.currentTime);
        gainNode.gain.linearRampToValueAtTime(
          this.NORMAL_VOLUME,
          this.audioContext!.currentTime + this.FADE_DURATION
        );

        // Duck other audio streams
        this.duckOtherStreams(speaker.sessionId);

        // Create and store active audio info
        const activeAudio: ActiveAudio = {
          source,
          gain: gainNode,
          startTime: this.audioContext!.currentTime,
        };

        // Remove any existing audio from this speaker
        const existingAudio = this.activeAudioStreams.get(speaker.sessionId);
        if (existingAudio) {
          this.fadeOutAndStop(existingAudio);
        }

        this.activeAudioStreams.set(speaker.sessionId, activeAudio);

        // Setup completion handling
        source.onended = () => {
          console.log('Audio playback ended for:', speaker.name);
          if (this.activeAudioStreams.get(speaker.sessionId) === activeAudio) {
            this.activeAudioStreams.delete(speaker.sessionId);
          }
          source.disconnect();
          gainNode.disconnect();
          filter.disconnect();
          this.restoreOtherStreams();
          resolve();
        };

        // Start playback
        console.log('Starting audio playback for:', speaker.name);
        source.start(0);
      });
    } catch (error) {
      console.error('Error playing audio:', error);
      throw error;
    }
  }

  private duckOtherStreams(currentSpeakerId: string) {
    this.activeAudioStreams.forEach((audio, speakerId) => {
      if (speakerId !== currentSpeakerId) {
        const currentTime = this.audioContext!.currentTime;
        audio.gain.gain.setValueAtTime(audio.gain.gain.value, currentTime);
        audio.gain.gain.linearRampToValueAtTime(
          this.DUCKING_VOLUME,
          currentTime + this.FADE_DURATION
        );
      }
    });
  }

  private restoreOtherStreams() {
    this.activeAudioStreams.forEach((audio) => {
      const currentTime = this.audioContext!.currentTime;
      audio.gain.gain.setValueAtTime(audio.gain.gain.value, currentTime);
      audio.gain.gain.linearRampToValueAtTime(
        this.NORMAL_VOLUME,
        currentTime + this.FADE_DURATION
      );
    });
  }

  private async fadeOutAndStop(audio: ActiveAudio): Promise<void> {
    return new Promise((resolve) => {
      const { source, gain } = audio;
      const currentTime = this.audioContext!.currentTime;
      
      gain.gain.setValueAtTime(gain.gain.value, currentTime);
      gain.gain.linearRampToValueAtTime(0, currentTime + this.FADE_DURATION);
      
      setTimeout(() => {
        try {
          source.stop();
        } catch (error) {
          // Ignore errors if source is already stopped
        }
        source.disconnect();
        gain.disconnect();
        resolve();
      }, this.FADE_DURATION * 1000);
    });
  }

  public setVolume(volume: number) {
    console.log('Setting main volume to:', volume);
    if (this.mainGainNode) {
      const clampedVolume = Math.max(0, Math.min(1, volume));
      const currentTime = this.audioContext!.currentTime;
      this.mainGainNode.gain.setValueAtTime(this.mainGainNode.gain.value, currentTime);
      this.mainGainNode.gain.linearRampToValueAtTime(
        clampedVolume,
        currentTime + this.FADE_DURATION
      );
    }
  }

  public async stop(): Promise<void> {
    console.log('Stopping AudioPlayer');
    this.isShuttingDown = true;

    try {
      // Fade out and stop all active streams
      const fadePromises = Array.from(this.activeAudioStreams.values()).map(audio => 
        this.fadeOutAndStop(audio)
      );

      // Wait for all fades to complete
      await Promise.all(fadePromises);

      // Clean up
      this.activeAudioStreams.clear();

      if (this.compressor) {
        this.compressor.disconnect();
        this.compressor = null;
      }

      if (this.mainGainNode) {
        this.mainGainNode.disconnect();
        this.mainGainNode = null;
      }

      if (this.audioContext) {
        await this.audioContext.close();
        this.audioContext = null;
      }

      console.log('AudioPlayer stopped successfully');
    } catch (error) {
      console.error('Error stopping AudioPlayer:', error);
    } finally {
      this.isShuttingDown = false;
    }
  }
}