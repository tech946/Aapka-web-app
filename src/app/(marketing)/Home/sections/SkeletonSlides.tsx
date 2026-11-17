/* Placeholder slides while a section's packages load, sized like the real
   ones so the page doesn't jump when data lands. */
export default function SkeletonSlides({ count, perView, className = '' }: { count: number; perView: number; className?: string }) {
  return (
    <>
      {Array.from({ length: count }, (_, i) => (
        <div className="tc-slide" key={i} style={{ width: `calc((100% - ${(perView - 1) * 16}px) / ${perView})`, marginRight: i === count - 1 ? 0 : 16 }} aria-hidden="true">
          <div className={'home_skel ' + className} />
        </div>
      ))}
    </>
  );
}
