import { useEffect, useRef } from 'react'
import type { ArenaCast } from '../game/arenaMoves'
import sounds from './battleSounds.json'

const cues: Record<string, { windup?: string; release: string }> = sounds

export function useMoveSounds(casts: ArenaCast[], enabled: boolean, playing: boolean) {
  const previous = useRef(new Map<number, string>())
  const voices = useRef(new Set<HTMLAudioElement>())
  useEffect(() => {
    if (!playing || !enabled) {
      for (const sound of voices.current) sound.pause()
      voices.current.clear()
      return
    }
    const next = new Map<number, string>()
    for (const cast of casts) {
      const cue = cues[cast.moveId]
      if (!cue) continue
      const phase = cast.elapsedMs < cast.profile.startupMs ? 'windup' : 'release'
      next.set(cast.id, phase)
      if (previous.current.get(cast.id) === phase || (phase === 'release' && !previous.current.has(cast.id) && cast.resolved)) continue
      const file = cue[phase]
      if (!file) continue
      const sound = new Audio(new URL('battle/audio/' + file + '.wav', document.baseURI).href)
      sound.volume = .35
      voices.current.add(sound)
      const release = () => { voices.current.delete(sound) }
      sound.onended = release
      sound.onerror = release
      void sound.play().catch(release)
    }
    previous.current = next
  }, [casts, enabled, playing])

  useEffect(() => () => {
    for (const sound of voices.current) sound.pause()
    voices.current.clear()
  }, [])
}
