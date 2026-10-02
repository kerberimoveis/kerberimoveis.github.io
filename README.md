
# Painel Comercial Kerber

Painel em tela cheia para exibir desempenho de corretores, VGV, vendas por construtora e informações operacionais em uma TV.

## Estrutura

- `index.html`: estrutura dos cinco painéis e elementos atualizados pelo JavaScript.
- `style.css`: dimensões da tela 1920x1080, tema visual e posicionamento dos elementos.
- `js/app.js`: inicialização, estado da tela, atalhos, rodízio e sincronização via Supabase.
- `js/config.js`: URLs, equipes, tempos, retry e chaves de armazenamento.
- `js/data.js`: fetch com timeout/retry, cache local, parser CSV e normalização dos dados.
- `js/ranking.js`: agregação, ordenação, formatação e renderização dos rankings.
- `js/panels.js`: registro e troca dos painéis.
- `FOTOS/`: fotos dos corretores.
- `LOGOS/`: logos das equipes e construtoras.

## Operação

Sirva a pasta por um servidor HTTP local ou publique-a em um host estático. Por exemplo, com Python:

```bash
python -m http.server 8000
```

Depois abra `http://localhost:8000`. Os dados são carregados das planilhas publicadas do Google Sheets e atualizados automaticamente. O uso de módulos ES exige HTTP; abrir o arquivo diretamente com `file://` pode ser bloqueado pelo navegador.

Atalhos disponíveis:

- `Shift + R`: atualiza os dados nesta tela.
- `Ctrl/Cmd + R`: solicita atualização remota dos dados.
- `Shift + P`: congela ou descongela esta tela.
- `Ctrl/Cmd + P`: congela ou descongela as demais telas.
- `Shift + A`: troca o painel nesta tela.
- `Ctrl/Cmd + A`: solicita a troca de painel nas demais telas.

O layout foi desenhado para uma tela de referência de 1920x1080 e é escalado para preencher a janela disponível.

As planilhas são buscadas com até três tentativas e timeout de 15 segundos. Quando uma fonte fica indisponível, o último CSV válido daquela fonte é usado a partir do cache local.

