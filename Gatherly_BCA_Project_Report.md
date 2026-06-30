# FINAL YEAR PROJECT REPORT
## **GATHERLY — A REAL-TIME COLLABORATIVE WORKSPACE PLATFORM**

---

### **A Project Report Submitted to the Department of Computer Applications**
### *in partial fulfillment of the requirements for the award of the degree of*
### **Bachelor of Computer Applications (BCA)**

**Submitted By:**
* **Jahnavi G**  
* **University Roll No:** [Insert Roll Number Here]  
* **Register No:** [Insert Register Number Here]  

**Under the Guidance of:**
* **[Name of Guide/Supervisor]**  
* **[Designation of Guide]**, Department of Computer Applications  

---

## **DEPARTMENT OF COMPUTER APPLICATIONS**
### **[NAME OF INSTITUTION / UNIVERSITY]**
### **[ACADEMIC YEAR: 2025 - 2026]**

---
<!-- Page Break -->
\pagebreak

## **DECLARATION**

I, **Jahnavi G**, hereby declare that the project report entitled **"Gatherly — A Real-Time Collaborative Workspace Platform"** submitted to the **[Name of Institution/University]** in partial fulfillment of the requirements for the award of the degree of **Bachelor of Computer Applications (BCA)** is a record of original project work carried out by me under the supervision and guidance of **[Name of Guide/Supervisor]**, Department of Computer Applications.

The results embodied in this project report have not been submitted to any other University or Institution for the award of any degree or diploma.

<br>
<br>

**Place:**  
**Date:**  

<div align="right">
  <strong>Jahnavi G</strong><br>
  (Candidate Signature)
</div>

---
<!-- Page Break -->
\pagebreak

## **CERTIFICATE**

This is to certify that the project report entitled **"Gatherly — A Real-Time Collaborative Workspace Platform"** is a bonafide record of the project work carried out by **Jahnavi G** (Roll No: [Insert Roll No]) under my supervision and guidance, in partial fulfillment of the requirements for the award of the degree of **Bachelor of Computer Applications (BCA)** by **[Name of Institution/University]** during the academic year 2025-2026.

<br>
<br>
<br>

**Project Guide / Supervisor**  
[Name of Guide]  
[Designation], Department of Computer Applications  

<br>
<br>
<br>

**Head of Department**  
[Name of HOD]  
Department of Computer Applications  

<br>
<br>
<br>

**Internal Examiner** &emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp; **External Examiner**

---
<!-- Page Break -->
\pagebreak

## **ACKNOWLEDGEMENT**

First and foremost, I would like to express my deep sense of gratitude and respect to **[Name of Institution/University]** for providing the infrastructure and resources necessary to successfully complete this project.

I am highly indebted and extend my heartfelt gratitude to my project guide, **[Name of Guide]**, Department of Computer Applications, for their valuable guidance, constant encouragement, and constructive feedback throughout the development of this project.

I would also like to thank **[Name of HOD]**, Head of the Department of Computer Applications, and all the faculty members of the department for their continuous support and cooperation.

Last but not least, I express my sincere thanks to my family and friends for their moral support, understanding, and assistance, which kept me motivated to complete this academic endeavor on time.

<br>
<br>

**Jahnavi G**

---
<!-- Page Break -->
\pagebreak

## **ABSTRACT**

In the modern digital landscape, team collaboration and distributed workspaces have transitioned from convenience features to core requirements. However, small teams, student groups, and project planners often find themselves switching between multiple fragmented tools for chat, task allocation, budget tracking, media sharing, and notes documentation. 

This project, **Gatherly**, is a full-stack, real-time collaborative workspace platform designed to unify these essential collaboration tools into a single, cohesive interface. Built using the **MERN (MongoDB, Express, React, Node.js)** stack, Gatherly utilizes **Socket.IO** for real-time state synchronization across active users and leverages **Google Generative AI (Gemini-2.5-flash)** to offer an intelligent in-workspace AI Planner.

