const API_URL = window.API_URL; // changed: the lesson typed the address here; now deploy.sh supplies it
const sessionId = crypto.randomUUID(); // added: so the twin can remember this visitor
const input = document.querySelector("#chat-input");
const log = document.querySelector("#chat-log");

function addBubble(who, text) {
  const p = document.createElement("p");
  p.className = who;
  p.textContent = text;
  log.append(p);
}

async function send() {
  const text = input.value.trim();
  if (!text) return;
  input.value = "";
  input.disabled = true;
  addBubble("you", text);
  try {
    const r = await fetch(API_URL + "/chat", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ session_id: sessionId, message: text }), // added: session_id
    });
    const data = await r.json();
    addBubble("twin", data.reply);
  } catch (err) {
    addBubble("twin", "Sorry, I could not answer just now."); // added: show failures
  } finally {
    input.disabled = false;
    input.focus(); // the fix: give the cursor back
  }
}

document.querySelector("#send-btn").addEventListener("click", send);
input.addEventListener("keydown", (e) => {
  if (e.key === "Enter") send();
});
