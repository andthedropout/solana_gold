'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Badge } from '@/components/ui/badge'
import { themeApi } from '@/api/themes'

interface MentionTextareaProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  id?: string
}

interface ThemeSuggestion {
  name: string
  display_name: string
}

export function MentionTextarea({ 
  value, 
  onChange, 
  placeholder, 
  disabled, 
  className = '',
  id 
}: MentionTextareaProps) {
  const [suggestions, setSuggestions] = useState<ThemeSuggestion[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [activeSuggestion, setActiveSuggestion] = useState(-1)
  const [mentionQuery, setMentionQuery] = useState('')
  const [mentionStart, setMentionStart] = useState(-1)
  const [availableThemes, setAvailableThemes] = useState<ThemeSuggestion[]>([])
  
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const hiddenRef = useRef<HTMLDivElement>(null)

  // Load available themes on mount
  useEffect(() => {
    const loadThemes = async () => {
      try {
        const themeList = await themeApi.getThemes()
        const themes = [
          { name: 'current', display_name: 'Current Theme' },
          ...themeList.results.map(t => ({ name: t.name, display_name: t.display_name }))
        ]
        setAvailableThemes(themes)
      } catch (error) {
        console.error('Failed to load themes:', error)
      }
    }
    loadThemes()
  }, [])

  // Parse mentions from text
  const parseMentions = useCallback((text: string) => {
    const mentionRegex = /@([\w-]+)/g
    const mentions = []
    let match
    
    while ((match = mentionRegex.exec(text)) !== null) {
      mentions.push({
        mention: match[1],
        start: match.index,
        end: match.index + match[0].length,
        fullMatch: match[0]
      })
    }
    
    return mentions
  }, [])

  // Get current cursor position
  const getCursorPosition = () => {
    if (!textareaRef.current) return 0
    return textareaRef.current.selectionStart || 0
  }

  // Handle input changes
  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value
    const cursorPos = getCursorPosition()
    
    onChange(newValue)

    // Check if we're typing after an @
    const beforeCursor = newValue.slice(0, cursorPos)
    const atMatch = beforeCursor.match(/@(\w*)$/)
    
    if (atMatch) {
      const query = atMatch[1]
      const start = cursorPos - atMatch[0].length
      
      setMentionQuery(query)
      setMentionStart(start)
      setShowSuggestions(true)
      setActiveSuggestion(-1)
      
      // Filter suggestions
      const filtered = availableThemes.filter(theme => 
        theme.name.toLowerCase().includes(query.toLowerCase()) ||
        theme.display_name.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 5)
      
      setSuggestions(filtered)
    } else {
      setShowSuggestions(false)
      setMentionQuery('')
      setMentionStart(-1)
    }
  }

  // Handle key navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setActiveSuggestion(prev => 
          prev < suggestions.length - 1 ? prev + 1 : 0
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setActiveSuggestion(prev => 
          prev > 0 ? prev - 1 : suggestions.length - 1
        )
        break
      case 'Enter':
      case 'Tab':
        e.preventDefault()
        if (activeSuggestion >= 0) {
          insertMention(suggestions[activeSuggestion])
        }
        break
      case 'Escape':
        setShowSuggestions(false)
        break
    }
  }

  // Insert selected mention
  const insertMention = (theme: ThemeSuggestion) => {
    if (!textareaRef.current) return

    const cursorPos = getCursorPosition()
    const beforeMention = value.slice(0, mentionStart)
    const afterCursor = value.slice(cursorPos)
    const newValue = `${beforeMention}@${theme.name} ${afterCursor}`
    
    onChange(newValue)
    setShowSuggestions(false)
    
    // Set cursor position after the mention
    setTimeout(() => {
      if (textareaRef.current) {
        const newPos = mentionStart + theme.name.length + 2 // +2 for @ and space
        textareaRef.current.setSelectionRange(newPos, newPos)
        textareaRef.current.focus()
      }
    }, 0)
  }

  // Create highlighted content for overlay
  const createHighlightedContent = () => {
    const mentions = parseMentions(value)
    if (mentions.length === 0) return value

    let result = ''
    let lastIndex = 0

    mentions.forEach(mention => {
      // Add text before mention
      result += value.slice(lastIndex, mention.start)
      
      // Check if this mention exists in our themes
      const isValidMention = availableThemes.some(theme => 
        theme.name === mention.mention
      )
      
      // Add highlighted mention
      result += `<span class="mention ${isValidMention ? 'mention-valid' : 'mention-invalid'}">${mention.fullMatch}</span>`
      
      lastIndex = mention.end
    })

    // Add remaining text
    result += value.slice(lastIndex)
    
    return result
  }

  return (
    <div className="relative">
      <div className="relative">
        {/* Hidden div for highlight overlay */}
        <div 
          ref={hiddenRef}
          className={`absolute inset-0 p-3 text-transparent pointer-events-none whitespace-pre-wrap break-words overflow-hidden ${className}`}
          style={{
            font: textareaRef.current?.style.font,
            lineHeight: textareaRef.current?.style.lineHeight,
            letterSpacing: textareaRef.current?.style.letterSpacing
          }}
          dangerouslySetInnerHTML={{ 
            __html: createHighlightedContent().replace(/\n/g, '<br/>') 
          }}
        />
        
        {/* Actual textarea */}
        <textarea
          ref={textareaRef}
          id={id}
          value={value}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className={`relative bg-transparent resize-none border border-input rounded-md focus:outline-none p-3 ${className}`}
          style={{ color: 'inherit' }}
        />
      </div>

      {/* Suggestions dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute top-full left-0 mt-1 w-full max-w-sm bg-background border border-border rounded-md shadow-md z-50">
          <div className="max-h-40 overflow-y-auto py-1">
            {suggestions.map((theme, index) => (
              <div
                key={theme.name}
                className={`px-3 py-1.5 cursor-pointer flex items-center gap-2 transition-colors ${
                  index === activeSuggestion 
                    ? 'bg-accent text-accent-foreground' 
                    : 'hover:bg-muted'
                }`}
                onClick={() => insertMention(theme)}
              >
                <span className="text-xs font-mono text-primary bg-primary/10 px-1.5 py-0.5 rounded text-nowrap">
                  @{theme.name}
                </span>
                <span className="text-sm truncate">{theme.display_name}</span>
                {theme.name === 'current' && (
                  <Badge variant="secondary" className="text-xs shrink-0 ml-auto">
                    Current
                  </Badge>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Global CSS for mention highlighting */}
      <style>{`
        .mention {
          background-color: hsl(var(--primary) / 0.12);
          color: hsl(var(--primary));
          border-radius: 6px;
          padding: 2px 6px;
          font-weight: 600;
          font-size: 0.875rem;
          border: 1px solid hsl(var(--primary) / 0.2);
          transition: all 0.15s ease;
        }
        
        .mention-valid {
          background-color: hsl(var(--primary) / 0.15);
          color: hsl(var(--primary));
          border-color: hsl(var(--primary) / 0.3);
        }
        
        .mention-invalid {
          background-color: hsl(var(--destructive) / 0.12);
          color: hsl(var(--destructive));
          border: 1px solid hsl(var(--destructive) / 0.3);
        }
        
        .mention:hover {
          background-color: hsl(var(--primary) / 0.2);
        }
      `}</style>
    </div>
  )
} 