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
        <script innerHTML="(function(){var d=document.documentElement;d.classList.remove('no-js');try{var t=localStorage.getItem('pagesmith-theme');if(t==='light'||t==='dark'){d.setAttribute('data-theme',t);var r=document.getElementById('theme-'+t);if(r)r.checked=true}}catch(e){}})()" />
      </head>
      <body>
        <input type="radio" id="theme-auto" name="theme" class="sr-only" checked />
        <input type="radio" id="theme-light" name="theme" class="sr-only" />
        <input type="radio" id="theme-dark" name="theme" class="sr-only" />
        {children}
        {js && jsMode === 'inline' ? <script innerHTML={js} /> : null}
        {js && jsMode === 'reference' ? <script src={js} defer /> : null}
      </body>
    </html>
  )
}
