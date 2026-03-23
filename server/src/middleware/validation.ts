// ============================================================
// Request Validation Middleware (Zod-based)
// ============================================================

import { Request, Response, NextFunction } from 'express';
import { z, ZodSchema, ZodError } from 'zod';

// ---- Generic validation middleware factory ----

/**
 * Validate request body against a Zod schema.
 * Replaces req.body with the parsed (and coerced) result on success.
 * Returns 400 with detailed field-level errors on failure.
 */
export function validate(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        res.status(400).json({
          success: false,
          message: 'Validation failed',
          details: err.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        });
        return;
      }
      next(err);
    }
  };
}

/** Alias */
export const validateBody = validate;

/**
 * Validate request query parameters against a Zod schema.
 */
export function validateQuery(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      req.query = schema.parse(req.query) as any;
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        res.status(400).json({
          success: false,
          message: 'Invalid query parameters',
          details: err.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        });
        return;
      }
      next(err);
    }
  };
}

/**
 * Validate URL params against a Zod schema.
 */
export function validateParams(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      req.params = schema.parse(req.params) as any;
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        res.status(400).json({
          success: false,
          message: 'Invalid URL parameters',
          details: err.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        });
        return;
      }
      next(err);
    }
  };
}

// ============================================================
// Common Schemas
// ============================================================

export const uuidParamSchema = z.object({
  id: z.string().uuid('Invalid UUID'),
});

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const boundingBoxSchema = z.object({
  north: z.coerce.number().min(-90).max(90),
  south: z.coerce.number().min(-90).max(90),
  east: z.coerce.number().min(-180).max(180),
  west: z.coerce.number().min(-180).max(180),
});

// Alias for alternate naming convention used elsewhere
export const boundingBoxQuerySchema = z.object({
  minLat: z.coerce.number().min(-90).max(90),
  maxLat: z.coerce.number().min(-90).max(90),
  minLng: z.coerce.number().min(-180).max(180),
  maxLng: z.coerce.number().min(-180).max(180),
});

export const locationSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

export const gpsPointSchema = z.object({
  lat: z.number().min(-90).max(90).optional(),
  lng: z.number().min(-180).max(180).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  timestamp: z.number(),
  accuracy: z.number().optional(),
  altitude: z.number().optional(),
  speed: z.number().optional(),
}).refine(
  (p) => (p.lat != null || p.latitude != null) && (p.lng != null || p.longitude != null),
  { message: 'Either lat/lng or latitude/longitude is required' }
);

// ---- Auth Schemas ----

export const registerSchema = z.object({
  username: z.string()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username must be at most 30 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  email: z.string().email('Invalid email address').max(255),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must be at most 128 characters'),
  invite_code: z.string().max(12).optional(),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

// ---- Route (GPS) Schemas ----

export const uploadRouteSchema = z.object({
  points: z.array(z.object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    altitude: z.number(),
    timestamp: z.number(),
    accuracy: z.number(),
    speed: z.number(),
    bearing: z.number(),
    source: z.enum(['gps', 'network', 'fused']),
  })).min(10, 'Need at least 10 GPS points'),
  class: z.enum(['walker', 'dog_walker', 'runner', 'cyclist', 'skater', 'driver']).optional(),
});

// Alternate schema that accepts the simpler GpsPoint format (used internally)
export const createRouteSchema = z.object({
  points: z.array(gpsPointSchema).min(4, 'Need at least 4 GPS points'),
  class: z.enum(['walker', 'dog_walker', 'runner', 'cyclist', 'skater', 'driver']).optional(),
});

// ---- Quest Schemas ----

export const createQuestSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(200),
  description: z.string().max(2000).optional(),
  territory_id: z.string().uuid().optional(),
  difficulty: z.number().int().min(1).max(10).default(1),
  steps: z.array(z.object({
    step_order: z.number().int().optional(),
    type: z.enum(['FIND', 'LISTEN', 'CHALLENGE', 'SOLVE', 'COLLECT', 'DOG']),
    location: z.object({
      lat: z.number().min(-90).max(90),
      lng: z.number().min(-180).max(180),
    }).optional(),
    // Support flat lat/lng as well
    lat: z.number().min(-90).max(90).optional(),
    lng: z.number().min(-180).max(180).optional(),
    radius_m: z.number().min(5).max(500).default(30),
    instruction: z.string().min(1).max(1000),
    verification_type: z.enum(['photo', 'photo_gps', 'proximity', 'video', 'text_input', 'sensor', 'dog_only']),
    expected_answer: z.string().max(500).optional(),
    hint: z.string().max(500).optional(),
  })).min(1).max(20),
});

