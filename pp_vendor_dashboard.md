Project Plan: Vendor Health Dashboard

    Project Name: Vendor Management Dashboard
    Project Lead(s): TBD
    Executive Summary: The Vendor Management Dashboard project aims to develop a new, standalone application dedicated to providing comprehensive insights into the performance, health, and Service Level Objectives (SLOs) of critical third-party vendors. While operating with its own backend and repository, the dashboard will visually align with the existing Vitality Platform by leveraging its UI design principles and assets, ensuring a cohesive user experience. The initial focus will be on integrating data from FIS Systematics (mainframe via Ironstream), FIS ConnectWare (SOAP), and FIS Code Connect (API), with a fundamental design emphasis on extensibility to easily onboard new vendors in the future.
    Objectives:
        To develop a centralized dashboard for monitoring Key Performance Indicators (KPIs) and health metrics of strategic third-party vendors.
        To enable proactive identification and (eventually) alerting of vendor performance issues.
        To transform complex, vendor-specific data (e.g., mainframe SMF records) into easily understandable and actionable metrics for a diverse audience.
        To establish a flexible, scalable, and extensible platform architecture capable of integrating data from new vendors with minimal redevelopment effort.
        To implement an abstracted data query layer, allowing for future adaptability to different underlying data sources (e.g., evolving from Observe API to direct Observability Data Lake queries via Presto/Snowflake).
    Justification: Organizations increasingly rely on third-party vendors for critical services. Lack of a centralized, coherent view into vendor performance and health can lead to reactive problem-solving, difficulty in enforcing SLOs, and an inability to quickly assess the impact of vendor issues on internal business processes. This dashboard will provide the necessary visibility to manage vendor relationships more effectively, ensure service quality, and make data-driven decisions regarding vendor dependencies.
    Scope & Deliverables:
        In Scope:
            Development of a standalone application with its own codebase and repository.
            Integration with existing Vitality Platform UI assets and design language.
            Creation of a novel middleware/composition layer using GraphQL.
            Data ingestion from Observe APIs for FIS Ironstream, FIS ConnectWare, and FIS Code Connect metrics.
            Design and implementation of a data transformation capability, specifically for mainframe data, to create an understandable data model.
            Temporary storage (caching) of processed/hot data (e.g., in PostgreSQL/Aurora PostgreSQL for up to 6 months) for dashboarding performance.
            Strategies for accessing historical data (older than 6 months) from the Observability Data Lake.
            Development of a front-end dashboard for vendor selection, metric visualization (time-series charts, scorecards), and filtering.
            Architectural design for extensibility to support new vendors and data sources.
            Design of a data query abstraction layer.
        Out of Scope (for initial 12-week delivery):
            Implementation of alerting features (though the data procured should support future alerting).
            User authentication and authorization details (will assume leverage from Vitality platform or define as a fast-follow).
            Onboarding of vendors beyond FIS Ironstream, ConnectWare, and Code Connect.
    Key Features:
        Centralized Vendor Performance Monitoring.
        Mainframe Data Transformation and Visualization.
        API & SOAP Service Metrics Ingestion.
        Unified GraphQL API for Data Composition.
        Extensible Architecture for New Vendor Onboarding.
        Data Query Abstraction Layer.
        Dashboard with Vendor Selection, Metric Charts, Filtering.
        Integration with Vitality UI/UX.
    Business Requirements (Epics & Stories):
        Epic 1: Data Ingestion and Abstraction Layer
            Goal: To establish a robust and flexible mechanism for procuring data from initial sources (Observe API) and to design for future adaptability to different data backends (Observability Data Lake via Presto/Snowflake).
            User Story 1.1 (System): As a System, I need to connect to the Observe API to retrieve FIS Ironstream data.
            User Story 1.2 (System): As a System, I need to connect to the Observe API to retrieve ConnectWare (SOAP) data.
            User Story 1.3 (System): As a System, I need to connect to the Observe API to retrieve Code Connect (API) data.
            User Story 1.4 (Developer): As a Developer, I need to define an interface (e.g., a set of abstract classes or interfaces) for data retrieval that hides the specifics of the underlying data source.
            User Story 1.5 (Developer): As a Developer, I need to implement a concrete data retrieval module for the Observe API, adhering to the defined abstraction interface.
            User Story 1.6 (System): As a System, I need to handle API authentication, rate limiting, and error responses gracefully when querying Observe.
        Epic 2: Mainframe (FIS Ironstream) Data Processing, Transformation, and Storage
            Goal: To transform raw mainframe data from FIS Ironstream into an understandable format, define a clear data model, and store recent data efficiently in PostgreSQL for dashboarding.
            User Story 2.1 (Data Engineer): As a Data Engineer, I need to analyze the structure of SMF 30 type records (and other relevant mainframe data) received from Observe for FIS Ironstream.
            User Story 2.2 (Data Engineer): As a Data Engineer, I need to define a target data model for mainframe metrics that translates job names, completion codes, and CPU time into understandable application performance metrics.
            User Story 2.3 (System): As a System, I need to implement a transformation processor/service that converts raw Ironstream data (from Observe) into the defined target data model.
            User Story 2.4 (System): As a System, I need to store the transformed mainframe data in a PostgreSQL database, retaining up to 6 months of data for "real-time" dashboard queries.
            User Story 2.5 (System): As a System, I need a mechanism to access mainframe data older than 6 months by querying the Observability Data Lake directly and transforming it in-flight.
        Epic 3: ConnectWare (SOAP) & Code Connect (API) Data Ingestion and Storage
            Goal: To ingest API and SOAP metrics from ConnectWare and Code Connect, correctly identify operations for SOAP, and store recent data efficiently in Aurora PostgreSQL.
            User Story 3.1 (System): As a System, I need to ingest ConnectWare and Code Connect metrics from Observe, including TPS, Error Rates, P95 Response Times, Tx Volume, P95 Latency by Operation, and Errors by Operation.
            User Story 3.2 (System): As a System, when processing ConnectWare SOAP data, I need to inspect the XML payload to extract the specific OPERATION field to differentiate requests.
            User Story 3.3 (System): As a System, I need to store the ConnectWare and Code Connect data (with extracted SOAP OPERATION) in an Aurora PostgreSQL data store, retaining at least 6 months of data.
        Epic 4: Unified GraphQL Composition Layer
            Goal: To provide a flexible, extensible, and unified GraphQL API endpoint for the front-end to consume vendor data from various backend sources and enrich it with metadata.
            User Story 4.1 (Front-End Developer): As a Front-End Developer, I need a GraphQL API to query vendor health data, including metrics and associated metadata.
            User Story 4.2 (Back-End Developer): As a Back-End Developer, I need to implement GraphQL resolvers to fetch transformed mainframe data from its PostgreSQL store.
            User Story 4.3 (Back-End Developer): As a Back-End Developer, I need to implement GraphQL resolvers to fetch ConnectWare/Code Connect data from its Aurora PostgreSQL store.
            User Story 4.4 (Back-End Developer): As a Back-End Developer, I need to implement GraphQL resolvers that can query existing Vitality back-end APIs (e.g., meta-api) to enrich vendor data with mapping information like ASV, LOB, EL, Tech AE, Business AE.
        Epic 5: Vendor Health Dashboard Front-End
            Goal: To create an intuitive and informative user interface, reusing Vitality assets, for visualizing vendor health and performance metrics for the initial set of vendors.
            User Story 5.1 (User): As a User, I want to be able to search for and select a specific vendor (FIS Ironstream, ConnectWare, Code Connect) to view their detailed performance dashboard.
            User Story 5.2 (User): As a User, viewing a vendor's dashboard, I want to see key metrics related to their services (e.g., availability, performance, error rates, transaction volumes) presented as scorecards and time-series charts.
            User Story 5.3 (User): As a User, I want to be able to filter vendor metrics by the type of resource or service they provide (e.g., mainframe components, specific SOAP operations, specific API endpoints) and by time range.
            User Story 5.4 (Developer): As a Developer, I need to integrate UI components and styles from the vitality-ui repository to ensure a consistent look and feel.
        Epic 6: Extensible Architecture Design (Foundational)
            Goal: To design the system's core components (data ingestion, transformation, GraphQL, UI) with extensibility in mind, allowing for the future onboarding of new vendors and their unique data/metrics with minimal code changes. (This epic focuses on the design principles implemented during the initial build for the first three vendors).
            User Story 6.1 (System Architect): As a System Architect, I need to define a process and technical framework (pluggable data connectors, configurable transformations, generic core data model with extensions, modular GraphQL resolvers, template-based UI views) for onboarding new vendor data sources.
    Expected Outcomes (Success Criteria):
        Successful deployment of a dashboard visualizing health and performance for FIS Ironstream, ConnectWare, and Code Connect.
        Positive feedback from initial users on the clarity, usability, and value of the dashboard.
        Demonstrated ability of the GraphQL layer to compose data from multiple sources.
        Successful transformation and presentation of complex mainframe data into understandable metrics.
        The foundational architecture in place clearly supports the future addition of new vendors.
    Level of Effort:
        Estimated Team Size: 2 FTE Engineers
        Estimated Duration: 12 Weeks (1 Quarter)
    Proposed Roadmap (12 Weeks / 6 Sprints):
        Sprint 1 (Weeks 1-2): Project Setup & Core Abstraction Layer
            Setup repository, CI/CD pipeline, development environments.
            Design and implement the initial Data Ingestion Abstraction Layer (Epic 1).
            Define data models for the first three vendors at a high level.
            Setup PostgreSQL and Aurora PostgreSQL instances.
        Sprint 2 (Weeks 3-4): Mainframe Data Ingestion & Transformation
            Implement Observe API connector for FIS Ironstream data (Epic 1).
            Develop and test mainframe data transformation logic (SMF to target model) (Epic 2).
            Implement storage of transformed mainframe data into PostgreSQL (Epic 2).
        Sprint 3 (Weeks 5-6): API/SOAP Data Ingestion & GraphQL Basics
            Implement Observe API connectors for ConnectWare (SOAP) & Code Connect (API) data (Epic 1, Epic 3).
            Implement SOAP OPERATION extraction (Epic 3).
            Store API/SOAP data in Aurora PostgreSQL (Epic 3).
            Setup basic GraphQL server and schema; implement initial resolvers for one data type (Epic 4).
        Sprint 4 (Weeks 7-8): GraphQL Expansion & Metadata Integration
            Complete GraphQL resolvers for all three initial vendor data types (Epic 4).
            Integrate with Vitality meta-api for data enrichment via GraphQL (Epic 4).
            Design basic front-end structure and integrate vitality-ui assets (Epic 5).
        Sprint 5 (Weeks 9-10): Front-End Development & Visualization
            Develop vendor selection and dashboard views (scorecards, basic charts) for the three vendors (Epic 5).
            Implement filtering capabilities (time range, service type) (Epic 5).
            Connect front-end to GraphQL API.
        Sprint 6 (Weeks 11-12): End-to-End Testing, Refinement & Documentation
            Conduct thorough end-to-end testing of data flow, transformations, API, and UI.
            Refine UI/UX based on internal reviews.
            Address performance considerations for dashboard loading.
            Complete technical documentation for architecture, data models, and APIs (supporting Epic 6 design principles).
            Prepare for initial user showcase/feedback.
    Technical Design & Considerations:
        Architecture:
            Standalone application with its own backend (Node.js, Python, or Java) and front-end (React, Angular, or Vue, aligned with Vitality UI).
            Data Ingestion Layer: Abstracted service to fetch data initially from Observe API, designed to later support Presto/Snowflake for Data Lake access.
            Transformation Service: For complex data like mainframe SMF records.
            Caching Layer: PostgreSQL for transformed mainframe data (6 months), Aurora PostgreSQL for API/SOAP metrics (6 months).
            Composition Layer: GraphQL server to unify data from caches and meta-api.
            Front-End: Single Page Application (SPA) consuming the GraphQL API.
        Data Model / Data Processing / Storage:
            Mainframe (FIS Ironstream): Raw SMF records transformed into KPIs like transaction completion rates, batch job durations, CPU utilization per application/job, error rates. Target model inspired by Observe/Splunk Ironstream models but simplified. Stored in PostgreSQL.
            ConnectWare (SOAP) & Code Connect (API): Metrics like TPS, Error Rates, P95 Response Times, Transaction Volume, Latency/Errors by Operation. SOAP OPERATION extracted from XML. Stored in Aurora PostgreSQL.
            Historical Data: Data older than 6 months accessed via direct query to Observability Data Lake, with transformations applied in-flight.
            GraphQL Schema: Designed around a Vendor type, with fields for different metric categories and enriched metadata. DataLoader pattern to be used for efficient data fetching.
        API Design (if applicable):
            A central GraphQL API endpoint will serve all front-end data requirements. Schema designed for intuitiveness and extensibility.
        User Interface (UI) / User Experience (UX):
            Will reuse vitality-ui components, styles, color palettes, typography, and layout grids for consistency.
            Dashboard Design Ideas:
                Vendor Landing Page/Search: Clean search or filterable list of vendors with high-level status.
                Vendor Detail View: Header with vendor name, overall status, contacts (from meta-api). Tabs/sections for service types (Mainframe, SOAP, API). Key metrics scorecards. Time-series charts for P95 Latency, Error Rates, TPS, Volume over selectable time ranges, with comparisons. Tables for detailed errors, slowest operations. Global and section-specific filters. Contextual information on hover, potential deep links to Observe.
        Other Considerations:
            Extensibility: Core design principle. Achieved via pluggable data connectors, configurable transformations, generic core data model with extensions, modular GraphQL, template-based UI.
            Data Query Abstraction: Repository pattern or service layer for data retrieval methods.
    Non-functional Requirements:
        Extensibility: System must be easily extendable to onboard new vendors and data sources with minimal redevelopment.
        Performance: Dashboards must load quickly; queries to underlying data sources and caches must be optimized. Caching strategy is key.
        Maintainability: Codebase should be modular, well-documented, and easy to understand and modify.
        Scalability: The system should scale to handle an increasing number of vendors, data volume, and users.
        Reliability: Data displayed should be accurate and up-to-date as per refresh cycles.
    Stretch Goals:
        Implement basic alerting stubs or design for future alerting based on defined SLOs/thresholds.
        Develop a proof-of-concept for querying historical data directly from the Observability Data Lake via the abstraction layer.
        Onboard one additional, simple vendor to prove the extensibility framework.
    Conclusion (Considerations, Assumptions, and Outro):
        Considerations:
            The initial 6-month caching period needs validation based on query patterns and storage costs.
            Complexity of mainframe data transformation should not be underestimated.
            Performance of in-flight transformation for historical data queries needs monitoring.
        Assumptions:
            Observe APIs for the initial three vendors are stable and provide necessary data fields.
            vitality-ui assets are readily available and usable in a standalone application context.
            Access to Vitality meta-api is available and performant.
            The Observability Data Lake will be accessible for historical data.
            User authentication/authorization can be deferred or will leverage existing Vitality mechanisms with minimal integration effort for this phase.
        Outro: The Vendor Health Dashboard will provide unprecedented, centralized visibility into the performance of critical third-party services. By transforming raw data into actionable insights and building an extensible platform, this project will empower the organization to better manage vendor risk, ensure service quality, and ultimately protect its own business operations.
