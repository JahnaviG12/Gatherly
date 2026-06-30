# CHAPTER 1: INTRODUCTION

The way people collaborate and manage group activities has changed significantly with the growth of digital communication and modern web technologies. Today, groups and teams prefer smart platforms that help them organize tasks, manage expenses, communicate, share media, and coordinate activities in one centralized environment. Traditional collaboration methods often depend on multiple separate applications, leading to communication gaps, scattered information, and inefficient group management. 

To overcome these challenges, the **Gatherly** project was developed as a modern collaborative workspace and group management system.

**Gatherly** is a web-based application designed to provide users with a complete and user-friendly digital collaboration experience. The system allows users to create and manage dedicated workspaces such as trips, projects, events, hackathons, college activities, and social communities. Each workspace acts as a centralized collaborative hub where members can assign tasks, monitor progress, split expenses, share photos and videos, post announcements, and track recent group activities efficiently.

The platform also includes advanced collaboration tools that enhance communication and productivity among users. Features such as real-time video calling, AI-powered smart chat assistance, integrated map services for location sharing, and the unique Workspace Fusion feature allow users to collaborate more effectively inside a shared digital environment. These features reduce dependency on multiple separate applications and improve overall coordination within groups.

Secure authentication and protected workspace access are integrated into the system to ensure safe collaboration and user privacy. The application also includes essential informational components such as About Us, FAQ, Privacy Policy, Terms & Conditions, and Contact pages to improve transparency and build user trust. 

The project is developed using modern technologies including React.js, CSS3, JavaScript, Node.js, Express.js, MongoDB, and Mongoose, along with modern UI libraries and animation frameworks for responsive and interactive interface design.

Overall, **Gatherly** provides a smart, secure, and efficient digital collaboration solution by combining workspace management, communication tools, media sharing, expense management, task tracking, and intelligent collaboration features into a single unified platform. The project aims to improve productivity, simplify group coordination, and provide a seamless collaborative experience for modern users.

---

## 1.1 PROBLEM STATEMENT

In the modern digital environment, group collaboration and activity management are often handled using multiple separate applications that lack integration, efficiency, and centralized coordination. Users frequently face difficulties while managing tasks, tracking expenses, sharing media, organizing events, and communicating effectively within groups. Traditional collaboration methods usually depend on different platforms for messaging, task management, expense tracking, file sharing, and scheduling, which creates confusion, scattered information, and reduced productivity.

Another major challenge faced by users is the lack of a unified platform that combines collaboration tools, communication systems, media sharing, task management, and workspace organization into a single environment. Users are often required to switch between multiple applications such as messaging platforms, expense split applications, task management tools, and cloud storage systems to complete group activities. This increases complexity, consumes more time, and reduces overall collaboration efficiency. In addition, many existing systems fail to provide interactive and intelligent collaboration features such as integrated communication, shared activity tracking, workspace coordination, and real-time collaboration tools.

From the group management perspective, handling tasks, member activities, shared expenses, announcements, and collaborative planning manually becomes difficult as the number of members and workspaces increases. Groups often face challenges in coordinating activities, maintaining communication, tracking progress, organizing shared resources, and managing collaborative workflows efficiently. Without a proper centralized system, maintaining organized collaboration and ensuring smooth coordination becomes time-consuming and inefficient.

To overcome these limitations, the **Gatherly** project is developed as a modern collaborative workspace and group management web application that provides a smart, secure, and user-friendly digital collaboration solution.

### **Key Problems Identified:**
* **Lack of Integration**: Absence of a centralized collaboration and workspace management platform.
* **Tool Fragmentation**: Difficulty in managing tasks, expenses, communication, and media sharing in one place, leading to dependency on multiple separate applications for group coordination.
* **Coordination Gaps**: Inefficient task tracking, collaborative workflow management, and difficulty in organizing shared group activities.
* **Feature Deprivation**: Lack of advanced collaboration features such as video calling and AI-assisted interaction in standard tools.
* **Low Productivity**: Poor coordination and difficulty in maintaining organized, efficient, and secure digital collaboration environments.

---

## 1.2 OBJECTIVES

The main objective of the **Gatherly** project is to develop a smart, secure, and user-friendly collaborative workspace management system that simplifies group coordination, communication, and activity management. 

Specifically, the project aims to:
1. **Centralize Collaboration**: Provide a unified digital platform where users can create dedicated workspaces, manage tasks, share media, track expenses, organize events, and collaborate efficiently within a single application.
2. **Improve Productivity**: Integrate multiple collaboration tools—such as task boards, announcements, video calling, AI-assisted chat, and shared activity tracking—into one cohesive application.
3. **Streamline Workflows**: Enable users to create private or public workspaces, invite members, monitor progress, manage shared resources, and coordinate activities efficiently.
4. **Enable Cross-Team Cooperation**: Implement the **Workspace Fusion** feature to allow two different workspaces to temporarily collaborate and interact inside a shared environment.
5. **Enhance Real-Time Communication**: Leverage WebSockets for instant chat messaging, active typing indicators, shared board updates, and real-time video calling.
6. **Integrate AI Assistance**: Integrate Google Gemini AI to assist project teams with brainstorming, itinerary planning, expense suggestions, and automatic task extraction.
7. **Ensure Compliance and Trust**: Include essential informational pages (FAQ, Privacy Policy, Terms & Conditions, Contact) to improve transparency and user trust.

