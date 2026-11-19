import { useEffect, useRef } from 'react'
import type { ArenaCast } from '../game/arenaMoves'
import sounds from './battleSounds.json'
import championsSounds from './champions-move-sounds.json'

type MoveCues = Record<string, { windup?: string; release?: string } | undefined>
const cues: MoveCues = sounds
const trainerCues: MoveCues = championsSounds

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
      const cue = cues[cast.moveId] ?? trainerCues[cast.moveId]
      if (!cue) continue
      const phase = cast.elapsedMs < cast.profile.startupMs ? 'windup' : 'release'
      next.set(cast.id, phase)
      if (previous.current.get(cast.id) === phase || (phase === 'release' && !previous.current.has(cast.id) && cast.resolved)) continue
      const file = cue[phase]
      if (!file) continue
      const sound = new Audio(new URL('battle/audio/' + encodeURIComponent(cues[cast.moveId] ? file + '.wav' : file), document.baseURI).href)
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
