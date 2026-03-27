import { Routes, Route } from 'react-router'
import { Layout } from './components/Layout'
import { Home } from './pages/Home'
import { Post } from './pages/Post'
import { About } from './pages/About'

export function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/posts/:slug" element={<Post />} />
        <Route path="/about" element={<About />} />
      </Routes>
    </Layout>
  )
}
