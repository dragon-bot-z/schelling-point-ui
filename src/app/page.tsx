'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther, formatEther, keccak256, toBytes, encodePacked } from 'viem';
import { SCHELLING_POINT_ADDRESS, SCHELLING_POINT_ABI, Phase } from '@/lib/wagmiConfig';

// Generate random salt
function generateSalt(): `0x${string}` {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return `0x${Array.from(array).map(b => b.toString(16).padStart(2, '0')).join('')}` as `0x${string}`;
}

// Format time remaining
function formatTimeRemaining(deadline: bigint): string {
  const now = BigInt(Math.floor(Date.now() / 1000));
  const remaining = deadline - now;
  if (remaining <= 0n) return '00:00:00';
  
  const hours = remaining / 3600n;
  const minutes = (remaining % 3600n) / 60n;
  const seconds = remaining % 60n;
  
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

// Phase display info
const PHASE_INFO: Record<Phase, { label: string; class: string; icon: string }> = {
  [Phase.Inactive]: { label: 'No Active Round', class: 'phase-inactive', icon: '◯' },
  [Phase.Commit]: { label: 'Commit Phase', class: 'phase-commit', icon: '◉' },
  [Phase.Reveal]: { label: 'Reveal Phase', class: 'phase-reveal', icon: '◎' },
  [Phase.Complete]: { label: 'Complete', class: 'phase-complete', icon: '◉' },
};

// Data stream background text
const DATA_STREAM = `
SCHELLING POINT THEORY
FOCAL POINT COORDINATION
GAME THEORY EXPERIMENT
COLLECTIVE PSYCHOLOGY
CONSENSUS MECHANISM
COORDINATION GAME
NASH EQUILIBRIUM
PURE STRATEGY
MIXED STRATEGY
DOMINANT CHOICE
FOCAL CONVERGENCE
`.repeat(20);

export default function Home() {
  const { address, isConnected } = useAccount();
  const [roundId, setRoundId] = useState<bigint>(1n);
  const [answer, setAnswer] = useState('');
  const [salt, setSalt] = useState<`0x${string}` | null>(null);
  const [revealAnswer, setRevealAnswer] = useState('');
  const [revealSalt, setRevealSalt] = useState('');
  const [timeDisplay, setTimeDisplay] = useState('--:--:--');
  const [savedCommitment, setSavedCommitment] = useState<{answer: string, salt: string} | null>(null);

  // Contract reads
  const { data: currentRoundId } = useReadContract({
    address: SCHELLING_POINT_ADDRESS,
    abi: SCHELLING_POINT_ABI,
    functionName: 'currentRoundId',
  });

  const { data: phase } = useReadContract({
    address: SCHELLING_POINT_ADDRESS,
    abi: SCHELLING_POINT_ABI,
    functionName: 'getPhase',
    args: [roundId],
  });

  const { data: roundData } = useReadContract({
    address: SCHELLING_POINT_ADDRESS,
    abi: SCHELLING_POINT_ABI,
    functionName: 'getRound',
    args: [roundId],
  });

  const { data: hasCommitted } = useReadContract({
    address: SCHELLING_POINT_ADDRESS,
    abi: SCHELLING_POINT_ABI,
    functionName: 'hasCommitted',
    args: [roundId, address!],
    query: { enabled: !!address },
  });

  const { data: hasRevealed } = useReadContract({
    address: SCHELLING_POINT_ADDRESS,
    abi: SCHELLING_POINT_ABI,
    functionName: 'hasRevealed',
    args: [roundId, address!],
    query: { enabled: !!address },
  });

  // Contract writes
  const { writeContract: commit, data: commitHash, isPending: isCommitting } = useWriteContract();
  const { writeContract: reveal, data: revealHash, isPending: isRevealing } = useWriteContract();
  const { writeContract: claim, data: claimHash, isPending: isClaiming } = useWriteContract();

  // Transaction receipts
  const { isSuccess: commitSuccess } = useWaitForTransactionReceipt({ hash: commitHash });
  const { isSuccess: revealSuccess } = useWaitForTransactionReceipt({ hash: revealHash });
  const { isSuccess: claimSuccess } = useWaitForTransactionReceipt({ hash: claimHash });

  // Parse round data
  const round = useMemo(() => {
    if (!roundData) return null;
    const [theme, entryFee, commitDeadline, revealDeadline, totalPot, playerCount, settled] = roundData;
    return { theme, entryFee, commitDeadline, revealDeadline, totalPot, playerCount, settled };
  }, [roundData]);

  // Update round ID when current changes
  useEffect(() => {
    if (currentRoundId && currentRoundId > 0n) {
      setRoundId(currentRoundId);
    }
  }, [currentRoundId]);

  // Load saved commitment from localStorage
  useEffect(() => {
    if (address && roundId) {
      const key = `schelling-${roundId}-${address}`;
      const saved = localStorage.getItem(key);
      if (saved) {
        setSavedCommitment(JSON.parse(saved));
      }
    }
  }, [address, roundId]);

  // Save commitment after successful commit
  useEffect(() => {
    if (commitSuccess && address && salt && answer) {
      const key = `schelling-${roundId}-${address}`;
      localStorage.setItem(key, JSON.stringify({ answer, salt }));
      setSavedCommitment({ answer, salt });
    }
  }, [commitSuccess, address, roundId, salt, answer]);

  // Pre-fill reveal form from saved commitment
  useEffect(() => {
    if (savedCommitment && !hasRevealed) {
      setRevealAnswer(savedCommitment.answer);
      setRevealSalt(savedCommitment.salt);
    }
  }, [savedCommitment, hasRevealed]);

  // Update countdown timer
  useEffect(() => {
    if (!round) return;
    
    const deadline = phase === Phase.Commit ? round.commitDeadline : round.revealDeadline;
    
    const interval = setInterval(() => {
      setTimeDisplay(formatTimeRemaining(deadline));
    }, 1000);

    setTimeDisplay(formatTimeRemaining(deadline));
    return () => clearInterval(interval);
  }, [round, phase]);

  // Generate salt on mount
  useEffect(() => {
    setSalt(generateSalt());
  }, []);

  // Handlers
  const handleCommit = useCallback(async () => {
    if (!salt || !answer || !round) return;
    
    // Generate commit hash: keccak256(abi.encodePacked(answer, salt))
    const commitHash = keccak256(encodePacked(['string', 'bytes32'], [answer, salt]));
    
    commit({
      address: SCHELLING_POINT_ADDRESS,
      abi: SCHELLING_POINT_ABI,
      functionName: 'commit',
      args: [roundId, commitHash],
      value: round.entryFee,
    });
  }, [answer, salt, round, roundId, commit]);

  const handleReveal = useCallback(() => {
    if (!revealAnswer || !revealSalt) return;
    
    reveal({
      address: SCHELLING_POINT_ADDRESS,
      abi: SCHELLING_POINT_ABI,
      functionName: 'reveal',
      args: [roundId, revealAnswer, revealSalt as `0x${string}`],
    });
  }, [revealAnswer, revealSalt, roundId, reveal]);

  const handleClaim = useCallback(() => {
    claim({
      address: SCHELLING_POINT_ADDRESS,
      abi: SCHELLING_POINT_ABI,
      functionName: 'claim',
      args: [roundId],
    });
  }, [roundId, claim]);

  const currentPhase: Phase = phase !== undefined ? (phase as Phase) : Phase.Inactive;
  const phaseInfo = PHASE_INFO[currentPhase];

  return (
    <main className="min-h-screen relative overflow-hidden">
      {/* CRT Scanline Overlay */}
      <div className="crt-overlay" />
      
      {/* Data Stream Background */}
      <div className="data-stream left-4 top-0 text-[var(--color-phosphor)]">
        {DATA_STREAM}
      </div>
      <div className="data-stream right-4 top-[-50%] text-[var(--color-amber)]" style={{ animationDelay: '-15s' }}>
        {DATA_STREAM}
      </div>

      {/* Grid Background */}
      <div className="absolute inset-0 grid-bg" />

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 py-8 max-w-4xl">
        
        {/* Header */}
        <header className="flex flex-col md:flex-row justify-between items-center gap-4 mb-12">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-wider phosphor-glow" style={{ fontFamily: 'var(--font-display)' }}>
              SCHELLING POINT
            </h1>
            <p className="text-[var(--color-text-dim)] text-sm mt-1 tracking-widest">
              COORDINATION GAME THEORY EXPERIMENT
            </p>
          </div>
          <ConnectButton />
        </header>

        {/* Phase & Timer Bar */}
        <div className="panel p-4 mb-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-4">
              <span className={`phase-badge ${phaseInfo.class} ${currentPhase === Phase.Commit || currentPhase === Phase.Reveal ? 'phase-active' : ''}`}>
                <span className="mr-2">{phaseInfo.icon}</span>
                {phaseInfo.label}
              </span>
              <span className="text-[var(--color-text-dim)] text-sm">
                Round #{roundId.toString()}
              </span>
            </div>
            {(currentPhase === Phase.Commit || currentPhase === Phase.Reveal) && (
              <div className="text-center">
                <div className="countdown phosphor-glow">{timeDisplay}</div>
                <div className="stat-label">TIME REMAINING</div>
              </div>
            )}
          </div>
        </div>

        {/* Theme Display */}
        {round && (
          <div className="panel p-6 mb-8 text-center">
            <div className="stat-label mb-2">THE QUESTION</div>
            <div className="text-2xl md:text-3xl font-bold amber-glow" style={{ fontFamily: 'var(--font-display)' }}>
              &ldquo;{round.theme}&rdquo;
            </div>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="panel p-4 text-center">
            <div className="stat-value">{round ? formatEther(round.totalPot) : '0'}</div>
            <div className="stat-label">Total Pot (ETH)</div>
          </div>
          <div className="panel p-4 text-center">
            <div className="stat-value">{round ? round.playerCount.toString() : '0'}</div>
            <div className="stat-label">Players</div>
          </div>
          <div className="panel p-4 text-center">
            <div className="stat-value">{round ? formatEther(round.entryFee) : '0'}</div>
            <div className="stat-label">Entry Fee (ETH)</div>
          </div>
          <div className="panel p-4 text-center">
            <div className="stat-value">2.5%</div>
            <div className="stat-label">Protocol Fee</div>
          </div>
        </div>

        {/* Action Panel */}
        <div className="panel p-6 mb-8">
          {!isConnected ? (
            <div className="text-center py-8">
              <div className="text-[var(--color-text-dim)] mb-4">Connect your wallet to participate</div>
              <ConnectButton />
            </div>
          ) : currentPhase === Phase.Inactive ? (
            <div className="text-center py-8">
              <div className="text-[var(--color-text-dim)]">No active round. Waiting for next experiment...</div>
            </div>
          ) : currentPhase === Phase.Commit ? (
            <div>
              <h2 className="text-xl font-bold mb-4 phosphor-glow" style={{ fontFamily: 'var(--font-display)' }}>
                COMMIT YOUR ANSWER
              </h2>
              {hasCommitted ? (
                <div className="text-center py-4">
                  <div className="text-[var(--color-phosphor)] mb-2">✓ You have committed</div>
                  {savedCommitment && (
                    <div className="text-sm text-[var(--color-text-dim)]">
                      Your answer: <span className="text-[var(--color-amber)]">{savedCommitment.answer}</span>
                      <br />
                      <span className="text-xs">Wait for reveal phase to confirm</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-[var(--color-text-dim)] mb-2">Your Answer</label>
                    <input
                      type="text"
                      value={answer}
                      onChange={(e) => setAnswer(e.target.value)}
                      placeholder="Enter your answer..."
                      className="w-full p-3 rounded"
                    />
                  </div>
                  <div className="text-xs text-[var(--color-text-dim)]">
                    🔐 Your answer is hashed before submission. Keep this page open or save your salt:
                    <br />
                    <code className="text-[var(--color-cyan)] break-all">{salt}</code>
                  </div>
                  <button
                    onClick={handleCommit}
                    disabled={!answer || isCommitting}
                    className="btn-primary w-full py-3 rounded"
                  >
                    {isCommitting ? 'COMMITTING...' : `COMMIT (${round ? formatEther(round.entryFee) : '0'} ETH)`}
                  </button>
                </div>
              )}
            </div>
          ) : currentPhase === Phase.Reveal ? (
            <div>
              <h2 className="text-xl font-bold mb-4 amber-glow" style={{ fontFamily: 'var(--font-display)' }}>
                REVEAL YOUR ANSWER
              </h2>
              {!hasCommitted ? (
                <div className="text-center py-4 text-[var(--color-text-dim)]">
                  You did not commit in this round
                </div>
              ) : hasRevealed ? (
                <div className="text-center py-4">
                  <div className="text-[var(--color-amber)]">✓ You have revealed</div>
                  <div className="text-sm text-[var(--color-text-dim)] mt-2">Wait for round to complete...</div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-[var(--color-text-dim)] mb-2">Your Answer (plaintext)</label>
                    <input
                      type="text"
                      value={revealAnswer}
                      onChange={(e) => setRevealAnswer(e.target.value)}
                      placeholder="Enter the answer you committed..."
                      className="w-full p-3 rounded"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-[var(--color-text-dim)] mb-2">Your Salt</label>
                    <input
                      type="text"
                      value={revealSalt}
                      onChange={(e) => setRevealSalt(e.target.value)}
                      placeholder="0x..."
                      className="w-full p-3 rounded font-mono text-sm"
                    />
                  </div>
                  <button
                    onClick={handleReveal}
                    disabled={!revealAnswer || !revealSalt || isRevealing}
                    className="btn-primary w-full py-3 rounded"
                    style={{ background: 'linear-gradient(180deg, var(--color-amber) 0%, var(--color-amber-dim) 100%)' }}
                  >
                    {isRevealing ? 'REVEALING...' : 'REVEAL ANSWER'}
                  </button>
                </div>
              )}
            </div>
          ) : currentPhase === Phase.Complete && round?.settled ? (
            <div className="text-center">
              <h2 className="text-xl font-bold mb-4 cyan-glow" style={{ fontFamily: 'var(--font-display)' }}>
                ROUND COMPLETE
              </h2>
              {hasCommitted && hasRevealed && (
                <button
                  onClick={handleClaim}
                  disabled={isClaiming}
                  className="btn-primary py-3 px-8 rounded"
                  style={{ background: 'linear-gradient(180deg, var(--color-cyan) 0%, var(--color-cyan-dim) 100%)' }}
                >
                  {isClaiming ? 'CLAIMING...' : 'CLAIM PRIZE'}
                </button>
              )}
            </div>
          ) : (
            <div className="text-center py-4 text-[var(--color-text-dim)]">
              Waiting for round to be settled...
            </div>
          )}
        </div>

        {/* Game Theory Explainer */}
        <div className="panel p-6">
          <h3 className="text-lg font-bold mb-4 text-[var(--color-text)]" style={{ fontFamily: 'var(--font-display)' }}>
            HOW IT WORKS
          </h3>
          <div className="grid md:grid-cols-2 gap-6 text-sm text-[var(--color-text-dim)]">
            <div>
              <h4 className="text-[var(--color-phosphor)] font-bold mb-2">What is a Schelling Point?</h4>
              <p>
                A focal point in game theory — the answer that &ldquo;stands out&rdquo; as obvious 
                when people can&apos;t communicate. If you need to meet someone in NYC but can&apos;t 
                coordinate, you both go to Grand Central.
              </p>
            </div>
            <div>
              <h4 className="text-[var(--color-amber)] font-bold mb-2">The Psychology</h4>
              <p>
                You&apos;re not trying to pick the &ldquo;right&rdquo; answer — you&apos;re trying to 
                pick what <em>everyone else</em> will pick. &ldquo;Pick a number 1-10&rdquo; → most 
                pick 7. &ldquo;Pick a color&rdquo; → most pick blue.
              </p>
            </div>
            <div>
              <h4 className="text-[var(--color-cyan)] font-bold mb-2">Commit-Reveal</h4>
              <p>
                Your answer is hashed before submission so no one can copy you. During the reveal 
                phase, you prove your answer matches. This prevents answer sniping.
              </p>
            </div>
            <div>
              <h4 className="text-[var(--color-red)] font-bold mb-2">Winners & Losers</h4>
              <p>
                Everyone who picked the <strong>most popular answer</strong> splits the pot equally. 
                If you picked a minority answer, you get nothing. Coordination is survival.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="text-center mt-12 text-[var(--color-text-dim)] text-xs">
          <p>
            Built by <a href="https://x.com/Dragon_Bot_Z" className="text-[var(--color-phosphor)] hover:underline">Dragon Bot Z</a> 🐉
          </p>
          <p className="mt-1">
            <a href="https://github.com/dragon-bot-z/schelling-point" className="hover:text-[var(--color-phosphor)]">
              Smart Contract
            </a>
            {' · '}
            <a href="https://github.com/dragon-bot-z/schelling-point-ui" className="hover:text-[var(--color-phosphor)]">
              Frontend
            </a>
          </p>
        </footer>
      </div>
    </main>
  );
}
