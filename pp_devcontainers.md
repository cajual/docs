## Project Plan: Standardized Dev Container Implementation

* **Project Name:** Standardized Dev Container Implementation
* **Project Lead(s):** TBD (To Be Determined)
* **Executive Summary:**
    This project outlines the strategy and implementation plan for adopting containerized developer environments ("Dev Containers") within Capital One, starting with a pilot project (Vitality). The initiative aims to standardize development environments, ensuring consistency, simplifying local setup, and dramatically reducing onboarding time for engineers. By defining a structured approach to creating, managing, and reusing dev container configurations, this project will enhance developer productivity, improve collaboration, and isolate project dependencies, ultimately leading to cleaner host systems and more efficient development workflows. The core output will be a production-ready dev container for the Vitality project, comprehensive guidance for creating composable container layers for other projects, and best practices for hosting and utilizing these environments with VSCode as the MVP and Jetbrains as a stretch goal.
* **Objectives:**
    * Implement a fully functional, containerized development environment for a pilot project (Vitality) that "just works" on any engineer's machine with minimal prerequisites (Docker, compatible IDE).
    * Ensure the pilot dev container includes all necessary services (dev server, database) and developer tools, including seamless integration with Capital One internal tools (requiring proxy and VPN considerations).
    * Drastically reduce the time and complexity of onboarding new developers to projects by providing a repeatable, one-click environment setup.
    * Establish a consistent development environment across all team members for a given project, eliminating "works on my machine" issues.
    * Isolate project dependencies within containers, preventing conflicts with other projects or the host operating system.
    * Create comprehensive guidance and reusable templates/layers for composing dev containers for other Capital One projects, promoting broader adoption.
* **Justification:**
    The current developer experience often involves complex, time-consuming, and error-prone local environment setups. This leads to:
    a. **Inconsistent Environments:** Engineers working in slightly different environments, causing elusive bugs and integration issues. Dev containers ensure a single, version-controlled definition of the development environment.
    b. **Extended Onboarding Times:** New team members can spend days, or even weeks, configuring their machines before they can contribute meaningfully. Dev containers can reduce this to minutes.
    c. **Dependency Conflicts & OS Clutter:** Managing multiple projects with different, sometimes conflicting, dependencies can corrupt local environments and clutter host operating systems. Dev containers isolate these dependencies effectively.
    By addressing these pain points, dev containers will significantly boost developer productivity, improve morale, and streamline the development lifecycle.
* **Scope & Deliverables:**
    * **In Scope:**
        * Definition of a multi-layered dev container strategy (base, language/tech stack, project-specific layers).
        * Creation and publication of a Capital One approved base dev container image(s) to Artifactory.
        * Development of a fully configured dev container for the Vitality project (VSCode MVP).
            * Includes `Dockerfile`, `devcontainer.json`, and any associated `docker-compose.yml` files.
            * Integration of dev server, database (e.g., PostgreSQL), and project-specific tooling.
            * Configuration for Capital One internal developer tools, addressing proxy and VPN requirements.
        * Comprehensive documentation and guidance on:
            * Using the Vitality dev container.
            * Creating new dev containers for other projects by composing layers.
            * Best practices for `devcontainer.json` configuration.
            * Hosting custom dev container images in Capital One Artifactory.
        * Training materials/session for the Vitality team on using dev containers.
        * Initial investigation and proof-of-concept for Jetbrains IDE support.
    * **Out of Scope:**
        * Full implementation of dev containers for *all* Capital One projects (this project focuses on Vitality and a reusable framework).
        * Management of the host machine's Docker installation, VPN client, or proxy settings (these are prerequisites).
        * Development of new Capital One internal developer tools (focus is on integrating existing ones).
        * CI/CD pipeline integration for building and testing dev container images (though images built will be suitable for this).
