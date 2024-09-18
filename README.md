# Scrapbook-Style Project Management App (MVP Stage)

## Overview

This project is a scrapbook-style project management app. It aims to provide an intuitive and visually appealing way to manage projects. The backend is nice, but I'm working on the UI right now. 

## Live Demo

Check out the deployed application: [https://stensibly.com/](https://stensibly.com/)

## Schema
<img src="https://github.com/user-attachments/assets/51b2ccab-2821-46e0-aec1-93152fecd4b1" width="60%">

This is an ongoing effort.

## What It Currently Looks Like

### Revamping schema; restarted UI situation (top is most recent):

![image](https://github.com/user-attachments/assets/724013e9-515f-4a34-9405-19c9d8a97d99)

![image](https://github.com/user-attachments/assets/cb225cc6-910e-4b15-b506-51161db6bde2)


### Dashboard:
![image](https://github.com/user-attachments/assets/f5e1507f-541c-4485-9dd7-8d6d87a25ad8)


### Blocks:

![image](https://github.com/user-attachments/assets/b41927cd-af3d-489b-9745-72b10a18d35e)


### Projects:
![image](https://github.com/user-attachments/assets/42789cb7-d1c4-478d-a7d9-3971131251da)

### Login Page:
![image](https://github.com/MikelBai/scrapbook/assets/13091533/ca45a1e3-66db-4989-9ed7-850ffe2bd770)

### Login Page (Mobile):
<img src="https://github.com/MikelBai/scrapbook/assets/13091533/7920ec02-4a31-4609-a7ab-3d9fa005620f" width="30%" alt="IMG_6309">






## Vision

The goal of this project is to make a project management app that isn't as wack as the existing options. Current key features include:

- **Visual and Textual Integration:** Incorporates images, sketches, and rich text to create detailed project descriptions and progress updates.
- **Dynamic Views:** Can toggle between different views, such as a calendar view and a scrapbook view, to visualize project timelines and progress.
- **Basic Functionality:** Has features like tagging, search, pagination, and authentication to provide a starting level of usability and user experience.

## Features Implemented (just a rehash of what's on my resume)

- **Development:** 
  - Developed a scalable, high-performance project management application leveraging cutting-edge technologies such as React Server Components, Next.js, and serverless architecture for optimal performance and SEO.
  - Implemented a robust, future-proof schema design connecting accounts, projects, blocks, tags, and multiple content types, focusing on extensible application architecture.
- **Microservices:** 
  - Created and integrated a Go microservice for image compression, containerized with Docker and deployed on AWS (ECR, Lambda, API Gateway) with a documented REST API.
- **AI Integration:** 
  - Implemented AI-powered features using Claude’s LLM API for intelligent tag suggestions and content organization to enhance user productivity.
- **Authentication & Storage:** 
  - Integrated NextAuth.js for secure authentication (email, GitHub, Google) and AWS S3 for isolated user file storage.
- **Optimization:** 
  - Optimized database queries and implemented caching strategies using React Query, significantly reducing database fetches and achieving near-instant load times and perfect PageSpeed Insights scores.
  - Developed custom hooks for efficient state management, replacing Zustand with React Query for server logic.
- **Database Migration:** 
  - Migrated the database from Vercel Postgres to Supabase, using pg_dump for 100% data preservation, and refactored the ORM layer to use Drizzle ORM for easier database management.
- **Search & Filtering:** 
  - Integrated Fuse.js for comprehensive fuzzy search and filtering across all data points.
- **UI/UX Design:** 
  - Designed and implemented a responsive UI with Tailwind CSS and shadcn/ui, featuring instant pagination, dynamic rendering, and optimized image loading.
- **Code Quality:** 
  - Conducted regular self-directed code reviews and refactoring sessions, maintaining a clean, modular code structure through pragmatic, delivery-first architectural decisions while preventing premature optimization/abstraction.
- **Design Tools:** 
  - Utilized Figma for UI/UX planning and future feature conceptualization, engaging in iterative design cycles.

## Features in Progress

- **Views & Interfaces:** 
  - Developing portfolio view, blog view, calendar view, and chat view to enhance user interaction and content management.
- **Content Previews:** 
  - Implementing rich previews for all content types to provide a more engaging and informative user experience.
- **Authentication:** 
  - Completing authentication rules to ensure secure and reliable access control.
- **Testing:** 
  - Conducting comprehensive integration tests to verify the functionality and interoperability of all components.
  - Performing authentication tests to ensure robust security measures are in place.

## Future Plans

- **Embeds from Various Websites:** Integrate embeds from platforms like Pinterest, Twitter/X, and Pixiv.
- **Chatbox Command Interface:** Develop a chatbox-like way to add content, possibly using a CLI-type format for commands.
- **Account Setup:** Expand account setup options for a more personalized user experience.
- **Mobile integration:** I want to be able to pull this up on my phone and send links here.

## Personal Note (Deeper vision?)

I store everything in a personal Discord server because I appreciate being able to access stuff from both PC and mobile, and the infinite storage (despite image compression). I like using channels and channel categories, the chat UI, and the automatic embeds for Twitter and other websites, which makes it easy to save references and pictures for inspiration. I want an app with similar functionality to Pinterest but with the ability to go offline, or at the very least browse without being bogged down by recommendation algorithms and layouts that seem to cater more to advertisers than to the end user.

This project will be deemed to have surpassed an MVP when I finalize a draft version of the scrapbook UI as well as complete the CRUD operations of images (blocks), and sort out the data relationships between images and projects. AKA, when I can loosely start considering actually using it for personal use.

## Contributing

I will read your feedback, but I'm planning on moving development to a private repo at some point.

## The artwork source?

I drew the picture(s).
