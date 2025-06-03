## Project Plan: Unified API Gateway for Vitality via AWS AppSync (BFF Implementation)

* **Project Name:** Unified API Gateway for Vitality via AWS AppSync (BFF Implementation)
* **Project Lead(s):** TBD (To Be Determined)
* **Executive Summary:**
    This project outlines the development of a Backend-for-Frontend (BFF) layer utilizing AWS AppSync to serve as a unified GraphQL interface over the existing **Vitality** platform's complex REST API architecture. The primary intent is to consolidate disparate REST endpoints, simplify data fetching for client applications, and provide a flexible API layer tailored to frontend needs without overhauling the underlying legacy **Vitality** services immediately. This initiative will involve designing a GraphQL schema, implementing resolvers primarily using the `APPSYNC_JS` runtime to interact with the existing **Vitality** REST APIs (performing transformations as needed), and deploying the AppSync service using AWS CDK on the Composite Application Pipeline. This approach will enable a gradual migration of API consumers to the new GraphQL endpoint using the Strangler Fig pattern, ultimately improving developer experience, API performance for clients, and architectural agility for the **Vitality** ecosystem.
* **Objectives:**
    * To design and implement a robust AWS AppSync GraphQL API that acts as a BFF, consolidating access to multiple underlying **Vitality** REST API services.
    * To define a unified GraphQL schema that is intuitive for frontend developers and tailored to their data consumption patterns when interacting with **Vitality** data.
    * To implement resolvers, primarily using the `APPSYNC_JS` runtime, that efficiently fetch data from existing **Vitality** REST APIs (hosted on Lambda and ECS Fargate via HTTP endpoints), perform necessary transformations using utilities like `util.transform`, and map responses to the GraphQL schema.
    * To enable data modification capabilities against the **Vitality** platform through GraphQL mutations that securely interact with the underlying **Vitality** REST APIs, again primarily via `APPSYNC_JS` resolvers.
    * To deploy the entire AppSync service (schema, resolvers, data sources, functions) as a monolith repository using AWS CDK on the Composite Application Pipeline.
    * To establish a strategy for migrating existing API consumers from direct **Vitality** REST API calls to the new AppSync GraphQL endpoint using the Strangler Fig pattern.
    * To improve API discoverability and reduce the complexity for client applications when interacting with **Vitality** backend services.
    * To lay a foundation for potential future integration into a larger supergraph or Data Product Inventory.
* **Justification:**
    The existing **Vitality** complex REST API architecture often presents challenges for frontend development:
    1.  **Multiple Round Trips & Over/Under-fetching:** Clients may need to call numerous REST endpoints to gather all required **Vitality** data for a single view.
    2.  **Tight Coupling:** Frontends become tightly coupled to the specific structure and endpoints of **Vitality** backend REST APIs.
    3.  **Inconsistent Data Formats:** Different **Vitality** REST services might return data in varying formats.
    4.  **Discovery & Documentation:** Navigating a multitude of REST endpoints for **Vitality** can be cumbersome.
    A GraphQL BFF layer with AWS AppSync directly addresses these by providing a single endpoint where clients can request exactly the **Vitality** data they need in a consistent format.
* **Scope & Deliverables:**
    * **In Scope:**
        * Design and definition of the AppSync GraphQL schema for **Vitality** data.
        * Implementation of AppSync Data Sources (primarily HTTP Data Sources pointing to existing **Vitality** REST API endpoints on Lambda/ECS Fargate).
        * Development of AppSync Resolvers using the `APPSYNC_JS` runtime (request/response mapping templates with JavaScript) to:
            * Call existing **Vitality** REST APIs via their HTTP endpoints.
            * Perform data transformations (using `util.transform` and other `APPSYNC_JS` utilities).
            * Handle business logic for queries and mutations.
        * AWS Lambda Data Sources will be considered as a secondary option if `APPSYNC_JS` proves insufficient for highly complex transformations or logic not suited to its runtime.
        * Setup of AWS AppSync configurations: authentication/authorization mechanisms, logging, caching (if applicable for MVP).
        * Full deployment of the AppSync API using AWS CDK in a monolithic repository via the Composite Application Pipeline.
        * Documentation for the GraphQL schema and guidance for API consumers interacting with **Vitality** via GraphQL.
        * A documented strategy and initial PoC for migrating one or two pilot client features/services (consuming **Vitality** data) to use the new GraphQL endpoint.
    * **Out of Scope:**
        * Complete migration of *all* existing API consumers to GraphQL within this project's initial timeframe.
        * Fundamental re-architecture or rewrite of the existing underlying REST API services.
        * Implementation of a full Supergraph federation solution (though schema design should be mindful of future possibilities).
        * Building new frontend applications (focus is on the BFF layer itself).
