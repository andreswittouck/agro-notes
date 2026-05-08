// agro-notes/src/components/NoteForm.tsx
"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";

import { Label } from "./ui/Label";
import { Input } from "./ui/Input";
import { TextArea } from "./ui/TextArea";
import { Button } from "./ui/Button";

import {
  createNoteOfflineFirst,
  updateNoteOfflineFirst,
} from "@/lib/offline/notesOffline";

type Preset = Partial<
  {
    farm: string;
    lot: string;
    weeds: string[];
    applications: string[];
    note: string;
    is_private: boolean;
  } & {
    explotacion: string;
    lote: string;
    malezas: string[];
    aplicaciones: string[];
    nota: string;
  }
>;

export default function NoteForm({ preset }: { preset?: Preset }) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const mode =
    (searchParams.get("mode") as "edit" | "create" | null) ?? "create";
  const editingId = searchParams.get("id") ?? undefined;

  const [farm, setFarm] = useState(preset?.farm ?? preset?.explotacion ?? "");
  const [lot, setLot] = useState(preset?.lot ?? preset?.lote ?? "");
  const [weeds, setWeeds] = useState<string[]>(
    preset?.weeds ?? preset?.malezas ?? []
  );
  const [applications, setApplications] = useState<string[]>(
    preset?.applications ?? preset?.aplicaciones ?? []
  );
  const [note, setNote] = useState(preset?.note ?? preset?.nota ?? "");
  const [isPrivate, setIsPrivate] = useState<boolean>(
    preset?.is_private ?? false
  );
  const [saving, setSaving] = useState(false);

  // si cambia el preset (por voz o por URL), actualizamos los estados
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
    if (preset.is_private !== undefined) setIsPrivate(preset.is_private);
  }, [preset]);

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

      if (mode === "edit" && editingId) {
        await updateNoteOfflineFirst(editingId, {
          farm,
          lot,
          weeds,
          applications,
          note,
          lat,
          lng,
          is_private: isPrivate,
        } as any);

        alert("Nota actualizada ✅");
      } else {
        await createNoteOfflineFirst({
          farm,
          lot,
          weeds,
          applications,
          note,
          lat,
          lng,
          is_private: isPrivate,
        } as any);

        alert("Nota guardada ✅");

        setFarm("");
        setLot("");
        setWeeds([]);
        setApplications([]);
        setNote("");
        setIsPrivate(false);
      }

      router.push("/notes");
    } catch (err) {
      console.error(err);
      alert("Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="grid gap-4 text-fg">
      {/* Fila Explotación / Lote */}
      <div className="grid gap-4 sm:grid-cols-[2fr_1fr]">
        <Label>
          <span>Explotación</span>
          <Input
            value={farm}
            onChange={(e) => setFarm(e.target.value)}
            placeholder="Juan Carlos"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="words"
            required
          />
        </Label>

        <Label>
          <span>Lote</span>
          <Input
            value={lot}
            onChange={(e) => setLot(e.target.value)}
            placeholder="24"
            inputMode="text"
            autoComplete="off"
            autoCorrect="off"
            required
          />
        </Label>
      </div>

      {/* Malezas */}
      <Label>
        <span>Malezas</span>
        <Input
          value={weeds.join(", ")}
          onChange={(e) =>
            setWeeds(
              e.target.value
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean)
            )
          }
          placeholder="gramilla, yuyo colorado"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="none"
        />
      </Label>

      {/* Aplicaciones */}
      <Label>
        <span>Aplicaciones</span>
        <Input
          value={applications.join(", ")}
          onChange={(e) =>
            setApplications(
              e.target.value
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean)
            )
          }
          placeholder="2,4-D, glifosato"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="none"
        />
      </Label>

      {/* Nota */}
      <Label>
        <span>Nota</span>
        <TextArea
          rows={3}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="viento ligero…"
        />
      </Label>

      {/* Privacidad */}
      <label
        className="
          flex items-start gap-2.5
          rounded-lg
          bg-page/60 border border-border-subtle
          px-3 py-2.5
          cursor-pointer hover:bg-card-hover/40
          transition-colors
        "
      >
        <input
          type="checkbox"
          checked={isPrivate}
          onChange={(e) => setIsPrivate(e.target.checked)}
          className="mt-0.5 w-4 h-4 accent-accent cursor-pointer"
        />
        <span className="grid gap-0.5">
          <span className="text-sm font-medium text-fg leading-tight">
            Solo para mí
          </span>
          <span className="text-xs text-fg-muted leading-snug">
            Ni los usuarios con acceso a la explotación verán esta nota.
            Útil para apuntes personales o pruebas.
          </span>
        </span>
      </label>

      <div className="flex justify-end pt-1">
        <Button type="submit" disabled={saving} variant="primary" size="md">
          {saving ? (
            <>
              <Spinner />
              Guardando…
            </>
          ) : mode === "edit" ? (
            "Guardar cambios"
          ) : (
            "Guardar"
          )}
        </Button>
      </div>
    </form>
  );
}

function Spinner() {
  return (
    <svg
      className="animate-spin"
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="12"
        r="9"
        stroke="currentColor"
        strokeWidth="3"
        opacity="0.25"
      />
      <path
        d="M21 12a9 9 0 0 0-9-9"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}
