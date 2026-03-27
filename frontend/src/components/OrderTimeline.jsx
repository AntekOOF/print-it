import { CheckCircle2, Clock3, PackageCheck, PackageOpen, Receipt } from 'lucide-react';
import { formatDateTime, formatLabel } from '../lib/formatters.js';

const STATUS_STEPS = [
  {
    key: 'pending',
    label: 'Submitted',
    icon: Receipt,
  },
  {
    key: 'preparing',
    label: 'Preparing',
    icon: Clock3,
  },
  {
    key: 'ready',
    label: 'Ready',
    icon: PackageOpen,
  },
  {
    key: 'completed',
    label: 'Completed',
    icon: PackageCheck,
  },
];

const STATUS_INDEX = {
  pending: 0,
  preparing: 1,
  ready: 2,
  completed: 3,
};

function OrderTimeline({ events = [], paymentStatus, status }) {
  const currentIndex = status === 'cancelled' ? -1 : (STATUS_INDEX[status] ?? 0);

  return (
    <div className="timeline">
      <div className={`timeline__progress${status === 'cancelled' ? ' timeline__progress--cancelled' : ''}`}>
        {STATUS_STEPS.map((step, index) => {
          const Icon = step.icon;
          const isDone = currentIndex >= index;
          const isCurrent = currentIndex === index;

          return (
            <div
              className={`timeline__step${isDone ? ' timeline__step--done' : ''}${isCurrent ? ' timeline__step--current' : ''}`}
              key={step.key}
            >
              <span className="timeline__step-icon">
                <Icon size={16} />
              </span>
              <div>
                <strong>{step.label}</strong>
                <small>{isDone ? 'Reached' : 'Pending'}</small>
              </div>
            </div>
          );
        })}
      </div>

      <div className="timeline__summary">
        <span className="pill">{formatLabel(status)}</span>
        <span className={`availability-pill${paymentStatus === 'paid' ? '' : ' availability-pill--warning'}`}>
          Payment {formatLabel(paymentStatus)}
        </span>
      </div>

      {status === 'cancelled' ? (
        <div className="timeline__cancelled">
          <CheckCircle2 size={18} />
          <div>
            <strong>Order cancelled</strong>
            <p>The order was marked as cancelled and was removed from the normal fulfillment flow.</p>
          </div>
        </div>
      ) : null}

      {events.length ? (
        <div className="timeline__events">
          {events.map((event) => (
            <article className="timeline__event" key={event.id}>
              <div className="timeline__event-dot" />
              <div>
                <strong>{event.title}</strong>
                {event.description ? <p>{event.description}</p> : null}
                <small>{formatDateTime(event.createdAt)}</small>
              </div>
            </article>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export default OrderTimeline;
