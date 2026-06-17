import type { Metadata } from "next";
import { Providers } from "@/components/providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "StableFlow AI | Celo Onchain Payroll Agent",
  description: "Manage global freelancers and execute automated stablecoin payroll on Celo using AI commands.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full bg-dark-bg text-black antialiased">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
