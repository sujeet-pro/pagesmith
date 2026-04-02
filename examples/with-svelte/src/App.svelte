<script lang="ts">
  import HomeBody from './components/HomeBody.svelte'
  import NotFoundBody from './components/NotFoundBody.svelte'
  import PageBody from './components/PageBody.svelte'
  import SidebarNav from './components/SidebarNav.svelte'
  import SiteHeader from './components/SiteHeader.svelte'
  import type { GuideGroup, Heading, NavEntry } from './site'

  const closeIcon =
    '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="m5 5 10 10M15 5 5 15"/></svg>'

  let {
    pageKind,
    pageTitle = '',
    pageDescription = undefined,
    pageContent = '',
    pageHeadings = [],
    currentPath,
    basePath,
    firstGuideUrl,
    firstBlogUrl,
    searchEnabled = false,
    guideEntries = [],
    blogEntries = [],
    guideGroups = [],
    pageDate = undefined,
    pageReadTime = undefined,
  }: {
    pageKind: 'home' | 'page' | 'not-found'
    pageTitle?: string
    pageDescription?: string
    pageContent?: string
    pageHeadings?: Heading[]
    currentPath: string
    basePath: string
    firstGuideUrl: string
    firstBlogUrl: string
    searchEnabled?: boolean
    guideEntries?: NavEntry[]
    blogEntries?: NavEntry[]
    guideGroups?: GuideGroup[]
    pageDate?: string
    pageReadTime?: number
  } = $props()
</script>

{#if pageKind !== 'not-found'}
  <SiteHeader {basePath} {currentPath} {firstGuideUrl} {firstBlogUrl} {searchEnabled} />
{/if}

{#if pageKind === 'home'}
  <HomeBody {firstGuideUrl} {firstBlogUrl} {guideEntries} {blogEntries} />
{:else if pageKind === 'page'}
  <PageBody
    title={pageTitle}
    description={pageDescription}
    content={pageContent}
    headings={pageHeadings}
    {currentPath}
    {basePath}
    {firstGuideUrl}
    {firstBlogUrl}
    {guideGroups}
    {blogEntries}
    date={pageDate}
    readTime={pageReadTime}
  />
{:else}
  <NotFoundBody />
{/if}

{#if pageKind !== 'not-found'}
  <dialog class="doc-sidebar-modal" id="sidebar-modal">
    <div class="doc-sidebar-modal-backdrop" data-sidebar-close=""></div>
    <div class="doc-sidebar-modal-panel">
      <button type="button" class="doc-sidebar-modal-close" data-sidebar-close="" aria-label="Close navigation">
        {@html closeIcon}
      </button>
      <nav class="doc-sidebar-nav" aria-label="Sidebar navigation">
        <SidebarNav {currentPath} {basePath} {firstGuideUrl} {firstBlogUrl} {guideGroups} {blogEntries} />
      </nav>
    </div>
  </dialog>
{/if}

{#if searchEnabled && pageKind !== 'not-found'}
  <dialog
    class="doc-search-modal"
    id="search-modal"
    aria-label="Search"
    data-search-show-images="false"
    data-search-show-sub-results="true"
  >
    <div class="doc-search-modal-inner">
      <div class="doc-search-modal-header">
        <span class="doc-search-modal-title">Search</span>
        <button type="button" class="doc-search-modal-close" aria-label="Close" data-search-close="">
          {@html closeIcon}
        </button>
      </div>
      <div class="doc-search-modal-body" id="search-container" data-pagefind-search=""></div>
    </div>
  </dialog>
{/if}
