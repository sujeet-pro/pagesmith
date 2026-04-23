import { describe, expect, it } from "vite-plus/test";
import { renderNpmBadge } from "../npm-badge.js";

describe("renderNpmBadge", () => {
  it("returns an inline SVG with explicit width and height for no CLS", () => {
    const badge = renderNpmBadge("@pagesmith/core", "0.9.9");

    expect(badge.height).toBe(20);
    expect(badge.width).toBeGreaterThanOrEqual(80);
    expect(badge.svg.startsWith("<svg")).toBe(true);
    expect(badge.svg).toContain(`width="${badge.width}"`);
    expect(badge.svg).toContain(`height="${badge.height}"`);
    expect(badge.svg).toContain(`viewBox="0 0 ${badge.width} ${badge.height}"`);
    expect(badge.href).toBe("https://www.npmjs.com/package/@pagesmith/core");
  });

  it("encodes the version string into the right segment", () => {
    const badge = renderNpmBadge("acme-pkg", "1.2.3-beta.4");
    expect(badge.svg).toContain("1.2.3-beta.4");
  });

  it("escapes XML-significant characters in the package name and version", () => {
    const badge = renderNpmBadge("@scope/<script>", "1.0&0");
    expect(badge.svg).not.toContain("<script>");
    expect(badge.svg).toContain("&lt;script&gt;");
    expect(badge.svg).toContain("1.0&amp;0");
  });

  it("widens the value segment for longer version strings", () => {
    const short = renderNpmBadge("a", "1.0");
    const long = renderNpmBadge("a", "11.22.333-rc.10");
    expect(long.width).toBeGreaterThan(short.width);
  });

  it("produces unique gradient and clipPath ids per badge", () => {
    const a = renderNpmBadge("@pagesmith/core", "0.9.9");
    const b = renderNpmBadge("@pagesmith/site", "0.9.9");

    const gradientA = a.svg.match(/id="(ps-npm-badge-gradient-[^"]+)"/)?.[1];
    const gradientB = b.svg.match(/id="(ps-npm-badge-gradient-[^"]+)"/)?.[1];
    const clipA = a.svg.match(/id="(ps-npm-badge-clip-[^"]+)"/)?.[1];
    const clipB = b.svg.match(/id="(ps-npm-badge-clip-[^"]+)"/)?.[1];

    expect(gradientA).toBeDefined();
    expect(clipA).toBeDefined();
    expect(gradientA).not.toBe(gradientB);
    expect(clipA).not.toBe(clipB);
    // Gradient and clip references inside each SVG resolve to the same suffix.
    expect(a.svg).toContain(`url(#${gradientA})`);
    expect(a.svg).toContain(`clip-path="url(#${clipA})"`);
  });
});
