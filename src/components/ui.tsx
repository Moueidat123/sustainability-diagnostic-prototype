import clsx from 'clsx'
import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes, ReactNode } from 'react'

export function Field({
  label, required, error, hint, children,
}: { label: string; required?: boolean; error?: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs font-medium text-slate-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </span>
      {children}
      {error
        ? <span className="block text-[11px] text-red-600 mt-1">{error}</span>
        : hint ? <span className="block text-[11px] text-slate-400 mt-1">{hint}</span> : null}
    </label>
  )
}

const baseInput =
  'w-full text-sm rounded-md border border-slate-300 bg-white px-3 py-2 ' +
  'focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 ' +
  'placeholder:text-slate-400 disabled:bg-slate-50'

export function Input(props: InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }) {
  const { invalid, className, ...rest } = props
  return <input {...rest} className={clsx(baseInput, invalid && 'border-red-400 focus:ring-red-400 focus:border-red-400', className)} />
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement> & { invalid?: boolean }) {
  const { invalid, className, children, ...rest } = props
  return (
    <select {...rest} className={clsx(baseInput, 'pr-8', invalid && 'border-red-400 focus:ring-red-400 focus:border-red-400', className)}>
      {children}
    </select>
  )
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const { className, ...rest } = props
  return <textarea {...rest} className={clsx(baseInput, 'min-h-24 resize-y', className)} />
}

export function Button({
  variant = 'primary', className, ...rest
}: { variant?: 'primary' | 'secondary' | 'ghost' | 'danger' } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const styles = {
    primary:   'bg-brand-600 text-white hover:bg-brand-700',
    secondary: 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50',
    ghost:     'text-slate-600 hover:bg-slate-100',
    danger:    'bg-red-600 text-white hover:bg-red-700',
  }[variant]
  return (
    <button
      {...rest}
      className={clsx(
        'inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        styles, className,
      )}
    />
  )
}

export function Card({ title, subtitle, actions, children }: {
  title?: string; subtitle?: string; actions?: ReactNode; children: ReactNode
}) {
  return (
    <section className="bg-white border border-slate-200 rounded-lg">
      {(title || actions) && (
        <header className="flex items-center justify-between px-5 py-3 border-b border-slate-200">
          <div>
            {title && <h2 className="text-sm font-semibold text-slate-900">{title}</h2>}
            {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
          </div>
          {actions}
        </header>
      )}
      <div className="p-5">{children}</div>
    </section>
  )
}

export function Modal({
  open, onClose, title, children, footer,
}: { open: boolean; onClose: () => void; title: string; children: ReactNode; footer?: ReactNode }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl" onClick={(e) => e.stopPropagation()}>
        <header className="px-5 py-3 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 text-lg leading-none">×</button>
        </header>
        <div className="p-5">{children}</div>
        {footer && <footer className="px-5 py-3 border-t border-slate-200 bg-slate-50 flex justify-end gap-2 rounded-b-lg">{footer}</footer>}
      </div>
    </div>
  )
}

export function Toast({ show, children }: { show: boolean; children: ReactNode }) {
  return (
    <div className={clsx(
      'fixed bottom-6 right-6 z-50 transition-all',
      show ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none',
    )}>
      <div className="bg-brand-700 text-white text-sm px-4 py-2 rounded-md shadow-lg">{children}</div>
    </div>
  )
}
