# Focused Refactoring Plan for Meta-Human Project

## Executive Summary

This plan addresses the three most impactful architectural issues identified in the architecture review, using a gradual, non-breaking approach. The focus is on decoupling the dialogue layer from the UI store, adding backend validation, and implementing session cleanup.

## Priority Order

1. **Backend Chat Input Validation** (Easiest, highest impact, lowest risk)
2. **Backend Session Memory Cleanup** (Medium complexity, prevents memory leaks)
3. **Frontend Dialogue Layer Decoupling** (Most complex, highest architectural value)

---

## Change 1: Backend Chat Input Validation

### Problem
`server/app/api/chat.py` ChatRequest has `userText: str` with no constraints, allowing empty or excessively long input.

### Solution
Add validation following the pattern already established in `server/app/api/speech.py`.

### Files to Modify
- `server/app/api/chat.py`

### Implementation Details

**Before:**
```python
class ChatRequest(BaseModel):
  sessionId: Optional[str] = None
  userText: str
  meta: Optional[Dict[str, Any]] = None
```

**After:**
```python
class ChatRequest(BaseModel):
  sessionId: Optional[str] = None
  userText: str
  meta: Optional[Dict[str, Any]] = None

@router.post("/chat", response_model=ChatResponse)
async def chat(req: ChatRequest) -> ChatResponse:
  """对话接口：输入文本，返回结构化的数字人驱动信息。"""
  # Validate userText
  user_text = (req.userText or "").strip()
  if not user_text:
    raise ValidationError("userText 不能为空")
  if len(user_text) > 5000:
    raise ValidationError("userText 超过最大长度 5000 字符")

  result = await dialogue_service.generate_reply(
    user_text=user_text,
    session_id=req.sessionId,
    meta=req.meta,
  )
  return ChatResponse(**result)
```

Apply the same validation to `chat_stream` endpoint.

### Verification
1. Send empty string → should return 400 error
2. Send string > 5000 chars → should return 400 error
3. Send valid string → should work as before
4. Run existing tests (if any) to ensure no regression

