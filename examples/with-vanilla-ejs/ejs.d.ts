declare module 'ejs' {
  function render(template: string, data?: Record<string, any>, options?: any): string
  export default { render }
}
