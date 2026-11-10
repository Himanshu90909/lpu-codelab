import fs from 'fs';
const src = fs.readFileSync(new URL('../assets/problems.js', import.meta.url), 'utf8');
const win = {};
new Function('window', src)(win);
const out = { courses: win.CODELAB_COURSES, labs: win.CODELAB_LABS, problems: win.CODELAB_PROBLEMS.map(p => ({
  id: p.id, lab: p.lab, title: p.title, tests: p.tests, starter: p.starter })) };
fs.writeFileSync(new URL('./problems.json', import.meta.url), JSON.stringify(out, null, 1));
const ids = out.problems.map(p => p.id);
console.log('problems:', ids.length, '| tests:', out.problems.reduce((a, p) => a + p.tests.length, 0));
const dup = ids.filter((v, i) => ids.indexOf(v) !== i);
console.log('duplicate ids:', dup);
const labs = new Set(out.labs.map(l => l.id));
console.log('unknown lab refs:', out.problems.filter(p => !labs.has(p.lab)).map(p => p.id));
