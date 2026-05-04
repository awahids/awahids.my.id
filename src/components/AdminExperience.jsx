import React, { useCallback, useEffect, useState } from 'react';
import { createEmptyExperience, normalizeExperience } from '../lib/experienceData';
import { isSupabaseConfigured, supabase } from '../lib/supabaseClient';

const EXPERIENCE_SELECT =
  'id,title,role,blurb,tag,glyph,sort_order,is_published,updated_at';
const CMS_ITEM_SELECT =
  'id,collection,title,subtitle,summary,payload,sort_order,is_published,updated_at';
const PROJECT_SELECT =
  'id,title,subtitle,summary,year,project_type,role,live_url,case_url,bento,num,problem,built,result,impact,sort_order,is_published,updated_at';
const PROJECT_CHILD_TABLES = {
  focus: { table: 'project_focus', valueField: 'label' },
  scope: { table: 'project_scope', valueField: 'label' },
  stack: { table: 'project_stack', valueField: 'label' },
  outcomes: { table: 'project_outcomes', valueField: 'body' },
  signals: { table: 'project_signals', valueField: 'signal' },
};
const ALLOWED_ADMIN_EMAIL = 'awahid.safhadi@gmail.com';
const ADMIN_MENU = [
  {
    id: 'experience',
    path: '/admin/experience',
    label: 'Experience',
    title: 'Experience content',
    summary: 'Career timeline content shown on the public portfolio.',
    fields: ['Company', 'Role', 'Meta tag', 'Blurb', 'Publish status', 'Sort order'],
    status: 'Live',
  },
  {
    id: 'projects',
    path: '/admin/projects',
    label: 'Portfolio',
    title: 'Portfolio projects',
    summary: 'Project cards, links, stack tags, images, and featured ordering.',
    fields: ['Project name', 'Description', 'Stack', 'Year', 'Links', 'Image'],
    table: 'projects',
    status: 'CRUD',
  },
  {
    id: 'skills',
    path: '/admin/skills',
    label: 'Skills',
    title: 'Skills',
    summary: 'Skill groups, labels, ordering, and highlight status.',
    fields: ['Category', 'Skill name', 'Level', 'Order', 'Highlight'],
    collection: 'skills',
    status: 'CRUD',
  },
  {
    id: 'services',
    path: '/admin/services',
    label: 'Services',
    title: 'Services',
    summary: 'What I Build cards shown on the public landing page.',
    fields: ['Service name', 'Description', 'Order', 'Publish status'],
    collection: 'services',
    status: 'CRUD',
  },
  {
    id: 'certificates',
    path: '/admin/certificates',
    label: 'Certificates',
    title: 'Certificates',
    summary: 'Certificate list, issuer data, credential links, and images.',
    fields: ['Certificate name', 'Issuer', 'Year', 'Credential URL', 'Image'],
    collection: 'certificates',
    status: 'CRUD',
  },
  {
    id: 'profile',
    path: '/admin/profile',
    label: 'Profile',
    title: 'Hero and profile',
    summary: 'Primary intro content, CTA links, CV file link, and profile media.',
    fields: ['Headline', 'Subtitle', 'Location', 'CTA', 'CV link', 'Photo'],
    collection: 'profile',
    status: 'CRUD',
  },
  {
    id: 'about',
    path: '/admin/about',
    label: 'About',
    title: 'About',
    summary: 'Biography, education, and numeric stats shown in the about section.',
    fields: ['Biography', 'Stats', 'Education', 'Tags'],
    collection: 'about',
    status: 'CRUD',
  },
  {
    id: 'contact',
    path: '/admin/contact',
    label: 'Contact',
    title: 'Contact and social links',
    summary: 'Public contact details, social links, and call-to-action copy.',
    fields: ['Email', 'WhatsApp', 'LinkedIn', 'GitHub', 'Social labels'],
    collection: 'contact',
    status: 'CRUD',
  },
  {
    id: 'ai-faq',
    path: '/admin/ai-faq',
    label: 'AI Knowledge',
    title: 'AI knowledge',
    summary: 'Knowledge, FAQ context, and curated answers used by the portfolio assistant.',
    fields: ['Question', 'Answer', 'Topic', 'Visibility', 'Order'],
    collection: 'ai-faq',
    status: 'CRUD',
  },
  {
    id: 'api-settings',
    path: '/admin/api-settings',
    label: 'AI Settings',
    title: 'AI settings',
    summary: 'AI provider runtime settings such as provider, base URL, model list, timeout, and feature toggles.',
    fields: ['Provider', 'Base URL', 'Models', 'Timeout', 'Temperature', 'Max tokens'],
    collection: 'api-settings',
    status: 'Runtime',
  },
  {
    id: 'settings',
    path: '/admin/settings',
    label: 'Settings',
    title: 'Site settings',
    summary: 'SEO metadata, OpenGraph image, analytics, and global switches.',
    fields: ['Site title', 'SEO description', 'OG image', 'Analytics ID'],
    collection: 'settings',
    status: 'CRUD',
  },
];

const getErrorMessage = (error) => {
  if (!error) return '';
  return error.message || String(error);
};

