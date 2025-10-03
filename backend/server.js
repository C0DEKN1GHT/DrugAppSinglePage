const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(bodyParser.json());

const dbPath = path.join(__dirname, 'drugs.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS drugs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT NOT NULL,
    genericName TEXT NOT NULL,
    brandName TEXT NOT NULL,
    company TEXT NOT NULL,
    launchDate TEXT NOT NULL
  )`);
});

app.get('/api/table-config', (req, res) => {
  const tableConfig = {
    columns: [
      {
        id: 'id',
        label: 'Id',
        sortable: false,
        width: 80
      },
      {
        id: 'code',
        label: 'Code',
        sortable: true,
        width: 120
      },
      {
        id: 'name',
        label: 'Name',
        sortable: true,
        width: 250
      },
      {
        id: 'company',
        label: 'Company',
        sortable: true,
        width: 200
      },
      {
        id: 'launchDate',
        label: 'Launch Date',
        sortable: true,
        width: 150
      }
    ],
    settings: {
      pageSize: 10,
      maxPageSize: 100,
      sortBy: 'launchDate',
      sortOrder: 'desc',
      pagination: true
    }
  };
  
  res.json(tableConfig);
});

app.get('/api/companies', (req, res) => {
  db.all('SELECT DISTINCT company FROM drugs ORDER BY company', (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    const companies = rows.map(row => row.company);
    res.json(companies);
  });
});

app.get('/api/drugs', (req, res) => {
  const { company, page = 1, limit = 50 } = req.query;
  
  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
  const offset = (pageNum - 1) * limitNum;
  
  let countQuery = 'SELECT COUNT(*) as total FROM drugs';
  let countParams = [];
  
  if (company) {
    countQuery += ' WHERE company = ?';
    countParams.push(company);
  }
  
  let query = `
    SELECT 
      id,
      code,
      genericName,
      brandName,
      company,
      launchDate
    FROM drugs
  `;
  
  const params = [];
  
  if (company) {
    query += ' WHERE company = ?';
    params.push(company);
  }
  
  query += ' ORDER BY launchDate DESC LIMIT ? OFFSET ?';
  params.push(limitNum, offset);
  
  db.get(countQuery, countParams, (err, countResult) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    const totalRecords = countResult.total;
    const totalPages = Math.ceil(totalRecords / limitNum);
    
    db.all(query, params, (err, rows) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      
      const formattedData = rows.map(row => ({
        id: row.id,
        code: row.code,
        name: `${row.genericName} (${row.brandName})`,
        company: row.company,
        launchDate: row.launchDate
      }));
      
      res.json({
        data: formattedData,
        pagination: {
          currentPage: pageNum,
          totalPages: totalPages,
          totalRecords: totalRecords,
          limit: limitNum,
          hasNextPage: pageNum < totalPages,
          hasPrevPage: pageNum > 1
        }
      });
    });
  });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

process.on('SIGINT', () => {
  db.close((err) => {
    if (err) {
      console.error(err.message);
    }
    console.log('Database connection closed.');
    process.exit(0);
  });
});


