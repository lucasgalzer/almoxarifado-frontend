import itemInserido from '../assets/sounds/item_inserido.wav'
import itemDevolvido from '../assets/sounds/item_devolvido_final2.wav'

const sons = {
  emprestimo: itemInserido,
  devolucao: itemDevolvido
}

export function tocarSom(tipo) {
  const caminho = sons[tipo]

  if (!caminho) {
    console.warn(`Som não encontrado: ${tipo}`)
    return
  }

  const audio = new Audio(caminho)
  audio.volume = 0.5

  audio.play()
    .then(() => {
      console.log(`Som reproduzido: ${tipo}`)
    })
    .catch(error => {
      console.error('Erro ao reproduzir som:', error)
    })
}