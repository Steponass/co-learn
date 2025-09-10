import type { Metadata } from "next";
import { Signika } from "next/font/google";
import "./styles/css-reset.css";
import "./styles/variables.css";
import "./styles/fonts.css";
import "./styles/globals.css";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { SubtitleProvider } from "@/contexts/SubtitleContext";
import LayoutContent from "@/app/components/layout/LayoutContent";

export const metadata: Metadata = {
  title: "Co-Learn",
  description: "Is good. I like, much.",
  icons: {
    icon: "/favicon.png",
  },
  openGraph: {
    images: [
      { url: "/og-icon.png",
        width: 192,
        height: 192,
        alt: 'Co~Learn, your online tutoring platform',
      }
    ],
  },
};

const signika = Signika({
  subsets: ["latin", "latin-ext"],
  weight: "variable",
  axes: ["GRAD"],
  variable: "--font-signika",
  display: "swap",
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
          <SubtitleProvider>
            <LayoutContent>{children}</LayoutContent>
          </SubtitleProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
