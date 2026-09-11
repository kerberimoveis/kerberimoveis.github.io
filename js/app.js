import {
    INTERVALO_ATUALIZACAO_MS,
    INTERVALO_TROCA_PAINEL_MS,
    STORAGE_KEY,
    SUPABASE_CONFIG
} from './config.js';
import { carregarDocumentacoes, carregarPlanilhas, normalizarDados } from './data.js';
import { agregarSomandoQuantidade, agregarSomandoValor, exibirRanking, formatarMoedaBRL } from './ranking.js';
import { mostrarPainel, proximoPainel } from './panels.js';

const $ = id => document.getElementById(id);
const setText = (id, text) => { const elemento = $(id); if (elemento) elemento.textContent = text; };
const hide = id => { const elemento = $(id); if (elemento) { elemento.hidden = true; elemento.style.display = 'none'; } };
const show = id => { const elemento = $(id); if (elemento) { elemento.hidden = false; elemento.style.display = 'block'; } };

let paginaCongelada = false;
let painelAtual = 'corretores';
let intervaloAtualizacao = null;
let intervaloTrocaPainel = null;
let comandoLocal = false;
let textoIndicadorCongelamento = 'Modo teste';
const DEVICE_ID = `${Date.now()}-${Math.random().toString(16).slice(2)}`;

const supabaseClient = window.supabase?.createClient(
    SUPABASE_CONFIG.url,
    SUPABASE_CONFIG.anonKey
);
const channel = supabaseClient?.channel('ranking-updates');

function ajustarEscala() {
    const container = $('main-container');
    if (!container) return;
    const escalaX = window.innerWidth / 1920;
    const escalaY = window.innerHeight / 1080;
    container.style.transform = `scale(${escalaX}, ${escalaY})`;
}

function renderizarTop3Item(posicao, item, timestamp) {
    const foto = $(`photo-${posicao}`);
    const nome = $(`name-${posicao}`);
    const valor = $(`score-${posicao}`);
    if (nome) nome.textContent = item?.nome || 'N/A';
    if (valor) valor.textContent = item?.valorTexto || '-';
    if (foto) foto.style.backgroundImage = item?.foto?.trim()
        ? `url('FOTOS/${encodeURIComponent(item.foto.trim())}?v=${timestamp}')`
        : 'none';
}

function exibirFotosRankingVendas(vendas, timestamp) {
    const top3 = agregarSomandoQuantidade(vendas)
        .filter(item => item.vgv > 0)
        .sort((a, b) => b.vgv - a.vgv || a.nome.localeCompare(b.nome, 'pt-BR'));
    for (let indice = 0; indice < 3; indice += 1) {
        const item = top3[indice];
        const foto = $(`sales-photo-${indice + 1}`);
        const nome = $(`sales-name-${indice + 1}`);
        const score = $(`sales-score-${indice + 1}`);
        if (foto) foto.style.backgroundImage = item?.foto
            ? `url('LOGOS/${encodeURIComponent(item.foto)}?v=${timestamp}')`
            : 'none';
        if (nome) nome.textContent = item?.nome || 'N/A';
        if (score) {
            score.replaceChildren();
            if (item) {
                if (item.quantidade > 0) {
                    const vendasElemento = document.createElement('span');
                    vendasElemento.className = 'score-vendas';
                    vendasElemento.textContent = `${item.quantidade} ${item.quantidade === 1 ? 'venda' : 'vendas'}`;
                    score.append(vendasElemento);
                }
                if (item.vgv > 0) {
                    const vgvElemento = document.createElement('span');
                    vgvElemento.className = 'score-vgv';
                    vgvElemento.textContent = formatarMoedaBRL(item.vgv);
                    score.append(vgvElemento);
                }
            } else score.textContent = '0';
        }
    }
}

