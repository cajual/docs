## Definition of Ready (DoR) Checklist

This checklist ensures that a Product Increment (PI), Epic, or Story is adequately defined, understood, and actionable before being committed to development. The goal is to minimize ambiguity, ensure alignment, and confirm that all prerequisites are in place.

**I. Product & Business Alignment:**

* **[ ] Value Proposition Clearly Defined:** The "why" behind this item is well-understood, and its value to the customer and business is articulated.
* **[ ] Business Objectives & KPIs:** The item is aligned with specific business objectives, and Key Performance Indicators (KPIs) for success are identified.
* **[ ] Product Requirements Document (PRD) Complete & Approved:**
    * **[ ] Clearly Written Acceptance Criteria:** Acceptance criteria are actionable, testable, and agreed upon by Product and Engineering. They define the boundaries of the item and the conditions of satisfaction.
    * **[ ] Functional Requirements Described:** All necessary functional behaviors of the system are detailed.
    * **[ ] Non-Functional Requirements (NFRs) Documented:** Performance, scalability, security, usability, and other NFRs are specified where applicable.
* **[ ] Scope Clearly Bounded:** Inclusions and exclusions are explicitly stated to prevent scope creep.
* **[ ] Priority Validated:** The priority of this item has been confirmed against other competing initiatives and aligns with the overall product roadmap and PI goals.
* **[ ] Stakeholder Agreement:** Key stakeholders (Product, Engineering, Design, relevant business units) have reviewed and agreed upon the scope and requirements.

**II. Technical & Design Readiness:**

* **[ ] Solution Overview & Approach Documented:** A high-level technical approach has been discussed and documented.
* **[ ] Architecture Diagrams Provided & Approved (where applicable):**
    * **[ ] System Architecture:** Overall system components and interactions.
    * **[ ] Network Architecture:** Relevant network considerations and impacts.
    * **[ ] UI/UX Design & Mockups:** User interface designs, wireframes, and user flows are complete, reviewed, and approved by Product and Design.
    * **[ ] BFF (Backend-for-Frontend) Design (if applicable):**
    * **[ ] API Design & Contracts:**
        * **[ ] Internal APIs:** Contracts defined, reviewed, and agreed upon by consuming and providing teams.
        * **[ ] External APIs:** Availability confirmed, contracts understood, and access approved.
    * **[ ] Workflow Diagrams:** For complex processes or user journeys.
* **[ ] Design Review Conducted & Approved:**
    * **[ ] Internal Dev Team Review:** For routine changes.
    * **[ ] Design Review Board (DRB) Approval:** For major changes, new frameworks, significant refactors, or new Architectural Decision Records (ADRs). Any ADRs are finalized and approved.
* **[ ] Impact Analysis Completed & Documented:**
    * **[ ] Impact on Existing Functionality:** Potential effects on current features are identified and mitigated.
    * **[ ] Impact on Dependent Components/Systems:** Effects on upstream and downstream systems are understood and communicated.
* **[ ] Technical Debt Considerations:**
    * **[ ] Existing Tech Debt Impact:** How existing tech debt might affect this item is understood.
    * **[ ] New Tech Debt Introduced:** Any planned introduction of tech debt is consciously decided, documented, and approved with a clear plan for future remediation.
* **[ ] New Component CIs (Configuration Items) or ASVs (Application Security Verifications) Identified & Registered:** Necessary registrations and compliance steps are initiated.
* **[ ] Developer Exchange / Platform Requirements Outlined & Approved:** Any requirements from platform teams (e.g., new infrastructure, service configurations) are clearly defined with approved timelines for delivery.

**III. Dependency Management:**

