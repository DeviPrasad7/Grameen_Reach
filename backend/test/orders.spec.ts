/**
 * Unit tests for order splitting logic (multi-farmer cart → SubOrders).
 * These tests use pure functions extracted from OrdersService logic –
 * no DB or NestJS container needed.
 */

interface MockProduct {
  id: string;
  farmerId: string;
  farmerProfileId: string;
  fixedPrice: number | null;
  minBidPrice: number | null;
  title: string;
  pincode: string;
}

interface MockCartItem {
  productId: string;
  qty: number;
  product: MockProduct;
}

/** Replicates the grouping logic from OrdersService.createFromCart */
function groupCartByFarmer(items: MockCartItem[]) {
  const groups = new Map<string, { farmerProfileId: string; items: MockCartItem[] }>();
  for (const item of items) {
    const { farmerId, farmerProfileId } = item.product;
    if (!groups.has(farmerId)) {
      groups.set(farmerId, { farmerProfileId, items: [] });
    }
    groups.get(farmerId)!.items.push(item);
  }
  return groups;
}

/** Replicates total amount calculation */
function calcSubOrderAmount(items: MockCartItem[]) {
  return items.reduce((sum, item) => {
    const price = item.product.fixedPrice ?? item.product.minBidPrice ?? 0;
    return sum + price * item.qty;
  }, 0);
}

function calcTotalAmount(groups: ReturnType<typeof groupCartByFarmer>) {
  let total = 0;
  for (const { items } of groups.values()) {
    total += calcSubOrderAmount(items);
  }
  return total;
}

// ── Fixtures ────────────────────────────────────────────────────────────────

const FARMER_A_ID = 'farmer-a';
const FARMER_B_ID = 'farmer-b';
const FP_A_ID = 'fp-a';
const FP_B_ID = 'fp-b';

const productA1: MockProduct = { id: 'prod-a1', farmerId: FARMER_A_ID, farmerProfileId: FP_A_ID, fixedPrice: 30, minBidPrice: null, title: 'Tomatoes', pincode: '518001' };
const productA2: MockProduct = { id: 'prod-a2', farmerId: FARMER_A_ID, farmerProfileId: FP_A_ID, fixedPrice: 60, minBidPrice: null, title: 'Chillies', pincode: '518001' };
const productB1: MockProduct = { id: 'prod-b1', farmerId: FARMER_B_ID, farmerProfileId: FP_B_ID, fixedPrice: 110, minBidPrice: null, title: 'Dal', pincode: '506001' };

const cartItems: MockCartItem[] = [
  { productId: productA1.id, qty: 5, product: productA1 },
  { productId: productA2.id, qty: 2, product: productA2 },
  { productId: productB1.id, qty: 3, product: productB1 },
];

// ── Tests ────────────────────────────────────────────────────────────────────

describe('Order Splitting Logic', () => {
  describe('groupCartByFarmer', () => {
    it('creates one group per distinct farmer', () => {
      const groups = groupCartByFarmer(cartItems);
      expect(groups.size).toBe(2);
      expect(groups.has(FARMER_A_ID)).toBe(true);
      expect(groups.has(FARMER_B_ID)).toBe(true);
    });

    it('assigns correct farmerProfileId to each group', () => {
      const groups = groupCartByFarmer(cartItems);
      expect(groups.get(FARMER_A_ID)!.farmerProfileId).toBe(FP_A_ID);
      expect(groups.get(FARMER_B_ID)!.farmerProfileId).toBe(FP_B_ID);
    });

    it('places items in the correct farmer bucket', () => {
      const groups = groupCartByFarmer(cartItems);
      expect(groups.get(FARMER_A_ID)!.items).toHaveLength(2);
      expect(groups.get(FARMER_B_ID)!.items).toHaveLength(1);
    });

    it('returns empty map for empty cart', () => {
      expect(groupCartByFarmer([]).size).toBe(0);
    });

    it('handles single farmer with multiple items', () => {
      const single: MockCartItem[] = [
        { productId: productA1.id, qty: 3, product: productA1 },
        { productId: productA2.id, qty: 4, product: productA2 },
      ];
      const groups = groupCartByFarmer(single);
      expect(groups.size).toBe(1);
      expect(groups.get(FARMER_A_ID)!.items).toHaveLength(2);
    });
  });

  describe('calcSubOrderAmount', () => {
    it('correctly totals farmer-A sub-order', () => {
      const groups = groupCartByFarmer(cartItems);
      const aAmount = calcSubOrderAmount(groups.get(FARMER_A_ID)!.items);
      // 5*30 + 2*60 = 150 + 120 = 270
      expect(aAmount).toBe(270);
    });

    it('correctly totals farmer-B sub-order', () => {
      const groups = groupCartByFarmer(cartItems);
      const bAmount = calcSubOrderAmount(groups.get(FARMER_B_ID)!.items);
      // 3*110 = 330
      expect(bAmount).toBe(330);
    });

    it('falls back to minBidPrice when fixedPrice is null', () => {
      const bidProduct: MockProduct = { id: 'bid-prod', farmerId: 'f', farmerProfileId: 'fp', fixedPrice: null, minBidPrice: 50, title: 'Mangoes', pincode: '518001' };
      const items: MockCartItem[] = [{ productId: bidProduct.id, qty: 4, product: bidProduct }];
      expect(calcSubOrderAmount(items)).toBe(200);
    });

    it('returns 0 when both prices are null', () => {
      const noPrice: MockProduct = { id: 'np', farmerId: 'f', farmerProfileId: 'fp', fixedPrice: null, minBidPrice: null, title: 'X', pincode: '000' };
      expect(calcSubOrderAmount([{ productId: noPrice.id, qty: 1, product: noPrice }])).toBe(0);
    });
  });

  describe('calcTotalAmount', () => {
    it('sums all sub-order amounts into parent order total', () => {
      const groups = groupCartByFarmer(cartItems);
      const total = calcTotalAmount(groups);
      // 270 (farmer-A) + 330 (farmer-B) = 600
      expect(total).toBe(600);
    });

    it('equals sum of individual sub-order amounts', () => {
      const groups = groupCartByFarmer(cartItems);
      let expected = 0;
      for (const { items } of groups.values()) {
        expected += calcSubOrderAmount(items);
      }
      expect(calcTotalAmount(groups)).toBe(expected);
    });
  });
});
