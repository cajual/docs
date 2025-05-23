## Project Plan: PEERiscope GitHub Review Enhancer

* **Project Name:** PEERiscope
    * *Byline: Elevating code reviews by empowering senior engineers to provide impactful feedback and fostering a culture of constructive, meaningful peer review.*
* **Project Lead(s):** TBD (To Be Determined)
* **Executive Summary:**
    PEERiscope is a GitHub App designed to enhance the quality and impact of Pull Request (PR) reviews, particularly those conducted by designated "lead reviewers." It aims to ensure that feedback provided by senior engineers is not only present but also helpful, insightful, and constructive. The app will integrate into the GitHub workflow, assisting with `CODEOWNERS` setup, branch protection awareness, and, most importantly, evaluating the "helpfulness" of lead reviewer comments using configurable logic and optional LLM (Gemini API) integration. By providing a helpfulness score and nudging reviewers for more detailed feedback when necessary, PEERiscope seeks to improve code quality, facilitate knowledge sharing, and streamline the PR approval process for significant changes. The project will deliver the installable GitHub App and a comprehensive user guide.
* **Objectives:**
    * Develop a GitHub App (PEERiscope) that integrates with repositories to monitor and enhance PR review quality.
    * Assist repository owners in establishing a `CODEOWNERS` file with a designated "lead reviewers" group.
    * Guide the setup of branch protection rules to incorporate both lead reviewer and PEERiscope bot approvals.
    * Implement a "helpfulness assessment" for comments made by lead reviewers on PRs, using configurable simple logic (e.g., word count, keyword presence) and/or advanced LLM-based analysis.
    * Automate PR approval by the PEERiscope bot if the lead reviewer's comments meet a configurable helpfulness threshold.
    * Provide actionable feedback to lead reviewers if their comments do not meet the helpfulness criteria, prompting for more detail.
    * Offer configurability for ignoring trivial PRs (e.g., based on lines changed) or specific file types/paths.
    * Enable a bypass mechanism for lead reviewers to skip PEERiscope evaluation when appropriate.
    * Notify a designated Slack channel about the status of PEERiscope's review process.
    * Allow repository-specific customization of helpfulness checks, including LLM prompt additions and simple check parameters, via an in-repo configuration file.
* **Justification:**
    High-quality code reviews are a cornerstone of robust software development. They not only catch bugs but also serve as a critical mechanism for knowledge sharing, mentorship, and upholding coding standards. Senior engineers (lead reviewers) play a pivotal role in this process. However, time pressures or varied review habits can sometimes lead to superficial or less impactful comments. PEERiscope addresses this by:
    * **Encouraging Depth:** Nudging reviewers beyond simple "LGTM" approvals for complex changes.
    * **Standardizing Expectations:** Providing a (configurable) baseline for what constitutes a helpful review.
    * **Improving Code Quality:** Ensuring more thorough feedback is provided and considered.
    * **Facilitating Mentorship:** Making review comments more educational for PR authors.
    * **Streamlining Approvals (when quality is met):** Allowing the bot to act as a "quality gatekeeper" for review depth.
    This leads to better software, stronger teams, and a more positive review culture.
* **Scope & Deliverables:**
    * **In Scope:**
        * A fully functional GitHub App ("PEERiscope") installable on repositories.
        * Functionality to guide creation/management of a `CODEOWNERS` file to identify "lead reviewers."
        * Logic to check and guide branch protection settings for lead reviewer and PEERiscope bot approval.
        * PEERiscope bot that:
            * Activates upon a lead reviewer's comment and approval on a PR.
            * Ignores PRs based on configurable line change thresholds.
            * Ignores specified files/paths based on an in-repo configuration file (`.github/peeriscope.yml`).
            * Supports inclusive/exclusive file/path checking.
            * Performs helpfulness assessment of the lead reviewer's comment(s) using:
                * Configurable simple logic (word count, expected words).
                * Optional LLM (Gemini API) analysis with configurable prompt additions.
            * Calculates an aggregate helpfulness score.
            * Approves the PR if the score exceeds a threshold (e.g., 50/100).
            * Requests more information (tagging the lead reviewer) if the score is below the threshold.
            * Supports a bypass command (e.g., `!no-peeriscope`) from lead reviewers.
            * Sends status notifications to a configured Slack channel.
            * Allows LLM checks to be disabled via config.
            * Never runs on its own configuration file updates.
        * A comprehensive user guide detailing installation, configuration, usage, and best practices.
    * **Out of Scope:**
        * Directly enforcing or modifying branch protection rules (the app will guide/check, but admins apply).
        * Providing a full-fledged UI outside of GitHub comments/checks and Slack notifications.
        * Storing long-term historical data of review scores for analytics (MVP focuses on per-PR assessment).
        * Advanced Natural Language Processing beyond what Gemini API provides for helpfulness, unless developed as custom logic.
        * Support for Git platforms other than GitHub.
