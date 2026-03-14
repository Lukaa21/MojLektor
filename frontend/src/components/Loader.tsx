type LoaderProps = {
  label?: string;
};

export const Loader = ({ label = "Obrada u toku..." }: LoaderProps) => {
  return (
    <div
      role="status"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        fontSize: 14,
        color: "var(--text-muted)",
        marginBottom: 16,
      }}
    >
      <span
        className="animate-spin"
        style={{
          display: "inline-block",
          width: 16,
          height: 16,
          borderRadius: "50%",
          border: "2px solid var(--border-light)",
          borderTopColor: "var(--accent)",
        }}
      />
      {label}
    </div>
  );
};