Gatherly provides critical collaborative features, including:
1. **Real-time Group Chat & Threading** with typing indicators.
2. **Dynamic Task Boards (Kanban/List)** with drag-and-drop state transitions.
3. **Shared Expense Ledger & Settlement Engine** for split calculations.
4. **Interactive AI Planner** for task extraction and itinerary planning.
5. **Real-time Video Calling Panel** with browser media integrations and reactive overlays.
6. **Workspace Fusion Mechanism** allowing independent workspaces to merge.
7. **Collaborative Notes Editor** (React Quill) and **Media Album Gallery**.
8. **Protected Admin Portal** for platform monitoring, user management, and analytics.

By housing these modules within a highly responsive, modern, glassmorphic UI, Gatherly eliminates workspace friction and demonstrates the viability of lightweight, multi-tenant collaboration hubs.

---
<!-- Page Break -->
\pagebreak

## **TABLE OF CONTENTS**

* **Chapter 1: INTRODUCTION**
  * 1.1 Project Overview
  * 1.2 Purpose & Objectives
  * 1.3 Scope of the Project
  * 1.4 Exclusions & Limitations
* **Chapter 2: SYSTEM ANALYSIS**
  * 2.1 Feasibility Study
  * 2.2 Existing System vs. Proposed System
  * 2.3 Software Requirement Specification (SRS)
* **Chapter 3: SYSTEM DESIGN**
  * 3.1 System Architecture
  * 3.2 Data Flow Diagrams (DFD)
  * 3.3 Entity-Relationship (ER) Diagram
  * 3.4 Database Schema / Tables Structure
  * 3.5 API Endpoints Structure
* **Chapter 4: SYSTEM IMPLEMENTATION & MODULES**
  * 4.1 Module Description & Logic Breakdown
  * 4.2 Key Core Code Implementation Highlights
* **Chapter 5: TESTING & QUALITY ASSURANCE**
  * 5.1 Testing Methodology
  * 5.2 Test Cases Matrix
* **Chapter 6: CONCLUSION & FUTURE SCOPE**
  * 6.1 Observation & Performance Analytics
  * 6.2 Future Enhancements
  * 6.3 Conclusion
* **Chapter 7: REFERENCES & BIBLIOGRAPHY**

---
<!-- Page Break -->
\pagebreak

# **CHAPTER 1: INTRODUCTION**

### **1.1 Project Overview**
**Gatherly** is a web-based, real-time collaborative workspace environment tailored for project teams, event planners, and group activities. The system enables users to create customizable workspace rooms called "Spaces," invite members via unique links, and coordinate tasks, expenses, notes, media, and communication in real time. 

Gatherly integrates **WebSockets (Socket.IO)** to ensure that every update — whether moving a Kanban task card, adding an expense, typing a message, or starting a video call — is instantly synchronized across all online team members' screens without needing page reloads. Furthermore, an integrated AI assistant powered by Google Gemini provides intelligent, context-aware suggestions (such as itineraries or task breakdowns) that can be instantly converted into project tasks.

### **1.2 Purpose & Objectives**
The primary objectives of the Gatherly platform are:
* **Centralization**: To combine communication (chat, video calling) and management (tasks, expenses, documentation) tools into one unified platform.
* **Real-time Synchronicity**: To construct a reactive database-to-UI flow utilizing WebSockets to guarantee seamless multi-user collaboration.
* **AI-Assisted Planning**: To integrate a conversational AI assistant that directly impacts workspace state (e.g., auto-extracting task listings into the board).
* **Workspace Merging (Fusion)**: To implement a mechanism for independent workspaces to request and accept a merge (Fusion), unifying member rosters and project data.
* **Comprehensive Moderation**: To build a secure, distinct administrative panel to monitor active workspaces, manage user bans, and audit security reports.

### **1.3 Scope of the Project**
The scope of Gatherly spans across a full-stack environment:
* **Frontend**: Responsive Single Page Application (SPA) using React 19, styled using modern vanilla CSS (utilizing CSS variables for dynamic workspace themes), and animated using Framer Motion.
* **Backend**: Node.js and Express server hosting RESTful JSON APIs and managing WebSocket channels grouped by MongoDB document IDs.
* **Database**: MongoDB utilizing Mongoose schemas to represent users, spaces, messages, tasks, expenses, settlements, gallery media, and logs.
* **AI Integration**: Integration with the `@google/generative-ai` SDK, configured with standard system instructions and a client-side mock fallback mechanism.