* **Key Features:**
    * GitHub App Integration.
    * `CODEOWNERS` "Lead Reviewer" Group Assistance.
    * Branch Protection Guidance.
    * Configurable PR Triviality Checks (e.g., line changes).
    * File/Path Ignoring (with inclusive/exclusive modes).
    * Lead Reviewer Comment Helpfulness Assessment (Simple & Optional LLM-based).
    * Automated Bot Approval based on Helpfulness Score.
    * Feedback Loop for Low-Score Reviews.
    * Bypass Command for Lead Reviewers.
    * Slack Channel Notifications.
    * In-Repo Configuration File (`.github/peeriscope.yml`).
    * Toggle for LLM vs. Simple Checks.
    * Customizable LLM Prompts & Simple Check Parameters.
* **Business Requirements (Epics & Stories):**
    * **Epic 1: PEERiscope GitHub App Setup & Repository Integration**
        * *Goal:* To enable seamless installation of the PEERiscope GitHub App into a repository and provide initial guidance for configuring essential prerequisites like `CODEOWNERS` and branch protections.
        * User Story 1.1: As a Repository Admin, I want to easily install the PEERiscope GitHub App on my repository so that it can start monitoring pull requests.
        * User Story 1.2: As a Repository Admin, upon installing PEERiscope, I want to receive guidance (e.g., a comment on a setup PR or link to docs) on how to create/update a `CODEOWNERS` file to define a `@lead-reviewers` group.
        * User Story 1.3: As a Repository Admin, I want PEERiscope to check my branch protection rules and advise me on how to configure them to require 1 approval from `@lead-reviewers` (via `CODEOWNERS`) and 1 approval from the PEERiscope bot (as a required status check).
        * User Story 1.4: As a Repository Admin, I want to create a `.github/peeriscope.yml` configuration file in my repository to customize PEERiscope's behavior.
    * **Epic 2: Core PR Monitoring & Review Triggering Logic**
        * *Goal:* To establish the bot's ability to monitor PRs, identify relevant lead reviewer actions, and correctly apply filtering logic before initiating a helpfulness assessment.
        * User Story 2.1: As the PEERiscope Bot, when a PR is opened or updated, I need to listen for review comments and approvals submitted by users designated in the `@lead-reviewers` group in the `CODEOWNERS` file.
        * User Story 2.2: As the PEERiscope Bot, I need to check the PR's changed files and line count against the `peeriscope.yml` configuration to determine if the PR is too simple (e.g., few lines changed) or only contains ignored files/paths, and if so, I should not proceed with helpfulness assessment and optionally post a status/comment indicating this.
        * User Story 2.3: As the PEERiscope Bot, I need to recognize a bypass command (e.g., `!no-peeriscope`) in a lead reviewer's approval comment and, if present, approve the PR on behalf of PEERiscope without performing a helpfulness assessment.
        * User Story 2.4: As the PEERiscope Bot, I must automatically ignore PRs that only modify the `.github/peeriscope.yml` configuration file itself.
    * **Epic 3: Review Comment Helpfulness Assessment**
        * *Goal:* To implement the core logic for assessing the helpfulness of a lead reviewer's comments, offering both simple, code-based checks and advanced LLM-powered analysis.
        * User Story 3.1: As the PEERiscope Bot, if LLM checks are disabled (via `peeriscope.yml`), I need to assess the helpfulness of a lead reviewer's comment based on simple complexity checks defined in `peeriscope.yml` (e.g., minimum word count, presence of "expected words").
        * User Story 3.2: As the PEERiscope Bot, if LLM checks are enabled, I need to securely call the Gemini API with the lead reviewer's comment text (and potentially PR context) using a base prompt combined with custom prompt additions from `peeriscope.yml` to get a helpfulness score and justification.
        * User Story 3.3: As a Repository Admin, I want to configure `expectedWords` and `minWordCount` in `peeriscope.yml` for the simple helpfulness check.
        * User Story 3.4: As a Repository Admin, I want to be able to add `customLLMPromptAdditions` in `peeriscope.yml` to tailor the LLM helpfulness evaluation to my repository's specific review criteria.
        * User Story 3.5: As the PEERiscope Bot, I need to calculate an aggregate helpfulness score based on the enabled checks (simple, LLM, or combined).
    * **Epic 4: Automated PR Status Update & Feedback Loop**
        * *Goal:* To enable PEERiscope to provide automated feedback on PRs by either approving them or requesting further clarification from the lead reviewer based on the helpfulness score.
        * User Story 4.1: As the PEERiscope Bot, if the aggregate helpfulness score of a lead reviewer's comment is above the configured threshold (e.g., 50/100), I need to approve the PR (e.g., by submitting an "Approve" review or updating a status check).
        * User Story 4.2: As the PEERiscope Bot, if the aggregate helpfulness score is below the threshold, I need to leave a comment on the PR tagging the lead reviewer (e.g., `@{leadReviewerHandle}`), explaining that more detail is needed in their review comments, and potentially include the score or the LLM's justification.
        * User Story 4.3: As a Repository Admin, I want the helpfulness score threshold to be configurable in `peeriscope.yml` (defaulting to 50).
    * **Epic 5: Slack Notifications & User Guidance**
        * *Goal:* To keep relevant stakeholders informed about PEERiscope's activities via Slack and provide comprehensive documentation for users.
        * User Story 5.1: As the PEERiscope Bot, I need to send notifications to a configurable Slack channel (defined in `peeriscope.yml`) indicating my current status for a PR (e.g., "Lead reviewer approval detected on PR #123, assessing helpfulness...", "Helpfulness score for PR #123 review: 75/100. Approving.", "Helpfulness score for PR #123 review: 30/100. Requesting more details from @reviewer.").
        * User Story 5.2: As a Developer/Repository Admin, I want access to a comprehensive user guide that explains how to install, configure (including all `peeriscope.yml` options), and use PEERiscope, along with best practices for meaningful reviews.
