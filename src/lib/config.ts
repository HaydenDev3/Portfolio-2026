export const siteConfig = {
  name: process.env.NEXT_PUBLIC_SITE_NAME || "Your Name",
  nameShort: process.env.NEXT_PUBLIC_SITE_NAME_SHORT || "Your Name",
  tagline: process.env.NEXT_PUBLIC_TAGLINE || "Web Developer",
  title: process.env.NEXT_PUBLIC_SITE_TITLE || "Your Name — Web Developer",
  description:
    process.env.NEXT_PUBLIC_SITE_DESCRIPTION ||
    "Full-stack web developer building modern websites for small businesses.",
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://yourdomain.com",
  email: process.env.NEXT_PUBLIC_EMAIL || "",
  calendly: process.env.NEXT_PUBLIC_CALENDLY || "",
  web3formsKey: process.env.NEXT_PUBLIC_WEB3FORMS_KEY || "",
  discordId: process.env.NEXT_PUBLIC_DISCORD_ID || "",
  discordUsername: process.env.NEXT_PUBLIC_DISCORD_USERNAME || "username",
  social: {
    github: process.env.NEXT_PUBLIC_GITHUB_URL || "https://github.com",
    instagram: process.env.NEXT_PUBLIC_INSTAGRAM_URL || "https://instagram.com",
    discord: `https://discord.com/users/${process.env.NEXT_PUBLIC_DISCORD_ID || ""}`,
  },
  location: process.env.NEXT_PUBLIC_LOCATION || "Your City, State",
  priceRange: process.env.NEXT_PUBLIC_PRICE_RANGE || "$300 - $2,500",
  copyright: process.env.NEXT_PUBLIC_COPYRIGHT || "Your Name",
  shareText:
    process.env.NEXT_PUBLIC_SHARE_TEXT ||
    `Check out ${process.env.NEXT_PUBLIC_SITE_NAME || "this developer"} — ${process.env.NEXT_PUBLIC_TAGLINE || "Web Developer"} 👋`,
  ogImage: "/og-image.png",
  headshot: "/portrait.png",  // Professional headshot featured in Story section; used for nav branding and user profile previews
  keywords: [
    process.env.NEXT_PUBLIC_SITE_NAME || "developer",
    "web developer",
    "freelance web developer",
    "small business websites",
    "Next.js developer",
  ],
};
