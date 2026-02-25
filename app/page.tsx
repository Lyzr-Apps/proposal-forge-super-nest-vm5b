'use client'

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { callAIAgent, AIAgentResponse } from '@/lib/aiAgent'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  FiFileText, FiClock, FiChevronDown, FiChevronUp, FiChevronRight,
  FiDownload, FiEdit3, FiSearch, FiMenu, FiX, FiPlus, FiCheck,
  FiAlertCircle, FiFolder, FiCalendar, FiDollarSign, FiTarget,
  FiStar, FiLayers, FiArrowRight, FiRefreshCw, FiCopy
} from 'react-icons/fi'

// ─── Constants ────────────────────────────────────────────────────────────────

const AGENT_ID = '699f7a394b34ff0a9387f910'
const STORAGE_KEY = 'proposalforge_history'

const PROJECT_TYPES = [
  'Branding',
  'Campaign',
  'Content Strategy',
  'Web Design',
  'Social Media',
  'Full-Service',
]

// ─── Types ────────────────────────────────────────────────────────────────────

interface ProposalData {
  proposal_title?: string
  client_name?: string
  executive_summary?: string
  client_context?: string
  scope_of_work?: string
  deliverables?: string
  pricing_breakdown?: string
  total_estimate?: string
  timeline_and_milestones?: string
  terms_and_next_steps?: string
  generated_date?: string
}

interface FormData {
  clientName: string
  clientProfile: string
  projectType: string
  serviceRequirements: string
  budgetRange: string
  timeline: string
  specialNotes: string
}

interface SavedProposal {
  id: string
  formData: FormData
  proposalData: ProposalData
  pdfUrl: string | null
  status: 'Complete' | 'Draft'
  createdAt: string
}

// ─── Sample Data ──────────────────────────────────────────────────────────────

const SAMPLE_FORM: FormData = {
  clientName: 'Meridian Luxe Hotels',
  clientProfile: 'Meridian Luxe Hotels is a boutique hospitality group operating 12 luxury properties across major European capitals. They are seeking to refresh their digital presence and brand identity to appeal to a younger affluent demographic while preserving their heritage of elegance.',
  projectType: 'Full-Service',
  serviceRequirements: 'Complete brand refresh including visual identity system, website redesign with booking integration, social media strategy and content creation, and a launch campaign targeting high-net-worth millennials and Gen-Z travelers.',
  budgetRange: '$250,000 - $400,000',
  timeline: '6 months',
  specialNotes: 'Must maintain brand heritage. Multilingual support for 5 languages required.',
}

const SAMPLE_PROPOSAL: ProposalData = {
  proposal_title: 'Brand Renaissance & Digital Transformation for Meridian Luxe Hotels',
  client_name: 'Meridian Luxe Hotels',
  executive_summary: '## Executive Summary\n\nWe propose a comprehensive brand renaissance for Meridian Luxe Hotels that bridges timeless luxury with contemporary digital engagement. Our approach combines **strategic brand repositioning**, a bespoke **digital ecosystem overhaul**, and a **targeted launch campaign** designed to captivate the next generation of discerning travelers.\n\nThis proposal outlines a structured pathway to elevate Meridian Luxe Hotels\' market position while honoring its distinguished heritage.',
  client_context: '## Client Context\n\nMeridian Luxe Hotels operates **12 boutique luxury properties** across major European capitals including Paris, London, Milan, and Vienna. With over 40 years of heritage, the brand is synonymous with refined elegance and personalized hospitality.\n\n**Key Challenges:**\n- Current digital presence does not reflect the brand\'s premium positioning\n- Need to attract affluent millennials and Gen-Z without alienating existing clientele\n- Multilingual requirements across 5 core markets\n- Competitive landscape includes emerging boutique hotel brands with strong digital DNA',
  scope_of_work: '## Scope of Work\n\n### Phase 1: Brand Strategy & Identity\n- Brand audit and competitive analysis\n- Customer persona development for new target demographics\n- Visual identity system redesign (logo refinement, typography, color palette, iconography)\n- Brand guidelines documentation\n\n### Phase 2: Digital Experience\n- Website redesign with responsive, luxury-focused UX\n- Booking engine integration with personalization features\n- Multilingual content architecture (EN, FR, DE, IT, ES)\n- Performance optimization and accessibility compliance\n\n### Phase 3: Social & Content Strategy\n- Social media strategy across Instagram, TikTok, and LinkedIn\n- Content calendar and editorial framework\n- Influencer partnership framework\n- Photography and video direction guides\n\n### Phase 4: Launch Campaign\n- Integrated digital campaign strategy\n- Paid media planning and execution\n- PR outreach and press kit development\n- Launch event concept and coordination',
  deliverables: '## Deliverables\n\n- **Brand Identity System** - Complete visual identity package with usage guidelines\n- **Website** - Fully responsive, multilingual website with booking integration\n- **Content Library** - 60+ pieces of branded content across formats\n- **Social Media Framework** - Strategy, templates, and 3-month content calendar\n- **Campaign Assets** - Full suite of digital advertising creative\n- **Analytics Dashboard** - Custom reporting for performance tracking\n- **Brand Guidelines** - Comprehensive 80-page brand standards document',
  pricing_breakdown: '## Pricing Breakdown\n\n| Phase | Description | Investment |\n|---|---|---|\n| Phase 1 | Brand Strategy & Identity | $65,000 |\n| Phase 2 | Digital Experience & Website | $120,000 |\n| Phase 3 | Social & Content Strategy | $45,000 |\n| Phase 4 | Launch Campaign | $55,000 |\n| Ongoing | Monthly Retainer (3 months) | $15,000/mo |\n\n**Additional considerations:**\n- Photography and video production: $25,000\n- Influencer partnerships budget: $20,000\n- Paid media spend (managed): $30,000',
  total_estimate: '$405,000',
  timeline_and_milestones: '## Timeline & Milestones\n\n**Month 1-2:** Discovery, brand strategy, identity development\n- Milestone: Brand strategy presentation and identity concepts\n\n**Month 2-3:** Identity refinement, website wireframes and design\n- Milestone: Approved brand identity system, website design mockups\n\n**Month 3-4:** Website development, content production begins\n- Milestone: Website beta launch, content library 50% complete\n\n**Month 4-5:** Social media setup, campaign preparation\n- Milestone: Social channels live, campaign assets ready\n\n**Month 5-6:** Website launch, campaign execution, optimization\n- Milestone: Full launch, first performance report',
  terms_and_next_steps: '## Terms & Next Steps\n\n**Payment Schedule:**\n- 30% upon project initiation\n- 25% at Phase 2 kickoff\n- 25% at Phase 4 kickoff\n- 20% upon project completion\n\n**Next Steps:**\n1. Schedule a discovery workshop with your leadership team\n2. Finalize scope and timeline adjustments\n3. Execute master services agreement\n4. Begin Phase 1 within 2 weeks of signing\n\n**Validity:** This proposal is valid for 30 days from the date of issue.\n\n**Contact:** For questions or to proceed, please reach out to your dedicated account director.',
  generated_date: '2026-02-25',
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
}

