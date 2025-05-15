Project Plan: Jiraless IDE Plugin (Jira Automation & GitHub Integration)
Project Lead(s): Ryan Gibbons, Sean Safari
Executive Summary: This project, "Jiraless IDE Plugin," aims to significantly reduce developer hours spent on manual Jira updates and alleviate associated administrative toil. This will be achieved through intelligent automation and deep integration with GitHub, directly within the developer's Integrated Development Environment (IDE). The plugin will initially target VSCode (Phase 1) and subsequently Jetbrains IDEs (Phase 2).
Objectives:
    To automate Jira story state transitions in sync with common GitHub actions (branch creation, PR creation, PR merge).
    To enable developers to add Git commit messages as comments to linked Jira stories directly from the IDE.
    To provide developers with relevant Jira information (story status, recent comments) within their IDE, reducing context switching.
    To contribute to the broader goal of increasing developers' active coding time by minimizing Jira-related administrative tasks.
    (Stretch) To leverage LLMs (e.g., GitHub Copilot) to assist in generating summaries of code changes for richer commit messages and Jira comments.
Justification: A recent internal survey highlighted a significant challenge: 40% of engineers spend less than two hours daily on active coding, with substantial time consumed by meetings and administrative tasks in Jira and Confluence. The Jiraless IDE Plugin directly targets these Jira-related inefficiencies, aiming to free up valuable developer time and reduce the frustration associated with manual status updates and information logging. By automating these routine tasks, the project seeks to improve developer productivity and satisfaction.
Scope & Deliverables:
    In Scope:
        VSCode Plugin (Phase 1 Deliverable within 12 weeks):
            Secure Jira authentication (API token).
            Configuration for Jira instance URL, project keys, Jira ID extraction regex, and flexible GitHub event to Jira status/workflow mapping.
            Automated Jira story transition from 'Ready' to 'In Progress' upon local branch creation linked to a Jira ID (with IDE confirmation).
            GitHub Action to transition Jira story from 'In Progress' to 'Ready for Acceptance' upon PR creation, adding PR link as a Jira comment.
            GitHub Action to add a "PR merged" comment to the linked Jira story upon PR merge.
            IDE option to add current Git commit message as a comment to the linked Jira story.
            Display of current Jira status, notifications for automated changes, quick link to open Jira story in browser, and view of recent (3-5) Jira comments (read-only) within VSCode.
        Jetbrains Plugin (Phase 2 - Foundational work/partial implementation within 12 weeks, full delivery post-12 weeks):
            Achieve feature parity with the VSCode plugin for Jetbrains IDEs.
        GitHub Actions: Securely configured actions to handle server-side Jira updates based on PR events.
    Out of Scope (for initial 12-week delivery):
        Full feature parity for Jetbrains Plugin (will aim for foundational elements if VSCode is completed ahead of schedule).
        Creating new Jira stories from the IDE.
        Editing Jira story details (description, acceptance criteria, etc.) beyond comments and specified status transitions.
        Support for IDEs other than VSCode and Jetbrains.
        Complex two-way synchronization beyond the specified GitHub event-driven transitions.
        Managing Jira sprints or backlogs from the IDE.
        Automated time logging.
Key Features:
    Automated Jira State Transitions (Branch creation, PR creation, PR merge).
    Git Commit Message to Jira Comment.
    In-IDE Jira Status & Comment Display.
    Configurable Jira Integration (URL, Project, Regex, Workflow Mapping).
    GitHub Actions for Server-Side Automation.
    (Stretch) LLM-Enhanced Commit/Jira Comment Summaries.
