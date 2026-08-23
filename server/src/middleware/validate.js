// Zod sxemalari orqali body/query/params validatsiyasi.
import { badRequest } from '../lib/errors.js';

/**
 * @param {{body?:import('zod').ZodTypeAny, query?:import('zod').ZodTypeAny, params?:import('zod').ZodTypeAny}} schemas
 */
export const validate = (schemas) => (req, _res, next) => {
  try {
    for (const key of ['body', 'query', 'params']) {
      if (!schemas[key]) continue;
      const result = schemas[key].safeParse(req[key]);
      if (!result.success) {
        const details = result.error.issues.map((i) => ({
          field: i.path.join('.'),
          message: i.message,
        }));
        return next(badRequest('Kiritilgan maʼlumotlar noto\'g\'ri', details));
      }
      // Query obyekti Express 5'da faqat o'qish uchun bo'lishi mumkin — shuning uchun alohida saqlaymiz
      if (key === 'query') req.validatedQuery = result.data;
      else req[key] = result.data;
    }
    next();
  } catch (e) {
    next(e);
  }
};
