import clsx from 'clsx'
import { HelpCircle, CheckCircle2, AlertCircle } from 'lucide-react'
import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes, ReactNode } from 'react'

/** Small hoverable help bubble shown next to field labels. */
export function Tooltip({ text, className }: { text: string; className?: string }) {
  return (
    <span className={clsx('relative inline-flex group/tt align-middle', className)}>
      <HelpCircle size={13} className="text-slate-400 hover:text-brand-600 cursor-help" />
      <span
        role="tooltip"
        className="pointer-events-none absolute left-1/2 bottom-full z-50 mb-1.5 w-56 -translate-x-1/2
                   rounded-md bg-slate-900 px-2.5 py-1.5 text-[11px] font-normal normal-case leading-snug text-white
                   opacity-0 shadow-lg transition-opacity duration-150 group-hover/tt:opacity-100"
      >
        {text}
        <span className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-slate-900" />
      </span>
    </span>
  )
}

export function Field({
  label, required, error, hint, tooltip, valid, children,
}: {
  label: string; required?: boolean; error?: string; hint?: string
  tooltip?: string; valid?: boolean; children: ReactNode
}) {
  return (
    <label className="block">
      <span className="flex items-center gap-1 text-xs font-medium text-slate-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
        {tooltip && <Tooltip text={tooltip} />}
        {valid && !error && <CheckCircle2 size={12} className="text-emerald-500 ml-auto" />}
      </span>
      {children}
      {error
        ? <span className="flex items-center gap-1 text-[11px] text-red-600 mt-1"><AlertCircle size={11} /> {error}</span>
        : hint ? <span className="block text-[11px] text-slate-400 mt-1">{hint}</span> : null}
    </label>
  )
}

const baseInput =
  'w-full text-sm rounded-md border border-slate-300 bg-white px-3 py-2 transition-colors ' +
  'focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 ' +
  'placeholder:text-slate-400 disabled:bg-slate-50'

const invalidCls = 'border-red-400 bg-red-50/40 focus:ring-red-400 focus:border-red-400'
const validCls   = 'border-emerald-400 focus:ring-emerald-400 focus:border-emerald-400'

export function Input(props: InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean; valid?: boolean }) {
  const { invalid, valid, className, ...rest } = props
  return <input {...rest} className={clsx(baseInput, invalid && invalidCls, valid && !invalid && validCls, className)} />
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement> & { invalid?: boolean; valid?: boolean }) {
  const { invalid, valid, className, children, ...rest } = props
  return (
    <select {...rest} className={clsx(baseInput, 'pr-8', invalid && invalidCls, valid && !invalid && validCls, className)}>
      {children}
    </select>
  )
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean; valid?: boolean }) {
  const { invalid, valid, className, ...rest } = props
  return <textarea {...rest} className={clsx(baseInput, 'min-h-24 resize-y', invalid && invalidCls, valid && !invalid && validCls, className)} />
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
