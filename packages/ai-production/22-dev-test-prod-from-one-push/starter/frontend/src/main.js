const API_URL = window.API_URL;
const sessionId = crypto.randomUUID();
const input = document.querySelector("#chat-input");
const log = document.querySelector("#chat-log");

function addBubble(who, text) {
  // TODO: make a <p>, give it the class `who`, set its textContent, append it to `log`
}

async function send() {
  // TODO 1: read and trim the input; stop if it is empty; clear the box; disable it
  // TODO 2: addBubble("you", text)
  // TODO 3: POST to API_URL + "/chat" with JSON { session_id: sessionId, message: text }
  // TODO 4: addBubble("twin", data.reply)
  // TODO 5: in a `finally` block, enable the box AGAIN and call input.focus().
  //         This is the bug Auntie Siti found: without it she cannot type the next message.
}

document.querySelector("#send-btn").addEventListener("click", send);
input.addEventListener("keydown", (e) => {
  if (e.key === "Enter") send();
});
