import { Link } from "react-router-dom";
import "../styles/individual.scss";

function IndividualTraining() {
  return (
    <main className="individual-page">
      {/* ===== Video background ===== */}
      <div className="video-background" aria-hidden="true">
        <video
          className="video-background__video"
          autoPlay
          loop
          muted
          playsInline
        >
          <source src="/videos/Individual.mp4" type="video/mp4" />
        </video>
      </div>

      {/* ===== Overlay hero ===== */}
      <section className="individual">
        <div className="individual_content">
          <h1 className="individual_title">Learn Real English.</h1>
          <h1 className="individual_title">Make Real Progress.</h1>

          <div className="individual_cta">
            <Link className="btn btn--primary individual_button" to="/register">
              Book Your Free Trial
            </Link>
          </div>
        </div>
      </section>

      {/* ===== Benefit bar ===== */}
      <div className="individual_bar" role="list">
        <div className="individual_bar-item" role="listitem">
          <img
            className="individual_bar-image"
            src="/logos/three_bars.98bb3a2d.svg"
            alt=""
          />
          All levels welcome
        </div>
        <div className="individual_bar-item" role="listitem">
          <img
            className="individual_bar-image"
            src="/logos/person_lines.7731e6a9.svg"
            alt=""
          />
          Real conversations with native speakers
        </div>
        <div className="individual_bar-item" role="listitem">
          <img
            className="individual_bar-image"
            src="/Logos/pin.2b4c5ba2.svg"
            alt=""
          />
          Anytime, anywhere, 24/7
        </div>
      </div>

      {/* ===== Goals ===== */}
      <section className="section-goals">
        <div className="goals container">
          <h2 className="goals__title">Start with your goals</h2>
          <p className="goals__description">
            We recommend lessons, topics, and activities to help you reach your
            goals. You choose the things that get you talking, making moves
            toward where you want to go.
          </p>
          <Link to="/packages" className="btn btn--primary goals__button">
            Start learning
          </Link>
        </div>
      </section>

      {/* ===== Split visuals ===== */}
      <section className="learning-section">
        <div className="learning-section__left">
          <img
            className="learning-section__image"
            src="/images/Cambly-LP-HowCamblyworks-1-1.webp"
            alt="Live session example"
          />
        </div>
        <div className="learning-section__right">
          <img
            className="learning-section__image"
            src="/images/Cambly-LP-HowCamblyworks-1-2.webp"
            alt="Async practice example"
          />
        </div>
      </section>
    </main>
  );
}

export default IndividualTraining;