* **Key Features:**
    * **Consistent & Repeatable Environments:** Defined by version-controlled configuration files.
    * **Rapid Onboarding:** One-click setup for new developers.
    * **Dependency Isolation:** Per-project dependencies managed within the container.
    * **Pre-configured Tooling:** Common dev tools, project-specific tools, and C1 internal tools readily available.
    * **Integrated Services:** Dev server, database, and other necessary services orchestrated.
    * **IDE Integration:** Seamless experience within VSCode (and potentially Jetbrains).
    * **Composable Layers:** Reusable base and tech-stack images for creating new project containers.
    * **Artifactory Hosting:** Centralized storage for approved container images.
* **Business Requirements (Epics & Stories):**
    * **Epic 1: Foundational Dev Container Infrastructure & Strategy**
        * *Goal:* To establish the core strategy, base images, and common configurations required for widespread dev container adoption at Capital One, ensuring security and reusability.
        * User Story 1.1: As a Platform Engineer, I want to define and build a secure, minimal Capital One base dev container image (e.g., based on a standard Linux distro like Ubuntu/Debian) that includes common utilities, C1 security scanning tools, and hooks for proxy configuration, so that all subsequent dev containers can be built upon a trusted and consistent foundation.
        * User Story 1.2: As a Platform Engineer, I want to publish the C1 base image and subsequent language-specific base images (e.g., Python, Node.js) to Capital One Artifactory, so that they are versioned, accessible, and managed according to C1 standards.
        * User Story 1.3: As a Developer, I need clear documentation on how the dev container interacts with the Capital One VPN and proxy (e.g., environment variable propagation, `NO_PROXY` settings) so that I can ensure tools within the container can access internal C1 endpoints.
        * User Story 1.4: As a Developer, I want the base dev container setup to seamlessly integrate with VSCode's "Remote - Containers" extension so that I can easily open projects in a containerized environment.
    * **Epic 2: Vitality Project Dev Container Implementation (MVP for VSCode)**
        * *Goal:* To create a fully functional, production-ready dev container for the Vitality project that provides a complete development environment, including all necessary tools, services, and C1 integrations, specifically optimized for VSCode.
        * User Story 2.1: As a Vitality Developer, I want the project's dev container to automatically install all required language runtimes (e.g., specific Python/Node.js versions) and project dependencies (e.g., via `requirements.txt`, `package.json`) when the container is built or started, so I don't have to manage these manually.
        * User Story 2.2: As a Vitality Developer, I want the dev container to include a pre-configured development server for the Vitality application that starts automatically or with a simple command, so I can quickly run and test the application.
        * User Story 2.3: As a Vitality Developer, I want the dev container environment to include a dedicated, containerized database instance (e.g., PostgreSQL) with necessary schemas and seed data, so I have a clean and isolated data environment for development.
        * User Story 2.4: As a Vitality Developer, I want the dev container to have all Capital One internal developer tools (e.g., CLIs, helper scripts) installed and configured to work with the C1 proxy and VPN, so I can perform all necessary development tasks from within the container.
        * User Story 2.5: As a Vitality Developer, I want the `.devcontainer/devcontainer.json` file to be pre-configured with recommended VSCode extensions, settings, and necessary port forwarding for the dev server and database, so my IDE is optimized for the project out-of-the-box.
    * **Epic 3: Dev Container Composability Framework & Guidance**
        * *Goal:* To create and document a framework and best practices that enable other Capital One teams to easily compose and customize dev containers for their specific projects, leveraging the base images and features developed.
        * User Story 3.1: As a Platform Engineer, I want to create template `Dockerfile` examples and `devcontainer.json` snippets that demonstrate how to build upon the C1 base images (e.g., adding Python or Node.js layers) and integrate common services using Docker Compose, so teams have a clear starting point.
        * User Story 3.2: As a Developer on a new project, I want comprehensive documentation explaining the layered container strategy (base, tech stack, project-specific), use of dev container features, and how to customize `devcontainer.json` (image, features, containerEnv, customizations, etc.) so I can create a dev container for my project.
        * User Story 3.3: As a Platform Engineer, I want to provide guidance on creating and using dev container "features" for installing common tools (e.g., AWS CLI, specific linters) to promote modularity and keep project Dockerfiles lean.
