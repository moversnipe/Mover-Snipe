type AuthPageHeaderProps = {
  title: string
  description: string
}

/** Centred title and one-line description above every auth form. */
export const AuthPageHeader = ({ title, description }: AuthPageHeaderProps) => (
  <div className="flex flex-col gap-2 text-center">
    <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
    <p className="text-sm text-muted-foreground">{description}</p>
  </div>
)
