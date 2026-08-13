'use client';

import { applyAgentDiscount } from '@/lib/agent-discount';
import './agent-discount-price.css';

interface AgentDiscountBadgeProps {
  /** Agent discount percentage, when the label should read "Agent Discount 5%". */
  percentage?: number;
  /** Pre-formatted saving, when the label should read "Agent Discount -180.00". */
  amount?: string;
}

/**
 * Compact "Agent Discount" pill in brand orange. Renders nothing when there is
 * neither a percentage nor an amount to show.
 */
export function AgentDiscountBadge({
  percentage,
  amount,
}: AgentDiscountBadgeProps) {
  const hasPercentage = typeof percentage === 'number' && percentage > 0;
  if (!hasPercentage && !amount) return null;

  return (
    <span className='agent-discount-badge'>
      Agent Discount
      {hasPercentage && <span>{percentage}%</span>}
      {amount && <span className='agent-discount-badge-amount'>{amount}</span>}
    </span>
  );
}

interface AgentDiscountPriceProps {
  /** Public price, before any agent discount. */
  price: number | null | undefined;
  /** Agent discount percentage (0 = no discount, render price as-is). */
  percentage: number;
  /** Caller-supplied formatter so each surface keeps its own currency style. */
  format: (price: number) => string;
}

/**
 * Renders a price for a subscribed partner: the public price struck through,
 * followed by the discounted price. Falls back to plain price rendering when
 * no discount applies, so it is safe to use unconditionally.
 */
export function AgentDiscountPrice({
  price,
  percentage,
  format,
}: AgentDiscountPriceProps) {
  const numeric = Number(price);
  const hasPrice = price != null && Number.isFinite(numeric);

  if (!hasPrice) return <>N/A</>;
  if (percentage <= 0) return <>{format(numeric)}</>;

  const discounted = applyAgentDiscount(numeric, percentage) as number;

  return (
    <span className='agent-price'>
      <span className='agent-price-original'>{format(numeric)}</span>
      <span className='agent-price-discounted'>{format(discounted)}</span>
    </span>
  );
}
