const axios = require('axios');
const config = require('../config');

const CACHE_TTL_MS = 60 * 1000;
let cache = { rows: null, fetchedAt: 0 };

async function getRows({ force = false } = {}) {
  const isFresh = Date.now() - cache.fetchedAt < CACHE_TTL_MS;
  if (!force && isFresh && cache.rows) return cache.rows;

  const { data } = await axios.post(
    config.appsScript.url,
    { secret: config.appsScript.secret, action: 'list_rows' },
    { timeout: 30000 }
  );

  if (!data.success) throw new Error(`Apps Script list_rows failed: ${data.message}`);

  cache = { rows: data.rows, fetchedAt: Date.now() };
  return cache.rows;
}

module.exports = { getRows };