export const rateQuestSchema = z.object({
  creativity: z.number().int().min(1).max(5).optional(),
  difficulty: z.number().int().min(1).max(5).optional(),
  worth_it: z.number().int().min(1).max(5),
  comment: z.string().max(1000).optional(),
});

export const verifyStepSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  answer: z.string().max(500).optional(),
  media_url: z.string().url().max(500).optional(),
});

// ---- Echo Schemas ----

export const createEchoSchema = z.object({
  location: z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
  }).optional(),
  // Support flat lat/lng too
  lat: z.number().min(-90).max(90).optional(),
  lng: z.number().min(-180).max(180).optional(),
  radius_m: z.number().min(10).max(100).default(40),
  audio_url: z.string().url().max(500).optional(),
});

// ---- Challenge Schemas ----

export const createChallengeSchema = z.object({
  template: z.enum(['distance_sprint', 'area_claim', 'elevation_climb', 'step_count', 'time_walk', 'explore_new', 'photo_spot', 'speed_run', 'collect_items', 'trivia', 'stealth', 'endurance', 'exploration', 'social']),
  location: z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
  }).optional(),
  lat: z.number().min(-90).max(90).optional(),
  lng: z.number().min(-180).max(180).optional(),
  parameters: z.record(z.any()),
  verification_level: z.number().int().min(1).max(3).default(1),
  class: z.enum(['walker', 'dog_walker', 'runner', 'cyclist', 'skater', 'driver']).optional(),
});

export const submitChallengeSchema = z.object({
  media_url: z.string().url().max(500).optional(),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

// ---- Pet Schemas ----

export const createPetSchema = z.object({
  name: z.string().min(1).max(50),
  species: z.string().max(20).default('dog'),
  breed: z.string().max(50).optional(),
});

export const updatePetSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  breed: z.string().max(50).optional(),
  specialization: z.string().max(20).optional(),
});

// ---- Travel Schemas ----

export const createTravelRouteSchema = z.object({
  title: z.string().min(3).max(200),
  points: z.array(locationSchema).min(2),
  spots: z.array(z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
    title: z.string().max(200).optional(),
    description: z.string().max(2000).optional(),
    media_url: z.string().url().max(500).optional(),
  })).optional(),
});

export const updateTravelRouteSchema = z.object({
  title: z.string().min(3).max(200).optional(),
  status: z.enum(['draft', 'published', 'archived']).optional(),
  spots: z.array(z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
    title: z.string().max(200).optional(),
    description: z.string().max(2000).optional(),
    media_url: z.string().url().max(500).optional(),
  })).optional(),
});

export const ratingSchema = z.object({
  creativity: z.number().int().min(1).max(5).optional(),
  difficulty: z.number().int().min(1).max(5).optional(),
  worth_it: z.number().int().min(1).max(5),
  comment: z.string().max(1000).optional(),
});

// ---- Report Schema ----

export const createReportSchema = z.object({
  target_type: z.enum(['quest', 'echo', 'challenge', 'user', 'travel_route']),
  target_id: z.string().uuid(),
  reason: z.string().min(10, 'Reason must be at least 10 characters').max(2000),
});

// ---- Settings Schema ----

export const updateSettingsSchema = z.object({
  notifications_enabled: z.boolean().optional(),
  quiet_hours_start: z.number().int().min(0).max(23).optional(),
  quiet_hours_end: z.number().int().min(0).max(23).optional(),
  max_push_per_day: z.number().int().min(0).max(50).optional(),
  preferred_class: z.enum(['walker', 'dog_walker', 'runner', 'cyclist', 'skater', 'driver']).optional(),
});

// ---- Notification Schemas ----

export const markReadSchema = z.object({
  ids: z.array(z.string().uuid()).min(1).max(100),
});
