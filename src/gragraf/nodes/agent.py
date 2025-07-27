import os
from typing import Dict, Any, Optional
from pydantic import BaseModel, Field
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from ..utils.templating import render_config
import logging
import asyncio

logger = logging.getLogger(__name__)

class AgentConfig(BaseModel):
    model_name: str = "gpt-4o"
    temperature: float = Field(0.7, description="The temperature for the LLM.")
    system_prompt: str = "You are a helpful assistant."
    user_prompt: str = ""
    output_name: Optional[str] = None
    variable_mappings: Optional[Dict[str, str]] = Field(default_factory=dict, description="Maps input variables to prompt placeholders")

class AgentNode:
    def __init__(self, node_id: str, config: AgentConfig, api_key: str | None = None):
        self.node_id = node_id
        self.config = config
        effective_api_key = api_key or os.getenv("OPENAI_API_KEY")
        maybe_proxy = os.getenv("OPENAI_BASE_URL")
        
        if not effective_api_key:
            raise ValueError("OPENAI_API_KEY environment variable not set and no key provided.")
        
        self.llm = ChatOpenAI(
            model_name=self.config.model_name,
            temperature=self.config.temperature,
            base_url=maybe_proxy,
        ).bind(stream=True)
        
        self.prompt_template = ChatPromptTemplate.from_messages([
            ("system", config.system_prompt),
            ("human", config.user_prompt)
        ], template_format="mustache")
        self.output_parser = StrOutputParser()
        self.chain = self.prompt_template | self.llm | self.output_parser

    def execute(self, state: Dict[str, Any]) -> Dict[str, Any]:
        """Synchronous execute method for LangGraph compatibility."""
        try:
            rendered_config = render_config(self.config, state)
            processed_state = self._apply_variable_mappings(state, rendered_config.variable_mappings)
            result = self.chain.invoke(processed_state)
            output_key = self.config.output_name or f"{self.node_id}_output"
            return {output_key: result}
            
        except Exception as e:
            logger.error(f"Agent {self.node_id} execution failed: {e}")
            raise Exception(f"Agent {self.node_id} execution failed: {str(e)}") from e

    async def execute_async(self, state: Dict[str, Any]) -> Dict[str, Any]:
        """Async execute method for testing compatibility."""
        try:
            rendered_config = render_config(self.config, state)
            processed_state = self._apply_variable_mappings(state, rendered_config.variable_mappings)
            
            result = await self.chain.ainvoke(processed_state)
            
            output_key = self.config.output_name or f"{self.node_id}_output"
            return {output_key: result}
            
        except Exception as e:
            logger.error(f"Agent {self.node_id} execution failed: {e}")
            raise Exception(f"Agent {self.node_id} execution failed: {str(e)}") from e

    def _apply_variable_mappings(self, state: Dict[str, Any], mappings: Dict[str, str]) -> Dict[str, Any]:
        """Apply variable mappings to transform state variables for the agent."""
        if not mappings:
            return state
        
        processed_state = state.copy()
        for source_var, target_var in mappings.items():
            if source_var in state:
                processed_state[target_var] = state[source_var]
        
        return processed_state

    def get_variable_requirements(self) -> Dict[str, Any]:
        """Get information about what variables this agent needs."""
        from ..utils.templating import find_template_variables
        
        return {
            "system_prompt_vars": list(find_template_variables(self.config.system_prompt)),
            "user_prompt_vars": list(find_template_variables(self.config.user_prompt)),
            "variable_mappings": self.config.variable_mappings or {},
            "output_name": self.config.output_name or f"{self.node_id}_output"
        } 