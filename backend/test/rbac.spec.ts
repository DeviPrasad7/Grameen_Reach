/**
 * Unit tests for RBAC (Role-Based Access Control) logic.
 * Tests the guard/decorator behaviour using plain functions
 * without spinning up a full NestJS container.
 */

enum Role { BUYER = 'BUYER', FARMER = 'FARMER', ADMIN = 'ADMIN' }
enum VerificationLevel { LEVEL_0 = 'LEVEL_0', LEVEL_1 = 'LEVEL_1' }

interface JwtPayload {
  sub: string;
  email: string;
  role: Role;
}

interface FarmerProfile {
  verificationLevel: VerificationLevel;
}

/** Mimics the RolesGuard check */
function canActivate(userRole: Role, requiredRoles: Role[]): boolean {
  if (requiredRoles.length === 0) return true;
  return requiredRoles.includes(userRole);
}

/** Mimics the farmer-level-1 product-creation guard */
function canCreateProduct(user: JwtPayload, profile: FarmerProfile | null): boolean {
  if (user.role !== Role.FARMER) return false;
  if (!profile) return false;
  return profile.verificationLevel === VerificationLevel.LEVEL_1;
}

/** Mimics admin-only endpoint check */
function isAdmin(user: JwtPayload): boolean {
  return user.role === Role.ADMIN;
}

/** Mimics farmer accessing their own suborder */
function canAccessSubOrder(userProfileId: string, subOrderProfileId: string): boolean {
  return userProfileId === subOrderProfileId;
}

// ── Fixtures ────────────────────────────────────────────────────────────────

const adminPayload: JwtPayload  = { sub: 'a1', email: 'admin@g.com',   role: Role.ADMIN };
const farmerPayload: JwtPayload = { sub: 'f1', email: 'farmer@g.com',  role: Role.FARMER };
const buyerPayload: JwtPayload  = { sub: 'b1', email: 'buyer@g.com',   role: Role.BUYER };

const level1Profile: FarmerProfile = { verificationLevel: VerificationLevel.LEVEL_1 };
const level0Profile: FarmerProfile = { verificationLevel: VerificationLevel.LEVEL_0 };

// ── Tests ────────────────────────────────────────────────────────────────────

describe('RBAC – Role Guard', () => {
  it('allows ADMIN to access admin-only endpoint', () => {
    expect(canActivate(Role.ADMIN, [Role.ADMIN])).toBe(true);
  });

  it('blocks FARMER from admin-only endpoint', () => {
    expect(canActivate(Role.FARMER, [Role.ADMIN])).toBe(false);
  });

  it('blocks BUYER from admin-only endpoint', () => {
    expect(canActivate(Role.BUYER, [Role.ADMIN])).toBe(false);
  });

  it('allows FARMER to access farmer endpoints', () => {
    expect(canActivate(Role.FARMER, [Role.FARMER])).toBe(true);
  });

  it('blocks BUYER from farmer-only endpoints', () => {
    expect(canActivate(Role.BUYER, [Role.FARMER])).toBe(false);
  });

  it('allows any role when no roles required (public endpoint)', () => {
    expect(canActivate(Role.BUYER, [])).toBe(true);
    expect(canActivate(Role.FARMER, [])).toBe(true);
    expect(canActivate(Role.ADMIN, [])).toBe(true);
  });

  it('allows ADMIN or FARMER when both are allowed', () => {
    expect(canActivate(Role.ADMIN,  [Role.ADMIN, Role.FARMER])).toBe(true);
    expect(canActivate(Role.FARMER, [Role.ADMIN, Role.FARMER])).toBe(true);
    expect(canActivate(Role.BUYER,  [Role.ADMIN, Role.FARMER])).toBe(false);
  });
});

describe('RBAC – Farmer Verification Level', () => {
  it('Level 1 farmer can create product', () => {
    expect(canCreateProduct(farmerPayload, level1Profile)).toBe(true);
  });

  it('Level 0 farmer cannot create product', () => {
    expect(canCreateProduct(farmerPayload, level0Profile)).toBe(false);
  });

  it('Farmer with no profile cannot create product', () => {
    expect(canCreateProduct(farmerPayload, null)).toBe(false);
  });

  it('BUYER cannot create product even with a fake Level 1 profile', () => {
    expect(canCreateProduct(buyerPayload, level1Profile)).toBe(false);
  });

  it('ADMIN cannot create product through farmer gate', () => {
    expect(canCreateProduct(adminPayload, level1Profile)).toBe(false);
  });
});

describe('RBAC – isAdmin helper', () => {
  it('identifies admin user', () => {
    expect(isAdmin(adminPayload)).toBe(true);
  });

  it('rejects farmer as non-admin', () => {
    expect(isAdmin(farmerPayload)).toBe(false);
  });

  it('rejects buyer as non-admin', () => {
    expect(isAdmin(buyerPayload)).toBe(false);
  });
});

describe('RBAC – SubOrder access', () => {
  it('farmer can access their own sub-order', () => {
    expect(canAccessSubOrder('fp-a', 'fp-a')).toBe(true);
  });

  it('farmer cannot access another farmer\'s sub-order', () => {
    expect(canAccessSubOrder('fp-a', 'fp-b')).toBe(false);
  });
});
