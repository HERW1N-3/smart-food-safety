import Database from 'better-sqlite3';

const db = new Database('food_safety.db');

// Initialize schema
db.exec(`
  CREATE TABLE IF NOT EXISTS Farm (
    farm_id INTEGER PRIMARY KEY AUTOINCREMENT,
    location TEXT NOT NULL,
    pesticide_used TEXT
  );

  CREATE TABLE IF NOT EXISTS Batch (
    batch_id INTEGER PRIMARY KEY AUTOINCREMENT,
    farm_id INTEGER REFERENCES Farm(farm_id),
    harvest_date TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS Transport (
    transport_id INTEGER PRIMARY KEY AUTOINCREMENT,
    batch_id INTEGER REFERENCES Batch(batch_id),
    temperature REAL CHECK (temperature >= 0 AND temperature <= 25),
    humidity REAL,
    duration INTEGER
  );

  CREATE TABLE IF NOT EXISTS Storage (
    storage_id INTEGER PRIMARY KEY AUTOINCREMENT,
    batch_id INTEGER REFERENCES Batch(batch_id),
    temperature REAL,
    humidity REAL,
    duration INTEGER
  );

  CREATE TABLE IF NOT EXISTS Product (
    product_id INTEGER PRIMARY KEY AUTOINCREMENT,
    batch_id INTEGER REFERENCES Batch(batch_id),
    expiry_date TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS Retail (
    retail_id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER REFERENCES Product(product_id),
    price REAL
  );

  CREATE TABLE IF NOT EXISTS Alert (
    alert_id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER REFERENCES Product(product_id),
    reason TEXT,
    severity TEXT
  );
`);

// Seed data function
export function seed() {
  const farmCount = db.prepare('SELECT COUNT(*) as count FROM Farm').get() as { count: number };
  
  if (farmCount.count === 0) {
    // 1. Insert 3 Distinct Farms
    const insertFarm = db.prepare('INSERT INTO Farm (location, pesticide_used) VALUES (?, ?)');
    insertFarm.run('High Ridge Organic Farm', 'None - Certified Organic');
    insertFarm.run('Ocean Breeze Orchard', 'Minimal - Integrated Pest Mgmt');
    insertFarm.run('Sunny Valley Grove', 'Standard - EU Compliant');

    // 2. Insert 3 Batches (one per farm)
    const insertBatch = db.prepare('INSERT INTO Batch (farm_id, harvest_date) VALUES (?, ?)');
    insertBatch.run(1, '2024-04-01'); // Batch 1
    insertBatch.run(2, '2024-04-02'); // Batch 2
    insertBatch.run(3, '2024-04-03'); // Batch 3

    // 3. Insert 3 Products (one per batch)
    const insertProduct = db.prepare('INSERT INTO Product (batch_id, expiry_date) VALUES (?, ?)');
    insertProduct.run(1, '2024-05-01'); // Product 1 (Safe)
    insertProduct.run(2, '2024-05-02'); // Product 2 (UNSAFE)
    insertProduct.run(3, '2024-05-03'); // Product 3 (Safe)

    // 4. Insert Environmental Data (Transport & Storage)
    const insertTransport = db.prepare('INSERT INTO Transport (batch_id, temperature, humidity, duration) VALUES (?, ?, ?, ?)');
    const insertStorage = db.prepare('INSERT INTO Storage (batch_id, temperature, humidity, duration) VALUES (?, ?, ?, ?)');

    // Chain 1: Optimal Conditions
    insertTransport.run(1, 4.5, 65, 120); 
    insertStorage.run(1, 3.8, 60, 48);

    // Chain 2: TEMPERATURE BREACH (Unsafe)
    // Temperature limit is 10°C in our business logic
    insertTransport.run(2, 14.8, 70, 150); 
    insertStorage.run(2, 4.2, 55, 36);

    // Chain 3: Optimal Conditions
    insertTransport.run(3, 5.2, 62, 90);
    insertStorage.run(3, 4.0, 58, 60);

    // 5. Insert Retail Pricing Data
    const insertRetail = db.prepare('INSERT INTO Retail (product_id, price) VALUES (?, ?)');
    insertRetail.run(1, 6.50);
    insertRetail.run(2, 4.25);
    insertRetail.run(3, 5.99);

    // 6. Insert Critical Alert for the Unsafe Product (Product 2)
    const insertAlert = db.prepare('INSERT INTO Alert (product_id, reason, severity) VALUES (?, ?, ?)');
    insertAlert.run(2, 'Critical: Temperature exceeded 10°C during transport (Logged: 14.8°C). Potential microbial growth risk.', 'High');
  }
}

export default db;
