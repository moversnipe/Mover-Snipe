type AuthPageHeaderProps = {
  title: string
  description: string
}

/** Centred title and one-line description at the top of every auth form. */
export const AuthPageHeader = ({ title, description }: AuthPageHeaderProps) => (
  <div className="flex flex-col items-center gap-1 text-center">
    <h1 className="text-2xl font-bold">{title}</h1>
    <p className="text-sm text-balance text-muted-foreground">{description}</p>
  </div>
)
