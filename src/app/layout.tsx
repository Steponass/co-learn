import type { Metadata } from "next";
import "./styles/css-reset.css";
import "./styles/variables.css";
import "./styles/fonts.css"
import "./styles/globals.css";
import { ThemeProvider } from "@/contexts/ThemeContext";
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
        <ThemeProvider>
          <Header />
          {children}
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  );
}
