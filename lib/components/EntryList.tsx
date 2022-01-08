import React, { UIEvent, useEffect, useState } from 'react'
import formatDistance from 'date-fns/formatDistance'
import { SiteEntry } from '../storage'

interface EntryItemProps {
  entry: SiteEntry
  selectedEntryHash: string
  selectEntry?: (entryHash: string) => void
  selectSite?: (siteHash: string) => void
}

const EntryItem = ({
  entry,
  selectedEntryHash,
  selectEntry,
  selectSite
}: EntryItemProps) => (
  <div
    className={`rounded px-4 ${
      (selectedEntryHash === entry.key && 'bg-gray-200') || ''
    }`.trim()}
  >
    <h3>
      <a
        className="font-serif no-underline hover:underline cursor-pointer"
        onClick={() => selectEntry && selectEntry(entry.key)}
      >
        {entry.title}
      </a>
    </h3>
    <small>
      <a
        className="cursor-pointer"
        onClick={() => selectSite && selectSite(entry.site.key)}
      >
        {entry.site.title}
      </a>
      {entry.timestamp && (
        <span>, {formatDistance(entry.timestamp * 1000, new Date())}</span>
      )}
    </small>
  </div>
)

interface EntryListProps {
  className?: string
  totalEntries: number | null
  entries: SiteEntry[]
  selectEntry?: (entryHash: string) => void
  selectSite?: (siteHash: string) => void
  selectBack?: () => void
}

const EntryList = ({
  className,
  totalEntries,
  entries,
  selectEntry,
  selectSite,
  selectBack
}: EntryListProps) => {
  const [selectedEntryHash, setSelectedEntryHash] = useState<string>('')
  const [page, setPage] = useState<number>(0)
  const [pageState, setPageState] = useState<'loaded' | 'loading'>('loaded')
  const [localEntries, setLocalEntries] = useState<SiteEntry[]>(entries)

  let element: HTMLElement | null = null
  useEffect(() => {
    if (!element) return
    element.scrollTo(0, 0)
  }, [entries])

  const loadNextPage = async (page: number): Promise<void> => {}

  const onScroll = async (event: UIEvent<HTMLElement>) => {
    const target = event.currentTarget
    const threshold = Math.floor(target.scrollHeight * 0.8)
    if (
      target.scrollTop + target.clientHeight > threshold &&
      pageState !== 'loading'
    ) {
      setPageState('loading')
      await loadNextPage(page + 1)
      setPage(page + 1)
      setTimeout(() => {
        setPageState('loaded')
      }, 2000)
    }
  }

  return (
    <section
      ref={(section) => {
        element = section
      }}
      onScroll={onScroll}
      className={`pb-4 w-full sm:w-2/3 xl:w-2/6 flex-shrink-0 p-6 sm:overflow-auto ${className}`}
    >
      <a className="cursor-pointer sm:hidden" onClick={selectBack}>
        ← Back
      </a>
      {entries.map((entry) => (
        <EntryItem
          key={`entry-${entry.key}`}
          entry={entry}
          selectedEntryHash={selectedEntryHash}
          selectEntry={async (entryHash: string) => {
            setSelectedEntryHash(entryHash)
            if (!selectEntry) return
            selectEntry(entryHash)
          }}
          selectSite={selectSite}
        />
      ))}
      {entries.length === 0 && (
        <div key="none">
          <h3>No contents</h3>
        </div>
      )}
      <div className="pb-8"></div>
    </section>
  )
}
export default EntryList
