import { Link } from 'react-router-dom'
import { Wordmark } from '../components/Logo.jsx'
import { OutdoorsIcon, GearIcon, StatisticsIcon } from '../components/NavIcons.jsx'
import { PlanIcon, DestinationIcon } from '../components/FeatureIcons.jsx'
import './LandingPage.css'

const LOOP_STEPS = [
  { label: 'Plan', copy: 'Save a destination, sketch out a trip.' },
  { label: 'Prepare', copy: 'Pack your bag from your own gear closet.' },
  { label: 'Live', copy: 'Go outdoors. Hike it, trek it, camp it.' },
  { label: 'Record', copy: 'Log what actually happened — quick or detailed.' },
  { label: 'Remember', copy: 'Photos, notes, and gear, tied to every trip.' },
  { label: 'Understand', copy: 'Watch your journey take shape over time.' },
]

const FEATURES = [
  {
    Icon: OutdoorsIcon,
    title: 'Activity journal',
    copy: 'Every hike, trek, and camping trip, recorded the way you want — a few essentials, or the whole story.',
  },
  {
    Icon: PlanIcon,
    title: 'Plan & prepare',
    copy: 'Plan a trip, then pack your bag from your own gear, with the total weight calculated as you go.',
  },
  {
    Icon: GearIcon,
    title: 'Gear closet',
    copy: 'Track everything you own, and see exactly which trips each item has been on.',
  },
  {
    Icon: DestinationIcon,
    title: 'Destinations',
    copy: 'Save the places you want to remember, or return to.',
  },
  {
    Icon: StatisticsIcon,
    title: 'Statistics',
    copy: 'Distance, elevation, personal records — the story of your outdoor life, in numbers.',
  },
]

export function LandingPage() {
  return (
    <div className="landing">
      <header className="landing-nav">
        <Wordmark />
        <nav className="landing-nav-actions">
          <Link to="/login" className="landing-link">
            Log in
          </Link>
          <Link to="/register" className="landing-btn landing-btn-primary">
            Sign up
          </Link>
        </nav>
      </header>

      <section className="landing-hero" style={{ backgroundImage: 'url(/hero.png)' }}>
        <div className="landing-hero-scrim" />
        <div className="landing-hero-inner">
          <div className="landing-hero-text">
            <h1>Your outdoor life, kept in one place.</h1>
            <p className="landing-hero-sub">
              Cairn is a personal outdoor journal for hikers, trekkers, and campers — plan a trip,
              pack your bag, log what you did, and watch your history take shape. No feed, no
              followers required, just yours.
            </p>
            <div className="landing-hero-actions">
              <Link to="/register" className="landing-btn landing-btn-primary">
                Sign up
              </Link>
              <Link to="/login" className="landing-btn landing-btn-secondary">
                Log in
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="landing-loop">
        <h2>The way Cairn works</h2>
        <ol className="landing-loop-steps">
          {LOOP_STEPS.map((step, i) => (
            <li key={step.label} className="landing-loop-step">
              <span className="landing-loop-index">{i + 1}</span>
              <div>
                <h3>{step.label}</h3>
                <p>{step.copy}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="landing-features">
        <h2>What's inside</h2>
        <div className="landing-features-grid">
          {FEATURES.map(({ Icon, title, copy }) => (
            <div key={title} className="landing-feature">
              <Icon className="landing-feature-icon" />
              <h3>{title}</h3>
              <p>{copy}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="landing-philosophy">
        <p>
          Cairn isn't a spreadsheet, and it isn't a feed. It's a calm, personal record of where
          you've been — built to stay out of your way.
        </p>
      </section>

      <section className="landing-cta">
        <h2>Your outdoor life starts here.</h2>
        <Link to="/register" className="landing-btn landing-btn-primary">
          Sign up
        </Link>
      </section>

      <footer className="landing-footer">
        <Wordmark />
        <Link to="/login" className="landing-link">
          Log in
        </Link>
      </footer>
    </div>
  )
}
