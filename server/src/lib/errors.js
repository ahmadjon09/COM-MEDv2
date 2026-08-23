// Ilova xatoliklari uchun yagona sinf va async route'lar uchun o'ram (wrapper).
export class AppError extends Error {
  /**
   * @param {number} status HTTP status kodi
   * @param {string} message foydalanuvchiga ko'rsatiladigan xabar
   * @param {string} [code] mashina o'qiy oladigan kod
   * @param {any} [details] qo'shimcha ma'lumot (validatsiya xatolari va h.k.)
   */
  constructor(status, message, code = 'ERROR', details = undefined) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
    this.isOperational = true; // kutilgan (operatsion) xato
  }
}

export const badRequest = (m, d) => new AppError(400, m, 'BAD_REQUEST', d);
export const unauthorized = (m = 'Avtorizatsiya talab qilinadi') => new AppError(401, m, 'UNAUTHORIZED');
export const forbidden = (m = 'Ruxsat yo\'q') => new AppError(403, m, 'FORBIDDEN');
export const notFound = (m = 'Topilmadi') => new AppError(404, m, 'NOT_FOUND');
export const conflict = (m) => new AppError(409, m, 'CONFLICT');

// try/catch'ni har bir handler ichida yozmaslik uchun
export const ah = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
