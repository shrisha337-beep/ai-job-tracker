export const ROLE_TAGS = [
  "sde",
  "frontend",
  "backend",
  "fullstack",
  "data",
  "ml",
  "mobile",
  "devops",
  "cloud",
  "qa",
  "security",
  "embedded",
  "product",
  "design",
] as const;

export type RoleTag = (typeof ROLE_TAGS)[number];
