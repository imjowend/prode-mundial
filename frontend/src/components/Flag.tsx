type FlagProps = {
  code: string
  className?: string
}

export function Flag({ code, className = 'h-10 w-auto' }: FlagProps) {
  if (!code) return null
  return (
    <img
      src={`https://flagcdn.com/w40/${code.toLowerCase()}.png`}
      srcSet={`https://flagcdn.com/w80/${code.toLowerCase()}.png 2x`}
      alt=""
      aria-hidden="true"
      className={className}
    />
  )
}