* **Key Features:**
    * GraphQL API Endpoint (AWS AppSync).
    * Unified, Client-Centric GraphQL Schema for **Vitality** data.
    * `APPSYNC_JS` Runtime Resolvers for **Vitality** REST API interaction and data transformation.
    * GraphQL Mutations for data modification against **Vitality** services via `APPSYNC_JS` resolvers.
    * CDK-Managed Infrastructure-as-Code for AppSync.
    * Deployment via Composite Application Pipeline.
    * Documented Strangler Fig Migration Strategy.
* **Business Requirements (Epics & Stories):**
    * **Epic 1: AppSync Foundation & Schema Design**
        * *Goal:* To establish the core AWS AppSync infrastructure using CDK, define the initial GraphQL schema based on frontend needs for **Vitality** data and existing **Vitality** REST API capabilities, and set up basic deployment through the Composite Application Pipeline.
        * User Story 1.1 (API Architect/DevTeam): As the API Development Team, I need to initialize a new AWS CDK project for managing the AppSync GraphQL API, including schema definition files, resolver templates, and IAM role configurations.
        * User Story 1.2 (API Architect/DevTeam): As the API Development Team, I need to analyze existing **Vitality** REST APIs and collaborate with frontend teams to design an initial, client-centric GraphQL schema (types, queries, mutations) that addresses key data requirements for 1-2 pilot frontend features/views consuming **Vitality** data.
            * *Technical Detail:* Schema should be modular (e.g., broken into logical `.graphql` files), use clear naming conventions, and define types that aggregate data from multiple REST sources if needed by clients. Consider input types for mutations and filter arguments for queries.
        * User Story 1.3 (DevOps/DevTeam): As the Development Team, I need to configure the CDK application to deploy a basic AppSync API (with the initial schema and placeholder resolvers) to a development environment using the Composite Application Pipeline.
        * User Story 1.4 (API Architect/DevTeam): As the API Development Team, I need to choose and configure an appropriate default authorization mode for the AppSync API (e.g., API Key for initial dev/testing, AWS IAM for internal services, or Amazon Cognito User Pools / OIDC if end-user auth is involved).
            * *Technical Detail:* AppSync supports multiple auth modes. API Key is simplest for initial dev. IAM is good for server-to-server. Cognito/OIDC for user-facing apps. Multiple auth modes can be configured on a single API.
    * **Epic 2: Query Implementation with REST API Integration & Transformation using `APPSYNC_JS`**
        * *Goal:* To implement GraphQL queries that fetch data from existing **Vitality** REST APIs (on Lambda/ECS Fargate via HTTP), perform necessary data transformations using `APPSYNC_JS` resolvers, and map it to the defined GraphQL schema.
        * User Story 2.1 (Backend Developer): As a Backend Developer, I need to configure AppSync HTTP Data Sources in CDK, pointing to the existing HTTP endpoints of the **Vitality** REST API services (hosted on Lambda/ECS Fargate).
        * User Story 2.2 (Backend Developer): As a Backend Developer, I need to write `APPSYNC_JS` resolver logic (request and response mapping templates with JavaScript) to call the configured HTTP Data Sources (i.e., **Vitality** REST APIs) based on incoming GraphQL query arguments.
            * *Technical Detail:* Use `util.http.get()/post() etc.` to make calls. Map GraphQL arguments to REST API path/query parameters or request bodies.
        * User Story 2.3 (Backend Developer): As a Backend Developer, within the `APPSYNC_JS` response mapping template, I need to implement logic using `util.transform` and other JavaScript capabilities to transform the JSON responses from **Vitality** REST APIs into the structure required by the GraphQL schema. This includes data shaping, field mapping, null handling, and potentially combining results if the request template called multiple sources (though preferably one HTTP call per resolver if possible, or orchestrate in a single Lambda Data Source if truly complex).
        * User Story 2.4 (Backend Developer): As a Backend Developer, I need to attach these `APPSYNC_JS` resolvers to the relevant fields in the GraphQL Query type using CDK.
        * User Story 2.5 (Backend Developer): As a Backend Developer, I need to implement robust error handling within `APPSYNC_JS` resolvers to manage failures from downstream **Vitality** REST APIs and return appropriate GraphQL errors (e.g., using `$util.error()` or `$util.appendError()`).
    * **Epic 3: Mutation Implementation & Data Modification using `APPSYNC_JS`**
        * *Goal:* To enable data modification capabilities against the **Vitality** platform through the GraphQL API by implementing mutations that securely call the appropriate write-enabling REST API endpoints using `APPSYNC_JS` resolvers.
        * User Story 3.1 (Backend Developer): As a Backend Developer, I need to define GraphQL Mutation types in the schema for operations that modify data (e.g., `createUser`, `updateOrder`).
        * User Story 3.2 (Backend Developer): As a Backend Developer, I need to write `APPSYNC_JS` resolver logic (request and response mapping templates) that, when invoked by AppSync mutations, will make the corresponding state-changing calls (e.g., `POST`, `PUT`, `DELETE` via `util.http`) to the appropriate underlying **Vitality** REST API endpoints.
            * *Technical Detail:* The request template will construct the HTTP request to the **Vitality** API. The response template will process the REST API's response and map it to the GraphQL mutation's response type.
        * User Story 3.3 (Backend Developer): As a Backend Developer, I need to attach these `APPSYNC_JS` resolvers to the GraphQL Mutation fields using CDK, ensuring they use the correct HTTP Data Sources pointing to **Vitality** services.
    * **Epic 4: Strangler Fig Migration Strategy & Pilot Implementation**
        * *Goal:* To define and execute a pilot migration for a small subset of API consumers or frontend features to use the new AppSync GraphQL endpoint, validating the Strangler Fig approach.
        * User Story 4.1 (API Architect/DevTeam): As the API Team, I need to identify 1-2 existing frontend features or internal services that are good candidates for initial migration from direct REST API calls to the new AppSync GraphQL endpoint.
        * User Story 4.2 (Frontend/Consumer Team Lead): As a Consumer Team Lead, I want to refactor the identified pilot features in my application to fetch data from and send mutations to the AppSync GraphQL endpoint instead of the old REST endpoints, with support from the API team.
        * User Story 4.3 (API Architect/DevTeam): As the API Team, I need to document the process, benefits, and potential challenges of migrating to the GraphQL API for other teams to follow (Strangler Fig guidance).
        * User Story 4.4 (API Architect/DevTeam): As the API Team, I need to monitor the performance and error rates for both the AppSync API and the underlying REST APIs during the pilot migration to ensure stability.
    * **Epic 5: Operational Readiness & Documentation**
        * *Goal:* To ensure the AppSync API is operationally sound with adequate logging, monitoring, and to provide comprehensive documentation for consumers and maintainers.
        * User Story 5.1 (DevOps/DevTeam): As the Development Team, I need to configure AppSync logging (e.g., request/response logging, field-level logs to CloudWatch Logs) and set up basic CloudWatch dashboards/alarms for key AppSync metrics (e.g., API calls, errors, latency).
        * User Story 5.2 (API Architect/DevTeam): As the API Team, I need to create comprehensive documentation for the GraphQL schema (using tools like GraphiQL/GraphQL Playground introspection or static site generators), including field descriptions, arguments, and example queries/mutations.
        * User Story 5.3 (DevOps/DevTeam): As the Development Team, I need to document the CDK deployment process, repository structure, and maintenance procedures for the AppSync BFF service.
