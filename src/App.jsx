import React, { useState, useEffect, useMemo, useCallback, useRef, createContext, useContext } from "react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Cell,
} from "recharts";
import Papa from "papaparse";
import { storage } from "./storage";
import {
  Plus, X, TrendingUp, TrendingDown, Trash2, Filter, LayoutDashboard,
  NotebookPen, BarChart3, Plug, UploadCloud, CheckCircle2, AlertCircle, Sun, Moon,
} from "lucide-react";

// ---- design tokens (light + dark) --------------------------------------
const DARK = {
  bg: "#0F1115", surface: "#161A21", surfaceRaised: "#1D222B", line: "#2A3039",
  ink: "#E9E6DF", inkDim: "#8B93A1", amber: "#C98A4B", amberDim: "#8C6238",
  win: "#6E9C7D", loss: "#B5544A", winBg: "rgba(110,156,125,0.12)", lossBg: "rgba(181,84,74,0.12)",
};
const LIGHT = {
  bg: "#F6F4EF", surface: "#FFFFFF", surfaceRaised: "#FBFAF6", line: "#E2DDD2",
  ink: "#211D17", inkDim: "#847C6D", amber: "#B0632B", amberDim: "#D9B48C",
  win: "#3E7A55", loss: "#A23B30", winBg: "rgba(62,122,85,0.10)", lossBg: "rgba(162,59,48,0.10)",
};
const ThemeCtx = createContext(DARK);
const FONTS =
  "@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=IBM+Plex+Mono:wght@400;500;600&family=Inter:wght@400;500;600&display=swap');";
const mono = { fontFamily: "'IBM Plex Mono', monospace" };
const display = { fontFamily: "'Space Grotesk', sans-serif" };

const INSTRUMENTS = [
  "Volatility 10 Index", "Volatility 25 Index", "Volatility 50 Index", "Volatility 75 Index", "Volatility 100 Index",
  "Volatility 10 (1s) Index", "Volatility 25 (1s) Index", "Volatility 50 (1s) Index", "Volatility 75 (1s) Index",
  "Volatility 100 (1s) Index", "Volatility 150 (1s) Index", "Volatility 250 (1s) Index",
  "XAUUSD", "BTCUSD",
];
const SETUPS = ["Cassure retest"];
const DAYS = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];

const emptyForm = {
  date: new Date().toISOString().slice(0, 10), instrument: INSTRUMENTS[0], direction: "Buy",
  entry: "", sl: "", tp: "", lot: "", result: "", unit: "R", respectedPlan: "yes", setups: [], note: "",
};

export default function App() {
  const [view, setView] = useState("dashboard");
  const [trades, setTrades] = useState(null);
  const [saveError, setSaveError] = useState(false);
  const [theme, setTheme] = useState("light");
  const C = theme === "light" ? LIGHT : DARK;

  useEffect(() => {
    (async () => {
      try {
        const res = await storage.get("journal_trades");
        setTrades(res ? JSON.parse(res.value) : []);
      } catch { setTrades([]); }
      try {
        const t = await storage.get("journal_theme");
        if (t) setTheme(t.value);
      } catch { /* keep default */ }
    })();
  }, []);

  const persist = useCallback(async (next) => {
    setTrades(next);
    try {
      const res = await storage.set("journal_trades", JSON.stringify(next));
      setSaveError(!res);
    } catch { setSaveError(true); }
  }, []);

  const toggleTheme = () => {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    storage.set("journal_theme", next).catch(() => {});
  };

  if (trades === null) {
    return (
      <div style={{ background: C.bg, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: C.inkDim, fontFamily: "Inter, sans-serif" }}>
        <style>{FONTS}</style>
        Chargement…
      </div>
    );
  }

  return (
    <ThemeCtx.Provider value={C}>
      <div style={{ background: C.bg, minHeight: "100vh", color: C.ink, fontFamily: "'Inter', sans-serif", transition: "background .15s ease, color .15s ease" }}>
        <style>{FONTS}</style>
        <TopBar view={view} setView={setView} tradeCount={trades.length} theme={theme} toggleTheme={toggleTheme} />
        <div style={{ maxWidth: 960, margin: "0 auto", padding: "24px" }}>
          {view === "dashboard" && <Dashboard trades={trades} />}
          {view === "journal" && <Journal trades={trades} persist={persist} />}
          {view === "stats" && <Stats trades={trades} />}
          {view === "connect" && <Connect trades={trades} persist={persist} />}
          {saveError && (
            <p style={{ color: C.loss, fontSize: 12, marginTop: 16, ...mono }}>
              La sauvegarde a échoué — vérifie ta connexion.
            </p>
          )}
        </div>
      </div>
    </ThemeCtx.Provider>
  );
}

