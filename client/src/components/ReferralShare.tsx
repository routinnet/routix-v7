import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Share2, Copy, Check, Mail, MessageCircle } from 'lucide-react';

export interface ReferralShareProps {
  referralCode?: string;
  referralUrl?: string;
  earnedCredits?: number;
  totalReferrals?: number;
}

export function ReferralShare({
  referralCode = 'REF123ABC',
  referralUrl = 'https://routix.app/ref/REF123ABC',
  earnedCredits = 250,
  totalReferrals = 5,
}: ReferralShareProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareEmail = () => {
    const subject = encodeURIComponent('Join Routix and get free credits!');
    const body = encodeURIComponent(
      `Hey! I've been using Routix to create amazing thumbnails. Use my referral link to sign up and we both get free credits:\n\n${referralUrl}`
    );
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(
      `Hey! Check out Routix for creating amazing thumbnails. Use my referral link to get free credits: ${referralUrl}`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-playfair font-bold mb-2">Refer & Earn</h2>
        <p className="text-gray-600 text-sm">
          Share Routix with friends and earn credits for every successful referral
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <Card className="p-4 text-center">
          <p className="text-3xl font-bold text-blue-600">{totalReferrals}</p>
          <p className="text-sm text-gray-600 mt-1">Total Referrals</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-3xl font-bold text-green-600">{earnedCredits}</p>
          <p className="text-sm text-gray-600 mt-1">Credits Earned</p>
        </Card>
      </div>

      {/* Referral Link */}
      <Card className="p-6 mb-6">
        <h3 className="text-lg font-semibold mb-4">Your Referral Link</h3>
        <div className="space-y-4">
          <div>
            <label className="text-sm text-gray-600 mb-2 block">Referral Code</label>
            <div className="flex gap-2">
              <Input
                value={referralCode}
                readOnly
                className="flex-1 font-mono bg-gray-50"
              />
              <Button onClick={handleCopyLink} variant="outline">
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          <div>
            <label className="text-sm text-gray-600 mb-2 block">Referral URL</label>
            <div className="flex gap-2">
              <Input
                value={referralUrl}
                readOnly
                className="flex-1 font-mono text-sm bg-gray-50"
              />
              <Button onClick={handleCopyLink} variant="outline">
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          {copied && (
            <div className="flex items-center text-green-600 text-sm">
              <Check className="w-4 h-4 mr-1" />
              Link copied to clipboard!
            </div>
          )}
        </div>
      </Card>

      {/* Share Options */}
      <Card className="p-6 mb-6">
        <h3 className="text-lg font-semibold mb-4">Share via</h3>
        <div className="grid grid-cols-2 gap-3">
          <Button onClick={handleShareEmail} variant="outline" className="flex items-center justify-center">
            <Mail className="w-4 h-4 mr-2" />
            Email
          </Button>
          <Button onClick={handleShareWhatsApp} variant="outline" className="flex items-center justify-center">
            <MessageCircle className="w-4 h-4 mr-2" />
            WhatsApp
          </Button>
        </div>
      </Card>

      {/* How it Works */}
      <Card className="p-6 bg-gradient-to-br from-blue-50 to-purple-50">
        <h3 className="text-lg font-semibold mb-4">How it Works</h3>
        <div className="space-y-3">
          <div className="flex items-start">
            <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center mr-3 flex-shrink-0">
              1
            </div>
            <div>
              <p className="font-semibold">Share your link</p>
              <p className="text-sm text-gray-600">Send your unique referral link to friends</p>
            </div>
          </div>

          <div className="flex items-start">
            <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center mr-3 flex-shrink-0">
              2
            </div>
            <div>
              <p className="font-semibold">They sign up</p>
              <p className="text-sm text-gray-600">Your friend creates an account using your link</p>
            </div>
          </div>

          <div className="flex items-start">
            <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center mr-3 flex-shrink-0">
              3
            </div>
            <div>
              <p className="font-semibold">You both earn</p>
              <p className="text-sm text-gray-600">Get 50 credits when they make their first purchase</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

