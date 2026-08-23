// Dinamik OG rasm — texnik datasheet uslubida (gradient yo'q, chiziqli tuzilma).
import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const revalidate = 86400;

export async function GET(request) {
  const { searchParams } = new URL(request.url);

  const title = (searchParams.get('title') || 'COM MEDICAL SERVIS').slice(0, 95);
  const subtitle = (searchParams.get('subtitle') || '').slice(0, 130);
  const badge = (searchParams.get('badge') || 'MEDSERVICE').slice(0, 30);
  const price = searchParams.get('price');

  const titleSize = title.length > 70 ? 46 : title.length > 45 ? 56 : 66;
  const HAIR = '#e3e7ee';

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
          background: '#ffffff', fontFamily: 'sans-serif', position: 'relative',
        }}
      >
        {/* Blueprint to'r */}
        <div
          style={{
            position: 'absolute', inset: 0, display: 'flex',
            backgroundImage:
              'linear-gradient(to right, rgba(30,144,255,.07) 1px, transparent 1px), linear-gradient(to bottom, rgba(30,144,255,.07) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />

        {/* Yuqori qator */}
        <div
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            borderBottom: `1px solid ${HAIR}`, padding: '26px 56px', position: 'relative',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 40, height: 40, background: '#1E90FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M2 12h4l2-6 3 12 2.5-8 1.5 4h7" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: 22, fontWeight: 700, color: '#141920', letterSpacing: -0.3 }}>COM MEDICAL SERVIS</span>
              <span style={{ fontSize: 11, color: '#8892a3', letterSpacing: 2.5, marginTop: 2 }}>TIBBIY APARATLAR XIZMATI</span>
            </div>
          </div>

          <div style={{ display: 'flex', background: '#141920', color: '#fff', padding: '8px 16px', fontSize: 16, letterSpacing: 2 }}>
            {badge.toUpperCase()}
          </div>
        </div>

        {/* Markaz */}
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'center', padding: '0 56px', position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 26 }}>
            <div style={{ width: 44, height: 3, background: '#1E90FF', display: 'flex' }} />
            <span style={{ fontSize: 14, letterSpacing: 3, color: '#657084' }}>COMMEDICAL.UZ</span>
          </div>

          <div style={{ fontSize: titleSize, fontWeight: 700, color: '#141920', lineHeight: 1.1, letterSpacing: -1.8, display: 'flex', maxWidth: 1010 }}>
            {title}
          </div>

          {subtitle && (
            <div style={{ marginTop: 22, fontSize: 24, color: '#657084', lineHeight: 1.4, display: 'flex', maxWidth: 900 }}>
              {subtitle}
            </div>
          )}
        </div>

        {/* Pastki qator */}
        <div
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            borderTop: `1px solid ${HAIR}`, padding: '22px 56px', position: 'relative',
          }}
        >
          <svg width="420" height="34" viewBox="0 0 420 34" fill="none">
            <path
              d="M0 18h70l9-12 7 24 9-30 8 18h66l10-9 7 16 9-21 7 14h66l9-10 8 20 9-26 7 16h109"
              stroke="#1E90FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.6"
            />
          </svg>

          {price ? (
            <div style={{ display: 'flex', background: '#1E90FF', color: '#fff', padding: '12px 22px', fontSize: 26, fontWeight: 700 }}>
              {price}
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 26, fontSize: 14, color: '#8892a3', letterSpacing: 1.5 }}>
              <span>SERVIS</span><span>·</span><span>ZAPCHAST</span><span>·</span><span>KALIBROVKA</span>
            </div>
          )}
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
