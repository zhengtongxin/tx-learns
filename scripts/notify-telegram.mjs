#!/usr/bin/env node
// Sends a message to TX on Telegram. Text comes from the arguments, or stdin when there are none.
// Needs TELEGRAM_BOT_TOKEN. TELEGRAM_CHAT_ID is optional: without it the script uses the chat of the
// latest message sent to the bot (Telegram keeps those for 24 hours), and tells you the id to save.
// Never fails the workflow: a missing token or a Telegram error only prints a warning.
const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) { console.log('::warning::TELEGRAM_BOT_TOKEN is not set, skipping Telegram notice'); process.exit(0); }

let text = process.argv.slice(2).join(' ');
if (!text) { const chunks = []; for await (const c of process.stdin) chunks.push(c); text = Buffer.concat(chunks).toString(); }
text = text.trim().slice(0, 3900);
if (!text) process.exit(0);

const api = (m, body) => fetch(`https://api.telegram.org/bot${token}/${m}`, {
  method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body || {}),
}).then(r => r.json());

let chat = process.env.TELEGRAM_CHAT_ID;
let found = false;
if (!chat) {
  const u = await api('getUpdates', { limit: 100 });
  const msgs = (u.result || []).map(x => x.message || x.edited_message || x.channel_post).filter(Boolean);
  chat = msgs.length ? String(msgs[msgs.length - 1].chat.id) : '';
  found = !!chat;
}
if (!chat) { console.log('::warning::No Telegram chat found. Send your bot a message, or set the TELEGRAM_CHAT_ID secret.'); process.exit(0); }
if (found) {
  text += `\n\n(Setup tip: add a repository secret TELEGRAM_CHAT_ID = ${chat} so notices keep working after 24 hours.)`;
  console.log(`::notice::Telegram chat id is ${chat}. Save it as the TELEGRAM_CHAT_ID secret.`);
}
const r = await api('sendMessage', { chat_id: chat, text, disable_web_page_preview: true });
console.log(r.ok ? 'Telegram notice sent.' : `::warning::Telegram error: ${r.description}`);
