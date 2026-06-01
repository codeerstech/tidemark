import type { NavGroup } from './types'

export const site = {
  brand: {
    name: 'TideMark Seller Portal',
    shortName: 'TideMark',
  },
  utilityLinks: [
    { label: 'Order Status', href: '#order-status' },
    { label: 'Find a Store', href: '#stores' },
    { label: 'Sign in', href: '#signin' },
  ],
  countries: ['United States', 'Canada', 'United Kingdom', 'Australia', 'Germany', 'France'],
  footer: '© 2026 TideMark Seller Portal. Multi-brand watch marketplace with live checkout, wishlist, and newsletter capture.',
}

export const navGroups: NavGroup[] = [
  {
    label: 'Marketplace',
    featured: 'Compare top picks',
    items: [
      { label: 'Market Deals', href: '#new-season' },
      { label: 'Best Market Price', href: '#new-season' },
      { label: 'Analog', href: '#categories' },
      { label: 'Digital', href: '#categories' },
      { label: 'Chronograph', href: '#categories' },
      { label: 'Water Resistant', href: '#categories' },
    ],
  },
  {
    label: 'Featured Brands',
    featured: 'Seller-curated styles',
    items: [
      { label: 'Popular Brands', href: '#new-season' },
      { label: 'Custom Watches', href: '#categories' },
      { label: 'Verified Sellers', href: '#new-season' },
      { label: 'Deal Alerts', href: '#newsletter' },
    ],
  },
  {
    label: 'Bands',
    featured: 'Materials and sizing',
    items: [
      { label: 'Leather', href: '#categories' },
      { label: 'Rubber', href: '#categories' },
      { label: 'Stainless Steel', href: '#categories' },
      { label: 'Nylon', href: '#categories' },
    ],
  },
]
