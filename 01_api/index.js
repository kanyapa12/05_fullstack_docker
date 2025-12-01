// index.js - Backend API สำหรับ Daily Stock Management
const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
require('dotenv').config({ path: '.env.local' });
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Database Configuration - รับจาก Environment Variables
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'final_jenkins',
  charset: 'utf8mb4'
};

console.log('🔧 Database Configuration:');
console.log(`   Host: ${dbConfig.host}`);
console.log(`   User: ${dbConfig.user}`);
console.log(`   Database: ${dbConfig.database}`);

// Create connection pool
const pool = mysql.createPool(dbConfig);

// Test database connection
pool.getConnection()
  .then(connection => {
    console.log('✅ เชื่อมต่อฐานข้อมูลสำเร็จ');
    connection.release();
  })
  .catch(err => {
    console.error('❌ เชื่อมต่อฐานข้อมูลล้มเหลว:', err.message);
  });

// ==================== API Routes ====================

// Root endpoint - API Documentation
app.get('/', (req, res) => {
  res.json({
    message: '🚀 Daily Stock Management API',
    version: '1.0.0',
    status: 'running',
    database: {
      connected: true,
      host: dbConfig.host,
      database: dbConfig.database
    },
    endpoints: {
      health: {
        method: 'GET',
        path: '/health',
        description: 'ตรวจสอบสถานะเซิร์ฟเวอร์'
      },
      getAllStocks: {
        method: 'GET',
        path: '/dailystock',
        description: 'ดึงข้อมูลสต็อกทั้งหมด'
      },
      filterStocks: {
        method: 'GET',
        path: '/dailystock/filter',
        description: 'กรองข้อมูลสต็อก',
        queryParams: '?category=...&location=...&status=...'
      },
      getStockById: {
        method: 'GET',
        path: '/dailystock/:id',
        description: 'ดึงข้อมูลสต็อกตาม ID'
      },
      addStock: {
        method: 'POST',
        path: '/dailystock',
        description: 'เพิ่มข้อมูลสต็อกใหม่'
      },
      updateStock: {
        method: 'PUT',
        path: '/dailystock/:id',
        description: 'แก้ไขข้อมูลสต็อก'
      },
      deleteStock: {
        method: 'DELETE',
        path: '/dailystock/:id',
        description: 'ลบข้อมูลสต็อก'
      },
      getStats: {
        method: 'GET',
        path: '/dailystock/stats/summary',
        description: 'ดึงสถิติสต็อก'
      }
    }
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// 1. GET - ดึงข้อมูลทั้งหมด
app.get('/dailystock', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM DailyStock ORDER BY StockID DESC');
    res.json(rows);
  } catch (error) {
    console.error('Error fetching stocks:', error);
    res.status(500).json({ error: 'เกิดข้อผิดพลาดในการดึงข้อมูล' });
  }
});

// 2. GET - ดึงข้อมูลแบบกรอง (Filter)
app.get('/dailystock/filter', async (req, res) => {
  try {
    const { category, location, status } = req.query;
    let query = 'SELECT * FROM DailyStock WHERE 1=1';
    const params = [];

    if (category) {
      query += ' AND Category = ?';
      params.push(category);
    }

    if (location) {
      query += ' AND Location = ?';
      params.push(location);
    }

    if (status) {
      query += ' AND StockStatus = ?';
      params.push(status);
    }

    query += ' ORDER BY StockID DESC';

    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (error) {
    console.error('Error filtering stocks:', error);
    res.status(500).json({ error: 'เกิดข้อผิดพลาดในการกรองข้อมูล' });
  }
});

// 3. GET - ดึงข้อมูลตาม ID
app.get('/dailystock/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query('SELECT * FROM DailyStock WHERE StockID = ?', [id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'ไม่พบข้อมูล' });
    }
    
    res.json(rows[0]);
  } catch (error) {
    console.error('Error fetching stock:', error);
    res.status(500).json({ error: 'เกิดข้อผิดพลาดในการดึงข้อมูล' });
  }
});