---

## 1.3 TECHNOLOGIES USED

### **Frontend Technologies**
* **React 19 (JSX)**: Core UI library used for building interactive pages.
* **Vite**: Frontend build tool and development server supporting Fast Hot Module Replacement (HMR).
* **CSS3**: Core styling framework implementing custom variables, glassmorphism effects, gradients, dark/light modes, animations, and responsive layouts.
* **Framer Motion**: Utilized for premium UI animations (page transitions, modal slide-ins, fusion overlays, and micro-interactions).
* **Lucide React**: Modern icon library used throughout dashboards, workspace tools, navigation, and action buttons.
* **React Router DOM v7**: Client-side routing for all pages (dashboard, workspace, admin, auth, invite, gallery, etc.).
* **Socket.IO Client**: Enables real-time two-way communication (live chat, task sync, expense sync, video call signaling, and typing indicators).
* **React Quill New**: Rich-text editor used in the Notes/Documents module inside workspaces.
* **Axios**: Promise-based HTTP client used for making REST API calls to the backend.
* **Responsive Web Design**: All layouts adapt dynamically across desktop, tablet, and mobile devices using CSS grid, flexbox, and media queries.

### **Backend Technologies**
* **Node.js**: Server-side JavaScript runtime environment that powers all backend business logic.
* **Express.js**: Web application framework for defining API endpoints (auth, spaces, tasks, expenses, gallery, and AI).
* **MongoDB**: NoSQL document database used for storing users, workspaces (spaces), tasks, expenses, chat messages, gallery items, and settlements.
* **Mongoose**: Object Data Modeling (ODM) library for MongoDB, used to enforce schemas for `User`, `Space`, `Task`, `Expense`, `Settlement`, `GalleryItem`, and `ChatMessage`.
* **REST API**: Standard architecture for JSON-based frontend-to-backend communication.
* **Socket.IO (Server)**: Real-time bi-directional event system for broadcasting chat messages, task/expense updates, poll votes, activity logs, member joins, and video call signals.
* **Google Generative AI (`gemini-2.5-flash`)**: Powers the in-workspace AI Planner chatbot, generating itineraries, budget suggestions, task breakdowns, and planning recommendations.
* **JWT (jsonwebtoken)**: Used for generating and verifying secure authentication tokens for user and admin sessions.
* **Bcryptjs**: Hashes user passwords securely before storing them in the database.
* **Multer**: Middleware for handling multipart file uploads for gallery images.
* **Morgan**: HTTP request logging middleware for development and debugging.
* **Dotenv**: Loads configuration environment variables securely from `.env` files.
* **CORS**: Configured to allow cross-origin requests between the Vite client and Express server.

### **Development Tools**
* **Visual Studio Code (VS Code)**: Primary integrated development environment (IDE) for managing project files.
* **Antigravity**: Used for designing, building, debugging, and enhancing UI components, backend routes, real-time features, animations, and overall application architecture.
* **Git & GitHub**: Distributed version control system and backup repositories.
* **MongoDB Compass**: Graphical User Interface (GUI) tool used for managing and visualizing MongoDB database collections and records.
* **Postman**: Used for testing backend APIs and verifying server JSON responses.
* **npm (Node Package Manager)**: Used for installing and managing project dependencies.
* **Nodemon**: Automatically restarts the Node.js backend server whenever source files change during development.
* **ESLint**: Static code analysis tool configured to maintain React code quality and hook guidelines.

---

## 1.4 WEBSITE MODULES

### **User Authentication Module**
Allows team members and administrators to register and securely log in to the system. It manages authentication tokens, password hashing, and role-based route access controls.
* User registration and email-based secure login.
* Password encryption using bcryptjs hashing.
* Token-based authentication using JSON Web Tokens (JWT).
* Route protection and session authorization management.

### **User Dashboard Module**
Provides a central interactive command center where users can manage their collaboration spaces, inspect high-level statistics, search resources, and review a live global activity feed.
* Workspace overview with cards displaying status, member counts, and project completion progress.
* High-level performance indicators tracking total active workspaces, pending tasks, and recent notifications.
* Multi-workspace search panel to filter workspaces and tasks by keyword.
* Real-time activity timeline tracking recent actions performed by team members across all spaces.

### **Workspace Cockpit Module**
Acts as the primary layout and tool-switcher for an active workspace. It allows members to easily jump between specialized collaboration tabs (Chat, Tasks, Expenses, Notes, Map, Gallery, and Fusion).
* Workspace room selection and real-time room joining via Socket.IO.
* Channel and direct messaging navigation lists.
* Adaptive header showing active member avatars, workspace progress tracker, and dynamic slideshow covers.
* Quick invite link generation for adding new members dynamically.

