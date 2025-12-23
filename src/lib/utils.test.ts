import { describe, it, expect } from "vitest";
import { cn } from "./utils";

describe("cn", () => {
  it("merges truthy class names", () => {
    expect(cn("a", false && "b", "c")).toBe("a c");
  });

  it("dedupes tailwind classes using twMerge", () => {
    expect(cn("px-2", "px-4")).toBe("px-4");
  });
});

