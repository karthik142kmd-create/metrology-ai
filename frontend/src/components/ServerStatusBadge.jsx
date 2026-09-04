import React, { useState, useEffect } from 'react'
import { Server, Wifi, Cloud, Check, AlertCircle, RefreshCw, X, Radio } from 'lucide-react'
import { getApiBaseUrl, setApiBaseUrl, pingBackend } from '../services/api'

export default function ServerStatusBadge({ className = '' }) {
  const [isOpen, setIsOpen] = useState(false)
  const [currentUrl, setCurrentUrl] = useState('')
  const [customInput, setCustomInput] = useState('')
  const [status, setStatus] = useState('checking') // 'online' | 'offline' | 'checking'
  const [latency, setLatency] = useState(null)
  const [statusText, setStatusText] = useState('Checking connection...')
  const [testingCustom, setTestingCustom] = useState(false)

  // Presets
  const hostname = typeof window !== 'undefined' ? window.location.hostname : 'localhost'
  const isLan = /^(\d{1,3}\.){3}\d{1,3}$/.test(hostname) && hostname !== '127.0.0.1'

  const presets = [
    {
      id: 'cloud',
      name: 'Cloud Production (Render)',
      url: 'https://metrologyai-backend.onrender.com/api',
      icon: Cloud,
      desc: 'Accessible from any device, mobile data (4G/5G) or outside Wi-Fi'
    },
    {
      id: 'lan',
      name: isLan ? `Wi-Fi / LAN Device (${hostname})` : 'Wi-Fi / LAN Device (192.168.0.104)',
      url: isLan ? `http://${hostname}:8000/api` : 'http://192.168.0.104:8000/api',
      icon: Wifi,
      desc: 'Direct connection between phones and PC on the same Wi-Fi'
    },
    {
      id: 'relative',
      name: 'Same-Origin / Proxy (/api)',
      url: '/api',
      icon: Server,
      desc: 'Standard local development proxy via Vite'
    }
  ]

  const checkHealth = async (url) => {
    setStatus('checking')
    const res = await pingBackend(url)
    if (res.ok) {
      setStatus('online')
      setLatency(res.latency)
      setStatusText(`Online (${res.latency}ms)`)
    } else {
      setStatus('offline')
      setLatency(null)
      setStatusText('Offline / Standby (Demo active)')
    }
  }

  useEffect(() => {
    const active = getApiBaseUrl()
    setCurrentUrl(active)
    setCustomInput(active)
    checkHealth(active)
  }, [])

  const handleSelectPreset = async (presetUrl) => {
    const saved = setApiBaseUrl(presetUrl)
    setCurrentUrl(saved)
    setCustomInput(saved)
    await checkHealth(saved)
  }

  const handleApplyCustom = async (e) => {
    e.preventDefault()
    if (!customInput.trim()) return
    setTestingCustom(true)
    const saved = setApiBaseUrl(customInput.trim())
    setCurrentUrl(saved)
    await checkHealth(saved)
    setTestingCustom(false)
  }

  return (
    <>
      {/* Badge Button */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={`inline-flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition ${
          status === 'online'
            ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/60'
            : status === 'checking'
            ? 'bg-amber-950/60 border-amber-500/40 text-amber-300 hover:bg-amber-900/60'
            : 'bg-slate-900 border-slate-700/80 text-slate-300 hover:bg-slate-800'
        } ${className}`}
        title="Multi-Device Server Configuration"
      >
        <span
          className={`w-2 h-2 rounded-full ${
            status === 'online'
              ? 'bg-emerald-400 animate-pulse'
              : status === 'checking'
              ? 'bg-amber-400 animate-ping'
              : 'bg-slate-400'
          }`}
        />
        <Server size={13} className="opacity-70" />
        <span className="hidden md:inline font-mono text-[11px] truncate max-w-[130px]">
          {currentUrl.includes('onrender') ? 'Cloud API' : isLan ? `${hostname}:8000` : 'Backend'}
        </span>
        <span className="text-[10px] opacity-80">
          {status === 'online' ? '🟢' : '⚙️'}
        </span>
      </button>

      {/* Configuration Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative text-slate-100">
            {/* Close button */}
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
            >
              <X size={18} />
            </button>

            {/* Header */}
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
                <Server size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Multi-Device Backend Settings</h3>
                <p className="text-xs text-slate-400">
                  Switch between Cloud, Wi-Fi LAN, or custom server endpoint
                </p>
              </div>
            </div>

            {/* Current Status Box */}
            <div className="mb-5 p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
              <div className="space-y-0.5 min-w-0 pr-2">
                <div className="text-[11px] text-slate-400">Active Backend URL:</div>
                <div className="font-mono text-xs text-blue-400 truncate" title={currentUrl}>
                  {currentUrl || '/api'}
                </div>
              </div>
              <div className="flex items-center space-x-2 shrink-0">
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    status === 'online'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  }`}
                >
                  {statusText}
                </span>
                <button
                  type="button"
                  onClick={() => checkHealth(currentUrl)}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                  title="Test Connection"
                >
                  <RefreshCw size={13} className={status === 'checking' ? 'animate-spin' : ''} />
                </button>
              </div>
            </div>

            {/* Presets List */}
            <div className="space-y-2 mb-5">
              <div className="text-xs font-semibold text-slate-300">Choose Server Profile:</div>
              {presets.map((p) => {
                const isSelected = currentUrl === p.url || (p.id === 'relative' && currentUrl === '/api')
                const Icon = p.icon
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleSelectPreset(p.url)}
                    className={`w-full text-left p-3 rounded-xl border transition flex items-start justify-between ${
                      isSelected
                        ? 'bg-blue-600/15 border-blue-500/50 ring-1 ring-blue-500/30'
                        : 'bg-slate-950/60 border-slate-800/80 hover:bg-slate-800/50 text-slate-300'
                    }`}
                  >
                    <div className="flex items-start space-x-3 pr-2">
                      <div className={`p-2 rounded-lg mt-0.5 ${isSelected ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400'}`}>
                        <Icon size={16} />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white flex items-center space-x-1.5">
                          <span>{p.name}</span>
                          {isSelected && <span className="text-[10px] px-1.5 py-0.2 bg-blue-500/30 text-blue-300 rounded">Active</span>}
                        </div>
                        <div className="font-mono text-[11px] text-slate-400 mt-0.5 truncate max-w-[280px]">
                          {p.url}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-1">
                          {p.desc}
                        </div>
                      </div>
                    </div>
                    {isSelected && <Check size={16} className="text-blue-400 shrink-0 mt-1" />}
                  </button>
                )
              })}
            </div>

            {/* Custom URL Input */}
            <form onSubmit={handleApplyCustom} className="space-y-2 pt-3 border-t border-slate-800">
              <label className="block text-xs font-semibold text-slate-300">
                Or Enter Custom API Endpoint (e.g., ngrok / Railway / custom IP):
              </label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={customInput}
                  onChange={(e) => setCustomInput(e.target.value)}
                  placeholder="https://your-backend-host.com/api"
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-blue-500"
                />
                <button
                  type="submit"
                  disabled={testingCustom}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition shrink-0"
                >
                  {testingCustom ? 'Connecting...' : 'Set & Test'}
                </button>
              </div>
            </form>

            {/* Multi-Device Tip */}
            <div className="mt-4 p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 text-[11px] text-slate-400 flex items-start space-x-2">
              <span className="text-base leading-none">💡</span>
              <div>
                <strong>Testing from Phone / Tablet?</strong> Open{' '}
                <span className="font-mono text-indigo-300">http://192.168.0.104:5173</span> on your mobile browser (both devices must be connected to the same Wi-Fi).
              </div>
            </div>

            <div className="mt-5 text-right">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
