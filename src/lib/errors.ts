export class AppError extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'You do not have permission to access this resource') {
    super(message);
  }
}

export class ValidationError extends AppError {
  public details: Record<string, any>;

  constructor(message = 'Invalid input data', details: Record<string, any>) {
    super(message);
    this.details = details;
  }
} 