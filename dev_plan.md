# Development Plan: Remove Claude Support and Name Mapping

## Objective
Modify the application to only support OpenAI models and remove the name mapping functionality.

## Tasks

### 1. Frontend Changes
- [x] Update `AgentConfigForm.tsx` to only show OpenAI models
- [x] Remove Claude model options from the dropdown
- [x] Update default model to a single OpenAI model
- [x] Remove model name mapping - show actual model names instead of friendly names
- [x] Remove offline models (GPT-4 Turbo, GPT-3.5 Turbo)
- [x] Add custom model input functionality

### 2. Backend Changes  
- [x] Update `AgentConfig` in `agent.py` to use a single default OpenAI model
- [x] Remove any model name mapping or validation logic
- [x] Ensure only OpenAI models are supported

### 3. Test Updates
- [x] Update test files to use only OpenAI models
- [x] Remove any Claude-related test cases
- [x] Ensure all tests pass with OpenAI-only configuration

### 4. Documentation Updates
- [x] Update README.md to reflect OpenAI-only support
- [x] Remove any mentions of Claude or other model providers
- [x] Update example workflows to use OpenAI models only

### 5. Testing
- [x] Test the frontend to ensure model selection works correctly
- [x] Test backend execution with OpenAI models
- [x] Verify that existing workflows still work
- [x] Build test passed successfully
- [x] Custom model input functionality implemented
- [x] Fix custom model input bug - now users can type in the input field

### 6. Bug Fixes
- [x] Fix Run workflow panel visibility issue - added proper positioning CSS to RightPanel component
- [x] Unify Run workflow panel UI with node configuration panels - moved Run workflow form to ConfigPanel as a floating panel
- [x] Unify execution results panel UI with other panels - moved execution results to ConfigPanel as a floating panel

## Implementation Details

### Model Options to Keep
- gpt-4o-mini
- gpt-4o
- 自定义模型输入功能

### Model Options to Remove
- Claude 3.5 Sonnet
- Claude 3 Haiku
- GPT-4 Turbo (已下线)
- GPT-3.5 Turbo (已下线)

### Default Model
- Set default to "gpt-4o-mini" consistently across frontend and backend

### UI Improvements
- Run workflow panel now uses the same floating panel design as node configuration panels
- Execution results panel now uses the same floating panel design as other panels
- Consistent positioning and styling across all panels (ConfigPanel, Run workflow, Execution results)
- Better user experience with unified interface design
- RightPanel simplified to be a placeholder component
- All UI panels now use the same floating design pattern
