import { assets } from './assets'
import type { CategoryCard, ProductCard, TemplatePage } from './types'

const mensProducts: ProductCard[] = [
  {
    id: 'oco-silver',
    title: 'Oco 44',
    category: 'Solar',
    price: '$325',
    rating: '5.0 / 5',
    reviewCount: 2,
    badges: ['New', 'Solar'],
    imageUrl: assets.products.ocoSilver,
  },
  {
    id: 'oco-black',
    title: 'Oco 44 Black',
    category: 'Solar',
    price: '$325',
    rating: '5.0 / 5',
    reviewCount: 2,
    badges: ['New', 'Solar'],
    imageUrl: assets.products.ocoBlack,
  },
  {
    id: 'sentry-green',
    title: 'Sentry Wobble',
    category: 'Analog',
    price: '$360',
    rating: '4.9 / 5',
    reviewCount: 7,
    badges: ['New Color'],
    imageUrl: assets.products.sentryGreen,
  },
  {
    id: 'chrono-leather',
    title: 'Time Teller Chrono Leather',
    category: 'Chronograph',
    price: '$250',
    rating: '4.0 / 5',
    reviewCount: 1,
    badges: ['New Color'],
    imageUrl: assets.products.chronoLeather,
  },
]

const womensProducts: ProductCard[] = [
  {
    id: 'time-teller-gold',
    title: 'Time Teller',
    category: 'Analog',
    price: '$150',
    rating: '4.7 / 5',
    reviewCount: 2379,
    badges: ['New Color'],
    imageUrl: assets.products.timeTellerGold,
  },
  {
    id: 'eddy-blue',
    title: 'Eddy',
    category: 'Analog',
    price: '$200',
    rating: '5.0 / 5',
    reviewCount: 3,
    badges: ['New'],
    imageUrl: assets.products.eddyBlue,
  },
]

const quickLinks: CategoryCard[] = [
  {
    title: "Women's Watches",
    href: '#new-season',
    imageUrl: assets.categories.womens,
    carouselImageUrls: [assets.categories.womens, assets.categories.womensAlt],
  },
  {
    title: 'Analog Watches',
    href: '#categories',
    imageUrl: assets.categories.analog,
    carouselImageUrls: [assets.categories.analog, assets.categories.analogAlt],
  },
  {
    title: 'Digital Watches',
    href: '#categories',
    imageUrl: assets.categories.digital,
    carouselImageUrls: [assets.categories.digital, assets.categories.digitalAlt],
  },
  {
    title: 'Custom Watches',
    href: '#categories',
    imageUrl: assets.categories.custom,
    carouselImageUrls: [assets.categories.custom, assets.categories.customAlt],
  },
  {
    title: 'Solar Watches',
    href: '#new-season',
    imageUrl: assets.categories.solar,
    carouselImageUrls: [assets.categories.solar, assets.categories.solarAlt],
  },
  { title: 'Watch Bands', href: '#categories', imageUrl: assets.categories.bands },
]

export const page: TemplatePage = {
  meta: {
    title: 'TideMark Seller Portal',
    description: 'Multi-brand watch marketplace with curated sellers, easy comparison, wishlist, checkout, and market-price deals.',
  },
  announcements: [
    'Compare favorite watch brands in one place',
    'Seller-direct picks at sharp market prices',
    'Sign up for deal alerts and launch drops',
  ],
  hero: {
    eyebrow: 'Multi-brand watch marketplace',
    title: 'Favorite watch brands, one place',
    subtitle: 'TideMark makes it easy to compare trusted sellers, discover styles across brands, and buy at sharp market prices.',
    cta: { label: 'Shop Market Deals', href: '#new-season' },
    imageUrl: assets.heroImageUrl,
  },
  quickLinks,
  newSeason: {
    eyebrow: 'Seller-picked deals',
    title: 'Compare standout watches from trusted sellers',
    description: 'Browse cross-brand drops, verified seller picks, and price-conscious finds without hopping between stores.',
    cta: { label: 'View Deals', href: '#new-season' },
    items: mensProducts,
    tabs: [
      {
        label: "Men's",
        description: 'Compare men’s watches from multiple sellers, styles, and price points in one quick view.',
        products: mensProducts,
      },
      {
        label: "Women's",
        description: 'Find women’s watches across favorite brands, from everyday analog styles to polished gift picks.',
        products: womensProducts,
      },
    ],
  },
  brandBanners: [
    {
      eyebrow: 'Marketplace promise',
      title: 'Your favorite watch brands, brought together at the best market price.',
      description:
        'TideMark connects shoppers with trusted sellers, clear comparisons, and a faster path to the right watch.',
      cta: { label: 'Shop Seller Picks', href: '#new-season' },
      imageUrl: assets.brandVideoPosterUrl,
      dark: true,
    },
  ],
  categoryCollections: {
    eyebrow: 'Browse by need',
    title: 'Find the right watch across brands',
    description: 'Women’s, analog, digital, custom, solar, and bands are grouped for faster marketplace discovery.',
    items: quickLinks,
  },
  newsletter: {
    title: 'Get market deal alerts',
    description: 'Join for seller drops, price updates, and new brand arrivals from the TideMark marketplace.',
    emailPlaceholder: 'you@example.com',
    submitLabel: 'Sign Up',
  },
}
