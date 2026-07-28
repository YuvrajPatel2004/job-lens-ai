const statusConfig = {
  saved: { label: 'Saved', class: 'status-saved' },
  applied: { label: 'Applied', class: 'status-applied' },
  screening: { label: 'Screening', class: 'status-screening' },
  interview: { label: 'Interview', class: 'status-interview' },
  offer: { label: 'Offer', class: 'status-offer' },
  rejected: { label: 'Rejected', class: 'status-rejected' },
  withdrawn: { label: 'Withdrawn', class: 'status-withdrawn' },
};

const Badge = ({ status, size = 'sm', className = '' }) => {
  const config = statusConfig[status] || { label: status, class: 'status-saved' };
  const sizeClasses = size === 'sm' ? 'px-2.5 py-0.5 text-xs' : 'px-3 py-1 text-sm';

  return (
    <span
      className={`inline-flex items-center rounded-full font-medium ${config.class} ${sizeClasses} ${className}`}
    >
      {config.label}
    </span>
  );
};

export default Badge;
