import { Link } from 'react-router-dom'
import { CairnMark, Wordmark } from '../components/Logo.jsx'
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

function HeroMark() {
  return (
    <svg
      className="landing-hero-mark"
      viewBox="0 0 360 300"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Faint topographic contour lines — subtle, one place only. */}
      <g fill="none" stroke="var(--color-moss)" strokeWidth="1" opacity="0.18">
        <path d="M20 250c60-40 100-40 160-10s140 10 160-30" />
        <path d="M10 210c70-45 110-45 175-12s130 5 165-35" />
        <path d="M30 285c55-30 95-30 150-5s125 10 155-25" />
      </g>
      <g transform="translate(60 90)">
        <CairnMark size={64} />
      </g>
      <g transform="translate(160 40)">
        <CairnMark size={92} />
      </g>
      <g transform="translate(270 110)">
        <CairnMark size={50} />
      </g>
    </svg>
  )
}

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

      <section className="landing-hero">
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
        <HeroMark />
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
