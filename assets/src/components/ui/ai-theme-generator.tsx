'use client'

import { useState } from 'react'
import { Bot, Sparkles, Loader2 } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { themeApi } from '@/api/themes'
import { MentionTextarea } from '@/components/ui/mention-textarea'

interface AIThemeGeneratorProps {
  trigger?: React.ReactNode
  onThemeGenerated?: (theme: any) => void
}



export function AIThemeGenerator({ trigger, onThemeGenerated }: AIThemeGeneratorProps) {
  const [open, setOpen] = useState(false)
  const [prompt, setPrompt] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const { toast } = useToast()



  // Parse @ mentions from user prompt
  const parseThemeMentions = (text: string): string[] => {
    const mentions = text.match(/@[\w-]+/g) || []
    return mentions.map(mention => mention.substring(1)) // Remove @ symbol
  }



  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast({
        title: "Prompt Required",
        description: "Please describe the theme you want to generate.",
        variant: "destructive",
      })
      return
    }

    setIsGenerating(true)
    
    // Create loading toast that persists
    const loadingToast = toast({
      title: "🤖 Generating Theme...",
      description: "AI is creating your custom theme. This may take a moment.",
      duration: Infinity, // Don't auto-dismiss
    })
    
    try {

      // Parse @ mentions for theme references
      const themeMentions = parseThemeMentions(prompt)
      console.log('Frontend parsed mentions:', themeMentions)
      console.log('Sending prompt:', prompt.trim())

      const generatedTheme = await themeApi.generateTheme(prompt.trim(), themeMentions)
      
      // Dismiss the loading toast
      loadingToast.dismiss()
      
      // Call callback to select the new theme in the theme customizer
      if (onThemeGenerated) {
        onThemeGenerated(generatedTheme)
      }

      // Show success after the theme is loaded
      toast({
        title: "✨ Theme Generated!",
        description: `"${generatedTheme.display_name}" has been added to your themes and is now selected for preview.`,
      })

      // Close modal and reset
      setOpen(false)
      setPrompt('')
      
    } catch (error) {
      console.error('Theme generation failed:', error)
      
      // Dismiss the loading toast
      loadingToast.dismiss()
      
      toast({
        title: "❌ Generation Failed",
        description: "Failed to generate theme. Please try again or rephrase your prompt.",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const defaultTrigger = (
    <Button 
      variant="outline" 
      className="flex items-center gap-2"
      disabled={isGenerating}
    >
      <Sparkles className="h-4 w-4" />
      Generate with AI
    </Button>
  )

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-primary" />
            Generate Theme with AI
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Main prompt input */}
          <div className="space-y-2">
            <Label htmlFor="theme-prompt">
              Describe your ideal theme
            </Label>
            <MentionTextarea
              id="theme-prompt"
              placeholder="Ex: dark cyberpunk theme with neon green accents"
              value={prompt}
              onChange={setPrompt}
              className="w-full min-h-[120px] text-sm"
              disabled={isGenerating}
            />
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>
                <strong>TIP:</strong> Reference existing themes
              </p>
              <ul className="ml-4 space-y-1 list-disc">
                <li>"Create a lighter version of @current theme"</li>
                <li>"Make @starry-night more vibrant"</li>
              </ul>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex justify-end gap-2 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isGenerating}
              >
                Cancel
              </Button>
              <Button
                onClick={handleGenerate}
                disabled={!prompt.trim() || isGenerating}
                className="flex items-center gap-2"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Generate Theme
                  </>
                )}
              </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 