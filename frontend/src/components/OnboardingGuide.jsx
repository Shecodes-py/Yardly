import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './OnboardingGuide.css'

const resident = [
  ['Your household', 'Open Estate to complete your household audit with your unit address and household details. Estate management reviews your submission before granting full access.', '/estate', '.home-status'],
  ['Invite a visitor', 'Choose Invite a visitor, enter their details and expected arrival, then generate a pass. Share the pass code with your visitor for verification at the gate.', '/gate?action=invite', '.home-quick-actions a:nth-child(1)'],
  ['Expect a delivery', 'Register an expected delivery so security can match the rider to your household when they arrive.', '/gate?action=delivery', '.home-quick-actions a:nth-child(2)'],
  ['Estate dues', 'Open Estate dues to see charges and due dates. Follow the payment instructions shown there; online checkout is not yet available.', '/estate?tab=dues', '.home-quick-actions a:nth-child(3)'],
  ['Report an issue', 'Describe the maintenance problem and submit it to management. Return to Maintenance to follow its status.', '/estate?tab=maintenance&action=report', '.home-quick-actions a:nth-child(4)'],
  ['Stay connected', 'Read estate announcements in Community, join conversations and explore neighbourhood services. You can reopen this guide from Help whenever you need it.', '/community', '.home-community'],
]
const admin = [
  ['Review residents', 'Open Resident approvals, review household details and verify only households you have confirmed belong to your estate.', 'Resident approvals'],
  ['Approve security staff', 'Open Security approvals and confirm each officer’s identity and estate assignment before approving access.', 'Security approvals'],
  ['Manage access codes', 'Access codes contains the estate invite code and daily gate code. Share invite codes with eligible households. Rotating the daily code changes the code security uses today.', 'Access codes'],
  ['Publish a notice', 'Use Announcements to write a title and message. Review the email option before publishing: it can send the notice to estate members.', 'Announcements'],
  ['Track maintenance', 'Review Maintenance tickets and update their status as work progresses so residents know what is happening.', 'Maintenance tickets'],
  ['Manage dues', 'Use Levies & payments to create charges and review recorded receipts. Online payment collection is not yet integrated.', 'Levies & payments'],
]
const security = [
  ['Confirm your assignment', 'Check the estate shown on your dashboard. Your account needs estate administrator approval before gate operations are available. Contact management if the assignment is incorrect.'],
  ['Look up a visitor', 'Ask for the visitor’s pass code and enter it in Visitor pass lookup. Check the returned visitor, household and expected arrival details before allowing entry.', '#pass-lookup'],
  ['Record entry', 'Only use the check-in action when the pass is valid and the dashboard permits it. If no match is found or the pass is cancelled, contact the resident or management.', '#pass-lookup'],
  ['Check expected arrivals', 'Expected visitors shows upcoming passes. Use the lookup action to review an individual pass before recording entry.', '#expected-visitors'],
  ['Handle deliveries', 'Review Rider deliveries and confirm the recipient and delivery details before marking the delivery as arrived.'],
  ['Review recent activity', 'Use Recent check-ins to review recorded arrivals. Follow your estate’s procedures for emergencies; do not rely on the app as an emergency response service.', '#recent-checkins'],
]

function read(key) { try { return JSON.parse(localStorage.getItem(key)) || {} } catch { return {} } }
export default function OnboardingGuide() {
  const { user } = useAuth()
  const location = useLocation()
  if (!user || ['/login', '/register', '/forgot-password', '/reset-password'].includes(location.pathname)) return null
  const key = `yardly-guide-v1:${user.id ?? user.email}:${user.role}:${user.status === 'VERIFIED' ? 'approved' : 'pending'}`
  return <Guide key={key} storageKey={key} user={user} />
}

