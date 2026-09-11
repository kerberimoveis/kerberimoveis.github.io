import {
    CACHE_PLANILHAS_KEY,
    CACHE_DOCUMENTACOES_KEY,
    DOCUMENTACOES_PLANILHA_URL,
    PLANILHAS,
    TENTATIVAS_FETCH,
    TIME_LOGOS,
    TIMEOUT_FETCH_MS
} from './config.js';

export function detectCsvSeparator(csvText) {
    const primeiraLinha = csvText.split(/\r?\n/)[0] || '';
    const virgulas = (primeiraLinha.match(/,/g) || []).length;
    const pontoEVirgulas = (primeiraLinha.match(/;/g) || []).length;
    return pontoEVirgulas > virgulas ? ';' : ',';
}

export function parseCSVCompleto(csvText, separador) {
    const linhas = [];
    let linhaAtual = [];
    let campoAtual = '';
    let dentroDeAspas = false;

    for (let indice = 0; indice < csvText.length; indice += 1) {
        const caractere = csvText[indice];
        if (dentroDeAspas) {
            if (caractere === '"') {
                if (csvText[indice + 1] === '"') {
                    campoAtual += '"';
                    indice += 1;
                } else {
                    dentroDeAspas = false;
                }
            } else {
                campoAtual += caractere;
            }
            continue;
        }
        if (caractere === '"') dentroDeAspas = true;
        else if (caractere === separador) {
            linhaAtual.push(campoAtual.trim());
            campoAtual = '';
        } else if (caractere === '\n') {
            linhaAtual.push(campoAtual.trim());
            linhas.push(linhaAtual);
            linhaAtual = [];
            campoAtual = '';
        } else if (caractere !== '\r') campoAtual += caractere;
    }

    if (campoAtual.length || linhaAtual.length) {
        linhaAtual.push(campoAtual.trim());
        linhas.push(linhaAtual);
    }
    return linhas;
}

export function limparValorMonetario(valorCru) {
    const valor = String(valorCru || '').trim().replace(/R\$\s?/gi, '');
    if (!valor) return 0;
    const normalizado = valor.includes(',')
        ? valor.replace(/\./g, '').replace(',', '.')
        : valor.replace(/\s/g, '');
    return Number.parseFloat(normalizado) || 0;
}

function forCsvRows(csvText, rowHandler) {
    const separador = detectCsvSeparator(csvText);
    const linhas = parseCSVCompleto(csvText, separador);
    linhas.slice(1).forEach(columns => {
        if (columns.length && columns.some(valor => valor.trim())) rowHandler(columns);
    });
    return separador;
}

function extrairValorDaSegundaLinha(csvText, separador, indiceColuna) {
    const linhas = parseCSVCompleto(csvText, separador);
    return linhas[1]?.[indiceColuna] ? limparValorMonetario(linhas[1][indiceColuna]) : 0;
}

export function csvToArrays(csvText) {
    const itens = [];
    const separador = forCsvRows(csvText, columns => {
        const valorTexto = columns[1] || '0';
        const valorNum = limparValorMonetario(valorTexto);
        if (columns[0] && valorNum !== 0) {
            itens.push({ nome: columns[0], valorTexto, valorNum, foto: columns[2] || '' });
        }
    });
    return { itens, separador };
}

export function csvToCorretoresTodos(csvText, time) {
    const itens = [];
    forCsvRows(csvText, columns => {
        const nome = (columns[0] || '').trim();
        if (!nome) return;
        itens.push({
            nome,
            valorNum: limparValorMonetario(columns[1]),
            time,
            logo: TIME_LOGOS[time] || '',
            foto: (columns[2] || '').trim()
        });
    });
    return itens;
}

export function csvToSalesRanking(csvText) {
    const itens = [];
    const separador = forCsvRows(csvText, columns => {
        const nome = (columns[4] || '').trim();
        if (!nome) return;
        itens.push({
            nome,
            quantidade: Number.parseInt(columns[5], 10) || 0,
            foto: (columns[8] || '').trim(),
            vgv: limparValorMonetario(columns[9])
        });
    });
    return { itens, separador };
}

export function csvToDocumentacoes(csvText) {
    const separador = detectCsvSeparator(csvText);
    const linhas = parseCSVCompleto(csvText, separador);
    const nomes = linhas[0] || [];
    const indiceLinhaQuantidade = linhas.findIndex(linha =>
        (linha[0] || '').trim().toUpperCase() === 'PASTAS OK'
    );
    const quantidades = linhas[indiceLinhaQuantidade >= 0 ? indiceLinhaQuantidade : 13] || [];

    return nomes.reduce((itens, nomeCru, indice) => {
        const nome = (nomeCru || '').trim();
        if (!nome) return itens;
        const quantidadeTexto = (quantidades[indice] || '').trim();
        const quantidade = Number.parseInt(quantidadeTexto.replace(/[^\d-]/g, ''), 10) || 0;
        itens.push({ nome, quantidade, foto: `${nome}.jpeg` });
        return itens;
    }, []);
}

