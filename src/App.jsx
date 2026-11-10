import React, { useState, useRef, useEffect } from 'react';
import { Link, NavLink, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import {
  ArrowRight, ArrowUpRight, ArrowDown, Menu, X, MoveUpRight, MapPin, Mail,
  Globe2, Layers3, Drill, Waves, Compass, ShieldCheck,
  Microscope, Ruler, Check, ChevronLeft, ChevronRight, ChevronDown,
  Mountain, Ship
} from 'lucide-react';
import { AuthProvider } from './admin/auth';
import RequireAdmin from './admin/RequireAdmin';
import AdminLogin from './admin/AdminLogin';
import AdminLayout from './admin/AdminLayout';
import AdminDashboard from './admin/AdminDashboard';
import AdminImagesPage from './admin/AdminImagesPage';
import AdminHome from './admin/AdminHome';
import AdminServices from './admin/AdminServices';
import AdminProjects from './admin/AdminProjects';
import AdminTeam from './admin/AdminTeam';
import AdminMedia from './admin/AdminMedia';
import AdminSettings from './admin/AdminSettings';
import { SiteContentProvider, useSiteContent, paragraphs } from './lib/siteContent';

const services = [
  { title: 'Geotechnical investigation', text: 'Land and marine soil investigation for informed foundation design.', icon: Layers3, image: '/assets/Geotechnical%20Drilling%20Site%20Cutaway-1.png', imageAlt: 'Geotechnical drilling site cutaway illustration' },
  { title: 'Topographical & hydrographical survey', text: 'Land, river, coastal and project surveys for planning and execution.', icon: Compass, image: '/assets/Topographical%20Hydrographic%20Survey%20Scene-2.png', imageAlt: 'Topographical and hydrographic survey scene illustration' },
  { title: 'Piling, micro piling & anchor drilling', text: 'Foundation, retaining wall and ground-support applications.', icon: Drill, image: '/assets/Technical%20Piling%20and%20Anchor%20Drilling%20Cross-Section-3.png', imageAlt: 'Technical piling and anchor drilling cross-section illustration' },
  { title: 'Grouting', text: 'Grouting solutions for seepage control and foundation requirements.', icon: Waves, image: '/assets/Technical%20Grouting%20Equipment%20and%20Foundation%20Cross-Section-4.png', imageAlt: 'Technical grouting equipment and foundation cross-section illustration' },
  { title: 'Prestressed rock anchor', text: 'Slope stabilisation and foundation raft protection against uplift.', icon: ShieldCheck },
  { title: 'Laboratory testing', text: 'Soil, rock and water testing to support geotechnical interpretation.', icon: Microscope },
];

const SERVICE_ICONS = {
  layers: Layers3,
  compass: Compass,
  drill: Drill,
  waves: Waves,
  shield: ShieldCheck,
  microscope: Microscope,
};

const fallbackServiceImage = (slotKey, index) => {
  const parsed = Number(String(slotKey || '').split('.').pop()) - 1;
  const idx = Number.isFinite(parsed) && parsed >= 0 ? parsed : index;
  return services[idx]?.image || null;
};

const projects = [
  { year: '2026', title: 'Soil investigation & contour survey for proposed 400 kV GIS substation at Padghe', client: 'M.S.E.T.C.L.' },
  { year: '2026', title: 'Nashik Ring Road — 4/6 lane with paved shoulder, Package II', client: 'V H Khatri Construction Pvt. Ltd.' },
  { year: '2026', title: 'Geotechnical investigation for proposed industrial building at Ujjain, Madhya Pradesh', client: 'Alkem Laboratories Ltd.' },
  { year: '2026', title: 'Geotechnical investigation work for proposed STP at Powai, Mumbai', client: 'East India Udyog Ltd.' },
  { year: '2025', title: 'Mukane water supply scheme and new water treatment plant', client: 'Nashik Municipal Corporation' },
  { year: '2025', title: 'Geotechnical investigation for proposed Vadhavan Port, Varor, Palghar', client: 'ITDC · Consultant: SGS Surveys Pvt. Ltd.' },
  { year: '2024', title: 'Geotechnical investigation, topography and contour survey of Gangapur Dam', client: 'JWIL Infra Ltd.' },
  { year: '2024', title: 'Coastal Road Project, Mumbai–Navi Mumbai at Ulwe section', client: 'J Kumar Infra Pvt. Ltd.' },
  { year: '2023', title: 'GTI work for widening of Mangalore–Tumkuru section of NH 73', client: 'DP Jain & Co. Infrastructure Pvt. Ltd.' },
  { year: '2021–22', title: 'Land and marine soil investigation for Chennai–Bengaluru Express Highway', client: 'DP Jain & Co. Infrastructure Pvt. Ltd.' },
];

const genericProjectBody = 'This assignment was carried out as part of the SRS Geotech & Construction company profile, with field investigation, survey and testing coordinated to the project brief. The site conditions, access and working season all shaped how the investigation was sequenced, so the ground answers could be tied back to the design drawings.\n\nRepresentative photographs and test records from the work are held with the project documentation, and the findings were issued to the client and consultant for foundation and execution decisions.';

const disciplines = ['Engineering', 'Geology', 'Survey', 'Drilling', 'Laboratory', 'Accounts'];

const people = [
  { initials: 'RS', years: '30 Years', name: 'Mr. Rajesh Singh', qualification: 'M.Sc. Geology', field: 'Geology' },
  { initials: 'SD', years: '20 Years', name: 'Mr. Shankar Das', qualification: 'Foreman', field: 'Site Supervision' },
  { initials: 'RK', years: '15 Years', name: 'Mr. Rajnish Kumar', qualification: 'Sr. Supervisor', field: 'Site Supervision' },
  { initials: 'RS', years: '10 Years', name: 'Mrs. Ruby Singh', qualification: 'Accountant', field: 'Accounts' },
  { initials: 'SN', years: '8 Years', name: 'Mr. Satish N Chavan', qualification: 'Diploma Civil', field: 'Civil Engineering' },
  { initials: 'SS', years: '7 Years', name: 'Mr. Saransh Singh', qualification: 'B.E. Civil', field: 'Civil Engineering' },
  { initials: 'AD', years: '6 Years', name: 'Mr. Akash Das', qualification: 'Supervisor', field: 'Site Supervision' },
  { initials: 'SS', years: '5 Years', name: 'Mr. Sushant Singh', qualification: 'M.Tech (Geotech)', field: 'Geotechnical Engineering' },
  { initials: 'AB', years: '5 Years', name: 'Mr. Abhijeet Biradar', qualification: 'Draughtsman', field: 'Drafting' },
  { initials: 'AS', years: '4 Years', name: 'Mr. Amit Singh', qualification: 'Sr. Supervisor', field: 'Site Supervision' },
  { initials: 'PY', years: '3 Years', name: 'Mr. Paramveer Yadav', qualification: 'B.Tech', field: 'Engineering' },
  { initials: 'AK', years: '3 Years', name: 'Mr. Aman Kumar', qualification: 'B.Tech', field: 'Engineering' },
  { initials: 'V', years: '2 Years', name: 'Mr. Vishal', qualification: 'M.Tech (Structure)', field: 'Structural Engineering' },
  { initials: 'R', years: '1 Year', name: 'Mr. Ram', qualification: 'Asst. Supervisor', field: 'Site Supervision' },
];

function Header() {
  const [open, setOpen] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [serviceOpen, setServiceOpen] = useState(false);
  const { serviceItems, loading, error } = useSiteContent();
  const navServices = (loading || Boolean(error)) ? services : serviceItems;
  const location = useLocation();
  const isHome = location.pathname === '/';
  const isAbout = location.pathname === '/about';
  const isGlass = isHome || isAbout;
  const close = () => { setOpen(false); setServiceOpen(false); };
  const onServicesClick = (e) => {
    if (window.innerWidth <= 680 && !serviceOpen) { e.preventDefault(); setServiceOpen(true); return; }
    close();
  };
  const openServices = () => setServiceOpen(true);
  const closeServices = () => setServiceOpen(false);
  const onDropBlur = (e) => { if (!e.currentTarget.contains(e.relatedTarget)) setServiceOpen(false); };
  useEffect(() => {
    let last = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      setHidden(y > 140 && y > last && !open);
      last = y;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [open]);
  return <header className={`site-header ${isGlass ? 'site-header-home' : ''} ${isAbout ? 'site-header-about' : ''} ${hidden ? 'site-header-hidden' : ''}`}>
    <div className="header-inner">
      <Link to="/" className="brand" onClick={close}>
        <img src="/assets/srs-mark-dark.png" alt="SRS Geotech & Construction logo" />
        <span><b>SRS GEOTECH</b><small>& CONSTRUCTION</small></span>
      </Link>
      {isGlass && <div className="brand-disciplines"><span>Geotechnical</span><i/><span>Marine</span><i/><span>Infrastructure</span></div>}
      <button className="mobile-toggle" onClick={() => setOpen(!open)} aria-label="Toggle navigation">{open ? <X/> : <Menu/>}</button>
      <nav className={open ? 'nav open' : 'nav'}>
        {[['Home','/'],['About','/about']].map(([label,path]) =>
          <NavLink key={path} to={path} end={path === '/'} onClick={close}>{label}</NavLink>
        )}
        <div className={`nav-dropdown ${serviceOpen ? 'open' : ''}`} onMouseEnter={openServices} onMouseLeave={closeServices} onFocus={openServices} onBlur={onDropBlur}>
          <NavLink to="/services" className="nav-drop-trigger" onClick={onServicesClick}>Services <ChevronDown size={12} className="nav-drop-chev" /></NavLink>
          <div className="nav-drop-menu" role="menu" aria-label="All services">
            {navServices.map((s, i) => (
              <Link key={s.id || s.title || i} to="/services" onClick={close} className="nav-drop-item"><span className="nav-drop-num">0{i + 1}</span><span>{s.title}</span></Link>
            ))}
          </div>
        </div>
        {[['Projects','/projects'],['Contact','/contact']].map(([label,path]) =>
          <NavLink key={path} to={path} end={path === '/'} onClick={close}>{label}</NavLink>
        )}
        <Link className="nav-cta" to="/contact" onClick={close}>Discuss a Project <ArrowUpRight size={15}/></Link>
      </nav>
    </div>
    <div className="nav-drop-overlay" aria-hidden="true" />
  </header>;
}
function Footer() {
  const { pathname } = useLocation();
  const isAbout = pathname === '/about' || pathname === '/company';
  return <footer className={`footer${isAbout ? ' footer-about' : ''}`}>
    <div className="footer-main">
      <div><div className="footer-brand">SRS GEOTECH <span>& CONSTRUCTION</span></div><p>Foundation for tomorrow.</p></div>
      <div className="footer-links"><Link to="/about">About</Link><Link to="/services">Services</Link><Link to="/projects">Projects</Link><Link to="/contact">Contact</Link></div>
      <div className="footer-contact"><a href="mailto:srsgeotech@gmail.com">srsgeotech@gmail.com</a><a href="https://srsgeotech.com" target="_blank" rel="noreferrer">srsgeotech.com <ArrowUpRight size={12}/></a></div>
    </div>
    <div className="footer-bottom"><span>© {new Date().getFullYear()} SRS Geotech & Construction</span><span>Land & Marine · Soil · Rock · Water</span></div>
  </footer>;
}

function PageIntro({ eyebrow, title, text }) {
  return <section className="page-intro wrap"><div className="eyebrow">{eyebrow}</div><h1>{title}</h1>{text && <p>{text}</p>}</section>;
}

function PageIntroDark({ eyebrow, title, text }) {
  return <section className="page-intro-dark"><div className="wrap"><div className="page-intro-id"><span>{eyebrow}</span><i aria-hidden="true" /></div><h1>{title}</h1>{text && <p>{text}</p>}</div></section>;
}

const marqueeImages = [
  { src: '/assets/page-13-01-offshore-drilling-platform.png', alt: 'Offshore drilling platform — marine soil investigation', label: 'Offshore drilling platform' },
  { src: '/assets/page-13-02-jack-up-barge.png', alt: 'Jack-up barge for offshore geotechnical work', label: 'Jack-up barge' },
  { src: '/assets/page-13-03-marine-drilling-pontoon.png', alt: 'Marine drilling pontoon', label: 'Marine pontoon' },
  { src: '/assets/page-13-04-hydraulic-drilling-rig.png', alt: 'Hydraulic drilling rig', label: 'Hydraulic drilling rig' },
  { src: '/assets/page-13-05-plate-load-test.png', alt: 'Plate load test in the field', label: 'Plate load test' },
  { src: '/assets/page-13-06-packer-permeability-test.png', alt: 'On-site packer permeability test', label: 'Packer permeability test' },
];

const marqueeFallbackByKey = Object.fromEntries(
  marqueeImages.map((m, i) => [`home.marquee.${String(i + 1).padStart(2, '0')}`, m])
);

function Marquee() {
  const { marqueeItems, loading, error } = useSiteContent();
  const useFallback = loading || Boolean(error);
  const images = useFallback
    ? marqueeImages
    : marqueeItems
        .map((row) => {
          const fallback = marqueeFallbackByKey[row.slotKey];
          const src = row.src || fallback?.src;
          if (!src) return null;
          return {
            src,
            alt: row.alt || fallback?.alt || row.label,
            label: row.label || fallback?.label,
          };
        })
        .filter(Boolean);
  if (!images.length) return null;
  const track = [...images, ...images];
  return <div className="marquee-wrap" aria-label="Field and marine operations">
    <div className="marquee">
      <div className="marquee-track">
        {track.map((img,i)=> <figure key={i} className="marquee-item"><img src={img.src} alt={img.alt} loading="lazy"/><figcaption>{img.label}</figcaption></figure>)}
      </div>
    </div>
  </div>;
}

const expSlides = [
  { src: '/assets/page-14-01-borehole-drilling.png', alt: 'Geotechnical Investigation — Borehole Drilling' },
  { src: '/assets/page-14-02-calyx-drilling-rig-goa.png', alt: 'Calyx Drilling Rig — Geotechnical Investigation Work at Goa' },
  { src: '/assets/page-14-03-offshore-calyx-drilling-rig.png', alt: 'Calyx Drilling Rig — Marine Geotechnical Investigation, Offshore Drilling' },
  { src: '/assets/page-14-04-ert-test.png', alt: 'ERT Test — Electrical Resistivity Tomography, Goa, India' },
  { src: '/assets/page-15-02-prestressed-rock-anchoring.png', alt: 'Prestressed Rock Anchoring — Strengthen the Construction Roots' },
  { src: '/assets/page-15-03-micro-piling-works.png', alt: 'Micro Piling Works — Precision foundation solutions' },
];

const expCount = expSlides.length;
const expTrack = [...expSlides, ...expSlides, ...expSlides];
const expStart = expCount;
const expResetAt = expCount * 2;

function ExperienceCarousel() {
  const [active, setActive] = useState(expStart);
  const [snap, setSnap] = useState(false);
  React.useEffect(() => {
    if (active < expResetAt) return;
    const t = setTimeout(() => {
      setSnap(true);
      setActive(prev => prev >= expResetAt ? prev - expCount : prev);
      requestAnimationFrame(() => requestAnimationFrame(() => setSnap(false)));
    }, 750);
    return () => clearTimeout(t);
  }, [active]);
  const next = () => {
    if (active >= expResetAt) return;
    setActive(prev => prev + 1);
  };
  const jumpTo = (idx) => {
    const dotIndex = ((active % expCount) + expCount) % expCount;
    const dist = ((idx - dotIndex) % expCount + expCount) % expCount;
    if (!dist) return;
    setActive(active + dist);
  };
  React.useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const id = setInterval(() => setActive(prev => prev >= expResetAt ? prev : prev + 1), 4000);
    return () => clearInterval(id);
  }, []);
  const dotIndex = ((active % expCount) + expCount) % expCount;
  return <div className="exp-carousel" role="region" aria-roledescription="carousel" aria-label="Project photographs">
    <div className="exp-viewport" aria-live="off">
      <div className={`exp-track${snap ? ' exp-snap' : ''}`} style={{ transform: `translateX(calc(${active} * -1 * (var(--exp-w) + var(--exp-gap))))` }}>
        {expTrack.map((img, i) => <figure key={i} className={i === active ? 'exp-slide exp-active' : 'exp-slide'} aria-hidden={i !== active}>
          <img src={img.src} alt={i === active ? img.alt : ''} loading="lazy" draggable="false" />
        </figure>)}
      </div>
    </div>
    <button className="exp-btn exp-next" onClick={next} aria-label="Next photo"><ChevronRight size={22} /></button>
    <div className="exp-dots" role="tablist" aria-label="Choose photo">
      {expSlides.map((img, i) => <button key={i} role="tab" aria-selected={i === dotIndex}
        aria-label={`Go to photo ${i + 1}: ${img.alt}`} className={i === dotIndex ? 'active' : ''} onClick={() => jumpTo(i)} />)}
    </div>
  </div>;
}

