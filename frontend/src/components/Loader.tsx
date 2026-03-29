type LoaderProps = {
  label?: string;
};

import "./Loader.css";

export const Loader = ({ label = "Obrada u toku..." }: LoaderProps) => {
  return (
    <div
      className="loader-container"
      role="status"
    >
      <span
        className="loader-spinner animate-spin"
      />
      {label}
    </div>
  );
};
