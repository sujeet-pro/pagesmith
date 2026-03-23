<script lang="ts">
  import posts from 'virtual:content/posts'

  const sortedPosts = [...posts,].sort(
    (a, b,) => new Date(b.data.date,).getTime() - new Date(a.data.date,).getTime(),
  )
</script>

<div class="home">
  <h1>Posts</h1>

  {#if sortedPosts.length === 0}
    <p class="empty">No posts yet. Add markdown files to <code>content/posts/</code> to get started.</p>
  {:else}
    <ul class="post-list">
      {#each sortedPosts as post (post.slug)}
        <li>
          <a href="#/posts/{post.slug}">
            <h2>{post.data.title}</h2>
            {#if post.data.description}
              <p class="description">{post.data.description}</p>
            {/if}
            <div class="meta">
              <time datetime={post.data.date}>
                {new Date(post.data.date).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </time>
              <span>{post.readTime} min read</span>
            </div>
          </a>
        </li>
      {/each}
    </ul>
  {/if}
</div>

<style>
  .home h1 {
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

  .post-list {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .post-list li a {
    display: block;
    padding: 1.25rem;
    border: 1px solid #e2e8f0;
    border-radius: 0.5rem;
    text-decoration: none;
    color: inherit;
    transition: border-color 0.15s;
  }

  .post-list li a:hover {
    border-color: #a0aec0;
  }

  .post-list h2 {
    font-size: 1.25rem;
    font-weight: 600;
    margin: 0 0 0.5rem;
    color: #1a202c;
  }

  .description {
    color: #4a5568;
    margin: 0 0 0.75rem;
    line-height: 1.5;
  }

  .meta {
    display: flex;
    gap: 1rem;
    font-size: 0.875rem;
    color: #718096;
  }
</style>
