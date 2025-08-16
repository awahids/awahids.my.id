import { siteConfig } from "../data/site";

export function Footer() {
  return (
    <footer className="text-sm text-center py-6 text-muted-foreground">
      © {new Date().getFullYear()} {siteConfig.name}. All rights reserved.
    </footer>
  );
}
