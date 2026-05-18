export default function Placeholder({ title, description }: { title: string; description?: string }) {
  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-semibold text-slate-900">{title}</h1>
      {description && <p className="mt-2 text-slate-600">{description}</p>}
      <div className="mt-6 rounded-lg border-2 border-dashed border-slate-300 bg-white p-10 text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-brand-50 text-brand-600 text-xl font-semibold">
          ✦
        </div>
        <p className="mt-3 text-slate-600">
          This screen will be built in the next step of the prototype.
        </p>
        <p className="text-xs text-slate-400 mt-1">
          Designed for client walk-through · navigate using the sidebar.
        </p>
      </div>
    </div>
  )
}
