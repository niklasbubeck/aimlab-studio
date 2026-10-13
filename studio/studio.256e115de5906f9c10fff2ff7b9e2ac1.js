/* Design Studio - core.
 *
 * The configuration model, the catalogue every control is built from, the
 * homepage concepts and the presets, persistence and a small event bus.
 * Nothing in this file touches the page: 20-page.js renders a configuration,
 * 40-panel.js edits one. STUDIO.md describes how the pieces fit.
 *
 * A configuration is plain JSON, so it can be saved, put in a URL and handed
 * to an iframe unchanged. `{original: true}` means "the website as published"
 * and is rendered by getting out of the way rather than by imitation. */
(function () {
  'use strict';

  var DS = window.DS = window.DS || {};

  /* ------------------------------------------------------------------ util */

  var listeners = {};
  DS.on = function (ev, fn) { (listeners[ev] = listeners[ev] || []).push(fn); };
  DS.emit = function (ev, data) { (listeners[ev] || []).forEach(function (fn) { fn(data); }); };

  DS.esc = function (s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return {'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c];
    });
  };
  DS.clone = function (o) { return JSON.parse(JSON.stringify(o)); };
  DS.isObj = function (o) { return o && typeof o === 'object' && !Array.isArray(o); };
  DS.merge = function (a, b) {
    var out = DS.clone(a || {});
    Object.keys(b || {}).forEach(function (k) {
      out[k] = DS.isObj(b[k]) && DS.isObj(out[k]) ? DS.merge(out[k], b[k]) : DS.clone(b[k]);
    });
    return out;
  };
  DS.$ = function (sel, root) { return (root || document).querySelector(sel); };
  DS.$$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };
  DS.h = function (html) {
    var t = document.createElement('template');
    t.innerHTML = html.trim();
    return t.content.firstElementChild;
  };

  DS.embedded = /[?&]ds-embed=1\b/.test(location.search);

  /* Paths inside the site, relative to where it is served from: the root
     locally, a subdirectory when published as a project page. */
  DS.url = function (path) {
    var base = (DS.content && DS.content.base) || '/';
    return base.replace(/\/?$/, '/') + String(path || '').replace(/^\/+/, '');
  };
  DS.hrefAttr = function (path) { return 'href="' + DS.esc(DS.url(path)) + '"'; };

  /* ------------------------------------------------------------ catalogue */

  /* Every control and every label comes from here, so a new option is one
     entry plus whatever renders it. */
  DS.options = {
    contentPriority: [
      {value: 'current', label: 'As today', blurb: 'Welcome photo, then research, people, news and teaching: the current order.'},
      {value: 'research', label: 'Research first', blurb: 'Research areas lead, with selected publications. News moves further down.'},
      {value: 'news', label: 'News first', blurb: 'Awards and announcements at the top; research areas below.'},
      {value: 'balanced', label: 'Balanced overview', blurb: 'A short introduction, then research and news side by side.'},
      {value: 'visual', label: 'Visual storytelling', blurb: 'Large images, little text, research told through pictures.'},
      {value: 'minimal', label: 'Minimal & academic', blurb: 'Typography first: compact lists, credibility over decoration.'}
    ],
    layouts: {
      research: ['cards', 'carousel', 'grid', 'list', 'editorial', 'featured', 'tabs'],
      news: ['cards', 'carousel', 'grid', 'list', 'editorial', 'featured', 'tabs'],
      publications: ['list', 'cards', 'featured', 'tabs'],
      people: ['full', 'compact', 'groups', 'teaser']
    },
    layoutLabels: {
      cards: 'Cards', carousel: 'Carousel', grid: 'Grid', list: 'List', editorial: 'Editorial',
      featured: 'Featured', tabs: 'Tabs', full: 'Full gallery', compact: 'Compact',
      groups: 'Expandable', teaser: 'Teaser'
    },
    layoutHints: {
      cards: 'Image, title, summary and link per item.',
      carousel: 'A horizontal run with arrows; swipe on touch screens.',
      grid: 'Image tiles together, one large; text on demand.',
      list: 'Compact and text-led; fastest to scan.',
      editorial: 'Large image beside generous text, alternating.',
      featured: 'One prominent item with the rest beside it.',
      tabs: 'One item at a time, switched by tabs.',
      full: 'Every person with photo, role and interests, as today.',
      compact: 'Small photos and names; the whole lab at a glance.',
      groups: 'Groups fold open on demand; leadership open by default.',
      teaser: 'A glimpse of the team, the full list one click away.'
    },
    navigationStructure: [
      {value: 'single', label: 'Single page', blurb: 'Everything on one scrolling page; the menu jumps to sections.'},
      {value: 'subpages', label: 'Homepage + subpages', blurb: 'A concise homepage and a page each for Research, News, People, Teaching.'},
      {value: 'expandable', label: 'Expandable sections', blurb: 'One compact page; longer content opens in place.'},
      {value: 'hybrid', label: 'Hybrid', blurb: 'Visual homepage, a page per research area, details that fold out elsewhere.'}
    ],
    heroLayout: [
      {value: 'image', label: 'Image-led'}, {value: 'split', label: 'Split'},
      {value: 'text', label: 'Text-led'}, {value: 'minimal', label: 'Minimal'}
    ],
    typography: [
      {value: 'current', label: 'Current', sample: 'Montserrat · Roboto'},
      {value: 'modern', label: 'Modern sans', sample: 'Inter'},
      {value: 'editorial', label: 'Editorial', sample: 'Newsreader · Inter'},
      {value: 'academic', label: 'Academic', sample: 'Source Serif'}
    ],
    palette: [
      {value: 'current', label: 'Current blue', swatch: ['#2962ff', '#ffffff', '#f7f7f7', '#34495e']},
      {value: 'tum', label: 'TUM blue (approx.)', swatch: ['#3070b3', '#ffffff', '#f1f4f8', '#072140']},
      {value: 'clinical', label: 'Clinical teal', swatch: ['#0f766e', '#ffffff', '#f0f6f5', '#12302c']},
      {value: 'paper', label: 'Ink & paper', swatch: ['#a63d1c', '#fbfaf7', '#f2eee6', '#1d1b18']}
    ],
    imageTreatment: [
      {value: 'rect', label: 'Rectangular'}, {value: 'rounded', label: 'Rounded'},
      {value: 'bleed', label: 'Full-bleed'}, {value: 'contained', label: 'Contained'}
    ],
    spacing: [{value: 'compact', label: 'Compact'}, {value: 'balanced', label: 'Balanced'}, {value: 'spacious', label: 'Spacious'}],
    density: [{value: 'minimal', label: 'Minimal'}, {value: 'balanced', label: 'Balanced'}, {value: 'rich', label: 'Rich'}],
    nav: [{value: 'sticky', label: 'Sticky'}, {value: 'standard', label: 'Standard'}, {value: 'compact', label: 'Compact'}],
    appearance: [{value: 'auto', label: 'Site default'}, {value: 'light', label: 'Light'}, {value: 'dark', label: 'Dark'}],
    imageSize: [{value: 'none', label: 'None'}, {value: 's', label: 'S'}, {value: 'm', label: 'M'}, {value: 'l', label: 'L'}]
  };

  DS.label = function (group, value) {
    if (group === 'layout') return DS.options.layoutLabels[value] || value;
    var o = (DS.options[group] || []).filter(function (x) { return x.value === value; })[0];
    return o ? o.label : value;
  };

  /* --------------------------------------------------------- the baseline */

  /* The current site, expressed in the studio's terms. It is where editing
     starts from when the page is showing the original. */
  DS.BASE = {
    v: 1,
    original: false,
    preset: null,
    contentPriority: 'current',
    navigationStructure: 'single',
    heroLayout: 'image',
    contentLayouts: {
      research: {layout: 'carousel', count: 5, imageSize: 'm'},
      news: {layout: 'list', count: 5, imageSize: 's', feed: true},
      publications: {layout: 'list', count: 5},
      people: {layout: 'full'}
    },
    visualTheme: {
      typography: 'current', palette: 'current', imageTreatment: 'rect',
      spacing: 'balanced', density: 'balanced', nav: 'sticky', appearance: 'auto'
    },
    imageSelections: {hero: 'original', research: {}, sections: {}, background: 'none'}
  };

  DS.ORIGINAL = {v: 1, original: true};

  /* What a visitor sees first. `sections` is the homepage, top to bottom;
     `layouts` are what each concept looks best with, applied when it is
     chosen and freely changed afterwards. */
  DS.concepts = {
    current: {
      sections: ['hero', 'research', 'people', 'news', 'teaching', 'vacancies', 'contact'],
      hero: 'welcome', heroLayout: 'image',
      layouts: {research: 'carousel', news: 'list', people: 'full'}
    },
    research: {
      sections: ['hero', 'research', 'publications', 'news', 'people', 'teaching', 'vacancies', 'contact'],
      hero: 'research', heroLayout: 'split',
      layouts: {research: 'editorial', publications: 'list', news: 'cards', people: 'compact'}
    },
    news: {
      sections: ['hero', 'news', 'research', 'publications', 'people', 'teaching', 'vacancies', 'contact'],
      hero: 'compact', heroLayout: 'minimal',
      layouts: {news: 'featured', research: 'cards', publications: 'list', people: 'compact'}
    },
    balanced: {
      sections: ['hero', 'overview', 'people', 'teaching', 'vacancies', 'contact'],
      hero: 'welcome', heroLayout: 'image',
      layouts: {research: 'grid', news: 'list', people: 'teaser'}
    },
    visual: {
      sections: ['hero', 'research', 'news', 'people', 'teaching', 'vacancies', 'contact'],
      hero: 'visual', heroLayout: 'image',
      layouts: {research: 'editorial', news: 'carousel', people: 'teaser'}
    },
    minimal: {
      sections: ['hero', 'research', 'publications', 'news', 'people', 'teaching', 'vacancies', 'contact'],
      hero: 'academic', heroLayout: 'text',
      layouts: {research: 'list', publications: 'list', news: 'list', people: 'compact'}
    }
  };

  /* Complete directions. Image references are resolved against the stock
     manifest when a preset is applied: `@hero:N` is the N-th hero candidate,
     `@stock` the first candidate of each research area. A missing candidate
     falls back to the site's own picture. */
  DS.presets = [
    {id: 'original', label: 'Original website', blurb: 'The site exactly as it is published today.', original: true,
      look: {font: 'current', palette: 'current'}},
    {id: 'institute', label: 'Research Institute', blurb: 'Professional and credible. Research leads, with a page per topic.',
      look: {font: 'current', palette: 'tum'},
      config: {
        contentPriority: 'research', navigationStructure: 'subpages', heroLayout: 'split',
        contentLayouts: {research: {layout: 'cards', imageSize: 'm'}, publications: {layout: 'list', count: 5},
          news: {layout: 'list', count: 4, imageSize: 's', feed: false}, people: {layout: 'compact'}},
        visualTheme: {typography: 'current', palette: 'tum', imageTreatment: 'rect', spacing: 'balanced',
          density: 'balanced', nav: 'sticky', appearance: 'light'},
        imageSelections: {hero: '@hero:0', research: '@stock'}
      }},
    {id: 'modern', label: 'Modern Science', blurb: 'Contemporary type and image-led research cards.',
      look: {font: 'modern', palette: 'clinical'},
      config: {
        contentPriority: 'balanced', navigationStructure: 'expandable', heroLayout: 'image',
        contentLayouts: {research: {layout: 'grid', imageSize: 'm'}, news: {layout: 'carousel', imageSize: 'm', feed: false},
          people: {layout: 'teaser'}},
        visualTheme: {typography: 'modern', palette: 'clinical', imageTreatment: 'rounded', spacing: 'balanced',
          density: 'balanced', nav: 'compact', appearance: 'light'},
        imageSelections: {hero: '@hero:1', research: '@stock'}
      }},
    {id: 'editorial', label: 'Editorial Magazine', blurb: 'Large images, strong headlines, a magazine hierarchy.',
      look: {font: 'editorial', palette: 'paper'},
      config: {
        contentPriority: 'visual', navigationStructure: 'hybrid', heroLayout: 'image',
        contentLayouts: {research: {layout: 'editorial', imageSize: 'l'}, news: {layout: 'featured', imageSize: 'l'},
          people: {layout: 'teaser'}},
        visualTheme: {typography: 'editorial', palette: 'paper', imageTreatment: 'bleed', spacing: 'spacious',
          density: 'balanced', nav: 'standard', appearance: 'light'},
        imageSelections: {hero: '@hero:2', research: '@stock'}
      }},
    {id: 'minimal', label: 'Minimal Academic', blurb: 'Restrained and information-first; quick to scan.',
      look: {font: 'academic', palette: 'current'},
      config: {
        contentPriority: 'minimal', navigationStructure: 'single', heroLayout: 'text',
        contentLayouts: {research: {layout: 'list', imageSize: 'none'}, publications: {layout: 'list', count: 8},
          news: {layout: 'list', imageSize: 'none', feed: false}, people: {layout: 'groups'}},
        visualTheme: {typography: 'academic', palette: 'current', imageTreatment: 'contained', spacing: 'compact',
          density: 'rich', nav: 'standard', appearance: 'light'},
        imageSelections: {hero: 'original'}
      }},
    {id: 'discovery', label: 'Visual Discovery', blurb: 'Image-led research categories and exploratory navigation.',
      look: {font: 'modern', palette: 'current', dark: true},
      config: {
        contentPriority: 'visual', navigationStructure: 'hybrid', heroLayout: 'image',
        contentLayouts: {research: {layout: 'grid', imageSize: 'l'}, news: {layout: 'carousel', imageSize: 'm'},
          people: {layout: 'teaser'}},
        visualTheme: {typography: 'modern', palette: 'current', imageTreatment: 'rounded', spacing: 'balanced',
          density: 'minimal', nav: 'sticky', appearance: 'dark'},
        imageSelections: {hero: '@hero:3', research: '@stock'}
      }}
  ];

  DS.preset = function (id) { return DS.presets.filter(function (p) { return p.id === id; })[0]; };

  /* ------------------------------------------------------------ normalise */

  function oneOf(v, list, d) {
    var values = list.map(function (o) { return typeof o === 'string' ? o : o.value; });
    return values.indexOf(v) >= 0 ? v : d;
  }

  /* Whatever comes in - an old save, a hand-edited export, a URL - leaves as
     a complete, valid configuration. */
  DS.normalize = function (cfg) {
    if (!cfg || cfg.original) return DS.clone(DS.ORIGINAL);
    var c = DS.merge(DS.BASE, cfg), o = DS.options, b = DS.BASE;
    c.original = false;
    c.contentPriority = oneOf(c.contentPriority, o.contentPriority, b.contentPriority);
    c.navigationStructure = oneOf(c.navigationStructure, o.navigationStructure, b.navigationStructure);
    c.heroLayout = oneOf(c.heroLayout, o.heroLayout, b.heroLayout);
    Object.keys(b.contentLayouts).forEach(function (t) {
      var l = c.contentLayouts[t];
      l.layout = oneOf(l.layout, o.layouts[t], b.contentLayouts[t].layout);
      if ('count' in b.contentLayouts[t]) l.count = Math.max(1, Math.min(30, parseInt(l.count, 10) || b.contentLayouts[t].count));
      if ('imageSize' in b.contentLayouts[t]) l.imageSize = oneOf(l.imageSize, o.imageSize, b.contentLayouts[t].imageSize);
    });
    ['typography', 'palette', 'imageTreatment', 'spacing', 'density', 'nav', 'appearance'].forEach(function (k) {
      c.visualTheme[k] = oneOf(c.visualTheme[k], o[k], b.visualTheme[k]);
    });
    var im = c.imageSelections;
    if (!DS.isObj(im.research)) im.research = {};
    if (!DS.isObj(im.sections)) im.sections = {};
    return c;
  };

  DS.isOriginal = function (cfg) { return !cfg || !!cfg.original; };

  /* What makes two configurations look the same, ignoring bookkeeping. */
  DS.signature = function (cfg) {
    if (DS.isOriginal(cfg)) return 'original';
    var c = DS.clone(cfg);
    delete c.preset; delete c.presetSig; delete c.name; delete c.nameSig;
    return JSON.stringify(c, Object.keys(flatKeys(c)).sort());
  };
  /* A short fingerprint of the signature, which is what saved and shared
     configurations carry to notice later edits. FNV-1a, 32 bits. */
  DS.sig = function (cfg) {
    var str = DS.signature(cfg), h = 0x811c9dc5;
    for (var i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
    return h.toString(36);
  };
  function flatKeys(o, acc) {
    acc = acc || {};
    if (DS.isObj(o)) Object.keys(o).forEach(function (k) { acc[k] = 1; flatKeys(o[k], acc); });
    return acc;
  }

  /* The short label shown in the panel, the presentation bar and the compare
     panes: a preset's name (marked when it has been changed since), or the
     homepage concept it is built on. */
  DS.describe = function (cfg) {
    if (DS.isOriginal(cfg)) return {title: 'Original website', detail: 'As published today'};
    var p = cfg.preset && DS.preset(cfg.preset);
    var edited = p && cfg.presetSig && cfg.presetSig !== DS.sig(cfg);
    var title = p ? p.label + (edited ? ' (edited)' : '') : DS.label('contentPriority', cfg.contentPriority);
    if (cfg.name) title = cfg.name + (cfg.nameSig && cfg.nameSig !== DS.sig(cfg) ? ' (edited)' : '');
    var detail = [DS.label('contentPriority', cfg.contentPriority), DS.label('navigationStructure', cfg.navigationStructure),
      DS.label('typography', cfg.visualTheme.typography) + ' type'];
    return {title: title, detail: detail.join(' · ')};
  };

  /* ------------------------------------------------------------- encoding */

  DS.encode = function (cfg) {
    var json = JSON.stringify(cfg);
    return btoa(unescape(encodeURIComponent(json))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  };
  DS.decode = function (s) {
    try {
      var b = s.replace(/-/g, '+').replace(/_/g, '/');
      return DS.normalize(JSON.parse(decodeURIComponent(escape(atob(b + '==='.slice((b.length + 3) % 4))))));
    } catch (e) { return null; }
  };
  DS.shareUrl = function (cfg) {
    var u = new URL(location.href);
    u.searchParams.delete('ds-embed');
    u.searchParams.set('ds', DS.encode(cfg));
    u.hash = '';
    return u.toString();
  };

  /* ---------------------------------------------------------- persistence */

  /* Everything stays in this browser. Nothing is sent anywhere. */
  DS.store = {
    get: function (k, d) {
      try { var v = localStorage.getItem('ds.' + k); return v ? JSON.parse(v) : d; } catch (e) { return d; }
    },
    set: function (k, v) {
      if (DS.embedded) return;
      try { localStorage.setItem('ds.' + k, JSON.stringify(v)); } catch (e) { /* private mode */ }
    }
  };

  /* ---------------------------------------------------------------- state */

  var history = [];
  DS.state = {config: DS.clone(DS.ORIGINAL)};
  DS.config = function () { return DS.state.config; };

  /* Replace the active configuration. `opts.focus` names the section the
     change is about, so the page can bring it into view. */
  DS.set = function (cfg, opts) {
    opts = opts || {};
    var next = DS.normalize(cfg);
    if (DS.signature(next) === DS.signature(DS.state.config) && !opts.force) return;
    if (!opts.noHistory) {
      history.push(DS.state.config);
      if (history.length > 60) history.shift();
    }
    DS.state.config = next;
    DS.store.set('current', next);
    DS.emit('change', {config: next, opts: opts});
  };

  /* Edit the active configuration. Editing the original starts from its
     studio equivalent, so the first change changes only that one thing. */
  DS.update = function (mutate, opts) {
    var cur = DS.state.config;
    var c = DS.isOriginal(cur) ? DS.clone(DS.BASE) : DS.clone(cur);
    mutate(c);
    c.original = false;
    DS.set(c, opts);
  };

  DS.canUndo = function () { return history.length > 0; };
  DS.undo = function () {
    if (!history.length) return;
    var prev = history.pop();
    DS.state.config = prev;
    DS.store.set('current', prev);
    DS.emit('change', {config: prev, opts: {undo: true}});
  };

  DS.resetOriginal = function () { DS.set(DS.ORIGINAL, {scrollTop: true}); };

  DS.applyConcept = function (id) {
    var concept = DS.concepts[id];
    DS.update(function (c) {
      c.contentPriority = id;
      c.heroLayout = concept.heroLayout;
      Object.keys(concept.layouts).forEach(function (t) { c.contentLayouts[t].layout = concept.layouts[t]; });
    }, {scrollTop: true});
  };

  DS.applyPreset = function (id) {
    var p = DS.preset(id);
    if (!p) return;
    if (p.original) return DS.resetOriginal();
    var c = DS.merge(DS.BASE, p.config);
    c.imageSelections = DS.resolveImages(p.config.imageSelections || {});
    c.preset = id;
    c = DS.normalize(c);
    c.presetSig = DS.sig(c);
    DS.set(c, {scrollTop: true});
  };

  /* Turn a preset's image references into concrete candidate ids. Needs the
     stock manifest, which 50-images.js provides as DS.stock. */
  DS.resolveImages = function (sel) {
    var out = {hero: 'original', research: {}, sections: {}, background: 'none'};
    var stock = DS.stock || {byUse: function () { return []; }, forArea: function () { return []; }};
    if (typeof sel.hero === 'string') {
      var m = /^@hero:(\d+)$/.exec(sel.hero);
      if (m) {
        var c = stock.byUse('hero')[+m[1]];
        out.hero = c ? c.id : 'original';
      } else out.hero = sel.hero;
    }
    if (sel.research === '@stock') {
      (DS.content.research || []).forEach(function (a) {
        var c = stock.forArea(a.slug)[0];
        if (c) out.research[a.slug] = c.id;
      });
    } else if (DS.isObj(sel.research)) out.research = DS.clone(sel.research);
    if (DS.isObj(sel.sections)) out.sections = DS.clone(sel.sections);
    if (sel.background) out.background = sel.background;
    return out;
  };

  /* -------------------------------------------------------- saved concepts */

  DS.saved = {
    list: function () { return DS.store.get('saved', []); },
    put: function (list) { DS.store.set('saved', list); DS.emit('saved', list); },
    add: function (name, cfg) {
      var list = DS.saved.list();
      var item = {id: 's' + Date.now().toString(36), name: name, config: DS.clone(cfg), created: new Date().toISOString()};
      list.push(item);
      DS.saved.put(list);
      return item;
    },
    remove: function (id) { DS.saved.put(DS.saved.list().filter(function (s) { return s.id !== id; })); },
    rename: function (id, name) {
      DS.saved.put(DS.saved.list().map(function (s) { if (s.id === id) s.name = name; return s; }));
    }
  };

  /* A saved concept keeps its name until it is changed. */
  DS.named = function (cfg, name) {
    if (DS.isOriginal(cfg)) return cfg;
    cfg.name = name;
    cfg.nameSig = DS.sig(cfg);
    return cfg;
  };

  /* Everything the presentation bar and the compare panes can switch
     between: saved concepts first, then the presets. */
  DS.catalogue = function () {
    var out = DS.saved.list().map(function (s) {
      var cfg = DS.named(DS.normalize(s.config), s.name);
      return {key: 'saved:' + s.id, label: s.name, group: 'Saved', config: cfg};
    });
    DS.presets.forEach(function (p) {
      var cfg;
      if (p.original) cfg = DS.clone(DS.ORIGINAL);
      else {
        cfg = DS.merge(DS.BASE, p.config);
        cfg.imageSelections = DS.resolveImages(p.config.imageSelections || {});
        cfg.preset = p.id;
        cfg = DS.normalize(cfg);
        cfg.presetSig = DS.sig(cfg);
      }
      out.push({key: 'preset:' + p.id, label: p.label, group: 'Presets', config: cfg});
    });
    return out;
  };
})();

