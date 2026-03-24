const db = require('../db/pool');
const { createHttpError } = require('../utils/httpError');
const { ALLOWED_CATEGORIES } = require('../utils/validation');

const mapProductRow = (row) => ({
  id: row.id,
  name: row.name,
  price: Number(row.price),
  description: row.description,
  image: row.image,
  category: row.category,
  isActive: row.is_active,
  stockQuantity: row.stock_quantity,
  dailyLimit: row.daily_limit,
  serviceConfig: row.service_config || {},
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const listProducts = async (category, { includeInactive = false } = {}) => {
  const filters = [];
  const values = [];

  if (category) {
    if (!ALLOWED_CATEGORIES.has(category)) {
      throw createHttpError(400, 'Category filter must be Food or Services.');
    }

    values.push(category);
    filters.push(`category = $${values.length}`);
  }

  if (!includeInactive) {
    filters.push('is_active = TRUE');
  }

  const whereClause = filters.length ? `WHERE ${filters.join(' AND ')}` : '';
  const { rows } = await db.query(
    `
      SELECT
        id,
        name,
        price,
        description,
        image,
        category,
        is_active,
        stock_quantity,
        daily_limit,
        service_config,
        created_at,
        updated_at
      FROM products
      ${whereClause}
      ORDER BY
        CASE category
          WHEN 'Food' THEN 1
          WHEN 'Services' THEN 2
          ELSE 3
        END,
        created_at ASC
    `,
    values,
  );

  return rows.map(mapProductRow);
};

const createProduct = async (product) => {
  const { rows } = await db.query(
    `
      INSERT INTO products (
        name,
        price,
        description,
        image,
        category,
        is_active,
        stock_quantity,
        daily_limit,
        service_config
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb)
      RETURNING
        id,
        name,
        price,
        description,
        image,
        category,
        is_active,
        stock_quantity,
        daily_limit,
        service_config,
        created_at,
        updated_at
    `,
    [
      product.name,
      product.price,
      product.description,
      product.image,
      product.category,
      product.isActive,
      product.stockQuantity,
      product.dailyLimit,
      JSON.stringify(product.serviceConfig || {}),
    ],
  );

  return mapProductRow(rows[0]);
};

const updateProduct = async (productId, product) => {
  const { rows } = await db.query(
    `
      UPDATE products
      SET
        name = $2,
        price = $3,
        description = $4,
        image = $5,
        category = $6,
        is_active = $7,
        stock_quantity = $8,
        daily_limit = $9,
        service_config = $10::jsonb,
        updated_at = NOW()
      WHERE id = $1
      RETURNING
        id,
        name,
        price,
        description,
        image,
        category,
        is_active,
        stock_quantity,
        daily_limit,
        service_config,
        created_at,
        updated_at
    `,
    [
      productId,
      product.name,
      product.price,
      product.description,
      product.image,
      product.category,
      product.isActive,
      product.stockQuantity,
      product.dailyLimit,
      JSON.stringify(product.serviceConfig || {}),
    ],
  );

  if (!rows[0]) {
    throw createHttpError(404, 'Product not found.');
  }

  return mapProductRow(rows[0]);
};

const updateProductActive = async (productId, isActive) => {
  const { rows } = await db.query(
    `
      UPDATE products
      SET is_active = $2, updated_at = NOW()
      WHERE id = $1
      RETURNING
        id,
        name,
        price,
        description,
        image,
        category,
        is_active,
        stock_quantity,
        daily_limit,
        service_config,
        created_at,
        updated_at
    `,
    [productId, Boolean(isActive)],
  );

  if (!rows[0]) {
    throw createHttpError(404, 'Product not found.');
  }

  return mapProductRow(rows[0]);
};

const deleteProduct = async (productId) => {
  const { rowCount } = await db.query('DELETE FROM products WHERE id = $1', [productId]);

  if (!rowCount) {
    throw createHttpError(404, 'Product not found.');
  }
};

module.exports = {
  createProduct,
  deleteProduct,
  listProducts,
  updateProduct,
  updateProductActive,
};