// 4. POST - เพิ่มข้อมูลใหม่
app.post('/dailystock', async (req, res) => {
  try {
    const { StockID, Category, StockStatus, Location, ItemName, Unit, StockDate, Quantity } = req.body;

    // ตรวจสอบว่า StockID ซ้ำหรือไม่
    const [existing] = await pool.query('SELECT StockID FROM DailyStock WHERE StockID = ?', [StockID]);
    if (existing.length > 0) {
      return res.status(400).json({ error: 'รหัสสต็อกนี้มีอยู่แล้ว' });
    }

    // Validate required fields
    if (!StockID || !Category || !Location || !ItemName || !StockDate || !Quantity) {
      return res.status(400).json({ error: 'กรุณากรอกข้อมูลให้ครบถ้วน' });
    }

    const query = `
      INSERT INTO DailyStock (StockID, Category, StockStatus, Location, ItemName, Unit, StockDate, Quantity)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const [result] = await pool.query(query, [
      StockID,
      Category,
      StockStatus || 'ปกติ',
      Location,
      ItemName,
      Unit || 'กิโลกรัม',
      StockDate,
      Quantity
    ]);

    res.status(201).json({
      message: 'เพิ่มข้อมูลสำเร็จ',
      stockId: result.insertId,
      data: req.body
    });
  } catch (error) {
    console.error('Error adding stock:', error);
    res.status(500).json({ error: 'เกิดข้อผิดพลาดในการเพิ่มข้อมูล' });
  }
});

// 5. PUT - แก้ไขข้อมูล
app.put('/dailystock/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { Category, StockStatus, Location, ItemName, Unit, StockDate, Quantity } = req.body;

    // ตรวจสอบว่ามีข้อมูลอยู่หรือไม่
    const [existing] = await pool.query('SELECT StockID FROM DailyStock WHERE StockID = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ error: 'ไม่พบข้อมูลที่ต้องการแก้ไข' });
    }

    // Validate required fields
    if (!Category || !Location || !ItemName || !StockDate || !Quantity) {
      return res.status(400).json({ error: 'กรุณากรอกข้อมูลให้ครบถ้วน' });
    }

    const query = `
      UPDATE DailyStock 
      SET Category = ?, StockStatus = ?, Location = ?, ItemName = ?, 
          Unit = ?, StockDate = ?, Quantity = ?
      WHERE StockID = ?
    `;

    await pool.query(query, [
      Category,
      StockStatus || 'ปกติ',
      Location,
      ItemName,
      Unit || 'กิโลกรัม',
      StockDate,
      Quantity,
      id
    ]);

    res.json({
      message: 'แก้ไขข้อมูลสำเร็จ',
      stockId: id,
      data: req.body
    });
  } catch (error) {
    console.error('Error updating stock:', error);
    res.status(500).json({ error: 'เกิดข้อผิดพลาดในการแก้ไขข้อมูล' });
  }
});

// 6. DELETE - ลบข้อมูล
app.delete('/dailystock/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // ตรวจสอบว่ามีข้อมูลอยู่หรือไม่
    const [existing] = await pool.query('SELECT StockID FROM DailyStock WHERE StockID = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ error: 'ไม่พบข้อมูลที่ต้องการลบ' });
    }

    await pool.query('DELETE FROM DailyStock WHERE StockID = ?', [id]);

    res.json({
      message: 'ลบข้อมูลสำเร็จ',
      stockId: id
    });
  } catch (error) {
    console.error('Error deleting stock:', error);
    res.status(500).json({ error: 'เกิดข้อผิดพลาดในการลบข้อมูล' });
  }
});

// 7. GET - สถิติ
app.get('/dailystock/stats/summary', async (req, res) => {
  try {
    const [stats] = await pool.query(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN StockStatus = 'ปกติ' THEN 1 ELSE 0 END) as normal,
        SUM(CASE WHEN StockStatus = 'เหลือน้อย' THEN 1 ELSE 0 END) as low,
        SUM(CASE WHEN StockStatus = 'สั่งด่วน' THEN 1 ELSE 0 END) as urgent,
        SUM(CASE WHEN StockStatus = 'ไม่ใช้งาน' THEN 1 ELSE 0 END) as inactive
      FROM DailyStock
    `);

    res.json(stats[0]);
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'เกิดข้อผิดพลาดในการดึงสถิติ' });
  }
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ error: 'API endpoint not found' });
});

// Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์' });
});

// Start server
const PORT = process.env.PORT || 3001;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
  console.log(`📊 API Endpoints:`);
  console.log(`   GET    /dailystock              - ดึงข้อมูลทั้งหมด`);
  console.log(`   GET    /dailystock/filter       - กรองข้อมูล`);
  console.log(`   GET    /dailystock/:id          - ดึงข้อมูลตาม ID`);
  console.log(`   POST   /dailystock              - เพิ่มข้อมูล`);
  console.log(`   PUT    /dailystock/:id          - แก้ไขข้อมูล`);
  console.log(`   DELETE /dailystock/:id          - ลบข้อมูล`);
  console.log(`   GET    /dailystock/stats/summary - สถิติ`);
});