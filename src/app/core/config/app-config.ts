declare global {
  interface Window {
    __env?: {
      API_URL?: string;
    };
  }
}

const fallbackApiUrl = 'https://full-social-blog-res-tful-api.vercel.app/api/v1';

export const appConfig = {
  apiBaseUrl: window.__env?.API_URL || fallbackApiUrl,
};
