"use client";
import { useState } from "react";

// Read the API address at build time (names starting with NEXT_PUBLIC_ reach the browser).
const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "";

export default function Twin() {
  const [sessionId] = useState(() => crypto.randomUUID());
  const [text, setText] = useState("");
  const [reply, setReply] = useState("");

  async function send() {
    // TODO 1: POST to `${API_BASE}/api/chat` with a JSON body { session_id, message }
    //         and the header Content-Type: application/json
    // TODO 2: read the JSON and call setReply(data.reply)
    // TODO 3: if the response is not ok, show a short error instead of a blank page
    setReply("TODO");
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
