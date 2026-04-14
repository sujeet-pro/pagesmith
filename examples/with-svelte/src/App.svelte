<!--
  Root layout router only: picks home / article / 404 and owns the mobile nav dialog.
  Pagefind Component UI is not declared here — renderDocumentShell() appends <pagefind-modal>
  after this tree when search is enabled, so the trigger in SiteHeader stays paired with
  a single modal instance from @pagesmith/site/ssg-utils.
-->
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
    kitchenSinkUrl,
    searchEnabled = false,
    guideEntries = [],
    guideGroups = [],
    pageDate = undefined,
    pageReadTime = undefined,
    pagePrev = undefined,
    pageNext = undefined,
    pageEditUrl = undefined,
  }: {
    pageKind: 'home' | 'page' | 'not-found'
    pageTitle?: string
    pageDescription?: string
    pageContent?: string
    pageHeadings?: Heading[]
    currentPath: string
    basePath: string
    firstGuideUrl: string
    kitchenSinkUrl: string
    searchEnabled?: boolean
    guideEntries?: NavEntry[]
    guideGroups?: GuideGroup[]
    pageDate?: string
    pageReadTime?: number
    pagePrev?: { title: string; url: string }
    pageNext?: { title: string; url: string }
    pageEditUrl?: string
  } = $props()
</script>

{#if pageKind !== 'not-found'}
  <SiteHeader {basePath} {currentPath} {firstGuideUrl} {searchEnabled} />
{/if}

{#if pageKind === 'home'}
  <HomeBody {firstGuideUrl} {kitchenSinkUrl} {guideEntries} />
{:else if pageKind === 'page'}
  <PageBody
    title={pageTitle}
    description={pageDescription}
    content={pageContent}
    headings={pageHeadings}
    {currentPath}
    {basePath}
    {firstGuideUrl}
    {guideGroups}
    date={pageDate}
    readTime={pageReadTime}
    prev={pagePrev}
    next={pageNext}
    editUrl={pageEditUrl}
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
        <SidebarNav {currentPath} {basePath} {firstGuideUrl} {guideGroups} />
      </nav>
    </div>
  </dialog>
{/if}
