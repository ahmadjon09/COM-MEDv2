'use client';
// Sayt sozlamalari: nom, matnlar, telefonlar, ijtimoiy tarmoqlar, SEO, huquqiy matnlar.
import { useEffect, useState } from 'react';
import { api } from '@/lib/admin-api';
import {
  PageHead, Panel, Input, Textarea, Select, MultiLangField, PhoneField, ImageUploader,
} from '@/components/admin/Fields';
import Button from '@/components/ui/Button';
import Icon from '@/components/ui/Icons';
import { useToast } from '@/components/ui/Toast';

const TABS = [
  { key: 'general', label: 'Umumiy', icon: 'spark' },
  { key: 'contacts', label: 'Aloqa', icon: 'phone' },
  { key: 'seo', label: 'SEO', icon: 'search' },
  { key: 'legal', label: 'Hujjatlar', icon: 'doc' },
];

const ml = (s, f) => ({ Uz: s?.[f + 'Uz'] || '', Ru: s?.[f + 'Ru'] || '', UzCyrl: s?.[f + 'UzCyrl'] || '' });
const unml = (v, f) => ({
  [f + 'Uz']: v.Uz.trim() || null,
  [f + 'Ru']: v.Ru.trim() || null,
  [f + 'UzCyrl']: v.UzCyrl.trim() || null,
});

