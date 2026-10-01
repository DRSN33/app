import { Section, Panel, Stat } from "@/lib/ui";
import { useCollection, uid } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Trash2, Plus } from "lucide-react";
import { useState } from "react";

export default function Nutrition() {
  const [meals, save] = useCollection("nutrition");
  const [shop, saveShop] = useCollection("shopping");
  const [item, setItem] = useState("");

  const upd = (id, k, v) => save(meals.map((m) => (m.id === id ? { ...m, [k]: v } : m)));
  const totals = meals.reduce((a, m) => ({ p: a.p + Number(m.p || 0), f: a.f + Number(m.f || 0), c: a.c + Number(m.c || 0) }), { p: 0, f: 0, c: 0 });
  const kcal = totals.p * 4 + totals.c * 4 + totals.f * 9;

  const addShop = () => { if (!item.trim()) return; saveShop([...shop, { id: uid(), name: item, done: false }]); setItem(""); };
  const toggle = (id) => saveShop(shop.map((s) => (s.id === id ? { ...s, done: !s.done } : s)));
  const delShop = (id) => saveShop(shop.filter((s) => s.id !== id));

  return (
    <Section title="Plan Żywieniowy" desc="Posiłki, makro i lista zakupów" testid="module-nutrition">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <Stat label="Białko" value={`${totals.p} g`} />
        <Stat label="Tłuszcz" value={`${totals.f} g`} accent="cyan" />
        <Stat label="Węgle" value={`${totals.c} g`} />
        <Stat label="Kalorie" value={`${kcal} kcal`} accent="cyan" />
      </div>

      <div className="grid lg:grid-cols-[1fr_320px] gap-4">
        <Panel className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-left text-muted-foreground border-b border-border"><th className="py-2 pr-3">Posiłek</th><th className="pr-2">Składniki</th><th className="w-14">B</th><th className="w-14">T</th><th className="w-14">W</th></tr></thead>
            <tbody>
              {meals.map((m) => (
                <tr key={m.id} className="border-b border-border/50">
                  <td className="py-2 pr-3 font-medium">{m.meal}</td>
                  <td className="pr-2"><Input className="h-8" value={m.items} onChange={(e) => upd(m.id, "items", e.target.value)} /></td>
                  <td><Input className="h-8 w-14 mono" value={m.p} onChange={(e) => upd(m.id, "p", e.target.value)} /></td>
                  <td><Input className="h-8 w-14 mono" value={m.f} onChange={(e) => upd(m.id, "f", e.target.value)} /></td>
                  <td><Input className="h-8 w-14 mono" value={m.c} onChange={(e) => upd(m.id, "c", e.target.value)} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
        <Panel>
          <h3 className="font-display font-semibold mb-2">Lista zakupów</h3>
          <div className="flex gap-2 mb-3">
            <Input data-testid="shop-input" placeholder="Dodaj produkt..." value={item} onChange={(e) => setItem(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addShop()} />
            <Button data-testid="shop-add" size="icon" onClick={addShop}><Plus className="w-4 h-4" /></Button>
          </div>
          <div className="space-y-1">
            {shop.map((s) => (
              <label key={s.id} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-accent">
                <Checkbox checked={s.done} onCheckedChange={() => toggle(s.id)} />
                <span className={`flex-1 text-sm ${s.done ? "line-through text-muted-foreground" : ""}`}>{s.name}</span>
                <button onClick={() => delShop(s.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="w-3.5 h-3.5" /></button>
              </label>
            ))}
            {shop.length === 0 && <p className="text-sm text-muted-foreground">Lista pusta</p>}
          </div>
        </Panel>
      </div>
    </Section>
  );
}
