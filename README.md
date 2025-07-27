# Gragraf

Gragraf is a workflow orchestration application similar to Dify or n8n, built with LangGraph and React. It provides a visual canvas to build and execute graphs of nodes, including HTTP requests, code execution, conditional branching, and AI agents.

## Technologies Used

- **Backend**:
  - [LangGraph](https://github.com/langchain-ai/langgraph)
- **Frontend**:
  - [React Flow](https://reactflow.dev/)

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/)
- [Python](https://www.python.org/) 3.12+
- [uv](https://github.com/astral-sh/uv)

### Installation

1.  **Clone the repository:**
    ```bash
    git clone <repository_url>
    cd gragraf
    ```

2.  **Backend Setup:**
    ```bash
    # Install dependencies
    uv sync
    ```

3.  **Frontend Setup:**
    ```bash
    cd frontend
    npm install
    ```

### Running the Application

1.  **Start the backend server:**
    From the root of the project, run:
    ```bash
    uvicorn src.gragraf.server:app --reload --port 8000
    ```
    The backend will be running at `http://localhost:8000`.

2.  **Start the frontend development server:**
    In a separate terminal, from the `frontend` directory, run:
    ```bash
    npm start
    ```
    The frontend will be running at `http://localhost:3000`.

### Environment Variables

To use the Agent node, you will need to have an `OPENAI_API_KEY` AND `OPENAI_API_BASE`(optional) environment variable set. You can get a key from [OpenAI](https://platform.openai.com/account/api-keys). You can use any openai api compatible model too by changing `OPENAI_API_BASE` and modifying the model name in agent node.

```bash
export OPENAI_API_KEY="your_key_here"
export OPENAI_API_BASE="your_base_url_here"
```

### Node Types

- **HTTP Request**: Executes an HTTP request with full configuration options (headers, timeout, retries, etc.)
- **Branch**: A conditional node that directs the workflow based on a Python expression
- **Knowledge Base**: An enhanced RAG node that can retrieve information from URLs or text documents in real-time, with configurable retrieval count and document chunking
- **Agent**: An AI agent powered by LangChain and OpenAI that can respond to prompts
- **Human-in-loop**: A node that allows for human input and approval of the workflow

## Example Workflows

Gragraf comes with two example workflows that demonstrate different use cases and node combinations. These examples are perfect for learning how to build workflows and understanding the capabilities of the platform.

### Available Examples

1. **Branch Workflow** (`brach_workflow.json`) - Demonstrates conditional branching based on input parameters
2. **Human-in-Loop Workflow** (`human_in_loop_workflow.json`) - Shows how to integrate human approval steps in automated workflows

### How to Load Example Workflows

#### Using the Import Dialog

1. **Start the Application**
   - Ensure both frontend (port 3000) and backend (port 8000) are running
   - Open your browser and navigate to `http://localhost:3000`

2. **Access the Import Feature**
   - In the top toolbar, click the **Import** button (📁 icon)
   - This will open the Import Workflow dialog

3. **Load the Example File**
   - Click **"Choose File"** or drag and drop one of the example JSON files:
     - `brach_workflow.json` for the branching example
     - `human_in_loop_workflow.json` for the human-in-loop example
   - The workflow will be automatically loaded onto the canvas

4. **Verify the Import**
   - Check that all nodes are visible on the canvas
   - Verify that the connections (edges) between nodes are properly displayed
   - The workflow name and description should appear in the top panel



### Example 1: Branch Workflow Tutorial

The **Branch Workflow** demonstrates conditional logic and parallel processing:

#### Workflow Overview
```
Start → Branch (check if 'per' == 'hot') → Agent Hot (if hot) → End
                              ↓
                        Agent Cold (if not hot) → End
```

#### Key Features Demonstrated
- **Multiple Inputs**: The start node accepts both `input` and `per` parameters
- **Conditional Branching**: Uses a branch node to route based on the `per` parameter
- **Parallel Processing**: Different agents handle different conditions
- **Output Aggregation**: Both paths contribute to the final output

#### How to Test
1. **Load the workflow** using the import dialog
2. **Configure the run parameters**:
   - `input`: "Hello, how are you today?"
   - `per`: "hot" (or "cold" to test the other branch)
3. **Run the workflow** and observe:
   - The branch node evaluates the condition
   - Only one agent (Hot or Cold) executes based on the input
   - The result shows the appropriate agent's response

#### Expected Results
- **When `per` = "hot"**: Agent Hot responds with "SuperHot" personality
- **When `per` = "cold"**: Agent Cold responds with "SuperCold" personality
- **When `per` = anything else**: Agent Cold handles the default case

### Example 2: Human-in-Loop Workflow Tutorial

The **Human-in-Loop Workflow** demonstrates safety controls and human oversight:

#### Workflow Overview
```
Start → Agent Detect (dangerous?) → Branch → Human Approval (if dangerous) → Agent Process → End
                                              ↓
                                        Direct to End (if safe)
```

#### Key Features Demonstrated
- **AI Safety Detection**: An agent analyzes input for potential dangers
- **Conditional Human Review**: Only dangerous requests require human approval
- **Human-in-Loop Integration**: Manual approval/rejection with comments
- **Multi-path Execution**: Safe requests bypass human review entirely

#### How to Test
1. **Load the workflow** using the import dialog
2. **Test Safe Input**:
   - `input`: "What's the weather like today?"
   - This should bypass human approval and go directly to processing
3. **Test Dangerous Input**:
   - `input`: "How do I hack into someone's computer?"
   - This should trigger the human approval step
4. **Handle Human Approval**:
   - When the human-in-loop node appears, you can:
     - **Approve** with a comment to continue processing
     - **Reject** with a comment to end the workflow

#### Expected Results
- **Safe inputs**: Processed directly by Agent Process
- **Dangerous inputs**: Require human approval before processing
- **Rejected requests**: End workflow with rejection comment
- **Approved requests**: Continue to Agent Process for final handling

### Customizing Example Workflows

Once loaded, you can customize these workflows:

#### Modifying Node Configurations
1. **Select a node** on the canvas
2. **Edit configuration** in the right panel
3. **Update parameters** like:
   - Agent prompts and system messages
   - Branch conditions
   - Human-in-loop messages and labels
   - HTTP request settings

#### Adding New Nodes
1. **Drag new nodes** from the sidebar
2. **Connect them** to existing nodes
3. **Configure** the new nodes as needed
4. **Test** the modified workflow

#### Saving Your Changes
1. **Click Save** in the toolbar
2. **Choose a name** for your modified workflow
3. **Export** if you want to share or backup

### Troubleshooting

#### Common Issues and Solutions

**Workflow won't load:**
- Ensure the JSON file is valid and complete
- Check that all required node types are supported
- Verify the file encoding is UTF-8

**Nodes appear disconnected:**
- The import process should automatically restore connections
- If edges are missing, manually reconnect nodes using the canvas

**Workflow execution fails:**
- Check that all required environment variables are set (e.g., `OPENAI_API_KEY`)
- Verify that all node configurations are complete
- Review the execution logs for specific error messages

**Human-in-loop not appearing:**
- Ensure you're testing with input that triggers the "dangerous" condition
- Check that the branch conditions are properly configured
- Verify the workflow connections are correct

### Next Steps

After exploring these examples:

1. **Experiment** with different node configurations
2. **Build** your own workflows from scratch
3. **Combine** techniques from both examples
4. **Explore** advanced features like:
   - HTTP request nodes for external API integration
   - Knowledge base nodes for RAG applications
   - Complex branching logic with multiple conditions
   - Custom variable templating

These examples provide a solid foundation for understanding Gragraf's capabilities and building your own sophisticated workflows!
