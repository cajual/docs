**Project Plan: Vendor Management Dashboard**

**1. Project Overview**

* **1.1. Introduction:**
    The Vendor Management Dashboard will be a new, standalone application designed to provide comprehensive insights into the performance, health, and Service Level Objectives (SLOs) of various third-party vendors. While standalone in its backend and repository, it will leverage the existing Vitality Platform's UI design principles and assets for a seamless user experience, appearing as an integrated part of the Vitality ecosystem. The application will initially focus on FIS Systematics (mainframe via Ironstream), FIS ConnectWare (SOAP), and FIS Code Connect (API) data, with a core design emphasis on extensibility for future vendor onboarding.
* **1.2. Goals:**
    * To provide a centralized dashboard for monitoring key performance indicators (KPIs) and health metrics of critical vendors.
    * To enable proactive identification of vendor performance issues through dashboards and (future) alerts.
    * To translate complex vendor-specific data (e.g., mainframe SMF records) into easily understandable metrics for a broader audience.
    * To establish a flexible and extensible platform capable of integrating data from new vendors with minimal redevelopment.
    * To create an abstracted data query layer that allows for future changes in underlying data sources (e.g., Observe API, Observability Data Lake via Presto/Snowflake).
* **1.3. Scope:**
    * **In Scope:**
        * Development of a standalone application with its own codebase and repository.
        * Integration with existing Vitality Platform UI assets and design language.
        * Development of a novel middleware/composition layer (GraphQL).
        * Data ingestion from Observe APIs for FIS Ironstream, ConnectWare, and Code Connect metrics.
        * Design and implementation of a data transformation capability, particularly for mainframe data.
        * Definition of a custom, understandable data model for vendor metrics.
        * Temporary storage (caching) of processed/hot data (e.g., in PostgreSQL/Aurora PostgreSQL) for dashboarding performance, with strategies for accessing historical data from the Observability Data Lake.
        * Development of a front-end dashboard for vendor selection, metric visualization, and filtering.
        * Design for extensibility to support new vendors and data sources.
        * Design of a data query abstraction layer.
    * **Out of Scope (for this document, as per your instructions):**
        * Definition of project effort, schedule, specific timelines.
        * Risk assessment and mitigation planning.
        * Detailed UI mockups (beyond conceptual ideas).
        * Implementation of alerting features (though the data procured should support future alerting).
        * User authentication and authorization details (assuming leverage from Vitality platform or to be defined separately).

**2. Key Features & Design Pillars (Epics)**

* **Epic 1:** Data Ingestion and Abstraction Layer
* **Epic 2:** Mainframe (FIS Ironstream) Data Processing, Transformation, and Storage
* **Epic 3:** ConnectWare (SOAP) & Code Connect (API) Data Ingestion and Storage
* **Epic 4:** Unified GraphQL Composition Layer
* **Epic 5:** Vendor Health Dashboard Front-End
* **Epic 6:** Extensible Architecture for Vendor Onboarding & Data Modeling

**3. Detailed Breakdown (User Stories / Technical Considerations)**

---

**Epic 1: Data Ingestion and Abstraction Layer**
*Goal: To establish a robust and flexible mechanism for procuring data from initial sources and to design for future adaptability to different data backends.*

* **User Stories / Tasks:**
    * As a System, I need to connect to the Observe API to retrieve FIS Ironstream data.
    * As a System, I need to connect to the Observe API to retrieve ConnectWare (SOAP) data.
    * As a System, I need to connect to the Observe API to retrieve Code Connect (API) data.
    * As a Developer, I need to define an interface (e.g., a set of abstract classes or interfaces in Python/Java/Node.js) for data retrieval that hides the specifics of the underlying data source (Observe API, Presto, Snowflake, etc.).
    * As a Developer, I need to implement a concrete data retrieval module for the Observe API, adhering to the defined abstraction interface.
    * As a System, I need to handle API authentication, rate limiting, and error responses gracefully when querying Observe.
    * As a Developer, I need to design the query parameters for Observe to fetch relevant time windows, metric types, and identifiers for each vendor/service.
    * As a System Architect, I need to document the strategy for evolving the data ingestion layer to support direct queries to an Observability Data Lake (e.g., using Presto, Pola.rs, or Snowflake) in the future, including considerations for connection management, query language differences, and performance.