const slugifyId = (value) =>
  String(value || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const isAllowedAdminSession = (nextSession) =>
  String(nextSession?.user?.email || '').toLowerCase() === ALLOWED_ADMIN_EMAIL;

const normalizeCmsItem = (item = {}, collection = '') => ({
  id: String(item.id || '').trim(),
  collection: String(item.collection || collection || '').trim(),
  title: String(item.title || '').trim(),
  subtitle: String(item.subtitle || '').trim(),
  summary: String(item.summary || '').trim(),
  payload:
    item.payload && typeof item.payload === 'object' && !Array.isArray(item.payload)
      ? item.payload
      : {},
  sort_order: Number(item.sort_order) || 0,
  is_published: Boolean(item.is_published),
});

const normalizeProjectSignal = (signal = {}) => ({
  label: String(signal.label || '').trim(),
  value: String(signal.value || '').trim(),
  note: String(signal.note || '').trim(),
});

const normalizeProjectItem = (item = {}) => ({
  ...normalizeCmsItem(item, 'projects'),
  year: String(item.year || '').trim(),
  project_type: String(item.project_type || '').trim(),
  role: String(item.role || '').trim(),
  live_url: String(item.live_url || '#').trim() || '#',
  case_url: String(item.case_url || '#').trim() || '#',
  bento: String(item.bento || 'bento-compact').trim() || 'bento-compact',
  num: String(item.num || '').trim(),
  problem: String(item.problem || '').trim(),
  built: String(item.built || '').trim(),
  result: String(item.result || '').trim(),
  impact: String(item.impact || '').trim(),
  focus: Array.isArray(item.focus) ? item.focus.map(String).map((value) => value.trim()).filter(Boolean) : [],
  scope: Array.isArray(item.scope) ? item.scope.map(String).map((value) => value.trim()).filter(Boolean) : [],
  stack: Array.isArray(item.stack) ? item.stack.map(String).map((value) => value.trim()).filter(Boolean) : [],
  outcomes: Array.isArray(item.outcomes) ? item.outcomes.map(String).map((value) => value.trim()).filter(Boolean) : [],
  signals: Array.isArray(item.signals)
    ? item.signals.map(normalizeProjectSignal).filter((signal) => signal.label || signal.value || signal.note)
    : [],
});

const createEmptyCmsItem = (collection, sortOrder = 10) => ({
  id: '',
  collection,
  title: '',
  subtitle: '',
  summary: '',
  payload: {},
  sort_order: sortOrder,
  is_published: true,
});

const createEmptyProjectItem = (sortOrder = 10) => ({
  ...createEmptyCmsItem('projects', sortOrder),
  year: '',
  project_type: '',
  role: '',
  live_url: '#',
  case_url: '#',
  bento: 'bento-compact',
  num: '',
  problem: '',
  built: '',
  result: '',
  impact: '',
  focus: [],
  scope: [],
  stack: [],
  outcomes: [],
  signals: [],
});

const createEmptyContentItem = (menu, sortOrder = 10) =>
  getContentTableName(menu) === 'projects'
    ? createEmptyProjectItem(sortOrder)
    : createEmptyCmsItem(menu.collection || menu.id || '', sortOrder);

const getContentTableName = (menu) => menu.table || 'cms_items';

const getContentSelect = (tableName) =>
  tableName === 'projects' ? PROJECT_SELECT : CMS_ITEM_SELECT;

const toPersistedContentItem = (item, tableName, collection) => {
  const normalized =
    tableName === 'projects' ? normalizeProjectItem(item) : normalizeCmsItem(item, collection);
  const payload = {
    id: normalized.id,
    title: normalized.title,
    subtitle: normalized.subtitle,
    summary: normalized.summary,
    sort_order: normalized.sort_order,
    is_published: normalized.is_published,
  };

  if (tableName === 'cms_items') {
    payload.collection = normalized.collection;
    payload.payload = normalized.payload;
  } else {
    payload.year = normalized.year;
    payload.project_type = normalized.project_type;
    payload.role = normalized.role;
    payload.live_url = normalized.live_url;
    payload.case_url = normalized.case_url;
    payload.bento = normalized.bento;
    payload.num = normalized.num;
    payload.problem = normalized.problem;
    payload.built = normalized.built;
    payload.result = normalized.result;
    payload.impact = normalized.impact;
  }

  return payload;
};

const parseLines = (value) =>
  String(value || '')
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);

const linesToText = (items = []) => items.join('\n');

const parseSignalsText = (value) =>
  String(value || '')
    .split(/\r?\n/)
    .map((line) => {
      const [label = '', signalValue = '', note = ''] = line.split('|').map((item) => item.trim());
      return { label, value: signalValue, note };
    })
    .filter((signal) => signal.label || signal.value || signal.note);

const signalsToText = (signals = []) =>
  signals
    .map((signal) => [signal.label, signal.value, signal.note].map((item) => String(item || '').trim()).join(' | '))
    .join('\n');

