// Monitoring and Error Tracking Service
export interface ErrorLog {
  id: string;
  timestamp: Date;
  level: "error" | "warning" | "info";
  message: string;
  stack?: string;
  userId?: string;
  metadata?: Record<string, any>;
}

export interface PerformanceMetric {
  name: string;
  duration: number;
  timestamp: Date;
  status: "success" | "failure";
}

const errorLogs: ErrorLog[] = [];
const performanceMetrics: PerformanceMetric[] = [];

export async function logError(
  message: string,
  error: Error,
  userId?: string,
  metadata?: Record<string, any>
): Promise<void> {
  const errorLog: ErrorLog = {
    id: `error-${Date.now()}`,
    timestamp: new Date(),
    level: "error",
    message,
    stack: error.stack,
    userId,
    metadata,
  };

  errorLogs.push(errorLog);
  // In production, send to Sentry, DataDog, etc.
  console.error("[ERROR]", message, error);
}

export async function logWarning(
  message: string,
  metadata?: Record<string, any>
): Promise<void> {
  const log: ErrorLog = {
    id: `warning-${Date.now()}`,
    timestamp: new Date(),
    level: "warning",
    message,
    metadata,
  };

  errorLogs.push(log);
  console.warn("[WARNING]", message);
}

export async function logInfo(
  message: string,
  metadata?: Record<string, any>
): Promise<void> {
  const log: ErrorLog = {
    id: `info-${Date.now()}`,
    timestamp: new Date(),
    level: "info",
    message,
    metadata,
  };

  errorLogs.push(log);
  console.log("[INFO]", message);
}

export async function trackPerformance(
  name: string,
  duration: number,
  status: "success" | "failure"
): Promise<void> {
  const metric: PerformanceMetric = {
    name,
    duration,
    timestamp: new Date(),
    status,
  };

  performanceMetrics.push(metric);

  if (duration > 5000) {
    await logWarning(`Slow operation: ${name} took ${duration}ms`);
  }
}

export async function getErrorLogs(limit: number = 100): Promise<ErrorLog[]> {
  return errorLogs.slice(-limit);
}

export async function getPerformanceMetrics(limit: number = 100): Promise<PerformanceMetric[]> {
  return performanceMetrics.slice(-limit);
}

export async function getHealthStatus(): Promise<any> {
  const recentErrors = errorLogs.filter(
    (e) => Date.now() - e.timestamp.getTime() < 3600000
  );

  return {
    status: recentErrors.length === 0 ? "healthy" : "degraded",
    recentErrors: recentErrors.length,
    uptime: process.uptime(),
    memory: process.memoryUsage(),
  };
}

export default {
  logError,
  logWarning,
  logInfo,
  trackPerformance,
  getErrorLogs,
  getPerformanceMetrics,
  getHealthStatus,
};
