import { useEffect, useMemo, useState } from 'react'
import type { FormEvent, MouseEvent } from 'react'
import useEmblaCarousel from 'embla-carousel-react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  CreditCard,
  Heart,
  Landmark,
  Mail,
  MapPin,
  Menu,
  Minus,
  PackageCheck,
  Phone,
  Plus,
  ShieldCheck,
  Smartphone,
  ShoppingBag,
  Star,
  Trash2,
  Truck,
  X,
} from 'lucide-react'
import { page } from './constants/pages'
import { navGroups, site } from './constants/site'
import { themeStyle } from './constants/theme'
import type { CategoryCard, MediaBanner, ProductCard } from './constants/types'
import { LEAD_ERROR_MESSAGE, LEAD_SUCCESS_MESSAGE, submitLead } from './lib/leadApi'

type CartItem = {
  product: ProductCard
  quantity: number
}

type RoutePath = '/' | '/checkout' | '/about-us' | '/contact-us' | '/privacy-policy'

type CheckoutField = 'fullName' | 'email' | 'phone' | 'address' | 'city' | 'state' | 'postalCode' | 'country'

type CheckoutDetails = Record<CheckoutField, string>

type CheckoutStepId = 'address' | 'payment' | 'confirmation'

type FeedbackMessage = {
  id: number
  tone: 'cart' | 'wishlist'
  title: string
  message: string
}

type StaticPageContent = {
  metaTitle: string
  metaDescription: string
  eyebrow: string
  title: string
  description: string
  sections: Array<{
    title: string
    body: string
  }>
}

const routePaths = new Set<RoutePath>(['/', '/checkout', '/about-us', '/contact-us', '/privacy-policy'])

const staticPages: Record<Exclude<RoutePath, '/' | '/checkout'>, StaticPageContent> = {
  '/about-us': {
    metaTitle: `About Us | ${site.brand.name}`,
    metaDescription: `${site.brand.name} helps shoppers compare favorite watch brands, trusted sellers, and market-price deals in one place.`,
    eyebrow: 'About us',
    title: 'Built for watch shoppers who compare before they commit',
    description:
      'TideMark brings seller-direct watch listings into a calmer marketplace: clear product context, visible price math, and a support path that does not disappear after checkout.',
    sections: [
      {
        title: 'Marketplace first',
        body: 'We organize analog, digital, solar, custom, and band listings around the decisions buyers actually make: style, material, seller trust, and total delivered price.',
      },
      {
        title: 'Seller-direct follow-through',
        body: 'Customers can save products, compare listings, and reach support before or after placing an order. Seller teams get a focused path for listing questions and fulfilment updates.',
      },
      {
        title: 'Practical by design',
        body: 'The experience is tuned for repeat comparison rather than one-off browsing, with quick categories, visible totals, wishlist recovery, and checkout confirmation built into the flow.',
      },
    ],
  },
  '/contact-us': {
    metaTitle: `Contact Us | ${site.brand.name}`,
    metaDescription: `${site.brand.name} customer support and seller contact information for watch orders, marketplace listings, and fulfilment help.`,
    eyebrow: 'Contact us',
    title: 'Seller and customer support',
    description:
      'Reach the TideMark team for order help, seller onboarding, listing questions, and marketplace support. We route messages by queue so buyers and sellers reach the right team faster.',
    sections: [
      {
        title: 'Customer support',
        body: 'Email support@tidemark.example or call +1 (415) 555-0198 for order status, checkout questions, returns, and delivery updates. Support hours are Monday-Friday, 9:00 AM-6:00 PM PT.',
      },
      {
        title: 'Seller desk',
        body: 'Email sellers@tidemark.example for seller verification, listing corrections, fulfilment coordination, brand documentation, and marketplace pricing questions.',
      },
      {
        title: 'Head office',
        body: 'TideMark Marketplace Support, 280 Battery Street, Suite 410, San Francisco, CA 94111. For privacy requests, use privacy@tidemark.example.',
      },
    ],
  },
  '/privacy-policy': {
    metaTitle: `Privacy Policy | ${site.brand.name}`,
    metaDescription: `${site.brand.name} privacy policy for marketplace enquiries, newsletter submissions, and website usage data.`,
    eyebrow: 'Privacy policy',
    title: 'Privacy Policy',
    description:
      'This page explains how we handle information shared through this website and how customers can contact us about their details.',
    sections: [
      {
        title: 'Information we collect',
        body: 'We collect details customers choose to submit through website forms, such as an email address and related enquiry context.',
      },
      {
        title: 'How we use information',
        body: 'Submitted details are used to respond to enquiries, share requested updates, and improve the shopping experience.',
      },
      {
        title: 'Customer choices',
        body: 'Customers can request support with their submitted details or choose not to submit optional website forms.',
      },
    ],
  },
}

const taxRate = 0.05
const deliveryRate = 0.04

const emptyCheckoutDetails: CheckoutDetails = {
  fullName: '',
  email: '',
  phone: '',
  address: '',
  city: '',
  state: '',
  postalCode: '',
  country: site.countries[0] ?? 'United States',
}

function localHref(href: string) {
  return href.startsWith('#') ? `/${href}` : href
}

function projectKey() {
  return site.brand.shortName.toLowerCase().replace(/[^a-z0-9]+/g, '-')
}

function storageKey(name: string) {
  return `${projectKey()}-${name}`
}

function getRoutePath(): RoutePath {
  const path = window.location.pathname as RoutePath
  return routePaths.has(path) ? path : '/'
}

function scrollToHash(hash: string) {
  if (!hash) return
  window.requestAnimationFrame(() => {
    document.querySelector(hash)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  })
}

function priceValue(price: string) {
  return Number(price.replace(/[^0-9.]/g, '')) || 0
}

function money(value: number) {
  return `$${value.toFixed(2).replace(/\.00$/, '')}`
}

function cartTotals(items: CartItem[]) {
  const subtotal = items.reduce((total, item) => total + priceValue(item.product.price) * item.quantity, 0)
  const tax = subtotal * taxRate
  const delivery = subtotal * deliveryRate

  return {
    subtotal,
    tax,
    delivery,
    total: subtotal + tax + delivery,
  }
}

function readStoredJson<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback
  try {
    const value = window.localStorage.getItem(key)
    return value ? (JSON.parse(value) as T) : fallback
  } catch {
    return fallback
  }
}

function ImageFrame({
  imageUrl,
  title,
  className = '',
  dark = false,
}: {
  imageUrl: string
  title: string
  className?: string
  dark?: boolean
}) {
  if (imageUrl) {
    return <img className={`h-full w-full object-cover ${className}`} src={imageUrl} alt={title} loading="lazy" />
  }

  return (
    <div
      className={`flex h-full min-h-48 w-full items-center justify-center p-6 text-center ${
        dark ? 'bg-[linear-gradient(135deg,var(--color-dark),var(--color-dark-soft))] text-white' : 'bg-[linear-gradient(135deg,var(--color-surface-soft),var(--color-surface))] text-[var(--color-muted)]'
      } ${className}`}
      role="img"
      aria-label={`${title} image placeholder`}
      data-empty-image="true"
    >
      <div>
        <ShoppingBag className="mx-auto mb-3" size={32} aria-hidden="true" />
        <span className="text-xs font-black uppercase tracking-[0.2em]">{title}</span>
      </div>
    </div>
  )
}