;
/* Design Studio - components.
 *
 * Renderers that turn content into markup: the hero variants, one collection
 * renderer with a layout per presentation (cards, carousel, grid, list,
 * editorial, featured, tabs), the people views and the section shells. They
 * return HTML strings; `DS.ui.enhance(root)` then wires up whatever moves.
 *
 * Research areas, news and publications all go through the same collection
 * renderer, via the adapters in DS.items, so a layout is written once and
 * every content type gets it. */
(function () {
  'use strict';

  var DS = window.DS;
  var esc = DS.esc;
  var ui = DS.ui = {};

  /* ---------------------------------------------------------------- media */

  /* A picture: a stock candidate when one is selected, else the site's own. */
  DS.picture = function (selection, fallback, size) {
    if (selection && selection !== 'original' && selection !== 'none' && DS.stock) {
      var s = DS.stock.get(selection);
      if (s) return {src: DS.stock.src(s, size || 'medium'), alt: s.label, focus: s.focus || 'center', stock: s};
    }
    return fallback || null;
  };

  ui.media = function (pic, opts) {
    opts = opts || {};
    var cls = 'ds-media' + (opts.cls ? ' ' + opts.cls : '');
    if (!pic) {
      return '<div class="' + cls + ' ds-media-empty" aria-hidden="true"><span>' +
        esc(opts.emptyLabel || 'Figure to come') + '</span></div>';
    }
    var focus = /^(top|bottom|center)$/.test(pic.focus || '') ? 'center ' + pic.focus : (pic.focus || 'center');
    return '<div class="' + cls + (pic.stock ? ' is-stock' : ' is-figure') + '">' +
      '<img src="' + esc(pic.src) + '"' + (pic.srcset ? ' srcset="' + esc(pic.srcset) + '" sizes="100vw"' : '') +
      ' alt="' + esc(pic.alt || '') + '" loading="lazy" style="object-position:' + esc(focus) + '">' +
      (pic.stock ? DS.stock.badge(pic.stock) : '') + '</div>';
  };

  /* ---------------------------------------------------------------- links */

  /* Items point either at a studio page (a route, in the subpage structures)
     or at a real page of the site. */
  function href(it) {
    if (it.route != null) return DS.router.href(it.route, it.routeAnchor);
    return it.href || null;
  }
  function linkAttrs(it) {
    var h = href(it);
    if (!h) return null;
    return 'href="' + esc(h) + '"' + (it.route != null ? ' data-ds-route="' + esc(it.route) + '"' +
      (it.routeAnchor ? ' data-ds-anchor="' + esc(it.routeAnchor) + '"' : '') : '');
  }
  function titleHtml(it, tag, cls) {
    var a = linkAttrs(it);
    var inner = esc(it.title);
    return '<' + tag + ' class="' + (cls || 'ds-title') + '"' + (it.anchor ? ' id="' + esc(it.anchor) + '"' : '') + '>' +
      (a ? '<a ' + a + '>' + inner + '</a>' : inner) + '</' + tag + '>';
  }
  function kicker(it) { return it.kicker ? '<p class="ds-kicker">' + it.kicker + '</p>' : ''; }
  function meta(it) { return it.meta ? '<p class="ds-meta ds-d-hide-min">' + it.meta + '</p>' : ''; }
  function text(it, o) {
    if (o.full && it.html) return '<div class="ds-prose">' + it.html + '</div>' + (it.extra || '');
    return (it.text ? '<p class="ds-text ds-d-hide-min">' + esc(it.text) + '</p>' : '') + more(it, o);
  }
  function more(it, o) {
    if (o.full || !o.expandable || !it.html) return action(it, o);
    return '<div class="ds-more" hidden><div class="ds-prose">' + it.html + '</div>' + (it.extra || '') + '</div>' +
      '<button type="button" class="ds-expand" aria-expanded="false"><span>Read more</span></button>';
  }
  function action(it, o) {
    var a = linkAttrs(it);
    if (!a || o.noAction) return '';
    return '<a class="ds-action" ' + a + '>' + esc(it.actionLabel || 'Read more') + ' <span aria-hidden="true">→</span></a>';
  }

  /* ----------------------------------------------------------- collection */

  /* items: from DS.items.*; o: {layout, imageSize, full, expandable, type,
     groupBy, narrow}. */
  ui.collection = function (items, o) {
    if (!items.length) return '<p class="ds-empty">Nothing to show yet.</p>';
    var fn = layouts[o.layout] || layouts.cards;
    return '<div class="ds-collection ds-l-' + o.layout + ' ds-img-' + (o.imageSize || 'm') +
      (o.narrow ? ' is-narrow' : '') + '" data-type="' + esc(o.type || '') + '">' + fn(items, o) + '</div>';
  };

  var layouts = {};

  layouts.cards = function (items, o) {
    return '<div class="ds-cards" data-n="' + items.length + '">' + items.map(function (it) {
      return '<article class="ds-card ds-item">' +
        (o.imageSize !== 'none' ? mediaLinked(it, 'ds-card-media') : '') +
        '<div class="ds-card-body">' + kicker(it) + titleHtml(it, 'h3', 'ds-title') + meta(it) +
        text(it, {full: false, expandable: o.expandable}) + '</div></article>';
    }).join('') + '</div>';
  };

  function mediaLinked(it, cls) {
    var a = linkAttrs(it);
    var m = ui.media(it.pic, {cls: cls, emptyLabel: it.emptyLabel});
    return a ? '<a class="ds-media-link" tabindex="-1" aria-hidden="true" ' + a + '>' + m + '</a>' : m;
  }

  layouts.grid = function (items, o) {
    /* Tiles, the first one large. The text of a tile opens in a panel under
       the grid rather than sending the visitor away (single-page structures);
       in the page structures a tile is a link. */
    var linked = items.some(function (it) { return href(it); }) && !o.expandable;
    var tiles = items.map(function (it, i) {
      /* A tile may itself be a link, so its caption carries no links of its
         own (a link inside a link is split apart by the HTML parser). */
      var plainKicker = it.kicker ? '<p class="ds-kicker">' + it.kicker.replace(/<[^>]+>/g, '') + '</p>' : '';
      var inner = ui.media(it.pic, {cls: 'ds-tile-media', emptyLabel: it.emptyLabel}) +
        '<div class="ds-tile-cap">' + plainKicker + '<h3 class="ds-title">' + esc(it.title) + '</h3></div>';
      var a = linkAttrs(it);
      if (linked && a) return '<a class="ds-tile ds-item" ' + a + '>' + inner + '</a>';
      return '<button type="button" class="ds-tile ds-item" data-ds-detail="' + i + '" aria-expanded="false">' + inner + '</button>';
    }).join('');
    var details = linked ? '' : items.map(function (it, i) {
      return '<div class="ds-grid-detail" data-ds-detail-panel="' + i + '" hidden>' +
        '<button type="button" class="ds-close" aria-label="Close">×</button>' +
        kicker(it) + titleHtml(it, 'h3', 'ds-title') + meta(it) +
        (it.html ? '<div class="ds-prose">' + it.html + '</div>' + (it.extra || '') : '<p class="ds-text">' + esc(it.text) + '</p>' + action(it, {})) +
        '</div>';
    }).join('');
    return '<div class="ds-grid" data-n="' + items.length + '">' + tiles + '</div>' + details;
  };

  layouts.list = function (items, o) {
    return '<ol class="ds-list">' + items.map(function (it) {
      return '<li class="ds-row ds-item">' +
        (o.imageSize !== 'none' && it.pic !== undefined ? mediaLinked(it, 'ds-row-media') : '') +
        '<div class="ds-row-body">' + kicker(it) + titleHtml(it, 'h3', 'ds-title') + meta(it) +
        text(it, {full: false, expandable: o.expandable}) + '</div>' +
        (it.aside ? '<div class="ds-row-aside">' + it.aside + '</div>' : '') + '</li>';
    }).join('') + '</ol>';
  };

  layouts.editorial = function (items, o) {
    return '<div class="ds-editorial">' + items.map(function (it, i) {
      return '<article class="ds-ed-row ds-item' + (i % 2 ? ' is-flipped' : '') + '">' +
        (o.imageSize !== 'none' ? '<div class="ds-ed-media-wrap">' + mediaLinked(it, 'ds-ed-media') + '</div>' : '') +
        '<div class="ds-ed-body">' + (it.number ? '<p class="ds-number">' + it.number + '</p>' : '') +
        kicker(it) + titleHtml(it, 'h2', 'ds-title ds-ed-title') + meta(it) + text(it, o) + '</div></article>';
    }).join('') + '</div>';
  };

  layouts.featured = function (items, o) {
    var lead = items[0], rest = items.slice(1);
    return '<div class="ds-featured' + (rest.length ? '' : ' is-single') + '">' +
      '<article class="ds-feat-main ds-item">' + (o.imageSize !== 'none' && lead.pic !== undefined ? mediaLinked(lead, 'ds-feat-media') : '') +
      '<div class="ds-feat-body">' + kicker(lead) + titleHtml(lead, 'h2', 'ds-title ds-feat-title') + meta(lead) +
      text(lead, o) + '</div></article>' +
      (rest.length ? '<div class="ds-feat-side">' + rest.map(function (it) {
        return '<article class="ds-feat-item ds-item">' +
          (o.imageSize !== 'none' && it.pic !== undefined ? mediaLinked(it, 'ds-feat-thumb') : '') +
          '<div>' + kicker(it) + titleHtml(it, 'h3', 'ds-title') + meta(it) +
          text(it, {full: false, expandable: o.expandable}) + '</div></article>';
      }).join('') + '</div>' : '') + '</div>';
  };

  layouts.tabs = function (items, o) {
    /* One tab per item, or per group when the items are grouped (news and
       publications by year). */
    var groups = o.groupBy ? groupBy(items, o.groupBy) : items.map(function (it) {
      return {label: it.tabLabel || it.title, items: [it]};
    });
    var uid = 'dst' + Math.random().toString(36).slice(2, 8);
    return '<div class="ds-tabs">' +
      '<div class="ds-tablist" role="tablist">' + groups.map(function (g, i) {
        return '<button type="button" role="tab" id="' + uid + '-t' + i + '" aria-controls="' + uid + '-p' + i +
          '" aria-selected="' + (i === 0) + '" tabindex="' + (i === 0 ? 0 : -1) + '">' + esc(g.label) + '</button>';
      }).join('') + '</div>' +
      groups.map(function (g, i) {
        var body;
        if (g.items.length === 1 && !o.groupBy) {
          var it = g.items[0];
          body = '<div class="ds-tab-one">' + (o.imageSize !== 'none' ? mediaLinked(it, 'ds-tab-media') : '') +
            '<div class="ds-tab-body">' + kicker(it) + titleHtml(it, 'h3', 'ds-title') + meta(it) +
            text(it, {full: o.full || o.expandable, expandable: false}) + '</div></div>';
        } else {
          body = layouts.list(g.items, {imageSize: o.imageSize, expandable: o.expandable});
        }
        return '<div class="ds-tabpanel" role="tabpanel" id="' + uid + '-p' + i + '" aria-labelledby="' + uid + '-t' + i + '"' +
          (i ? ' hidden' : '') + '>' + body + '</div>';
      }).join('') + '</div>';
  };

  layouts.carousel = function (items, o) {
    /* Full text makes a slide, one at a time with the neighbours peeking in
       (the current site's research carousel); otherwise a run of cards. */
    var slides = o.full && items.some(function (it) { return it.html; });
    return '<div class="ds-carousel ' + (slides ? 'is-slides' : 'is-cards') + '">' +
      '<div class="ds-car-viewport" tabindex="0" role="region" aria-label="Carousel">' +
      '<div class="ds-car-track">' + items.map(function (it) {
        return '<article class="ds-car-item ds-item">' +
          (o.imageSize !== 'none' ? mediaLinked(it, 'ds-car-media') : '') +
          '<div class="ds-car-body">' + (it.number && slides ? '<p class="ds-number">' + it.number + '</p>' : '') +
          kicker(it) + titleHtml(it, slides ? 'h2' : 'h3', 'ds-title') + meta(it) +
          text(it, {full: slides, expandable: false}) + '</div></article>';
      }).join('') + '</div></div>' +
      '<div class="ds-car-nav"><button type="button" class="ds-car-prev" aria-label="Previous">←</button>' +
      '<span class="ds-car-count" aria-live="polite"></span>' +
      '<button type="button" class="ds-car-next" aria-label="Next">→</button></div></div>';
  };

  function groupBy(items, key) {
    var out = [], idx = {};
    items.forEach(function (it) {
      var k = it[key];
      if (!(k in idx)) { idx[k] = out.length; out.push({label: k, items: []}); }
      out[idx[k]].items.push(it);
    });
    return out;
  }

  /* -------------------------------------------------------------- adapters */

  DS.items = {};

  function leadsHtml(a) {
    return a.leads.map(function (l) {
      return l.url ? '<a href="' + esc(l.url) + '">' + esc(l.name) + '</a>' : esc(l.name);
    }).join(' · ');
  }

  DS.items.research = function (cfg, ctx) {
    ctx = ctx || {};
    var sel = cfg.imageSelections.research || {};
    var big = /editorial|featured|carousel|tabs/.test(ctx.layout || '') || ctx.size === 'large';
    return DS.content.research.map(function (a, i) {
      var fig = a.figure && a.figure.src ? {src: a.figure.src, alt: a.figure.alt, focus: a.figure.focus} : null;
      var pubs = a.publications.length ? '<details class="rw-pubs"><summary>Key publications (' + a.publications.length +
        ')</summary><ul>' + a.publications.map(function (p) { return '<li>' + p + '</li>'; }).join('') + '</ul></details>' : '';
      return {
        key: a.slug,
        number: String(i + 1).padStart(2, '0'),
        title: a.title,
        tabLabel: shortTitle(a.title),
        kicker: a.leads.length ? leadsHtml(a) : '',
        text: firstSentences(a.summary, 2),
        html: a.html,
        extra: '<div class="ds-d-hide-min">' + pubs + '</div>',
        pic: DS.picture(sel[a.slug], fig, big ? 'large' : 'medium'),
        emptyLabel: 'No figure yet',
        anchor: ctx.anchors ? a.anchor : null,
        route: ctx.route ? (ctx.route === 'area' ? 'research/' + a.slug : 'research') : null,
        routeAnchor: ctx.route === 'list' ? a.anchor : null,
        actionLabel: ctx.route ? 'Explore ' + shortTitle(a.title) : 'Read more'
      };
    });
  };

  DS.items.news = function (cfg, ctx) {
    ctx = ctx || {};
    var posts = DS.content.news.filter(function (p) { return ctx.all || p.featured; });
    if (ctx.count) posts = posts.slice(0, ctx.count);
    var big = /editorial|featured/.test(ctx.layout || '');
    return posts.map(function (p) {
      var img = p.image && p.image.card ? {src: big ? p.image.wide : p.image.card, alt: p.title, focus: 'center'} : null;
      return {
        key: p.url, title: p.title.trim(), text: p.summary, date: p.date, year: p.iso.slice(0, 4),
        kicker: '<time datetime="' + esc(p.iso) + '">' + esc(p.date) + '</time>',
        meta: p.authors.length ? esc(p.authors.join(', ')) + ' · ' + p.readingTime + ' min read' : '',
        pic: img, href: p.url, actionLabel: 'Read the story'
      };
    });
  };

  DS.items.publications = function (cfg, ctx) {
    ctx = ctx || {};
    var pubs = DS.content.publications;
    if (ctx.count) pubs = pubs.slice(0, ctx.count);
    return pubs.map(function (p) {
      return {
        key: p.url, title: p.title, year: p.year,
        kicker: esc(p.venue.replace(/,?\s*\d{4}\.?$/, '').replace(/\.$/, '')),
        meta: esc(shortAuthors(p.authors)) + ' · ' + esc(p.year),
        text: p.abstract, href: p.doi || p.url, pic: undefined,
        aside: '<span class="ds-year">' + esc(p.year) + '</span>',
        actionLabel: p.doi ? 'Read the paper' : 'Details'
      };
    });
  };

  function shortTitle(t) {
    return t.replace(/ in biomedical imaging$/i, '').replace(/^Privacy-preserving and trustworthy AI.*$/i, 'Privacy & trustworthy AI')
      .replace(/ in Health$/i, '');
  }
  function firstSentences(s, n) {
    var parts = String(s || '').match(/[^.!?]+[.!?]+(\s|$)/g);
    return parts ? parts.slice(0, n).join('').trim() : s;
  }
  function shortAuthors(list) {
    var a = list.filter(Boolean).map(function (x) { return String(x).trim(); });
    if (a.length <= 3) return a.join(', ');
    return a.slice(0, 3).join(', ') + ' et al.';
  }
  ui.firstSentences = firstSentences;
  ui.shortTitle = shortTitle;

  /* ---------------------------------------------------------------- heroes */

  /* All copy here is the site's own: the Welcome section, the Research
     introduction and the site title. Concepts choose which of it leads. */
  ui.hero = function (cfg) {
    var copy = DS.content.hero, concept = DS.concepts[cfg.contentPriority];
    var variant = concept.hero;
    var layout = cfg.heroLayout;
    var orig = copy.image ? {src: copy.image.src, srcset: copy.image.srcset, alt: copy.image.alt, focus: 'center ' + (copy.image.focal || '50%')} : null;
    var pic = DS.picture(cfg.imageSelections.hero, orig, 'large');

    var eyebrow = '', h1, lead = '', extra = '';
    var researchLead = DS.content.intro.firstSentence;
    var cta = '<p class="ds-hero-cta">' +
      '<a class="ds-btn ds-btn-primary" ' + navAttr('research') + '>Explore our research</a>' +
      '<a class="ds-btn ds-btn-ghost" ' + navAttr(cfg.contentPriority === 'news' ? 'news' : 'people') + '>' +
      (cfg.contentPriority === 'news' ? 'Latest news' : 'Meet the team') + '</a></p>';

    if (variant === 'welcome') {
      h1 = esc(copy.title); eyebrow = ''; lead = '<p class="ds-hero-tagline">' + esc(copy.tagline) + '</p><p class="ds-hero-lead ds-d-hide-min">' + esc(copy.lead) + '</p>';
      extra = copy.social;
    } else if (variant === 'research') {
      eyebrow = esc(DS.content.site.title); h1 = esc(copy.tagline);
      lead = '<p class="ds-hero-lead">' + esc(researchLead) + '</p>'; extra = cta;
    } else if (variant === 'compact') {
      eyebrow = ''; h1 = esc(DS.content.site.title); lead = '<p class="ds-hero-tagline">' + esc(copy.tagline) + '</p>';
    } else if (variant === 'visual') {
      h1 = esc(DS.content.site.title); lead = '<p class="ds-hero-tagline">' + esc(copy.tagline) + '</p>';
      extra = '<p class="ds-hero-cta"><a class="ds-btn ds-btn-primary" ' + navAttr('research') + '>Explore our research</a></p>';
    } else { /* academic */
      eyebrow = 'Technical University of Munich'; h1 = esc(copy.tagline);
      lead = '<p class="ds-hero-lead">' + esc(copy.lead) + '</p>'; extra = facts();
    }

    var textBlock = '<div class="ds-hero-copy">' + (eyebrow ? '<p class="ds-eyebrow">' + eyebrow + '</p>' : '') +
      '<h1>' + h1 + '</h1>' + lead + extra + '</div>';

    if (layout === 'image') {
      return '<div class="ds-hero ds-hero-image' + (pic ? '' : ' no-image') + '">' +
        (pic ? '<figure class="ds-hero-shot">' + ui.media(pic, {cls: 'ds-hero-media'}) + '</figure>' : '') +
        '<div class="ds-hero-inner container">' + textBlock + '</div></div>';
    }
    if (layout === 'split') {
      return '<div class="ds-hero ds-hero-split"><div class="container"><div class="ds-split">' + textBlock +
        '<figure class="ds-split-media">' + ui.media(pic, {cls: 'ds-hero-media'}) + '</figure></div></div></div>';
    }
    if (layout === 'text') {
      return '<div class="ds-hero ds-hero-text"><div class="container">' + textBlock + '</div></div>';
    }
    return '<div class="ds-hero ds-hero-minimal"><div class="container">' + textBlock + '</div></div>';
  };

  function facts() {
    var team = DS.content.people.filter(function (g) { return !/alumni|mental|collaborator|visitor/i.test(g.name); })
      .reduce(function (n, g) { return n + g.members.length; }, 0);
    var latest = DS.content.news.filter(function (p) { return p.featured; })[0];
    return '<dl class="ds-facts">' +
      '<div><dt>' + DS.content.research.length + '</dt><dd>research groups</dd></div>' +
      '<div><dt>' + team + '</dt><dd>researchers and staff</dd></div>' +
      (latest ? '<div class="ds-fact-news"><dt>Latest</dt><dd><a href="' + esc(latest.url) + '">' + esc(latest.title) + '</a></dd></div>' : '') +
      '</dl>';
  }

  /* A link to a part of the site that works in every structure: a route in
     the page structures, an anchor on the single page. */
  function navAttr(target) {
    var r = DS.router.targetFor(target);
    return 'href="' + esc(r.href) + '"' + (r.route != null ? ' data-ds-route="' + esc(r.route) + '"' : '');
  }
  ui.navAttr = navAttr;

  /* -------------------------------------------------------------- sections */

  ui.section = function (key, o) {
    var head = o.title ? '<header class="ds-head">' + (o.kicker ? '<p class="ds-eyebrow">' + o.kicker + '</p>' : '') +
      '<h1>' + esc(o.title) + '</h1>' + (o.sub ? '<p class="ds-sub">' + o.sub + '</p>' : '') + '</header>' : '';
    var foot = o.more ? '<p class="ds-section-more"><a class="ds-action" ' + o.more.attr + '>' + esc(o.more.label) +
      ' <span aria-hidden="true">→</span></a></p>' : '';
    return '<section class="home-section ds-section ds-s-' + key + (o.cls ? ' ' + o.cls : '') + '" id="' + (o.id || 'ds-' + key) +
      '" data-ds-key="' + key + '"' + (o.style ? ' style="' + o.style + '"' : '') + '><div class="container">' + head + o.body + foot + '</div></section>';
  };

  ui.pageHeader = function (o) {
    var pic = o.pic;
    /* A <header>, not a <section>: the theme stripes sections odd/even, and
       the page's first section should start on the page colour. */
    var sep = ' <span aria-hidden="true">/</span> ';
    return '<header class="ds-page-header' + (pic ? ' has-image' : '') + '" data-ds-key="page-header">' +
      (pic ? ui.media(pic, {cls: 'ds-ph-media'}) : '') +
      '<div class="container"><nav class="ds-crumbs" aria-label="Breadcrumb"><a ' + navAttr('home') + '>Home</a>' +
      (o.parent ? sep + '<a ' + o.parent.attr + '>' + esc(o.parent.label) + '</a>' : '') + sep + '<span aria-current="page">' + esc(o.crumb || o.title) + '</span>' +
      '</nav><h1>' + esc(o.title) + '</h1>' + (o.sub ? '<p class="ds-sub">' + o.sub + '</p>' : '') + '</div></header>';
  };

  /* ---------------------------------------------------------------- people */

  function person(m, opts) {
    var img = m.avatar ? '<img class="ds-avatar" src="' + esc(m.avatar) + '" alt="" loading="lazy">' :
      '<span class="ds-avatar ds-avatar-empty" aria-hidden="true">' + esc(m.name.charAt(0)) + '</span>';
    var name = m.url ? '<a href="' + esc(m.url) + '">' + esc(m.name) + '</a>' : esc(m.name);
    var detail = m.now ? '<span class="ds-p-now">Now ' + esc(m.now) + '</span>' :
      (opts.interests && m.interests.length ? '<span class="ds-p-int ds-d-show-rich">' + esc(m.interests.slice(0, 3).join(', ')) + '</span>' : '');
    return '<li class="ds-person">' + img + '<span class="ds-p-text"><span class="ds-p-name">' + name + '</span>' +
      (m.role ? '<span class="ds-p-role">' + esc(m.role) + '</span>' : '') + detail + '</span></li>';
  }

  ui.peopleCompact = function (groups) {
    return '<div class="ds-people is-compact">' + groups.map(function (g) {
      return '<div class="ds-pgroup"><h3 class="ds-pgroup-title">' + esc(g.name) + ' <span>' + g.members.length + '</span></h3>' +
        '<ul class="ds-pgrid">' + g.members.map(function (m) { return person(m, {interests: true}); }).join('') + '</ul></div>';
    }).join('') + '</div>';
  };

  ui.peopleGroups = function (groups) {
    var open = /^(chair|management|senior)/i;
    return '<div class="ds-people is-groups">' + groups.map(function (g) {
      var faces = g.members.slice(0, 6).map(function (m) {
        return m.avatar ? '<img src="' + esc(m.avatar) + '" alt="" loading="lazy">' : '';
      }).join('');
      return '<details class="ds-pfold"' + (open.test(g.name) ? ' open' : '') + '><summary><span class="ds-pfold-name">' + esc(g.name) +
        '</span><span class="ds-pfold-count">' + g.members.length + '</span><span class="ds-stack" aria-hidden="true">' + faces + '</span></summary>' +
        '<ul class="ds-pgrid">' + g.members.map(function (m) { return person(m, {interests: true}); }).join('') + '</ul></details>';
    }).join('') + '</div>';
  };

  ui.peopleTeaser = function (groups, opts) {
    var chair = (groups[0] || {members: []}).members[0];
    var current = groups.filter(function (g) { return !/alumni|mental/i.test(g.name); });
    var faces = [];
    current.forEach(function (g) { g.members.forEach(function (m) { if (m.avatar && m !== chair) faces.push(m); }); });
    var total = current.reduce(function (n, g) { return n + g.members.length; }, 0);
    var html = '<div class="ds-teaser">' +
      (chair ? '<div class="ds-chair">' + (chair.avatar ? '<img src="' + esc(chair.avatar) + '" alt="">' : '') +
        '<div><p class="ds-eyebrow">Chair</p><h3 class="ds-title">' + (chair.url ? '<a href="' + esc(chair.url) + '">' + esc(chair.name) + '</a>' : esc(chair.name)) + '</h3>' +
        '<p class="ds-meta">' + esc(chair.role) + '</p></div></div>' : '') +
      '<div class="ds-faces">' + faces.slice(0, 28).map(function (m) {
        return '<a href="' + esc(m.url) + '" title="' + esc(m.name) + '"><img src="' + esc(m.avatar) + '" alt="' + esc(m.name) + '" loading="lazy"></a>';
      }).join('') + '</div>' +
      '<p class="ds-counts">' + current.map(function (g) { return '<span><b>' + g.members.length + '</b> ' + esc(g.name.toLowerCase()) + '</span>'; }).join('') + '</p>';
    if (opts.expand) {
      html += '<div class="ds-more" hidden>' + ui.peopleCompact(groups) + '</div>' +
        '<button type="button" class="ds-expand ds-btn ds-btn-ghost" aria-expanded="false"><span>Show all ' + total + ' people</span></button>';
    } else if (opts.more) {
      html += '<p><a class="ds-btn ds-btn-ghost" ' + opts.more + '>Meet all ' + total + ' people</a></p>';
    }
    return html + '</div>';
  };

  /* -------------------------------------------------------------- behaviour */

  ui.enhance = function (root) {
    DS.$$('.ds-carousel', root).forEach(carousel);
    DS.$$('.ds-tabs', root).forEach(tabs);
    DS.$$('.ds-grid', root).forEach(function (g) { grid(g); });
  };

  /* One delegated listener for every "Read more" in the stage. */
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('.ds-expand');
    if (!b) return;
    var panel = b.previousElementSibling;
    if (!panel || !panel.classList.contains('ds-more')) return;
    var open = b.getAttribute('aria-expanded') !== 'true';
    panel.hidden = !open;
    b.setAttribute('aria-expanded', String(open));
    var label = b.querySelector('span');
    if (!b.dataset.closed) b.dataset.closed = label.textContent;
    label.textContent = open ? 'Show less' : b.dataset.closed;
    var card = b.closest('.ds-item');
    if (card) card.classList.toggle('is-open', open);
    if (!open && card) card.scrollIntoView({block: 'nearest', behavior: 'smooth'});
  });

  function carousel(root) {
    var vp = DS.$('.ds-car-viewport', root), items = DS.$$('.ds-car-item', root);
    var prev = DS.$('.ds-car-prev', root), next = DS.$('.ds-car-next', root), count = DS.$('.ds-car-count', root);
    function index() {
      var mid = vp.scrollLeft + vp.clientWidth / 2, best = 0, gap = Infinity;
      items.forEach(function (it, i) {
        var c = it.offsetLeft - vp.offsetLeft + it.offsetWidth / 2;
        var d = Math.abs(c - (root.classList.contains('is-slides') ? mid : vp.scrollLeft + it.offsetWidth / 2));
        if (d < gap) { gap = d; best = i; }
      });
      return best;
    }
    function go(i) {
      i = Math.max(0, Math.min(items.length - 1, i));
      var it = items[i];
      var left = root.classList.contains('is-slides') ?
        it.offsetLeft - vp.offsetLeft - (vp.clientWidth - it.offsetWidth) / 2 : it.offsetLeft - vp.offsetLeft - parseFloat(getComputedStyle(DS.$('.ds-car-track', root)).paddingLeft || 0);
      vp.scrollTo({left: left, behavior: 'smooth'});
    }
    function update() {
      var i = index();
      items.forEach(function (it, n) { it.classList.toggle('is-active', n === i); });
      count.textContent = (i + 1) + ' / ' + items.length;
      prev.disabled = vp.scrollLeft < 4;
      next.disabled = vp.scrollLeft + vp.clientWidth >= vp.scrollWidth - 4;
    }
    prev.addEventListener('click', function () { go(index() - 1); });
    next.addEventListener('click', function () { go(index() + 1); });
    vp.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') { go(index() - 1); e.preventDefault(); }
      if (e.key === 'ArrowRight') { go(index() + 1); e.preventDefault(); }
    });
    var t;
    vp.addEventListener('scroll', function () { clearTimeout(t); t = setTimeout(update, 80); }, {passive: true});
    items.forEach(function (it, i) {
      it.addEventListener('click', function (e) {
        if (root.classList.contains('is-slides') && !it.classList.contains('is-active')) { e.preventDefault(); go(i); }
      });
    });
    requestAnimationFrame(update);
  }

  function tabs(root) {
    var list = DS.$$('[role=tab]', root);
    function select(i, focus) {
      list.forEach(function (t, n) {
        var on = n === i;
        t.setAttribute('aria-selected', String(on));
        t.tabIndex = on ? 0 : -1;
        document.getElementById(t.getAttribute('aria-controls')).hidden = !on;
      });
      if (focus) list[i].focus();
    }
    list.forEach(function (t, i) {
      t.addEventListener('click', function () { select(i); });
      t.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowRight') select((i + 1) % list.length, true);
        if (e.key === 'ArrowLeft') select((i - 1 + list.length) % list.length, true);
      });
    });
  }

  function grid(root) {
    var host = root.parentElement;
    DS.$$('[data-ds-detail]', root).forEach(function (tile) {
      tile.addEventListener('click', function () {
        var i = tile.getAttribute('data-ds-detail');
        var panel = DS.$('[data-ds-detail-panel="' + i + '"]', host);
        var wasOpen = !panel.hidden;
        DS.$$('[data-ds-detail-panel]', host).forEach(function (p) { p.hidden = true; });
        DS.$$('[data-ds-detail]', root).forEach(function (t) { t.setAttribute('aria-expanded', 'false'); t.classList.remove('is-open'); });
        if (!wasOpen) {
          panel.hidden = false;
          tile.setAttribute('aria-expanded', 'true');
          tile.classList.add('is-open');
          panel.scrollIntoView({block: 'nearest', behavior: 'smooth'});
        }
      });
    });
    DS.$$('.ds-grid-detail .ds-close', host).forEach(function (b) {
      b.addEventListener('click', function () {
        b.parentElement.hidden = true;
        DS.$$('[data-ds-detail]', root).forEach(function (t) { t.setAttribute('aria-expanded', 'false'); t.classList.remove('is-open'); });
      });
    });
  }
})();

