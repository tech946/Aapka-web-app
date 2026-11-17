'use client';

export default function FrLightbox({ src, onClose }: { src: string; onClose: () => void }) {
  return (
    <div className="fr-lightbox" role="dialog" aria-modal="true">
      <button type="button" className="fr-lightbox__close" onClick={onClose} aria-label="Close video">
        ×
      </button>
      <video className="fr-lightbox__video" src={src} autoPlay controls playsInline onClick={(e) => e.stopPropagation()} />
    </div>
  );
}
