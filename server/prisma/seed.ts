import { faker } from "@faker-js/faker";
import bcrypt from "bcrypt";
import { PrismaClient } from "../src/generated/prisma/client";
import { VAT_RATE } from "../src/config/constants";

const prisma = new PrismaClient();

faker.seed(42);

const ORDER_STATUSES = ["DRAFT", "PENDING", "CONFIRMED", "SHIPPED", "COMPLETED", "CANCELLED"] as const;

const PRODUCT_CATALOG: { name: string; category: string; description: string }[] = [
  { name: "Wireless Optical Mouse", category: "Electronics", description: "Ergonomic wireless mouse with adjustable DPI, USB receiver included." },
  { name: "27-inch LED Monitor", category: "Electronics", description: "Full HD 27-inch monitor with HDMI and DisplayPort inputs." },
  { name: "USB-C Docking Station", category: "Electronics", description: "8-in-1 docking station supporting dual monitors, USB 3.0 and Ethernet." },
  { name: "Bluetooth Keyboard", category: "Electronics", description: "Slim wireless keyboard with rechargeable battery, compatible with Windows and macOS." },
  { name: "Noise-Cancelling Headphones", category: "Electronics", description: "Over-ear headphones with active noise cancellation, 30-hour battery life." },
  { name: "A4 Paper Ream (500 sheets)", category: "Office Supplies", description: "80gsm multipurpose copy paper, suitable for laser and inkjet printers." },
  { name: "Heavy-Duty Stapler", category: "Office Supplies", description: "Full-strip stapler with 20-sheet capacity, includes staples." },
  { name: "Permanent Marker Set", category: "Office Supplies", description: "Set of 12 permanent markers, assorted colors, fine tip." },
  { name: "Sticky Notes Pack", category: "Office Supplies", description: "12-pack of 3x3 inch sticky notes in assorted colors." },
  { name: "Ballpoint Pen Box (50 units)", category: "Office Supplies", description: "Box of 50 medium-point ballpoint pens, black ink." },
  { name: "Ergonomic Office Chair", category: "Furniture", description: "Mesh-back office chair with adjustable lumbar support and armrests." },
  { name: "Adjustable Standing Desk", category: "Furniture", description: "Electric height-adjustable desk, 120x60cm work surface." },
  { name: "4-Drawer Filing Cabinet", category: "Furniture", description: "Lockable steel filing cabinet, letter and legal size compatible." },
  { name: "Conference Table (8-Seat)", category: "Furniture", description: "Rectangular conference table with cable management, seats up to 8." },
  { name: "5-Tier Bookshelf", category: "Furniture", description: "Freestanding bookshelf with 5 adjustable shelves, steel frame." },
  { name: "Corrugated Shipping Box (Medium)", category: "Packaging", description: "Double-wall corrugated box, 40x30x30cm, pack of 25." },
  { name: "Bubble Wrap Roll", category: "Packaging", description: "Perforated bubble wrap roll, 50cm x 100m, for fragile item protection." },
  { name: "Packing Tape Dispenser Set", category: "Packaging", description: "Handheld tape dispenser with 6 rolls of clear packing tape." },
  { name: "Cordless Drill Driver", category: "Tools", description: "18V cordless drill with two batteries and carrying case." },
  { name: "Tool Box Set (65-Piece)", category: "Tools", description: "General-purpose tool set with sockets, wrenches, and screwdrivers." },
];

function round2(value: number) {
  return Math.round(value * 100) / 100;
}

async function clearDatabase() {
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.product.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.user.deleteMany();
  await prisma.apiLog.deleteMany();
}

async function seedDemoUser() {
  const passwordHash = await bcrypt.hash("Demo1234!", 10);
  const user = await prisma.user.create({
    data: {
      email: "demo@erp-platform.com",
      password: passwordHash,
      name: "Demo Admin",
      role: "ADMIN",
    },
  });
  console.log(`Created demo user: ${user.email} (password: Demo1234!)`);
  return user;
}

async function seedCustomers(count: number) {
  const customers = [];
  for (let i = 1; i <= count; i++) {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const customer = await prisma.customer.create({
      data: {
        customerNumber: `CUST-${String(i).padStart(4, "0")}`,
        firstName,
        lastName,
        email: faker.internet.email({ firstName, lastName }).toLowerCase(),
        phone: faker.phone.number({ style: "international" }),
        address: faker.location.streetAddress(),
        city: faker.location.city(),
      },
    });
    customers.push(customer);
  }
  console.log(`Created ${customers.length} customers`);
  return customers;
}

async function seedProducts() {
  const products = [];
  for (let i = 0; i < PRODUCT_CATALOG.length; i++) {
    const catalogItem = PRODUCT_CATALOG[i];
    const isOutOfStock = i < 2;
    const isLowStock = i >= 2 && i < 6;
    const minimumStock = faker.number.int({ min: 5, max: 20 });
    const stockQuantity = isOutOfStock
      ? 0
      : isLowStock
        ? faker.number.int({ min: 1, max: minimumStock })
        : faker.number.int({ min: minimumStock + 5, max: minimumStock + 200 });

    const product = await prisma.product.create({
      data: {
        sku: `PRD-${String(i + 1).padStart(4, "0")}`,
        name: catalogItem.name,
        description: catalogItem.description,
        category: catalogItem.category,
        price: round2(faker.number.float({ min: 5, max: 1200, fractionDigits: 2 })),
        stockQuantity,
        minimumStock,
      },
    });
    products.push(product);
  }
  console.log(`Created ${products.length} products (2 out of stock, 4 low stock)`);
  return products;
}

async function seedOrders(
  count: number,
  customers: { id: string }[],
  products: { id: string; price: unknown }[],
) {
  const orders = [];
  for (let i = 1; i <= count; i++) {
    const customer = faker.helpers.arrayElement(customers);
    const status = ORDER_STATUSES[i % ORDER_STATUSES.length];
    const itemCount = faker.number.int({ min: 1, max: 4 });
    const chosenProducts = faker.helpers.arrayElements(products, itemCount);

    const items = chosenProducts.map((product) => {
      const unitPrice = Number(product.price);
      const quantity = faker.number.int({ min: 1, max: 5 });
      return {
        productId: product.id,
        quantity,
        unitPrice,
        subtotal: round2(unitPrice * quantity),
      };
    });

    const subtotal = round2(items.reduce((sum, item) => sum + item.subtotal, 0));
    const vatAmount = round2(subtotal * VAT_RATE);
    const total = round2(subtotal + vatAmount);

    const createdAt = faker.date.recent({ days: 60 });

    const order = await prisma.order.create({
      data: {
        orderNumber: `SO-2026-${String(i).padStart(4, "0")}`,
        customerId: customer.id,
        status,
        subtotal,
        vatAmount,
        total,
        createdAt,
        updatedAt: createdAt,
        items: {
          create: items,
        },
      },
    });
    orders.push(order);
  }
  console.log(`Created ${orders.length} orders across all statuses`);
  return orders;
}

async function main() {
  console.log("Clearing existing data...");
  await clearDatabase();

  await seedDemoUser();
  const customers = await seedCustomers(10);
  const products = await seedProducts();
  await seedOrders(15, customers, products);

  console.log("Seed completed successfully.");
}

main()
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
