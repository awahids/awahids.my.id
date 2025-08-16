export const siteConfig = {
  name: "{{nama}}",
  role: "{{role}}",
  headline: "{{headline}}",
  subheadline: "{{subheadline}}",
  bio: "{{bio}}",
  email: "{{email}}",
  avatarUrl: "{{avatar_url}}",
  accentHex: "{{accent_hex}}",
  links: {
    github: "https://github.com/{{nama}}",
    linkedin: "https://www.linkedin.com/in/{{nama}}",
  },
};

export type SiteConfig = typeof siteConfig;
