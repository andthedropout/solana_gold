import React, { useState, useEffect } from 'react'
import './App.css'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Layout } from '@/components/layout'
import Login from '@/pages/Login'
import SignUp from '@/pages/SignUp'
import Dashboard from '@/pages/Dashboard'
import Homepage from '@/pages/Homepage'
import { WalletContextProvider } from '@/components/WalletContextProvider'
import { useTheme } from '@/hooks/useTheme'

function App() {
  const [count, setCount] = useState(0)
  const [showContent, setShowContent] = useState(false)
  
  // Load and apply theme settings
  const { themeSettings, isLoading: themeLoading, error: themeError, fontsReady } = useTheme();

  // Generic loading transition - just handles loading fade out
  useEffect(() => {
    if (!themeLoading && fontsReady) {
      // Small delay to let loading fade complete before content appears
      const timer = setTimeout(() => {
        setShowContent(true);
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [themeLoading, fontsReady]);

  // Only animate the loading screen fade out
  const loadingVariants = {
    visible: { 
      opacity: 1, 
      scale: 1 
    },
    exit: { 
      opacity: 0, 
      scale: 0.95,
      transition: { 
        duration: 0.4,
        ease: "easeOut"
      }
    }
  };

  return (
    <AnimatePresence mode="wait">
      {(themeLoading || !fontsReady || !showContent) ? (
        <motion.div 
          key="loading"
          className="min-h-screen flex items-center justify-center" 
          style={{ 
            backgroundColor: (() => {
              const isDark = document.documentElement.classList.contains('dark');
              return themeSettings 
                ? (isDark ? themeSettings.css_vars.dark.background : themeSettings.css_vars.light.background)
                : 'oklch(0.9856 0.0084 56.3169)'; // fallback
            })()
          }}
          variants={loadingVariants}
          initial="visible"
          exit="exit"
        >
          <div className="relative">
            {/* Pulsing circles animation */}
            <div className="relative w-16 h-16">
              <div 
                className="absolute inset-0 rounded-full"
                style={{ 
                  backgroundColor: (() => {
                    const isDark = document.documentElement.classList.contains('dark');
                    return themeSettings 
                      ? (isDark ? themeSettings.css_vars.dark.primary : themeSettings.css_vars.light.primary)
                      : 'oklch(0.7357 0.1641 34.7091)'; // fallback primary
                  })(),
                  animation: 'theme-pulse-slow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
                }}
              ></div>
              <div 
                className="absolute inset-2 rounded-full"
                style={{ 
                  backgroundColor: (() => {
                    const isDark = document.documentElement.classList.contains('dark');
                    return themeSettings 
                      ? (isDark ? themeSettings.css_vars.dark.primary : themeSettings.css_vars.light.primary)
                      : 'oklch(0.7357 0.1641 34.7091)'; // fallback primary
                  })(),
                  opacity: 0.7,
                  animation: 'theme-pulse-medium 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite 0.2s'
                }}
              ></div>
              <div 
                className="absolute inset-4 rounded-full"
                style={{ 
                  backgroundColor: (() => {
                    const isDark = document.documentElement.classList.contains('dark');
                    return themeSettings 
                      ? (isDark ? themeSettings.css_vars.dark.primary : themeSettings.css_vars.light.primary)
                      : 'oklch(0.7357 0.1641 34.7091)'; // fallback primary
                  })(),
                  opacity: 0.4,
                  animation: 'theme-pulse-fast 1s cubic-bezier(0.4, 0, 0.6, 1) infinite 0.4s'
                }}
              ></div>
            </div>
          </div>
          {/* Create CSS keyframes dynamically */}
          <style>{`
            @keyframes theme-pulse-slow {
              0%, 100% { transform: scale(1); opacity: 0.3; }
              50% { transform: scale(1.1); opacity: 0.8; }
            }
            @keyframes theme-pulse-medium {
              0%, 100% { transform: scale(1); opacity: 0.5; }
              50% { transform: scale(1.2); opacity: 0.9; }
            }
            @keyframes theme-pulse-fast {
              0%, 100% { transform: scale(1); opacity: 0.7; }
              50% { transform: scale(1.3); opacity: 1; }
            }
          `}</style>
        </motion.div>
      ) : (
        // Content appears instantly - no animation
        // Individual components will handle their own entrance animations
        <div key="content">
          <WalletContextProvider>
            <BrowserRouter>
              <Layout>
                <Routes>
                  <Route path="/" element={<Homepage />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<SignUp />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                </Routes>
              </Layout>
            </BrowserRouter>
          </WalletContextProvider>
        </div>
      )}
    </AnimatePresence>
  )
}

export default App