function exibirTop3Documentacoes(documentacoes, timestamp) {
    const top3 = documentacoes
        .filter(item => item.quantidade > 0)
        .sort((a, b) => b.quantidade - a.quantidade || a.nome.localeCompare(b.nome, 'pt-BR'))
        .slice(0, 3);

    for (let indice = 0; indice < 3; indice += 1) {
        const item = top3[indice];
        const foto = $(`documentacao-photo-${indice + 1}`);
        const nome = $(`documentacao-name-${indice + 1}`);
        const score = $(`documentacao-score-${indice + 1}`);
        if (foto) foto.style.backgroundImage = item
            ? `url('FOTOS/${encodeURIComponent(item.foto)}?v=${timestamp}')`
            : 'none';
        if (nome) nome.textContent = item?.nome || '-';
        if (score) score.textContent = item ? `${item.quantidade} ${item.quantidade === 1 ? 'DOCUMENTAÇÃO' : 'DOCUMENTAÇÕES'}` : '0';
    }
}

function renderizarDados(dados, documentacoes, vendasPorTime) {
    const timestamp = Date.now();
    const corretores = agregarSomandoValor(dados.corretores)
        .filter(item => item.valor > 0)
        .sort((a, b) => b.valor - a.valor);
    for (let indice = 0; indice < 3; indice += 1) {
        const item = corretores[indice];
        renderizarTop3Item(indice + 1, item && {
            nome: item.nome,
            valorTexto: formatarMoedaBRL(item.valor),
            foto: item.foto
        }, timestamp);
    }

    dados.vgv.forEach((valor, indice) => setText(`vgv-total-${indice + 1}`, formatarMoedaBRL(valor)));
    const cefTotal = dados.cef.reduce((total, valor) => total + valor, 0);
    setText('cef-total', formatarMoedaBRL(cefTotal));

    const vendasPorPlanilha = dados.planilhas.map(planilha => {
        const vendas = planilha.texto ? normalizarDados([planilha]).vendas : [];
        return vendas.reduce((total, item) => total + item.quantidade, 0);
    });
    vendasPorPlanilha.forEach((total, indice) => {
        setText(`sales-qty-total-${indice + 1}`, `${total} ${total === 1 ? 'Venda' : 'Vendas'}`);
    });
    const totalVendas = vendasPorPlanilha.reduce((total, valor) => total + valor, 0);
    setText('sales-total-value', `${totalVendas} ${totalVendas === 1 ? 'Venda' : 'Vendas'}`);

    exibirFotosRankingVendas(dados.vendas, timestamp);
    exibirTop3Documentacoes(documentacoes, timestamp);
    setText('documentacao-time-total-1', `${vendasPorTime.ESPARTA || 0} ${vendasPorTime.ESPARTA === 1 ? 'DOCUMENTAÇÃO' : 'DOCUMENTAÇÕES'}`);
    setText('documentacao-time-total-2', `${vendasPorTime.PERSA || 0} ${vendasPorTime.PERSA === 1 ? 'DOCUMENTAÇÃO' : 'DOCUMENTAÇÕES'}`);
    setText('documentacao-time-total-3', `${vendasPorTime.CELTA || 0} ${vendasPorTime.CELTA === 1 ? 'DOCUMENTAÇÃO' : 'DOCUMENTAÇÕES'}`);
    exibirRanking(agregarSomandoQuantidade(dados.vendas), {
        listId: 'ranking-list-construtoras',
        containerId: 'sales-ranking-container-construtoras',
        campoOrdenacao: 'vgv',
        formatarExibicao: item => item.quantidade > 0
            ? `${item.quantidade} ${item.quantidade === 1 ? 'Venda' : 'Vendas'}`
            : '',
        posicaoEsquerda: 160
    });
    exibirRanking(agregarSomandoValor(dados.corretores), {
        listId: 'corretores-ranking-list',
        containerId: 'corretores-ranking-container',
        campoOrdenacao: 'valor',
        formatarExibicao: item => item.valor > 0 ? formatarMoedaBRL(item.valor) : '',
        itensPorColuna: 8
    });
}

async function carregarTop3() {
    if (paginaCongelada) return;
    try {
        const [planilhas, documentacoes] = await Promise.all([
            carregarPlanilhas(),
            carregarDocumentacoes()
        ]);
        const dados = normalizarDados(planilhas);
        renderizarDados(dados, documentacoes.documentacoes, documentacoes.vendasPorTime);
        hide('loading');
        hide('error');
        mostrarPainel(painelAtual);
        if (planilhas.some(item => item.origem === 'cache')) {
            setText('data-status', 'Exibindo dados salvos; tentando reconectar');
        } else {
            setText('data-status', '');
        }
    } catch (error) {
        console.error('Falha ao atualizar os dados.', error);
        hide('loading');
        setText('error', 'Não foi possível atualizar os dados. Tentando novamente...');
        show('error');
    }
}

