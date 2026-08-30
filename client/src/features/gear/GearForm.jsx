import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createGearRequest, updateGearRequest } from './api.js'
import '../activities/ActivityForm.css'
import '../auth/authForms.css'
import '../../pages/pages.css'

const emptyForm = {
  name: '',
  category: 'other',
  brand: '',
  model: '',
  quantity: 1,
  weightGrams: '',
  purchaseDate: '',
  purchasePriceDzd: '',
  condition: '',
  store: '',
  productUrl: '',
  notes: '',
}

function gearToForm(gear) {
  return {
    name: gear.name ?? '',
    category: gear.category ?? 'other',
    brand: gear.brand ?? '',
    model: gear.model ?? '',
    quantity: gear.quantity ?? 1,
    weightGrams: gear.weightGrams ?? '',
    purchaseDate: gear.purchaseDate ? gear.purchaseDate.slice(0, 10) : '',
    purchasePriceDzd: gear.purchasePriceDzd ?? '',
    condition: gear.condition ?? '',
    store: gear.store ?? '',
    productUrl: gear.productUrl ?? '',
    notes: gear.notes ?? '',
  }
}

const numOrNull = (v) => (v === '' || v === null || v === undefined ? null : Number(v))

export function GearForm({ gear, gearId }) {
  const navigate = useNavigate()
  const isEditing = Boolean(gearId)
  const [form, setForm] = useState(gear ? gearToForm(gear) : emptyForm)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState(null)

  function set(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)

    if (!form.name.trim()) {
      setError('Name is required.')
      return
    }

    setIsSubmitting(true)
    try {
      const payload = {
        name: form.name.trim(),
        category: form.category,
        brand: form.brand.trim(),
        model: form.model.trim(),
        quantity: Number(form.quantity) || 1,
        weightGrams: numOrNull(form.weightGrams),
        purchaseDate: form.purchaseDate || null,
        purchasePriceDzd: numOrNull(form.purchasePriceDzd),
        condition: form.condition || null,
        store: form.store.trim(),
        productUrl: form.productUrl.trim(),
        notes: form.notes.trim(),
      }

      const result = isEditing
        ? await updateGearRequest(gearId, payload)
        : await createGearRequest(payload)

      navigate(`/gear/${result.gear._id}`)
    } catch (err) {
      setError(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form className="activity-form" onSubmit={handleSubmit}>
      {error && <div className="auth-form-error">{error}</div>}

      <section className="form-section">
        <h2>Item</h2>
        <div className="form-grid">
          <div className="form-field span-2">
            <label htmlFor="name">Name</label>
            <input id="name" value={form.name} onChange={set('name')} required />
          </div>
          <div className="form-field">
            <label htmlFor="category">Category</label>
            <select id="category" value={form.category} onChange={set('category')}>
              <option value="clothing">Clothing</option>
              <option value="footwear">Footwear</option>
              <option value="backpack">Backpack</option>
              <option value="shelter">Shelter</option>
              <option value="sleeping">Sleeping</option>
              <option value="cooking">Cooking</option>
              <option value="hydration">Hydration</option>
              <option value="navigation">Navigation</option>
              <option value="lighting">Lighting</option>
              <option value="safety">Safety</option>
              <option value="accessories">Accessories</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div className="form-field">
            <label htmlFor="quantity">Quantity</label>
            <input id="quantity" type="number" min="1" value={form.quantity} onChange={set('quantity')} />
          </div>
          <div className="form-field">
            <label htmlFor="brand">Brand</label>
            <input id="brand" value={form.brand} onChange={set('brand')} />
          </div>
          <div className="form-field">
            <label htmlFor="model">Model</label>
            <input id="model" value={form.model} onChange={set('model')} />
          </div>
          <div className="form-field">
            <label htmlFor="weightGrams">Weight (g)</label>
            <input id="weightGrams" type="number" min="0" value={form.weightGrams} onChange={set('weightGrams')} />
          </div>
          <div className="form-field">
            <label htmlFor="condition">Condition</label>
            <select id="condition" value={form.condition} onChange={set('condition')}>
              <option value="">—</option>
              <option value="new">New</option>
              <option value="good">Good</option>
              <option value="worn">Worn</option>
              <option value="needs_repair">Needs repair</option>
              <option value="retired">Retired</option>
            </select>
          </div>
        </div>
      </section>

      <section className="form-section">
        <h2>Purchase</h2>
        <div className="form-grid">
          <div className="form-field">
            <label htmlFor="purchaseDate">Purchase date</label>
            <input id="purchaseDate" type="date" value={form.purchaseDate} onChange={set('purchaseDate')} />
          </div>
          <div className="form-field">
            <label htmlFor="purchasePriceDzd">Price (DZD)</label>
            <input
              id="purchasePriceDzd"
              type="number"
              min="0"
              value={form.purchasePriceDzd}
              onChange={set('purchasePriceDzd')}
            />
          </div>
          <div className="form-field span-2">
            <label htmlFor="store">Store</label>
            <input id="store" value={form.store} onChange={set('store')} />
          </div>
          <div className="form-field span-2">
            <label htmlFor="productUrl">Product link</label>
            <input id="productUrl" type="url" value={form.productUrl} onChange={set('productUrl')} />
          </div>
        </div>
      </section>

      <section className="form-section">
        <h2>Notes</h2>
        <div className="form-grid">
          <div className="form-field span-2">
            <textarea
              aria-label="Notes"
              value={form.notes}
              onChange={set('notes')}
            />
          </div>
        </div>
      </section>

      <div className="form-actions">
        <button className="primary-action" type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving…' : isEditing ? 'Save changes' : 'Add gear'}
        </button>
        <button
          type="button"
          className="secondary-action"
          onClick={() => navigate(-1)}
          disabled={isSubmitting}
        >
          Cancel
        </button>
      </div>
    </form>
  )
}
