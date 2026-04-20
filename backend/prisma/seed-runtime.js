const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function upsertUser({ email, name, password, role, phone }) {
  const passwordHash = await bcrypt.hash(password, 10);

  return prisma.user.upsert({
    where: { email },
    update: { name, role, phone, passwordHash },
    create: { email, name, role, phone, passwordHash },
  });
}

async function upsertCategory(id, name, nameTE, icon) {
  return prisma.category.upsert({
    where: { name },
    update: { nameTE, icon },
    create: { id, name, nameTE, icon },
  });
}

async function upsertFarmerProfile(userId, data) {
  return prisma.farmerProfile.upsert({
    where: { userId },
    update: data,
    create: { userId, ...data },
  });
}

async function upsertDoc(id, data) {
  return prisma.farmerDoc.upsert({
    where: { id },
    update: data,
    create: { id, ...data },
  });
}

async function upsertProduct(id, data) {
  return prisma.product.upsert({
    where: { id },
    update: data,
    create: { id, ...data },
    include: { category: true, farmer: { select: { name: true, id: true } } },
  });
}

async function upsertGovtPrice(id, data) {
  return prisma.govtPrice.upsert({
    where: { id },
    update: data,
    create: { id, ...data },
  });
}

async function upsertServiceableArea(id, data) {
  return prisma.serviceableArea.upsert({
    where: { pincode: data.pincode },
    update: data,
    create: { id, ...data },
  });
}

async function upsertMessage(id, data) {
  return prisma.customerMessage.upsert({
    where: { id },
    update: data,
    create: { id, ...data },
  });
}