export default function SettingsPage() {
  const [tab, setTab] = useState('general');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [f, setF] = useState(null);
  const toast = useToast();

  useEffect(() => {
    (async () => {
      try {
        const r = await api.get('/api/settings');
        const s = r.data;
        setF({
          siteName: ml(s, 'siteName'),
          tagline: ml(s, 'tagline'),
          about: ml(s, 'about'),
          address: ml(s, 'address'),
          metaTitle: ml(s, 'metaTitle'),
          metaDesc: ml(s, 'metaDesc'),
          terms: ml(s, 'terms'),
          privacy: ml(s, 'privacy'),
          phones: Array.isArray(s.phones) ? s.phones : [],
          socials: Array.isArray(s.socials) ? s.socials : [],
          emails: s.emails || [],
          telegramUrl: s.telegramUrl || '',
          instagramUrl: s.instagramUrl || '',
          youtubeUrl: s.youtubeUrl || '',
          mapEmbedUrl: s.mapEmbedUrl || '',
          defaultOgImage: s.defaultOgImage ? [s.defaultOgImage] : [],
        });
      } catch (e) {
        toast.error(e.message);
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line
  }, []);

  const set = (k, v) => setF((s) => ({ ...s, [k]: v }));

  async function save() {
    setSaving(true);
    try {
      await api.patch('/api/settings', {
        ...unml(f.siteName, 'siteName'),
        ...unml(f.tagline, 'tagline'),
        ...unml(f.about, 'about'),
        ...unml(f.address, 'address'),
        ...unml(f.metaTitle, 'metaTitle'),
        ...unml(f.metaDesc, 'metaDesc'),
        ...unml(f.terms, 'terms'),
        ...unml(f.privacy, 'privacy'),
        phones: f.phones.filter((p) => p.value),
        socials: f.socials.filter((s) => s.url),
        emails: f.emails.filter(Boolean),
        telegramUrl: f.telegramUrl.trim() || null,
        instagramUrl: f.instagramUrl.trim() || null,
        youtubeUrl: f.youtubeUrl.trim() || null,
        mapEmbedUrl: f.mapEmbedUrl.trim() || null,
        defaultOgImage: f.defaultOgImage[0] || null,
      });
      toast.success('Sozlamalar saqlandi — sayt darhol yangilandi');
    } catch (e) {
      toast.error(e.details?.[0] ? `${e.details[0].field}: ${e.details[0].message}` : e.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading || !f) {
    return (
      <div className="space-y-4">
        <div className="skeleton h-10 w-64" />
        <div className="skeleton h-96 w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <>
      <PageHead
        title="Sayt sozlamalari"
        subtitle="Bu yerdagi o'zgarishlar saytda darhol aks etadi"
        action={<Button onClick={save} variant="accent" size="sm" loading={saving} icon={<Icon name="save" size={15} />}>Saqlash</Button>}
      />

      {/* Bo'limlar */}
      <div className="mb-6 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`inline-flex items-center gap-2 rounded-lg border px-3.5 py-2 text-sm font-medium
                        transition-colors duration-150 ${
                          tab === t.key
                            ? 'border-blue-300 bg-blue-50 text-blue-700'
                            : 'border-ink-200 bg-white text-ink-600 hover:border-ink-300 hover:bg-ink-25'
                        }`}
          >
            <Icon name={t.icon} size={16} />
            {t.label}
          </button>
        ))}
      </div>

      <div className="space-y-6">
        {tab === 'general' && (
          <>
            <Card title="Sayt nomi va shiori">
              <MultiLangField label="Sayt nomi" value={f.siteName} onChange={(v) => set('siteName', v)} />
              <MultiLangField
                label="Shior (header va footer'da)"
                type="textarea"
                rows={2}
                value={f.tagline}
                onChange={(v) => set('tagline', v)}
              />
              <MultiLangField
                label="Biz haqimizda"
                type="textarea"
                rows={5}
                value={f.about}
                onChange={(v) => set('about', v)}
              />
            </Card>


          </>
        )}

        {tab === 'contacts' && (
          <>
            <Card title="Telefon raqamlar">
              <div className="space-y-3">
                {f.phones.map((p, i) => (
                  <div key={i} className="grid gap-3 rounded-xl border border-ink-100 p-3 sm:grid-cols-[1fr_1.4fr_auto]">
                    <Input
                      placeholder="Izoh (Asosiy, Shoshilinch...)"
                      value={p.label}
                      onChange={(e) => {
                        const arr = [...f.phones]; arr[i] = { ...p, label: e.target.value }; set('phones', arr);
                      }}
                    />
                    <PhoneField
                      value={p.value}
                      onChange={(v) => { const arr = [...f.phones]; arr[i] = { ...p, value: v }; set('phones', arr); }}
                    />
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const arr = f.phones.map((x, j) => ({ ...x, isPrimary: j === i }));
                          set('phones', arr);
                        }}
                        className={`rounded-lg px-3 py-2 text-[0.6875rem] font-bold transition-colors ${
                          p.isPrimary ? 'bg-blue-500 text-white' : 'bg-ink-100 text-ink-500 hover:bg-ink-200'
                        }`}
                        title="Asosiy raqam (header'da ko'rinadi)"
                      >
                        ASOSIY
                      </button>
                      <button
                        type="button"
                        onClick={() => set('phones', f.phones.filter((_, j) => j !== i))}
                        className="grid h-9 w-9 place-items-center rounded-lg border border-ink-200 text-rose-500"
                        aria-label="O'chirish"
                      >
                        <Icon name="close" size={15} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <Button
                variant="soft"
                size="sm"
                onClick={() => set('phones', [...f.phones, { label: '', value: '', isPrimary: !f.phones.length }])}
              >
                + Raqam qo'shish
              </Button>
            </Card>

            <Card title="Manzil va xarita">
              <MultiLangField
                label="Manzil"
                type="textarea"
                rows={2}
                value={f.address}
                onChange={(v) => set('address', v)}
              />
              <Input
                label="Xarita (Google Maps embed URL)"
                value={f.mapEmbedUrl}
                onChange={(e) => set('mapEmbedUrl', e.target.value)}
                placeholder="https://www.google.com/maps/embed?pb=..."
                hint="Google Maps → Share → Embed a map → src ичидаги havolani nusxalang"
              />
            </Card>

            <Card title="Elektron pochta">
              <div className="space-y-3">
                {f.emails.map((e, i) => (
                  <div key={i} className="flex gap-2">
                    <Input
                      value={e}
                      onChange={(ev) => { const arr = [...f.emails]; arr[i] = ev.target.value; set('emails', arr); }}
                      placeholder="info@medservice.uz"
                    />
                    <button
                      onClick={() => set('emails', f.emails.filter((_, j) => j !== i))}
                      className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-ink-200 text-rose-500"
                      aria-label="O'chirish"
                    >
                      <Icon name="close" size={16} />
                    </button>
                  </div>
                ))}
              </div>
              <Button variant="soft" size="sm" onClick={() => set('emails', [...f.emails, ''])}>
                + Pochta qo'shish
              </Button>
            </Card>

            <Card title="Ijtimoiy tarmoqlar">
              <Input label="Telegram" value={f.telegramUrl} onChange={(e) => set('telegramUrl', e.target.value)} placeholder="https://t.me/..." />
              <Input label="Instagram" value={f.instagramUrl} onChange={(e) => set('instagramUrl', e.target.value)} placeholder="https://instagram.com/..." />
              <Input label="YouTube" value={f.youtubeUrl} onChange={(e) => set('youtubeUrl', e.target.value)} placeholder="https://youtube.com/@..." />

              <div className="space-y-3 pt-2">
                {f.socials.map((s, i) => (
                  <div key={i} className="grid gap-3 sm:grid-cols-[160px_1fr_auto]">
                    <Select
                      value={s.type}
                      onChange={(e) => { const arr = [...f.socials]; arr[i] = { ...s, type: e.target.value }; set('socials', arr); }}
                    >
                      {['telegram', 'instagram', 'facebook', 'youtube', 'whatsapp', 'other'].map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </Select>
                    <Input
                      value={s.url}
                      onChange={(e) => { const arr = [...f.socials]; arr[i] = { ...s, url: e.target.value }; set('socials', arr); }}
                      placeholder="https://..."
                    />
                    <button
                      onClick={() => set('socials', f.socials.filter((_, j) => j !== i))}
                      className="grid h-11 w-11 place-items-center rounded-xl border border-ink-200 text-rose-500"
                      aria-label="O'chirish"
                    >
                      <Icon name="close" size={16} />
                    </button>
                  </div>
                ))}
              </div>
              <Button variant="soft" size="sm" onClick={() => set('socials', [...f.socials, { type: 'other', url: '' }])}>
                + Havola qo'shish
              </Button>
            </Card>
          </>
        )}

        {tab === 'seo' && (
          <Card title="Qidiruv tizimlari uchun">
            <MultiLangField
              label="Bosh sahifa meta sarlavhasi"
              value={f.metaTitle}
              onChange={(v) => set('metaTitle', v)}
              hint="60–65 belgi. Google natijasidagi ko'k sarlavha."
            />
            <MultiLangField
              label="Bosh sahifa meta tavsifi"
              type="textarea"
              rows={3}
              value={f.metaDesc}
              onChange={(v) => set('metaDesc', v)}
              hint="150–160 belgi. Sarlavha ostidagi tavsif matni."
            />
            <ImageUploader
              label="Standart OG rasm (ijtimoiy tarmoqlar uchun)"
              images={f.defaultOgImage}
              onChange={(v) => set('defaultOgImage', v)}
              max={1}
            />
          </Card>
        )}

        {tab === 'legal' && (
          <>
            <Card title="Foydalanish shartlari">
              <MultiLangField
                label="Matn (markdown: ## sarlavha, - ro'yxat)"
                type="textarea"
                rows={16}
                value={f.terms}
                onChange={(v) => set('terms', v)}
                hint="Bo'sh qoldirsangiz — saytdagi standart matn ko'rsatiladi."
              />
            </Card>
            <Card title="Maxfiylik siyosati">
              <MultiLangField
                label="Matn"
                type="textarea"
                rows={16}
                value={f.privacy}
                onChange={(v) => set('privacy', v)}
                hint="Bo'sh qoldirsangiz — saytdagi standart matn ko'rsatiladi."
              />
            </Card>
          </>
        )}

        <Button onClick={save} variant="accent" loading={saving} size="lg" full icon={<Icon name="save" size={17} />}>
          Barcha o'zgarishlarni saqlash
        </Button>
      </div>
    </>
  );
}

function Card({ title, children }) {
  return <Panel title={title}>{children}</Panel>;
}
