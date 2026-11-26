// Cut a markdown product sheet into chunks, one section at a time.
// Each chunk starts with its section title, so it still makes sense on its own.
function chunkMarkdown(md, maxChars = 500) {
  const sections = md.split(/^## /m).slice(1); // drop anything before the first "## "
  const chunks = [];
  for (const section of sections) {
    const [title, ...rest] = section.split('\n');
    const body = rest.join(' ').replace(/\s+/g, ' ').trim();
    if (!body) continue;
    let current = '';
    for (const sentence of body.split(/(?<=[.!?])\s+/)) {
      if (current && (title + ': ' + current + ' ' + sentence).length > maxChars) {
        chunks.push({ title, text: title + ': ' + current });
        current = '';
      }
      current += (current ? ' ' : '') + sentence;
    }
    if (current) chunks.push({ title, text: title + ': ' + current });
  }
  return chunks;
}

module.exports = { chunkMarkdown };