const attachProjectChildren = async (projectItems) => {
  const projectIds = projectItems.map((item) => item.id).filter(Boolean);
  if (!projectIds.length || !supabase) return projectItems.map(normalizeProjectItem);

  const [focusResult, scopeResult, stackResult, outcomesResult, signalsResult] = await Promise.all([
    supabase.from('project_focus').select('project_id,label,sort_order').in('project_id', projectIds).order('sort_order', { ascending: true }),
    supabase.from('project_scope').select('project_id,label,sort_order').in('project_id', projectIds).order('sort_order', { ascending: true }),
    supabase.from('project_stack').select('project_id,label,sort_order').in('project_id', projectIds).order('sort_order', { ascending: true }),
    supabase.from('project_outcomes').select('project_id,body,sort_order').in('project_id', projectIds).order('sort_order', { ascending: true }),
    supabase.from('project_signals').select('project_id,label,value,note,sort_order').in('project_id', projectIds).order('sort_order', { ascending: true }),
  ]);

  const groupLabels = (rows = [], valueField = 'label') =>
    rows.reduce((acc, row) => {
      if (!acc[row.project_id]) acc[row.project_id] = [];
      acc[row.project_id].push(row[valueField]);
      return acc;
    }, {});
  const groupSignals = (rows = []) =>
    rows.reduce((acc, row) => {
      if (!acc[row.project_id]) acc[row.project_id] = [];
      acc[row.project_id].push(normalizeProjectSignal(row));
      return acc;
    }, {});

  const children = {
    focus: groupLabels(focusResult.data || []),
    scope: groupLabels(scopeResult.data || []),
    stack: groupLabels(stackResult.data || []),
    outcomes: groupLabels(outcomesResult.data || [], 'body'),
    signals: groupSignals(signalsResult.data || []),
  };

  return projectItems.map((item) =>
    normalizeProjectItem({
      ...item,
      focus: children.focus[item.id] || [],
      scope: children.scope[item.id] || [],
      stack: children.stack[item.id] || [],
      outcomes: children.outcomes[item.id] || [],
      signals: children.signals[item.id] || [],
    })
  );
};

const replaceProjectChildren = async (projectId, project) => {
  if (!supabase || !projectId) return;

  const deleteResults = await Promise.all(
    Object.values(PROJECT_CHILD_TABLES).map(({ table }) =>
      supabase.from(table).delete().eq('project_id', projectId)
    )
  );
  const failedDelete = deleteResults.find((result) => result.error);
  if (failedDelete?.error) throw failedDelete.error;

  const buildRows = (items = [], valueField = 'label') =>
    items.map((item, index) => ({
      project_id: projectId,
      [valueField]: item,
      sort_order: (index + 1) * 10,
    }));

  const inserts = [
    { table: 'project_focus', rows: buildRows(project.focus) },
    { table: 'project_scope', rows: buildRows(project.scope) },
    { table: 'project_stack', rows: buildRows(project.stack) },
    { table: 'project_outcomes', rows: buildRows(project.outcomes, 'body') },
    {
      table: 'project_signals',
      rows: project.signals.map((signal, index) => ({
        project_id: projectId,
        label: signal.label,
        value: signal.value,
        note: signal.note,
        sort_order: (index + 1) * 10,
      })),
    },
  ];

  const results = await Promise.all(
    inserts
      .filter(({ rows }) => rows.length > 0)
      .map(({ table, rows }) => supabase.from(table).insert(rows))
  );
  const failed = results.find((result) => result.error);
  if (failed?.error) throw failed.error;
};

const parsePayloadText = (value) => {
  const trimmed = String(value || '').trim();
  if (!trimmed) return {};
  return JSON.parse(trimmed);
};

const normalizeAdminPathname = (pathname = '') => {
  const normalized = String(pathname || '').replace(/\/+$/, '');
  return normalized || '/admin/experience';
};

const getActiveAdminMenu = (routePath = '') => {
  const pathname = normalizeAdminPathname(routePath);
  return (
    ADMIN_MENU.find((item) => item.path === pathname) ||
    ADMIN_MENU.find((item) => item.id === 'experience')
  );
};