;
/* Design Studio - the page.
 *
 * Renders a configuration into the homepage and runs the client-side router
 * for the subpage structures.
 *
 * The original sections are never rebuilt. When a concept is showing they
 * are parked in a hidden vault, and the ones a concept reuses as they are -
 * People, Teaching, Vacancies, Contact, the Bluesky feed - are borrowed into
 * the stage and handed back before the next render. Their scripts (the
 * semester picker, the theme's own behaviour) keep working because the nodes
 * are moved, not copied. Showing the original puts every section back where
 * it was and removes the stage's content, which is the whole of "reset". */
(function () {
  'use strict';

  var DS = window.DS, esc = DS.esc, ui = DS.ui;
  var page = DS.page = {};
  var body, stage, vault, originals = [], byId = {}, borrowed = [], navOriginal, navStudio;
  var showingOriginal = true, scrollMemo = [];
  var PAGE_MODES = {subpages: 1, hybrid: 1};

  /* --------------------------------------------------------------- set-up */

  page.init = function () {
    body = DS.$('.page-body');
    originals = DS.$$(':scope > section.home-section', body);
    originals.forEach(function (s) { byId[s.id] = s; });
    stage = DS.h('<div id="ds-stage" class="ds-stage"></div>');
    vault = DS.h('<div id="ds-vault" hidden></div>');
    body.appendChild(stage);
    body.appendChild(vault);
    navOriginal = DS.$('#navbar-content > ul.navbar-nav');
    readCopy();
  };

  /* The copy that lives in Markdown bodies rather than front matter is read
     back from the rendered sections, so it still has one source. */
  function readCopy() {
    var c = DS.content;
    var h = byId.page_header;
    var t = function (sel, root) { var e = DS.$(sel, root); return e ? e.textContent.replace(/\s+/g, ' ').trim() : ''; };
    c.hero = {title: 'Welcome', tagline: '', lead: '', social: '', image: null};
    if (h) {
      c.hero.title = t('.hero-copy h1', h) || 'Welcome';
      c.hero.tagline = t('.hero-tagline', h);
      c.hero.lead = t('.hero-lead', h);
      var soc = DS.$('.hero-social', h);
      c.hero.social = soc ? soc.outerHTML.replace('hero-social', 'hero-social ds-hero-social') : '';
      var img = DS.$('.hero-shot img', h), fig = DS.$('.hero-shot', h);
      if (img) {
        c.hero.image = {src: img.getAttribute('src'), srcset: img.getAttribute('srcset'), alt: img.alt,
          focal: fig ? fig.style.getPropertyValue('--focal').trim() : ''};
      }
    }
    var r = byId.publications, col = r && DS.$('.col-lg-12', r);
    c.intro = {html: '', more: '', firstSentence: ''};
    if (col) {
      var ps = DS.$$(':scope > p', col), ul = DS.$(':scope > ul', col);
      if (ps[0]) {
        c.intro.html = ps[0].outerHTML + (ul ? ul.outerHTML : '');
        c.intro.lead = ps[0].outerHTML;
        c.intro.list = ul ? ul.outerHTML : '';
        c.intro.firstSentence = ui.firstSentences(ps[0].textContent.replace(/\s+/g, ' '), 1);
      }
      if (ps[1]) c.intro.more = ps[1].outerHTML;
    }
    var te = byId.teaching;
    c.teaching = {lead: '', cards: []};
    if (te) {
      var p = DS.$('.col-lg-12 > p', te);
      c.teaching.lead = p ? p.textContent.trim() : '';
      c.teaching.cards = DS.$$('.tw-card', te).map(function (card) {
        var a = DS.$('a.btn', card);
        return {eyebrow: t(':scope > p:first-child', card), title: t('h2', card), href: a ? a.getAttribute('href') : '',
          action: a ? a.textContent.replace(/→/, '').trim() : ''};
      });
    }
    var va = byId.vacancies;
    c.vacancies = {lead: '', status: ''};
    if (va) {
      var vp = DS.$$('.col-lg-8 > p', va);
      c.vacancies.lead = vp[0] ? vp[0].textContent.trim() : '';
      c.vacancies.status = vp[1] ? vp[1].textContent.trim() : '';
    }
  }

  /* ------------------------------------------------------------ borrowing */

  function borrow(node) {
    borrowed.push({node: node, parent: node.parentNode, next: node.nextSibling});
    return node;
  }
  function returnBorrowed() {
    while (borrowed.length) {
      var b = borrowed.pop();
      b.parent.insertBefore(b.node, b.next);
    }
  }
  function park() {
    returnBorrowed();
    originals.forEach(function (s) {
      s.classList.remove('ds-in-page', 'ds-borrowed');
      vault.appendChild(s);
    });
  }

  /* ---------------------------------------------------------------- render */

  page.render = function (cfg, opts) {
    opts = opts || {};
    var keep = opts.scrollTop || opts.route ? null : captureAnchor();
    var routeBefore = page.lastRoute;

    if (DS.isOriginal(cfg)) restore();
    else compose(cfg);

    if (opts.scrollTop || (opts.route && !opts.anchor)) window.scrollTo({top: 0, behavior: 'instant'});
    else if (opts.anchor) scrollToId(opts.anchor);
    else if (opts.focus) bringIntoView(opts.focus);
    else if (keep) restoreAnchor(keep);

    if (routeBefore !== page.lastRoute || opts.scrollTop) {
      stage.classList.remove('ds-enter');
      void stage.offsetWidth;
      stage.classList.add('ds-enter');
    }
    DS.emit('rendered', cfg);
  };

  /* A node that is moved, or hidden in the vault, forgets how far it was
     scrolled - which for the original Research carousel is which slide it
     shows. Note it on the way out and put it back on the way in. */
  function rememberScroll() {
    scrollMemo = [];
    originals.forEach(function (s) {
      DS.$$('.rc-viewport, .nw-posts', s).forEach(function (el) {
        scrollMemo.push([el, el.scrollLeft, el.scrollTop]);
      });
    });
  }
  function recallScroll() {
    scrollMemo.forEach(function (m) {
      var el = m[0], was = el.style.scrollBehavior;
      el.style.scrollBehavior = 'auto';
      el.scrollLeft = m[1];
      el.scrollTop = m[2];
      el.style.scrollBehavior = was;
    });
  }

  function restore() {
    page.lastRoute = '';
    if (showingOriginal) return;  /* already the published page: touch nothing */
    showingOriginal = true;
    park();
    originals.forEach(function (s) { body.insertBefore(s, stage); });
    requestAnimationFrame(recallScroll);
    stage.innerHTML = '';
    if (navStudio) { navStudio.remove(); navStudio = null; }
    if (navOriginal) navOriginal.classList.remove('ds-nav-hidden');
    spy(true);
  }

  function compose(cfg) {
    if (showingOriginal) { rememberScroll(); showingOriginal = false; }
    park();
    stage.innerHTML = '';
    var route = DS.router.route(cfg);
    page.lastRoute = route;
    var blocks = route === '' ? homeBlocks(cfg) : pageBlocks(cfg, route);
    blocks.forEach(function (b) {
      if (!b) return;
      if (b.node) {
        b.node.classList.add('ds-borrowed');
        if (b.inPage) b.node.classList.add('ds-in-page');
        stage.appendChild(borrow(b.node));
        return;
      }
      var el = DS.h(b.html);
      stage.appendChild(el);
      if (b.after) b.after(el);
    });
    ui.enhance(stage);
    buildNav(cfg, route);
  }

  /* ------------------------------------------------------------- homepage */

  function isPages(cfg) { return !!PAGE_MODES[cfg.navigationStructure]; }

  function homeBlocks(cfg) {
    var concept = DS.concepts[cfg.contentPriority];
    var pages = isPages(cfg);
    var blocks = concept.sections.map(function (key) {
      var fn = sections[key];
      return fn ? fn(cfg, {home: true, pages: pages, expandable: cfg.navigationStructure === 'expandable'}) : null;
    });
    var band = sections.band(cfg);
    if (band) blocks.splice(1, 0, band);
    return blocks;
  }

  var sections = {};

  sections.hero = function (cfg) {
    return {html: '<section class="ds-hero-wrap" id="ds-home" data-ds-key="hero">' + ui.hero(cfg) + '</section>'};
  };

  /* Background imagery: a full-width band under the hero carrying the
     opening line of the Research introduction. */
  sections.band = function (cfg) {
    var sel = cfg.imageSelections.background;
    if (!sel || sel === 'none') return null;
    var pic = DS.picture(sel, null, 'large');
    if (!pic) return null;
    return {html: '<section class="ds-band" data-ds-key="band">' + ui.media(pic, {cls: 'ds-band-media'}) +
      '<div class="container"><p class="ds-band-text">' + esc(DS.content.intro.firstSentence) + '</p>' +
      '<a class="ds-btn ds-btn-light" ' + ui.navAttr('research') + '>Our research</a></div></section>'};
  };

  function introHtml(cfg, ctx) {
    var d = cfg.visualTheme.density, intro = DS.content.intro;
    if (d === 'minimal' || !intro.html) return '';
    if (ctx.pages && ctx.home) return '<div class="ds-intro">' + intro.lead + '</div>';
    if (ctx.expandable) {
      return '<div class="ds-intro">' + intro.lead + '<div class="ds-more" hidden>' + intro.list + intro.more + '</div>' +
        '<button type="button" class="ds-expand ds-link-btn" aria-expanded="false"><span>Our research focus</span></button></div>';
    }
    return '<div class="ds-intro' + (d === 'rich' ? ' is-rich' : '') + '">' + intro.html + (d === 'rich' || !ctx.home ? intro.more : '') + '</div>';
  }

  function researchCollection(cfg, ctx, override) {
    var l = DS.merge(cfg.contentLayouts.research, override || {});
    var full = !ctx.pages && !ctx.expandable && /editorial|tabs|carousel|featured/.test(l.layout);
    var items = DS.items.research(cfg, {
      layout: l.layout,
      anchors: !ctx.pages,
      route: ctx.pages ? (cfg.navigationStructure === 'hybrid' ? 'area' : 'list') : null
    }).slice(0, l.count);
    return ui.collection(items, {layout: l.layout, imageSize: l.imageSize, full: full || !!l.full,
      expandable: !ctx.pages && !full, type: 'research', narrow: ctx.narrow});
  }

  sections.research = function (cfg, ctx) {
    var body = introHtml(cfg, ctx) + researchCollection(cfg, ctx);
    return {html: ui.section('research', {
      title: 'Research', body: body,
      more: ctx.pages ? {attr: ui.navAttr('research'), label: 'All research areas'} : null
    })};
  };

  sections.publications = function (cfg, ctx) {
    var l = cfg.contentLayouts.publications;
    var items = DS.items.publications(cfg, {count: l.count});
    var html;
    if (ctx.expandable && items.length > 3) {
      html = ui.collection(items.slice(0, 3), {layout: l.layout, imageSize: 'none', type: 'publications', groupBy: l.layout === 'tabs' ? 'year' : null}) +
        '<div class="ds-more" hidden>' + ui.collection(items.slice(3), {layout: 'list', imageSize: 'none', type: 'publications'}) + '</div>' +
        '<button type="button" class="ds-expand ds-link-btn" aria-expanded="false"><span>' + (items.length - 3) + ' more publications</span></button>';
    } else {
      html = ui.collection(items, {layout: l.layout, imageSize: 'none', type: 'publications', groupBy: l.layout === 'tabs' ? 'year' : null});
    }
    return {html: ui.section('publications', {
      title: 'Selected publications', body: html,
      more: ctx.pages ? {attr: ui.navAttr('publications'), label: 'All publications'} :
        {attr: DS.hrefAttr('publication/'), label: 'All publications'}
    })};
  };

  function newsBody(cfg, ctx, all) {
    var l = cfg.contentLayouts.news;
    var items = DS.items.news(cfg, {count: all ? 0 : l.count, layout: l.layout, all: all});
    var feed = l.feed && DS.$('#news .nw-side');
    var html = ui.collection(items, {layout: l.layout, imageSize: l.imageSize, full: false, type: 'news',
      narrow: feed || ctx.narrow, groupBy: l.layout === 'tabs' ? 'year' : null});
    if (feed) html = '<div class="ds-news-wrap"><div class="ds-news-main">' + html + '</div><div class="ds-feed-slot"></div></div>';
    return {html: html, feed: feed};
  }

  sections.news = function (cfg, ctx) {
    var nb = newsBody(cfg, ctx, false);
    return {
      html: ui.section('news', {
        title: 'News', body: nb.html,
        more: ctx.pages ? {attr: ui.navAttr('news'), label: 'All news'} : {attr: DS.hrefAttr('post/'), label: 'All news'}
      }),
      after: function (el) { if (nb.feed) DS.$('.ds-feed-slot', el).appendChild(borrow(nb.feed)); }
    };
  };

  sections.overview = function (cfg, ctx) {
    var intro = DS.content.intro;
    var nb = newsBody(cfg, DS.merge(ctx, {narrow: true}), false);
    var body = (cfg.visualTheme.density !== 'minimal' && intro.lead ? '<div class="ds-overview-lead">' + intro.lead + '</div>' : '') +
      '<div class="ds-overview"><div class="ds-ov-col"><h2 class="ds-col-title">Research</h2>' +
      researchCollection(cfg, DS.merge(ctx, {narrow: true})) +
      '<p class="ds-section-more"><a class="ds-action" ' + ui.navAttr('research') + '>' + (ctx.pages ? 'All research areas' : 'Research areas') + ' <span aria-hidden="true">→</span></a></p></div>' +
      '<div class="ds-ov-col"><h2 class="ds-col-title">Latest news</h2>' + nb.html +
      '<p class="ds-section-more"><a class="ds-action" ' + (ctx.pages ? ui.navAttr('news') : DS.hrefAttr('post/')) + '>All news <span aria-hidden="true">→</span></a></p></div></div>';
    return {
      html: ui.section('overview', {title: 'Chair of AI in Healthcare and Medicine', body: body, cls: 'ds-s-overview'}),
      after: function (el) { if (nb.feed) DS.$('.ds-feed-slot', el).appendChild(borrow(nb.feed)); }
    };
  };

  function peopleView(cfg, ctx) {
    var layout = cfg.contentLayouts.people.layout;
    var groups = DS.content.people;
    if (ctx.pages && ctx.home) return ui.peopleTeaser(groups, {more: ui.navAttr('people')});
    if (layout === 'full' && ctx.expandable) layout = 'groups';
    if (layout === 'full' && cfg.navigationStructure === 'hybrid' && !ctx.home) layout = 'groups';
    if (layout === 'teaser' && !ctx.home) layout = 'full';
    if (layout === 'full') return null;
    if (layout === 'compact') return ui.peopleCompact(groups);
    if (layout === 'groups') return ui.peopleGroups(groups);
    return ui.peopleTeaser(groups, {expand: true});
  }

  sections.people = function (cfg, ctx) {
    var html = peopleView(cfg, ctx);
    if (html == null) return byId.people ? {node: byId.people} : null;
    return {html: ui.section('people', {title: 'People', body: html, id: 'ds-people'})};
  };

  sections.teaching = function (cfg, ctx) {
    if (!(ctx.pages && ctx.home)) return byId.teaching ? {node: byId.teaching} : null;
    var t = DS.content.teaching;
    var body = '<div class="ds-teach"><p class="ds-teach-lead">' + esc(t.lead) + '</p><div class="ds-teach-cards">' +
      t.cards.map(function (c) {
        return '<a class="ds-teach-card" ' + ui.navAttr('teaching') + '><span class="ds-eyebrow">' + esc(c.eyebrow) + '</span>' +
          '<span class="ds-teach-title">' + esc(c.title) + '</span><span class="ds-action">' + esc(c.action || 'More') + ' →</span></a>';
      }).join('') + '</div></div>';
    return {html: ui.section('teaching', {title: 'Teaching', body: body,
      more: {attr: ui.navAttr('teaching'), label: 'Courses, programmes and theses'}})};
  };

  sections.vacancies = function (cfg, ctx) {
    if (!(ctx.pages && ctx.home)) return byId.vacancies ? {node: byId.vacancies} : null;
    var v = DS.content.vacancies;
    return {html: ui.section('vacancies', {title: 'Work with us', cls: 'ds-s-compact',
      body: '<p class="ds-text">' + esc(v.status || v.lead) + '</p>',
      more: {attr: ui.navAttr('vacancies'), label: 'Vacancies and student projects'}})};
  };

  sections.contact = function () { return byId.contact ? {node: byId.contact} : null; };

  /* ---------------------------------------------------------------- pages */

  var PAGES = {
    research: 'Research', publications: 'Publications', news: 'News', people: 'People',
    teaching: 'Teaching', vacancies: 'Vacancies', contact: 'Contact'
  };

  function header(cfg, key, title, sub, parent) {
    var sel = cfg.imageSelections.sections[key];
    return {html: ui.pageHeader({title: title, sub: sub, parent: parent, pic: sel ? DS.picture(sel, null, 'large') : null})};
  }

  function pageBlocks(cfg, route) {
    var parts = route.split('/'), key = parts[0];
    var ctx = {home: false, pages: true, expandable: false};
    if (key === 'research' && parts[1]) return areaPage(cfg, parts[1]);
    if (!PAGES[key]) return homeBlocks(cfg);

    var blocks = [];
    if (key === 'research') {
      var hybrid = cfg.navigationStructure === 'hybrid';
      var items = DS.items.research(cfg, {layout: hybrid ? 'grid' : 'editorial', anchors: !hybrid, route: hybrid ? 'area' : null});
      blocks.push(header(cfg, 'research', 'Research', DS.content.research.length + ' research groups at the chair'));
      blocks.push({html: ui.section('research-page', {
        body: introHtml(cfg, {pages: true, home: false}) +
          ui.collection(items, {layout: hybrid ? 'grid' : 'editorial', imageSize: hybrid ? 'l' : 'm', full: !hybrid, type: 'research'})
      })});
    } else if (key === 'publications') {
      var pubs = DS.items.publications(cfg, {});
      blocks.push(header(cfg, 'publications', 'Publications', 'Selected papers, newest first'));
      blocks.push({html: ui.section('publications-page', {
        body: ui.collection(pubs, {layout: 'tabs', groupBy: 'year', imageSize: 'none', type: 'publications'}),
        more: {attr: DS.hrefAttr('publication/'), label: 'Search and filter every publication'}
      })});
    } else if (key === 'news') {
      var nb = newsBody(cfg, ctx, true);
      blocks.push(header(cfg, 'news', 'News', 'Awards, visits and announcements from the lab'));
      blocks.push({html: ui.section('news-page', {body: nb.html, more: {attr: DS.hrefAttr('post/'), label: 'News archive'}}),
        after: function (el) { if (nb.feed) DS.$('.ds-feed-slot', el).appendChild(borrow(nb.feed)); }});
    } else if (key === 'people') {
      var total = DS.content.people.reduce(function (n, g) { return n + g.members.length; }, 0);
      blocks.push(header(cfg, 'people', 'People', total + ' people across ' + DS.content.people.length + ' groups'));
      var html = peopleView(cfg, ctx);
      blocks.push(html == null ? {node: byId.people, inPage: true} : {html: ui.section('people-page', {body: html})});
    } else {
      blocks.push(header(cfg, key, PAGES[key]));
      if (byId[key]) blocks.push({node: byId[key], inPage: true});
    }
    return blocks;
  }

  function areaPage(cfg, slug) {
    var areas = DS.content.research, i = areas.map(function (a) { return a.slug; }).indexOf(slug);
    if (i < 0) return pageBlocks(cfg, 'research');
    var it = DS.items.research(cfg, {layout: 'editorial'})[i];
    var a = areas[i];
    var others = DS.items.research(cfg, {route: 'area'}).filter(function (x) { return x.key !== slug; });
    return [
      {html: ui.pageHeader({title: a.title, crumb: ui.shortTitle(a.title), sub: it.kicker ? 'Led by ' + it.kicker : '', pic: it.pic,
        parent: {label: 'Research', attr: ui.navAttr('research')}})},
      {html: ui.section('area', {cls: 'ds-s-area', body:
        '<div class="ds-area"><div class="ds-area-text"><div class="ds-prose ds-lead-first">' + a.html + '</div>' + it.extra + '</div>' +
        (a.figure && a.figure.src && it.pic && it.pic.stock ? '<figure class="ds-area-fig">' + ui.media({src: a.figure.src, alt: a.figure.alt}, {cls: 'ds-fig-contained'}) +
          '<figcaption>Figure from the group\'s work</figcaption></figure>' : '') + '</div>'})},
      {html: ui.section('area-more', {title: 'More research areas', body:
        ui.collection(others, {layout: 'cards', imageSize: 's', type: 'research'})})}
    ];
  }

  /* --------------------------------------------------------------- the nav */

  function buildNav(cfg, route) {
    if (!navOriginal) return;
    var pages = isPages(cfg);
    var items = [];
    if (pages) {
      items.push({label: 'Home', route: ''});
      items.push({label: 'Research', route: 'research', dropdown: cfg.navigationStructure === 'hybrid'});
      ['publications', 'news', 'people', 'teaching', 'vacancies', 'contact'].forEach(function (k) {
        items.push({label: PAGES[k], route: k});
      });
    } else {
      var labels = {hero: 'Home', research: 'Research', overview: 'Research', publications: 'Publications', news: 'News',
        people: 'People', teaching: 'Teaching', vacancies: 'Vacancies', contact: 'Contact'};
      DS.concepts[cfg.contentPriority].sections.forEach(function (k) {
        var id = k === 'hero' ? 'top' : sectionId(cfg, k);
        if (id && labels[k] && !items.some(function (x) { return x.label === labels[k]; })) items.push({label: labels[k], href: '#' + id});
      });
    }
    if (!navStudio) {
      navStudio = DS.h('<ul class="navbar-nav d-md-inline-flex ds-nav"></ul>');
      navOriginal.parentNode.insertBefore(navStudio, navOriginal.nextSibling);
    }
    navOriginal.classList.add('ds-nav-hidden');
    var top = route.split('/')[0];
    navStudio.innerHTML = items.map(function (it) {
      var active = pages && it.route === top;
      if (it.dropdown) {
        return '<li class="nav-item dropdown"><a class="nav-link dropdown-toggle' + (active ? ' active' : '') + '" href="' +
          esc(DS.router.href('research')) + '" data-toggle="dropdown" role="button" aria-haspopup="true" aria-expanded="false"><span>Research</span></a>' +
          '<div class="dropdown-menu ds-dropdown"><a class="dropdown-item" data-ds-route="research" href="' + esc(DS.router.href('research')) + '">All research areas</a>' +
          '<div class="dropdown-divider"></div>' +
          DS.content.research.map(function (a) {
            return '<a class="dropdown-item" data-ds-route="research/' + esc(a.slug) + '" href="' + esc(DS.router.href('research/' + a.slug)) + '">' + esc(a.title) + '</a>';
          }).join('') + '</div></li>';
      }
      var attr = it.route != null ? 'href="' + esc(DS.router.href(it.route)) + '" data-ds-route="' + esc(it.route) + '"' : 'href="' + esc(it.href) + '"';
      return '<li class="nav-item"><a class="nav-link' + (active ? ' active' : '') + '" ' + attr + '><span>' + esc(it.label) + '</span></a></li>';
    }).join('');
    spy(!pages);
  }

  function sectionId(cfg, key) {
    var el = DS.$('[data-ds-key="' + key + '"]', stage) || (byId[key] && stage.contains(byId[key]) ? byId[key] : null);
    return el ? el.id : null;
  }

  /* The theme's scrollspy highlights the section in view. It only makes
     sense on a single page; elsewhere the active route is marked instead. */
  function spy(on) {
    var $ = window.jQuery;
    if (!$ || !$.fn.scrollspy) return;
    var $b = $('body');
    try {
      if (on) {
        if (!$b.data('bs.scrollspy')) $b.scrollspy({target: '#navbar-main', offset: navHeight()});
        $b.scrollspy('refresh');
      } else if ($b.data('bs.scrollspy')) {
        $b.scrollspy('dispose');
      }
    } catch (e) { /* the page works without it */ }
  }

  /* ---------------------------------------------------------------- scroll */

  function navHeight() {
    var n = DS.$('#navbar-main');
    return n ? n.getBoundingClientRect().height : 0;
  }

  function captureAnchor() {
    var nav = navHeight();
    var nodes = DS.$$(':scope > *', stage).concat(DS.$$(':scope > section', body));
    for (var i = 0; i < nodes.length; i++) {
      var r = nodes[i].getBoundingClientRect();
      if (r.bottom > nav + 10 && r.height) return {key: nodes[i].getAttribute('data-ds-key') || nodes[i].id, top: r.top};
    }
    return null;
  }

  function restoreAnchor(a) {
    var el = DS.$('[data-ds-key="' + a.key + '"]', stage) || document.getElementById(a.key);
    if (!el || !el.offsetParent) return;
    window.scrollBy({top: el.getBoundingClientRect().top - a.top, behavior: 'instant'});
  }

  function bringIntoView(key) {
    var el = DS.$('[data-ds-key="' + key + '"]', stage) || DS.$('[data-ds-key="overview"]', stage) ||
      (byId[key] && stage.contains(byId[key]) ? byId[key] : null);
    if (!el) return;
    var r = el.getBoundingClientRect(), nav = navHeight();
    if (r.top < nav || r.top > window.innerHeight * 0.6) {
      window.scrollTo({top: window.scrollY + r.top - nav - 8, behavior: 'smooth'});
    }
  }

  function scrollToId(id) {
    requestAnimationFrame(function () {
      var el = document.getElementById(id);
      if (el) window.scrollTo({top: window.scrollY + el.getBoundingClientRect().top - navHeight() - 16, behavior: 'smooth'});
    });
  }

  /* ---------------------------------------------------------------- router */

  /* Routes live in the query string (?page=research) rather than the hash:
     the theme reads every hash as a section to scroll to, and its jQuery
     selector would choke on a path. */
  DS.router = {
    route: function (cfg) {
      cfg = cfg || DS.config();
      if (DS.isOriginal(cfg) || !isPages(cfg)) return '';
      return (new URLSearchParams(location.search).get('page') || '').replace(/^\/+|\/+$/g, '');
    },
    href: function (route, anchor) {
      var u = new URL(location.href);
      if (route) u.searchParams.set('page', route); else u.searchParams.delete('page');
      u.hash = anchor ? anchor : '';
      return u.pathname + u.search + u.hash;
    },
    go: function (route, anchor) {
      history.pushState({dsRoute: route}, '', DS.router.href(route));
      page.render(DS.config(), {route: true, anchor: anchor});
    },
    /* Where "research", "people", "news" ... live in the active structure. */
    targetFor: function (target) {
      var cfg = DS.config();
      if (!DS.isOriginal(cfg) && isPages(cfg)) {
        var r = target === 'home' ? '' : target;
        return {href: DS.router.href(r), route: r};
      }
      if (target === 'home') return {href: '#top'};
      var keys = target === 'research' ? ['research', 'overview'] : [target];
      var ids = {research: 'ds-research', overview: 'ds-overview', news: 'ds-news', publications: 'ds-publications',
        people: cfg.contentLayouts && cfg.contentLayouts.people.layout === 'full' && cfg.navigationStructure !== 'expandable' ? 'people' : 'ds-people',
        teaching: 'teaching', vacancies: 'vacancies', contact: 'contact'};
      var sections = DS.concepts[cfg.contentPriority || 'current'].sections;
      for (var i = 0; i < keys.length; i++) if (sections.indexOf(keys[i]) >= 0) return {href: '#' + ids[keys[i]]};
      return {href: '#top'};
    },
    /* Leaving the page structures drops a stale ?page= from the address. */
    tidy: function (cfg) {
      if (isPages(cfg) && !DS.isOriginal(cfg)) return;
      var u = new URL(location.href);
      if (u.searchParams.has('page')) {
        u.searchParams.delete('page');
        history.replaceState(history.state, '', u.pathname + u.search + u.hash);
      }
    }
  };

  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[data-ds-route]');
    if (!a || e.metaKey || e.ctrlKey || e.shiftKey || e.button) return;
    e.preventDefault();
    var menu = a.closest('.dropdown-menu');
    if (menu && window.jQuery) window.jQuery(menu.previousElementSibling).dropdown('hide');
    var collapse = DS.$('#navbar-content.show');
    if (collapse && window.jQuery) window.jQuery(collapse).collapse('hide');
    DS.router.go(a.getAttribute('data-ds-route'), a.getAttribute('data-ds-anchor'));
  });

  window.addEventListener('popstate', function () {
    page.render(DS.config(), {route: true});
  });
})();

