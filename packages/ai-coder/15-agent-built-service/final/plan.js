// Group tasks into waves that can run together.
// task: { id, deps: [ids], files: [paths] }
function planWaves(tasks) {
  const ids = new Set(tasks.map(t => t.id));
  for (const t of tasks) {
    for (const d of t.deps) {
      if (!ids.has(d)) throw new Error(`Unknown dependency "${d}" in task "${t.id}"`);
    }
  }

  const done = new Set();
  let left = tasks.slice();
  const waves = [];

  while (left.length > 0) {
    const ready = left.filter(t => t.deps.every(d => done.has(d)));
    if (ready.length === 0) throw new Error('Circular dependency among: ' + left.map(t => t.id).join(', '));

    // Within the ready tasks, keep only those whose files do not clash with an earlier pick.
    const wave = [];
    const used = new Set();
    for (const t of ready) {
      if (t.files.some(f => used.has(f))) continue;
      wave.push(t);
      t.files.forEach(f => used.add(f));
    }

    waves.push(wave.map(t => t.id));
    wave.forEach(t => done.add(t.id));
    left = left.filter(t => !done.has(t.id));
  }
  return waves;
}

module.exports = { planWaves };
