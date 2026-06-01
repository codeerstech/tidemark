import { chromium } from 'playwright'

const baseUrl = process.env.QA_BASE_URL ?? 'http://127.0.0.1:4173'
const viewports = [
  { width: 1440, height: 1000, name: 'desktop' },
  { width: 390, height: 900, name: 'mobile' },
]

const failures = []
const browser = await chromium.launch({ headless: true })

for (const viewport of viewports) {
  const page = await browser.newPage({ viewport })
  await page.addInitScript(() => window.localStorage.clear())
  const consoleErrors = []
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text())
  })
  page.on('pageerror', (error) => consoleErrors.push(error.message))

  const response = await page.goto(baseUrl, { waitUntil: 'networkidle' })
  const metrics = await page.evaluate(() => ({
    bodyLength: document.body.innerText.length,
    clientWidth: document.documentElement.clientWidth,
    h1: document.querySelector('h1')?.textContent ?? '',
    placeholders: document.querySelectorAll('[data-empty-image="true"]').length,
    scrollWidth: document.documentElement.scrollWidth,
    title: document.title,
    description: document.querySelector('meta[name="description"]')?.getAttribute('content') ?? '',
  }))

  if (!response?.ok()) failures.push(`${viewport.name}: HTTP ${response?.status()}`)
  if (consoleErrors.length > 0) failures.push(`${viewport.name}: ${consoleErrors.join(' | ')}`)
  if (metrics.scrollWidth > metrics.clientWidth + 2) {
    failures.push(`${viewport.name}: horizontal overflow ${metrics.scrollWidth}/${metrics.clientWidth}`)
  }
  if (!metrics.h1 || metrics.bodyLength < 500) failures.push(`${viewport.name}: sparse render`)
  if (!metrics.title || !metrics.description) failures.push(`${viewport.name}: missing route metadata`)
  if (metrics.placeholders < 8) failures.push(`${viewport.name}: expected empty-image placeholders to render`)

  if (viewport.name === 'desktop') {
    await page.getByRole('button', { name: 'Featured Collections' }).hover()
    const navMenu = page.locator('[data-nav-menu="Featured Collections"]')
    await navMenu.waitFor({ state: 'visible' }).catch(() => failures.push('desktop nav: dropdown did not open on hover'))
    const navMenuBox = await navMenu.boundingBox()
    if (!navMenuBox || navMenuBox.x < -1 || navMenuBox.x + navMenuBox.width > viewport.width + 1) {
      failures.push('desktop nav: dropdown overflows viewport')
    }
  }

  if (viewport.name === 'mobile') {
    await page.getByLabel('Open navigation').click()
    const mobileLinkVisible = await page.locator('a[href="/#new-season"]', { hasText: 'New Arrivals' }).last().isVisible()
    if (!mobileLinkVisible) failures.push('mobile nav: new arrivals link not visible after menu open')
  }

  const cookieVisible = await page.getByText('Cookies help us improve your visit').isVisible()
  if (!cookieVisible) failures.push(`${viewport.name}: cookie notice did not appear`)
  await page.getByRole('button', { name: 'Got it' }).click()
  const cookieHidden = await page.getByText('Cookies help us improve your visit').isHidden()
  if (!cookieHidden) failures.push(`${viewport.name}: cookie notice did not dismiss`)

  await page.close()
}

