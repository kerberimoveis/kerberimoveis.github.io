import { TIME_LOGOS } from './config.js';

export function agregarSomandoValor(itens) {
    const mapa = new Map();
    const nomesComFiltro = ['ALEXANDRE', 'MICHELL', 'WELLIGTON'];

    itens.forEach(item => {
        const nome = (item.nome || '').trim();
        if (!nome) return;
        const time = (item.time || '').toUpperCase();
        const valor = Number.parseFloat(item.valorNum) || 0;
        if (nomesComFiltro.includes(nome.toUpperCase()) && valor <= 0) return;
        const chave = `${nome.toLowerCase()}|${time}`;
        const existente = mapa.get(chave);
        if (existente) {
            existente.valor += valor;
            if (!existente.foto && item.foto) existente.foto = item.foto.trim();
        } else {
            mapa.set(chave, {
                nome,
                valor,
                time,
                logo: TIME_LOGOS[time] || '',
                foto: (item.foto || '').trim()
            });
        }
    });
    return [...mapa.values()];
}

export function agregarSomandoQuantidade(itens) {
    const mapa = new Map();
    itens.forEach(item => {
        const nome = (item.nome || '').trim();
        if (!nome) return;
        const chave = nome.toLowerCase();
        const existente = mapa.get(chave);
        if (existente) {
            existente.quantidade += Number.parseInt(item.quantidade, 10) || 0;
            existente.vgv += Number.parseFloat(item.vgv) || 0;
            if (!existente.foto && item.foto) existente.foto = item.foto.trim();
        } else {
            mapa.set(chave, {
                nome,
                quantidade: Number.parseInt(item.quantidade, 10) || 0,
                vgv: Number.parseFloat(item.vgv) || 0,
                foto: (item.foto || '').trim()
            });
        }
    });
    return [...mapa.values()];
}

export function exibirRanking(agregados, opcoes) {
    const {
        listId,
        containerId,
        campoOrdenacao,
        formatarExibicao,
        itensPorColuna = 8,
        larguraColuna = 320,
        posicaoEsquerda = null
    } = opcoes;
    const lista = document.getElementById(listId);
    const container = document.getElementById(containerId);
    if (!lista || !container) return;

    const ordenados = [...agregados].sort((a, b) => {
        const diferenca = (b[campoOrdenacao] || 0) - (a[campoOrdenacao] || 0);
        return diferenca || (a.nome || '').localeCompare(b.nome || '', 'pt-BR', { sensitivity: 'base' });
    });
    const numeroColunas = Math.max(1, Math.ceil(ordenados.length / itensPorColuna));
    const larguraTotal = numeroColunas * larguraColuna + (numeroColunas - 1) * 10;
    container.style.display = ordenados.length ? 'block' : 'none';
    container.style.left = posicaoEsquerda === null
        ? `${Math.max(0, (1920 - larguraTotal) / 2)}px`
        : `${posicaoEsquerda}px`;
    container.style.width = `${larguraTotal}px`;
    lista.replaceChildren();

    for (let indiceColuna = 0; indiceColuna < numeroColunas; indiceColuna += 1) {
        const coluna = document.createElement('div');
        coluna.className = 'ranking-column';
        const itens = ordenados.slice(indiceColuna * itensPorColuna, (indiceColuna + 1) * itensPorColuna);
        itens.forEach((item, indiceItem) => {
            const posicao = indiceColuna * itensPorColuna + indiceItem + 1;
            const itemElemento = document.createElement('div');
            itemElemento.className = `ranking-item ${posicao <= 3 ? `top-${posicao}` : ''}`;
            if ((item[campoOrdenacao] || 0) > 0) {
                const posicaoElemento = document.createElement('div');
                posicaoElemento.className = 'ranking-position';
                posicaoElemento.textContent = `${posicao}º`;
                itemElemento.appendChild(posicaoElemento);
            }
            const info = document.createElement('div');
            info.className = 'ranking-info';
            const nome = document.createElement('div');
            nome.className = 'ranking-company';
            nome.textContent = item.nome || 'Sem nome';
            const valorTexto = formatarExibicao(item);
            info.append(nome);
            if (valorTexto) {
                const valor = document.createElement('div');
                valor.className = 'ranking-quantity';
                valor.textContent = valorTexto;
                info.appendChild(valor);
            }
            itemElemento.appendChild(info);
            if (item.logo) {
                const logo = document.createElement('img');
                logo.className = 'ranking-team-logo';
                logo.src = `LOGOS/${item.logo}`;
                logo.alt = `Logo ${item.time || 'time'}`;
                itemElemento.appendChild(logo);
            }
            coluna.appendChild(itemElemento);
        });
        lista.appendChild(coluna);
    }
}

export function formatarMoedaBRL(valor, fallback = 'R$ 0.000.000,00') {
    if (!valor || Number.isNaN(valor)) return fallback;
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}
