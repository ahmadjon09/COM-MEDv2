// Next.js keshini tozalash. Windows/macOS/Linux'da bir xil ishlaydi.
// Sabab: inline `node -e "..."` buyrug'i Windows cmd'da qo'shtirnoqlar tufayli buziladi.
import { rmSync, existsSync } from 'node:fs';

for (const dir of ['.next', 'node_modules/.cache']) {
  if (existsSync(dir)) {
    rmSync(dir, { recursive: true, force: true });
    console.log(`✔ ${dir} tozalandi`);
  }
}
console.log('Tayyor. Endi: npm run dev');
