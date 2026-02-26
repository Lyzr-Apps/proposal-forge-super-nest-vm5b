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

// ─── Service Catalog ─────────────────────────────────────────────────────────

interface ServiceCategory {
  category: string
  items: string[]
}

const SERVICE_CATALOG: ServiceCategory[] = [
  {
    category: 'Website Development & Maintenance',
    items: [
      'Developing and updating website pages for multiple locations',
      'Creating new pages and campaigns as requested by staff and doctors',
      'Fixing broken links and correcting text across all location pages',
      'Performing backend WordPress theme and plugin updates weekly',
      'Ensuring website compatibility and smooth functionality',
    ],
  },
  {
    category: 'Search Engine Optimization (SEO)',
    items: [
      'Writing and posting SEO-friendly blog posts',
      'Optimizing blog posts and website pages with proper meta titles, descriptions, and image alt-text',
      'Adjusting and adding internal links to improve site navigation and SEO',
      'Optimizing image file sizes to enhance website loading speed and performance',
    ],
  },
  {
    category: 'Content Updates & Management',
    items: [
      'Handling basic content updates such as text changes, job postings, and individual location page edits',
      'Coordinating with staff for content requests and updates',
      'Maintaining consistent branding and messaging aligned with core values (Compassion, Efficiency, Patient-Centered Care)',
    ],
  },
  {
    category: 'Social Media Management',
    items: [
      'Writing and designing social media posts for platforms like Facebook, Instagram, and Twitter',
      'Scheduling social media posts intermittently to promote location openings and ongoing updates',
      'Posting grand opening announcements and other timely content',
      'Creating custom 250-word posts specifically for Google My Business',
    ],
  },
  {
    category: 'Blog Posts',
    items: [
      'Writing, posting, and scheduling blog posts on relevant health and safety topics',
      'SEO optimization of blog content including titles, descriptions, and alt-text',
      'Blog topics including emergency medical information, seasonal safety tips, and poison prevention awareness',
    ],
  },
  {
    category: 'Patient Review System',
    items: [
      'Setting up patient survey and review pages/forms for new patients',
      'Tracking survey results in the backend system',
      'Coordinating with facility directors for survey follow-up and management',
    ],
  },
  {
    category: 'Google Business Profile Management',
    items: [
      'Updating Google Business profiles with accurate hours, photos, and information',
      'Managing edits and awaiting Google confirmation for profile updates',
      'Writing and posting Google My Business posts to enhance local SEO and engagement',
    ],
  },
  {
    category: 'Image Management',
    items: [
      'Adding or editing alt-text for images to improve accessibility and SEO',
      'Optimizing image file sizes for faster website performance',
    ],
  },
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

// Build a full service requirements string from all catalog items for sample use
const ALL_SERVICES_TEXT = SERVICE_CATALOG
  .map(cat => `${cat.category}:\n${cat.items.map(i => `- ${i}`).join('\n')}`)
  .join('\n\n')

const SAMPLE_FORM: FormData = {
  clientName: 'Physicians Premier ER',
  clientProfile: 'Physicians Premier ER is a network of freestanding emergency rooms operating multiple locations across Texas. They provide 24/7 emergency medical care with board-certified physicians, emphasizing compassion, efficiency, and patient-centered care. They are expanding with new location openings and need comprehensive digital marketing support across all locations.',
  projectType: 'Full-Service',
  serviceRequirements: ALL_SERVICES_TEXT,
  budgetRange: '$8,000 - $15,000/month',
  timeline: '12-month retainer',
  specialNotes: 'Must maintain consistent branding aligned with core values: Compassion, Efficiency, Patient-Centered Care. Coordinate with facility directors for patient survey follow-up. Multilingual content may be needed for certain locations.',
}

const SAMPLE_PROPOSAL: ProposalData = {
  proposal_title: 'Comprehensive Digital Marketing & Web Services Proposal for Physicians Premier ER',
  client_name: 'Physicians Premier ER',
  executive_summary: '## Executive Summary\n\nWe propose a **comprehensive digital marketing and web services engagement** for Physicians Premier ER, designed to support your multi-location emergency care network with consistent, high-quality online presence management.\n\nOur services span **website development and maintenance**, **SEO optimization**, **content management**, **social media**, **blog content creation**, **patient review systems**, **Google Business Profile management**, and **image optimization** across all locations.\n\nThis proposal ensures every Physicians Premier ER location maintains a professional, search-optimized digital footprint that drives patient awareness and trust.',
  client_context: '## Client Context\n\nPhysicians Premier ER operates a **growing network of freestanding emergency rooms** across Texas, providing 24/7 board-certified emergency medical care.\n\n**Key Considerations:**\n- Multiple locations requiring consistent branding and individual page management\n- Ongoing new location openings requiring launch support (web pages, Google Business setup, social media announcements)\n- Core values of **Compassion, Efficiency, and Patient-Centered Care** must be reflected in all content\n- Patient review and survey systems needed for quality management\n- Local SEO is critical for emergency services visibility in each market',
  scope_of_work: '## Scope of Work\n\n### Website Development & Maintenance\n- Developing and updating website pages for multiple locations\n- Creating new pages and campaigns as requested by staff and doctors\n- Fixing broken links and correcting text across all location pages\n- Performing backend WordPress theme and plugin updates weekly\n- Ensuring website compatibility and smooth functionality\n\n### Search Engine Optimization (SEO)\n- Writing and posting SEO-friendly blog posts\n- Optimizing blog posts and website pages with proper meta titles, descriptions, and image alt-text\n- Adjusting and adding internal links to improve site navigation and SEO\n- Optimizing image file sizes to enhance website loading speed and performance\n\n### Content Updates & Management\n- Handling basic content updates such as text changes, job postings, and individual location page edits\n- Coordinating with staff for content requests and updates\n- Maintaining consistent branding and messaging aligned with core values\n\n### Social Media Management\n- Writing and designing social media posts for Facebook, Instagram, and Twitter\n- Scheduling social media posts to promote location openings and ongoing updates\n- Posting grand opening announcements and other timely content\n- Creating custom 250-word posts for Google My Business\n\n### Blog Posts\n- Writing, posting, and scheduling blog posts on relevant health and safety topics\n- SEO optimization of blog content including titles, descriptions, and alt-text\n- Topics including emergency medical information, seasonal safety tips, and poison prevention awareness\n\n### Patient Review System\n- Setting up patient survey and review pages/forms for new patients\n- Tracking survey results in the backend system\n- Coordinating with facility directors for survey follow-up and management\n\n### Google Business Profile Management\n- Updating Google Business profiles with accurate hours, photos, and information\n- Managing edits and awaiting Google confirmation for profile updates\n- Writing and posting Google My Business posts to enhance local SEO\n\n### Image Management\n- Adding or editing alt-text for images to improve accessibility and SEO\n- Optimizing image file sizes for faster website performance',
  deliverables: '## Deliverables\n\n- **Website Maintenance** - Weekly updates, bug fixes, and new page creation across all locations\n- **SEO Optimization** - Ongoing on-page SEO for all location pages and blog content\n- **Blog Content** - 4-8 SEO-optimized blog posts per month on health and safety topics\n- **Social Media Posts** - Regular branded posts across Facebook, Instagram, and Twitter\n- **Google My Business** - Custom 250-word posts and profile management for each location\n- **Patient Survey System** - Setup and ongoing tracking for new patient feedback\n- **Image Optimization** - Alt-text management and file size optimization across the site\n- **Content Updates** - Text changes, job postings, and location page edits as needed\n- **Monthly Reporting** - Performance summary covering traffic, SEO rankings, and engagement',
  pricing_breakdown: '## Pricing Breakdown\n\n| Service | Monthly Investment |\n|---|---|\n| Website Development & Maintenance | $2,500 |\n| SEO Optimization | $2,000 |\n| Content Updates & Management | $1,000 |\n| Social Media Management | $2,000 |\n| Blog Posts (4-8/month) | $1,500 |\n| Patient Review System | $500 |\n| Google Business Profile Management | $1,000 |\n| Image Management | $500 |\n\n**New Location Launch Add-on:** $2,500 per location (one-time setup including website pages, Google Business profile, social media announcements, and patient survey forms)',
  total_estimate: '$11,000/month retainer + $2,500 per new location launch',
  timeline_and_milestones: '## Timeline & Milestones\n\n**Month 1:** Onboarding & Audit\n- Complete website audit across all locations\n- Set up patient survey systems\n- Establish content calendar and social media schedule\n- Milestone: Audit report and content strategy delivered\n\n**Month 2-3:** Foundation Building\n- Fix all broken links and content errors identified in audit\n- Optimize all existing location pages for SEO\n- Begin blog content production\n- Milestone: All location pages optimized, first blog posts published\n\n**Month 4-6:** Growth Phase\n- Ramp up social media posting frequency\n- Launch Google My Business post schedule\n- Support any new location openings\n- Milestone: Measurable SEO ranking improvements, social engagement baseline\n\n**Month 7-12:** Optimization & Scaling\n- Refine strategy based on performance data\n- Scale content production for high-performing topics\n- Continue new location support as needed\n- Milestone: Quarterly performance reviews with measurable growth metrics',
  terms_and_next_steps: '## Terms & Next Steps\n\n**Engagement Terms:**\n- 12-month retainer agreement with monthly invoicing\n- 30-day notice required for cancellation after initial 6-month commitment\n- New location launches billed separately at $2,500 per location\n- All content subject to client approval before publishing\n\n**Next Steps:**\n1. Review and approve this proposal\n2. Schedule onboarding kickoff meeting with key stakeholders\n3. Provide access credentials for WordPress, Google Business, and social media accounts\n4. Identify facility directors for patient survey coordination\n5. Execute services agreement to begin Month 1 audit\n\n**Validity:** This proposal is valid for 30 days from the date of issue.\n\n**Contact:** For questions or to proceed, please reach out to your dedicated account manager.',
  generated_date: new Date().toISOString().split('T')[0],
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

function ServiceSelector({
  selectedServices,
  onToggleItem,
  onToggleCategory,
  onSelectAll,
  onClearAll,
}: {
  selectedServices: Set<string>
  onToggleItem: (item: string) => void
  onToggleCategory: (category: ServiceCategory) => void
  onSelectAll: () => void
  onClearAll: () => void
}) {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
  const [selectorOpen, setSelectorOpen] = useState(false)

  const toggleExpand = (cat: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev)
      if (next.has(cat)) next.delete(cat)
      else next.add(cat)
      return next
    })
  }

  const isCategoryFullySelected = (cat: ServiceCategory) =>
    cat.items.every(item => selectedServices.has(item))

  const isCategoryPartiallySelected = (cat: ServiceCategory) =>
    cat.items.some(item => selectedServices.has(item)) && !isCategoryFullySelected(cat)

  const totalItems = SERVICE_CATALOG.reduce((acc, c) => acc + c.items.length, 0)

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-[10px] tracking-widest uppercase text-muted-foreground flex items-center gap-1">
          Service Line Items
          <span className="text-muted-foreground/50 text-[9px] normal-case tracking-normal">(select to populate requirements)</span>
        </label>
        <span className="text-[10px] text-primary tracking-wider">
          {selectedServices.size}/{totalItems} selected
        </span>
      </div>

      <button
        type="button"
        onClick={() => setSelectorOpen(!selectorOpen)}
        className="w-full flex items-center justify-between bg-secondary/50 border border-border px-4 py-3 text-sm text-left hover:border-primary/50 transition-colors tracking-wider"
      >
        <span className="text-muted-foreground">
          {selectedServices.size === 0
            ? 'Browse and select services...'
            : `${selectedServices.size} service${selectedServices.size !== 1 ? 's' : ''} selected`}
        </span>
        {selectorOpen ? <FiChevronUp size={14} className="text-muted-foreground" /> : <FiChevronDown size={14} className="text-muted-foreground" />}
      </button>

      {selectorOpen && (
        <div className="border border-border bg-card max-h-[400px] overflow-y-auto">
          {/* Bulk actions */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-secondary/30 sticky top-0 z-10">
            <button
              type="button"
              onClick={onSelectAll}
              className="text-[10px] tracking-widest uppercase text-primary hover:text-primary/80 transition-colors"
            >
              Select All
            </button>
            <span className="text-border">|</span>
            <button
              type="button"
              onClick={onClearAll}
              className="text-[10px] tracking-widest uppercase text-muted-foreground hover:text-foreground transition-colors"
            >
              Clear All
            </button>
          </div>

          {SERVICE_CATALOG.map(cat => {
            const expanded = expandedCategories.has(cat.category)
            const fullySelected = isCategoryFullySelected(cat)
            const partiallySelected = isCategoryPartiallySelected(cat)

            return (
              <div key={cat.category} className="border-b border-border/50 last:border-b-0">
                <div className="flex items-center gap-3 px-4 py-3 hover:bg-secondary/30 transition-colors">
                  {/* Category checkbox */}
                  <button
                    type="button"
                    onClick={() => onToggleCategory(cat)}
                    className={`w-4 h-4 border flex-shrink-0 flex items-center justify-center transition-colors ${
                      fullySelected
                        ? 'bg-primary border-primary'
                        : partiallySelected
                        ? 'border-primary bg-primary/20'
                        : 'border-muted-foreground/40 hover:border-primary'
                    }`}
                  >
                    {fullySelected && <FiCheck size={10} className="text-primary-foreground" />}
                    {partiallySelected && <span className="w-2 h-0.5 bg-primary" />}
                  </button>

                  {/* Category label */}
                  <button
                    type="button"
                    onClick={() => toggleExpand(cat.category)}
                    className="flex-1 flex items-center justify-between text-left"
                  >
                    <span className="text-xs font-medium tracking-wider uppercase text-foreground">{cat.category}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-muted-foreground tracking-wider">
                        {cat.items.filter(i => selectedServices.has(i)).length}/{cat.items.length}
                      </span>
                      {expanded ? <FiChevronUp size={12} className="text-muted-foreground" /> : <FiChevronDown size={12} className="text-muted-foreground" />}
                    </div>
                  </button>
                </div>

                {/* Individual items */}
                {expanded && (
                  <div className="pl-8 pr-4 pb-3 space-y-1">
                    {cat.items.map(item => {
                      const checked = selectedServices.has(item)
                      return (
                        <button
                          key={item}
                          type="button"
                          onClick={() => onToggleItem(item)}
                          className="w-full flex items-start gap-3 py-1.5 text-left group"
                        >
                          <span
                            className={`w-3.5 h-3.5 border flex-shrink-0 flex items-center justify-center mt-0.5 transition-colors ${
                              checked
                                ? 'bg-primary border-primary'
                                : 'border-muted-foreground/40 group-hover:border-primary'
                            }`}
                          >
                            {checked && <FiCheck size={9} className="text-primary-foreground" />}
                          </span>
                          <span className={`text-xs tracking-wider leading-relaxed transition-colors ${checked ? 'text-foreground' : 'text-muted-foreground group-hover:text-foreground'}`}>
                            {item}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
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

  // ── Service Selection ──
  const [selectedServices, setSelectedServices] = useState<Set<string>>(new Set())

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
      // Pre-select all services to match the sample form data
      const allItems = new Set<string>()
      SERVICE_CATALOG.forEach(cat => cat.items.forEach(item => allItems.add(item)))
      setSelectedServices(allItems)
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
      setSelectedServices(new Set())
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

  // ── Service selection helpers ──
  const buildServiceText = useCallback((services: Set<string>): string => {
    if (services.size === 0) return ''
    const grouped: Record<string, string[]> = {}
    for (const cat of SERVICE_CATALOG) {
      const matching = cat.items.filter(item => services.has(item))
      if (matching.length > 0) {
        grouped[cat.category] = matching
      }
    }
    return Object.entries(grouped)
      .map(([category, items]) => `${category}:\n${items.map(i => `- ${i}`).join('\n')}`)
      .join('\n\n')
  }, [])

  const handleToggleItem = useCallback((item: string) => {
    setSelectedServices(prev => {
      const next = new Set(prev)
      if (next.has(item)) next.delete(item)
      else next.add(item)
      const text = buildServiceText(next)
      setFormData(fd => ({ ...fd, serviceRequirements: text }))
      setValidationErrors(ve => { const n = { ...ve }; delete n.serviceRequirements; return n })
      return next
    })
  }, [buildServiceText])

  const handleToggleCategory = useCallback((cat: ServiceCategory) => {
    setSelectedServices(prev => {
      const next = new Set(prev)
      const allSelected = cat.items.every(i => next.has(i))
      if (allSelected) {
        cat.items.forEach(i => next.delete(i))
      } else {
        cat.items.forEach(i => next.add(i))
      }
      const text = buildServiceText(next)
      setFormData(fd => ({ ...fd, serviceRequirements: text }))
      setValidationErrors(ve => { const n = { ...ve }; delete n.serviceRequirements; return n })
      return next
    })
  }, [buildServiceText])

  const handleSelectAllServices = useCallback(() => {
    const all = new Set<string>()
    SERVICE_CATALOG.forEach(cat => cat.items.forEach(item => all.add(item)))
    setSelectedServices(all)
    const text = buildServiceText(all)
    setFormData(fd => ({ ...fd, serviceRequirements: text }))
    setValidationErrors(ve => { const n = { ...ve }; delete n.serviceRequirements; return n })
  }, [buildServiceText])

  const handleClearAllServices = useCallback(() => {
    setSelectedServices(new Set())
    setFormData(fd => ({ ...fd, serviceRequirements: '' }))
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
    setSelectedServices(new Set())
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

                      {/* Service Line Items Selector */}
                      <ServiceSelector
                        selectedServices={selectedServices}
                        onToggleItem={handleToggleItem}
                        onToggleCategory={handleToggleCategory}
                        onSelectAll={handleSelectAllServices}
                        onClearAll={handleClearAllServices}
                      />

                      {/* Service Requirements */}
                      <div className="space-y-2">
                        <label className="text-[10px] tracking-widest uppercase text-muted-foreground flex items-center gap-1">
                          Service Requirements <span className="text-destructive">*</span>
                          {selectedServices.size > 0 && (
                            <span className="text-muted-foreground/50 text-[9px] normal-case tracking-normal ml-1">(auto-populated from selections above)</span>
                          )}
                        </label>
                        <textarea
                          value={formData.serviceRequirements}
                          onChange={(e) => updateField('serviceRequirements', e.target.value)}
                          placeholder="Select services above or type custom requirements..."
                          rows={selectedServices.size > 0 ? 8 : 4}
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
