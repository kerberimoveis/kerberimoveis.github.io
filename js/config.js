export const PLANILHAS = [
    {
        id: 1,
        url: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRzNtrrrqc63MiPQ88VaT7FAeczwujFdk8KiXSHXfoNRAf397iFHvw-iluIR1TkrNevow--QHIwbPH7/pub?gid=277533887&single=true&output=csv',
        time: 'ESPARTA'
    },
    {
        id: 2,
        url: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSlshA2wJmrhz2fjEU5x1Y9on1uVLiyJXjXuK7w9HZVhGx3waQJe6fGM0o_0NhnsAbZEqud4EwOMadV/pub?gid=539484592&single=true&output=csv',
        time: 'PERSA'
    },
    {
        id: 3,
        url: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTWO_PtLyJyb5Ua8fvOg1kiQC4COPwiB7KlPjaZ-h6Wl9Y9oydPPGvuSoht0ZV0b5R48ToJzK0ayObQ/pub?output=csv',
        time: 'CELTA'
    },
    {
        id: 4,
        url: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vR5V8xE3zzpfPSjEG35-nMssruDEqCFlQdINhuZclB-JUt5h4w7HSLG-r-jEHBX60cOg6-nA51tSeL3/pub?gid=277533887&single=true&output=csv',
        time: 'CELTA'
    }
];

// Cole aqui o link CSV publicado da planilha de documentações.
export const DOCUMENTACOES_PLANILHA_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTZ8Zq8xhAZZnLg843Pj_PM-7yGgDLQT_aK1Tn0JIlDQkG3EmYNV1VynNwIymgbePPH6VyuvaLGTk2A/pub?gid=1522343431&single=true&output=csv';

export const TIME_LOGOS = {
    ESPARTA: 'LOGO SPARTA.png',
    PERSA: 'LOGO PERSA.png',
    CELTA: 'LOGO CELTA.png'
};

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