function Home() {
  const { serviceItems, projectItems, featureUrl, loading, error } = useSiteContent();
  const useFallback = loading || Boolean(error);
  const mergedServices = (useFallback ? services : serviceItems).map((s, i) => {
    const fallback = services[i];
    return {
      ...s,
      title: s.title || fallback?.title || '',
      text: s.summary || s.text || fallback?.text || '',
      icon: s.icon || fallback?.icon,
      image: s.image || fallbackServiceImage(s.slotKey, i) || fallback?.image || null,
      imageAlt: s.imageAlt || s.title || fallback?.imageAlt || '',
    };
  });
  const teaserProjects = (useFallback ? projects : projectItems).slice(0, 3);
  const bg = [
    { src: '/assets/01-offshore-hero.png', alt: 'Offshore drilling platform over open water' },
    { src: '/assets/02-jackup-barge-hero.png', alt: 'SRS marine jack-up barge at port' },
    { src: '/assets/03-hydraulic-rig-hero.png', alt: 'Hydraulic drilling rig on site' },
  ];
  const fieldOps = [
    { id: 'onshore', label: 'ON-SHORE', icon: Mountain },
    { id: 'offshore', label: 'OFF-SHORE', icon: Ship },
    { id: 'marine', label: 'MARINE', icon: Waves },
  ];
  const fieldImages = [
    { src: featureUrl || '/assets/offshore-survey.jpeg', alt: 'Marine geotechnical drilling operation', caption: 'MARINE INVESTIGATION' },
  ];
  const [activeField, setActiveField] = useState(2);
  const activeItem = fieldImages[0];
  const onFieldKeyDown = (e) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      e.preventDefault();
      const dir = e.key === 'ArrowRight' ? 1 : -1;
      setActiveField((prev) => (prev + dir + fieldOps.length) % fieldOps.length);
    }
  };
  const scrollToNext = () => {
    const el = document.querySelector('.capability-section');
    if (!el) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
  };
  return <>
    <section className="hero hero-reference">
      <div className="hero-stage">
        <div className="hero-image-composition" aria-hidden="true">
          <img className="hero-image-main is-active" src={bg[0].src} alt="" loading="eager"/>
          <div className="hero-image-slash hero-image-slash-one"><img src={bg[0].src} alt=""/></div>
          <div className="hero-image-slash hero-image-slash-two"><img src="/assets/mirror.png" alt=""/></div>
          <div className="hero-image-edge hero-image-edge-one"/>
        </div>
        <div className="hero-reference-shade" aria-hidden="true"/>
        <div className="hero-copy wrap">
          <div className="eyebrow"><span className="eyebrow-line"/> GEOTECHNICAL &amp; CONSTRUCTION</div>
          <h1>Ground Insights.<br/><span>Stronger Structures.</span></h1>
          <p>Geotechnical investigation, survey and foundation solutions<br className="desktop-break"/> for projects on land and offshore.</p>
          <div className="hero-actions"><Link className="button hero-primary" to="/services">Explore Our Services <ArrowRight size={16}/></Link><Link className="hero-secondary" to="/about">About SRS <ArrowRight size={16}/></Link></div>
        </div>
        <img className="hero-ridge-rock" src="/assets/reference-rock-ridge.png" alt="" aria-hidden="true"/>
        <button className="hero-scroll" onClick={scrollToNext} aria-label="Scroll down to services" title="Scroll down"><ArrowDown size={20} /></button>
        <svg className="hero-curve" viewBox="0 0 1673 120" preserveAspectRatio="none" aria-hidden="true">
          <defs><filter id="curveGlow" x="-10%" y="-80%" width="120%" height="260%"><feGaussianBlur stdDeviation="4" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>
          <path className="curve-fill" d="M0 100 C279 100 558 20 836.5 20 C1115 20 1394 100 1673 100 L1673 120 L0 120 Z"/>
          <path className="curve-glow" d="M0 100 C279 100 558 20 836.5 20 C1115 20 1394 100 1673 100"/>
          <path className="curve-line" d="M0 100 C279 100 558 20 836.5 20 C1115 20 1394 100 1673 100"/>
        </svg>
      </div>
    </section>
    <section className="capability-section">
      <img className="capability-rock capability-rock-left" src="/assets/reference-rock-lower-left.png" alt="" aria-hidden="true"/>
      <img className="capability-rock capability-rock-right" src="/assets/reference-rock-lower-right.png" alt="" aria-hidden="true"/>
      <div className="capability-contours" aria-hidden="true"/>
      <div className="capability-inner wrap">
        <p className="capability-statement">We bring together field experience, technical capability and<br className="desktop-break"/> practical execution to deliver reliable and safe foundation solutions.</p>
        <Link to="/about" className="capability-circle" aria-label="Learn about SRS"><ArrowUpRight size={24}/></Link>
      </div>
    </section>
    <section className="section wrap">
      <div className="section-heading"><div><div className="eyebrow">WHAT WE DO</div><h2>Integrated ground<br/>engineering services.</h2></div><Link to="/services" className="plain-link">View all services <ArrowUpRight size={15}/></Link></div>
      <div className="service-preview">{mergedServices.slice(0,4).map((s,i)=><Link to="/services" className="service-tile" key={s.id || s.title || i}><span className="tile-number">0{i+1}</span><h3>{s.title}</h3><p>{s.text}</p>{s.image && <span className="tile-media"><img src={s.image} alt={s.imageAlt || s.title} loading="lazy"/></span>}<ArrowUpRight className="tile-arrow" size={17}/></Link>)}</div>
    </section>
    <Marquee/>
    <Reveal>
    <section className="feature-band" aria-label="Field operations">
      <div className="field-ops-decor field-ops-decor-top" aria-hidden="true" />
      <div className="field-ops-decor field-ops-decor-bottom" aria-hidden="true" />
      <div className="wrap field-ops-inner">
        <div className="field-ops-content">
          <div className="field-ops-id"><span>01 / FIELD OPERATIONS</span><i aria-hidden="true" /></div>
          <h2>One team. Multiple<br/><em>ground conditions.</em></h2>
          <span className="field-ops-rule" aria-hidden="true" />
          <p>From land development to marine investigation, our teams work across varied site environments.</p>
          <div className="field-ops-tabs" role="tablist" aria-label="Ground conditions" onKeyDown={onFieldKeyDown}>
            {fieldOps.map((item, i) => {
              const Icon = item.icon;
              const active = i === activeField;
              return (
                <button
                  key={item.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  aria-controls="field-ops-panel"
                  id={`field-ops-tab-${item.id}`}
                  className={`field-ops-tab${active ? ' is-active' : ''}`}
                  onClick={() => setActiveField(i)}
                >
                  <Icon size={18} strokeWidth={1.5} aria-hidden="true" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
          <Link className="field-ops-cta" to="/services">EXPLORE OUR CAPABILITY <ArrowRight size={16} aria-hidden="true" /></Link>
        </div>
        <figure className="field-ops-media" id="field-ops-panel" aria-label="Marine investigation photo">
          <img src={activeItem.src} alt={activeItem.alt} loading="lazy" />
          <span className="field-ops-shade" aria-hidden="true" />
          <span className="field-ops-corner field-ops-corner-tl" aria-hidden="true" />
          <span className="field-ops-corner field-ops-corner-tr" aria-hidden="true" />
          <span className="field-ops-corner field-ops-corner-bl" aria-hidden="true" />
          <span className="field-ops-corner field-ops-corner-br" aria-hidden="true" />
          <figcaption className="field-ops-caption">
            <strong>{activeItem.caption}</strong>
            <small>FIELD OPERATIONS</small>
          </figcaption>
        </figure>
      </div>
      <span className="field-ops-frame-corner field-ops-frame-corner-tl" aria-hidden="true" />
      <span className="field-ops-frame-corner field-ops-frame-corner-br" aria-hidden="true" />
      <div className="field-ops-extra">
        <section className="section wrap field-ops-experience"><div className="section-heading"><div><div className="eyebrow">SELECTED EXPERIENCE</div><h2>Work that supports<br/>what comes next.</h2></div><Link to="/projects" className="plain-link">Explore projects <ArrowUpRight size={15}/></Link></div><div className="project-teaser">{teaserProjects.map(p=><div className="teaser-row" key={p.id || p.title}><span>{p.year}</span><div><h3>{p.title}</h3><p>{p.client}</p></div><ArrowUpRight size={17}/></div>)}</div></section>
      </div>
    </section>
    </Reveal>
    <ContactBanner/>
  </>;
}

function Reveal({ children, className = '' }) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      el.classList.add('is-visible');
      return;
    }
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add('is-visible');
          obs.disconnect();
        }
      },
      { threshold: 0.12 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return <div ref={ref} className={`reveal ${className}`}>{children}</div>;
}

function PhotoSlot({ src, alt, caption, label, variant = '' }) {
  const cls = `photo-slot ${src ? 'photo-slot--filled' : 'photo-slot--empty'} photo-slot--${variant}`;
  if (!src) {
    return (
      <div className={cls} role="img" aria-label={alt || label}>
        <span className="photo-slot-label">{label || 'Photograph to be added'}</span>
        {caption && <span className="photo-slot-caption">{caption}</span>}
      </div>
    );
  }
  return (
    <figure className={cls}>
      <img src={src} alt={alt || caption || ''} loading="lazy" />
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}

function About() {
  const { aboutUrl, teamItems, aboutItems, loading, error } = useSiteContent();
  const useFallback = loading || Boolean(error);
  const photos = {
    proprietor: aboutUrl('about.proprietor'),
    workforce: aboutUrl('about.workforce'),
    equipmentHero: aboutUrl('about.equipment.hero'),
  };
  const personnel = (useFallback ? people : teamItems).map((m) => ({
    id: m.id,
    name: m.name,
    field: m.role || m.field || '',
    qualification: m.qualification || '',
    years: m.experience || m.years || '',
    photo: m.photo || null,
  }));
  const equipmentCaptions = [
    'Rotary core & hydraulic drilling rigs',
    'SPT & soil sampling systems',
    'Laboratory testing — CBR / permeability / ERT',
    'Field testing — plate load / packer permeability',
  ];
  const equipmentRows = useFallback
    ? equipmentCaptions.map((caption) => ({ src: null, caption }))
    : aboutItems
        .filter((r) => r.slotKey.startsWith('about.equipment.item.'))
        .map((r, i) => ({ src: r.src, caption: r.label || equipmentCaptions[i] || `Equipment ${i + 1}` }));
  return (
    <div className="about-page">
      <Reveal>
        <section className="treatment-a section wrap about-overview">
          <div className="overview-year">
            <strong>2021</strong>
            <span>Established</span>
            <div className="year-rule" />
            <b>Land + Marine</b>
            <small>Soil · Rock · Survey</small>
            <p>SRS GEOTECH &amp; Construction</p>
          </div>
          <div className="body-copy">
            <div className="eyebrow">ABOUT US</div>
            <h2>Practical solutions.<br />Technical understanding.</h2>
            <p>SRS Geotech &amp; Construction was established in 2021 to meet the quality and dynamism of soil and survey work for our valued clients, with full satisfaction of work. We provide on-shore as well as off-shore soil and survey work.</p>
            <p>We believe in accessible, flexible and transparent deals for all our clients and suppliers. With experienced staff, workmanship and leading-edge technologies, we provide reasonable and feasible solutions to soil and survey-related problems and serve our clients better.</p>
            <p>We complete our work not as an assignment but as enjoyment, maintaining a family atmosphere among all.</p>
          </div>
        </section>
      </Reveal>

      <Reveal>
        <section className="treatment-a section wrap about-principles">
          <div className="section-heading">
            <div><div className="eyebrow">HOW WE OPERATE</div><h2>What guides the work.</h2></div>
          </div>
          <div className="principles-grid">
            <div className="principle"><div className="principle-num">01</div><div className="eyebrow">OUR VISION</div><h3>Reliable ground data for better decisions.</h3><p>To provide reliable geological data and geotechnical parameters of value for preparing recommendations and designs — even in difficult site conditions and against demanding client needs.</p></div>
            <div className="principle"><div className="principle-num">02</div><div className="eyebrow">OUR MISSION</div><h3>Quality, delivered with purpose.</h3><p>To become the customer’s most preferred choice through quality, timely completed value-added projects, continuous innovation, state-of-the-art technology, productivity, cost-effectiveness, safety and environment-friendly working.</p></div>
            <div className="principle"><div className="principle-num">03</div><div className="eyebrow">OUR MOTTO</div><h3>Enterprising management.</h3><p>Organized and committed technical staff · Efficient support staff · One-stop, practical solutions for soil and survey-related work.</p></div>
          </div>
        </section>
      </Reveal>

      <Reveal>
        <section className="treatment-b section wrap split-section proprietor-split">
          <PhotoSlot src={photos.proprietor} alt="Proprietor Mr. Rajesh Singh, field operations" label="Proprietor — field operations photograph to be added" variant="tall" />
          <div className="split-content">
            <div className="eyebrow">PROPRIETOR</div>
            <h2>Mr. Rajesh Singh</h2>
            <p className="split-cred">M.Sc. Geology · 30 years of field experience</p>
            <p>Leads the firm’s technical work — scoping assignments, supervising field crews and standing behind every report issued in the firm’s name.</p>
            <ul className="discipline-list">{disciplines.map(d => <li key={d}>{d}</li>)}</ul>
            <div className="capability-rows">
              <div><b>On-shore</b><p>Geotechnical investigation, drilling, piling, anchors, grouting, topographic survey and laboratory testing.</p></div>
              <div><b>Off-shore</b><p>Marine soil investigation and survey operations, including intertidal and offshore environments.</p></div>
            </div>
          </div>
        </section>
      </Reveal>

      <Reveal>
        <section className="treatment-b section wrap split-section workforce-split">
          <div className="split-content">
            <div className="eyebrow">TECHNICAL EXPERTISE · WORKFORCE</div>
            <h2>A multi-skilled field and office team.</h2>
            <p>Behind the proprietor is a team of engineers, geologists, surveyors, drafting staff, supervisors, drilling and marine crews, laboratory staff and support teams — available for both field and office work.</p>
            <p>Our strength lies in a skilled and experienced workforce comprising geologists, civil engineers, drilling operators, supervisors, mechanics, laboratory technicians and trained field personnel. Supported by dedicated technical and operational teams, we bring together the expertise, equipment and execution capabilities required to handle projects efficiently, safely and in accordance with industry standards.</p>
          </div>
          <PhotoSlot src={photos.workforce} alt="Technical team on site" label="Technical team — field operations photograph to be added" variant="tall" />
        </section>
      </Reveal>

      <Reveal>
        <section className="treatment-b section wrap people-section">
          <div className="section-heading">
            <div><div className="eyebrow">OUR PEOPLE</div><h2>Key personnel.</h2></div>
            <p className="heading-note">A qualified, experienced team across geology, engineering, survey, drilling, supervision, laboratory and accounts.</p>
          </div>
          <div className="people-grid">
            {personnel.map((p, i) => (
              <article key={p.id || `${p.name}-${i}`} className="person-card">
                <PhotoSlot src={p.photo} alt={`${p.name}, ${p.field}`} label={`${p.name} — portrait to be added`} variant="portrait" />
                <div className="person-body">
                  <div className="person-top"><h3>{p.name}</h3>{p.years && <span className="person-years">{p.years}</span>}</div>
                  <div className="person-meta">
                    <span><small>Qualification</small><b>{p.qualification}</b></span>
                    <span><small>Field</small><b>{p.field}</b></span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      </Reveal>

      <Reveal>
        <section className="treatment-c showcase-section">
          <div className="wrap showcase-intro">
            <div><div className="eyebrow">EQUIPMENT &amp; TECHNICAL RESOURCES</div><h2>Resources that support the work.</h2></div>
            <p>SRS Geotech &amp; Construction maintains a comprehensive range of modern drilling equipment, field investigation instruments, marine plant and specialised soil mechanics laboratory facilities. Our equipment portfolio includes rotary core drilling rigs, hydraulic drilling systems, Standard Penetration Test (SPT) accessories, soil sampling and testing equipment, CBR and permeability testing systems, Electrical Resistivity Tomography (ERT) instruments, and marine support facilities. These resources enable us to undertake diverse geotechnical investigations, subsurface exploration, field testing and specialised survey operations across varied project environments.</p>
          </div>
          <div className="wrap showcase-hero-wrap">
            <PhotoSlot src={photos.equipmentHero} alt="Marine operations — jack-up barge, pontoon and offshore platform" caption="Marine operations — jack-up / pontoon / offshore platform" label="Marine operations photograph to be added" variant="wide" />
          </div>
          <div className="wrap showcase-grid">
            {equipmentRows.map((item, i) => (
              <PhotoSlot key={`${item.caption}-${i}`} src={item.src} alt={item.caption} caption={item.caption} label={`${item.caption} — photograph to be added`} variant="standard" />
            ))}
          </div>
        </section>
      </Reveal>

      <Reveal>
        <section className="treatment-a section wrap quality-section">
          <div className="section-heading">
            <div><div className="eyebrow">QUALITY ASSURANCE</div><h2>Accountability at every stage.</h2></div>
            <p className="heading-note">Quality and accountability remain central to every stage of our operations.</p>
          </div>
          <div className="qa-grid">
            <div className="qa-row"><Check size={16} /><div><b>Systematic execution</b><p>A systematic approach to project execution, from initial site investigation and field operations to laboratory testing and final reporting.</p></div></div>
            <div className="qa-row"><Check size={16} /><div><b>Equipment maintenance</b><p>Proper equipment maintenance and quality assurance practices to keep plant and instruments field-ready.</p></div></div>
            <div className="qa-row"><Check size={16} /><div><b>Technical supervision</b><p>Technical supervision across field work so subsurface exploration and field testing meet specifications.</p></div></div>
            <div className="qa-row"><Check size={16} /><div><b>Documentation &amp; coordination</b><p>Comprehensive documentation and timely coordination with clients, consultants and relevant authorities.</p></div></div>
          </div>
        </section>
      </Reveal>

      <div className="about-footer-note wrap"><span>INTEGRATED GEOTECHNICAL INVESTIGATION · SURVEY · PILING · GROUTING</span><p>Foundation for Tomorrow — Ulwe · Navi Mumbai · On-shore + Off-shore</p></div>
    </div>
  );
}

function Services() {
  const { serviceItems, loading, error } = useSiteContent();
  const useFallback = loading || Boolean(error);
  const applications = ['Dams, barrages, canals and bridges','Irrigation and drainage','Rainwater harvesting','Housing, commercial and office complexes','Mining exploration and cement factories','Industrial projects','Roads, railways, runways and tunnels','Electrical towers, chimneys and tanks','Ports and harbours','Refinery projects','Water, gas and oil pipeline projects'];
  const detailParagraphs = [
    ['Our geotechnical investigation begins with reading the site before any rig reaches it. Soil boring from 100 mm to 150 mm diameter and rock drilling in PX, HX, NX, BX and EX sizes give us the strata, strength and groundwater picture that foundation design depends on.', 'From strong sandy overburden to weathered rock, each borehole is logged, sampled and photographed so the interpretation can be traced back to the ground. Marine and land rigs are deployed to the same brief — safe access, steady drilling, clean samples.', 'The result is not just a report; it is a ground model the design team can build on with confidence, long after the rigs have left.'],
    ['Topographical and hydrographic survey work starts with control. We set survey markers, run levels and contours, and tie river, coastal and project boundaries back to a single datum so plans, pipelines and dredging volumes all line up.', 'On land, that means highway, residential and commercial development surveys. In water, it covers river cross-sections, coastal bathymetry, and pre- and post-dredging surveys with siltation volume calculations.', 'Accurate levels and sections turn scattered field readings into a survey surface the rest of the project can be built from.'],
    ['Piling, micro piling and anchor drilling solve the problems that shallow foundations cannot. Micro piling from 200 mm to 300 mm diameter, grouting and anchoring to specification, and foundation piles for retaining walls and ground support.', 'Each element is drilled to the specified depth and diameter, grouted and bonded, then tested against the behaviour the design assumed. Workmanship and bond are checked as we go, not assumed after.', 'The outcome is ground support that stays put — whether it is holding a wall, strengthening a raft, or carrying a new structure where soil alone would not.'],
    ['Grouting is quiet, precise work. By controlling mix, pressure and take, we solidify weak zones, cut seepage paths and improve the bearing capacity that foundations rely on, without disturbing the structure above.', 'Seepage control, foundation improvement and ground solidification are treated as one problem: the grout curtain must be continuous, the pressure controlled, and the verification visible in the records.', 'Done well, grouting leaves no trace at the surface — only stronger ground below it.'],
    ['A prestressed rock anchor turns the rock mass itself into the foundation. Anchors are drilled, grouted and tensioned so slopes and rafts are held against movement and uplift, not just friction.', 'Slope stabilisation and foundation raft protection against uplift are two faces of the same principle: anchor the structure to competent rock and prove the bond with load testing.', 'It is a direct answer for ghat slopes, abutments and rafts that cannot afford to move.'],
    ['Laboratory testing closes the loop between field and design. Soil is tested for density, sieve analysis, Atterberg limits, CBR and shear; rock for strength, density, porosity and point load index; water for pH, sulphate, chlorides and turbidity.', 'These parameters are what the geotechnical interpretation is written from. Without them, the field observations would be descriptions, not design values.', 'Testing to a consistent standard is how a site you have never seen becomes a foundation you can sign for.'],
  ];
  const items = useFallback
    ? services.map((s, i) => ({ ...s, body: detailParagraphs[i]?.join('\n\n') || '', image: s.image, imageAlt: s.imageAlt || s.title }))
    : serviceItems.map((s, i) => ({
        ...s,
        title: s.title || `Service ${i + 1}`,
        body: s.body || (detailParagraphs[i]?.join('\n\n') || ''),
        image: s.image || fallbackServiceImage(s.slotKey, i),
        imageAlt: s.title,
      }));
  return <div className="services-page">
    <PageIntroDark eyebrow="02 / SERVICES" title={<>Ground engineering,<br/><span>from investigation to execution.</span></>} text="A connected range of geotechnical, drilling, foundation, survey and laboratory services for infrastructure and development projects."/>
    {items.map((s, i) => {
      const Icon = typeof s.icon === 'string' ? (SERVICE_ICONS[s.icon] || Layers3) : (s.icon || Layers3);
      const body = paragraphs(s.body);
      return (
        <article className={`service-article${i % 2 === 1 ? ' service-article--alt' : ''}`} key={s.id || s.title || i}>
          <div className="wrap service-article-grid">
            <div className="service-article-content">
              <div className="service-article-head">
                <span className="service-num">{String(i + 1).padStart(2, '0')}</span>
                <span className="service-icon"><Icon size={22} /></span>
                <h2>{s.title}</h2>
              </div>
              <div className="article-body">
                {body.length
                  ? body.map((text, j) => <p key={j}>{text}</p>)
                  : s.summary && <p>{s.summary}</p>}
              </div>
              <Link to="/contact" className="article-link">Discuss this service <ArrowUpRight size={15} /></Link>
            </div>
            {s.image
              ? <figure className="photo-slot photo-slot--filled photo-slot--standard article-slot">
                  <img src={s.image} alt={s.imageAlt || s.title} loading="lazy" />
                </figure>
              : <div className="photo-slot photo-slot--empty photo-slot--standard article-slot" role="img" aria-label={`${s.title} — photograph to be added`}>
                  <span className="photo-slot-label">{s.title} — photograph to be added</span>
                </div>}
          </div>
        </article>
      );
    })}
    <section className="technical-section"><div className="wrap"><div className="section-heading"><div><div className="eyebrow">FIELD & TECHNICAL WORK</div><h2>Services in detail.</h2></div></div><div className="technical-grid"><div><h3>Geotechnical investigation</h3><ul><li>Soil boring: 100 mm to 150 mm diameter</li><li>Rock drilling: PX, HX, NX, BX and EX sizes</li><li>Grouting and anchoring as per specifications</li><li>Micro piling: 200 mm to 300 mm diameter, as required</li></ul></div><div><h3>Survey services</h3><ul><li>Topographical surveys for land development and planning</li><li>Regional planning, pipeline and utility design</li><li>Highway, residential and commercial development surveys</li><li>Hydrographic surveys, river cross-sections and coastal bathymetry</li><li>Pre- and post-dredging surveys and siltation volume calculations</li></ul></div><div><h3>Laboratory testing</h3><ul><li>Soil testing: density, sieve analysis, Atterberg limits, CBR and shear tests</li><li>Rock testing: strength, density, porosity and point load index</li><li>Water testing: pH, sulphate, chlorides, turbidity and other listed parameters</li></ul></div></div></div></section>
    <section className="section wrap"><div className="eyebrow">INDUSTRIES & APPLICATIONS</div><h2 className="section-title">Supporting essential infrastructure.</h2><div className="applications-grid">{applications.map((a,i)=><div key={a}><span>{String(i+1).padStart(2,'0')}</span><b>{a}</b></div>)}</div></section>
    <ContactBanner/>
  </div>;
}

function Projects() {
  const { projectItems, galleryItems, loading, error } = useSiteContent();
  const useFallback = loading || Boolean(error);
  const [year, setYear] = useState('All');
  const items = useFallback
    ? projects.map((p) => ({ ...p, body: genericProjectBody, image: null }))
    : projectItems.map((p) => ({
        ...p,
        title: p.title || 'Untitled project',
        body: p.body || genericProjectBody,
        image: p.image,
      }));
  const years = ['All', ...Array.from(new Set(items.map((p) => p.year).filter(Boolean)))];
  const filtered = year === 'All' ? items : items.filter((p) => p.year === year);
  const gallery = useFallback
    ? ['Field investigation', 'Drilling operations', 'Micro piling', 'Rock core logging & sampling'].map((label) => ({ label, src: null }))
    : galleryItems.map((g) => ({ id: g.id, label: g.label || 'Field photograph', src: g.src }));
  const onYearKeyDown = (e) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      e.preventDefault();
      const i = years.indexOf(year);
      const dir = e.key === 'ArrowRight' ? 1 : -1;
      setYear(years[(i + dir + years.length) % years.length]);
    }
  };
  return <div className="projects-page">
    <PageIntroDark eyebrow="03 / EXPERIENCE" title={<>Selected projects.<br/><span>Real work, varied ground.</span></>} text="A selection of assignments listed in the SRS Geotech & Construction company profile."/>
    <section className="section wrap"><div className="project-toolbar"><div className="eyebrow">PROJECT REFERENCES</div><div className="filter-tabs" role="tablist" aria-label="Filter by year" onKeyDown={onYearKeyDown}>{years.map(y=><button className={year===y?'active':''} role="tab" aria-selected={year===y} onClick={()=>setYear(y)} key={y}>{y}</button>)}</div></div><div className="project-list">{filtered.map((p,i)=><article className={`project-article${i % 2 === 1 ? ' project-article--alt' : ''}`} key={p.id || p.title}><div className="project-article-grid"><div className="project-article-content"><div className="project-article-meta"><span className="project-year">{p.year}</span><span aria-hidden="true">·</span><span>Client {p.client}</span></div><h2>{p.title}</h2><div className="article-body">{paragraphs(p.body).map((text, j) => <p key={j}>{text}</p>)}</div><Link to="/contact" className="article-link">Discuss a similar project <ArrowUpRight size={15} /></Link></div>{p.image ? <figure className="photo-slot photo-slot--filled photo-slot--standard article-slot"><img src={p.image} alt={p.imageAlt || p.title} loading="lazy" /></figure> : <div className="photo-slot photo-slot--empty photo-slot--standard article-slot" role="img" aria-label={`${p.title} — photograph to be added`}><span className="photo-slot-label">{p.title} — photograph to be added</span></div>}</div></article>)}</div></section>
    {gallery.length > 0 && <section className="gallery-section"><div className="wrap"><div className="section-heading"><div><div className="eyebrow">ON-SITE PHOTOGRAPHS</div><h2>Work in the field.</h2></div><p>Selected field photographs from the company profile.</p></div><div className="photo-grid">{gallery.map((g, i) => g.src ? <figure key={g.id || `${g.label}-${i}`} className={`photo-slot photo-slot--filled photo-slot--standard${i === 0 ? ' photo-large' : ''}`}><img src={g.src} alt={g.label} loading="lazy" /></figure> : <div key={g.id || `${g.label}-${i}`} className={`photo-slot photo-slot--empty photo-slot--standard${i === 0 ? ' photo-large' : ''}`} role="img" aria-label={`${g.label} — photograph to be added`}><span className="photo-slot-label">{g.label} — photograph to be added</span></div>)}</div></div></section>}
    <ContactBanner/>
  </div>;
}

function ContactMap() {
  return (
    <div className="map-embed">
      <iframe title="Map showing SRS Geotech offices in Ulwe, Navi Mumbai" src="https://www.google.com/maps?q=SRS%20Geotech%20%26%20Construction%20Ulwe%20Navi%20Mumbai&z=13&output=embed" loading="lazy" referrerPolicy="no-referrer-when-downgrade" allowFullScreen />
      <p className="map-embed-note">
        <a href="https://www.google.com/maps/search/?api=1&query=Gurukrupa+Aramus+Sector+21+Ulwe+Navi+Mumbai" target="_blank" rel="noreferrer">Office 01 directions <ArrowUpRight size={12} /></a>
        <span aria-hidden="true"> · </span>
        <a href="https://www.google.com/maps/search/?api=1&query=Shreeji+Darshan+Sector+20+Ulwe+Navi+Mumbai" target="_blank" rel="noreferrer">Office 02 directions <ArrowUpRight size={12} /></a>
      </p>
    </div>
  );
}

function Contact() {
  return <>
    <PageIntro eyebrow="04 / CONTACT" title={<>Let’s discuss your<br/><span>next project.</span></>} text="For geotechnical investigation, survey, piling, grouting and related project enquiries, contact the SRS team."/>
    <section className="section wrap contact-layout"><div className="contact-main"><div className="eyebrow">GET IN TOUCH</div><h2>Start with a<br/>conversation.</h2><p>Share your project location, scope and requirements. The team can discuss the relevant investigation or survey services.</p><a className="button dark" href="mailto:srsgeotech@gmail.com?subject=Project%20Enquiry">Email SRS <ArrowUpRight size={16}/></a><div className="contact-email"><Mail size={17}/><div><small>EMAIL</small><a href="mailto:srsgeotech@gmail.com">srsgeotech@gmail.com</a><a href="mailto:srsgeotech@yahoo.com">srsgeotech@yahoo.com</a></div></div><div className="contact-email"><Globe2 size={17}/><div><small>WEBSITE</small><a href="https://srsgeotech.com" target="_blank" rel="noreferrer">srsgeotech.com</a></div></div></div>
      <div className="address-stack"><article className="address-card"><span className="address-icon"><MapPin size={18}/></span><div className="eyebrow">OFFICE 01</div><h3>Gurukrupa Aramus</h3><p>A–503, Gurukrupa Aramus,<br/>Plot No. 87, Sector 21,<br/>Ulwe, Navi Mumbai – 410206</p></article><article className="address-card"><span className="address-icon"><MapPin size={18}/></span><div className="eyebrow">OFFICE 02</div><h3>Shreeji Darshan</h3><p>Shop No. 04, Shreeji Darshan,<br/>Plot No. 100, Sector 20,<br/>Ulwe, Navi Mumbai – 410206</p></article></div>
    </section>
    <section className="section wrap" style={{paddingTop:0}}><div className="eyebrow">FIND US</div><ContactMap/></section>
  </>;
}

function ContactBanner() {
  return <section className="exp-banner-wrap"><div className="wrap banner-inner"><div><div className="eyebrow light">HAVE A PROJECT IN MIND?</div><h2>Let’s build on<br/>solid ground.</h2></div><Link to="/contact" className="button light-button">Talk to our team <ArrowRight size={16}/></Link></div></section>;
}

function App() {
  const location = useLocation();
  React.useEffect(()=>{window.scrollTo(0,0)},[location.pathname]);

  if (location.pathname === '/admin' || location.pathname.startsWith('/admin/')) {
    return (
      <AuthProvider>
        <Routes>
          <Route path="/admin/login" element={<AdminLogin/>} />
          <Route path="/admin" element={<RequireAdmin><AdminLayout/></RequireAdmin>}>
            <Route index element={<AdminDashboard/>} />
            <Route path="home" element={<AdminHome />} />
            <Route path="about" element={<AdminImagesPage title="About" description="Manage the About-page images. New images are added to the equipment grid." table="about_images" prefix="about" addSlotKeyPrefix="about.equipment.item" addLabel="Add equipment image" />} />
            <Route path="services" element={<AdminServices />} />
            <Route path="projects" element={<AdminProjects />} />
            <Route path="team" element={<AdminTeam />} />
            <Route path="media" element={<AdminMedia />} />
            <Route path="settings" element={<AdminSettings />} />
          </Route>
          <Route path="/admin/*" element={<Navigate to="/admin" replace/>} />
        </Routes>
      </AuthProvider>
    );
  }

  return <SiteContentProvider><Header/><main><Routes><Route path="/" element={<Home/>}/><Route path="/about" element={<About/>}/><Route path="/company" element={<Navigate to="/about" replace/>}/><Route path="/services" element={<Services/>}/><Route path="/projects" element={<Projects/>}/><Route path="/contact" element={<Contact/>}/></Routes></main><Footer/></SiteContentProvider>;
}
export default App;