### Risk Assessment
- **Risk Level**: Low
- **Breaking Changes**: None (rejecting invalid input that shouldn't work anyway)
- **Rollback**: Simple (remove validation lines)

---

## Change 2: Backend Session Memory Cleanup

### Problem
`server/app/services/dialogue.py` uses module-level `session_histories` and `_session_messages` with no TTL or cleanup, causing unbounded memory growth.

### Solution
Add TTL-based cleanup mechanism with configurable timeout and cleanup interval.

### Files to Modify
1. `server/app/config.py` - Add configuration
2. `server/app/services/dialogue.py` - Add cleanup logic

### Implementation Details

#### Step 1: Update `server/app/config.py`

**Add to Settings dataclass:**
```python
@dataclass(frozen=True)
class Settings:
    # ... existing fields ...
    
    # Session cleanup (new)
    session_ttl_seconds: int = 1800  # 30 minutes
    session_cleanup_interval_seconds: int = 300  # 5 minutes
```

**Add to get_settings() function:**
```python
return Settings(
    # ... existing fields ...
    session_ttl_seconds=_int("SESSION_TTL_SECONDS", 1800),
    session_cleanup_interval_seconds=_int("SESSION_CLEANUP_INTERVAL_SECONDS", 300),
)
```

#### Step 2: Update `server/app/services/dialogue.py`

**Add new module-level variables:**
```python
from app.config import get_settings

settings = get_settings()

# Track last activity timestamp per session
session_last_activity: Dict[str, float] = {}
last_cleanup_time: float = time.time()
```

**Add cleanup function:**
```python
def _cleanup_expired_sessions() -> None:
    """Remove sessions inactive for longer than SESSION_TTL_SECONDS."""
    global last_cleanup_time
    
    now = time.time()
    if now - last_cleanup_time < settings.session_cleanup_interval_seconds:
        return  # Not time to cleanup yet
    
    last_cleanup_time = now
    cutoff_time = now - settings.session_ttl_seconds
    
    # Find expired sessions
    expired_sessions = [
        session_id 
        for session_id, last_activity in session_last_activity.items()
        if last_activity < cutoff_time
    ]
    
    # Remove expired sessions
    for session_id in expired_sessions:
        logger.info("Cleaning up expired session: %s", session_id)
        if session_id in session_histories:
            del session_histories[session_id]
        if session_id in self._session_messages:
            del self._session_messages[session_id]
        if session_id in session_last_activity:
            del session_last_activity[session_id]
```

**Update `_append_session_history` to track activity:**
```python
def _append_session_history(self, session_id: str, role: str, content: str) -> None:
    if not session_id or not content:
        return
    
    # Track activity
    session_last_activity[session_id] = time.time()
    
    # Trigger cleanup check
    _cleanup_expired_sessions()
    
    # Existing logic
    session_histories[session_id].append({
      "role": role,
      "content": content,
      "timestamp": datetime.now().isoformat(),
    })
    if len(session_histories[session_id]) > MAX_HISTORY_LENGTH * 2:
      session_histories[session_id] = session_histories[session_id][-MAX_HISTORY_LENGTH * 2:]
```

**Update `clear_session` to also remove activity tracking:**
```python
def clear_session(self, session_id: str) -> bool:
    """清除指定会话的历史记录"""
    removed = False
    if session_id in session_histories:
        del session_histories[session_id]
        removed = True
    if session_id in self._session_messages:
        del self._session_messages[session_id]
        removed = True
    if session_id in session_last_activity:
        del session_last_activity[session_id]
        removed = True
    return removed
```

### Verification
1. Create a session, wait > 30 minutes, access again → should be cleaned up
2. Create multiple sessions, check memory usage over time → should not grow unbounded
3. Verify active sessions are not cleaned up
4. Test with custom SESSION_TTL_SECONDS environment variable

### Risk Assessment
- **Risk Level**: Medium
- **Breaking Changes**: None
- **Rollback**: Remove cleanup logic, restore original code
- **Testing Needed**: Long-running test to verify cleanup works

---

## Change 3: Frontend Dialogue Layer Decoupling

### Problem
Core services (dialogueService, dialogueOrchestrator) directly call `useDigitalHumanStore.getState()` to mutate UI state instead of returning data to the caller.

### Solution
Refactor the dialogue layer to return data and receive callbacks, following the pattern already established in `dialogueOrchestrator.runDialogueTurn`.

### Files to Modify
1. `src/core/dialogue/dialogueService.ts` - Return connection status instead of setting it
2. `src/core/dialogue/dialogueOrchestrator.ts` - Receive all callbacks as parameters
3. `src/pages/AdvancedDigitalHumanPage.tsx` - Update callers to handle returned data

### Implementation Details

#### Step 1: Update `src/core/dialogue/dialogueService.ts`

**Change return type of `sendUserInput`:**

**Before:**
```typescript
export async function sendUserInput(
  payload: ChatRequestPayload,
  config: DialogueServiceConfig = {}
): Promise<ChatResponsePayload> {
  const { maxRetries, retryDelay, timeout } = { ...DEFAULT_CONFIG, ...config };
  const store = useDigitalHumanStore.getState();

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // 更新连接状态
      if (attempt > 0) {
        store.setConnectionStatus('connecting');
      }
      // ... fetch logic ...
      
      // 成功 - 更新连接状态
      store.setConnectionStatus('connected');
      store.clearError();
      
      return {
        replyText: data.replyText ?? '',
        emotion: data.emotion ?? 'neutral',
        action: data.action ?? 'idle',
      };
    } catch (error: unknown) {
      // ... error handling ...
    }
  }

  // 所有重试都失败了，返回降级响应
  console.error('对话服务所有重试都失败:', lastError);
  store.setConnectionStatus('error');
  store.setError(lastError?.message || '对话服务不可用');

  return getFallbackResponse(payload.userText);
}
```

**After:**
```typescript
export interface DialogueServiceResult {
  response: ChatResponsePayload;
  connectionStatus: 'connected' | 'connecting' | 'error';
  error: string | null;
  usedFallback: boolean;
}

export async function sendUserInput(
  payload: ChatRequestPayload,
  config: DialogueServiceConfig = {}
): Promise<DialogueServiceResult> {
  const { maxRetries, retryDelay, timeout } = { ...DEFAULT_CONFIG, ...config };
  
  let lastError: Error | null = null;
  let finalConnectionStatus: 'connected' | 'connecting' | 'error' = 'connected';
  let usedFallback = false;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // Update connection status (returned to caller)
      if (attempt > 0) {
        finalConnectionStatus = 'connecting';
      }

      const response = await fetchWithTimeout(
        `${API_BASE_URL}/v1/chat`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        },
        timeout
      );

      if (!response.ok) {
        const isRetryable = isRetryableError(response.status);
        const errorMsg = getErrorMessage(response.status, `服务错误: ${response.status}`);

        if (isRetryable && attempt < maxRetries) {
          lastError = new DialogueApiError(errorMsg, response.status, true);
          await sleep(retryDelay * (attempt + 1));
          continue;
        }

        throw new DialogueApiError(errorMsg, response.status, false);
      }

      const data = await response.json();

      // Success
      finalConnectionStatus = 'connected';
      
      return {
        response: {
          replyText: data.replyText ?? '',
          emotion: data.emotion ?? 'neutral',
          action: data.action ?? 'idle',
        },
        connectionStatus: finalConnectionStatus,
        error: null,
        usedFallback: false,
      };

    } catch (error: unknown) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Handle abort (timeout)
      if (lastError.name === 'AbortError') {
        lastError = new DialogueApiError('请求超时，请重试', 408, true);
      }

      // Handle network errors
      if (lastError instanceof TypeError && lastError.message.includes('fetch')) {
        lastError = new DialogueApiError('网络连接失败，请检查网络', 0, true);
      }

      // If retryable and attempts remain, continue
      if (attempt < maxRetries) {
        const canRetry =
          lastError instanceof DialogueApiError ? lastError.isRetryable : true;
        if (canRetry) {
          await sleep(retryDelay * (attempt + 1));
          continue;
        }
      }
    }
  }

  // All retries failed, return fallback
  console.error('对话服务所有重试都失败:', lastError);
  finalConnectionStatus = 'error';
  usedFallback = true;
  
  const fallbackResponse = getFallbackResponse(payload.userText);

  return {
    response: fallbackResponse,
    connectionStatus: finalConnectionStatus,
    error: lastError?.message || '对话服务不可用',
    usedFallback: true,
  };
}
```

**Apply same pattern to `streamUserInput`:**

Update the return type and add connection status tracking in the stream function.

#### Step 2: Update `src/core/dialogue/dialogueOrchestrator.ts`

**Add `onError` callback to `DialogueHandleOptions`:**

**Before:**
```typescript
export interface DialogueHandleOptions {
  isMuted?: boolean;
  speakWith?: (text: string) => Promise<void> | void;
  addAssistantMessage?: boolean;
}
```

**After:**
```typescript
export interface DialogueHandleOptions {
  isMuted?: boolean;
  speakWith?: (text: string) => Promise<void> | void;
  addAssistantMessage?: boolean;
  onError?: (error: string) => void;
}
```

**Update `handleDialogueResponse` to use callback:**

**Before:**
```typescript
export async function handleDialogueResponse(
  res: ChatResponsePayload,
  options: DialogueHandleOptions = {}
): Promise<void> {
  const store = useDigitalHumanStore.getState();
  const {
    isMuted = false,
    speakWith,
    addAssistantMessage = true,
  } = options;

  if (addAssistantMessage && res.replyText) {
    store.addChatMessage('assistant', res.replyText);
  }

  if (res.emotion) {
    digitalHumanEngine.setEmotion(res.emotion);
  }

  if (res.action && res.action !== 'idle') {
    digitalHumanEngine.playAnimation(res.action);
  }

  if (res.replyText && !isMuted && speakWith) {
    try {
      await speakWith(res.replyText);
    } catch (error: unknown) {
      console.warn('语音播报失败，但对话文本已返回:', error);
      store.setError(error instanceof Error ? error.message : '语音播报失败');
    }
  }
}
```

**After:**
```typescript
export async function handleDialogueResponse(
  res: ChatResponsePayload,
  options: DialogueHandleOptions = {}
): Promise<void> {
  const {
    isMuted = false,
    speakWith,
    addAssistantMessage = true,
    onError,
  } = options;

  if (addAssistantMessage && res.replyText) {
    // Return message data instead of setting in store
    // Caller will handle: store.addChatMessage('assistant', res.replyText);
  }

  if (res.emotion) {
    digitalHumanEngine.setEmotion(res.emotion);
  }

  if (res.action && res.action !== 'idle') {
    digitalHumanEngine.playAnimation(res.action);
  }

  if (res.replyText && !isMuted && speakWith) {
    try {
      await speakWith(res.replyText);
    } catch (error: unknown) {
      console.warn('语音播报失败，但对话文本已返回:', error);
      const errorMsg = error instanceof Error ? error.message : '语音播报失败';
      onError?.(errorMsg);
    }
  }
}
```

**Update `runDialogueTurn` to accept more callbacks and return data:**

**Before:**
```typescript
export async function runDialogueTurn(
  userText: string,
  options: DialogueTurnOptions = {}
): Promise<ChatResponsePayload | undefined> {
  const content = userText.trim();
  if (!content) {
    return undefined;
  }

  if (pendingTurn) {
    console.warn('对话请求被忽略：上一轮对话仍在进行中');
    return undefined;
  }

  const store = useDigitalHumanStore.getState();
  const {
    sessionId = store.sessionId,
    meta,
    isMuted = store.isMuted,
    speakWith,
    addUserMessage = true,
    addAssistantMessage = true,
    setLoading,
  } = options;

  if (addUserMessage) {
    store.addChatMessage('user', content);
  }

  store.setLoading(true);
  setLoading?.(true);
  store.setBehavior('thinking');

  const execute = async (): Promise<ChatResponsePayload | undefined> => {
    try {
      const response = await sendUserInput({
        sessionId,
        userText: content,
        meta,
      });

      await handleDialogueResponse(response, {
        isMuted,
        speakWith,
        addAssistantMessage,
      });

      return response;
    } finally {
      store.setLoading(false);
      setLoading?.(false);
      pendingTurn = null;

      if (useDigitalHumanStore.getState().currentBehavior === 'thinking') {
        useDigitalHumanStore.getState().setBehavior('idle');
      }
    }
  };

  pendingTurn = execute();
  return pendingTurn;
}
```

**After:**
```typescript
export interface DialogueTurnResult {
  response: ChatResponsePayload;
  connectionStatus: 'connected' | 'connecting' | 'error';
  error: string | null;
  usedFallback: boolean;
}

export async function runDialogueTurn(
  userText: string,
  options: DialogueTurnOptions = {}
): Promise<DialogueTurnResult | undefined> {
  const content = userText.trim();
  if (!content) {
    return undefined;
  }

  if (pendingTurn) {
    console.warn('对话请求被忽略：上一轮对话仍在进行中');
    return undefined;
  }

  const {
    sessionId,
    meta,
    isMuted,
    speakWith,
    addUserMessage = true,
    addAssistantMessage = true,
    setLoading,
    addUserMessage: onAddUserMessage,
    addAssistantMessage: onAddAssistantMessage,
    onError,
  } = options;

  // Callbacks for UI updates
  onAddUserMessage?.(content);
  setLoading?.(true);

  const execute = async (): Promise<DialogueTurnResult | undefined> => {
    try {
      const result = await sendUserInput({
        sessionId,
        userText: content,
        meta,
      });

      await handleDialogueResponse(result.response, {
        isMuted,
        speakWith,
        addAssistantMessage,
        onError,
      });

      return result;
    } finally {
      setLoading?.(false);
      pendingTurn = null;
    }
  };

  pendingTurn = execute();
  return pendingTurn;
}
```

#### Step 3: Update `src/pages/AdvancedDigitalHumanPage.tsx`

**Update the handleChatSend function:**

**Before:**
```typescript
const handleChatSend = useCallback(async (text?: string) => {
  const content = (text ?? chatInput).trim();
  if (!content || isChatLoading) return;

  if (!text) setChatInput('');

  try {
    await runDialogueTurn(content, {
      sessionId,
      meta: { timestamp: Date.now() },
      isMuted,
      speakWith: (textToSpeak) => ttsService.speak(textToSpeak),
      setLoading: setIsChatLoading,
    });
  } catch (err: unknown) {
    console.error('发送消息失败:', err);
    toast.error(err instanceof Error ? err.message : '发送失败，请重试');
  }
}, [chatInput, isChatLoading, sessionId, isMuted]);
```

**After:**
```typescript
const handleChatSend = useCallback(async (text?: string) => {
  const content = (text ?? chatInput).trim();
  if (!content || isChatLoading) return;

  if (!text) setChatInput('');

  try {
    const result = await runDialogueTurn(content, {
      sessionId,
      meta: { timestamp: Date.now() },
      isMuted,
      speakWith: (textToSpeak) => ttsService.speak(textToSpeak),
      setLoading: setIsChatLoading,
      addUserMessage: (msg) => {
        // Now handled by callback instead of store mutation
        useDigitalHumanStore.getState().addChatMessage('user', msg);
      },
      addAssistantMessage: (msg) => {
        useDigitalHumanStore.getState().addChatMessage('assistant', msg);
      },
      onError: (error) => {
        useDigitalHumanStore.getState().setError(error);
      },
    });
    
    // Handle connection status update
    if (result) {
      setConnectionStatus(result.connectionStatus);
      if (result.error) {
        toast.error(result.error);
      }
    }
  } catch (err: unknown) {
    console.error('发送消息失败:', err);
    toast.error(err instanceof Error ? err.message : '发送失败，请重试');
  }
}, [chatInput, isChatLoading, sessionId, isMuted, setConnectionStatus]);
```

### Verification
1. Send valid chat message → should work as before
2. Test with server down → should show connection error in UI
3. Test with slow network → should show connecting status
4. Verify chat messages appear in history
5. Verify no direct store mutations in dialogueService
6. Run all existing UI interactions

### Risk Assessment
- **Risk Level**: Medium-High
- **Breaking Changes**: None (if callbacks are properly implemented)
- **Rollback**: Revert dialogueService and dialogueOrchestrator changes, update UI calls
- **Testing Needed**: Comprehensive UI testing of all chat flows

---

## Implementation Order and Dependencies

### Phase 1: Backend (Low Risk)
1. **Change 1**: Chat input validation (30 minutes)
   - Independent, no dependencies
   - Test immediately after implementation

2. **Change 2**: Session cleanup (1-2 hours)
   - Independent of Change 1
   - Requires long-running test to verify

### Phase 2: Frontend (Higher Risk)
3. **Change 3**: Dialogue layer decoupling (2-3 hours)
   - Must complete before this starts
   - Requires careful testing of UI interactions
   - Consider doing this in stages:
     a. Update dialogueService first (return data)
     b. Update dialogueOrchestrator (accept callbacks)
     c. Update UI callers (handle callbacks)

### Total Time Estimate: 4-6 hours

---

## Testing Strategy

### Backend Changes
1. **Validation Tests**:
   - Empty string input
   - Oversized input (>5000 chars)
   - Valid input
   - Special characters

2. **Session Cleanup Tests**:
   - Create session, wait for expiration, verify cleanup
   - Create multiple sessions, monitor memory
   - Verify active sessions persist
   - Test with custom TTL values

### Frontend Changes
1. **Dialogue Flow Tests**:
   - Normal chat flow
   - Server unreachable scenario
   - Slow network scenario
   - Multiple rapid messages
   - Voice integration with dialogue

2. **Regression Tests**:
   - All existing chat functionality
   - Voice commands
   - Quick actions
   - Error handling

---

## Rollback Plan

### Backend
- **Change 1 (Validation)**: Remove validation lines from chat.py
- **Change 2 (Session Cleanup)**: Remove cleanup logic, remove config additions

### Frontend
- **Change 3 (Decoupling)**: Revert dialogueService, dialogueOrchestrator, and UI changes to original implementation

All changes are isolated enough that rollback should be straightforward.

---

## Success Criteria

1. **Change 1**: Invalid input rejected with clear error messages
2. **Change 2**: Session memory does not grow unbounded over 24+ hours
3. **Change 3**: Dialogue services no longer directly mutate store; all state changes flow through UI layer

---

## Critical Files for Implementation

This plan requires modifications to the following files:

### Backend
1. `/home/shane/lessup/mini-engines/meta-human/server/app/api/chat.py` - Add input validation
2. `/home/shane/lessup/mini-engines/meta-human/server/app/config.py` - Add session cleanup configuration
3. `/home/shane/lessup/mini-engines/meta-human/server/app/services/dialogue.py` - Implement session cleanup logic

### Frontend
4. `/home/shane/lessup/mini-engines/meta-human/src/core/dialogue/dialogueService.ts` - Return data instead of mutating store
5. `/home/shane/lessup/mini-engines/meta-human/src/core/dialogue/dialogueOrchestrator.ts` - Accept callbacks instead of importing store
6. `/home/shane/lessup/mini-engines/meta-human/src/pages/AdvancedDigitalHumanPage.tsx` - Handle callbacks from dialogue layer

---

## Next Steps

1. Review and approve this plan
2. Start with Change 1 (backend validation)
3. Test Change 1 thoroughly
4. Implement Change 2 (session cleanup)
5. Run long-running test for Change 2
6. Implement Change 3 (dialogue decoupling) in stages
7. Comprehensive testing of Change 3
8. Final integration testing
9. Deploy and monitor

