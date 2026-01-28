"use client"

import * as React from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Github } from "lucide-react"

export default function Navbar() {
  const [scrolled, setScrolled] = React.useState(false)

  React.useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <nav className={cn(
      "fixed top-0 w-full z-50 transition-all duration-300 border-b",
      scrolled 
        ? "bg-white/70 dark:bg-black/70 backdrop-blur-md border-neutral-200 dark:border-neutral-800 py-3" 
        : "bg-transparent border-transparent py-5"
    )}>
      <div className="container mx-auto px-6 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold tracking-tighter">
          HRF<span className="text-purple-500">.</span>
        </Link>
        
        <div className="hidden md:flex items-center gap-8 text-sm font-medium">
          <Link href="/projects" className="hover:text-purple-500 transition-colors">Projects</Link>
          <Link href="/about" className="hover:text-purple-500 transition-colors">About</Link>
          <Link href="#contact" className="hover:text-purple-500 transition-colors">Contact</Link>
        </div>

        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <a href="https://github.com" target="_blank"><Github className="h-5 w-5" /></a>
          </Button>
          <Button className="rounded-full bg-purple-600 hover:bg-purple-700 text-white" onClick={() => window.location.href='/resume'}>
            Resume
          </Button>
        </div>
      </div>
    </nav>
  )
}