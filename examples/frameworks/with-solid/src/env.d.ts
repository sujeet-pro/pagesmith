/// <reference types="vite-plus/client" />

import 'solid-js'

declare module 'solid-js' {
  namespace JSX {
    interface IntrinsicElements {
      'pagefind-modal-trigger': HTMLAttributes<HTMLElement>
    }
  }
}