* **Expected Outcomes (Success Criteria):**
    * **Successfully leverage containerized developer environments:**
        * Vitality team members can successfully initialize and use the dev container for their daily development tasks on VSCode with minimal setup (Docker and IDE extension pre-requisites met).
        * Onboarding time for a new developer to the Vitality project (with prerequisites met) is reduced by at least 80% (e.g., from days to less than an hour).
    * **Easily onboard our teams to a specific project:**
        * At least one other project team (beyond Vitality) successfully creates and uses a dev container for their project based on the provided guidance and composable layers within 4 weeks of guidance availability.
    * **Devcontainer is reusable/composable for other target projects:**
        * C1 base images (generic, Python, Node.js) are created, versioned, and hosted in Artifactory.
        * Documentation and templates for composing new dev containers are published and positively reviewed by at least two engineering teams.
        * Reduction in "works on my machine" type issues reported by the Vitality team by at least 75% after full adoption.
* **Level of Effort:**
    * Estimated Team Size: 2 FTE Engineers
    * Estimated Duration: 12 Weeks (1 Quarter)
* **Proposed Roadmap (12 Weeks / 6 Sprints):**
    * **Sprint 1 (Weeks 1-2): Research, Strategy & Base Image Design**
        * Deep dive into C1 security, proxy, VPN, and Artifactory requirements for containers.
        * Finalize dev container strategy: layered approach (Base, Tech Stack, Project), use of features.
        * Design Dockerfile for "C1 Base Dev Container Image" (OS, common tools, security hardening, proxy/VPN hooks).
        * Initial `devcontainer.json` schema and key configuration options defined.
    * **Sprint 2 (Weeks 3-4): C1 Base Image Implementation & Vitality Project Analysis**
        * Build and test initial C1 Base Image.
        * Publish C1 Base Image v0.1 to Artifactory.
        * Analyze Vitality project: dependencies, services (dev server, DB), C1 internal tool usage.
        * Draft Dockerfile and `devcontainer.json` for Vitality based on C1 Base Image.
    * **Sprint 3 (Weeks 5-6): Vitality Dev Container - Core Functionality (VSCode)**
        * Implement Vitality `Dockerfile` (language runtimes, project dependencies).
        * Configure Vitality `devcontainer.json` (image, name, basic VSCode customizations, port forwarding for dev server).
        * Integrate Vitality dev server to run within the container.
        * Initial testing by the project team.
    * **Sprint 4 (Weeks 7-8): Vitality Dev Container - Services & C1 Tooling**
        * Integrate containerized database (e.g., PostgreSQL via Docker Compose linked in `devcontainer.json`) for Vitality.
        * Implement and test integration of critical C1 internal developer tools within the Vitality dev container, addressing proxy/VPN.
        * Refine VSCode specific settings (extensions, tasks) in `devcontainer.json`.
    * **Sprint 5 (Weeks 9-10): Composability Guidance & Documentation**
        * Develop language-specific base images (e.g., Python, Node.js) derived from C1 Base Image; publish to Artifactory.
        * Create template Dockerfiles and `devcontainer.json` examples for composability.
        * Draft comprehensive documentation: using Vitality container, creating new containers, best practices.
        * Internal pilot/testing of Vitality dev container with a few developers.
    * **Sprint 6 (Weeks 11-12): Finalize Vitality Container, Training & Jetbrains PoC**
        * Incorporate feedback on Vitality dev container. Final testing and stabilization.
        * Finalize all documentation and training materials. Conduct training for Vitality team.
        * Begin Proof-of-Concept for Jetbrains IDE support using the Vitality dev container (investigate configuration, test basic functionality).
        * Project review and handover of artifacts.
