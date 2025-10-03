const fs = require('fs');
const path = require('path');

/**
 * Script to help convert your drug data JSON to the correct format
 * Usage: node scripts/convert-data.js input-file.json output-file.json
 */

const inputFile = process.argv[2];
const outputFile = process.argv[3] || 'converted-drug-data.json';

if (!inputFile) {
  console.log('Usage: node scripts/convert-data.js <input-file.json> [output-file.json]');
  console.log('\nThis script helps convert your drug data to the correct format.');
  console.log('It will try to map common field names to the expected format.');
  process.exit(1);
}

try {
  console.log(`Reading data from: ${inputFile}`);
  const rawData = fs.readFileSync(inputFile, 'utf8');
  const data = JSON.parse(rawData);
  
  let drugs = [];
  
  // Handle different JSON structures
  if (Array.isArray(data)) {
    drugs = data;
  } else if (data.drugs && Array.isArray(data.drugs)) {
    drugs = data.drugs;
  } else if (data.data && Array.isArray(data.data)) {
    drugs = data.data;
  } else {
    console.error('Could not find array of drugs in the JSON file');
    process.exit(1);
  }
  
  console.log(`Found ${drugs.length} drug records`);
  
  // Convert to standard format
  const convertedDrugs = drugs.map((drug, index) => {
    // Try different possible field names
    const converted = {
      code: drug.code || drug.drugCode || drug.id || drug.drug_id || `DRUG-${index + 1}`,
      genericName: drug.genericName || drug.generic_name || drug.generic || drug.genericName || '',
      brandName: drug.brandName || drug.brand_name || drug.brand || drug.brandName || '',
      company: drug.company || drug.companyName || drug.manufacturer || drug.manufacturerName || '',
      launchDate: drug.launchDate || drug.launch_date || drug.date || drug.launchDate || new Date().toISOString()
    };
    
    // Log any missing required fields
    if (!converted.genericName || !converted.brandName || !converted.company) {
      console.warn(`Warning: Record ${index + 1} missing required fields:`, {
        original: drug,
        converted: converted
      });
    }
    
    return converted;
  });
  
  // Filter out invalid records
  const validDrugs = convertedDrugs.filter(drug => 
    drug.genericName && drug.brandName && drug.company
  );
  
  console.log(`Converted ${validDrugs.length} valid drug records`);
  
  // Write converted data
  fs.writeFileSync(outputFile, JSON.stringify(validDrugs, null, 2));
  console.log(`Converted data written to: ${outputFile}`);
  
  // Show sample of converted data
  console.log('\nSample of converted data:');
  validDrugs.slice(0, 3).forEach((drug, index) => {
    console.log(`${index + 1}. ${drug.genericName} (${drug.brandName}) - ${drug.company}`);
  });
  
} catch (error) {
  console.error('Error processing file:', error.message);
  process.exit(1);
}
