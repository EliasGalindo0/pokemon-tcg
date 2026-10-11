import assert from "node:assert/strict";
import { cardNamesMatch, inferDeckName, namesCompatible, parseDeckList } from "../src/lib/deck-list";

const sample = `Pokémon: 17
4 Zorua do N JTG 97
4 Zoroark ex do N JTG 98
2 Munkidori TWM 95
1 Mega Absol ex MEG 86
1 Sigilyph do N JTG 64
1 Reshiram do N JTG 116
1 Zekrom do N ASC 151
1 Pecharunt ex SFA 39
1 Fezandipiti ex SFA 38
1 Yveltal SFA 35

Treinador: 35
4 Determinação da Lílian MEG 119
3 Ordem da Chefia PAL 172
2 Dom Secreto da Janine SFA 59
2 Cyrano SSP 170
1 Plano do N BLK 83
1 Treino de Faixa Preta PRE 96
1 Tramoias do Xerosic SFA 64
4 Puffin de Colega TEF 144
3 Poké Tablet ASC 198
3 PP Up do N JTG 153
2 Ultra Bola SVI 196
2 Maca Noturna SFA 61
1 Substituição de Energia SVI 173
1 Cartão Vermelho Especial MEG 128
1 Caixa Secreta TWM 163
2 Moti Vinculante PRE 95
2 Castelo do N JTG 152

Energia: 8
8 Energia de Escuridão Básica SVE 7

Total de Cartas: 60`;

const parsed = parseDeckList(sample);
assert.equal(parsed.lines.length, 28, `expected 28 lines, got ${parsed.lines.length}`);
assert.equal(parsed.lines.reduce((sum, line) => sum + line.quantity, 0), 60);
assert.equal(parsed.lines[0]?.name, "Zorua do N");
assert.equal(parsed.lines[0]?.setCode, "JTG");
assert.equal(parsed.lines[0]?.cardNumber, "97");
assert.equal(parsed.lines.at(-1)?.name, "Energia de Escuridão Básica");
assert.equal(parsed.lines.at(-1)?.setCode, "SVE");
assert.equal(parsed.lines.at(-1)?.cardNumber, "7");
assert.equal(inferDeckName(parsed.lines), "Zoroark ex do N");
assert.equal(cardNamesMatch("Energia de Escuridão Básica", "Energia de Escuridão"), true);
assert.equal(cardNamesMatch("Zekrom do N", "Dragonair"), false);
assert.equal(cardNamesMatch("Zorua do N", "N's Zorua"), true);
assert.equal(namesCompatible("Puffin de Colega", "Poffin de Colega"), true);
assert.equal(namesCompatible("Zekrom do N", "Dragonair"), false);
assert.equal(namesCompatible("Cartão Vermelho Especial", "Relógio Insólito"), false);

const exported = parseDeckList(`Baralho do N\n\nPokémon (8)\n4 Zorua do N\n4 Zoroark ex do N`);
assert.equal(exported.name, "Baralho do N");
assert.equal(exported.lines.length, 2);
assert.equal(exported.lines[0]?.setCode, null);

console.log("deck-list parser ok");
