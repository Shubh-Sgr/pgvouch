import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { VERSION } from "../../src/version.js";

// The release workflow publishes server.json to the MCP Registry as it is committed, and the
// registry rejects it unless it names the npm package that was just released. Keep them in step.
const read = (file: string) => JSON.parse(readFileSync(new URL(`../../${file}`, import.meta.url), "utf8"));
const pkg = read("package.json");
const server = read("server.json");

describe("server.json (MCP Registry entry)", () => {
  it("has the registry name the npm package declares", () => {
    expect(server.name).toBe(pkg.mcpName);
  });

  it("lists the version being released", () => {
    expect(server.version).toBe(pkg.version);
    expect(server.packages.map((p: { version: string }) => p.version)).toEqual([pkg.version]);
    expect(VERSION).toBe(pkg.version);
  });

  it("starts this npm package as an MCP server over stdio", () => {
    const [p] = server.packages;
    expect(p).toMatchObject({ registryType: "npm", identifier: pkg.name, transport: { type: "stdio" } });
    expect(p.packageArguments).toEqual([{ type: "positional", value: "mcp" }]);
  });

  it("asks for the two database URLs as required secrets", () => {
    const required = server.packages[0].environmentVariables.filter((e: { isRequired?: boolean }) => e.isRequired);
    expect(required.map((e: { name: string; isSecret?: boolean }) => [e.name, e.isSecret])).toEqual([
      ["SOURCE_DATABASE_URL", true],
      ["TARGET_DATABASE_URL", true],
    ]);
  });
});
