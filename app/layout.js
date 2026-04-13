import "./globals.css";

export const metadata = {
  title: "Raid Guild Agent Web Starter",
  description: "Next.js starter with a SQLite todo tutorial for a Pinata-hosted agent."
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
