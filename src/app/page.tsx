"use client";

import Link from "next/link";
import {
  FormEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { SIGNS, type Sign } from "@/lib/astrology";

// ─── Types ───────────────────────────────────────────────────────────────────

type PlanetRecord = {
  id: string;
  label: string;
  sortOrder: number;
  isActive: boolean;
  houseOnly: boolean;
};

type Person = {
  id: string;
  name: string;
  birthDate: string | null;
  notes: string | null;
  positions: Position[];
};

type Position = {
  id: string;
  planetId: string;
  planet: PlanetRecord;
  house: number | null;
  sign: Sign | null;
};

type PositionInput = {
  planetId: string;
  house: number | null;
  sign: Sign | null;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function signLabel(sign: Sign | null): string {
  return SIGNS.find((s) => s.value === sign)?.label ?? "";
}

function buildEmptyPositions(planets: PlanetRecord[]): PositionInput[] {
  return planets.map((p) => ({ planetId: p.id, house: null, sign: null }));
}

function loadPersonPositions(planets: PlanetRecord[], person: Person): PositionInput[] {
  return planets.map((planet) => {
    const existing = person.positions.find((pos) => pos.planetId === planet.id);
    return { planetId: planet.id, house: existing?.house ?? null, sign: existing?.sign ?? null };
  });
}

// ─── SignCombobox ─────────────────────────────────────────────────────────────
// Custom searchable dropdown for signs: type to filter, click to select.

function SignCombobox({
  value,
  onChange,
}: {
  value: Sign | null;
  onChange: (sign: Sign | null) => void;
}) {
  const [text, setText] = useState(signLabel(value));
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  // Sync display text when value is updated externally
  useEffect(() => {
    setText(signLabel(value));
  }, [value]);

  const filtered = useMemo(() => {
    const q = text.trim();
    if (!q) return SIGNS;
    return SIGNS.filter((s) => s.label.includes(q));
  }, [text]);

  // Close on outside click; revert display if text doesn't match
  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
        setText(signLabel(value)); // revert to last valid value
      }
    }
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, [value]);

  function handleInput(raw: string) {
    setText(raw);
    setOpen(true);
    const exact = SIGNS.find((s) => s.label === raw.trim());
    onChange(exact?.value ?? null);
  }

  function handleSelect(sign: (typeof SIGNS)[number]) {
    setText(sign.label);
    onChange(sign.value);
    setOpen(false);
  }

  return (
    <div ref={wrapRef} className="cbx-wrap">
      <input
        className="pos-input"
        value={text}
        placeholder="—"
        autoComplete="off"
        onChange={(e) => handleInput(e.target.value)}
        onFocus={() => setOpen(true)}
      />
      {open && filtered.length > 0 && (
        <div className="cbx-drop">
          {filtered.map((s) => (
            <div
              key={s.value}
              className={`cbx-opt ${value === s.value ? "cbx-opt-active" : ""}`}
              // mouseDown before blur so value is registered before the dropdown hides
              onMouseDown={(e) => {
                e.preventDefault();
                handleSelect(s);
              }}
            >
              {s.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── PositionsTable ───────────────────────────────────────────────────────────

function PositionsTable({
  positions,
  planetById,
  onHouseChange,
  onSignChange,
}: {
  positions: PositionInput[];
  planetById: Map<string, PlanetRecord>;
  onHouseChange: (index: number, house: number | null) => void;
  onSignChange: (index: number, sign: Sign | null) => void;
}) {
  return (
    <div className="pos-table">
      <div className="pos-header">
        <span>כוכב</span>
        <span>בית</span>
        <span>מזל</span>
        <span />
      </div>
      {positions.map((pos, index) => {
        const planet = planetById.get(pos.planetId);
        const isHouseOnly = planet?.houseOnly ?? false;
        const complete = isHouseOnly ? pos.house !== null : pos.house !== null && pos.sign !== null;
        const partial = !complete && (pos.house !== null || pos.sign !== null);
        return (
          <div className="pos-row" key={pos.planetId}>
            <span className="pos-planet">{planet?.label ?? "כוכב"}</span>

            {/* House */}
            <input
              className="pos-input pos-input-narrow"
              type="number"
              min={1}
              max={12}
              placeholder="—"
              value={pos.house ?? ""}
              onChange={(e) => {
                const v = e.target.value;
                onHouseChange(
                  index,
                  v === "" ? null : Math.min(12, Math.max(1, Number(v))),
                );
              }}
            />

            {/* Sign — disabled for house-only planets */}
            {isHouseOnly ? (
              <span className="pos-house-only-sign" title="כוכב זה מוגדר כבית בלבד">—</span>
            ) : (
              <SignCombobox
                value={pos.sign}
                onChange={(sign) => onSignChange(index, sign)}
              />
            )}

            {/* Completion dot */}
            <span
              className={`pos-dot ${complete ? "pos-dot-ok" : partial ? "pos-dot-partial" : ""}`}
              title={complete ? "מלא" : partial ? "חלקי" : ""}
            />
          </div>
        );
      })}
      <p className="pos-hint">
        שורות ריקות לחלוטין לא ייכללו בדוח.
      </p>
    </div>
  );
}

// ─── Home ─────────────────────────────────────────────────────────────────────

export default function Home() {
  const [planets, setPlanets] = useState<PlanetRecord[]>([]);
  const [people, setPeople] = useState<Person[]>([]);

  const [personName, setPersonName] = useState("");
  const [positions, setPositions] = useState<PositionInput[]>([]);

  const [modalPerson, setModalPerson] = useState<Person | null>(null);
  const [modalPositions, setModalPositions] = useState<PositionInput[]>([]);

  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const activePlanets = useMemo(() => planets.filter((p) => p.isActive), [planets]);
  const planetById = useMemo(() => new Map(planets.map((p) => [p.id, p])), [planets]);

  useEffect(() => {
    void loadInitialData();
  }, []);

  async function loadInitialData() {
    const [pr, per] = await Promise.all([fetch("/api/planets"), fetch("/api/person")]);
    const [planetsData, peopleData] = (await Promise.all([
      pr.json(),
      per.json(),
    ])) as [PlanetRecord[], Person[]];
    setPlanets(planetsData);
    setPeople(peopleData);
    setPositions(buildEmptyPositions(planetsData.filter((p) => p.isActive)));
  }

  async function refreshPeople() {
    const res = await fetch("/api/person");
    setPeople((await res.json()) as Person[]);
  }

  // ── Position updaters ─────────────────────────────────────────────────────

  function setHouse(index: number, house: number | null) {
    setPositions((cur) => cur.map((p, i) => (i === index ? { ...p, house } : p)));
  }

  function setSign(index: number, sign: Sign | null) {
    setPositions((cur) => cur.map((p, i) => (i === index ? { ...p, sign } : p)));
  }

  function setModalHouse(index: number, house: number | null) {
    setModalPositions((cur) => cur.map((p, i) => (i === index ? { ...p, house } : p)));
  }

  function setModalSign(index: number, sign: Sign | null) {
    setModalPositions((cur) => cur.map((p, i) => (i === index ? { ...p, sign } : p)));
  }

  // ── New report ────────────────────────────────────────────────────────────

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const filled = positions.filter((p) => p.house !== null || p.sign !== null);
    if (filled.length === 0) {
      setError("יש למלא לפחות מיקום כוכב אחד לפני יצירת הדוח.");
      return;
    }
    await runAction(async () => {
      const personRes = await fetch("/api/person", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: personName, birthDate: null, notes: null }),
      });
      if (!personRes.ok) throw new Error("יצירת האדם נכשלה.");
      const person = (await personRes.json()) as Person;
      await saveAndGenerate(person.id, filled, personName);
      await refreshPeople();
      const name = personName;
      setPersonName("");
      setPositions(buildEmptyPositions(activePlanets));
      setStatus(`הדוח עבור "${name}" נוצר בהצלחה.`);
    });
  }

  // ── Edit modal ────────────────────────────────────────────────────────────

  function openModal(person: Person) {
    setModalPerson(person);
    setModalPositions(loadPersonPositions(activePlanets, person));
    setError("");
    setStatus("");
  }

  function closeModal() {
    setModalPerson(null);
    setModalPositions([]);
  }

  async function handleModalGenerate() {
    if (!modalPerson) return;
    const filled = modalPositions.filter((p) => {
      const planet = planetById.get(p.planetId);
      if (planet?.houseOnly) return p.house !== null;
      return p.house !== null || p.sign !== null;
    });
    if (filled.length === 0) {
      setError("יש למלא לפחות מיקום אחד.");
      return;
    }
    await runAction(async () => {
      await saveAndGenerate(modalPerson.id, filled, modalPerson.name);
      await refreshPeople();
      closeModal();
    });
  }

  // ── Shared ────────────────────────────────────────────────────────────────

  async function saveAndGenerate(personId: string, filled: PositionInput[], name: string) {
    const posRes = await fetch(`/api/person/${personId}/positions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ positions: filled }),
    });
    if (!posRes.ok) throw new Error("שמירת המיקומים נכשלה.");

    const reportRes = await fetch("/api/report/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ personId }),
    });
    if (!reportRes.ok) {
      const data = (await reportRes.json()) as { message?: string };
      throw new Error(data.message ?? "יצירת הדוח נכשלה.");
    }
    const pdf = await reportRes.blob();
    downloadBlob(pdf, getDownloadFileName(reportRes.headers.get("Content-Disposition")));
    setStatus(`הדוח עבור "${name}" נוצר בהצלחה.`);
  }

  async function handleDelete(personId: string, name: string) {
    if (!confirm(`למחוק את הדוח של "${name}"? פעולה זו אינה ניתנת לביטול.`)) return;
    await runAction(async () => {
      const res = await fetch(`/api/person/${personId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("מחיקת הדוח נכשלה.");
      await refreshPeople();
      setStatus(`הדוח של "${name}" נמחק.`);
    });
  }

  async function handleDownload(personId: string, name: string) {
    const person = people.find((p) => p.id === personId);
    if (!person) return;
    const filled = loadPersonPositions(activePlanets, person).filter((p) => {
      const planet = planetById.get(p.planetId);
      if (planet?.houseOnly) return p.house !== null;
      return p.house !== null && p.sign !== null;
    });
    if (filled.length === 0) {
      setError("אין מיקומים מלאים לייצוא דוח.");
      return;
    }
    await runAction(() => saveAndGenerate(personId, filled, name));
  }

  async function runAction(action: () => Promise<void>) {
    setIsLoading(true);
    setError("");
    setStatus("");
    try {
      await action();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "אירעה שגיאה.");
    } finally {
      setIsLoading(false);
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <main className="page">
      <header className="hero">
        <div className="hero-row">
          <div>
            <h1>מחולל דוחות מפת לידה</h1>
            <p>מזינים מיקומי כוכבים ומקבלים דוח PDF בעברית</p>
          </div>
          <Link className="link-button" href="/settings">
            ⚙ הגדרות
          </Link>
        </div>
      </header>

      {status && <div className="msg success">{status}</div>}
      {error && <div className="msg error">{error}</div>}

      <div className="main-grid">

        {/* ── New report ── */}
        <section className="card">
          <h2 className="section-title">דוח חדש</h2>

          <form onSubmit={handleSubmit}>
            <div className="field" style={{ marginBottom: 20 }}>
              <label>שם מלא *</label>
              <input
                placeholder="הכנס שם..."
                value={personName}
                onChange={(e) => setPersonName(e.target.value)}
                required
              />
            </div>

            <p className="subsection-label">מיקומי כוכבים</p>
            <PositionsTable
              positions={positions}
              planetById={planetById}
              onHouseChange={setHouse}
              onSignChange={setSign}
            />

            <button type="submit" className="btn-generate" disabled={isLoading}>
              {isLoading ? "מייצר דוח..." : "צור דוח PDF ↓"}
            </button>
          </form>
        </section>

        {/* ── Past reports ── */}
        <section className="card past-card">
          <h2 className="section-title">
            דוחות קודמים
            {people.length > 0 && <span className="count-badge">{people.length}</span>}
          </h2>

          {people.length === 0 ? (
            <p className="empty-note">עדיין לא נוצרו דוחות.</p>
          ) : (
            <div className="past-list">
              {people.map((person) => (
                <div className="past-row" key={person.id}>
                  <span className="past-name">{person.name}</span>
                  <div className="past-actions">
                    <button
                      type="button"
                      className="btn-sm btn-outline"
                      disabled={isLoading}
                      onClick={() => openModal(person)}
                    >
                      ✎ עריכה
                    </button>
                    <button
                      type="button"
                      className="btn-sm btn-green"
                      disabled={isLoading}
                      onClick={() => handleDownload(person.id, person.name)}
                    >
                      ↓ הורד
                    </button>
                    <button
                      type="button"
                      className="btn-sm btn-red"
                      disabled={isLoading}
                      onClick={() => handleDelete(person.id, person.name)}
                    >
                      🗑 מחק
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

      </div>

      {/* ── Edit modal ── */}
      {modalPerson && (
        <div
          className="modal-backdrop"
          onMouseDown={(e) => e.target === e.currentTarget && closeModal()}
        >
          <div className="modal">
            <div className="modal-header">
              <h3>עריכה: {modalPerson.name}</h3>
              <button type="button" className="btn-close" onClick={closeModal}>
                ✕
              </button>
            </div>

            <p className="subsection-label" style={{ marginTop: 20 }}>מיקומי כוכבים</p>
            <PositionsTable
              positions={modalPositions}
              planetById={planetById}
              onHouseChange={setModalHouse}
              onSignChange={setModalSign}
            />

            <button
              type="button"
              className="btn-generate"
              disabled={isLoading}
              onClick={handleModalGenerate}
            >
              {isLoading ? "מייצר דוח..." : "צור דוח PDF ↓"}
            </button>
          </div>
        </div>
      )}
    </main>
  );
}

// ─── Utils ────────────────────────────────────────────────────────────────────

function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function getDownloadFileName(contentDisposition: string | null) {
  if (!contentDisposition) return "report.pdf";
  const utf8 = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i)?.[1];
  if (utf8) return decodeURIComponent(utf8);
  return contentDisposition.match(/filename="([^"]+)"/i)?.[1] ?? "report.pdf";
}
