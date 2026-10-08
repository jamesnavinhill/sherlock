import React, { useState, useMemo, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import {
  BookOpen,
  Search,
  ArrowLeft,
  ChevronRight,
  ExternalLink,
  Copy,
  Check,
  Info,
  AlertTriangle,
  Lightbulb,
  FileText,
  Sparkles,
  Layers,
  Menu,
  X,
  Compass
} from 'lucide-react';
import {
  DOCS_NAVIGATION,
  DOCS_PAGES,
  DEFAULT_DOC_SLUG,
  type DocPage
} from '@/docs/docsContent';

/* ------------------------------------------------------------------ */
/*  Mintlify-like custom MDX tag transformers                         */
/* ------------------------------------------------------------------ */

function preprocessMdx(raw: string): string {
  let content = raw;

  // Replace <Note>...</Note>
  content = content.replace(/<Note>([\s\S]*?)<\/Note>/g, (_m, p1) => {
    return `\n:::note\n${p1.trim()}\n:::\n`;
  });

  // Replace <Warning>...</Warning>
  content = content.replace(/<Warning>([\s\S]*?)<\/Warning>/g, (_m, p1) => {
    return `\n:::warning\n${p1.trim()}\n:::\n`;
  });

  // Replace <Tip>...</Tip>
  content = content.replace(/<Tip>([\s\S]*?)<\/Tip>/g, (_m, p1) => {
    return `\n:::tip\n${p1.trim()}\n:::\n`;
  });

  // Strip complex CardGroup / Card wrappers into markdown cards
  content = content.replace(/<CardGroup[\s\S]*?>/g, '');
  content = content.replace(/<\/CardGroup>/g, '');
  content = content.replace(/<Card\s+title="([^"]+)"\s*(?:icon="([^"]*)")?\s*(?:href="([^"]*)")?>([\s\S]*?)<\/Card>/g, (_m, title, _icon, href, body) => {
    const linkStr = href ? ` [Open →](${href})` : '';
    return `\n> **${title}**${linkStr}\n>\n> ${body.trim().replace(/\n/g, '\n> ')}\n`;
  });

  // Strip <Steps> and <Step> tags
  content = content.replace(/<Steps>/g, '');
  content = content.replace(/<\/Steps>/g, '');
  content = content.replace(/<Step\s+title="([^"]+)">/g, '#### $1\n');
  content = content.replace(/<\/Step>/g, '');

  return content;
}

