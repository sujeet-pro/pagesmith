<script lang="ts">
  import posts from 'virtual:content/posts'

  let { slug }: { slug: string } = $props()

  let post = $derived(posts.find((entry) => entry.contentSlug === slug))
</script>

{#if post}
  <article class="post">
    <header>
      <h1>{post.frontmatter.title}</h1>
      <div class="meta">
        <time datetime={post.frontmatter.date.toISOString()}>
          {post.frontmatter.date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </time>
        {#if post.frontmatter.author}
          <span class="author">by {post.frontmatter.author}</span>
        {/if}
      </div>
      {#if post.frontmatter.tags?.length}
        <div class="tags">
          {#each post.frontmatter.tags as tag (tag)}
            <span class="tag">{tag}</span>
          {/each}
        </div>
      {/if}
    </header>

    <div class="prose">
      {@html post.html}
    </div>

    <footer>
      <a href="/">&larr; Back to posts</a>
    </footer>
  </article>
{:else}
  <div class="not-found">
    <h1>Post not found</h1>
    <p>No post with slug "{slug}" exists.</p>
    <a href="/">&larr; Back to posts</a>
  </div>
{/if}

<style>
  .post header {
    margin-bottom: 2rem;
    padding-bottom: 1.5rem;
    border-bottom: 1px solid #e2e8f0;
  }

  .post h1 {
    font-size: 2rem;
    font-weight: 700;
    margin: 0 0 0.75rem;
    line-height: 1.25;
  }

  .meta {
    display: flex;
    gap: 1rem;
    font-size: 0.875rem;
    color: #718096;
    margin-bottom: 0.75rem;
  }

  .author {
    font-style: italic;
  }

  .tags {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
  }

  .tag {
    background: #edf2f7;
    color: #4a5568;
    padding: 0.125rem 0.5rem;
    border-radius: 9999px;
    font-size: 0.75rem;
  }

  .post footer {
    margin-top: 2rem;
    padding-top: 1.5rem;
    border-top: 1px solid #e2e8f0;
  }

  .post footer a {
    color: #4a5568;
    text-decoration: none;
  }

  .post footer a:hover {
    color: #1a202c;
  }

  .not-found {
    text-align: center;
    padding: 3rem 0;
  }

  .not-found h1 {
    font-size: 1.5rem;
    margin-bottom: 0.5rem;
  }

  .not-found p {
    color: #718096;
    margin-bottom: 1rem;
  }

  .not-found a {
    color: #4a5568;
    text-decoration: none;
  }
</style>
