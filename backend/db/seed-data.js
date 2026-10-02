// Test data for local development.
// Pharmacy names, addresses and phone numbers are made up; prices are
// illustrative only. Replace with real data when pharmacies come on board.

export const pharmacies = [
  { name: 'Umurava Pharmacy',             address: 'KN 4 Ave, City Centre',    sector: 'Nyarugenge', district: 'Nyarugenge', phone: '+250 788 000 001', latitude: -1.9441, longitude: 30.0619, opens_at: null,    closes_at: null,    is_24h: true,  source_system: 'pos_api' },
  { name: 'Ubuzima Pharmacy',             address: 'KG 7 Ave, Kacyiru',        sector: 'Kacyiru',    district: 'Gasabo',     phone: '+250 788 000 002', latitude: -1.9365, longitude: 30.0900, opens_at: '07:30', closes_at: '22:00', is_24h: false, source_system: 'pos_api' },
  { name: 'Kimironko Community Pharmacy', address: 'KG 11 Ave, Kimironko',     sector: 'Kimironko',  district: 'Gasabo',     phone: '+250 788 000 003', latitude: -1.9495, longitude: 30.1263, opens_at: '08:00', closes_at: '21:00', is_24h: false, source_system: 'csv_export' },
  { name: 'Amahoro Pharmacy',             address: 'KG 17 Ave, Remera',        sector: 'Remera',     district: 'Gasabo',     phone: '+250 788 000 004', latitude: -1.9578, longitude: 30.1127, opens_at: null,    closes_at: null,    is_24h: true,  source_system: 'pos_api' },
  { name: 'Umucyo Pharmacy',              address: 'KN 2 Ave, Nyamirambo',     sector: 'Nyamirambo', district: 'Nyarugenge', phone: '+250 788 000 005', latitude: -1.9790, longitude: 30.0440, opens_at: '08:00', closes_at: '20:30', is_24h: false, source_system: 'spreadsheet' },
  { name: 'Icyizere Pharmacy',            address: 'KK 15 Rd, Kicukiro',       sector: 'Kicukiro',   district: 'Kicukiro',   phone: '+250 788 000 006', latitude: -1.9907, longitude: 30.1030, opens_at: '07:00', closes_at: '22:00', is_24h: false, source_system: 'csv_export' },
  { name: 'Urumuri Pharmacy',             address: 'KK 31 Ave, Gikondo',       sector: 'Gikondo',    district: 'Kicukiro',   phone: '+250 788 000 007', latitude: -1.9750, longitude: 30.0750, opens_at: '08:00', closes_at: '20:00', is_24h: false, source_system: 'spreadsheet' },
  { name: 'Ineza Pharmacy',               address: 'KG 9 Ave, Nyarutarama',    sector: 'Remera',     district: 'Gasabo',     phone: '+250 788 000 008', latitude: -1.9350, longitude: 30.1060, opens_at: '08:00', closes_at: '22:00', is_24h: false, source_system: 'pos_api' },
  { name: 'Agaciro Pharmacy',             address: 'KG 28 Ave, Kimihurura',    sector: 'Kimihurura', district: 'Gasabo',     phone: '+250 788 000 009', latitude: -1.9530, longitude: 30.0850, opens_at: '07:30', closes_at: '21:30', is_24h: false, source_system: 'csv_export' },
  { name: 'Gisozi Family Pharmacy',       address: 'KG 14 Ave, Gisozi',        sector: 'Gisozi',     district: 'Gasabo',     phone: '+250 788 000 010', latitude: -1.9210, longitude: 30.0600, opens_at: '08:00', closes_at: '20:00', is_24h: false, source_system: 'manual' },
  { name: 'Indatwa Pharmacy',             address: 'KG 19 Ave, Kibagabaga',    sector: 'Kimironko',  district: 'Gasabo',     phone: '+250 788 000 011', latitude: -1.9300, longitude: 30.1200, opens_at: '08:00', closes_at: '21:00', is_24h: false, source_system: 'spreadsheet' },
  { name: 'Kanombe Care Pharmacy',        address: 'KK 106 St, Kanombe',       sector: 'Kanombe',    district: 'Kicukiro',   phone: '+250 788 000 012', latitude: -1.9680, longitude: 30.1500, opens_at: '18:00', closes_at: '02:00', is_24h: false, source_system: 'manual' },
];