const AdminExperience = ({ routePath = '/admin/experience', onNavigate }) => {
  const [session, setSession] = useState(null);
  const [authLoading, setAuthLoading] = useState(() => Boolean(supabase));
  const [items, setItems] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [draft, setDraft] = useState(createEmptyExperience());
  const [cmsItems, setCmsItems] = useState([]);
  const [cmsSelectedId, setCmsSelectedId] = useState('');
  const [cmsDraft, setCmsDraft] = useState(createEmptyProjectItem());
  const [cmsPayloadText, setCmsPayloadText] = useState('{}');
  const [isCmsModalOpen, setIsCmsModalOpen] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [isBusy, setIsBusy] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const activeMenu = getActiveAdminMenu(routePath);
  const activeCollection = activeMenu.collection || activeMenu.id || '';
  const activeContentTable = getContentTableName(activeMenu);

  const handleAdminMenuClick = (event, path) => {
    event.preventDefault();
    setIsModalOpen(false);
    setIsCmsModalOpen(false);
    setStatus('');
    setError('');
    onNavigate?.(path);
  };

  const handleNew = useCallback(() => {
    const nextOrder =
      items.length > 0
        ? Math.max(...items.map((item) => Number(item.sort_order) || 0)) + 10
        : 10;

    setSelectedId('');
    setDraft(createEmptyExperience(nextOrder));
    setStatus('');
    setError('');
    setIsModalOpen(true);
  }, [items]);

  const loadExperiences = useCallback(async () => {
    if (!supabase) return;

    setIsBusy(true);
    setError('');

    const { data, error: loadError } = await supabase
      .from('experiences')
      .select(EXPERIENCE_SELECT)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true });

    setIsBusy(false);

    if (loadError) {
      setError(
        `Tidak bisa membuka data CMS. Hanya ${ALLOWED_ADMIN_EMAIL} yang punya akses admin. Detail: ${getErrorMessage(loadError)}`
      );
      return;
    }

    const nextItems = (data || []).map(normalizeExperience);
    setItems(nextItems);

    if (nextItems.length > 0) {
      setSelectedId(nextItems[0].id);
      setDraft(normalizeExperience(nextItems[0]));
      return;
    }

    setSelectedId('');
    setDraft(createEmptyExperience());
  }, []);

  const loadCmsItems = useCallback(async (menu) => {
    const tableName = getContentTableName(menu);
    const collection = menu.collection || menu.id || '';
    if (!supabase || !collection) return;

    setIsBusy(true);
    setError('');

    let query = supabase
      .from(tableName)
      .select(getContentSelect(tableName))
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true });

    if (tableName === 'cms_items') {
      query = query.eq('collection', collection);
    }

    const { data, error: loadError } = await query;

    setIsBusy(false);

    if (loadError) {
      setError(
        `Tidak bisa membuka data ${collection}. Pastikan SQL ${tableName} sudah dijalankan. Detail: ${getErrorMessage(loadError)}`
      );
      return;
    }

    const nextItems =
      tableName === 'projects'
        ? await attachProjectChildren(data || [])
        : (data || []).map((item) => normalizeCmsItem(item, collection));
    setCmsItems(nextItems);

    if (nextItems.length > 0) {
      const firstItem = nextItems[0];
      setCmsSelectedId(firstItem.id);
      setCmsDraft(firstItem);
      setCmsPayloadText(JSON.stringify(firstItem.payload || {}, null, 2));
      return;
    }

    const emptyItem = createEmptyContentItem(menu);
    setCmsSelectedId('');
    setCmsDraft(emptyItem);
    setCmsPayloadText('{}');
  }, []);

  useEffect(() => {
    if (!supabase) {
      return undefined;
    }

    let mounted = true;
    const clearAdminState = () => {
      setItems([]);
      setSelectedId('');
      setDraft(createEmptyExperience());
      setCmsItems([]);
      setCmsSelectedId('');
      setCmsDraft(createEmptyContentItem(activeMenu));
      setCmsPayloadText('{}');
    };

    const applySession = async (nextSession) => {
      if (!nextSession) {
        setSession(null);
        clearAdminState();
        return;
      }

      if (!isAllowedAdminSession(nextSession)) {
        const currentEmail = nextSession.user?.email || 'unknown email';
        await supabase.auth.signOut();
        setSession(null);
        clearAdminState();
        setError(`Email ${currentEmail} tidak diizinkan. Gunakan ${ALLOWED_ADMIN_EMAIL}.`);
        return;
      }

      setSession(nextSession);
      setError('');
      if (activeMenu.id === 'experience') {
        loadExperiences();
      } else {
        loadCmsItems(activeMenu);
      }
    };

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setAuthLoading(false);
      applySession(data.session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      applySession(nextSession);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [activeMenu, activeMenu.id, loadCmsItems, loadExperiences]);

  const handleGoogleLogin = async () => {
    if (!supabase) return;

    setIsBusy(true);
    setError('');
    setStatus('Redirecting to Google...');

    const redirectTo =
      typeof window !== 'undefined'
        ? `${window.location.origin}${normalizeAdminPathname(window.location.pathname)}`
        : undefined;

    const { error: loginError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
        queryParams: {
          login_hint: ALLOWED_ADMIN_EMAIL,
          prompt: 'select_account',
        },
      },
    });

    if (loginError) {
      setIsBusy(false);
      setStatus('');
      setError(getErrorMessage(loginError));
    }
  };

  const handleLogout = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    setItems([]);
    setSelectedId('');
    setDraft(createEmptyExperience());
    setCmsItems([]);
    setCmsSelectedId('');
    setCmsDraft(createEmptyContentItem(activeMenu));
    setCmsPayloadText('{}');
    setStatus('');
    setError('');
  };

  const handleSelectItem = (item) => {
    setSelectedId(item.id);
    setDraft(normalizeExperience(item));
    setStatus('');
    setError('');
    setIsModalOpen(true);
  };

  const updateDraft = (field, value) => {
    setDraft((current) => {
      const next = { ...current, [field]: value };

      if (field === 'title' && !selectedId && !current.id) {
        next.id = slugifyId(value);
      }

      return next;
    });
  };

  const handleCmsNew = () => {
    const nextOrder =
      cmsItems.length > 0
        ? Math.max(...cmsItems.map((item) => Number(item.sort_order) || 0)) + 10
        : 10;
    const emptyItem = createEmptyContentItem(activeMenu, nextOrder);

    setCmsSelectedId('');
    setCmsDraft(emptyItem);
    setCmsPayloadText('{}');
    setStatus('');
    setError('');
    setIsCmsModalOpen(true);
  };

  const handleCmsSelectItem = (item) => {
    const normalized =
      activeContentTable === 'projects'
        ? normalizeProjectItem(item)
        : normalizeCmsItem(item, activeCollection);

    setCmsSelectedId(normalized.id);
    setCmsDraft(normalized);
    setCmsPayloadText(JSON.stringify(normalized.payload || {}, null, 2));
    setStatus('');
    setError('');
    setIsCmsModalOpen(true);
  };

  const updateCmsDraft = (field, value) => {
    setCmsDraft((current) => {
      const next = { ...current, [field]: value };

      if (field === 'title' && !cmsSelectedId && !current.id) {
        next.id = `${activeCollection}-${slugifyId(value)}`;
      }

      return next;
    });
  };

  const handleCmsSave = async (event) => {
    event.preventDefault();
    if (!supabase || !activeCollection) return;

    let payload = {};
    if (activeContentTable === 'cms_items') {
      try {
        payload = parsePayloadText(cmsPayloadText);
      } catch {
        setError('Payload JSON tidak valid.');
        return;
      }
    }

    const normalized =
      activeContentTable === 'projects'
        ? normalizeProjectItem(cmsDraft)
        : normalizeCmsItem(
            {
              ...cmsDraft,
              collection: activeCollection,
              payload,
            },
            activeCollection
          );

    if (!normalized.id || !normalized.title) {
      setError('ID dan title wajib diisi.');
      return;
    }

    setIsBusy(true);
    setError('');
    setStatus('');

    const persisted = toPersistedContentItem(
      {
        ...normalized,
        collection: activeCollection,
      },
      activeContentTable,
      activeCollection
    );

    const { data, error: saveError } = await supabase
      .from(activeContentTable)
      .upsert(persisted, { onConflict: 'id' })
      .select(getContentSelect(activeContentTable))
      .single();

    if (saveError) {
      setIsBusy(false);
      setError(getErrorMessage(saveError));
      return;
    }

    let saved =
      activeContentTable === 'projects'
        ? normalizeProjectItem({ ...data, ...normalized })
        : normalizeCmsItem(data, activeCollection);

    if (activeContentTable === 'projects') {
      try {
        await replaceProjectChildren(saved.id, normalized);
        saved = normalizeProjectItem({ ...saved, ...normalized });
      } catch (childError) {
        setIsBusy(false);
        setError(getErrorMessage(childError));
        return;
      }
    }

    setIsBusy(false);

    setCmsItems((current) => {
      const exists = current.some((item) => item.id === saved.id);
      const merged = exists
        ? current.map((item) => (item.id === saved.id ? saved : item))
        : [...current, saved];

      return merged.sort((a, b) => a.sort_order - b.sort_order);
    });
    setCmsSelectedId(saved.id);
    setCmsDraft(saved);
    setCmsPayloadText(JSON.stringify(saved.payload || {}, null, 2));
    setStatus(`${activeMenu.label} content saved.`);
    setIsCmsModalOpen(false);
  };

  const handleCmsDelete = async (targetId = cmsSelectedId) => {
    if (!supabase || !targetId) return;

    const ok = window.confirm(`Delete CMS item "${targetId}"?`);
    if (!ok) return;

    setIsBusy(true);
    setError('');
    setStatus('');

    let deleteQuery = supabase
      .from(activeContentTable)
      .delete()
      .eq('id', targetId);

    if (activeContentTable === 'cms_items') {
      deleteQuery = deleteQuery.eq('collection', activeCollection);
    }

    const { error: deleteError } = await deleteQuery;

    setIsBusy(false);

    if (deleteError) {
      setError(getErrorMessage(deleteError));
      return;
    }

    const nextItems = cmsItems.filter((item) => item.id !== targetId);
    setCmsItems(nextItems);

    if (cmsSelectedId === targetId) {
      const nextItem = nextItems[0] || createEmptyContentItem(activeMenu);
      setCmsSelectedId(nextItems[0]?.id || '');
      setCmsDraft(nextItem);
      setCmsPayloadText(JSON.stringify(nextItem.payload || {}, null, 2));
    }

    setStatus(`${activeMenu.label} content deleted.`);
    setIsCmsModalOpen(false);
  };

  const handleSave = async (event) => {
    event.preventDefault();
    if (!supabase) return;

    const payload = normalizeExperience(draft);

    if (!payload.id || !payload.title || !payload.blurb) {
      setError('ID, company/title, and blurb wajib diisi.');
      return;
    }

    setIsBusy(true);
    setError('');
    setStatus('');

    const { data, error: saveError } = await supabase
      .from('experiences')
      .upsert(payload, { onConflict: 'id' })
      .select(EXPERIENCE_SELECT)
      .single();

    setIsBusy(false);

    if (saveError) {
      setError(getErrorMessage(saveError));
      return;
    }

    const saved = normalizeExperience(data);
    setItems((current) => {
      const exists = current.some((item) => item.id === saved.id);
      const merged = exists
        ? current.map((item) => (item.id === saved.id ? saved : item))
        : [...current, saved];

      return merged.sort((a, b) => a.sort_order - b.sort_order);
    });
    setSelectedId(saved.id);
    setDraft(saved);
    setStatus('Experience saved.');
    setIsModalOpen(false);
  };

  const handleDelete = async (targetId = selectedId) => {
    if (!supabase || !targetId) return;

    const ok = window.confirm(`Delete experience "${targetId}"?`);
    if (!ok) return;

    setIsBusy(true);
    setError('');
    setStatus('');

    const { error: deleteError } = await supabase
      .from('experiences')
      .delete()
      .eq('id', targetId);

    setIsBusy(false);

    if (deleteError) {
      setError(getErrorMessage(deleteError));
      return;
    }

    const nextItems = items.filter((item) => item.id !== targetId);
    setItems(nextItems);
    if (selectedId === targetId) {
      setSelectedId(nextItems[0]?.id || '');
      setDraft(nextItems[0] ? normalizeExperience(nextItems[0]) : createEmptyExperience());
    }
    setStatus('Experience deleted.');
    setIsModalOpen(false);
  };

  if (!isSupabaseConfigured) {
    return (
      <div className="admin-page">
        <section className="admin-shell admin-setup">
          <div>
            <p className="admin-kicker">// CMS_SETUP</p>
            <h1>Supabase belum dikonfigurasi.</h1>
            <p>
              Isi `VITE_SUPABASE_URL` dan `VITE_SUPABASE_ANON_KEY` di `.env` atau `.env.local`,
              lalu jalankan SQL di `supabase/experience-cms.sql`.
            </p>
          </div>
        </section>
      </div>
    );
  }

  if (authLoading) {
    return (
      <div className="admin-page">
        <section className="admin-shell admin-setup">
          <p className="admin-kicker">// AUTH_CHECK</p>
          <h1>Checking session...</h1>
        </section>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="admin-page">
        <section className="admin-shell admin-login">
          <div>
            <p className="admin-kicker">// EXPERIENCE_CMS</p>
            <h1>Admin login</h1>
            <p>Masuk dengan Google menggunakan {ALLOWED_ADMIN_EMAIL}.</p>
          </div>

          <div className="admin-form">
            {error && <div className="admin-alert error">{error}</div>}
            {status && <div className="admin-alert">{status}</div>}
            <button
              className="admin-google-btn"
              type="button"
              onClick={handleGoogleLogin}
              disabled={isBusy}
            >
              <span aria-hidden="true">G</span>
              {isBusy ? 'Opening Google...' : 'Continue with Google'}
            </button>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <section className="admin-shell">
        <header className="admin-header">
          <div>
            <p className="admin-kicker">// CMS_PANEL</p>
            <h1>{activeMenu.title}</h1>
          </div>
          <div className="admin-actions">
            <a className="admin-secondary" href="/">
              View site
            </a>
            <button className="admin-secondary" type="button" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </header>

        <div className="admin-layout">
          <aside className="admin-side-nav" aria-label="CMS menu">
            <div className="admin-side-title">
              <span>CMS Menu</span>
              <small>{session.user?.email}</small>
            </div>
            <nav>
              {ADMIN_MENU.map((item) => (
                <a
                  key={item.id}
                  href={item.path}
                  className={activeMenu.id === item.id ? 'active' : ''}
                  onClick={(event) => handleAdminMenuClick(event, item.path)}
                >
                  <span>{item.label}</span>
                  <small>{item.status}</small>
                </a>
              ))}
            </nav>
          </aside>

          <div className="admin-content">
            {activeMenu.id === 'experience' ? (
              <div className="admin-grid">
                <section className="admin-table-panel" aria-label="Experience table">
                  <div className="admin-table-head">
                    <div>
                      <span>{items.length} experiences</span>
                      <small>View, edit, publish, reorder, or delete content.</small>
                    </div>
                    <button type="button" onClick={handleNew}>
                      New experience
                    </button>
                  </div>

                  <div className="admin-table-scroll">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Order</th>
                          <th>Company</th>
                          <th>Role</th>
                          <th>Meta</th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.map((item) => (
                          <tr
                            key={item.id}
                            className={selectedId === item.id ? 'active' : ''}
                          >
                            <td>{item.sort_order}</td>
                            <td>
                              <button
                                type="button"
                                className="admin-table-title"
                                onClick={() => handleSelectItem(item)}
                              >
                                <span>{item.title}</span>
                                <small>{item.id}</small>
                              </button>
                            </td>
                            <td>{item.role || '-'}</td>
                            <td>{item.tag || '-'}</td>
                            <td>
                              <span
                                className={`admin-status ${item.is_published ? 'published' : 'draft'}`}
                              >
                                {item.is_published ? 'Published' : 'Draft'}
                              </span>
                            </td>
                            <td>
                              <div className="admin-row-actions">
                                <button type="button" onClick={() => handleSelectItem(item)}>
                                  View / Edit
                                </button>
                                <button
                                  type="button"
                                  className="danger"
                                  onClick={() => handleDelete(item.id)}
                                  disabled={isBusy}
                                >
                                  Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                        {items.length === 0 && (
                          <tr>
                            <td colSpan="6">
                              <p className="admin-empty">Belum ada data experience.</p>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </section>

                {isModalOpen && (
                  <div className="admin-modal-overlay" onClick={() => setIsModalOpen(false)}>
                    <div className="admin-modal-content" onClick={(e) => e.stopPropagation()}>
                      <form className="admin-editor" onSubmit={handleSave}>
                        <div className="admin-editor-head">
                          <div>
                            <span>{selectedId ? `Editing ${selectedId}` : 'New item'}</span>
                            <small>Data ini akan tampil di section Experience publik.</small>
                          </div>
                          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                            <label className="admin-toggle">
                              <input
                                type="checkbox"
                                checked={draft.is_published}
                                onChange={(event) => updateDraft('is_published', event.target.checked)}
                              />
                              Published
                            </label>
                            <button type="button" className="admin-editor-close" onClick={() => setIsModalOpen(false)} aria-label="Close modal">×</button>
                          </div>
                        </div>

                  <div className="admin-fields">
                    <label>
                      ID
                      <input
                        value={draft.id}
                        onChange={(event) => updateDraft('id', slugifyId(event.target.value))}
                        placeholder="rasa"
                        required
                        disabled={Boolean(selectedId)}
                      />
                    </label>
                    <label>
                      Order
                      <input
                        type="number"
                        value={draft.sort_order}
                        onChange={(event) => updateDraft('sort_order', event.target.value)}
                        required
                      />
                    </label>
                    <label>
                      Company / Title
                      <input
                        value={draft.title}
                        onChange={(event) => updateDraft('title', event.target.value)}
                        placeholder="Rasa Group"
                        required
                      />
                    </label>
                    <label>
                      Role
                      <input
                        value={draft.role}
                        onChange={(event) => updateDraft('role', event.target.value)}
                        placeholder="Senior IT Developer"
                      />
                    </label>
                    <label>
                      Glyph
                      <input
                        value={draft.glyph}
                        onChange={(event) => updateDraft('glyph', event.target.value)}
                        maxLength={4}
                        placeholder="✦"
                      />
                    </label>
                    <label>
                      Meta tag
                      <input
                        value={draft.tag}
                        onChange={(event) => updateDraft('tag', event.target.value)}
                        placeholder="Feb 2025 — Present · Cikarang"
                      />
                    </label>
                    <label className="admin-wide">
                      Blurb
                      <textarea
                        value={draft.blurb}
                        onChange={(event) => updateDraft('blurb', event.target.value)}
                        rows={7}
                        required
                      />
                    </label>
                  </div>

                  {error && <div className="admin-alert error">{error}</div>}
                  {status && <div className="admin-alert">{status}</div>}

                  <div className="admin-footer-actions">
                    <button className="admin-primary" type="submit" disabled={isBusy}>
                      {isBusy ? 'Saving...' : 'Save changes'}
                    </button>
                    <button
                      className="admin-secondary"
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      disabled={isBusy}
                    >
                      Cancel
                    </button>
                    {selectedId && (
                      <button
                        className="admin-danger"
                        type="button"
                        onClick={() => handleDelete()}
                        disabled={isBusy}
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
            ) : (
              <div className="admin-grid">
                <section className="admin-table-panel" aria-label={`${activeMenu.label} table`}>
                  <div className="admin-table-head">
                    <div>
                      <span>{cmsItems.length} {activeMenu.label} items</span>
                      <small>{activeMenu.summary}</small>
                    </div>
                    <button type="button" onClick={handleCmsNew}>
                      New {activeMenu.label}
                    </button>
                  </div>

                  <div className="admin-table-scroll">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Order</th>
                          <th>Title</th>
                          <th>Subtitle</th>
                          <th>Summary</th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {cmsItems.map((item) => (
                          <tr
                            key={item.id}
                            className={cmsSelectedId === item.id ? 'active' : ''}
                          >
                            <td>{item.sort_order}</td>
                            <td>
                              <button
                                type="button"
                                className="admin-table-title"
                                onClick={() => handleCmsSelectItem(item)}
                              >
                                <span>{item.title}</span>
                                <small>{item.id}</small>
                              </button>
                            </td>
                            <td>{item.subtitle || '-'}</td>
                            <td>{item.summary || '-'}</td>
                            <td>
                              <span
                                className={`admin-status ${item.is_published ? 'published' : 'draft'}`}
                              >
                                {item.is_published ? 'Published' : 'Draft'}
                              </span>
                            </td>
                            <td>
                              <div className="admin-row-actions">
                                <button type="button" onClick={() => handleCmsSelectItem(item)}>
                                  View / Edit
                                </button>
                                <button
                                  type="button"
                                  className="danger"
                                  onClick={() => handleCmsDelete(item.id)}
                                  disabled={isBusy}
                                >
                                  Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                        {cmsItems.length === 0 && (
                          <tr>
                            <td colSpan="6">
                              <p className="admin-empty">Belum ada data {activeMenu.label}.</p>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </section>

                {isCmsModalOpen && (
                  <div className="admin-modal-overlay" onClick={() => setIsCmsModalOpen(false)}>
                    <div className="admin-modal-content" onClick={(event) => event.stopPropagation()}>
                      <form className="admin-editor" onSubmit={handleCmsSave}>
                        <div className="admin-editor-head">
                          <div>
                            <span>{cmsSelectedId ? `Editing ${cmsSelectedId}` : `New ${activeMenu.label}`}</span>
                            <small>{activeMenu.fields.join(' · ')}</small>
                          </div>
                          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                            <label className="admin-toggle">
                              <input
                                type="checkbox"
                                checked={cmsDraft.is_published}
                                onChange={(event) => updateCmsDraft('is_published', event.target.checked)}
                              />
                              Published
                            </label>
                            <button
                              type="button"
                              className="admin-editor-close"
                              onClick={() => setIsCmsModalOpen(false)}
                              aria-label="Close modal"
                            >
                              ×
                            </button>
                          </div>
                        </div>

                        <div className="admin-fields">
                          <label>
                            ID
                            <input
                              value={cmsDraft.id}
                              onChange={(event) => updateCmsDraft('id', slugifyId(event.target.value))}
                              placeholder={`${activeCollection}-item`}
                              required
                              disabled={Boolean(cmsSelectedId)}
                            />
                          </label>
                          <label>
                            Order
                            <input
                              type="number"
                              value={cmsDraft.sort_order}
                              onChange={(event) => updateCmsDraft('sort_order', event.target.value)}
                              required
                            />
                          </label>
                          <label>
                            Title
                            <input
                              value={cmsDraft.title}
                              onChange={(event) => updateCmsDraft('title', event.target.value)}
                              required
                            />
                          </label>
                          <label>
                            Subtitle
                            <input
                              value={cmsDraft.subtitle}
                              onChange={(event) => updateCmsDraft('subtitle', event.target.value)}
                            />
                          </label>
                          <label className="admin-wide">
                            Summary
                            <textarea
                              value={cmsDraft.summary}
                              onChange={(event) => updateCmsDraft('summary', event.target.value)}
                              rows={4}
                            />
                          </label>
                          {activeContentTable === 'projects' ? (
                            <>
                              <label>
                                Year
                                <input
                                  value={cmsDraft.year}
                                  onChange={(event) => updateCmsDraft('year', event.target.value)}
                                />
                              </label>
                              <label>
                                Type
                                <input
                                  value={cmsDraft.project_type}
                                  onChange={(event) => updateCmsDraft('project_type', event.target.value)}
                                />
                              </label>
                              <label>
                                Role
                                <input
                                  value={cmsDraft.role}
                                  onChange={(event) => updateCmsDraft('role', event.target.value)}
                                />
                              </label>
                              <label>
                                Card Style
                                <input
                                  value={cmsDraft.bento}
                                  onChange={(event) => updateCmsDraft('bento', event.target.value)}
                                  placeholder="bento-compact"
                                />
                              </label>
                              <label>
                                Display No.
                                <input
                                  value={cmsDraft.num}
                                  onChange={(event) => updateCmsDraft('num', event.target.value)}
                                />
                              </label>
                              <label>
                                Live URL
                                <input
                                  value={cmsDraft.live_url}
                                  onChange={(event) => updateCmsDraft('live_url', event.target.value)}
                                />
                              </label>
                              <label>
                                Case URL
                                <input
                                  value={cmsDraft.case_url}
                                  onChange={(event) => updateCmsDraft('case_url', event.target.value)}
                                />
                              </label>
                              <label className="admin-wide">
                                Problem
                                <textarea
                                  value={cmsDraft.problem}
                                  onChange={(event) => updateCmsDraft('problem', event.target.value)}
                                  rows={3}
                                />
                              </label>
                              <label className="admin-wide">
                                What I Built
                                <textarea
                                  value={cmsDraft.built}
                                  onChange={(event) => updateCmsDraft('built', event.target.value)}
                                  rows={3}
                                />
                              </label>
                              <label className="admin-wide">
                                Result
                                <textarea
                                  value={cmsDraft.result}
                                  onChange={(event) => updateCmsDraft('result', event.target.value)}
                                  rows={3}
                                />
                              </label>
                              <label className="admin-wide">
                                Impact
                                <textarea
                                  value={cmsDraft.impact}
                                  onChange={(event) => updateCmsDraft('impact', event.target.value)}
                                  rows={3}
                                />
                              </label>
                              <label className="admin-wide">
                                Focus
                                <textarea
                                  value={linesToText(cmsDraft.focus)}
                                  onChange={(event) => updateCmsDraft('focus', parseLines(event.target.value))}
                                  rows={4}
                                />
                              </label>
                              <label className="admin-wide">
                                Scope
                                <textarea
                                  value={linesToText(cmsDraft.scope)}
                                  onChange={(event) => updateCmsDraft('scope', parseLines(event.target.value))}
                                  rows={4}
                                />
                              </label>
                              <label className="admin-wide">
                                Stack
                                <textarea
                                  value={linesToText(cmsDraft.stack)}
                                  onChange={(event) => updateCmsDraft('stack', parseLines(event.target.value))}
                                  rows={4}
                                />
                              </label>
                              <label className="admin-wide">
                                Outcomes
                                <textarea
                                  value={linesToText(cmsDraft.outcomes)}
                                  onChange={(event) => updateCmsDraft('outcomes', parseLines(event.target.value))}
                                  rows={5}
                                />
                              </label>
                              <label className="admin-wide">
                                Signals
                                <textarea
                                  value={signalsToText(cmsDraft.signals)}
                                  onChange={(event) => updateCmsDraft('signals', parseSignalsText(event.target.value))}
                                  rows={5}
                                  placeholder="Label | Value | Note"
                                />
                              </label>
                            </>
                          ) : (
                            <label className="admin-wide">
                              Payload JSON
                              <textarea
                                value={cmsPayloadText}
                                onChange={(event) => setCmsPayloadText(event.target.value)}
                                rows={12}
                                spellCheck="false"
                              />
                            </label>
                          )}
                        </div>

                        {error && <div className="admin-alert error">{error}</div>}
                        {status && <div className="admin-alert">{status}</div>}

                        <div className="admin-footer-actions">
                          <button className="admin-primary" type="submit" disabled={isBusy}>
                            {isBusy ? 'Saving...' : 'Save changes'}
                          </button>
                          <button
                            className="admin-secondary"
                            type="button"
                            onClick={() => setIsCmsModalOpen(false)}
                            disabled={isBusy}
                          >
                            Cancel
                          </button>
                          {cmsSelectedId && (
                            <button
                              className="admin-danger"
                              type="button"
                              onClick={() => handleCmsDelete()}
                              disabled={isBusy}
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </form>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default AdminExperience;
