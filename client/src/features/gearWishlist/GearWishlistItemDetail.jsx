import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  getWishlistItemRequest,
  deleteWishlistItemRequest,
  addOptionRequest,
  updateOptionRequest,
  deleteOptionRequest,
  purchaseOptionRequest,
} from './api.js'
import { OptionForm } from './OptionForm.jsx'
import { LoadingState } from '../../components/LoadingState.jsx'
import { EmptyState } from '../../components/EmptyState.jsx'
import { CATEGORY_LABELS, formatPrice } from '../gear/formatters.js'
import '../activities/ActivityDetail.css'
import './GearWishlist.css'

function OptionRow({ option, wishlistItem, onOptionUpdated, onOptionDeleted, onPurchased }) {
  const [isEditing, setIsEditing] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isPurchasing, setIsPurchasing] = useState(false)
  const [showPurchaseConfirm, setShowPurchaseConfirm] = useState(false)
  const [error, setError] = useState(null)

  const isThePurchasedOption = wishlistItem.isPurchased && String(wishlistItem.purchasedOptionId) === String(option._id)

  async function handleDelete() {
    setIsDeleting(true)
    try {
      await onOptionDeleted(option._id)
    } catch (err) {
      setError(err.message)
      setIsDeleting(false)
    }
  }

  async function handlePurchase() {
    setIsPurchasing(true)
    try {
      await onPurchased(option._id)
      setShowPurchaseConfirm(false)
    } catch (err) {
      setError(err.message)
      setIsPurchasing(false)
    }
  }

  if (isEditing) {
    return (
      <li className="option-row">
        <OptionForm
          initial={option}
          submitLabel="Save changes"
          onCancel={() => setIsEditing(false)}
          onSubmit={async (data) => {
            await onOptionUpdated(option._id, data)
            setIsEditing(false)
          }}
        />
      </li>
    )
  }

  return (
    <li className={`option-row${isThePurchasedOption ? ' purchased' : ''}`}>
      <div className="option-row-main">
        <div>
          <p className="option-row-name">
            {option.name} {isThePurchasedOption && <span className="wishlist-purchased-badge">Purchased</span>}
          </p>
          <p className="option-row-meta">
            {option.priceDzd != null && formatPrice(option.priceDzd)}
            {option.store && ` · ${option.store}`}
          </p>
          {option.productUrl && (
            <p className="option-row-meta">
              <a href={option.productUrl} target="_blank" rel="noreferrer">
                {option.productUrl}
              </a>
            </p>
          )}
          {option.notes && <p className="option-row-notes">{option.notes}</p>}
        </div>

        {!wishlistItem.isPurchased && (
          <div className="option-row-actions">
            <button className="icon-button" onClick={() => setIsEditing(true)}>
              Edit
            </button>
            <button className="icon-button danger" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? 'Removing…' : 'Remove'}
            </button>
            <button className="icon-button primary" onClick={() => setShowPurchaseConfirm(true)}>
              Mark as purchased
            </button>
          </div>
        )}
      </div>

      {error && <p className="auth-form-error">{error}</p>}

      {showPurchaseConfirm && (
        <div className="confirm-dialog-backdrop" role="dialog" aria-modal="true">
          <div className="confirm-dialog">
            <h3>Purchase "{option.name}"?</h3>
            <p>
              This adds it to your Gear Closet with its name, category, store, and price pre-filled, and marks the
              rest of this wishlist item's options as no longer being considered.
            </p>
            <div className="confirm-dialog-actions">
              <button className="icon-button" onClick={() => setShowPurchaseConfirm(false)} disabled={isPurchasing}>
                Cancel
              </button>
              <button className="icon-button primary" onClick={handlePurchase} disabled={isPurchasing}>
                {isPurchasing ? 'Adding…' : 'Confirm purchase'}
              </button>
            </div>
          </div>
        </div>
      )}
    </li>
  )
}

