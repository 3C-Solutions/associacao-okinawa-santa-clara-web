// Notícias publicadas que o perfil pode ler
export function noticiasPara(dadosAplicacao, papel) {
  return dadosAplicacao.news
    .filter((quantidadeN) => quantidadeN.status === "Publicado")
    .filter((quantidadeN) => papel === "admin" || quantidadeN.audience !== "Diretoria")
    .sort((elementoA, elementoB) => elementoB.date.localeCompare(elementoA.date));
}