;
/* Design Studio - visual theme.
 *
 * The look is a handful of attributes on <html> (data-ds-typography,
 * data-ds-palette, ...) that site.css turns into custom properties. The head
 * partial sets the same attributes before first paint from the saved
 * concept; keep the attribute names here and there in step.
 *
 * Light and dark reuse the theme's own `body.dark` variation, so every dark
 * fix already in custom.scss applies. The studio never writes the theme's
 * stored preference: "Site default" hands control straight back to it. */
(function () {
  'use strict';

  var DS = window.DS;
  var theme = DS.theme = {};
  var ATTRS = ['typography', 'palette', 'imageTreatment', 'spacing', 'density', 'nav', 'appearance'];
  var siteDark = null, compactOn = false, lastY = 0;

  theme.init = function () {
    siteDark = document.body.classList.contains('dark');
    window.addEventListener('scroll', onScroll, {passive: true});
  };

  theme.attributes = function (cfg) {
    var out = {};
    if (DS.isOriginal(cfg)) return out;
    out['data-ds'] = 'on';
    ATTRS.forEach(function (k) { out['data-ds-' + k.toLowerCase()] = cfg.visualTheme[k]; });
    return out;
  };

  theme.apply = function (cfg) {
    var h = document.documentElement;
    ['data-ds'].concat(ATTRS.map(function (k) { return 'data-ds-' + k.toLowerCase(); })).forEach(function (a) { h.removeAttribute(a); });
    var attrs = theme.attributes(cfg);
    Object.keys(attrs).forEach(function (a) { h.setAttribute(a, attrs[a]); });
    var appearance = DS.isOriginal(cfg) ? 'auto' : cfg.visualTheme.appearance;
    setDark(appearance === 'dark' ? true : appearance === 'light' ? false : siteDark);
    compactOn = !DS.isOriginal(cfg) && cfg.visualTheme.nav === 'compact';
    if (!compactOn) h.classList.remove('ds-nav-away');
  };

  function setDark(on) {
    var b = document.body;
    if (b.classList.contains('dark') === !!on) return;
    b.classList.toggle('dark', !!on);
    /* The theme swaps its code-highlighting sheet with the variation. */
    var light = document.querySelector('link[title=hl-light]'), dark = document.querySelector('link[title=hl-dark]');
    if (light && dark) { light.disabled = !!on; dark.disabled = !on; }
  }

  /* The compact bar steps out of the way while reading down the page and
     comes back the moment the visitor scrolls up. */
  function onScroll() {
    var y = window.scrollY;
    if (compactOn) {
      var h = document.documentElement;
      if (y > lastY + 6 && y > 140) h.classList.add('ds-nav-away');
      else if (y < lastY - 6 || y < 140) h.classList.remove('ds-nav-away');
    }
    lastY = y;
  }
})();