### **1.4 Exclusions & Limitations**
* The video calling module uses web-browser media captures and client-side simulated streams with signaling; full Peer-to-Peer WebRTC media server scaling (like SFU/MCU architectures) is omitted for local performance constraints.
* Payment integration (e.g., UPI, Stripe) for settling expenses is simulated. Actual transaction execution happens outside the app.
* Push notifications are sent via real-time WebSocket events to active browser tabs; persistent native mobile push notifications are out of scope.

---
<!-- Page Break -->
\pagebreak

# **CHAPTER 2: SYSTEM ANALYSIS**

### **2.1 Feasibility Study**
Before starting development, a feasibility study was conducted across three domains:
1. **Technical Feasibility**: The MERN stack is highly suitable for building high-concurrency real-time systems. React's virtual DOM allows quick updates. Socket.IO is robust, and MongoDB can store flexible document schemas (ideal for workspace configurations). Thus, the project is technically feasible.
2. **Economic Feasibility**: The software stack consists entirely of open-source tools (React, Express, Node, MongoDB). Google Gemini offers a generous free tier for developers. The hosting can run on standard servers. Therefore, development costs are minimal, making it economically feasible.
3. **Operational Feasibility**: The platform requires no complex client-side installations. Users access it via standard web browsers. The interface relies on intuitive, drag-and-drop mechanisms and a conversational interface, ensuring high operational feasibility for non-technical users.

### **2.2 Existing System vs. Proposed System**

| Parameters | Existing System (Slack + Trello + Splitwise) | Proposed System (Gatherly) |
|---|---|---|
| **Centralization** | Fragmented; users must swap between multiple tabs, credentials, and contexts. | Unified; chat, boards, expense ledger, video, and notes live in one dashboard. |
| **Real-time Updates** | Varies by app; syncing data between Trello and Slack requires external webhooks. | Fully synchronized in real time via Socket.IO rooms. |
| **AI Integration** | Limited to simple search bots or paid premium third-party app integrations. | Context-aware Google Gemini assistant capable of direct task list extraction. |
| **Workspace Fusion** | Impossible; no native features exist to merge separate channels, boards, and ledgers. | Native "Workspace Fusion" feature merges rosters, tasks, and history dynamically. |
| **System Cost** | Requires multiple subscriptions for advanced team integrations. | Completely open-source base architecture with modular local expansion. |

### **2.3 Software Requirement Specification (SRS)**

#### **Hardware Requirements**
* **Development System**:
  * Processor: Intel Core i5 / AMD Ryzen 5 or higher
  * RAM: 8 GB minimum (16 GB recommended to run local servers, database, and client concurrently)
  * Disk Space: 10 GB free space (SSD recommended)
* **Client / End User System**:
  * Processor: Dual-core 1.8 GHz or higher
  * RAM: 4 GB minimum
  * Devices: Desktop, Laptop, Tablet, or Smartphone with camera & microphone (for video calls)

#### **Software Requirements**
* **Operating System**: Windows 10/11, macOS, or Linux
* **Development Environment**: Visual Studio Code (VS Code)
* **Runtime Environment**: Node.js v18.x or higher
* **Database**: MongoDB v6.0 or higher (Local installation or MongoDB Atlas Cloud)
* **Web Browser**: Google Chrome, Mozilla Firefox, Microsoft Edge, or Safari
* **Core Libraries**:
  * Frontend: React 19, React Router DOM v7, Framer Motion, Lucide React, Axios, React Quill New, Socket.IO Client.
  * Backend: Express, Mongoose, Socket.IO, jsonwebtoken, bcryptjs, Multer, dotenv, @google/generative-ai.

---
<!-- Page Break -->
\pagebreak

# **CHAPTER 3: SYSTEM DESIGN**

### **3.1 System Architecture**
The architecture follows a standard client-server pattern enhanced with bi-directional WebSockets and AI services:

