<script lang="ts">
  import pages from 'virtual:content/pages'

  const about = pages.find((page) => page.contentSlug === 'pages/about')
</script>

<div class="about">
  {#if about}
    <h1>{about.frontmatter.title}</h1>
    <div class="prose">
      {@html about.html}
    </div>
  {:else}
    <h1>About</h1>
    <p class="empty">
      No about page found. Create <code>content/pages/about.md</code> to add one.
    </p>
  {/if}
</div>

<style>
  .about h1 {
    font-size: 1.875rem;
    font-weight: 700;
    margin-bottom: 1.5rem;
  }

  .empty {
    color: #718096;
  }

  .empty code {
    background: #edf2f7;
    padding: 0.125rem 0.375rem;
    border-radius: 0.25rem;
    font-size: 0.875rem;
  }
</style>
