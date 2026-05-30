export const PILLARS = [
  { id: "dsa", name: "DSA", color: "#6366f1", icon: "Code2" },
  { id: "cs-fundamentals", name: "CS Fundamentals", color: "#8b5cf6", icon: "Cpu" },
  { id: "system-design", name: "System Design (HLD/LLD/SD)", color: "#ec4899", icon: "Network" },
  { id: "database", name: "Database Optimization", color: "#14b8a6", icon: "Database" },
  { id: "concurrency", name: "Concurrency", color: "#f59e0b", icon: "GitBranch" },
  { id: "api", name: "APIs (gRPC/REST/GraphQL)", color: "#3b82f6", icon: "Globe" },
  { id: "resilience-scale", name: "Resilience & Scale", color: "#ef4444", icon: "Shield" },
  { id: "behavioral", name: "STAR & Estimation", color: "#22c55e", icon: "MessageSquare" },
] as const;

export type PillarId = (typeof PILLARS)[number]["id"];

export const PILLAR_IDS = PILLARS.map((p) => p.id);

export const ALIASES: Record<string, PillarId> = {
  dsa: "dsa",
  "cs fundamental": "cs-fundamentals",
  "cs fundamentals": "cs-fundamentals",
  cs: "cs-fundamentals",
  hld: "system-design",
  lld: "system-design",
  sd: "system-design",
  "system design": "system-design",
  database: "database",
  "database optimization": "database",
  concurrency: "concurrency",
  api: "api",
  grpc: "api",
  rest: "api",
  graphql: "api",
  resilience: "resilience-scale",
  scale: "resilience-scale",
  "resilience and scale": "resilience-scale",
  star: "behavioral",
  estimation: "behavioral",
  guess: "behavioral",
};

export function resolvePillar(input: string): PillarId | null {
  const key = input.trim().toLowerCase();
  if (PILLAR_IDS.includes(key as PillarId)) return key as PillarId;
  return ALIASES[key] ?? null;
}
