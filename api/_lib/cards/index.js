import activityGraph from './activity-graph.js';
import repoCard from './repo-card.js';
import starsBadge from './stars-badge.js';
import stats from './stats.js';
import streak from './streak.js';
import topLangs from './top-langs.js';
import trophies from './trophies.js';

// Every /api/github/<card> endpoint, keyed by the last path segment. They
// all deploy as one function (api/github/[card].js): Vercel's Hobby plan
// caps a deployment at 12 functions, and one file per card went past it.
export const CARD_HANDLERS = {
  'activity-graph': activityGraph,
  'repo-card': repoCard,
  'stars-badge': starsBadge,
  stats,
  streak,
  'top-langs': topLangs,
  trophies,
};
