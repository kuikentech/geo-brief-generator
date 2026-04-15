import React from 'react'

export default function CitationChip({ id, onClick }) {
  return (
    <button
      onClick={() => onClick && onClick(id)}
      className="citation-chip"
      title={`View source ${id}`}
    >
      {id}
    </button>
  )
}
