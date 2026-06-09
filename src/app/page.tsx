"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { SIGNS, type Sign } from "@/lib/astrology";

type PlanetRecord = {
  id: string;
  label: string;
  sortOrder: number;
  isActive: boolean;
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
  house: number;
  sign: Sign;
};

type PositionInput = {
  planetId: string;
  house: number;
  sign: Sign;
};

export default function Home() {
  const [planets, setPlanets] = useState<PlanetRecord[]>([]);
  const [people, setPeople] = useState<Person[]>([]);
  const [selectedPersonId, setSelectedPersonId] = useState("");
  const [positions, setPositions] = useState<PositionInput[]>([]);
  const [personName, setPersonName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const selectedPerson = useMemo(
    () => people.find((person) => person.id === selectedPersonId),
    [people, selectedPersonId],
  );
  const activePlanets = useMemo(() => planets.filter((planet) => planet.isActive), [planets]);
  const planetById = useMemo(() => new Map(planets.map((planet) => [planet.id, planet])), [planets]);

  useEffect(() => {
    void loadInitialData();
  }, []);

  useEffect(() => {
    if (!selectedPerson) {
      return;
    }

    setPositions(buildPositionInputs(activePlanets, selectedPerson));
  }, [activePlanets, selectedPerson]);

  async function loadInitialData() {
    const [planetsResponse, peopleResponse] = await Promise.all([fetch("/api/planets"), fetch("/api/person")]);
    const [planetsData, peopleData] = (await Promise.all([
      planetsResponse.json(),
      peopleResponse.json(),
    ])) as [PlanetRecord[], Person[]];

    setPlanets(planetsData);
    setPeople(peopleData);

    const firstPerson = peopleData[0];
    if (firstPerson) {
      setSelectedPersonId(firstPerson.id);
    } else {
      setPositions(buildPositionInputs(planetsData.filter((planet) => planet.isActive)));
    }
  }

  async function refreshPeople() {
    const response = await fetch("/api/person");
    const data = (await response.json()) as Person[];
    setPeople(data);

    if (!selectedPersonId && data[0]) {
      setSelectedPersonId(data[0].id);
    }
  }

  async function handleCreatePerson(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await runAction(async () => {
      const response = await fetch("/api/person", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: personName, birthDate, notes }),
      });
      const person = (await response.json()) as Person;
      setSelectedPersonId(person.id);
      setPersonName("");
      setBirthDate("");
      setNotes("");
      await refreshPeople();
      setStatus("האדם נוצר בהצלחה.");
    });
  }

  async function handleSavePositions() {
    if (!selectedPersonId) {
      setError("בחרי אדם לפני שמירת מיקומי כוכבים.");
      return;
    }

    await runAction(async () => {
      await fetch(`/api/person/${selectedPersonId}/positions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ positions }),
      });
      await refreshPeople();
      setStatus("מיקומי הכוכבים נשמרו.");
    });
  }

  async function handleGenerateReport() {
    if (!selectedPersonId) {
      setError("בחרי אדם לפני יצירת דוח.");
      return;
    }

    await runAction(async () => {
      const response = await fetch("/api/report/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ personId: selectedPersonId }),
      });

      if (!response.ok) {
        const data = (await response.json()) as { message?: string };
        throw new Error(data.message ?? "יצירת הדוח נכשלה.");
      }

      const pdf = await response.blob();
      downloadBlob(pdf, getDownloadFileName(response.headers.get("Content-Disposition")));
      setStatus("הדוח נוצר וירד למחשב.");
    });
  }

  async function runAction(action: () => Promise<void>) {
    setIsLoading(true);
    setError("");
    setStatus("");

    try {
      await action();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "אירעה שגיאה לא צפויה.");
    } finally {
      setIsLoading(false);
    }
  }

  function updatePosition(index: number, field: keyof PositionInput, value: string) {
    setPositions((current) =>
      current.map((position, positionIndex) =>
        positionIndex === index
          ? {
              ...position,
              [field]: field === "house" ? Number(value) : value,
            }
          : position,
      ),
    );
  }

  return (
    <main className="page">
      <header className="hero">
        <h1>מחולל דוחות מפת לידה</h1>
        <p>הזנת נתונים מוכנים, שליפת פרשנות מטבלאות ההגדרות, ויצירת PDF בעברית.</p>
        <p style={{ marginTop: 14 }}>
          <Link className="link-button" href="/settings">
            הגדרות פרשנויות
          </Link>
        </p>
      </header>

      <div className="grid">
        <section className="card">
          <h2>אנשים</h2>
          <form className="form-stack" onSubmit={handleCreatePerson}>
            <div className="field">
              <label>שם</label>
              <input value={personName} onChange={(event) => setPersonName(event.target.value)} required />
            </div>
            <div className="field">
              <label>תאריך לידה</label>
              <input value={birthDate} onChange={(event) => setBirthDate(event.target.value)} />
            </div>
            <div className="field">
              <label>הערות</label>
              <textarea value={notes} onChange={(event) => setNotes(event.target.value)} />
            </div>
            <button disabled={isLoading}>יצירת אדם חדש</button>
          </form>

          <div className="person-list" style={{ marginTop: 18 }}>
            {people.map((person) => (
              <button
                className={`person-button ${person.id === selectedPersonId ? "active" : ""}`}
                key={person.id}
                onClick={() => setSelectedPersonId(person.id)}
                type="button"
              >
                {person.name}
              </button>
            ))}
          </div>
        </section>

        <section className="card">
          <h2>מיקומי כוכבים</h2>
          <div className="table">
            {positions.map((position, index) => (
              <div className="position-row" key={position.planetId}>
                <strong>{planetById.get(position.planetId)?.label ?? "כוכב"}</strong>
                <select value={position.house} onChange={(event) => updatePosition(index, "house", event.target.value)}>
                  {Array.from({ length: 12 }, (_, item) => item + 1).map((house) => (
                    <option value={house} key={house}>
                      בית {house}
                    </option>
                  ))}
                </select>
                <select value={position.sign} onChange={(event) => updatePosition(index, "sign", event.target.value)}>
                  {SIGNS.map((sign) => (
                    <option value={sign.value} key={sign.value}>
                      {sign.label}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
          <button disabled={isLoading || !selectedPersonId} onClick={handleSavePositions} style={{ marginTop: 16 }}>
            שמירת מיקומים
          </button>
          <button disabled={isLoading || !selectedPersonId} onClick={handleGenerateReport} style={{ marginTop: 10 }}>
            Generate Report
          </button>
        </section>
      </div>

      {status ? <p className="status success">{status}</p> : null}
      {error ? <p className="status error">{error}</p> : null}
    </main>
  );
}

function buildPositionInputs(planets: PlanetRecord[], person?: Person): PositionInput[] {
  return planets.map((planet) => {
    const existing = person?.positions.find((position) => position.planetId === planet.id);

    return {
      planetId: planet.id,
      house: existing?.house ?? 1,
      sign: existing?.sign ?? "aries",
    };
  });
}

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
  if (!contentDisposition) {
    return "report.pdf";
  }

  const utf8FileName = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i)?.[1];
  if (utf8FileName) {
    return decodeURIComponent(utf8FileName);
  }

  return contentDisposition.match(/filename="([^"]+)"/i)?.[1] ?? "report.pdf";
}
