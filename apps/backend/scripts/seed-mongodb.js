import 'dotenv/config';
import mongoose from 'mongoose';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Import MongoDB models
const modelsPath = join(__dirname, '../src/modules');

// Connect to MongoDB
await mongoose.connect(process.env.MONGODB_URI);
console.log('✅ Connected to MongoDB\n');

// Import models dynamically
const Banner = (await import('../src/modules/banners/banner.model.js')).default;
const Page = (await import('../src/modules/pages/page.model.js')).default;
const Notification = (await import('../src/modules/notifications/notification.model.js')).default;

async function seedMongoDB() {
    console.log('🌱 Starting MongoDB seeding...\n');

    // ═══════════════════════════════════════════════════════════════
    // 1. SEED BANNERS
    // ═══════════════════════════════════════════════════════════════
    console.log('🎨 Seeding Banners...');
    
    await Banner.deleteMany({}); // Clear existing banners
    
    const bannersData = [
        {
            title: 'Welcome to Sangam Namkeen',
            subtitle: 'Authentic Indian Snacks & Sweets',
            image: '/images/banners/welcome-banner.jpg',
            link: '/products',
            buttonText: 'Shop Now',
            isActive: true,
            order: 1
        },
        {
            title: 'Festival Special Offer',
            subtitle: 'Get 20% OFF on all sweets',
            image: '/images/banners/festival-banner.jpg',
            link: '/products?category=sweets',
            buttonText: 'Explore Sweets',
            isActive: true,
            order: 2
        },
        {
            title: 'Premium Dry Fruits',
            subtitle: 'Cashews, Almonds & More',
            image: '/images/banners/dryfruits-banner.jpg',
            link: '/products?category=dry-fruits',
            buttonText: 'View Collection',
            isActive: true,
            order: 3
        },
        {
            title: 'Fresh Namkeen Daily',
            subtitle: 'Made with love and authentic spices',
            image: '/images/banners/namkeen-banner.jpg',
            link: '/products?category=namkeen',
            buttonText: 'Order Now',
            isActive: true,
            order: 4
        }
    ];

    for (const bannerData of bannersData) {
        const banner = await Banner.create(bannerData);
        console.log(`  ✅ ${banner.title}`);
    }

    // ═══════════════════════════════════════════════════════════════
    // 2. SEED PAGES
    // ═══════════════════════════════════════════════════════════════
    console.log('\n📄 Seeding Pages...');
    
    const pagesData = [
        {
            title: 'About Us',
            slug: 'about-us',
            content: `
# About Sangam Namkeen

Welcome to Sangam Namkeen, your trusted source for authentic Indian snacks and sweets since 1985.

## Our Story

For over three decades, we have been serving delicious, high-quality namkeen and sweets to families across India. What started as a small shop in the heart of the city has now grown into a beloved brand known for its commitment to quality and taste.

## Our Promise

- **Quality Ingredients**: We use only the finest ingredients sourced from trusted suppliers
- **Traditional Recipes**: Our recipes have been passed down through generations
- **Hygiene Standards**: We maintain the highest standards of cleanliness and food safety
- **Fresh Products**: All our products are made fresh daily

## Our Values

1. **Authenticity**: We stay true to traditional recipes and methods
2. **Quality**: No compromise on ingredients or preparation
3. **Customer Satisfaction**: Your happiness is our success
4. **Innovation**: While respecting tradition, we also innovate

Visit us today and experience the taste of tradition!
            `,
            metaTitle: 'About Sangam Namkeen - Authentic Indian Snacks Since 1985',
            metaDescription: 'Learn about Sangam Namkeen, your trusted source for authentic Indian snacks and sweets for over 35 years.',
            isPublished: true
        },
        {
            title: 'Privacy Policy',
            slug: 'privacy-policy',
            content: `
# Privacy Policy

Last updated: ${new Date().toLocaleDateString()}

## Introduction

Sangam Namkeen ("we", "our", or "us") respects your privacy and is committed to protecting your personal data.

## Information We Collect

- **Personal Information**: Name, email, phone number, address
- **Order Information**: Purchase history, payment details
- **Technical Data**: IP address, browser type, device information

## How We Use Your Information

- Process and fulfill your orders
- Communicate with you about orders and promotions
- Improve our website and services
- Comply with legal obligations

## Data Security

We implement appropriate security measures to protect your personal information from unauthorized access, alteration, or disclosure.

## Your Rights

You have the right to:
- Access your personal data
- Correct inaccurate data
- Request deletion of your data
- Opt-out of marketing communications

## Contact Us

For any privacy-related questions, contact us at:
- Email: privacy@jainnamkeen.com
- Phone: +91-9876543210
            `,
            metaTitle: 'Privacy Policy - Sangam Namkeen',
            metaDescription: 'Read our privacy policy to understand how we collect, use, and protect your personal information.',
            isPublished: true
        },
        {
            title: 'Terms & Conditions',
            slug: 'terms-conditions',
            content: `
# Terms & Conditions

## 1. Acceptance of Terms

By accessing and using this website, you accept and agree to be bound by these Terms and Conditions.

## 2. Products and Services

- All products are subject to availability
- Prices are subject to change without notice
- Product images are for illustration purposes only

## 3. Orders and Payment

- All orders are subject to acceptance
- Payment must be made at the time of order
- We accept COD, credit cards, debit cards, and UPI

## 4. Delivery

- Delivery times are estimates and not guaranteed
- Delivery charges may apply based on location
- Risk of loss passes to you upon delivery

## 5. Returns and Refunds

- Perishable items cannot be returned
- Damaged products can be replaced within 24 hours
- Refunds will be processed within 7-10 business days

## 6. Limitation of Liability

We are not liable for any indirect, incidental, or consequential damages arising from the use of our products or services.

## 7. Governing Law

These terms are governed by the laws of India.

## 8. Contact Information

For questions about these terms, contact us at:
- Email: support@jainnamkeen.com
- Phone: +91-9876543210
            `,
            metaTitle: 'Terms & Conditions - Sangam Namkeen',
            metaDescription: 'Read our terms and conditions for using our website and purchasing our products.',
            isPublished: true
        },
        {
            title: 'Shipping & Delivery',
            slug: 'shipping-delivery',
            content: `
# Shipping & Delivery Policy

## Delivery Areas

We currently deliver to all major cities across India.

## Delivery Charges

- Orders above ₹500: **FREE Delivery**
- Orders below ₹500: ₹50 delivery charge
- Remote areas: Additional charges may apply

## Delivery Time

- Metro Cities: 2-3 business days
- Other Cities: 4-6 business days
- Remote Areas: 7-10 business days

## Order Tracking

Once your order is shipped, you will receive:
- Tracking number via SMS and email
- Real-time tracking updates
- Delivery confirmation

## Delivery Process

1. Order confirmation
2. Order processing (1-2 days)
3. Dispatch notification
4. In-transit updates
5. Out for delivery notification
6. Delivered

## Failed Delivery

If delivery fails:
- We will attempt redelivery
- You will be contacted via phone/SMS
- Order will be held for 3 days
- After 3 days, order will be returned

## Contact Us

For delivery queries:
- Email: delivery@jainnamkeen.com
- Phone: +91-9876543210
- WhatsApp: +91-9876543210
            `,
            metaTitle: 'Shipping & Delivery - Sangam Namkeen',
            metaDescription: 'Learn about our shipping and delivery policy, charges, and timelines.',
            isPublished: true
        },
        {
            title: 'Return & Refund Policy',
            slug: 'return-refund',
            content: `
# Return & Refund Policy

## Return Eligibility

Due to the nature of food products, we have a limited return policy:

### Returnable Items
- Damaged products (with photo proof within 24 hours)
- Wrong items delivered
- Quality issues (with photo proof)

### Non-Returnable Items
- Opened packages
- Products without quality issues
- Orders older than 24 hours

## Return Process

1. Contact us within 24 hours of delivery
2. Provide order number and photos
3. Our team will verify the issue
4. Approved returns will be picked up
5. Replacement or refund will be processed

## Refund Policy

- **Refund Timeline**: 7-10 business days
- **Refund Method**: Original payment method
- **Partial Refunds**: For partial returns

## Replacement Policy

- Free replacement for damaged/wrong items
- Replacement delivered within 3-5 days
- No questions asked for quality issues

## Contact for Returns

- Email: returns@jainnamkeen.com
- Phone: +91-9876543210
- Hours: 10 AM - 6 PM (Mon-Sat)

## Important Notes

- Keep packaging intact for returns
- Photos required for damage claims
- Refunds exclude delivery charges
            `,
            metaTitle: 'Return & Refund Policy - Sangam Namkeen',
            metaDescription: 'Understand our return and refund policy for damaged or incorrect products.',
            isPublished: true
        }
    ];

    for (const pageData of pagesData) {
        const page = await Page.findOneAndUpdate(
            { slug: pageData.slug },
            pageData,
            { upsert: true, new: true }
        );
        console.log(`  ✅ ${page.title}`);
    }

    // ═══════════════════════════════════════════════════════════════
    // 3. SEED NOTIFICATIONS
    // ═══════════════════════════════════════════════════════════════
    console.log('\n🔔 Seeding Notifications...');
    
    const notificationsData = [
        {
            title: 'Welcome to Sangam Namkeen!',
            body: 'Thank you for joining us. Use code WELCOME10 for 10% off on your first order.',
            type: 'broadcast',
            recipients: 'all',
            isSent: true,
            sentAt: new Date()
        },
        {
            title: 'Festival Sale Live Now!',
            body: 'Get up to 20% off on all sweets. Limited time offer. Shop now!',
            type: 'broadcast',
            recipients: 'all',
            isSent: true,
            sentAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
        },
        {
            title: 'New Products Added',
            body: 'Check out our new range of premium dry fruits and exotic namkeen varieties.',
            type: 'broadcast',
            recipients: 'all',
            isSent: true,
            sentAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
        }
    ];

    for (const notifData of notificationsData) {
        const notification = await Notification.create(notifData);
        console.log(`  ✅ ${notification.title}`);
    }

    // ═══════════════════════════════════════════════════════════════
    // SUMMARY
    // ═══════════════════════════════════════════════════════════════
    console.log('\n' + '═'.repeat(60));
    console.log('📊 MONGODB SEEDING SUMMARY');
    console.log('═'.repeat(60));
    
    const stats = {
        banners: await Banner.countDocuments(),
        pages: await Page.countDocuments(),
        notifications: await Notification.countDocuments()
    };

    console.log(`✅ Banners:        ${stats.banners}`);
    console.log(`✅ Pages:          ${stats.pages}`);
    console.log(`✅ Notifications:  ${stats.notifications}`);
    
    console.log('\n' + '═'.repeat(60));
    console.log('🎉 MongoDB seeding completed successfully!');
    console.log('═'.repeat(60) + '\n');
}

seedMongoDB()
    .catch((e) => {
        console.error('❌ Error during MongoDB seeding:', e);
        process.exit(1);
    })
    .finally(async () => {
        await mongoose.disconnect();
        console.log('✅ Disconnected from MongoDB\n');
    });