function parseAgentResponse(result: AIAgentResponse): ProposalData {
  let data: Record<string, unknown> = {}

  if (result.success && result.response) {
    if (result.response.result && typeof result.response.result === 'object') {
      data = result.response.result as Record<string, unknown>
    } else if (result.response.message && typeof result.response.message === 'string') {
      try {
        data = JSON.parse(result.response.message)
      } catch {
        data = { executive_summary: result.response.message }
      }
    }
  }

  if (Object.keys(data).length === 0 && result.raw_response) {
    try {
      const raw = JSON.parse(result.raw_response)
      if (raw.result) data = raw.result
      else data = raw
    } catch {
      // ignore
    }
  }

  return data as ProposalData
}

function formatInline(text: string): React.ReactNode {
  const parts = text.split(/\*\*(.*?)\*\*/g)
  if (parts.length === 1) return text
  return parts.map((part, i) =>
    i % 2 === 1 ? (
      <strong key={i} className="font-medium text-foreground">{part}</strong>
    ) : (
      <React.Fragment key={i}>{part}</React.Fragment>
    )
  )
}

function renderMarkdown(text: string): React.ReactNode {
  if (!text) return null
  return (
    <div className="space-y-2">
      {text.split('\n').map((line, i) => {
        if (line.startsWith('### '))
          return <h4 key={i} className="font-medium text-sm mt-4 mb-1 tracking-widest uppercase text-primary">{line.slice(4)}</h4>
        if (line.startsWith('## '))
          return <h3 key={i} className="font-medium text-base mt-4 mb-2 tracking-widest uppercase text-foreground">{line.slice(3)}</h3>
        if (line.startsWith('# '))
          return <h2 key={i} className="font-medium text-lg mt-5 mb-2 tracking-widest uppercase text-foreground">{line.slice(2)}</h2>
        if (line.startsWith('- ') || line.startsWith('* '))
          return <li key={i} className="ml-4 list-disc text-sm text-muted-foreground">{formatInline(line.slice(2))}</li>
        if (/^\d+\.\s/.test(line))
          return <li key={i} className="ml-4 list-decimal text-sm text-muted-foreground">{formatInline(line.replace(/^\d+\.\s/, ''))}</li>
        if (line.startsWith('|') && line.endsWith('|')) {
          const cells = line.split('|').filter(c => c.trim() !== '')
          if (cells.every(c => /^[\s-:]+$/.test(c))) return <React.Fragment key={i} />
          return (
            <div key={i} className="flex gap-4 text-sm py-1 border-b border-border/50">
              {cells.map((cell, ci) => (
                <span key={ci} className={`flex-1 ${ci === cells.length - 1 ? 'text-right text-primary' : 'text-muted-foreground'}`}>
                  {formatInline(cell.trim())}
                </span>
              ))}
            </div>
          )
        }
        if (!line.trim()) return <div key={i} className="h-2" />
        return <p key={i} className="text-sm text-muted-foreground leading-relaxed">{formatInline(line)}</p>
      })}
    </div>
  )
}

function loadHistory(): SavedProposal[] {
  if (typeof window === 'undefined') return []
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored)
      return Array.isArray(parsed) ? parsed : []
    }
  } catch { /* ignore */ }
  return []
}

function saveHistory(proposals: SavedProposal[]) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(proposals))
  } catch { /* ignore */ }
}

// ─── Error Boundary ───────────────────────────────────────────────────────────

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: string }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false, error: '' }
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error: error.message }
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
          <div className="text-center p-8 max-w-md">
            <h2 className="text-xl font-medium mb-2 tracking-widest uppercase">Something went wrong</h2>
            <p className="text-muted-foreground mb-4 text-sm">{this.state.error}</p>
            <button onClick={() => this.setState({ hasError: false, error: '' })} className="px-6 py-3 bg-primary text-primary-foreground text-sm tracking-widest uppercase">
              Try again
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

