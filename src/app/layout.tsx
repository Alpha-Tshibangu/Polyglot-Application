// src/app/layout.tsx
import { ClerkProvider } from "@clerk/nextjs";
import "@stream-io/video-react-sdk/dist/css/styles.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import ClientProvider from "./ClientProvider";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Polyglot Video Conferencing",
  description: "A multilingual video conferencing application",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={inter.className}>
          <ClientProvider>
            {children}
          </ClientProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}