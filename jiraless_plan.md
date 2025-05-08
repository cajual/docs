**Project Plan: Jira Automation & GitHub Integration IDE Plugin**

* **Document Version:** 1.0
* **Date:** May 8, 2025
* **Project Lead:** Ryan Gibbons, Sean Safari

**Executive Summary**

* **Intent:** To significantly reduce developer hours spent on manual Jira updates and alleviate associated toil through intelligent automation and deep integration with GitHub within the developer's IDE.
* **Justification:** A recent survey indicated that 40% of engineers spend less than two hours a day on active coding, with a significant portion of the remaining time consumed by meetings, Jira, and Confluence. This project aims to directly address the Jira-related inefficiencies.
* **Approach:** This project will deliver an IDE plugin (Phase 1: VSCode, Phase 2: Jetbrains) designed to streamline Jira story state transitions in sync with GitHub actions. The plugin will also facilitate adding comments to Jira stories from Git commit messages, encouraging more meaningful commit practices. A stretch goal includes leveraging an LLM (potentially GitHub Copilot) to summarize code changes for richer Jira comments.

---

**1. Scope & Deliverables**

**1.1. In Scope**

* **Phase 1: VSCode Plugin**
    * **Jira State Transitions:**
        * **Branch Creation:** On creating a new branch linked to a Jira Story ID (e.g., `feature/PROJECTKEY-123-task-name`), the plugin will prompt to move the story from 'Ready' to 'In Progress'.
        * **Pull Request (PR) Creation:** A GitHub Action, triggered on PR creation linked to a Jira Story ID, will automatically move the story from 'In Progress' to 'Ready for Acceptance'. A comment will be added to Jira: "Pull Request #PR-XYZ created: [PR Title]".
        * **Pull Request (PR) Merged:** A GitHub Action, triggered on PR merge, will add a comment to the linked Jira story: "PR #PR-XYZ merged into `[target_branch]`." The story will remain in 'Ready for Acceptance' for PO/final verification.
    * **Conditions for Transitions:**
        * User authentication with Jira (API token).
        * Valid Jira Story ID in branch name or PR title/description (configurable regex).
        * IDE confirmation for branch creation transition.
    * **Jira Comments from Git Commits:**
        * The plugin will offer an option (e.g., checkbox, command) for the developer to add their current Git commit message as a comment to the linked Jira story.
    * **Configuration (VSCode Plugin):**
        * Jira Instance URL.
        * Jira Personal API Token input (secure storage).
        * Jira Project Key(s) to operate on.
        * Regex for Jira Story ID extraction.
        * Flexible mapping of GitHub events to Jira statuses and workflows.
    * **Information Displayed in IDE:**
        * Current Jira status of the story linked to the active branch.
        * Notifications/confirmations for automated state changes.
        * Link to open the current Jira story in the browser.
        * View of recent Jira story comments (read-only, last 3-5).

* **Phase 2: Jetbrains Plugin**
    * Achieve feature parity with the VSCode plugin, providing the same Jira state transitions, commenting features, configuration options, and information display within Jetbrains IDEs (IntelliJ IDEA, WebStorm, etc.).

* **Stretch Goal: LLM-Enhanced Story Commits**
    * **Functionality:** Allow developers to trigger an LLM (investigate GitHub Copilot feasibility first, otherwise a standard LLM API) to summarize staged `git diff` changes. This summary can then be used or edited for commit messages and/or more detailed Jira comments.
    * **User Experience:** IDE command to "Generate LLM Commit Suggestion for STORY-XYZ".
    * **Technical:** Plugin executes `git diff --staged`, sends to LLM, displays suggestion.

**1.2. Exclusions**

* Creating new Jira stories from the IDE.
* Editing Jira story details (description, acceptance criteria, etc.) beyond comments and specified status transitions.
* Support for IDEs other than VSCode (Phase 1) and Jetbrains (Phase 2) in these initial phases.
* Complex two-way sync beyond the specified GitHub event-driven transitions.
* Managing Jira sprints or backlogs from the IDE.
* Automated time logging (unless a trivial side-effect, not a primary feature).

---

**2. Success Criteria & Metrics**

**2.1. Quantitative Metrics**

* **Target Reduction in Manual Jira Updates:** Reduce developer time spent on manual Jira status changes (Ready -> In Progress, In Progress -> Ready for Acceptance) and commit-related comment logging by 50%.
* **Contribution to Increased Coding Time:** Contribute to the broader goal of developers achieving coding time for greater than 50% of their day (4+ hours).
* **Adoption Rate:**
    * Canary (local team): 100% within 1 month of internal release.
    * Pilot (10-15 volunteer external users): 100% of volunteers actively using within 1 month of pilot start.
    * Local Org Release: >80% adoption among VSCode/Jetbrains users within 3 months of local org launch.
    * General Availability (if applicable): >60% adoption within 6 months of GA launch.
* **Automation Success Rate:** >90% for automated Jira status transitions without errors or requiring manual correction.

**2.2. Qualitative Metrics**