// base_price is a typical price in RWF for one pack; the seeder varies it per pharmacy.
export const medicines = [
  // Pain & Fever
  { name: 'Paracetamol 500mg Tablets',  generic_name: 'Paracetamol',  brand_name: 'Panadol',  category: 'Pain & Fever', dosage_form: 'Tablet',  strength: '500 mg', pack_size: 'Strip of 10', rx: false, base_price: 500,  description: 'Relieves mild to moderate pain and reduces fever.' },
  { name: 'Ibuprofen 400mg Tablets',    generic_name: 'Ibuprofen',    brand_name: 'Brufen',   category: 'Pain & Fever', dosage_form: 'Tablet',  strength: '400 mg', pack_size: 'Strip of 10', rx: false, base_price: 800,  description: 'Anti-inflammatory pain reliever for pain, fever and swelling.' },
  { name: 'Diclofenac 50mg Tablets',    generic_name: 'Diclofenac',   brand_name: 'Voltaren', category: 'Pain & Fever', dosage_form: 'Tablet',  strength: '50 mg',  pack_size: 'Strip of 10', rx: false, base_price: 1000, description: 'Anti-inflammatory used for joint and muscle pain.' },
  { name: 'Aspirin 75mg Tablets',       generic_name: 'Acetylsalicylic acid', brand_name: 'Aspirin', category: 'Pain & Fever', dosage_form: 'Tablet', strength: '75 mg', pack_size: 'Pack of 28', rx: false, base_price: 1200, description: 'Low-dose aspirin.' },
  { name: 'Tramadol 50mg Capsules',     generic_name: 'Tramadol',     brand_name: null,       category: 'Pain & Fever', dosage_form: 'Capsule', strength: '50 mg',  pack_size: 'Strip of 10', rx: true,  base_price: 2500, description: 'Prescription pain reliever for moderate to severe pain.' },

  // Antibiotics
  { name: 'Amoxicillin 500mg Capsules',              generic_name: 'Amoxicillin',                 brand_name: 'Amoxil',     category: 'Antibiotics', dosage_form: 'Capsule', strength: '500 mg',     pack_size: 'Pack of 20',  rx: true, base_price: 1500, description: 'Broad-spectrum penicillin antibiotic.' },
  { name: 'Amoxicillin + Clavulanic Acid 625mg Tablets', generic_name: 'Amoxicillin + Clavulanic acid', brand_name: 'Augmentin', category: 'Antibiotics', dosage_form: 'Tablet', strength: '500 mg / 125 mg', pack_size: 'Pack of 14', rx: true, base_price: 6500, description: 'Combination antibiotic for resistant bacterial infections.' },
  { name: 'Azithromycin 500mg Tablets',              generic_name: 'Azithromycin',                brand_name: 'Zithromax',  category: 'Antibiotics', dosage_form: 'Tablet',  strength: '500 mg',     pack_size: 'Pack of 3',   rx: true, base_price: 4000, description: 'Macrolide antibiotic, usually a three-day course.' },
  { name: 'Ciprofloxacin 500mg Tablets',             generic_name: 'Ciprofloxacin',               brand_name: 'Cipro',      category: 'Antibiotics', dosage_form: 'Tablet',  strength: '500 mg',     pack_size: 'Strip of 10', rx: true, base_price: 2000, description: 'Fluoroquinolone antibiotic.' },
  { name: 'Metronidazole 500mg Tablets',             generic_name: 'Metronidazole',               brand_name: 'Flagyl',     category: 'Antibiotics', dosage_form: 'Tablet',  strength: '500 mg',     pack_size: 'Strip of 10', rx: true, base_price: 1000, description: 'Antibiotic and antiprotozoal.' },
  { name: 'Doxycycline 100mg Capsules',              generic_name: 'Doxycycline',                 brand_name: null,         category: 'Antibiotics', dosage_form: 'Capsule', strength: '100 mg',     pack_size: 'Strip of 10', rx: true, base_price: 1500, description: 'Tetracycline antibiotic.' },
  { name: 'Cotrimoxazole 480mg Tablets',             generic_name: 'Sulfamethoxazole + Trimethoprim', brand_name: 'Bactrim', category: 'Antibiotics', dosage_form: 'Tablet',  strength: '400 mg / 80 mg', pack_size: 'Strip of 10', rx: true, base_price: 800, description: 'Combination antibiotic.' },

  // Malaria
  { name: 'Artemether + Lumefantrine 20/120mg Tablets', generic_name: 'Artemether + Lumefantrine', brand_name: 'Coartem', category: 'Malaria', dosage_form: 'Tablet', strength: '20 mg / 120 mg', pack_size: 'Pack of 24', rx: true, base_price: 2500, description: 'Artemisinin-based combination therapy for malaria.' },

  // Diabetes
  { name: 'Metformin 500mg Tablets',    generic_name: 'Metformin',     brand_name: 'Glucophage', category: 'Diabetes', dosage_form: 'Tablet', strength: '500 mg', pack_size: 'Pack of 30', rx: true, base_price: 1500, description: 'First-line medicine for type 2 diabetes.' },
  { name: 'Glibenclamide 5mg Tablets',  generic_name: 'Glibenclamide', brand_name: 'Daonil',     category: 'Diabetes', dosage_form: 'Tablet', strength: '5 mg',   pack_size: 'Pack of 30', rx: true, base_price: 1000, description: 'Sulfonylurea for type 2 diabetes.' },

  // Heart & Blood Pressure
  { name: 'Amlodipine 5mg Tablets',           generic_name: 'Amlodipine',          brand_name: 'Norvasc',  category: 'Heart & Blood Pressure', dosage_form: 'Tablet', strength: '5 mg',  pack_size: 'Pack of 30', rx: true, base_price: 1500, description: 'Calcium-channel blocker for high blood pressure.' },
  { name: 'Atenolol 50mg Tablets',            generic_name: 'Atenolol',            brand_name: 'Tenormin', category: 'Heart & Blood Pressure', dosage_form: 'Tablet', strength: '50 mg', pack_size: 'Pack of 28', rx: true, base_price: 1200, description: 'Beta-blocker for high blood pressure.' },
  { name: 'Losartan 50mg Tablets',            generic_name: 'Losartan',            brand_name: 'Cozaar',   category: 'Heart & Blood Pressure', dosage_form: 'Tablet', strength: '50 mg', pack_size: 'Pack of 30', rx: true, base_price: 2500, description: 'Angiotensin receptor blocker for high blood pressure.' },
  { name: 'Hydrochlorothiazide 25mg Tablets', generic_name: 'Hydrochlorothiazide', brand_name: null,       category: 'Heart & Blood Pressure', dosage_form: 'Tablet', strength: '25 mg', pack_size: 'Pack of 30', rx: true, base_price: 800,  description: 'Diuretic for high blood pressure.' },
  { name: 'Atorvastatin 20mg Tablets',        generic_name: 'Atorvastatin',        brand_name: 'Lipitor',  category: 'Heart & Blood Pressure', dosage_form: 'Tablet', strength: '20 mg', pack_size: 'Pack of 30', rx: true, base_price: 3500, description: 'Statin for lowering cholesterol.' },

  // Digestive Health
  { name: 'Omeprazole 20mg Capsules',        generic_name: 'Omeprazole',  brand_name: 'Losec',   category: 'Digestive Health', dosage_form: 'Capsule',    strength: '20 mg',  pack_size: 'Pack of 14',   rx: false, base_price: 1500, description: 'Reduces stomach acid; used for heartburn and ulcers.' },
  { name: 'Oral Rehydration Salts (ORS)',    generic_name: 'Oral rehydration salts', brand_name: null, category: 'Digestive Health', dosage_form: 'Powder sachet', strength: '20.5 g', pack_size: '1 sachet', rx: false, base_price: 300, description: 'Replaces fluids and salts lost through diarrhoea.' },
  { name: 'Loperamide 2mg Capsules',         generic_name: 'Loperamide',  brand_name: 'Imodium', category: 'Digestive Health', dosage_form: 'Capsule',    strength: '2 mg',   pack_size: 'Strip of 10',  rx: false, base_price: 1000, description: 'Relieves acute diarrhoea.' },
  { name: 'Antacid Suspension 200ml',        generic_name: 'Aluminium hydroxide + Magnesium hydroxide', brand_name: 'Maalox', category: 'Digestive Health', dosage_form: 'Suspension', strength: null, pack_size: '200 ml bottle', rx: false, base_price: 2500, description: 'Neutralises stomach acid for quick heartburn relief.' },
  { name: 'Albendazole 400mg Tablets',       generic_name: 'Albendazole', brand_name: 'Zentel',  category: 'Digestive Health', dosage_form: 'Tablet',     strength: '400 mg', pack_size: '1 tablet',     rx: false, base_price: 500,  description: 'Deworming tablet.' },

  // Respiratory & Allergy
  { name: 'Salbutamol Inhaler 100mcg',  generic_name: 'Salbutamol',   brand_name: 'Ventolin',   category: 'Respiratory & Allergy', dosage_form: 'Inhaler', strength: '100 mcg/dose', pack_size: '200 doses',     rx: true,  base_price: 4500, description: 'Reliever inhaler for asthma.' },
  { name: 'Cetirizine 10mg Tablets',    generic_name: 'Cetirizine',   brand_name: 'Zyrtec',     category: 'Respiratory & Allergy', dosage_form: 'Tablet',  strength: '10 mg',        pack_size: 'Strip of 10',   rx: false, base_price: 800,  description: 'Antihistamine for allergies and hay fever.' },
  { name: 'Loratadine 10mg Tablets',    generic_name: 'Loratadine',   brand_name: 'Claritin',   category: 'Respiratory & Allergy', dosage_form: 'Tablet',  strength: '10 mg',        pack_size: 'Strip of 10',   rx: false, base_price: 1000, description: 'Non-drowsy antihistamine.' },
  { name: 'Ambroxol Syrup 100ml',       generic_name: 'Ambroxol',     brand_name: 'Mucosolvan', category: 'Respiratory & Allergy', dosage_form: 'Syrup',   strength: '15 mg / 5 ml', pack_size: '100 ml bottle', rx: false, base_price: 3000, description: 'Loosens mucus in chesty coughs.' },
  { name: 'Prednisolone 5mg Tablets',   generic_name: 'Prednisolone', brand_name: null,         category: 'Respiratory & Allergy', dosage_form: 'Tablet',  strength: '5 mg',         pack_size: 'Pack of 30',    rx: true,  base_price: 1000, description: 'Corticosteroid for inflammation and allergic conditions.' },

  // Vitamins & Supplements
  { name: 'Vitamin C 500mg Tablets',       generic_name: 'Ascorbic acid',   brand_name: null, category: 'Vitamins & Supplements', dosage_form: 'Tablet', strength: '500 mg', pack_size: 'Pack of 30', rx: false, base_price: 1500, description: 'Vitamin C supplement.' },
  { name: 'Folic Acid 5mg Tablets',        generic_name: 'Folic acid',      brand_name: null, category: 'Vitamins & Supplements', dosage_form: 'Tablet', strength: '5 mg',   pack_size: 'Pack of 30', rx: false, base_price: 500,  description: 'Folate supplement, commonly taken in pregnancy.' },
  { name: 'Ferrous Sulfate 200mg Tablets', generic_name: 'Ferrous sulfate', brand_name: null, category: 'Vitamins & Supplements', dosage_form: 'Tablet', strength: '200 mg', pack_size: 'Pack of 30', rx: false, base_price: 800,  description: 'Iron supplement.' },
  { name: 'Multivitamin Tablets',          generic_name: 'Multivitamin',    brand_name: null, category: 'Vitamins & Supplements', dosage_form: 'Tablet', strength: null,     pack_size: 'Pack of 30', rx: false, base_price: 3000, description: 'Daily multivitamin and mineral supplement.' },
  { name: 'Zinc Sulfate 20mg Tablets',     generic_name: 'Zinc sulfate',    brand_name: null, category: 'Vitamins & Supplements', dosage_form: 'Tablet', strength: '20 mg',  pack_size: 'Strip of 10', rx: false, base_price: 600, description: 'Zinc supplement.' },

  // Skin Care
  { name: 'Clotrimazole 1% Cream 20g',      generic_name: 'Clotrimazole',    brand_name: 'Canesten', category: 'Skin Care', dosage_form: 'Cream',    strength: '1%',  pack_size: '20 g tube',     rx: false, base_price: 2000, description: 'Antifungal cream.' },
  { name: 'Hydrocortisone 1% Cream 15g',    generic_name: 'Hydrocortisone',  brand_name: null,       category: 'Skin Care', dosage_form: 'Cream',    strength: '1%',  pack_size: '15 g tube',     rx: false, base_price: 2500, description: 'Mild steroid cream for itching and rashes.' },
  { name: 'Povidone-Iodine 10% Solution 100ml', generic_name: 'Povidone-iodine', brand_name: 'Betadine', category: 'Skin Care', dosage_form: 'Solution', strength: '10%', pack_size: '100 ml bottle', rx: false, base_price: 2500, description: 'Antiseptic for cleaning cuts and wounds.' },
];
