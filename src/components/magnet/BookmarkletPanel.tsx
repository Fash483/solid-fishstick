import { useMemo, useState } from 'react';
import { ChevronDown, Bookmark, RefreshCw, Copy, CheckCheck } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';

export default function BookmarkletPanel() {
  const [open, setOpen] = useState(true);
  const [key, setKey] = useState(0);
  const [copied, setCopied] = useState(false);

  // The proxy URL is always /api/db — same origin, no CORS needed
  const bookmarkletCode = useMemo(() => {
    // We need an absolute URL for the bookmarklet (it runs on external pages)
    // It will POST to wherever this app is deployed.
    const proxyUrl = `${window.location.origin}/api/db`;

    return `javascript:(function(){` +
      `var magnets=[].slice.call(document.querySelectorAll('a[href^="magnet:"]'));` +
      `if(!magnets.length){alert('No magnet links found on this page.');return;}` +
      `var unique=magnets.map(function(a){return a.href;}).filter(function(v,i,s){return s.indexOf(v)===i;});` +
      `if(!confirm('Found '+unique.length+' magnet link(s). Save to Magnet Vault?'))return;` +
      `function parseDn(u){` +
        `var r=u.match(/[?&]dn=([^&]+)/i);` +
        `if(r){try{return decodeURIComponent(r[1].replace(/[+]/g,' ')).replace(/[._]+/g,' ').trim();}catch(e){return r[1];}}` +
        `return '(imported)';` +
      `}` +
      `var items=unique.map(function(href){return{title:parseDn(href),magnet:href};});` +
      `fetch('${proxyUrl}',{` +
        `method:'POST',` +
        `headers:{'Content-Type':'application/json'},` +
        `body:JSON.stringify({action:'insertMany',items:items})` +
      `}).then(function(r){return r.json();})` +
      `.then(function(d){` +
        `alert('Done: '+d.saved+' saved'+(d.failed?' ('+d.failed+' failed)':'')+'.');` +
      `})` +
      `.catch(function(e){alert('Error: '+e.message);});` +
    `})();`;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  function handleCopy() {
    navigator.clipboard.writeText(bookmarkletCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  }

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <button className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-muted text-muted-foreground hover:text-foreground">
          <ChevronDown className={`w-4 h-4 shrink-0 transition-transform ${open ? 'rotate-0' : '-rotate-90'}`} />
          <Bookmark className="w-4 h-4 shrink-0 text-primary" />
          Browser Integration
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="mt-2 px-2 space-y-3">
          {/* Step 1 — Drag */}
          <div className="space-y-1.5">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-semibold">
              Step 1 — Install bookmarklet
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              <strong className="text-foreground">Drag</strong> the button below to your bookmarks bar:
            </p>
            <a
              href={bookmarkletCode}
              draggable
              onClick={(e) => e.preventDefault()}
              className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-semibold cursor-grab active:cursor-grabbing select-none"
              style={{
                background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(300 70% 50%))',
                color: 'white',
                border: '1px solid hsl(var(--primary))',
              }}
            >
              🦋 Save Magnets to Vault
            </a>
            <p className="text-[10px] text-muted-foreground">
              Can&apos;t drag? Use Step 2 instead ↓
            </p>
          </div>

          {/* Step 2 — Copy & paste */}
          <div className="space-y-1.5">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-semibold">
              Step 2 — Or copy &amp; paste manually
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Copy the code, create a new bookmark, and paste it as the URL.
            </p>
            <Button
              size="sm"
              variant="secondary"
              className="w-full h-8 text-xs gap-2"
              onClick={handleCopy}
            >
              {copied ? <CheckCheck className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
              {copied ? 'Copied!' : 'Copy Bookmarklet Code'}
            </Button>
          </div>

          {/* How it works */}
          <div className="rounded-lg p-2 text-xs border border-border bg-muted space-y-1">
            <p className="text-muted-foreground font-medium">How it works:</p>
            <p className="text-muted-foreground leading-relaxed">
              The bookmarklet sends magnets to your app&apos;s <strong className="text-foreground">Vercel API function</strong> — a server-side proxy that inserts them directly into NeonDB. Works on any site.
            </p>
          </div>

          {/* Regenerate */}
          <div className="flex items-center justify-between">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">Source</p>
            <Button
              size="sm" variant="ghost"
              className="h-5 text-[10px] gap-1 text-muted-foreground hover:text-foreground px-1"
              onClick={() => setKey((k) => k + 1)}
              title="Regenerate bookmarklet"
            >
              <RefreshCw className="w-3 h-3" />
              Regenerate
            </Button>
          </div>
          <pre className="text-[10px] font-mono text-muted-foreground bg-muted rounded-md p-2 overflow-x-auto whitespace-pre-wrap break-all border border-border max-h-28">
            {bookmarkletCode}
          </pre>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
