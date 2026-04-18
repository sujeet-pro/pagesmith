import {
  DocFooter,
  DocHeader,
  DocSidebar,
  DocSidebarModal,
  DocTOC,
  type SiteCopyright,
  type SiteDocumentAnalytics,
  type SiteDocumentData,
  type SiteDocumentSearch,
  type SiteDocumentSeo,
  type SiteDocumentTheme,
  type SiteFooterLinks,
  type SiteMaintainer,
  type SiteNavItem,
  type SiteSidebarSection,
} from "@pagesmith/docs/components";

export {
  DocFooter,
  DocHeader,
  DocSidebar,
  DocSidebarModal,
  DocTOC,
  type SiteFooterLinks as FooterLinks,
  type SiteNavItem as NavItem,
  type SiteSidebarSection as SidebarSection,
};

export type ExampleSite = SiteDocumentData & {
  title: string;
  description: string;
  icon?: string | false;
  navItems?: SiteNavItem[];
  footerLinks?: SiteFooterLinks;
  footerText?: string;
  maintainer?: SiteMaintainer;
  copyright?: SiteCopyright;
  sidebar?: {
    collapsible?: boolean;
  };
  search?: SiteDocumentSearch;
  seo?: SiteDocumentSeo;
  analytics?: SiteDocumentAnalytics;
  theme?: SiteDocumentTheme;
  [key: string]: any;
};

export function withSiteBase(basePath: string | undefined, path: string): string {
  if (!path.startsWith("/")) return path;
  const base = (basePath || "").replace(/\/+$/, "");
  return base ? `${base}${path}` : path;
}

export function resolveSocialImage(site: ExampleSite, socialImage?: string): string | undefined {
  if (!socialImage) return undefined;
  if (socialImage.startsWith("http")) return socialImage;
  return withSiteBase(site.basePath, `/${socialImage.replace(/^\//, "")}`);
}

export function toHtmlSite(site: ExampleSite): ExampleSite {
  return site;
}

export function buildHomeSidebarSections(
  navItems?: SiteNavItem[],
): SiteSidebarSection[] | undefined {
  if (!navItems || navItems.length === 0) return undefined;

  return [
    {
      title: "Navigation",
      slug: "navigation",
      items: navItems.map((item) => ({
        title: item.label,
        path: item.path,
      })),
    },
  ];
}
