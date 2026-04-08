import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding Grameen Reach database...');

  const hash = (pw: string) => bcrypt.hash(pw, 10);

  // ── Categories ──────────────────────────────────────────────────────────────
  const categories = await Promise.all([
    prisma.category.upsert({ where: { name: 'Vegetables' }, update: {}, create: { name: 'Vegetables', nameTE: 'కూరగాయలు', icon: '🥦' } }),
    prisma.category.upsert({ where: { name: 'Fruits' },     update: {}, create: { name: 'Fruits',     nameTE: 'పళ్ళు',      icon: '🍅' } }),
    prisma.category.upsert({ where: { name: 'Grains' },     update: {}, create: { name: 'Grains',     nameTE: 'ధాన్యాలు',   icon: '🌾' } }),
    prisma.category.upsert({ where: { name: 'Pulses' },     update: {}, create: { name: 'Pulses',     nameTE: 'పప్పులు',    icon: '🫘' } }),
    prisma.category.upsert({ where: { name: 'Dairy' },      update: {}, create: { name: 'Dairy',      nameTE: 'పాల ఉత్పత్తులు', icon: '🥛' } }),
    prisma.category.upsert({ where: { name: 'Spices' },     update: {}, create: { name: 'Spices',     nameTE: 'మసాలాలు',    icon: '🌶️' } }),
  ]);

  const [vegCat, fruitCat, grainCat, pulseCat, , spiceCat] = categories;

  // ── Users ────────────────────────────────────────────────────────────────────
  const admin = await prisma.user.upsert({
    where: { email: 'admin@grameen.com' },
    update: {},
    create: { email: 'admin@grameen.com', name: 'Admin', passwordHash: await hash('Admin@123'), role: 'ADMIN' },
  });
  console.log('✅ Admin:', admin.email);

  const farmer1 = await prisma.user.upsert({
    where: { email: 'farmer1@grameen.com' },
    update: {},
    create: { email: 'farmer1@grameen.com', name: 'Ramu Reddy', passwordHash: await hash('Farmer@123'), role: 'FARMER', phone: '9000000001' },
  });
  const farmer2 = await prisma.user.upsert({
    where: { email: 'farmer2@grameen.com' },
    update: {},
    create: { email: 'farmer2@grameen.com', name: 'Lakshmi Devi', passwordHash: await hash('Farmer@123'), role: 'FARMER', phone: '9000000002' },
  });

  const buyer1 = await prisma.user.upsert({
    where: { email: 'buyer1@grameen.com' },
    update: {},
    create: { email: 'buyer1@grameen.com', name: 'Vijay Kumar', passwordHash: await hash('Buyer@123'), role: 'BUYER', phone: '9000000003' },
  });
  await prisma.user.upsert({
    where: { email: 'buyer2@grameen.com' },
    update: {},
    create: { email: 'buyer2@grameen.com', name: 'Priya Singh', passwordHash: await hash('Buyer@123'), role: 'BUYER', phone: '9000000004' },
  });

  // ── Farmer profiles ──────────────────────────────────────────────────────────
  const fp1 = await prisma.farmerProfile.upsert({
    where: { userId: farmer1.id },
    update: {},
    create: {
      userId: farmer1.id,
      verificationLevel: 'LEVEL_1',
      village: 'Kurnool Village',
      mandal: 'Kurnool',
      district: 'Kurnool',
      pincode: '518001',
      bio: 'Third-generation farmer specialising in vegetables and chillies',
    },
  });

  const fp2 = await prisma.farmerProfile.upsert({
    where: { userId: farmer2.id },
    update: {},
    create: {
      userId: farmer2.id,
      verificationLevel: 'LEVEL_0',
      village: 'Warangal Village',
      mandal: 'Warangal',
      district: 'Warangal',
      pincode: '506001',
      bio: 'Organic paddy and pulses farmer',
    },
  });

  // Add a doc for farmer1 (approved)
  await prisma.farmerDoc.upsert({
    where: { id: 'seed-doc-farmer1' },
    update: {},
    create: {
      id: 'seed-doc-farmer1',
      farmerProfileId: fp1.id,
      docType: 'RATION_CARD',
      docNumber: 'RC****1234',
      fileUrl: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400',
      notes: 'White ration card - BPL category',
      status: 'APPROVED',
      reviewedBy: admin.id,
    },
  });

  // Add a doc for farmer2 (pending)
  await prisma.farmerDoc.upsert({
    where: { id: 'seed-doc-farmer2' },
    update: {},
    create: {
      id: 'seed-doc-farmer2',
      farmerProfileId: fp2.id,
      docType: 'LAND_DOCUMENT',
      docNumber: 'LD****5678',
      fileUrl: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400',
      notes: 'Land passbook',
      status: 'PENDING',
    },
  });

  console.log('✅ Farmers seeded (farmer1=LEVEL_1 verified, farmer2=LEVEL_0 pending)');

  // ── Products (farmer1 only – Level 1 can sell) ────────────────────────────
  const productData = [
    {
      title: 'Fresh Tomatoes',
      titleTE: 'తాజా టమాటాలు',
      description: 'Sun-ripened hybrid tomatoes from Kurnool. Perfect for daily cooking.',
      descriptionTE: 'కర్నూలు నుండి తాజా టమాటాలు.',
      categoryId: vegCat.id,
      unit: 'kg',
      priceType: 'FIXED' as const,
      fixedPrice: 25,
      grade: 'A',
      organic: false,
      harvestDate: new Date('2026-04-07'),
      minQty: 2,
      availableQty: 200,
      imageUrls: ['https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=600'],
      village: 'Kurnool Village',
      district: 'Kurnool',
      pincode: '518001',
    },
    {
      title: 'Green Chillies',
      titleTE: 'పచ్చి మిర్చి',
      description: 'Guntur variety green chillies. Medium-hot, ideal for pickles and curries.',
      descriptionTE: 'గుంటూరు రకం పచ్చి మిర్చి.',
      categoryId: spiceCat.id,
      unit: 'kg',
      priceType: 'HYBRID' as const,
      fixedPrice: 60,
      minBidPrice: 50,
      bidEndsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      grade: 'A',
      organic: true,
      harvestDate: new Date('2026-04-06'),
      minQty: 5,
      availableQty: 100,
      imageUrls: ['https://images.unsplash.com/photo-1601493700631-2b16ec4b4716?w=600'],
      village: 'Kurnool Village',
      district: 'Kurnool',
      pincode: '518001',
    },
    {
      title: 'Brinjal (Eggplant)',
      titleTE: 'వంకాయ',
      description: 'Purple brinjal, freshly harvested. Great for curries and fry.',
      descriptionTE: 'తాజా వంకాయ, కూరలకు అనుకూలం.',
      categoryId: vegCat.id,
      unit: 'kg',
      priceType: 'FIXED' as const,
      fixedPrice: 30,
      grade: 'B',
      organic: false,
      harvestDate: new Date('2026-04-07'),
      minQty: 1,
      availableQty: 150,
      imageUrls: ['https://images.unsplash.com/photo-1615485500704-8e990f9900f7?w=600'],
      village: 'Kurnool Village',
      district: 'Kurnool',
      pincode: '518001',
    },
    {
      title: 'Mango (Banganapalli)',
      titleTE: 'బంగినపల్లి మామిడి',
      description: 'Sweet Banganapalli mangoes from Kurnool – the famous AP variety.',
      descriptionTE: 'కర్నూలు బంగినపల్లి మామిడి పళ్ళు.',
      categoryId: fruitCat.id,
      unit: 'kg',
      priceType: 'BID' as const,
      minBidPrice: 80,
      autoBidAccept: 120,
      bidEndsAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      grade: 'A',
      organic: false,
      harvestDate: new Date('2026-04-05'),
      minQty: 5,
      availableQty: 500,
      imageUrls: ['https://images.unsplash.com/photo-1553279768-865429fa0078?w=600'],
      village: 'Kurnool Village',
      district: 'Kurnool',
      pincode: '518001',
    },
    {
      title: 'Red Onions',
      titleTE: 'ఎర్ర ఉల్లిపాయలు',
      description: 'Fresh red onions, long shelf life, ideal for bulk purchase.',
      descriptionTE: 'తాజా ఎర్ర ఉల్లిపాయలు, నిల్వకు అనుకూలం.',
      categoryId: vegCat.id,
      unit: 'kg',
      priceType: 'FIXED' as const,
      fixedPrice: 22,
      grade: 'A',
      organic: false,
      harvestDate: new Date('2026-04-03'),
      minQty: 5,
      availableQty: 1000,
      imageUrls: ['https://images.unsplash.com/photo-1518977956812-cd3dbadaaf31?w=600'],
      village: 'Kurnool Village',
      district: 'Kurnool',
      pincode: '518001',
    },
    {
      title: 'Groundnut (Peanuts)',
      titleTE: 'వేరుసెనగ',
      description: 'Raw groundnuts from Kurnool – AP\'s peanut capital. Perfect for oil extraction or roasting.',
      descriptionTE: 'కర్నూలు వేరుసెనగలు – నూనె మరియు వేయించడానికి.',
      categoryId: grainCat.id,
      unit: 'quintal',
      priceType: 'HYBRID' as const,
      fixedPrice: 5500,
      minBidPrice: 5000,
      bidEndsAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      grade: 'A',
      organic: false,
      harvestDate: new Date('2026-04-01'),
      minQty: 1,
      availableQty: 20,
      imageUrls: ['https://images.unsplash.com/photo-1567585023886-f27f58e80081?w=600'],
      village: 'Kurnool Village',
      district: 'Kurnool',
      pincode: '518001',
    },
    {
      title: 'Toor Dal (Pigeon Pea)',
      titleTE: 'కంది పప్పు',
      description: 'Organic toor dal, unpolished, high protein. Direct from farm.',
      descriptionTE: 'సేంద్రీయ కంది పప్పు, అధిక ప్రోటీన్.',
      categoryId: pulseCat.id,
      unit: 'kg',
      priceType: 'FIXED' as const,
      fixedPrice: 110,
      grade: 'A',
      organic: true,
      harvestDate: new Date('2026-03-28'),
      minQty: 2,
      availableQty: 300,
      imageUrls: ['https://images.unsplash.com/photo-1585996791890-2d4c1b6ac3c1?w=600'],
      village: 'Kurnool Village',
      district: 'Kurnool',
      pincode: '518001',
    },
    {
      title: 'Bitter Gourd',
      titleTE: 'కాకరకాయ',
      description: 'Fresh bitter gourd, great for diabetic-friendly dishes.',
      descriptionTE: 'తాజా కాకరకాయ, మధుమేహ నివారణకు మంచిది.',
      categoryId: vegCat.id,
      unit: 'kg',
      priceType: 'FIXED' as const,
      fixedPrice: 40,
      grade: 'B',
      organic: true,
      harvestDate: new Date('2026-04-07'),
      minQty: 1,
      availableQty: 80,
      imageUrls: ['https://images.unsplash.com/photo-1601493700631-2b16ec4b4716?w=600'],
      village: 'Kurnool Village',
      district: 'Kurnool',
      pincode: '518001',
    },
  ];

  for (const pd of productData) {
    await prisma.product.create({
      data: { ...pd, farmerId: farmer1.id, status: 'ACTIVE' },
    });
  }
  console.log(`✅ ${productData.length} products seeded`);

  // ── Govt / Mandi Prices ──────────────────────────────────────────────────────
  const today = new Date('2026-04-08');
  const mandiPrices = [
    { commodity: 'Tomato',   variety: 'Hybrid',        market: 'Kurnool APMC',    district: 'Kurnool',    minPrice: 1800, maxPrice: 3000, modalPrice: 2500 },
    { commodity: 'Tomato',   variety: 'Local',          market: 'Guntur APMC',     district: 'Guntur',     minPrice: 1500, maxPrice: 2800, modalPrice: 2200 },
    { commodity: 'Chilli',   variety: 'Green',          market: 'Guntur APMC',     district: 'Guntur',     minPrice: 4000, maxPrice: 8000, modalPrice: 6000 },
    { commodity: 'Onion',    variety: 'Red',            market: 'Kurnool APMC',    district: 'Kurnool',    minPrice: 1500, maxPrice: 2800, modalPrice: 2200 },
    { commodity: 'Mango',    variety: 'Banganapalli',   market: 'Vijayawada APMC', district: 'Krishna',    minPrice: 6000, maxPrice: 12000, modalPrice: 9000 },
    { commodity: 'Paddy',    variety: 'Sona Masoori',   market: 'Warangal APMC',   district: 'Warangal',   minPrice: 2100, maxPrice: 2300, modalPrice: 2200 },
    { commodity: 'Toor Dal', variety: 'Regular',        market: 'Hyderabad APMC',  district: 'Hyderabad',  minPrice: 9000, maxPrice: 11000, modalPrice: 10000 },
    { commodity: 'Groundnut', variety: 'Bold',          market: 'Kurnool APMC',    district: 'Kurnool',    minPrice: 5000, maxPrice: 6500, modalPrice: 5800 },
    { commodity: 'Brinjal',  variety: 'Purple',         market: 'Vijayawada APMC', district: 'Krishna',    minPrice: 1000, maxPrice: 4000, modalPrice: 2500 },
    { commodity: 'Bitter Gourd', variety: 'Regular',    market: 'Hyderabad APMC',  district: 'Hyderabad',  minPrice: 2000, maxPrice: 5000, modalPrice: 3500 },
  ];

  for (const mp of mandiPrices) {
    await prisma.govtPrice.create({
      data: { ...mp, date: today, unit: 'Quintal', state: 'AP/TS', uploadedBy: admin.id },
    });
  }
  console.log(`✅ ${mandiPrices.length} mandi prices seeded`);

  // ── Serviceable Areas ────────────────────────────────────────────────────────
  const areas = [
    { pincode: '500001', district: 'Hyderabad',   flatFee: 60 },
    { pincode: '500002', district: 'Hyderabad',   flatFee: 60 },
    { pincode: '500008', district: 'Hyderabad',   flatFee: 60 },
    { pincode: '500034', district: 'Hyderabad',   flatFee: 60 },
    { pincode: '506001', district: 'Warangal',    flatFee: 50 },
    { pincode: '518001', district: 'Kurnool',     flatFee: 45 },
    { pincode: '520001', district: 'Vijayawada',  flatFee: 50 },
    { pincode: '522001', district: 'Guntur',      flatFee: 50 },
    { pincode: '530001', district: 'Visakhapatnam', flatFee: 70 },
    { pincode: '533001', district: 'Rajahmundry', flatFee: 65 },
  ];

  for (const area of areas) {
    await prisma.serviceableArea.upsert({
      where: { pincode: area.pincode },
      update: {},
      create: area,
    });
  }
  console.log(`✅ ${areas.length} serviceable areas seeded`);

  // ── Demo Cart for buyer1 ─────────────────────────────────────────────────────
  const products = await prisma.product.findMany({ where: { farmerId: farmer1.id }, take: 3 });
  if (products.length > 0) {
    const cart = await prisma.cart.upsert({
      where: { userId: buyer1.id },
      update: {},
      create: { userId: buyer1.id },
    });
    for (const p of products.slice(0, 2)) {
      await prisma.cartItem.upsert({
        where: { cartId_productId: { cartId: cart.id, productId: p.id } },
        update: {},
        create: { cartId: cart.id, productId: p.id, qty: 5 },
      });
    }
    console.log('✅ Demo cart created for buyer1');
  }

  console.log('\n🎉 Seed complete!\n');
  console.log('Demo accounts:');
  console.log('  Admin  : admin@grameen.com   / Admin@123');
  console.log('  Farmer1: farmer1@grameen.com / Farmer@123  (Level 1 – verified seller)');
  console.log('  Farmer2: farmer2@grameen.com / Farmer@123  (Level 0 – pending verification)');
  console.log('  Buyer1 : buyer1@grameen.com  / Buyer@123');
  console.log('  Buyer2 : buyer2@grameen.com  / Buyer@123');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
