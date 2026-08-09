import type { Metadata } from "next";
import { Manrope, Archivo } from "next/font/google";
import { ScrollToTop } from "@/components/layout/ScrollToTop";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Agile Begins — Live Workshop 001",
  description:
    "Practical workshops for ambitious students who want internships, projects, freelancing, and real career growth.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${manrope.variable} ${archivo.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <ScrollToTop />
        {children}
      </body>
    </html>
  );
}
