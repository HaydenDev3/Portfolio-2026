import { Github, Instagram, Mail, Calendar, MessageCircle, Globe, ArrowUpRight } from "lucide-react";
import { siteConfig } from "@/lib/config";

const footerLinks = [
  {
    title: "Navigate",
    links: [
      { label: "Home", href: "/" },
      { label: "Work", href: "#work" },
      { label: "Websites", href: "/websites" },
      { label: "Hire Me", href: "/hire-web-developer" },
      { label: "Forum", href: "/forum" },
      { label: "Contact", href: "#contact" },
    ],
  },
  {
    title: "Services",
    links: [
      { label: "Essential $300", href: "/hire-web-developer#pricing" },
      { label: "Growth $600", href: "/hire-web-developer#pricing" },
      { label: "Premium $1,200", href: "/hire-web-developer#pricing" },
      { label: "Maintenance $25/mo", href: "/hire-web-developer#pricing" },
    ],
  },
];

const socials = [
  { label: "GitHub", href: siteConfig.social.github, icon: Github },
  { label: "Instagram", href: siteConfig.social.instagram, icon: Instagram },
  { label: "Discord", href: siteConfig.social.discord, icon: MessageCircle },
  { label: "Email", href: `mailto:${siteConfig.email}`, icon: Mail },
  { label: "Book a Call", href: `https://calendly.com/${siteConfig.calendly}`, icon: Calendar },
];

export default function Footer() {
  const s = siteConfig;

  return (
    <footer className="relative z-10 border-t border-white/[0.04] bg-gradient-to-b from-transparent via-slate-950/30 to-slate-950/50">
      <div className="max-w-6xl mx-auto px-5 md:px-6 py-10 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-12">
          {/* Brand */}
          <div className="md:col-span-1">
            <a
              href="/"
              className="text-lg font-bold text-white tracking-tight hover:opacity-80 transition-opacity inline-block mb-3"
            >
              {s.nameShort.split(".")[0]}
              <span className="text-blue-500">.</span>
              {s.nameShort.includes(".") ? s.nameShort.split(".").slice(1).join(".") : ""}
            </a>
            <p className="text-sm text-zinc-600 leading-relaxed max-w-xs">
              {s.tagline}. Building modern websites for Australian small businesses.
            </p>
            <p className="text-xs text-zinc-700 mt-3">
              {s.location}
            </p>
          </div>

          {/* Link columns */}
          {footerLinks.map((col) => (
            <div key={col.title}>
              <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-4 font-space">
                {col.title}
              </h3>
              <ul className="space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-sm text-zinc-600 hover:text-zinc-300 transition-colors duration-200 inline-flex items-center gap-1 group"
                    >
                      {link.label}
                      {link.href.startsWith("http") && (
                        <ArrowUpRight size={12} className="opacity-0 -translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all" />
                      )}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Social */}
          <div>
            <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-4 font-space">
              Connect
            </h3>
            <div className="flex flex-wrap gap-2.5">
              {socials.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target={social.href.startsWith("mailto") ? undefined : "_blank"}
                  rel="noopener noreferrer"
                  aria-label={social.label}
                  className="w-10 h-10 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center text-zinc-500 hover:text-blue-400 hover:border-blue-500/30 hover:bg-blue-500/10 transition-all duration-200"
                >
                  <social.icon size={18} />
                </a>
              ))}
            </div>
            <p className="text-xs text-zinc-700 mt-4 leading-relaxed">
              Based in {s.location}.<br />
              Available for remote work Australia-wide.
            </p>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 md:mt-16 pt-6 border-t border-white/[0.04] flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-zinc-700">
            &copy; {new Date().getFullYear()} {s.copyright}. All rights reserved.
          </p>
          <div className="flex items-center gap-4 text-xs text-zinc-700">
            <a href="/sitemap.xml" className="hover:text-zinc-400 transition-colors">
              Sitemap
            </a>
            <a href="/robots.txt" className="hover:text-zinc-400 transition-colors">
              Robots
            </a>
            <span>
              Built with Next.js
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
