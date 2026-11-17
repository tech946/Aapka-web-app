export function Roll({ children, bottomClass }: { children: React.ReactNode; bottomClass?: string }) {
  return (
    <span className="fr-roll">
      <span className="fr-roll__top">{children}</span>
      <span className={'fr-roll__bottom' + (bottomClass ? ' ' + bottomClass : '')} aria-hidden="true">
        {children}
      </span>
    </span>
  );
}
