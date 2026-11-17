import {
  SITE_URL,
  SITE_NAME,
  SITE_TAGLINE,
  OFFICES,
  CONTACT_EMAILS,
  absoluteUrl,
  getRouteMeta,
} from './seoConfig.js';

const ORGANIZATION_ID = `${SITE_URL}/#organization`;
const WEBSITE_ID = `${SITE_URL}/#website`;

function excerpt(text, max = 220) {
  const clean = String(text || '').replace(/\s+/g, ' ').trim();
  if (!clean) return '';
  return clean.length > max ? `${clean.slice(0, max - 1).trimEnd()}…` : clean;
}

function organizationSchema() {
  return {
    '@type': 'Organization',
    '@id': ORGANIZATION_ID,
    name: SITE_NAME,
    url: `${SITE_URL}/`,
    slogan: SITE_TAGLINE,
    description:
      'SRS Geotech & Construction provides on-shore and off-shore geotechnical investigation, survey, drilling, foundation, grouting, rock anchoring and laboratory testing services from Ulwe, Navi Mumbai.',
    foundingDate: '2021',
    founder: {
      '@type': 'Person',
      name: 'Mr. Rajesh Singh',
      jobTitle: 'Proprietor',
    },
    logo: {
      '@type': 'ImageObject',
      url: absoluteUrl('/assets/srs-logo-dark.png'),
    },
    image: absoluteUrl('/og-image.jpg'),
    email: CONTACT_EMAILS[0],
    contactPoint: CONTACT_EMAILS.map((email) => ({
      '@type': 'ContactPoint',
      contactType: 'sales',
      email,
      areaServed: { '@type': 'Country', name: 'India' },
      availableLanguage: 'en',
    })),
    location: OFFICES.map((office) => ({
      '@type': 'Place',
      name: office.name,
      address: {
        '@type': 'PostalAddress',
        streetAddress: office.streetAddress,
        addressLocality: office.addressLocality,
        addressRegion: office.addressRegion,
        postalCode: office.postalCode,
        addressCountry: office.addressCountry,
      },
    })),
    areaServed: { '@type': 'Country', name: 'India' },
    knowsAbout: [
      'Geotechnical investigation',
      'Topographical survey',
      'Hydrographic survey',
      'Soil boring',
      'Rock drilling',
      'Piling',
      'Micro piling',
      'Grouting',
      'Prestressed rock anchoring',
      'Laboratory testing',
      'Marine geotechnical investigation',
    ],
  };
}

function websiteSchema() {
  return {
    '@type': 'WebSite',
    '@id': WEBSITE_ID,
    url: `${SITE_URL}/`,
    name: SITE_NAME,
    publisher: { '@id': ORGANIZATION_ID },
    inLanguage: 'en-IN',
  };
}

function imageObjectSchema(meta) {
  return {
    '@type': 'ImageObject',
    url: absoluteUrl(meta.ogImage),
    width: meta.ogImageWidth,
    height: meta.ogImageHeight,
    caption: meta.ogImageAlt,
  };
}

function breadcrumbSchema(route) {
  const items = [{ name: 'Home', item: `${SITE_URL}/` }];
  if (route.path !== '/') {
    items.push({ name: route.breadcrumbLabel || route.title, item: route.canonical });
  }
  return {
    '@type': 'BreadcrumbList',
    '@id': `${route.canonical}#breadcrumb`,
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.item,
    })),
  };
}

function normalizeServices(content) {
  const rows = content.serviceItems || content.services || [];
  return rows.map((row, index) => ({
    title: row.title || row.label || `Service ${index + 1}`,
    summary: row.summary || '',
    body: row.body || '',
  }));
}

function normalizeProjects(content) {
  const rows = content.projectItems || content.projects || [];
  return rows.map((row, index) => ({
    title: row.title || row.label || `Project ${index + 1}`,
    body: row.body || '',
    year: row.year || '',
    client: row.client || '',
  }));
}

function normalizeTeam(content) {
  const rows = content.teamItems || content.team || [];
  return rows.map((row) => ({
    name: row.name || '',
    role: row.role || '',
    qualification: row.qualification || '',
    experience: row.experience || '',
  })).filter((row) => row.name);
}

function servicesList(route, content) {
  const services = normalizeServices(content);
  if (!services.length) return null;
  return {
    '@type': 'ItemList',
    '@id': `${route.canonical}#services`,
    name: 'Geotechnical, survey and foundation services',
    itemListElement: services.map((service, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'Service',
        name: service.title,
        description: service.summary || excerpt(service.body),
        serviceType: service.title,
        provider: { '@id': ORGANIZATION_ID },
        areaServed: { '@type': 'Country', name: 'India' },
        url: `${SITE_URL}/services#service-${String(index + 1).padStart(2, '0')}`,
      },
    })),
  };
}

function projectsList(route, content) {
  const projects = normalizeProjects(content);
  if (!projects.length) return null;
  return {
    '@type': 'ItemList',
    '@id': `${route.canonical}#projects`,
    name: 'Selected project references',
    itemListElement: projects.map((project, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'CreativeWork',
        name: project.title,
        description: [
          project.year,
          project.client ? `Client: ${project.client}` : '',
          excerpt(project.body),
        ].filter(Boolean).join(' · '),
        creator: { '@id': ORGANIZATION_ID },
        url: `${SITE_URL}/projects`,
      },
    })),
  };
}

function teamList(route, content) {
  const team = normalizeTeam(content);
  if (!team.length) return null;
  return {
    '@type': 'ItemList',
    '@id': `${route.canonical}#people`,
    name: 'Key personnel',
    itemListElement: team.map((person, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'Person',
        name: person.name,
        jobTitle: person.role || undefined,
        description: person.qualification
          ? [person.qualification, person.experience ? `${person.experience} experience` : ''].filter(Boolean).join(' · ')
          : undefined,
        worksFor: { '@id': ORGANIZATION_ID },
        knowsAbout: person.qualification || undefined,
      },
    })),
  };
}

export function buildSchemas({ path = '/', meta, content = {} } = {}) {
  const route = meta || getRouteMeta(path);
  const graph = [organizationSchema(), websiteSchema()];

  const page = {
    '@type': route.schemaType || 'WebPage',
    '@id': `${route.canonical}#webpage`,
    url: route.canonical,
    name: route.title,
    description: route.description,
    isPartOf: { '@id': WEBSITE_ID },
    about: { '@id': ORGANIZATION_ID },
    primaryImageOfPage: imageObjectSchema(route),
    breadcrumb: { '@id': `${route.canonical}#breadcrumb` },
    inLanguage: 'en-IN',
  };

  if (route.key === 'contact') {
    page.mainEntity = { '@id': ORGANIZATION_ID };
  }

  graph.push(page, breadcrumbSchema(route));

  if (route.key === 'services') {
    const list = servicesList(route, content);
    if (list) graph.push(list);
  }
  if (route.key === 'projects') {
    const list = projectsList(route, content);
    if (list) graph.push(list);
  }
  if (route.key === 'about') {
    const list = teamList(route, content);
    if (list) graph.push(list);
  }

  return {
    '@context': 'https://schema.org',
    '@graph': graph,
  };
}
