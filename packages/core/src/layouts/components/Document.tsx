import { Fragment, h } from '../../jsx-runtime'

type Props = {
  title: string
  description?: string
  language?: string
  css?: string
  cssMode?: 'inline' | 'reference'
  js?: string
  jsMode?: 'inline' | 'reference'
  head?: string
  children?: any
}

export function Document({
  title,
  description,
  language = 'en',
  css,
  cssMode = 'inline',
  js,
  jsMode = 'inline',
  head,
  children,
}: Props) {
  return (
    <html lang={language} class="no-js">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="color-scheme" content="light dark" />
        <title>{title}</title>
        {description ? <meta name="description" content={description} /> : null}
        {css && cssMode === 'inline' ? <style innerHTML={css} /> : null}
        {css && cssMode === 'reference' ? <link rel="stylesheet" href={css} /> : null}
        {head ? <Fragment innerHTML={head} /> : null}
        <script innerHTML="document.documentElement.classList.remove('no-js')" />
      </head>
      <body>
        {children}
        {js && jsMode === 'inline' ? <script innerHTML={js} /> : null}
        {js && jsMode === 'reference' ? <script src={js} defer /> : null}
      </body>
    </html>
  )
}
