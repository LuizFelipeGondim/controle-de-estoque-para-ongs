import { useEffect, useRef, useState } from 'react'
import './App.css'

/* ─── Particle background ─── */
function HeroParticles() {
  const particles = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    duration: `${6 + Math.random() * 8}s`,
    delay: `${Math.random() * 8}s`,
    size: `${1 + Math.random() * 3}px`,
  }))

  return (
    <div className="hero__particles" aria-hidden="true">
      {particles.map(p => (
        <div
          key={p.id}
          className="hero__particle"
          style={{
            left: p.left,
            bottom: '-10px',
            width: p.size,
            height: p.size,
            '--duration': p.duration,
            '--delay': p.delay,
          }}
        />
      ))}
    </div>
  )
}

/* ─── Scroll-reveal hook ─── */
function useScrollReveal() {
  useEffect(() => {
    const elements = document.querySelectorAll('.reveal')
    const observer = new IntersectionObserver(
      entries => entries.forEach(e => e.isIntersecting && e.target.classList.add('visible')),
      { threshold: 0.12 }
    )
    elements.forEach(el => observer.observe(el))
    return () => observer.disconnect()
  }, [])
}

/* ─── Navbar ─── */
function Navbar() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header className={`navbar ${scrolled ? 'scrolled' : ''}`} role="banner">
      <div className="navbar__brand">
        <div className="navbar__logo-icon" aria-hidden="true">🌱</div>
        <span className="navbar__brand-name">
          ONG<span>Conecta</span>
        </span>
      </div>

      <nav className="navbar__links" aria-label="Navegação principal">
        <a href="#sobre" className="navbar__link">Sobre</a>
        <a href="#valores" className="navbar__link">Valores</a>
        <a href="#contato" className="navbar__link">Contato</a>
      </nav>

      <div className="navbar__actions">
        <button
          id="btn-login"
          className="btn-login"
          aria-label="Entrar na plataforma"
          onClick={() => {/* Login não disponível por ora */ }}
        >
          Entrar
        </button>
      </div>
    </header>
  )
}

/* ─── Hero ─── */
function Hero() {
  return (
    <section className="hero" id="inicio" aria-label="Início">
      <div className="hero__bg" aria-hidden="true" />
      <HeroParticles />

      <div className="hero__content">
        <div className="hero__badge">
          <span className="hero__badge-dot" />
          Transformando vidas desde 2015
        </div>

        <h1 className="hero__title">
          Gerenciando doações com{' '}
          <span className="hero__title-highlight">propósito e transparência</span>
        </h1>

        <p className="hero__subtitle">
          A <strong>ONGConecta</strong> une tecnologia e solidariedade para garantir que cada
          doação chegue a quem mais precisa — com rastreabilidade, eficiência e cuidado.
        </p>

        <div className="hero__cta">
          <a href="#valores" className="btn-primary" id="hero-cta-primary">
            Conheça nosso trabalho ↓
          </a>
          <a href="#contato" className="btn-secondary" id="hero-cta-secondary">
            Entre em contato
          </a>
        </div>
      </div>

      <div className="hero__scroll-hint" aria-hidden="true">
        <span>Scroll</span>
        <span>↓</span>
      </div>
    </section>
  )
}

/* ─── Stats Strip ─── */
function StatsStrip() {
  const stats = [
    { number: '12 mil+', label: 'Famílias atendidas' },
    { number: '320+', label: 'Parceiros ativos' },
    { number: '98%', label: 'Satisfação dos doadores' },
    { number: '8 anos', label: 'De impacto social' },
  ]

  return (
    <section className="stats-strip" aria-label="Números de impacto">
      <div className="stats-strip__inner">
        {stats.map((s, i) => (
          <div key={i} className={`stat-item reveal reveal-delay-${i + 1}`}>
            <div className="stat-item__number">{s.number}</div>
            <div className="stat-item__label">{s.label}</div>
          </div>
        ))}
      </div>
    </section>
  )
}