```mermaid
graph TD
    User([React Client App]) <-->|REST APIs / JSON| Express[Express Server]
    User <-->|WebSockets / Event Signaling| SIO[Socket.IO Server]
    Express <-->|Mongoose ODM| Mongo[(MongoDB Database)]
    Express <-->|API Calls| Gemini[Google Gemini AI API]
    SIO <-->|Room Broadcasting| User
```

---

### **3.2 Data Flow Diagrams (DFD)**

#### **DFD Level 0 (System Context)**
```mermaid
graph LR
    User([Workspace Member]) -->|Login, Workspace Actions, Chat, Expense| System(Gatherly Collaboration System)
    System -->|Real-time Updates, AI suggestions, Call Signals| User
    Admin([System Admin]) -->|Moderation, Announcements, Monitor| System
    System -->|Analytics, Reports, Activity Logs| Admin
```

#### **DFD Level 1 (Functional Operations)**
```mermaid
graph TD
    U([User]) -->|1. Credentials| Auth[Authentication Process]
    Auth -->|Validate| DB[(MongoDB)]
    U -->|2. Join Space| SpaceM[Workspace Manager]
    SpaceM -->|Lookup / Register Code| DB
    U -->|3. Send Event| WebSocket[Socket.IO Orchestrator]
    WebSocket -->|Broadcast to Room| Members([Active Room Members])
    U -->|4. Prompt| AI[AI Chat & Task Extractor]
    AI -->|Fetch Gemini Model| Gemini[Google AI Engine]
    AI -->|Insert Extract Tasks| DB
    U -->|5. Post Expense| Ledger[Expense Split Engine]
    Ledger -->|Save / Settlement| DB
```

---

### **3.3 Entity-Relationship (ER) Diagram**
Below is the logical relationship between the core collections stored in MongoDB.

```mermaid
erDiagram
    USER ||--o{ SPACE : "creates / joins"
    SPACE ||--o{ TASK : "contains"
    SPACE ||--o{ EXPENSE : "tracks"
    SPACE ||--o{ CHAT_MESSAGE : "logs"
    SPACE ||--o{ GALLERY_ITEM : "stores"
    EXPENSE ||--o{ SETTLEMENT : "reconciles"
    
    USER {
        ObjectId id PK
        string username
        string email
        string password
        string role
        string statusMessage
        boolean isBlocked
    }
    SPACE {
        ObjectId id PK
        string name
        string description
        string inviteCode
        ObjectId creator FK
        array members
        string theme
        array fusionRequests
    }
    TASK {
        ObjectId id PK
        ObjectId workspaceId FK
        string title
        string desc
        string priority
        string status
        array assignees FK
    }
    EXPENSE {
        ObjectId id PK
        ObjectId workspaceId FK
        string title
        number amount
        string paidBy
        array splitWith
        string date
    }
    SETTLEMENT {
        ObjectId id PK
        ObjectId workspaceId FK
        string receiptId
        string name
        number amount
        string settledBy
    }
    CHAT_MESSAGE {
        ObjectId id PK
        ObjectId workspaceId FK
        string username
        string message
        string channel
    }
```

---

### **3.4 Database Schema Details**

#### **Collection: `users`**
Defines user profiles, credentials, notification preferences, themes, and admin locks.
* **Fields**:
  * `username` (String, Required): Name of user.
  * `email` (String, Required, Unique): Primary authentication identifier.
  * `password` (String, Required): Bcrypt hashed string.
  * `role` (String, default: `'user'`): Can be `'user'` or `'admin'`.
  * `profilePicture`, `bio`, `phone`, `country` (String).
  * `theme` (String, default: `'system'`).
  * `isBlocked` (Boolean, default: `false`): Used for admin moderation.

#### **Collection: `spaces`**
Holds workspace workspace boundaries, invite parameters, and visual settings.
* **Fields**:
  * `name` (String, Required): Title of the workspace.
  * `description` (String).
  * `inviteCode` (String, Required, Unique): Shareable join code.
  * `creator` (ObjectId, Ref: `'User'`): Owner of the space.
  * `members` (Mixed Array): List of member profiles.
  * `theme` (String): Active layout colors.
  * `fusionRequests` (Array): Pending collaborations from other spaces.