// ---- nav ---------------------------------------------------------------
function TopBar({ view, setView, tradeCount, theme, toggleTheme }) {
  const C = useContext(ThemeCtx);
  const tabs = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "journal", label: "Journal", icon: NotebookPen },
    { id: "stats", label: "Statistiques", icon: BarChart3 },
    { id: "connect", label: "Connexion MT5", icon: Plug },
  ];
  return (
    <div style={{ borderBottom: `1px solid ${C.line}`, position: "sticky", top: 0, background: C.bg, zIndex: 10 }}>
      <div style={{ maxWidth: 960, margin: "0 auto", padding: "18px 24px 0", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
          <span style={{ ...display, fontWeight: 700, fontSize: 20, letterSpacing: "-0.01em" }}>Ledger</span>
          <span style={{ ...mono, fontSize: 11, color: C.inkDim }}>journal · synthétiques</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <span style={{ ...mono, fontSize: 11, color: C.inkDim }}>{tradeCount} trade{tradeCount !== 1 ? "s" : ""} enregistré{tradeCount !== 1 ? "s" : ""}</span>
          <button
            onClick={toggleTheme}
            title={theme === "light" ? "Passer en sombre" : "Passer en clair"}
            style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 30, height: 30, borderRadius: 7, border: `1px solid ${C.line}`, background: C.surface, color: C.amber, cursor: "pointer" }}
          >
            {theme === "light" ? <Moon size={14} /> : <Sun size={14} />}
          </button>
        </div>
      </div>
      <div style={{ maxWidth: 960, margin: "0 auto", padding: "14px 24px 0", display: "flex", gap: 4 }}>
        {tabs.map((t) => {
          const Icon = t.icon;
          const active = view === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setView(t.id)}
              style={{
                display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer",
                padding: "8px 12px", fontSize: 13, color: active ? C.amber : C.inkDim,
                borderBottom: `2px solid ${active ? C.amber : "transparent"}`, fontFamily: "'Inter', sans-serif", fontWeight: 500,
              }}
            >
              <Icon size={14} /> {t.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ---- shared bits ---------------------------------------------------------------
function StatCard({ label, value, color }) {
  const C = useContext(ThemeCtx);
  return (
    <div style={{ background: C.surface, border: `1px solid ${C.line}`, borderRadius: 8, padding: "12px 14px" }}>
      <div style={{ fontSize: 11, color: C.inkDim, textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</div>
      <div style={{ ...mono, fontSize: 20, fontWeight: 600, color: color || C.ink, marginTop: 2 }}>{value}</div>
    </div>
  );
}
function TagChip({ label, active, onClick }) {
  const C = useContext(ThemeCtx);
  return (
    <button onClick={onClick} style={{
      fontSize: 12, padding: "5px 10px", borderRadius: 999, cursor: "pointer",
      border: `1px solid ${active ? C.amber : C.line}`, background: active ? (C.bg === LIGHT.bg ? "rgba(176,99,43,0.10)" : "rgba(201,138,75,0.14)") : "transparent",
      color: active ? C.amber : C.inkDim, ...mono, transition: "all .15s ease",
    }}>{label}</button>
  );
}
function EmptyNote({ text }) {
  const C = useContext(ThemeCtx);
  return <div style={{ border: `1px dashed ${C.line}`, borderRadius: 8, padding: 24, textAlign: "center", color: C.inkDim, fontSize: 13 }}>{text}</div>;
}
function computeStats(trades) {
  const n = trades.length;
  const wins = trades.filter((t) => t.result > 0);
  const losses = trades.filter((t) => t.result <= 0);
  const rTrades = trades.filter((t) => t.unit === "R");
  const usdTrades = trades.filter((t) => t.unit === "usd");
  const netR = rTrades.reduce((s, t) => s + t.result, 0);
  const netUsd = usdTrades.reduce((s, t) => s + t.result, 0);
  const winRate = n ? (wins.length / n) * 100 : 0;
  const disciplined = n ? (trades.filter((t) => t.respectedPlan === "yes").length / n) * 100 : 0;
  const avgWinR = rTrades.filter((t) => t.result > 0).length
    ? rTrades.filter((t) => t.result > 0).reduce((s, t) => s + t.result, 0) / rTrades.filter((t) => t.result > 0).length : 0;
  const avgLossR = rTrades.filter((t) => t.result <= 0).length
    ? rTrades.filter((t) => t.result <= 0).reduce((s, t) => s + t.result, 0) / rTrades.filter((t) => t.result <= 0).length : 0;
  return { n, wins, losses, netR, netUsd, winRate, disciplined, avgWinR, avgLossR };
}

// ---- dashboard ---------------------------------------------------------------
function Dashboard({ trades }) {
  const C = useContext(ThemeCtx);
  const stats = useMemo(() => computeStats(trades), [trades]);
  const curve = useMemo(() => {
    const chrono = [...trades].filter((t) => t.unit === "R").reverse();
    let cum = 0;
    return chrono.map((t, i) => { cum += t.result; return { i: i + 1, r: parseFloat(cum.toFixed(2)) }; });
  }, [trades]);
  const recent = trades.slice(0, 5);

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 12 }}>
        <StatCard label="Trades" value={stats.n} />
        <StatCard label="Win rate" value={`${stats.winRate.toFixed(0)}%`} color={stats.winRate >= 50 ? C.win : C.loss} />
        <StatCard label="R net" value={`${stats.netR >= 0 ? "+" : ""}${stats.netR.toFixed(1)}R`} color={stats.netR >= 0 ? C.win : C.loss} />
        <StatCard label="Plan respecté" value={`${stats.disciplined.toFixed(0)}%`} color={C.amber} />
      </div>

      {curve.length > 1 ? (
        <div style={{ height: 140, marginTop: 20, background: C.surface, border: `1px solid ${C.line}`, borderRadius: 10, padding: "14px 10px" }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={curve} margin={{ top: 4, right: 8, left: 4, bottom: 0 }}>
              <defs>
                <linearGradient id="curveFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={C.amber} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={C.amber} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke={C.line} vertical={false} />
              <ReferenceLine y={0} stroke={C.line} />
              <XAxis dataKey="i" hide />
              <YAxis hide domain={["dataMin - 1", "dataMax + 1"]} />
              <Tooltip contentStyle={{ background: C.surfaceRaised, border: `1px solid ${C.line}`, borderRadius: 6, ...mono, fontSize: 12, color: C.ink }}
                labelFormatter={(l) => `Trade #${l}`} formatter={(v) => [`${v}R`, "Cumulé"]} />
              <Area type="monotone" dataKey="r" stroke={C.amber} strokeWidth={2} fill="url(#curveFill)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div style={{ marginTop: 20 }}><EmptyNote text="Ajoute au moins deux trades chiffrés en R pour voir ta courbe d'équité." /></div>
      )}

      <div style={{ marginTop: 24 }}>
        <div style={{ ...display, fontWeight: 600, fontSize: 14, marginBottom: 10 }}>Derniers trades</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {recent.length === 0 && <EmptyNote text="Aucun trade pour l'instant. Va dans l'onglet Journal pour en ajouter un." />}
          {recent.map((t) => <TradeRow key={t.id} t={t} compact />)}
        </div>
      </div>
    </div>
  );
}

// ---- journal ---------------------------------------------------------------
function Journal({ trades, persist }) {
  const C = useContext(ThemeCtx);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [activeTag, setActiveTag] = useState(null);

  const addTrade = () => {
    if (!form.entry || form.result === "") return;
    const t = { ...form, id: Date.now(), result: parseFloat(form.result) || 0, source: "manuel" };
    persist([t, ...trades]);
    setForm(emptyForm); setFormOpen(false);
  };
  const removeTrade = (id) => persist(trades.filter((t) => t.id !== id));
  const toggleSetup = (s) => setForm((f) => f.setups.includes(s) ? { ...f, setups: f.setups.filter((x) => x !== s) } : { ...f, setups: [...f.setups, s] });
  const filtered = activeTag ? trades.filter((t) => t.setups?.includes(activeTag)) : trades;

  return (
    <div>
      {!formOpen ? (
        <button onClick={() => setFormOpen(true)} style={{
          display: "flex", alignItems: "center", gap: 8, background: C.surface, border: `1px solid ${C.line}`,
          color: C.amber, padding: "10px 16px", borderRadius: 8, ...display, fontWeight: 600, fontSize: 14, cursor: "pointer",
        }}><Plus size={16} /> Ajouter un trade</button>
      ) : (
        <TradeForm form={form} setForm={setForm} toggleSetup={toggleSetup} onCancel={() => { setFormOpen(false); setForm(emptyForm); }} onSave={addTrade} />
      )}

      {trades.length > 0 && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginTop: 24, marginBottom: 12 }}>
          <Filter size={14} color={C.inkDim} />
          <TagChip label="Tous" active={!activeTag} onClick={() => setActiveTag(null)} />
          {SETUPS.map((s) => <TagChip key={s} label={s} active={activeTag === s} onClick={() => setActiveTag(s === activeTag ? null : s)} />)}
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 8 }}>
        {filtered.length === 0 && trades.length > 0 && <EmptyNote text="Aucun trade avec ce tag." />}
        {trades.length === 0 && <EmptyNote text="Aucun trade enregistré. Ajoute-en un, ou importe ton historique MT5 depuis l'onglet Connexion." />}
        {filtered.map((t) => <TradeRow key={t.id} t={t} onDelete={() => removeTrade(t.id)} />)}
      </div>
    </div>
  );
}

function TradeRow({ t, onDelete, compact }) {
  const C = useContext(ThemeCtx);
  const win = t.result > 0;
  const resultLabel = t.unit === "usd" ? `${win ? "+" : ""}${t.result}$` : `${win ? "+" : ""}${t.result}R`;
  return (
    <div style={{ background: C.surface, border: `1px solid ${C.line}`, borderRadius: 8, padding: compact ? "10px 14px" : "14px 16px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ ...display, fontWeight: 600, fontSize: 14 }}>{t.instrument}</span>
            <span style={{ fontSize: 11, color: C.inkDim, ...mono }}>{t.date}</span>
            <span style={{ fontSize: 11, padding: "1px 7px", borderRadius: 4, background: t.direction === "Buy" ? C.winBg : C.lossBg, color: t.direction === "Buy" ? C.win : C.loss, ...mono }}>{t.direction}</span>
            {t.source === "mt5" && <span style={{ fontSize: 10, color: C.amber, border: `1px solid ${C.amberDim}`, borderRadius: 4, padding: "1px 6px" }}>MT5</span>}
          </div>
          {!compact && t.setups?.length > 0 && (
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
              {t.setups.map((s) => <span key={s} style={{ fontSize: 11, color: C.amber, border: `1px solid ${C.amberDim}`, borderRadius: 999, padding: "2px 8px" }}>{s}</span>)}
            </div>
          )}
          {!compact && t.note && <p style={{ fontSize: 13, color: C.inkDim, marginTop: 8, maxWidth: 560 }}>{t.note}</p>}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 4, color: win ? C.win : C.loss, ...mono, fontWeight: 600, fontSize: 15 }}>
            {win ? <TrendingUp size={14} /> : <TrendingDown size={14} />} {resultLabel}
          </div>
          {onDelete && <button onClick={onDelete} style={{ background: "none", border: "none", color: C.inkDim, cursor: "pointer", padding: 4 }}><Trash2 size={14} /></button>}
        </div>
      </div>
    </div>
  );
}

function TradeForm({ form, setForm, toggleSetup, onCancel, onSave }) {
  const C = useContext(ThemeCtx);
  const field = (label, children) => <label style={{ display: "flex", flexDirection: "column", gap: 5, fontSize: 12, color: C.inkDim }}>{label}{children}</label>;
  const inputStyle = { background: C.bg, border: `1px solid ${C.line}`, borderRadius: 6, padding: "8px 10px", color: C.ink, ...mono, fontSize: 13, outline: "none" };
  return (
    <div style={{ background: C.surfaceRaised, border: `1px solid ${C.line}`, borderRadius: 10, padding: 18 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <span style={{ ...display, fontWeight: 600, fontSize: 15 }}>Nouveau trade</span>
        <button onClick={onCancel} style={{ background: "none", border: "none", color: C.inkDim, cursor: "pointer" }}><X size={16} /></button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12 }}>
        {field("Date", <input type="date" style={inputStyle} value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />)}
        {field("Instrument", <select style={inputStyle} value={form.instrument} onChange={(e) => setForm({ ...form, instrument: e.target.value })}>{INSTRUMENTS.map((i) => <option key={i} value={i}>{i}</option>)}</select>)}
        {field("Direction", <select style={inputStyle} value={form.direction} onChange={(e) => setForm({ ...form, direction: e.target.value })}><option>Buy</option><option>Sell</option></select>)}
        {field("Entrée", <input style={inputStyle} value={form.entry} onChange={(e) => setForm({ ...form, entry: e.target.value })} placeholder="prix" />)}
        {field("Stop loss", <input style={inputStyle} value={form.sl} onChange={(e) => setForm({ ...form, sl: e.target.value })} placeholder="prix" />)}
        {field("Take profit", <input style={inputStyle} value={form.tp} onChange={(e) => setForm({ ...form, tp: e.target.value })} placeholder="prix" />)}
        {field("Lot", <input style={inputStyle} value={form.lot} onChange={(e) => setForm({ ...form, lot: e.target.value })} placeholder="0.10" />)}
        {field("Unité résultat", <select style={inputStyle} value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })}><option value="R">En R</option><option value="usd">En $</option></select>)}
        {field("Résultat", <input style={inputStyle} value={form.result} onChange={(e) => setForm({ ...form, result: e.target.value })} placeholder="ex: 2 ou -1" />)}
        {field("Plan respecté ?", <select style={inputStyle} value={form.respectedPlan} onChange={(e) => setForm({ ...form, respectedPlan: e.target.value })}><option value="yes">Oui</option><option value="no">Non</option></select>)}
      </div>
      <div style={{ marginTop: 14 }}>
        <div style={{ fontSize: 12, color: C.inkDim, marginBottom: 6 }}>Concepts observés</div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>{SETUPS.map((s) => <TagChip key={s} label={s} active={form.setups.includes(s)} onClick={() => toggleSetup(s)} />)}</div>
      </div>
      <div style={{ marginTop: 14 }}>
        {field("Note / leçon", <textarea style={{ ...inputStyle, fontFamily: "'Inter', sans-serif", minHeight: 60, resize: "vertical" }} value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder="Contexte, ce qui a bien/mal fonctionné…" />)}
      </div>
      <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
        <button onClick={onSave} style={{ background: C.amber, color: "#FFFFFF", border: "none", borderRadius: 6, padding: "9px 18px", ...display, fontWeight: 600, fontSize: 13, cursor: "pointer" }}>Enregistrer</button>
        <button onClick={onCancel} style={{ background: "none", color: C.inkDim, border: `1px solid ${C.line}`, borderRadius: 6, padding: "9px 18px", fontSize: 13, cursor: "pointer" }}>Annuler</button>
      </div>
    </div>
  );
}

