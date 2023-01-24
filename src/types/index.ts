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

export interface IEventEmitter {
  on(name: string, listener: Function): void;
  removeListener(name: string, listener: Function): void;
  emit(name: string, data?: any): void;
}

export type CircuitBreakerEvents = 'OPEN' | 'CLOSE';
export interface ICircuitBreakerWithEmitter extends ICircuitBreaker {
  on(event: CircuitBreakerEvents, listener: Function): void;
}