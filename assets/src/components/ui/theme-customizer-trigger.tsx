'use client'

import { useState } from 'react'
import { Palette } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ThemeCustomizer } from './theme-customizer'
import { useCMS } from '@/components/admin/CMSContext'

interface ThemeCustomizerTriggerProps {
  variant?: 'default' | 'outline' | 'ghost' | 'link' | 'destructive' | 'secondary'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  className?: string
}

export function ThemeCustomizerTrigger({ 
  variant = 'ghost', 
  size = 'icon',
  className = ''
}: ThemeCustomizerTriggerProps) {
  const [open, setOpen] = useState(false)
  const { onThemeEditorChange } = useCMS()

  const handleOpenChange = (newOpen: boolean) => {
    onThemeEditorChange(newOpen) // Notify CMS context of theme editor state
    setOpen(newOpen)
  }

  const trigger = (
    <Button
      variant={variant}
      size={size}
      className={className}
      title="Theme Editor"
    >
      <Palette className="h-4 w-4" />
      <span className="sr-only">Theme Editor</span>
    </Button>
  )

  return (
    <ThemeCustomizer 
      isVisible={true}
      open={open}
      onOpenChange={handleOpenChange}
      trigger={trigger}
    />
  )
} 