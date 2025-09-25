import { useState, useEffect } from 'react'

interface CMSPermissions {
  canEdit: boolean
  canPublish: boolean
  canManageSettings: boolean
}

export const useCMSPermissions = () => {
  const [permissions, setPermissions] = useState<CMSPermissions>({
    canEdit: false,
    canPublish: false,
    canManageSettings: false
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // For development, always allow editing
    if (process.env.NODE_ENV === 'development') {
      setPermissions({
        canEdit: true,
        canPublish: true,
        canManageSettings: true
      })
      setLoading(false)
      return
    }

    // In production, check user permissions via API
    const checkPermissions = async () => {
      try {
        // This would be replaced with actual permission checking
        // For now, we'll check if user is logged in and has admin role
        const response = await fetch('/api/v1/auth/permissions/')
        if (response.ok) {
          const data = await response.json()
          setPermissions({
            canEdit: data.is_staff || data.is_superuser,
            canPublish: data.is_staff || data.is_superuser,
            canManageSettings: data.is_superuser
          })
        }
      } catch (error) {
        // Fail safe - no permissions if there's an error
        setPermissions({
          canEdit: false,
          canPublish: false,
          canManageSettings: false
        })
      } finally {
        setLoading(false)
      }
    }

    checkPermissions()
  }, [])

  return { permissions, loading }
} 