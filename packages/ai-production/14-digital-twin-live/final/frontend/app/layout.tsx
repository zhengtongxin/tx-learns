// added: the app router needs a root layout; create-next-app writes one for you.
export const metadata = { title: "Mei Ling's twin", description: "A demo digital twin" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "sans-serif", maxWidth: "36rem", margin: "2rem auto", padding: "0 1rem" }}>
        {children}
      </body>
    </html>
  );
}
