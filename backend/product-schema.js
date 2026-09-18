import { z } from "zod";

/**
 * Database representation of a product.
 * Monetary values are represented as numeric values; store them as NUMERIC in PostgreSQL.
 */
export const productSchema = z.object({
  id: z.uuid(),
  user_id: z.uuid(),
  name: z.string().trim().min(1).max(255),
  description: z.string().trim().max(5_000).nullable(),
  price: z.number().nonnegative(),
  stock: z.number().int().nonnegative().default(0),
  image_url: z.url().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
});

/**
 * Fields accepted when a user creates a product.
 */
export const createProductSchema = productSchema
  .pick({
    name: true,
    description: true,
    price: true,
    stock: true,
    image_url: true,
  })
  .partial({
    description: true,
    stock: true,
    image_url: true,
  });

/**
 * Fields that may be changed after product creation.
 */
export const updateProductSchema = createProductSchema.partial();

