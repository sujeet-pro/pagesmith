/**
 * Sidebar toggle and state management.
 *
 * Handles the mobile sidebar overlay toggle via the checkbox hack,
 * and closes the sidebar when clicking outside or on a link.
 */

export function initSidebar(): void {
  const toggle = document.getElementById('sidebar-toggle') as HTMLInputElement | null
  if (!toggle) return

  // Close sidebar when clicking overlay
  const sidebar = document.querySelector('.doc-sidebar')
  if (!sidebar) return

  document.addEventListener('click', (e) => {
    const target = e.target as HTMLElement

    // Close on overlay click (clicking the label area outside sidebar)
    if (toggle.checked && !sidebar.contains(target) && !target.closest('.doc-sidebar-toggle')) {
      toggle.checked = false
    }
  })

  // Close sidebar when navigating (clicking a sidebar link)
  sidebar.addEventListener('click', (e) => {
    const link = (e.target as HTMLElement).closest('a')
    if (link) {
      toggle.checked = false
    }
  })

  // Close on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && toggle.checked) {
      toggle.checked = false
    }
  })
}
