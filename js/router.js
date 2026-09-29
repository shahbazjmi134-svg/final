import {
  renderHome,
  mountCatalog,
  renderProductDetail,
  renderCart,
  renderAbout,
  renderNotFound,
} from './pages.js'

// Each route is either:
//  - { render: (params) => htmlString }   → router sets innerHTML
//  - { mount: (rootEl, params) => void }   → route manages its own DOM/listeners
const routes = [
  { pattern: '/', render: renderHome },
  { pattern: '/catalog', mount: mountCatalog },
  { pattern: '/product/:id', render: renderProductDetail },
  { pattern: '/cart', render: renderCart },
  { pattern: '/about', render: renderAbout },
]

function matchRoute(path) {
  for (const route of routes) {
    const paramNames = []
    const regexStr =
      '^' +
      route.pattern
        .split('/')
        .map((seg) => {
          if (seg.startsWith(':')) {
            paramNames.push(seg.slice(1))
            return '([^/]+)'
          }
          return seg.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        })
        .join('/') +
      '$'
    const match = path.match(new RegExp(regexStr))
    if (match) {
      const params = {}
      paramNames.forEach((name, i) => (params[name] = match[i + 1]))
      return { route, params }
    }
  }
  return null
}

let appEl
let onNavigate // optional callback fired after every render (e.g. to update nav highlighting)

export function initRouter(rootEl, { afterRender } = {}) {
  appEl = rootEl
  onNavigate = afterRender

  // Intercept clicks on any in-app link so navigation doesn't trigger a full reload
  document.addEventListener('click', (e) => {
    const link = e.target.closest('[data-link]')
    if (!link) return
    const url = new URL(link.href)
    if (url.origin !== window.location.origin) return // external link, let it through
    e.preventDefault()
    navigate(url.pathname)
  })

  window.addEventListener('popstate', () => render(window.location.pathname))

  render(window.location.pathname)
}

export function navigate(path) {
  window.history.pushState({}, '', path)
  render(path)
}

function render(path) {
  const matched = matchRoute(path)
  if (!matched) {
    appEl.innerHTML = renderNotFound()
  } else if (matched.route.mount) {
    matched.route.mount(appEl, matched.params)
  } else {
    appEl.innerHTML = matched.route.render(matched.params)
  }
  window.scrollTo(0, 0)
  onNavigate?.(path)
}
