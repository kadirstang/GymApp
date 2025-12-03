import { Request, Response, NextFunction } from 'express';

/**
 * Example TypeScript controller
 * Bu dosya yeni TS kodları için şablon olarak kullanılabilir
 */

interface HealthCheckResponse {
  status: string;
  timestamp: string;
  uptime: number;
  environment: string | undefined;
  typescript: boolean;
}

export const healthCheckTS = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const response: HealthCheckResponse = {
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV,
      typescript: true,
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
};
