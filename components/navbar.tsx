import Link from "next/link";
import { siteConfig } from "../data/site";
import { ThemeToggle } from "./theme-toggle";

export function Navbar() {
  return (
    <header className="fixed top-0 w-full backdrop-blur bg-background/70 z-50">
      <nav className="container mx-auto flex items-center justify-between p-4">
        <Link href="/" className="font-bold text-xl">
          {siteConfig.name}
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/projects" className="hover:text-accent focus:outline-none focus:ring-2 focus:ring-accent rounded">
            Projects
          </Link>
          <Link href="/about" className="hover:text-accent focus:outline-none focus:ring-2 focus:ring-accent rounded">
            About
          </Link>
          <Link href="/contact" className="hover:text-accent focus:outline-none focus:ring-2 focus:ring-accent rounded">
            Contact
          </Link>
          <ThemeToggle />
        </div>
      </nav>
    </header>
  );
}
