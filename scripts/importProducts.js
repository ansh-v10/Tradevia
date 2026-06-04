import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { productsData } from '../src/util/productsData.js';

dotenv.config({ path: './.env' });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Missing Supabase env variables. Ensure .env contains VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function importProducts() {
  console.log(`Importing ${productsData.length} products to Supabase...`);
  let inserted = 0;
  for (const p of productsData) {
    const record = {
      name: p.name,
      category: p.category,
      price: p.wholesalePrice ?? p.retailPrice ?? null,
      moq: p.moq ?? 1,
      unit: p.packSize ?? null,
      description: `${p.brand ?? ''} | retail: ${p.retailPrice ?? ''} | rating: ${p.rating ?? ''}`,
      image_url: p.imageUrl ?? p.imageUrl ?? null
    };

    const { data, error } = await supabase
      .from('products')
      .insert(record)
      .select();

    if (error) {
      console.error('Insert error for', p.name, error.message || error);
    } else {
      inserted += 1;
    }
  }
  console.log(`Finished. Inserted ${inserted} / ${productsData.length} products.`);
}

importProducts().then(() => process.exit(0)).catch(err => { console.error(err); process.exit(1); });
