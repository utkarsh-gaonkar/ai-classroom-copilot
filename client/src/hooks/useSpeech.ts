import { useCallback, useEffect, useId, useState, useSyncExternalStore } from 'react'

export type SpeechStatus = 'idle' | 'playing' | 'paused' | 'error'

interface SpeechSnapshot {
	owner: string | null
	status: SpeechStatus
	section: number
	sectionCount: number
	sectionText: string
	message: string
}

interface ActiveSpeech {
	owner: string
	chunks: string[]
	index: number
	rate: number
	voice: SpeechSynthesisVoice | null
}

const initialSnapshot: SpeechSnapshot = {
	owner: null,
	status: 'idle',
	section: 0,
	sectionCount: 0,
	sectionText: '',
	message: '',
}

let snapshot = initialSnapshot
let activeSpeech: ActiveSpeech | null = null
const listeners = new Set<() => void>()

function publish(next: SpeechSnapshot) {
	snapshot = next
	listeners.forEach((listener) => listener())
}

function subscribe(listener: () => void) {
	listeners.add(listener)
	return () => listeners.delete(listener)
}

export function splitSpeechText(text: string, maxChunkLength = 220): string[] {
	if (maxChunkLength < 1) throw new RangeError('maxChunkLength must be positive')
	const chunks: string[] = []
	let start = 0

	while (start < text.length) {
		let end = Math.min(start + maxChunkLength, text.length)
		if (end < text.length) {
			const minimumBreak = start + Math.floor(maxChunkLength * 0.55)
			const paragraphBreak = text.lastIndexOf('\n', end)
			const sentenceBreaks = [...text.slice(minimumBreak, end).matchAll(/[.!?।؟](?:["'”’)]*)\s+/g)]
			const sentenceBreak = sentenceBreaks.length
				? minimumBreak + (sentenceBreaks[sentenceBreaks.length - 1].index ?? 0) + sentenceBreaks[sentenceBreaks.length - 1][0].length
				: -1
			if (paragraphBreak >= minimumBreak) end = paragraphBreak + 1
			else if (sentenceBreak >= minimumBreak) end = sentenceBreak
			else {
				const wordBreak = text.lastIndexOf(' ', end)
				end = wordBreak > start ? wordBreak + 1 : end
			}
		}
		chunks.push(text.slice(start, end))
		start = end
	}

	return chunks
}

function matchEnglishVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
	return voices.find((voice) => voice.lang.toLowerCase() === 'en')
		?? voices.find((voice) => voice.lang.toLowerCase().startsWith('en-'))
		?? null
}

function startSection(session: ActiveSpeech) {
	if (activeSpeech !== session) return
	if (session.index >= session.chunks.length) {
		activeSpeech = null
		publish({ ...initialSnapshot, owner: session.owner, message: 'Reading complete.' })
		return
	}

	const utterance = new SpeechSynthesisUtterance(session.chunks[session.index])
	utterance.lang = 'en-US'
	utterance.rate = session.rate
	if (session.voice) utterance.voice = session.voice
	const sectionIndex = session.index
	utterance.onstart = () => {
		if (activeSpeech === session && session.index === sectionIndex) {
			publish({ ...snapshot, owner: session.owner, status: 'playing', section: sectionIndex + 1, sectionCount: session.chunks.length, sectionText: session.chunks[sectionIndex] })
		}
	}
	utterance.onend = () => {
		if (activeSpeech !== session || session.index !== sectionIndex) return
		session.index += 1
		startSection(session)
	}
	utterance.onerror = (event) => {
		if (activeSpeech !== session || session.index !== sectionIndex) return
		if (event.error === 'canceled' || event.error === 'interrupted') return
		activeSpeech = null
		publish({ ...initialSnapshot, owner: session.owner, status: 'error', message: 'Speech playback stopped unexpectedly. Try playing this reading again.' })
	}
	window.speechSynthesis.speak(utterance)
}

function stopActiveSpeech(message = '', owner: string | null = null) {
	activeSpeech = null
	if (typeof window !== 'undefined' && 'speechSynthesis' in window) window.speechSynthesis.cancel()
	publish({ ...initialSnapshot, owner, message })
}

export function useSpeech() {
	const owner = useId()
	const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([])
	const sharedSnapshot = useSyncExternalStore(subscribe, () => snapshot, () => initialSnapshot)
	const isSupported = typeof window !== 'undefined' && 'speechSynthesis' in window && typeof SpeechSynthesisUtterance !== 'undefined'

	useEffect(() => {
		if (!isSupported) return
		const synthesis = window.speechSynthesis
		const refreshVoices = () => setVoices(synthesis.getVoices())
		refreshVoices()
		synthesis.addEventListener('voiceschanged', refreshVoices)
		return () => synthesis.removeEventListener('voiceschanged', refreshVoices)
	}, [isSupported])

	useEffect(() => () => {
		if (activeSpeech?.owner === owner) stopActiveSpeech()
	}, [owner])

	const speak = useCallback((text: string, rate: number, voiceURI: string) => {
		if (!isSupported) {
			publish({ ...initialSnapshot, status: 'error', message: 'Speech synthesis is not supported in this browser.' })
			return
		}
		if (!text.trim()) {
			publish({ ...initialSnapshot, owner, status: 'error', message: 'There is no text available to read.' })
			return
		}
		if (rate < 0.5 || rate > 2) {
			publish({ ...initialSnapshot, owner, status: 'error', message: 'Speech rate must be between 0.5x and 2x.' })
			return
		}

		const selectedVoice = (voiceURI ? voices.find((voice) => voice.voiceURI === voiceURI) : null) ?? matchEnglishVoice(voices)
		const defaultUsed = !selectedVoice
		stopActiveSpeech()
		const session: ActiveSpeech = { owner, chunks: splitSpeechText(text), index: 0, rate, voice: selectedVoice }
		activeSpeech = session
		publish({
			...initialSnapshot,
			owner,
			status: 'playing',
			sectionCount: session.chunks.length,
			message: defaultUsed ? 'No installed English voice was found. Using the browser\'s default voice.' : '',
		})
		startSection(session)
	}, [isSupported, owner, voices])

	const pause = useCallback(() => {
		if (!isSupported || activeSpeech?.owner !== owner || snapshot.status !== 'playing') return
		window.speechSynthesis.pause()
		if (window.speechSynthesis.paused) publish({ ...snapshot, status: 'paused' })
	}, [isSupported, owner])

	const resume = useCallback(() => {
		if (!isSupported || activeSpeech?.owner !== owner || snapshot.status !== 'paused') return
		window.speechSynthesis.resume()
		if (!window.speechSynthesis.paused) publish({ ...snapshot, status: 'playing' })
	}, [isSupported, owner])

	const stop = useCallback(() => {
		if (activeSpeech?.owner === owner) stopActiveSpeech('Reading stopped.', owner)
	}, [owner])

	const setRate = useCallback((rate: number) => {
		if (activeSpeech?.owner === owner) activeSpeech.rate = rate
	}, [owner])

	const ownsPlayback = sharedSnapshot.owner === owner
	return {
		voices,
		status: ownsPlayback ? sharedSnapshot.status : 'idle' as SpeechStatus,
		section: ownsPlayback ? sharedSnapshot.section : 0,
		sectionCount: ownsPlayback ? sharedSnapshot.sectionCount : 0,
		sectionText: ownsPlayback ? sharedSnapshot.sectionText : '',
		message: ownsPlayback ? sharedSnapshot.message : '',
		isSupported,
		speak,
		pause,
		resume,
		stop,
		setRate,
		preferredVoice: matchEnglishVoice(voices),
	}
}