// ---- stats ---------------------------------------------------------------
function Stats({ trades }) {
  const C = useContext(ThemeCtx);
  const stats = useMemo(() => computeStats(trades), [trades]);
  const byInstrument = useMemo(() => {
    const map = {};
    trades.filter((t) => t.unit === "R").forEach((t) => { map[t.instrument] = (map[t.instrument] || 0) + t.result; });
    return Object.entries(map).map(([name, r]) => ({ name: name.replace(" Index", ""), r: parseFloat(r.toFixed(1)) }));
  }, [trades]);
  const bySetup = useMemo(() => {
    const map = {};
    trades.forEach((t) => (t.setups || []).forEach((s) => {
      if (!map[s]) map[s] = { win: 0, total: 0 };
      map[s].total += 1; if (t.result > 0) map[s].win += 1;
    }));
    return Object.entries(map).map(([name, v]) => ({ name, winRate: Math.round((v.win / v.total) * 100), total: v.total }));
  }, [trades]);
  const byDay = useMemo(() => {
    const map = {};
    trades.filter((t) => t.unit === "R").forEach((t) => {
      const d = DAYS[new Date(t.date).getDay()];
      map[d] = (map[d] || 0) + t.result;
    });
    return DAYS.map((d) => ({ name: d, r: parseFloat((map[d] || 0).toFixed(1)) }));
  }, [trades]);

  if (trades.length === 0) return <EmptyNote text="Ajoute des trades pour voir tes statistiques." />;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 12 }}>
        <StatCard label="Gain moyen" value={`+${stats.avgWinR.toFixed(2)}R`} color={C.win} />
        <StatCard label="Perte moyenne" value={`${stats.avgLossR.toFixed(2)}R`} color={C.loss} />
        <StatCard label="Trades gagnants" value={stats.wins.length} color={C.win} />
        <StatCard label="Trades perdants" value={stats.losses.length} color={C.loss} />
      </div>

      <ChartBlock title="R net par instrument">
        <BarChart data={byInstrument} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid stroke={C.line} vertical={false} />
          <XAxis dataKey="name" tick={{ fill: C.inkDim, fontSize: 10 }} axisLine={{ stroke: C.line }} tickLine={false} interval={0} angle={-20} textAnchor="end" height={50} />
          <YAxis tick={{ fill: C.inkDim, fontSize: 10 }} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={{ background: C.surfaceRaised, border: `1px solid ${C.line}`, borderRadius: 6, ...mono, fontSize: 12, color: C.ink }} formatter={(v) => [`${v}R`, "Net"]} />
          <ReferenceLine y={0} stroke={C.line} />
          <Bar dataKey="r" radius={[3, 3, 0, 0]}>
            {byInstrument.map((e, i) => <Cell key={i} fill={e.r >= 0 ? C.win : C.loss} />)}
          </Bar>
        </BarChart>
      </ChartBlock>

      <ChartBlock title="R net par jour de la semaine">
        <BarChart data={byDay} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid stroke={C.line} vertical={false} />
          <XAxis dataKey="name" tick={{ fill: C.inkDim, fontSize: 11 }} axisLine={{ stroke: C.line }} tickLine={false} />
          <YAxis tick={{ fill: C.inkDim, fontSize: 10 }} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={{ background: C.surfaceRaised, border: `1px solid ${C.line}`, borderRadius: 6, ...mono, fontSize: 12, color: C.ink }} formatter={(v) => [`${v}R`, "Net"]} />
          <ReferenceLine y={0} stroke={C.line} />
          <Bar dataKey="r" radius={[3, 3, 0, 0]}>
            {byDay.map((e, i) => <Cell key={i} fill={e.r >= 0 ? C.win : C.loss} />)}
          </Bar>
        </BarChart>
      </ChartBlock>

      <div>
        <div style={{ ...display, fontWeight: 600, fontSize: 14, marginBottom: 10 }}>Win rate par concept</div>
        {bySetup.length === 0 ? <EmptyNote text="Tague tes trades avec des concepts pour voir cette analyse." /> : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {bySetup.sort((a, b) => b.winRate - a.winRate).map((s) => (
              <div key={s.name} style={{ display: "flex", alignItems: "center", gap: 12, background: C.surface, border: `1px solid ${C.line}`, borderRadius: 8, padding: "10px 14px" }}>
                <span style={{ flex: 1, fontSize: 13 }}>{s.name}</span>
                <span style={{ fontSize: 11, color: C.inkDim, ...mono }}>{s.total} trade{s.total > 1 ? "s" : ""}</span>
                <span style={{ ...mono, fontWeight: 600, fontSize: 14, color: s.winRate >= 50 ? C.win : C.loss, minWidth: 44, textAlign: "right" }}>{s.winRate}%</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
function ChartBlock({ title, children }) {
  const C = useContext(ThemeCtx);
  return (
    <div>
      <div style={{ ...display, fontWeight: 600, fontSize: 14, marginBottom: 10 }}>{title}</div>
      <div style={{ height: 180, background: C.surface, border: `1px solid ${C.line}`, borderRadius: 10, padding: "12px 6px" }}>
        <ResponsiveContainer width="100%" height="100%">{children}</ResponsiveContainer>
      </div>
    </div>
  );
}

// ---- connect (MT5) ---------------------------------------------------------------
function Connect({ trades, persist }) {
  const C = useContext(ThemeCtx);
  const [status, setStatus] = useState(null);
  const fileRef = useRef(null);

  const handleFile = (file) => {
    Papa.parse(file, {
      header: true, skipEmptyLines: true,
      complete: (res) => {
        try {
          const rows = res.data;
          const mapped = rows.map((r, idx) => {
            const symbol = r.Symbol || r.symbol || r["Symbole"] || "Inconnu";
            const type = (r.Type || r.type || "").toLowerCase();
            const profit = parseFloat(r.Profit || r.profit || r["Profit ($)"] || 0) || 0;
            const time = r.Time || r.time || r["Heure d'ouverture"] || new Date().toISOString();
            return {
              id: Date.now() + idx,
              date: new Date(time).toISOString().slice(0, 10) || new Date().toISOString().slice(0, 10),
              instrument: symbol,
              direction: type.includes("sell") ? "Sell" : "Buy",
              entry: r.Price || r["Prix"] || "",
              sl: r["S/L"] || "",
              tp: r["T/P"] || "",
              lot: r.Volume || r["Volume"] || "",
              unit: "usd",
              result: profit,
              respectedPlan: "yes",
              setups: [],
              note: "",
              source: "mt5",
            };
          }).filter((t) => t.entry !== "" || t.result !== 0);

          if (mapped.length === 0) {
            setStatus({ type: "error", msg: "Aucune ligne exploitable trouvée. Vérifie que le CSV contient bien les colonnes Symbol, Type, Profit." });
            return;
          }
          persist([...mapped, ...trades]);
          setStatus({ type: "ok", msg: `${mapped.length} trade(s) importé(s) depuis ton historique MT5.` });
        } catch (e) {
          setStatus({ type: "error", msg: "Le fichier n'a pas pu être lu. Vérifie qu'il s'agit bien d'un export CSV MT5." });
        }
      },
      error: () => setStatus({ type: "error", msg: "Le fichier n'a pas pu être lu." }),
    });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div>
        <div style={{ ...display, fontWeight: 600, fontSize: 16, marginBottom: 6 }}>Importer ton historique MT5</div>
        <p style={{ fontSize: 13, color: C.inkDim, maxWidth: 600 }}>
          MetaTrader ne permet pas de connexion directe depuis un navigateur. La méthode la plus fiable : exporte ton historique
          depuis MT5 (onglet Historique du compte → clic droit → Rapport → Enregistrer en CSV), puis importe le fichier ici.
        </p>
        <div
          onClick={() => fileRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => { e.preventDefault(); if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]); }}
          style={{
            marginTop: 14, border: `1px dashed ${C.line}`, borderRadius: 10, padding: "28px 20px",
            textAlign: "center", cursor: "pointer", color: C.inkDim,
          }}
        >
          <UploadCloud size={22} style={{ marginBottom: 8, color: C.amber }} />
          <div style={{ fontSize: 13 }}>Clique ou dépose ton fichier CSV ici</div>
          <input ref={fileRef} type="file" accept=".csv" style={{ display: "none" }} onChange={(e) => e.target.files[0] && handleFile(e.target.files[0])} />
        </div>
        {status && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 12, fontSize: 13, color: status.type === "ok" ? C.win : C.loss }}>
            {status.type === "ok" ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />} {status.msg}
          </div>
        )}
      </div>

      <div style={{ borderTop: `1px solid ${C.line}`, paddingTop: 20 }}>
        <div style={{ ...display, fontWeight: 600, fontSize: 16, marginBottom: 6 }}>Synchronisation automatique (avancé)</div>
        <p style={{ fontSize: 13, color: C.inkDim, maxWidth: 600, marginBottom: 10 }}>
          Pour un envoi automatique à chaque trade fermé, un petit script (Expert Advisor) tourne sur ton terminal MT5 et
          envoie chaque trade vers une adresse de réception dès qu'il se ferme. C'est la même logique que les journaux
          automatiques du marché — mais ça demande un backend pour recevoir les données, qu'on peut construire ensemble
          si tu veux aller plus loin.
        </p>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <span style={{ fontSize: 11, color: C.amber, border: `1px solid ${C.amberDim}`, borderRadius: 999, padding: "3px 10px" }}>MQL5 · WebRequest()</span>
          <span style={{ fontSize: 11, color: C.amber, border: `1px solid ${C.amberDim}`, borderRadius: 999, padding: "3px 10px" }}>Webhook temps réel</span>
        </div>
      </div>
    </div>
  );
}
