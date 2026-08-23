'use client';
// Mahsulot/xizmat qo'shish va tahrirlash formasi (yaratish va tahrir uchun umumiy).
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/admin-api';
import { useToast } from '../ui/Toast';
import Button from '../ui/Button';
import Icon from '../ui/Icons';
import { ConfirmModal } from '../ui/Modal';
import {
  Input, Textarea, Select, Toggle, MultiLangField, ImageUploader, PageHead, Panel,
  ListEditor, SpecEditor, COUNTRIES,
} from './Fields';

/** Bo'sh forma holati */
const empty = {
  categoryId: '',
  kind: 'PART',
  name: { Uz: '', Ru: '', UzCyrl: '' },
  short: { Uz: '', Ru: '', UzCyrl: '' },
  desc: { Uz: '', Ru: '', UzCyrl: '' },
  metaTitle: { Uz: '', Ru: '', UzCyrl: '' },
  metaDesc: { Uz: '', Ru: '', UzCyrl: '' },
  price: '',
  currency: 'UZS',
  priceNote: '',
  brand: '',
  model: '',
  sku: '',
  warranty: '',
  originCountry: '',
  manufacturer: '',
  condition: 'NEW',
  partType: 'OTHER',
  packQty: '',
  compatibility: [],
  specs: [],
  includes: { Uz: [], Ru: [], UzCyrl: [] },
  keywords: '',
  images: [],
  ogImage: '',
  inStock: true,
  isActive: true,
  isFeatured: false,
  sortOrder: 0,
};

/** Serverdan kelgan yozuvni forma holatiga aylantirish */
function toForm(p) {
  return {
    categoryId: p.categoryId || '',
    kind: p.kind || 'PART',
    name: { Uz: p.nameUz || '', Ru: p.nameRu || '', UzCyrl: p.nameUzCyrl || '' },
    short: { Uz: p.shortUz || '', Ru: p.shortRu || '', UzCyrl: p.shortUzCyrl || '' },
    desc: { Uz: p.descUz || '', Ru: p.descRu || '', UzCyrl: p.descUzCyrl || '' },
    metaTitle: { Uz: p.metaTitleUz || '', Ru: p.metaTitleRu || '', UzCyrl: p.metaTitleUzCyrl || '' },
    metaDesc: { Uz: p.metaDescUz || '', Ru: p.metaDescRu || '', UzCyrl: p.metaDescUzCyrl || '' },
    price: p.price ?? '',
    currency: p.currency || 'UZS',
    priceNote: p.priceNote || '',
    brand: p.brand || '',
    model: p.model || '',
    sku: p.sku || '',
    warranty: p.warranty || '',
    originCountry: p.originCountry || '',
    manufacturer: p.manufacturer || '',
    condition: p.condition || 'NEW',
    partType: p.partType || 'OTHER',
    packQty: p.packQty ?? '',
    compatibility: p.compatibility || [],
    specs: Array.isArray(p.specs) ? p.specs : [],
    includes: { Uz: p.includesUz || [], Ru: p.includesRu || [], UzCyrl: p.includesUzCyrl || [] },
    keywords: (p.keywords || []).join(', '),
    images: p.images || [],
    ogImage: p.ogImage || '',
    inStock: p.inStock ?? true,
    isActive: p.isActive ?? true,
    isFeatured: p.isFeatured ?? false,
    sortOrder: p.sortOrder ?? 0,
  };
}

/** Forma holatini API yuboriladigan ko'rinishga aylantirish */
function toPayload(f) {
  return {
    categoryId: f.categoryId,
    kind: f.kind,
    nameUz: f.name.Uz.trim(),
    nameRu: f.name.Ru.trim(),
    nameUzCyrl: f.name.UzCyrl.trim(),
    shortUz: f.short.Uz.trim() || null,
    shortRu: f.short.Ru.trim() || null,
    shortUzCyrl: f.short.UzCyrl.trim() || null,
    descUz: f.desc.Uz.trim() || null,
    descRu: f.desc.Ru.trim() || null,
    descUzCyrl: f.desc.UzCyrl.trim() || null,
    metaTitleUz: f.metaTitle.Uz.trim() || null,
    metaTitleRu: f.metaTitle.Ru.trim() || null,
    metaTitleUzCyrl: f.metaTitle.UzCyrl.trim() || null,
    metaDescUz: f.metaDesc.Uz.trim() || null,
    metaDescRu: f.metaDesc.Ru.trim() || null,
    metaDescUzCyrl: f.metaDesc.UzCyrl.trim() || null,
    price: f.price === '' ? null : Number(f.price),
    currency: f.currency,
    priceNote: f.priceNote.trim() || null,
    brand: f.brand.trim() || null,
    model: f.model.trim() || null,
    sku: f.sku.trim() || null,
    warranty: f.warranty.trim() || null,
    originCountry: f.originCountry || null,
    manufacturer: f.manufacturer.trim() || null,
    condition: f.condition,
    partType: f.partType,
    packQty: f.packQty === '' ? null : Number(f.packQty),
    compatibility: (f.compatibility || []).map((x) => x.trim()).filter(Boolean),
    specs: (f.specs || []).filter((s) => s.labelUz && s.labelRu && s.labelUzCyrl && s.value),
    includesUz: (f.includes.Uz || []).map((x) => x.trim()).filter(Boolean),
    includesRu: (f.includes.Ru || []).map((x) => x.trim()).filter(Boolean),
    includesUzCyrl: (f.includes.UzCyrl || []).map((x) => x.trim()).filter(Boolean),
    keywords: f.keywords.split(',').map((k) => k.trim()).filter(Boolean),
    images: f.images,
    ogImage: f.ogImage.trim() || null,
    inStock: f.inStock,
    isActive: f.isActive,
    isFeatured: f.isFeatured,
    sortOrder: Number(f.sortOrder) || 0,
  };
}

