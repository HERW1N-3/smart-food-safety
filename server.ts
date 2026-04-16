import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import db, { seed } from './db.js';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Initialize and seed database
  seed();

  app.use(express.json());

  // API Routes

  // 1. GET /products -> list all products (Aggregate query: get count of alerts per product)
  app.get('/api/products', (req, res) => {
    try {
      const query = `
        SELECT p.*, r.price, b.harvest_date, f.location as farm_location,
               (SELECT COUNT(*) FROM Alert a WHERE a.product_id = p.product_id) as alert_count
        FROM Product p
        LEFT JOIN Retail r ON p.product_id = r.product_id
        JOIN Batch b ON p.batch_id = b.batch_id
        JOIN Farm f ON b.farm_id = f.farm_id
      `;
      const products = db.prepare(query).all();
      res.json(products);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch products' });
    }
  });

  // 2. GET /product/:id -> product details with farm origin (JOIN query)
  app.get('/api/product/:id', (req, res) => {
    try {
      const query = `
        SELECT p.*, b.harvest_date, f.location as farm_location, f.pesticide_used,
               t.temperature as transport_temp, t.humidity as transport_humidity,
               s.temperature as storage_temp, s.humidity as storage_humidity
        FROM Product p
        JOIN Batch b ON p.batch_id = b.batch_id
        JOIN Farm f ON b.farm_id = f.farm_id
        LEFT JOIN Transport t ON p.batch_id = t.batch_id
        LEFT JOIN Storage s ON p.batch_id = s.batch_id
        WHERE p.product_id = ?
      `;
      const product = db.prepare(query).get(req.params.id);
      if (!product) return res.status(404).json({ error: 'Product not found' });
      res.json(product);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch product details' });
    }
  });

  // 3. POST /transport -> insert transport data
  app.post('/api/transport', (req, res) => {
    const { batch_id, temperature, humidity, duration } = req.body;
    try {
      const info = db.prepare('INSERT INTO Transport (batch_id, temperature, humidity, duration) VALUES (?, ?, ?, ?)').run(batch_id, temperature, humidity, duration);
      
      // Auto-trigger alert if temp > 10
      if (temperature > 10) {
        const products = db.prepare('SELECT product_id FROM Product WHERE batch_id = ?').all(batch_id) as { product_id: number }[];
        const insertAlert = db.prepare('INSERT INTO Alert (product_id, reason, severity) VALUES (?, ?, ?)');
        products.forEach(p => {
          insertAlert.run(p.product_id, 'High temperature during transport', 'High');
        });
      }
      
      res.json({ success: true, id: info.lastInsertRowid });
    } catch (error) {
      res.status(500).json({ error: 'Failed to insert transport data' });
    }
  });

  // 4. GET /alerts -> list alerts (Subquery: alerts for products from a specific batch or with specific conditions)
  app.get('/api/alerts', (req, res) => {
    try {
      const query = `
        SELECT a.*, p.expiry_date
        FROM Alert a
        JOIN Product p ON a.product_id = p.product_id
        WHERE a.product_id IN (SELECT product_id FROM Product)
      `;
      const alerts = db.prepare(query).all();
      res.json(alerts);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch alerts' });
    }
  });

  // 5. GET /check/:id -> return SAFE or UNSAFE with explanation
  app.get('/api/check/:id', (req, res) => {
    try {
      const query = `
        SELECT p.product_id, t.temperature as transport_temp, s.temperature as storage_temp
        FROM Product p
        LEFT JOIN Transport t ON p.batch_id = t.batch_id
        LEFT JOIN Storage s ON p.batch_id = s.batch_id
        WHERE p.product_id = ?
      `;
      const data = db.prepare(query).get(req.params.id) as any;
      if (!data) return res.status(404).json({ error: 'Product not found' });

      let status = 'SAFE';
      let reason = 'All conditions within safety limits.';
      
      if (data.transport_temp > 10) {
        status = 'UNSAFE';
        reason = `High temperature (${data.transport_temp}°C) detected during transport. Recommended limit is 10°C.`;
      } else if (data.storage_temp > 10) {
        status = 'UNSAFE';
        reason = `High temperature (${data.storage_temp}°C) detected during storage.`;
      }

      res.json({ product_id: data.product_id, status, reason });
    } catch (error) {
      res.status(500).json({ error: 'Safety check failed' });
    }
  });

  // 6. GET /api/stats -> system statistics (Aggregate query)
  app.get('/api/stats', (req, res) => {
    try {
      const stats = db.prepare(`
        SELECT 
          COUNT(DISTINCT farm_id) as farm_count,
          COUNT(DISTINCT batch_id) as batch_count,
          (SELECT COUNT(*) FROM Product) as product_count,
          (SELECT COUNT(*) FROM Alert) as alert_count
        FROM Batch
      `).get();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch stats' });
    }
  });

  // Vite middleware setup
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
