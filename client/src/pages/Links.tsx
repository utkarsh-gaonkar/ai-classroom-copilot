import { useMemo, useState, type FormEvent } from 'react'
import { Bookmark, ExternalLink, Link2, Plus, Search, Trash2, X } from 'lucide-react'
import type { ResourceLink } from '../types'
import { getResourceLinks, saveResourceLinks } from '../services/linksStorage'

const inputClass = 'w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100'

function formatDate(value: string): string {
  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(value))
}

export default function Links() {
  const [links, setLinks] = useState<ResourceLink[]>(getResourceLinks)
  const [search, setSearch] = useState('')
  const [isAdding, setIsAdding] = useState(false)
  const [title, setTitle] = useState('')
  const [url, setUrl] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [formError, setFormError] = useState('')
  const query = search.trim().toLocaleLowerCase()
  const visibleLinks = useMemo(() => links.filter((item) => [item.title, item.url, item.description, item.category]
    .some((value) => value?.toLocaleLowerCase().includes(query))), [links, query])

  function addLink(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const cleanTitle = title.trim()
    const cleanUrl = url.trim()
    let parsedUrl: URL
    try {
      parsedUrl = new URL(cleanUrl)
    } catch {
      setFormError('Enter a valid web address, such as https://example.com.')
      return
    }
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      setFormError('Use a web address that starts with http:// or https://.')
      return
    }
    if (!cleanTitle) {
      setFormError('Add a title for this resource.')
      return
    }

    const newLink: ResourceLink = {
      id: crypto.randomUUID(),
      title: cleanTitle,
      url: parsedUrl.href,
      ...(description.trim() ? { description: description.trim() } : {}),
      ...(category.trim() ? { category: category.trim() } : {}),
      createdAt: new Date().toISOString(),
    }
    const nextLinks = [newLink, ...links]
    setLinks(nextLinks)
    saveResourceLinks(nextLinks)
    setTitle('')
    setUrl('')
    setDescription('')
    setCategory('')
    setFormError('')
    setIsAdding(false)
  }

  function removeLink(id: string) {
    const nextLinks = links.filter((item) => item.id !== id)
    setLinks(nextLinks)
    saveResourceLinks(nextLinks)
  }

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-7 sm:px-7 lg:px-10 lg:py-10">
      <header className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="mb-2 text-sm font-bold uppercase tracking-[0.12em] text-indigo-700">Your learning space</p>
          <h1 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">Links</h1>
          <p className="mt-2 max-w-2xl text-base leading-7 text-slate-600">Save useful websites and class resources together.</p>
        </div>
        <button type="button" onClick={() => { setFormError(''); setIsAdding((current) => !current) }} aria-label={isAdding ? 'Cancel adding a link' : 'Add a resource link'} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-indigo-700 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-indigo-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-700">
          {isAdding ? <X aria-hidden="true" className="size-4" /> : <Plus aria-hidden="true" className="size-4" />}{isAdding ? 'Cancel' : 'Add a link'}
        </button>
      </header>

      {isAdding && <form onSubmit={addLink} className="mb-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6" aria-labelledby="add-link-heading">
        <h2 id="add-link-heading" className="mb-4 text-lg font-bold text-slate-950">Add a resource</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div><label htmlFor="link-title" className="mb-2 block text-sm font-semibold text-slate-800">Title</label><input id="link-title" type="text" value={title} onChange={(event) => setTitle(event.target.value)} maxLength={100} required placeholder="For example, Biology revision guide" className={inputClass} /></div>
          <div><label htmlFor="link-url" className="mb-2 block text-sm font-semibold text-slate-800">Web address</label><input id="link-url" type="url" value={url} onChange={(event) => setUrl(event.target.value)} required placeholder="https://example.com" aria-describedby={formError ? 'link-form-error' : undefined} className={inputClass} /></div>
          <div><label htmlFor="link-category" className="mb-2 block text-sm font-semibold text-slate-800">Category <span className="font-normal text-slate-500">(optional)</span></label><input id="link-category" type="text" value={category} onChange={(event) => setCategory(event.target.value)} maxLength={40} placeholder="Biology, Research, Study tools…" className={inputClass} /></div>
          <div><label htmlFor="link-description" className="mb-2 block text-sm font-semibold text-slate-800">Description <span className="font-normal text-slate-500">(optional)</span></label><input id="link-description" type="text" value={description} onChange={(event) => setDescription(event.target.value)} maxLength={180} placeholder="What makes this resource useful?" className={inputClass} /></div>
        </div>
        {formError && <p id="link-form-error" role="alert" className="mt-4 text-sm text-rose-700">{formError}</p>}
        <div className="mt-5 flex justify-end"><button type="submit" className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-indigo-700 px-4 py-2 text-sm font-bold text-white hover:bg-indigo-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-700"><Bookmark aria-hidden="true" className="size-4" />Save link</button></div>
      </form>}

      <section className="mb-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5" aria-label="Search saved links">
        <label htmlFor="links-search" className="mb-2 block text-sm font-semibold text-slate-800">Search saved links</label>
        <div className="relative">
          <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <input id="links-search" type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search titles, descriptions, or categories" aria-label="Search links by title, description, or category" className={`${inputClass} pl-10 pr-10`} />
          {search && <button type="button" onClick={() => setSearch('')} aria-label="Clear link search" className="absolute right-2 top-1/2 inline-flex size-8 -translate-y-1/2 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-indigo-600"><X aria-hidden="true" className="size-4" /></button>}
        </div>
      </section>

      <section aria-labelledby="saved-links-heading">
        <div className="mb-4 flex items-center justify-between gap-3"><div><h2 id="saved-links-heading" className="text-lg font-bold text-slate-950">Saved resources</h2><p className="mt-1 text-sm text-slate-500">{links.length} {links.length === 1 ? 'link' : 'links'} stored on this device</p></div></div>
        {visibleLinks.length ? <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {visibleLinks.map((item) => <li key={item.id} className="flex min-w-0 flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-700"><Link2 aria-hidden="true" className="size-5" /></span>
              <div className="min-w-0 flex-1"><h3 className="break-words font-bold text-slate-950">{item.title}</h3><p className="mt-1 break-all text-xs text-slate-500">{item.url}</p></div>
              <button type="button" onClick={() => removeLink(item.id)} aria-label={`Remove ${item.title}`} className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg text-slate-500 hover:bg-rose-50 hover:text-rose-700 focus-visible:outline-2 focus-visible:outline-indigo-600"><Trash2 aria-hidden="true" className="size-4" /></button>
            </div>
            {item.description && <p className="mt-4 text-sm leading-6 text-slate-600">{item.description}</p>}
            <div className="mt-auto flex items-center justify-between gap-3 pt-5">
              <div className="min-w-0">{item.category && <span className="inline-flex max-w-full truncate rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-900">{item.category}</span>}<p className="mt-2 text-xs text-slate-400">Saved {formatDate(item.createdAt)}</p></div>
              <a href={item.url} target="_blank" rel="noopener noreferrer" aria-label={`Open ${item.title} in a new tab`} className="inline-flex min-h-10 shrink-0 items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-indigo-800 hover:bg-indigo-50 focus-visible:outline-2 focus-visible:outline-indigo-600"><ExternalLink aria-hidden="true" className="size-4" />Open</a>
            </div>
          </li>)}
        </ul> : <div className="flex flex-col items-center rounded-xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
          <span className="mb-3 flex size-11 items-center justify-center rounded-full bg-slate-100 text-slate-600"><Bookmark aria-hidden="true" className="size-5" /></span>
          <p className="font-semibold text-slate-900">{query ? 'No matching links' : 'No saved links yet'}</p>
          <p className="mt-1 max-w-sm text-sm leading-6 text-slate-500">{query ? 'Try another search or clear your search.' : 'Save a useful website or class resource to find it again later.'}</p>
          {!query && <button type="button" onClick={() => setIsAdding(true)} className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-lg border border-indigo-200 px-3 py-2 text-sm font-bold text-indigo-800 hover:bg-indigo-50 focus-visible:outline-2 focus-visible:outline-indigo-600"><Plus aria-hidden="true" className="size-4" />Add a link</button>}
        </div>}
      </section>
    </main>
  )
}
