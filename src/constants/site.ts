import type { NavGroup } from './types'

export const site = {
  brand: {
    name: 'TideMark Supply',
    shortName: 'TideMark',
  },
  utilityLinks: [
    { label: 'Order Status', href: '#order-status' },
    { label: 'Find a Store', href: '#stores' },
    { label: 'Sign in', href: '#signin' },
  ],
  countries: ['United States', 'Canada', 'United Kingdom', 'Australia', 'Germany', 'France'],
  footer: '© 2026 TideMark Supply. Working watch storefront with live newsletter capture.',
}

export const navGroups: NavGroup[] = [
  {
    label: 'Watches',
    featured: 'Shop by style',
    items: [
      { label: 'New Arrivals', href: '#new-season' },
      { label: 'Best Sellers', href: '#new-season' },
      { label: 'Analog', href: '#categories' },
      { label: 'Digital', href: '#categories' },
      { label: 'Chronograph', href: '#categories' },
      { label: 'Water Resistant', href: '#surf' },
    ],
  },
  {
    label: 'Featured Collections',
    featured: 'Icons and collaborations',
    items: [
      { label: 'Icons', href: '#new-season' },
      { label: 'Custom Watches', href: '#categories' },
      { label: 'Engraved Watches', href: '#new-season' },
      { label: 'Gift Guide', href: '#newsletter' },
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
  {
    label: 'Headwear & More',
    featured: 'Accessories',
    items: [
      { label: 'Headwear', href: '#categories' },
      { label: 'Apparel', href: '#categories' },
      { label: 'Bags & Accessories', href: '#categories' },
    ],
  },
]
