type ErrorProps = {
  message: string;
};

export const ErrorMessage = ({ message }: ErrorProps) => {
  return (
    <div
      role="alert"
      style={{
        padding: "12px 16px",
        borderRadius: "var(--radius-md)",
        background: "var(--error-bg)",
        color: "var(--error)",
        fontSize: 14,
        marginBottom: 16,
      }}
    >
      {message}
    </div>
  );
};