const interactivePage = await browser.newPage({ viewport: { width: 1280, height: 1000 } })
await interactivePage.addInitScript(() => window.localStorage.clear())
let leadPayload = null
await interactivePage.route('**/api/lead', async (route) => {
  leadPayload = route.request().postDataJSON()
  await route.fulfill({
    status: 201,
    contentType: 'application/json',
    body: JSON.stringify({ success: true, status: 'saved', data: { id: 'qa-lead' } }),
  })
})
await interactivePage.goto(baseUrl, { waitUntil: 'networkidle' })
await interactivePage.getByRole('button', { name: 'Got it' }).click()
await interactivePage.getByLabel('Open cart').click()
const cartVisible = await interactivePage.getByText('Your cart is ready for products.').isVisible()
if (!cartVisible) failures.push('cart: drawer did not open')
await interactivePage.getByLabel('Close cart').click()
await interactivePage.getByLabel(/Save to wishlist/).first().click()
await interactivePage.getByLabel('Open wishlist').click()
const wishlistVisible = await interactivePage.getByText('Wishlist').isVisible()
const wishlistProductVisible = await interactivePage.locator('aside[aria-label="Wishlist drawer"] article').first().isVisible()
if (!wishlistVisible || !wishlistProductVisible) failures.push('wishlist: saved product did not appear')
await interactivePage.locator('aside[aria-label="Wishlist drawer"]').getByRole('button', { name: /Add to Cart/ }).first().click()
const wishlistClosed = await interactivePage.locator('aside[aria-label="Wishlist drawer"]').isHidden()
const cartProductVisible = await interactivePage.locator('aside[aria-label="Cart drawer"] article').first().isVisible()
const subtotalVisible = await interactivePage.getByText('Tax (5%)').isVisible()
if (!wishlistClosed || !cartProductVisible || !subtotalVisible) failures.push('cart: wishlist add-to-cart or totals did not appear')
await interactivePage.getByRole('button', { name: 'Checkout' }).click()
await interactivePage.waitForURL(/\/checkout$/)
const checkoutVisible = await interactivePage.getByRole('heading', { name: 'Review your order' }).isVisible()
if (!checkoutVisible) failures.push('checkout: page did not render after cart checkout')
await interactivePage.getByLabel('Full name').fill('QA Shopper')
await interactivePage.getByLabel('Email').fill('shopper@example.com')
await interactivePage.getByLabel('Phone').fill('555-0100')
await interactivePage.getByLabel('Street address').fill('100 Market Street')
await interactivePage.getByLabel('City').fill('San Francisco')
await interactivePage.getByRole('textbox', { name: 'State' }).fill('CA')
await interactivePage.getByLabel('Postal code').fill('94105')
await interactivePage.getByRole('button', { name: /Card/ }).click()
await interactivePage.getByRole('button', { name: 'Complete Checkout' }).click()
const paymentVisible = await interactivePage.getByText('Checkout details saved. Your order is ready for review.').isVisible()
if (!paymentVisible) failures.push('checkout: completion message did not appear')
await interactivePage.getByRole('button', { name: /United States/ }).first().click()
const countryVisible = await interactivePage.getByText('Choose your region').isVisible()
if (!countryVisible) failures.push('country: selector did not open')
await interactivePage.getByRole('button', { name: /Canada/ }).click()
const countryUpdated = await interactivePage.getByText('Canada').first().isVisible()
if (!countryUpdated) failures.push('country: selected country did not update')
await interactivePage.goto(`${baseUrl}/#newsletter`, { waitUntil: 'networkidle' })
await interactivePage.locator('input[name="email"]').fill('shopper@example.com')
await interactivePage.locator('#newsletter button[type="submit"]').click()
const leadSuccessNotice = interactivePage.getByText('Details saved. We will reach you shortly.').first()
await leadSuccessNotice.waitFor({ timeout: 5000 }).catch(() => failures.push('newsletter: success state did not appear'))
if (!leadPayload || leadPayload.niche !== 'e-commerce' || leadPayload.email !== 'shopper@example.com') {
  failures.push('newsletter: lead payload was not submitted correctly')
}
await interactivePage.close()

const aboutPage = await browser.newPage({ viewport: { width: 1280, height: 900 } })
await aboutPage.goto(`${baseUrl}/about-us`, { waitUntil: 'networkidle' })
if (!(await aboutPage.getByText(/Meet /).first().isVisible())) failures.push('about: page did not render')
await aboutPage.getByText('Continue Shopping').click()
await aboutPage.waitForURL(/\/#new-season$/)
await aboutPage.close()

const privacyPage = await browser.newPage({ viewport: { width: 1280, height: 900 } })
await privacyPage.goto(`${baseUrl}/privacy-policy`, { waitUntil: 'networkidle' })
if (!(await privacyPage.getByRole('heading', { name: 'Privacy Policy' }).isVisible())) failures.push('privacy: page did not render')
await privacyPage.close()

await browser.close()

if (failures.length > 0) {
  console.error(failures.join('\n'))
  process.exit(1)
}

console.log('Browser QA passed')