* **Expected Outcomes (Success Criteria):**
    * Successful deployment of a functional AWS AppSync GraphQL API serving as a BFF for selected pilot features/services.
    * Frontend teams for pilot features report a simplified data fetching experience and a reduction in the number of API calls needed.
    * Lambda resolvers effectively transform data from REST APIs to match the GraphQL schema.
    * GraphQL mutations successfully trigger write operations on underlying REST APIs.
    * The AppSync infrastructure is successfully deployed and managed via AWS CDK through the Composite Application Pipeline.
    * A clear, documented Strangler Fig migration path is established and validated by the pilot.
    * Positive feedback from pilot frontend developers on API usability and performance.
    * Maintainable and well-documented codebase and infrastructure.
* **Level of Effort:**
    * Estimated Team Size: 2 FTE Engineers
    * Estimated Duration: 12 Weeks (1 Quarter)
* **Proposed Roadmap (12 Weeks / 6 Sprints):**
    * **Sprint 1 (Weeks 1-2): Foundation, Schema Design & CDK Setup**
        * Finalize AppSync architecture, auth mode for dev, primary resolver strategy (`APPSYNC_JS` with HTTP Datasources to existing **Vitality** REST endpoints).
        * CDK project setup for AppSync.
        * Design initial GraphQL schema v0.1 for 1-2 pilot queries/types for **Vitality** data.
        * Deploy basic AppSync API shell via Composite Application Pipeline.
    * **Sprint 2 (Weeks 3-4): Implement Pilot Queries with `APPSYNC_JS` & HTTP Datasources**
        * Configure HTTP Datasources in AppSync for relevant **Vitality** REST API endpoints.
        * Develop `APPSYNC_JS` resolver functions (request/response templates) for pilot GraphQL queries, including REST API calls via `util.http` and basic data transformation with `util.transform`.
        * Unit test resolver logic. Initial integration testing of pilot queries.
    * **Sprint 3 (Weeks 5-6): Implement Pilot Mutations with `APPSYNC_JS` & Refine Transformations**
        * Design GraphQL mutations for 1-2 pilot write operations against **Vitality**.
        * Develop `APPSYNC_JS` resolver functions for these mutations, making calls to **Vitality** REST API POST/PUT/DELETE endpoints via `util.http`.
        * Refine `util.transform` usage and other transformation logic in query resolvers.
    * **Sprint 4 (Weeks 7-8): Advanced Schema Features, Error Handling & Logging**
        * Expand schema with more complex types, relationships, and arguments (filters, pagination).
        * Implement robust error handling in Lambda resolvers and mapping to GraphQL errors.
        * Configure AppSync logging to CloudWatch and set up basic monitoring dashboards/alarms.
    * **Sprint 5 (Weeks 9-10): Strangler Fig Pilot & Consumer Onboarding**
        * Work with one pilot frontend/consumer team to integrate with the new GraphQL queries/mutations.
        * Develop initial schema documentation and consumer guides.
        * Gather feedback from pilot consumers and iterate on schema/resolvers.
        * Document the Strangler Fig migration process based on pilot experience.
    * **Sprint 6 (Weeks 11-12): Finalize Documentation, Operational Polish & Handover Prep**
        * Complete comprehensive schema and operational documentation.
        * Conduct performance testing and optimize resolvers if needed.
        * Refine CDK deployment scripts for stability and best practices.
        * Knowledge transfer session and preparation for wider rollout/maintenance.
