'use client'

import React, { createContext, useContext, useState, useRef, useCallback, useEffect } from 'react'

interface DictationContextType {
  isListening: boolean
  transcript: string
  confidence: number
  isSupported: boolean
  enabled: boolean
  setEnabled: (value: boolean) => void
  startListening: () => void
  stopListening: () => void
  clearTranscript: () => void
  appendToTranscript: (text: string) => void
  error: string | null
}

const DictationContext = createContext<DictationContextType | undefined>(undefined)

interface DictationProviderProps {
  children: React.ReactNode
  language?: string
  continuous?: boolean
  interimResults?: boolean
}

export function DictationProvider({ 
  children, 
  language = 'en-ZA', // South African English
  continuous = true,
  interimResults = true 
}: DictationProviderProps) {
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [confidence, setConfidence] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [isSupported, setIsSupported] = useState(false)
  const [enabled, setEnabled] = useState(true)
  
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const finalTranscriptRef = useRef('')

  useEffect(() => {
    // Check if Speech Recognition is supported
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    
    if (SpeechRecognition) {
      setIsSupported(true)
      
      const recognition = new SpeechRecognition()
      recognition.continuous = continuous
      recognition.interimResults = interimResults
      recognition.lang = language
      recognition.maxAlternatives = 1

      recognition.onstart = () => {
        setIsListening(true)
        setError(null)
      }

      recognition.onresult = (event) => {
        let interimTranscript = ''
        let finalTranscript = finalTranscriptRef.current

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i]
          const transcriptPart = result[0].transcript

          if (result.isFinal) {
            finalTranscript += transcriptPart + ' '
            setConfidence(result[0].confidence)
          } else {
            interimTranscript += transcriptPart
          }
        }

        finalTranscriptRef.current = finalTranscript
        setTranscript(finalTranscript + interimTranscript)
      }

      recognition.onerror = (event) => {
        setError(`Speech recognition error: ${event.error}`)
        setIsListening(false)
        
        // Handle specific errors
        switch (event.error) {
          case 'no-speech':
            setError('No speech detected. Please try again.')
            break
          case 'audio-capture':
            setError('No microphone found. Please check your microphone.')
            break
          case 'not-allowed':
            setError('Microphone access denied. Please allow microphone access.')
            break
          case 'network':
            setError('Network error. Please check your internet connection.')
            break
          default:
            setError(`Speech recognition error: ${event.error}`)
        }
      }

      recognition.onend = () => {
        setIsListening(false)
      }

      recognitionRef.current = recognition
    } else {
      setIsSupported(false)
      setError('Speech recognition is not supported in this browser.')
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort()
      }
    }
  }, [language, continuous, interimResults])

  const startListening = useCallback(() => {
    if (!recognitionRef.current || !isSupported) {
      setError('Speech recognition is not available.')
      return
    }

    if (!enabled) {
      setError('Dictation is disabled.')
      return
    }

    try {
      setError(null)
      recognitionRef.current.start()
    } catch (err) {
      setError('Failed to start speech recognition.')
    }
  }, [isSupported, enabled])

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
    }
  }, [])

  const clearTranscript = useCallback(() => {
    setTranscript('')
    finalTranscriptRef.current = ''
    setConfidence(0)
    setError(null)
  }, [])

  const appendToTranscript = useCallback((text: string) => {
    const newTranscript = finalTranscriptRef.current + text + ' '
    finalTranscriptRef.current = newTranscript
    setTranscript(newTranscript)
  }, [])

  const value: DictationContextType = {
    isListening,
    transcript,
    confidence,
    isSupported,
    enabled,
    setEnabled,
    startListening,
    stopListening,
    clearTranscript,
    appendToTranscript,
    error
  }

  return (
    <DictationContext.Provider value={value}>
      {children}
    </DictationContext.Provider>
  )
}

export function useDictation() {
  const context = useContext(DictationContext)
  if (context === undefined) {
    throw new Error('useDictation must be used within a DictationProvider')
  }
  return context
}

// Type declarations for Speech Recognition API
declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition
    webkitSpeechRecognition: typeof SpeechRecognition
  }
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean
  grammars: SpeechGrammarList
  interimResults: boolean
  lang: string
  maxAlternatives: number
  serviceURI: string
  start(): void
  stop(): void
  abort(): void
  onaudiostart: ((this: SpeechRecognition, ev: Event) => any) | null
  onaudioend: ((this: SpeechRecognition, ev: Event) => any) | null
  onend: ((this: SpeechRecognition, ev: Event) => any) | null
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any) | null
  onnomatch: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null
  onsoundstart: ((this: SpeechRecognition, ev: Event) => any) | null
  onsoundend: ((this: SpeechRecognition, ev: Event) => any) | null
  onspeechstart: ((this: SpeechRecognition, ev: Event) => any) | null
  onspeechend: ((this: SpeechRecognition, ev: Event) => any) | null
  onstart: ((this: SpeechRecognition, ev: Event) => any) | null
}

declare var SpeechRecognition: {
  prototype: SpeechRecognition
  new(): SpeechRecognition
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string
  message: string
}

interface SpeechRecognitionEvent extends Event {
  resultIndex: number
  results: SpeechRecognitionResultList
}

interface SpeechRecognitionResultList {
  readonly length: number
  item(index: number): SpeechRecognitionResult
  [index: number]: SpeechRecognitionResult
}

interface SpeechRecognitionResult {
  readonly length: number
  item(index: number): SpeechRecognitionAlternative
  [index: number]: SpeechRecognitionAlternative
  isFinal: boolean
}

interface SpeechRecognitionAlternative {
  transcript: string
  confidence: number
}

interface SpeechGrammarList {
  readonly length: number
  item(index: number): SpeechGrammar
  [index: number]: SpeechGrammar
  addFromURI(src: string, weight?: number): void
  addFromString(string: string, weight?: number): void
}

interface SpeechGrammar {
  src: string
  weight: number
}