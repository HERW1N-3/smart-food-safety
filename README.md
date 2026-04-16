# Explainable Smart Food Safety & Traceability System

This application tracks food products from farm to retail, ensuring safety through environmental monitoring and AI-powered explainable alerts.

## 🚀 Features

- **Full Traceability**: Track products through Farm → Batch → Transport → Storage → Retail.
- **Real-time Monitoring**: Detects unsafe conditions (e.g., Temperature > 10°C).
- **AI Explainable Alerts**: Uses Gemini AI to explain *why* a product is unsafe in simple, human-friendly terms.
- **SQL Analytics**: Implements complex queries including JOINs, Subqueries, and Aggregates.

## 🛠 Tech Stack

- **Frontend**: React (Vite, Tailwind CSS, motion)
- **Backend**: Node.js, Express, SQLite (SQL-compliant)
- **AI**: Google Gemini API (@google/genai)
- **Database**: SQLite (Implemented logic maps to PostgreSQL requirements)

## 🗄 Database Schema

The system uses a relational schema with 7 tables:
1. `Farm`: Origin location and pesticide usage.
2. `Batch`: Harvest grouping.
3. `Transport`: Transit conditions (temp, humidity).
4. `Storage`: Warehouse conditions.
5. `Product`: Individual units for sale.
6. `Retail`: Pricing and store data.
7. `Alert`: Safety notifications.

## 🚦 API Endpoints

- `GET /api/products`: List all products with their farm origin and alert counts.
- `GET /api/product/:id`: Get detailed traceability data for a specific product.
- `GET /api/alerts`: List all active safety alerts.
- `GET /api/check/:id`: Perform a safety check and receive a logic-based status.
- `POST /api/transport`: Log new transit data.

## 📦 Run Instructions

1. **Install Dependencies**:
   ```bash
   npm install
   ```
2. **Setup Environment**:
   Ensure `GEMINI_API_KEY` is set in your environment.
3. **Start Development Server**:
   ```bash
   npm run dev
   ```
4. **Access the App**:
   Open `http://localhost:3000` in your browser.

## 🧠 Explainable Alerts (Bonus)

The "Check Safety" feature combines traditional rule-based logic (Temperature Thresholds) with LLM reasoning. When a threshold is breached, the raw data is sent to Gemini to generate a narrative explanation that helps consumers understand the specific risk associated with the environmental breach.

---
*Created for the Food Safety & Traceability System project.*
