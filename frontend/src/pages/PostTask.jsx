import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createJob, getCategories } from '../api/resources'
import BottomNav from '../components/BottomNav'

const initialForm = {
  title: '',
  description: '',
  category: '',
  budget: '',
  preferred_date: '',
  preferred_time: '',
  approximate_location: '',
  exact_location: '',
  required_skills: '',
  workers_needed: 1,
}

export default function PostTask() {
  const navigate = useNavigate()
  const [categories, setCategories] = useState([])
  const [form, setForm] = useState(initialForm)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    getCategories().then(setCategories).catch(() => {})
  }, [])

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const job = await createJob(form)
      navigate(`/jobs/${job.id}`)
    } catch (err) {
      const data = err.response?.data
      const message = data ? Object.values(data).flat().join(' ') : 'Could not post this task.'
      setError(message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <div className="page">
        <h2>Post a Task</h2>
        <form onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="title">Title</label>
            <input
              id="title"
              required
              placeholder="Help move a wardrobe upstairs"
              value={form.title}
              onChange={update('title')}
            />
          </div>
          <div className="field">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              required
              rows={4}
              placeholder="Explain what needs to be done"
              value={form.description}
              onChange={update('description')}
            />
          </div>
          <div className="field">
            <label htmlFor="category">Category</label>
            <select id="category" required value={form.category} onChange={update('category')}>
              <option value="" disabled>
                Select a category
              </option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="budget">Budget (₦)</label>
            <input
              id="budget"
              type="number"
              min="0"
              step="1"
              required
              value={form.budget}
              onChange={update('budget')}
            />
          </div>
          <div className="field">
            <label htmlFor="preferred_date">Preferred date</label>
            <input
              id="preferred_date"
              type="date"
              required
              value={form.preferred_date}
              onChange={update('preferred_date')}
            />
          </div>
          <div className="field">
            <label htmlFor="preferred_time">Preferred time</label>
            <input
              id="preferred_time"
              type="time"
              required
              value={form.preferred_time}
              onChange={update('preferred_time')}
            />
          </div>
          <div className="field">
            <label htmlFor="approximate_location">Approximate location</label>
            <input
              id="approximate_location"
              required
              placeholder="e.g. Chevron Estate — Zone B"
              value={form.approximate_location}
              onChange={update('approximate_location')}
            />
          </div>
          <div className="field">
            <label htmlFor="exact_location">Exact location (revealed after assignment)</label>
            <input
              id="exact_location"
              placeholder="e.g. Block 4, House 12"
              value={form.exact_location}
              onChange={update('exact_location')}
            />
          </div>
          <div className="field">
            <label htmlFor="required_skills">Required skills (optional)</label>
            <input
              id="required_skills"
              value={form.required_skills}
              onChange={update('required_skills')}
            />
          </div>
          <div className="field">
            <label htmlFor="workers_needed">Number of workers needed</label>
            <input
              id="workers_needed"
              type="number"
              min="1"
              value={form.workers_needed}
              onChange={update('workers_needed')}
            />
          </div>
          {error && <p className="error-text">{error}</p>}
          <button className="btn btn-primary" type="submit" disabled={submitting}>
            {submitting ? 'Posting…' : 'Post Task'}
          </button>
        </form>
      </div>
      <BottomNav />
    </>
  )
}
