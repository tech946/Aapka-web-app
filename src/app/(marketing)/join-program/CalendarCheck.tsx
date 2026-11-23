export default function CalendarCheck() {
  return (
    <svg className="jp-cal" width="34" height="34" viewBox="0 0 34 34" fill="none" aria-hidden="true">
      <rect className="jp-cal__sheet" x="4" y="8" width="26" height="18" rx="3" />
      <rect className="jp-cal__mark" x="21" y="4" width="4" height="8" rx="2" />
      <rect className="jp-cal__mark" x="10" y="4" width="4" height="8" rx="2" />
      <path
        className="jp-cal__mark"
        d="M34 22.5C34 26.6421 30.6421 30 26.5 30C22.3579 30 19 26.6421 19 22.5C19 18.3579 22.3579 15 26.5 15C30.6421 15 34 18.3579 34 22.5Z"
      />
      <path
        className="jp-cal__tick"
        d="M30.9146 21.1511C31.4512 20.6065 31.4512 19.7319 30.9146 19.1873C30.3667 18.6314 29.4697 18.6314 28.9218 19.1873L25.1509 23.0139L24.2543 22.104C23.7064 21.548 22.8095 21.548 22.2616 22.104C21.7249 22.6486 21.7249 23.5232 22.2616 24.0678L23.9833 25.815C24.6254 26.4665 25.6765 26.4665 26.3185 25.815L30.9146 21.1511Z"
      />
    </svg>
  );
}