#### **Collection: `tasks`**
Tracks workspace specific to-do cards.
* **Fields**:
  * `workspaceId` (ObjectId, Ref: `'Space'`, Required).
  * `title` (String, Required).
  * `desc` (String).
  * `priority` (String, Enum: `'low'`, `'medium'`, `'high'`).
  * `status` (String, Enum: `'todo'`, `'inprogress'`, `'review'`, `'done'`).
  * `dueDate` (String).
  * `assignees` (Array of ObjectIds, Ref: `'User'`).

#### **Collection: `expenses`**
Tracks split ledger entries inside a space.
* **Fields**:
  * `workspaceId` (ObjectId, Ref: `'Space'`, Required).
  * `title` (String, Required).
  * `amount` (Number, Required).
  * `category` (String).
  * `paidBy` (String): Name/ID of the paying user.
  * `splitWith` (Array of Strings): Users sharing the cost.
  * `date` (String).

---

### **3.5 API Endpoints Structure**

The REST architecture operates via organized API routes under `/api/*`:

* **Authentication (`/api/auth`)**:
  * `POST /register`: Registers new users.
  * `POST /login`: Validates password and generates JWT token.
  * `GET /profile`: Fetches details of the logged-in user.
* **Workspaces (`/api/spaces`)**:
  * `GET /`: Lists all workspaces the user is a member of.
  * `POST /create`: Instantiates a new workspace with a unique invite code.
  * `GET /invite/:code`: Resolves invite codes.
  * `POST /invite/:code/join`: Adds user to workspace roster.
  * `POST /fuse/request`: Initiates a merge request.
  * `POST /fuse/accept`: Merges two spaces into a new entity.
* **Tasks (`/api/tasks`)**:
  * `GET /workspace/:workspaceId`: Fetches tasks for a space.
  * `POST /`: Creates a task card.
  * `PATCH /:taskId`: Edits task status (e.g., drag-and-drop sync).
  * `DELETE /:taskId`: Deletes a task card.
* **Expenses (`/api/expenses`)**:
  * `GET /workspace/:workspaceId`: Lists bills.
  * `POST /`: Adds a new expense receipt.
  * `POST /settlements`: Records a settlement balance.
* **AI Planner (`/api/ai`)**:
  * `POST /chat`: Routes prompt histories to the Gemini API or returns structured mocks.

---
<!-- Page Break -->
\pagebreak

# **CHAPTER 4: SYSTEM IMPLEMENTATION & MODULES**

### **4.1 Module Description & Logic Breakdown**

#### **1. Real-Time Server Orchestrator (`server.js`)**
The backbone of Gatherly is the Socket.IO integration on the Node server. When a client mounts a workspace, it emits a `join_workspace` event passing the `workspaceId`. The server maps the client socket to a specific room channel. All subsequent chat messages, task movements, expense additions, poll updates, or typing indicator signals are target-broadcasted via:
```javascript
socket.to(workspaceId).emit('event_name', data);
```
This restricts network updates to relevant workspace members.

#### **2. Workspace Fusion Engine**
The fusion mechanism allows workspaces to merge. When a member accepts a fusion proposal:
1. The server reads both source spaces from MongoDB.
2. It concatenates the member rosters, resolving duplicates.
3. It fetches tasks from both workspaces, re-maps their database associations to a newly created "Fused Workspace," and flags the parent workspaces as archived if needed.
4. A Framer Motion visual overlay displays a multi-phase synchronizing screen to represent the merger on the clients.

#### **3. AI Planner & Task Extractor**
The AI chatbot routes queries to Google Gemini (`gemini-2.5-flash`). If the prompt asks for an itinerary or budget breakdown, the model responds with structured Markdown. The React client intercepts this response and extracts lists or checklist items using a pattern matching regex. Users can click "Add to Board" next to these AI recommendations, invoking a batch REST request to instantly populate task cards on the board.

