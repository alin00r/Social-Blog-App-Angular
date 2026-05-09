# NourBlog Frontend

A modern blog frontend built with Angular and Tailwind CSS. It connects to a Node.js blog API and includes authentication, article management, route protection, and polished UI states for loading, empty, and error scenarios. [angular](https://angular.dev/guide/tailwind)

## Tech Stack

- Angular 21 with a module-based architecture. [angular](https://angular.dev/reference/configs/file-structure)
- Tailwind CSS for utility-first styling. [angular](https://angular.dev/guide/tailwind)
- Reactive Forms for scalable form handling and validation. [angular](https://angular.dev/guide/forms/reactive-forms)
- Angular Router with route guards for protected navigation. [angular](https://angular.dev/style-guide)
- HTTP Interceptor for attaching the authentication token to requests. [angular](https://angular.dev/guide/http/interceptors)

## Features

- User authentication: register, login, and logout.
- Persisted authentication state using `localStorage`.
- View all available articles.
- Create a new article with image upload.
- Edit and delete articles created by the authenticated user.
- Protected `/editor` route that requires login.
- Clear UI states for loading, empty data, and errors.
- Clean dark-themed interface with a modern look.

## Project Structure

```text
src/app/
  core/
    guards/
    interceptors/
    models/
    services/
  features/
    auth/
    articles/
    home/
  shared/
    components/
```

This structure follows a clear separation of concerns, which aligns well with Angular project organization guidance for maintainability and feature grouping. [angular](https://angular.dev/reference/configs/file-structure)

## Environment Configuration

This project uses a root `.env` file instead of Angular `environments` files.

### Set the API URL

Update the `.env` file in the project root:

```env
API_URL=http://localhost:3000/api
```

### Runtime configuration

Before running `start`, `watch`, or `build`, a script generates a runtime config file at:

- `public/env.js`

That file is loaded by `src/index.html`, and the app reads the API base URL from it at runtime. This approach makes deployment configuration easier because the API URL can be changed without rebuilding Angular environment files. [angular](https://angular.dev/reference/configs/file-structure)

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Start the development server

```bash
npm start
```

The application runs at:

- [http://localhost:4200](http://localhost:4200)

### 3. Build for production

```bash
npm run build
```

The production build output is generated in:

- `dist/blog-frontend`

## Backend Requirements

Make sure the Node.js backend is running and accessible through the `API_URL` value defined in `.env`.

The frontend expects the following API endpoints:

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/posts`
- `POST /api/posts`
- `PUT /api/posts/:id`
- `DELETE /api/posts/:id`

## Notes

- The codebase is written to stay beginner-friendly and easy to follow.
- The UI is intentionally simple, modern, and functional.
- Environment configuration is prepared for both development and production through the root `.env` file.

## Quick Start

After cloning the project:

1. Set the `API_URL` value in `.env`.
2. Start the backend server.
3. Run `npm install`.
4. Run `npm start`.
"# Social-Blog-App-Angular" 
