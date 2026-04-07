import type { ReactNode } from "react";
import "./globals.css";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="sl">
      <body>
        <div className="page">
          <header className="site-header">
            <div className="brand">APIVaja</div>
            <div className="tagline">Simpl aplikacija za API demonstracijo</div>
          </header>
          <main className="content">{children}</main>
          <footer className="site-footer">Made for hitro oddajo</footer>
        </div>
      </body>
    </html>
  );
}