Business Requirements (Epics & Stories):
    Epic 1: VSCode Plugin - Core Jira Integration & Workflow Automation (Phase 1)
        Goal: Develop the initial VSCode plugin to connect to Jira, automate status transitions based on Git actions, and allow developers to manage essential Jira interactions directly from their IDE.
        User Story 1.1 (E1.S1): As a developer, I want to securely configure my Jira instance URL and personal API token in the VSCode plugin so that the plugin can connect to my Jira projects.
        User Story 1.2 (E1.S2): As a developer, I want to specify the Jira Project Key(s) the plugin should actively monitor and a configurable regex for extracting Jira Story IDs from branch names so that its functionality is focused and accurate.
        User Story 1.3 (E1.S4): As a developer, when I create a new local Git branch whose name contains a valid Jira Story ID (e.g., feature/STORY-123-new-login), I want the VSCode plugin to prompt me to move the corresponding Jira story from 'Ready' to 'In Progress' so that my Jira status accurately reflects that I've started work.
        User Story 1.4 (E1.S5): As a developer, after writing a commit message, I want an option within the VSCode plugin (e.g., a checkbox or command) to add this commit message as a comment to the Jira story linked to my current branch so that I can easily log my micro-progress in Jira.
        User Story 1.5 (E1.S6): As a developer, I want the VSCode plugin to clearly display the current status (e.g., 'In Progress', 'Ready for Acceptance') of the Jira story linked to my active Git branch so that I have immediate visibility without leaving VSCode.
        User Story 1.6 (E1.S7): As a developer, I want a section in the VSCode plugin to view the last 3-5 comments from the linked Jira story so that I can quickly see recent updates or discussions without opening a browser.
        User Story 1.7 (E1.S8): As a developer, I want a convenient link or command in the VSCode plugin that opens the currently linked Jira story directly in my web browser so that I can access the full issue details when needed.
        User Story 1.8 (E1.S9): As a developer, I want to receive clear, unobtrusive notifications within VSCode when the plugin or associated GitHub Actions automatically change a Jira story's status or add a comment so that I'm aware of background automation.
    Epic 2: GitHub Actions for Server-Side Jira Automation
        Goal: Implement robust GitHub Actions that listen to repository events (like PR creation and merge) and update corresponding Jira stories automatically, independent of the local IDE plugin.
        User Story 2.1 (E2.S1): As a development team, when a Pull Request linked to a Jira Story ID is opened on GitHub, we want a GitHub Action to automatically transition the corresponding Jira story from 'In Progress' to 'Ready for Acceptance'.
        User Story 2.2 (E2.S2): As a development team, when a Pull Request is opened, we want the GitHub Action to add a comment to the linked Jira story containing a link to the PR and its title so that there's clear traceability.
        User Story 2.3 (E2.S3): As a development team, when a Pull Request linked to a Jira Story ID is merged on GitHub, we want a GitHub Action to automatically add a comment to the Jira story indicating the PR was merged and into which branch.
        User Story 2.4 (E2.S4): As a project administrator, I want to securely configure the GitHub Actions with Jira connection details (Jira URL, API token stored as a GitHub Secret) so that the actions can authenticate and interact with our Jira instance safely.
        User Story 2.5 (E2.S5): As a development team, we want the GitHub Actions to reliably parse Jira Story IDs from PR titles or associated branch names (based on a defined convention/regex) so that updates are always applied to the correct Jira issue.
    Epic 3: Jetbrains IDE Plugin - Feature Parity (Phase 2 - Foundational Work)
        Goal: To begin development for a plugin for Jetbrains IDEs (IntelliJ, WebStorm, etc.) that replicates the core Jira integration and workflow automation functionality of the VSCode plugin, focusing on core logic porting and environment setup within the initial 12 weeks.
        User Story 3.1 (E3.S1 - Partial): As a developer using a Jetbrains IDE, I want to be able to (begin setup for) securely configuring my Jira instance URL and personal API token in the plugin.
        User Story 3.2: As a developer on the plugin team, I want to set up the Jetbrains plugin development environment and port the core non-UI dependent logic (API wrappers, configuration handling) from the VSCode plugin.
Expected Outcomes (Success Criteria):
    Quantitative (Targets for VSCode Plugin post 12-week rollout & adoption):
        Reduce developer time spent on manual Jira status changes and commit-related comment logging by at least 30-50%.
        Demonstrable increase in adoption, targeting 100% for Canary, 100% for Pilot users.
        Automation success rate >90% for automated Jira status transitions initiated by the VSCode plugin and GitHub Actions.
    Qualitative (Targets for VSCode Plugin):
        Positive developer feedback (survey average satisfaction score ≥ 4.0/5.0).
        Perceived reduction in toil and mental overhead related to Jira.
Level of Effort:
    Estimated Team Size: 2 FTE Engineers
    Estimated Duration: 12 Weeks (1 Quarter)
Proposed Roadmap (12 Weeks / 6 Sprints for VSCode Plugin & Jetbrains Foundation): (Timeline based on jiraless_plan.md Execution Phase for VSCode, adjusted for 2 FTEs and 12 weeks, with Jetbrains foundation)
    Sprint 1 (Weeks 1-2): Project Kickoff, Design & Core Logic Stubs
        Official Kickoff: June 25, 2025 (as per plan).
        Finalized Technical Design Sign-off for VSCode plugin.
        Develop core backend logic: Jira/GitHub API wrappers, configuration management stubs (VSCode).
        Setup GitHub Actions workflow files with stubs for Jira integration.
        Conduct pre-Canary survey for baseline data.
    Sprint 2 (Weeks 3-4): VSCode - Jira Auth & Basic Event Handling
        Implement Jira authentication and secure token storage in VSCode plugin.
        Develop VSCode UI for configuration (Jira URL, Project Key, Regex).
        Implement IDE event handling for branch creation in VSCode.
    Sprint 3 (Weeks 5-6): VSCode - Branch to Jira & Commit Commenting
        Complete 'Branch Creation to In Progress' Jira transition logic with IDE prompt (VSCode).
        Implement 'Add Git Commit Message as Jira Comment' feature in VSCode.
        Develop GitHub Action for 'PR Created to Ready for Acceptance' & comment.
    Sprint 4 (Weeks 7-8): VSCode - Info Display & GitHub Actions Completion
        Implement Jira status display, recent comments view, and quick link in VSCode.
        Implement IDE notifications in VSCode.
        Complete and test GitHub Action for 'PR Merged' comment.
        Secure configuration for GitHub Actions.
    Sprint 5 (Weeks 9-10): VSCode Canary Release & Jetbrains Foundation
        Integration testing, bug fixing for VSCode plugin and GitHub Actions.
        Internal Canary Release of VSCode Plugin and gather rapid feedback.
        Setup Jetbrains plugin development environment.
        Begin porting core non-UI logic (API wrappers, config handling) to Jetbrains project (Epic 3).
    Sprint 6 (Weeks 11-12): VSCode Pilot Prep & Jetbrains Core Logic
        Incorporate Canary feedback into VSCode plugin.
        Prepare for VSCode Pilot Release (documentation, user selection).
        Continue porting and testing core logic for Jetbrains plugin.
        Initial design for Jetbrains UI/UX based on VSCode.
        Project Review for Phase 1 (VSCode initial delivery) and plan for full Phase 2 (Jetbrains) and Stretch Goals.