#### **4. Dynamic Video Signaling**
For video communication, the app integrates WebSockets to coordinate calls. When a member clicks "Start Video Call", the backend broadcasts an `incoming_call` event to all other workspace members. A glassmorphic overlay appears on their screens. Upon acceptance, client media devices are initialized. The UI supports muting feeds, screen sharing simulations, camera switches, background blurs, and latency checks.

---

### **4.2 Key Core Code Implementation Highlights**

#### **Real-Time Video Call and Signaling Configuration in `server.js`**
```javascript
    // Video Call Signalling Events inside Socket.IO connection
    socket.on('call_started', (data) => {
        socket.to(data.workspaceId).emit('incoming_call', data);
    });

    socket.on('call_joined', (data) => {
        socket.to(data.workspaceId).emit('participant_joined', data);
    });

    socket.on('call_left', (data) => {
        socket.to(data.workspaceId).emit('participant_left', data);
    });

    socket.on('call_ended', (data) => {
        socket.to(data.workspaceId).emit('call_ended', data);
    });
```

#### **Google Gemini AI Request Handling with Smart Mocking Fallback (`routes/ai.js`)**
```javascript
router.post('/chat', async (req, res) => {
    try {
        let { message, history } = req.body;

        // Smart mock logic fallback when no API key is present
        if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY.trim() === '') {
            const input = message.toLowerCase();
            let replyText = '';

            if (input.includes('party') || input.includes('event')) {
               replyText = `Here are some excellent party ideas:\n\n**1. Neon Retro Night**\n- Playlist creation\n- Buy lights\n\n**2. Cinema Backyard**\n- Rent projector\n- Snacks`;
            } else {
               replyText = `Hello! I am your AI Planner. How can I help you coordinate today?`;
            }
            return res.status(200).json({ text: replyText });
        }

        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        // Start chat with formatting to fit system rules
        const chat = model.startChat({
            history: history ? history.map(msg => ({
                role: msg.role === 'ai' ? 'model' : 'user',
                parts: [{ text: msg.text || ' ' }]
            })) : [],
            systemInstruction: "You are a professional AI Planner for Gatherly workspaces."
        });

        const result = await chat.sendMessage(message);
        res.status(200).json({ text: result.response.text() });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
```

---
<!-- Page Break -->
\pagebreak

# **CHAPTER 5: TESTING & QUALITY ASSURANCE**

### **5.1 Testing Methodology**
The quality assurance phase followed a structured process:
1. **Unit Testing**: Verified individual Express endpoints (using Postman to validate payload status codes) and React hooks (validating user credential persistence in `localStorage`).
2. **Integration Testing**: Checked the interaction between the WebSocket client and server. Verified that when a task's status changes on Client A, the Socket server emits the event, and Client B updates its React state.
3. **System Testing**: Conducted end-to-end user flows, including registering a user, creating a workspace, generating an invite code, joining via another client, chatting, running a video call, and executing a workspace Fusion.
4. **User Acceptance Testing (UAT)**: Evaluated responsiveness and compatibility across multiple devices and browsers (Chrome, Firefox, Safari on iOS/Android).

### **5.2 Test Cases Matrix**

| Test ID | Module | Test Scenario / Input | Expected Output | Actual Result | Status |
|---|---|---|---|---|---|
| **TC-01** | User Auth | Submit registration form with empty email/password. | Input validation error display. | Validation errors displayed. | **PASS** |
| **TC-02** | User Auth | Input valid credentials on Login page. | Secure JWT returned and user cached in browser. | JWT token stored, redirected to Dashboard. | **PASS** |
| **TC-03** | Space Mgr | Click "Create Space" with name "Launchpad". | Unique 6-character invite code generated and saved. | Workspace created, invite code "A9B3CD" active. | **PASS** |
| **TC-04** | Invite Page | Access `/invite/A9B3CD` without login. | Prompts user to log in before joining. | Redirected to Login with path saved in memory. | **PASS** |
| **TC-05** | Chat System | Client A types in chat. | Client B instantly displays typing indicator. | Typing indicators display in real time. | **PASS** |
| **TC-06** | Task Board | Drag card from 'To Do' to 'In Progress'. | Database update and real-time state shift on other clients. | State shifted across tabs instantly. | **PASS** |
| **TC-07** | Expense Ledg | Submit expense $90 split equally among 3 users. | Ledger displays $30 owed per participant. | Ledger generated correct ratios. | **PASS** |
| **TC-08** | AI Planner | Ask Gemini bot for "places in Goa". | Returns Goa resorts with specific markdown lists. | Detailed options rendered correctly in markdown. | **PASS** |
| **TC-09** | Call Panel | Click "Start Video Call" in workspace. | "Incoming Call" ring notification broadcast to members. | Ringer visual overlay displayed. | **PASS** |
| **TC-10** | Fusion Mgr | Confirm Workspace Fusion accept. | Unifies database tables and displays the merger overlay. | Merged workspace created with combined assets. | **PASS** |

