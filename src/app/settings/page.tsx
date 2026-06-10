"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getSignLabel, type Sign } from "@/lib/astrology";

type PlanetRecord = {
  id: string;
  label: string;
  sortOrder: number;
  isActive: boolean;
  houseOnly: boolean;
};

type InterpretationColumn = {
  id: string;
  title: string;
  sortOrder: number;
};

type InterpretationCell = {
  id: string;
  rowId: string;
  columnId: string;
  content: string;
};

type InterpretationRow = {
  id: string;
  planetId: string;
  house: number;
  sign: Sign;
  cells: InterpretationCell[];
};

type PlanetSettings = {
  planetId: string;
  planet: PlanetRecord;
  columns: InterpretationColumn[];
  rows: InterpretationRow[];
};

type ImportedFileSettings = {
  planetId: string;
  columnTitle: string;
  rows: Array<{
    house: number;
    content: string;
  }>;
};

type ImportedCsvSettings = {
  planetId: string;
  columns: Array<{
    title: string;
    rows: Array<{
      house: number;
      content: string;
    }>;
  }>;
};

export default function SettingsPage() {
  const [planets, setPlanets] = useState<PlanetRecord[]>([]);
  const [newPlanetLabel, setNewPlanetLabel] = useState("");
  const [isPlanetModalOpen, setIsPlanetModalOpen] = useState(false);
  const [settings, setSettings] = useState<PlanetSettings[]>([]);
  const [activePlanetId, setActivePlanetId] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [hasUnsavedPlanets, setHasUnsavedPlanets] = useState(false);

  const activeSettings = useMemo(
    () => settings.find((item) => item.planetId === activePlanetId),
    [activePlanetId, settings],
  );
  const activePlanets = useMemo(() => planets.filter((planet) => planet.isActive), [planets]);

  useEffect(() => {
    void loadSettings();
  }, []);

  async function loadSettings() {
    await runAction(async () => {
      const [planetsResponse, settingsResponse] = await Promise.all([
        fetch("/api/planets"),
        fetch("/api/settings/interpretations"),
      ]);
      const [planetsData, settingsData] = (await Promise.all([
        planetsResponse.json(),
        settingsResponse.json(),
      ])) as [PlanetRecord[], PlanetSettings[]];

      setPlanets(planetsData);
      setSettings(settingsData);
      if (!activePlanetId && settingsData[0]) {
        setActivePlanetId(settingsData[0].planetId);
      } else if (activePlanetId && !settingsData.some((item) => item.planetId === activePlanetId)) {
        setActivePlanetId(settingsData[0]?.planetId ?? "");
      }
    });
  }

  async function handleSave() {
    if (!activeSettings) {
      return;
    }

    await runAction(async () => {
      const columns = activeSettings.columns.map((column, index) => ({
        clientId: column.id,
        title: column.title,
        sortOrder: index,
      }));

      const cells = activeSettings.rows.flatMap((row) =>
        activeSettings.columns.map((column) => ({
          house: row.house,
          columnClientId: column.id,
          content: getCellContent(row, column.id),
        })),
      );

      const response = await fetch("/api/settings/interpretations", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planetId: activeSettings.planetId,
          columns,
          cells,
        }),
      });
      const saved = (await response.json()) as PlanetSettings;

      setSettings((current) => current.map((item) => (item.planetId === saved.planetId ? saved : item)));
      setHasUnsavedChanges(false);
      setStatus("ההגדרות נשמרו בהצלחה.");
    });
  }

  function addColumn() {
    updateActiveSettings((current) => ({
      ...current,
      columns: [
        ...current.columns,
        {
          id: `new-${Date.now()}`,
          title: "עמודה חדשה",
          sortOrder: current.columns.length,
        },
      ],
    }));
  }

  function updateColumnTitle(columnId: string, title: string) {
    updateActiveSettings((current) => ({
      ...current,
      columns: current.columns.map((column) => (column.id === columnId ? { ...column, title } : column)),
    }));
  }

  function deleteColumn(columnId: string) {
    updateActiveSettings((current) => ({
      ...current,
      columns: current.columns.filter((column) => column.id !== columnId),
      rows: current.rows.map((row) => ({
        ...row,
        cells: row.cells.filter((cell) => cell.columnId !== columnId),
      })),
    }));
  }

  function moveColumn(columnId: string, direction: -1 | 1) {
    updateActiveSettings((current) => {
      const currentIndex = current.columns.findIndex((column) => column.id === columnId);
      const nextIndex = currentIndex + direction;

      if (currentIndex === -1 || nextIndex < 0 || nextIndex >= current.columns.length) {
        return current;
      }

      const columns = [...current.columns];
      const column = columns[currentIndex];

      if (!column) {
        return current;
      }

      columns.splice(currentIndex, 1);
      columns.splice(nextIndex, 0, column);

      return { ...current, columns };
    });
  }

  function updatePlanetLabel(planetId: string, label: string) {
    setPlanets((current) => current.map((planet) => (planet.id === planetId ? { ...planet, label } : planet)));
    setHasUnsavedPlanets(true);
  }

  function updatePlanetActive(planetId: string, isActive: boolean) {
    setPlanets((current) => current.map((planet) => (planet.id === planetId ? { ...planet, isActive } : planet)));
    setHasUnsavedPlanets(true);
  }

  function updatePlanetHouseOnly(planetId: string, houseOnly: boolean) {
    setPlanets((current) => current.map((planet) => (planet.id === planetId ? { ...planet, houseOnly } : planet)));
    setHasUnsavedPlanets(true);
  }

  function movePlanet(planetId: string, direction: -1 | 1) {
    setPlanets((current) => {
      const currentIndex = current.findIndex((planet) => planet.id === planetId);
      const nextIndex = currentIndex + direction;

      if (currentIndex === -1 || nextIndex < 0 || nextIndex >= current.length) {
        return current;
      }

      const orderedPlanets = [...current];
      const planet = orderedPlanets[currentIndex];

      if (!planet) {
        return current;
      }

      orderedPlanets.splice(currentIndex, 1);
      orderedPlanets.splice(nextIndex, 0, planet);

      return orderedPlanets.map((item, index) => ({ ...item, sortOrder: index }));
    });
    setHasUnsavedPlanets(true);
  }

  async function handleAddPlanet() {
    const label = newPlanetLabel.trim();

    if (!label) {
      return;
    }

    await runAction(async () => {
      const response = await fetch("/api/planets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label }),
      });
      const planet = (await response.json()) as PlanetRecord;

      setNewPlanetLabel("");
      await loadSettings();
      setActivePlanetId(planet.id);
      setStatus("הכוכב נוסף בהצלחה.");
    });
  }

  async function handleSavePlanets() {
    await runAction(async () => {
      const response = await fetch("/api/planets", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planets: planets.map((planet, index) => ({
            id: planet.id,
            label: planet.label,
            sortOrder: index,
            isActive: planet.isActive,
            houseOnly: planet.houseOnly,
          })),
        }),
      });
      const savedPlanets = (await response.json()) as PlanetRecord[];

      setPlanets(savedPlanets);
      setHasUnsavedPlanets(false);
      await loadSettings();
      setStatus("רשימת הכוכבים נשמרה.");
    });
  }

  function updateCell(rowId: string, columnId: string, content: string) {
    updateActiveSettings((current) => ({
      ...current,
      rows: current.rows.map((row) => {
        if (row.id !== rowId) {
          return row;
        }

        const existingCell = row.cells.find((cell) => cell.columnId === columnId);

        if (existingCell) {
          return {
            ...row,
            cells: row.cells.map((cell) => (cell.columnId === columnId ? { ...cell, content } : cell)),
          };
        }

        return {
          ...row,
          cells: [
            ...row.cells,
            {
              id: `local-${rowId}-${columnId}`,
              rowId,
              columnId,
              content,
            },
          ],
        };
      }),
    }));
  }

  async function handlePdfImport(file: File | undefined) {
    if (!file || !activeSettings) {
      return;
    }

    await runAction(async () => {
      const formData = new FormData();
      formData.append("planetId", activeSettings.planetId);
      formData.append("file", file);

      const response = await fetch("/api/settings/interpretations/import-pdf", {
        method: "POST",
        body: formData,
      });
      const data = (await response.json()) as ImportedCsvSettings | { message?: string };

      if (!response.ok) {
        throw new Error("message" in data && data.message ? data.message : "ייבוא ה-PDF נכשל.");
      }

      applyFileImport(data as ImportedFileSettings);
      setStatus("ה-PDF יובא לטבלה. בדקי את העמודה החדשה ולחצי שמירת שינויים כדי לשמור.");
    });
  }

  async function handleCsvImport(file: File | undefined) {
    if (!file || !activeSettings) {
      return;
    }

    await runAction(async () => {
      const formData = new FormData();
      formData.append("planetId", activeSettings.planetId);
      formData.append("file", file);

      const response = await fetch("/api/settings/interpretations/import-csv", {
        method: "POST",
        body: formData,
      });
      const data = (await response.json()) as ImportedFileSettings | { message?: string };

      if (!response.ok) {
        throw new Error("message" in data && data.message ? data.message : "ייבוא ה-CSV נכשל.");
      }

      applyCsvImport(data as ImportedCsvSettings);
      setStatus("ה-CSV יובא לטבלה. בדקי את העמודות החדשות ולחצי שמירת שינויים כדי לשמור.");
    });
  }

  function applyCsvImport(importedSettings: ImportedCsvSettings) {
    const importId = Date.now();
    const importedColumns = importedSettings.columns.map((column, index) => ({
      id: `import-${importId}-${index}`,
      title: column.title,
      contentByHouse: new Map(column.rows.map((row) => [row.house, row.content])),
    }));

    setSettings((current) =>
      current.map((item) => {
        if (item.planetId !== importedSettings.planetId) {
          return item;
        }

        return {
          ...item,
          columns: [
            ...item.columns,
            ...importedColumns.map((column, index) => ({
              id: column.id,
              title: column.title,
              sortOrder: item.columns.length + index,
            })),
          ],
          rows: item.rows.map((row) => ({
            ...row,
            cells: [
              ...row.cells,
              ...importedColumns.map((column) => ({
                id: `local-${row.id}-${column.id}`,
                rowId: row.id,
                columnId: column.id,
                content: column.contentByHouse.get(row.house) ?? "",
              })),
            ],
          })),
        };
      }),
    );
  }

  function applyFileImport(importedSettings: ImportedFileSettings) {
    const importedColumnId = `import-${Date.now()}`;
    const contentByHouse = new Map(importedSettings.rows.map((row) => [row.house, row.content]));

    setSettings((current) =>
      current.map((item) => {
        if (item.planetId !== importedSettings.planetId) {
          return item;
        }

        return {
          ...item,
          columns: [
            ...item.columns,
            {
              id: importedColumnId,
              title: importedSettings.columnTitle,
              sortOrder: item.columns.length,
            },
          ],
          rows: item.rows.map((row) => ({
            ...row,
            cells: [
              ...row.cells,
              {
                id: `local-${row.id}-${importedColumnId}`,
                rowId: row.id,
                columnId: importedColumnId,
                content: contentByHouse.get(row.house) ?? "",
              },
            ],
          })),
        };
      }),
    );
  }

  function updateActiveSettings(update: (current: PlanetSettings) => PlanetSettings) {
    setSettings((current) =>
      current.map((item) => (item.planetId === activePlanetId ? update(item) : item)),
    );
    setHasUnsavedChanges(true);
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

  return (
    <main className="page settings-page">
      <header className="hero hero-row">
        <div>
          <h1>הגדרות פרשנויות כוכבים</h1>
          <p>עריכת הטבלאות שמהן נבנה ה-PDF. לכל כוכב יש 12 שורות קבועות ועמודות שניתן לשנות.</p>
        </div>
        <div className="header-actions">
          <button onClick={() => setIsPlanetModalOpen(true)} type="button">
            ניהול כוכבים
          </button>
          <Link className="link-button-back" href="/">
          חזרה למחולל ← 
          </Link>
        </div>
      </header>

      {isPlanetModalOpen ? (
        <div className="modal-backdrop" role="presentation">
          <div aria-labelledby="planet-modal-title" aria-modal="true" className="modal" role="dialog">
            <div className="settings-toolbar">
              <div>
                <h2 id="planet-modal-title">ניהול כוכבים</h2>
                <p className="status">כאן אפשר להוסיף כוכב, לשנות שם, להסתיר כוכבים ולסדר את ההופעה שלהם.</p>
              </div>
              <button className="secondary-button" onClick={() => setIsPlanetModalOpen(false)} type="button">
                סגירה
              </button>
            </div>

            <div className="toolbar-actions modal-add-row">
              <input
                aria-label="שם כוכב חדש"
                placeholder="שם כוכב חדש"
                value={newPlanetLabel}
                onChange={(event) => setNewPlanetLabel(event.target.value)}
              />
              <button disabled={isLoading || !newPlanetLabel.trim()} onClick={handleAddPlanet} type="button">
                הוספת כוכב
              </button>
              {hasUnsavedPlanets ? (
                <span className="unsaved-badge">● שינויים לא שמורים</span>
              ) : null}
              <button
                className={hasUnsavedPlanets ? "primary-button" : ""}
                disabled={isLoading || planets.length === 0}
                onClick={handleSavePlanets}
                type="button"
              >
                שמירת כוכבים
              </button>
            </div>

            <div className="settings-table-wrap">
              <table className="settings-table planets-table">
                <thead>
                  <tr>
                    <th>שם</th>
                    <th>פעיל</th>
                    <th>בית בלבד</th>
                    <th>סדר</th>
                  </tr>
                </thead>
                <tbody>
                  {planets.map((planet, planetIndex) => (
                    <tr key={planet.id}>
                      <td>
                        <input
                          aria-label="שם כוכב"
                          value={planet.label}
                          onChange={(event) => updatePlanetLabel(planet.id, event.target.value)}
                        />
                      </td>
                      <td>
                        <label className="inline-check">
                          <input
                            checked={planet.isActive}
                            onChange={(event) => updatePlanetActive(planet.id, event.target.checked)}
                            type="checkbox"
                          />
                          מוצג
                        </label>
                      </td>
                      <td>
                        <label className="inline-check">
                          <input
                            checked={planet.houseOnly}
                            onChange={(event) => updatePlanetHouseOnly(planet.id, event.target.checked)}
                            type="checkbox"
                          />
                          בית בלבד
                        </label>
                      </td>
                      <td>
                        <div className="column-actions">
                          <button
                            disabled={planetIndex === 0}
                            onClick={() => movePlanet(planet.id, -1)}
                            type="button"
                          >
                            למעלה
                          </button>
                          <button
                            disabled={planetIndex === planets.length - 1}
                            onClick={() => movePlanet(planet.id, 1)}
                            type="button"
                          >
                            למטה
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : null}

      <section className="card">
        <div className="tabs" role="tablist" aria-label="כוכבים">
          {activePlanets.map((planet) => (
            <button
              className={`tab-button ${planet.id === activePlanetId ? "active" : ""}`}
              key={planet.id}
              onClick={() => { setActivePlanetId(planet.id); setHasUnsavedChanges(false); }}
              type="button"
            >
              {planet.label}
            </button>
          ))}
        </div>

        {activeSettings ? (
          <>
            <div className="settings-toolbar">
              <h2>{activeSettings.planet.label}</h2>
              <div className="toolbar-actions">
                <button disabled={isLoading} onClick={addColumn} type="button">
                  הוספת עמודה
                </button>
                <label className={`file-button ${isLoading ? "disabled" : ""}`}>
                  ייבוא PDF
                  <input
                    accept="application/pdf"
                    disabled={isLoading}
                    onChange={(event) => {
                      void handlePdfImport(event.target.files?.[0]);
                      event.target.value = "";
                    }}
                    type="file"
                  />
                </label>
                <label className={`file-button ${isLoading ? "disabled" : ""}`}>
                  ייבוא CSV
                  <input
                    accept=".csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                    disabled={isLoading}
                    onChange={(event) => {
                      void handleCsvImport(event.target.files?.[0]);
                      event.target.value = "";
                    }}
                    type="file"
                  />
                </label>
                {hasUnsavedChanges ? (
                  <span className="unsaved-badge">● שינויים לא שמורים</span>
                ) : null}
                <button
                  className={hasUnsavedChanges ? "primary-button" : ""}
                  disabled={isLoading}
                  onClick={handleSave}
                  type="button"
                >
                  שמירת שינויים
                </button>
              </div>
            </div>

            <div className="settings-table-wrap">
              <table className="settings-table">
                <thead>
                  <tr>
                    <th>כוכב</th>
                    <th>בית</th>
                    {activeSettings.planet.houseOnly ? null : <th>מזל</th>}
                    {activeSettings.columns.map((column, columnIndex) => (
                      <th key={column.id}>
                        <div className="column-header">
                          <input
                            aria-label="שם עמודה"
                            value={column.title}
                            onChange={(event) => updateColumnTitle(column.id, event.target.value)}
                          />
                          <div className="column-actions">
                            <button
                              aria-label="הזזת עמודה ימינה"
                              disabled={columnIndex === 0}
                              onClick={() => moveColumn(column.id, -1)}
                              type="button"
                            >
                              ימינה
                            </button>
                            <button
                              aria-label="הזזת עמודה שמאלה"
                              disabled={columnIndex === activeSettings.columns.length - 1}
                              onClick={() => moveColumn(column.id, 1)}
                              type="button"
                            >
                              שמאלה
                            </button>
                            <button
                              className="danger-button"
                              onClick={() => deleteColumn(column.id)}
                              type="button"
                            >
                              מחיקה
                            </button>
                          </div>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {activeSettings.rows.map((row) => (
                    <tr key={row.id}>
                      <td>{activeSettings.planet.label}</td>
                      <td>בית {row.house}</td>
                      {activeSettings.planet.houseOnly ? null : <td>{getSignLabel(row.sign)}</td>}
                      {activeSettings.columns.map((column) => (
                        <td key={column.id}>
                          <textarea
                            value={getCellContent(row, column.id)}
                            onChange={(event) => updateCell(row.id, column.id, event.target.value)}
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {activeSettings.columns.length === 0 ? (
              <p className="status">אין עדיין עמודות לכוכב הזה. לחצי על “הוספת עמודה” כדי להתחיל.</p>
            ) : null}
          </>
        ) : (
          <p className="status">טוען הגדרות...</p>
        )}
      </section>

      {status ? <p className="status success">{status}</p> : null}
      {error ? <p className="status error">{error}</p> : null}
    </main>
  );
}

function getCellContent(row: InterpretationRow, columnId: string) {
  return row.cells.find((cell) => cell.columnId === columnId)?.content ?? "";
}