function Header({
  cartCount,
  onOpenCart,
  onOpenCountry,
  onOpenWishlist,
  selectedCountry,
  wishlistCount,
}: {
  cartCount: number
  onOpenCart: () => void
  onOpenCountry: () => void
  onOpenWishlist: () => void
  selectedCountry: string
  wishlistCount: number
}) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [activeAnnouncementIndex, setActiveAnnouncementIndex] = useState(0)

  useEffect(() => {
    if (page.announcements.length <= 1) return undefined

    const timer = window.setInterval(() => {
      setActiveAnnouncementIndex((index) => (index + 1) % page.announcements.length)
    }, 2800)

    return () => window.clearInterval(timer)
  }, [])

  const activeAnnouncement = page.announcements[activeAnnouncementIndex] ?? page.announcements[0]

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--color-line)] bg-[var(--color-surface)]/96 backdrop-blur">
      <div className="flex min-h-10 items-center justify-center overflow-hidden bg-[var(--color-dark)] px-4 text-center text-xs font-black uppercase tracking-[0.18em] text-white">
        <span className="announcement-message" key={activeAnnouncement}>
          {activeAnnouncement}
        </span>
      </div>
      <div className="mx-auto flex h-20 w-[min(var(--container),calc(100%-32px))] items-center gap-3 sm:gap-5">
        <button className="grid h-11 w-11 place-items-center rounded-[var(--radius-control)] border border-[var(--color-line)] lg:hidden" type="button" onClick={() => setMobileOpen((value) => !value)} aria-label={mobileOpen ? 'Close navigation' : 'Open navigation'} aria-expanded={mobileOpen}>
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>

        <a className="brand-logo-link inline-flex items-center gap-2 text-xl font-black uppercase tracking-[0.14em] text-[var(--color-heading)] sm:text-2xl sm:tracking-[0.22em]" href="/" aria-label={`${site.brand.name} home`}>
          <span className="h-2.5 w-2.5 rounded-full bg-[var(--color-accent)] shadow-[0_0_0_4px_var(--color-accent-soft)]" aria-hidden="true" />
          <span>{site.brand.shortName}</span>
        </a>

        <nav className="hidden flex-1 items-center justify-center gap-1 lg:flex" aria-label="Primary navigation">
          {navGroups.map((group, index) => {
            const panelAlignment =
              index === 0
                ? 'left-0 translate-x-0'
                : index === navGroups.length - 1
                  ? 'right-0 translate-x-0'
                  : 'left-1/2 -translate-x-1/2'

            return (
              <div className="group relative" key={group.label}>
                <button className="inline-flex items-center gap-1 rounded-[var(--radius-control)] px-4 py-3 text-sm font-black uppercase text-[var(--color-heading)] hover:bg-[var(--color-surface-soft)] group-focus-within:bg-[var(--color-surface-soft)]" type="button" aria-haspopup="true">
                  {group.label}
                  <ChevronDown className="transition-transform group-hover:rotate-180 group-focus-within:rotate-180" size={15} aria-hidden="true" />
                </button>
                <div className={`pointer-events-none absolute top-full z-50 hidden w-64 pt-2 group-hover:block group-hover:pointer-events-auto group-focus-within:block group-focus-within:pointer-events-auto ${panelAlignment}`} data-nav-menu={group.label}>
                  <div className="overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-surface)] p-2 shadow-[var(--shadow-card)] ring-1 ring-black/5">
                    {group.items.map((item) => (
                      <a className="block rounded-[var(--radius-control)] px-3 py-2.5 text-sm font-black text-[var(--color-heading)] hover:bg-[var(--color-surface-soft)] hover:text-[var(--color-dark)]" href={localHref(item.href)} key={`${group.label}-${item.label}-${item.href}`}>
                        {item.label}
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            )
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <button className="hidden items-center gap-2 rounded-[var(--radius-pill)] border border-[var(--color-line)] px-4 py-2 text-sm font-black uppercase md:inline-flex" type="button" onClick={onOpenCountry}>
            <MapPin size={16} aria-hidden="true" />
            {selectedCountry}
          </button>
          <button className="relative grid h-11 w-11 place-items-center rounded-[var(--radius-control)] border border-[var(--color-line)]" type="button" onClick={onOpenWishlist} aria-label="Open wishlist">
            <Heart size={19} />
            {wishlistCount > 0 ? <span className="absolute -right-1 -top-1 grid h-5 w-5 place-items-center rounded-full bg-[var(--color-accent)] text-xs font-black text-[var(--color-dark)]">{wishlistCount}</span> : null}
          </button>
          <button className="relative grid h-11 w-11 place-items-center rounded-[var(--radius-control)] border border-[var(--color-line)]" type="button" onClick={onOpenCart} aria-label="Open cart">
            <ShoppingBag size={19} />
            <span className="absolute -right-1 -top-1 grid h-5 w-5 place-items-center rounded-full bg-[var(--color-accent)] text-xs font-black text-[var(--color-dark)]">{cartCount}</span>
          </button>
        </div>
      </div>

      {mobileOpen ? (
        <div className="border-t border-[var(--color-line)] bg-[var(--color-surface)] p-4 lg:hidden">
          {navGroups.map((group) => (
            <details className="rounded-[var(--radius-control)] border-b border-[var(--color-line)] py-2" key={group.label}>
              <summary className="cursor-pointer list-none text-base font-black uppercase text-[var(--color-heading)]">{group.label}</summary>
              <div className="mt-2 grid gap-1">
                {group.items.map((item) => (
                  <a className="rounded-[var(--radius-control)] px-3 py-2 font-bold text-[var(--color-muted)]" href={localHref(item.href)} key={`${group.label}-${item.label}-${item.href}`} onClick={() => setMobileOpen(false)}>
                    {item.label}
                  </a>
                ))}
              </div>
            </details>
          ))}
          <button
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-[var(--radius-pill)] bg-[var(--color-dark)] px-5 py-3 text-sm font-black uppercase text-white"
            type="button"
            onClick={() => {
              setMobileOpen(false)
              onOpenCountry()
            }}
          >
            <MapPin size={16} aria-hidden="true" />
            {selectedCountry}
          </button>
        </div>
      ) : null}
    </header>
  )
}

function CategoryLink({ item }: { item: CategoryCard }) {
  const carouselImageUrls = item.carouselImageUrls?.filter(Boolean) ?? []
  const [carouselIndex, setCarouselIndex] = useState(() =>
    carouselImageUrls.length > 1 ? Math.floor(Math.random() * carouselImageUrls.length) : 0,
  )
  const [transitionEnabled, setTransitionEnabled] = useState(true)
  const initialDelay = useMemo(() => Math.random() * 2000, [item.title])

  useEffect(() => {
    if (carouselImageUrls.length <= 1) return undefined

    let timeout: number
    let cancelled = false

    function scheduleNextChange(isFirstChange = false) {
      const delay = isFirstChange ? initialDelay : 2000

      timeout = window.setTimeout(() => {
        setTransitionEnabled(true)
        setCarouselIndex((index) => index + 1)

        if (!cancelled) scheduleNextChange()
      }, delay)
    }

    scheduleNextChange(true)

    return () => {
      cancelled = true
      window.clearTimeout(timeout)
    }
  }, [carouselImageUrls.length, initialDelay])

  const slideImageUrls = carouselImageUrls.length > 0 ? carouselImageUrls : [item.imageUrl]
  const visibleSlideIndex = slideImageUrls.length > 1 ? carouselIndex % slideImageUrls.length : 0
  const swipeImageUrls = slideImageUrls.length > 1 ? [...slideImageUrls, slideImageUrls[0]] : slideImageUrls

  return (
    <a className="group flex-[0_0_190px] overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-surface)] shadow-[var(--shadow-card)] hover:border-[var(--color-accent)] sm:flex-[0_0_216px]" href={localHref(item.href)}>
      <div className="relative aspect-square overflow-hidden bg-[var(--color-surface-soft)]">
        {slideImageUrls.length > 1 ? (
          <motion.div
            className="flex h-full w-full"
            animate={{ x: `${carouselIndex * -100}%` }}
            transition={transitionEnabled ? { duration: 0.55, ease: [0.22, 1, 0.36, 1] } : { duration: 0 }}
            onAnimationComplete={() => {
              if (carouselIndex >= slideImageUrls.length) {
                setTransitionEnabled(false)
                setCarouselIndex(0)
                window.requestAnimationFrame(() => setTransitionEnabled(true))
              }
            }}
          >
            {swipeImageUrls.map((imageUrl, index) => (
              <div className="h-full flex-[0_0_100%]" key={`${item.title}-${imageUrl}-${index}`}>
                <ImageFrame imageUrl={imageUrl} title={item.title} />
              </div>
            ))}
          </motion.div>
        ) : (
          <ImageFrame imageUrl={slideImageUrls[0] ?? ''} title={item.title} />
        )}
        {slideImageUrls.length > 1 ? (
          <div className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 items-center gap-1.5 rounded-[var(--radius-pill)] bg-black/32 px-2.5 py-1.5 backdrop-blur-sm" aria-label={`${item.title} image ${visibleSlideIndex + 1} of ${slideImageUrls.length}`}>
            {slideImageUrls.map((imageUrl, index) => (
              <span
                className={`h-1.5 rounded-full transition-all duration-300 ${index === visibleSlideIndex ? 'w-5 bg-white' : 'w-1.5 bg-white/55'}`}
                key={`${item.title}-${imageUrl}-${index}`}
                aria-hidden="true"
              />
            ))}
          </div>
        ) : null}
      </div>
      <span className="block border-t border-[var(--color-line)] bg-[var(--color-surface)] px-4 py-3 text-center text-sm font-black uppercase text-[var(--color-heading)] group-hover:border-[var(--color-accent-soft)] group-hover:bg-[var(--color-accent-soft)]">
        {item.title}
      </span>
    </a>
  )
}

function QuickLinksCarousel({ items }: { items: CategoryCard[] }) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ align: 'start', dragFree: true, loop: true })
  const [selectedSnap, setSelectedSnap] = useState(0)
  const [snapCount, setSnapCount] = useState(0)

  useEffect(() => {
    if (!emblaApi) return undefined

    const updateCarouselState = () => {
      setSelectedSnap(emblaApi.selectedScrollSnap())
      setSnapCount(emblaApi.scrollSnapList().length)
    }

    updateCarouselState()
    emblaApi.on('select', updateCarouselState)
    emblaApi.on('reInit', updateCarouselState)

    return () => {
      emblaApi.off('select', updateCarouselState)
      emblaApi.off('reInit', updateCarouselState)
    }
  }, [emblaApi])

  if (items.length === 0) return null

  return (
    <section className="mx-auto w-[min(var(--container),calc(100%-32px))] py-8">
      <div className="relative">
        <button
          className="absolute left-0 top-1/2 z-10 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-[var(--color-line)] bg-[var(--color-surface)] text-[var(--color-heading)] shadow-[var(--shadow-card)] hover:bg-[var(--color-dark)] hover:text-white"
          type="button"
          onClick={() => emblaApi?.scrollPrev()}
          aria-label="Previous category"
        >
          <ChevronLeft size={20} aria-hidden="true" />
        </button>
        <div className="overflow-hidden px-12" ref={emblaRef}>
          <div className="flex gap-4">
            {items.map((item) => (
              <CategoryLink item={item} key={item.title} />
            ))}
          </div>
        </div>
        <button
          className="absolute right-0 top-1/2 z-10 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-[var(--color-line)] bg-[var(--color-surface)] text-[var(--color-heading)] shadow-[var(--shadow-card)] hover:bg-[var(--color-dark)] hover:text-white"
          type="button"
          onClick={() => emblaApi?.scrollNext()}
          aria-label="Next category"
        >
          <ChevronRight size={20} aria-hidden="true" />
        </button>
      </div>
      {snapCount > 1 ? (
        <div className="mt-4 flex justify-center gap-2" aria-label="Category carousel position">
          {Array.from({ length: snapCount }).map((_, index) => (
            <button
              className={`h-2 rounded-full transition-all ${selectedSnap === index ? 'w-7 bg-[var(--color-dark)]' : 'w-2 bg-[var(--color-line)]'}`}
              type="button"
              key={`category-snap-${index}`}
              onClick={() => emblaApi?.scrollTo(index)}
              aria-label={`Go to category slide ${index + 1}`}
              aria-current={selectedSnap === index ? 'true' : undefined}
            />
          ))}
        </div>
      ) : null}
    </section>
  )
}

function ProductCardView({
  wished,
  product,
  onAddToCart,
  onToggleWishlist,
}: {
  wished: boolean
  product: ProductCard
  onAddToCart: () => void
  onToggleWishlist: () => void
}) {
  return (
    <motion.article className="relative overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-surface)] shadow-[var(--shadow-card)]" initial={{ opacity: 0.94, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-80px' }} transition={{ duration: 0.28, ease: 'easeOut' }}>
      <motion.button className={`absolute right-3 top-3 z-10 grid h-10 w-10 place-items-center rounded-full bg-white/92 ${wished ? 'text-[var(--color-sale)]' : 'text-[var(--color-heading)]'}`} type="button" onClick={onToggleWishlist} aria-label={`${wished ? 'Remove from' : 'Save to'} wishlist ${product.title}`} whileTap={{ scale: 0.86 }}>
        <motion.span animate={{ scale: wished ? [1, 1.24, 1] : 1 }} transition={{ duration: 0.3 }}>
          <Heart size={18} className={wished ? 'fill-[var(--color-sale)]' : ''} />
        </motion.span>
      </motion.button>
      <div className="absolute left-3 top-3 z-10 flex flex-wrap gap-2">
        {product.badges.map((badge) => (
          <span className="rounded-[var(--radius-pill)] bg-[var(--color-dark)] px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-white" key={badge}>
            {badge}
          </span>
        ))}
      </div>
      <div className="aspect-square">
        <ImageFrame imageUrl={product.imageUrl} title={product.title} />
      </div>
      <div className="p-5">
        <div className="flex items-center gap-1 text-sm font-bold text-[var(--color-muted)]">
          <Star size={15} className="fill-[var(--color-heading)] text-[var(--color-heading)]" />
          {product.rating}
          <span>({product.reviewCount})</span>
        </div>
        <h3 className="mt-3 text-lg font-black text-[var(--color-heading)]">{product.title}</h3>
        <p className="mt-1 text-sm font-bold text-[var(--color-muted)]">{product.category}</p>
        <div className="mt-4 flex items-center gap-2">
          <strong className="text-lg font-black text-[var(--color-heading)]">{product.price}</strong>
          {product.compareAt ? <span className="text-sm font-bold text-[var(--color-sale)] line-through">{product.compareAt}</span> : null}
        </div>
        <motion.button className="mt-5 flex w-full items-center justify-center gap-2 rounded-[var(--radius-pill)] bg-[var(--color-dark)] px-4 py-3 text-sm font-black uppercase text-white" type="button" onClick={onAddToCart} whileTap={{ scale: 0.97 }}>
          <ShoppingBag size={17} />
          Add to Cart
        </motion.button>
      </div>
    </motion.article>
  )
}

function SectionIntro({
  eyebrow,
  title,
  description,
  cta,
}: {
  eyebrow?: string
  title: string
  description?: string
  cta?: { label: string; href: string }
}) {
  return (
    <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div className="max-w-3xl">
        {eyebrow ? <p className="mb-2 text-xs font-black uppercase tracking-[0.22em] text-[var(--color-muted)]">{eyebrow}</p> : null}
        <h2 className="text-3xl font-black leading-tight text-[var(--color-heading)] md:text-5xl">{title}</h2>
        {description ? <p className="mt-4 text-base text-[var(--color-muted)] md:text-lg">{description}</p> : null}
      </div>
      {cta ? (
        <a className="inline-flex w-fit rounded-[var(--radius-pill)] bg-[var(--color-dark)] px-5 py-3 text-sm font-black uppercase text-white" href={localHref(cta.href)}>
          {cta.label}
        </a>
      ) : null}
    </div>
  )
}

function ProductRail({
  wishlist,
  onAddToCart,
  onToggleWishlist,
}: {
  wishlist: Set<string>
  onAddToCart: (product: ProductCard) => void
  onToggleWishlist: (id: string) => void
}) {
  const [activeTab, setActiveTab] = useState(page.newSeason.tabs[0]?.label ?? '')
  const active = page.newSeason.tabs.find((tab) => tab.label === activeTab) ?? page.newSeason.tabs[0]

  return (
    <section id="new-season" className="mx-auto w-[min(var(--container),calc(100%-32px))] py-16">
      <SectionIntro eyebrow={page.newSeason.eyebrow} title={page.newSeason.title} description={page.newSeason.description} cta={page.newSeason.cta} />
      <div className="mb-6 flex flex-wrap gap-2">
        {page.newSeason.tabs.map((tab) => (
          <button className={`rounded-[var(--radius-pill)] px-5 py-3 text-sm font-black uppercase ${tab.label === activeTab ? 'bg-[var(--color-dark)] text-white' : 'bg-[var(--color-surface)] text-[var(--color-heading)]'}`} type="button" onClick={() => setActiveTab(tab.label)} key={tab.label}>
            {tab.label}
          </button>
        ))}
      </div>
      <p className="mb-6 max-w-2xl text-[var(--color-muted)]">{active.description}</p>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {active.products.map((product) => (
          <ProductCardView
            key={product.id}
            product={product}
            wished={wishlist.has(product.id)}
            onAddToCart={() => onAddToCart(product)}
            onToggleWishlist={() => onToggleWishlist(product.id)}
          />
        ))}
      </div>
    </section>
  )
}

function MediaBannerView({ banner }: { banner: MediaBanner }) {
  return (
    <section className={`${banner.dark ? 'bg-[var(--color-dark)] text-white' : 'bg-[var(--color-surface)] text-[var(--color-heading)]'} relative overflow-hidden py-16`}>
      {banner.dark && banner.imageUrl ? (
        <div className="absolute inset-0 opacity-30" aria-hidden="true">
          <ImageFrame imageUrl={banner.imageUrl} title={banner.title} dark />
        </div>
      ) : null}
      <div className="absolute inset-0 bg-[linear-gradient(90deg,var(--color-dark)_0%,rgba(16,44,39,0.84)_48%,rgba(16,44,39,0.42)_100%)]" aria-hidden="true" />
      <div className="relative mx-auto grid min-h-[460px] w-[min(var(--container),calc(100%-32px))] items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <p className={`mb-3 text-xs font-black uppercase tracking-[0.22em] ${banner.dark ? 'text-[var(--color-accent)]' : 'text-[var(--color-muted)]'}`}>{banner.eyebrow}</p>
          <h2 className="text-4xl font-black leading-tight md:text-6xl">{banner.title}</h2>
          <p className={`mt-5 max-w-2xl text-lg ${banner.dark ? 'text-white/72' : 'text-[var(--color-muted)]'}`}>{banner.description}</p>
          <a className="mt-8 inline-flex rounded-[var(--radius-pill)] bg-[var(--color-accent)] px-6 py-4 text-sm font-black uppercase text-[var(--color-dark)]" href={localHref(banner.cta.href)}>
            {banner.cta.label}
          </a>
        </div>
        <div className="hidden lg:block" aria-hidden="true" />
      </div>
    </section>
  )
}

function CartDrawer({
  items,
  open,
  onCheckout,
  onClose,
  onDecrement,
  onIncrement,
  onRemove,
}: {
  items: CartItem[]
  open: boolean
  onCheckout: () => void
  onClose: () => void
  onDecrement: (id: string) => void
  onIncrement: (product: ProductCard) => void
  onRemove: (id: string) => void
}) {
  if (!open) return null

  const totals = cartTotals(items)

  return (
    <aside className="fixed inset-0 z-50 bg-black/45" aria-label="Cart drawer" role="dialog" aria-modal="true">
      <motion.div className="ml-auto flex h-full w-full max-w-lg flex-col bg-[var(--color-surface)] shadow-[var(--shadow-drawer)]" initial={{ x: 48, opacity: 0.92 }} animate={{ x: 0, opacity: 1 }} transition={{ duration: 0.24, ease: 'easeOut' }}>
        <div className="flex items-center justify-between border-b border-[var(--color-line)] p-5">
          <strong className="text-xl font-black uppercase text-[var(--color-heading)]">Cart</strong>
          <button className="grid h-10 w-10 place-items-center rounded-[var(--radius-control)] border border-[var(--color-line)]" type="button" onClick={onClose} aria-label="Close cart">
            <X size={18} />
          </button>
        </div>
        <div className="flex-1 overflow-auto p-5">
          {items.length === 0 ? (
            <div className="flex min-h-80 items-center justify-center text-center">
              <div>
                <ShoppingBag className="mx-auto mb-4" size={42} />
                <h2 className="text-2xl font-black text-[var(--color-heading)]">Your cart is ready for products.</h2>
                <p className="mt-2 text-[var(--color-muted)]">Add items to review quantities and continue to checkout.</p>
              </div>
            </div>
          ) : null}
          <div className="space-y-4">
            {items.map((item) => (
              <article className="grid grid-cols-[88px_1fr] gap-4 rounded-[var(--radius-card)] border border-[var(--color-line)] p-3" key={item.product.id}>
                <div className="overflow-hidden rounded-[var(--radius-control)]">
                  <ImageFrame imageUrl={item.product.imageUrl} title={item.product.title} />
                </div>
                <div>
                  <div className="flex justify-between gap-3">
                    <div>
                      <h3 className="font-black text-[var(--color-heading)]">{item.product.title}</h3>
                      <p className="text-sm font-bold text-[var(--color-muted)]">{item.product.category}</p>
                    </div>
                    <button className="grid h-9 w-9 place-items-center rounded-[var(--radius-control)] border border-[var(--color-line)] text-[var(--color-muted)]" type="button" onClick={() => onRemove(item.product.id)} aria-label={`Remove ${item.product.title}`}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <div className="inline-flex items-center rounded-[var(--radius-pill)] border border-[var(--color-line)]">
                      <button className="grid h-9 w-9 place-items-center" type="button" onClick={() => onDecrement(item.product.id)} aria-label={`Decrease ${item.product.title}`}>
                        <Minus size={15} />
                      </button>
                      <span className="min-w-8 text-center text-sm font-black">{item.quantity}</span>
                      <button className="grid h-9 w-9 place-items-center" type="button" onClick={() => onIncrement(item.product)} aria-label={`Increase ${item.product.title}`}>
                        <Plus size={15} />
                      </button>
                    </div>
                    <strong>{money(priceValue(item.product.price) * item.quantity)}</strong>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
        <div className="border-t border-[var(--color-line)] p-5">
          <div className="space-y-2 text-sm font-bold text-[var(--color-muted)]">
            <div className="flex items-center justify-between">
              <span>Subtotal</span>
              <span>{money(totals.subtotal)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Tax (5%)</span>
              <span>{money(totals.tax)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Delivery (4%)</span>
              <span>{money(totals.delivery)}</span>
            </div>
          </div>
          <div className="my-4 flex items-center justify-between text-lg font-black">
            <span>Total</span>
            <span>{money(totals.total)}</span>
          </div>
          <button className="w-full rounded-[var(--radius-pill)] bg-[var(--color-dark)] px-5 py-4 text-sm font-black uppercase text-white disabled:cursor-not-allowed disabled:opacity-45" type="button" onClick={onCheckout} disabled={items.length === 0}>
            Checkout
          </button>
        </div>
      </motion.div>
    </aside>
  )
}

function WishlistDrawer({
  products,
  open,
  onAddToCart,
  onClose,
  onRemove,
}: {
  products: ProductCard[]
  open: boolean
  onAddToCart: (product: ProductCard) => void
  onClose: () => void
  onRemove: (id: string) => void
}) {
  if (!open) return null

  return (
    <aside className="fixed inset-0 z-50 bg-black/45" aria-label="Wishlist drawer" role="dialog" aria-modal="true">
      <motion.div className="ml-auto flex h-full w-full max-w-lg flex-col bg-[var(--color-surface)] shadow-[var(--shadow-drawer)]" initial={{ x: 48, opacity: 0.92 }} animate={{ x: 0, opacity: 1 }} transition={{ duration: 0.24, ease: 'easeOut' }}>
        <div className="flex items-center justify-between border-b border-[var(--color-line)] p-5">
          <strong className="text-xl font-black uppercase text-[var(--color-heading)]">Wishlist</strong>
          <button className="grid h-10 w-10 place-items-center rounded-[var(--radius-control)] border border-[var(--color-line)]" type="button" onClick={onClose} aria-label="Close wishlist">
            <X size={18} />
          </button>
        </div>
        <div className="flex-1 overflow-auto p-5">
          {products.length === 0 ? (
            <div className="flex min-h-80 items-center justify-center text-center">
              <div>
                <Heart className="mx-auto mb-4" size={42} />
                <h2 className="text-2xl font-black text-[var(--color-heading)]">Save products for later.</h2>
                <p className="mt-2 text-[var(--color-muted)]">Tap the heart on any product card to build a wishlist.</p>
              </div>
            </div>
          ) : null}
          <div className="space-y-4">
            {products.map((product) => (
              <article className="grid grid-cols-[112px_1fr] gap-4 rounded-[var(--radius-card)] border border-[var(--color-line)] bg-white p-3 shadow-[var(--shadow-card)]" key={product.id}>
                <div className="aspect-square overflow-hidden rounded-[var(--radius-control)] bg-[var(--color-surface-soft)]">
                  <ImageFrame imageUrl={product.imageUrl} title={product.title} />
                </div>
                <div className="min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-black leading-tight text-[var(--color-heading)]">{product.title}</h3>
                      <p className="mt-1 text-sm font-bold text-[var(--color-muted)]">{product.category}</p>
                    </div>
                    <button className="grid h-9 w-9 shrink-0 place-items-center rounded-[var(--radius-control)] border border-[var(--color-line)] text-[var(--color-muted)]" type="button" onClick={() => onRemove(product.id)} aria-label={`Remove ${product.title}`}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    <strong className="text-lg text-[var(--color-heading)]">{product.price}</strong>
                    <span className="rounded-[var(--radius-pill)] bg-[var(--color-surface-soft)] px-3 py-1 text-xs font-black uppercase text-[var(--color-muted)]">
                      Saved
                    </span>
                  </div>
                  <div className="mt-4">
                    <button className="flex w-full items-center justify-center gap-2 rounded-[var(--radius-pill)] bg-[var(--color-dark)] px-4 py-3 text-xs font-black uppercase text-white" type="button" onClick={() => onAddToCart(product)}>
                      <ShoppingBag size={16} />
                      Add to Cart
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </motion.div>
    </aside>
  )
}

function CountrySelector({
  open,
  onClose,
  onSelect,
  selectedCountry,
}: {
  open: boolean
  onClose: () => void
  onSelect: (country: string) => void
  selectedCountry: string
}) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/45 p-4" role="dialog" aria-modal="true" aria-label="Country selector">
      <div className="w-full max-w-xl rounded-[var(--radius-card)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-drawer)]">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-black text-[var(--color-heading)]">Choose your region</h2>
          <button className="grid h-10 w-10 place-items-center rounded-[var(--radius-control)] border border-[var(--color-line)]" type="button" onClick={onClose} aria-label="Close country selector">
            <X size={18} />
          </button>
        </div>
        <div className="mt-5 grid gap-2 sm:grid-cols-2">
          {site.countries.map((country) => (
            <button
              className={`flex items-center justify-between gap-3 rounded-[var(--radius-control)] border px-4 py-3 text-left font-bold ${
                country === selectedCountry
                  ? 'border-[var(--color-dark)] bg-[var(--color-dark)] text-white'
                  : 'border-[var(--color-line)] text-[var(--color-heading)] hover:bg-[var(--color-surface-soft)]'
              }`}
              type="button"
              key={country}
              onClick={() => {
                onSelect(country)
                onClose()
              }}
            >
              <span>{country}</span>
              {country === selectedCountry ? <Check size={17} aria-hidden="true" /> : null}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

function ActionToast({ feedback }: { feedback: FeedbackMessage | null }) {
  return (
    <div className="pointer-events-none fixed bottom-5 left-1/2 z-[60] w-[min(420px,calc(100%-32px))] -translate-x-1/2">
      <AnimatePresence mode="popLayout">
        {feedback ? (
          <motion.div
            className="flex items-start gap-3 rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-surface)] p-4 text-[var(--color-heading)] shadow-[var(--shadow-drawer)]"
            key={feedback.id}
            initial={{ opacity: 0, y: 22, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 18, scale: 0.98 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            role="status"
            aria-live="polite"
          >
            <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-full ${feedback.tone === 'cart' ? 'bg-[var(--color-accent)] text-[var(--color-dark)]' : 'bg-red-50 text-[var(--color-sale)]'}`}>
              {feedback.tone === 'cart' ? <ShoppingBag size={18} aria-hidden="true" /> : <Heart size={18} aria-hidden="true" />}
            </span>
            <span>
              <strong className="block text-sm font-black uppercase">{feedback.title}</strong>
              <span className="mt-1 block text-sm font-bold text-[var(--color-muted)]">{feedback.message}</span>
            </span>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}

function NewsletterForm() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const normalizedEmail = email.trim()

    if (!normalizedEmail || !/^\S+@\S+\.\S+$/.test(normalizedEmail)) {
      setStatus('error')
      setMessage('Enter a valid email address.')
      return
    }

    setStatus('loading')
    setMessage('')

    try {
      await submitLead({
        niche: 'e-commerce',
        project: site.brand.name,
        projectKey: projectKey(),
        formId: 'newsletter',
        email: normalizedEmail,
        pagePath: window.location.pathname,
        pageUrl: window.location.href,
        referrer: document.referrer,
        metadata: {
          formTitle: page.newsletter.title,
          brand: site.brand.name,
        },
      })
      setStatus('success')
      setMessage(LEAD_SUCCESS_MESSAGE)
      setEmail('')
    } catch {
      setStatus('error')
      setMessage(LEAD_ERROR_MESSAGE)
    }
  }

  return (
    <form className="flex flex-col gap-3" onSubmit={handleSubmit} noValidate>
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          className="min-h-14 flex-1 rounded-[var(--radius-pill)] border border-[var(--color-line)] bg-white px-5 text-[var(--color-heading)] outline-none focus:border-[var(--color-dark)]"
          type="email"
          name="email"
          placeholder={page.newsletter.emailPlaceholder}
          aria-label="Email address"
          value={email}
          onChange={(event) => {
            setEmail(event.target.value)
            if (status !== 'loading') {
              setStatus('idle')
              setMessage('')
            }
          }}
        />
        <button className="rounded-[var(--radius-pill)] bg-[var(--color-dark)] px-7 py-4 text-sm font-black uppercase text-white disabled:cursor-not-allowed disabled:opacity-60" type="submit" disabled={status === 'loading'}>
          {status === 'loading' ? 'Saving...' : page.newsletter.submitLabel}
        </button>
      </div>
      {message ? (
        <p className={`rounded-[var(--radius-control)] px-4 py-3 text-sm font-black ${status === 'success' ? 'bg-[var(--color-accent)] text-[var(--color-dark)]' : 'bg-red-50 text-red-700'}`} role="status" aria-live="polite">
          {message}
        </p>
      ) : null}
    </form>
  )
}

function StaticPage({ content }: { content: StaticPageContent }) {
  return (
    <section className="bg-[var(--color-background)] py-16">
      <div className="mx-auto w-[min(900px,calc(100%-32px))]">
        <p className="mb-3 text-xs font-black uppercase tracking-[0.22em] text-[var(--color-muted)]">{content.eyebrow}</p>
        <h1 className="text-5xl font-black uppercase leading-tight text-[var(--color-heading)] md:text-7xl">{content.title}</h1>
        <p className="mt-5 text-lg leading-8 text-[var(--color-muted)]">{content.description}</p>
        <div className="mt-10 grid gap-5">
          {content.sections.map((section) => (
            <article className="rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-card)]" key={section.title}>
              <h2 className="text-2xl font-black text-[var(--color-heading)]">{section.title}</h2>
              <p className="mt-3 leading-7 text-[var(--color-muted)]">{section.body}</p>
            </article>
          ))}
        </div>
        <a className="mt-10 inline-flex rounded-[var(--radius-pill)] bg-[var(--color-dark)] px-6 py-4 text-sm font-black uppercase text-white" href="/#new-season">
          Continue Shopping
        </a>
      </div>
    </section>
  )
}

function AboutPage() {
  const content = staticPages['/about-us']
  const standards = [
    { label: 'Seller checks', value: 'Verified storefront, fulfilment path, and listing source before products are promoted.' },
    { label: 'Buyer clarity', value: 'Price, delivery, wishlist, and support touchpoints stay visible through the shopping flow.' },
    { label: 'Market coverage', value: 'Analog, digital, solar, custom, and band categories are grouped for comparison-first browsing.' },
  ]

  return (
    <section className="bg-[var(--color-background)]">
      <div className="mx-auto grid w-[min(var(--container),calc(100%-32px))] gap-10 py-16 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="lg:sticky lg:top-32 lg:h-fit">
          <p className="mb-3 text-xs font-black uppercase tracking-[0.22em] text-[var(--color-muted)]">{content.eyebrow}</p>
          <h1 className="text-4xl font-black uppercase leading-tight text-[var(--color-heading)] md:text-6xl">{content.title}</h1>
          <p className="mt-5 text-lg leading-8 text-[var(--color-muted)]">{content.description}</p>
          <div className="mt-8 grid grid-cols-3 gap-3 border-y border-[var(--color-line)] py-5">
            {[
              ['6', 'core categories'],
              ['3', 'support queues'],
              ['9%', 'visible tax and delivery'],
            ].map(([value, label]) => (
              <div key={label}>
                <strong className="block text-3xl font-black text-[var(--color-heading)]">{value}</strong>
                <span className="mt-1 block text-xs font-black uppercase text-[var(--color-muted)]">{label}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="grid gap-5">
          <div className="rounded-[var(--radius-card)] bg-[var(--color-dark)] p-6 text-white shadow-[var(--shadow-card)]">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-[var(--color-accent)]">How TideMark works</p>
            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              {standards.map((standard, index) => (
                <article className="border-t border-white/18 pt-4" key={standard.label}>
                  <span className="grid h-9 w-9 place-items-center rounded-full bg-[var(--color-accent)] text-sm font-black text-[var(--color-dark)]">{index + 1}</span>
                  <h2 className="mt-4 text-lg font-black">{standard.label}</h2>
                  <p className="mt-2 text-sm leading-6 text-white/70">{standard.value}</p>
                </article>
              ))}
            </div>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            {content.sections.map((section) => (
              <article className="rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-card)]" key={section.title}>
                <h2 className="text-xl font-black text-[var(--color-heading)]">{section.title}</h2>
                <p className="mt-3 text-sm leading-6 text-[var(--color-muted)]">{section.body}</p>
              </article>
            ))}
          </div>
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-surface)] p-5">
            <p className="max-w-xl font-bold text-[var(--color-muted)]">Questions about a seller, listing, or checkout total can go straight to the TideMark support team.</p>
            <a className="inline-flex rounded-[var(--radius-pill)] bg-[var(--color-dark)] px-5 py-3 text-sm font-black uppercase text-white" href="/contact-us">
              Contact Support
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}

function ContactPage() {
  const content = staticPages['/contact-us']
  const contacts = [
    { title: 'Customer support', detail: 'support@tidemark.example', subtext: 'Orders, checkout, delivery, returns', icon: Mail },
    { title: 'Seller desk', detail: 'sellers@tidemark.example', subtext: 'Verification, listings, fulfilment', icon: ShieldCheck },
    { title: 'Phone support', detail: '+1 (415) 555-0198', subtext: 'Monday-Friday, 9:00 AM-6:00 PM PT', icon: Phone },
  ]

  return (
    <section className="bg-[var(--color-background)] py-16">
      <div className="mx-auto w-[min(var(--container),calc(100%-32px))]">
        <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr]">
          <div>
            <p className="mb-3 text-xs font-black uppercase tracking-[0.22em] text-[var(--color-muted)]">{content.eyebrow}</p>
            <h1 className="text-4xl font-black uppercase leading-tight text-[var(--color-heading)] md:text-6xl">{content.title}</h1>
            <p className="mt-5 text-lg leading-8 text-[var(--color-muted)]">{content.description}</p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {contacts.map(({ title, detail, subtext, icon: Icon }) => (
              <article className="rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-card)]" key={title}>
                <Icon className="text-[var(--color-heading)]" size={24} aria-hidden="true" />
                <h2 className="mt-4 text-lg font-black text-[var(--color-heading)]">{title}</h2>
                <p className="mt-2 break-words text-sm font-black text-[var(--color-heading)]">{detail}</p>
                <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">{subtext}</p>
              </article>
            ))}
          </div>
        </div>
        <div className="mt-10 grid gap-5 lg:grid-cols-[1fr_1fr_1fr]">
          {content.sections.map((section) => (
            <article className="rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-card)]" key={section.title}>
              <h2 className="text-xl font-black text-[var(--color-heading)]">{section.title}</h2>
              <p className="mt-3 leading-7 text-[var(--color-muted)]">{section.body}</p>
            </article>
          ))}
        </div>
        <div className="mt-8 grid gap-4 rounded-[var(--radius-card)] bg-[var(--color-dark)] p-6 text-white md:grid-cols-3">
          {[
            { label: 'Order response', value: '1 business day', icon: PackageCheck },
            { label: 'Seller response', value: '2 business days', icon: Clock },
            { label: 'Privacy queue', value: 'privacy@tidemark.example', icon: ShieldCheck },
          ].map(({ label, value, icon: Icon }) => (
            <div className="flex items-center gap-3" key={label}>
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[var(--color-accent)] text-[var(--color-dark)]">
                <Icon size={20} aria-hidden="true" />
              </span>
              <span>
                <strong className="block text-sm font-black uppercase text-[var(--color-accent)]">{label}</strong>
                <span className="mt-1 block font-black">{value}</span>
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function CheckoutPage({
  checkoutDetails,
  items,
  onBackToCart,
  onCheckoutDetailChange,
  onPaymentMethodChange,
  paymentMethod,
}: {
  checkoutDetails: CheckoutDetails
  items: CartItem[]
  onBackToCart: () => void
  onCheckoutDetailChange: (field: CheckoutField, value: string) => void
  onPaymentMethodChange: (method: string) => void
  paymentMethod: string
}) {
  const [confirmationNumber, setConfirmationNumber] = useState('')
  const totals = cartTotals(items)
  const isAddressComplete = Object.values(checkoutDetails).every((value) => value.trim().length > 0)
  const isConfirmed = confirmationNumber.length > 0
  const activeStep: CheckoutStepId = !isAddressComplete ? 'address' : !paymentMethod ? 'payment' : 'confirmation'
  const checkoutSteps: Array<{
    id: CheckoutStepId
    title: string
    description: string
    complete: boolean
  }> = [
    {
      id: 'address',
      title: 'Delivery',
      description: isAddressComplete ? 'Address complete' : 'Add recipient details',
      complete: isAddressComplete,
    },
    {
      id: 'payment',
      title: 'Payment',
      description: paymentMethod ? 'Method selected' : 'Choose how to pay',
      complete: Boolean(paymentMethod),
    },
    {
      id: 'confirmation',
      title: 'Confirmation',
      description: isConfirmed ? confirmationNumber : 'Place the order',
      complete: isConfirmed,
    },
  ]
  const paymentMethods = [
    { id: 'upi', label: 'UPI', icon: Smartphone },
    { id: 'card', label: 'Card', icon: CreditCard },
    { id: 'netbanking', label: 'Netbanking', icon: Landmark },
  ]

  useEffect(() => {
    setConfirmationNumber('')
  }, [checkoutDetails, items, paymentMethod])

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!isAddressComplete || !paymentMethod) return
    setConfirmationNumber(`TM-${Date.now().toString().slice(-6)}`)
  }

  if (items.length === 0) {
    return (
      <section className="mx-auto flex min-h-[520px] w-[min(760px,calc(100%-32px))] items-center justify-center py-16 text-center">
        <div>
          <ShoppingBag className="mx-auto mb-4 text-[var(--color-muted)]" size={48} />
          <h1 className="text-4xl font-black uppercase text-[var(--color-heading)]">Your cart is empty</h1>
          <p className="mt-3 text-[var(--color-muted)]">Add a product before checkout.</p>
          <a className="mt-6 inline-flex rounded-[var(--radius-pill)] bg-[var(--color-dark)] px-6 py-4 text-sm font-black uppercase text-white" href="/#new-season">
            Continue Shopping
          </a>
        </div>
      </section>
    )
  }

  return (
    <section className="bg-[var(--color-background)] py-12">
      <div className="mx-auto w-[min(var(--container),calc(100%-32px))]">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="mb-2 text-xs font-black uppercase tracking-[0.22em] text-[var(--color-muted)]">Checkout</p>
            <h1 className="text-4xl font-black uppercase text-[var(--color-heading)] md:text-6xl">Review your order</h1>
          </div>
          <button className="inline-flex w-fit rounded-[var(--radius-pill)] border border-[var(--color-line)] px-5 py-3 text-sm font-black uppercase text-[var(--color-heading)]" type="button" onClick={onBackToCart}>
            Edit Cart
          </button>
        </div>

        <div className="mb-6 grid gap-3 md:grid-cols-3" aria-label="Checkout progress">
          {checkoutSteps.map((step, index) => {
            const isActive = step.id === activeStep && !step.complete

            return (
              <div
                className={`rounded-[var(--radius-card)] border p-4 ${
                  step.complete
                    ? 'border-[var(--color-dark)] bg-[var(--color-dark)] text-white'
                    : isActive
                      ? 'border-[var(--color-accent)] bg-[var(--color-accent-soft)] text-[var(--color-heading)]'
                      : 'border-[var(--color-line)] bg-[var(--color-surface)] text-[var(--color-heading)]'
                }`}
                key={step.id}
                aria-current={isActive ? 'step' : undefined}
              >
                <div className="flex items-center gap-3">
                  <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-full text-sm font-black ${step.complete ? 'bg-[var(--color-accent)] text-[var(--color-dark)]' : 'bg-white text-[var(--color-heading)]'}`}>
                    {step.complete ? <Check size={17} aria-hidden="true" /> : index + 1}
                  </span>
                  <span>
                    <strong className="block text-sm font-black uppercase">{step.title}</strong>
                    <span className={`mt-1 block text-xs font-bold ${step.complete ? 'text-white/70' : 'text-[var(--color-muted)]'}`}>{step.description}</span>
                  </span>
                </div>
              </div>
            )
          })}
        </div>

        {isConfirmed ? (
          <motion.div className="mb-6 rounded-[var(--radius-card)] border border-[var(--color-accent)] bg-[var(--color-accent-soft)] p-5 text-[var(--color-heading)]" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} role="status" aria-live="polite">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-start gap-4">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[var(--color-dark)] text-white">
                  <PackageCheck size={23} aria-hidden="true" />
                </span>
                <div>
                  <h2 className="text-2xl font-black uppercase">Order confirmed</h2>
                  <p className="mt-2 font-bold text-[var(--color-muted)]">
                    Confirmation {confirmationNumber} is ready for seller fulfilment. A receipt will be sent to {checkoutDetails.email}.
                  </p>
                </div>
              </div>
              <a className="inline-flex w-fit rounded-[var(--radius-pill)] bg-[var(--color-dark)] px-5 py-3 text-sm font-black uppercase text-white" href="/contact-us">
                Need Help?
              </a>
            </div>
          </motion.div>
        ) : null}

        <form className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]" onSubmit={handleSubmit}>
          <div className="grid gap-6">
            <section className="rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-card)]">
              <h2 className="text-xl font-black uppercase text-[var(--color-heading)]">Item breakdown</h2>
              <div className="mt-5 space-y-4">
                {items.map((item) => (
                  <article className="grid grid-cols-[76px_1fr] gap-4 rounded-[var(--radius-control)] border border-[var(--color-line)] p-3" key={item.product.id}>
                    <div className="aspect-square overflow-hidden rounded-[var(--radius-control)] bg-[var(--color-surface-soft)]">
                      <ImageFrame imageUrl={item.product.imageUrl} title={item.product.title} />
                    </div>
                    <div>
                      <div className="flex justify-between gap-3">
                        <div>
                          <h3 className="font-black text-[var(--color-heading)]">{item.product.title}</h3>
                          <p className="text-sm font-bold text-[var(--color-muted)]">{item.product.category}</p>
                        </div>
                        <strong>{money(priceValue(item.product.price) * item.quantity)}</strong>
                      </div>
                      <p className="mt-3 text-sm font-bold text-[var(--color-muted)]">Qty {item.quantity}</p>
                    </div>
                  </article>
                ))}
              </div>
              <div className="mt-5 space-y-3 border-t border-[var(--color-line)] pt-5 text-sm font-bold text-[var(--color-muted)]">
                <div className="flex items-center justify-between">
                  <span>Subtotal</span>
                  <span>{money(totals.subtotal)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Tax (5%)</span>
                  <span>{money(totals.tax)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-2">
                    <Truck size={16} />
                    Delivery (4%)
                  </span>
                  <span>{money(totals.delivery)}</span>
                </div>
                <div className="flex items-center justify-between border-t border-[var(--color-line)] pt-4 text-lg font-black text-[var(--color-heading)]">
                  <span>Total</span>
                  <span>{money(totals.total)}</span>
                </div>
              </div>
            </section>

            <section className="rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-card)]">
              <h2 className="text-xl font-black uppercase text-[var(--color-heading)]">Delivery address</h2>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <label className="grid gap-2 text-sm font-black uppercase text-[var(--color-heading)]">
                  Full name
                  <input className="rounded-[var(--radius-control)] border border-[var(--color-line)] bg-white px-4 py-3 text-sm font-bold normal-case outline-none focus:border-[var(--color-dark)]" required value={checkoutDetails.fullName} onChange={(event) => onCheckoutDetailChange('fullName', event.target.value)} />
                </label>
                <label className="grid gap-2 text-sm font-black uppercase text-[var(--color-heading)]">
                  Email
                  <input className="rounded-[var(--radius-control)] border border-[var(--color-line)] bg-white px-4 py-3 text-sm font-bold normal-case outline-none focus:border-[var(--color-dark)]" required type="email" value={checkoutDetails.email} onChange={(event) => onCheckoutDetailChange('email', event.target.value)} />
                </label>
                <label className="grid gap-2 text-sm font-black uppercase text-[var(--color-heading)]">
                  Phone
                  <input className="rounded-[var(--radius-control)] border border-[var(--color-line)] bg-white px-4 py-3 text-sm font-bold normal-case outline-none focus:border-[var(--color-dark)]" required value={checkoutDetails.phone} onChange={(event) => onCheckoutDetailChange('phone', event.target.value)} />
                </label>
                <label className="grid gap-2 text-sm font-black uppercase text-[var(--color-heading)]">
                  Country
                  <select className="rounded-[var(--radius-control)] border border-[var(--color-line)] bg-white px-4 py-3 text-sm font-bold normal-case outline-none focus:border-[var(--color-dark)]" required value={checkoutDetails.country} onChange={(event) => onCheckoutDetailChange('country', event.target.value)}>
                    {site.countries.map((country) => (
                      <option key={country}>{country}</option>
                    ))}
                  </select>
                </label>
                <label className="grid gap-2 text-sm font-black uppercase text-[var(--color-heading)] sm:col-span-2">
                  Street address
                  <input className="rounded-[var(--radius-control)] border border-[var(--color-line)] bg-white px-4 py-3 text-sm font-bold normal-case outline-none focus:border-[var(--color-dark)]" required value={checkoutDetails.address} onChange={(event) => onCheckoutDetailChange('address', event.target.value)} />
                </label>
                <label className="grid gap-2 text-sm font-black uppercase text-[var(--color-heading)]">
                  City
                  <input className="rounded-[var(--radius-control)] border border-[var(--color-line)] bg-white px-4 py-3 text-sm font-bold normal-case outline-none focus:border-[var(--color-dark)]" required value={checkoutDetails.city} onChange={(event) => onCheckoutDetailChange('city', event.target.value)} />
                </label>
                <label className="grid gap-2 text-sm font-black uppercase text-[var(--color-heading)]">
                  State
                  <input className="rounded-[var(--radius-control)] border border-[var(--color-line)] bg-white px-4 py-3 text-sm font-bold normal-case outline-none focus:border-[var(--color-dark)]" required value={checkoutDetails.state} onChange={(event) => onCheckoutDetailChange('state', event.target.value)} />
                </label>
                <label className="grid gap-2 text-sm font-black uppercase text-[var(--color-heading)]">
                  Postal code
                  <input className="rounded-[var(--radius-control)] border border-[var(--color-line)] bg-white px-4 py-3 text-sm font-bold normal-case outline-none focus:border-[var(--color-dark)]" required value={checkoutDetails.postalCode} onChange={(event) => onCheckoutDetailChange('postalCode', event.target.value)} />
                </label>
              </div>
            </section>
          </div>

          <aside className="h-fit rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-card)] lg:sticky lg:top-32">
            <h2 className="text-xl font-black uppercase text-[var(--color-heading)]">Payment methods</h2>
            {isAddressComplete ? (
              <div className="mt-5 grid gap-3">
                {paymentMethods.map(({ id, label, icon: Icon }) => (
                  <button
                    className={`flex items-center justify-between rounded-[var(--radius-control)] border px-4 py-4 text-left font-black ${
                      paymentMethod === id
                        ? 'border-[var(--color-dark)] bg-[var(--color-dark)] text-white'
                        : 'border-[var(--color-line)] text-[var(--color-heading)] hover:bg-[var(--color-surface-soft)]'
                    }`}
                    key={id}
                    type="button"
                    onClick={() => {
                      onPaymentMethodChange(id)
                    }}
                  >
                    <span className="inline-flex items-center gap-3">
                      <Icon size={20} aria-hidden="true" />
                      {label}
                    </span>
                    {paymentMethod === id ? <Check size={18} aria-hidden="true" /> : null}
                  </button>
                ))}
                <button className="mt-2 rounded-[var(--radius-pill)] bg-[var(--color-accent)] px-5 py-4 text-sm font-black uppercase text-[var(--color-dark)] disabled:cursor-not-allowed disabled:opacity-50" type="submit" disabled={!paymentMethod || isConfirmed}>
                  {isConfirmed ? 'Order Confirmed' : 'Complete Checkout'}
                </button>
                {isConfirmed ? (
                  <div className="rounded-[var(--radius-control)] border border-[var(--color-accent)] bg-[var(--color-accent-soft)] px-4 py-3 text-sm font-bold text-[var(--color-heading)]" role="status">
                    <strong className="block font-black uppercase">Fulfilment queued</strong>
                    <span className="mt-1 block text-[var(--color-muted)]">Seller support can reference {confirmationNumber} for this checkout.</span>
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="mt-5 rounded-[var(--radius-control)] bg-[var(--color-surface-soft)] p-4 text-sm font-bold leading-6 text-[var(--color-muted)]">
                Complete all delivery fields to choose a payment method.
              </div>
            )}
          </aside>
        </form>
      </div>
    </section>
  )
}

function CookieNotice() {
  const [visible, setVisible] = useState(
    () => typeof window !== 'undefined' && window.localStorage.getItem('cookie-notice-accepted') !== 'true',
  )

  if (!visible) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-md rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-drawer)]">
      <h2 className="text-base font-black text-[var(--color-heading)]">Cookies help us improve your visit</h2>
      <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
        We use cookies to keep the website running smoothly, understand usage, and improve the shopping experience.
      </p>
      <button
        className="mt-4 rounded-[var(--radius-pill)] bg-[var(--color-dark)] px-5 py-3 text-sm font-black uppercase text-white"
        type="button"
        onClick={() => {
          window.localStorage.setItem('cookie-notice-accepted', 'true')
          setVisible(false)
        }}
      >
        Got it
      </button>
    </div>
  )
}

export default function App() {
  const [route, setRoute] = useState<RoutePath>(() => getRoutePath())
  const [cartOpen, setCartOpen] = useState(false)
  const [wishlistOpen, setWishlistOpen] = useState(false)
  const [countryOpen, setCountryOpen] = useState(false)
  const [selectedCountry, setSelectedCountry] = useState(site.countries[0] ?? 'United States')
  const [checkoutDetails, setCheckoutDetails] = useState<CheckoutDetails>(emptyCheckoutDetails)
  const [paymentMethod, setPaymentMethod] = useState('')
  const [hydrated, setHydrated] = useState(false)
  const [wishlist, setWishlist] = useState<Set<string>>(new Set())
  const [cart, setCart] = useState<CartItem[]>([])
  const [feedback, setFeedback] = useState<FeedbackMessage | null>(null)
  const cssVars = useMemo(() => themeStyle(), [])
  const allProducts = useMemo(
    () => page.newSeason.tabs.flatMap((tab) => tab.products),
    [],
  )
  const wishlistProducts = allProducts.filter((product) => wishlist.has(product.id))
  const cartCount = cart.reduce((count, item) => count + item.quantity, 0)

  useEffect(() => {
    const storedCart = readStoredJson<Array<{ id: string; quantity: number }>>(storageKey('cart'), [])
    const storedWishlist = readStoredJson<string[]>(storageKey('wishlist'), [])
    const productsById = new Map(allProducts.map((product) => [product.id, product]))

    setCart(
      storedCart
        .map((item) => {
          const product = productsById.get(item.id)
          return product ? { product, quantity: Math.max(1, item.quantity) } : null
        })
        .filter((item): item is CartItem => Boolean(item)),
    )
    setWishlist(new Set(storedWishlist.filter((id) => productsById.has(id))))
    setHydrated(true)
  }, [allProducts])

  useEffect(() => {
    if (!hydrated) return
    window.localStorage.setItem(
      storageKey('cart'),
      JSON.stringify(cart.map((item) => ({ id: item.product.id, quantity: item.quantity }))),
    )
  }, [cart, hydrated])

  useEffect(() => {
    if (!hydrated) return
    window.localStorage.setItem(storageKey('wishlist'), JSON.stringify([...wishlist]))
  }, [hydrated, wishlist])

  useEffect(() => {
    const staticContent = route !== '/' && route !== '/checkout' ? staticPages[route] : null
    const checkoutDescription = `${site.brand.name} checkout with delivery address, order totals, and payment selection.`

    document.title = route === '/checkout' ? `Checkout | ${site.brand.name}` : staticContent?.metaTitle ?? page.meta.title
    let description = document.querySelector<HTMLMetaElement>('meta[name="description"]')
    if (!description) {
      description = document.createElement('meta')
      description.name = 'description'
      document.head.appendChild(description)
    }
    description.content = route === '/checkout' ? checkoutDescription : staticContent?.metaDescription ?? page.meta.description
    if (!window.location.hash) {
      window.scrollTo({ top: 0, behavior: 'auto' })
    }
  }, [route])

  useEffect(() => {
    const handlePopState = () => {
      setRoute(getRoutePath())
      scrollToHash(window.location.hash)
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  useEffect(() => {
    if (!feedback) return undefined

    const timer = window.setTimeout(() => setFeedback(null), 2600)
    return () => window.clearTimeout(timer)
  }, [feedback])

  function toggleWishlist(id: string) {
    const product = allProducts.find((item) => item.id === id)
    const title = product?.title ?? 'This watch'
    const isSaved = wishlist.has(id)

    setWishlist((current) => {
      const next = new Set(current)

      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
    setFeedback({
      id: Date.now(),
      tone: 'wishlist',
      title: isSaved ? 'Removed from wishlist' : 'Saved to wishlist',
      message: isSaved ? `${title} was removed from saved products.` : `${title} is ready in your wishlist.`,
    })
  }

  function addToCart(product: ProductCard) {
    setCart((current) => {
      const existing = current.find((item) => item.product.id === product.id)
      if (existing) {
        return current.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item,
        )
      }
      return [...current, { product, quantity: 1 }]
    })
    setFeedback({
      id: Date.now(),
      tone: 'cart',
      title: 'Added to cart',
      message: `${product.title} is in your cart.`,
    })
    setCartOpen(true)
  }

  function addWishlistProductToCart(product: ProductCard) {
    setWishlist((current) => {
      const next = new Set(current)
      next.delete(product.id)
      return next
    })
    setWishlistOpen(false)
    addToCart(product)
  }

  function decrementCart(id: string) {
    setCart((current) =>
      current
        .map((item) => (item.product.id === id ? { ...item, quantity: item.quantity - 1 } : item))
        .filter((item) => item.quantity > 0),
    )
  }

  function removeFromCart(id: string) {
    setCart((current) => current.filter((item) => item.product.id !== id))
  }

  function selectCountry(country: string) {
    setSelectedCountry(country)
    setCheckoutDetails((current) => ({ ...current, country }))
  }

  function updateCheckoutDetail(field: CheckoutField, value: string) {
    setCheckoutDetails((current) => ({ ...current, [field]: value }))
    if (field === 'country') {
      setSelectedCountry(value)
    }
    setPaymentMethod('')
  }

  function navigateToRoute(path: RoutePath) {
    window.history.pushState({}, '', path)
    setRoute(path)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function goToCheckout() {
    if (cart.length === 0) return
    setCartOpen(false)
    setWishlistOpen(false)
    navigateToRoute('/checkout')
  }

  function handleLocalNavigation(event: MouseEvent<HTMLDivElement>) {
    const anchor = (event.target as HTMLElement).closest('a')
    if (!anchor) return

    const url = new URL(anchor.href)
    const isHandledPath = routePaths.has(url.pathname as RoutePath)
    if (url.origin !== window.location.origin || !isHandledPath) return

    event.preventDefault()
    const nextUrl = `${url.pathname}${url.hash}`
    window.history.pushState({}, '', nextUrl)
    setRoute(getRoutePath())

    if (url.hash) {
      scrollToHash(url.hash)
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  return (
    <div style={cssVars} className="min-h-screen bg-[var(--color-background)] text-[var(--color-text)]" onClick={handleLocalNavigation}>
      <Header
        cartCount={cartCount}
        selectedCountry={selectedCountry}
        wishlistCount={wishlist.size}
        onOpenCart={() => setCartOpen(true)}
        onOpenCountry={() => setCountryOpen(true)}
        onOpenWishlist={() => setWishlistOpen(true)}
      />

      <main>
        {route === '/checkout' ? (
          <CheckoutPage
            checkoutDetails={checkoutDetails}
            items={cart}
            paymentMethod={paymentMethod}
            onBackToCart={() => setCartOpen(true)}
            onCheckoutDetailChange={updateCheckoutDetail}
            onPaymentMethodChange={setPaymentMethod}
          />
        ) : route === '/about-us' ? (
          <AboutPage />
        ) : route === '/contact-us' ? (
          <ContactPage />
        ) : route === '/' ? (
          <>
        <section className="relative overflow-hidden bg-[var(--color-dark)] text-white">
          <div className="absolute inset-0">
            {page.hero.imageUrl ? (
              <ImageFrame imageUrl={page.hero.imageUrl} title={page.hero.title} dark className="opacity-80" />
            ) : (
              <div className="h-full w-full bg-[linear-gradient(135deg,var(--color-dark),var(--color-dark-soft))]" aria-hidden="true" />
            )}
          </div>
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(16,44,39,0.74)_0%,rgba(16,44,39,0.52)_42%,rgba(16,44,39,0.08)_100%)]" aria-hidden="true" />
          <div className="relative mx-auto grid min-h-[640px] w-[min(var(--container),calc(100%-32px))] items-center gap-8 py-16 lg:grid-cols-[minmax(0,0.95fr)_360px]">
            <div className="max-w-3xl">
              <p className="mb-3 text-xs font-black uppercase tracking-[0.24em] text-[var(--color-accent)]">{page.hero.eyebrow}</p>
              <h1 className="text-5xl font-black uppercase leading-[0.92] md:text-8xl">{page.hero.title}</h1>
              <p className="mt-6 max-w-xl text-lg text-white/76 md:text-xl">{page.hero.subtitle}</p>
              <a className="mt-8 inline-flex rounded-[var(--radius-pill)] bg-[var(--color-accent)] px-6 py-4 text-sm font-black uppercase text-[var(--color-dark)]" href={localHref(page.hero.cta.href)}>
                {page.hero.cta.label}
              </a>
            </div>
            <div className="hidden border-y border-white/22 py-5 lg:block">
              {['Solar-ready builds', '5 ATM water resistance', 'Steel, leather, nylon'].map((item) => (
                <div className="flex items-center justify-between border-b border-white/14 py-4 text-sm font-black uppercase tracking-[0.16em] last:border-b-0" key={item}>
                  <span className="text-white/72">{item}</span>
                  <span className="h-2 w-2 rounded-full bg-[var(--color-accent)]" aria-hidden="true" />
                </div>
              ))}
            </div>
          </div>
        </section>

        <QuickLinksCarousel items={page.quickLinks} />

        <ProductRail
          wishlist={wishlist}
          onAddToCart={addToCart}
          onToggleWishlist={toggleWishlist}
        />

        {page.brandBanners.map((banner) => (
          <MediaBannerView banner={banner} key={banner.title} />
        ))}

        <section id="categories" className="bg-[var(--color-surface)] py-16">
          <div className="mx-auto w-[min(var(--container),calc(100%-32px))]">
            <SectionIntro eyebrow={page.categoryCollections.eyebrow} title={page.categoryCollections.title} description={page.categoryCollections.description} />
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {page.categoryCollections.items.map((item) => (
                <CategoryLink item={item} key={item.title} />
              ))}
            </div>
          </div>
        </section>

        <section id="newsletter" className="mx-auto grid w-[min(var(--container),calc(100%-32px))] items-center gap-6 py-16 md:grid-cols-[1fr_1fr]">
          <div>
            <h2 className="text-4xl font-black uppercase text-[var(--color-heading)]">{page.newsletter.title}</h2>
            <p className="mt-3 text-[var(--color-muted)]">{page.newsletter.description}</p>
          </div>
          <NewsletterForm />
        </section>
          </>
        ) : (
          <StaticPage content={staticPages[route]} />
        )}
      </main>

      <footer className="border-t border-[var(--color-line)] bg-[var(--color-dark)] text-white">
        <div className="mx-auto grid w-[min(var(--container),calc(100%-32px))] gap-8 py-10 md:grid-cols-[1fr_1.5fr]">
          <div>
            <strong className="text-2xl font-black uppercase tracking-[0.22em]">{site.brand.shortName}</strong>
            <p className="mt-4 text-white/64">{site.footer}</p>
          </div>
          <div className="grid gap-6 sm:grid-cols-3">
            {navGroups.slice(0, 3).map((group) => (
              <div key={group.label}>
                <h3 className="mb-3 text-sm font-black uppercase tracking-[0.18em] text-[var(--color-accent)]">{group.label}</h3>
                {group.items.slice(0, 4).map((item) => (
                  <a className="mb-2 block text-sm text-white/72" href={localHref(item.href)} key={`${group.label}-${item.label}-${item.href}`}>
                    {item.label}
                  </a>
                ))}
              </div>
            ))}
            <div>
              <h3 className="mb-3 text-sm font-black uppercase tracking-[0.18em] text-[var(--color-accent)]">Company</h3>
              <a className="mb-2 block text-sm text-white/72" href="/about-us">About Us</a>
              <a className="mb-2 block text-sm text-white/72" href="/contact-us">Contact Us</a>
              <a className="mb-2 block text-sm text-white/72" href="/privacy-policy">Privacy Policy</a>
            </div>
          </div>
        </div>
      </footer>

      <CartDrawer
        items={cart}
        open={cartOpen}
        onCheckout={goToCheckout}
        onClose={() => setCartOpen(false)}
        onDecrement={decrementCart}
        onIncrement={addToCart}
        onRemove={removeFromCart}
      />
      <WishlistDrawer
        open={wishlistOpen}
        products={wishlistProducts}
        onAddToCart={addWishlistProductToCart}
        onClose={() => setWishlistOpen(false)}
        onRemove={toggleWishlist}
      />
      <CountrySelector
        open={countryOpen}
        selectedCountry={selectedCountry}
        onClose={() => setCountryOpen(false)}
        onSelect={selectCountry}
      />
      <ActionToast feedback={feedback} />
      <CookieNotice />
    </div>
  )
}