export function GearWishlistItemDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [item, setItem] = useState(null)
  const [error, setError] = useState(null)
  const [loadedId, setLoadedId] = useState(null)
  const [showConfirm, setShowConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isAddingOption, setIsAddingOption] = useState(false)

  const isLoading = loadedId !== id && !error

  useEffect(() => {
    let cancelled = false
    getWishlistItemRequest(id)
      .then((data) => {
        if (!cancelled) {
          setItem(data.wishlistItem)
          setError(null)
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err.message)
      })
      .finally(() => {
        if (!cancelled) setLoadedId(id)
      })
    return () => {
      cancelled = true
    }
  }, [id])

  async function handleDelete() {
    setIsDeleting(true)
    try {
      await deleteWishlistItemRequest(id)
      navigate('/gear')
    } catch (err) {
      setError(err.message)
      setIsDeleting(false)
      setShowConfirm(false)
    }
  }

  async function handleAddOption(data) {
    const result = await addOptionRequest(id, data)
    setItem(result.wishlistItem)
    setIsAddingOption(false)
  }

  async function handleUpdateOption(optionId, data) {
    const result = await updateOptionRequest(id, optionId, data)
    setItem(result.wishlistItem)
  }

  async function handleDeleteOption(optionId) {
    const result = await deleteOptionRequest(id, optionId)
    setItem(result.wishlistItem)
  }

  async function handlePurchaseOption(optionId) {
    const result = await purchaseOptionRequest(id, optionId)
    setItem(result.wishlistItem)
  }

  if (isLoading) return <LoadingState label="Loading wishlist item…" />
  if (error && !item) return <EmptyState title="Couldn't load this item" description={error} />
  if (!item) return null

  return (
    <div>
      <div className="activity-detail-title-row">
        <div>
          <h1>{item.name}</h1>
          <p className="activity-detail-meta">
            {CATEGORY_LABELS[item.category]}
            {item.estimatedBudgetDzd != null && ` · Budget: ${formatPrice(item.estimatedBudgetDzd)}`}
          </p>
        </div>
        <div className="activity-detail-actions">
          {!item.isPurchased && (
            <Link to={`/gear/wishlist/${id}/edit`} className="icon-button">
              Edit
            </Link>
          )}
          <button className="icon-button danger" onClick={() => setShowConfirm(true)}>
            Delete
          </button>
        </div>
      </div>

      {item.isPurchased && (
        <div className="wishlist-purchased-banner">
          Purchased —{' '}
          <Link to={`/gear/${item.purchasedGearItemId}`}>view it in your Gear Closet</Link>
        </div>
      )}

      {item.notes && (
        <div className="detail-section">
          <h2>Notes</h2>
          <p>{item.notes}</p>
        </div>
      )}

      <div className="detail-section">
        <h2>Options {item.options.length > 0 && <span className="usage-count">· {item.options.length} considered</span>}</h2>

        {item.options.length === 0 && !isAddingOption && (
          <p style={{ color: 'var(--color-mist)', fontSize: '0.9rem' }}>
            No options added yet — add a few products you're comparing.
          </p>
        )}

        {item.options.length > 0 && (
          <ul className="option-list">
            {item.options.map((option) => (
              <OptionRow
                key={option._id}
                option={option}
                wishlistItem={item}
                onOptionUpdated={handleUpdateOption}
                onOptionDeleted={handleDeleteOption}
                onPurchased={handlePurchaseOption}
              />
            ))}
          </ul>
        )}

        {!item.isPurchased && (
          <>
            {isAddingOption ? (
              <OptionForm onSubmit={handleAddOption} onCancel={() => setIsAddingOption(false)} />
            ) : (
              <button className="icon-button" onClick={() => setIsAddingOption(true)}>
                + Add an option
              </button>
            )}
          </>
        )}
      </div>

      {showConfirm && (
        <div className="confirm-dialog-backdrop" role="dialog" aria-modal="true">
          <div className="confirm-dialog">
            <h3>Delete "{item.name}"?</h3>
            <p>
              This removes it from your wishlist{item.isPurchased ? ', but keeps the gear item it already produced in your Gear Closet' : ''}.
              This can't be undone.
            </p>
            <div className="confirm-dialog-actions">
              <button className="icon-button" onClick={() => setShowConfirm(false)} disabled={isDeleting}>
                Cancel
              </button>
              <button className="icon-button danger" onClick={handleDelete} disabled={isDeleting}>
                {isDeleting ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
