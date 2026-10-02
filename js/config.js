export const PLANILHAS = [
    {
        id: 2,
        url: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSlshA2wJmrhz2fjEU5x1Y9on1uVLiyJXjXuK7w9HZVhGx3waQJe6fGM0o_0NhnsAbZEqud4EwOMadV/pub?gid=539484592&single=true&output=csv',
        time: 'PERSA'
    }
];

// Cole aqui o link CSV publicado da planilha de documentações.
export const DOCUMENTACOES_PLANILHA_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTwyK_0HZdKbAVLLefusgym-eUkDR_UsmlaAf2XMHGCl2lfWWsdLMTgBgEIyQHR412E3SgSZ7s-eF6x/pub?gid=1522343431&single=true&output=csv';

export const TIME_LOGOS = {
    PERSA: 'LOGO PERSA.png'
};

export const PLACEHOLDER_LOGO = 'PLACEHOLDER LOGO.jpeg';

export const SUPABASE_CONFIG = {
    url: 'https://qpvwrheqwzzqynfyqgoq.supabase.co',
    anonKey: 'sb_publishable_pnz26qo9AP-jristVGo6CQ_dmFGamqP'
};

export const INTERVALO_ATUALIZACAO_MS = 600000;
export const INTERVALO_TROCA_PAINEL_MS = 60000;
export const TENTATIVAS_FETCH = 3;
export const TIMEOUT_FETCH_MS = 15000;
export const CACHE_PLANILHAS_KEY = 'ranking-planilhas-cache-v1';
export const CACHE_DOCUMENTACOES_KEY = 'ranking-documentacoes-cache-v1';
export const STORAGE_KEY = 'ranking-freeze-state';
