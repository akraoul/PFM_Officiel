export default function Footer() {
  return (
    <footer className="border-t border-neutral-800">
      <div className="max-w-6xl mx-auto px-4 py-6 text-xs text-neutral-500">
        © {new Date().getFullYear()} PFM Barbershop
      </div>
    </footer>
  );
}