;
/* Design Studio - the control panel.
 *
 * A panel that slides in from the right over (or docked beside) the live
 * page. Every control writes through DS.update(), so the page re-renders at
 * once and the panel re-reads the configuration to show where it now stands.
 * The tabs run from the decisions that matter most to the ones that refine:
 * concept, layout, structure, images, style, then what has been saved. */
(function () {
  'use strict';

  var DS = window.DS, esc = DS.esc;
  var panel = DS.panel = {};
  var el, launcher, bodyEl, prefs;

  var TABS = [
    {id: 'concept', label: 'Concept'}, {id: 'layout', label: 'Layout'}, {id: 'structure', label: 'Structure'},
    {id: 'images', label: 'Images'}, {id: 'style', label: 'Style'}, {id: 'saved', label: 'Saved'}
  ];

  /* ---------------------------------------------------------------- icons */

  var I = {
    undo: '<svg viewBox="0 0 20 20"><path d="M7 5 3 9l4 4M3.5 9H12a5 5 0 0 1 0 10h-2" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    compare: '<svg viewBox="0 0 20 20"><rect x="2.5" y="4" width="6.5" height="12" rx="1.2" fill="none" stroke="currentColor" stroke-width="1.5"/><rect x="11" y="4" width="6.5" height="12" rx="1.2" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>',
    present: '<svg viewBox="0 0 20 20"><path d="M3 7V3.5h3.5M17 7V3.5h-3.5M3 13v3.5h3.5M17 13v3.5h-3.5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><path d="m8.5 7.5 4 2.5-4 2.5z" fill="currentColor"/></svg>',
    dock: '<svg viewBox="0 0 20 20"><rect x="2.5" y="3.5" width="15" height="13" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M12 3.5v13" stroke="currentColor" stroke-width="1.5"/><path d="M13.5 6.5h2.5M13.5 9h2.5" stroke="currentColor" stroke-width="1.2"/></svg>',
    close: '<svg viewBox="0 0 20 20"><path d="m5 5 10 10M15 5 5 15" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
    spark: '<svg viewBox="0 0 20 20"><path d="M10 2.5 11.6 8.4 17.5 10l-5.9 1.6L10 17.5l-1.6-5.9L2.5 10l5.9-1.6z" fill="currentColor"/></svg>'
  };

  /* Small schematics: what each layout looks like, drawn in the panel's ink. */
  var SCHEMA = {
    cards: '<rect x="2" y="5" width="10" height="7" opacity=".35"/><rect x="15" y="5" width="10" height="7" opacity=".35"/><rect x="28" y="5" width="10" height="7" opacity=".35"/><rect x="2" y="14" width="9" height="1.6"/><rect x="15" y="14" width="9" height="1.6"/><rect x="28" y="14" width="9" height="1.6"/><rect x="2" y="18" width="7" height="1.2" opacity=".5"/><rect x="15" y="18" width="7" height="1.2" opacity=".5"/><rect x="28" y="18" width="7" height="1.2" opacity=".5"/>',
    carousel: '<rect x="9" y="4" width="22" height="13" opacity=".35"/><rect x="0" y="6" width="6" height="9" opacity=".18"/><rect x="34" y="6" width="6" height="9" opacity=".18"/><rect x="9" y="19" width="14" height="1.6"/><circle cx="17" cy="24.5" r="1"/><circle cx="20" cy="24.5" r="1" opacity=".4"/><circle cx="23" cy="24.5" r="1" opacity=".4"/>',
    grid: '<rect x="2" y="3" width="17" height="21" opacity=".45"/><rect x="21" y="3" width="8" height="10" opacity=".3"/><rect x="31" y="3" width="8" height="10" opacity=".3"/><rect x="21" y="14" width="8" height="10" opacity=".3"/><rect x="31" y="14" width="8" height="10" opacity=".3"/>',
    list: '<rect x="2" y="3" width="5" height="5" opacity=".35"/><rect x="9" y="4" width="22" height="1.6"/><rect x="9" y="6.6" width="15" height="1.1" opacity=".5"/><rect x="2" y="11" width="5" height="5" opacity=".35"/><rect x="9" y="12" width="26" height="1.6"/><rect x="9" y="14.6" width="17" height="1.1" opacity=".5"/><rect x="2" y="19" width="5" height="5" opacity=".35"/><rect x="9" y="20" width="20" height="1.6"/><rect x="9" y="22.6" width="14" height="1.1" opacity=".5"/>',
    editorial: '<rect x="2" y="2" width="18" height="11" opacity=".38"/><rect x="23" y="4" width="14" height="1.8"/><rect x="23" y="8" width="12" height="1.1" opacity=".5"/><rect x="23" y="10.5" width="13" height="1.1" opacity=".5"/><rect x="20" y="15" width="18" height="11" opacity=".38"/><rect x="3" y="17" width="14" height="1.8"/><rect x="3" y="21" width="12" height="1.1" opacity=".5"/><rect x="3" y="23.5" width="13" height="1.1" opacity=".5"/>',
    featured: '<rect x="2" y="3" width="22" height="15" opacity=".4"/><rect x="2" y="20" width="16" height="1.8"/><rect x="2" y="23.5" width="12" height="1.1" opacity=".5"/><rect x="27" y="3" width="11" height="1.6"/><rect x="27" y="6" width="8" height="1.1" opacity=".5"/><rect x="27" y="11" width="11" height="1.6"/><rect x="27" y="14" width="8" height="1.1" opacity=".5"/><rect x="27" y="19" width="11" height="1.6"/><rect x="27" y="22" width="8" height="1.1" opacity=".5"/>',
    tabs: '<rect x="2" y="3" width="10" height="3.4"/><rect x="13" y="3" width="10" height="3.4" opacity=".3"/><rect x="24" y="3" width="10" height="3.4" opacity=".3"/><rect x="2" y="8.5" width="15" height="16" opacity=".35"/><rect x="20" y="10" width="17" height="1.8"/><rect x="20" y="14" width="15" height="1.1" opacity=".5"/><rect x="20" y="16.5" width="16" height="1.1" opacity=".5"/><rect x="20" y="19" width="12" height="1.1" opacity=".5"/>',
    full: dots(5, 2, 8, 5.5, 11, 3.1),
    compact: dots(9, 3, 4.2, 4.5, 7.2, 1.7),
    groups: '<path d="M3 5.5l2 1.5-2 1.5" fill="none" stroke="currentColor" stroke-width="1"/><rect x="8" y="5.5" width="12" height="1.6"/>' + dots(4, 1, 25, 6.3, 3.6, 1.4, 22) +
      '<path d="M3 13.5l1.5 2 1.5-2" fill="none" stroke="currentColor" stroke-width="1"/><rect x="8" y="13.5" width="10" height="1.6"/>' + dots(6, 1, 9, 20, 4.4, 1.8) ,
    teaser: '<circle cx="8" cy="10" r="5.5" opacity=".45"/><rect x="16" y="7" width="14" height="1.8"/><rect x="16" y="11" width="18" height="1.1" opacity=".5"/>' + dots(8, 1, 4, 22, 4.4, 1.7)
  };
  function dots(cols, rows, x0, y0, step, r, maxX) {
    var s = '';
    for (var j = 0; j < rows; j++) for (var i = 0; i < cols; i++) {
      var x = x0 + i * step;
      if (maxX && x > maxX + 20) continue;
      s += '<circle cx="' + x.toFixed(1) + '" cy="' + (y0 + j * step).toFixed(1) + '" r="' + r + '" opacity=".4"/>';
    }
    return s;
  }
  function schema(name) { return '<svg viewBox="0 0 40 28" fill="currentColor" aria-hidden="true">' + (SCHEMA[name] || '') + '</svg>'; }

  /* Homepage wireframes for the concepts, top of page first. */
  var WIRE = {
    current: '<rect x="0" y="0" width="60" height="11" opacity=".5"/><rect x="8" y="14" width="44" height="7" opacity=".25"/>' + dots(9, 2, 9, 25, 5, 1.5) + '<rect x="6" y="35" width="30" height="1.6" opacity=".5"/><rect x="6" y="39" width="22" height="1.6" opacity=".5"/>',
    research: '<rect x="4" y="3" width="22" height="2"/><rect x="4" y="7" width="17" height="1.3" opacity=".5"/><rect x="32" y="2" width="24" height="10" opacity=".4"/><rect x="4" y="16" width="15" height="9" opacity=".45"/><rect x="22" y="16" width="15" height="9" opacity=".45"/><rect x="40" y="16" width="15" height="9" opacity=".45"/><rect x="4" y="29" width="40" height="1.4" opacity=".5"/><rect x="4" y="32.5" width="36" height="1.4" opacity=".5"/><rect x="4" y="38" width="24" height="1.4" opacity=".3"/>',
    news: '<rect x="4" y="2" width="30" height="2.2"/><rect x="4" y="9" width="32" height="17" opacity=".45"/><rect x="39" y="9" width="17" height="1.6"/><rect x="39" y="14" width="17" height="1.6"/><rect x="39" y="19" width="17" height="1.6"/><rect x="4" y="31" width="10" height="7" opacity=".25"/><rect x="17" y="31" width="10" height="7" opacity=".25"/><rect x="30" y="31" width="10" height="7" opacity=".25"/>',
    balanced: '<rect x="0" y="0" width="60" height="12" opacity=".45"/><rect x="4" y="16" width="34" height="1.8"/><rect x="4" y="22" width="15" height="8" opacity=".35"/><rect x="21" y="22" width="15" height="8" opacity=".35"/><rect x="4" y="32" width="15" height="8" opacity=".35"/><rect x="21" y="32" width="15" height="8" opacity=".35"/><rect x="41" y="22" width="15" height="1.5"/><rect x="41" y="27" width="15" height="1.5"/><rect x="41" y="32" width="15" height="1.5"/><rect x="41" y="37" width="15" height="1.5"/>',
    visual: '<rect x="0" y="0" width="60" height="20" opacity=".55"/><rect x="5" y="12" width="20" height="2.4" fill="#fff"/><rect x="4" y="24" width="28" height="13" opacity=".4"/><rect x="36" y="26" width="18" height="2"/><rect x="36" y="31" width="14" height="1.3" opacity=".5"/>',
    minimal: '<rect x="4" y="3" width="36" height="2.6"/><rect x="4" y="9" width="44" height="1.3" opacity=".5"/><rect x="4" y="12" width="40" height="1.3" opacity=".5"/><rect x="4" y="19" width="12" height="1.6"/><rect x="20" y="19" width="34" height="1.3" opacity=".5"/><rect x="4" y="24" width="12" height="1.6"/><rect x="20" y="24" width="30" height="1.3" opacity=".5"/><rect x="4" y="29" width="12" height="1.6"/><rect x="20" y="29" width="32" height="1.3" opacity=".5"/><rect x="4" y="34" width="12" height="1.6"/><rect x="20" y="34" width="26" height="1.3" opacity=".5"/>'
  };
  function wire(name) { return '<svg viewBox="0 0 60 42" fill="currentColor" aria-hidden="true">' + (WIRE[name] || '') + '</svg>'; }

  /* Site maps for the structures. */
  var MAP = {
    single: '<rect x="20" y="1" width="20" height="40" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.2"/><rect x="23" y="4" width="14" height="6" opacity=".45"/><rect x="23" y="13" width="14" height="2" opacity=".5"/><rect x="23" y="18" width="14" height="2" opacity=".5"/><rect x="23" y="23" width="14" height="2" opacity=".5"/><rect x="23" y="28" width="14" height="2" opacity=".5"/><rect x="23" y="33" width="14" height="2" opacity=".5"/>',
    subpages: '<rect x="22" y="1" width="16" height="12" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.2"/><rect x="25" y="4" width="10" height="3" opacity=".45"/><path d="M30 13v6M8 19h44M8 19v4M22 19v4M38 19v4M52 19v4" fill="none" stroke="currentColor" stroke-width="1"/><rect x="2" y="23" width="12" height="16" rx="1" fill="none" stroke="currentColor" stroke-width="1.1"/><rect x="16" y="23" width="12" height="16" rx="1" fill="none" stroke="currentColor" stroke-width="1.1"/><rect x="32" y="23" width="12" height="16" rx="1" fill="none" stroke="currentColor" stroke-width="1.1"/><rect x="46" y="23" width="12" height="16" rx="1" fill="none" stroke="currentColor" stroke-width="1.1"/>',
    expandable: '<rect x="14" y="1" width="32" height="40" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.2"/><rect x="17" y="4" width="26" height="6" opacity=".45"/><path d="M18 15h3M19.5 13.5v3" stroke="currentColor" stroke-width="1"/><rect x="24" y="14" width="18" height="1.8" opacity=".6"/><path d="M18 21h3" stroke="currentColor" stroke-width="1"/><rect x="24" y="20" width="16" height="1.8" opacity=".6"/><rect x="24" y="23.5" width="17" height="1.1" opacity=".35"/><rect x="24" y="26" width="15" height="1.1" opacity=".35"/><path d="M18 31h3M19.5 29.5v3" stroke="currentColor" stroke-width="1"/><rect x="24" y="30" width="14" height="1.8" opacity=".6"/>',
    hybrid: '<rect x="20" y="1" width="20" height="13" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.2"/><rect x="22" y="3" width="16" height="6" opacity=".45"/><path d="M30 14v4M10 18h40M10 18v3M30 18v3M50 18v3" fill="none" stroke="currentColor" stroke-width="1"/><rect x="3" y="21" width="14" height="9" rx="1" fill="none" stroke="currentColor" stroke-width="1.1"/><rect x="23" y="21" width="14" height="9" rx="1" fill="none" stroke="currentColor" stroke-width="1.1"/><rect x="43" y="21" width="14" height="9" rx="1" fill="none" stroke="currentColor" stroke-width="1.1"/><path d="M10 30v3M4 33h12M4 33v2M10 33v2M16 33v2" fill="none" stroke="currentColor" stroke-width="1"/><rect x="2" y="35" width="4" height="5" opacity=".45"/><rect x="8" y="35" width="4" height="5" opacity=".45"/><rect x="14" y="35" width="4" height="5" opacity=".45"/><path d="M45 34h3M46.5 32.5v3M45 38h3" stroke="currentColor" stroke-width="1"/>'
  };
  function map(name) { return '<svg viewBox="0 0 60 42" fill="currentColor" aria-hidden="true">' + (MAP[name] || '') + '</svg>'; }

  /* -------------------------------------------------------------- controls */

  panel.segmented = function (name, options, value, label) {
    return '<div class="ds-seg" role="group" aria-label="' + esc(label || name) + '" data-ds-seg="' + esc(name) + '">' +
      options.map(function (o) {
        var on = o.value === value;
        return '<button type="button" value="' + esc(o.value) + '" aria-pressed="' + on + '"' + (on ? ' class="is-on"' : '') + '>' + esc(o.label) + '</button>';
      }).join('') + '</div>';
  };

  function ctl(title, inner, hint) {
    return '<div class="ds-ctl"><div class="ds-ctl-head"><h3>' + esc(title) + '</h3>' + (hint ? '<span>' + hint + '</span>' : '') + '</div>' + inner + '</div>';
  }

  function stepper(name, value, min, max) {
    return '<div class="ds-stepper" data-ds-step="' + esc(name) + '"><button type="button" data-d="-1" aria-label="Fewer"' + (value <= min ? ' disabled' : '') + '>−</button>' +
      '<output>' + value + '</output><button type="button" data-d="1" aria-label="More"' + (value >= max ? ' disabled' : '') + '>+</button></div>';
  }

  /* ----------------------------------------------------------------- build */

  panel.init = function () {
    prefs = DS.store.get('ui', {open: false, tab: 'concept', dock: window.innerWidth >= 1380, dim: false});
    launcher = DS.h('<button type="button" class="ds-ui ds-launcher" aria-controls="ds-panel" aria-expanded="false" title="Explore designs (D)">' +
      I.spark + '<span class="ds-launch-text">Explore designs</span><span class="ds-launch-sub"></span></button>');
    el = DS.h('<aside class="ds-ui ds-panel" id="ds-panel" aria-label="Design Studio" aria-hidden="true">' +
      '<header class="ds-p-head"><div class="ds-p-top"><span class="ds-p-brand">Design Studio</span><div class="ds-p-tools">' +
      '<button type="button" class="ds-icon-btn" data-tool="undo" title="Undo (Z)" aria-label="Undo">' + I.undo + '</button>' +
      '<button type="button" class="ds-icon-btn" data-tool="compare" title="Compare concepts side by side (C)" aria-label="Compare concepts">' + I.compare + '</button>' +
      '<button type="button" class="ds-icon-btn" data-tool="present" title="Present full screen (P)" aria-label="Present">' + I.present + '</button>' +
      '<button type="button" class="ds-icon-btn" data-tool="dock" title="Dock beside the page, or float over it" aria-label="Dock panel">' + I.dock + '</button>' +
      '<button type="button" class="ds-icon-btn" data-tool="close" title="Close (Esc)" aria-label="Close panel">' + I.close + '</button>' +
      '</div></div><div class="ds-p-concept" aria-live="polite"><b></b><span></span></div>' +
      '<div class="ds-p-tabs" role="tablist">' + TABS.map(function (t) {
        return '<button type="button" role="tab" data-tab="' + t.id + '" aria-selected="false">' + t.label + '</button>';
      }).join('') + '</div></header>' +
      '<div class="ds-p-body" role="tabpanel"></div>' +
      '<footer class="ds-p-foot"><button type="button" class="ds-btn-sm" data-tool="reset">Reset to original</button>' +
      '<button type="button" class="ds-btn-sm ds-primary" data-tool="save">Save concept</button></footer></aside>');
    document.body.appendChild(launcher);
    document.body.appendChild(el);
    bodyEl = DS.$('.ds-p-body', el);

    launcher.addEventListener('click', function () { panel.open(); });
    DS.$$('[data-tool]', el).forEach(function (b) { b.addEventListener('click', function () { tool(b.getAttribute('data-tool')); }); });
    DS.$$('[data-tab]', el).forEach(function (b) {
      b.addEventListener('click', function () { prefs.tab = b.getAttribute('data-tab'); savePrefs(); panel.render(true); });
    });
    document.addEventListener('keydown', keys);
    DS.on('change', function () { panel.render(); });
    DS.on('saved', function () { if (prefs.tab === 'saved') panel.render(); });

    applyPrefs();
    panel.render(true);
    if (prefs.open) panel.open(true);
  };

  function savePrefs() { DS.store.set('ui', prefs); }

  function applyPrefs() {
    var h = document.documentElement;
    h.classList.toggle('ds-docked', !!prefs.dock && h.classList.contains('ds-panel-open'));
    h.classList.toggle('ds-dim', !!prefs.dim && !prefs.dock && h.classList.contains('ds-panel-open'));
  }

  panel.open = function (instant) {
    var h = document.documentElement;
    if (instant) el.classList.add('ds-no-anim');
    h.classList.add('ds-panel-open');
    el.setAttribute('aria-hidden', 'false');
    launcher.setAttribute('aria-expanded', 'true');
    prefs.open = true; savePrefs(); applyPrefs();
    if (instant) requestAnimationFrame(function () { el.classList.remove('ds-no-anim'); });
    else setTimeout(function () { var t = DS.$('[data-tab][aria-selected=true]', el); if (t) t.focus({preventScroll: true}); }, 280);
    window.dispatchEvent(new Event('resize'));
  };

  panel.close = function () {
    document.documentElement.classList.remove('ds-panel-open', 'ds-docked', 'ds-dim');
    el.setAttribute('aria-hidden', 'true');
    launcher.setAttribute('aria-expanded', 'false');
    prefs.open = false; savePrefs();
    launcher.focus({preventScroll: true});
    window.dispatchEvent(new Event('resize'));
  };

  panel.toggle = function () { if (document.documentElement.classList.contains('ds-panel-open')) panel.close(); else panel.open(); };
  panel.isOpen = function () { return document.documentElement.classList.contains('ds-panel-open'); };
  panel.show = function (tab) { prefs.tab = tab; savePrefs(); panel.render(true); if (!panel.isOpen()) panel.open(); };

  function tool(t) {
    if (t === 'close') panel.close();
    if (t === 'undo') DS.undo();
    if (t === 'reset') {
      DS.resetOriginal();
      DS.toast('Showing the original website', {label: 'Undo', fn: DS.undo});
    }
    if (t === 'save') { panel.show('saved'); setTimeout(function () { var i = DS.$('#ds-save-name', el); if (i) { i.focus(); i.select(); } }, 60); }
    if (t === 'compare') DS.compare.open();
    if (t === 'present') DS.present.start();
    if (t === 'dock') { prefs.dock = !prefs.dock; savePrefs(); applyPrefs(); window.dispatchEvent(new Event('resize')); panel.render(); }
  }

  function keys(e) {
    var tag = (e.target.tagName || '').toLowerCase();
    if (tag === 'input' || tag === 'textarea' || tag === 'select' || e.target.isContentEditable) return;
    if (DS.present.active() || document.querySelector('.ds-overlay')) return;
    if (e.key === 'Escape' && panel.isOpen()) { panel.close(); return; }
    if (e.metaKey || e.ctrlKey || e.altKey) {
      if ((e.key === 'z' || e.key === 'Z') && panel.isOpen()) { DS.undo(); e.preventDefault(); }
      return;
    }
    if (e.key === 'd' || e.key === 'D') { panel.toggle(); e.preventDefault(); }
    else if (e.key === 'p' || e.key === 'P') { DS.present.start(); e.preventDefault(); }
    else if (e.key === 'c' || e.key === 'C') { DS.compare.open(); e.preventDefault(); }
    else if ((e.key === 'z' || e.key === 'Z') && panel.isOpen()) { DS.undo(); e.preventDefault(); }
  }

  /* ---------------------------------------------------------------- render */

  panel.render = function (resetScroll) {
    if (!el) return;
    var cfg = DS.config(), d = DS.describe(cfg);
    DS.$('.ds-p-concept b', el).textContent = d.title;
    DS.$('.ds-p-concept span', el).textContent = d.detail;
    DS.$('.ds-launch-sub', launcher).textContent = DS.isOriginal(cfg) ? '' : d.title;
    launcher.classList.toggle('has-sub', !DS.isOriginal(cfg));
    DS.$('[data-tool=undo]', el).disabled = !DS.canUndo();
    DS.$('[data-tool=dock]', el).classList.toggle('is-on', !!prefs.dock);
    DS.$('[data-tool=reset]', el).disabled = DS.isOriginal(cfg);
    DS.$$('[data-tab]', el).forEach(function (b) {
      var on = b.getAttribute('data-tab') === prefs.tab;
      b.setAttribute('aria-selected', String(on));
      b.tabIndex = on ? 0 : -1;
    });
    var scroll = resetScroll ? 0 : bodyEl.scrollTop;
    var fn = tabs[prefs.tab] || tabs.concept;
    var html = fn(cfg);
    if (typeof html === 'string') { bodyEl.innerHTML = html; wireBody(cfg); }
    bodyEl.scrollTop = scroll;
  };

  var tabs = {};

  tabs.concept = function (cfg) {
    var orig = DS.isOriginal(cfg);
    var presets = DS.presets.map(function (p) {
      var on = p.original ? orig : (!orig && cfg.preset === p.id);
      var pal = DS.options.palette.filter(function (x) { return x.value === p.look.palette; })[0];
      var font = {current: 'Montserrat, sans-serif', modern: 'Inter, sans-serif', editorial: 'Newsreader, Georgia, serif', academic: '"Source Serif 4", Georgia, serif'}[p.look.font];
      var sw = '<span class="ds-preset-sw" style="background:' + (p.look.dark ? '#1e2030' : pal.swatch[1]) + ';color:' + pal.swatch[0] + ';font-family:' + font + '">Aa<i style="background:' + pal.swatch[0] + '"></i></span>';
      return '<button type="button" class="ds-preset' + (on ? ' is-on' : '') + '" data-preset="' + p.id + '" aria-pressed="' + on + '">' + sw +
        '<span class="ds-preset-text"><b>' + esc(p.label) + '</b><span>' + esc(p.blurb) + '</span></span></button>';
    }).join('');
    var concepts = DS.options.contentPriority.map(function (c) {
      var on = !orig && cfg.contentPriority === c.value;
      return '<button type="button" class="ds-card-opt' + (on ? ' is-on' : '') + '" data-concept="' + c.value + '" aria-pressed="' + on + '">' +
        '<span class="ds-wire">' + wire(c.value) + '</span><b>' + esc(c.label) + '</b><span>' + esc(c.blurb) + '</span></button>';
    }).join('');
    return '<p class="ds-intro-hint">Start with a complete direction, or choose what a visitor sees first. Everything can be refined in the other tabs.</p>' +
      ctl('Presets', '<div class="ds-presets">' + presets + '</div>') +
      ctl('What visitors see first', '<div class="ds-card-grid">' + concepts + '</div>', 'Homepage concept');
  };

  var TYPES = [
    {id: 'research', label: 'Research areas', section: ['research', 'overview']},
    {id: 'news', label: 'News', section: ['news', 'overview']},
    {id: 'publications', label: 'Publications', section: ['publications']},
    {id: 'people', label: 'People', section: ['people']}
  ];

  tabs.layout = function (cfg) {
    var c = DS.isOriginal(cfg) ? DS.BASE : cfg;
    var concept = DS.concepts[c.contentPriority];
    var out = '<p class="ds-intro-hint">How each kind of content is presented, in the real page. ' +
      (DS.isOriginal(cfg) ? 'Changing anything here starts from the current site.' : '') + '</p>';
    TYPES.forEach(function (t) {
      var l = c.contentLayouts[t.id];
      var onPage = t.section.some(function (s) { return concept.sections.indexOf(s) >= 0; });
      var max = t.id === 'research' ? DS.content.research.length : t.id === 'news' ? DS.content.news.filter(function (p) { return p.featured; }).length : DS.content.publications.length;
      var grid = '<div class="ds-layouts" data-type="' + t.id + '">' + DS.options.layouts[t.id].map(function (v) {
        var on = l.layout === v;
        return '<button type="button" data-layout="' + v + '" aria-pressed="' + on + '" class="' + (on ? 'is-on' : '') + '" title="' + esc(DS.options.layoutHints[v]) + '">' +
          schema(v) + '<span>' + esc(DS.label('layout', v)) + '</span></button>';
      }).join('') + '</div>';
      var extras = '';
      if ('count' in l) extras += '<label class="ds-mini">Items ' + stepper(t.id, Math.min(l.count, max), 1, max) + '</label>';
      if ('imageSize' in l) extras += '<label class="ds-mini">Images ' + panel.segmented('img-' + t.id, DS.options.imageSize, l.imageSize, 'Image size') + '</label>';
      if (t.id === 'news' && DS.content.bluesky && DS.content.bluesky.posts) {
        extras += '<label class="ds-mini ds-check"><input type="checkbox" data-ds-feed' + (l.feed ? ' checked' : '') + '> Bluesky feed beside the news</label>';
      }
      var note = !onPage ? '<p class="ds-note-sm">Not on this concept\'s homepage' +
        (/subpages|hybrid/.test(c.navigationStructure) ? '; shown on its own page.' : '.') + '</p>' : '';
      if (t.id === 'people' && c.navigationStructure === 'expandable' && l.layout === 'full') note += '<p class="ds-note-sm">Expandable structure: the gallery folds into groups.</p>';
      out += ctl(t.label, note + grid + (extras ? '<div class="ds-extras">' + extras + '</div>' : ''), '<span class="ds-hint-inline">' + esc(DS.options.layoutHints[l.layout]) + '</span>');
    });
    out += ctl('Page rhythm',
      '<label class="ds-mini ds-stack">Section spacing ' + panel.segmented('spacing', DS.options.spacing, c.visualTheme.spacing, 'Spacing') + '</label>' +
      '<label class="ds-mini ds-stack">Text density ' + panel.segmented('density', DS.options.density, c.visualTheme.density, 'Density') + '</label>');
    return out;
  };

  tabs.structure = function (cfg) {
    var c = DS.isOriginal(cfg) ? DS.BASE : cfg;
    var cards = DS.options.navigationStructure.map(function (o) {
      var on = !DS.isOriginal(cfg) && c.navigationStructure === o.value;
      return '<button type="button" class="ds-card-opt is-wide' + (on ? ' is-on' : '') + '" data-structure="' + o.value + '" aria-pressed="' + on + '">' +
        '<span class="ds-wire">' + map(o.value) + '</span><span class="ds-card-text"><b>' + esc(o.label) + '</b><span>' + esc(o.blurb) + '</span></span></button>';
    }).join('');
    var pages = '';
    if (!DS.isOriginal(cfg) && /subpages|hybrid/.test(c.navigationStructure)) {
      var route = DS.router.route();
      var list = [['', 'Home'], ['research', 'Research'], ['publications', 'Publications'], ['news', 'News'], ['people', 'People'], ['teaching', 'Teaching'], ['vacancies', 'Vacancies'], ['contact', 'Contact']];
      if (c.navigationStructure === 'hybrid') {
        list.splice.apply(list, [2, 0].concat(DS.content.research.map(function (a) {
          return ['research/' + a.slug, '↳ ' + DS.ui.shortTitle(a.title)];
        })));
      }
      pages = ctl('Pages', '<div class="ds-chips">' + list.map(function (p) {
        return '<button type="button" class="ds-chip' + (route === p[0] ? ' is-on' : '') + '" data-goto="' + esc(p[0]) + '">' + esc(p[1]) + '</button>';
      }).join('') + '</div>', 'Jump to a page');
    }
    return '<p class="ds-intro-hint">How the content is layered. Every structure keeps the essentials one click from the homepage.</p>' +
      ctl('Information architecture', '<div class="ds-card-list">' + cards + '</div>') + pages +
      ctl('Navigation bar', panel.segmented('nav', DS.options.nav, c.visualTheme.nav, 'Navigation') +
        '<p class="ds-note-sm">Sticky stays in view; Standard scrolls away; Compact is slimmer and hides while reading down.</p>');
  };

  tabs.images = function () {
    DS.imagesPanel.render(bodyEl);
    return null;
  };

  tabs.style = function (cfg) {
    var c = DS.isOriginal(cfg) ? DS.BASE : cfg, v = c.visualTheme;
    var fonts = {current: 'Montserrat, sans-serif', modern: 'Inter, sans-serif', editorial: 'Newsreader, Georgia, serif', academic: '"Source Serif 4", Georgia, serif'};
    var type = '<div class="ds-type-grid">' + DS.options.typography.map(function (o) {
      var on = v.typography === o.value && !DS.isOriginal(cfg);
      return '<button type="button" class="ds-type' + (on ? ' is-on' : '') + '" data-type-opt="' + o.value + '" aria-pressed="' + on + '">' +
        '<span class="ds-type-aa" style="font-family:' + fonts[o.value] + '">Aa</span><b>' + esc(o.label) + '</b><span>' + esc(o.sample) + '</span></button>';
    }).join('') + '</div>';
    var pal = '<div class="ds-pal-list">' + DS.options.palette.map(function (o) {
      var on = v.palette === o.value && !DS.isOriginal(cfg);
      return '<button type="button" class="ds-pal' + (on ? ' is-on' : '') + '" data-palette="' + o.value + '" aria-pressed="' + on + '">' +
        '<span class="ds-sw">' + o.swatch.map(function (s) { return '<i style="background:' + s + '"></i>'; }).join('') + '</span>' + esc(o.label) + '</button>';
    }).join('') + '</div>';
    return '<p class="ds-intro-hint">The look, on top of whatever concept is showing. Current values reproduce today\'s site.</p>' +
      ctl('Typography', type) +
      ctl('Colour palette', pal, 'Current branding is the default') +
      ctl('Hero', panel.segmented('heroLayout', DS.options.heroLayout, c.heroLayout, 'Hero layout')) +
      ctl('Image treatment', panel.segmented('imageTreatment', DS.options.imageTreatment, v.imageTreatment, 'Image treatment') +
        '<p class="ds-note-sm">Contained shows scientific figures whole instead of cropping them.</p>') +
      ctl('Appearance', panel.segmented('appearance', DS.options.appearance, v.appearance, 'Appearance'));
  };

  tabs.saved = function (cfg) {
    var list = DS.saved.list();
    var d = DS.describe(cfg);
    var out = ctl('Save this concept',
      '<form class="ds-save" data-ds-save><input id="ds-save-name" type="text" maxlength="60" value="' + esc(DS.isOriginal(cfg) ? 'Original website' : d.title.replace(/ \(edited\)$/, '') + (cfg.preset && !cfg.name ? '' : '')) + '" aria-label="Name">' +
      '<button type="submit" class="ds-btn-sm ds-primary">Save</button></form>' +
      '<p class="ds-note-sm">Saved in this browser only. Nothing leaves this machine.</p>');
    out += ctl('Saved concepts', list.length ? '<ul class="ds-saved">' + list.map(function (s) {
      var c = DS.normalize(s.config), sd = DS.describe(c);
      var on = DS.signature(c) === DS.signature(cfg);
      return '<li class="ds-saved-item' + (on ? ' is-on' : '') + '"><label class="ds-saved-cmp" title="Include in comparison"><input type="checkbox" data-cmp-saved="' + esc(s.id) + '"></label>' +
        '<div class="ds-saved-text"><b data-rename="' + esc(s.id) + '" title="Double-click to rename">' + esc(s.name) + '</b><span>' + esc(sd.detail) + '</span></div>' +
        '<div class="ds-saved-acts"><button type="button" class="ds-btn-xs" data-load="' + esc(s.id) + '">' + (on ? 'Showing' : 'Show') + '</button>' +
        '<button type="button" class="ds-btn-xs" data-present-saved="' + esc(s.id) + '" title="Present">▶</button>' +
        '<button type="button" class="ds-btn-xs" data-delete="' + esc(s.id) + '" title="Delete" aria-label="Delete">×</button></div></li>';
    }).join('') + '</ul>' +
      '<div class="ds-row-actions"><button type="button" class="ds-chip" data-cmp-go>Compare checked</button><button type="button" class="ds-chip" data-present-all>Present all saved</button></div>' :
      '<p class="ds-empty-sm">Nothing saved yet. Save the concepts worth discussing; the presentation bar cycles through them.</p>');
    out += ctl('Compare', '<div class="ds-row-actions">' +
      '<button type="button" class="ds-chip" data-cmp-preset="now">This concept vs. original</button>' +
      '<button type="button" class="ds-chip" data-cmp-preset="trio">Research · News · Minimal</button>' +
      '<button type="button" class="ds-chip" data-cmp-preset="presets">Three presets</button></div>');
    out += ctl('Share and keep',
      '<div class="ds-share"><input type="text" readonly value="' + esc(DS.shareUrl(cfg)) + '" aria-label="Link to this concept">' +
      '<button type="button" class="ds-btn-sm" data-copy>Copy link</button></div>' +
      '<p class="ds-note-sm">The link restores this exact concept on any machine running the studio.</p>' +
      '<div class="ds-row-actions"><button type="button" class="ds-chip" data-export>Export JSON</button>' +
      '<label class="ds-chip ds-file">Import JSON<input type="file" accept="application/json,.json" data-import hidden></label></div>');
    out += ctl('Panel', '<label class="ds-mini ds-check"><input type="checkbox" data-pref="dock"' + (prefs.dock ? ' checked' : '') + '> Dock beside the page (the page narrows instead of being covered)</label>' +
      '<label class="ds-mini ds-check"><input type="checkbox" data-pref="dim"' + (prefs.dim ? ' checked' : '') + '> Dim the page while the floating panel is open</label>' +
      '<p class="ds-note-sm">Keys: D panel · P present · C compare · Z undo · Esc close</p>');
    return out;
  };

  /* ---------------------------------------------------------------- wiring */

  function wireBody(cfg) {
    var b = bodyEl;
    on('[data-preset]', function (x) { DS.applyPreset(x.getAttribute('data-preset')); });
    on('[data-concept]', function (x) { DS.applyConcept(x.getAttribute('data-concept')); });
    on('[data-structure]', function (x) {
      var v = x.getAttribute('data-structure');
      DS.update(function (c) { c.navigationStructure = v; }, {scrollTop: true});
    });
    on('[data-goto]', function (x) { DS.router.go(x.getAttribute('data-goto')); panel.render(); });
    on('[data-layout]', function (x) {
      var type = x.parentElement.getAttribute('data-type'), v = x.getAttribute('data-layout');
      DS.update(function (c) { c.contentLayouts[type].layout = v; }, {focus: type});
    });
    DS.$$('[data-ds-step]', b).forEach(function (s) {
      var type = s.getAttribute('data-ds-step');
      DS.$$('button', s).forEach(function (x) {
        x.addEventListener('click', function () {
          var d = +x.getAttribute('data-d');
          DS.update(function (c) { c.contentLayouts[type].count = Math.max(1, (+s.querySelector('output').textContent) + d); }, {focus: type});
        });
      });
    });
    DS.$$('[data-ds-seg]', b).forEach(function (seg) {
      var name = seg.getAttribute('data-ds-seg');
      if (name.indexOf('ds-img') === 0) return;
      DS.$$('button', seg).forEach(function (x) {
        x.addEventListener('click', function () {
          var v = x.value;
          DS.update(function (c) {
            if (name.indexOf('img-') === 0) c.contentLayouts[name.slice(4)].imageSize = v;
            else if (name === 'heroLayout') c.heroLayout = v;
            else c.visualTheme[name] = v;
          }, {focus: name.indexOf('img-') === 0 ? name.slice(4) : name === 'heroLayout' ? 'hero' : null});
        });
      });
    });
    var feed = DS.$('[data-ds-feed]', b);
    if (feed) feed.addEventListener('change', function () { DS.update(function (c) { c.contentLayouts.news.feed = feed.checked; }, {focus: 'news'}); });
    on('[data-type-opt]', function (x) { var v = x.getAttribute('data-type-opt'); DS.update(function (c) { c.visualTheme.typography = v; }); });
    on('[data-palette]', function (x) { var v = x.getAttribute('data-palette'); DS.update(function (c) { c.visualTheme.palette = v; }); });

    /* Saved */
    var form = DS.$('[data-ds-save]', b);
    if (form) form.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = DS.$('#ds-save-name', b).value.trim() || DS.describe(DS.config()).title;
      var cur = DS.config();
      DS.saved.add(name, cur);
      DS.set(DS.named(DS.clone(cur), name), {noHistory: true, force: true});
      DS.toast('Saved “' + name + '”');
    });
    on('[data-load]', function (x) { var s = find(x.getAttribute('data-load')); if (s) DS.set(DS.named(DS.normalize(s.config), s.name), {scrollTop: true, force: true}); });
    on('[data-delete]', function (x) {
      var id = x.getAttribute('data-delete'), s = find(id);
      if (!s) return;
      DS.saved.remove(id);
      DS.toast('Deleted “' + s.name + '”', {label: 'Undo', fn: function () { var l = DS.saved.list(); l.push(s); DS.saved.put(l); }});
    });
    on('[data-present-saved]', function (x) { DS.present.start('saved:' + x.getAttribute('data-present-saved')); });
    on('[data-present-all]', function () { DS.present.start(null, 'saved'); });
    on('[data-cmp-go]', function () {
      var keys = DS.$$('[data-cmp-saved]:checked', b).map(function (i) { return 'saved:' + i.getAttribute('data-cmp-saved'); });
      DS.compare.open(keys.length ? keys : null);
    });
    on('[data-cmp-preset]', function (x) {
      var k = x.getAttribute('data-cmp-preset');
      DS.compare.open(k === 'now' ? ['current', 'preset:original'] : k === 'trio' ? ['concept:research', 'concept:news', 'concept:minimal'] :
        ['preset:institute', 'preset:modern', 'preset:editorial']);
    });
    DS.$$('[data-rename]', b).forEach(function (t) {
      t.addEventListener('dblclick', function () {
        var id = t.getAttribute('data-rename');
        var input = DS.h('<input type="text" class="ds-rename" maxlength="60">');
        input.value = t.textContent;
        t.replaceWith(input);
        input.focus(); input.select();
        var done = function () { if (input.value.trim()) DS.saved.rename(id, input.value.trim()); panel.render(); };
        input.addEventListener('blur', done);
        input.addEventListener('keydown', function (e) { if (e.key === 'Enter') input.blur(); if (e.key === 'Escape') { input.value = ''; input.blur(); } });
      });
    });
    var copy = DS.$('[data-copy]', b);
    if (copy) copy.addEventListener('click', function () {
      var input = copy.previousElementSibling;
      var ok = function () { DS.toast('Link copied'); };
      if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(input.value).then(ok, function () { input.select(); document.execCommand('copy'); ok(); });
      else { input.select(); document.execCommand('copy'); ok(); }
    });
    var exp = DS.$('[data-export]', b);
    if (exp) exp.addEventListener('click', function () {
      var data = {studio: 'aimlab-design-studio', exported: new Date().toISOString(), current: DS.config(), saved: DS.saved.list()};
      var a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], {type: 'application/json'}));
      a.download = 'design-concepts-' + new Date().toISOString().slice(0, 10) + '.json';
      document.body.appendChild(a); a.click(); a.remove();
    });
    var imp = DS.$('[data-import]', b);
    if (imp) imp.addEventListener('change', function () {
      var f = imp.files[0];
      if (!f) return;
      f.text().then(function (txt) {
        var data = JSON.parse(txt), list = DS.saved.list(), n = 0;
        (data.saved || []).forEach(function (s) {
          if (s && s.config && !list.some(function (x) { return x.id === s.id; })) { list.push(s); n++; }
        });
        DS.saved.put(list);
        if (data.current) DS.set(DS.normalize(data.current), {scrollTop: true});
        DS.toast('Imported ' + n + ' concept' + (n === 1 ? '' : 's'));
      }).catch(function () { DS.toast('That file is not a studio export'); });
    });
    DS.$$('[data-pref]', b).forEach(function (c) {
      c.addEventListener('change', function () { prefs[c.getAttribute('data-pref')] = c.checked; savePrefs(); applyPrefs(); window.dispatchEvent(new Event('resize')); panel.render(); });
    });

    function on(sel, fn) { DS.$$(sel, b).forEach(function (x) { x.addEventListener('click', function () { fn(x); }); }); }
    function find(id) { return DS.saved.list().filter(function (s) { return s.id === id; })[0]; }
  }

  /* ----------------------------------------------------------------- toast */

  var toastEl, toastTimer;
  DS.toast = function (msg, action) {
    if (!toastEl) { toastEl = DS.h('<div class="ds-ui ds-toast" role="status" aria-live="polite"></div>'); document.body.appendChild(toastEl); }
    toastEl.innerHTML = '<span>' + esc(msg) + '</span>' + (action ? '<button type="button">' + esc(action.label) + '</button>' : '');
    if (action) DS.$('button', toastEl).addEventListener('click', function () { action.fn(); toastEl.classList.remove('is-on'); });
    toastEl.classList.add('is-on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove('is-on'); }, action ? 5000 : 2200);
  };
})();

