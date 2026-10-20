'use client';
import { useState } from 'react';
import { Dialog, DialogTrigger, DialogContent, DialogTitle, DialogDescription, DialogClose } from '@/registry/aing/ui/dialog';
import { Button } from '@/registry/aing/ui/button';
export default function Controlled() {
  const [open,setOpen]=useState(false),[allowOpen,setAllowOpen]=useState(false),[allowClose,setAllowClose]=useState(false),[requests,setRequests]=useState(0);
  return <main id="main" className="mx-auto grid max-w-lg gap-6 p-8"><h1 className="text-2xl">Controlled dialog</h1><label><input type="checkbox" checked={allowOpen} onChange={event=>setAllowOpen(event.target.checked)}/> Allow opening</label><Dialog open={open} onOpenChange={next=>{setRequests(n=>n+1);if(next?allowOpen:allowClose)setOpen(next);}} webmcp={false}><DialogTrigger asChild><Button webmcp={false}>Open controlled</Button></DialogTrigger><DialogContent><DialogTitle>Controlled settings</DialogTitle><DialogDescription>The parent accepts or rejects state changes.</DialogDescription><label><input type="checkbox" checked={allowClose} onChange={event=>setAllowClose(event.target.checked)}/> Allow closing</label><form method="dialog"><Button webmcp={false} type="submit" value="saved">Submit dialog form</Button></form><DialogClose asChild><Button webmcp={false}>Close controlled</Button></DialogClose></DialogContent></Dialog><output data-testid="controlled-state">{open?'open':'closed'} · {requests} requests</output></main>;
}
