// The journey: towns in order, each with its lessons. Add a town by adding a file and a line here.
import skopje from "./skopje.js";
import ohrid from "./ohrid.js";
import bitola from "./bitola.js";

export const TOWNS = [
  { id: "skopje", mk: "Скопје", en: "Skopje", level: "A1", line: { mk: "Елена пристигнува во главниот град.", en: "Elena arrives in the capital." }, lessons: skopje },
  { id: "ohrid", mk: "Охрид", en: "Ohrid", level: "A1", line: { mk: "Една недела на езерото.", en: "A week by the lake." }, lessons: ohrid },
  { id: "bitola", mk: "Битола", en: "Bitola", level: "A1", line: { mk: "Кафе на Широк сокак со нови пријатели.", en: "Coffee on Širok Sokak with new friends." }, lessons: bitola },
];
export const COMING = [
  { id: "strumica", mk: "Струмица", en: "Strumica", line: { mk: "Пазар полн со бои и вкусна храна.", en: "A market full of colour and good food." } },
];

export const LESSONS = TOWNS.flatMap((t, ti) => t.lessons.map((l, li) => ({ ...l, town: t, townIndex: ti, index: li })));
export const lessonById = (id) => LESSONS.find((l) => l.id === id);

// Level test: questions get harder; two mistakes end the test.
// `town` = the town whose content the question checks. Every question of a town right = that town can be skipped.
export const PLACEMENT = [
  { town: 0, q: "Здраво!", en: "What does this word mean?", o: ["Hello!", "Thank you!", "Goodbye!", "Please!"] },
  { town: 0, q: "Како се викате?", en: "What does this question mean?", o: ["What's your name? (polite)", "Where do you live?", "How old are you?", "How are you?"] },
  { town: 0, q: "Јас ___ од Англија.", en: "I am from England.", o: ["сум", "си", "е", "сме"] },
  { town: 0, q: "Елена е ___. (гладен)", en: "Elena is hungry.", o: ["гладна", "гладен", "гладно", "гладни"] },
  { town: 1, q: "Денес е петок. Утре е…", en: "Today is Friday. Tomorrow is…", o: ["сабота", "четврток", "недела", "среда"] },
  { town: 1, q: "Тие ___ три мачки.", en: "They have three cats.", o: ["имаат", "имаме", "има", "немам"] },
  { town: 1, q: "47 = ?", en: "How do you say 47?", o: ["четириесет и седум", "седумдесет и четири", "четиринаесет и седум", "четириесет и осум"] },
  { town: 2, q: "Капата е ___. (зелен)", en: "The cap is green.", o: ["зелена", "зелен", "зелено", "зелени"] },
  { town: 2, q: "___ живееш? — Во Битола.", en: "Where do you live? — In Bitola.", o: ["Каде", "Кога", "Зошто", "Колку"] },
  { town: 2, q: "Книгата е нова. → ___ е нова.", en: "Replace ‘the book’ with a pronoun.", o: ["Таа", "Тој", "Тоа", "Тие"] },
];
