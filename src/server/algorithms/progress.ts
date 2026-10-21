// A7: Readiness heuristic scoring constants
export const WEIGHT_MASTERY = 0.35;
export const WEIGHT_MATCH = 0.35;
export const WEIGHT_PIPELINE = 0.15;
export const WEIGHT_ADHERENCE = 0.15;
export const PIPELINE_TARGET_APPLICATIONS = 5;

export interface ReadinessInput {
  avgMastery: number;
  bestMatchScore: number;
  applicationsLast14d: number;
  tasksDone: number;
  tasksDue: number;
}

export interface ReadinessResult {
  score: number;
  components: {
    mastery: number;
    match: number;
    pipeline: number;
    adherence: number;
  };
}

function clamp01(x: number): number {
  return Math.min(1, Math.max(0, x));
}

// A7: Heuristic readiness composite calculation
export function readiness(input: ReadinessInput): ReadinessResult {
  const mastery = clamp01(input.avgMastery);
  const match = clamp01(input.bestMatchScore / 100);
  const pipeline = clamp01(Math.max(0, input.applicationsLast14d) / PIPELINE_TARGET_APPLICATIONS);
  const adherence =
    input.tasksDue <= 0
      ? 1.0
      : clamp01(Math.max(0, input.tasksDone) / input.tasksDue);

  const rawScore =
    100 *
    (WEIGHT_MASTERY * mastery +
      WEIGHT_MATCH * match +
      WEIGHT_PIPELINE * pipeline +
      WEIGHT_ADHERENCE * adherence);

  return {
    score: Math.round(rawScore),
    components: {
      mastery: Math.round(mastery * 1000) / 1000,
      match: Math.round(match * 1000) / 1000,
      pipeline: Math.round(pipeline * 1000) / 1000,
      adherence: Math.round(adherence * 1000) / 1000,
    },
  };
}

export const calculateReadiness = readiness;
