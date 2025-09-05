import { useEffect, useState } from 'react';
import { Button } from './Button';
import { Card } from './Card';
import { useGuardians } from '../hooks/useGuardians';

export function RecoveryPanel({ actor }) {
  const { loading, error, fetchState, setGuardians, requestRecovery, approveRecovery, recoveryStatus } = useGuardians(actor);
  const [guardians, setLocalGuardians] = useState('');
  const [quorum, setQuorum] = useState(0);
  const [state, setState] = useState(null);
  const [newOwner, setNewOwner] = useState('');
  const [reqId, setReqId] = useState('');
  const [status, setStatus] = useState('');

  useEffect(() => { (async () => { if (actor) setState(await fetchState()); })(); }, [actor]);

  async function handleSetGuardians() {
    const list = guardians.split(',').map(s => s.trim()).filter(Boolean);
    const res = await setGuardians({ guardians: list, quorum: Number(quorum) });
    if (res) { setStatus('Guardians updated'); setState(await fetchState()); }
  }

  async function handleRequestRecovery() {
    const id = await requestRecovery(newOwner);
    setStatus(`Recovery requested: ${id}`);
    setReqId(String(id));
  }

  async function handleApprove() {
    const ok = await approveRecovery(Number(reqId));
    setStatus(ok ? 'Recovery approved and finalized' : 'Approval recorded');
  }

  async function handleCheck() {
    const s = await recoveryStatus(Number(reqId));
    setStatus(JSON.stringify(s));
  }

  return (
    <Card className="mt-4">
      <h3 className="text-lg font-semibold mb-2">Guardians & Recovery</h3>
      {state && (
        <div className="text-sm opacity-80 mb-3">
          Owner: <span className="font-mono">{state.owner?.toText?.() ?? String(state.owner)}</span> · Quorum: {state.quorum} · Guardians: {state.guardians?.length ?? 0}
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <div className="text-xs opacity-80">Guardians (comma-separated principals)</div>
          <input className="w-full p-2 rounded bg-[#0f1117] border border-[#1b1e27]" placeholder="aaaaa-aa, bbbbbb-bb..." value={guardians} onChange={(e)=>setLocalGuardians(e.target.value)} />
        </div>
        <div>
          <div className="text-xs opacity-80">Quorum</div>
          <input type="number" className="w-full p-2 rounded bg-[#0f1117] border border-[#1b1e27]" value={quorum} onChange={(e)=>setQuorum(e.target.value)} />
        </div>
      </div>
      <div className="mt-2"><Button disabled={loading} onClick={handleSetGuardians}>Save Guardians</Button></div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
        <div>
          <div className="text-xs opacity-80">New Owner Principal</div>
          <input className="w-full p-2 rounded bg-[#0f1117] border border-[#1b1e27]" placeholder="aaaaa-aa" value={newOwner} onChange={(e)=>setNewOwner(e.target.value)} />
          <div className="mt-2"><Button disabled={loading} onClick={handleRequestRecovery}>Request Recovery</Button></div>
        </div>
        <div>
          <div className="text-xs opacity-80">Recovery Request ID</div>
          <input className="w-full p-2 rounded bg-[#0f1117] border border-[#1b1e27]" placeholder="0" value={reqId} onChange={(e)=>setReqId(e.target.value)} />
          <div className="mt-2 flex gap-2">
            <Button disabled={loading} onClick={handleApprove}>Approve</Button>
            <Button disabled={loading} onClick={handleCheck}>Status</Button>
          </div>
        </div>
      </div>
      {(error || status) && <div className="text-sm opacity-80 mt-2">{error || status}</div>}
    </Card>
  );
}
