# Admin panel qo'llanmasi (O'zbekcha)

> Bu qo'llanma texnik bilim talab qilmaydi. Har bir qadam alohida yozilgan — ketma-ket bajaring.

---

## 1. Tizimga kirish

1. Brauzerda saytingiz manziliga `/admin` qo'shib kiring. Masalan: `https://medservice.uz/admin`
2. Ochilgan oynada **Login** va **Parol** ni kiriting (ularni sizga sayt o'rnatgan mutaxassis beradi).
3. **Kirish** tugmasini bosing.

**Parolni unutdingizmi?** Bazaga kirish huquqiga ega mutaxassis parolni qayta tiklaydi — o'zingiz tiklay olmaysiz (bu xavfsizlik uchun).

> ⚠️ Admin panel qidiruv tizimlarida ko'rinmaydi va oddiy mijozlar uni topa olmaydi.

---

## 2. Bosh sahifa (Dashboard)

Kirganingizdan keyin birinchi ko'radigan ekran. Bu yerda:

| Ko'rsatkich | Ma'nosi |
|---|---|
| **Yangi arizalar** | Hali ko'rilmagan mijoz so'rovlari |
| **Oxirgi 7 kun** | Bir hafta ichida kelgan arizalar soni |
| **Jami arizalar** | Butun vaqt davomidagi soni |
| **Faol mahsulotlar** | Saytda ko'rinib turgan pozitsiyalar soni |

Pastda **oxirgi 6 ta ariza** ko'rinadi. Telefon raqamiga bosib, to'g'ridan-to'g'ri qo'ng'iroq qilishingiz mumkin.

Agar sariq rangda **"N ta ariza Telegramga yuborilmagan"** yozuvi chiqsa — bot sozlamalarida muammo bor, mutaxassisga ayting. **Arizalar yo'qolmaydi** — hammasi shu panelda saqlanadi.

---

## 3. Mahsulot yoki xizmat qo'shish

### 3.1 Yangi qo'shish

1. Chap menyudan **"Mahsulot va xizmatlar"** ni tanlang.
2. O'ng yuqorida **"Yangi qo'shish"** tugmasini bosing.

### 3.2 Maydonlarni to'ldirish

**Kategoriya** — mahsulot qaysi bo'limga tegishli (UZI, EKG va h.k.). Ro'yxatdan tanlaysiz.

**Turi:**
- **Zapchast** — sotiladigan ehtiyot qism (datchik, akkumulyator, kabel...)
- **Xizmat** — bajariladigan ish (ta'mirlash, kalibrlash, diagnostika...)

**Nomi** — eng muhim maydon. **Uchta til** uchun alohida to'ldiriladi:

```
┌──────────────────────────────── [UZ] [RU] [ЎЗ]
│ UZI datchigini ta'mirlash
└────────────────────────────────
```

Yuqori o'ngdagi **UZ / RU / ЎЗ** tugmalarini bosib tilni almashtirasiz. Har bir tugmaning ustidagi nuqta:
- 🟢 **yashil** — bu tilda matn kiritilgan
- ⚪ **kulrang** — bo'sh, to'ldirish kerak

> ❗ Uchala til ham to'ldirilishi **shart**. Aks holda saqlanmaydi.

**Qisqa tavsif** — 1–2 jumla. Mijoz katalog ro'yxatida shu matnni o'qiydi. Uni "tirik" tilda yozing, masalan:
> *"Yorilgan linza, uzilgan kabel — datchikni yangisiga almashtirmasdan tiklaymiz."*

**To'liq tavsif** — mahsulot sahifasidagi asosiy matn. Yangi qatordan boshlab yozsangiz, saytda alohida paragraf bo'ladi.

### 3.3 Rasmlar

1. **"Rasm qo'shish"** kvadratini bosing.
2. Kompyuteringizdan bir yoki bir nechta rasmni tanlang.
3. Yuklanishni kuting (aylanuvchi belgi ko'rinadi).

- **Birinchi rasm — asosiy.** U katalogda va ijtimoiy tarmoqlarda ko'rinadi.
- Rasmni o'chirish uchun ustiga sichqonchani olib boring va ✕ tugmasini bosing.
- Maksimal **8 ta rasm**, har biri **8 MB** gacha.

### 3.4 Narx

- **Narxi** — faqat raqam yozing (masalan `1500000`). Bo'sh qoldirsangiz saytda *"Kelishilgan holda"* deb ko'rinadi.
- **Valyuta** — so'm yoki dollar.
- **Narx izohi** — masalan *"dan boshlab"*, *"1 soatlik ish"*, *"shartnoma asosida"*.

### 3.5 Ko'rinishi

| Tugma | Nima qiladi |
|---|---|
| **Saytda ko'rinsin** | O'chirsangiz — mahsulot saytdan yo'qoladi (lekin o'chib ketmaydi) |
| **Bosh sahifada ko'rsatilsin** | Bosh sahifadagi "Ko'p so'raladigan" bo'limiga chiqadi |
| **Omborda bor** | Zapchastlar uchun. O'chirsangiz — "Buyurtma asosida" deb yoziladi |
| **Tartib raqami** | Kichik raqam — ro'yxatda yuqorida turadi (0, 1, 2...) |

### 3.6 Saqlash

Pastdagi yoki yuqoridagi **"Saqlash"** tugmasini bosing. Yashil xabar chiqsa — hammasi joyida, mahsulot **darhol** saytda paydo bo'ladi.

---

## 4. SEO — Google'da yuqorida chiqish uchun

Formaning **"Qidiruv tizimlari uchun (SEO)"** bo'limi.

**Meta sarlavha** — Google natijasidagi ko'k havola matni. 60–65 belgi. Bo'sh qoldirsangiz mahsulot nomi ishlatiladi.

Yaxshi misol:
> *UZI datchigini ta'mirlash — narxi va muddati | MedService*

**Meta tavsif** — sarlavha ostidagi kulrang matn. 150–160 belgi. Mijozni bosishga undaydigan jumla yozing:
> *Convex, linear va sektor datchiklarini tiklash. Bepul diagnostika, 6 oy kafolat, 3–10 kunda tayyor.*

**Kalit so'zlar** — vergul bilan ajrating. **Uchala tilda ham yozing**, chunki mijozlar turlicha qidiradi:
```
uzi datchik remont, ремонт узи датчика, узи датчик таъмирлаш, convex probe repair
```

**OG rasm** — bo'sh qoldiring. Sayt uni **avtomatik yasaydi** (mahsulot nomi va logotip bilan chiroyli rasm). Telegram yoki Facebook'ga havola tashlaganda o'sha rasm ko'rinadi.

---

## 5. Mahsulotni tahrirlash yoki o'chirish

1. **"Mahsulot va xizmatlar"** ro'yxatiga o'ting.
2. Kerakli qatorni toping (yuqoridagi qidiruv va filtrlardan foydalaning).
3. 🔧 tugmasi — **tahrirlash**, ✕ tugmasi — **o'chirish**.
4. Yashil **"● SAYTDA"** yozuviga bosib, mahsulotni tez yashirish yoki qaytarish mumkin.

> O'chirishdan oldin tasdiqlash oynasi chiqadi. **O'chirilgan mahsulotni qaytarib bo'lmaydi** — shubhalansangiz, o'chirish o'rniga uni "yashirin" qiling.

---

## 6. Kategoriyalar

Chap menyudan **"Kategoriyalar"**.

- **Yangi kategoriya** tugmasi — yangi bo'lim qo'shadi (nom uchala tilda).
- **Ikonka** — ro'yxatdan tanlaysiz (UZI, EKG, IVL...). Saytda kartada ko'rinadi.
- **Tartib raqami** — bo'limlar ketma-ketligini boshqaradi.

> ❗ Ichida mahsulot bor kategoriyani o'chirib bo'lmaydi. Avval mahsulotlarni boshqa kategoriyaga ko'chiring.

---

## 7. Arizalar

Chav menyudan **"Arizalar"**.

Yuqoridagi tugmalar bilan filtrlash:
- **Yangi** — hali ishlanmaganlar
- **Jarayonda** — qo'ng'iroq qilingan, ish boshlangan
- **Bajarildi** — yopilgan
- **Spam** — keraksiz

**Har bir ariza uchun:**
- 📞 Telefon raqamiga bosib qo'ng'iroq qiling.
- Holat ro'yxatidan yangi holatni tanlang — darhol saqlanadi.
- 🔍 tugmasi — to'liq ma'lumot: mijoz izohi, qaysi mahsulot bo'yicha, Telegramga yuborilgani.
- **Ichki izoh** — faqat siz ko'rasiz. Masalan: *"Ertaga soat 10 da chiqamiz"*.

Agar ariza yonida sariq **"⚠ TG yuborilmadi"** yozuvi bo'lsa — Telegram bot ishlamagan, lekin ariza saqlangan. Mijozga baribir qo'ng'iroq qiling.

---

## 8. Sayt sozlamalari

Chap menyudan **"Sayt sozlamalari"**. To'rtta bo'limdan iborat:

### Umumiy
- **Sayt nomi** va **shior** — header va footer'da ko'rinadi.
- **Biz haqimizda** — kompaniya haqidagi matn.
- **Ish vaqti**.

### Aloqa
- **Telefon raqamlar** — istagancha qo'shishingiz mumkin. **"ASOSIY"** deb belgilangan raqam sayt yuqorisida ko'rinadi.
  - Raqamni **+998 90 123 45 67** ko'rinishida kiritasiz — bayroqcha avtomatik tanlanadi.
- **Manzil** — uchala tilda.
- **Xarita** — Google Maps'dan olingan havola. Olish tartibi: Google Maps → joyni toping → **Share** → **Embed a map** → HTML kodidagi `src="..."` ichidagi havolani nusxalang.
- **Elektron pochta** va **ijtimoiy tarmoq** havolalari.

### SEO
Bosh sahifa uchun meta sarlavha va tavsif (yuqoridagi 4-bo'limdagi qoidalar bir xil).

### Hujjatlar
**Foydalanish shartlari** va **Maxfiylik siyosati** matnlari. Bo'sh qoldirsangiz — saytdagi tayyor standart matn ko'rsatiladi.

> Matnda `## Sarlavha` deb yozsangiz — u sarlavha bo'ladi, `- ` bilan boshlansa — ro'yxat elementi.

**Har qanday o'zgarishdan keyin pastdagi katta "Saqlash" tugmasini bosing.** O'zgarish saytda **bir necha soniyada** ko'rinadi.

---

## 9. Mening profilim

Chap menyudan **"Mening profilim"**.

- **To'liq ism** va **login** ni o'zgartirishingiz mumkin.
- **Parolni o'zgartirish**: joriy parolni, keyin yangi parolni ikki marta kiriting.

> ⚠️ Parolni o'zgartirsangiz, **barcha qurilmalardan chiqarilasiz** va yangi parol bilan qaytadan kirishingiz kerak bo'ladi. Bu — xavfsizlik chorasi.

**Yaxshi parol:** kamida 8 belgi, katta va kichik harflar, raqamlar aralash. Masalan: `Med2026!servis`

---

## 10. Tez-tez so'raladigan savollar

**Mahsulot qo'shdim, lekin saytda ko'rinmayapti.**
Tekshiring: 1) "Saytda ko'rinsin" yoqilganmi? 2) Kategoriya faolmi? 3) Sahifani `Ctrl+F5` bilan yangilang.

