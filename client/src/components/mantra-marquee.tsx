const SHIVA_MANTRA =
  "ॐ त्र्यम्बकं यजामहे सुगन्धिं पुष्टिवर्धनम् । उर्वारुकमिव बन्धनान् मृत्योर्मुक्षीय मामृतात् ॥";

function MantraGroup() {
  return (
    <div className="mantra-marquee-group">
      {[0, 1, 2].map((item) => (
        <span key={item} className="mantra-marquee-item">
          {SHIVA_MANTRA}
        </span>
      ))}
    </div>
  );
}

export function MantraMarquee() {
  return (
    <section
      className="mantra-marquee relative z-10 bg-primary/[0.03] py-9 md:py-11"
      aria-label="Shiva mantra"
    >
      <p className="sr-only">{SHIVA_MANTRA}</p>
      <div className="mantra-marquee-viewport">
        <div className="mantra-marquee-track" aria-hidden="true">
          <MantraGroup />
          <MantraGroup />
        </div>
      </div>
    </section>
  );
}