.PHONY: test test-unit test-integration test-verbose test-coverage clean install dev lint format help

# 默认目标
help:
	@echo "Available commands:"
	@echo "  test              - 运行所有测试"
	@echo "  test-unit         - 运行单元测试"
	@echo "  test-integration  - 运行集成测试"
	@echo "  test-verbose      - 运行测试（详细输出）"
	@echo "  test-coverage     - 运行测试并生成覆盖率报告"
	@echo "  install           - 安装依赖"
	@echo "  dev               - 开发模式安装"
	@echo "  lint              - 代码检查"
	@echo "  format            - 代码格式化"
	@echo "  clean             - 清理缓存和临时文件"
	@echo "  server            - 启动服务器"

# 测试相关
test:
	python -m pytest tests/ -x --tb=short

test-unit:
	python -m pytest tests/test_*_node.py tests/test_dsl_parser.py tests/test_graph_compiler.py -v

test-integration:
	python -m pytest tests/test_end_to_end.py tests/test_server.py tests/test_enhanced_variable_resolution.py tests/test_multi_start_nodes.py -v

test-verbose:
	python -m pytest tests/ -v --tb=long

test-coverage:
	python -m pytest tests/ --cov=src/gragraf --cov-report=html --cov-report=term

# 开发相关
install:
	pip install -e .

dev:
	pip install -e ".[dev]"

lint:
	ruff check src/ tests/
	mypy src/

format:
	ruff format src/ tests/
	ruff check --fix src/ tests/

# 清理
clean:
	find . -type d -name "__pycache__" -exec rm -rf {} +
	find . -type f -name "*.pyc" -delete
	find . -type d -name ".pytest_cache" -exec rm -rf {} +
	find . -type d -name "htmlcov" -exec rm -rf {} +
	find . -type f -name ".coverage" -delete

# 服务器启动
server:
	cd src && USER_AGENT="Gragraf/1.0 (Workflow Orchestrator)" python -m gragraf.server

# 快速开发测试（只运行当前修改相关的测试）
test-quick:
	python -m pytest tests/test_end_to_end.py tests/test_graph_compiler.py tests/test_dsl_parser.py -v 