* **Technical Considerations:**
    * **Abstraction Layer Design:**
        * Employ a repository pattern or a service layer that exposes methods like `get_vendor_metrics(vendor_id, time_range, metric_types)`.
        * The implementation of these methods will initially call the Observe API. Future implementations could target Presto, Snowflake, etc., by simply swapping out the concrete implementation class or configuration.
        * Consider using a configuration-driven approach to specify the active data source and its connection details.
    * **Query Efficiency:** Ensure that queries to Observe are optimized to fetch only necessary data to minimize load and latency.

---

**Epic 2: Mainframe (FIS Ironstream) Data Processing, Transformation, and Storage**
*Goal: To transform raw mainframe data into an understandable format, define a clear data model, and store recent data efficiently for dashboarding.*

* **User Stories / Tasks:**
    * As a Data Engineer, I need to analyze the structure of SMF 30 type records (and other relevant mainframe data) received from Observe.
    * As a Data Engineer, I need to define a target data model for mainframe metrics that is meaningful to non-mainframe engineers (e.g., translating job names, completion codes, CPU time into understandable application performance metrics).
        * *(Consider adapting the Observe team's model or the Splunk data model from Ironstream as a starting point).*
    * As a System, I need to implement a transformation processor/service that converts raw Ironstream data (from Observe) into the defined target data model.
    * As a System, I need to store the transformed mainframe data in a PostgreSQL database.
    * As a System, I need to ensure the PostgreSQL database stores up to 6 months of transformed mainframe data for "real-time" dashboard queries.
    * As a System, I need a mechanism to archive or access mainframe data older than 6 months (likely by querying the Observability Data Lake directly and transforming it in-flight).
    * As a Data Steward, I need to be able to manage and evolve the mainframe data model.
* **Technical Considerations (Caching/Storage for Mainframe Data):**
    * **Data Model:** Focus on key performance indicators like transaction completion rates, batch job durations, CPU utilization per application/job, error rates, resource consumption. This model should align with what business users or application owners care about.
    * **Transformation Logic:** This could be a separate microservice or a library. It should be idempotent if possible (rerunning on the same raw data produces the same transformed output).
    * **Storage Strategy (PostgreSQL for 6 months):**
        * This PostgreSQL instance acts as a "hot cache" or an "operational data store" for recent, frequently accessed data, optimized for dashboard queries.
        * **Why not query the lake every time?** Constant transformation of raw data from the lake for every dashboard request can be computationally expensive and slow, especially for high-frequency dashboard refreshes or many concurrent users.
        * **Avoiding Data Duplication (Conceptual):** You *are* duplicating data by storing it in PostgreSQL, but it's a purposeful duplication for performance. The Observability Data Lake remains the source of truth for raw, long-term historical data. The PostgreSQL data is a derived, aggregated, and transformed subset.
        * **Data Retention & Pruning:** Implement a regular job to purge data older than 6 months from PostgreSQL to manage storage costs and maintain performance.
    * **Historical Data Access (>6 months):**
        * For queries spanning beyond 6 months, the system should bypass the PostgreSQL cache for the older period.
        * The query abstraction layer (Epic 1) would direct these historical queries to the Observability Data Lake (via Presto/Snowflake).
        * The transformation logic (developed for recent data) should be reusable to transform this historical raw data "in-flight" as it's retrieved from the lake.
        * **Temporary Historical Store (if needed):** If in-flight transformation for very large historical datasets proves too slow for certain analytical use cases (not typical dashboards), you *could* consider temporarily staging the results of a large historical query in a separate historical database or even back into a temporary table in PostgreSQL, but this adds complexity. For dashboarding, aim for efficient in-flight transformation or pre-aggregate older data in the lake if possible.
    * **Best Practice Summary:**
        1.  **Source of Truth:** Observability Data Lake for all raw data.
        2.  **Operational/Dashboarding Store:** PostgreSQL for recent (e.g., 6 months) transformed, aggregated data. This improves query speed for dashboards.
        3.  **Transformation:** Centralized transformation logic applicable to both real-time ingestion and historical batch queries.
        4.  **Historical Access:** Query the lake directly for data older than the operational store's window, applying transformations as needed. Avoid long-term storage of transformed historical data unless absolutely necessary for specific, intensive analytical workloads.

---

**Epic 3: ConnectWare (SOAP) & Code Connect (API) Data Ingestion and Storage**
*Goal: To ingest API and SOAP metrics, correctly identify operations for SOAP, and store recent data efficiently.*

* **User Stories / Tasks:**
    * As a System, I need to ingest ConnectWare and Code Connect metrics from Observe, including TPS, Error Rates, P95 Response Times, Tx Volume, P95 Latency by Operation, P95 Latency, and Errors by Operation.
    * As a System, when processing ConnectWare SOAP data, I need to inspect the XML payload to extract the specific `OPERATION` field to differentiate requests.
    * As a System, I need to store the ConnectWare and Code Connect data (no transformation needed initially) in a data store like Aurora PostgreSQL.
    * As a System, I need to ensure this data store retains at least 6 months of data.
    * As a System, I need a mechanism to access ConnectWare/Code Connect data older than 6 months (likely by re-querying Observe or the Observability Data Lake).
* **Technical Considerations (Caching/Storage for API/SOAP Data):**
    * **SOAP Operation Extraction:** This will require an XML parsing step during ingestion before storage.
    * **Storage Strategy (Aurora PostgreSQL for 6 months):**
        * Similar to the mainframe data, this serves as an operational store for fast dashboard queries. Since no transformation is initially required, the structure in Aurora might closely mirror the structure from Observe, plus the extracted SOAP `OPERATION`.
        * **Reducing Duplication:** Again, this is a purposeful, temporary duplication for performance. The Observability Data Lake (or Observe itself for a certain retention period) is the primary source.
        * **Data Retention & Pruning:** Implement regular purging of data older than 6 months.
    * **Historical Data Access (>6 months):**
        * The query abstraction layer should handle fetching older data directly from Observe or the Observability Data Lake. Since no transformation is needed, this might be simpler than mainframe historical access.
    * **Schema Design:** Ensure the schema can efficiently query by operation, time range, and the various metrics (TPS, error rates, etc.).
    * **Combined Datastore?** Consider if the transformed mainframe data and the API/SOAP data can reside in the same PostgreSQL/Aurora PostgreSQL database (e.g., different schemas or clearly distinguished tables) or if separate instances are preferred for operational or security reasons. Using the same instance can simplify the composition layer.

---

**Epic 4: Unified GraphQL Composition Layer**
*Goal: To provide a flexible, extensible, and unified API endpoint for the front-end to consume vendor data from various backend sources.*

* **User Stories / Tasks:**
    * As a Front-End Developer, I need a GraphQL API to query vendor health data.
    * As a Back-End Developer, I need to implement GraphQL resolvers to fetch transformed mainframe data from its PostgreSQL store.
    * As a Back-End Developer, I need to implement GraphQL resolvers to fetch ConnectWare/Code Connect data from its Aurora PostgreSQL store.
    * As a Back-End Developer, I need to implement GraphQL resolvers that can query existing Vitality back-end APIs (e.g., `meta-api`) to enrich vendor data with mapping information like ASV, LOB, EL, Tech AE, Business AE.
    * As a System Architect, I need to design the GraphQL schema to be intuitive and to accurately represent the custom vendor data models.
    * As a Back-End Developer, I need to ensure the GraphQL layer can be easily extended with new resolvers and types when new vendors or data sources are onboarded.
    * As a Back-End Developer, I need to implement appropriate error handling and data shaping within the GraphQL resolvers.
* **Technical Considerations:**
    * **GraphQL Schema Design:** Design a schema that starts with a `Vendor` type, allowing queries by vendor ID or name. This `Vendor` type can then have fields for different data categories (e.g., `mainframeMetrics`, `apiMetrics`, `soapMetrics`) and associated metadata from the `meta-api`.
    * **Resolver Logic:** Resolvers will interact with the data stores (PostgreSQL, Aurora PostgreSQL) and other backend APIs. Use DataLoader pattern to prevent N+1 query problems, especially when fetching mapping data for lists of vendors.
    * **Extensibility:**
        * Modular resolver structure: Organize resolvers by data source or functionality.
        * Schema stitching or federation (e.g., Apollo Federation) could be considered if different parts of the GraphQL schema are managed by separate microservices, though for a single new application, a monolithic GraphQL server might be simpler initially.
        * Use GraphQL schema definition language (SDL) that can be extended.
        * Dynamic registration of resolvers or schema parts based on loaded "vendor connector" modules could be an advanced extensibility pattern.
    * **Authentication/Authorization:** Integrate with Vitality's existing AuthN/AuthZ mechanisms if possible, or define how access to the GraphQL API will be secured.

---

**Epic 5: Vendor Health Dashboard Front-End**
*Goal: To create an intuitive and informative user interface that reuses Vitality assets for visualizing vendor health and performance.*

* **User Stories / Tasks:**
    * As a User, I want to be able to search for a specific vendor.
    * As a User, I want to select a vendor to view their detailed performance dashboard.
    * As a User, viewing a vendor's dashboard, I want to see key metrics related to their services (e.g., availability, performance, error rates, transaction volumes).
    * As a User, I want to be able to filter vendor metrics by the type of resource or service they provide (e.g., mainframe components, specific SOAP operations, specific API endpoints).
    * As a User, I want to see time-series charts for key metrics (e.g., P95 latency over the last 24 hours, error rates per day for the last week).
    * As a User, I want to see summary statistics or scorecards for the selected vendor.
    * As a Developer, I need to integrate UI components and styles from the `vitality-ui` repository to ensure a consistent look and feel. (Consider Git submodules or other TypeScript asset sharing methods).
    * As a Developer, I need to build the front-end application to be decoupled from the main Vitality UI codebase, residing in its own repository.
* **Technical Considerations (Dashboard Look & Feel):**
    * **UI Technology:** Align with the Vitality UI stack (e.g., React, Angular, Vue) for easier asset reuse.
    * **Asset Reuse Strategy:**
        * **Git Submodules:** Can work for pulling in a specific version of `vitality-ui` assets. Requires careful management of updates.
        * **NPM Packages:** If `vitality-ui` publishes its reusable components/styles as private NPM packages, this is often a cleaner way to manage dependencies.
        * **Monorepo (e.g., Lerna/NX):** If both Vitality UI and this new app were part of a larger monorepo, sharing code could be more direct, but this seems contrary to the "own repository" requirement.
        * **Importing TypeScript:** If `vitality-ui` has well-defined TypeScript interfaces, types, and utility functions, these can be imported if packaged appropriately (e.g., as part of an NPM package or if path aliasing is set up in a monorepo-like structure). Ensure there are clear boundaries and minimal direct deep-linking into another repository's internal structure.
    * **Dashboard Design Ideas:**
        * **Vendor Landing Page/Search:** A clean search interface or a sortable/filterable list of all onboarded vendors. Each list item could show a high-level status (e.g., green/yellow/red based on SLOs).
        * **Vendor Detail View (Main Dashboard):**
            * **Header:** Vendor Name, overall health status, key contacts (from `meta-api`).
            * **Tabs/Sections:** Organize metrics by service type (Mainframe, SOAP/ConnectWare, API/Code Connect) or by SLO categories.
            * **Key Metrics Scorecards:** Prominently display current values for critical metrics like overall uptime, current TPS, active errors, average P95 response time.
            * **Time-Series Charts:**
                * For P95 Latency, Error Rates, TPS, Volume over selectable time ranges (e.g., last hour, 24 hours, 7 days, 30 days).
                * Allow comparisons (e.g., this week vs. last week).
                * For "by Operation" metrics (SOAP/API), allow selecting specific operations to chart.
            * **Tables:** Display detailed lists of errors, slowest operations, or batch job statuses for mainframe.
            * **Filtering:** Global filters on the dashboard for time range, and specific filters within sections (e.g., filter mainframe jobs by name, filter API calls by endpoint).
            * **Contextual Information:** When hovering over data points, show detailed information. Link back to raw data in Observe if appropriate (deep linking).
        * **Visual Consistency:** Use Vitality's color palettes, typography, iconography, and layout grids.
    * **Component-Based Design:** Build reusable UI components (charts, tables, scorecards) that can be configured to display data for different vendors or metric types.

---

**Epic 6: Extensible Architecture for Vendor Onboarding & Data Modeling**
*Goal: To design the system so that new vendors and their unique data/metrics can be integrated with minimal code changes, leveraging modularity and configuration.*

* **User Stories / Tasks:**
    * As a System Architect, I need to define a process and technical framework for onboarding new vendor data sources.
    * As a Developer, I need to be able to define a new vendor-specific data model and transformation logic (if needed) without impacting existing vendors.
    * As a Developer, I need to be able to add new data ingestion routines for a new vendor by implementing a standard interface.
    * As a Developer, I need to be able to add new GraphQL resolvers for a new vendor's data with minimal changes to the core GraphQL setup.
    * As a Developer, I need to be able to configure new UI components or adapt existing ones to display a new vendor's specific metrics.
* **Technical Solutions for Extensibility (Extrapolation):**
    * **1. Configuration-Driven Vendor Definition:**
        * Maintain a central configuration (e.g., in a database, or version-controlled YAML/JSON files) that defines each vendor.
        * This configuration would include:
            * `vendor_id`, `vendor_name`
            * Data source type (e.g., `observe_fis_ironstream`, `observe_connectware`, `generic_api`)
            * API endpoints, authentication details/secrets management references.
            * Key metrics to collect, their expected format, and how they map to the internal "generic" vendor data model.
            * Pointers to transformation logic/scripts if needed (e.g., a script name or a class name).
            * UI presentation hints (e.g., which dashboard template to use, special charts).
    * **2. Pluggable Data Connectors/Adapters:**
        * Define a common interface for "Vendor Data Connectors" (part of Epic 1's abstraction).
        * Each new vendor or data source type would have its own connector implementation.
        * The main application would dynamically load/use the appropriate connector based on the vendor configuration.
        * Example methods: `Workspace_data(config, time_range)`, `transform_data(raw_data, model_definition)`.
    * **3. Generic Core Data Model with Extensions:**
        * Define a core set of common vendor metrics (e.g., `availability_percentage`, `average_latency_ms`, `error_count`, `transaction_volume`).
        * Allow vendor-specific metrics through:
            * A flexible key-value store (e.g., a JSONB field in PostgreSQL for "additional_metrics").
            * Or, a schema that allows for extending a base metric table with vendor-specific metric tables linked by `vendor_id` and `timestamp`.
        * The "Custom Data Model" (point 7 of your initial context) is key here. It's the standardized schema your application uses internally after transformations.
    * **4. Modular Transformation Services:**
        * If transformations are needed, they should be encapsulated in separate modules/functions.
        * The vendor configuration can specify which transformation module to invoke for its data.
    * **5. Dynamic GraphQL Schema/Resolvers (Advanced):**
        * For ultimate flexibility, the GraphQL schema itself could be partly generated or extended based on the onboarded vendor configurations and their exposed metrics.
        * Simpler approach: Have generic resolver structures that can handle common metric types, and add specific resolvers for truly unique vendor data structures.
    * **6. Template-Based or Configurable UI Views:**
        * Design dashboard components (charts, tables) to be highly configurable.
        * The vendor configuration could specify which components to display and how to map the vendor's data to these components.
        * For vastly different vendors, you might have different "dashboard templates."
    * **7. Registration/Discovery (if using microservices):**
        * If new vendor integrations are deployed as separate microservices (e.g., for data collection/transformation), a service discovery mechanism would be needed.
* **Data Model Management:**
    * The custom data models (especially for transforming complex sources like mainframe) should be version-controlled.
    * Provide tooling or a defined process for updating these models and the corresponding transformation logic.
