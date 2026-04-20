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
    prisma.category.upsert({ where: { name: 'Oils' },       update: {}, create: { name: 'Oils',       nameTE: 'నూనెలు',     icon: '🫒' } }),
    prisma.category.upsert({ where: { name: 'Dry Fruits' }, update: {}, create: { name: 'Dry Fruits', nameTE: 'డ్రై ఫ్రూట్స్', icon: '🥜' } }),
  ]);

  const [vegCat, fruitCat, grainCat, pulseCat, dairyCat, spiceCat, oilCat, dryFruitCat] = categories;
  console.log(`✅ ${categories.length} categories seeded`);

  // ── Users ────────────────────────────────────────────────────────────────────
  const admin = await prisma.user.upsert({
    where: { email: 'admin@grameen.com' },
    update: {},
    create: { email: 'admin@grameen.com', name: 'Admin', passwordHash: await hash('Admin@123'), role: 'ADMIN' },
  });
  console.log('✅ Admin:', admin.email);

  // --- Farmers ---
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
  const farmer3 = await prisma.user.upsert({
    where: { email: 'farmer3@grameen.com' },
    update: {},
    create: { email: 'farmer3@grameen.com', name: 'Suresh Naidu', passwordHash: await hash('Farmer@123'), role: 'FARMER', phone: '9000000005' },
  });
  const farmer4 = await prisma.user.upsert({
    where: { email: 'farmer4@grameen.com' },
    update: {},
    create: { email: 'farmer4@grameen.com', name: 'Anjali Kumari', passwordHash: await hash('Farmer@123'), role: 'FARMER', phone: '9000000006' },
  });
  const farmer5 = await prisma.user.upsert({
    where: { email: 'farmer5@grameen.com' },
    update: {},
    create: { email: 'farmer5@grameen.com', name: 'Venkatesh Goud', passwordHash: await hash('Farmer@123'), role: 'FARMER', phone: '9000000007' },
  });
  const farmer6 = await prisma.user.upsert({
    where: { email: 'farmer6@grameen.com' },
    update: {},
    create: { email: 'farmer6@grameen.com', name: 'Padma Reddy', passwordHash: await hash('Farmer@123'), role: 'FARMER', phone: '9000000008' },
  });

  // --- Buyers ---
  const buyer1 = await prisma.user.upsert({
    where: { email: 'buyer1@grameen.com' },
    update: {},
    create: { email: 'buyer1@grameen.com', name: 'Vijay Kumar', passwordHash: await hash('Buyer@123'), role: 'BUYER', phone: '9000000003' },
  });
  const buyer2 = await prisma.user.upsert({
    where: { email: 'buyer2@grameen.com' },
    update: {},
    create: { email: 'buyer2@grameen.com', name: 'Priya Singh', passwordHash: await hash('Buyer@123'), role: 'BUYER', phone: '9000000004' },
  });
  const buyer3 = await prisma.user.upsert({
    where: { email: 'buyer3@grameen.com' },
    update: {},
    create: { email: 'buyer3@grameen.com', name: 'Rajesh Sharma', passwordHash: await hash('Buyer@123'), role: 'BUYER', phone: '9000000009' },
  });
  const buyer4 = await prisma.user.upsert({
    where: { email: 'buyer4@grameen.com' },
    update: {},
    create: { email: 'buyer4@grameen.com', name: 'Meena Devi', passwordHash: await hash('Buyer@123'), role: 'BUYER', phone: '9000000010' },
  });

  console.log('✅ 6 farmers + 4 buyers created');

  // ── Farmer profiles ──────────────────────────────────────────────────────────
  const fp1 = await prisma.farmerProfile.upsert({
    where: { userId: farmer1.id },
    update: {},
    create: {
      userId: farmer1.id, verificationLevel: 'LEVEL_1',
      village: 'Kurnool Village', mandal: 'Kurnool', district: 'Kurnool', pincode: '518001',
      bio: 'Third-generation farmer specialising in vegetables and chillies. 15 acres of irrigated land.',
    },
  });
  const fp2 = await prisma.farmerProfile.upsert({
    where: { userId: farmer2.id },
    update: {},
    create: {
      userId: farmer2.id, verificationLevel: 'LEVEL_0',
      village: 'Warangal Village', mandal: 'Warangal', district: 'Warangal', pincode: '506001',
      bio: 'Organic paddy and pulses farmer. Pioneer in natural farming methods in Warangal district.',
    },
  });
  const fp3 = await prisma.farmerProfile.upsert({
    where: { userId: farmer3.id },
    update: {},
    create: {
      userId: farmer3.id, verificationLevel: 'LEVEL_1',
      village: 'Peddapalli', mandal: 'Guntur', district: 'Guntur', pincode: '522001',
      bio: 'Famous Guntur chilli farmer. Exports to 5 states. Specialises in Teja and Byadgi varieties.',
    },
  });
  const fp4 = await prisma.farmerProfile.upsert({
    where: { userId: farmer4.id },
    update: {},
    create: {
      userId: farmer4.id, verificationLevel: 'LEVEL_1',
      village: 'Ramagundam', mandal: 'Karimnagar', district: 'Karimnagar', pincode: '505209',
      bio: 'Dairy and fruit farmer. 20 cows, 10 acres mango orchard. Known for quality milk products.',
    },
  });
  const fp5 = await prisma.farmerProfile.upsert({
    where: { userId: farmer5.id },
    update: {},
    create: {
      userId: farmer5.id, verificationLevel: 'LEVEL_1',
      village: 'Amalapuram', mandal: 'Rajahmundry', district: 'Rajahmundry', pincode: '533001',
      bio: 'Coconut and banana plantation owner. 30 acres in the fertile Godavari delta region.',
    },
  });
  const fp6 = await prisma.farmerProfile.upsert({
    where: { userId: farmer6.id },
    update: {},
    create: {
      userId: farmer6.id, verificationLevel: 'LEVEL_0',
      village: 'Nandyal', mandal: 'Nandyal', district: 'Kurnool', pincode: '518501',
      bio: 'Young farmer growing organic vegetables and herbs. First-generation farmer using modern techniques.',
    },
  });

  // Docs for verified farmers
  for (const { fp, farmer, status } of [
    { fp: fp1, farmer: farmer1, status: 'APPROVED' as const },
    { fp: fp3, farmer: farmer3, status: 'APPROVED' as const },
    { fp: fp4, farmer: farmer4, status: 'APPROVED' as const },
    { fp: fp5, farmer: farmer5, status: 'APPROVED' as const },
    { fp: fp2, farmer: farmer2, status: 'PENDING' as const },
    { fp: fp6, farmer: farmer6, status: 'PENDING' as const },
  ]) {
    await prisma.farmerDoc.upsert({
      where: { id: `seed-doc-${farmer.id}` },
      update: {},
      create: {
        id: `seed-doc-${farmer.id}`,
        farmerProfileId: fp.id,
        docType: 'RATION_CARD',
        docNumber: `RC****${Math.floor(1000 + Math.random() * 9000)}`,
        fileUrl: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400',
        notes: status === 'APPROVED' ? 'Verified and approved' : 'Pending review',
        status,
        reviewedBy: status === 'APPROVED' ? admin.id : undefined,
      },
    });
  }

  console.log('✅ 6 farmer profiles + docs seeded');

  // ── Products ────────────────────────────────────────────────────────────────
  const allProducts = [
    // --- Farmer 1 (Ramu Reddy, Kurnool) - Vegetables & Spices ---
    {
      farmerId: farmer1.id, title: 'Fresh Tomatoes', titleTE: 'తాజా టమాటాలు',
      description: 'Sun-ripened hybrid tomatoes from Kurnool. Perfect for daily cooking. Grade A quality.',
      descriptionTE: 'కర్నూలు నుండి తాజా టమాటాలు. రోజువారీ వంటకు ఉత్తమం.',
      categoryId: vegCat.id, unit: 'kg', priceType: 'FIXED' as const, fixedPrice: 25,
      grade: 'A', organic: false, harvestDate: new Date('2026-04-07'), minQty: 2, availableQty: 200,
      imageUrls: ['https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=600'],
      village: 'Kurnool Village', district: 'Kurnool', pincode: '518001',
    },
    {
      farmerId: farmer1.id, title: 'Green Chillies', titleTE: 'పచ్చి మిర్చి',
      description: 'Guntur variety green chillies. Medium-hot, ideal for pickles and curries.',
      descriptionTE: 'గుంటూరు రకం పచ్చి మిర్చి. ఊరగాయలు మరియు కూరలకు అనువైనది.',
      categoryId: spiceCat.id, unit: 'kg', priceType: 'HYBRID' as const, fixedPrice: 60, minBidPrice: 50,
      bidEndsAt: new Date(Date.now() + 7 * 86400000),
      grade: 'A', organic: true, harvestDate: new Date('2026-04-06'), minQty: 5, availableQty: 100,
      imageUrls: ['https://images.unsplash.com/photo-1601493700631-2b16ec4b4716?w=600'],
      village: 'Kurnool Village', district: 'Kurnool', pincode: '518001',
    },
    {
      farmerId: farmer1.id, title: 'Brinjal (Eggplant)', titleTE: 'వంకాయ',
      description: 'Purple brinjal, freshly harvested. Great for curries and fry.',
      descriptionTE: 'తాజా వంకాయ, కూరలకు అనుకూలం.',
      categoryId: vegCat.id, unit: 'kg', priceType: 'FIXED' as const, fixedPrice: 30,
      grade: 'B', organic: false, harvestDate: new Date('2026-04-07'), minQty: 1, availableQty: 150,
      imageUrls: ['https://images.unsplash.com/photo-1615485500704-8e990f9900f7?w=600'],
      village: 'Kurnool Village', district: 'Kurnool', pincode: '518001',
    },
    {
      farmerId: farmer1.id, title: 'Red Onions', titleTE: 'ఎర్ర ఉల్లిపాయలు',
      description: 'Fresh red onions, long shelf life, ideal for bulk purchase.',
      descriptionTE: 'తాజా ఎర్ర ఉల్లిపాయలు, నిల్వకు అనుకూలం.',
      categoryId: vegCat.id, unit: 'kg', priceType: 'FIXED' as const, fixedPrice: 22,
      grade: 'A', organic: false, harvestDate: new Date('2026-04-03'), minQty: 5, availableQty: 1000,
      imageUrls: ['https://images.unsplash.com/photo-1518977956812-cd3dbadaaf31?w=600'],
      village: 'Kurnool Village', district: 'Kurnool', pincode: '518001',
    },
    {
      farmerId: farmer1.id, title: 'Bitter Gourd', titleTE: 'కాకరకాయ',
      description: 'Fresh bitter gourd, great for diabetic-friendly dishes.',
      descriptionTE: 'తాజా కాకరకాయ, మధుమేహ నివారణకు మంచిది.',
      categoryId: vegCat.id, unit: 'kg', priceType: 'FIXED' as const, fixedPrice: 40,
      grade: 'B', organic: true, harvestDate: new Date('2026-04-07'), minQty: 1, availableQty: 80,
      imageUrls: ['https://images.unsplash.com/photo-1601493700631-2b16ec4b4716?w=600'],
      village: 'Kurnool Village', district: 'Kurnool', pincode: '518001',
    },
    {
      farmerId: farmer1.id, title: 'Drumstick (Moringa)', titleTE: 'మునగకాయ',
      description: 'Fresh moringa drumsticks. Rich in nutrients, perfect for sambar and curry.',
      descriptionTE: 'తాజా మునగకాయలు. సాంబార్ మరియు కూరకు అనువైనవి.',
      categoryId: vegCat.id, unit: 'kg', priceType: 'FIXED' as const, fixedPrice: 35,
      grade: 'A', organic: true, harvestDate: new Date('2026-04-08'), minQty: 1, availableQty: 60,
      imageUrls: ['https://images.unsplash.com/photo-1615485500704-8e990f9900f7?w=600'],
      village: 'Kurnool Village', district: 'Kurnool', pincode: '518001',
    },
    {
      farmerId: farmer1.id, title: 'Lady Finger (Okra)', titleTE: 'బెండకాయ',
      description: 'Tender lady finger, no fiber. Perfect for fry and curry preparation.',
      descriptionTE: 'మృదువైన బెండకాయ. వేపుడు మరియు కూరకు అనువైనది.',
      categoryId: vegCat.id, unit: 'kg', priceType: 'FIXED' as const, fixedPrice: 28,
      grade: 'A', organic: false, harvestDate: new Date('2026-04-08'), minQty: 2, availableQty: 120,
      imageUrls: ['https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=600'],
      village: 'Kurnool Village', district: 'Kurnool', pincode: '518001',
    },

    // --- Farmer 3 (Suresh Naidu, Guntur) - Chillies & Spices ---
    {
      farmerId: farmer3.id, title: 'Guntur Red Chilli (Teja)', titleTE: 'గుంటూరు ఎర్ర మిర్చి (తేజ)',
      description: 'Famous Guntur Teja chillies. SHU 75,000+. Deep red color, high pungency. Export quality.',
      descriptionTE: 'ప్రసిద్ధ గుంటూరు తేజ మిర్చి. ఎగుమతి నాణ్యత.',
      categoryId: spiceCat.id, unit: 'kg', priceType: 'BID' as const, minBidPrice: 200, autoBidAccept: 350,
      bidEndsAt: new Date(Date.now() + 5 * 86400000),
      grade: 'A', organic: false, harvestDate: new Date('2026-03-25'), minQty: 10, availableQty: 2000,
      imageUrls: ['https://images.unsplash.com/photo-1601493700631-2b16ec4b4716?w=600'],
      village: 'Peddapalli', district: 'Guntur', pincode: '522001',
    },
    {
      farmerId: farmer3.id, title: 'Byadgi Chilli (Mild)', titleTE: 'బ్యాడ్గి మిర్చి',
      description: 'Byadgi variety dried chillies. Deep red color, mild heat. Perfect for color in curries.',
      descriptionTE: 'బ్యాడ్గి రకం మిర్చి. కూరల రంగు కోసం అనువైనది.',
      categoryId: spiceCat.id, unit: 'kg', priceType: 'FIXED' as const, fixedPrice: 280,
      grade: 'A', organic: false, harvestDate: new Date('2026-03-20'), minQty: 5, availableQty: 500,
      imageUrls: ['https://images.unsplash.com/photo-1601493700631-2b16ec4b4716?w=600'],
      village: 'Peddapalli', district: 'Guntur', pincode: '522001',
    },
    {
      farmerId: farmer3.id, title: 'Turmeric (Whole)', titleTE: 'పసుపు (మొత్తం)',
      description: 'Organic turmeric from Guntur. High curcumin content. Sun-dried, no chemical processing.',
      descriptionTE: 'గుంటూరు సేంద్రీయ పసుపు. అధిక కర్కుమిన్. ఎండబెట్టినది.',
      categoryId: spiceCat.id, unit: 'kg', priceType: 'FIXED' as const, fixedPrice: 150,
      grade: 'A', organic: true, harvestDate: new Date('2026-03-15'), minQty: 2, availableQty: 300,
      imageUrls: ['https://images.unsplash.com/photo-1615485500704-8e990f9900f7?w=600'],
      village: 'Peddapalli', district: 'Guntur', pincode: '522001',
    },
    {
      farmerId: farmer3.id, title: 'Coriander Seeds', titleTE: 'ధనియాలు',
      description: 'Whole coriander seeds from Guntur. Aromatic, freshly harvested. Essential spice.',
      descriptionTE: 'గుంటూరు ధనియాలు. సుగంధం, తాజాగా కోసినవి.',
      categoryId: spiceCat.id, unit: 'kg', priceType: 'FIXED' as const, fixedPrice: 90,
      grade: 'A', organic: false, harvestDate: new Date('2026-03-28'), minQty: 2, availableQty: 200,
      imageUrls: ['https://images.unsplash.com/photo-1615485500704-8e990f9900f7?w=600'],
      village: 'Peddapalli', district: 'Guntur', pincode: '522001',
    },

    // --- Farmer 4 (Anjali Kumari, Karimnagar) - Dairy & Fruits ---
    {
      farmerId: farmer4.id, title: 'Fresh Cow Milk', titleTE: 'తాజా ఆవు పాలు',
      description: 'Fresh A2 cow milk from Gir cows. Delivered same-day. No additives, no preservatives.',
      descriptionTE: 'గిర్ ఆవుల నుండి తాజా A2 పాలు. అదే రోజు డెలివరీ.',
      categoryId: dairyCat.id, unit: 'litre', priceType: 'FIXED' as const, fixedPrice: 65,
      grade: 'A', organic: true, harvestDate: new Date('2026-04-09'), minQty: 1, availableQty: 50,
      imageUrls: ['https://images.unsplash.com/photo-1550583724-b2692b85b150?w=600'],
      village: 'Ramagundam', district: 'Karimnagar', pincode: '505209',
    },
    {
      farmerId: farmer4.id, title: 'Fresh Paneer', titleTE: 'తాజా పన్నీర్',
      description: 'Homemade paneer from fresh cow milk. Soft, creamy, preservative-free.',
      descriptionTE: 'తాజా ఆవు పాలతో ఇంట్లో తయారైన పన్నీర్.',
      categoryId: dairyCat.id, unit: 'kg', priceType: 'FIXED' as const, fixedPrice: 320,
      grade: 'A', organic: true, harvestDate: new Date('2026-04-09'), minQty: 1, availableQty: 20,
      imageUrls: ['https://images.unsplash.com/photo-1550583724-b2692b85b150?w=600'],
      village: 'Ramagundam', district: 'Karimnagar', pincode: '505209',
    },
    {
      farmerId: farmer4.id, title: 'Ghee (Desi)', titleTE: 'నెయ్యి (దేశీ)',
      description: 'Pure A2 cow ghee. Traditional bilona method. Rich aroma and golden color.',
      descriptionTE: 'స్వచ్ఛమైన A2 ఆవు నెయ్యి. సాంప్రదాయ బిలోనా పద్ధతి.',
      categoryId: dairyCat.id, unit: 'kg', priceType: 'FIXED' as const, fixedPrice: 850,
      grade: 'A', organic: true, harvestDate: new Date('2026-04-05'), minQty: 1, availableQty: 30,
      imageUrls: ['https://images.unsplash.com/photo-1550583724-b2692b85b150?w=600'],
      village: 'Ramagundam', district: 'Karimnagar', pincode: '505209',
    },
    {
      farmerId: farmer4.id, title: 'Mango (Banganapalli)', titleTE: 'బంగినపల్లి మామిడి',
      description: 'Sweet Banganapalli mangoes. Hand-picked, naturally ripened. The pride of AP.',
      descriptionTE: 'తీయని బంగినపల్లి మామిడి పళ్ళు. సహజంగా పండినవి.',
      categoryId: fruitCat.id, unit: 'kg', priceType: 'BID' as const, minBidPrice: 80, autoBidAccept: 120,
      bidEndsAt: new Date(Date.now() + 3 * 86400000),
      grade: 'A', organic: false, harvestDate: new Date('2026-04-05'), minQty: 5, availableQty: 500,
      imageUrls: ['https://images.unsplash.com/photo-1553279768-865429fa0078?w=600'],
      village: 'Ramagundam', district: 'Karimnagar', pincode: '505209',
    },
    {
      farmerId: farmer4.id, title: 'Papaya (Red Lady)', titleTE: 'బొప్పాయి',
      description: 'Sweet Red Lady papaya. Rich in vitamins, perfect for breakfast or smoothies.',
      descriptionTE: 'తీయని రెడ్ లేడీ బొప్పాయి. విటమిన్లు అధికం.',
      categoryId: fruitCat.id, unit: 'kg', priceType: 'FIXED' as const, fixedPrice: 35,
      grade: 'A', organic: false, harvestDate: new Date('2026-04-07'), minQty: 2, availableQty: 100,
      imageUrls: ['https://images.unsplash.com/photo-1553279768-865429fa0078?w=600'],
      village: 'Ramagundam', district: 'Karimnagar', pincode: '505209',
    },

    // --- Farmer 5 (Venkatesh Goud, Rajahmundry) - Coconut, Banana, Grains ---
    {
      farmerId: farmer5.id, title: 'Fresh Coconut', titleTE: 'తాజా కొబ్బరి',
      description: 'Fresh tender coconuts from Godavari delta. Sweet water, thick malai inside.',
      descriptionTE: 'గోదావరి డెల్టా నుండి తాజా కొబ్బరి. తీయని నీరు.',
      categoryId: fruitCat.id, unit: 'dozen', priceType: 'FIXED' as const, fixedPrice: 180,
      grade: 'A', organic: false, harvestDate: new Date('2026-04-08'), minQty: 1, availableQty: 200,
      imageUrls: ['https://images.unsplash.com/photo-1553279768-865429fa0078?w=600'],
      village: 'Amalapuram', district: 'Rajahmundry', pincode: '533001',
    },
    {
      farmerId: farmer5.id, title: 'Banana (Chakkarakeli)', titleTE: 'అరటి (చక్కరకేళి)',
      description: 'Sweet Chakkarakeli variety banana from East Godavari. Perfect dessert banana.',
      descriptionTE: 'తూర్పు గోదావరి చక్కరకేళి అరటి. తీయని రుచి.',
      categoryId: fruitCat.id, unit: 'dozen', priceType: 'FIXED' as const, fixedPrice: 50,
      grade: 'A', organic: false, harvestDate: new Date('2026-04-07'), minQty: 2, availableQty: 300,
      imageUrls: ['https://images.unsplash.com/photo-1553279768-865429fa0078?w=600'],
      village: 'Amalapuram', district: 'Rajahmundry', pincode: '533001',
    },
    {
      farmerId: farmer5.id, title: 'Sona Masoori Rice', titleTE: 'సోనా మసూరి బియ్యం',
      description: 'Premium Sona Masoori rice from Godavari delta. Aged, aromatic, lightweight grain.',
      descriptionTE: 'గోదావరి డెల్టా ప్రీమియం సోనా మసూరి బియ్యం.',
      categoryId: grainCat.id, unit: 'kg', priceType: 'FIXED' as const, fixedPrice: 55,
      grade: 'A', organic: false, harvestDate: new Date('2026-03-15'), minQty: 10, availableQty: 5000,
      imageUrls: ['https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600'],
      village: 'Amalapuram', district: 'Rajahmundry', pincode: '533001',
    },
    {
      farmerId: farmer5.id, title: 'Coconut Oil (Cold-Pressed)', titleTE: 'కొబ్బరి నూనె (చల్లగా నొక్కినది)',
      description: 'Pure cold-pressed coconut oil. No chemicals, extracted from fresh copra. Great for cooking and hair.',
      descriptionTE: 'స్వచ్ఛమైన చల్లగా నొక్కిన కొబ్బరి నూనె.',
      categoryId: oilCat.id, unit: 'litre', priceType: 'FIXED' as const, fixedPrice: 220,
      grade: 'A', organic: true, harvestDate: new Date('2026-04-01'), minQty: 1, availableQty: 100,
      imageUrls: ['https://images.unsplash.com/photo-1550583724-b2692b85b150?w=600'],
      village: 'Amalapuram', district: 'Rajahmundry', pincode: '533001',
    },
    {
      farmerId: farmer5.id, title: 'Groundnut Oil', titleTE: 'వేరుసెనగ నూనె',
      description: 'Traditional wood-pressed groundnut oil from East Godavari. Rich, nutty flavour.',
      descriptionTE: 'సాంప్రదాయ చెక్క నొక్కిన వేరుసెనగ నూనె.',
      categoryId: oilCat.id, unit: 'litre', priceType: 'HYBRID' as const, fixedPrice: 280, minBidPrice: 240,
      bidEndsAt: new Date(Date.now() + 4 * 86400000),
      grade: 'A', organic: true, harvestDate: new Date('2026-04-01'), minQty: 1, availableQty: 80,
      imageUrls: ['https://images.unsplash.com/photo-1550583724-b2692b85b150?w=600'],
      village: 'Amalapuram', district: 'Rajahmundry', pincode: '533001',
    },

    // --- Farmer 1 additional products ---
    {
      farmerId: farmer1.id, title: 'Groundnut (Peanuts)', titleTE: 'వేరుసెనగ',
      description: 'Raw groundnuts from Kurnool — AP\'s peanut capital. Perfect for oil extraction or roasting.',
      descriptionTE: 'కర్నూలు వేరుసెనగలు — నూనె మరియు వేయించడానికి.',
      categoryId: grainCat.id, unit: 'quintal', priceType: 'HYBRID' as const, fixedPrice: 5500, minBidPrice: 5000,
      bidEndsAt: new Date(Date.now() + 5 * 86400000),
      grade: 'A', organic: false, harvestDate: new Date('2026-04-01'), minQty: 1, availableQty: 20,
      imageUrls: ['https://images.unsplash.com/photo-1567585023886-f27f58e80081?w=600'],
      village: 'Kurnool Village', district: 'Kurnool', pincode: '518001',
    },
    {
      farmerId: farmer1.id, title: 'Toor Dal (Pigeon Pea)', titleTE: 'కంది పప్పు',
      description: 'Organic toor dal, unpolished, high protein. Direct from farm.',
      descriptionTE: 'సేంద్రీయ కంది పప్పు, అధిక ప్రోటీన్.',
      categoryId: pulseCat.id, unit: 'kg', priceType: 'FIXED' as const, fixedPrice: 110,
      grade: 'A', organic: true, harvestDate: new Date('2026-03-28'), minQty: 2, availableQty: 300,
      imageUrls: ['https://images.unsplash.com/photo-1585996791890-2d4c1b6ac3c1?w=600'],
      village: 'Kurnool Village', district: 'Kurnool', pincode: '518001',
    },

    // --- Farmer 3 additional ---
    {
      farmerId: farmer3.id, title: 'Chana Dal', titleTE: 'శనగ పప్పు',
      description: 'Split Bengal gram from Guntur. Golden color, earthy taste. Staple for dal and sweets.',
      descriptionTE: 'గుంటూరు శనగ పప్పు. బంగారు రంగు, మట్టి రుచి.',
      categoryId: pulseCat.id, unit: 'kg', priceType: 'FIXED' as const, fixedPrice: 95,
      grade: 'A', organic: false, harvestDate: new Date('2026-03-20'), minQty: 5, availableQty: 400,
      imageUrls: ['https://images.unsplash.com/photo-1585996791890-2d4c1b6ac3c1?w=600'],
      village: 'Peddapalli', district: 'Guntur', pincode: '522001',
    },
    {
      farmerId: farmer3.id, title: 'Moong Dal (Green Gram)', titleTE: 'పెసర పప్పు',
      description: 'Split green gram from Guntur. Easy to digest, rich in protein. Perfect for soups.',
      descriptionTE: 'గుంటూరు పెసర పప్పు. జీర్ణానికి సులభం, ప్రోటీన్ అధికం.',
      categoryId: pulseCat.id, unit: 'kg', priceType: 'FIXED' as const, fixedPrice: 120,
      grade: 'A', organic: true, harvestDate: new Date('2026-03-22'), minQty: 2, availableQty: 250,
      imageUrls: ['https://images.unsplash.com/photo-1585996791890-2d4c1b6ac3c1?w=600'],
      village: 'Peddapalli', district: 'Guntur', pincode: '522001',
    },

    // --- Farmer 4 additional ---
    {
      farmerId: farmer4.id, title: 'Cashew Nuts (Raw)', titleTE: 'జీడిపప్పు (పచ్చి)',
      description: 'Premium W320 cashews from Karimnagar. Raw, unroasted. Great for cooking and snacking.',
      descriptionTE: 'కరీంనగర్ ప్రీమియం W320 జీడిపప్పు.',
      categoryId: dryFruitCat.id, unit: 'kg', priceType: 'FIXED' as const, fixedPrice: 780,
      grade: 'A', organic: false, harvestDate: new Date('2026-03-10'), minQty: 1, availableQty: 50,
      imageUrls: ['https://images.unsplash.com/photo-1567585023886-f27f58e80081?w=600'],
      village: 'Ramagundam', district: 'Karimnagar', pincode: '505209',
    },
    {
      farmerId: farmer4.id, title: 'Guava (Allahabad)', titleTE: 'జామ పండు',
      description: 'Crispy Allahabad variety guava. Sweet, crunchy, rich in Vitamin C.',
      descriptionTE: 'అల్లాహాబాద్ రకం జామ పండు. తీయని, కరకరలాడే.',
      categoryId: fruitCat.id, unit: 'kg', priceType: 'FIXED' as const, fixedPrice: 45,
      grade: 'A', organic: false, harvestDate: new Date('2026-04-06'), minQty: 2, availableQty: 150,
      imageUrls: ['https://images.unsplash.com/photo-1553279768-865429fa0078?w=600'],
      village: 'Ramagundam', district: 'Karimnagar', pincode: '505209',
    },

    // --- Farmer 5 additional ---
    {
      farmerId: farmer5.id, title: 'Jaggery (Bellam)', titleTE: 'బెల్లం',
      description: 'Organic sugarcane jaggery from East Godavari. Traditional processing, no chemicals.',
      descriptionTE: 'తూర్పు గోదావరి సేంద్రీయ బెల్లం. సాంప్రదాయ తయారీ.',
      categoryId: grainCat.id, unit: 'kg', priceType: 'FIXED' as const, fixedPrice: 60,
      grade: 'A', organic: true, harvestDate: new Date('2026-03-25'), minQty: 5, availableQty: 500,
      imageUrls: ['https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600'],
      village: 'Amalapuram', district: 'Rajahmundry', pincode: '533001',
    },
  ];

  for (const pd of allProducts) {
    await prisma.product.create({
      data: { ...pd, status: 'ACTIVE' },
    });
  }
  console.log(`✅ ${allProducts.length} products seeded across 5 farmers`);

  // ── Govt / Mandi Prices ──────────────────────────────────────────────────────
  const today = new Date('2026-04-08');
  const yesterday = new Date('2026-04-07');
  const mandiPrices = [
    // Kurnool APMC
    { commodity: 'Tomato',   variety: 'Hybrid',        market: 'Kurnool APMC',    district: 'Kurnool',    minPrice: 1800, maxPrice: 3000, modalPrice: 2500, date: today },
    { commodity: 'Onion',    variety: 'Red',            market: 'Kurnool APMC',    district: 'Kurnool',    minPrice: 1500, maxPrice: 2800, modalPrice: 2200, date: today },
    { commodity: 'Groundnut', variety: 'Bold',          market: 'Kurnool APMC',    district: 'Kurnool',    minPrice: 5000, maxPrice: 6500, modalPrice: 5800, date: today },
    { commodity: 'Brinjal',  variety: 'Purple',         market: 'Kurnool APMC',    district: 'Kurnool',    minPrice: 1200, maxPrice: 3500, modalPrice: 2500, date: today },
    { commodity: 'Bitter Gourd', variety: 'Regular',    market: 'Kurnool APMC',    district: 'Kurnool',    minPrice: 2500, maxPrice: 4500, modalPrice: 3800, date: today },
    { commodity: 'Lady Finger', variety: 'Regular',     market: 'Kurnool APMC',    district: 'Kurnool',    minPrice: 1800, maxPrice: 3200, modalPrice: 2800, date: today },

    // Guntur APMC
    { commodity: 'Tomato',   variety: 'Local',          market: 'Guntur APMC',     district: 'Guntur',     minPrice: 1500, maxPrice: 2800, modalPrice: 2200, date: today },
    { commodity: 'Chilli',   variety: 'Teja',           market: 'Guntur APMC',     district: 'Guntur',     minPrice: 15000, maxPrice: 35000, modalPrice: 25000, date: today },
    { commodity: 'Chilli',   variety: 'Byadgi',         market: 'Guntur APMC',     district: 'Guntur',     minPrice: 20000, maxPrice: 30000, modalPrice: 28000, date: today },
    { commodity: 'Turmeric', variety: 'Whole',          market: 'Guntur APMC',     district: 'Guntur',     minPrice: 12000, maxPrice: 16000, modalPrice: 14000, date: today },
    { commodity: 'Coriander', variety: 'Seeds',         market: 'Guntur APMC',     district: 'Guntur',     minPrice: 7000, maxPrice: 10000, modalPrice: 8500, date: today },
    { commodity: 'Chana Dal', variety: 'Bengal Gram',   market: 'Guntur APMC',     district: 'Guntur',     minPrice: 8000, maxPrice: 10500, modalPrice: 9500, date: today },
    { commodity: 'Moong Dal', variety: 'Green Gram',    market: 'Guntur APMC',     district: 'Guntur',     minPrice: 10000, maxPrice: 13000, modalPrice: 12000, date: today },

    // Warangal APMC
    { commodity: 'Paddy',    variety: 'Sona Masoori',   market: 'Warangal APMC',   district: 'Warangal',   minPrice: 2100, maxPrice: 2300, modalPrice: 2200, date: today },

    // Vijayawada APMC
    { commodity: 'Mango',    variety: 'Banganapalli',   market: 'Vijayawada APMC', district: 'Krishna',    minPrice: 6000, maxPrice: 12000, modalPrice: 9000, date: today },
    { commodity: 'Brinjal',  variety: 'Purple',         market: 'Vijayawada APMC', district: 'Krishna',    minPrice: 1000, maxPrice: 4000, modalPrice: 2500, date: today },
    { commodity: 'Banana',   variety: 'Chakkarakeli',   market: 'Vijayawada APMC', district: 'Krishna',    minPrice: 3000, maxPrice: 5500, modalPrice: 4500, date: today },

    // Hyderabad APMC
    { commodity: 'Toor Dal', variety: 'Regular',        market: 'Hyderabad APMC',  district: 'Hyderabad',  minPrice: 9000, maxPrice: 11000, modalPrice: 10000, date: today },
    { commodity: 'Bitter Gourd', variety: 'Regular',    market: 'Hyderabad APMC',  district: 'Hyderabad',  minPrice: 2000, maxPrice: 5000, modalPrice: 3500, date: today },
    { commodity: 'Coconut',  variety: 'Fresh',          market: 'Hyderabad APMC',  district: 'Hyderabad',  minPrice: 1500, maxPrice: 2200, modalPrice: 1800, date: today },
    { commodity: 'Cashew',   variety: 'W320',           market: 'Hyderabad APMC',  district: 'Hyderabad',  minPrice: 70000, maxPrice: 85000, modalPrice: 78000, date: today },

    // Karimnagar APMC
    { commodity: 'Milk',     variety: 'Cow',            market: 'Karimnagar APMC', district: 'Karimnagar', minPrice: 5500, maxPrice: 7000, modalPrice: 6500, date: today },
    { commodity: 'Guava',    variety: 'Allahabad',      market: 'Karimnagar APMC', district: 'Karimnagar', minPrice: 3000, maxPrice: 5000, modalPrice: 4500, date: today },
    { commodity: 'Papaya',   variety: 'Red Lady',       market: 'Karimnagar APMC', district: 'Karimnagar', minPrice: 2000, maxPrice: 4000, modalPrice: 3500, date: today },

    // Rajahmundry APMC
    { commodity: 'Coconut Oil', variety: 'Cold-Pressed', market: 'Rajahmundry APMC', district: 'Rajahmundry', minPrice: 18000, maxPrice: 24000, modalPrice: 22000, date: today },
    { commodity: 'Rice',     variety: 'Sona Masoori',   market: 'Rajahmundry APMC', district: 'Rajahmundry', minPrice: 4500, maxPrice: 6000, modalPrice: 5500, date: today },
    { commodity: 'Jaggery',  variety: 'Bellam',         market: 'Rajahmundry APMC', district: 'Rajahmundry', minPrice: 4000, maxPrice: 6500, modalPrice: 5500, date: today },

    // Yesterday prices for comparison
    { commodity: 'Tomato',   variety: 'Hybrid',        market: 'Kurnool APMC',    district: 'Kurnool',    minPrice: 1700, maxPrice: 2800, modalPrice: 2300, date: yesterday },
    { commodity: 'Chilli',   variety: 'Teja',           market: 'Guntur APMC',     district: 'Guntur',     minPrice: 14000, maxPrice: 33000, modalPrice: 24000, date: yesterday },
    { commodity: 'Onion',    variety: 'Red',            market: 'Kurnool APMC',    district: 'Kurnool',    minPrice: 1600, maxPrice: 2900, modalPrice: 2300, date: yesterday },
  ];

  for (const mp of mandiPrices) {
    await prisma.govtPrice.create({
      data: { ...mp, unit: 'Quintal', state: 'AP/TS', uploadedBy: admin.id },
    });
  }
  console.log(`✅ ${mandiPrices.length} mandi prices seeded (today + yesterday)`);

  // ── Serviceable Areas ────────────────────────────────────────────────────────
  const areas = [
    { pincode: '500001', district: 'Hyderabad',     flatFee: 60 },
    { pincode: '500002', district: 'Hyderabad',     flatFee: 60 },
    { pincode: '500008', district: 'Hyderabad',     flatFee: 60 },
    { pincode: '500034', district: 'Hyderabad',     flatFee: 60 },
    { pincode: '500072', district: 'Hyderabad',     flatFee: 65 },
    { pincode: '500081', district: 'Hyderabad',     flatFee: 65 },
    { pincode: '506001', district: 'Warangal',      flatFee: 50 },
    { pincode: '506002', district: 'Warangal',      flatFee: 50 },
    { pincode: '518001', district: 'Kurnool',       flatFee: 45 },
    { pincode: '518501', district: 'Kurnool',       flatFee: 45 },
    { pincode: '520001', district: 'Vijayawada',    flatFee: 50 },
    { pincode: '520010', district: 'Vijayawada',    flatFee: 55 },
    { pincode: '522001', district: 'Guntur',        flatFee: 50 },
    { pincode: '522002', district: 'Guntur',        flatFee: 50 },
    { pincode: '530001', district: 'Visakhapatnam', flatFee: 70 },
    { pincode: '530002', district: 'Visakhapatnam', flatFee: 70 },
    { pincode: '533001', district: 'Rajahmundry',   flatFee: 65 },
    { pincode: '505209', district: 'Karimnagar',    flatFee: 55 },
    { pincode: '517501', district: 'Tirupati',      flatFee: 60 },
    { pincode: '524001', district: 'Nellore',       flatFee: 55 },
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

  // ── Demo Bids ────────────────────────────────────────────────────────────────
  const bidProducts = await prisma.product.findMany({
    where: { priceType: { in: ['BID', 'HYBRID'] } },
    take: 4,
  });

  for (const bp of bidProducts) {
    const minBid = bp.minBidPrice || 50;
    // Buyer 1 bid
    await prisma.bid.create({
      data: {
        productId: bp.id,
        buyerId: buyer1.id,
        amount: minBid + Math.floor(Math.random() * 20),
        message: 'I want bulk order. Please give best price.',
        status: 'PENDING',
      },
    });
    // Buyer 2 bid
    await prisma.bid.create({
      data: {
        productId: bp.id,
        buyerId: buyer2.id,
        amount: minBid + Math.floor(Math.random() * 30) + 5,
        message: 'Regular customer, looking for quality produce.',
        status: 'PENDING',
      },
    });
  }

  // Add some accepted/rejected bids for history
  if (bidProducts.length > 0) {
    await prisma.bid.create({
      data: {
        productId: bidProducts[0].id,
        buyerId: buyer3.id,
        amount: (bidProducts[0].minBidPrice || 50) + 40,
        message: 'Need for restaurant. Can pick up directly.',
        status: 'ACCEPTED',
      },
    });
    await prisma.bid.create({
      data: {
        productId: bidProducts[0].id,
        buyerId: buyer4.id,
        amount: (bidProducts[0].minBidPrice || 50) - 10,
        message: 'Can you do lower price?',
        status: 'REJECTED',
      },
    });
    if (bidProducts.length > 1) {
      await prisma.bid.create({
        data: {
          productId: bidProducts[1].id,
          buyerId: buyer3.id,
          amount: (bidProducts[1].minBidPrice || 50) + 15,
          message: 'Weekly order if price is good.',
          status: 'COUNTERED',
          counterAmount: (bidProducts[1].minBidPrice || 50) + 25,
          counterMessage: 'I can do this price for 50kg+ orders.',
        },
      });
    }
  }

  console.log(`✅ ${bidProducts.length * 2 + 3} demo bids seeded (pending, accepted, rejected, countered)`);

  // ── Demo Orders ─────────────────────────────────────────────────────────────
  const orderProducts = await prisma.product.findMany({
    where: { farmerId: farmer1.id, priceType: 'FIXED' },
    take: 3,
    include: { farmer: { include: { farmerProfile: true } } },
  });

  if (orderProducts.length >= 2 && orderProducts[0].farmer.farmerProfile) {
    const fpId = orderProducts[0].farmer.farmerProfile.id;

    // Delivered order
    const order1 = await prisma.order.create({
      data: {
        buyerId: buyer1.id,
        totalAmount: (orderProducts[0].fixedPrice || 0) * 10 + (orderProducts[1].fixedPrice || 0) * 5 + 45,
        paymentMethod: 'COD',
        paymentStatus: 'PAID',
        deliveryAddress: { name: 'Vijay Kumar', phone: '9000000003', line1: '12-3-456, Ameerpet', city: 'Hyderabad', pincode: '500008', state: 'Telangana' },
        status: 'DELIVERED',
      },
    });
    const so1 = await prisma.subOrder.create({
      data: {
        orderId: order1.id,
        farmerProfileId: fpId,
        amount: (orderProducts[0].fixedPrice || 0) * 10 + (orderProducts[1].fixedPrice || 0) * 5,
        status: 'DELIVERED',
        deliveryFee: 45,
      },
    });
    await prisma.subOrderItem.createMany({
      data: [
        { subOrderId: so1.id, productId: orderProducts[0].id, qty: 10, unitPrice: orderProducts[0].fixedPrice || 0 },
        { subOrderId: so1.id, productId: orderProducts[1].id, qty: 5, unitPrice: orderProducts[1].fixedPrice || 0 },
      ],
    });

    // Confirmed order
    const order2 = await prisma.order.create({
      data: {
        buyerId: buyer2.id,
        totalAmount: (orderProducts[0].fixedPrice || 0) * 5 + 50,
        paymentMethod: 'DUMMY_CARD',
        paymentStatus: 'PAID',
        deliveryAddress: { name: 'Priya Singh', phone: '9000000004', line1: '7-8-901, Banjara Hills', city: 'Hyderabad', pincode: '500034', state: 'Telangana' },
        status: 'CONFIRMED',
      },
    });
    const so2 = await prisma.subOrder.create({
      data: {
        orderId: order2.id,
        farmerProfileId: fpId,
        amount: (orderProducts[0].fixedPrice || 0) * 5,
        status: 'CONFIRMED',
        deliveryFee: 50,
      },
    });
    await prisma.subOrderItem.create({
      data: { subOrderId: so2.id, productId: orderProducts[0].id, qty: 5, unitPrice: orderProducts[0].fixedPrice || 0 },
    });

    // Placed order (new)
    const order3 = await prisma.order.create({
      data: {
        buyerId: buyer3.id,
        totalAmount: (orderProducts[1].fixedPrice || 0) * 8 + 60,
        paymentMethod: 'COD',
        paymentStatus: 'PENDING',
        deliveryAddress: { name: 'Rajesh Sharma', phone: '9000000009', line1: '4-5-678, Kukatpally', city: 'Hyderabad', pincode: '500072', state: 'Telangana' },
        status: 'PLACED',
      },
    });
    const so3 = await prisma.subOrder.create({
      data: {
        orderId: order3.id,
        farmerProfileId: fpId,
        amount: (orderProducts[1].fixedPrice || 0) * 8,
        status: 'PLACED',
        deliveryFee: 60,
      },
    });
    await prisma.subOrderItem.create({
      data: { subOrderId: so3.id, productId: orderProducts[1].id, qty: 8, unitPrice: orderProducts[1].fixedPrice || 0 },
    });

    console.log('✅ 3 demo orders seeded (DELIVERED, CONFIRMED, PLACED)');
  }

  // ── Multi-farmer order ──────────────────────────────────────────────────────
  const f3Products = await prisma.product.findMany({
    where: { farmerId: farmer3.id, priceType: 'FIXED' },
    take: 1,
    include: { farmer: { include: { farmerProfile: true } } },
  });

  if (f3Products.length > 0 && f3Products[0].farmer.farmerProfile && orderProducts.length > 0 && orderProducts[0].farmer.farmerProfile) {
    const fp1Id = orderProducts[0].farmer.farmerProfile.id;
    const fp3Id = f3Products[0].farmer.farmerProfile.id;

    const multiOrder = await prisma.order.create({
      data: {
        buyerId: buyer4.id,
        totalAmount: (orderProducts[0].fixedPrice || 0) * 3 + (f3Products[0].fixedPrice || 0) * 2 + 45 + 50,
        paymentMethod: 'COD',
        paymentStatus: 'PENDING',
        deliveryAddress: { name: 'Meena Devi', phone: '9000000010', line1: '10-2-123, Secunderabad', city: 'Hyderabad', pincode: '500001', state: 'Telangana' },
        status: 'PLACED',
      },
    });

    // Sub-order from farmer 1
    const mso1 = await prisma.subOrder.create({
      data: {
        orderId: multiOrder.id, farmerProfileId: fp1Id,
        amount: (orderProducts[0].fixedPrice || 0) * 3, status: 'PLACED', deliveryFee: 45,
      },
    });
    await prisma.subOrderItem.create({
      data: { subOrderId: mso1.id, productId: orderProducts[0].id, qty: 3, unitPrice: orderProducts[0].fixedPrice || 0 },
    });

    // Sub-order from farmer 3
    const mso2 = await prisma.subOrder.create({
      data: {
        orderId: multiOrder.id, farmerProfileId: fp3Id,
        amount: (f3Products[0].fixedPrice || 0) * 2, status: 'PLACED', deliveryFee: 50,
      },
    });
    await prisma.subOrderItem.create({
      data: { subOrderId: mso2.id, productId: f3Products[0].id, qty: 2, unitPrice: f3Products[0].fixedPrice || 0 },
    });

    console.log('✅ 1 multi-farmer order seeded (buyer4 ordering from farmer1 + farmer3)');
  }

  console.log('\n🎉 Seed complete!\n');
  console.log('Demo accounts:');
  console.log('  Admin   : admin@grameen.com    / Admin@123');
  console.log('  Farmer1 : farmer1@grameen.com  / Farmer@123  (Kurnool, Level 1 - vegetables)');
  console.log('  Farmer2 : farmer2@grameen.com  / Farmer@123  (Warangal, Level 0 - pending)');
  console.log('  Farmer3 : farmer3@grameen.com  / Farmer@123  (Guntur, Level 1 - chillies & spices)');
  console.log('  Farmer4 : farmer4@grameen.com  / Farmer@123  (Karimnagar, Level 1 - dairy & fruits)');
  console.log('  Farmer5 : farmer5@grameen.com  / Farmer@123  (Rajahmundry, Level 1 - coconut & grains)');
  console.log('  Farmer6 : farmer6@grameen.com  / Farmer@123  (Kurnool, Level 0 - pending)');
  console.log('  Buyer1  : buyer1@grameen.com   / Buyer@123');
  console.log('  Buyer2  : buyer2@grameen.com   / Buyer@123');
  console.log('  Buyer3  : buyer3@grameen.com   / Buyer@123');
  console.log('  Buyer4  : buyer4@grameen.com   / Buyer@123');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