// ─── Sub-Components ───────────────────────────────────────────────────────────

function ProposalSection({
  title,
  icon,
  content,
  defaultOpen = false,
  onEdit,
}: {
  title: string
  icon: React.ReactNode
  content: string
  defaultOpen?: boolean
  onEdit?: (newContent: string) => void
}) {
  const [open, setOpen] = useState(defaultOpen)
  const [editing, setEditing] = useState(false)
  const [editValue, setEditValue] = useState(content)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    setEditValue(content)
  }, [content])

  useEffect(() => {
    if (editing && textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px'
      textareaRef.current.focus()
    }
  }, [editing])

  const handleSave = () => {
    setEditing(false)
    if (onEdit) onEdit(editValue)
  }

  return (
    <div className="border border-border bg-card">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-secondary/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-primary">{icon}</span>
          <span className="text-sm font-medium tracking-widest uppercase">{title}</span>
        </div>
        <div className="flex items-center gap-2">
          {onEdit && (
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation()
                setEditing(!editing)
              }}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); setEditing(!editing) } }}
              className="text-muted-foreground hover:text-primary transition-colors p-1"
            >
              <FiEdit3 size={14} />
            </span>
          )}
          {open ? <FiChevronUp size={16} className="text-muted-foreground" /> : <FiChevronDown size={16} className="text-muted-foreground" />}
        </div>
      </button>
      {open && (
        <div className="px-6 pb-6 pt-2">
          {editing ? (
            <div className="space-y-3">
              <textarea
                ref={textareaRef}
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                className="w-full bg-secondary/50 border border-border text-foreground text-sm p-4 resize-none focus:outline-none focus:border-primary min-h-[120px]"
              />
              <div className="flex gap-2 justify-end">
                <button onClick={() => { setEditing(false); setEditValue(content) }} className="px-4 py-2 text-xs tracking-widest uppercase text-muted-foreground hover:text-foreground transition-colors border border-border">
                  Cancel
                </button>
                <button onClick={handleSave} className="px-4 py-2 text-xs tracking-widest uppercase bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
                  <FiCheck size={12} className="inline mr-1" /> Save
                </button>
              </div>
            </div>
          ) : (
            renderMarkdown(content ?? '')
          )}
        </div>
      )}
    </div>
  )
}

function SkeletonSection() {
  return (
    <div className="border border-border bg-card p-6 space-y-3 animate-pulse">
      <div className="h-4 bg-muted w-1/3" />
      <div className="space-y-2">
        <div className="h-3 bg-muted w-full" />
        <div className="h-3 bg-muted w-5/6" />
        <div className="h-3 bg-muted w-4/6" />
      </div>
    </div>
  )
}

