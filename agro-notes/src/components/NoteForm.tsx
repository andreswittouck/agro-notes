"use client";

import { useEffect, useState } from "react";
import { createNote } from "../lib/api";
import { theme } from "../theme";
import { Label } from "./ui/Label";
import { Input } from "./ui/Input";
import { TextArea } from "./ui/TextArea";
import { Button } from "./ui/Button";

type Preset = Partial<
  {
    farm: string;
    lot: string;
    weeds: string[];
    applications: string[];
    note: string;
  } & {
    explotacion: string;
    lote: string;
    malezas: string[];
    aplicaciones: string[];
    nota: string;
  }
>;

export default function NoteForm({ preset }: { preset?: Preset }) {
  const [farm, setFarm] = useState(preset?.farm ?? preset?.explotacion ?? "");
  const [lot, setLot] = useState(preset?.lot ?? preset?.lote ?? "");
  const [weeds, setWeeds] = useState<string[]>(
    preset?.weeds ?? preset?.malezas ?? []
  );
  const [applications, setApplications] = useState<string[]>(
    preset?.applications ?? preset?.aplicaciones ?? []
  );
  const [note, setNote] = useState(preset?.note ?? preset?.nota ?? "");

  useEffect(() => {
    if (!preset) return;
    if (preset.farm !== undefined || preset.explotacion !== undefined)
      setFarm(preset.farm ?? preset.explotacion ?? "");
    if (preset.lot !== undefined || preset.lote !== undefined)
      setLot(preset.lot ?? preset.lote ?? "");
    if (preset.weeds !== undefined || preset.malezas !== undefined)
      setWeeds((preset.weeds ?? preset.malezas ?? []) as string[]);
    if (preset.applications !== undefined || preset.aplicaciones !== undefined)
      setApplications(
        (preset.applications ?? preset.aplicaciones ?? []) as string[]
      );
    if (preset.note !== undefined || preset.nota !== undefined)
      setNote(preset.note ?? preset.nota ?? "");
  }, [preset]);

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
      } catch {
        // sin gps no rompemos
      }

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
    } catch {
      alert("Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  // responsive grid:
  // - en mobile: 1 columna
  // - en desktop: 2 columnas solo para la fila de Explotación/Lote
  return (
    <form
      onSubmit={onSubmit}
      style={{
        display: "grid",
        gap: theme.spacing(4),
        color: theme.colors.textPrimary,
        fontSize: "0.9rem",
      }}
    >
      {/* fila Explotación / Lote */}
      <div
        style={{
          display: "grid",
          gap: theme.spacing(4),
          gridTemplateColumns: "1fr",
        }}
      >
        <div
          style={{
            display: "grid",
            gap: theme.spacing(2),
          }}
        >
          <Label>
            <span
              style={{ color: theme.colors.textPrimary, fontSize: "0.9rem" }}
            >
              Explotación
            </span>
            <Input
              full
              value={farm}
              onChange={(e) => setFarm(e.target.value)}
              required
            />
          </Label>
        </div>

        <div
          style={{
            display: "grid",
            gap: theme.spacing(2),
          }}
        >
          <Label>
            <span
              style={{ color: theme.colors.textPrimary, fontSize: "0.9rem" }}
            >
              Lote
            </span>
            <Input
              full
              value={lot}
              onChange={(e) => setLot(e.target.value)}
              required
            />
          </Label>
        </div>
      </div>

      {/* malezas */}
      <div style={{ display: "grid", gap: theme.spacing(2) }}>
        <Label>
          <span style={{ color: theme.colors.textPrimary, fontSize: "0.9rem" }}>
            Malezas
          </span>
          <Input
            full
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
        </Label>
      </div>

      {/* aplicaciones */}
      <div style={{ display: "grid", gap: theme.spacing(2) }}>
        <Label>
          <span style={{ color: theme.colors.textPrimary, fontSize: "0.9rem" }}>
            Aplicaciones
          </span>
          <Input
            full
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
        </Label>
      </div>

      {/* nota */}
      <div style={{ display: "grid", gap: theme.spacing(2) }}>
        <Label>
          <span style={{ color: theme.colors.textPrimary, fontSize: "0.9rem" }}>
            Nota
          </span>
          <TextArea
            full
            rows={3}
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </Label>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
        }}
      >
        <Button type="submit" disabled={saving}>
          {saving ? "Guardando…" : "Guardar"}
        </Button>
      </div>
    </form>
  );
}
