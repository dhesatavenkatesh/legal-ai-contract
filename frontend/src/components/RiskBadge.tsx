interface RiskBadgeProps {
  severity: string;
}

function RiskBadge({ severity }: RiskBadgeProps) {
  const normalizedSeverity = severity.toLowerCase();

  return (
    <span
      className={`risk-badge risk-${normalizedSeverity}`}
    >
      {normalizedSeverity}
    </span>
  );
}

export default RiskBadge;