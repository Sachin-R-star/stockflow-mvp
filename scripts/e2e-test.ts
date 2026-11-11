import { prisma } from "../src/lib/prisma";
import { hashPassword, verifyPassword, signToken, verifyToken } from "../src/lib/auth";

async function runE2ETests() {
  console.log("=========================================");
  console.log("   StockFlow MVP - End-to-End Test Suite  ");
  console.log("=========================================\n");

  let passed = 0;
  let total = 0;

  function assert(condition: boolean, testName: string) {
    total++;
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName}`);
      throw new Error(`Assertion failed: ${testName}`);
    }
  }

  try {
    // 1. Password Hashing and Verification
    console.log("--- 1. Testing Auth & Security ---");
    const testPassword = "Password123!";
    const hash = await hashPassword(testPassword);
    assert(hash !== testPassword, "Password hashing produces salt/hash");
    assert(await verifyPassword(testPassword, hash), "Password verification succeeds with correct password");
    assert(!(await verifyPassword("WrongPassword", hash)), "Password verification fails with incorrect password");

    // 2. JWT Generation & Tenant Scoping
    const testSessionPayload = {
      userId: "test-user-id-01",
      email: "owner@northwind.com",
      organizationId: "org-northwind-01",
      organizationName: "Northwind Traders",
      role: "OWNER",
    };
    const token = signToken(testSessionPayload);
    const decoded = verifyToken(token);
    assert(decoded !== null, "JWT verifies successfully");
    assert(decoded?.organizationId === "org-northwind-01", "JWT retains organization context");

    // 3. Database: Organization & User Creation (Signup flow)
    console.log("\n--- 2. Testing Tenant Signup & Scoping ---");
    const testOrgName = "Apex Supply Co " + Date.now();
    const testEmail = `admin-${Date.now()}@apexsupply.com`;

    const newOrg = await prisma.organization.create({
      data: {
        name: testOrgName,
        defaultLowStockThreshold: 5,
      },
    });
    assert(!!newOrg.id, "Organization created in database");
    assert(newOrg.defaultLowStockThreshold === 5, "Organization default threshold is 5");

    const newUser = await prisma.user.create({
      data: {
        email: testEmail,
        passwordHash: hash,
        organizationId: newOrg.id,
        role: "OWNER",
      },
    });
    assert(newUser.organizationId === newOrg.id, "User linked to organization");

    // 4. Database: Product CRUD Operations
    console.log("\n--- 3. Testing Product CRUD & Stock Logic ---");
    const productA = await prisma.product.create({
      data: {
        organizationId: newOrg.id,
        name: "Mechanical Keyboard RGB",
        sku: "KB-RGB-001",
        description: "Hot-swappable tactile switches",
        quantity: 12,
        costPrice: 45.0,
        sellingPrice: 89.99,
        lowStockThreshold: 10,
        lastUpdatedBy: testEmail,
      },
    });
    assert(productA.sku === "KB-RGB-001", "Product A created with SKU KB-RGB-001");
    assert(productA.quantity === 12, "Product A initial quantity is 12");

    // Create Low Stock Product
    const productB = await prisma.product.create({
      data: {
        organizationId: newOrg.id,
        name: "USB-C Fast Cable",
        sku: "CAB-USBC-001",
        quantity: 3, // quantity <= threshold (5) -> Low Stock!
        costPrice: 3.5,
        sellingPrice: 12.0,
        lowStockThreshold: null, // should fall back to org default (5)
        lastUpdatedBy: testEmail,
      },
    });
    assert(productB.quantity === 3, "Product B created with 3 units");

    // Test SKU Uniqueness per Org
    let duplicateFailed = false;
    try {
      await prisma.product.create({
        data: {
          organizationId: newOrg.id,
          name: "Duplicate SKU Item",
          sku: "KB-RGB-001", // Duplicate!
          quantity: 1,
        },
      });
    } catch {
      duplicateFailed = true;
    }
    assert(duplicateFailed, "SKU uniqueness constraint per organization is strictly enforced");

    // Test Stock Adjustment (+5 units)
    const adjustedProduct = await prisma.product.update({
      where: { id: productB.id },
      data: {
        quantity: { increment: 5 },
        lastUpdatedBy: testEmail + " (Restocked)",
      },
    });
    assert(adjustedProduct.quantity === 8, "Stock adjustment increments quantity from 3 to 8");

    // 5. Dashboard Calculations
    console.log("\n--- 4. Testing Dashboard & Low Stock Calculation ---");
    const allOrgProducts = await prisma.product.findMany({
      where: { organizationId: newOrg.id },
    });
    const totalCount = allOrgProducts.length;
    const totalUnits = allOrgProducts.reduce((sum, p) => sum + p.quantity, 0);
    assert(totalCount === 2, "Dashboard total products count is 2");
    assert(totalUnits === 20, "Dashboard total units count is 20 (12 + 8)");

    // 6. Cross-Tenant Data Isolation Test
    console.log("\n--- 5. Testing Multi-Tenant Data Isolation ---");
    const tenant2Org = await prisma.organization.create({
      data: { name: "Tenant 2 Independent Store", defaultLowStockThreshold: 3 },
    });
    const tenant2Products = await prisma.product.findMany({
      where: { organizationId: tenant2Org.id },
    });
    assert(tenant2Products.length === 0, "Tenant 2 sees 0 products from Tenant 1 (strict boundary)");

    // Same SKU allowed across DIFFERENT organizations
    const tenant2ProductSameSku = await prisma.product.create({
      data: {
        organizationId: tenant2Org.id,
        name: "Tenant 2 Item with Same SKU",
        sku: "KB-RGB-001", // same SKU as Org 1
        quantity: 50,
      },
    });
    assert(
      tenant2ProductSameSku.sku === "KB-RGB-001",
      "Same SKU is permitted across different organizations (scoped uniqueness)"
    );

    // Clean up test data
    await prisma.organization.delete({ where: { id: newOrg.id } });
    await prisma.organization.delete({ where: { id: tenant2Org.id } });
    console.log("\n--- Test cleanup completed ---");

    console.log("\n=========================================");
    console.log(` All tests passed! (${passed}/${total})`);
    console.log("=========================================\n");
  } catch (error) {
    console.error("Test execution failed:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runE2ETests();
