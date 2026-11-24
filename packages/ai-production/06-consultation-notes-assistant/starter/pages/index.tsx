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
  // TODO 1: add three more useState values: patientName, visitDate, notes (all start as "")
  const [output, setOutput] = useState("");
  const { getToken } = useAuth();

  async function submit(e: FormEvent) {
    e.preventDefault();
    // TODO 2: get a fresh token with await getToken()
    // TODO 3: fetch("/api/consultation") with method POST, header Content-Type: application/json,
    //         header Authorization: "Bearer " + token, and a JSON body
    //         { patient_name, visit_date, notes }
    // TODO 4: read res.body.getReader() in a loop, decode each piece with a TextDecoder
    //         ({ stream: true }) and call setOutput(text) every time
    // Hint: EventSource cannot POST or send headers, which is why we use fetch.
    setOutput("TODO");
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
        {/* TODO 5: wrap the form in <Protect plan="YOUR_PLAN_SLUG" fallback={<PricingTable />}> */}
        <form onSubmit={submit} className="mt-4 flex flex-col gap-3">
          {/* TODO 6: three required fields: a text input, an <input type="date"> and a <textarea>.
              Each needs value= and onChange= so the box and its variable stay in step. */}
          <button className="rounded bg-black p-2 text-white" type="submit">
            Write it up
          </button>
        </form>
        <div className="prose mt-6">
          <ReactMarkdown>{output}</ReactMarkdown>
        </div>
      </SignedIn>
    </main>
  );
}
