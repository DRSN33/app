import { Section, Panel, Pill } from "@/lib/ui";
import { api } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Trash2, Upload, Download, FileText, Image as ImageIcon, Music, File as FileIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const fmtSize = (b) => (b > 1e6 ? `${(b / 1e6).toFixed(1)} MB` : `${Math.round(b / 1024)} KB`);
const isImg = (ct) => (ct || "").startsWith("image/");
const iconFor = (ct) => (isImg(ct) ? ImageIcon : (ct || "").startsWith("audio/") ? Music : (ct || "").includes("pdf") ? FileText : FileIcon);

export default function Files() {
  const [files, setFiles] = useState([]);
  const [busy, setBusy] = useState(false);
  const inputRef = useRef(null);

  const load = async () => { try { setFiles((await api.get("/files")).data); } catch { /* offline */ } };
  useEffect(() => { load(); }, []);

  const onPick = async (e) => {
    const list = Array.from(e.target.files || []);
    if (!list.length) return;
    setBusy(true);
    for (const f of list) {
      const fd = new FormData();
      fd.append("file", f);
      try { await api.post("/upload", fd, { headers: { "Content-Type": "multipart/form-data" } }); }
      catch { toast.error(`Błąd uploadu: ${f.name}`); }
    }
    setBusy(false);
    if (inputRef.current) inputRef.current.value = "";
    toast.success("Plik(i) wgrane");
    load();
  };

  const del = async (id) => { await api.delete(`/files/${id}`); setFiles((f) => f.filter((x) => x.id !== id)); };

  return (
    <Section title="Pliki / Media" desc="Wgrywaj zdjęcia, PDF, audio i dokumenty — trwałe w chmurze" testid="module-files"
      right={<>
        <input ref={inputRef} type="file" multiple className="hidden" onChange={onPick} data-testid="file-input" />
        <Button data-testid="file-upload-btn" onClick={() => inputRef.current?.click()} disabled={busy} className="gap-1">
          <Upload className="w-4 h-4" /> {busy ? "Wgrywam..." : "Wgraj pliki"}
        </Button>
      </>}>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {files.map((f) => {
          const Icon = iconFor(f.content_type);
          const url = `${API}/files/${f.id}/download`;
          return (
            <Panel key={f.id} data-testid="file-card" className="flex flex-col">
              <div className="aspect-video rounded-lg bg-secondary overflow-hidden flex items-center justify-center mb-2">
                {isImg(f.content_type)
                  ? <img src={url} alt={f.original_filename} className="w-full h-full object-cover" />
                  : <Icon className="w-10 h-10 text-muted-foreground" />}
              </div>
              <p className="text-sm font-medium truncate" title={f.original_filename}>{f.original_filename}</p>
              <div className="flex items-center gap-2 mt-1">
                <Pill tone="cyan">{fmtSize(f.size)}</Pill>
                <span className="text-xs text-muted-foreground truncate">{(f.content_type || "").split("/")[1] || "plik"}</span>
              </div>
              <div className="flex gap-2 mt-3">
                <a href={url} download={f.original_filename} target="_blank" rel="noreferrer" className="flex-1">
                  <Button variant="outline" size="sm" className="w-full gap-1"><Download className="w-3.5 h-3.5" /> Pobierz</Button>
                </a>
                <Button data-testid={`file-del-${f.id}`} variant="ghost" size="icon" onClick={() => del(f.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="w-4 h-4" /></Button>
              </div>
            </Panel>
          );
        })}
      </div>
      {files.length === 0 && <p className="text-sm text-muted-foreground text-center py-12">Brak plików — wgraj pierwszy</p>}
    </Section>
  );
}
