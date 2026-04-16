declare module 'ejs' {
  export function render(template: string, data?: Record<string, any>, options?: any): string

  const ejs: {
    render: typeof render
  }

  export default ejs
}
