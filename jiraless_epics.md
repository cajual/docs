**Epics & User Stories**

**Epic 1: VSCode Plugin - Core Jira Integration & Workflow Automation (Phase 1)**
*Description: Develop the initial VSCode plugin to connect to Jira, automate status transitions based on Git actions, and allow developers to manage essential Jira interactions directly from their IDE.*

**User Stories for Epic 1:**

* **E1.S1: Jira Authentication & Configuration**
    * As a developer, I want to securely configure my Jira instance URL and personal API token in the VSCode plugin so that the plugin can connect to my Jira projects.
* **E1.S2: Project & Workflow Configuration**
    * As a developer, I want to specify the Jira Project Key(s) the plugin should actively monitor and interact with so that its functionality is focused on my relevant work.
* **E1.S3: Branch Naming Configuration for Jira ID**
    * As a developer, I want the VSCode plugin to have a configurable regex for extracting Jira Story IDs from branch names so that it accurately links local branches to Jira issues.
* **E1.S4: Transition Story to 'In Progress' on Branch Creation**
    * As a developer, when I create a new local Git branch whose name contains a valid Jira Story ID (e.g., `feature/STORY-123-new-login`), I want the VSCode plugin to prompt me to move the corresponding Jira story from 'Ready' to 'In Progress' so that my Jira status accurately reflects that I've started work.
* **E1.S5: Add Git Commit Message as Jira Comment**
    * As a developer, after writing a commit message, I want an option within the VSCode plugin (e.g., a checkbox or command) to add this commit message as a comment to the Jira story linked to my current branch so that I can easily log my micro-progress in Jira.
* **E1.S6: Display Current Jira Story Status in IDE**
    * As a developer, I want the VSCode plugin to clearly display the current status (e.g., 'In Progress', 'Ready for Acceptance') of the Jira story linked to my active Git branch so that I have immediate visibility without leaving VSCode.
* **E1.S7: View Recent Jira Story Comments in IDE**
    * As a developer, I want a section in the VSCode plugin to view the last 3-5 comments from the linked Jira story so that I can quickly see recent updates or discussions without opening a browser.
* **E1.S8: Quick Link to Open Jira Story in Browser**
    * As a developer, I want a convenient link or command in the VSCode plugin that opens the currently linked Jira story directly in my web browser so that I can access the full issue details when needed.
* **E1.S9: IDE Notifications for Automated Actions**
    * As a developer, I want to receive clear, unobtrusive notifications within VSCode when the plugin or associated GitHub Actions automatically change a Jira story's status or add a comment so that I'm aware of background automation.

---

**Epic 2: GitHub Actions for Server-Side Jira Automation**
*Description: Implement robust GitHub Actions that listen to repository events (like PR creation and merge) and update corresponding Jira stories automatically, independent of the local IDE plugin.*

**User Stories for Epic 2:**

* **E2.S1: Transition Story to 'Ready for Acceptance' on PR Creation**
    * As a development team, when a Pull Request linked to a Jira Story ID is opened on GitHub, we want a GitHub Action to automatically transition the corresponding Jira story from 'In Progress' to 'Ready for Acceptance' so that the story status reflects its readiness for review/QA.
* **E2.S2: Add PR Link to Jira on PR Creation**
    * As a development team, when a Pull Request is opened, we want the GitHub Action to add a comment to the linked Jira story containing a link to the PR and its title so that there's clear traceability between the Jira issue and the implementing PR.
* **E2.S3: Add Merge Comment to Jira on PR Merge**
    * As a development team, when a Pull Request linked to a Jira Story ID is merged on GitHub, we want a GitHub Action to automatically add a comment to the Jira story indicating the PR was merged and into which branch (e.g., `main`, `develop`) so that this key event is recorded in Jira.
* **E2.S4: Secure Configuration for GitHub Actions**
    * As a project administrator, I want to securely configure the GitHub Actions with Jira connection details (Jira URL, API token stored as a GitHub Secret) so that the actions can authenticate and interact with our Jira instance safely.
* **E2.S5: Reliable Jira ID Parsing in GitHub Actions**
    * As a development team, we want the GitHub Actions to reliably parse Jira Story IDs from PR titles or associated branch names (based on a defined convention/regex) so that updates are always applied to the correct Jira issue.

---

**Epic 3: Jetbrains IDE Plugin - Feature Parity (Phase 2)**
*Description: Develop a plugin for Jetbrains IDEs (IntelliJ, WebStorm, etc.) that replicates the core Jira integration and workflow automation functionality of the VSCode plugin.*

**User Stories for Epic 3:**
*(These stories mirror those in Epic 1, adapted for the Jetbrains environment. For brevity, only a few examples are expanded here.)*

* **E3.S1: Jira Authentication & Configuration (Jetbrains)**
    * As a developer using a Jetbrains IDE, I want to securely configure my Jira instance URL and personal API token in the plugin so that it can connect to my Jira projects.
* **E3.S2: Transition Story to 'In Progress' on Branch Creation (Jetbrains)**
    * As a developer using a Jetbrains IDE, when I create a new Git branch whose name contains a valid Jira Story ID, I want the plugin to prompt me to move the corresponding Jira story from 'Ready' to 'In Progress'.
* **E3.S3: Add Git Commit Message as Jira Comment (Jetbrains)**
    * As a developer using a Jetbrains IDE, after writing a commit message, I want an option within the plugin to add this commit message as a comment to the Jira story linked to my current branch.
* *(Additional stories would cover: Project & Workflow Configuration, Branch Naming Configuration, Displaying Jira Status, Viewing Comments, Quick Link to Jira, IDE Notifications – all for Jetbrains IDEs.)*

---

**Epic 4: LLM-Powered Commit & Jira Comment Assistance (Stretch Goal)**
*Description: Integrate an LLM (investigating GitHub Copilot first) to help developers craft more meaningful commit messages and Jira comments by summarizing code changes.*

**User Stories for Epic 4:**

* **E4.S1: LLM Service Configuration (Initial for VSCode)**
    * As a developer (using the VSCode plugin), I want the plugin to leverage my existing GitHub Copilot subscription or allow configuration of another LLM service API key so that it can provide AI-powered summarization.
* **E4.S2: Generate Commit Message Suggestion from `git diff`**
    * As a developer (using the VSCode plugin), after staging my code changes, I want to trigger a command (e.g., "Generate LLM Commit Suggestion") that uses an LLM to analyze the `git diff` and suggest a concise, descriptive commit message so that I can improve the quality and speed of writing my commits.
* **E4.S3: Edit LLM-Generated Commit Suggestion**
    * As a developer, after an LLM generates a commit message suggestion, I want to be able to easily edit the suggestion within my IDE before applying it as my commit message so that I can ensure its accuracy and add any necessary nuances.
* **E4.S4: Use LLM Summary for Enriched Jira Comments**
    * As a developer, when generating an LLM summary for a commit, I want an option to use this summary (or an elaborated version) as a comment for the linked Jira story so that I can provide more detailed context about the changes directly in Jira with minimal extra effort.
