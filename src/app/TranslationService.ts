// src/app/TranslationService.ts

import { StreamVideoParticipant } from '@stream-io/video-react-sdk';
import { VoiceDetectionService } from './VoiceDetectionService';

export class TranslationService {
  private isActive = false;
  private participants = new Map<string, StreamVideoParticipant>();
  private localParticipantId: string | null = null;
  private isMuted = false;
  private processingChunk = false;
  private voiceDetector: VoiceDetectionService | null = null;

  constructor(
    private targetLanguage: string,
    private onTranslatedAudio: (translatedAudio: ArrayBuffer, speaker: StreamVideoParticipant) => void
  ) {
    console.log('TranslationService initialized with target language:', targetLanguage);
  }

  public async start(audioStream: MediaStream, localParticipantId: string, isMuted: boolean) {
    if (this.isActive) return;
    console.log('Starting TranslationService...');

    this.isActive = true;
    this.localParticipantId = localParticipantId;
    this.isMuted = isMuted;

    try {
      // Initialize voice detection with callbacks
      this.voiceDetector = new VoiceDetectionService({
        onSpeechStart: () => {
          console.log('Speech detected, starting processing...');
        },
        onSpeechEnd: async (audioData: Float32Array) => {
          if (!this.isActive) return;
          console.log('Speech ended, processing audio...');
          await this.processAudioData(audioData);
        },
        onMisfire: () => {
          console.log('Voice detection misfire');
        }
      });

      // Initialize the voice detector
      await this.voiceDetector.initialize(audioStream);

      if (!this.isMuted) {
        this.voiceDetector.start();
      }

      console.log('TranslationService started successfully');
    } catch (error) {
      console.error('Error starting TranslationService:', error);
      this.stop();
      throw error;
    }
  }

  private async processAudioData(audioData: Float32Array) {
    if (this.processingChunk) return;
    this.processingChunk = true;

    console.log('Processing audio data of length:', audioData.length);

    let speaker = Array.from(this.participants.values()).find(
      (p) => p.isSpeaking && p.sessionId !== this.localParticipantId
    );

    if (!speaker) {
      speaker = Array.from(this.participants.values()).find(
        (p) => p.sessionId !== this.localParticipantId
      );
    }

    if (!speaker) {
      console.log('No remote participants found');
      this.processingChunk = false;
      return;
    }

    try {
      // Convert Float32Array to WAV
      const wavData = this.encodeWAV(audioData);
      
      const formData = new FormData();
      formData.append('file', new Blob([wavData], { type: 'audio/wav' }), `input_${crypto.randomUUID()}.wav`);
      formData.append('tgt_lang', this.targetLanguage);
      formData.append('output_file', `output_${crypto.randomUUID()}.wav`);

      const serverUrl = `${process.env.NEXT_PUBLIC_TRANSLATION_SERVER_ADDRESS}/predict`;
      console.log('Translation request details:', {
        url: serverUrl,
        targetLanguage: this.targetLanguage,
        formDataKeys: Array.from(formData.keys()),
        audioSize: wavData.byteLength
      });

      console.log('Sending request to:', serverUrl);
      
      const response = await fetch(serverUrl, {
        method: 'POST',
        body: formData,
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', {
        type: response.headers.get('content-type'),
        length: response.headers.get('content-length')
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Translation failed: ${response.statusText}. Server response: ${errorText}`);
      }

      console.log('Translation request successful');
      const translatedAudioData = await response.arrayBuffer();
      console.log('Received translated audio of size:', translatedAudioData.byteLength);

      if (this.onTranslatedAudio && speaker) {
        console.log('Invoking audio playback callback');
        await new Promise<void>((resolve) => {
          this.onTranslatedAudio(translatedAudioData, speaker);
          setTimeout(resolve, 500);
        });
      }
    } catch (error) {
      console.error('Translation error:', error);
      if (error instanceof Error) {
        console.error('Error details:', error.message);
      }
    } finally {
      this.processingChunk = false;
    }
  }

  private encodeWAV(samples: Float32Array): ArrayBuffer {
    const buffer = new ArrayBuffer(44 + samples.length * 2);
    const view = new DataView(buffer);
    const sampleRate = 48000; // Standard sample rate

    // Write WAV header
    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };

    writeString(0, 'RIFF');
    view.setUint32(4, 36 + samples.length * 2, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeString(36, 'data');
    view.setUint32(40, samples.length * 2, true);

    // Write samples
    const offset = 44;
    for (let i = 0; i < samples.length; i++) {
      const sample = Math.max(-1, Math.min(1, samples[i]));
      view.setInt16(offset + i * 2, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
    }

    return buffer;
  }

  public updateParticipants(participants: StreamVideoParticipant[]) {
    this.participants.clear();
    for (const participant of participants) {
      this.participants.set(participant.sessionId, participant);
    }
    console.log('Updated participants:', participants.length);
  }

  public setMuted(muted: boolean) {
    console.log('Setting muted state:', muted);
    this.isMuted = muted;
    if (muted) {
      if (this.voiceDetector) {
        this.voiceDetector.stop();
      }
    } else if (this.voiceDetector && this.isActive) {
      this.voiceDetector.start();
    }
  }

  public stop() {
    console.log('Stopping TranslationService...');
    this.isActive = false;

    if (this.voiceDetector) {
      this.voiceDetector.cleanup();
      this.voiceDetector = null;
    }

    this.participants.clear();
    console.log('TranslationService stopped');
  }
}