export function csvToVendasPorTime(csvText) {
    const separador = detectCsvSeparator(csvText);
    const linhas = parseCSVCompleto(csvText, separador);
    const cidades = linhas[15] || [];
    const quantidades = linhas[28] || [];
    const cidadesDosTimes = {
        ESPARTA: 'CANOAS',
        PERSA: 'VIAMÃO',
        CELTA: 'PORTO ALEGRE'
    };

    return Object.entries(cidadesDosTimes).reduce((vendas, [time, cidadeEsperada]) => {
        const indice = cidades.findIndex(cidade =>
            (cidade || '').trim().toUpperCase() === cidadeEsperada
        );
        const valor = indice >= 0 ? quantidades[indice] : '';
        vendas[time] = Number.parseInt(String(valor).replace(/[^\d-]/g, ''), 10) || 0;
        return vendas;
    }, {});
}

function lerCache(chave = CACHE_PLANILHAS_KEY) {
    try {
        return JSON.parse(localStorage.getItem(chave) || '{}');
    } catch {
        return {};
    }
}

function salvarCache(cache, chave = CACHE_PLANILHAS_KEY) {
    try {
        localStorage.setItem(chave, JSON.stringify(cache));
    } catch (error) {
        console.warn('Não foi possível salvar o cache das planilhas.', error);
    }
}

async function fetchComRetry(url) {
    let ultimoErro;
    for (let tentativa = 1; tentativa <= TENTATIVAS_FETCH; tentativa += 1) {
        const controlador = new AbortController();
        const timeout = setTimeout(() => controlador.abort(), TIMEOUT_FETCH_MS);
        try {
            const separadorUrl = url.includes('?') ? '&' : '?';
            const resposta = await fetch(`${url}${separadorUrl}cache=${Date.now()}`, {
                signal: controlador.signal,
                cache: 'no-store'
            });
            if (!resposta.ok) throw new Error(`HTTP ${resposta.status}`);
            return await resposta.text();
        } catch (error) {
            ultimoErro = error;
            if (tentativa < TENTATIVAS_FETCH) {
                await new Promise(resolve => setTimeout(resolve, tentativa * 1000));
            }
        } finally {
            clearTimeout(timeout);
        }
    }
    throw ultimoErro || new Error('Falha ao buscar planilha.');
}

export async function carregarPlanilhas() {
    const cache = lerCache();
    const resultados = await Promise.all(PLANILHAS.map(async planilha => {
        try {
            const texto = await fetchComRetry(planilha.url);
            return { ...planilha, texto, origem: 'online' };
        } catch (error) {
            const texto = cache[planilha.id];
            if (texto) {
                console.warn(`Planilha ${planilha.id} indisponível; usando cache local.`, error);
                return { ...planilha, texto, origem: 'cache' };
            }
            return { ...planilha, texto: '', origem: 'erro', erro: error };
        }
    }));

    const validas = resultados.filter(item => item.texto);
    if (!validas.length) throw new Error('Nenhuma planilha disponível.');
    validas.forEach(item => { cache[item.id] = item.texto; });
    salvarCache(cache);
    return resultados;
}

export async function carregarDocumentacoes() {
    if (!DOCUMENTACOES_PLANILHA_URL.trim()) return { documentacoes: [], vendasPorTime: {} };
    const cache = lerCache(CACHE_DOCUMENTACOES_KEY);
    try {
        const texto = await fetchComRetry(DOCUMENTACOES_PLANILHA_URL);
        cache.documentacoes = texto;
        salvarCache(cache, CACHE_DOCUMENTACOES_KEY);
        return {
            documentacoes: csvToDocumentacoes(texto),
            vendasPorTime: csvToVendasPorTime(texto)
        };
    } catch (error) {
        const texto = cache.documentacoes || '';
        if (texto) {
            console.warn('Planilha de documentações indisponível; usando cache local.', error);
            return {
                documentacoes: csvToDocumentacoes(texto),
                vendasPorTime: csvToVendasPorTime(texto)
            };
        }
        console.warn('Não foi possível carregar a planilha de documentações.', error);
        return { documentacoes: [], vendasPorTime: {} };
    }
}

export function normalizarDados(planilhas) {
    const textos = planilhas.map(item => item.texto || '');
    const resultados = textos.map(csvToArrays);
    const vgv = textos.map((texto, indice) => extrairValorDaSegundaLinha(texto, resultados[indice].separador, 3));
    const cef = textos.map((texto, indice) => extrairValorDaSegundaLinha(texto, resultados[indice].separador, 6));
    const corretores = planilhas.flatMap(item => csvToCorretoresTodos(item.texto, item.time));
    const vendas = planilhas.flatMap(item => csvToSalesRanking(item.texto).itens);
    return { vgv, cef, corretores, vendas, planilhas };
}
