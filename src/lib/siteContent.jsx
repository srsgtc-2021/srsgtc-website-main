import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { supabase, resolveImageUrl } from './supabase';

const SiteContentContext = createContext(null);

const EMPTY = {
  marquee: [],
  about: [],
  services: [],
  projects: [],
  gallery: [],
  team: [],
  home: [],
  seo: [],
  loading: true,
  error: '',
};

const pad = (n) => String(n).padStart(2, '0');

export function paragraphs(text) {
  return String(text || '')
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}

export async function fetchAll() {
  const timeoutSignal = typeof AbortSignal !== 'undefined' && typeof AbortSignal.timeout === 'function'
    ? AbortSignal.timeout(20000)
    : null;
  const query = (table) => {
    const builder = supabase.from(table).select('*').eq('is_active', true).order('sort_order', { ascending: true });
    return timeoutSignal ? builder.abortSignal(timeoutSignal) : builder;
  };
  const contentPromise = Promise.all([
    query('marquee_images'),
    query('about_images'),
    query('services'),
    query('projects'),
    query('project_gallery'),
    query('team_members'),
    query('home_images'),
  ]);
  const seoBuilder = supabase.from('seo_pages').select('*');
  const seoPromise = (timeoutSignal ? seoBuilder.abortSignal(timeoutSignal) : seoBuilder)
    .then(({ data }) => (data || []).map((row) => ({
      ...row,
      og_image_url: resolveImageUrl(row.og_image_url) || null,
    })))
    .catch(() => []);

  const [results, seo] = await Promise.all([contentPromise, seoPromise]);
  const [marquee, about, services, projects, gallery, team, home] = results.map((r) => r.data || []);
  const firstError = results.find((r) => r.error)?.error;
  return { marquee, about, services, projects, gallery, team, home, seo, error: firstError?.message || '' };
}

export function SiteContentProvider({ children, initialData }) {
  const [state, setState] = useState(() => (
    initialData
      ? { ...EMPTY, ...initialData, loading: false, error: initialData.error || '' }
      : EMPTY
  ));

  useEffect(() => {
    let active = true;
    fetchAll()
      .then((data) => { if (active) setState({ ...data, loading: false }); })
      .catch((err) => { if (active) setState((s) => ({ ...s, loading: false, error: err.message })); });
    return () => { active = false; };
  }, []);

  const value = useMemo(() => {
    const aboutMap = Object.fromEntries(state.about.map((r) => [r.slot_key, r.image_url]));
    const servicesMap = Object.fromEntries(state.services.map((r) => [r.slot_key, r.image_url]));
    const projectsMap = Object.fromEntries(state.projects.map((r) => [r.slot_key, r.image_url]));
    const galleryMap = Object.fromEntries(state.gallery.map((r) => [r.slot_key, r.image_url]));
    const homeMap = Object.fromEntries(state.home.map((r) => [r.slot_key, r.image_url]));

    const serviceItems = state.services.map((r) => ({
      id: r.id,
      slotKey: r.slot_key,
      title: r.label || '',
      summary: r.summary || '',
      body: r.body || '',
      icon: r.icon || 'layers',
      image: resolveImageUrl(r.image_url),
    }));

    const projectItems = state.projects.map((r) => ({
      id: r.id,
      slotKey: r.slot_key,
      year: r.year || '',
      title: r.label || '',
      client: r.client || '',
      body: r.body || '',
      image: resolveImageUrl(r.image_url),
    }));

    const galleryItems = state.gallery.map((r) => ({
      id: r.id,
      slotKey: r.slot_key,
      label: r.label || '',
      src: resolveImageUrl(r.image_url),
    }));

    const teamItems = state.team.map((r) => ({
      id: r.id,
      name: r.name,
      role: r.role,
      qualification: r.qualification,
      experience: r.experience,
      bio: r.bio,
      photo: resolveImageUrl(r.image_path),
    }));

    const marqueeItems = state.marquee.map((r) => ({
      id: r.id,
      slotKey: r.slot_key,
      label: r.label || '',
      alt: r.alt_text || r.label || '',
      src: resolveImageUrl(r.image_url),
    }));

    const aboutItems = state.about.map((r) => ({
      id: r.id,
      slotKey: r.slot_key,
      label: r.label || '',
      alt: r.alt_text || r.label || '',
      src: resolveImageUrl(r.image_url),
    }));

    return {
      ...state,
      aboutMap,
      servicesMap,
      projectsMap,
      galleryMap,
      homeMap,
      serviceItems,
      projectItems,
      galleryItems,
      teamItems,
      marqueeItems,
      aboutItems,
      aboutUrl: (key) => resolveImageUrl(aboutMap[key]),
      marqueeByKey: (key) => state.marquee.find((r) => r.slot_key === key) || null,
      serviceUrl: (i) => resolveImageUrl(servicesMap[`services.image.${pad(i + 1)}`]),
      projectUrl: (i) => resolveImageUrl(projectsMap[`projects.card.${pad(i + 1)}`]),
      galleryUrl: (i) => resolveImageUrl(galleryMap[`projects.gallery.${pad(i + 1)}`]),
      featureUrl: resolveImageUrl(homeMap['home.fieldops']),
    };
  }, [state]);

  return <SiteContentContext.Provider value={value}>{children}</SiteContentContext.Provider>;
}

export function useSiteContent() {
  const ctx = useContext(SiteContentContext);
  if (!ctx) throw new Error('useSiteContent must be used within SiteContentProvider');
  return ctx;
}
