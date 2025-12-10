export default function ServiceCard({
  title,
  price,
  durationMin,
  photo
}: {
  title: string;
  price: number;
  durationMin: number;
  photo?: string | null;
}) {
  return (
    <div className="rounded-2xl bg-neutral-900 border border-neutral-800 overflow-hidden">
      {photo && (
        <img src={photo} alt={title} className="h-40 w-full object-cover" />
      )}
      <div className="p-4 space-y-1">
        <h3 className="font-semibold">{title}</h3>
        <p className="text-sm text-neutral-400">
          {durationMin} min • {price} FCFA
        </p>
      </div>
    </div>
  );
}
