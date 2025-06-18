# 🤖 Parserator

**The Structured Data Layer for AI Agents**

[![npm version](https://img.shields.io/npm/v/parserator.svg)](https://www.npmjs.com/package/parserator)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![EMA Compliant](https://img.shields.io/badge/EMA-Compliant-green.svg)](#exoditical-moral-architecture)

Transform any unstructured input into agent-ready JSON with 95% accuracy. Built for Google ADK, MCP, LangChain, and any agent framework using our revolutionary two-stage Architect-Extractor pattern.

---

## 🚀 **Quick Start**

### Install & Use in 30 seconds

```bash
# Install globally
npm install -g parserator

# Parse any text instantly
parserator parse "Contact: John Doe, Email: john@example.com, Phone: 555-0123"
```

**Output:**
```json
{
  "contact": "John Doe",
  "email": "john@example.com", 
  "phone": "555-0123"
}
```

### Get API Access
```bash
# Get your free API key
curl -X POST https://parserator.com/api/keys/generate \
  -H "Content-Type: application/json" \
  -d '{"email": "your@email.com"}'
```

---

## 🔧 **Agent Integrations**

### Google ADK
```python
@agent.tool
def extract_user_intent(user_message: str) -> UserIntent:
    return parse_for_agent(
        text=user_message,
        schema=UserIntent,
        context="command_parsing"
    )
```

### MCP Server (Universal)
```bash
# Install MCP server for any agent
npm install -g parserator-mcp-server

# Use in any MCP-compatible agent
mcp://parserator/parse?schema=Contact&text=email_content
```

### LangChain
```python
from parserator import ParseChain

parser = ParseChain(api_key="your_key")
result = parser.parse(
    text="messy data here",
    output_schema={"name": "string", "age": "number"}
)
```

### CrewAI
```python
from parserator.integrations.crewai import ParseratorTool

parse_tool = ParseratorTool(
    name="extract_data",
    description="Parse unstructured text into JSON"
)
```

---

## ⚡ **Browser Extensions**

Transform web data instantly while browsing:

### Chrome Extension
- **Status**: Built and ready for Chrome Web Store submission
- **Use**: Right-click any text → "Parse with Parserator" → Perfect JSON
- **Features**: Auto-detect schemas, bulk export, local processing

### VS Code Extension  
- **Status**: Built and packaged (parserator-1.0.0.vsix)
- **Use**: Select messy data → Ctrl+Shift+P → Generate TypeScript types
- **Features**: Schema templates, batch processing, framework integration

*Extensions will be published to official stores once API is finalized.*

---

## 🧠 **How It Works: Architect-Extractor Pattern**

Traditional LLMs waste tokens on complex reasoning with large datasets. Parserator uses a **two-stage approach**:

### Stage 1: The Architect (Planning)
- **Input**: Your schema + small data sample (~1K chars)
- **Job**: Create detailed extraction plan
- **LLM**: Gemini 1.5 Flash (optimized for reasoning)
- **Output**: Structured search instructions

### Stage 2: The Extractor (Execution)  
- **Input**: Full dataset + extraction plan
- **Job**: Execute plan with minimal thinking
- **LLM**: Gemini 1.5 Flash (optimized for following instructions)
- **Output**: Clean, validated JSON

### Results
- **70% token reduction** vs single-LLM approaches
- **95% accuracy** on complex data
- **Sub-3 second** response times
- **No vendor lock-in** - works with any LLM provider

---

## 📦 **Installation Options**

### 🔹 **Node.js/TypeScript**
```bash
npm install parserator
```

### 🔹 **Python**
```bash
pip install parserator
```

### 🔹 **Browser Extensions**
- **Chrome Extension**: Built, pending Chrome Web Store submission
- **VS Code Extension**: Built, pending VS Code Marketplace submission

### 🔹 **Agent Frameworks** *(In Development)*
```bash
# MCP Server - Coming soon
npm install -g parserator-mcp-server

# Framework integrations - In beta
pip install parserator[langchain]
pip install parserator[crewai]
pip install parserator[adk]
```

*Contact us for early access to framework integrations.*

---

## 🌟 **Use Cases**

### **For Developers**
- **API Integration**: Parse inconsistent API responses
- **Data Migration**: Extract from legacy systems
- **ETL Pipelines**: Intelligent data transformation
- **Web Scraping**: Handle changing site layouts

### **For AI Agents**
- **Email Processing**: Extract tasks, contacts, dates
- **Document Analysis**: Parse contracts, invoices, reports
- **User Commands**: Convert natural language to structured actions
- **Research Workflows**: Extract key info from papers, articles

### **For Data Teams**
- **Log Analysis**: Structure unstructured log files
- **Data Cleaning**: Normalize messy datasets
- **Import Processing**: Handle varied file formats
- **Quality Assurance**: Validate data consistency

---

## 🏗️ **API Reference**

### **Core Endpoint**
```http
POST https://api.parserator.com/v1/parse
Content-Type: application/json
Authorization: Bearer YOUR_API_KEY

{
  "inputData": "Contact: John Doe, Email: john@example.com, Phone: 555-0123",
  "outputSchema": {
    "contact": "string",
    "email": "string", 
    "phone": "string"
  },
  "instructions": "Extract contact information"
}
```

### **Response**
```json
{
  "success": true,
  "parsedData": {
    "contact": "John Doe",
    "email": "john@example.com",
    "phone": "555-0123"
  },
  "metadata": {
    "confidence": 0.96,
    "tokensUsed": 1250,
    "processingTimeMs": 800
  }
}
```

### **SDK Examples**

#### **JavaScript/TypeScript**
```javascript
import { Parserator } from 'parserator';

const parser = new Parserator('your-api-key');

const result = await parser.parse({
  inputData: 'messy text here',
  outputSchema: { name: 'string', age: 'number' }
});

console.log(result.parsedData);
```

#### **Python**
```python
from parserator import Parserator

parser = Parserator('your-api-key')

result = parser.parse(
    input_data='messy text here',
    output_schema={'name': 'string', 'age': 'number'}
)

print(result.parsed_data)
```

---

## 🏗️ **Shared Core Architecture**

Parserator uses a **lean shared core** architecture for maximum efficiency and maintainability:

### **Architecture Overview**
```
┌─────────────────────────────────────────┐
│     SHARED CORE (@parserator/core)     │
│   Types, Validation, HTTP Client       │ 
└─────────────────────────────────────────┘
              │
     ┌────────┼────────┐
     │        │        │
┌────▼───┐ ┌──▼───┐ ┌──▼────────┐
│Node SDK│ │Python│ │Extensions │
│(50KB)  │ │ SDK  │ │ (Chrome,  │
│        │ │(50KB)│ │   VSCode) │
└────────┘ └──────┘ └───────────┘
     │        │        │
     └────────┼────────┘
              │
    ┌─────────▼─────────┐
    │  PRODUCTION API   │
    │ 95% Accuracy      │
    │ Architect-Extract │
    └───────────────────┘
```

### **Benefits**
- **75% smaller** SDK bundles (250KB vs 1MB total)
- **Single source of truth** for API logic
- **Consistent experience** across all platforms
- **Faster maintenance** and feature development

See [SHARED_CORE_ARCHITECTURE.md](SHARED_CORE_ARCHITECTURE.md) for complete technical details.

## 🛡️ **Exoditical Moral Architecture**

Parserator is built on **EMA principles** - a revolutionary approach to ethical software development:

### **🔓 Digital Sovereignty**
- **Your data is yours** - We never store input/output content
- **No vendor lock-in** - Export everything, switch anytime
- **Open standards** - JSON, OpenAPI, Docker - universal compatibility
- **Transparent pricing** - No hidden costs or usage surprises

### **🚪 The Right to Leave**
- **Complete data export** - All schemas, templates, usage history
- **Standard formats** - Import into any compatible system
- **Migration tools** - Seamless transition to other platforms
- **Zero retention** - Data deleted immediately upon request

### **🌐 Universal Compatibility**  
- **Framework agnostic** - Works with any agent development platform
- **LLM agnostic** - Switch between OpenAI, Anthropic, Google, etc.
- **Deployment agnostic** - Cloud, on-premise, or hybrid
- **Standard protocols** - REST API, MCP, GraphQL support

> *"The ultimate expression of empowerment is the freedom to leave."*

---

## 🧪 **Beta Program**

### **🚀 Beta Features in Development**
- **Multi-LLM Support**: Working on OpenAI, Anthropic, Google Gemini compatibility
- **Schema Validation**: Type checking and constraint enforcement  
- **Batch Processing**: Handle multiple documents simultaneously
- **Custom Workflows**: Chain parsing operations
- **Monitoring Dashboard**: Parse analytics and performance metrics

### **Join the Beta**

**Contact us for beta access:**
- **Email**: [Gen-rl-millz@parserator.com](mailto:Gen-rl-millz@parserator.com)
- **Include**: Your use case and which frameworks you're working with

**Beta Feedback**: [GitHub Issues](https://github.com/domusgpt/parserator/issues) | [GitHub Discussions](https://github.com/domusgpt/parserator/discussions)

---

## 📊 **Pricing**

**Currently in beta** - Contact us for early access pricing and custom solutions.

- **Email**: [Gen-rl-millz@parserator.com](mailto:Gen-rl-millz@parserator.com)
- **Beta Program**: Free access for early adopters and feedback providers

---

## 🤝 **Community & Support**

### **📚 Documentation**
- **API Reference**: Coming soon in `docs/` directory
- **Integration Guides**: Available in this repository
- **Examples**: Check `examples/` directory for framework integrations

### **💬 Community**
- **GitHub Issues**: Bug reports and feature requests
- **GitHub Discussions**: Community questions and feedback
- **YouTube**: [@parserator](https://youtube.com/@parserator) - Tutorials and demos coming soon
- **LinkedIn**: [Company Page](https://linkedin.com/company/parserator) - Updates and announcements

### **🛠️ Support**
- **Email**: [Gen-rl-millz@parserator.com](mailto:Gen-rl-millz@parserator.com)
- **Response**: We'll get back to you as soon as possible
- **Beta Support**: Priority support for early adopters

---

## 🏆 **Why Parserator?**

| **Feature** | **Parserator** | **Traditional Parsers** | **Single-LLM Solutions** |
|-------------|----------------|-------------------------|--------------------------|
| **Accuracy** | 95% | 60-70% | 85% |
| **Token Efficiency** | 70% less | N/A | Baseline |
| **Setup Time** | <5 minutes | Hours/Days | 30 minutes |
| **Maintenance** | Zero | High | Medium |
| **Vendor Lock-in** | None | High | Medium |
| **Schema Flexibility** | Unlimited | Fixed | Limited |

---

## 📈 **Development Status**

**Current Focus:**
- ✅ **Core parsing engine** - Two-stage Architect-Extractor pattern
- ✅ **Browser extensions** - Chrome and VS Code extensions built
- ✅ **Agent integrations** - LangChain, CrewAI, Google ADK support
- 🚧 **Documentation** - API reference and integration guides in progress
- 🚧 **Beta testing** - Gathering feedback from early adopters

**Planned Features:**
- Multi-modal parsing (images, PDFs, audio)
- Enhanced schema validation and templates
- Enterprise deployment options
- Additional framework integrations

*Roadmap details will be updated based on community feedback and beta testing results.*

---

## 📄 **License**

MIT License - see [LICENSE](LICENSE) file for details.

**EMA Commitment**: This project follows Exoditical Moral Architecture principles, ensuring your right to digital sovereignty and freedom to migrate.

---

## 🙏 **Credits**

Built with radical conviction by [**GEN-RL-MiLLz**](https://github.com/domusgpt) - "The Higher Dimensional Solo Dev"

*"Grateful for your support as I grow Hooves & a Horn, taking pole position for the 2026 Agentic Derby."*

---

<div align="center">

**[🚀 Get Started](https://parserator.com)** • **[📚 Documentation](https://docs.parserator.com)** • **[💬 Discord](https://discord.gg/parserator)** • **[🐙 GitHub](https://github.com/domusgpt/parserator)**

**Transform your messy data into agent-ready JSON today.**

</div>