# Pizza Composer

A web application MVP designed to help users create and manage unique pizza compositions. Enjoy generating innovative recipes using AI or create your own manually, and save your favorite combinations with ease.

## Table of Contents

- [Pizza Composer](#pizza-composer)
  - [Table of Contents](#table-of-contents)
  - [Project Description](#project-description)
  - [Tech Stack](#tech-stack)
  - [Getting Started Locally](#getting-started-locally)
  - [Available Scripts](#available-scripts)
  - [Project Scope](#project-scope)
  - [Project Status](#project-status)
  - [License](#license)

## Project Description

Pizza Composer is an MVP web application aimed at simplifying the creation and management of pizza compositions. The app allows users to generate pizza recipes using AI based on 1-3 base ingredients, or to manually enter ingredients using 10 dedicated text fields. Key features include:

- **AI-generated compositions:** Input a few base ingredients and let the AI generate a detailed layering sequence (up to 10 ingredients).
- **Manual composition:** Create custom pizza recipes using 10 text fields without strict validation.
- **User authentication:** Register and log in using email and password, with compositions tied to the user account.
- **Composition management:** View, rate (1 to 6 stars), and delete saved compositions. Optionally add photos of your pizza creations.
- **Photo uploads:** Upload images (with constraints of 2000x2000px and 2.5MB) stored securely via Supabase Storage.
- **Event tracking:** Monitor counts such as generated compositions and uploaded photos for analytics.

## Tech Stack

**Frontend:**

- Astro 5
- React 19
- TypeScript 5
- Tailwind CSS 4
- Shadcn/ui

**Backend & Services:**

- Supabase (for authentication, database, and storage)
- AI Integration via external APIs (such as OpenAI, Google, or Anthropic) through Openrouter.ai interface

**Runtime:**

- Node.js (using version specified in `.nvmrc`: **22.14.0**)

## Getting Started Locally

1. **Clone the repository:**
   ```bash
   git clone https://github.com/bartoszwalicki/pizza-composer.git
   cd pizza-composer
   ```

2. **Install dependencies:**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Ensure you are running the required Node version:**
   The project requires Node.js version 22.14.0, as specified in the `.nvmrc` file.

4. **Start the development server:**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

5. **Build and preview:**
   ```bash
   npm run build
   npm run preview
   ```

## Available Scripts

The following scripts are available in `package.json`:

- `dev`: Starts the development server.
- `build`: Builds the project for production.
- `preview`: Previews the production build locally.
- `astro`: Runs the Astro command line tool.
- `lint`: Runs ESLint to check for linting errors.
- `lint:fix`: Automatically fixes linting errors with ESLint.
- `format`: Formats the codebase using Prettier.

## Project Scope

This project is designed as an MVP to validate the concept of a pizza composition management application. The key scopes include:

- **AI-Generated Compositions:** Allowing users to generate recipes based on minimal inputs.
- **Manual Compositions:** Providing a flexible form to manually create and save pizza recipes.
- **User Management:** Simple registration and login to secure user data and compositions.
- **Composition Management:** Options to view, rate, and delete saved compositions, along with the ability to upload and display photos.
- **Analytics:** Tracking key metrics such as the number of AI-generated compositions and photo uploads to measure engagement.

## Project Status

This project is currently at the MVP stage and is under active development. Feedback and contributions are welcome as the application evolves.

## License

This project is licensed under the MIT License.
