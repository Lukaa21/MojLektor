type ErrorProps = {
  message: string;
};

export const ErrorMessage = ({ message }: ErrorProps) => {
  return (
    <div
      role="alert"
      className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
    >
      {message}
    </div>
  );
};