/* ─── About / Philosophy ─── */
function About() {
  const pillars = [
    {
      icon: '🤝',
      title: 'Parceria e Confiança',
      text: 'Construímos relações duradouras com doadores, voluntários e comunidades locais.',
    },
    {
      icon: '🔍',
      title: 'Transparência Total',
      text: 'Cada item doado é registrado e rastreável — do recebimento à entrega final.',
    },
    {
      icon: '💡',
      title: 'Inovação Social',
      text: 'Usamos tecnologia para tornar a gestão de estoque mais inteligente e eficiente.',
    },
  ]

  return (
    <section className="section about" id="sobre" aria-labelledby="sobre-titulo">
      <div className="section__inner">
        <div className="about__grid">

          <div className="about__visual reveal">
            <div className="about__image-card">
              <div className="about__image-icon">🌍</div>
              <blockquote className="about__image-quote">
                "Acreditamos que a solidariedade, quando organizada, multiplica o impacto
                e transforma realidades de forma duradoura."
                <p className="about__image-quote-author">— Fundadores da ONGConecta</p>
              </blockquote>
            </div>
          </div>

          <div className="about__content">
            <p className="section__tag">Nossa missão</p>
            <h2 id="sobre-titulo" className="about__title reveal">
              Motivações e filosofia que nos movem a agir
            </h2>
            <p className="about__text reveal reveal-delay-1">
              Nascemos da necessidade de combinar empatia com gestão eficiente. Muitas ONGs
              recebem doações valiosas, mas sem um sistema adequado essas doações se perdem,
              vencem ou deixam de chegar às pessoas certas.
            </p>
            <p className="about__text reveal reveal-delay-2">
              Nossa filosofia é simples: <strong>tecnologia a serviço do bem</strong>.
              Acreditamos que ferramentas de gestão de estoque podem — e devem — estar ao
              alcance de organizações que trabalham pelo bem social.
            </p>

            <div className="about__pillars">
              {pillars.map((p, i) => (
                <div key={i} className={`about__pillar reveal reveal-delay-${i + 2}`}>
                  <span className="about__pillar-icon">{p.icon}</span>
                  <div className="about__pillar-content">
                    <p className="about__pillar-title">{p.title}</p>
                    <p className="about__pillar-text">{p.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}


/* ─── Values ─── */
function Values() {
  const vals = [
    { emoji: '❤️', title: 'Solidariedade', text: 'Acreditamos que ajudar o próximo é uma responsabilidade coletiva. Cada ação importa.' },
    { emoji: '⚖️', title: 'Equidade', text: 'Trabalhamos para que recursos cheguem a quem realmente precisa, sem distinções.' },
    { emoji: '🌱', title: 'Sustentabilidade', text: 'Promovemos práticas responsáveis que garantem impacto positivo a longo prazo.' },
    { emoji: '🤝', title: 'Colaboração', text: 'A união de esforços entre pessoas e instituições multiplica o bem que podemos fazer.' },
    { emoji: '📋', title: 'Responsabilidade', text: 'Prestamos contas com rigor e clareza para manter a confiança de todos.' },
    { emoji: '✨', title: 'Esperança', text: 'Acreditamos numa sociedade mais justa e trabalhamos todos os dias por ela.' },
  ]

  return (
    <section className="section values" id="valores" aria-labelledby="valores-titulo">
      <div className="section__inner">
        <div className="section__header">
          <p className="section__tag">Nossa filosofia</p>
          <h2 id="valores-titulo" className="section__title reveal">
            Os valores que guiam cada decisão
          </h2>
        </div>
        <div className="values__grid">
          {vals.map((v, i) => (
            <div key={i} className={`value-card reveal reveal-delay-${(i % 3) + 1}`}>
              <div className="value-card__emoji">{v.emoji}</div>
              <h3 className="value-card__title">{v.title}</h3>
              <p className="value-card__text">{v.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}


/* ─── Donation Banner ─── */
function DonationBanner() {
  return (
    <section className="donate-banner" id="doe" aria-labelledby="donate-titulo">
      <div className="donate-banner__bg" aria-hidden="true" />

      <div className="donate-banner__inner">

        {/* Left: copy */}
        <div className="donate-banner__copy reveal">
          <p className="section__tag">Faça a diferença</p>
          <h2 id="donate-titulo" className="donate-banner__title">
            Sua doação transforma
            <span className="donate-banner__title-highlight"> vidas reais</span>
          </h2>
          <p className="donate-banner__desc">
            Cada contribuição vai diretamente para cestas básicas, medicamentos e
            material escolar distribuídos pela nossa rede de parceiros.
            Juntos chegamos mais longe.
          </p>

          <ul className="donate-banner__impact" aria-label="Exemplos de impacto">
            <li className="donate-banner__impact-item">
              <span className="donate-banner__impact-icon">🍱</span>
              <div>
                <strong>R$ 25</strong>
                <span>alimenta uma família por uma semana</span>
              </div>
            </li>
            <li className="donate-banner__impact-item">
              <span className="donate-banner__impact-icon">📚</span>
              <div>
                <strong>R$ 50</strong>
                <span>kit escolar completo para uma criança</span>
              </div>
            </li>
            <li className="donate-banner__impact-item">
              <span className="donate-banner__impact-icon">💊</span>
              <div>
                <strong>R$ 100</strong>
                <span>medicamentos para um idoso por um mês</span>
              </div>
            </li>
          </ul>
        </div>

        {/* Right: CTA card */}
        <div className="donate-banner__card reveal reveal-delay-2">
          <div className="donate-banner__card-icon">♥️</div>
          <p className="donate-banner__card-label">Quero contribuir</p>
          <p className="donate-banner__card-sub">
            Aceitamos PIX, cartão de crédito e boleto bancário.
            Rápido, fácil e 100% seguro.
          </p>

          <button
            id="btn-donate"
            className="donate-banner__btn"
            type="button"
            onClick={() => { /* página de doação ainda não disponível */ }}
            aria-label="Ir para a página de doação"
          >
            <span>💚</span> Quero doar agora
          </button>

          <p className="donate-banner__card-security">
            🔒 Pagamento seguro &amp; criptografado
          </p>

          <div className="donate-banner__card-methods" aria-label="Formas de pagamento aceitas">
            <span className="donate-banner__method">⚡ PIX</span>
            <span className="donate-banner__method">💳 Cartão</span>
            <span className="donate-banner__method">📄 Boleto</span>
          </div>
        </div>

      </div>
    </section>
  )
}


/* ─── Footer ─── */

function Footer() {
  return (
    <footer className="footer" id="contato" aria-label="Rodapé e informações de contato">
      <div className="footer__inner">
        <div className="footer__top">

          {/* Brand col */}
          <div className="footer__brand">
            <p className="footer__brand-name">ONG<span>Conecta</span></p>
            <p className="footer__brand-desc">
              Tecnologia social para uma gestão de doações mais humana, eficiente e transparente.
            </p>
            <div className="footer__socials" aria-label="Redes sociais">
              <a href="#" className="footer__social-btn" aria-label="Instagram" title="Instagram">📷</a>
              <a href="#" className="footer__social-btn" aria-label="Facebook" title="Facebook">👥</a>
              <a href="#" className="footer__social-btn" aria-label="WhatsApp" title="WhatsApp">💬</a>
              <a href="#" className="footer__social-btn" aria-label="LinkedIn" title="LinkedIn">🔗</a>
            </div>
          </div>

          {/* Links col */}
          <div className="footer__col">
            <p className="footer__col-title">Plataforma</p>
            <ul className="footer__col-links" role="list">
              <li><a href="#valores" className="footer__col-link">Nossos valores</a></li>
              <li><a href="#sobre" className="footer__col-link">Sobre nós</a></li>
              <li><a href="#" className="footer__col-link">Blog</a></li>
            </ul>
          </div>

          {/* Legal col */}
          <div className="footer__col">
            <p className="footer__col-title">Legal</p>
            <ul className="footer__col-links" role="list">
              <li><a href="#" className="footer__col-link">Termos de uso</a></li>
              <li><a href="#" className="footer__col-link">Privacidade</a></li>
              <li><a href="#" className="footer__col-link">Cookies</a></li>
              <li><a href="#" className="footer__col-link">LGPD</a></li>
            </ul>
          </div>

          {/* Contact col */}
          <div className="footer__col">
            <p className="footer__col-title">Contato</p>
            <address style={{ fontStyle: 'normal' }}>
              <p className="footer__contact-item">
                <span>📧</span>
                <span>contato@ongconecta.org.br</span>
              </p>
              <p className="footer__contact-item">
                <span>📞</span>
                <span>(31) 3000-0000</span>
              </p>
              <p className="footer__contact-item">
                <span>📍</span>
                <span>Belo Horizonte, MG — Brasil</span>
              </p>
              <p className="footer__contact-item">
                <span>🕐</span>
                <span>Seg–Sex, 08h às 18h</span>
              </p>
            </address>
          </div>

        </div>

        <div className="footer__bottom">
          <p>© {new Date().getFullYear()} ONGConecta. Todos os direitos reservados.</p>
          <div className="footer__bottom-links">
            <a href="#" className="footer__bottom-link">Termos</a>
            <a href="#" className="footer__bottom-link">Privacidade</a>
            <a href="#" className="footer__bottom-link">Contato</a>
          </div>
        </div>
      </div>
    </footer>
  )
}

/* ─── App Root ─── */
export default function App() {
  useScrollReveal()

  return (
    <>
      <Navbar />
      <main id="main-content">
        <Hero />
        <StatsStrip />
        <About />
        <Values />
        <DonationBanner />
      </main>
      <Footer />
    </>
  )
}
