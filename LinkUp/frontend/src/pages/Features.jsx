import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Layout, CreditCard, Camera, Bell, CheckSquare } from 'lucide-react';
import Logo from '../components/Logo';
import './InfoPages.css';

const Features = () => {
  useEffect(() => { window.scrollTo(0, 0); }, []);

  return (
    <div className="info-page">
      <nav className="info-navbar container">
        <Link to="/" className="logo" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
          <Logo size={40} />
          <span className="logo-text" style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--accent-primary)', letterSpacing: '-0.05em' }}>Gatherly</span>
        </Link>
        <Link to="/" className="back-link"></Link>
      </nav>

      <main className="info-content container">
        <header className="info-header">
          <h1>Platform Features</h1>
          <p className="subtitle">Everything you need to run your event flawlessly, neatly organized in one place.</p>
        </header>

        <section className="info-section">
          <h2><Layout className="inline-icon" /> Temporary Private Spaces</h2>
          <p>
            Create isolated digital environments for your groups. A space acts as a central hub where only invited members can interact.
            Once the wedding, trip, or hackathon is over, the space can be archived, preserving the memories without cluttering your digital life forever.
          </p>
        </section>

        <section className="info-section">
          <h2><Camera className="inline-icon" /> Shared Media Gallery</h2>
          <p>
            Stop asking "Can you send me those pictures?"
            The Shared Gallery allows every member to upload high-quality photos and videos in real-time. Everything is categorized chronologically, and members can comment and react to their favorite moments instantly.
          </p>
        </section>

        <section className="info-section">
          <h2><CheckSquare className="inline-icon" /> Collaborative Tasks & Checklists</h2>
          <p>
            Whether it's an itinerary for a vacation or a packing list for a hiking trip, Gatherly's checklist system ensures everyone knows their responsibilities. Assign tasks to specific members and track progress effortlessly.
          </p>
          <ul className="info-list">
            <li>Assign tasks to multiple people</li>
            <li>Set deadlines and reminders</li>
            <li>Track overall space progress</li>
          </ul>
        </section>

        <section className="info-section">
          <h2><CreditCard className="inline-icon" /> Smart Expense Splitting</h2>
          <p>
            Money shouldn't ruin a good trip. Our built-in expense tracker allows anyone to log an expense and specify who was involved.
            Gatherly automatically calculates who owes what, minimizing the number of transactions needed to settle up at the end.
          </p>
        </section>

        <section className="info-section">
          <h2><Bell className="inline-icon" /> Priority Announcements</h2>
          <p>
            Group chats often bury important information under hundreds of messages. Gatherly allows Space Organizers to pin "Announcements" that trigger high-priority notifications for all members, ensuring nobody misses the dinner reservation time or the meeting link.
          </p>
        </section>
      </main>
    </div>
  );
};

export default Features;
