import fs from 'fs';

const data = JSON.parse(fs.readFileSync(new URL('./problems.json', import.meta.url), 'utf8'));

const solutions = {
  'web-title-case': `const line = readLine();
print(line.split(" ").map(w => w[0].toUpperCase() + w.slice(1).toLowerCase()).join(" "));`,
  'web-anagrams': `const n = parseInt(readLine(), 10);
const words = readLine().split(" ").slice(0, n);
const groups = new Map();
for (const w of words) {
  const key = w.split("").sort().join("");
  if (!groups.has(key)) groups.set(key, []);
  groups.get(key).push(w);
}
const out = [...groups.values()].map(g => g.sort().join(" ")).sort((a, b) => (a.split(" ")[0] < b.split(" ")[0] ? -1 : 1));
print(out.join("\\n"));`,
};

function run(code, input) {
  const lines = input.split('\n');
  let cursor = 0;
  const out = [];
  const readLine = () => (cursor < lines.length ? lines[cursor++] : '');
  const print = (...args) => out.push(args.join(' '));
  new Function('readLine', 'print', code)(readLine, print);
  return out.join('\n');
}

let failures = 0, checked = 0;
for (const problem of data.problems) {
  const code = solutions[problem.id];
  if (!code) continue;
  checked++;
  problem.tests.forEach((test, i) => {
    let got;
    try { got = run(code, test.input); } catch (err) { got = 'RAISED: ' + err.message; }
    if (got.trim() !== test.expected.trim()) {
      failures++;
      console.log(`  MISMATCH ${problem.id} test ${i + 1}`);
      console.log('    input   ', JSON.stringify(test.input));
      console.log('    expected', JSON.stringify(test.expected));
      console.log('    got     ', JSON.stringify(got));
    }
  });
}
console.log('javascript problems checked:', checked, '| failures:', failures);
process.exit(failures ? 1 : 0);
