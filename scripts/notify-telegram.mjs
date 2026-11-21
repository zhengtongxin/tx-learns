#!/usr/bin/env node
// Sends a message to TX on Telegram. Text comes from the arguments, or stdin when there are none.
// Needs TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID. Without the chat id it only sends a setup tip
// (the chat id) to the latest person who messaged the bot, and never the notice itself.
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

try {
  const chat = process.env.TELEGRAM_CHAT_ID;
  if (chat) {
    const r = await api('sendMessage', { chat_id: chat, text, disable_web_page_preview: true });
    console.log(r.ok ? 'Telegram notice sent.' : `::warning::Telegram error: ${r.description}`);
  } else {
    // First-time setup only: reply to whoever messaged the bot last with their chat id, never the notice itself,
    // so a stranger who finds the bot cannot read PR summaries.
    const u = await api('getUpdates', { limit: 100 });
    const msgs = (u.result || []).map(x => x.message || x.edited_message).filter(Boolean);
    const last = msgs[msgs.length - 1];
    if (!last) {
      console.log('::warning::TELEGRAM_CHAT_ID is not set and nobody has messaged the bot yet. Send your bot a message.');
    } else {
      const id = String(last.chat.id);
      await api('sendMessage', { chat_id: id, text: `TX Learns setup: if this is you, add a repository secret TELEGRAM_CHAT_ID = ${id}. Notices start after that.` });
      console.log(`::warning::TELEGRAM_CHAT_ID is not set. Sent setup tip with chat id ${id} to the last person who messaged the bot.`);
    }
  }
} catch (e) {
  console.log(`::warning::Telegram error: ${e.message}`);
}