* **[ ] All Dependencies Identified & Committed:**
    * **[ ] Upstream System Dependencies:** Work required from other teams that must be completed before this item can start or finish is identified, and commitment for delivery is secured from those teams.
    * **[ ] Downstream System Dependencies:** Teams consuming the output of this item are identified, and their requirements are understood.
    * **[ ] API Availability & Approval:** All necessary APIs are available, contracts are finalized, and any required access or approvals are granted.
    * **[ ] Infrastructure Requirements:** Necessary infrastructure (e.g., servers, databases, environments) is identified, and provisioning is planned/committed.
    * **[ ] Entitlements & Access:** Required permissions and access for systems, data, and tools are identified and processes to obtain them are clear.
    * **[ ] Other Team Dependencies:** Any other inter-team dependencies (e.g., shared services, specialist expertise) are identified and committed.
* **[ ] Clear Communication Channels Established with Dependent Teams:** Regular check-ins or points of contact are defined.

**IV. Test & Release Readiness:**

* **[ ] Test Strategy & Test Cases Defined:**
    * **[ ] Test Cases Cover Happy Path, Negative Scenarios, and Edge Cases:** Following established Test Maturity Model (TMM) guidelines or equivalent.
    * **[ ] Acceptance Criteria are Verifiable by Test Cases.**
* **[ ] Required Testing Materials & Test Data Identified/Documented:**
    * **[ ] Test Data Needs Met for Development & QA:** Availability of or plan to create necessary test data is confirmed.
    * **[ ] Test Environment Requirements Documented & Confirmed.**
* **[ ] Performance & Load Testing Requirements (if applicable):** Scope and requirements for performance testing are defined.
* **[ ] Security Testing Requirements (if applicable):** Scope and requirements for security vulnerability assessments are defined.
* **[ ] Production Release Strategy & Timeline Documented:** High-level plan for deployment, including any phased rollouts, feature flagging, or rollback plans.
* **[ ] Monitoring & Alerting Requirements Identified:** How the success and health of this item will be monitored in production is outlined.

**V. Team Understanding & Capacity:**

* **[ ] Item Sized/Estimated by the Delivery Team:** The team has had the opportunity to discuss the item and provide an estimate of effort.
* **[ ] Skills & Knowledge Available:** The team confirms it has the necessary skills and knowledge to deliver the item, or a plan to acquire them is in place.
* **[ ] Team Capacity Confirmed:** The item fits within the team's capacity for the upcoming iteration/PI, considering other commitments.

---

## Rider Document: The Cost of Change After "Ready"

**Preamble:**

Once an item (Jira Story, Epic, or PI Plan component) has met the Definition of Ready (DoR) and has been formally accepted as "Ready," it signifies a shared understanding and commitment based on the information available at that time. Changes introduced after this point inherently disrupt planned work, impact dependent teams, and incur costs to the organization. This document outlines the increasing nature of these costs.

The "cost" of a change is not merely financial; it encompasses:

* **Time & Effort:** Rework, re-planning, re-estimating, re-testing.
* **Opportunity Cost:** Delaying other valuable work.
* **Resource Re-allocation:** Pulling people off planned tasks.
* **Context Switching:** Reducing team focus and efficiency.
* **Dependency Ripple Effects:** Impacting timelines and commitments of other teams.
* **Morale & Frustration:** Due to churn and perceived lack of direction.
* **Risk Introduction:** Potential for new defects or unforeseen issues with late changes.

**Impact Tiers Based on Item Hierarchy:**

The later a change is introduced and the higher its position in the work hierarchy, the more significant its impact.

**1. Change to a Jira Story (Post-DoR, Pre-Sprint Commitment):**

* **Nature of Change:** Minor scope adjustments, clarification of acceptance criteria, minor technical approach tweaks.
* **Potential Costs:**
    * **Low-Medium Impact:**
        * Re-discussion and re-clarification within the immediate team.
        * Minor updates to documentation and test cases.
        * Possible small re-estimation.
        * Minimal impact on PI commitments if addressed quickly.
* **Process for Change:**
    * Discussed with Product Owner and Tech Lead.
    * If significant, may require re-evaluation against DoR criteria.

**2. Change to a Jira Story (Post-Sprint Commitment / In-Sprint):**

