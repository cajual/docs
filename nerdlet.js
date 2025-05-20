// nerdlets/my-tracked-nerdlet/index.js
import React, { useState, useEffect, useContext, useRef } from 'react';
import {
    PlatformStateContext, // To get accountId, potentially more
    UserSessionContext,   // To get userId, email
    NerdGraphMutation,    // To send custom events
    Stack,
    StackItem,
    HeadingText,
    BillboardChart,
    TableChart,
    LineChart
} from 'nr1';
import { v4 as uuidv4 } from 'uuid'; // For generating session IDs

// --- Configuration ---
const NERDLET_ID = 'my-tracked-nerdlet'; // Matches your nerdlet's folder name or id in package.json
const NERDLET_VERSION = '0.1.0'; // Your Nerdlet's version
const HEARTBEAT_INTERVAL_MS = 30000; // 30 seconds
const CUSTOM_EVENT_TYPE = 'NerdletActivity';

function MyTrackedNerdlet() {
    const platformState = useContext(PlatformStateContext);
    const userSession = useContext(UserSessionContext);
    const [sessionId, setSessionId] = useState(null);
    const [startTime, setStartTime] = useState(null);
    const heartbeatIntervalRef = useRef(null);

    const sendNerdletActivityEvent = async (action, additionalAttributes = {}) => {
        if (!platformState || !userSession || !userSession.currentUser || !sessionId) {
            console.warn('User or platform context not yet available for tracking.');
            return;
        }

        const { accountId } = platformState;
        const { id: userId, email: userEmail } = userSession.currentUser;

        const eventPayload = {
            eventType: CUSTOM_EVENT_TYPE,
            nerdletId: NERDLET_ID,
            nerdletVersion: NERDLET_VERSION,
            userId: userId,
            userEmail: userEmail, // Be mindful of PII
            userAccountId: accountId,
            sessionId: sessionId,
            action: action,
            timestamp: Date.now(),
            pageUrl: window.location.href,
            ...additionalAttributes,
        };

        if (startTime) {
            eventPayload.durationSinceLoadMs = Date.now() - startTime;
        }

        console.log('Sending Nerdlet Activity:', eventPayload);

        const mutation = {
            mutation: `mutation($event: EventBatch!) { eventCollectorPostEvents(events: $event) { success failureCount } }`,
            variables: {
                event: [eventPayload], // Send as a batch of one event
            },
        };
        try {
            const { data, error } = await NerdGraphMutation.mutate(mutation);
            if (error) {
                console.error('Error sending custom event to NerdGraph:', error);
            } else if (data?.eventCollectorPostEvents?.failureCount > 0) {
                console.error('NerdGraph reported failure in sending custom event:', data);
            } else {
               // console.log('Custom event sent successfully:', data);
            }
        } catch (e) {
            console.error('Exception sending custom event:', e);
        }
    };

    // --- Effects for initialization, heartbeats, and cleanup ---
    useEffect(() => {
        // 1. Set Session ID and Start Time on initial load
        setSessionId(uuidv4());
        setStartTime(Date.now());

        return () => {
            // 5. Cleanup on unmount
            if (heartbeatIntervalRef.current) {
                clearInterval(heartbeatIntervalRef.current);
            }
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            sendNerdletActivityEvent('unload');
        };
    }, []); // Runs once on mount

    useEffect(() => {
        if (sessionId && startTime && userSession.currentUser) { // Ensure these are set before sending 'load'
            // 2. Send 'load' event
            sendNerdletActivityEvent('load');

            // 3. Start Heartbeat
            if (heartbeatIntervalRef.current) clearInterval(heartbeatIntervalRef.current);
            heartbeatIntervalRef.current = setInterval(() => {
                if (document.visibilityState === 'visible') {
                    sendNerdletActivityEvent('heartbeat');
                }
            }, HEARTBEAT_INTERVAL_MS);

            // 4. Handle Visibility Changes
            document.addEventListener('visibilitychange', handleVisibilityChange);
        }
    }, [sessionId, startTime, userSession.currentUser]); // Re-run if these crucial pieces of state update

    const handleVisibilityChange = () => {
        sendNerdletActivityEvent('visibilityChange', {
            visibilityState: document.visibilityState,
        });
    };

    // --- Render your Nerdlet's actual content here ---
    if (!userSession.currentUser) {
        return <HeadingText>Loading user information...</HeadingText>;
    }

    return (
        <Stack directionType={Stack.DIRECTION_TYPE.VERTICAL} fullWidth style={{padding: '20px'}}>
            <StackItem>
                <HeadingText type={HeadingText.TYPE.HEADING_1}>My Tracked Nerdlet</HeadingText>
            </StackItem>
            <StackItem>
                <p>This Nerdlet's activity is being tracked.</p>
                <p>User ID: {userSession.currentUser.id}</p>
                <p>User Email: {userSession.currentUser.email}</p>
                <p>Account ID: {platformState.accountId}</p>
                <p>Session ID: {sessionId}</p>
                <p>Nerdlet Loaded At: {startTime ? new Date(startTime).toLocaleTimeString() : 'N/A'}</p>
            </StackItem>
            <StackItem style={{marginTop: '20px'}}>
                <HeadingText type={HeadingText.TYPE.HEADING_2}>Example Content Area</HeadingText>
                {/*
                    You would put your actual dashboard-like content here.
                    For example, fetching data and displaying charts.
                */}
                <BillboardChart
                    accountId={platformState.accountId}
                    query="SELECT count(*) FROM Transaction SINCE 30 minutes ago"
                />
            </StackItem>
        </Stack>
    );
}

export default MyTrackedNerdlet;
