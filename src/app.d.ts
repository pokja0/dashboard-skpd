/// <reference types="vite/client" />

declare global {
  namespace App {
    interface Locals {
      user: {
        username: string;
        role: 'superadmin' | 'user';
        createdAt: string;
      } | null;
    }

    interface PageData {
      user: App.Locals['user'];
    }
  }
}

export {};
