import itemInserido from '../assets/sounds/item_inserido.wav'
import itemDevolvido from '../assets/sounds/item_devolvido_final2.wav'

const arquivos = {
  emprestimo: itemInserido,
  devolucao: itemDevolvido,
}

// Mantém uma instância por som para evitar recriar o elemento de áudio
// a cada inclusão/devolução.
const audios = Object.fromEntries(
  Object.entries(arquivos).map(([tipo, caminho]) => {
    const audio = new Audio(caminho)
    audio.preload = 'auto'
    audio.volume = 0.5
    return [tipo, audio]
  })
)

export function tocarSom(tipo) {
  const audio = audios[tipo]

  if (!audio) {
    console.warn(`Som não encontrado: ${tipo}`)
    return
  }

  // Reinicia o áudio para permitir reproduções consecutivas.
  audio.pause()
  audio.currentTime = 0

  const reproducao = audio.play()

  if (reproducao && typeof reproducao.catch === 'function') {
    reproducao.catch(error => {
      console.error(`Erro ao reproduzir o som "${tipo}":`, error)
    })
  }
}
