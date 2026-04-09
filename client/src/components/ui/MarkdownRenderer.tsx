import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface Props {
  content: string
  className?: string
}

function MdA({ href, children }: { href?: string; children?: React.ReactNode }) {
  const handleClick = () => {
    if (href) window.open(href, '_blank', 'noopener,noreferrer')
  }
  return (
    <span
      onClick={handleClick}
      className="text-primary underline underline-offset-2 hover:opacity-80 text-sm cursor-pointer"
    >
      {children}
    </span>
  )
}

function MdCode({ children, className }: { children?: React.ReactNode; className?: string }) {
  const isBlock = className?.includes('language-')
  if (isBlock) {
    return (
      <code className="block bg-secondary text-secondary-foreground text-xs p-3 rounded-md overflow-x-auto font-mono mb-2">
        {children}
      </code>
    )
  }
  return (
    <code className="bg-secondary text-secondary-foreground text-xs px-1.5 py-0.5 rounded font-mono">
      {children}
    </code>
  )
}

export default function MarkdownRenderer({ content, className = '' }: Props) {
  return (
    <div className={className}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => <h1 className="text-xl font-bold mt-4 mb-2 text-foreground">{children}</h1>,
          h2: ({ children }) => <h2 className="text-lg font-semibold mt-3 mb-2 text-foreground">{children}</h2>,
          h3: ({ children }) => <h3 className="text-base font-semibold mt-2 mb-1 text-foreground">{children}</h3>,
          p: ({ children }) => <p className="text-sm text-foreground mb-2 leading-relaxed">{children}</p>,
          ul: ({ children }) => <ul className="list-disc list-inside text-sm text-foreground mb-2 space-y-1">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal list-inside text-sm text-foreground mb-2 space-y-1">{children}</ol>,
          li: ({ children }) => <li className="text-sm text-foreground">{children}</li>,
          pre: ({ children }) => <pre className="bg-secondary rounded-md overflow-x-auto mb-2">{children}</pre>,
          blockquote: ({ children }) => <blockquote className="border-l-4 border-border pl-3 italic text-muted-foreground text-sm mb-2">{children}</blockquote>,
          strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
          hr: () => <hr className="border-border my-3" />,
          th: ({ children }) => <th className="border border-border px-3 py-1.5 bg-secondary text-left font-medium text-xs">{children}</th>,
          td: ({ children }) => <td className="border border-border px-3 py-1.5 text-xs">{children}</td>,
          table: ({ children }) => <div className="overflow-x-auto mb-2"><table className="w-full text-sm border-collapse">{children}</table></div>,
          input: ({ checked }) => <input type="checkbox" checked={checked} readOnly className="mr-1.5 rounded" />,
          a: MdA,
          code: MdCode,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}