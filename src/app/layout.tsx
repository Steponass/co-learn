import type { Metadata } from "next";
import { Signika } from 'next/font/google';
import "./styles/css-reset.css";
import "./styles/variables.css";
import "./styles/fonts.css"
import "./styles/globals.css";
import { ThemeProvider } from "@/contexts/ThemeContext";

export const metadata: Metadata = {
  title: "Co-Learn",
  description: "Is good. I like, much.",
};

const signika = Signika({
  subsets: ['latin', 'latin-ext'], 
  weight: 'variable',
  axes: ['GRAD'],
  variable: '--font-signika',
  display: 'swap',
});


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={signika.variable}>
      <body>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
