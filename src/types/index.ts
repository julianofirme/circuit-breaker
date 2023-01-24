import { AxiosInstance } from "axios";

export interface IHttp {
  instance: AxiosInstance;
}

export interface ICircuitBreaker {
  getStatus(): boolean;
}

export interface ICircuitBreakerOptions {
  timeout: number;
  errorHandler: (error: any) => boolean;
}