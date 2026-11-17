import { bannerFor } from './content';

type Props = {
  active: string;
  title: string;
  sub: string;
};

export default function ExBanner({ active, title, sub }: Props) {
  const image = bannerFor(active);

  return (
    <section className="ex-hero exl-banner" aria-label={title}>
      <img className="ex-hero__media" src={image.src} alt="" loading="eager" style={{ objectPosition: image.position }} />
      <div className="ex-hero__shade" aria-hidden="true" />
      <div className="ex-hero__content">
        <h1 className="ex-hero__title">{title}</h1>
        <p className="ex-hero__sub">{sub}</p>
      </div>
    </section>
  );
}
