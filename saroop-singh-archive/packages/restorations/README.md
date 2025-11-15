# Saroop Singh Archive - Image Restoration Systems

This directory contains two independent image restoration implementations:

## 📁 Directory Structure

```
restorations/
├── python-restoration/       # Python-based restoration system (Primary)
│   ├── api/                 # Vercel serverless functions
│   ├── lib/                 # Core Python libraries
│   ├── scripts/             # Standalone scripts
│   ├── tests/               # Test suite
│   ├── airtable/            # Airtable integration
│   ├── web/                 # Next.js web interface
│   ├── docs/                # Documentation
│   └── [config files]       # .env, requirements.txt, etc.
│
└── adk_restoration/         # ADK multi-agent system (Alternative)
    └── [Node.js implementation]
```

## 🚀 Quick Start

### Python Restoration System
```bash
cd python-restoration
pip install -r requirements.txt
python scripts/run_workflow.py
```
See [python-restoration/README.md](python-restoration/README.md) for full documentation.

### ADK Restoration System
```bash
cd adk_restoration
npm install
npm start
```
See [adk_restoration/README.md](adk_restoration/README.md) for full documentation.

## 📚 Documentation

- **Python System**: [python-restoration/README.md](python-restoration/README.md)
- **ADK System**: [adk_restoration/README.md](adk_restoration/README.md)

## 🔧 Technologies

- **Python System**: Python, Gemini 2.5 Flash AI, Vercel, Airtable
- **ADK System**: Node.js, Composio ADK, Multi-agent architecture

Both systems are production-ready and can be used independently based on your requirements.