* **Technical Design & Considerations:**
    * **Architecture:**
        * **AWS AppSync:** Core GraphQL managed service.
        * **AWS Lambda:** Primary compute for resolvers requiring data transformation, business logic, or orchestration of calls to multiple REST APIs. Written in Node.js or Python typically.
        * **AWS CDK:** Infrastructure as Code tool for defining and deploying AppSync, Lambda, IAM roles, etc., within a monolithic repository structure.
        * **Composite Application Pipeline:** CI/CD mechanism for deploying the CDK application.
        * **Existing REST APIs:** The datasources AppSync will be fronting. Their location (public, VPC) will influence AppSync/Lambda networking.
    * **Resolver Interaction Options & Data Transformation (Updated Strategy):**
        * **`APPSYNC_JS` Runtime with HTTP Data Sources (Primary Strategy):**
            * This will be the default approach for both queries and mutations.
            * AppSync HTTP Data Sources will be configured to point to your existing **Vitality** REST API endpoints (hosted on Lambda/ECS Fargate).
            * Resolvers written in `APPSYNC_JS` (VTL request/response templates with embedded JavaScript) will:
                * For Queries: Use `$util.http.get()`, `$util.http.post()` (if using POST for queries with complex bodies), etc., in the request template to call the **Vitality** REST endpoint. The response template will use `$util.transform. toepassing()`, general JavaScript logic, and other `$util` functions to reshape the REST API's JSON response into the GraphQL schema structure. This directly addresses the need for "complex operations on queries."
                * For Mutations: Use `$util.http.post()`, `$util.http.put()`, `$util.http.delete()` in the request template to call the appropriate **Vitality** REST endpoint. The response template will map the result back to the GraphQL mutation's response type.
            * This approach is lightweight, performs well for many scenarios, and keeps transformation logic within the AppSync service configuration.
        * **AWS Lambda Data Sources (Secondary/Fallback Option):**
            * Consider using an AWS Lambda Data Source (where AppSync invokes a separate Lambda function you write) only if:
                1.  **Highly Complex Orchestration:** A single GraphQL field requires data from *many* different **Vitality** REST endpoints, and the logic to call them (perhaps conditionally or in parallel) and then combine/transform their results is too complex or stateful for `APPSYNC_JS`.
                2.  **CPU-Intensive Transformations:** The transformation logic itself is very CPU-intensive and would benefit from the more extensive compute environment of Lambda.
                3.  **External Libraries:** You need to use specific external libraries for transformation or integration that are not available in the `APPSYNC_JS` sandboxed environment.
                4.  **VPC Access Complexity (Edge Case):** If accessing **Vitality** REST APIs within a VPC proves significantly easier or more performant via a Lambda function within that VPC, compared to configuring AppSync's HTTP data source with VPC access (e.g., via a private API integration or AppSync VPC endpoints).
            * If a Lambda resolver is used, it will contain the logic to call the target **Vitality** REST APIs (via their HTTP endpoints using standard HTTP client libraries in Node.js/Python etc.) and perform the transformations.
    * **Strangler Fig Pattern Implementation:**
        * New GraphQL endpoint (AppSync) is introduced alongside existing REST APIs.
        * Client applications (or specific features within them) are incrementally updated to call the AppSync GraphQL endpoint instead of direct REST calls.
        * The AppSync resolvers will, in turn, call the original REST APIs.
        * As more features migrate, traffic to old REST endpoints diminishes.
        * Eventually, old REST endpoints can be decommissioned *if all their functionality is covered by GraphQL and all clients are migrated*.
        * No complex routing at an API Gateway level is strictly necessary for the Strangler Fig itself; the client makes the choice of which endpoint to call.
    * **CDK Structure:**
        * Monolithic CDK app deploying the AppSync API, all Lambda resolvers, IAM roles, and data source configurations.
        * Stack per environment (dev, staging, prod).
        * Organize Lambda code within the CDK project structure.
    * **Security:**
        * Choose appropriate AppSync authorization mode(s): API Key (dev/test), IAM (backend services), Cognito User Pools/OIDC (end-user apps). Enforce least privilege for Lambda resolver IAM roles.
        * Securely manage credentials for REST APIs called by Lambda resolvers (e.g., using AWS Secrets Manager).
    * **Schema Design:**
        * Design from the client's perspective.
        * Use clear, consistent naming. Ensure modularity (break into multiple `.graphql` files imported by CDK).
        * Consider pagination, filtering, and sorting arguments for list types.
        * Keep future supergraph integration in mind by defining clear service boundaries within the schema where possible, even if it's a monolith now.
    * **Caching:** Leverage AppSync's server-side caching for frequently accessed, non-volatile data to reduce calls to Lambda resolvers/REST APIs and improve latency.
