/* =============================================================================
   RANKING VENDEDOR DO MÊS — LÓGICA (JS)
   =============================================================================
   Índice (nesta ordem no arquivo):
     1.  Configuração (URLs das planilhas, Supabase, helpers de DOM)
     2.  Renderização — Top 3 (pódio)
     3.  Responsividade (escala da tela)
     4.  Congelamento (freeze) — função central de aplicação de estado
     5.  Rodízio de painéis (5 telas)
     6.  INICIALIZAÇÃO 1 — escala inicial da tela
     7.  Congelamento (freeze) — funções de estado/persistência
     8.  INICIALIZAÇÃO 2 — estado de congelamento salvo
     9.  Realtime (Supabase) — canal e eventos remotos
     10. Atalhos de teclado
     11. CSV — parsing genérico
     12. CSV — extração de listas (corretores / construtoras / avisos)
     13. Ranking — renderização genérica (colunas, ordenação, etc.)
     14. Ranking — agregação (soma por nome)
     15. Ranking — exibição (construtoras e corretores)
     16. Carregamento principal de dados (fetch das 4 planilhas)
     17. INICIALIZAÇÃO 3 — primeira carga de dados

   ⚠️ IMPORTANTE SOBRE A ORDEM DESTE ARQUIVO:
   As seções marcadas "INICIALIZAÇÃO" contêm código que RODA IMEDIATAMENTE
   quando a página carrega (não são apenas declarações de função). A ordem
   relativa entre essas seções e as constantes/variáveis que elas usam foi
   mantida EXATAMENTE igual à versão original — não mova essas seções sem
   verificar as dependências, ou o site pode quebrar na inicialização.
   Já as `function ...` (declarações de função) podem ficar em qualquer
   posição do arquivo sem problema, porque o JavaScript as "hoisteia"
   (carrega antes de tudo) — foram agrupadas por assunto para facilitar
   a leitura.
   ============================================================================= */

/* -----------------------------------------------------------------------
   1. CONFIGURAÇÃO (URLs, SUPABASE, HELPERS DE DOM)
   ----------------------------------------------------------------------- */
const URL_PLANILHA_1 = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRzNtrrrqc63MiPQ88VaT7FAeczwujFdk8KiXSHXfoNRAf397iFHvw-iluIR1TkrNevow--QHIwbPH7/pub?gid=277533887&single=true&output=csv';
const URL_PLANILHA_2 = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSlshA2wJmrhz2fjEU5x1Y9on1uVLiyJXjXuK7w9HZVhGx3waQJe6fGM0o_0NhnsAbZEqud4EwOMadV/pub?gid=539484592&single=true&output=csv';
const URL_PLANILHA_3 = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTWO_PtLyJyb5Ua8fvOg1kiQC4COPwiB7KlPjaZ-h6Wl9Y9oydPPGvuSoht0ZV0b5R48ToJzK0ayObQ/pub?output=csv';
const URL_PLANILHA_4 = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vR5V8xE3zzpfPSjEG35-nMssruDEqCFlQdINhuZclB-JUt5h4w7HSLG-r-jEHBX60cOg6-nA51tSeL3/pub?gid=277533887&single=true&output=csv';

// Configuração do Realtime (Supabase)
const SUPABASE_URL = 'https://qpvwrheqwzzqynfyqgoq.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_pnz26qo9AP-jristVGo6CQ_dmFGamqP';

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const $ = id => document.getElementById(id);
const show = id => { const el = $(id); if (el) el.style.display = 'block'; };
const hide = id => { const el = $(id); if (el) el.style.display = 'none'; };
const setText = (id, text) => { const el = $(id); if (el) el.innerText = text; };
const setStyle = (id, styleName, value) => { const el = $(id); if (el) el.style[styleName] = value; };
const setBackgroundImage = (id, imageValue) => setStyle(id, 'backgroundImage', imageValue);

const TIME_LOGOS = {
    ESPARTA: 'LOGO SPARTA.png',
    PERSA: 'LOGO PERSA.png',
    CELTA: 'LOGO CELTA.png'
};
const PLANILHA_TIME = {
    1: 'ESPARTA',
    2: 'PERSA',
    3: 'CELTA',
    4: 'CELTA'
};

