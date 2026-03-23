<script lang="ts">
  import pages from 'virtual:content/pages'

  const about = pages.find((p,) => p.slug === 'about',)
</script>

<div class="about">
  {#if about}
    <h1>{about.data.title}</h1>
    <div class="content">
      {@html about.html}
    </div>
  {:else}
    <h1>About</h1>
    <p class="empty">
      No about page found. Create <code>content/pages/about/README.md</code> to add one.
    </p>
  {/if}
</div>

<style>
  .about h1 {
    font-size: 1.875rem;
    font-weight: 700;
    margin-bottom: 1.5rem;
  }

  .content {
    line-height: 1.75;
  }

  .content :global(h2) {
    font-size: 1.5rem;
    font-weight: 600;
    margin: 2rem 0 1rem;
  }

  .content :global(p) {
    margin: 0 0 1rem;
  }

  .content :global(a) {
    color: #3182ce;
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
