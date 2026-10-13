export const PAINEIS_IDS = {
    corretores: 'podium-elements',
    rankingCorretores: 'panel-ranking-corretores',
    top3Corretores: 'panel-top3-corretores',
    construtoras: 'panel-construtoras',
    horarios: 'panel-horarios'
};

export const PAINEIS_ORDEM = Object.keys(PAINEIS_IDS);

export function mostrarPainel(nomePainel) {
    Object.entries(PAINEIS_IDS).forEach(([nome, id]) => {
        const elemento = document.getElementById(id);
        if (elemento) elemento.classList.toggle('active', nome === nomePainel);
    });
}

export function proximoPainel(atual) {
    const indiceAtual = PAINEIS_ORDEM.indexOf(atual);
    const indice = indiceAtual < 0 ? 0 : (indiceAtual + 1) % PAINEIS_ORDEM.length;
    return PAINEIS_ORDEM[indice];
}