export function DocsView() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Extract current slug from path: /docs, /docs/introduction, /docs/concepts/workspaces, etc.
  const currentSlug = useMemo(() => {
    const raw = location.pathname.replace(/^\/docs\/?/, '').replace(/\/$/, '');
    if (!raw) return DEFAULT_DOC_SLUG;
    return raw;
  }, [location.pathname]);

  const activePage: DocPage = useMemo(() => {
    return DOCS_PAGES[currentSlug] || DOCS_PAGES[DEFAULT_DOC_SLUG] || Object.values(DOCS_PAGES)[0];
  }, [currentSlug]);

  // Preprocess MDX
  const processedMarkdown = useMemo(() => {
    return preprocessMdx(activePage?.content || '');
  }, [activePage]);

  // Table of contents extraction
  const headings = useMemo(() => {
    if (!activePage?.content) return [];
    const lines = activePage.content.split('\n');
    const result: { title: string; id: string; level: number }[] = [];
    for (const line of lines) {
      const match = line.match(/^(#{2,3})\s+(.*)$/);
      if (match) {
        const level = match[1].length;
        const title = match[2].trim().replace(/[*`_]/g, '');
        const id = title.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
        result.push({ title, id, level });
      }
    }
    return result;
  }, [activePage]);

  // Prev & Next navigation
  const flatPages = useMemo(() => {
    const list: { slug: string; title: string; group: string }[] = [];
    for (const grp of DOCS_NAVIGATION) {
      for (const p of grp.pages) {
        list.push({ slug: p.slug, title: p.title, group: grp.group });
      }
    }
    return list;
  }, []);

  const currentIndex = flatPages.findIndex((p) => p.slug === currentSlug);
  const prevPage = currentIndex > 0 ? flatPages[currentIndex - 1] : null;
  const nextPage = currentIndex >= 0 && currentIndex < flatPages.length - 1 ? flatPages[currentIndex + 1] : null;

  // Search filter
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase();
    return Object.values(DOCS_PAGES)
      .filter((p) => p.title.toLowerCase().includes(query) || p.description.toLowerCase().includes(query) || p.content.toLowerCase().includes(query))
      .slice(0, 8);
  }, [searchQuery]);

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [currentSlug]);

  return (
    <div className="min-h-screen bg-[#0d0c0e] text-[#e0dede] flex flex-col font-sans selection:bg-[#9b6288]/30 selection:text-white">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 w-full border-b border-neutral-800/80 bg-[#0d0c0e]/90 backdrop-blur-md px-4 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            type="button"
            className="lg:hidden p-2 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800/60"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle Navigation"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#9b6288] to-[#603b54] flex items-center justify-center text-white shadow-sm shadow-[#9b6288]/20 group-hover:scale-105 transition-transform">
              <Compass className="w-4 h-4" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="font-semibold text-neutral-100 tracking-tight text-base">Sherlock</span>
              <span className="text-xs font-medium text-[#c18ead] uppercase tracking-wider px-1.5 py-0.5 rounded bg-[#9b6288]/15 border border-[#9b6288]/20">
                Docs
              </span>
            </div>
          </Link>
        </div>

        {/* Global Search Bar */}
        <div className="relative max-w-md w-full mx-4 hidden md:block">
          <div className="relative flex items-center">
            <Search className="w-4 h-4 absolute left-3 text-neutral-500 pointer-events-none" />
            <input
              type="text"
              placeholder="Search documentation (⌘K)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-neutral-900/80 border border-neutral-800/80 rounded-lg pl-9 pr-4 py-1.5 text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-[#9b6288] focus:ring-1 focus:ring-[#9b6288] transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 text-neutral-500 hover:text-neutral-300 text-xs"
              >
                Clear
              </button>
            )}
          </div>

          {/* Search Dropdown */}
          {searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-neutral-900 border border-neutral-800 rounded-lg shadow-2xl overflow-hidden z-50">
              <div className="p-1.5 max-h-80 overflow-y-auto divide-y divide-neutral-800/40">
                {searchResults.map((result) => (
                  <button
                    key={result.slug}
                    type="button"
                    onClick={() => {
                      navigate(`/docs/${result.slug}`);
                      setSearchQuery('');
                    }}
                    className="w-full text-left p-2 rounded hover:bg-neutral-800/70 transition-colors flex flex-col gap-0.5"
                  >
                    <span className="text-xs font-medium text-neutral-200">{result.title}</span>
                    <span className="text-[11px] text-neutral-400 line-clamp-1">{result.description || result.group}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/welcome"
            className="flex items-center gap-1.5 text-xs font-medium text-neutral-300 hover:text-white px-3 py-1.5 rounded-lg border border-neutral-800 hover:border-neutral-700 bg-neutral-900/50 hover:bg-neutral-800/60 transition-all"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Launch App</span>
          </Link>
          <a
            href="https://github.com/jamesnavinhill/sherlock"
            target="_blank"
            rel="noreferrer"
            className="text-neutral-400 hover:text-neutral-100 p-1.5 rounded-lg hover:bg-neutral-800/60 transition-colors"
            title="GitHub Repository"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 max-w-7xl w-full mx-auto flex">
        {/* Left Sidebar (Desktop) */}
        <aside className="w-64 shrink-0 hidden lg:block border-r border-neutral-800/60 p-6 sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto">
          <nav className="space-y-6">
            {DOCS_NAVIGATION.map((group) => (
              <div key={group.group} className="space-y-1.5">
                <h3 className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider px-2">
                  {group.group}
                </h3>
                <div className="space-y-0.5">
                  {group.pages.map((p) => {
                    const isActive = currentSlug === p.slug;
                    return (
                      <Link
                        key={p.slug}
                        to={`/docs/${p.slug}`}
                        className={`block text-xs px-2.5 py-1.5 rounded-md transition-all ${
                          isActive
                            ? 'bg-[#9b6288]/20 text-[#e9c7dc] font-medium border-l-2 border-[#9b6288]'
                            : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/40'
                        }`}
                      >
                        {p.title}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        </aside>

        {/* Mobile Sidebar Modal */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden bg-black/60 backdrop-blur-sm flex">
            <div className="w-72 bg-[#0d0c0e] border-r border-neutral-800 h-full p-6 overflow-y-auto">
              <div className="flex items-center justify-between pb-4 border-b border-neutral-800 mb-4">
                <span className="font-semibold text-sm text-neutral-200">Navigation</span>
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1 rounded text-neutral-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <nav className="space-y-6">
                {DOCS_NAVIGATION.map((group) => (
                  <div key={group.group} className="space-y-1.5">
                    <h3 className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider px-2">
                      {group.group}
                    </h3>
                    <div className="space-y-0.5">
                      {group.pages.map((p) => (
                        <Link
                          key={p.slug}
                          to={`/docs/${p.slug}`}
                          onClick={() => setMobileMenuOpen(false)}
                          className={`block text-xs px-2.5 py-1.5 rounded-md ${
                            currentSlug === p.slug
                              ? 'bg-[#9b6288]/20 text-[#e9c7dc] font-medium'
                              : 'text-neutral-400 hover:text-neutral-200'
                          }`}
                        >
                          {p.title}
                        </Link>
                      ))}
                    </div>
                  </div>
                ))}
              </nav>
            </div>
            <div className="flex-1" onClick={() => setMobileMenuOpen(false)} />
          </div>
        )}

        {/* Center Content Pane */}
        <main className="flex-1 min-w-0 px-6 py-8 lg:px-12 max-w-3xl">
          {/* Breadcrumb */}
          <div className="flex items-center gap-1.5 text-[11px] text-neutral-500 mb-4 font-mono">
            <span>Docs</span>
            <ChevronRight className="w-3 h-3 text-neutral-600" />
            <span>{activePage.group}</span>
            <ChevronRight className="w-3 h-3 text-neutral-600" />
            <span className="text-[#c18ead]">{activePage.title}</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-2">
            {activePage.title}
          </h1>

          {activePage.description && (
            <p className="text-sm text-neutral-400 leading-relaxed mb-8 border-b border-neutral-800/80 pb-6">
              {activePage.description}
            </p>
          )}

          {/* Article Markdown Body */}
          <article className="prose prose-invert prose-neutral max-w-none text-xs sm:text-sm text-neutral-300 leading-relaxed space-y-4">
            <ReactMarkdown
              components={{
                h2: ({ children }) => {
                  const text = String(children);
                  const id = text.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
                  return (
                    <h2 id={id} className="text-lg sm:text-xl font-semibold text-white mt-8 mb-3 pt-4 border-t border-neutral-800/60 scroll-mt-20">
                      {children}
                    </h2>
                  );
                },
                h3: ({ children }) => {
                  const text = String(children);
                  const id = text.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
                  return (
                    <h3 id={id} className="text-base font-medium text-neutral-100 mt-6 mb-2 scroll-mt-20">
                      {children}
                    </h3>
                  );
                },
                p: ({ children }) => <p className="leading-relaxed text-neutral-300 my-3">{children}</p>,
                ul: ({ children }) => <ul className="list-disc list-outside pl-5 space-y-1.5 my-3 text-neutral-300">{children}</ul>,
                ol: ({ children }) => <ol className="list-decimal list-outside pl-5 space-y-1.5 my-3 text-neutral-300">{children}</ol>,
                blockquote: ({ children }) => (
                  <blockquote className="border-l-2 border-[#9b6288] bg-[#9b6288]/10 rounded-r-lg px-4 py-2.5 my-4 text-neutral-200">
                    {children}
                  </blockquote>
                ),
                code: ({ children, className }) => {
                  const match = /language-(\w+)/.exec(className || '');
                  const codeText = String(children).replace(/\n$/, '');
                  if (!match && !codeText.includes('\n')) {
                    return (
                      <code className="px-1.5 py-0.5 rounded bg-neutral-800/80 border border-neutral-700/60 font-mono text-[11px] text-[#e9c7dc]">
                        {children}
                      </code>
                    );
                  }
                  return (
                    <div className="relative group my-4 rounded-lg overflow-hidden border border-neutral-800 bg-[#09080a]">
                      <div className="flex items-center justify-between px-3 py-1.5 bg-neutral-900/80 border-b border-neutral-800/80 text-[11px] text-neutral-400 font-mono">
                        <span>{match ? match[1] : 'code'}</span>
                        <button
                          type="button"
                          onClick={() => handleCopy(codeText)}
                          className="flex items-center gap-1 hover:text-white transition-colors"
                        >
                          {copiedCode === codeText ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-400" />
                              <span className="text-[10px] text-emerald-400">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span className="text-[10px]">Copy</span>
                            </>
                          )}
                        </button>
                      </div>
                      <pre className="p-4 overflow-x-auto font-mono text-xs text-neutral-200 leading-normal">
                        <code>{children}</code>
                      </pre>
                    </div>
                  );
                },
                a: ({ href, children }) => {
                  const isInternal = href?.startsWith('/') || href?.startsWith('#');
                  if (isInternal && href && !href.startsWith('#')) {
                    const docHref = href.startsWith('/docs') ? href : `/docs${href}`;
                    return (
                      <Link to={docHref} className="text-[#c18ead] hover:underline font-medium">
                        {children}
                      </Link>
                    );
                  }
                  return (
                    <a href={href} target="_blank" rel="noreferrer" className="text-[#c18ead] hover:underline inline-flex items-center gap-0.5">
                      {children}
                      <ExternalLink className="w-3 h-3 inline-block ml-0.5" />
                    </a>
                  );
                }
              }}
            >
              {processedMarkdown}
            </ReactMarkdown>
          </article>

          {/* Prev / Next Article Footer */}
          <div className="mt-12 pt-6 border-t border-neutral-800 flex items-center justify-between gap-4">
            {prevPage ? (
              <Link
                to={`/docs/${prevPage.slug}`}
                className="group flex flex-col text-left p-3 rounded-lg border border-neutral-800 hover:border-neutral-700 bg-neutral-900/40 hover:bg-neutral-800/40 transition-all max-w-[48%]"
              >
                <span className="text-[10px] text-neutral-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <ArrowLeft className="w-3 h-3 group-hover:-translate-x-0.5 transition-transform" /> Previous
                </span>
                <span className="text-xs font-medium text-neutral-200 group-hover:text-white truncate">
                  {prevPage.title}
                </span>
              </Link>
            ) : <div />}

            {nextPage && (
              <Link
                to={`/docs/${nextPage.slug}`}
                className="group flex flex-col text-right p-3 rounded-lg border border-neutral-800 hover:border-neutral-700 bg-neutral-900/40 hover:bg-neutral-800/40 transition-all max-w-[48%]"
              >
                <span className="text-[10px] text-neutral-500 uppercase tracking-wider mb-1 flex items-center justify-end gap-1">
                  Next <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                </span>
                <span className="text-xs font-medium text-neutral-200 group-hover:text-white truncate">
                  {nextPage.title}
                </span>
              </Link>
            )}
          </div>
        </main>

        {/* Right Sidebar: Table of Contents (Desktop) */}
        {headings.length > 0 && (
          <aside className="w-56 shrink-0 hidden xl:block p-6 sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto">
            <div className="space-y-3">
              <h4 className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
                On this page
              </h4>
              <nav className="space-y-1.5 text-xs">
                {headings.map((h) => (
                  <a
                    key={h.id}
                    href={`#${h.id}`}
                    className={`block text-neutral-500 hover:text-neutral-200 transition-colors truncate ${
                      h.level === 3 ? 'pl-3 text-[11px]' : ''
                    }`}
                  >
                    {h.title}
                  </a>
                ))}
              </nav>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
export default DocsView;
