import type { Metadata } from "next";
import "./styles/css-reset.css";
import "./styles/globals.css"
import Header from "./components/layout/Header/Header";
import Footer from "./components/layout/Footer/Footer";

export const metadata: Metadata = {
  title: "Co-Learn",
  description: "Is good, I like much.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <Header />
        <main>
        {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
