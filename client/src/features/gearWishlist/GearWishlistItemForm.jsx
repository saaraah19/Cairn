import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createWishlistItemRequest, updateWishlistItemRequest } from './api.js'
import { CATEGORY_LABELS } from '../gear/formatters.js'
import '../activities/ActivityForm.css'
import '../auth/authForms.css'
import '../../pages/pages.css'

const CATEGORY_OPTIONS = Object.entries(CATEGORY_LABELS).map(([value, label]) => ({ value, label }))

export function GearWishlistItemForm({ item }) {
  const navigate = useNavigate()
  const [name, setName] = useState(item?.name ?? '')
  const [category, setCategory] = useState(item?.category ?? CATEGORY_OPTIONS[0].value)
  const [estimatedBudgetDzd, setEstimatedBudgetDzd] = useState(item?.estimatedBudgetDzd ?? '')
  const [notes, setNotes] = useState(item?.notes ?? '')
  const [error, setError] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!name.trim()) {
      setError('Name is required.')
      return
    }
    setError(null)
    setIsSubmitting(true)
    const data = {
      name: name.trim(),
      category,
      estimatedBudgetDzd: estimatedBudgetDzd === '' ? null : Number(estimatedBudgetDzd),
      notes: notes.trim(),
    }
    try {
      if (item) {
        await updateWishlistItemRequest(item._id, data)
        navigate(`/gear/wishlist/${item._id}`)
      } else {
        const result = await createWishlistItemRequest(data)
        navigate(`/gear/wishlist/${result.wishlistItem._id}`)
      }
    } catch (err) {
      setError(err.message)
      setIsSubmitting(false)
    }
  }

  return (
    <div>
      <div className="page-header">
        <h1>{item ? 'Edit wishlist item' : 'Add to wishlist'}</h1>
        <p>What are you thinking of buying? You can compare a few options once it's saved.</p>
      </div>

      <form className="activity-form" onSubmit={handleSubmit}>
        {error && <div className="auth-form-error">{error}</div>}

        <section className="form-section">
          <div className="form-grid">
            <div className="form-field span-2">
              <label htmlFor="wishlist-name">Article / gear type</label>
              <input
                id="wishlist-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Sleeping Mat"
                required
              />
            </div>
            <div className="form-field">
              <label htmlFor="wishlist-category">Category</label>
              <select id="wishlist-category" value={category} onChange={(e) => setCategory(e.target.value)}>
                {CATEGORY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-field">
              <label htmlFor="wishlist-budget">Estimated budget (DZD)</label>
              <input
                id="wishlist-budget"
                type="number"
                min="0"
                value={estimatedBudgetDzd}
                onChange={(e) => setEstimatedBudgetDzd(e.target.value)}
              />
            </div>
            <div className="form-field span-2">
              <label htmlFor="wishlist-notes">Notes</label>
              <textarea id="wishlist-notes" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
          </div>
        </section>

        <button className="primary-action" type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving…' : item ? 'Save changes' : 'Add to wishlist'}
        </button>
      </form>
    </div>
  )
}
