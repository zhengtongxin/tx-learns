import type { AppProps } from "next/app";
import { ClerkProvider } from "@clerk/nextjs";
import "../styles/globals.css"; // added: create-next-app imports the styles here

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ClerkProvider {...pageProps}>
      <Component {...pageProps} />
    </ClerkProvider>
  );
}