async function main() {
  const categories = {
    vegetables: await upsertCategory('cat-vegetables', 'Vegetables', 'కూరగాయలు', '🥬'),
    fruits: await upsertCategory('cat-fruits', 'Fruits', 'పళ్ళు', '🍎'),
    grains: await upsertCategory('cat-grains', 'Grains', 'ధాన్యాలు', '🌾'),
    pulses: await upsertCategory('cat-pulses', 'Pulses', 'పప్పులు', '🫘'),
    dairy: await upsertCategory('cat-dairy', 'Dairy', 'పాల ఉత్పత్తులు', '🥛'),
    spices: await upsertCategory('cat-spices', 'Spices', 'మసాలాలు', '🌶️'),
    oils: await upsertCategory('cat-oils', 'Oils', 'నూనెలు', '🫒'),
    dryFruits: await upsertCategory('cat-dry-fruits', 'Dry Fruits', 'డ్రై ఫ్రూట్స్', '🥜'),
  };

  const admin = await upsertUser({
    email: 'admin@grameen.com',
    name: 'Admin',
    password: 'Admin@123',
    role: 'ADMIN',
    phone: '9000000000',
  });
  const farmer1 = await upsertUser({
    email: 'farmer1@grameen.com',
    name: 'Ramu Reddy',
    password: 'Farmer@123',
    role: 'FARMER',
    phone: '9000000001',
  });
  const farmer2 = await upsertUser({
    email: 'farmer2@grameen.com',
    name: 'Lakshmi Devi',
    password: 'Farmer@123',
    role: 'FARMER',
    phone: '9000000002',
  });
  const farmer3 = await upsertUser({
    email: 'farmer3@grameen.com',
    name: 'Suresh Naidu',
    password: 'Farmer@123',
    role: 'FARMER',
    phone: '9000000005',
  });
  const buyer1 = await upsertUser({
    email: 'buyer1@grameen.com',
    name: 'Vijay Kumar',
    password: 'Buyer@123',
    role: 'BUYER',
    phone: '9000000003',
  });
  const buyer2 = await upsertUser({
    email: 'buyer2@grameen.com',
    name: 'Priya Singh',
    password: 'Buyer@123',
    role: 'BUYER',
    phone: '9000000004',
  });

  const farmer1Profile = await upsertFarmerProfile(farmer1.id, {
    verificationLevel: 'LEVEL_1',
    village: 'Kurnool Village',
    mandal: 'Kurnool',
    district: 'Kurnool',
    pincode: '518001',
    bio: 'Verified farmer producing vegetables and chillies.',
  });
  const farmer2Profile = await upsertFarmerProfile(farmer2.id, {
    verificationLevel: 'LEVEL_0',
    village: 'Warangal Village',
    mandal: 'Warangal',
    district: 'Warangal',
    pincode: '506001',
    bio: 'Pending verification. Organic paddy and pulses farmer.',
  });
  const farmer3Profile = await upsertFarmerProfile(farmer3.id, {
    verificationLevel: 'LEVEL_1',
    village: 'Peddapalli',
    mandal: 'Guntur',
    district: 'Guntur',
    pincode: '522001',
    bio: 'Verified chillies and spice farmer.',
  });

  await upsertDoc(`doc-${farmer1.id}`, {
    farmerProfileId: farmer1Profile.id,
    docType: 'RATION_CARD',
    docNumber: 'RC-AP-1001',
    fileUrl: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400',
    notes: 'Approved by admin',
    status: 'APPROVED',
    reviewedBy: admin.id,
  });
  await upsertDoc(`doc-${farmer2.id}`, {
    farmerProfileId: farmer2Profile.id,
    docType: 'AADHAAR',
    docNumber: 'XXXX-XXXX-2222',
    fileUrl: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400',
    notes: 'Awaiting admin review',
    status: 'PENDING',
  });
  await upsertDoc(`doc-${farmer3.id}`, {
    farmerProfileId: farmer3Profile.id,
    docType: 'LAND_DOCUMENT',
    docNumber: 'LD-GNT-3003',
    fileUrl: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400',
    notes: 'Approved by admin',
    status: 'APPROVED',
    reviewedBy: admin.id,
  });

  await upsertProduct('prod-tomatoes', {
    farmerId: farmer1.id,
    categoryId: categories.vegetables.id,
    title: 'Fresh Tomatoes',
    titleTE: 'తాజా టమాటాలు',
    description: 'Sun-ripened tomatoes from Kurnool.',
    descriptionTE: 'కర్నూలు నుండి తాజా టమాటాలు.',
    unit: 'kg',
    priceType: 'FIXED',
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
    status: 'ACTIVE',
  });
  await upsertProduct('prod-chillies', {
    farmerId: farmer1.id,
    categoryId: categories.spices.id,
    title: 'Green Chillies',
    titleTE: 'పచ్చి మిర్చి',
    description: 'Hybrid green chillies.',
    descriptionTE: 'హైబ్రిడ్ పచ్చి మిర్చి.',
    unit: 'kg',
    priceType: 'HYBRID',
    fixedPrice: 60,
    minBidPrice: 50,
    bidEndsAt: new Date(Date.now() + 7 * 86400000),
    grade: 'A',
    organic: true,
    harvestDate: new Date('2026-04-06'),
    minQty: 5,
    availableQty: 100,
    imageUrls: ['https://images.unsplash.com/photo-1601493700631-2b16ec4b4716?w=600'],
    village: 'Kurnool Village',
    district: 'Kurnool',
    pincode: '518001',
    status: 'ACTIVE',
  });
  await upsertProduct('prod-mango', {
    farmerId: farmer3.id,
    categoryId: categories.fruits.id,
    title: 'Mango (Banganapalli)',
    titleTE: 'బంగినపల్లి మామిడి',
    description: 'Sweet Banganapalli mangoes.',
    descriptionTE: 'తీయని బంగినపల్లి మామిడి.',
    unit: 'kg',
    priceType: 'BID',
    minBidPrice: 80,
    autoBidAccept: 120,
    bidEndsAt: new Date(Date.now() + 3 * 86400000),
    grade: 'A',
    organic: false,
    harvestDate: new Date('2026-04-05'),
    minQty: 5,
    availableQty: 500,
    imageUrls: ['https://images.unsplash.com/photo-1553279768-865429fa0078?w=600'],
    village: 'Peddapalli',
    district: 'Guntur',
    pincode: '522001',
    status: 'ACTIVE',
  });
  await upsertProduct('prod-rice', {
    farmerId: farmer3.id,
    categoryId: categories.grains.id,
    title: 'Sona Masoori Rice',
    titleTE: 'సోనా మసూరి బియ్యం',
    description: 'Premium Sona Masoori rice.',
    descriptionTE: 'ప్రీమియం సోనా మసూరి బియ్యం.',
    unit: 'kg',
    priceType: 'FIXED',
    fixedPrice: 55,
    grade: 'A',
    organic: false,
    harvestDate: new Date('2026-03-15'),
    minQty: 10,
    availableQty: 5000,
    imageUrls: ['https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600'],
    village: 'Amalapuram',
    district: 'Rajahmundry',
    pincode: '533001',
    status: 'ACTIVE',
  });
  await upsertProduct('prod-milk', {
    farmerId: farmer3.id,
    categoryId: categories.dairy.id,
    title: 'Fresh Cow Milk',
    titleTE: 'తాజా ఆవు పాలు',
    description: 'Fresh A2 cow milk.',
    descriptionTE: 'తాజా A2 ఆవు పాలు.',
    unit: 'litre',
    priceType: 'FIXED',
    fixedPrice: 65,
    grade: 'A',
    organic: true,
    harvestDate: new Date('2026-04-09'),
    minQty: 1,
    availableQty: 50,
    imageUrls: ['https://images.unsplash.com/photo-1550583724-b2692b85b150?w=600'],
    village: 'Ramagundam',
    district: 'Karimnagar',
    pincode: '505209',
    status: 'ACTIVE',
  });
  await upsertProduct('prod-toor-dal', {
    farmerId: farmer1.id,
    categoryId: categories.pulses.id,
    title: 'Toor Dal',
    titleTE: 'కంది పప్పు',
    description: 'Organic toor dal.',
    descriptionTE: 'సేంద్రీయ కంది పప్పు.',
    unit: 'kg',
    priceType: 'FIXED',
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
    status: 'ACTIVE',
  });

  await upsertGovtPrice('govt-1', {
    commodity: 'Tomato',
    variety: 'Hybrid',
    market: 'Kurnool APMC',
    district: 'Kurnool',
    state: 'AP/TS',
    date: new Date('2026-04-08'),
    unit: 'Quintal',
    minPrice: 1800,
    maxPrice: 3000,
    modalPrice: 2500,
    uploadedBy: admin.id,
  });
  await upsertGovtPrice('govt-2', {
    commodity: 'Chilli',
    variety: 'Teja',
    market: 'Guntur APMC',
    district: 'Guntur',
    state: 'AP/TS',
    date: new Date('2026-04-08'),
    unit: 'Quintal',
    minPrice: 15000,
    maxPrice: 35000,
    modalPrice: 25000,
    uploadedBy: admin.id,
  });
  await upsertGovtPrice('govt-3', {
    commodity: 'Onion',
    variety: 'Red',
    market: 'Anantapur APMC',
    district: 'Anantapur',
    state: 'AP/TS',
    date: new Date('2026-04-08'),
    unit: 'Quintal',
    minPrice: 1100,
    maxPrice: 2200,
    modalPrice: 1650,
    uploadedBy: admin.id,
  });
  await upsertGovtPrice('govt-4', {
    commodity: 'Rice',
    variety: 'Sona Masoori',
    market: 'Rajahmundry APMC',
    district: 'Rajahmundry',
    state: 'AP/TS',
    date: new Date('2026-04-08'),
    unit: 'Quintal',
    minPrice: 2800,
    maxPrice: 3600,
    modalPrice: 3250,
    uploadedBy: admin.id,
  });
  await upsertGovtPrice('govt-5', {
    commodity: 'Mango',
    variety: 'Banganapalli',
    market: 'Guntur APMC',
    district: 'Guntur',
    state: 'AP/TS',
    date: new Date('2026-04-08'),
    unit: 'Quintal',
    minPrice: 6500,
    maxPrice: 12000,
    modalPrice: 9000,
    uploadedBy: admin.id,
  });
  await upsertGovtPrice('govt-6', {
    commodity: 'Green Chillies',
    variety: 'Teja',
    market: 'Kurnool APMC',
    district: 'Kurnool',
    state: 'AP/TS',
    date: new Date('2026-04-08'),
    unit: 'Quintal',
    minPrice: 4500,
    maxPrice: 7800,
    modalPrice: 6200,
    uploadedBy: admin.id,
  });

  await upsertServiceableArea('area-1', { pincode: '518001', district: 'Kurnool', flatFee: 45 });
  await upsertServiceableArea('area-2', { pincode: '506001', district: 'Warangal', flatFee: 50 });
  await upsertServiceableArea('area-3', { pincode: '522001', district: 'Guntur', flatFee: 50 });
  await upsertServiceableArea('area-4', { pincode: '533001', district: 'Rajahmundry', flatFee: 65 });
  await upsertServiceableArea('area-5', { pincode: '515001', district: 'Anantapur', flatFee: 55 });
  await upsertServiceableArea('area-6', { pincode: '507001', district: 'Khammam', flatFee: 52 });

  await upsertMessage('msg-1', {
    productId: 'prod-tomatoes',
    buyerId: buyer1.id,
    farmerProfileId: farmer1Profile.id,
    message: 'Can you share bulk pricing and harvest timing for 100 kg? ',
    readAt: null,
  });
  await upsertMessage('msg-2', {
    productId: 'prod-chillies',
    buyerId: buyer2.id,
    farmerProfileId: farmer1Profile.id,
    message: 'Need regular weekly supply. Is consistent grade available?',
    readAt: null,
  });
  await upsertMessage('msg-3', {
    productId: 'prod-rice',
    buyerId: buyer1.id,
    farmerProfileId: farmer3Profile.id,
    message: 'Looking for 500 kg rice for a retail store. Please advise best rate.',
    readAt: new Date(),
  });

  const bid1 = await prisma.bid.upsert({
    where: { id: 'bid-1' },
    update: { amount: 55, status: 'PENDING' },
    create: {
      id: 'bid-1',
      productId: 'prod-chillies',
      buyerId: buyer1.id,
      amount: 55,
      message: 'Need bulk order for my store.',
      status: 'PENDING',
    },
  });
  await prisma.bid.upsert({
    where: { id: 'bid-2' },
    update: { amount: 125, status: 'COUNTERED', counterAmount: 130, counterMessage: 'Can do for 50kg+' },
    create: {
      id: 'bid-2',
      productId: 'prod-mango',
      buyerId: buyer2.id,
      amount: 125,
      message: 'Restaurant supply order.',
      status: 'COUNTERED',
      counterAmount: 130,
      counterMessage: 'Can do for 50kg+',
    },
  });

  await prisma.order.upsert({
    where: { id: 'order-1' },
    update: { status: 'PLACED' },
    create: {
      id: 'order-1',
      buyerId: buyer1.id,
      totalAmount: 620,
      paymentMethod: 'COD',
      paymentStatus: 'PENDING',
      deliveryAddress: {
        name: 'Vijay Kumar',
        phone: '9000000003',
        line1: '12-3-456, Ameerpet',
        city: 'Hyderabad',
        pincode: '500008',
        state: 'Telangana',
      },
      status: 'PLACED',
    },
  });

  console.log('Runtime demo data ensured.');
  console.log('Demo users: admin, verified farmer, unverified farmer, buyer, plus marketplace seed data.');
  console.log(`Bid seeded: ${bid1.id}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });