import type { AppProps } from "next/app";
import { ClerkProvider } from "@clerk/nextjs";
import "../styles/globals.css";

export default function App({ Component, pageProps }: AppProps) {
  // TODO: wrap <Component {...pageProps} /> in <ClerkProvider {...pageProps}>.
  // Hint: the provider quietly shares "who is signed in" with every page.
  return <Component {...pageProps} />;
}
