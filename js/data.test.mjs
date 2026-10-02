import test from 'node:test';
import assert from 'node:assert/strict';
import { csvToVendasPorTime, normalizarDados } from './data.js';

const csvPersa = `Nome,Valor,Foto\nJoão,1500,joao.jpeg\nMaria,2200,maria.jpeg`;
const csvCelta = `Nome,Valor,Foto\nPedro,3000,pedro.jpeg`;

test('normalizarDados filtra apenas o time PERSA', () => {
  const dados = normalizarDados([
    { texto: csvPersa, time: 'PERSA' },
    { texto: csvCelta, time: 'CELTA' }
  ]);

  assert.equal(dados.corretores.length, 2);
  assert.ok(dados.corretores.every(item => item.time === 'PERSA'));
  assert.equal(dados.vendas.length, 0);
});

test('csvToVendasPorTime retorna apenas a cidade de Viamão para o Persa', () => {
  const csv = `Cidade,Quantidade\nVIAMÃO,12\nCANOAS,7\nPORTO ALEGRE,5\n`;
  const resultado = csvToVendasPorTime(csv);

  assert.deepEqual(resultado, { PERSA: 12 });
});
