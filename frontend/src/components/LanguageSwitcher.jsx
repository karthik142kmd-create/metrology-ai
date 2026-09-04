import React, { useState, useRef, useEffect } from 'react'
import { useLanguage } from '../context/LanguageContext'
import { Globe, ChevronDown, Check } from 'lucide-react'

export const languageOptions = [
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'hi', label: 'हिन्दी', flag: '🇮🇳' },
  { code: 'mr', label: 'मराठी', flag: '🇮🇳' },
  { code: 'ta', label: 'தமிழ்', flag: '🇮🇳' },
  { code: 'te', label: 'తెలుగు', flag: '🇮🇳' },
  { code: 'es', label: 'Español', flag: '🇪🇸' },
]

function LanguageSwitcher({ className = '' }) {
  const { lang, changeLanguage } = useLanguage()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef(null)

  const currentOption = languageOptions.find((opt) => opt.code === lang) || languageOptions[0]

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className={`relative inline-block text-left ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-slate-700/80 bg-slate-900 hover:bg-slate-800 text-xs font-medium text-slate-200 hover:text-white transition shadow-sm"
        aria-label="Select Language"
      >
        <Globe size={14} className="text-blue-400" />
        <span className="mr-0.5">{currentOption.flag}</span>
        <span className="hidden sm:inline">{currentOption.label}</span>
        <ChevronDown size={13} className="text-slate-400" />
      </button>

      {isOpen && (
        <div
          className="origin-top-right absolute right-0 mt-1.5 w-44 rounded-xl shadow-2xl bg-slate-900 border border-slate-800 py-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
          role="menu"
        >
          {languageOptions.map((opt) => (
            <button
              key={opt.code}
              onClick={() => {
                changeLanguage(opt.code)
                setIsOpen(false)
              }}
              className={`w-full text-left px-3.5 py-2 text-xs flex items-center justify-between hover:bg-slate-800 transition ${
                opt.code === lang ? 'bg-blue-600/20 text-blue-400 font-semibold' : 'text-slate-300 hover:text-white'
              }`}
              role="menuitem"
            >
              <div className="flex items-center space-x-2">
                <span>{opt.flag}</span>
                <span>{opt.label}</span>
              </div>
              {opt.code === lang && (
                <Check size={14} className="text-blue-400" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default LanguageSwitcher
