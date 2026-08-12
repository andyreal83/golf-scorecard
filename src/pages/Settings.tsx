import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchSettings, saveSettings } from '../lib/settings'
import './Settings.css'

export default function Settings() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [handicap, setHandicap] = useState('')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    fetchSettings().then((s) => {
      if (s) {
        setName(s.name)
        setHandicap(String(s.handicap))
      }
    })
  }, [])

  async function handleSave() {
    await saveSettings({ name: name.trim(), handicap: Number(handicap) || 0 })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="screen">
      <div className="settings__header">
        <h1>Settings</h1>
        <button type="button" className="button button--secondary" onClick={() => navigate('/')}>
          Back
        </button>
      </div>

      <label className="settings__field">
        <span>Your Name</span>
        <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
      </label>

      <label className="settings__field">
        <span>Your Handicap</span>
        <input
          type="number"
          inputMode="decimal"
          value={handicap}
          onChange={(e) => setHandicap(e.target.value)}
          placeholder="Handicap"
        />
      </label>

      <p className="settings__hint">Used to prefill you as Player 1 whenever you start a new round.</p>

      <button type="button" className="button button--primary button--block" onClick={handleSave}>
        {saved ? 'Saved' : 'Save'}
      </button>

      <button type="button" className="button button--secondary button--block" onClick={() => navigate('/courses')}>
        Manage Saved Courses
      </button>
    </div>
  )
}
