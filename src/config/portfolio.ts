export interface Project {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  architecture?: string[];
  metrics?: string[];
  tags: string[];
  category: string;
  image?: string;
  demoUrl?: string;
  githubUrl?: string;
}

export interface Metric {
  value: string;
  label: string;
  detail: string;
}

export interface Capability {
  title: string;
  badge: string;
  description: string;
  features: string[];
  technologies: string[];
}

export interface StackGroup {
  label: string;
  items: string[];
  copies: number;
  duration: number;
  reverse?: boolean;
}

export const PORTFOLIO_CONFIG = {
  profile: {
    name: "Sree Adithya",
    firstName: "Sree",
    lastName: "Adithya",
    wordmark: "ADITHYA",
    role: {
      bold: "AI",
      light: "Architect",
    },
    tagline: "Designing resilient multi-agent swarms, low-latency inference pipelines, and enterprise-scale RAG systems.",
    availability: "Available for Architecture & Advisory",
    location: "Global / Remote",
    email: "sreeadithya.ndd@gmail.com",
    portraitUrl: "/portrait.jpg",
    socials: {
      github: "https://github.com/SreeAdithya123",
      linkedin: "https://linkedin.com/in/sreeadithya",
      twitter: "https://x.com/sreeadithya_ai",
    },
  },

  theme: {
    accent: "#ff5c3d", // High-Energy Neon Orange
    accentHover: "#ff7a5f",
    bg: "#050505",
    bgCard: "#0d0d0d",
    border: "rgba(255, 255, 255, 0.1)",
  },

  metrics: [
    {
      value: "100M+",
      label: "Tokens / Day",
      detail: "Optimized multi-tenant inference cluster throughput",
    },
    {
      value: "99.94%",
      label: "Agent Tool Reliability",
      detail: "Self-healing tool routing with dynamic fallback schemas",
    },
    {
      value: "42ms",
      label: "TTFT (First Token)",
      detail: "Speculative decoding + KV cache prefix sharing",
    },
    {
      value: "$1.4M",
      label: "Compute Savings",
      detail: "Through targeted SLM distillation & prompt caching",
    },
  ] as Metric[],

  capabilities: [
    {
      title: "Agentic AI & Autonomous Workflows",
      badge: "Orchestration",
      description:
        "Multi-agent systems that plan, reason, and execute end-to-end workflows — with deterministic tool calling, bounded state, human-in-the-loop gates, and long-term memory.",
      features: [
        "Hierarchical planner–executor agents with dynamic tool routing",
        "Deterministic human-in-the-loop escalation and approval gates",
        "Agent-to-agent (A2A) coordination with durable, replayable state",
      ],
      technologies: ["LangGraph", "Temporal", "A2A", "gRPC", "Python", "Rust"],
    },
    {
      title: "Enterprise AI & Private Knowledge Systems",
      badge: "Knowledge & RAG",
      description:
        "Private, air-gapped knowledge platforms that turn your documents into grounded answers — hybrid vector and graph retrieval with auditable citations.",
      features: [
        "Hybrid dense-vector, BM25, and knowledge-graph retrieval",
        "Role-aware access control with per-document permissions",
        "Grounded answers with inline, verifiable citations",
      ],
      technologies: ["Qdrant", "Neo4j", "Milvus", "Cohere Rerank", "LlamaIndex"],
    },
    {
      title: "Real-Time Voice AI & Conversational Systems",
      badge: "Voice & Realtime",
      description:
        "Sub-second voice agents and chat copilots with natural turn-taking, barge-in, and live tool access — built on streaming speech, low-latency inference, and expressive synthesis.",
      features: [
        "Streaming STT → LLM → TTS pipeline with sub-second latency",
        "Barge-in, interruption handling, and natural turn detection",
        "Function calling and live context injection during conversation",
      ],
      technologies: ["Whisper", "Deepgram", "ElevenLabs", "WebRTC", "vLLM"],
    },
    {
      title: "Advanced AI Research & Intelligent Vision",
      badge: "Research & Vision",
      description:
        "Applied research and computer-vision systems — from custom model training and evaluation to real-time detection, tracking, OCR, and multimodal understanding in production.",
      features: [
        "Custom model design, fine-tuning, and rigorous benchmarking",
        "Real-time object detection, tracking, and video analytics",
        "Document intelligence: OCR, layout parsing, and multimodal grounding",
      ],
      technologies: ["PyTorch", "OpenCV", "TensorRT", "CLIP", "HuggingFace"],
    },
    {
      title: "Edge AI & Intelligent Hardware",
      badge: "Edge & Devices",
      description:
        "On-device intelligence for constrained hardware — quantized models, accelerated inference, and tightly coupled software/hardware pipelines that run offline with minimal power.",
      features: [
        "Quantization and distillation (INT4 / FP8) for on-device models",
        "Accelerated inference on Apple Silicon, NVIDIA Jetson, and NPUs",
        "Offline-first pipelines with over-the-air model updates",
      ],
      technologies: ["ONNX", "GGML", "TensorRT", "Jetson", "CoreML"],
    },
  ] as Capability[],

  /* Tech stack marquees — one row per layer (About section) */
  stack: [
    {
      label: "Orchestration",
      items: [
        "LangGraph",
        "Temporal",
        "gRPC",
        "AutoGPT Core",
        "Multi-Agent",
        "Tool Calling",
        "State Machines",
        "Python",
        "Rust",
      ],
      copies: 2,
      duration: 54,
    },
    {
      label: "Retrieval",
      items: [
        "Qdrant",
        "Neo4j",
        "Milvus",
        "Cohere Rerank",
        "LlamaIndex",
        "Hybrid Search",
        "BM25",
        "HNSW",
        "PostgreSQL",
      ],
      copies: 3,
      duration: 46,
      reverse: true,
    },
    {
      label: "Model Efficiency",
      items: [
        "Axolotl",
        "Unsloth",
        "HuggingFace",
        "PyTorch",
        "vLLM",
        "QLoRA / LoRA",
        "Distillation",
        "ONNX",
      ],
      copies: 2,
      duration: 60,
    },
    {
      label: "Systems & Cloud",
      items: [
        "TensorRT-LLM",
        "vLLM",
        "Triton Server",
        "Kubernetes",
        "Ray",
        "Docker",
        "CUDA",
        "Redis",
        "Quantization",
      ],
      copies: 3,
      duration: 50,
      reverse: true,
    },
  ] as StackGroup[],

  projects: [
    {
      id: "vyoman-interviewer",
      title: "Vyoman Interviewer",
      subtitle: "Voice-powered AI interviews with intelligent candidate evaluation.",
      description:
        "Vyoman Interviewer is an AI-powered interview platform designed to simulate realistic interviews through voice interactions. It aims to help candidates practice answering questions, receive feedback, and improve their interview performance.",
      tags: ["Generative AI", "Voice AI", "LLMs", "ElevenLabs", "Supabase", "React"],
      category: "AI Apps",
      image: "/projects/vyoman-interviewer.jpg",
    },
    {
      id: "catalyst-ai",
      title: "Catalyst AI",
      subtitle: "Accelerating materials research with artificial intelligence.",
      description:
        "Catalyst AI is a scientific research platform concept for exploring chemistry, polymers, and materials science with AI assistance. It aims to support research workflows through intelligent search, research conversations, and materials exploration.",
      tags: ["Scientific AI", "Chemistry", "LLMs", "Materials Science", "React"],
      category: "Scientific AI",
      image: "/projects/catalyst-ai.jpg",
    },
    {
      id: "diabetic-foot-ulcer-classification",
      title: "Hybrid CNN–Transformer for Diabetic Foot Ulcer Classification",
      subtitle: "Explainable deep learning for medical image classification.",
      description:
        "This research project explores a hybrid CNN–Transformer framework for classifying diabetic foot ulcer images. The work focuses on combining visual feature extraction with attention mechanisms to investigate classification performance and model interpretability.",
      tags: ["Deep Learning", "CNN", "Transformer", "Medical AI", "Computer Vision", "PyTorch"],
      category: "AI Research",
      image: "/projects/diabetic-foot-ulcer-classification.jpg",
    },
    {
      id: "ai-daily-study-planner",
      title: "AI Daily Study Planner",
      subtitle: "Personalized study planning powered by AI.",
      description:
        "An AI-assisted study planning application concept that helps students organize subjects, manage study schedules, and track learning progress. The planned experience combines personalized scheduling, productivity tools, and intelligent learning assistance.",
      tags: ["Generative AI", "EdTech", "Expo", "React Native", "Supabase", "Productivity"],
      category: "AI Apps",
      image: "/projects/ai-daily-study-planner.jpg",
    },
    {
      id: "petsta",
      title: "Petsta",
      subtitle: "A smarter digital companion for modern pet care.",
      description:
        "Petsta is a pet-care platform concept designed to bring pet profiles, health records, reminders, and community features into one experience. It aims to make everyday pet management more organized and accessible.",
      tags: ["Pet Tech", "Digital Products", "UI/UX", "Community", "Health Tracking"],
      category: "Pet Tech",
      image: "/projects/petsta.jpg",
    },
    {
      id: "parcelflow",
      title: "ParcelFlow",
      subtitle: "Smarter parcel management for busy restaurants.",
      description:
        "ParcelFlow is a restaurant order-management concept designed to coordinate kitchen preparation, parcel packing, and dispatch. Its planned workflow includes order tracking, packing checklists, and delivery-status monitoring to help reduce operational errors.",
      tags: ["Workflow Automation", "Restaurant Tech", "Order Management", "React", "Supabase"],
      category: "Business Automation",
      image: "/projects/parcelflow.jpg",
    },
  ] as Project[],

  breakout: {
    headline: ["AI THAT", "SHIPS"],
    caption: "Break the barrier. Autonomous, resilient AI systems.",
    startingLives: 3,
  },
};
