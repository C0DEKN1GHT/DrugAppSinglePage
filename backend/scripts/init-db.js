const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, '..', 'drugs.db');
const db = new sqlite3.Database(dbPath);

// Path to your drug data JSON file
const drugDataPath = path.join(__dirname, '..', 'drugData.json');

// Sample drug data (fallback if JSON file doesn't exist)
const sampleDrugs = [
  {
    code: "0006-0568",
    genericName: "vorinostat",
    brandName: "ZOLINZA",
    company: "Merck Sharp & Dohme Corp.",
    launchDate: "2004-02-14T23:01:10Z"
  },
  {
    code: "0006-1234",
    genericName: "imatinib",
    brandName: "GLEEVEC",
    company: "Novartis Pharmaceuticals Corporation",
    launchDate: "2001-05-10T00:00:00Z"
  },
  {
    code: "0006-5678",
    genericName: "trastuzumab",
    brandName: "HERCEPTIN",
    company: "Genentech, Inc.",
    launchDate: "1998-09-25T00:00:00Z"
  }
];

let drugsToInsert = [];

// Try to read from JSON file first
try {
  if (fs.existsSync(drugDataPath)) {
    console.log('Reading drug data from JSON file...');
    const jsonData = fs.readFileSync(drugDataPath, 'utf8');
    const drugData = JSON.parse(jsonData);
    
    // Handle different JSON structures
    if (Array.isArray(drugData)) {
      drugsToInsert = drugData;
    } else if (drugData.drugs && Array.isArray(drugData.drugs)) {
      drugsToInsert = drugData.drugs;
    } else if (drugData.data && Array.isArray(drugData.data)) {
      drugsToInsert = drugData.data;
    } else {
      console.log('JSON structure not recognized, using sample data');
      drugsToInsert = sampleDrugs;
    }
    
    console.log(`Found ${drugsToInsert.length} drug records in JSON file`);
  } else {
    console.log('No drugData.json file found, using sample data');
    console.log('To use your own data, place your JSON file at:', drugDataPath);
    drugsToInsert = sampleDrugs;
  }
} catch (error) {
  console.error('Error reading JSON file:', error.message);
  console.log('Using sample data instead');
  drugsToInsert = sampleDrugs;
}

// Validate and normalize drug data
const validatedDrugs = drugsToInsert.map((drug, index) => {
  // Handle different field names
  const normalizedDrug = {
    code: drug.code || drug.drugCode || drug.id || `DRUG-${index + 1}`,
    genericName: drug.genericName || drug.generic_name || drug.generic || '',
    brandName: drug.brandName || drug.brand_name || drug.brand || '',
    company: drug.company || drug.companyName || drug.manufacturer || '',
    launchDate: drug.launchDate || drug.launch_date || drug.date || new Date().toISOString()
  };
  
  // Ensure required fields are present
  if (!normalizedDrug.genericName || !normalizedDrug.brandName || !normalizedDrug.company) {
    console.warn(`Warning: Drug at index ${index} is missing required fields:`, normalizedDrug);
  }
  
  return normalizedDrug;
}).filter(drug => drug.genericName && drug.brandName && drug.company);

console.log(`Validated ${validatedDrugs.length} drug records`);

db.serialize(() => {
  // Create table
  db.run(`CREATE TABLE IF NOT EXISTS drugs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT NOT NULL,
    genericName TEXT NOT NULL,
    brandName TEXT NOT NULL,
    company TEXT NOT NULL,
    launchDate TEXT NOT NULL
  )`);

  // Clear existing data
  db.run('DELETE FROM drugs');

  // Insert drug data
  const stmt = db.prepare(`INSERT INTO drugs (code, genericName, brandName, company, launchDate) 
                          VALUES (?, ?, ?, ?, ?)`);
  
  validatedDrugs.forEach(drug => {
    stmt.run(drug.code, drug.genericName, drug.brandName, drug.company, drug.launchDate);
  });
  
  stmt.finalize();

  // Verify data insertion
  db.all('SELECT COUNT(*) as count FROM drugs', (err, row) => {
    if (err) {
      console.error('Error counting records:', err);
    } else {
      console.log(`Successfully inserted ${row[0].count} drug records`);
    }
  });

  // Show sample of inserted data
  db.all('SELECT * FROM drugs LIMIT 3', (err, rows) => {
    if (err) {
      console.error('Error fetching sample records:', err);
    } else {
      console.log('\nSample of inserted data:');
      rows.forEach(row => {
        console.log(`- ${row.genericName} (${row.brandName}) - ${row.company}`);
      });
    }
  });
});

db.close((err) => {
  if (err) {
    console.error('Error closing database:', err);
  } else {
    console.log('\nDatabase initialization completed successfully');
    console.log('\nTo add your own drug data:');
    console.log('1. Place your JSON file at: backend/drugData.json');
    console.log('2. Re-run: npm run init-db');
    console.log('\nSupported JSON formats:');
    console.log('- Array of drug objects: [{"code": "...", "genericName": "...", ...}]');
    console.log('- Object with drugs array: {"drugs": [{"code": "...", ...}]}');
    console.log('- Object with data array: {"data": [{"code": "...", ...}]}');
  }
});