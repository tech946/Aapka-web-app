/**
 * Partner (agent) badge icon - a person silhouette with a solid accent dot.
 * Recoloured from the supplied asset onto the brand orange: soft #ffc9b3 tint
 * for the figure, #fd6b06 for the dot.
 */
export default function PartnerIcon({
  size = 22,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox='0 0 34 34'
      fill='none'
      xmlns='http://www.w3.org/2000/svg'
      className={className}
      aria-hidden='true'
      focusable='false'
    >
      <g clipPath='url(#partner-icon-clip)'>
        <path
          d='M4.99902 27.9046C4.99902 21.2765 10.3722 15.9033 17.0003 15.9033C23.6284 15.9033 29.0016 21.2765 29.0016 27.9046V28.4246C29.0016 31.0843 26.8455 33.2404 24.1857 33.2404H9.8149C7.15517 33.2404 4.99902 31.0843 4.99902 28.4246V27.9046Z'
          fill='#FFC9B3'
        />
        <ellipse
          cx='8.00108'
          cy='8.00153'
          rx='8.00108'
          ry='8.00153'
          transform='matrix(0.866001 -0.500042 0.499958 0.866049 6.3291 5.23438)'
          fill='#FFC9B3'
        />
        <circle cx='17' cy='25' r='4' fill='#FD6B06' />
      </g>
      <defs>
        <clipPath id='partner-icon-clip'>
          <rect width='34' height='34' fill='white' />
        </clipPath>
      </defs>
    </svg>
  );
}
