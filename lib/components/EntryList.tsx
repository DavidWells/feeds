import React, { useEffect, useState } from 'react'
import formatDistance from 'date-fns/formatDistance'
import { SiteEntry } from '../storage'

interface EntryItemProps {
  entry: SiteEntry
  selectedEntryHash: string
  selectEntry?: (entryHash: string) => Promise<void>
  selectSite?: (siteHash: string) => Promise<void>
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
        className="cursor-pointer"
        onClick={() => selectEntry && selectEntry(entry.key)}
      >
        {entry.title}
      </a>
    </h3>
    <small>
      <a
        className="cursor-pointer"
        onClick={() => selectSite && selectSite(entry.key)}
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
  entries: SiteEntry[]
  selectEntry?: (entryHash: string) => Promise<void>
  selectSite?: (siteHash: string) => Promise<void>
  selectBack?: () => void
}

const EntryList = ({
  className,
  entries,
  selectEntry,
  selectSite,
  selectBack
}: EntryListProps) => {
  const [selectedEntryHash, setSelectedEntryHash] = useState<string>('')

  let element: HTMLElement | null = null
  useEffect(() => {
    if (!element) return
  })

  return (
    <section
      ref={(section) => {
        element = section
      }}
      className={`prose pb-4 w-full sm:w-96 flex-shrink-0 p-6 sm:overflow-auto ${className}`}
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
            await selectEntry(entryHash)
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
