import "./globals.css";
import Navbar from "@/components/navbar";
import Hyperspeed from "@/components/bits/Hyperspeed";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-black text-foreground antialiased overflow-x-hidden">
        {/* Hyperspeed Background Layer */}
        <div className="fixed inset-0 z-0 pointer-events-none">
          <Hyperspeed />
        </div>

        {/* Content Layer */}
        <div className="relative z-10 flex flex-col min-h-screen">
          <Navbar />
          <main className="flex-grow pt-20">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}