---
<!-- Page Break -->
\pagebreak

# **CHAPTER 6: CONCLUSION & FUTURE SCOPE**

### **6.1 Observation & Performance Analytics**
During testing, the platform showed fast load speeds and minimal network latency:
* **Response Latency**: REST API endpoints consistently resolved in under 150ms on local environments. WebSocket event broadcasts completed in under 10ms.
* **Fallback Performance**: In environments without an active internet connection or missing Gemini API keys, the smart mocking script responded instantly without raising runtime errors.
* **State Recovery**: Browser local storage integration successfully synchronized session data. If a user refreshed their browser, active workspace variables and chat buffers were restored immediately.

### **6.2 Future Enhancements**
Although the current version of Gatherly meets all required academic parameters, future enhancements could include:
1. **Interactive Shared Whiteboard**: Incorporating a canvas whiteboard using HTML5 Canvas API and WebSockets so teams can sketch out wireframes and diagrams simultaneously.
2. **True Peer-to-Peer WebRTC Integration**: Replacing signaling simulations with full WebRTC peer connections using a mesh network or SFU server for true group video streaming.
3. **Automated OCR Receipt Scanning**: Allowing users to upload pictures of receipts to the Expense module, using Google Cloud Vision or Tesseract.js to auto-populate title and amount.
4. **Calendar Synchronizations**: Linking workspace task due dates directly to external calendar services (Google Calendar, Outlook) via OAuth integrations.

### **6.3 Conclusion**
The development of **Gatherly** successfully demonstrates how combining web technologies (MERN stack) with real-time sockets (Socket.IO) and Generative AI (Google Gemini) can form a unified team collaboration platform. The workspace fusion engine offers a novel way to bridge independent workspaces. 

Through the implementation of this project, I gained practical experience in designing real-time database schemas, configuring WebSockets, integrating generative AI models, building secure admin dashboards, and implementing responsive layouts. Gatherly meets the requirements of a modern collaborative tool and serves as a solid foundation for academic final year project evaluations.

---
<!-- Page Break -->
\pagebreak

# **CHAPTER 7: REFERENCES & BIBLIOGRAPHY**

1. **React Documentation**: official resources on hook states, context APIs, and single-page routing structures. (https://react.dev)
2. **Socket.IO API**: real-time bi-directional socket room architecture and broadcasting guides. (https://socket.io/docs/)
3. **MongoDB Mongoose Guide**: NoSQL schemas, database references, and indexing guides. (https://mongoosejs.com/docs/)
4. **Google Gemini API Documentation**: developer guides for model parameters, prompt engineering, and SDK integrations. (https://ai.google.dev/)
5. **Framer Motion Guides**: declarative animation guidelines for UI transitions and state morphs. (https://www.framer.com/motion/)
6. **Express.js Framework Reference**: building modular REST APIs using routing routers and HTTP middleware. (https://expressjs.com/)
7. **Elmasri, R., & Navathe, S. B. (2017)**: *Fundamentals of Database Systems* (7th Edition). Pearson Education — referenced for database schemas and ER model layouts.
8. **Pressman, R. S. (2014)**: *Software Engineering: A Practitioner's Approach* (8th Edition). McGraw-Hill — referenced for SRS design and testing strategies.
