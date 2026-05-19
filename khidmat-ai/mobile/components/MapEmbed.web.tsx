import React from 'react';

/** Web-only: real map tiles via iframe (OpenStreetMap) or static Google image. */
export default function MapEmbed({
  googleUrl,
  osmUrl,
  height,
}: {
  googleUrl: string | null;
  osmUrl: string | null;
  height: number;
}) {
  if (googleUrl) {
    return (
      <img
        src={googleUrl}
        alt="Provider map"
        style={{
          width: '100%',
          height,
          objectFit: 'cover',
          display: 'block',
          borderRadius: 12,
        }}
      />
    );
  }
  if (osmUrl) {
    return (
      <iframe
        title="Nearby providers map"
        src={osmUrl}
        style={{
          width: '100%',
          height,
          border: 0,
          borderRadius: 12,
          display: 'block',
        }}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      />
    );
  }
  return null;
}