function ProposalCard({
  proposal,
  onClick,
}: {
  proposal: SavedProposal
  onClick: () => void
}) {
  const snippet = proposal.proposalData?.executive_summary?.replace(/[#*\n]/g, ' ').trim().slice(0, 140) ?? ''
  return (
    <button
      onClick={onClick}
      className="w-full text-left border border-border bg-card p-6 hover:border-primary/50 transition-all group"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium tracking-wider uppercase truncate text-foreground group-hover:text-primary transition-colors">
            {proposal.proposalData?.proposal_title ?? proposal.formData?.clientName ?? 'Untitled Proposal'}
          </h3>
          <p className="text-xs text-muted-foreground mt-1 tracking-wider">
            {proposal.formData?.clientName ?? ''}
          </p>
        </div>
        <Badge variant={proposal.status === 'Complete' ? 'default' : 'secondary'} className="ml-3 text-[10px] tracking-widest uppercase shrink-0">
          {proposal.status}
        </Badge>
      </div>
      <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
        <span className="flex items-center gap-1">
          <FiFolder size={12} />
          {proposal.formData?.projectType ?? 'N/A'}
        </span>
        <span className="flex items-center gap-1">
          <FiCalendar size={12} />
          {proposal.createdAt ? new Date(proposal.createdAt).toLocaleDateString() : 'N/A'}
        </span>
      </div>
      {snippet && (
        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{snippet}...</p>
      )}
      <div className="flex items-center gap-1 mt-3 text-primary text-xs tracking-widest uppercase opacity-0 group-hover:opacity-100 transition-opacity">
        View Details <FiArrowRight size={12} />
      </div>
    </button>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function Page() {
  // ── Navigation ──
  const [activeView, setActiveView] = useState<'builder' | 'history'>('builder')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [sampleData, setSampleData] = useState(false)

  // ── Form ──
  const [formData, setFormData] = useState<FormData>({
    clientName: '',
    clientProfile: '',
    projectType: 'Branding',
    serviceRequirements: '',
    budgetRange: '',
    timeline: '',
    specialNotes: '',
  })

  // ── Agent ──
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [proposalData, setProposalData] = useState<ProposalData | null>(null)
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [activeAgentId, setActiveAgentId] = useState<string | null>(null)

  // ── History ──
  const [history, setHistory] = useState<SavedProposal[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<string | null>(null)
  const [selectedProposal, setSelectedProposal] = useState<SavedProposal | null>(null)

  // ── Validation ──
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})

  // ── Mount ──
  useEffect(() => {
    document.title = 'ProposalForge'
    const loaded = loadHistory()
    setHistory(loaded)
  }, [])

  // ── Sample data toggle ──
  useEffect(() => {
    if (sampleData) {
      setFormData(SAMPLE_FORM)
      setProposalData(SAMPLE_PROPOSAL)
      setPdfUrl(null)
    } else {
      setFormData({
        clientName: '',
        clientProfile: '',
        projectType: 'Branding',
        serviceRequirements: '',
        budgetRange: '',
        timeline: '',
        specialNotes: '',
      })
      setProposalData(null)
      setPdfUrl(null)
    }
  }, [sampleData])

  // ── Form helpers ──
  const updateField = useCallback((field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setValidationErrors(prev => {
      const next = { ...prev }
      delete next[field]
      return next
    })
  }, [])

  const validate = useCallback((): boolean => {
    const errs: Record<string, string> = {}
    if (!formData.clientName.trim()) errs.clientName = 'Client name is required'
    if (!formData.clientProfile.trim()) errs.clientProfile = 'Client profile is required'
    if (!formData.serviceRequirements.trim()) errs.serviceRequirements = 'Service requirements are required'
    setValidationErrors(errs)
    return Object.keys(errs).length === 0
  }, [formData])

  // ── Generate ──
  const handleGenerate = useCallback(async () => {
    if (!validate()) return

    setLoading(true)
    setError(null)
    setProposalData(null)
    setPdfUrl(null)
    setActiveAgentId(AGENT_ID)

    const message = `Generate a comprehensive sales proposal with the following deal context:

Client Company: ${formData.clientName}
Client Profile: ${formData.clientProfile}
Project Type: ${formData.projectType}
Service Requirements: ${formData.serviceRequirements}
${formData.budgetRange ? `Budget Range: ${formData.budgetRange}` : ''}
${formData.timeline ? `Desired Timeline: ${formData.timeline}` : ''}
${formData.specialNotes ? `Special Notes: ${formData.specialNotes}` : ''}

Please provide a complete, polished sales proposal with executive summary, client context, scope of work, deliverables, pricing breakdown, total estimate, timeline and milestones, and terms and next steps.`

    try {
      const result = await callAIAgent(message, AGENT_ID)
      const data = parseAgentResponse(result)
      setProposalData(data)

      const files = result?.module_outputs?.artifact_files
      if (Array.isArray(files) && files.length > 0 && files[0]?.file_url) {
        setPdfUrl(files[0].file_url)
      }

      // Save to history
      const saved: SavedProposal = {
        id: generateId(),
        formData: { ...formData },
        proposalData: data,
        pdfUrl: (Array.isArray(files) && files.length > 0 && files[0]?.file_url) ? files[0].file_url : null,
        status: 'Complete',
        createdAt: new Date().toISOString(),
      }
      const updated = [saved, ...history]
      setHistory(updated)
      saveHistory(updated)

      if (!result.success) {
        setError(result.error ?? 'An unexpected error occurred. Please try again.')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred')
    } finally {
      setLoading(false)
      setActiveAgentId(null)
    }
  }, [formData, history, validate])

  // ── Edit proposal section ──
  const handleEditSection = useCallback((field: keyof ProposalData, newContent: string) => {
    setProposalData(prev => prev ? { ...prev, [field]: newContent } : prev)
  }, [])

  // ── Download PDF ──
  const handleDownload = useCallback((url?: string | null) => {
    const target = url ?? pdfUrl
    if (target) {
      window.open(target, '_blank')
    } else {
      window.print()
    }
  }, [pdfUrl])

  // ── Reuse template ──
  const handleReuse = useCallback((proposal: SavedProposal) => {
    setFormData({ ...proposal.formData })
    setProposalData(null)
    setPdfUrl(null)
    setSelectedProposal(null)
    setActiveView('builder')
  }, [])

  // ── Filtered history ──
  const filteredHistory = useMemo(() => {
    let filtered = history
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      filtered = filtered.filter(p =>
        (p.formData?.clientName ?? '').toLowerCase().includes(q) ||
        (p.proposalData?.proposal_title ?? '').toLowerCase().includes(q)
      )
    }
    if (filterType) {
      filtered = filtered.filter(p => p.formData?.projectType === filterType)
    }
    return filtered
  }, [history, searchQuery, filterType])

  // ── Proposal sections config ──
  const proposalSections = useMemo(() => {
    if (!proposalData) return []
    return [
      { key: 'executive_summary' as const, title: 'Executive Summary', icon: <FiStar size={16} />, defaultOpen: true },
      { key: 'client_context' as const, title: 'Client Context', icon: <FiTarget size={16} />, defaultOpen: true },
      { key: 'scope_of_work' as const, title: 'Scope of Work', icon: <FiLayers size={16} />, defaultOpen: false },
      { key: 'deliverables' as const, title: 'Deliverables', icon: <FiFileText size={16} />, defaultOpen: false },
      { key: 'pricing_breakdown' as const, title: 'Pricing Breakdown', icon: <FiDollarSign size={16} />, defaultOpen: false },
      { key: 'timeline_and_milestones' as const, title: 'Timeline & Milestones', icon: <FiClock size={16} />, defaultOpen: false },
      { key: 'terms_and_next_steps' as const, title: 'Terms & Next Steps', icon: <FiCheck size={16} />, defaultOpen: false },
    ]
  }, [proposalData])

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-background text-foreground flex">
        {/* ── Sidebar ── */}
        <aside className={`${sidebarOpen ? 'w-64' : 'w-0'} transition-all duration-300 overflow-hidden flex-shrink-0 border-r border-border bg-card`}>
          <div className="w-64 h-screen flex flex-col">
            {/* Logo */}
            <div className="px-6 py-6 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 border border-primary flex items-center justify-center">
                  <FiFileText size={16} className="text-primary" />
                </div>
                <div>
                  <h1 className="text-sm font-medium tracking-[0.2em] uppercase">ProposalForge</h1>
                  <p className="text-[10px] tracking-[0.15em] text-muted-foreground uppercase">AI Proposal Generator</p>
                </div>
              </div>
            </div>

            {/* Nav */}
            <nav className="flex-1 px-3 py-4 space-y-1">
              <button
                onClick={() => { setActiveView('builder'); setSelectedProposal(null) }}
                className={`w-full flex items-center gap-3 px-4 py-3 text-xs tracking-widest uppercase transition-colors ${activeView === 'builder' ? 'bg-primary/10 text-primary border-l-2 border-primary' : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'}`}
              >
                <FiEdit3 size={14} />
                Proposal Builder
              </button>
              <button
                onClick={() => { setActiveView('history'); setSelectedProposal(null) }}
                className={`w-full flex items-center gap-3 px-4 py-3 text-xs tracking-widest uppercase transition-colors ${activeView === 'history' ? 'bg-primary/10 text-primary border-l-2 border-primary' : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'}`}
              >
                <FiClock size={14} />
                Proposal History
                {history.length > 0 && (
                  <span className="ml-auto text-[10px] bg-secondary px-2 py-0.5 text-muted-foreground">{history.length}</span>
                )}
              </button>
            </nav>

            {/* Agent Status */}
            <div className="px-4 py-4 border-t border-border">
              <p className="text-[10px] tracking-widest uppercase text-muted-foreground mb-3">Agent Status</p>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 ${activeAgentId ? 'bg-green-500 animate-pulse' : 'bg-muted-foreground/40'}`} />
                <span className="text-[10px] tracking-wider text-muted-foreground">
                  Proposal Coordinator
                </span>
              </div>
              <p className="text-[10px] text-muted-foreground/60 mt-1 tracking-wider">
                {activeAgentId ? 'Processing...' : 'Idle'}
              </p>
            </div>
          </div>
        </aside>

        {/* ── Main Content ── */}
        <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
          {/* Header */}
          <header className="flex items-center justify-between px-6 py-4 border-b border-border bg-card/50">
            <div className="flex items-center gap-4">
              <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-muted-foreground hover:text-foreground transition-colors p-1">
                {sidebarOpen ? <FiX size={18} /> : <FiMenu size={18} />}
              </button>
              <div className="h-5 w-px bg-border" />
              <h2 className="text-xs tracking-[0.2em] uppercase text-muted-foreground">
                {activeView === 'builder' ? 'Proposal Builder' : selectedProposal ? 'Proposal Details' : 'Proposal History'}
              </h2>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[10px] tracking-widest uppercase text-muted-foreground">Sample Data</span>
              <Switch checked={sampleData} onCheckedChange={setSampleData} />
            </div>
          </header>

          {/* Content Area */}
          <div className="flex-1 overflow-hidden">
            {activeView === 'builder' ? (
              /* ── Builder View ── */
              <div className="flex h-full">
                {/* Left Panel: Form */}
                <div className="w-2/5 border-r border-border flex flex-col">
                  <ScrollArea className="flex-1">
                    <div className="p-8 space-y-6">
                      <div>
                        <h3 className="text-xs tracking-[0.2em] uppercase text-foreground mb-1">Deal Context</h3>
                        <p className="text-xs text-muted-foreground tracking-wider">Provide the details for your proposal</p>
                      </div>

                      {/* Client Name */}
                      <div className="space-y-2">
                        <label className="text-[10px] tracking-widest uppercase text-muted-foreground flex items-center gap-1">
                          Client Company Name <span className="text-destructive">*</span>
                        </label>
                        <input
                          type="text"
                          value={formData.clientName}
                          onChange={(e) => updateField('clientName', e.target.value)}
                          placeholder="Enter company name"
                          className={`w-full bg-secondary/50 border ${validationErrors.clientName ? 'border-destructive' : 'border-border'} text-foreground text-sm px-4 py-3 focus:outline-none focus:border-primary transition-colors placeholder:text-muted-foreground/50 tracking-wider`}
                        />
                        {validationErrors.clientName && (
                          <p className="text-[10px] text-destructive tracking-wider flex items-center gap-1"><FiAlertCircle size={10} /> {validationErrors.clientName}</p>
                        )}
                      </div>

                      {/* Client Profile */}
                      <div className="space-y-2">
                        <label className="text-[10px] tracking-widest uppercase text-muted-foreground flex items-center gap-1">
                          Client Profile / Background <span className="text-destructive">*</span>
                        </label>
                        <textarea
                          value={formData.clientProfile}
                          onChange={(e) => updateField('clientProfile', e.target.value)}
                          placeholder="Describe the client's business, industry, and any relevant background..."
                          rows={4}
                          className={`w-full bg-secondary/50 border ${validationErrors.clientProfile ? 'border-destructive' : 'border-border'} text-foreground text-sm px-4 py-3 resize-none focus:outline-none focus:border-primary transition-colors placeholder:text-muted-foreground/50 tracking-wider`}
                        />
                        {validationErrors.clientProfile && (
                          <p className="text-[10px] text-destructive tracking-wider flex items-center gap-1"><FiAlertCircle size={10} /> {validationErrors.clientProfile}</p>
                        )}
                      </div>

                      {/* Project Type */}
                      <div className="space-y-2">
                        <label className="text-[10px] tracking-widest uppercase text-muted-foreground">Project Type</label>
                        <select
                          value={formData.projectType}
                          onChange={(e) => updateField('projectType', e.target.value)}
                          className="w-full bg-secondary/50 border border-border text-foreground text-sm px-4 py-3 focus:outline-none focus:border-primary transition-colors tracking-wider appearance-none cursor-pointer"
                        >
                          {PROJECT_TYPES.map(pt => (
                            <option key={pt} value={pt} className="bg-card">{pt}</option>
                          ))}
                        </select>
                      </div>

                      {/* Service Requirements */}
                      <div className="space-y-2">
                        <label className="text-[10px] tracking-widest uppercase text-muted-foreground flex items-center gap-1">
                          Service Requirements <span className="text-destructive">*</span>
                        </label>
                        <textarea
                          value={formData.serviceRequirements}
                          onChange={(e) => updateField('serviceRequirements', e.target.value)}
                          placeholder="Detail the specific services needed..."
                          rows={4}
                          className={`w-full bg-secondary/50 border ${validationErrors.serviceRequirements ? 'border-destructive' : 'border-border'} text-foreground text-sm px-4 py-3 resize-none focus:outline-none focus:border-primary transition-colors placeholder:text-muted-foreground/50 tracking-wider`}
                        />
                        {validationErrors.serviceRequirements && (
                          <p className="text-[10px] text-destructive tracking-wider flex items-center gap-1"><FiAlertCircle size={10} /> {validationErrors.serviceRequirements}</p>
                        )}
                      </div>

                      {/* Budget Range */}
                      <div className="space-y-2">
                        <label className="text-[10px] tracking-widest uppercase text-muted-foreground flex items-center gap-1">
                          Budget Range <span className="text-muted-foreground/50 text-[9px] normal-case tracking-normal">(optional)</span>
                        </label>
                        <input
                          type="text"
                          value={formData.budgetRange}
                          onChange={(e) => updateField('budgetRange', e.target.value)}
                          placeholder="e.g. $50,000 - $100,000"
                          className="w-full bg-secondary/50 border border-border text-foreground text-sm px-4 py-3 focus:outline-none focus:border-primary transition-colors placeholder:text-muted-foreground/50 tracking-wider"
                        />
                      </div>

                      {/* Timeline */}
                      <div className="space-y-2">
                        <label className="text-[10px] tracking-widest uppercase text-muted-foreground flex items-center gap-1">
                          Desired Timeline <span className="text-muted-foreground/50 text-[9px] normal-case tracking-normal">(optional)</span>
                        </label>
                        <input
                          type="text"
                          value={formData.timeline}
                          onChange={(e) => updateField('timeline', e.target.value)}
                          placeholder="e.g. 3 months, Q2 2026"
                          className="w-full bg-secondary/50 border border-border text-foreground text-sm px-4 py-3 focus:outline-none focus:border-primary transition-colors placeholder:text-muted-foreground/50 tracking-wider"
                        />
                      </div>

                      {/* Special Notes */}
                      <div className="space-y-2">
                        <label className="text-[10px] tracking-widest uppercase text-muted-foreground flex items-center gap-1">
                          Special Notes <span className="text-muted-foreground/50 text-[9px] normal-case tracking-normal">(optional)</span>
                        </label>
                        <textarea
                          value={formData.specialNotes}
                          onChange={(e) => updateField('specialNotes', e.target.value)}
                          placeholder="Any additional requirements or considerations..."
                          rows={3}
                          className="w-full bg-secondary/50 border border-border text-foreground text-sm px-4 py-3 resize-none focus:outline-none focus:border-primary transition-colors placeholder:text-muted-foreground/50 tracking-wider"
                        />
                      </div>

                      {/* Generate Button */}
                      <button
                        onClick={handleGenerate}
                        disabled={loading}
                        className="w-full bg-primary text-primary-foreground py-4 text-xs tracking-[0.2em] uppercase font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {loading ? (
                          <>
                            <FiRefreshCw size={14} className="animate-spin" />
                            Crafting Proposal...
                          </>
                        ) : (
                          <>
                            <FiPlus size={14} />
                            Generate Proposal
                          </>
                        )}
                      </button>
                    </div>
                  </ScrollArea>
                </div>

                {/* Right Panel: Output */}
                <div className="w-3/5 flex flex-col relative">
                  <ScrollArea className="flex-1">
                    <div className="p-8">
                      {/* Error State */}
                      {error && !loading && (
                        <div className="border border-destructive/50 bg-destructive/5 p-6 mb-6">
                          <div className="flex items-start gap-3">
                            <FiAlertCircle size={18} className="text-destructive mt-0.5 shrink-0" />
                            <div className="flex-1">
                              <p className="text-sm font-medium text-destructive tracking-wider mb-1">Generation Failed</p>
                              <p className="text-xs text-muted-foreground tracking-wider">{error}</p>
                              <button onClick={handleGenerate} className="mt-3 text-xs tracking-widest uppercase text-primary hover:text-primary/80 transition-colors flex items-center gap-1">
                                <FiRefreshCw size={12} /> Retry
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Loading State */}
                      {loading && (
                        <div className="space-y-4">
                          <div className="text-center py-8">
                            <FiRefreshCw size={24} className="animate-spin text-primary mx-auto mb-4" />
                            <p className="text-xs tracking-[0.2em] uppercase text-muted-foreground">Crafting your proposal...</p>
                            <p className="text-[10px] text-muted-foreground/60 tracking-wider mt-1">This may take a moment</p>
                          </div>
                          <SkeletonSection />
                          <SkeletonSection />
                          <SkeletonSection />
                          <SkeletonSection />
                        </div>
                      )}

                      {/* Empty State */}
                      {!loading && !proposalData && !error && (
                        <div className="flex flex-col items-center justify-center py-24 text-center">
                          <div className="w-16 h-16 border border-border flex items-center justify-center mb-6">
                            <FiFileText size={24} className="text-muted-foreground/40" />
                          </div>
                          <h3 className="text-sm tracking-[0.2em] uppercase text-muted-foreground mb-2">No Proposal Generated</h3>
                          <p className="text-xs text-muted-foreground/60 tracking-wider max-w-sm">
                            Fill in your deal context on the left panel and click Generate to create a comprehensive sales proposal.
                          </p>
                          <div className="flex items-center gap-1 mt-6 text-[10px] tracking-widest uppercase text-primary/60">
                            <FiChevronRight size={12} />
                            Complete the form to begin
                          </div>
                        </div>
                      )}

                      {/* Proposal Output */}
                      {!loading && proposalData && (
                        <div className="space-y-0">
                          {/* Proposal Header */}
                          <div className="border border-border bg-card p-8 mb-px">
                            <div className="flex items-start justify-between">
                              <div>
                                <p className="text-[10px] tracking-widest uppercase text-primary mb-2">Sales Proposal</p>
                                <h2 className="text-lg font-medium tracking-wider text-foreground leading-relaxed">
                                  {proposalData.proposal_title ?? 'Untitled Proposal'}
                                </h2>
                                <p className="text-sm text-muted-foreground tracking-wider mt-1">
                                  Prepared for {proposalData.client_name ?? formData.clientName ?? 'Client'}
                                </p>
                              </div>
                              <div className="text-right shrink-0 ml-4">
                                {proposalData.total_estimate && (
                                  <div className="mb-2">
                                    <p className="text-[10px] tracking-widest uppercase text-muted-foreground">Total Estimate</p>
                                    <p className="text-lg font-medium text-primary tracking-wider">{proposalData.total_estimate}</p>
                                  </div>
                                )}
                                {proposalData.generated_date && (
                                  <p className="text-[10px] text-muted-foreground tracking-wider flex items-center gap-1 justify-end">
                                    <FiCalendar size={10} /> {proposalData.generated_date}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Sections */}
                          {proposalSections.map(section => {
                            const content = proposalData[section.key]
                            if (!content) return null
                            return (
                              <div key={section.key} className="mb-px">
                                <ProposalSection
                                  title={section.title}
                                  icon={section.icon}
                                  content={String(content)}
                                  defaultOpen={section.defaultOpen}
                                  onEdit={(val) => handleEditSection(section.key, val)}
                                />
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  </ScrollArea>

                  {/* Floating Download Button */}
                  {!loading && proposalData && (
                    <div className="absolute bottom-6 right-6">
                      <button
                        onClick={() => handleDownload()}
                        className="flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 text-xs tracking-widest uppercase shadow-lg hover:bg-primary/90 transition-colors"
                      >
                        <FiDownload size={14} />
                        Download PDF
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : selectedProposal ? (
              /* ── Proposal Detail View ── */
              <ScrollArea className="h-full">
                <div className="max-w-4xl mx-auto p-8">
                  {/* Back button */}
                  <button
                    onClick={() => setSelectedProposal(null)}
                    className="flex items-center gap-2 text-xs tracking-widest uppercase text-muted-foreground hover:text-foreground transition-colors mb-8"
                  >
                    <FiChevronRight size={12} className="rotate-180" />
                    Back to History
                  </button>

                  {/* Detail Header */}
                  <div className="border border-border bg-card p-8 mb-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-[10px] tracking-widest uppercase text-primary mb-2">Sales Proposal</p>
                        <h2 className="text-lg font-medium tracking-wider text-foreground leading-relaxed">
                          {selectedProposal.proposalData?.proposal_title ?? 'Untitled Proposal'}
                        </h2>
                        <p className="text-sm text-muted-foreground tracking-wider mt-1">
                          Prepared for {selectedProposal.proposalData?.client_name ?? selectedProposal.formData?.clientName ?? 'Client'}
                        </p>
                        <div className="flex items-center gap-4 mt-4">
                          <Badge variant={selectedProposal.status === 'Complete' ? 'default' : 'secondary'} className="text-[10px] tracking-widest uppercase">
                            {selectedProposal.status}
                          </Badge>
                          <span className="text-[10px] text-muted-foreground tracking-wider flex items-center gap-1">
                            <FiFolder size={10} /> {selectedProposal.formData?.projectType ?? 'N/A'}
                          </span>
                          <span className="text-[10px] text-muted-foreground tracking-wider flex items-center gap-1">
                            <FiCalendar size={10} /> {selectedProposal.createdAt ? new Date(selectedProposal.createdAt).toLocaleDateString() : 'N/A'}
                          </span>
                        </div>
                      </div>
                      <div className="text-right shrink-0 ml-4">
                        {selectedProposal.proposalData?.total_estimate && (
                          <div>
                            <p className="text-[10px] tracking-widest uppercase text-muted-foreground">Total Estimate</p>
                            <p className="text-lg font-medium text-primary tracking-wider">{selectedProposal.proposalData.total_estimate}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 mb-6">
                    <button
                      onClick={() => handleReuse(selectedProposal)}
                      className="flex items-center gap-2 px-5 py-3 border border-border text-xs tracking-widest uppercase text-foreground hover:bg-secondary/50 transition-colors"
                    >
                      <FiCopy size={12} /> Reuse as Template
                    </button>
                    <button
                      onClick={() => handleDownload(selectedProposal.pdfUrl)}
                      className="flex items-center gap-2 px-5 py-3 bg-primary text-primary-foreground text-xs tracking-widest uppercase hover:bg-primary/90 transition-colors"
                    >
                      <FiDownload size={12} /> Download PDF
                    </button>
                  </div>

                  {/* Sections (read-only) */}
                  <div className="space-y-px">
                    {[
                      { key: 'executive_summary' as const, title: 'Executive Summary', icon: <FiStar size={16} /> },
                      { key: 'client_context' as const, title: 'Client Context', icon: <FiTarget size={16} /> },
                      { key: 'scope_of_work' as const, title: 'Scope of Work', icon: <FiLayers size={16} /> },
                      { key: 'deliverables' as const, title: 'Deliverables', icon: <FiFileText size={16} /> },
                      { key: 'pricing_breakdown' as const, title: 'Pricing Breakdown', icon: <FiDollarSign size={16} /> },
                      { key: 'timeline_and_milestones' as const, title: 'Timeline & Milestones', icon: <FiClock size={16} /> },
                      { key: 'terms_and_next_steps' as const, title: 'Terms & Next Steps', icon: <FiCheck size={16} /> },
                    ].map(section => {
                      const content = selectedProposal.proposalData?.[section.key]
                      if (!content) return null
                      return (
                        <ProposalSection
                          key={section.key}
                          title={section.title}
                          icon={section.icon}
                          content={String(content)}
                          defaultOpen={section.key === 'executive_summary'}
                        />
                      )
                    })}
                  </div>
                </div>
              </ScrollArea>
            ) : (
              /* ── History View ── */
              <ScrollArea className="h-full">
                <div className="max-w-4xl mx-auto p-8">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h3 className="text-sm tracking-[0.2em] uppercase text-foreground">Proposal History</h3>
                      <p className="text-xs text-muted-foreground tracking-wider mt-1">{history.length} proposal{history.length !== 1 ? 's' : ''} generated</p>
                    </div>
                  </div>

                  {/* Search and Filter */}
                  {history.length > 0 && (
                    <div className="mb-6 space-y-4">
                      <div className="relative">
                        <FiSearch size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Search by client name..."
                          className="w-full bg-secondary/50 border border-border text-foreground text-sm pl-10 pr-4 py-3 focus:outline-none focus:border-primary transition-colors placeholder:text-muted-foreground/50 tracking-wider"
                        />
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => setFilterType(null)}
                          className={`px-3 py-1.5 text-[10px] tracking-widest uppercase border transition-colors ${!filterType ? 'border-primary text-primary bg-primary/10' : 'border-border text-muted-foreground hover:text-foreground'}`}
                        >
                          All
                        </button>
                        {PROJECT_TYPES.map(pt => (
                          <button
                            key={pt}
                            onClick={() => setFilterType(filterType === pt ? null : pt)}
                            className={`px-3 py-1.5 text-[10px] tracking-widest uppercase border transition-colors ${filterType === pt ? 'border-primary text-primary bg-primary/10' : 'border-border text-muted-foreground hover:text-foreground'}`}
                          >
                            {pt}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Proposal List */}
                  {filteredHistory.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {filteredHistory.map(proposal => (
                        <ProposalCard
                          key={proposal.id}
                          proposal={proposal}
                          onClick={() => setSelectedProposal(proposal)}
                        />
                      ))}
                    </div>
                  ) : history.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 text-center">
                      <div className="w-16 h-16 border border-border flex items-center justify-center mb-6">
                        <FiFolder size={24} className="text-muted-foreground/40" />
                      </div>
                      <h3 className="text-sm tracking-[0.2em] uppercase text-muted-foreground mb-2">No Proposals Yet</h3>
                      <p className="text-xs text-muted-foreground/60 tracking-wider max-w-sm">
                        Generate your first proposal from the builder to see it here.
                      </p>
                      <button
                        onClick={() => setActiveView('builder')}
                        className="mt-6 flex items-center gap-2 text-xs tracking-widest uppercase text-primary hover:text-primary/80 transition-colors"
                      >
                        <FiArrowRight size={12} /> Go to Builder
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                      <FiSearch size={20} className="text-muted-foreground/40 mb-4" />
                      <p className="text-xs tracking-widest uppercase text-muted-foreground">No matching proposals found</p>
                      <button
                        onClick={() => { setSearchQuery(''); setFilterType(null) }}
                        className="mt-3 text-xs tracking-widest uppercase text-primary hover:text-primary/80 transition-colors"
                      >
                        Clear Filters
                      </button>
                    </div>
                  )}
                </div>
              </ScrollArea>
            )}
          </div>
        </div>
      </div>
    </ErrorBoundary>
  )
}
