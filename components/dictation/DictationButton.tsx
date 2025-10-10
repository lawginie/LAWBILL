'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Mic, MicOff, Square, AlertCircle, Volume2 } from 'lucide-react'
import { useDictation } from './DictationProvider'
import { cn } from '@/lib/utils'

interface DictationButtonProps {
  onTranscriptChange?: (transcript: string) => void
  onFinalTranscript?: (transcript: string) => void
  className?: string
  size?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'outline' | 'ghost'
  showTranscript?: boolean
  autoInsert?: boolean
  targetInputId?: string
}

export function DictationButton({
  onTranscriptChange,
  onFinalTranscript,
  className,
  size = 'md',
  variant = 'default',
  showTranscript = true,
  autoInsert = false,
  targetInputId
}: DictationButtonProps) {
  const {
    isListening,
    transcript,
    confidence,
    isSupported,
    startListening,
    stopListening,
    clearTranscript,
    error
  } = useDictation()

  const [previousTranscript, setPreviousTranscript] = useState('')
  const [isAnimating, setIsAnimating] = useState(false)

  // Handle transcript changes
  useEffect(() => {
    if (transcript !== previousTranscript) {
      onTranscriptChange?.(transcript)
      
      // Auto-insert into target input if specified
      if (autoInsert && targetInputId) {
        const targetElement = document.getElementById(targetInputId) as HTMLInputElement | HTMLTextAreaElement
        if (targetElement) {
          targetElement.value = transcript
          targetElement.dispatchEvent(new Event('input', { bubbles: true }))
        }
      }
      
      setPreviousTranscript(transcript)
    }
  }, [transcript, previousTranscript, onTranscriptChange, autoInsert, targetInputId])

  // Handle final transcript
  useEffect(() => {
    if (!isListening && transcript && transcript !== previousTranscript) {
      onFinalTranscript?.(transcript)
    }
  }, [isListening, transcript, previousTranscript, onFinalTranscript])

  // Animation effect when listening
  useEffect(() => {
    if (isListening) {
      setIsAnimating(true)
      const interval = setInterval(() => {
        setIsAnimating(prev => !prev)
      }, 1000)
      return () => clearInterval(interval)
    } else {
      setIsAnimating(false)
    }
  }, [isListening])

  const handleToggleListening = () => {
    if (isListening) {
      stopListening()
    } else {
      clearTranscript()
      startListening()
    }
  }

  const getButtonIcon = () => {
    if (!isSupported) return <AlertCircle className="h-4 w-4" />
    if (isListening) return <Square className="h-4 w-4" />
    return <Mic className="h-4 w-4" />
  }

  const getButtonText = () => {
    if (!isSupported) return 'Not Supported'
    if (isListening) return 'Stop'
    return 'Dictate'
  }

  const getButtonVariant = () => {
    if (!isSupported) return 'outline'
    if (isListening) return 'destructive'
    return variant
  }

  const sizeClasses = {
    sm: 'h-8 px-3 text-xs',
    md: 'h-10 px-4 text-sm',
    lg: 'h-12 px-6 text-base'
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Button
          onClick={handleToggleListening}
          disabled={!isSupported}
          variant={getButtonVariant() as any}
          className={cn(
            sizeClasses[size],
            isListening && isAnimating && 'animate-pulse',
            className
          )}
        >
          {getButtonIcon()}
          <span className="ml-2">{getButtonText()}</span>
        </Button>

        {isListening && (
          <div className="flex items-center gap-1">
            <Volume2 className="h-4 w-4 text-green-500 animate-pulse" />
            <Badge variant="secondary" className="animate-pulse">
              Listening...
            </Badge>
          </div>
        )}

        {confidence > 0 && (
          <Badge variant="outline">
            {Math.round(confidence * 100)}% confident
          </Badge>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 text-sm text-red-600">
          <AlertCircle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      )}

      {showTranscript && transcript && (
        <div className="space-y-2">
          <div className="text-sm font-medium text-gray-700">
            Transcript:
          </div>
          <div className="p-3 bg-gray-50 rounded-md border text-sm">
            {transcript || 'No speech detected yet...'}
          </div>
          {transcript && (
            <Button
              onClick={clearTranscript}
              variant="outline"
              size="sm"
              className="text-xs"
            >
              Clear Transcript
            </Button>
          )}
        </div>
      )}
    </div>
  )
}

// Specialized dictation button for specific use cases
export function DictationTextArea({
  value,
  onChange,
  placeholder = "Start typing or click dictate to use voice input...",
  className,
  ...props
}: {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  [key: string]: any
}) {
  const textareaId = `dictation-textarea-${Math.random().toString(36).substr(2, 9)}`

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-700">
          Description
        </label>
        <DictationButton
          size="sm"
          variant="outline"
          showTranscript={false}
          autoInsert={true}
          targetInputId={textareaId}
          onFinalTranscript={onChange}
        />
      </div>
      <textarea
        id={textareaId}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn(
          "min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        {...props}
      />
    </div>
  )
}

// Quick dictation for single-line inputs
export function DictationInput({
  value,
  onChange,
  placeholder = "Type or dictate...",
  className,
  ...props
}: {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  [key: string]: any
}) {
  const inputId = `dictation-input-${Math.random().toString(36).substr(2, 9)}`

  return (
    <div className="flex items-center gap-2">
      <input
        id={inputId}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        {...props}
      />
      <DictationButton
        size="sm"
        variant="outline"
        showTranscript={false}
        autoInsert={true}
        targetInputId={inputId}
        onFinalTranscript={onChange}
        className="shrink-0"
      />
    </div>
  )
}