declare interface SpeechRecognition extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start(): void;
  stop(): void;
  abort(): void;
  onaudiostart?: (event: Event) => void;
  onaudioend?: (event: Event) => void;
  onend?: (event: Event) => void;
  onerror?: (event: SpeechRecognitionErrorEvent) => void;
  onnomatch?: (event: SpeechRecognitionEvent) => void;
  onresult?: (event: SpeechRecognitionEvent) => void;
  onsoundstart?: (event: Event) => void;
  onsoundend?: (event: Event) => void;
  onspeechstart?: (event: Event) => void;
  onspeechend?: (event: Event) => void;
  onstart?: (event: Event) => void;
}

declare interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
}

declare interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

declare interface SpeechRecognitionResultList {
  length: number;
  [index: number]: SpeechRecognitionResult;
}

declare interface SpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  [index: number]: SpeechRecognitionAlternative;
}

declare interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

declare interface Window {
  SpeechRecognition: typeof SpeechRecognition;
  webkitSpeechRecognition: typeof SpeechRecognition;
}