;
/* Design Studio - stock images.
 *
 * The candidates come from data/design_studio/stock_images.json, which
 * scripts/studio/istock.py writes from the iStock listings themselves: title,
 * contributor, iStock's own watermarked preview URLs, and the price shown on
 * the listing with the date it was read. Nothing here invents a price; an
 * image without one says so.
 *
 * Every stock picture placed on the page carries a visible "iStock preview"
 * label that opens its listing. */
(function () {
  'use strict';

  var DS = window.DS, esc = DS.esc;

  /* ---------------------------------------------------------------- data */

  var data = {categories: [], images: [], cached: [], source: {}};

  DS.stock = {
    load: function (json) {
      data = json || data;
      data.categories = data.categories || [];
      data.images = data.images || [];
      data.cached = data.cached || [];
    },
    all: function () { return data.images; },
    categories: function () { return data.categories; },
    source: function () { return data.source || {}; },
    get: function (id) { return data.images.filter(function (i) { return i.id === id; })[0] || null; },
    category: function (id) { return data.categories.filter(function (c) { return c.id === id; })[0] || null; },
    byCategory: function (cat) { return data.images.filter(function (i) { return i.category === cat; }); },
    byUse: function (use) {
      var cats = data.categories.filter(function (c) { return c.use === use; }).map(function (c) { return c.id; });
      return data.images.filter(function (i) { return cats.indexOf(i.category) >= 0; });
    },
    forArea: function (slug) {
      var cat = data.categories.filter(function (c) { return c.area === slug; })[0];
      return cat ? DS.stock.byCategory(cat.id) : [];
    },
    /* A preview cached for an offline review is served locally. */
    src: function (img, size) {
      if (data.cached.indexOf(img.id) >= 0) return DS.url('studio/stock-cache/') + img.id + '-' + (size === 'small' ? 'small' : 'large') + '.jpg';
      var p = img.preview || {};
      return p[size] || p.large || p.medium || p.small;
    },
    badge: function (img) {
      return '<span class="ds-stock-badge" role="link" tabindex="0" data-href="' + esc(img.url) + '" title="' +
        esc('iStock preview, watermarked. ' + (img.title || '') + ' (' + img.artist + '). Opens the listing.') + '">iStock preview · ' + esc(img.id) + '</span>';
    },
    price: function (img) {
      if (!img.price) return 'Price not shown on listing';
      return img.price.display + (img.price.credits ? ' · ' + img.price.credits + ' Credit' + (img.price.credits > 1 ? 's' : '') : '');
    },
    /* Stock images the configuration currently shows, once each. */
    inUse: function (cfg) {
      if (DS.isOriginal(cfg)) return [];
      var s = cfg.imageSelections, ids = [s.hero, s.background];
      Object.keys(s.research || {}).forEach(function (k) { ids.push(s.research[k]); });
      Object.keys(s.sections || {}).forEach(function (k) { ids.push(s.sections[k]); });
      var seen = {};
      return ids.map(DS.stock.get).filter(function (i) { return i && !seen[i.id] && (seen[i.id] = 1); });
    }
  };

  /* The badge opens the listing without being a link inside a link. */
  function openBadge(e) {
    var b = e.target.closest && e.target.closest('.ds-stock-badge');
    if (!b) return;
    if (e.type === 'keydown' && e.key !== 'Enter') return;
    e.preventDefault();
    e.stopPropagation();
    window.open(b.getAttribute('data-href'), '_blank', 'noopener');
  }
  document.addEventListener('click', openBadge, true);
  document.addEventListener('keydown', openBadge, true);

  /* ------------------------------------------------------------ the panel */

  var state = {use: 'hero', pageTarget: 'research', compare: []};
  var USES = [
    {value: 'hero', label: 'Hero'}, {value: 'research', label: 'Research'},
    {value: 'section', label: 'Page headers'}, {value: 'background', label: 'Background'}
  ];
  var PAGE_TARGETS = [
    {value: 'research', label: 'Research'}, {value: 'publications', label: 'Publications'}, {value: 'news', label: 'News'},
    {value: 'people', label: 'People'}, {value: 'teaching', label: 'Teaching'}
  ];

  DS.imagesPanel = {render: render};

  function render(root) {
    var cfg = DS.config();
    var sel = DS.isOriginal(cfg) ? DS.BASE.imageSelections : cfg.imageSelections;
    var used = DS.stock.inUse(cfg);
    var total = used.reduce(function (n, i) { return n + (i.price && i.price.currency === 'EUR' ? i.price.amount : 0); }, 0);
    var html = '';

    html += '<div class="ds-cost">' + (used.length ?
      '<b>' + used.length + ' stock image' + (used.length > 1 ? 's' : '') + ' in this concept</b><span>' +
        fmt(total) + ' at single-image prices, Standard licence</span>' :
      '<b>No stock images in use</b><span>The concept shows the site\'s own pictures.</span>') + '</div>';

    if (!data.images.length) {
      html += '<div class="ds-note">No stock candidates yet. Add them with <code>scripts/studio/istock.py add</code>; see STUDIO.md.</div>';
      root.innerHTML = html;
      return;
    }

    html += DS.panel.segmented('ds-img-use', USES, state.use, 'Use');

    if (state.use === 'hero') {
      if (!DS.isOriginal(cfg) && /text|minimal/.test(cfg.heroLayout)) {
        html += '<div class="ds-note">The ' + esc(DS.label('heroLayout', cfg.heroLayout)) + ' hero shows no image. ' +
          '<button type="button" class="ds-link-btn" data-ds-act="hero-image">Switch to Image-led</button></div>';
      }
      html += group('hero', sel.hero, originalHero(), DS.stock.byUse('hero'), 'Homepage hero');
    } else if (state.use === 'research') {
      html += '<div class="ds-row-actions"><button type="button" class="ds-chip" data-ds-act="research-figures">All paper figures</button>' +
        '<button type="button" class="ds-chip" data-ds-act="research-stock">First stock image each</button></div>';
      DS.content.research.forEach(function (a) {
        var fig = a.figure && a.figure.src ? {src: a.figure.src, label: 'Paper figure', meta: 'From the group\'s work'} :
          {src: '', label: 'No figure yet', meta: 'The site has none for this area'};
        html += '<h4 class="ds-ctl-sub">' + esc(a.title) + '</h4>' +
          group('research:' + a.slug, (sel.research || {})[a.slug] || 'original', fig, DS.stock.forArea(a.slug), a.title);
      });
    } else if (state.use === 'section') {
      if (!DS.isOriginal(cfg) && !/subpages|hybrid/.test(cfg.navigationStructure)) {
        html += '<div class="ds-note">Page headers appear when the site has subpages. ' +
          '<button type="button" class="ds-link-btn" data-ds-act="to-subpages">Switch to Homepage + subpages</button></div>';
      }
      html += DS.panel.segmented('ds-img-page', PAGE_TARGETS, state.pageTarget, 'Page');
      html += group('section:' + state.pageTarget, (sel.sections || {})[state.pageTarget] || 'none',
        {src: '', label: 'No image', meta: 'A plain header'}, DS.stock.byUse('section').concat(DS.stock.byUse('hero')), 'Page header');
    } else {
      html += '<div class="ds-hint">A background image adds a full-width band under the hero, carrying the opening line of the Research section.</div>';
      html += group('background', sel.background || 'none', {src: '', label: 'No band', meta: 'Sections follow the hero directly'},
        DS.stock.byUse('background'), 'Background band');
    }

    var src = DS.stock.source();
    html += '<p class="ds-fine">Previews are iStock\'s own watermarked comps, hot-linked from the listing, for layout review only. ' +
      'Prices are the single-image checkout shown on each listing to a visitor in Germany, read on the date given. ' +
      (src.pricing_url ? '<a href="' + esc(src.pricing_url) + '" target="_blank" rel="noopener">iStock pricing</a> · ' : '') +
      (src.licence_url ? '<a href="' + esc(src.licence_url) + '" target="_blank" rel="noopener">Licence</a>' : '') + '</p>';

    if (state.compare.length) {
      html += '<div class="ds-tray"><span>' + state.compare.length + ' selected</span>' +
        '<button type="button" class="ds-btn-sm ds-primary" data-ds-act="compare-images"' + (state.compare.length < 2 ? ' disabled' : '') + '>Compare side by side</button>' +
        '<button type="button" class="ds-btn-sm" data-ds-act="clear-compare">Clear</button></div>';
    }
    root.innerHTML = html;
    wire(root);
  }

  function originalHero() {
    var im = DS.content.hero.image;
    return im ? {src: im.src, label: 'Lab retreat (current)', meta: 'The site\'s own photograph'} : {src: '', label: 'Current', meta: ''};
  }

  /* One choosable set: the site's own picture first, then the candidates. */
  function group(slot, current, original, candidates, context) {
    var origVal = /^(section|background)/.test(slot) ? 'none' : 'original';
    var out = '<div class="ds-opts" data-slot="' + esc(slot) + '" data-context="' + esc(context) + '">';
    out += option(slot, origVal, current === origVal, original.src, original.label, original.meta, null, null);
    candidates.forEach(function (img) {
      out += option(slot, img.id, current === img.id, DS.stock.src(img, 'small'), img.label,
        'iStock ' + img.id + ' · ' + img.collection, DS.stock.price(img), img);
    });
    return out + '</div>';
  }

  function option(slot, value, on, src, label, meta, price, img) {
    var key = slot + '|' + value;
    var checked = state.compare.indexOf(key) >= 0;
    return '<div class="ds-opt' + (on ? ' is-on' : '') + '">' +
      '<button type="button" class="ds-opt-main" data-ds-pick="' + esc(value) + '" aria-pressed="' + on + '" title="' + esc(img ? img.title : label) + '">' +
      '<span class="ds-opt-thumb">' + (src ? '<img src="' + esc(src) + '" alt="" loading="lazy">' : '<span class="ds-opt-none"></span>') +
      (on ? '<span class="ds-opt-check" aria-hidden="true">✓</span>' : '') + '</span>' +
      '<span class="ds-opt-label">' + esc(label) + '</span>' +
      '<span class="ds-opt-meta">' + esc(meta || '') + '</span>' +
      (price ? '<span class="ds-opt-price">' + esc(price) + '</span>' : '') + '</button>' +
      '<div class="ds-opt-foot">' + (img ? '<a href="' + esc(img.url) + '" target="_blank" rel="noopener" title="Open the listing on iStock">iStock ↗</a>' : '<span></span>') +
      '<label class="ds-opt-cmp"><input type="checkbox" data-ds-cmp="' + esc(key) + '"' + (checked ? ' checked' : '') + '> Compare</label></div></div>';
  }

  function wire(root) {
    DS.$$('[data-ds-seg="ds-img-use"] button', root).forEach(function (b) {
      b.addEventListener('click', function () { state.use = b.value; render(root); });
    });
    DS.$$('[data-ds-seg="ds-img-page"] button', root).forEach(function (b) {
      b.addEventListener('click', function () { state.pageTarget = b.value; render(root); });
    });
    DS.$$('.ds-opts', root).forEach(function (g) {
      var slot = g.getAttribute('data-slot');
      DS.$$('[data-ds-pick]', g).forEach(function (b) {
        b.addEventListener('click', function () { pick(slot, b.getAttribute('data-ds-pick')); });
      });
    });
    DS.$$('[data-ds-cmp]', root).forEach(function (c) {
      c.addEventListener('change', function () {
        var k = c.getAttribute('data-ds-cmp');
        state.compare = state.compare.filter(function (x) { return x !== k; });
        if (c.checked) state.compare.push(k);
        state.compare = state.compare.slice(-4);
        render(root);
      });
    });
    DS.$$('[data-ds-act]', root).forEach(function (b) {
      b.addEventListener('click', function () { act(b.getAttribute('data-ds-act'), root); });
    });
  }

  function focusFor(slot) {
    if (slot === 'hero' || slot === 'background') return 'hero';
    if (slot.indexOf('research') === 0) return 'research';
    return null;
  }

  function pick(slot, value) {
    var parts = slot.split(':');
    DS.update(function (c) {
      var s = c.imageSelections;
      if (parts[0] === 'hero') {
        s.hero = value;
        if (value !== 'original' && /text|minimal/.test(c.heroLayout)) c.heroLayout = 'image';
      } else if (parts[0] === 'research') {
        if (value === 'original') delete s.research[parts[1]]; else s.research[parts[1]] = value;
      } else if (parts[0] === 'section') {
        if (value === 'none') delete s.sections[parts[1]]; else s.sections[parts[1]] = value;
      } else if (parts[0] === 'background') {
        s.background = value;
      }
    }, {focus: focusFor(slot), keepRoute: true});
    if (parts[0] === 'section' && /subpages|hybrid/.test(DS.config().navigationStructure) && DS.router.route() !== parts[1]) {
      DS.router.go(parts[1]);
    }
  }

  function act(a, root) {
    if (a === 'hero-image') DS.update(function (c) { c.heroLayout = 'image'; }, {focus: 'hero'});
    if (a === 'to-subpages') DS.update(function (c) { c.navigationStructure = 'subpages'; });
    if (a === 'research-figures') DS.update(function (c) { c.imageSelections.research = {}; }, {focus: 'research'});
    if (a === 'research-stock') DS.update(function (c) {
      DS.content.research.forEach(function (ar) {
        var first = DS.stock.forArea(ar.slug)[0];
        if (first) c.imageSelections.research[ar.slug] = first.id;
      });
    }, {focus: 'research'});
    if (a === 'clear-compare') { state.compare = []; render(root); }
    if (a === 'compare-images') compareOverlay();
  }

  function fmt(n) {
    return n.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.') + ' €';
  }

  /* ------------------------------------------------- side-by-side compare */

  /* Each candidate shown the way it would be used - behind the real
     headline, on a real research card - with its listing details beneath. */
  function compareOverlay() {
    var cfg = DS.config();
    var hero = DS.content.hero;
    var cols = state.compare.map(function (key) {
      var p = key.split('|'), slot = p[0], value = p[1];
      var img = DS.stock.get(value);
      var src, label;
      if (img) { src = DS.stock.src(img, 'large'); label = img.label; } else {
        var area = slot.indexOf('research:') === 0 ? DS.content.research.filter(function (a) { return 'research:' + a.slug === slot; })[0] : null;
        src = slot === 'hero' ? (hero.image && hero.image.src) : (area && area.figure ? area.figure.src : '');
        label = slot === 'hero' ? 'Lab retreat (current)' : area ? 'Paper figure (current)' : 'None';
      }
      return {slot: slot, value: value, img: img, src: src, label: label};
    });
    var ctx = function (c) {
      var kind = c.slot.split(':')[0];
      var bg = c.src ? '<img src="' + esc(c.src) + '" alt="" style="object-position:' + esc((c.img && c.img.focus) || 'center') + '">' : '';
      if (kind === 'research') {
        var a = DS.content.research.filter(function (x) { return 'research:' + x.slug === c.slot; })[0];
        return '<div class="ds-cmp-card"><div class="ds-cmp-card-media">' + bg + '</div><div class="ds-cmp-card-body"><b>' +
          esc(a ? a.title : '') + '</b><span>' + esc(a ? ui().firstSentences(a.summary, 1) : '') + '</span></div></div>';
      }
      var live = DS.$('.ds-hero h1');
      var title = kind === 'hero' ? (live ? live.textContent : hero.title) : kind === 'section' ? 'Research' : '';
      var line = kind === 'hero' ? hero.tagline : kind === 'background' ? DS.content.intro.firstSentence : '';
      return '<div class="ds-cmp-hero">' + bg + '<div class="ds-cmp-hero-copy"><b>' + esc(title) + '</b><span>' + esc(line) + '</span></div></div>';
    };
    var current = function (c) {
      var s = DS.isOriginal(cfg) ? DS.BASE.imageSelections : cfg.imageSelections, k = c.slot.split(':');
      var v = k[0] === 'hero' ? s.hero : k[0] === 'research' ? (s.research[k[1]] || 'original') :
        k[0] === 'section' ? (s.sections[k[1]] || 'none') : s.background;
      return v === c.value;
    };
    var el = DS.h('<div class="ds-ui ds-overlay" role="dialog" aria-modal="true" aria-label="Compare images">' +
      '<div class="ds-ov-bar"><b>Compare images</b><span class="ds-ov-sub">' + esc(cols.length + ' candidates, shown as they would be used') + '</span>' +
      '<button type="button" class="ds-icon-btn" data-close aria-label="Close">×</button></div>' +
      '<div class="ds-imgcmp" style="--n:' + cols.length + '">' + cols.map(function (c, i) {
        var im = c.img;
        return '<div class="ds-imgcmp-col">' + ctx(c) +
          '<div class="ds-imgcmp-info"><p class="ds-imgcmp-label">' + esc(c.label) + (current(c) ? ' <span class="ds-tag">In use</span>' : '') + '</p>' +
          (im ? '<p class="ds-imgcmp-title">' + esc(im.title) + '</p>' +
            '<dl><dt>iStock ID</dt><dd>' + esc(im.id) + '</dd><dt>Contributor</dt><dd>' + esc(im.artist) + '</dd>' +
            '<dt>Collection</dt><dd>' + esc(im.collection) + '</dd>' +
            (im.width && im.height ? '<dt>Original size</dt><dd>' + esc(im.width + ' × ' + im.height + ' px') + '</dd>' : '') +
            '<dt>Price</dt><dd>' + esc(DS.stock.price(im)) + (im.price ? ', ' + esc(im.price.license) + '<br><small>read ' + esc(im.price.verified) + '</small>' : '') + '</dd></dl>' +
            '<p><a href="' + esc(im.url) + '" target="_blank" rel="noopener">View listing on iStock ↗</a></p>' :
            '<p class="ds-imgcmp-title">The site\'s own picture. No licence needed.</p>') +
          '<button type="button" class="ds-btn-sm ds-primary" data-use="' + i + '">Use this</button></div></div>';
      }).join('') + '</div></div>');
    document.body.appendChild(el);
    function close() { el.remove(); document.removeEventListener('keydown', onKey); }
    function onKey(e) { if (e.key === 'Escape') close(); }
    document.addEventListener('keydown', onKey);
    DS.$('[data-close]', el).addEventListener('click', close);
    DS.$$('[data-use]', el).forEach(function (b) {
      b.addEventListener('click', function () {
        var c = cols[+b.getAttribute('data-use')];
        close();
        pick(c.slot, c.value);
      });
    });
  }

  function ui() { return DS.ui; }
})();

