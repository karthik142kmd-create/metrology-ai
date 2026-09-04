import React, { useState } from 'react'
import { useLanguage } from '../context/LanguageContext'
import { Globe, ChevronDown } from 'lucide-react'

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

  const currentOption = languageOptions.find((opt) => opt.code === lang) || languageOptions[0]

  return (
    <div className={`relative inline-block text-left ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition shadow-sm"
        aria-label="Select Language"
      >
        <Globe size={16} className="text-blue-600" />
        <span className="mr-1">{currentOption.flag}</span>
        <span className="hidden sm:inline">{currentOption.label}</span>
        <ChevronDown size={14} className="text-gray-500" />
      </button>

      {isOpen && (
        <div
          className="origin-top-right absolute right-0 mt-2 w-44 rounded-xl shadow-xl bg-white ring-1 ring-black ring-opacity-5 divide-y divide-gray-100 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
          role="menu"
        >
          <div className="py-1">
            {languageOptions.map((opt) => (
              <button
                key={opt.code}
                onClick={() => {
                  changeLanguage(opt.code)
                  setIsOpen(false)
                }}
                className={`w-full text-left px-4 py-2.5 text-sm flex items-center justify-between hover:bg-blue-50 transition ${
                  opt.code === lang ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-gray-700'
                }`}
                role="menuitem"
              >
                <div className="flex items-center space-x-2">
                  <span>{opt.flag}</span>
                  <span>{opt.label}</span>
                </div>
                {opt.code === lang && (
                  <span className="text-xs px-1.5 py-0.5 rounded bg-blue-100 text-blue-800">
                    Active
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default LanguageSwitcher
