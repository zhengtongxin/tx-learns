"use client";
import { useState } from "react";

// Read the API address at build time (names starting with NEXT_PUBLIC_ reach the browser).
// Empty means "same address as this page".
const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "";

export default function Twin() {
  const [sessionId] = useState(() => crypto.randomUUID()); // a refresh starts a new session
  const [text, setText] = useState("");
  const [reply, setReply] = useState("");

  async function send() {
    try {
      const res = await fetch(`${API_BASE}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId, message: text }),
      });
      if (!res.ok) throw new Error("status " + res.status); // added: show failures instead of a blank page
      const data = await res.json();
      setReply(data.reply);
      setText(""); // added: clear the box for the next message
    } catch (err) {
      setReply("Sorry, the twin could not answer (" + String(err) + ").");
    }
  }

  return (
    <main>
      <h1>Ask Mei Ling&apos;s twin</h1>
      <input value={text} onChange={(e) => setText(e.target.value)} />
      <button onClick={send}>Send</button>
      <p>{reply}</p>
    </main>
  );
}
