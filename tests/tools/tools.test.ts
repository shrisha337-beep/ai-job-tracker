import { describe, it, expect } from "vitest";
import { tools, toolsByName, getTool } from "@/server/tools";
import { ROLE_TAGS } from "@/lib/role-tags";

describe("Tool Registry (src/server/tools.ts)", () => {
  const expectedToolNames = [
    "resume_analyzer",
    "internship_search",
    "tracker_add",
    "tracker_list",
    "study_plan",
    "dsa_next",
    "dsa_evaluate",
    "progress_summary",
  ];

  it("registers exactly the 8 required tools in the master list", () => {
    expect(tools.length).toBe(8);
    const names = tools.map((t) => t.name);
    for (const expected of expectedToolNames) {
      expect(names).toContain(expected);
    }
  });

  it("indexes each tool in toolsByName and getTool() returns them", () => {
    expect(toolsByName.size).toBe(8);
    for (const name of expectedToolNames) {
      const tool = getTool(name);
      expect(tool).toBeDefined();
      expect(tool?.name).toBe(name);
      expect(typeof tool?.description).toBe("string");
      expect(tool?.description.length).toBeGreaterThan(20);
      expect(tool?.inputSchema).toBeDefined();
      expect(typeof tool?.handler).toBe("function");
    }
  });

  describe("Input schema validations and clamping", () => {
    it("validates study_plan parameters (days 1-30, hoursPerDay 0.5-12)", () => {
      const tool = getTool("study_plan")!;
      // Valid cases
      expect(tool.inputSchema.safeParse({ days: 14, hoursPerDay: 2.5 }).success).toBe(true);
      expect(tool.inputSchema.safeParse({ days: 1, hoursPerDay: 0.5 }).success).toBe(true);
      expect(tool.inputSchema.safeParse({ days: 30, hoursPerDay: 12 }).success).toBe(true);
      expect(tool.inputSchema.safeParse({}).success).toBe(true);

      // Invalid cases
      expect(tool.inputSchema.safeParse({ days: 0 }).success).toBe(false);
      expect(tool.inputSchema.safeParse({ days: 31 }).success).toBe(false);
      expect(tool.inputSchema.safeParse({ hoursPerDay: 0.2 }).success).toBe(false);
      expect(tool.inputSchema.safeParse({ hoursPerDay: 13 }).success).toBe(false);
    });

    it("validates internship_search role tags using ROLE_TAGS", () => {
      const tool = getTool("internship_search")!;
      expect(tool.inputSchema.safeParse({ targetRoles: ["sde", "backend"] }).success).toBe(true);
      expect(tool.inputSchema.safeParse({ targetRoles: ["invalid_role_not_in_tags"] }).success).toBe(false);
      expect(tool.inputSchema.safeParse({ minStipend: 25000, mode: "REMOTE", limit: 5 }).success).toBe(true);
      expect(tool.inputSchema.safeParse({ limit: 20 }).success).toBe(false); // max 10
    });

    it("validates tracker_add requires listingId and enforces status enum", () => {
      const tool = getTool("tracker_add")!;
      expect(tool.inputSchema.safeParse({ listingId: "list-123" }).success).toBe(true);
      expect(tool.inputSchema.safeParse({ listingId: "list-123", status: "APPLIED" }).success).toBe(true);
      expect(tool.inputSchema.safeParse({ listingId: "" }).success).toBe(false);
      expect(tool.inputSchema.safeParse({ listingId: "list-123", status: "INVALID_STATUS" }).success).toBe(false);
    });

    it("validates dsa_evaluate requires questionId, non-empty answer, and max 4000 characters", () => {
      const tool = getTool("dsa_evaluate")!;
      expect(tool.inputSchema.safeParse({ questionId: "q-1", answer: "two pointer approach" }).success).toBe(true);
      expect(tool.inputSchema.safeParse({ questionId: "q-1" }).success).toBe(false);
      expect(tool.inputSchema.safeParse({ answer: "two pointer" }).success).toBe(false);

      // Max 4000 boundary check
      const valid4000 = "a".repeat(4000);
      expect(tool.inputSchema.safeParse({ questionId: "q-1", answer: valid4000 }).success).toBe(true);
      const invalid4001 = "a".repeat(4001);
      expect(tool.inputSchema.safeParse({ questionId: "q-1", answer: invalid4001 }).success).toBe(false);
    });

    it("ensures userId passed in args is ignored or stripped for all 8 tools", () => {
      const toolValidArgs: Record<string, Record<string, unknown>> = {
        resume_analyzer: {},
        internship_search: {},
        tracker_add: { listingId: "sample-list-id" },
        tracker_list: {},
        study_plan: {},
        dsa_next: {},
        dsa_evaluate: { questionId: "q-123", answer: "code sample" },
        progress_summary: {},
      };

      for (const tool of tools) {
        const payload = { ...toolValidArgs[tool.name], userId: "attacker-spoofed-id" };
        const parsed: any = tool.inputSchema.parse(payload);
        expect(parsed.userId).toBeUndefined();
      }
    });
  });
});
