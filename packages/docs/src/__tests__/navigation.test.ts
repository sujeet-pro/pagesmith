import { describe, it, expect } from "vite-plus/test";
import {
  getDocsListingCards,
  getDocsListingData,
  getPrevNext,
  buildSiteModel,
  getSitePayload,
} from "../navigation.js";
import type { DocsPage, SidebarSection } from "../content.js";
import type { ResolvedDocsConfig } from "../config.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const mockPage = (overrides: Partial<DocsPage>): DocsPage => ({
  title: "Test Page",
  routePath: "/test",
  contentSlug: "test",
  section: "guide",
  frontmatter: {},
  html: "<p>test</p>",
  headings: [],
  sourcePath: "/tmp/test.md",
  isHome: false,
  layoutName: "page",
  ...overrides,
});

const mockConfig: ResolvedDocsConfig = {
  rootDir: "/tmp",
  contentDir: "/tmp/content",
  outDir: "/tmp/gh-pages",
  publicDir: "/tmp/public",
  basePath: "",
  trailingSlash: false,
  name: "Test",
  title: "Test Docs",
  description: "Test",
  origin: "https://example.com",
  language: "en",
  footerLinks: [],
  footerText: undefined,
  sidebar: { collapsible: false },
  search: { enabled: true, showImages: false, showSubResults: true, pagefindFlags: [] },
  favicon: false,
  icon: false,
  faviconFallback: false,
  appleTouchIcon: false,
  lastUpdated: true,
  sitemap: true,
  server: { host: "127.0.0.1", devPort: 3000, previewPort: 4000, strictPort: false },
  assets: new Map(),
};

