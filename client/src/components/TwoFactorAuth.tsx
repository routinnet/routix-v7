import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export interface TwoFactorAuthProps {
  onVerify?: (code: string) => void;
  onBackupCode?: (code: string) => void;
  qrCode?: string;
  backupCodes?: string[];
}

export function TwoFactorAuth({
  onVerify,
  onBackupCode,
  qrCode,
  backupCodes,
}: TwoFactorAuthProps) {
  const [mode, setMode] = useState<'verify' | 'setup' | 'backup'>('verify');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleVerify = async () => {
    setLoading(true);
    try {
      onVerify?.(code);
    } finally {
      setLoading(false);
    }
  };

  const handleBackupCode = async () => {
    setLoading(true);
    try {
      onBackupCode?.(code);
    } finally {
      setLoading(false);
    }
  };

  const copyBackupCodes = () => {
    const text = backupCodes?.join('\n') || '';
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full max-w-md mx-auto p-6 bg-white rounded-2xl shadow-lg">
      {mode === 'verify' && (
        <div className="space-y-4">
          <h2 className="text-2xl font-playfair font-bold text-center">Two-Factor Authentication</h2>
          <p className="text-center text-gray-600 text-sm">
            Enter the 6-digit code from your authenticator app
          </p>
          <Input
            type="text"
            placeholder="000000"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            maxLength={6}
            className="w-full text-center text-2xl tracking-widest"
          />
          <Button
            onClick={handleVerify}
            disabled={loading || code.length !== 6}
            className="w-full bg-blue-500 hover:bg-blue-600"
          >
            {loading ? 'Verifying...' : 'Verify'}
          </Button>
          <button
            onClick={() => setMode('backup')}
            className="text-sm text-blue-500 hover:underline w-full text-center"
          >
            Use backup code instead
          </button>
        </div>
      )}

      {mode === 'setup' && (
        <div className="space-y-4">
          <h2 className="text-2xl font-playfair font-bold text-center">Set Up 2FA</h2>
          <p className="text-center text-gray-600 text-sm">
            Scan this QR code with your authenticator app
          </p>
          {qrCode && (
            <div className="flex justify-center">
              <img src={qrCode} alt="2FA QR Code" className="w-48 h-48" />
            </div>
          )}
          <Input
            type="text"
            placeholder="Enter verification code"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            maxLength={6}
            className="w-full text-center text-2xl tracking-widest"
          />
          <Button
            onClick={handleVerify}
            disabled={loading || code.length !== 6}
            className="w-full bg-blue-500 hover:bg-blue-600"
          >
            {loading ? 'Setting up...' : 'Confirm & Set Up'}
          </Button>
        </div>
      )}

      {mode === 'backup' && (
        <div className="space-y-4">
          <h2 className="text-2xl font-playfair font-bold text-center">Backup Codes</h2>
          <p className="text-center text-gray-600 text-sm">
            Save these codes in a safe place. Use them if you lose access to your authenticator.
          </p>
          <div className="bg-gray-100 p-4 rounded-lg space-y-2 max-h-40 overflow-y-auto">
            {backupCodes?.map((code, idx) => (
              <div key={idx} className="font-mono text-sm">
                {code}
              </div>
            ))}
          </div>
          <Button
            onClick={copyBackupCodes}
            variant="outline"
            className="w-full"
          >
            {copied ? '✓ Copied' : 'Copy Codes'}
          </Button>
          <Input
            type="text"
            placeholder="Enter backup code"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            className="w-full"
          />
          <Button
            onClick={handleBackupCode}
            disabled={loading || code.length === 0}
            className="w-full bg-blue-500 hover:bg-blue-600"
          >
            {loading ? 'Verifying...' : 'Verify Backup Code'}
          </Button>
        </div>
      )}
    </div>
  );
}
