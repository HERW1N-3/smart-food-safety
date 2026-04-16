-- Explainable Smart Food Safety & Traceability System Schema
-- Using PostgreSQL (Handled via SQLite in this demo)

CREATE TABLE Farm (
    farm_id INTEGER PRIMARY KEY AUTOINCREMENT,
    location VARCHAR(100),
    pesticide_used VARCHAR(100)
);

CREATE TABLE Batch (
    batch_id INTEGER PRIMARY KEY AUTOINCREMENT,
    farm_id INTEGER REFERENCES Farm(farm_id),
    harvest_date DATE
);

CREATE TABLE Transport (
    transport_id INTEGER PRIMARY KEY AUTOINCREMENT,
    batch_id INTEGER REFERENCES Batch(batch_id),
    temperature FLOAT CHECK (temperature BETWEEN 0 AND 15),
    humidity FLOAT,
    duration INT
);

CREATE TABLE Storage (
    storage_id INTEGER PRIMARY KEY AUTOINCREMENT,
    batch_id INTEGER REFERENCES Batch(batch_id),
    temperature FLOAT,
    humidity FLOAT,
    duration INT
);

CREATE TABLE Product (
    product_id INTEGER PRIMARY KEY AUTOINCREMENT,
    batch_id INTEGER REFERENCES Batch(batch_id),
    expiry_date DATE
);

CREATE TABLE Retail (
    retail_id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER REFERENCES Product(product_id),
    price FLOAT
);

CREATE TABLE Alert (
    alert_id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER REFERENCES Product(product_id),
    reason VARCHAR(255),
    severity VARCHAR(20)
);

-- Sample Data Seeding
INSERT INTO Farm (location, pesticide_used) VALUES ('Green Valley Farm', 'Organic');
INSERT INTO Farm (location, pesticide_used) VALUES ('Sunshine Plains', 'Minimal');

INSERT INTO Batch (farm_id, harvest_date) VALUES (1, '2024-03-10');
INSERT INTO Batch (farm_id, harvest_date) VALUES (2, '2024-03-12');

INSERT INTO Product (batch_id, expiry_date) VALUES (1, '2024-04-10');
INSERT INTO Product (batch_id, expiry_date) VALUES (1, '2024-04-12');
INSERT INTO Product (batch_id, expiry_date) VALUES (2, '2024-04-15');

INSERT INTO Transport (batch_id, temperature, humidity, duration) VALUES (1, 15.5, 65, 120);
INSERT INTO Transport (batch_id, temperature, humidity, duration) VALUES (2, 8.2, 60, 90);

INSERT INTO Storage (batch_id, temperature, humidity, duration) VALUES (1, 4.0, 55, 48);
INSERT INTO Storage (batch_id, temperature, humidity, duration) VALUES (2, 5.0, 50, 72);

INSERT INTO Retail (product_id, price) VALUES (1, 4.99);
INSERT INTO Retail (product_id, price) VALUES (2, 5.49);
INSERT INTO Retail (product_id, price) VALUES (3, 3.99);

INSERT INTO Alert (product_id, reason, severity) VALUES (1, 'High temperature during transport', 'High');
