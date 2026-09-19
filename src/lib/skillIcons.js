const SKILLICONS_URL = 'https://skillicons.dev/icons';
const ICONS_PER_LINE = 10;

// `id` is skillicons.dev's own icon key, so adding a row here is all it takes.
export const SKILL_GROUPS = [
  {
    label: 'Languages',
    icons: [
      ['js', 'JavaScript'], ['ts', 'TypeScript'], ['php', 'PHP'], ['go', 'Go'], ['py', 'Python'],
      ['java', 'Java'], ['kotlin', 'Kotlin'], ['cs', 'C#'], ['cpp', 'C++'], ['c', 'C'],
      ['rust', 'Rust'], ['ruby', 'Ruby'], ['dart', 'Dart'], ['swift', 'Swift'], ['bash', 'Bash'],
    ],
  },
  {
    label: 'Frontend',
    icons: [
      ['html', 'HTML'], ['css', 'CSS'], ['react', 'React'], ['nextjs', 'Next.js'], ['vue', 'Vue'],
      ['nuxtjs', 'Nuxt'], ['angular', 'Angular'], ['svelte', 'Svelte'], ['tailwind', 'Tailwind'],
      ['bootstrap', 'Bootstrap'], ['sass', 'Sass'], ['redux', 'Redux'], ['jquery', 'jQuery'],
      ['vite', 'Vite'], ['webpack', 'Webpack'], ['babel', 'Babel'], ['gulp', 'Gulp'],
    ],
  },
  {
    label: 'Backend',
    icons: [
      ['nodejs', 'Node.js'], ['nestjs', 'NestJS'], ['express', 'Express'], ['laravel', 'Laravel'],
      ['django', 'Django'], ['flask', 'Flask'], ['fastapi', 'FastAPI'], ['spring', 'Spring'],
      ['rails', 'Rails'], ['graphql', 'GraphQL'], ['prisma', 'Prisma'], ['wordpress', 'WordPress'],
    ],
  },
  {
    label: 'Databases',
    icons: [
      ['postgres', 'PostgreSQL'], ['mysql', 'MySQL'], ['mongodb', 'MongoDB'], ['redis', 'Redis'],
      ['sqlite', 'SQLite'], ['supabase', 'Supabase'], ['firebase', 'Firebase'],
      ['elasticsearch', 'Elasticsearch'],
    ],
  },
  {
    label: 'DevOps & cloud',
    icons: [
      ['docker', 'Docker'], ['kubernetes', 'Kubernetes'], ['nginx', 'Nginx'], ['linux', 'Linux'],
      ['ubuntu', 'Ubuntu'], ['aws', 'AWS'], ['gcp', 'Google Cloud'], ['azure', 'Azure'],
      ['vercel', 'Vercel'], ['netlify', 'Netlify'], ['cloudflare', 'Cloudflare'], ['heroku', 'Heroku'],
      ['githubactions', 'GitHub Actions'], ['jenkins', 'Jenkins'], ['terraform', 'Terraform'],
      ['ansible', 'Ansible'], ['grafana', 'Grafana'], ['kafka', 'Kafka'], ['rabbitmq', 'RabbitMQ'],
      ['sentry', 'Sentry'],
    ],
  },
  {
    label: 'Tools',
    icons: [
      ['git', 'Git'], ['github', 'GitHub'], ['gitlab', 'GitLab'], ['bitbucket', 'Bitbucket'],
      ['vscode', 'VS Code'], ['androidstudio', 'Android Studio'], ['postman', 'Postman'],
      ['figma', 'Figma'], ['notion', 'Notion'], ['npm', 'npm'], ['yarn', 'Yarn'], ['pnpm', 'pnpm'],
      ['bun', 'Bun'], ['jest', 'Jest'], ['flutter', 'Flutter'], ['unity', 'Unity'], ['blender', 'Blender'],
    ],
  },
].map((group) => ({ ...group, icons: group.icons.map(([id, label]) => ({ id, label })) }));

export const DEFAULT_SKILL_IDS = [
  'ts', 'js', 'react', 'nextjs', 'vue', 'nodejs', 'nestjs', 'express', 'laravel', 'php', 'go',
  'postgres', 'mysql', 'mongodb', 'prisma', 'redis', 'docker', 'nginx', 'vercel', 'cloudflare',
  'git', 'github', 'vscode', 'postman',
];

const KNOWN_IDS = new Set(SKILL_GROUPS.flatMap((group) => group.icons.map((icon) => icon.id)));

export const isSkillIcon = (id) => KNOWN_IDS.has(id);
export const skillIconUrl = (id) => `${SKILLICONS_URL}?i=${encodeURIComponent(id)}`;
export const skillIconsBannerUrl = (ids) => `${SKILLICONS_URL}?i=${ids.join(',')}&perline=${ICONS_PER_LINE}`;
