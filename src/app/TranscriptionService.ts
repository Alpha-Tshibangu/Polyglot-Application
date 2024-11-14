import { 
  StreamVideoParticipant, 
  hasAudio, 
  Call, 
  StreamVideoEvent,
  CustomVideoEvent 
} from '@stream-io/video-react-sdk';

interface TranscriptionMessage {
  text: string;
  speakerId: string;
  speakerName: string;
  timestamp: number;
}

interface TranscriptionEventPayload {
  type: 'transcription';
  payload: TranscriptionMessage;
}

export class TranscriptionService {
  private ws: WebSocket | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private isActive = false;
  private participants = new Map<string, StreamVideoParticipant>();
  private onTranscriptionCallback: ((message: TranscriptionMessage) => void) | null = null;
  private localParticipantId: string | null = null;
  private isMuted = false;
  private unsubscribe: (() => void) | null = null;

  constructor(private language: string = 'en-US') {}

  public async start(
    audioStream: MediaStream, 
    localParticipantId: string,
    streamCall: Call,
    onTranscription: (message: TranscriptionMessage) => void
  ) {
    if (this.isActive) return;
    
    if (!MediaRecorder.isTypeSupported('audio/webm')) {
      throw new Error('Browser not supported: audio/webm not supported');
    }

    // Verify we have a valid call instance
    if (!streamCall || typeof streamCall.on !== 'function' || typeof streamCall.sendCustomEvent !== 'function') {
      throw new Error('Invalid Stream call instance provided');
    }

    this.isActive = true;
    this.onTranscriptionCallback = onTranscription;
    this.localParticipantId = localParticipantId;

    // Set up custom event listener
    const unsubscribe = streamCall.on('custom', (event: StreamVideoEvent) => {
      try {
        const customEvent = event as CustomVideoEvent;
        const eventData = customEvent.custom as TranscriptionEventPayload;

        if (eventData?.type === 'transcription' && 
            eventData.payload?.speakerId !== this.localParticipantId) {
          console.log('Received transcription from:', eventData.payload.speakerName);
          this.onTranscriptionCallback?.(eventData.payload);
        }
      } catch (error) {
        console.error('Error processing custom event:', error);
      }
    });

    this.unsubscribe = unsubscribe;
    
    try {
      await this.setupWebSocket(streamCall);
      this.setupMediaRecorder(audioStream);
    } catch (error) {
      this.unsubscribe?.();
      console.error('Failed to start transcription:', error);
      this.stop();
      throw error;
    }
  }

  private setupMediaRecorder(stream: MediaStream) {
    this.mediaRecorder = new MediaRecorder(stream, {
      mimeType: 'audio/webm'
    });

    this.mediaRecorder.addEventListener('dataavailable', async (event) => {
      if (event.data.size > 0 && 
          this.ws?.readyState === WebSocket.OPEN && 
          !this.isMuted) {
        this.ws.send(event.data);
      }
    });

    this.mediaRecorder.start(1000);
  }

  private async setupWebSocket(streamCall: Call): Promise<void> {
    const DEEPGRAM_API_KEY = process.env.NEXT_PUBLIC_DEEPGRAM_API_KEY;
    if (!DEEPGRAM_API_KEY) {
      throw new Error('Deepgram API key is not configured');
    }

    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(
        `wss://api.deepgram.com/v1/listen?smart_format=true&model=nova-2&language=${this.language}&punctuate=true`,
        ['token', DEEPGRAM_API_KEY]
      );

      this.ws.onopen = () => {
        console.log('Deepgram WebSocket connected');
        resolve();
      };

      this.ws.onmessage = async (message) => {
        try {
          const received = JSON.parse(message.data);
          const transcript = received.channel.alternatives[0].transcript;
          
          if (transcript && received.is_final && !this.isMuted) {
            const transcriptionMessage: TranscriptionMessage = {
              text: transcript,
              speakerId: this.localParticipantId || '',
              speakerName: this.participants.get(this.localParticipantId || '')?.name || 'Unknown',
              timestamp: Date.now()
            };

            try {
              // Send to other participants
              await streamCall.sendCustomEvent({
                type: 'transcription',
                payload: transcriptionMessage
              });

              // Process locally
              this.onTranscriptionCallback?.(transcriptionMessage);
            } catch (error) {
              console.error('Error sending custom event:', error);
            }
          }
        } catch (error) {
          console.error('Error processing transcription:', error);
        }
      };

      this.ws.onerror = (error) => {
        console.error('Deepgram WebSocket Error:', error);
        reject(error);
      };

      this.ws.onclose = () => {
        console.log('Deepgram WebSocket closed');
        this.isActive = false;
      };
    });
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
  }

  public updateParticipants(participants: StreamVideoParticipant[]) {
    this.participants.clear();
    for (const participant of participants) {
      if (!hasAudio(participant)) continue;     
      this.participants.set(participant.sessionId, participant);
    }
  }

  public stop() {
    this.isActive = false;
    
    if (this.mediaRecorder?.state !== 'inactive') {
      this.mediaRecorder?.stop();
    }
    this.mediaRecorder = null;

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }

    this.participants.clear();
    this.onTranscriptionCallback = null;
  }
}