* **Non-functional Requirements:**
    * **Performance:** AppSync response times should be optimized. Lambda resolver execution time is critical. Consider cold start impact for Lambdas and mitigation (provisioned concurrency if necessary for P99 latency).
    * **Scalability:** AppSync and Lambda scale automatically. Ensure underlying REST APIs can handle potential increased load concentrated through the BFF.
    * **Reliability:** High availability of the AppSync service. Robust error handling in resolvers.
    * **Security:** Proper authentication and authorization for AppSync endpoint and secure calls to downstream services.
    * **Maintainability:** Well-structured CDK code, clear Lambda resolver logic, comprehensive schema documentation.
    * **Observability:** Detailed logging and monitoring via CloudWatch for AppSync API metrics, Lambda resolver metrics, and errors.
* **Stretch Goals:**
    * Implement AppSync server-side caching for frequently accessed queries.
    * Integrate with AWS X-Ray for end-to-end tracing through AppSync and Lambda resolvers to downstream REST APIs.
    * Develop a more sophisticated alerting mechanism based on AppSync metrics (e.g., high P90 latency, increased error rates).
    * Create a "developer portal" or enhance GraphiQL/Playground with more detailed examples and usage guides for the new GraphQL API.
    * Begin design considerations for federating this AppSync API as a subgraph in a future Apollo Federation setup if the "Data Product Inventory" initiative moves towards a supergraph.
* **Conclusion (Considerations, Assumptions, and Outro):**
    * **Considerations:**
        * Performance of underlying REST APIs will directly impact AppSync performance; this BFF doesn't inherently fix slow backends but can optimize data fetching patterns for clients.
        * Complexity of data transformations in Lambda resolvers needs careful management.
        * Change management and communication with API consumer teams are crucial for successful adoption and migration.
        * Cost implications of AppSync, Lambda, and potentially increased load on REST APIs.
    * **Assumptions:**
        * Existing REST APIs are stable and their contracts are well-understood.
        * Access to deploy resources (AppSync, Lambda, IAM) via CDK and Composite Application Pipeline is available.
        * Frontend/consumer teams are willing to participate in the pilot and adopt the new GraphQL API.
        * Necessary credentials and network access for Lambda resolvers to call existing REST APIs can be securely configured.
    * **Outro:** This project to implement a Unified API Gateway using AWS AppSync will serve as a critical step in modernizing Capital One's API landscape. By creating a flexible, client-centric GraphQL BFF, we can significantly improve developer experience for API consumers, enhance frontend performance, and enable more agile evolution of both client applications and backend services. The structured approach using CDK and the Strangler Fig pattern ensures a manageable, scalable, and robust implementation.

