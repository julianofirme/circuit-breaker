import axios, { AxiosInstance } from 'axios';
import { ICircuitBreaker, ICircuitBreakerOptions, IHttp } from './types';
class Http implements IHttp {
  public readonly instance: AxiosInstance

  constructor(baseURL: string) {
    this.instance = axios.create({ baseURL });
  }
}

class UsefulService extends Http {
  constructor() {
    super('https://3rd-party.com/');
  }

  public getInfo() {
    return this.instance.get('/useful-information');
  }
}

class CircuitBreaker implements ICircuitBreaker {
	private readonly http: IHttp;
	private readonly timeout: number;
	private isOpen = false;
	private errorHandler: (error: any) => boolean;
	
	constructor(http: IHttp, options: ICircuitBreakerOptions) {
	  this.http = http;
	  this.timeout = options.timeout;
	  this.errorHandler = options.errorHandler;
	}
	
	public getStatus() {
	  return this.isOpen;
	}

  private interceptErrorResponse(error: any) {
    const shouldCircuitBreakerBeOpen = this.errorHandler(error);
  
    if (shouldCircuitBreakerBeOpen && !this.isOpen) {
      this.openCircuitBreaker();
    }
  
    return Promise.reject(error);
  }
  
  private openCircuitBreaker() {
    this.isOpen = true;
  
    setTimeout(() => {
      this.isOpen = false;
    }, this.timeout);
  }
}