**Rasm yuklanmayapti.**
Fayl 8 MB dan katta bo'lishi mumkin. Rasmni kichraytiring yoki boshqa formatda (JPG, PNG) saqlab ko'ring.

**Narx noto'g'ri ko'rinmoqda.**
Narxni faqat raqam bilan yozing — probel, nuqta yoki "so'm" so'zisiz. To'g'ri: `1500000`. Noto'g'ri: `1 500 000 so'm`.

**Ariza kelmayapti.**
Saytdagi formani o'zingiz to'ldirib sinab ko'ring. Ariza "Arizalar" bo'limida paydo bo'lsa — hammasi ishlayapti. Chiqmasa — mutaxassisga murojaat qiling.

**Bir vaqtda ikkita odam kirsa bo'ladimi?**
Ha, muammo yo'q. Lekin bir xil mahsulotni bir vaqtda tahrirlamang — oxirgi saqlagan g'olib bo'ladi.

---

## 11. Xavfsizlik bo'yicha 5 ta qoida

1. Parolni **hech kimga** aytmang, qog'ozga yozib monitor yoniga yopishtirmang.
2. Ishni tugatgach **"Chiqish"** tugmasini bosing (ayniqsa umumiy kompyuterda).
3. Parolni yiliga kamida bir marta yangilang.
4. Shubhali xat yoki havolalarga bosmang — hech kim sizdan parolni so'ramaydi.
5. Nimadir noto'g'ri ketganini sezsangiz — darhol parolni o'zgartiring va mutaxassisga xabar bering.

---

# 12. YANGILANISH: Xizmat va Zapchast alohida bo'ldi

Saytda endi **ikkita mustaqil bo'lim** bor:

| Bo'lim | URL | Nima ko'rsatiladi |
|---|---|---|
| **Xizmatlar** | `/uz/services` | Ish tarkibi ("nimalar kiradi"), muddat, kafolat. **Narx ko'rsatilmaydi.** |
| **Zapchastlar** | `/uz/parts` | Rasm, artikul, brend, **ishlab chiqarilgan davlat**, texnik xarakteristikalar, **narx**. |

Admin panelda ikkalasi ham **"Mahsulot va xizmatlar"** bo'limida boshqariladi — formada **"Turi"** ni tanlaganingizda kerakli maydonlar avtomatik almashadi.

## 12.1 Turi = XIZMAT bo'lsa

Narx maydoni **umuman ko'rinmaydi** — bu ataylab qilingan. Buning o'rniga:

**Xizmatga nimalar kiradi** — bu eng muhim blok. Uchta til uchun alohida ro'yxat.
- **+ Qator qo'shish** tugmasi bilan yangi punkt qo'shasiz.
- ↑ ↓ tugmalari bilan tartibini o'zgartirasiz.
- ✕ tugmasi bilan o'chirasiz.

Har bir punktni **bajariladigan aniq ish** sifatida yozing, umumiy gap emas:

| ✅ Yaxshi | ❌ Yomon |
|---|---|
| Piezoelementlarni bittalab tekshirish | Sifatli xizmat |
| Kalibrlash signali bo'yicha aniqlikni sozlash | Professional yondashuv |
| O'lchov protokolini rasmiylashtirish | Tez va arzon |

**Bajarilish muddati** — 3 tilda. Masalan: *"3–10 ish kuni"*, *"Chaqiruvdan 4 soat ichida"*, *"Yillik shartnoma"*.

**Ishga kafolat** — masalan *"6 oy"*.

## 12.2 Turi = ZAPCHAST bo'lsa

Qo'shimcha **"Zapchast pasporti"** bloki ochiladi:

| Maydon | Nima yoziladi | Misol |
|---|---|---|
| **Artikul (SKU)** | Ichki kod. Katalogda rasm ustida ko'rinadi | `PRB-3C5A-MR` |
| **Brend** | Ishlab chiqaruvchi brend | `Mindray` |
| **Model** | Aniq model raqami | `3C5A` |
| **Ishlab chiqarilgan davlat** | Ro'yxatdan tanlanadi | Xitoy (CN) |
| **Ishlab chiqaruvchi zavod** | To'liq nomi | `Shenzhen Mindray Bio-Medical` |
| **Holati** | Yangi yoki tiklangan | Yangi, original |
| **Kafolat** | Muddat | `12 oy` |
| **To'plamdagi soni** | Nechta dona | `1` |

> Davlat mijozlar uchun eng muhim ma'lumotlardan biri — katalogda **filtr** sifatida ham ishlaydi. To'ldirishni unutmang.

## 12.3 Texnik xarakteristikalar jadvali

Zapchast tanlanganda **"Xarakteristikalar va moslik"** bloki chiqadi.

Jadval to'rtta ustundan iborat:

```
Yorliq (UZ)          Yorliq (RU)         Yorliq (ЎЗ)         Qiymat
─────────────────────────────────────────────────────────────────────
Chastota diapazoni   Диапазон частот     Частота диапазони   2.0 – 5.0 MGts
Elementlar soni      Количество элем.    Элементлар сони     80
Kabel uzunligi       Длина кабеля        Кабель узунлиги     2.2 m
```

- **Yorliq** — uch tilda yoziladi (mijoz o'z tilida ko'radi).
- **Qiymat** — bitta ustun, tarjima qilinmaydi (raqam, o'lchov birligi).
- Bo'sh qolgan qatorlar saqlashda avtomatik tashlab yuboriladi.

**Mos keladigan apparatlar** — mijoz aynan shu ro'yxatga qarab zapchast to'g'ri kelishini tekshiradi. Har bir apparatni alohida qator qilib yozing: `Mindray DP-50`, `Mindray DC-N3` va h.k.

## 12.4 Nimani qayerga yozish kerak — qisqa jadval

| Ma'lumot | Xizmat | Zapchast |
|---|---|---|
| Narx | ❌ yo'q | ✅ bor |
| Nimalar kiradi (ro'yxat) | ✅ bor | ❌ yo'q |
| Bajarilish muddati | ✅ bor | ❌ yo'q |
| Artikul / brend / model | ❌ yo'q | ✅ bor |
| Ishlab chiqarilgan davlat | ❌ yo'q | ✅ bor |
| Xarakteristikalar jadvali | ❌ yo'q | ✅ bor |
| Moslik ro'yxati | ❌ yo'q | ✅ bor |
| Kafolat | ✅ bor | ✅ bor |
| Rasmlar, SEO, kalit so'zlar | ✅ bor | ✅ bor |

## 12.5 Eski havolalar

Eski `/catalog` va `/product/...` manzillar avtomatik yangisiga yo'naltiriladi — Google'dagi mavjud o'rinlar yo'qolmaydi.


---

# 13. Zapchast guruhi (yangi maydon)

Zapchast qo'shayotganda **"Zapchast guruhi"** ro'yxati chiqadi. Bu — eski saytdagi
"Sensorlar / Ekranlar / Quvvat bloklari" bo'linishining kengaytirilgan varianti:

| Guruh | Nimalar kiradi |
|---|---|
| Sensorlar va datchiklar | UZI datchigi, SpO₂, oqim va bosim sensorlari |
| Ekranlar va monitorlar | LCD matritsa, monitor, shleyf |
| Quvvat bloklari va batareyalar | adapter, akkumulyator, quvvat platasi, TEN |
| Kabellar va elektrodlar | EKG kabeli, elektrod plastinalari, razyomlar |
| Mexanik qismlar | turbina, klapan, zichlagich, rotor |
| Sarf materiallari | qog'oz, nafas konturi, filtr |
| Boshqa | yuqoridagilarga kirmaydigan qismlar |

Guruh katalogda **filtr** sifatida ishlaydi — mijoz "faqat sensorlarni ko'rsat" deb tanlashi mumkin.
Shuning uchun har bir zapchast uchun to'g'ri guruhni belgilang.

> **Eslatma:** bosh sahifadagi "Ko'p so'raladigan savollar" (FAQ) va "Mijozlar fikri" bloklari
> hozircha sayt kodida saqlanadi, admin paneldan tahrirlanmaydi. Ularni o'zgartirish kerak bo'lsa —
> mutaxassisga murojaat qiling.


---

# 14. Ombor holati endi ko'rsatilmaydi

Saytda **«omborda bor / yo'q»** yozuvi va zapchast soni **ko'rsatilmaydi**. Har bir zapchast yonida
doim shunday yoziladi:

> **Istalgan miqdorda olib kelib beramiz** — nechta kerak bo'lsa, shuncha keltiramiz.
> Yetkazib berish muddatini so'rov bo'yicha aytamiz.

Shuning uchun admin formasida ham **«Omborda bor»** tugmasi va **«To'plamdagi soni»** maydoni yo'q —
ularni to'ldirish shart emas.

Nima qilish kerak: zapchastni qo'shganda faqat **narx, brend, davlat, xarakteristikalar va moslik**ni
to'ldiring. Mijoz nechta kerakligini ariza yoki qo'ng'iroq orqali aytadi, siz esa keltirasiz.


---

# 15. Muddat va ish soatlari ko'rsatilmaydi

Saytda quyidagilar **yozilmaydi**:

- xizmat necha kunda/soatda bajarilishi ("3–10 ish kuni" kabi);
- chaqiruvga necha soatda yetib borish;
- kompaniyaning ish soatlari (8:30–18:00 kabi).

Sabab: har bir ish hajmi boshqacha, oldindan aytilgan muddat keyin muammo bo'ladi.
Muddatni mijozga **telefonda, diagnostikadan keyin** aytasiz.

Shuning uchun admin panelida:

- mahsulot formasida **"Bajarilish muddati"** maydoni yo'q;
- sayt sozlamalarida **"Ish vaqti"** bo'limi yo'q.

Kafolat muddati (6–12 oy) esa qoladi — u ishning natijasiga beriladigan kafolat, va'da qilingan
bajarilish muddati emas.


---

# 16. AI yordamchi ariza qabul qila oladi

Saytdagi chat yordamchisi endi **o'zi ariza rasmiylashtiradi**.

Qanday ishlaydi:

1. Mijoz narx, chaqiruv yoki zapchast haqida so'raydi.
2. Yordamchi javob beradi va ariza qoldirishni taklif qiladi.
3. Mijozdan **ismi** va **telefon raqamini** so'raydi. Ikkalasi bo'lmaguncha arizani yubormaydi.
4. Ma'lumot kelgach ariza avtomatik yaratiladi: **Arizalar** bo'limiga tushadi va Telegramga ketadi.

Telefon raqamini mijoz istalgan ko'rinishda yozishi mumkin — `90 275 88 83`, `998901234567`,
`+998 90 123 45 67` — hammasi bir xil formatga keltiriladi.

Bunday arizalarni **Arizalar** ro'yxatida ajratib olish oson: ular «AI yordamchi orqali» belgisi
bilan Telegramga keladi. Ular ham oddiy arizalar kabi ko'rib chiqiladi.

> Javoblar endi **jonli yoziladi** (token-token), xuddi odam yozayotgandek. Bu foydalanuvchiga
> kutish qulayroq tuyulishi uchun qilingan.


---

# 17. AI narxlarni ko'radi va maslahat beradi

Yordamchi endi zapchast **narxlarini bazadan o'qiydi** va shu asosda tavsiya beradi:

| Mijoz nima deydi | Yordamchi nima qiladi |
|---|---|
| «Ekranda chiziq bor» | Sababni aytadi (matritsa/shleyf) va mos zapchastlarni ko'rsatadi |
| «Apparat yonmayapti» | Quvvat bloki va akkumulyatorni tekshirishni tavsiya qiladi |
| «10 mln gacha bormi?» | Faqat shu narxdan pastdagilarni qidiradi |
| «Qaysi biri yaxshiroq?» | Ikkitasini solishtiradi: narx farqi, davlat, kafolat |

Javob bilan birga chatda **mahsulot kartalari** chiqadi — rasm, artikul, narx, davlat va sahifaga havola.
Mijoz kartani bosib to'g'ridan-to'g'ri zapchast sahifasiga o'tadi.

**Muhim:** yordamchi narxni o'zidan to'qimaydi — faqat siz admin panelda kiritgan qiymatni aytadi.
Shuning uchun narxlarni yangilab turing. Narx bo'sh bo'lsa, u «kelishilgan holda» deb ko'rsatiladi.

Yordamchi har tavsiyada **bepul diagnostika**ni eslatadi — mijoz noto'g'ri qism sotib olmasligi uchun.


---

# 18. Admin panel yangilandi

Ko'rinish qayta ishlangan — mantiq va maydonlar o'zgarmadi, faqat qulayroq bo'ldi:

**Yon menyu** endi uch guruhga bo'lingan: *Asosiy*, *Katalog*, *Sozlamalar*. Yangi arizalar soni
menyuda ko'k doiracha bilan ko'rinadi — sahifani ochmasdan ham bilib turasiz.

**Yuqori qator** — joriy bo'lim nomi va "N yangi ariza" tugmasi (bosilsa arizalarga o'tadi).

**Boshqaruv sahifasi** — to'rtta karta (yangi arizalar, oxirgi 7 kun, jami, faol pozitsiyalar).
Har biri bosiladigan: kartani bossangiz tegishli ro'yxat filtri bilan ochiladi.

**Ro'yxatlarda** endi ikonkali tugmalar: ✏️ tahrirlash, 🗑 o'chirish, 👁 ko'rish.
"Saytda / Yashirin" tugmasi ko'z belgisi bilan — bir bosishda holat almashadi.

**Bo'sh holatlar** — ro'yxat bo'sh bo'lsa nima qilish kerakligi yozib qo'yilgan va tugma bor.

**Pastki chap burchakda** — "Saytni ochish" havolasi (yangi oynada ochiladi) va profil kartasi.