const formatarMoedaBRL = (valor, fallback = 'R$ 0.000.000,00') => {
    if (valor === 0 || Number.isNaN(valor)) return fallback;
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

/* -----------------------------------------------------------------------
   2. RENDERIZAÇÃO — TOP 3 (PÓDIO)
   ----------------------------------------------------------------------- */
function renderizarTop3Item(posicao, item, timestamp) {
    const photoElement = $(`photo-${posicao}`);
    const nameElement = $(`name-${posicao}`);
    const scoreElement = $(`score-${posicao}`);

    if (item) {
        if (nameElement) nameElement.innerText = item.nome || 'Sem Nome';
        if (scoreElement) scoreElement.innerText = item.valorTexto || '0';
        if (photoElement) {
            photoElement.style.backgroundImage = item.foto?.trim()
                ? `url('FOTOS/${item.foto}?v=${timestamp}')`
                : 'none';
        }
        return;
    }

    if (nameElement) nameElement.innerText = 'N/A';
    if (scoreElement) scoreElement.innerText = '-';
    if (photoElement) photoElement.style.backgroundImage = 'none';
}

/* -----------------------------------------------------------------------
   3. RESPONSIVIDADE (ESCALA DA TELA)
   ----------------------------------------------------------------------- */
function ajustarEscala() {
    const container = $('main-container');
    if (!container) return;

    const larguraTela = window.innerWidth;
    const alturaTela = window.innerHeight;
    const escalaX = larguraTela / 1920;
    const escalaY = alturaTela / 1080;
    container.style.transform = `scale(${escalaX}, ${escalaY})`;
}

/* -----------------------------------------------------------------------
   4. CONGELAMENTO (FREEZE) — FUNÇÃO CENTRAL DE APLICAÇÃO DE ESTADO
   ----------------------------------------------------------------------- */
function aplicarEstadoCongelamento(frozen, mostrarIndicadorLocal = false, textoIndicador = 'Modo teste') {
    paginaCongelada = frozen;
    comandoLocal = mostrarIndicadorLocal;
    textoIndicadorCongelamento = textoIndicador;
    salvarEstadoCongelamento();
    atualizarIndicadorCongelamento();

    if (paginaCongelada) {
        if (intervaloAtualizacao) {
            clearInterval(intervaloAtualizacao);
            intervaloAtualizacao = null;
        }
        if (intervaloTrocaPainel) {
            clearInterval(intervaloTrocaPainel);
            intervaloTrocaPainel = null;
        }
    } else {
        iniciarAtualizacaoAutomatica();
        iniciarTrocaAutomaticaPainel();
    }
}

/* -----------------------------------------------------------------------
   5. RODÍZIO DE PAINÉIS (5 TELAS)
   -----------------------------------------------------------------------
   VGV corretores -> ranking corretores -> construtoras -> horários -> avisos */
const PAINEIS_IDS = {
    corretores: 'podium-elements',
    rankingCorretores: 'panel-ranking-corretores',
    construtoras: 'panel-construtoras',
    horarios: 'panel-horarios',
    avisos: 'avisos-panel'
};

function mostrarPainel(nomePainel) {
    painelAtual = nomePainel;

    Object.entries(PAINEIS_IDS).forEach(([nome, id]) => {
        const el = $(id);
        if (!el) return;
        el.classList.toggle('active', nome === nomePainel);
    });
}

// Calcula o próximo painel na ordem, pulando "avisos" quando não houver
// nenhum aviso carregado no momento (mesma regra que já existia).
function proximoPainel(atual) {
    const ordem = PAINEIS_ORDEM;
    let indice = ordem.indexOf(atual);
    if (indice === -1) indice = 0;

    for (let tentativas = 0; tentativas < ordem.length; tentativas++) {
        indice = (indice + 1) % ordem.length;
        const candidato = ordem[indice];
        if (candidato === 'avisos' && (!avisosAtuais || avisosAtuais.length === 0)) {
            continue;
        }
        return candidato;
    }

    // Fallback: se por algum motivo só sobrar "avisos" vazio, mantém o atual.
    return atual;
}

function alternarPainelLocal() {
    const proximo = proximoPainel(painelAtual);
    mostrarPainel(proximo);
    console.log(`Painel alternado para: ${proximo}`);
}

function iniciarTrocaAutomaticaPainel() {
    if (intervaloTrocaPainel) {
        clearInterval(intervaloTrocaPainel);
    }

    intervaloTrocaPainel = setInterval(() => {
        if (!paginaCongelada) {
            alternarPainelLocal();
        }
    }, INTERVALO_TROCA_PAINEL_MS);
}

function exibirAvisos(avisos) {
    const lista = $('avisos-list');
    if (!lista) return;
    lista.innerHTML = '';

    if (!avisos || avisos.length === 0) {
        const vazio = document.createElement('div');
        vazio.className = 'avisos-empty';
        vazio.innerText = 'Nenhum aviso no momento.';
        lista.appendChild(vazio);
        return;
    }

    avisos.forEach(texto => {
        const item = document.createElement('div');
        item.className = 'aviso-item';
        item.innerText = texto;
        lista.appendChild(item);
    });
}

/* -----------------------------------------------------------------------
   6. INICIALIZAÇÃO 1 — ESCALA INICIAL DA TELA
   ----------------------------------------------------------------------- */
window.addEventListener('resize', ajustarEscala);
ajustarEscala();

const STORAGE_KEY = 'ranking-freeze-state';

let paginaCongelada = false;
let intervaloAtualizacao = null;
let comandoLocal = false;
let textoIndicadorCongelamento = 'Modo teste';

// Estado do rodízio de 5 painéis
const PAINEIS_ORDEM = ['corretores', 'rankingCorretores', 'construtoras', 'horarios', 'avisos'];
let painelAtual = 'corretores';
let intervaloTrocaPainel = null;
let avisosAtuais = [];
const INTERVALO_TROCA_PAINEL_MS = 60000; // 1 minuto

/* -----------------------------------------------------------------------
   7. CONGELAMENTO (FREEZE) — FUNÇÕES DE ESTADO/PERSISTÊNCIA
   ----------------------------------------------------------------------- */
function carregarEstadoCongelamentoSalvo() {
    try {
        return localStorage.getItem(STORAGE_KEY) === 'true';
    } catch (error) {
        console.warn('Não foi possível carregar o estado de congelamento.', error);
        return false;
    }
}

function salvarEstadoCongelamento() {
    try {
        localStorage.setItem(STORAGE_KEY, String(paginaCongelada));
    } catch (error) {
        console.warn('Não foi possível salvar o estado de congelamento.', error);
    }
}

function atualizarIndicadorCongelamento() {
    const indicador = $('freeze-indicator');
    const deveMostrar = paginaCongelada && comandoLocal;
    if (!indicador) return;
    indicador.classList.toggle('active', deveMostrar);
    indicador.innerText = deveMostrar ? textoIndicadorCongelamento : '';
}

function alternarCongelamentoLocal() {
    aplicarEstadoCongelamento(!paginaCongelada, true, 'Congelado');
    console.log(`Página ${paginaCongelada ? 'congelada' : 'descongelada'}.`);
}

function alternarCongelamentoRemoto() {
    aplicarEstadoCongelamento(!paginaCongelada, false, 'Modo teste');
    console.log(`Página ${paginaCongelada ? 'congelada' : 'descongelada'}.`);
}

function iniciarAtualizacaoAutomatica() {
    if (intervaloAtualizacao) {
        clearInterval(intervaloAtualizacao);
    }

    intervaloAtualizacao = setInterval(() => {
        if (!paginaCongelada) {
            carregarTop3();
        }
    }, 600000);
}

async function recarregarValoresLocal() {
    if (paginaCongelada) {
        console.log('Página congelada. Ignorando atualização de valores local.');
        return;
    }
    await carregarTop3();
}

async function recarregarValoresRemotos() {
    if (paginaCongelada) {
        console.log('Página congelada. Ignorando atualização de valores remotos.');
        return;
    }
    await channel.send({
        type: 'broadcast',
        event: 'refresh-values',
        payload: { fromId: DEVICE_ID, timestamp: new Date().getTime() }
    });
}

function recarregarPaginaLocal() {
    if (paginaCongelada) {
        console.log('Página congelada. Ignorando recarga completa local.');
        return;
    }
    window.location.search = '?v=' + new Date().getTime();
}

function recarregarPaginaRemota() {
    if (paginaCongelada) {
        console.log('Página congelada. Ignorando recarga completa remota.');
        return;
    }
    channel.send({
        type: 'broadcast',
        event: 'reload-page-others',
        payload: { fromId: DEVICE_ID, timestamp: new Date().getTime() }
    });
}

/* -----------------------------------------------------------------------
   8. INICIALIZAÇÃO 2 — ESTADO DE CONGELAMENTO SALVO
   ----------------------------------------------------------------------- */
paginaCongelada = carregarEstadoCongelamentoSalvo();
atualizarIndicadorCongelamento();

if (!paginaCongelada) {
    iniciarAtualizacaoAutomatica();
    iniciarTrocaAutomaticaPainel();
}

const DEVICE_ID = `${Date.now()}-${Math.random().toString(16).slice(2)}`;

/* -----------------------------------------------------------------------
   9. REALTIME (SUPABASE) — CANAL E EVENTOS REMOTOS
   ----------------------------------------------------------------------- */
const channel = supabaseClient.channel('ranking-updates')
.on('broadcast', { event: 'refresh-values' }, async (payload) => {
    if (payload.payload?.fromId === DEVICE_ID) {
        return;
    }

    console.log('Comando de atualização de valores recebido via Realtime.', payload);

    if (paginaCongelada) {
        console.log('Página congelada. Ignorando atualização de valores remota.');
        return;
    }

    await carregarTop3();
})
.on('broadcast', { event: 'reload-page-others' }, (payload) => {
    if (payload.payload?.fromId === DEVICE_ID) {
        return;
    }

    console.log('Comando de recarga completa recebido via Realtime.', payload);

    if (paginaCongelada) {
        console.log('Página congelada. Ignorando recarga completa remota.');
        return;
    }

    window.location.search = '?v=' + new Date().getTime();
})
.on('broadcast', { event: 'toggle-freeze-others' }, (payload) => {
    if (payload.payload?.fromId === DEVICE_ID) {
        return;
    }

    console.log('Comando de congelamento recebido via Realtime.', payload);
    alternarCongelamentoRemoto();
})
.on('broadcast', { event: 'switch-panel-others' }, (payload) => {
    if (payload.payload?.fromId === DEVICE_ID) {
        return;
    }

    console.log('Comando de troca de painel recebido via Realtime.', payload);

    if (paginaCongelada) {
        console.log('Página congelada. Ignorando troca de painel remota.');
        return;
    }

    alternarPainelLocal();
})
.subscribe();

/* -----------------------------------------------------------------------
   10. ATALHOS DE TECLADO
   -----------------------------------------------------------------------
   Convenção: Shift+tecla = ação só local. Ctrl/Cmd+tecla = ação local +
   broadcast para as demais telas via Realtime.
     Shift+R      -> atualizar valores (local)
     Ctrl/Cmd+R   -> atualizar valores (remoto)
     Alt+R        -> recarregar página completa (pergunta local ou remoto)
     Shift+P      -> alternar congelamento (local)
     Ctrl/Cmd+P   -> alternar congelamento (local + remoto)
     Shift+A      -> alternar painel (local)
     Ctrl/Cmd+A   -> alternar painel (local + remoto) */
window.addEventListener('keydown', async function(event) {
    const tecla = (event.key || '').toLowerCase();
    const code = (event.code || '').toLowerCase();

    if (event.shiftKey && tecla === 'r') {
        event.preventDefault();
        event.stopPropagation();
        console.log('Atualizando apenas os valores da própria página...');
        await recarregarValoresLocal();
        return;
    }

    if ((event.ctrlKey || event.metaKey) && tecla === 'r') {
        event.preventDefault();
        event.stopPropagation();
        console.log('Atualizando os valores das demais páginas, mas não a própria...');
        await recarregarValoresRemotos();
        return;
    }

    if (event.altKey && tecla === 'r') {
        event.preventDefault();
        event.stopPropagation();
        const resposta = window.confirm('Deseja recarregar a página completa apenas na local ou em todas as demais páginas?\n\nClique OK para a local ou Cancelar para as demais.');
        if (resposta) {
            recarregarPaginaLocal();
        } else {
            recarregarPaginaRemota();
        }
    }

    if (event.shiftKey && tecla === 'p') {
        event.preventDefault();
        event.stopPropagation();
        alternarCongelamentoLocal();
        return;
    }

    if ((event.ctrlKey || event.metaKey) && (tecla === 'p' || code === 'keyp')) {
        event.preventDefault();
        event.stopPropagation();
        console.log('Alternando o congelamento das demais páginas, mas não a própria...');
        alternarCongelamentoLocal();
        await channel.send({
            type: 'broadcast',
            event: 'toggle-freeze-others',
            payload: { fromId: DEVICE_ID, timestamp: new Date().getTime() }
        });
    }

    if (event.shiftKey && tecla === 'a') {
        event.preventDefault();
        event.stopPropagation();
        console.log('Alternando o painel apenas da própria página...');
        alternarPainelLocal();
        return;
    }

    if ((event.ctrlKey || event.metaKey) && (tecla === 'a' || code === 'keya')) {
        event.preventDefault();
        event.stopPropagation();
        console.log('Alternando o painel das demais páginas, mas não a própria...');
        alternarPainelLocal();
        await channel.send({
            type: 'broadcast',
            event: 'switch-panel-others',
            payload: { fromId: DEVICE_ID, timestamp: new Date().getTime() }
        });
    }
}, true);

/* -----------------------------------------------------------------------
   11. CSV — PARSING GENÉRICO
   ----------------------------------------------------------------------- */

// Parser de CSV que processa o texto inteiro de uma vez (não linha por linha),
// respeitando aspas — inclusive quando uma célula tem quebra de linha (\n) dentro
// dela, que é como o Google Sheets exporta células com múltiplas linhas.
function parseCSVCompleto(csvText, separador) {
    const linhas = [];
    let linhaAtual = [];
    let campoAtual = '';
    let dentroDeAspas = false;
    let i = 0;
    const total = csvText.length;

    while (i < total) {
        const char = csvText[i];

        if (dentroDeAspas) {
            if (char === '"') {
                if (csvText[i + 1] === '"') {
                    campoAtual += '"';
                    i += 2;
                    continue;
                }
                dentroDeAspas = false;
                i += 1;
                continue;
            }
            campoAtual += char;
            i += 1;
            continue;
        }

        if (char === '"') {
            dentroDeAspas = true;
            i += 1;
            continue;
        }

        if (char === separador) {
            linhaAtual.push(campoAtual.trim());
            campoAtual = '';
            i += 1;
            continue;
        }

        if (char === '\r') {
            i += 1;
            continue;
        }

        if (char === '\n') {
            linhaAtual.push(campoAtual.trim());
            linhas.push(linhaAtual);
            linhaAtual = [];
            campoAtual = '';
            i += 1;
            continue;
        }

        campoAtual += char;
        i += 1;
    }

    if (campoAtual.length > 0 || linhaAtual.length > 0) {
        linhaAtual.push(campoAtual.trim());
        linhas.push(linhaAtual);
    }

    return linhas;
}

function detectCsvSeparator(csvText) {
    const primeiraLinha = csvText.split(/\r?\n/)[0] || '';
    const contagemVirgula = (primeiraLinha.match(/,/g) || []).length;
    const contagemPontoVirgula = (primeiraLinha.match(/;/g) || []).length;
    return contagemPontoVirgula > contagemVirgula ? ';' : ',';
}

function limparValorMonetario(valorCru) {
    if (!valorCru) return 0;
    const valorLimpo = valorCru.replace(/\./g, '').replace(',', '.');
    return parseFloat(valorLimpo) || 0;
}

// Função genérica: extrai e limpa o valor monetário de uma coluna específica
// (índice zero-based) da segunda linha (linha 2) de um CSV.
function extrairValorColunaDaSegundaLinha(csvText, separador, indiceColuna) {
    const linhas = parseCSVCompleto(csvText, separador);
    if (linhas.length > 1 && linhas[1].length) {
        const columns = linhas[1];
        if (columns.length > indiceColuna) {
            return limparValorMonetario(columns[indiceColuna]);
        }
    }
    return 0;
}

function extrairVgvDaSegundaLinha(csvText, separador) {
    // Coluna D (índice 3)
    return extrairValorColunaDaSegundaLinha(csvText, separador, 3);
}

function extrairAssinadoCefDaSegundaLinha(csvText, separador) {
    // Coluna G (índice 6)
    return extrairValorColunaDaSegundaLinha(csvText, separador, 6);
}

function forCsvRows(csvText, rowHandler) {
    const separador = detectCsvSeparator(csvText);
    const linhas = parseCSVCompleto(csvText, separador);

    for (let i = 1; i < linhas.length; i++) {
        const columns = linhas[i];
        if (!columns || columns.length === 0) continue;

        const linhaVazia = columns.every(valor => !valor || !valor.trim());
        if (linhaVazia) continue;

        rowHandler(columns, separador);
    }

    return separador;
}

/* -----------------------------------------------------------------------
   12. CSV — EXTRAÇÃO DE LISTAS (CORRETORES / CONSTRUTORAS / AVISOS)
   ----------------------------------------------------------------------- */
function csvToArrays(csvText) {
    const result = [];
    const separador = forCsvRows(csvText, (columns) => {
        if (columns.length < 2) return;
        const nomeCru = columns[0] || '';
        const valorCru = columns[1] || '0';
        const nomeFotoArquivo = columns[2] || '';
        const valorNumerico = limparValorMonetario(valorCru);

        if (valorNumerico === 0) return;
        result.push({ nome: nomeCru, valorTexto: valorCru, valorNum: valorNumerico, foto: nomeFotoArquivo });
    });

    return { itens: result, separador };
}

// Extrai TODOS os corretores (nome + valor da coluna B), inclusive os que
// têm VGV = 0. Diferente de csvToArrays (usada pelo pódio Top 3), que
// descarta linhas com valor zerado — aqui a lista precisa estar completa,
// pois o ranking de corretores deve mostrar todo mundo.
function csvToCorretoresTodos(csvText, timeNome) {
    const result = [];
    const timeKey = (timeNome || '').toUpperCase();
    const logo = TIME_LOGOS[timeKey] || '';

    forCsvRows(csvText, (columns) => {
        if (columns.length < 1) return;
        const nomeCru = (columns[0] || '').trim();
        if (!nomeCru) return;
        const valorCru = columns[1] || '0';
        const nomeFotoArquivo = columns[2] || '';
        const valorNumerico = limparValorMonetario(valorCru);
        result.push({ nome: nomeCru, valorNum: valorNumerico, time: timeKey, logo, foto: nomeFotoArquivo });
    });
    return result;
}

function csvToSalesRanking(csvText) {
    const result = [];
    const separador = forCsvRows(csvText, (columns) => {
        if (columns.length < 6) return;
        const construtoraNome = (columns[4] || '').trim();
        const quantidadeVendas = columns[5] || '0';
        const fotoArquivo = (columns[8] || '').trim();
        // Coluna J (índice 9) = VGV da construtora
        const vgvCru = columns[9] || '';
        if (!construtoraNome) return;

        const quantidade = parseInt(quantidadeVendas, 10) || 0;
        const vgv = limparValorMonetario(vgvCru);
        result.push({ nome: construtoraNome, quantidade, vgv, foto: fotoArquivo });
    });

    return { itens: result, separador };
}

// ATENÇÃO: leitura posicional pela coluna H (índice 7), a "próxima coluna vazia"
// depois de G (Assinado CEF). Se uma coluna for inserida antes da H no futuro,
// esta função vai ler o valor errado silenciosamente — não há checagem de cabeçalho.
function extrairAvisosDaPlanilha(csvText) {
    const avisos = [];
    forCsvRows(csvText, (columns) => {
        const valor = (columns[7] || '').trim();
        if (valor) avisos.push(valor);
    });
    return avisos;
}

/* -----------------------------------------------------------------------
   13. RANKING — RENDERIZAÇÃO GENÉRICA (COLUNAS, ORDENAÇÃO, ETC.)
   ----------------------------------------------------------------------- */

// Renderiza uma lista de ranking (posição/nome/quantidade) dentro de um
// container/lista já existentes no HTML, quebrando em 1, 2 ou 3 colunas
// conforme a quantidade de itens e a configuração do ranking atual.
function exibirRanking(agregados, opcoes) {
    const {
        listId,
        containerId,
        umaColunaLeft,
        umaColunaWidth,
        leftOffset = '180px',
        campoOrdenacao = 'quantidade',
        formatarExibicao = (item) => `${item.quantidade} ${item.quantidade === 1 ? 'Venda' : 'Vendas'}`,
        // Quantos itens mostrar no máximo. null = mostra todos, sem cortar.
        limiteItens = null,
        // Quando definido, cria uma coluna para cada grupo desta quantidade.
        itensPorColuna = null,
        larguraColuna = '320px',
        // Opcoes legadas usadas pelo ranking de construtoras.
        forcarTresColunas = false,
        tresColunasLeft = '120px',
        tresColunasWidth = '1750px',
        duasColunasWidth = '1600px'
    } = opcoes;

    const rankingList = $(listId);
    if (!rankingList) return;
    rankingList.innerHTML = '';

    const ordenados = [...agregados].sort((a, b) => {
        const diferenca = (b[campoOrdenacao] || 0) - (a[campoOrdenacao] || 0);
        if (diferenca !== 0) return diferenca;
        return (a.nome || '').localeCompare(b.nome || '', 'pt-BR', { sensitivity: 'base' });
    });

    const itensExibir = limiteItens ? ordenados.slice(0, limiteItens) : ordenados;
    const numeroColunas = itensPorColuna
        ? Math.max(1, Math.ceil(itensExibir.length / itensPorColuna))
        : itensExibir.length > 5
            ? (forcarTresColunas && itensExibir.length > 22 ? 3 : 2)
            : 1;

    const colunas = itensPorColuna
        ? Array.from({ length: numeroColunas }, (_, indice) => {
            const inicio = indice * itensPorColuna;
            return itensExibir.slice(inicio, inicio + itensPorColuna);
        })
        : numeroColunas === 3
            ? [
                itensExibir.slice(0, Math.ceil(itensExibir.length / 3)),
                itensExibir.slice(Math.ceil(itensExibir.length / 3), Math.ceil((itensExibir.length * 2) / 3)),
                itensExibir.slice(Math.ceil((itensExibir.length * 2) / 3))
            ]
            : numeroColunas === 2
                ? [
                    itensExibir.slice(0, Math.ceil(itensExibir.length / 2)),
                    itensExibir.slice(Math.ceil(itensExibir.length / 2))
                ]
                : [itensExibir];

    // Ajusta a posição do container sem depender de classes duplicadas no CSS.
    const container = $(containerId);
    if (container) {
        container.style.display = itensExibir.length > 0 ? 'block' : 'none';
        if (itensPorColuna) {
            const larguraNumerica = parseInt(larguraColuna, 10);
            const larguraTotal = numeroColunas * larguraNumerica + (numeroColunas - 1) * 10;
            container.style.left = `${Math.max(0, (1920 - larguraTotal) / 2)}px`;
            container.style.width = `${larguraTotal}px`;
            container.style.maxWidth = 'none';
        } else if (numeroColunas === 3) {
            container.style.left = tresColunasLeft;
            container.style.width = tresColunasWidth;
            container.style.maxWidth = 'calc(100vw - 80px)';
        } else if (numeroColunas === 2) {
            container.style.left = leftOffset;
            container.style.width = duasColunasWidth;
            container.style.maxWidth = 'calc(100vw - 80px)';
        } else {
            container.style.left = umaColunaLeft;
            container.style.width = umaColunaWidth;
            container.style.maxWidth = 'none';
        }
    }

    let posicaoAtual = 0;
    colunas.forEach((colunaItems) => {
        const columnDiv = document.createElement('div');
        columnDiv.className = 'ranking-column';

        if (itensPorColuna) {
            columnDiv.style.flex = `0 0 ${larguraColuna}`;
            columnDiv.style.width = larguraColuna;
            columnDiv.style.maxWidth = larguraColuna;
        }

        colunaItems.forEach((item) => {
            posicaoAtual += 1;
            const itemDiv = document.createElement('div');
            itemDiv.className = 'ranking-item';

            if (posicaoAtual === 1) {
                itemDiv.classList.add('top-1');
            } else if (posicaoAtual === 2) {
                itemDiv.classList.add('top-2');
            } else if (posicaoAtual === 3) {
                itemDiv.classList.add('top-3');
            }

            const exibirNumeroPosicao = (item[campoOrdenacao] || 0) > 0;

            const logoMarkup = item.logo
                ? `<img class="ranking-team-logo" src="LOGOS/${item.logo}" alt="Logo ${item.time || 'time'}">`
                : '';

            itemDiv.innerHTML = `
                ${exibirNumeroPosicao ? `<div class="ranking-position">${posicaoAtual}º</div>` : ''}
                <div class="ranking-info">
                    <div class="ranking-company">${item.nome}</div>
                    <div class="ranking-quantity">${formatarExibicao(item)}</div>
                </div>
                ${logoMarkup}
            `;

            columnDiv.appendChild(itemDiv);
        });

        rankingList.appendChild(columnDiv);
    });
}

/* -----------------------------------------------------------------------
   14. RANKING — AGREGAÇÃO (SOMA POR NOME)
   ----------------------------------------------------------------------- */

// Agrega por nome, SOMANDO quantidade (coluna F) e VGV (coluna J) das
// construtoras — nomes iguais (case-insensitive) viram um único item.
function agregarSomandoQuantidade(itens) {
    const mapa = new Map();
    itens.forEach(it => {
        const nomeRaw = (it.nome || '').trim();
        if (!nomeRaw) return;
        const chave = nomeRaw.toLowerCase();
        const q = parseInt(it.quantidade) || 0;
        const vgv = parseFloat(it.vgv) || 0;
        const foto = (it.foto || '').trim();
        if (mapa.has(chave)) {
            const existente = mapa.get(chave);
            existente.quantidade += q;
            existente.vgv += vgv;
            if (!existente.foto && foto) {
                existente.foto = foto;
            }
        } else {
            mapa.set(chave, { nome: nomeRaw, quantidade: q, vgv, foto });
        }
    });
    return Array.from(mapa.values());
}

// Agrega por nome, SOMANDO o valor (coluna B) de cada linha — usado pelo
// ranking de corretores, que ordena por VGV total e não por quantidade de
// vendas.
function agregarSomandoValor(itens) {
    const mapa = new Map();
    const nomesComFiltro = ['ALEXANDRE', 'MICHELL', 'WELLIGTON'];

    itens.forEach(it => {
        const nomeRaw = (it.nome || '').trim();
        if (!nomeRaw) return;

        const nomeNormalizado = nomeRaw.toUpperCase();
        const time = (it.time || '').toUpperCase();
        const v = parseFloat(it.valorNum) || 0;
        const foto = (it.foto || '').trim();

        const deveIgnorar = nomesComFiltro.includes(nomeNormalizado) && v <= 0;
        if (deveIgnorar) return;

        const chave = `${nomeRaw.toLowerCase()}|${time}`;
        if (mapa.has(chave)) {
            mapa.get(chave).valor += v;
            if (!mapa.get(chave).time && time) {
                mapa.get(chave).time = time;
            }
            if (!mapa.get(chave).logo && TIME_LOGOS[time]) {
                mapa.get(chave).logo = TIME_LOGOS[time];
            }
            if (!mapa.get(chave).foto && foto) {
                mapa.get(chave).foto = foto;
            }
        } else {
            mapa.set(chave, {
                nome: nomeRaw,
                valor: v,
                time,
                logo: TIME_LOGOS[time] || '',
                foto: foto
            });
        }
    });
    return Array.from(mapa.values());
}

/* -----------------------------------------------------------------------
   15. RANKING — EXIBIÇÃO (CONSTRUTORAS E CORRETORES)
   ----------------------------------------------------------------------- */
function exibirFotosRankingVendas(vendedoresRanking, timestamp) {
    // Top 3 ordenado por VGV (coluna J); exibe vendas + VGV no pódio.
    const agregados = agregarSomandoQuantidade(vendedoresRanking)
        .sort((a, b) => {
            const diferenca = (b.vgv || 0) - (a.vgv || 0);
            if (diferenca !== 0) return diferenca;
            return (a.nome || '').localeCompare(b.nome || '', 'pt-BR', { sensitivity: 'base' });
        })
        .filter(item => (item.vgv || 0) > 0); // Exibir apenas construtoras com VGV > 0

    for (let i = 0; i < 3; i++) {
        const item = agregados[i];
        const fotoElement = $(`sales-photo-${i + 1}`);
        const nameElement = $(`sales-name-${i + 1}`);
        const scoreElement = $(`sales-score-${i + 1}`);
        if (!fotoElement) continue;

        const nomeFoto = item?.foto?.trim();
        fotoElement.style.backgroundImage = nomeFoto
            ? `url('LOGOS/${nomeFoto}?v=${timestamp}')`
            : 'none';

        if (nameElement) {
            nameElement.innerText = item?.nome || 'N/A';
        }
        if (scoreElement) {
            if (!item) {
                scoreElement.innerText = '0';
            } else {
                const qtd = `${item.quantidade} ${item.quantidade === 1 ? 'venda' : 'vendas'}`;
                const vgvTexto = formatarMoedaBRL(item.vgv || 0);
                scoreElement.innerHTML = `<span class="score-vendas">${qtd}</span><span class="score-vgv">${vgvTexto}</span>`;
            }
        }
    }
}

function exibirRankingVendas(vendedoresRanking) {
    // Lista ordenada por VGV; na tela continua aparecendo só a qtd. de vendas.
    const agregados = agregarSomandoQuantidade(vendedoresRanking);
    exibirRanking(agregados, {
        listId: 'ranking-list-construtoras',
        containerId: 'sales-ranking-container-construtoras',
        umaColunaLeft: '320px',
        umaColunaWidth: '380px',
        campoOrdenacao: 'vgv',
        limiteItens: null
    });
}

// Lista de vendas por CORRETOR (todos, não só o Top 3 do pódio). Usa os
// mesmos registros (nome + valor) que alimentam o pódio, contando 1 venda
// por linha válida.
// Lista de VGV por CORRETOR — TODOS eles, inclusive os com VGV = 0, não só
// o Top 3 do pódio e não limitado a 10. Soma o valor (coluna B) por
// corretor e ordena do maior VGV pro menor (empate = ordem alfabética).
function exibirRankingCorretores(corretoresItens) {
    const agregados = agregarSomandoValor(corretoresItens);
    exibirRanking(agregados, {
        listId: 'corretores-ranking-list',
        containerId: 'corretores-ranking-container',
        umaColunaLeft: '320px',
        umaColunaWidth: '380px',
        campoOrdenacao: 'valor',
        limiteItens: null, // mostra todos os corretores, sem cortar em 10
        itensPorColuna: 8,
        larguraColuna: '320px',
        formatarExibicao: (item) => {
            if (item.valor === 0) return 'R$ 000.000,00';
            return item.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        }
    });
}

/* -----------------------------------------------------------------------
   16. CARREGAMENTO PRINCIPAL DE DADOS (FETCH DAS 4 PLANILHAS)
   ----------------------------------------------------------------------- */
async function carregarTop3() {
    if (paginaCongelada) {
        console.log('Atualização bloqueada porque a página está congelada.');
        return;
    }

    try {
        const timestamp = new Date().getTime();
        const [response1, response2, response3, response4] = await Promise.all([
            fetch(`${URL_PLANILHA_1}&cache=${timestamp}`),
            fetch(`${URL_PLANILHA_2}&cache=${timestamp}`),
            fetch(`${URL_PLANILHA_3}&cache=${timestamp}`),
            URL_PLANILHA_4
                ? fetch(`${URL_PLANILHA_4}${URL_PLANILHA_4.includes('?') ? '&' : '?'}cache=${timestamp}`)
                : Promise.resolve(null)
        ]);

        if (!response1.ok || !response2.ok || !response3.ok || (response4 && !response4.ok)) {
            throw new Error('Erro ao buscar dados das planilhas.');
        }

        const dataText1 = await response1.text();
        const dataText2 = await response2.text();
        const dataText3 = await response3.text();
        const dataText4 = response4 ? await response4.text() : '';

        const resultado1 = csvToArrays(dataText1);
        const resultado2 = csvToArrays(dataText2);

        const vgv1 = extrairVgvDaSegundaLinha(dataText1, resultado1.separador);
        const vgv2 = extrairVgvDaSegundaLinha(dataText2, resultado2.separador);
        const separador3 = detectCsvSeparator(dataText3);
        const vgv3 = extrairVgvDaSegundaLinha(dataText3, separador3);
        const separador4 = dataText4 ? detectCsvSeparator(dataText4) : ',';
        const vgv4 = dataText4 ? extrairVgvDaSegundaLinha(dataText4, separador4) : 0;

        const cef1 = extrairAssinadoCefDaSegundaLinha(dataText1, resultado1.separador);
        const cef2 = extrairAssinadoCefDaSegundaLinha(dataText2, resultado2.separador);
        const cef4 = extrairAssinadoCefDaSegundaLinha(dataText4, separador4);
        const cefTotal = cef1 + cef2 + cef4;

        // Carregar dados de corretores de TODAS as 4 planilhas
        const corretoresTodos1 = csvToCorretoresTodos(dataText1, PLANILHA_TIME[1]);
        const corretoresTodos2 = csvToCorretoresTodos(dataText2, PLANILHA_TIME[2]);
        const corretoresTodos3 = csvToCorretoresTodos(dataText3, PLANILHA_TIME[3]);
        const corretoresTodos4 = csvToCorretoresTodos(dataText4, PLANILHA_TIME[4]);
        const corretoresCompletos = corretoresTodos1.concat(
            corretoresTodos2,
            corretoresTodos3,
            corretoresTodos4
        );

        // Agregar por nome (soma VGV do mesmo corretor)
        const corretoresAgregados = agregarSomandoValor(corretoresCompletos)
            .sort((a, b) => b.valor - a.valor)
            .filter(item => item.valor > 0); // Exibir apenas corretores com valor > 0

        // Se nenhum dado com valor for encontrado, apenas renderiza N/A e - no Top 3

        // Renderizar Top 3 com dados agregados
        for (let i = 0; i < 3; i++) {
            const item = corretoresAgregados[i];
            if (item) {
                renderizarTop3Item(i + 1, {
                    nome: item.nome,
                    valorTexto: item.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
                    valorNum: item.valor,
                    foto: item.foto || ''
                }, timestamp);
            } else {
                renderizarTop3Item(i + 1, null, timestamp);
            }
        }

        setText('vgv-total-1', formatarMoedaBRL(vgv1));
        setText('vgv-total-2', formatarMoedaBRL(vgv2));
        setText('vgv-total-3', formatarMoedaBRL(vgv3));
        setText('vgv-total-4', formatarMoedaBRL(vgv4));

        const cefTotalElement = $('cef-total');
        if (cefTotalElement) {
            cefTotalElement.innerText = formatarMoedaBRL(cefTotal);
        }

        // Carregar ranking de vendas (colunas E e F) - construtoras
        const rankingSales1 = csvToSalesRanking(dataText1);
        const rankingSales2 = csvToSalesRanking(dataText2);
        const rankingSales3 = csvToSalesRanking(dataText3);
        const rankingSales4 = csvToSalesRanking(dataText4);
        const rankingCompleto = rankingSales1.itens.concat(
            rankingSales2.itens,
            rankingSales3.itens,
            rankingSales4.itens
        );
        exibirRankingVendas(rankingCompleto);
        exibirFotosRankingVendas(rankingCompleto, timestamp);

        const totalVendasPlanilha1 = rankingSales1.itens.reduce((soma, item) => soma + (parseInt(item.quantidade, 10) || 0), 0);
        const totalVendasPlanilha2 = rankingSales2.itens.reduce((soma, item) => soma + (parseInt(item.quantidade, 10) || 0), 0);
        const totalVendasPlanilha3 = rankingSales3.itens.reduce((soma, item) => soma + (parseInt(item.quantidade, 10) || 0), 0);
        const totalVendasPlanilha4 = rankingSales4.itens.reduce((soma, item) => soma + (parseInt(item.quantidade, 10) || 0), 0);
        const totalVendasTodasEquipes = totalVendasPlanilha1 + totalVendasPlanilha2 + totalVendasPlanilha3 + totalVendasPlanilha4;

        setText('sales-qty-total-1', `${totalVendasPlanilha1} ${totalVendasPlanilha1 === 1 ? 'Venda' : 'Vendas'}`);
        setText('sales-qty-total-2', `${totalVendasPlanilha2} ${totalVendasPlanilha2 === 1 ? 'Venda' : 'Vendas'}`);
        setText('sales-qty-total-3', `${totalVendasPlanilha3} ${totalVendasPlanilha3 === 1 ? 'Venda' : 'Vendas'}`);
        setText('sales-qty-total-4', `${totalVendasPlanilha4} ${totalVendasPlanilha4 === 1 ? 'Venda' : 'Vendas'}`);
        setText('sales-total-value', `${totalVendasTodasEquipes} ${totalVendasTodasEquipes === 1 ? 'Venda' : 'Vendas'}`);

        // Ranking de vendas dos corretores (já foi carregado acima)
        exibirRankingCorretores(corretoresCompletos);

        // Carregar avisos (coluna H de todas as planilhas)
        const avisos1 = extrairAvisosDaPlanilha(dataText1);
        const avisos2 = extrairAvisosDaPlanilha(dataText2);
        const avisos3 = extrairAvisosDaPlanilha(dataText3);
        avisosAtuais = avisos1.concat(avisos2, avisos3);
        exibirAvisos(avisosAtuais);

        hide('loading');
        hide('error');
        // Respeita o painel atualmente ativo (ranking ou avisos) em vez de
        // forçar sempre o pódio — importante porque esta função roda a cada
        // atualização automática (10 min) e não pode "puxar" a tela de volta
        // se o painel de avisos estiver em exibição no momento.
        mostrarPainel(painelAtual);

    } catch (error) {
        console.error(error);
        hide('loading');
        const erroDiv = $('error');
        if (erroDiv) {
            erroDiv.innerText = "Erro: " + error.message;
            erroDiv.style.display = 'block';
        }
    }
}

/* -----------------------------------------------------------------------
   17. INICIALIZAÇÃO 3 — PRIMEIRA CARGA DE DADOS
   ----------------------------------------------------------------------- */
carregarTop3();
