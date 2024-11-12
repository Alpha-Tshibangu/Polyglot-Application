// src/app/VoiceDetectionService.ts

interface VoiceDetectionConfig {
    onSpeechStart?: () => void;
    onSpeechEnd?: (audioData: Float32Array) => void;
    onMisfire?: () => void;
  }
  
  export class VoiceDetectionService {
    private audioContext: AudioContext | null = null;
    private analyser: AnalyserNode | null = null;
    private sourceNode: MediaStreamAudioSourceNode | null = null;
    private isListening = false;
    private audioBuffer: Float32Array[] = [];
    private silenceTimer: NodeJS.Timeout | null = null;
  
    // Voice detection settings
    private readonly SPEECH_THRESHOLD = 0.01;
    private readonly SILENCE_DURATION = 500; // ms
    private readonly FFT_SIZE = 2048;
  
    constructor(private config: VoiceDetectionConfig) {}
  
    public async initialize(audioStream: MediaStream): Promise<void> {
      try {
        console.log('Initializing voice detection service...');
  
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        this.sourceNode = this.audioContext.createMediaStreamSource(audioStream);
        
        this.analyser = this.audioContext.createAnalyser();
        this.analyser.fftSize = this.FFT_SIZE;
        
        this.sourceNode.connect(this.analyser);
  
        console.log('Voice detection service initialized successfully');
      } catch (error) {
        console.error('Error initializing voice detection:', error);
        this.cleanup();
        throw error;
      }
    }
  
    public start(): void {
      if (!this.analyser) {
        throw new Error('Voice detection service not initialized');
      }
  
      this.isListening = true;
      this.startDetection();
      console.log('Voice detection started');
    }
  
    private startDetection(): void {
      if (!this.analyser) return;
  
      const bufferLength = this.analyser.frequencyBinCount;
      const dataArray = new Float32Array(bufferLength);
      let isSpeaking = false;
  
      const checkAudioLevel = () => {
        if (!this.isListening || !this.analyser) return;
  
        this.analyser.getFloatTimeDomainData(dataArray);
        const average = dataArray.reduce((sum, value) => sum + Math.abs(value), 0) / bufferLength;
  
        if (average > this.SPEECH_THRESHOLD) {
          if (!isSpeaking) {
            console.log('Speech started');
            isSpeaking = true;
            this.audioBuffer = [];
            if (this.silenceTimer) {
              clearTimeout(this.silenceTimer);
              this.silenceTimer = null;
            }
            this.config.onSpeechStart?.();
          }
          // Store the audio data
          this.audioBuffer.push(new Float32Array(dataArray));
        } else if (isSpeaking) {
          // Start silence timer if not already started
          if (!this.silenceTimer) {
            this.silenceTimer = setTimeout(() => {
              console.log('Speech ended');
              isSpeaking = false;
              this.silenceTimer = null;
              
              // Combine all audio buffers
              const totalLength = this.audioBuffer.reduce((sum, buf) => sum + buf.length, 0);
              const combinedBuffer = new Float32Array(totalLength);
              let offset = 0;
              this.audioBuffer.forEach(buffer => {
                combinedBuffer.set(buffer, offset);
                offset += buffer.length;
              });
              
              this.config.onSpeechEnd?.(combinedBuffer);
              this.audioBuffer = [];
            }, this.SILENCE_DURATION);
          }
        }
  
        if (this.isListening) {
          requestAnimationFrame(checkAudioLevel);
        }
      };
  
      checkAudioLevel();
    }
  
    public stop(): void {
      this.isListening = false;
      if (this.silenceTimer) {
        clearTimeout(this.silenceTimer);
        this.silenceTimer = null;
      }
      console.log('Voice detection stopped');
    }
  
    public cleanup(): void {
      console.log('Cleaning up voice detection service...');
      
      this.isListening = false;
      
      if (this.silenceTimer) {
        clearTimeout(this.silenceTimer);
        this.silenceTimer = null;
      }
  
      if (this.sourceNode) {
        this.sourceNode.disconnect();
        this.sourceNode = null;
      }
  
      if (this.analyser) {
        this.analyser.disconnect();
        this.analyser = null;
      }
  
      if (this.audioContext) {
        this.audioContext.close();
        this.audioContext = null;
      }
  
      this.audioBuffer = [];
      console.log('Voice detection service cleanup complete');
    }
  }