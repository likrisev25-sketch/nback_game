// app/layout.tsx
import type { Metadata } from "next";
import { SessionProvider } from "@/lib/auth-client";
import { TrpcProvider } from "@/lib/trpc-provider";
import { Header } from "@/components/layout/Header";
import "./globals.css";

export const metadata: Metadata = {
  title: "N-Back Game - Соревновательный тренажёр памяти",
  description: "Тренажёр N-back с многопользовательским режимом и влиянием ошибок на скорость",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" className="scroll-smooth" suppressHydrationWarning>
      <body className="antialiased overflow-x-hidden flex flex-col min-h-screen" suppressHydrationWarning>
        <SessionProvider>
          <TrpcProvider>
            <Header />
            <main className="flex-1">
              {children}
            </main>
          </TrpcProvider>
        </SessionProvider>
      </body>
    </html>
  );
}