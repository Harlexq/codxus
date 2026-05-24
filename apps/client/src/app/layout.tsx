import "./globals.css";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";
import { AppProvider } from "@/providers";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn("font-sans dark", geist.variable)}>
      <body>
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  );
}
