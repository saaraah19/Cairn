import { useState } from 'react'
import './GearWishlist.css'

export function OptionForm({ initial, onSubmit, onCancel, submitLabel = 'Add option' }) {
  const [name, setName] = useState(initial?.name ?? '')
  const [priceDzd, setPriceDzd] = useState(initial?.priceDzd ?? '')
  const [store, setStore] = useState(initial?.store ?? '')
  const [productUrl, setProductUrl] = useState(initial?.productUrl ?? '')
  const [notes, setNotes] = useState(initial?.notes ?? '')
  const [error, setError] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!name.trim()) {
      setError('Option name is required.')
      return
    }
    setError(null)
    setIsSubmitting(true)
    try {
      await onSubmit({
        name: name.trim(),
        priceDzd: priceDzd === '' ? null : Number(priceDzd),
        store: store.trim(),
        productUrl: productUrl.trim(),
        notes: notes.trim(),
      })
    } catch (err) {
      setError(err.message)
      setIsSubmitting(false)
    }
  }

  return (
    <form className="option-form" onSubmit={handleSubmit}>
      {error && <div className="auth-form-error">{error}</div>}
      <div className="option-form-grid">
        <input placeholder="Product name (e.g. SIMOND MT500 Blue)" value={name} onChange={(e) => setName(e.target.value)} />
        <input type="number" min="0" placeholder="Price (DZD)" value={priceDzd} onChange={(e) => setPriceDzd(e.target.value)} />
        <input placeholder="Store" value={store} onChange={(e) => setStore(e.target.value)} />
        <input placeholder="Product link (optional)" value={productUrl} onChange={(e) => setProductUrl(e.target.value)} />
      </div>
      <textarea placeholder="Notes (optional)" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
      <div className="option-form-actions">
        <button type="submit" className="icon-button" disabled={isSubmitting}>
          {isSubmitting ? 'Saving…' : submitLabel}
        </button>
        {onCancel && (
          <button type="button" className="icon-button" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </button>
        )}
      </div>
    </form>
  )
}
