"use client";
import { useState } from "react";
import { createNote } from "../lib/api";

export default function NoteForm({
  preset,
}: {
  preset?: Partial<{
    farm: string;
    lot: string;
    note: string;
    weeds: string[];
    applications: string[];
  }>;
}) {
  const [farm, setFarm] = useState(preset?.farm ?? "");
  const [lot, setLot] = useState(preset?.lot ?? "");
  const [weeds, setWeeds] = useState<string[]>(preset?.weeds ?? []);
  const [applications, setApplications] = useState<string[]>(
    preset?.applications ?? []
  );
  const [note, setNote] = useState(preset?.note ?? "");
  const [saving, setSaving] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      let lat: number | undefined;
      let lng: number | undefined;
      try {
        const pos = await new Promise<GeolocationPosition>((res, rej) =>
          navigator.geolocation.getCurrentPosition(res, rej, {
            enableHighAccuracy: true,
            timeout: 5000,
          })
        );
        lat = pos.coords.latitude;
        lng = pos.coords.longitude;
      } catch {}

      await createNote({
        farm,
        lot,
        weeds,
        applications,
        note,
        lat,
        lng,
      } as any);
      alert("Nota guardada ✅");
      setFarm("");
      setLot("");
      setWeeds([]);
      setApplications([]);
      setNote("");
    } catch (err) {
      alert("Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form
      onSubmit={onSubmit}
      style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}
    >
      <label>
        Farm
        <input
          value={farm}
          onChange={(e) => setFarm(e.target.value)}
          required
        />
      </label>
      <label>
        Lot
        <input value={lot} onChange={(e) => setLot(e.target.value)} required />
      </label>
      <label style={{ gridColumn: "1 / -1" }}>
        Weeds (coma)
        <input
          value={weeds.join(", ")}
          onChange={(e) =>
            setWeeds(
              e.target.value
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean)
            )
          }
        />
      </label>
      <label style={{ gridColumn: "1 / -1" }}>
        Applications (coma)
        <input
          value={applications.join(", ")}
          onChange={(e) =>
            setApplications(
              e.target.value
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean)
            )
          }
        />
      </label>
      <label style={{ gridColumn: "1 / -1" }}>
        Note
        <textarea
          rows={3}
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </label>
      <div
        style={{
          gridColumn: "1 / -1",
          display: "flex",
          justifyContent: "flex-end",
          gap: 8,
        }}
      >
        <button type="submit" disabled={saving}>
          {saving ? "Guardando…" : "Guardar"}
        </button>
      </div>
    </form>
  );
}