* **Nature of Change:** Scope creep, significant alteration of acceptance criteria, change in technical direction that impacts ongoing work.
* **Potential Costs:**
    * **Medium-High Impact:**
        * **Disruption to Sprint Goals:** May jeopardize sprint completion.
        * **Wasted Effort:** Work already completed may need to be discarded or redone.
        * **Team Context Switching:** Developers may need to stop current tasks, re-evaluate, and re-plan.
        * **Increased Testing Effort:** Re-testing and potentially new test case development.
        * **Potential for Slip into Next Sprint:** Impacting future planned work.
        * **Impact on Team Morale:** Frustration from rework and shifting goals.
* **Process for Change:**
    * Requires formal discussion with Product Owner, Tech Lead, and Scrum Master/Team Lead.
    * May necessitate removing other work from the sprint to accommodate.
    * Clear documentation of the change and its rationale.

**3. Change to an Epic (Post-DoR for the Epic):**

* **Nature of Change:** Significant shift in requirements, addition/removal of multiple stories, fundamental change in technical strategy or architecture related to the Epic, changes impacting multiple teams contributing to the Epic.
* **Potential Costs:**
    * **High Impact:**
        * **Re-planning of Multiple Sprints:** Affects the roadmap for the Epic.
        * **Re-scoping and Re-estimation of Multiple Stories:** Significant effort in re-evaluation.
        * **Architectural Rework:** If the change impacts underlying design.
        * **Cross-Team Misalignment:** Requires re-coordination and re-commitment from dependent teams.
        * **Delayed Epic Delivery:** Potentially impacting PI goals and downstream dependencies.
        * **Resource Re-allocation Across Teams:** May require shuffling priorities and resources.
        * **Significant Documentation Updates:** PRDs, design documents, test plans.
        * **Budgetary Impact:** Potential for increased costs if external resources or new tools are needed.
* **Process for Change:**
    * Requires escalation and approval from Product Management leadership, Engineering leadership, and potentially other key stakeholders.
    * Thorough impact assessment across all affected teams and stories.
    * Formal re-planning session for the Epic.
    * Communication of changes to all relevant parties.

**4. Change to the PI Plan (Post-PI Planning & DoR Sign-off for PI Objectives):**

* **Nature of Change:** Introduction of new, unplanned Epics; significant de-scoping or re-prioritization of committed PI Objectives; fundamental changes to cross-team dependencies agreed upon during PI Planning.
* **Potential Costs:**
    * **Very High - Severe Impact:**
        * **Invalidation of PI Goals:** The entire PI commitment may be at risk.
        * **Widespread Re-planning:** Affects most, if not all, teams involved in the PI.
        * **Major Disruption to Dependent Teams:** Commitments made during PI planning may become void, causing significant cascading delays and frustration.
        * **Loss of Predictability:** Erodes trust in the planning process.
        * **Significant Context Switching Across the Organization:** Pulls numerous individuals into emergency re-planning.
        * **Potential for Burnout and Decreased Morale:** Constant major shifts can be demoralizing.
        * **Strategic Misalignment:** May indicate a disconnect between ongoing work and evolving business strategy that wasn't caught earlier.
        * **Resource Contention:** Creates competition for scarce resources as teams scramble to adjust.
        * **Reputational Risk:** Inability to deliver on communicated commitments.
* **Process for Change:**
    * Requires executive-level review and approval (e.g., Product Leadership, Engineering Leadership, Business Unit Leaders).
    * A formal "State of Emergency" re-planning meeting may be necessary, potentially involving a subset or all of the original PI Planning attendees.
    * Clear and transparent communication across the entire Product organization regarding the reasons for the change and the new plan.
    * A retrospective should be conducted to understand why such a significant change was necessary post-PI commitment and how to prevent similar occurrences.

**Conclusion:**

While change is inevitable, understanding and acknowledging its cost, especially after items are deemed "Ready," is crucial for maintaining a healthy, predictable, and efficient product development process. This framework aims to make the implications of such changes transparent, encouraging thorough upfront planning and thoughtful consideration before altering committed work.