Technical Design & Considerations:
    Architecture:
        IDE Plugins:
            VSCode: Developed using JavaScript/TypeScript and VSCode Extension API.
            Jetbrains: Developed using Java/Kotlin and IntelliJ Platform SDK.
        Backend/Server-Side Logic: Primarily handled by GitHub Actions (written in YAML, potentially using JavaScript/TypeScript or a containerized script for complex Jira interactions). No separate dedicated backend server for the plugin itself beyond what GitHub Actions provides.
        Communication: IDE plugins communicate directly with Jira API (for status updates, comments, fetching info) and interact with local Git events. GitHub Actions communicate with Jira API.
    Data Model / Data Processing / Storage:
        Configuration Storage: Securely stored within the IDE's provided mechanisms (e.g., VSCode settings, Jetbrains persistent state components). Includes Jira URL, API token (encrypted or using OS keychain), project keys, regex.
        Jira ID Parsing: Regex-based extraction from branch names and PR titles/descriptions.
        No significant persistent data storage beyond configuration locally, and transient data fetched from Jira.
    API Design (if applicable):
        Interactions will use official Jira REST API and GitHub REST/GraphQL API.
        Plugin will need to handle API rate limits and errors gracefully.
    User Interface (UI) / User Experience (UX):
        VSCode:
            Notifications: VSCode's native notification system.
            Status Display: Potentially in status bar, custom view panel.
            Comment View: Custom view panel.
            Commands: Accessible via command palette and/or context menus.
            Configuration: VSCode settings UI.
        Jetbrains:
            Notifications: IntelliJ event log/popups.
            Status Display: Tool window, status bar.
            Comment View: Tool window.
            Commands: Actions in menus, toolbars.
            Configuration: Jetbrains settings dialog.
        Workflow should be unobtrusive, with clear feedback for automated actions and easy overrides/manual control if needed.
    Other Considerations:
        Security: API tokens must be stored securely. Consider using OS keychain integration if available through IDE APIs. GitHub Actions secrets for server-side auth.
        Cross-Platform Compatibility: Ensure plugins work on major OS (Windows, macOS, Linux).
        IDE Version Compatibility: Define and test against target ranges of VSCode and Jetbrains IDE versions.
Non-functional Requirements:
    Reliability: Automation should be accurate and dependable (>90% success rate).
    Performance: Plugin should not degrade IDE performance. API calls should be efficient.
    Security: Secure handling and storage of Jira API tokens.
    Usability: Intuitive configuration and operation, minimal friction for developers.
    Maintainability: Well-structured code for both plugins and GitHub Actions to facilitate updates and bug fixes.
Stretch Goals:
    LLM-Enhanced Story Commits (Epic 4):
        Allow developers to trigger an LLM (investigate GitHub Copilot feasibility first, otherwise a standard LLM API like OpenAI) to summarize staged git diff changes.
        This summary can then be used or edited for commit messages and/or more detailed Jira comments.
        UX: IDE command like "Generate LLM Commit Suggestion for STORY-XYZ".
        Technical: Plugin executes git diff --staged, sends diff content (respecting context limits) to LLM, displays suggestion.
Conclusion (Considerations, Assumptions, and Outro):
    Considerations:
        The 12-week timeline is aggressive, especially for delivering a polished VSCode plugin and making significant headway on Jetbrains foundations with 2 FTEs. Prioritization will be key.
        Successful adoption depends on ease of use and demonstrable time savings.
        Complexity of different Jira project workflows/configurations needs to be handled by flexible mapping.
        Investigating GitHub Copilot's capabilities for git diff summarization and its API accessibility is a prerequisite for that part of the stretch goal.
    Assumptions:
        Developers have access to generate Jira API tokens.
        Standardized branch naming conventions (incorporating Jira ID) are followed or can be encouraged.
        GitHub Actions are permitted and can be configured for target repositories.
        The 2-3 engineers (now standardized to 2 FTEs) will have dedicated full-time allocation.
    Outro: The Jiraless IDE Plugin has the potential to significantly improve developer experience and efficiency by automating routine Jira interactions. By seamlessly integrating these tasks within the IDE, this project will reduce context switching, minimize administrative burden, and allow engineers to focus more on their primary task: writing code. The phased approach, starting with VSCode, allows for iterative development and feedback, paving the way for broader adoption across different IDEs.