// ---------------------------------------------------------------------------
// getPrevNext
// ---------------------------------------------------------------------------
describe("getPrevNext", () => {
  const sections: SidebarSection[] = [
    {
      title: "Guide",
      slug: "guide",
      items: [
        { title: "Introduction", path: "/guide/intro" },
        { title: "Getting Started", path: "/guide/getting-started" },
        { title: "Advanced", path: "/guide/advanced" },
      ],
    },
  ];

  it("returns both prev and next for a middle item", () => {
    const result = getPrevNext(sections, "/guide/getting-started");

    expect(result.prev).toEqual({ title: "Introduction", path: "/guide/intro" });
    expect(result.next).toEqual({ title: "Advanced", path: "/guide/advanced" });
  });

  it("returns only next for the first item", () => {
    const result = getPrevNext(sections, "/guide/intro");

    expect(result.prev).toBeUndefined();
    expect(result.next).toEqual({ title: "Getting Started", path: "/guide/getting-started" });
  });

  it("returns only prev for the last item", () => {
    const result = getPrevNext(sections, "/guide/advanced");

    expect(result.prev).toEqual({ title: "Getting Started", path: "/guide/getting-started" });
    expect(result.next).toBeUndefined();
  });

  it("returns empty object for empty sections", () => {
    const result = getPrevNext([], "/guide/intro");

    expect(result).toEqual({});
  });

  it("returns empty object for undefined sections", () => {
    const result = getPrevNext(undefined, "/guide/intro");

    expect(result).toEqual({});
  });

  it("returns empty object when routePath is not found", () => {
    const result = getPrevNext(sections, "/nonexistent");

    expect(result).toEqual({});
  });

  it("handles items with children (nested sidebar)", () => {
    const nestedSections: SidebarSection[] = [
      {
        title: "Guide",
        slug: "guide",
        items: [
          { title: "Overview", path: "/guide/overview" },
          {
            title: "Setup",
            path: "/guide/setup",
            children: [
              { title: "Install", path: "/guide/setup/install" },
              { title: "Configure", path: "/guide/setup/configure" },
            ],
          },
          { title: "Usage", path: "/guide/usage" },
        ],
      },
    ];

    // The flattened order is: Overview, Setup, Install, Configure, Usage
    const result = getPrevNext(nestedSections, "/guide/setup/install");

    expect(result.prev).toEqual({ title: "Setup", path: "/guide/setup" });
    expect(result.next).toEqual({ title: "Configure", path: "/guide/setup/configure" });
  });

  it("navigates across multiple sidebar sections", () => {
    const multiSections: SidebarSection[] = [
      {
        title: "Guide",
        slug: "guide",
        items: [{ title: "Intro", path: "/guide/intro" }],
      },
      {
        title: "Reference",
        slug: "reference",
        items: [{ title: "API", path: "/reference/api" }],
      },
    ];

    const result = getPrevNext(multiSections, "/reference/api");

    expect(result.prev).toEqual({ title: "Intro", path: "/guide/intro" });
    expect(result.next).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// buildSiteModel
// ---------------------------------------------------------------------------
describe("buildSiteModel", () => {
  it("builds nav items and sidebar from pages", () => {
    const pages = [
      mockPage({
        title: "Home",
        routePath: "/",
        contentSlug: "/",
        section: undefined,
        isHome: true,
        layoutName: "home",
      }),
      mockPage({
        title: "Introduction",
        routePath: "/guide/intro",
        contentSlug: "guide/intro",
        section: "guide",
      }),
      mockPage({
        title: "API",
        routePath: "/reference/api",
        contentSlug: "reference/api",
        section: "reference",
      }),
    ];

    const model = buildSiteModel(mockConfig, pages);

    // Nav items should include guide and reference but not home
    expect(model.navItems.length).toBe(2);
    expect(model.navItems[0].label).toBe("Guide");
    expect(model.navItems[1].label).toBe("Reference");

    // Sidebar should have entries for both sections
    expect(model.sidebarBySection.has("guide")).toBe(true);
    expect(model.sidebarBySection.has("reference")).toBe(true);
  });

  it("excludes home page from sidebar sections", () => {
    const pages = [
      mockPage({
        title: "Home",
        routePath: "/",
        contentSlug: "/",
        section: undefined,
        isHome: true,
        layoutName: "home",
      }),
      mockPage({
        title: "Getting Started",
        routePath: "/guide/getting-started",
        contentSlug: "guide/getting-started",
        section: "guide",
      }),
    ];

    const model = buildSiteModel(mockConfig, pages);

    // Home page has no section, so it should not appear in sidebarBySection
    expect(model.sidebarBySection.has("guide")).toBe(true);
    expect(model.sidebarBySection.size).toBe(1);

    // pageByPath should contain both
    expect(model.pageByPath.size).toBe(2);
    expect(model.pageByPath.has("/")).toBe(true);
    expect(model.pageByPath.has("/guide/getting-started")).toBe(true);
  });

  it("uses basePath in nav item paths", () => {
    const config = { ...mockConfig, basePath: "/docs" };
    const pages = [
      mockPage({
        title: "Intro",
        routePath: "/guide/intro",
        contentSlug: "guide/intro",
        section: "guide",
      }),
    ];

    const model = buildSiteModel(config, pages);

    expect(model.navItems[0].path).toBe("/docs/guide/intro");
  });

  it("uses section meta displayName for nav label", () => {
    const pages = [
      mockPage({
        title: "Intro",
        routePath: "/guide/intro",
        contentSlug: "guide/intro",
        section: "guide",
      }),
    ];
    const sectionMetas = new Map([["guide", { displayName: "User Guide" }]]);

    const model = buildSiteModel(mockConfig, pages, undefined, sectionMetas);

    expect(model.navItems[0].label).toBe("User Guide");
  });

  it("uses toTitleCase for nav label when no meta or landing page", () => {
    const pages = [
      mockPage({
        title: "Intro",
        routePath: "/getting-started/intro",
        contentSlug: "getting-started/intro",
        section: "getting-started",
      }),
    ];

    const model = buildSiteModel(mockConfig, pages);

    // toTitleCase('getting-started') → 'Getting Started'
    expect(model.navItems[0].label).toBe("Getting Started");
  });

  it("builds sidebar items from section pages", () => {
    const pages = [
      mockPage({
        title: "First Page",
        routePath: "/guide/first",
        contentSlug: "guide/first",
        section: "guide",
      }),
      mockPage({
        title: "Second Page",
        routePath: "/guide/second",
        contentSlug: "guide/second",
        section: "guide",
      }),
    ];

    const model = buildSiteModel(mockConfig, pages);
    const guideSidebar = model.sidebarBySection.get("guide");

    expect(guideSidebar).toBeDefined();
    expect(guideSidebar!.length).toBe(1); // One SidebarSection with slug 'guide'
    expect(guideSidebar![0].items.length).toBe(2);
  });

  it("stores rootMeta and sectionMetas on the model", () => {
    const pages = [
      mockPage({
        title: "Intro",
        routePath: "/guide/intro",
        contentSlug: "guide/intro",
        section: "guide",
      }),
    ];
    const rootMeta = { displayName: "My Docs" };
    const sectionMetas = new Map([["guide", { displayName: "Guide Section" }]]);

    const model = buildSiteModel(mockConfig, pages, rootMeta, sectionMetas);

    expect(model.rootMeta).toBe(rootMeta);
    expect(model.sectionMetas).toBe(sectionMetas);
  });

  it("uses rootMeta headerLinks for nav when provided", () => {
    const pages = [
      mockPage({
        title: "Guide Landing",
        routePath: "/guide",
        contentSlug: "guide",
        section: "guide",
      }),
      mockPage({
        title: "Intro",
        routePath: "/guide/intro",
        contentSlug: "guide/intro",
        section: "guide",
      }),
    ];
    const rootMeta = {
      headerLinks: [{ label: "Custom Guide", path: "/guide" }],
    };

    const model = buildSiteModel(mockConfig, pages, rootMeta);

    expect(model.navItems.length).toBe(1);
    expect(model.navItems[0].label).toBe("Custom Guide");
  });

  it("sorts pages by frontmatter order", () => {
    const pages = [
      mockPage({
        title: "Third",
        routePath: "/guide/third",
        contentSlug: "guide/third",
        section: "guide",
        frontmatter: { order: 3 },
      }),
      mockPage({
        title: "First",
        routePath: "/guide/first",
        contentSlug: "guide/first",
        section: "guide",
        frontmatter: { order: 1 },
      }),
      mockPage({
        title: "Second",
        routePath: "/guide/second",
        contentSlug: "guide/second",
        section: "guide",
        frontmatter: { order: 2 },
      }),
    ];

    const model = buildSiteModel(mockConfig, pages);
    const sidebar = model.sidebarBySection.get("guide");

    expect(sidebar).toBeDefined();
    expect(sidebar![0].items[0].title).toBe("First");
    expect(sidebar![0].items[1].title).toBe("Second");
    expect(sidebar![0].items[2].title).toBe("Third");
  });

  it("builds sidebar with series grouping from section meta", () => {
    const pages = [
      mockPage({
        title: "Guide Landing",
        routePath: "/guide",
        contentSlug: "guide",
        section: "guide",
      }),
      mockPage({
        title: "Getting Started",
        routePath: "/guide/getting-started",
        contentSlug: "guide/getting-started",
        section: "guide",
      }),
      mockPage({
        title: "Advanced",
        routePath: "/guide/advanced",
        contentSlug: "guide/advanced",
        section: "guide",
      }),
      mockPage({
        title: "FAQ",
        routePath: "/guide/faq",
        contentSlug: "guide/faq",
        section: "guide",
      }),
    ];
    const sectionMetas = new Map([
      [
        "guide",
        {
          displayName: "Guide",
          orderBy: "manual" as const,
          series: [
            {
              slug: "basics",
              displayName: "Basics",
              articles: ["getting-started"],
            },
            {
              slug: "deep-dives",
              displayName: "Deep Dives",
              articles: ["advanced"],
            },
          ],
        },
      ],
    ]);

    const model = buildSiteModel(mockConfig, pages, undefined, sectionMetas);
    const sidebar = model.sidebarBySection.get("guide");

    expect(sidebar).toBeDefined();
    expect(sidebar!.length).toBe(3);
    expect(sidebar![0].title).toBe("Basics");
    expect(sidebar![1].title).toBe("Deep Dives");
    expect(sidebar![2].title).toBe("Miscellaneous");
    expect(sidebar![2].items.map((item) => item.title)).toEqual(["Guide Landing", "FAQ"]);
  });

  it("matches series items by nested section-relative slug", () => {
    const pages = [
      mockPage({
        title: "Setup",
        routePath: "/guide/advanced/setup",
        contentSlug: "guide/advanced/setup",
        section: "guide",
      }),
    ];
    const sectionMetas = new Map([
      [
        "guide",
        {
          series: [
            {
              slug: "advanced",
              displayName: "Advanced",
              articles: ["advanced/setup"],
            },
          ],
        },
      ],
    ]);

    const model = buildSiteModel(mockConfig, pages, undefined, sectionMetas);
    const sidebar = model.sidebarBySection.get("guide");

    expect(sidebar).toBeDefined();
    expect(sidebar![0].items[0].title).toBe("Setup");
  });

  it("uses sidebarLabel from frontmatter when available", () => {
    const pages = [
      mockPage({
        title: "Very Long Page Title That Should Be Shortened",
        routePath: "/guide/long-title",
        contentSlug: "guide/long-title",
        section: "guide",
        frontmatter: { sidebarLabel: "Short Title" },
      }),
    ];

    const model = buildSiteModel(mockConfig, pages);
    const sidebar = model.sidebarBySection.get("guide");

    expect(sidebar![0].items[0].title).toBe("Short Title");
  });

  it("excludes draft pages from sidebar and nav", () => {
    const pages = [
      mockPage({
        title: "Published",
        routePath: "/guide/published",
        contentSlug: "guide/published",
        section: "guide",
      }),
      mockPage({
        title: "Draft",
        routePath: "/guide/draft",
        contentSlug: "guide/draft",
        section: "guide",
        frontmatter: { draft: true },
      }),
    ];

    const model = buildSiteModel(mockConfig, pages);
    const sidebar = model.sidebarBySection.get("guide");

    expect(sidebar![0].items.length).toBe(1);
    expect(sidebar![0].items[0].title).toBe("Published");
  });

  it("prepends landing page to sidebar items", () => {
    const pages = [
      mockPage({
        title: "Guide Overview",
        routePath: "/guide",
        contentSlug: "guide",
        section: "guide",
      }),
      mockPage({
        title: "Getting Started",
        routePath: "/guide/getting-started",
        contentSlug: "guide/getting-started",
        section: "guide",
      }),
    ];

    const model = buildSiteModel(mockConfig, pages);
    const sidebar = model.sidebarBySection.get("guide");

    expect(sidebar![0].items[0].title).toBe("Guide Overview");
    expect(sidebar![0].items[1].title).toBe("Getting Started");
  });

  it("uses landing page route for nav link", () => {
    const pages = [
      mockPage({
        title: "Guide Overview",
        routePath: "/guide",
        contentSlug: "guide",
        section: "guide",
      }),
      mockPage({
        title: "Getting Started",
        routePath: "/guide/getting-started",
        contentSlug: "guide/getting-started",
        section: "guide",
      }),
    ];

    const model = buildSiteModel(mockConfig, pages);

    expect(model.navItems[0].path).toBe("/guide");
  });

  it("builds flat sidebar items for deep content", () => {
    const pages = [
      mockPage({
        title: "Parent Page",
        routePath: "/guide/setup",
        contentSlug: "guide/setup",
        section: "guide",
      }),
      mockPage({
        title: "Install",
        routePath: "/guide/setup/install",
        contentSlug: "guide/setup/install",
        section: "guide",
      }),
    ];

    const model = buildSiteModel(mockConfig, pages);
    const sidebar = model.sidebarBySection.get("guide");

    expect(sidebar).toBeDefined();
    expect(sidebar![0].items.map((item) => item.title)).toEqual(["Parent Page", "Install"]);
    expect(sidebar![0].items.every((item) => item.children == null)).toBe(true);
  });

  it("builds folderPaths pointing to index page when it exists", () => {
    const pages = [
      mockPage({
        title: "Guide Overview",
        routePath: "/guide",
        contentSlug: "guide",
        section: "guide",
      }),
      mockPage({
        title: "Getting Started",
        routePath: "/guide/getting-started",
        contentSlug: "guide/getting-started",
        section: "guide",
      }),
    ];

    const model = buildSiteModel(mockConfig, pages);

    expect(model.folderPaths.get("guide")).toBe("/guide");
  });

  it("builds folderPaths pointing to first child when no index page", () => {
    const pages = [
      mockPage({
        title: "Getting Started",
        routePath: "/guide/getting-started",
        contentSlug: "guide/getting-started",
        section: "guide",
      }),
      mockPage({
        title: "Advanced",
        routePath: "/guide/advanced",
        contentSlug: "guide/advanced",
        section: "guide",
      }),
    ];

    const model = buildSiteModel(mockConfig, pages);

    expect(model.folderPaths.get("guide")).toBe("/guide/advanced");
  });

  it("includes basePath in folderPaths", () => {
    const config = { ...mockConfig, basePath: "/docs" };
    const pages = [
      mockPage({
        title: "Intro",
        routePath: "/guide/intro",
        contentSlug: "guide/intro",
        section: "guide",
      }),
    ];

    const model = buildSiteModel(config, pages);

    expect(model.folderPaths.get("guide")).toBe("/docs/guide/intro");
  });

  it("builds folderPaths for nested folders without index pages", () => {
    const pages = [
      mockPage({
        title: "Setup",
        routePath: "/guide/advanced/setup",
        contentSlug: "guide/advanced/setup",
        section: "guide",
        frontmatter: { order: 1 },
      }),
      mockPage({
        title: "Config",
        routePath: "/guide/advanced/config",
        contentSlug: "guide/advanced/config",
        section: "guide",
        frontmatter: { order: 2 },
      }),
    ];

    const model = buildSiteModel(mockConfig, pages);

    expect(model.folderPaths.get("guide")).toBe("/guide/advanced/setup");
    expect(model.folderPaths.get("guide/advanced")).toBe("/guide/advanced/setup");
  });

  it("respects frontmatter order when picking first child for folderPaths", () => {
    const pages = [
      mockPage({
        title: "Zeta (ordered first)",
        routePath: "/guide/zeta",
        contentSlug: "guide/zeta",
        section: "guide",
        frontmatter: { order: 1 },
      }),
      mockPage({
        title: "Alpha (ordered second)",
        routePath: "/guide/alpha",
        contentSlug: "guide/alpha",
        section: "guide",
        frontmatter: { order: 2 },
      }),
    ];

    const model = buildSiteModel(mockConfig, pages);

    expect(model.folderPaths.get("guide")).toBe("/guide/zeta");
  });
});

// ---------------------------------------------------------------------------
// getSitePayload
// ---------------------------------------------------------------------------
describe("getSitePayload", () => {
  it("returns config fields in the payload", () => {
    const model = buildSiteModel(mockConfig, []);
    const payload = getSitePayload(mockConfig, model);

    expect(payload.name).toBe("Test");
    expect(payload.title).toBe("Test Docs");
    expect(payload.description).toBe("Test");
    expect(payload.language).toBe("en");
    expect(payload.basePath).toBe("");
  });

  it("falls back to the primary nav items when footerLinks are omitted", () => {
    const pages = [
      mockPage({
        title: "Guide Intro",
        routePath: "/guide/intro",
        contentSlug: "guide/intro",
        section: "guide",
      }),
      mockPage({
        title: "Reference API",
        routePath: "/reference/api",
        contentSlug: "reference/api",
        section: "reference",
      }),
    ];
    const model = buildSiteModel(mockConfig, pages);
    const payload = getSitePayload(mockConfig, model);

    expect(payload.footerLinks).toEqual(model.navItems);
  });

  it("prefixes internal footer link paths with basePath", () => {
    const config = {
      ...mockConfig,
      basePath: "/docs",
      footerLinks: [
        { label: "About", path: "/about" },
        { label: "External", path: "https://example.com" },
      ],
    };
    const model = buildSiteModel(config, []);
    const payload = getSitePayload(config, model);

    expect(payload.footerLinks).toEqual([
      { label: "About", path: "/docs/about" },
      { label: "External", path: "https://example.com" },
    ]);
  });

  it("does not double-prefix footer links that already have basePath", () => {
    const config = {
      ...mockConfig,
      basePath: "/docs",
      footerLinks: [{ label: "About", path: "/docs/about" }],
    };
    const model = buildSiteModel(config, []);
    const payload = getSitePayload(config, model);

    expect(payload.footerLinks).toEqual([{ label: "About", path: "/docs/about" }]);
  });

  it("leaves footer links unchanged when basePath is empty", () => {
    const config = {
      ...mockConfig,
      basePath: "",
      footerLinks: [{ label: "About", path: "/about" }],
    };
    const model = buildSiteModel(config, []);
    const payload = getSitePayload(config, model);

    expect(payload.footerLinks).toEqual([{ label: "About", path: "/about" }]);
  });

  it("uses rootMeta footer links when available", () => {
    const config = {
      ...mockConfig,
      basePath: "/docs",
      footerLinks: [{ label: "Config Link", path: "/config" }],
    };
    const rootMeta = {
      footerLinks: [{ label: "Meta Link", path: "/meta" }],
    };
    const model = buildSiteModel(config, [], rootMeta);
    const payload = getSitePayload(config, model);

    expect(payload.footerLinks).toEqual([{ label: "Meta Link", path: "/docs/meta" }]);
  });

  it("prefixes grouped footer link paths with basePath", () => {
    const config = {
      ...mockConfig,
      basePath: "/docs",
      footerLinks: [
        {
          header: "Docs",
          links: [
            { label: "Guide", path: "/guide" },
            { label: "GitHub", path: "https://example.com/repo" },
          ],
        },
      ],
    };
    const model = buildSiteModel(config, []);
    const payload = getSitePayload(config, model);

    expect(payload.footerLinks).toEqual([
      {
        header: "Docs",
        links: [
          { label: "Guide", path: "/docs/guide" },
          { label: "GitHub", path: "https://example.com/repo" },
        ],
      },
    ]);
  });

  it("respects an explicitly empty footerLinks array", () => {
    const pages = [
      mockPage({
        title: "Guide Intro",
        routePath: "/guide/intro",
        contentSlug: "guide/intro",
        section: "guide",
      }),
    ];
    const config = {
      ...mockConfig,
      footerLinks: [],
      _userConfig: { footerLinks: [] },
    };
    const model = buildSiteModel(config, pages);
    const payload = getSitePayload(config, model);

    expect(payload.footerLinks).toEqual([]);
  });

  it("includes favicon path with basePath prefix when favicon is set", () => {
    const config = {
      ...mockConfig,
      basePath: "/docs",
      favicon: "/tmp/public/favicon.svg",
    };
    const model = buildSiteModel(config, []);
    const payload = getSitePayload(config, model);

    expect(payload.favicon).toBe("/docs/favicon.svg");
  });

  it("returns false for favicon when disabled", () => {
    const config = {
      ...mockConfig,
      favicon: false as const,
    };
    const model = buildSiteModel(config, []);
    const payload = getSitePayload(config, model);

    expect(payload.favicon).toBe(false);
  });

  it("includes nav items from the site model", () => {
    const pages = [
      mockPage({
        title: "Intro",
        routePath: "/guide/intro",
        contentSlug: "guide/intro",
        section: "guide",
      }),
    ];
    const model = buildSiteModel(mockConfig, pages);
    const payload = getSitePayload(mockConfig, model);

    expect(payload.navItems).toEqual(model.navItems);
  });

  it("includes search and sidebar config", () => {
    const model = buildSiteModel(mockConfig, []);
    const payload = getSitePayload(mockConfig, model);

    expect(payload.search).toEqual(mockConfig.search);
    expect(payload.sidebar).toEqual(mockConfig.sidebar);
  });

  it("includes footer text in the payload", () => {
    const model = buildSiteModel(mockConfig, []);
    const payload = getSitePayload(mockConfig, model);

    expect(payload.footerText).toBeUndefined();
  });
});

describe("getDocsListingCards", () => {
  it("excludes the section landing page and returns sorted child cards", () => {
    const pages: DocsPage[] = [
      mockPage({
        title: "Guide",
        routePath: "/guide",
        contentSlug: "guide",
        section: "guide",
      }),
      mockPage({
        title: "Zebra",
        routePath: "/guide/zebra",
        contentSlug: "guide/zebra",
        section: "guide",
        frontmatter: { description: "Z", order: 2 },
      }),
      mockPage({
        title: "Alpha",
        routePath: "/guide/alpha",
        contentSlug: "guide/alpha",
        section: "guide",
        frontmatter: { description: "A", order: 1 },
      }),
    ];

    const cards = getDocsListingCards("guide", pages, "");
    expect(cards).toHaveLength(2);
    expect(cards[0]!.title).toBe("Alpha");
    expect(cards[0]!.path).toBe("/guide/alpha");
    expect(cards[0]!.description).toBe("A");
    expect(cards[1]!.title).toBe("Zebra");
  });

  it("groups listing cards from section series and prefixes basePath paths", () => {
    const pages: DocsPage[] = [
      mockPage({
        title: "Guide",
        routePath: "/guide",
        contentSlug: "guide",
        section: "guide",
      }),
      mockPage({
        title: "Intro",
        routePath: "/guide/intro",
        contentSlug: "guide/intro",
        section: "guide",
        frontmatter: {
          description: "Start here",
          publishedDate: "2024-01-10",
        },
      }),
      mockPage({
        title: "Advanced",
        routePath: "/guide/advanced",
        contentSlug: "guide/advanced",
        section: "guide",
        frontmatter: {
          description: "Go deeper",
          publishedDate: "2024-01-20",
        },
      }),
      mockPage({
        title: "Appendix",
        routePath: "/guide/appendix",
        contentSlug: "guide/appendix",
        section: "guide",
      }),
    ];

    const listing = getDocsListingData("guide", pages, "/docs", {
      series: [
        {
          slug: "basics",
          displayName: "Basics",
          description: "Core concepts",
          articles: ["intro", "advanced"],
        },
      ],
    });

    expect(listing.totalItems).toBe(3);
    expect(listing.headings).toEqual([
      { depth: 2, text: "Basics", slug: "basics" },
      { depth: 2, text: "Other", slug: "other" },
    ]);
    expect(listing.groups).toHaveLength(2);
    expect(listing.groups[0]).toMatchObject({
      slug: "basics",
      title: "Basics",
      description: "Core concepts",
    });
    expect(listing.groups[0]!.cards.map((card) => card.title)).toEqual(["Intro", "Advanced"]);
    expect(listing.groups[0]!.cards[0]!.path).toBe("/docs/guide/intro");
    expect(listing.groups[0]!.cards[0]!.publishedDate).toBe("2024-01-10T00:00:00.000Z");
    expect(listing.groups[1]!.title).toBe("Other");
    expect(listing.groups[1]!.cards.map((card) => card.title)).toEqual(["Appendix"]);

    const cards = getDocsListingCards("guide", pages, "/docs", {
      series: [{ slug: "basics", displayName: "Basics", articles: ["intro", "advanced"] }],
    });
    expect(cards.map((card) => card.title)).toEqual(["Intro", "Advanced", "Appendix"]);
  });
});