function Guide({ storageKey, user }) {
  const navigate = useNavigate()
  const initial = read(storageKey)
  const [open, setOpen] = useState(!initial.seen)
  const [step, setStep] = useState(Number.isInteger(initial.step) ? Math.max(0, Math.min(initial.step, 5)) : 0)
  const [finished, setFinished] = useState(Boolean(initial.finished))
  const dialog = useRef(null)
  const trigger = useRef(null)
  const role = user.role === 'ESTATE_ADMIN' ? 'admin' : user.role === 'GATE_SECURITY' ? 'security' : 'resident'
  const steps = role === 'admin' ? admin : role === 'security' ? security : resident
  const [title, description, destination, selector] = steps[step]
  useEffect(() => {
    try { localStorage.setItem(storageKey, JSON.stringify({ seen: true, step, finished })) } catch { /* Guide remains usable when storage is unavailable. */ }
  }, [storageKey, step, finished])
  useEffect(() => {
    if (!open) return
    const previous = document.activeElement
    const helpButton = trigger.current
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    dialog.current?.focus()
    const onKey = event => {
      if (event.key === 'Escape') { event.preventDefault(); setOpen(false) }
      if (event.key !== 'Tab') return
      const controls = [...dialog.current.querySelectorAll('button:not(:disabled), a[href]')]
      const first = controls[0], last = controls.at(-1)
      if (event.shiftKey && (document.activeElement === first || document.activeElement === dialog.current)) { event.preventDefault(); last?.focus() }
      else if (!event.shiftKey && (document.activeElement === last || document.activeElement === dialog.current)) { event.preventDefault(); first?.focus() }
    }
    document.addEventListener('keydown', onKey)
    const target = selector && document.querySelector(selector)
    target?.classList.add('guide-highlight')
    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', onKey)
      target?.classList.remove('guide-highlight')
      if (previous?.isConnected) previous.focus()
      else helpButton?.focus()
    }
  }, [open, step, selector])
  const showFeature = () => {
    setOpen(false)
    if (role === 'resident') navigate(destination)
    else if (role === 'security') {
      navigate('/guard-dashboard')
      if (destination) requestAnimationFrame(() => document.querySelector(destination)?.scrollIntoView({ behavior: 'smooth' }))
    } else {
      navigate('/admin-dashboard')
      setTimeout(() => [...document.querySelectorAll('button.admin-nav-item')].find(button => button.title === destination || button.textContent.trim().startsWith(destination))?.click(), 100)
    }
  }
  return <>
    <button ref={trigger} className="guide-help" onClick={() => setOpen(true)} aria-haspopup="dialog">? Help</button>
    {open && <div className="guide-backdrop"><section ref={dialog} className="guide-dialog" role="dialog" aria-modal="true" aria-labelledby="guide-title" aria-describedby="guide-description" tabIndex={-1}>
      <header><span>GETTING STARTED · {role.toUpperCase()}</span><button aria-label="Close guide" onClick={() => setOpen(false)}>×</button></header>
      <h2 id="guide-title">{title}</h2>
      {step === 0 && <p className="guide-welcome">Welcome to Yardly{user.first_name ? `, ${user.first_name}` : ''}. Let’s get you settled in {user.estate?.name || 'your estate'}.</p>}
      {user.status !== 'VERIFIED' && role !== 'admin' && <p className="guide-status">{user.status === 'PENDING_AUDIT' && role === 'resident' ? 'Next step: complete your household audit in Estate.' : 'Your account is awaiting estate approval. This guide explains what to do once access is granted.'}</p>}
      <p id="guide-description">{description}</p>
      <nav aria-label="Walkthrough steps" className="guide-steps">{steps.map(([label], index) => <button key={label} aria-current={step === index ? 'step' : undefined} onClick={() => setStep(index)}><span>{index + 1}</span>{label}</button>)}</nav>
      <button className="guide-feature" onClick={showFeature}>{role === 'security' && !destination ? 'Open gate dashboard' : 'Show me where'} →</button>
      <footer><button onClick={() => setOpen(false)}>Skip for now</button><span>Step {step + 1} of {steps.length}</span><div><button disabled={step === 0} onClick={() => setStep(step - 1)}>Back</button><button className="guide-next" onClick={() => { if (step < steps.length - 1) setStep(step + 1); else { setFinished(true); setOpen(false) } }}>{step === steps.length - 1 ? 'Finish' : 'Next'}</button></div></footer>
      <div className="guide-replay"><small>{finished ? 'Walkthrough completed.' : 'Progress is saved on this browser.'}</small><button onClick={() => { setFinished(false); setStep(0) }}>Replay walkthrough</button></div>
    </section></div>}
  </>
}
