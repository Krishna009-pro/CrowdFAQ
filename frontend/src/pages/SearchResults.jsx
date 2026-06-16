import { useState, useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { PageShell } from "@/components/layout/PageShell";
import { QuestionCard } from "@/components/QuestionCard";
import { questions, categories } from "@/lib/mockData";
import { Search, SlidersHorizontal, ArrowUpDown, X } from "lucide-react";

const sorts = [
  { k: "relevance", label: "Relevance" },
  { k: "newest", label: "Newest" },
  { k: "votes", label: "Most voted" },
  { k: "views", label: "Most viewed" },
];

export default function SearchResults() {
  const [params, setParams] = useSearchParams();
  const initialQ = params.get("q") || "";
  const [q, setQ] = useState(initialQ);
  const [status, setStatus] = useState([]);
  const [cats, setCats] = useState([]);
  const [sort, setSort] = useState("relevance");

  const results = useMemo(() => {
    let list = questions.filter((qq) => {
      const matches = !q || qq.title.toLowerCase().includes(q.toLowerCase()) || qq.tags.some((t) => t.includes(q.toLowerCase()));
      const sOk = status.length === 0 || status.includes(qq.status);
      const cOk = cats.length === 0 || cats.includes(qq.category);
      return matches && sOk && cOk;
    });
    if (sort === "newest") list = list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    if (sort === "votes") list = list.sort((a, b) => b.votes - a.votes);
    if (sort === "views") list = list.sort((a, b) => b.views - a.views);
    return list;
  }, [q, status, cats, sort]);

  const toggle = (val, list, setList) => list.includes(val) ? setList(list.filter((x) => x !== val)) : setList([...list, val]);
  const clear = () => { setStatus([]); setCats([]); setSort("relevance"); };

  const onSearch = (e) => {
    e.preventDefault();
    setParams({ q });
  };

  return (
    <PageShell>
      <section className="border-b border-brand-line">
        <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-12 py-10 md:py-14">
          <p className="label-eyebrow mb-3">Search results</p>
          <h1 className="font-serif text-4xl md:text-6xl text-brand-ink leading-none tracking-tight mb-6">
            {q ? <>Results for <em className="italic text-brand-vermilion">"{q}"</em></> : 'Search the knowledge base'}
          </h1>
          <form onSubmit={onSearch} className="flex border border-brand-line max-w-3xl bg-white" data-testid="search-form">
            <div className="pl-5 pr-2 flex items-center text-brand-mute"><Search size={18} /></div>
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search questions, tags, answers..." className="flex-1 py-4 text-base outline-none bg-transparent" data-testid="search-input" />
            <button type="submit" className="bg-brand-ink text-brand-paper px-6 text-sm tracking-wide hover:bg-brand-blue transition-colors" data-testid="search-submit-btn">Search</button>
          </form>
          <p className="mt-4 text-sm text-brand-body">{results.length} result{results.length !== 1 ? 's' : ''} {q && `for "${q}"`}</p>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 md:px-8 lg:px-12 py-10 grid lg:grid-cols-12 gap-10">
        <aside className="lg:col-span-3 space-y-6" data-testid="search-filters">
          <div className="flex items-center justify-between border-b border-brand-line pb-2">
            <p className="label-eyebrow flex items-center gap-2"><SlidersHorizontal size={11} /> Filters</p>
            {(status.length + cats.length > 0) && (
              <button onClick={clear} className="text-xs text-brand-vermilion uppercase tracking-widest flex items-center gap-1" data-testid="clear-filters-btn">
                <X size={11} /> Clear
              </button>
            )}
          </div>

          <div>
            <p className="label-eyebrow mb-3">Status</p>
            <div className="space-y-2">
              {[
                { v: "verified", label: "Verified" },
                { v: "answered", label: "Answered" },
                { v: "unanswered", label: "Open" },
              ].map((s) => (
                <label key={s.v} className="flex items-center gap-3 cursor-pointer group" data-testid={`status-${s.v}`}>
                  <input type="checkbox" checked={status.includes(s.v)} onChange={() => toggle(s.v, status, setStatus)} className="w-4 h-4 accent-brand-ink" />
                  <span className="text-sm text-brand-body group-hover:text-brand-ink">{s.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <p className="label-eyebrow mb-3">Category</p>
            <div className="space-y-2 max-h-72 overflow-auto pr-2">
              {categories.map((c) => (
                <label key={c.slug} className="flex items-center justify-between gap-3 cursor-pointer group" data-testid={`category-${c.slug}`}>
                  <span className="flex items-center gap-3">
                    <input type="checkbox" checked={cats.includes(c.slug)} onChange={() => toggle(c.slug, cats, setCats)} className="w-4 h-4 accent-brand-ink" />
                    <span className="text-sm text-brand-body group-hover:text-brand-ink">{c.name}</span>
                  </span>
                  <span className="text-[10px] text-brand-mute tabular-nums">{c.count}</span>
                </label>
              ))}
            </div>
          </div>
        </aside>

        <div className="lg:col-span-9">
          <div className="flex items-center justify-between border-b border-brand-line pb-3 mb-2">
            <p className="text-sm text-brand-body">Showing <span className="text-brand-ink font-medium">{results.length}</span> result{results.length !== 1 && 's'}</p>
            <div className="flex items-center gap-2">
              <ArrowUpDown size={14} className="text-brand-mute" />
              <select value={sort} onChange={(e) => setSort(e.target.value)} className="bg-transparent text-sm uppercase tracking-widest text-brand-ink outline-none border-b border-transparent hover:border-brand-line" data-testid="sort-select">
                {sorts.map((s) => <option key={s.k} value={s.k}>{s.label}</option>)}
              </select>
            </div>
          </div>

          {results.length > 0 ? (
            <div className="border-x border-b border-brand-line">
              {results.map((qq) => <QuestionCard key={qq.id} q={qq} />)}
            </div>
          ) : (
            <div className="border border-brand-line bg-white p-12 md:p-20 text-center" data-testid="search-empty">
              <p className="label-eyebrow mb-6">Empty stacks</p>
              <h2 className="font-serif text-4xl md:text-5xl text-brand-ink mb-4 tracking-tight">No matches found.</h2>
              <p className="text-brand-body max-w-md mx-auto mb-8">
                The library has nothing under "{q}" with the current filters. Try widening your search — or be the first to ask.
              </p>
              <div className="flex gap-3 justify-center">
                <button onClick={clear} className="border border-brand-line px-6 py-3 text-sm hover:border-brand-ink" data-testid="empty-clear-btn">Clear filters</button>
                <Link to="/ask" className="bg-brand-ink text-brand-paper px-6 py-3 text-sm hover:bg-brand-blue transition-colors" data-testid="empty-ask-btn">Ask this question</Link>
              </div>
            </div>
          )}
        </div>
      </section>
    </PageShell>
  );
}