### **Collaborative Task Module**
Provides a comprehensive project management interface that lets team members structure, track, and complete collaborative milestones through a drag-and-drop workflow.
* Kanban board view and list view with column status filtering (To Do, In Progress, In Review, Completed).
* Interactive card drag-and-drop to instantly update task progress state via WebSockets.
* Detailed task parameters including priorities (high, medium, low), checklists/subtasks, due dates, comment counters, and member assignees.
* AI-based task extraction, enabling users to automatically import task lists suggested during AI conversations.

### **Shared Expense and Ledger Module**
Handles tracking, splitting, and settling team expenditures, ensuring budget transparency and making group settlements hassle-free.
* Group expense logging with fields for category, receipt notes, total amount, and paying member.
* Multi-method payment splitting (Equal distribution or customized user splits).
* Interactive ledger list showing transaction histories and split details.
* Settlement engine displaying exactly who owes whom, with one-click settle validation.

### **AI Planner Chatbot Module**
An integrated artificial intelligence assistant powered by Google Gemini that helps project teams brainstorm execution plans, plan itineraries, and organize budgets.
* Real-time conversation thread with model-user conversational history formatting.
* Dynamic prompt suggestions tailored for budget calculation, party planning, and task generation.
* Smart mock-response fallback system for offline testing or when the API key is unconfigured.
* Interactive markdown rendering of AI responses, including lists and tables.

### **Real-Time Video Calling Module**
Allows workspace members to start, join, and participate in high-fidelity interactive audio and video conferences directly inside the browser.
* Group calls initiated inside workspace rooms with automatic ring alerts sent to active members.
* Dynamic video grid displaying participant video feeds or customized avatar profiles.
* Interactive call options (camera toggling, mic muting, simulated screen share, and background blur filters).
* Floating reaction system allowing users to broadcast emojis that float up on other participants' viewports.

### **Workspace Fusion Module**
Facilitates cross-functional collaboration by enabling two independent workspaces to merge their resources and member lists without losing their original data.
* Fusion invite proposal system targeting active workspaces from a drop-down selector.
* Collaboration invitation widgets supporting one-click "Accept & Merge" or "Decline".
* Beautiful, multi-phase animated fusion progress overlay representing data synchronization.
* Automated database script combining task lists, member records, and shared media folders.

### **Shared Gallery & Media Module**
Provides teams with a centralized workspace repository to upload, organize, and view images related to their project or trip.
* Upload system supporting image file storage and shared database references.
* Custom album creation and media categorizing.
* Infinite grid layout with hovering asset metadata and full-screen view modals.
* Real-time sync of newly uploaded pictures to all other open client pages.

### **Notes & Documents Editor Module**
Integrates a full-featured collaborative rich-text editor (using React Quill), enabling team members to write plans, logs, and documentation side-by-side.
* Collaborative document creation with title and formatting tools.
* Real-time synchronization of editor inputs to prevent conflict overrides.
* Visual indicator badges when notes are updated and saved by others.
* Rich text formatting, listing, headers, and quote blocks.

---

## 1.5 ADVANTAGES

* **All-in-One Centralization**: Provides a single platform for managing workspaces, team collaboration, and shared resources, reducing tool-switching.
* **AI-Guided Productivity**: Offers AI-based planning assistance powered by Google Gemini for smart task suggestions, budgeting, and itinerary generation.
* **Equitable Expense Ledger**: Supports secure multi-member expense tracking with flexible splitting methods (equal or custom distributions).
* **Automated Sync**: Reduces manual effort in managing tasks, expenses, and team activities through automated real-time synchronization using Socket.IO-based updates.
* **Modern & Responsive UX**: Provides a responsive, modern interface with glassmorphism styling, dark/light modes, and seamless responsiveness across desktop, tablet, and mobile browsers.
* **Security & Session Isolation**: Enhances user trust through secure JWT-based authentication, session management, and password encryption using bcryptjs.
* **Cross-Workspace Fusion**: Supports flexible workspace collaboration allowing separate teams to fuse their workspace and resources seamlessly.

---

## 1.6 TARGET USE CASES

* **Students & College Groups**: Students organizing fests, trips, hackathons, or study groups who need a shared platform to plan, coordinate tasks, and split expenses effortlessly.
* **Friend Groups & Trip Planners**: Friends planning vacations who require centralized chat, shared media albums, and expense ledgers.
* **Corporate Teams & Professionals**: Office teams and remote professionals collaborating on projects who need task boards, shared notes, and real-time communication tools.
* **Event Organizers**: Committees planning reunions, alumni meets, weddings, or community activities requiring structured member coordination.
* **Hackathon & Competition Teams**: Developers requiring fast task assignment, collaborative note editing, and group communication.
* **Startup & Project Teams**: Small startup teams working on shared goals who need integrated planning, budgeting, and progress tracking tools.
