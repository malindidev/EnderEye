export class AppError extends Error {
  constructor(title, message) {
    super(message);
    this.name = "AppError";
    this.title = title;
  }
}
