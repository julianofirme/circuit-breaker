import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { CircuitBreakerEvents, ICircuitBreaker, ICircuitBreakerOptions, ICircuitBreakerWithEmitter, IEventEmitter, IHttp } from './types';
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

class EventEmitter implements IEventEmitter {
  private readonly events: Record<string, Function[]>;

  public constructor() {
    this.events = {};
  }

  public on(name: string, listener: Function) {
    if (!this.events[name]) {
      this.events[name] = [];
    }

    this.events[name].push(listener);
  }

  public removeListener(name: string, listenerToRemove: Function) {
    if (!this.events[name]) {
      throw new Error(`Can't remove a listener. Event "${name}" doesn't exits.`);
    }

    const filterListeners = (listener: Function) => listener !== listenerToRemove;

    this.events[name] = this.events[name].filter(filterListeners);
  }

  public emit(name: string, data: any) {
    if (!this.events[name]) {
      throw new Error(`Can't emit an event. Event "${name}" doesn't exits.`);
    }

    const fireCallbacks = (callback: Function) => {
      callback(data);
    };

    this.events[name].forEach(fireCallbacks);
  }
}

class CircuitBreakerWithEmitter implements ICircuitBreakerWithEmitter {
  private readonly http: IHttp;
  private readonly timeout: number;
  private isOpen: boolean = false;
  private readonly errorHandler: (error: any) => boolean;
  private readonly eventEmitter: IEventEmitter;

  constructor(http: IHttp, option: ICircuitBreakerOptions) {
    this.http = http;
    this.timeout = option.timeout;
    this.errorHandler = option.errorHandler;
    this.eventEmitter = new EventEmitter();

    this.http.instance.interceptors.request.use(this.interceptRequest.bind(this));
    this.http.instance.interceptors.response.use(
      (response: AxiosResponse) => response,
      this.interceptErrorResponse.bind(this),
    );
  }

  public getStatus() {
    return this.isOpen;
  }

  public on(event: CircuitBreakerEvents, listener: Function) {
    this.eventEmitter.on(event, listener);
  }

  private interceptRequest(config: AxiosRequestConfig) {
    const CancelToken = axios.CancelToken;

    const cancelToken = new CancelToken((cancel) => cancel('Circuit breaker is open'));

    return {
      ...config,
      ...(this.isOpen ? { cancelToken } : {}),
    };
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
    this.eventEmitter.emit('OPEN');

    setTimeout(() => {
      this.isOpen = false;
      this.eventEmitter.emit('CLOSE');
    }, this.timeout);
  }
}

class TestHttp extends Http {
  constructor() {
    super('http://localhost:5000/');
  }

  public test() {
    return this.instance.get('/test');
  }
}

async function main() {
  const testHttp = new TestHttp();

  const errorHandler = (err: AxiosError) => {
    console.log(err.message);

    return err?.response?.status === 429;
  };

  const testCircuitBreaker = new CircuitBreakerWithEmitter(testHttp, {
    timeout: 10_000,
    errorHandler,
  });

  testCircuitBreaker.on('OPEN', () => {
    console.log('CIRCUIT BREAKER WAS OPENED');
  });

  testCircuitBreaker.on('CLOSE', async () => {
    console.log('CIRCUIT BREAKER WAS CLOSED');
  });

  setInterval(() => {
    testHttp.test().catch(() => {});
  }, 2000);
}

main();

