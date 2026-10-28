// Notícias publicadas que o perfil pode ler
export function newsFor(state, role) {
  return state.news
    .filter((n) => n.status === "Publicado")
    .filter((n) => role === "admin" || n.audience !== "Diretoria")
    .sort((a, b) => b.date.localeCompare(a.date));
}