* **Expected Outcomes (Success Criteria):**
    * **A GitHub App/integration that can be added to a repository:**
        * PEERiscope GitHub App is successfully created and installable.
        * Adoption by at least 3-5 pilot teams within the first quarter of availability.
    * **A comprehensive user guide:**
        * User guide published and rated as "helpful" (e.g., 4/5 stars) by 80% of surveyed pilot users.
    * **Enhanced Review Quality:**
        * Measurable increase in the average "helpfulness score" (as determined by PEERiscope's consistent logic or a panel of senior engineers for a sample of PRs) by 20% on monitored repositories after 3 months.
        * Qualitative feedback from PR authors indicating review comments are more actionable and insightful.
        * Observed reduction in PRs requiring multiple cycles of superficial review before substantial issues are addressed.
    * **Improved Workflow:**
        * Lead reviewers adapt to the system, with >70% of PEERiscope interventions (requests for more detail) leading to improved comments on subsequent reviews or PRs.
        * High satisfaction (e.g., >70% positive) from lead reviewers regarding the tool's utility and fairness.
* **Level of Effort:**
    * Estimated Team Size: 2 FTE Engineers
    * Estimated Duration: 12 Weeks (1 Quarter)
* **Proposed Roadmap (12 Weeks / 6 Sprints):**
    * **Sprint 1 (Weeks 1-2): Foundation & GitHub App Setup**
        * Detailed design of GitHub App architecture, permissions, and event subscriptions.
        * Setup GitHub App in development. Basic webhook listener (Node.js/Probot recommended).
        * Define `CODEOWNERS` interaction strategy and initial `peeriscope.yml` schema.
        * Research Gemini API integration specifics and security for API keys.
    * **Sprint 2 (Weeks 3-4): Core PR Monitoring & Filtering**
        * Implement logic to listen to PR events (reviews, comments by lead reviewers).
        * Develop PR filtering logic: line changes, initial file/path ignore from `peeriscope.yml` (excluding self-updates).
        * Implement bypass command (`!no-peeriscope`) detection.
        * Basic Slack notification for "lead reviewer detected."
    * **Sprint 3 (Weeks 5-6): Simple Helpfulness Assessment & Basic Workflow**
        * Implement simple helpfulness checks (word count, expected words based on `peeriscope.yml`).
        * Implement scoring logic for simple checks.
        * Basic workflow: if score > threshold -> approve (status check); else -> comment asking for more detail (tag reviewer).
        * Further Slack notifications (score, approval, more info needed).
    * **Sprint 4 (Weeks 7-8): LLM Integration (Gemini API)**
        * Securely integrate Gemini API for comment analysis.
        * Implement base prompt and handling for `customLLMPromptAdditions` from `peeriscope.yml`.
        * Develop logic to combine LLM score with simple check score (if applicable).
        * Add `enableLLM` flag in `peeriscope.yml`.
    * **Sprint 5 (Weeks 9-10): Advanced Configuration & User Guide**
        * Implement inclusive/exclusive file/path checking logic.
        * Refine all `peeriscope.yml` configuration options and parsing.
        * Develop comprehensive user guide (installation, full configuration, usage).
        * Thorough testing of all configurations and edge cases.
    * **Sprint 6 (Weeks 11-12): Pilot Preparation, Polish & Documentation Review**
        * Internal testing and dogfooding of the app.
        * Address bugs and polish user experience (comment wording, Slack message clarity).
        * Technical documentation for maintainers.
        * Prepare for pilot deployment with selected teams.
        * Final review of user guide.
* **Technical Design & Considerations:**
    * **GitHub App Architecture:**
        * **Framework:** Probot (Node.js framework for GitHub Apps) is highly recommended as it simplifies event handling, authentication, and API interactions. Alternatives include Python with Flask/FastAPI and a GitHub SDK.
        * **Events Subscribed To:** `pull_request` (opened, synchronize), `pull_request_review` (submitted), `pull_request_review_comment` (created, edited), `issue_comment` (for bypass commands if not in review).
        * **Permissions:**
            * Read access to code and metadata.
            * Read and write access to pull requests (for commenting and approving via status checks/reviews).
            * Read access to `CODEOWNERS`.
            * Status checks (write).
        * **Authentication:** Authenticates as a GitHub App using JWTs. Gemini API key needs secure storage (e.g., environment variable in hosting, secrets manager).
        * **Hosting:** Serverless function (AWS Lambda, Google Cloud Functions) or a small containerized application (e.g., on Heroku, AWS Fargate) to host the bot's webhook listener.
    * **`CODEOWNERS` & Branch Protections:**
        * PEERiscope will read the `CODEOWNERS` file to identify users in the `@{ORG_NAME}/lead-reviewers` team (or a configurable team name).
        * It will *not* directly modify branch protection rules due to permission complexities. Instead, its setup guide will instruct admins on how to:
            1.  Create a `CODEOWNERS` file or add the lead reviewer group.
            2.  Enable branch protections requiring:
                * At least one approval from a code owner (which would include lead reviewers).
                * The PEERiscope status check to pass.
    * **Helpfulness Assessment Logic & Scoring:**
        * **Simple Score (0-100):**
            * `minWordCount`: Pass/Fail. If pass, contributes X points (e.g., 30).
            * `expectedWords`: Each found word contributes Y points, up to a max (e.g., 5 points per word, max 30).
            * *Example Derivation:* Score = (WordCountMet ? 30 : 0) + (NumExpectedWords * 5, capped at 30) + (CommentStructurePoints (e.g., code block presence) ? 20 : 0) + (AntiTrivialPoints (not "LGTM") ? 20 : 0). Normalize to 100.
        * **LLM Score (0-100):** Directly from Gemini API based on the tailored prompt.
            * **Example Prompt for Gemini:**
                ```
                "You are PEERiscope, an AI assistant evaluating the helpfulness and impact of a code review comment provided by a lead reviewer.
                PR Title: \"{pr_title}\"
                PR Description (first 200 chars): \"{pr_description_snippet}\"
                Changed Files (first 5): [{changed_files_list_snippet}]
                Total lines added: {lines_added}, Total lines removed: {lines_removed}
                Lead Reviewer's Comment: \"\"\"
                {comment_text}
                \"\"\"
                Repository-Specific Guidelines to Consider: \"\"\"
                {custom_llm_prompt_additions}
                \"\"\"
                Based on the comment's specificity, actionability, constructiveness, depth (does it address potential issues, alternatives, best practices?), and clarity, provide a helpfulness score from 0 (not helpful) to 100 (very helpful and impactful).
                Also provide a concise (1-2 sentence) justification for your score.
                Output ONLY the following JSON structure:
                {\"score\": <score_integer>, \"justification\": \"<text>\"}"
                ```
        * **Aggregate Score:** If LLM enabled: (LLM Score * 0.7) + (Simple Score * 0.3). If LLM disabled: Simple Score. Weights can be part of future config.
    * **Configuration (`.github/peeriscope.yml`):**
        ```yaml
        # .github/peeriscope.yml
        version: 1
        # Enable/disable LLM-based checks
        enableLLM: true
        # Custom additions to the LLM prompt
        customLLMPromptAdditions: |
          Ensure the reviewer considers accessibility (a11y) implications.
          Check if comments align with our internal "Secure Coding Guideline v2.1".
        # Configuration for simple, code-based helpfulness checks
        simpleChecks:
          minWordCount: 15
          expectedWords:
            - "consider"
            - "alternative"
            - "refactor"
            - "suggest"
            - "performance"
            - "security"
            - "important"
            - "clarify"
        # Score threshold for PEERiscope to approve (0-100)
        approvalThreshold: 55
        # Settings for ignoring PRs or files
        ignoreConfig:
          # PRs with fewer functional lines changed (excluding comments, whitespace) than this will be auto-approved by PEERiscope
          minLineChangesForReview: 10
          # Patterns for files/paths to ALWAYS ignore for helpfulness assessment
          # Bot will still run, but will auto-approve if only these files are changed.
          ignoredPathPatterns:
            - "**/*.md"
            - "docs/**"
            - "**/__tests__/**" # Test files might have different review standards
            - "package-lock.json"
            - "yarn.lock"
            - "*.yaml"
            - "*.yml"
            - "config/**"
          # Inclusive/Exclusive mode for path checking
          # "exclusive": (default) patterns in 'focusedPathPatterns' are the ONLY ones PEERiscope processes.
          # "inclusive": PEERiscope processes ALL files EXCEPT those matching 'ignoredPathPatterns'.
          # For a simpler MVP, we can start with only `ignoredPathPatterns` (implicitly exclusive to non-ignored)
          # Advanced:
          # pathCheckingMode: "exclusive" # or "inclusive"
          # focusedPathPatterns:
          #   - "src/core/**"
        # Slack channel ID for notifications
        slackChannelId: "C0123456ABC"
        # Name of the CODEOWNERS group for lead reviewers (can be team slug or group name)
        leadReviewerGroup: "@MyOrg/senior-devs" # or just "lead-reviewers" if it's a generic group in CODEOWNERS
        ```
    * **Other Meaningful PR Review Details PEERiscope could subtly encourage:**
        * **Scope Adherence:** Does the PR stay focused on its intended purpose? (LLM could check this against PR title/desc).
        * **Testing:** Are there adequate tests for the changes? (LLM could look for mentions of testing, or simple checks could look for changes in test directories).
        * **Clarity of Code:** Is the code itself easy to understand? (Harder for bot, but LLM might offer some insight).
        * **Documentation:** Are comments, docstrings, or external docs updated?
* **Non-functional Requirements:**
    * **Reliability:** The GitHub App must be highly available and process webhooks reliably. Errors should be handled gracefully.
    * **Performance:** Helpfulness assessment and feedback should be provided quickly (e.g., within 1-2 minutes of the lead reviewer's action) to avoid blocking the PR flow. LLM calls are the main latency factor.
    * **Security:** GitHub App credentials and any API keys (Gemini) must be stored and handled securely. The app should only request necessary permissions.
    * **Scalability:** Should handle events from numerous repositories and concurrent PRs.
    * **Configurability:** As detailed, allowing teams to tailor the bot to their specific needs is key.
    * **Maintainability:** Codebase should be well-documented, tested, and easy to update.
* **Stretch Goals:**
    * **Dashboard for Review Metrics:** A simple dashboard (potentially a separate web app or integrated via GitHub Pages) showing trends in helpfulness scores, common issues, etc., per repository (respecting privacy).
    * **Sentiment Analysis:** Add sentiment analysis to the LLM check to ensure comments are constructive in tone.
    * **Reviewer Leaderboard/Recognition:** Gamification to encourage helpful reviews (use with caution to avoid unintended consequences).
    * **Direct Integration with Linters/Static Analysis:** Correlate review comments with issues found by other tools.
    * **Support for suggesting improvements:** If a comment is deemed unhelpful, PEERiscope could (optionally) suggest *how* it could be improved, or link to internal review best practices.
* **Conclusion (Considerations, Assumptions, and Outro):**
    * **Considerations:**
        * Defining "helpfulness" is subjective; the combination of simple rules and LLM with custom prompts aims to provide a balanced and configurable approach. Continuous feedback will be needed to tune this.
        * Cost of Gemini API calls if LLM checks are widely adopted.
        * Potential for "gaming the system" if scores are tied to performance metrics; focus should be on improvement and education.
        * Ensuring the bot doesn't become overly noisy or a blocker. The bypass command and careful threshold tuning are important.
    * **Assumptions:**
        * Repositories will adopt the `CODEOWNERS` feature to define lead reviewers.
        * Lead reviewers are open to receiving feedback on their review comments.
        * GitHub's API capabilities are sufficient for the required interactions.
        * Access to Gemini API (or a similar LLM) and Slack API is available and approved.
    * **Outro:** PEERiscope is not just a bot; it's an investment in a culture of excellence for code review. By providing intelligent assistance and gentle nudges, it will empower senior engineers to elevate their feedback, leading to more robust code, accelerated learning for all developers, and a more collaborative and effective engineering organization.
 
---

You're right to point that out! An "easily installable" GitHub App doesn't just appear. The initial steps of defining, registering, and setting up the basic infrastructure for the app are crucial.

Let's expand on **Epic 1** for the PEERiscope project plan to include these foundational steps. I'll keep the rest of the project plan structure from our previous discussion intact and just replace the content for Epic 1.

---

**Revised Section for the PEERiscope Project Plan:**

* **Business Requirements (Epics & Stories):**

    * **Epic 1: PEERiscope GitHub App Creation, Registration, and Initial Service Setup**
        * *Goal:* To successfully register PEERiscope as a new GitHub App within the Capital One organization, configure its fundamental properties and permissions, establish the initial webhook handling infrastructure, and make the app ready for internal development, testing, and eventual installation on pilot repositories.
        * User Story 1.1 (Developer/Platform Engineer): As the PEERiscope Development Team, I need to register a new GitHub App under the Capital One organization (or a designated development organization) by defining its name ("PEERiscope"), description, and a placeholder homepage URL.
            * *How:* This involves navigating to GitHub organization settings -> Developer settings -> GitHub Apps -> "New GitHub App".
        * User Story 1.2 (Developer/Platform Engineer): As the PEERiscope Development Team, I need to configure the initial set of permissions for the GitHub App, including read access to code & metadata, read/write access to pull requests & issues (for comments/status), read access to `CODEOWNERS`, and write access to commit statuses.
            * *How:* During app registration, meticulously select the necessary "Repository permissions" and "Organization permissions" based on the app's intended functionality, adhering to the principle of least privilege.
        * User Story 1.3 (Developer/Platform Engineer): As the PEERiscope Development Team, I need to subscribe the GitHub App to essential webhook events, such as `pull_request` (opened, synchronize, closed), `pull_request_review` (submitted), `pull_request_review_comment` (created), and `issue_comment` (for potential commands).
            * *How:* In the app's settings, specify a "Webhook URL" (initially a local development URL forwarded by a tool like Smee.io or ngrok, later a deployed endpoint) and select the specific events the app needs to process. A "Webhook secret" should also be generated and stored securely.
        * User Story 1.4 (Developer/Platform Engineer): As the PEERiscope Development Team, I need to generate and securely store the GitHub App's credentials, including the App ID, Client ID, Client Secret (if web flow is ever needed, less likely for a bot), and most importantly, generate and download a private key for server-to-server authentication.
            * *How:* These are provided upon app registration. The private key (`.pem` file) is critical and must be stored securely (e.g., in a secrets manager for deployed environments, and handled carefully in development).
        * User Story 1.5 (Developer/Backend Engineer): As the PEERiscope Development Team, I need to develop a basic webhook event handler service (e.g., using Node.js with Probot, or Python with Flask/FastAPI) that can receive, verify (using the webhook secret), and acknowledge incoming webhook events from GitHub for the subscribed events.
            * *How:* Choose a tech stack (Probot is excellent for this). Implement an HTTP endpoint that listens for POST requests from GitHub. Use a library to validate the signature. For initial setup, this handler might just log received events.
        * User Story 1.6 (Developer/Platform Engineer): As the PEERiscope Development Team, I need to set up a local development environment that allows testing the webhook handler by forwarding GitHub webhooks to my local machine (e.g., using Smee.io or ngrok).
            * *How:* Configure the GitHub App's webhook URL to point to the Smee/ngrok public URL, which then forwards to the local development server.
        * User Story 1.7 (Developer/Platform Engineer): As the PEERiscope Development Team, I need to make the GitHub App "installable" (initially perhaps only within the organization or by specific admins/testers) so that its core event receiving and authentication logic can be tested against a real repository.
            * *How:* The app can be kept "private" initially and installed on test repositories owned by the development team or a pilot group. Later, it can be made public within the organization or even to all of GitHub if intended.
        * User Story 1.8 (Repository Admin - *formerly 1.1*): As a Repository Admin (once the app is created and shared for testing), I want to easily install the PEERiscope GitHub App on my pilot repository so that it can start receiving events for monitoring pull requests.
        * User Story 1.9 (Repository Admin - *formerly 1.2*): As a Repository Admin, upon installing PEERiscope, I want to receive initial guidance (e.g., an automated welcome comment on a test PR, or link to basic setup docs) on how to create/update a `CODEOWNERS` file to define a `@lead-reviewers` group.
        * User Story 1.10 (Repository Admin - *formerly 1.3*): As a Repository Admin, I want PEERiscope (once basic event processing is working) to check my branch protection rules and advise me on how to configure them to require 1 approval from `@lead-reviewers` (via `CODEOWNERS`) and 1 approval from the PEERiscope bot (as a required status check).
        * User Story 1.11 (Repository Admin - *formerly 1.4*): As a Repository Admin, I want to create a `.github/peeriscope.yml` configuration file in my repository to begin customizing PEERiscope's behavior (even if only a few basic options are supported initially).

    * **Epic 2: Core PR Monitoring & Review Triggering Logic**
        * *Goal:* (Remains the same) To establish the bot's ability to monitor PRs, identify relevant lead reviewer actions, and correctly apply filtering logic before initiating a helpfulness assessment.
        * (User Stories 2.1 - 2.4 would follow as previously defined)

    * **Epic 3: Review Comment Helpfulness Assessment**
        * *Goal:* (Remains the same) To implement the core logic for assessing the helpfulness of a lead reviewer's comments, offering both simple, code-based checks and advanced LLM-powered analysis.
        * (User Stories 3.1 - 3.5 would follow as previously defined)

    * **Epic 4: Automated PR Status Update & Feedback Loop**
        * *Goal:* (Remains the same) To enable PEERiscope to provide automated feedback on PRs by either approving them or requesting further clarification from the lead reviewer based on the helpfulness score.
        * (User Stories 4.1 - 4.3 would follow as previously defined)

    * **Epic 5: Slack Notifications & User Guidance**
        * *Goal:* (Remains the same) To keep relevant stakeholders informed about PEERiscope's activities via Slack and provide comprehensive documentation for users.
        * (User Stories 5.1 - 5.2 would follow as previously defined)
