const assert = require('assert');
const fs = require('fs');
const { chunkMarkdown } = require('./chunk.js');

const md = fs.readFileSync(__dirname + '/products.txt', 'utf8');
const chunks = chunkMarkdown(md);

assert.strictEqual(chunks.length, 5, 'one chunk per section when each is short');
assert.ok(chunks.every(c => c.text.startsWith(c.title + ': ')), 'every chunk starts with its title');
assert.ok(chunks.every(c => c.text.length <= 500), 'no chunk is longer than 500 characters');
assert.ok(chunks.find(c => c.title === 'City Bike Blue').text.includes('2 years on the frame'));

const long = '## Long\n' + 'This is a sentence about bikes. '.repeat(40);
const parts = chunkMarkdown(long, 200);
assert.ok(parts.length > 3, 'a long section is split');
assert.ok(parts.every(c => c.text.length <= 200), 'split pieces respect the limit');
console.log('ok: chunkMarkdown keeps titles and respects the size limit');