* **Technical Design & Considerations:**
    * **Architecture:**
        * **Dev Container Specification:** Adherence to the [open Dev Containers specification](https://containers.dev/) ensures broad IDE compatibility.
        * **Containerization Technology:** Docker Desktop (or compatible CLI for Linux users) is a prerequisite on developer machines.
        * **IDE Integration (VSCode MVP):** Primarily through the "Remote - Containers" extension. The `.devcontainer/devcontainer.json` file is key.
        * **Image Storage:** Capital One Artifactory for hosting official C1 base and tech-stack images. Project-specific Dockerfiles will reside in their respective project repositories.
    * **Container Layering Strategy:**
        * **`c1-base-image` (Artifactory):**
            * Minimal, secure OS (e.g., Ubuntu LTS, Distroless variant if feasible for some layers).
            * Common utilities: `git`, `curl`, `wget`, `jq`, C1 approved shell (e.g., bash, zsh).
            * Pre-configured to handle C1 network environment (scripts or settings for proxy, trusted CAs for internal endpoints). This often means ensuring host `HTTP_PROXY`, `HTTPS_PROXY`, `NO_PROXY` are correctly passed or specific C1 proxy client/config is installed if needed *inside* the container.
            * Security scanning tools/hooks as per C1 policy.
        * **`c1-[tech-stack]-image` (Artifactory):**
            * Example: `c1-python-base:3.11-slim` or `c1-node-base:18-alpine`.
            * Built `FROM c1-base-image`.
            * Installs specific language runtimes, package managers (pip, npm/yarn), common libraries for that stack.
        * **Project-Specific `Dockerfile` (In Project Repo):**
            * `FROM c1-[tech-stack]-image:[version]`.
            * Installs project-specific dependencies (e.g., `pip install -r requirements.txt`).
            * Copies project code into the container (or relies on IDE mount).
            * Sets up project-specific environment variables or configurations.
        * **Decision: Monolith vs. Composable Language Layers:** The proposed strategy is **composable language layers** built on a common C1 base. A single monolithic container for Python and TypeScript (and other languages) would become very large, slow to build, and hard to maintain. Separate `c1-python-base` and `c1-node-base` (for TypeScript) images are far more efficient and flexible. Projects then pick the relevant tech stack base. If a project *truly* needs both Python and Node.js in the *same primary dev container*, the project's Dockerfile can install the second language, or a multi-root workspace with multiple containers could be an advanced consideration. Generally, aim for one primary language stack per dev container.
    * **`.devcontainer/devcontainer.json` Configuration Details:**
        * `"name"`: (String) A human-readable name for the dev container. Example: `"Vitality Project (Python 3.11 + PostgreSQL)"`.
            * *Explanation:* Displayed in the IDE to help identify the environment.
        * `"image"` or `"dockerFile"` or `"dockerComposeFile"`:
            * `"image"`: (String) Directly use a pre-built image from Artifactory. Example: `"artifactory.capitalone.com/vitality-devcontainer:latest"`. *Useful if the project Dockerfile is also versioned and published.*
            * `"dockerFile"`: (String) Path to the Dockerfile in the project repository, relative to `devcontainer.json`. Example: `"../Dockerfile"`. *This is the most common for project-specific customization.*
            * `"dockerComposeFile"`: (String or Array of Strings) Path to Docker Compose file(s) for multi-container setups (e.g., app + database). Example: `"../docker-compose.yml"`.
            * *Explanation:* Defines how the container environment is built or sourced. For Vitality, using `"dockerFile"` referencing a project-specific Dockerfile (which itself starts `FROM` a C1 tech-stack image) combined with a `"dockerComposeFile"` for the database is a robust approach.
        * `"containerEnv"`: (Object) Key-value pairs for environment variables to set *inside* the dev container. Example:
            ```json
            "containerEnv": {
                "DATABASE_URL": "postgresql://user:password@db:5432/vitality_dev",
                "DEV_SERVER_PORT": "8000"
                // For C1 Proxy if tools INSIDE container need it explicitly and don't inherit:
                // "HTTP_PROXY": "http://your.c1.proxy.com:port",
                // "HTTPS_PROXY": "http://your.c1.proxy.com:port",
                // "NO_PROXY": "localhost,127.0.0.1,.capitalone.com"
            }
            ```
            * *Explanation:* Used to configure the application and tools running within the container. **Important for C1 Proxy:** Often, the IDE transparently handles proxying for its own operations and terminal access based on host settings. However, if applications *inside* the container need to make outbound calls directly (e.g., a Python script fetching from an internal C1 API), `containerEnv` might be needed to set proxy vars explicitly *if they are not inherited from the Docker daemon/host*. The requirement "local machine requires a proxy env var overwrite" implies the host is already set. The dev container setup should ensure this is effective for container processes.
        * `"features"`: (Object) Allows declarative addition of common tools and configurations. Example:
            ```json
            "features": {
                "ghcr.io/devcontainers/features/common-utils:2": {
                    "installZsh": "true",
                    "configureZshAsDefaultShell": "true"
                },
                "ghcr.io/devcontainers/features/docker-in-docker:2": {}, // If needed
                "ghcr.io/devcontainers/features/python:1": { // If not using a pre-built python base image
                    "version": "3.11"
                }
                // Potentially: "artifactory.capitalone.com/devcontainer-features/c1-internal-cli:1": {}
            }
            ```
            * *Explanation:* Features are self-contained units of install scripts and configurations. Capital One could develop its own features for internal tools and host them, making it easy to add "C1 CLI" or "C1 Security Scanner" to any dev container. This promotes composability.
        * `"forwardPorts"`: (Array of Numbers or Strings) Ports to forward from the container to the host. Example: `[8000, 5432]`. Allows accessing `localhost:8000` on the host to reach the dev server inside the container.
        * `"postCreateCommand"`: (String or Array) Commands run once after the container is created but before it's started for the first time (e.g., `pip install -r requirements.txt` if not in Dockerfile, database migrations).
        * `"postStartCommand"`: (String or Array) Commands run every time the container starts (e.g., starting a background service).
        * `"postAttachCommand"`: (String or Array) Commands run every time an IDE attaches to the container (e.g., `echo "Welcome to the Vitality Dev Environment!"`).
        * `"customizations"`: (Object) IDE-specific settings.
            * For VSCode:
                ```json
                "customizations": {
                    "vscode": {
                        "extensions": [
                            "ms-python.python",
                            "ms-azuretools.vscode-docker",
                            "dbaeumer.vscode-eslint"
                        ],
                        "settings": {
                            "terminal.integrated.shell.linux": "/bin/zsh"
                        }
                    }
                }
                ```
        * `"mounts"`: (Array of Strings) Mount host directories or volumes into the container. Example: `["type=bind,source=${localWorkspaceFolder},target=/workspaces/${localWorkspaceFolderBasename},consistency=cached"]` (this is often default).
        * `"runArgs"`: (Array of Strings) Additional arguments to pass to the `docker run` command. Example: `["--env-file", ".env.devcontainer"]`. Useful for passing sensitive C1 proxy credentials if they cannot be directly in `containerEnv` and must be sourced from a file not committed to git.
        * `"overrideCommand"`: (Boolean) Default true for Dockerfile, false for image/compose. If true, IDE takes over CMD/ENTRYPOINT. Set to `false` if your Dockerfile's `CMD` or `ENTRYPOINT` must run.
    * **Capital One Internal Developer Tools Integration:**
        * **Proxy:** The primary mechanism is usually host-level proxy configuration (`HTTP_PROXY`, `HTTPS_PROXY`, `NO_PROXY` env vars). Docker Desktop can be configured to pass these to containers. VSCode Remote-Containers also attempts to forward these. If tools *inside* the container (not managed by the IDE's remote connection) need to make outbound calls to C1 internal endpoints, `containerEnv` in `devcontainer.json` or env vars set in the `Dockerfile` might be needed to explicitly set these for the container's environment. The `NO_PROXY` list is critical for ensuring direct access to other C1 internal services that shouldn't go through the external proxy.
        * **VPN Access:** The host machine *must* be connected to the Capital One VPN. The dev container uses the host's network stack. There's no special VPN configuration *inside* the container itself; it relies on the host's connectivity.
        * **Tool Installation:** C1 internal CLIs or tools can be installed via:
            * `RUN` commands in the `Dockerfile` (if they are scriptable installs).
            * Custom "dev container features" developed and hosted by C1 in Artifactory.
            * Mounted volumes if tools reside on a shared drive accessible to the host (less common for CLI tools, more for configs).
    * **User Interface (UI) / User Experience (UX):**
        * Primarily driven by the IDE (VSCode or Jetbrains).
        * The goal is a seamless experience: developer clones repo, IDE prompts to "Reopen in Container," and after a one-time build, they have a fully functional environment.
        * Clear terminal output during container build and startup.
        * Pre-installed IDE extensions and configured settings for a consistent experience.
    * **Jetbrains Considerations (Stretch Goal):**
        * Jetbrains IDEs (IntelliJ IDEA, PyCharm, WebStorm etc.) now have improved support for dev containers, often recognizing `devcontainer.json`.
        * Configuration might be shared, but Jetbrains may have its own specific customization sections or interpretations (e.g., for plugin installation or indexing).
        * Performance and stability with Jetbrains dev container support should be specifically tested.
        * The `docker-compose.yml` integration is generally well-supported.
        * Some lifecycle scripts (`postCreateCommand` etc.) behavior or support level might differ slightly.
* **Non-functional Requirements:**
    * **Performance:** Dev container build time should be optimized (use of caching, lean base images). IDE responsiveness within the container should be close to native.
    * **Security:** Base images must be scanned and hardened according to C1 standards. Secrets should not be hardcoded in Dockerfiles or `devcontainer.json`.
    * **Ease of Use:** Minimal steps required for a developer to get started. Clear documentation.
    * **Reliability:** The dev container build and runtime should be stable and predictable.
    * **Resource Consumption:** Containers should be reasonably efficient in terms of CPU, memory, and disk space.
    * **Maintainability:** Dockerfiles, compose files, and `devcontainer.json` should be version-controlled, well-commented, and easy to update.
* **Stretch Goals:**
    * **Full Jetbrains IDE Support:** Achieve feature parity with VSCode for the Vitality dev container in Jetbrains IDEs, including specific Jetbrains customizations in `devcontainer.json`.
    * **Self-Service Dev Container Feature Creation:** Develop a streamlined process for teams to create and publish their own reusable "dev container features" for common tools or C1 internal utilities to Artifactory.
    * **Performance Benchmarking & Optimization:** Conduct detailed performance comparisons (build times, IDE responsiveness, app execution) between dev container environments and native setups.
    * **Integration with GitHub Codespaces or similar managed cloud dev environments (if C1 strategy aligns).**
* **Conclusion (Considerations, Assumptions, and Outro):**
    * **Considerations:**
        * Initial build times for dev containers can be long if not optimized; effective Docker layer caching and lean base images are crucial.
        * Managing an ecosystem of base images and features requires governance and maintenance.
        * Developer education and cultural shift are necessary for successful adoption.
        * Resource requirements on developer laptops (RAM, CPU for Docker) need to be considered.
        * Network complexity within Capital One (proxy, VPN, firewalls) will be a key challenge to ensure seamless operation.
    * **Assumptions:**
        * Developers have access to Docker Desktop (or equivalent) on their laptops and sufficient resources.
        * Capital One Artifactory can host Docker images and potentially dev container features.
        * The Vitality project team is willing to pilot this initiative and provide feedback.
        * Necessary network access for pulling base images and packages from within the C1 network is available.
        * VSCode with the "Remote - Containers" extension is the primary target IDE for the MVP.
    * **Outro:** Implementing standardized Dev Containers offers a transformative opportunity for Capital One's engineering practices. By ensuring consistency, reducing setup friction, and isolating dependencies, this initiative will directly contribute to increased developer velocity, improved collaboration, and higher quality software. The pilot with the Vitality project will pave the way for broader adoption, creating a more efficient and enjoyable development experience for all engineers.