export default function ProductForm({ productId = null }) {
  const [form, setForm] = useState(empty);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(!!productId);
  const [saving, setSaving] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [errors, setErrors] = useState({});

  const router = useRouter();
  const toast = useToast();
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  useEffect(() => {
    (async () => {
      try {
        const cats = await api.get('/api/categories/admin/all');
        setCategories(cats.data);
        if (!productId && cats.data.length) {
          setForm((f) => ({ ...f, categoryId: f.categoryId || cats.data[0].id }));
        }
        if (productId) {
          const p = await api.get(`/api/products/admin/id/${productId}`);
          setForm(toForm(p.data));
        }
      } catch (e) {
        toast.error(e.message);
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);

  function validate() {
    const e = {};
    if (!form.categoryId) e.categoryId = 'Kategoriya tanlang';
    if (!form.name.Uz.trim()) e.name = "O'zbekcha nom majburiy";
    else if (!form.name.Ru.trim()) e.name = 'Ruscha nom majburiy';
    else if (!form.name.UzCyrl.trim()) e.name = 'Kirill nom majburiy';
    setErrors(e);
    if (Object.keys(e).length) toast.error(Object.values(e)[0]);
    return !Object.keys(e).length;
  }

  async function save() {
    if (!validate()) return;
    setSaving(true);
    try {
      const payload = toPayload(form);
      if (productId) {
        await api.patch(`/api/products/${productId}`, payload);
        toast.success('Saqlandi');
      } else {
        const r = await api.post('/api/products', payload);
        toast.success("Mahsulot qo'shildi");
        router.replace(`/admin/products/${r.data.id}`);
        return;
      }
    } catch (e) {
      toast.error(e.details?.[0] ? `${e.details[0].field}: ${e.details[0].message}` : e.message);
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    setDeleting(true);
    try {
      await api.del(`/api/products/${productId}`);
      toast.success("O'chirildi");
      router.replace('/admin/products');
    } catch (e) {
      toast.error(e.message);
      setDeleting(false);
      setConfirmOpen(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="skeleton h-10 w-64" />
        <div className="skeleton h-72 w-full rounded-2xl" />
        <div className="skeleton h-96 w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <>
      <PageHead
        title={productId ? 'Mahsulotni tahrirlash' : "Yangi mahsulot / xizmat"}
        subtitle="Har bir matnni uchta tilda to'ldiring — saytda tanlangan tilga qarab ko'rsatiladi"
        action={
          <div className="flex gap-2.5">
            <Button variant="outline" size="sm" href="/admin/products" icon={<Icon name="arrowLeft" size={15} />}>Orqaga</Button>
            {productId && (
              <Button variant="danger" size="sm" onClick={() => setConfirmOpen(true)} icon={<Icon name="trash" size={15} />}>
                O'chirish
              </Button>
            )}
            <Button onClick={save} variant="accent" size="sm" loading={saving} icon={<Icon name="save" size={15} />}>
              Saqlash
            </Button>
          </div>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        {/* Chap ustun — asosiy kontent */}
        <div className="space-y-6">
          <Card title="Asosiy ma'lumot" icon="box">
            <div className="grid gap-4 sm:grid-cols-2">
              <Select label="Kategoriya *" value={form.categoryId} onChange={(e) => set('categoryId', e.target.value)}>
                <option value="">— tanlang —</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.nameUz}</option>
                ))}
              </Select>

              <Select label="Turi" value={form.kind} onChange={(e) => set('kind', e.target.value)}>
                <option value="PART">Zapchast (ehtiyot qism)</option>
                <option value="SERVICE">Xizmat (ta'mirlash, kalibrlash)</option>
              </Select>
            </div>

            <MultiLangField
              label="Nomi"
              required
              value={form.name}
              onChange={(v) => set('name', v)}
              hint="Qidiruvda chiqadigan asosiy nom. Masalan: «UZI datchigini ta'mirlash»"
            />

            <MultiLangField
              label="Qisqa tavsif (kartada ko'rinadi)"
              type="textarea"
              rows={3}
              value={form.short}
              onChange={(v) => set('short', v)}
              hint="1–2 jumla. Mijoz ro'yxatda shuni o'qiydi."
            />

            <MultiLangField
              label="To'liq tavsif"
              type="textarea"
              rows={9}
              value={form.desc}
              onChange={(v) => set('desc', v)}
              hint="Yangi qatordan yozsangiz — saytda alohida paragraf bo'ladi."
            />
          </Card>

          {form.kind === 'SERVICE' && (
            <Card title="Xizmatga nimalar kiradi" icon="check">
              <p className="text-xs leading-relaxed text-ink-500">
                Har bir tilda alohida ro'yxat. Saytda aynan shu ro'yxat raqamlangan holda ko'rinadi —
                mijoz nima uchun to'layotganini tushunadi.
              </p>
              <div className="grid gap-4">
                <ListEditor
                  label="O'zbekcha (lotin)"
                  items={form.includes.Uz}
                  onChange={(v) => set('includes', { ...form.includes, Uz: v })}
                  placeholder="Piezoelementlarni bittalab tekshirish"
                />
                <ListEditor
                  label="Ruscha"
                  items={form.includes.Ru}
                  onChange={(v) => set('includes', { ...form.includes, Ru: v })}
                  placeholder="Поэлементная проверка пьезоэлементов"
                />
                <ListEditor
                  label="Ўзбекча (кирилл)"
                  items={form.includes.UzCyrl}
                  onChange={(v) => set('includes', { ...form.includes, UzCyrl: v })}
                  placeholder="Пьезоэлементларни битталаб текшириш"
                />
              </div>
            </Card>
          )}

          {form.kind === 'PART' && (
            <Card title="Xarakteristikalar va moslik" icon="doc">
              <SpecEditor specs={form.specs} onChange={(v) => set('specs', v)} />
              <div className="pt-2">
                <ListEditor
                  label="Mos keladigan apparatlar"
                  items={form.compatibility}
                  onChange={(v) => set('compatibility', v)}
                  placeholder="Mindray DP-50"
                  hint="Mijoz aynan shu ro'yxat bo'yicha zapchast to'g'ri kelishini tekshiradi."
                />
              </div>
            </Card>
          )}

          <Card title="Rasmlar" icon="image">
            <ImageUploader images={form.images} onChange={(v) => set('images', v)} max={8} />
          </Card>

          <Card title="Qidiruv tizimlari uchun (SEO)" icon="search">
            <MultiLangField
              label="Meta sarlavha (title)"
              value={form.metaTitle}
              onChange={(v) => set('metaTitle', v)}
              hint="60–65 belgigacha. Bo'sh qoldirsangiz mahsulot nomi ishlatiladi."
            />
            <MultiLangField
              label="Meta tavsif (description)"
              type="textarea"
              rows={3}
              value={form.metaDesc}
              onChange={(v) => set('metaDesc', v)}
              hint="150–160 belgi. Google qidiruv natijasida shu matn ko'rinadi."
            />
            <Textarea
              label="Kalit so'zlar (vergul bilan)"
              rows={2}
              value={form.keywords}
              onChange={(e) => set('keywords', e.target.value)}
              placeholder="uzi datchik remont, ремонт узи датчика, датчик таъмирлаш"
              hint="Uchala tilda yozing — mijoz qaysi tilda qidirsa ham topadi."
            />
            <Input
              label="OG rasm URL (ixtiyoriy)"
              value={form.ogImage}
              onChange={(e) => set('ogImage', e.target.value)}
              placeholder="Bo'sh qoldiring — avtomatik generatsiya qilinadi"
              hint="Bo'sh bo'lsa, ijtimoiy tarmoq uchun rasm avtomatik yasaladi."
            />
          </Card>
        </div>

        {/* O'ng ustun — sozlamalar */}
        <div className="space-y-6">
          {form.kind === 'SERVICE' ? (
            <Card title="Xizmat sozlamalari" icon="wrench">
              <div className="border-l-2 border-blue-500 bg-ink-25 px-3.5 py-3">
                <p className="text-xs font-semibold text-ink-900">Xizmat narxi saytda ko'rsatilmaydi</p>
                <p className="mt-1 text-xs leading-relaxed text-ink-500">
                  Mijoz avval nima qilishimizni ko'radi. Narx diagnostikadan keyin telefon orqali aytiladi.
                  Bajarilish muddati ham saytda ko'rsatilmaydi — uni mijozga telefonda aytasiz.
                </p>
              </div>
              <Input label="Ishga kafolat" value={form.warranty} onChange={(e) => set('warranty', e.target.value)} placeholder="6 oy" />
            </Card>
          ) : (
          <Card title="Narx" icon="tags">
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Narxi"
                type="number"
                min="0"
                value={form.price}
                onChange={(e) => set('price', e.target.value)}
                placeholder="Bo'sh = kelishilgan holda"
              />
              <Select label="Valyuta" value={form.currency} onChange={(e) => set('currency', e.target.value)}>
                <option value="UZS">so'm (UZS)</option>
                <option value="USD">dollar (USD)</option>
              </Select>
            </div>
            <Input
              label="Narx izohi"
              value={form.priceNote}
              onChange={(e) => set('priceNote', e.target.value)}
              placeholder="dan boshlab / 1 dona / 1 rulon"
            />
          </Card>
          )}

          {form.kind === 'PART' && (
            <Card title="Zapchast pasporti" icon="box">
              <Input label="Artikul (SKU)" value={form.sku} onChange={(e) => set('sku', e.target.value)} placeholder="PRB-3C5A-MR" />
              <Input label="Brend" value={form.brand} onChange={(e) => set('brand', e.target.value)} placeholder="Mindray" />
              <Input label="Model" value={form.model} onChange={(e) => set('model', e.target.value)} placeholder="3C5A" />

              <Select
                label="Ishlab chiqarilgan davlat"
                value={form.originCountry}
                onChange={(e) => set('originCountry', e.target.value)}
              >
                {COUNTRIES.map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}
              </Select>

              <Input
                label="Ishlab chiqaruvchi zavod"
                value={form.manufacturer}
                onChange={(e) => set('manufacturer', e.target.value)}
                placeholder="Shenzhen Mindray Bio-Medical"
              />

              <Select
                label="Zapchast guruhi"
                value={form.partType}
                onChange={(e) => set('partType', e.target.value)}
              >
                <option value="SENSOR">Sensorlar va datchiklar</option>
                <option value="SCREEN">Ekranlar va monitorlar</option>
                <option value="POWER">Quvvat bloklari va batareyalar</option>
                <option value="CABLE">Kabellar va elektrodlar</option>
                <option value="MECHANICAL">Mexanik qismlar</option>
                <option value="CONSUMABLE">Sarf materiallari</option>
                <option value="OTHER">Boshqa</option>
              </Select>

              <Select label="Holati" value={form.condition} onChange={(e) => set('condition', e.target.value)}>
                <option value="NEW">Yangi, original</option>
                <option value="REFURBISHED">Tiklangan</option>
              </Select>

              <Input label="Kafolat" value={form.warranty} onChange={(e) => set('warranty', e.target.value)} placeholder="12 oy" />

              <div className="border-l-2 border-ok bg-ink-25 px-3.5 py-3">
                <p className="text-xs font-semibold text-ink-900">Ombor holati ko'rsatilmaydi</p>
                <p className="mt-1 text-xs leading-relaxed text-ink-500">
                  Saytda «omborda bor / yo'q» yozilmaydi. Har bir zapchast yonida
                  «istalgan miqdorda olib kelib beramiz» deb turadi — shuning uchun
                  bu yerda ombor soni so'ralmaydi.
                </p>
              </div>
            </Card>
          )}

          <Card title="Ko'rinishi" icon="eye">
            <Toggle
              label="Saytda ko'rinsin"
              description="O'chirilsa — mahsulot saytda chiqmaydi"
              checked={form.isActive}
              onChange={(v) => set('isActive', v)}
            />
            <Toggle
              label="Bosh sahifada ko'rsatilsin"
              description="«Ko'p so'raladigan» bo'limiga tushadi"
              checked={form.isFeatured}
              onChange={(v) => set('isFeatured', v)}
            />
            <Input
              label="Tartib raqami"
              type="number"
              value={form.sortOrder}
              onChange={(e) => set('sortOrder', e.target.value)}
              hint="Kichik raqam — ro'yxatda yuqorida turadi"
            />
          </Card>

          <Button onClick={save} variant="accent" loading={saving} size="lg" full icon={<Icon name="save" size={17} />}>
            Saqlash
          </Button>
        </div>
      </div>

      <ConfirmModal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={remove}
        loading={deleting}
        danger
        title="Mahsulotni o'chirasizmi?"
        description="Bu amalni orqaga qaytarib bo'lmaydi. Mahsulot saytdan butunlay yo'q qilinadi."
        confirmText="Ha, o'chirilsin"
        cancelText="Bekor qilish"
      />
    </>
  );
}

function Card({ title, icon, children }) {
  return <Panel title={title} icon={icon}>{children}</Panel>;
}
