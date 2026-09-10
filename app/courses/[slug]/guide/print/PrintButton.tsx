'use client';

export default function PrintButton() {
  return (
    <button className="btn btn-primary btn-sm" onClick={() => window.print()}>
      Print these sheets
    </button>
  );
}