* **Developer Satisfaction:**
    * **Method:** Surveys (post-Canary, Pilot, Org Release).
    * **Targets:** Average satisfaction score ≥ 4.0/5.0; ≥75% agree plugin makes Jira easier and reduces time in Jira.
* **Perceived Reduction in Toil:**
    * **Method:** Survey questions on effort comparison (before/after plugin).
    * **Target:** Significant positive shift in perceived effort; ≥70% agree plugin reduces mental overhead.
* **Improved Commit Message Quality (especially if LLM feature implemented):**
    * **Method (LLM):** Track LLM feature adoption; survey usefulness (≥60% "Sometimes" or better); survey impact on Jira comment quality (≥60% "Agree").
    * **Method (General):** Anecdotal feedback from tech leads/reviewers.

**2.3. Baseline Data Collection**

* **Action:** Conduct a pre-Canary survey (target completion: June 24, 2025) with the Canary team focusing on:
    * Frequency of manual Jira status changes.
    * Frequency of manually adding commit info to Jira.
    * Estimated daily minutes on these tasks.
    * Estimated percentage of workday spent coding.

---

**3. Stakeholders**

* **Engineering Manager(s):** Key for team adoption, feedback, and realizing team benefits.
* **Lead Developer(s) / Architects:** Technical guidance, review, and upholding best practices.
* **End-User Software Engineers:** Primary users and beneficiaries; their feedback is critical for adoption and success.
* **Pilot Program Participants:** Subset of end-users providing crucial early feedback.
* **Plugin Development Team ("Internal Engineers"):** Responsible for designing, building, and maintaining the plugin.
* **Product Owner(s) / Product Managers:** Consumers of Jira data; need assurance of data integrity and workflow coherence.

---

**4. Team & Resources**

* **4.1. Team Composition & Roles:**
    * **Development Team:** 2-3 dedicated full-time engineers.
    * **Project Lead:** Senior Engineering Manager.
    * **User Communication/Updates:** Senior Engineering Manager and Lead Engineer (from dev team).
* **4.2. Skills:**
    * **Core (Readily Available):** VSCode Extension Dev (JS/TS), Jetbrains Plugin Dev (Java/Kotlin), Jira API, GitHub API/Actions, Git.
    * **Stretch Goal (Readily Available):** LLM API experience, prompt engineering. (Note: Specific investigation for GitHub Copilot applicability for `git diff` summarization needed).
* **4.3. Budget & Tools:**
    * **Budget:** No specific separate budget; covered by salaries.
    * **LLM Costs:** TBD based on chosen solution (monitor if commercial API).
    * **Software/Tools:** Standard company-provided tools for development, project management (Jira), and communication (Slack/Teams).
* **4.4. Time Allocation:**
    * Full-time project for the 2-3 engineers.
    * Approx. 30-40 total engineering hours per week dedicated.

---

**5. Timeline & Milestones**

**5.1. Execution Phase (Official Kickoff: June 25, 2025)**

* **Phase 1: VSCode Plugin Development & Rollout**
    * **Execution Kickoff & Finalized Technical Design Sign-off:** June 26, 2025
    * **Core Backend Logic - API Wrappers & GitHub Action Stubs:** Target: July 18, 2025
    * **VSCode Plugin - UI/UX Basics & IDE Event Handling:** Target: August 8, 2025
    * **GitHub Actions - Full Development & Testing:** Target: August 22, 2025
    * **Integration, Canary Release & Rapid Iteration:** Target: August 28, 2025
    * **Pilot Release:** User Target: August 31, 2025 (Deployment ready by Aug 29)
    * **Pilot Feedback Incorporation & Stabilization:** Target: September 12, 2025
    * **Local Org Availability & Documentation:** User Target: September 15, 2025

* **Phase 2: Jetbrains Plugin Development & Rollout** *(Aggressive Timeline)*
    * **Kickoff, Scoping Confirmed & Environment Setup:** Target: September 19, 2025
    * **Core Logic Port & Backend Integration:** Target: October 3, 2025
    * **Plugin UI/UX & IDE Integration:** Target: October 17, 2025
    * **End-to-End Testing & Canary Release:** Target: October 24, 2025
    * **Org Availability:** User Target: October 31, 2025

* **Stretch Goal: LLM Integration (VSCode Initially)** *(Assumes successful PoC)*
    * **Feature Development in VSCode Plugin:** Target: November 21, 2025
    * **Canary/Pilot Release (VSCode):** Target: November 28, 2025 (User Target Nov 30)

**5.2. Project Closure**

* **Final Project Review & Success Metrics Assessment:** Target: December 12, 2025

**5.3. Critical Timeline Considerations:**

* The Phase 1 VSCode execution window (~9 weeks from kickoff to Pilot) is highly compressed. Success depends on thorough pre-execution phase completion and efficient execution.
* The Phase 2 Jetbrains timeline (~6.5 weeks) is very aggressive and relies on proficient Jetbrains development skills and a straightforward port.
* Consistent dedication of the 2-3 engineers (30-40 hours/week project total) is crucial.