;
/* Design Studio - compare and present.
 *
 * Compare puts two or three concepts next to each other. Each pane is the
 * real homepage in an iframe, rendered at a real desktop width and scaled
 * down to fit, so what is compared is the site and not a picture of it. The
 * configuration travels in the iframe's URL (?ds=...&ds-embed=1), which is
 * the same link "Copy link" produces.
 *
 * Present hides every control, goes full screen, and leaves a small bar that
 * steps through the saved concepts and presets with the arrow keys. */
(function () {
  'use strict';

  var DS = window.DS, esc = DS.esc;

  /* The three-way comparison suggested for the review: research-led with a
     large picture and research cards, news-led with a news carousel and a
     compact research list, and a minimal homepage with research on its own
     pages. Built from the baseline so they differ only where they mean to. */
  function suggested(id) {
    var c = DS.clone(DS.BASE);
    if (id === 'research') {
      c.contentPriority = 'research'; c.heroLayout = 'image';
      c.contentLayouts.research.layout = 'cards'; c.contentLayouts.news.layout = 'list'; c.contentLayouts.people.layout = 'compact';
      c.imageSelections = DS.resolveImages({hero: '@hero:0', research: '@stock'});
      c.name = 'A · Research-led';
    } else if (id === 'news') {
      c.contentPriority = 'news'; c.heroLayout = 'minimal';
      c.contentLayouts.news.layout = 'carousel'; c.contentLayouts.news.imageSize = 'm'; c.contentLayouts.news.feed = false;
      c.contentLayouts.research.layout = 'list'; c.contentLayouts.research.imageSize = 's'; c.contentLayouts.people.layout = 'compact';
      c.name = 'B · News-led';
    } else {
      c.contentPriority = 'minimal'; c.heroLayout = 'text'; c.navigationStructure = 'subpages';
      c.contentLayouts.research.layout = 'list'; c.contentLayouts.research.imageSize = 'none';
      c.contentLayouts.news.layout = 'list'; c.contentLayouts.news.imageSize = 'none'; c.contentLayouts.news.feed = false;
      c.visualTheme.typography = 'academic';
      c.name = 'C · Minimal, research pages';
    }
    c = DS.normalize(c);
    c.nameSig = DS.sig(c);
    return c;
  }

  function options() {
    var out = [{key: 'current', label: 'This concept (working copy)', group: 'Now', config: DS.config()}];
    out.push({key: 'concept:research', label: 'A · Research-led', group: 'Suggested', config: suggested('research')});
    out.push({key: 'concept:news', label: 'B · News-led', group: 'Suggested', config: suggested('news')});
    out.push({key: 'concept:minimal', label: 'C · Minimal, research pages', group: 'Suggested', config: suggested('minimal')});
    return out.concat(DS.catalogue());
  }

  function resolve(key) {
    return options().filter(function (o) { return o.key === key; })[0] || options()[0];
  }

  function frameUrl(cfg) {
    return location.pathname + '?ds=' + DS.encode(cfg) + '&ds-embed=1';
  }

  /* --------------------------------------------------------------- compare */

  var cmp = null;
  var WIDTHS = [{value: '1440', label: 'Desktop'}, {value: '1180', label: 'Laptop'}, {value: '820', label: 'Tablet'}, {value: '390', label: 'Phone'}];

  DS.compare = {
    open: function (keys) {
      if (cmp) DS.compare.close();
      keys = (keys && keys.length ? keys : ['current', 'preset:original']).slice(0, 3);
      if (keys.length < 2) keys.push('preset:original');
      cmp = {keys: keys, width: 1440, sync: true};
      var el = cmp.el = DS.h('<div class="ds-ui ds-overlay ds-compare" role="dialog" aria-modal="true" aria-label="Compare concepts">' +
        '<div class="ds-ov-bar"><b>Compare concepts</b>' +
        '<span class="ds-ov-group">' + DS.panel.segmented('cmp-n', [{value: '2', label: '2 panes'}, {value: '3', label: '3 panes'}], String(keys.length), 'Panes') + '</span>' +
        '<span class="ds-ov-group">' + DS.panel.segmented('cmp-w', WIDTHS, '1440', 'Viewport') + '</span>' +
        '<label class="ds-ov-check"><input type="checkbox" data-sync checked> Scroll together</label>' +
        '<button type="button" class="ds-icon-btn" data-close aria-label="Close comparison" title="Close (Esc)">×</button></div>' +
        '<div class="ds-panes"></div></div>');
      document.body.appendChild(el);
      document.documentElement.classList.add('ds-comparing');
      DS.$$('[data-ds-seg=cmp-n] button', el).forEach(function (b) {
        b.addEventListener('click', function () {
          var n = +b.value;
          while (cmp.keys.length < n) cmp.keys.push(['preset:minimal', 'concept:news', 'preset:editorial'].filter(function (k) { return cmp.keys.indexOf(k) < 0; })[0]);
          cmp.keys = cmp.keys.slice(0, n);
          seg('cmp-n', String(n));
          panes();
        });
      });
      DS.$$('[data-ds-seg=cmp-w] button', el).forEach(function (b) {
        b.addEventListener('click', function () { cmp.width = +b.value; seg('cmp-w', b.value); fit(); });
      });
      DS.$('[data-sync]', el).addEventListener('change', function (e) { cmp.sync = e.target.checked; });
      DS.$('[data-close]', el).addEventListener('click', DS.compare.close);
      document.addEventListener('keydown', escClose);
      window.addEventListener('resize', fit);
      panes();
    },
    close: function () {
      if (!cmp) return;
      cmp.el.remove();
      document.documentElement.classList.remove('ds-comparing');
      document.removeEventListener('keydown', escClose);
      window.removeEventListener('resize', fit);
      cmp = null;
    }
  };

  function escClose(e) { if (e.key === 'Escape' && !document.querySelector('.ds-overlay:not(.ds-compare)')) DS.compare.close(); }

  function seg(name, value) {
    DS.$$('[data-ds-seg=' + name + '] button', cmp.el).forEach(function (b) {
      var on = b.value === value;
      b.classList.toggle('is-on', on);
      b.setAttribute('aria-pressed', String(on));
    });
  }

  function panes() {
    var host = DS.$('.ds-panes', cmp.el), opts = options();
    host.style.setProperty('--n', cmp.keys.length);
    host.innerHTML = cmp.keys.map(function (key, i) {
      var o = resolve(key), d = DS.describe(o.config);
      var groups = {};
      opts.forEach(function (x) { (groups[x.group] = groups[x.group] || []).push(x); });
      var select = '<select data-pane="' + i + '" aria-label="Concept for pane ' + (i + 1) + '">' + Object.keys(groups).map(function (g) {
        return '<optgroup label="' + esc(g) + '">' + groups[g].map(function (x) {
          return '<option value="' + esc(x.key) + '"' + (x.key === key ? ' selected' : '') + '>' + esc(x.label) + '</option>';
        }).join('') + '</optgroup>';
      }).join('') + '</select>';
      return '<section class="ds-pane"><header class="ds-pane-head"><span class="ds-pane-letter">' + 'ABC'[i] + '</span>' +
        '<div class="ds-pane-label">' + select + '<span>' + esc(d.detail) + '</span></div>' +
        '<div class="ds-pane-acts"><button type="button" class="ds-btn-xs" data-edit="' + i + '" title="Make this the working concept">Edit</button>' +
        '<button type="button" class="ds-btn-xs" data-present="' + i + '" title="Present this concept">▶</button></div></header>' +
        '<div class="ds-pane-frame"><iframe title="' + esc(d.title) + '" src="' + esc(frameUrl(o.config)) + '"></iframe></div></section>';
    }).join('');
    DS.$$('select[data-pane]', host).forEach(function (s) {
      s.addEventListener('change', function () { cmp.keys[+s.getAttribute('data-pane')] = s.value; panes(); });
    });
    DS.$$('[data-edit]', host).forEach(function (b) {
      b.addEventListener('click', function () {
        var o = resolve(cmp.keys[+b.getAttribute('data-edit')]);
        DS.compare.close();
        DS.set(o.config, {scrollTop: true});
      });
    });
    DS.$$('[data-present]', host).forEach(function (b) {
      b.addEventListener('click', function () {
        var key = cmp.keys[+b.getAttribute('data-present')];
        var o = resolve(key);
        DS.compare.close();
        DS.present.start(key === 'current' ? null : key, null, o.config);
      });
    });
    DS.$$('iframe', host).forEach(function (f) { f.addEventListener('load', function () { hookScroll(f); }); });
    fit();
  }

  /* Render each page at the chosen width and scale it down to the pane. */
  function fit() {
    if (!cmp) return;
    DS.$$('.ds-pane-frame', cmp.el).forEach(function (frame) {
      var f = DS.$('iframe', frame), w = frame.clientWidth, h = frame.clientHeight;
      var scale = Math.min(1, w / cmp.width);
      f.style.width = cmp.width + 'px';
      f.style.height = Math.ceil(h / scale) + 'px';
      f.style.transform = 'scale(' + scale + ')';
      frame.style.setProperty('--scale', scale.toFixed(3));
    });
  }

  var syncing = false;
  function hookScroll(f) {
    var w;
    try { w = f.contentWindow; w.document; } catch (e) { return; }
    w.addEventListener('scroll', function () {
      if (!cmp || !cmp.sync || syncing) return;
      var doc = w.document.documentElement;
      var frac = w.scrollY / Math.max(1, doc.scrollHeight - w.innerHeight);
      syncing = true;
      DS.$$('iframe', cmp.el).forEach(function (o) {
        if (o === f) return;
        try {
          var od = o.contentWindow.document.documentElement;
          o.contentWindow.scrollTo(0, frac * Math.max(0, od.scrollHeight - o.contentWindow.innerHeight));
        } catch (e) { /* not loaded yet */ }
      });
      requestAnimationFrame(function () { syncing = false; });
    }, {passive: true});
  }

  /* --------------------------------------------------------------- present */

  var pres = null;

  DS.present = {
    active: function () { return !!pres; },
    /* startKey: a catalogue key to begin with; only: 'saved' to cycle only
       the saved concepts; cfg: a configuration to show first. */
    start: function (startKey, only, cfg) {
      if (pres) return;
      var list = only === 'saved' ? DS.catalogue().filter(function (x) { return x.group === 'Saved'; }) : DS.catalogue();
      if (!list.length) list = DS.catalogue();
      var cur = cfg || DS.config(), sig = DS.signature(cur);
      var idx = startKey ? list.map(function (x) { return x.key; }).indexOf(startKey) : -1;
      if (idx < 0) idx = list.map(function (x) { return DS.signature(x.config); }).indexOf(sig);
      if (idx < 0) { list.unshift({key: 'current', label: DS.describe(cur).title, config: cur}); idx = 0; }
      pres = {list: list, i: idx, wasOpen: DS.panel.isOpen()};
      if (pres.wasOpen) DS.panel.close();
      document.documentElement.classList.add('ds-presenting');
      pres.bar = DS.h('<div class="ds-ui ds-presbar" role="toolbar" aria-label="Presentation">' +
        '<button type="button" class="ds-icon-btn" data-step="-1" aria-label="Previous concept" title="Previous (←)">‹</button>' +
        '<div class="ds-pres-label"><b></b><span></span></div><span class="ds-pres-count"></span>' +
        '<button type="button" class="ds-icon-btn" data-step="1" aria-label="Next concept" title="Next (→)">›</button>' +
        '<button type="button" class="ds-btn-xs" data-exit title="Exit (Esc)">Exit</button></div>');
      document.body.appendChild(pres.bar);
      DS.$$('[data-step]', pres.bar).forEach(function (b) { b.addEventListener('click', function () { step(+b.getAttribute('data-step')); }); });
      DS.$('[data-exit]', pres.bar).addEventListener('click', DS.present.stop);
      document.addEventListener('keydown', presKeys, true);
      document.addEventListener('mousemove', wake);
      document.addEventListener('fullscreenchange', onFs);
      if (document.documentElement.requestFullscreen && !document.fullscreenElement) {
        document.documentElement.requestFullscreen().then(function () { if (pres) pres.fs = true; }).catch(function () { /* stays windowed */ });
      }
      show();
    },
    stop: function () {
      if (!pres) return;
      var p = pres;
      pres = null;
      p.bar.remove();
      document.documentElement.classList.remove('ds-presenting');
      document.removeEventListener('keydown', presKeys, true);
      document.removeEventListener('mousemove', wake);
      document.removeEventListener('fullscreenchange', onFs);
      if (document.fullscreenElement && document.exitFullscreen) document.exitFullscreen().catch(function () {});
      if (p.wasOpen) DS.panel.open();
    }
  };

  function show() {
    var item = pres.list[pres.i];
    if (DS.signature(item.config) !== DS.signature(DS.config())) DS.set(item.config, {scrollTop: true});
    var d = DS.describe(DS.config());
    DS.$('.ds-pres-label b', pres.bar).textContent = item.label && item.key.indexOf('saved:') === 0 ? item.label : d.title;
    DS.$('.ds-pres-label span', pres.bar).textContent = d.detail;
    DS.$('.ds-pres-count', pres.bar).textContent = (pres.i + 1) + ' / ' + pres.list.length;
    wake();
  }

  function step(d) {
    if (!pres) return;
    pres.i = (pres.i + d + pres.list.length) % pres.list.length;
    show();
  }

  function presKeys(e) {
    if (!pres) return;
    if (e.key === 'ArrowRight') { step(1); e.preventDefault(); e.stopPropagation(); }
    else if (e.key === 'ArrowLeft') { step(-1); e.preventDefault(); e.stopPropagation(); }
    else if (e.key === 'Escape') { DS.present.stop(); e.preventDefault(); e.stopPropagation(); }
  }

  function onFs() { if (pres && pres.fs && !document.fullscreenElement) DS.present.stop(); }

  var idle;
  function wake() {
    if (!pres) return;
    pres.bar.classList.remove('is-idle');
    clearTimeout(idle);
    idle = setTimeout(function () { if (pres) pres.bar.classList.add('is-idle'); }, 2600);
  }
})();

