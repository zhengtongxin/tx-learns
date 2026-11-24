import { useState, FormEvent } from "react";
import {
  PricingTable,
  Protect,
  SignedIn,
  SignedOut,
  SignInButton,
  UserButton,
  useAuth,
} from "@clerk/nextjs";
import ReactMarkdown from "react-markdown";

export default function Home() {
  // Step 1: three fields and the output
  const [patientName, setPatientName] = useState("");
  const [visitDate, setVisitDate] = useState("");
  const [notes, setNotes] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState(""); // added: show 401 / 402 / 422 instead of a blank page
  const { getToken } = useAuth();

  // Step 4: send, then read the stream piece by piece
  async function submit(e: FormEvent) {
    e.preventDefault(); // added: stop the browser reloading the page on submit
    setError("");
    setOutput("");
    const token = await getToken(); // a fresh token for every request
    const res = await fetch("/api/consultation", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
      body: JSON.stringify({ patient_name: patientName, visit_date: visitDate, notes }),
    });
    if (!res.ok || !res.body) {
      // added: 401 = not signed in, 402 = free plan, 422 = bad form data
      setError("The server said " + res.status + ". Check you are signed in, subscribed and the form is filled.");
      return;
    }
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let text = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      text += decoder.decode(value, { stream: true });
      setOutput(text);
    }
  }

  return (
    <main className="mx-auto max-w-2xl p-8">
      <h1 className="text-2xl font-bold">Wharf clinic: consultation notes</h1>
      <p className="mb-4 text-sm text-red-700">Demo only. Never type real patient data into this page.</p>
      <SignedOut>
        <SignInButton mode="modal" />
      </SignedOut>
      <SignedIn>
        <UserButton />
        {/* Replace wharf_pro with YOUR plan slug from the dashboard */}
        <Protect plan="wharf_pro" fallback={<PricingTable />}>
          <form onSubmit={submit} className="mt-4 flex flex-col gap-3">
            <input
              required
              className="border p-2"
              placeholder="Patient name"
              value={patientName}
              onChange={(e) => setPatientName(e.target.value)}
            />
            <input
              required
              type="date"
              className="border p-2"
              value={visitDate}
              onChange={(e) => setVisitDate(e.target.value)}
            />
            <textarea
              required
              className="border p-2"
              rows={6}
              placeholder="Messy visit notes (invented data only)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
            <button className="rounded bg-black p-2 text-white" type="submit">
              Write it up
            </button>
          </form>
          {error && <p className="mt-4 text-red-700">{error}</p>}
          <div className="prose mt-6">
            <ReactMarkdown>{output}</ReactMarkdown>
          </div>
        </Protect>
      </SignedIn>
    </main>
  );
}