function salvarEstadoCongelamento() {
    try { localStorage.setItem(STORAGE_KEY, String(paginaCongelada)); } catch (error) { console.warn(error); }
}
function atualizarIndicadorCongelamento() {
    const indicador = $('freeze-indicator');
    if (!indicador) return;
    indicador.classList.toggle('active', paginaCongelada && comandoLocal);
    indicador.textContent = paginaCongelada && comandoLocal ? textoIndicadorCongelamento : '';
}
function alternarCongelamento(local) {
    paginaCongelada = !paginaCongelada;
    comandoLocal = local;
    textoIndicadorCongelamento = 'Congelado';
    salvarEstadoCongelamento();
    atualizarIndicadorCongelamento();
    if (paginaCongelada) {
        clearInterval(intervaloAtualizacao);
        clearInterval(intervaloTrocaPainel);
    } else {
        iniciarAtualizacaoAutomatica();
        iniciarTrocaAutomaticaPainel();
    }
}
function alternarPainel() {
    painelAtual = proximoPainel(painelAtual);
    mostrarPainel(painelAtual);
}
function iniciarAtualizacaoAutomatica() {
    clearInterval(intervaloAtualizacao);
    intervaloAtualizacao = setInterval(carregarTop3, INTERVALO_ATUALIZACAO_MS);
}
function iniciarTrocaAutomaticaPainel() {
    clearInterval(intervaloTrocaPainel);
    intervaloTrocaPainel = setInterval(() => { if (!paginaCongelada) alternarPainel(); }, INTERVALO_TROCA_PAINEL_MS);
}

function configurarRealtime() {
    if (!channel) return;
    channel.on('broadcast', { event: 'refresh-values' }, payload => {
        if (payload.payload?.fromId !== DEVICE_ID) carregarTop3();
    }).on('broadcast', { event: 'toggle-freeze-others' }, payload => {
        if (payload.payload?.fromId !== DEVICE_ID) alternarCongelamento(false);
    }).on('broadcast', { event: 'switch-panel-others' }, payload => {
        if (payload.payload?.fromId !== DEVICE_ID && !paginaCongelada) alternarPainel();
    }).subscribe();
}

window.addEventListener('resize', ajustarEscala);
window.addEventListener('keydown', async event => {
    const tecla = event.key.toLowerCase();
    if (event.shiftKey && tecla === 'r') { event.preventDefault(); carregarTop3(); return; }
    if (event.shiftKey && tecla === 'p') { event.preventDefault(); alternarCongelamento(true); return; }
    if (event.shiftKey && tecla === 'a') { event.preventDefault(); alternarPainel(); return; }
    if ((event.ctrlKey || event.metaKey) && tecla === 'r') {
        event.preventDefault();
        await channel?.send({ type: 'broadcast', event: 'refresh-values', payload: { fromId: DEVICE_ID } });
    }
    if ((event.ctrlKey || event.metaKey) && tecla === 'p') {
        event.preventDefault();
        alternarCongelamento(true);
        await channel?.send({ type: 'broadcast', event: 'toggle-freeze-others', payload: { fromId: DEVICE_ID } });
    }
    if ((event.ctrlKey || event.metaKey) && tecla === 'a') {
        event.preventDefault();
        alternarPainel();
        await channel?.send({ type: 'broadcast', event: 'switch-panel-others', payload: { fromId: DEVICE_ID } });
    }
}, true);

const estadoSalvo = (() => { try { return localStorage.getItem(STORAGE_KEY) === 'true'; } catch { return false; } })();
paginaCongelada = estadoSalvo;
ajustarEscala();
mostrarPainel(painelAtual);
configurarRealtime();
if (!paginaCongelada) {
    iniciarAtualizacaoAutomatica();
    iniciarTrocaAutomaticaPainel();
}
carregarTop3();