;
/* Design Studio - start-up.
 *
 * Runs after the theme's own start-up (jQuery ready), so the theme has
 * already chosen light or dark and the studio can respect or override it.
 *
 * The starting concept is, in order: one passed in the URL (?ds=...), the one
 * left active in this browser, or the original site. A URL concept becomes
 * the working concept and the parameter is dropped from the address, so a
 * reload does not undo later edits - except inside a comparison pane
 * (ds-embed=1), which only ever shows what its URL says. */
(function () {
  'use strict';

  function boot() {
    var DS = window.DS;
    try {
      DS.content = JSON.parse(DS.$('#ds-content').textContent);
      DS.stock.load(JSON.parse(DS.$('#ds-stock').textContent));
    } catch (e) {
      document.documentElement.classList.remove('ds-pending');
      return;
    }
    DS.page.init();
    DS.theme.init();

    var params = new URLSearchParams(location.search);
    var fromUrl = params.get('ds') ? DS.decode(params.get('ds')) : null;
    var start = fromUrl || DS.store.get('current', null);
    DS.state.config = DS.normalize(start || DS.ORIGINAL);
    if (fromUrl && !DS.embedded) {
      DS.store.set('current', DS.state.config);
      params.delete('ds');
      var q = params.toString();
      history.replaceState(history.state, '', location.pathname + (q ? '?' + q : '') + location.hash);
    }

    DS.on('change', function (e) {
      DS.theme.apply(e.config);
      DS.router.tidy(e.config);
      DS.page.render(e.config, e.opts);
    });

    DS.theme.apply(DS.state.config);
    DS.router.tidy(DS.state.config);
    DS.page.render(DS.state.config, {initial: true});
    document.documentElement.classList.remove('ds-pending');

    if (DS.embedded) document.documentElement.classList.add('ds-embedded');
    else DS.panel.init();

    /* Links from other pages still aim at the original sections (/#people).
       With a concept showing, send them to wherever that content now lives. */
    followLegacy();
    window.addEventListener('hashchange', followLegacy);

    /* The theme may settle light/dark once more on load; have the last word. */
    window.addEventListener('load', function () { DS.theme.apply(DS.config()); });
  }

  var LEGACY = {page_header: 'home', publications: 'research', people: 'people', news: 'news',
    teaching: 'teaching', vacancies: 'vacancies', contact: 'contact'};

  function followLegacy() {
    var DS = window.DS;
    var target = LEGACY[decodeURIComponent(location.hash.slice(1))];
    if (!target || DS.isOriginal(DS.config())) return;
    var t = DS.router.targetFor(target);
    history.replaceState(history.state, '', location.pathname + location.search);
    if (window.jQuery) window.jQuery('html, body').stop(true);
    if (t.route != null) { DS.router.go(t.route); return; }
    setTimeout(function () {
      var el = document.getElementById(t.href.slice(1)), nav = document.getElementById('navbar-main');
      if (window.jQuery) window.jQuery('html, body').stop(true);
      if (el) window.scrollTo({top: el.getBoundingClientRect().top + window.scrollY - (nav ? nav.offsetHeight : 0), behavior: 'smooth'});
    }, 60);
  }

  if (window.jQuery) window.jQuery(function () { setTimeout(boot, 0); });
  else document.addEventListener('DOMContentLoaded', boot);
})();
