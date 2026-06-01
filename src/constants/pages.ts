import { assets } from './assets'
import type { ProductCard, TemplatePage } from './types'

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

export const page: TemplatePage = {
  meta: {
    title: 'TideMark Supply',
    description: 'Watch storefront with working cart, wishlist, checkout, and live newsletter capture.',
  },
  announcements: [
    'Free engraving through this week',
    'Free shipping on orders over $100',
    'Sign up for 15% off your first order',
  ],
  hero: {
    eyebrow: 'Perfect gifts for grads',
    title: 'Time keeps going',
    subtitle: 'From timeless daily watches to fresh sport designs, give them the gift that stays with them.',
    cta: { label: 'Shop Graduation Gifts', href: '#new-season' },
    imageUrl: assets.heroImageUrl,
  },
  quickLinks: [
    { title: "Women's Watches", href: '#new-season', imageUrl: assets.categories.womens },
    { title: 'Analog Watches', href: '#categories', imageUrl: assets.categories.analog },
    { title: 'Digital Watches', href: '#categories', imageUrl: assets.categories.digital },
    { title: 'Custom Watches', href: '#categories', imageUrl: assets.categories.custom },
    { title: 'Surf & Tide Watches', href: '#surf', imageUrl: assets.categories.surf },
    { title: 'Watch Bands', href: '#categories', imageUrl: assets.categories.bands },
    { title: 'Headwear', href: '#categories', imageUrl: assets.categories.headwear },
  ],
  newSeason: {
    eyebrow: 'New this season',
    title: 'Fresh colorways and new takes on iconic watch styles',
    description: 'Tabbed product rails keep men’s and women’s merchandising in one scan-friendly section.',
    cta: { label: 'View all', href: '#new-season' },
    items: mensProducts,
    tabs: [
      {
        label: "Men's",
        description: 'Discover the latest men’s watches built for wherever the day takes you.',
        products: mensProducts,
      },
      {
        label: "Women's",
        description: 'Meet new styles and standout colors designed to elevate every look.',
        products: womensProducts,
      },
    ],
  },
  brandBanners: [
    {
      eyebrow: 'Since 1998',
      title: 'TideMark watches are built for the chaos. Designed to own it.',
      description:
        'A full-width brand banner supports lifestyle video, founder story, team riders, or campaign editorial.',
      cta: { label: 'Shop Best Sellers', href: '#new-season' },
      imageUrl: assets.brandVideoPosterUrl,
      dark: true,
    },
  ],
  surfRail: {
    eyebrow: 'Time to paddle out',
    title: 'Surf & tide watches',
    description:
      'Collection rails can reuse the same product card structure with different category copy and merchandising.',
    cta: { label: 'Shop Surf & Tide Watches', href: '#surf' },
    items: [
      {
        id: 'heat',
        title: 'Heat',
        category: 'Training',
        price: '$175',
        rating: '4.2 / 5',
        reviewCount: 557,
        badges: [],
        imageUrl: assets.products.heat,
      },
      {
        id: 'high-tide',
        title: 'High Tide',
        category: 'Tide',
        price: '$250',
        rating: '4.6 / 5',
        reviewCount: 222,
        badges: ['Tide'],
        imageUrl: assets.products.highTide,
      },
    ],
  },
  categoryCollections: {
    eyebrow: 'Shop by category',
    title: 'Dense, image-led category navigation',
    description: 'The same card structure works for styles, colors, materials, sizes, accessories, and gifts.',
    items: [
      { title: "Men's Watches", href: '#new-season', imageUrl: assets.categories.analog },
      { title: "Women's Watches", href: '#new-season', imageUrl: assets.categories.womens },
      { title: 'Custom Watches', href: '#categories', imageUrl: assets.categories.custom },
      { title: 'Bands', href: '#categories', imageUrl: assets.categories.bands },
    ],
  },
  newsletter: {
    title: 'Get 15% off your first order',
    description: 'A compact sign-up block for offer capture, launches, and gift campaigns.',
    emailPlaceholder: 'you@example.com',
    submitLabel: 'Sign Up',
  },
}
