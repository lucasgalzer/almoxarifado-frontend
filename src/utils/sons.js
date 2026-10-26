// Sons curtos usados nos fluxos de leitura e empréstimo.
let audioContext

export function tocarSom(tipo = 'emprestimo') {
  if (typeof window === 'undefined') return

  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext
    if (!AudioContextClass) return

    if (!audioContext) audioContext = new AudioContextClass()
    if (audioContext.state === 'suspended') {
      audioContext.resume().catch(() => {})
    }

    const agora = audioContext.currentTime
    const erro = tipo === 'erro'
    const oscillator = audioContext.createOscillator()
    const gain = audioContext.createGain()

    oscillator.type = 'sine'
    oscillator.frequency.setValueAtTime(erro ? 220 : 880, agora)
    if (!erro) oscillator.frequency.setValueAtTime(1174.66, agora + 0.075)

    gain.gain.setValueAtTime(0.0001, agora)
    gain.gain.exponentialRampToValueAtTime(0.18, agora + 0.01)
    gain.gain.exponentialRampToValueAtTime(0.0001, agora + (erro ? 0.18 : 0.16))

    oscillator.connect(gain)
    gain.connect(audioContext.destination)
    oscillator.start(agora)
    oscillator.stop(agora + (erro ? 0.19 : 0.17))
  } catch (error) {
    // Falha de áudio não deve impedir o registro do empréstimo.
    console.warn('Não foi possível reproduzir o som:', error)
  }
}
