export type ThemeTokens = {
  colors: {
    background: string
    surface: string
    surfaceSoft: string
    text: string
    muted: string
    heading: string
    line: string
    dark: string
    darkSoft: string
    accent: string
    accentSoft: string
    sale: string
  }
  radii: {
    card: string
    control: string
    pill: string
  }
  shadows: {
    card: string
    drawer: string
  }
  layout: {
    container: string
  }
}

export type Cta = {
  label: string
  href: string
}

export type NavItem = {
  label: string
  href: string
}

export type NavGroup = {
  label: string
  featured?: string
  items: NavItem[]
}

export type HeroSection = {
  eyebrow: string
  title: string
  subtitle: string
  cta: Cta
  imageUrl: string
}

export type ProductCard = {
  id: string
  title: string
  category: string
  price: string
  compareAt?: string
  rating: string
  reviewCount: number
  badges: string[]
  imageUrl: string
}

export type CardSection<T> = {
  eyebrow?: string
  title: string
  description?: string
  cta?: Cta
  items: T[]
}

export type CategoryCard = {
  title: string
  href: string
  imageUrl: string
}

export type MediaBanner = {
  eyebrow: string
  title: string
  description: string
  cta: Cta
  imageUrl: string
  dark?: boolean
}

export type LeadFormConfig = {
  title: string
  description: string
  emailPlaceholder: string
  submitLabel: string
}

export type ProductRail = CardSection<ProductCard> & {
  tabs: Array<{
    label: string
    description: string
    products: ProductCard[]
  }>
}

export type TemplatePage = {
  meta: {
    title: string
    description: string
  }
  announcements: string[]
  hero: HeroSection
  quickLinks: CategoryCard[]
  newSeason: ProductRail
  brandBanners: MediaBanner[]
  surfRail: CardSection<ProductCard>
  categoryCollections: CardSection<CategoryCard>
  newsletter: LeadFormConfig
}
