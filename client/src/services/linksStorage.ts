import type { ResourceLink } from '../types'

const LINKS_KEY = 'inclusive-classroom-resource-links'

export function getResourceLinks(): ResourceLink[] {
  try {
    const saved = localStorage.getItem(LINKS_KEY)
    const value: unknown = saved ? JSON.parse(saved) : []
    return Array.isArray(value) ? value as ResourceLink[] : []
  } catch {
    return []
  }
}

export function saveResourceLinks(links: ResourceLink[]): void {
  localStorage.setItem(LINKS_KEY, JSON.stringify(links))
}
