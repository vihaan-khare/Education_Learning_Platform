const fs = require('fs');
const symptomsCode = fs.readFileSync('src/utils/symptoms.ts', 'utf8');

// A crude way to extract arrays since ts-node might not be available
function getArray(name) {
  const regex = new RegExp(`export const ${name} = \\[([\\s\\S]*?)\\];`);
  const match = symptomsCode.match(regex);
  if (!match) throw new Error(`Could not find ${name}`);
  return eval('[' + match[1] + ']');
}

const visualWords = getArray('visualWords');
const dyslexiaWords = getArray('dyslexiaWords');
const adhdWords = getArray('adhdWords');
const autismWords = getArray('autismWords');

const currentInput = "My eyesight is quite blurry and I really struggle to read when the letters start jumping around";

const inputLower = currentInput.toLowerCase()
  .replace(/[\u2018\u2019\u201A\u201B\u2032\u2035]/g, "'")
  .replace(/[\u201C\u201D\u201E\u201F\u2033\u2036]/g, '"');

const score = (words) => words.filter(w => inputLower.includes(w)).length;

const visualScore = score(visualWords);
const adhdScore = score(adhdWords);
const autismScore = score(autismWords);
const learningScore = score(dyslexiaWords);

console.log('visualScore:', visualScore);
console.log('adhdScore:', adhdScore);
console.log('autismScore:', autismScore);
console.log('learningScore:', learningScore);

const otherScores = [
  ['adhd',     adhdScore,     '/adhd',     'ADHD'],
  ['autism',   autismScore,   '/autism',   'Autism'],
  ['learning', learningScore, '/dyslexia', 'Dyslexia'],
];
const topOther = otherScores.sort((a, b) => b[1] - a[1])[0];

console.log('topOther:', topOther);
console.log('Dual disability triggers?', visualScore >= 2 && topOther[1] >= 1);
