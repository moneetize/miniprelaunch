import { useState } from 'react';
import { useNavigate } from 'react-router';
import { AnimatePresence, motion } from 'motion/react';
import { AlertCircle, Check, CheckCircle, ChevronLeft, Copy, Mail, MessageSquare, Plus, X } from 'lucide-react';
import gemIcon from 'figma:asset/296d8aa06fd9c7e60192bc7368a4a032ec5bc17e.png';
import { buildInviteLink } from '../utils/invitationLinks';
import { recordSentInvites, type InviteDeliveryType } from '../utils/inviteSync';
import { addUserPoints } from '../utils/pointsManager';

const MAX_INVITES_PER_METHOD = 5;

export function ShareInvites() {
  const navigate = useNavigate();
  const [emails, setEmails] = useState(['', '']);
  const [phoneNumbers, setPhoneNumbers] = useState(['', '']);
  const [inviteLink] = useState(() => buildInviteLink());
  const [linkCopied, setLinkCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sentEmails, setSentEmails] = useState<string[]>([]);
  const [sentPhones, setSentPhones] = useState<string[]>([]);

  const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const validatePhone = (phone: string) => {
    const cleaned = phone.replace(/\D/g, '');
    return cleaned.length >= 10 && cleaned.length <= 15;
  };

  const getInviteMessage = () =>
    `Hey! I invited you to Moneetize. Start here and scratch to win rewards: ${inviteLink}`;

  const getSmsUrl = (recipients: string[], message: string) => {
    const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : '';
    const separator = /iPad|iPhone|iPod/i.test(userAgent) ? '&' : '?';
    const cleanedRecipients = recipients.map((phone) => phone.replace(/[^\d+]/g, '')).join(',');

    return `sms:${cleanedRecipients}${separator}body=${encodeURIComponent(message)}`;
  };

  const awardInvitePoints = async (inviteCount: number) => {
    const pointsEarned = inviteCount * 5;
    await addUserPoints(pointsEarned, 'referral');
    return pointsEarned;
  };

  const syncInviteRecords = async (recipients: string[], type: InviteDeliveryType) => {
    recordSentInvites(recipients, type, inviteLink);
    return awardInvitePoints(recipients.length);
  };

  const handleEmailChange = (index: number, value: string) => {
    setEmails((current) => current.map((email, emailIndex) => (emailIndex === index ? value : email)));
    setError(null);
  };

  const handlePhoneChange = (index: number, value: string) => {
    setPhoneNumbers((current) => current.map((phone, phoneIndex) => (phoneIndex === index ? value : phone)));
    setError(null);
  };

  const handleRemoveEmail = (index: number) => {
    setEmails((current) => current.filter((_, emailIndex) => emailIndex !== index));
  };

  const handleRemovePhone = (index: number) => {
    setPhoneNumbers((current) => current.filter((_, phoneIndex) => phoneIndex !== index));
  };

  const handleAddEmail = () => {
    setEmails((current) => (current.length < MAX_INVITES_PER_METHOD ? [...current, ''] : current));
  };

  const handleAddPhone = () => {
    setPhoneNumbers((current) => (current.length < MAX_INVITES_PER_METHOD ? [...current, ''] : current));
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy invite link:', err);
      setError('Unable to copy the invite link right now.');
    }
  };

  const handleSendSMS = async () => {
    setError(null);
    setSuccessMessage(null);

    const validPhoneNumbers = phoneNumbers.map((phone) => phone.trim()).filter(Boolean);

    if (validPhoneNumbers.length === 0) {
      setError('Please enter at least one phone number');
      return;
    }

    if (validPhoneNumbers.some((phone) => !validatePhone(phone))) {
      setError('Please enter valid phone numbers with a country code, like +1234567890');
      return;
    }

    const pointsEarned = await syncInviteRecords(validPhoneNumbers, 'sms');
    const smsUrl = getSmsUrl(validPhoneNumbers, getInviteMessage());

    setSentPhones(validPhoneNumbers);
    setSentEmails([]);
    setSuccessMessage(`SMS composer opened for ${validPhoneNumbers.length} invite${validPhoneNumbers.length > 1 ? 's' : ''}. You earned ${pointsEarned} points.`);
    setPhoneNumbers(['', '']);
    window.location.href = smsUrl;
  };

  const handleSendInvites = async () => {
    setError(null);
    setSuccessMessage(null);

    const validEmails = emails.map((email) => email.trim()).filter(Boolean);

    if (validEmails.length === 0) {
      setError('Please enter at least one email address');
      return;
    }

    if (validEmails.some((email) => !validateEmail(email))) {
      setError('Please enter valid email addresses');
      return;
    }

    setIsLoading(true);

    try {
      const inviteMessage = getInviteMessage();
      const pointsEarned = await syncInviteRecords(validEmails, 'email');
      const mailtoUrl = `mailto:${validEmails.map(encodeURIComponent).join(',')}?subject=${encodeURIComponent('Your Moneetize invite')}&body=${encodeURIComponent(inviteMessage)}`;

      setSentEmails(validEmails);
      setSentPhones([]);
      setSuccessMessage(`Email composer opened for ${validEmails.length} invite${validEmails.length > 1 ? 's' : ''}. You earned ${pointsEarned} points.`);
      setEmails(['', '']);
      window.location.href = mailtoUrl;
    } catch (err) {
      console.error('Send invites error:', err);
      setError(err instanceof Error ? err.message : 'Failed to send invites. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const filledEmailsCount = emails.filter((email) => email.trim() !== '').length;
  const filledPhonesCount = phoneNumbers.filter((phone) => phone.trim() !== '').length;
  const potentialPoints = (filledEmailsCount + filledPhonesCount) * 5;

  return (
    <div className="absolute inset-0 h-full w-full overflow-y-auto bg-[#060708] text-white [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
      <div className="pointer-events-none fixed inset-x-0 top-0 h-40 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.08),transparent_70%)]" />

      <div className="relative mx-auto flex min-h-full w-full max-w-md flex-col px-4 pb-10 pt-4">
        <div className="mb-4 flex h-7 items-center justify-between px-2 text-[15px] font-semibold text-white">
          <span>9:41</span>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-3 rounded-[2px] bg-white/80" />
            <span className="h-2.5 w-3 rounded-[2px] bg-white/80" />
            <span className="h-3 w-5 rounded-[3px] bg-white/80" />
          </div>
        </div>

        <motion.section
          initial={{ y: 18, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
          className="overflow-hidden rounded-[1.6rem] border border-white/8 bg-gradient-to-b from-[#1b1d1f] via-[#17191b] to-[#101214] px-4 pb-6 pt-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_24px_78px_rgba(0,0,0,0.62)]"
        >
          <div className="mb-6 flex items-center justify-between gap-3">
            <button
              onClick={() => navigate('/profile-screen')}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/8 text-white/82 transition-colors hover:bg-white/14"
              aria-label="Back to profile"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>

            <div className="min-w-0 text-center">
              <h1 className="text-lg font-black tracking-normal text-white">Share Invites</h1>
              <p className="mt-1 text-xs font-semibold text-white/46">Earn 5 pts per friend</p>
            </div>

            <motion.div
              animate={{ y: [0, -3, 0], scale: [1, 1.06, 1] }}
              transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
              className="relative flex h-11 w-11 shrink-0 items-center justify-center"
            >
              <span className="absolute inset-0 rounded-full bg-emerald-300/25 blur-md" />
              <img src={gemIcon} alt="" className="relative h-8 w-8 object-contain" />
            </motion.div>
          </div>

          <div className="mb-5 rounded-[1.25rem] border border-white/8 bg-black/24 p-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-white/38">Invite Link</p>
                <p className="mt-1 text-sm font-black text-white">Your Moneetize URL</p>
              </div>
              <button
                type="button"
                onClick={handleCopyLink}
                className="flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-full bg-white px-3 text-xs font-black text-black transition-colors hover:bg-white/90"
                aria-label="Copy invite link"
              >
                {linkCopied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                {linkCopied ? 'Copied' : 'Copy'}
              </button>
            </div>
            <p className="truncate rounded-full border border-white/8 bg-white/[0.06] px-3.5 py-3 text-[12px] font-semibold text-white/68">
              {inviteLink}
            </p>
          </div>

          <div className="mb-5 grid grid-cols-2 gap-2.5">
            <div className="rounded-[1.1rem] border border-white/8 bg-white/[0.045] px-4 py-3">
              <p className="text-[11px] font-bold text-white/42">Ready Now</p>
              <p className="mt-1 text-xl font-black text-white">{filledEmailsCount + filledPhonesCount}/{MAX_INVITES_PER_METHOD * 2}</p>
              <p className="text-[11px] font-semibold text-white/36">invites</p>
            </div>
            <div className="rounded-[1.1rem] border border-emerald-300/18 bg-emerald-300/[0.055] px-4 py-3">
              <p className="text-[11px] font-bold text-emerald-200/60">Potential</p>
              <p className="mt-1 text-xl font-black text-white">+{potentialPoints}</p>
              <p className="text-[11px] font-semibold text-emerald-200/46">points</p>
            </div>
          </div>

          <AnimatePresence>
            {successMessage && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="mb-5 flex items-start gap-3 rounded-[1.1rem] border border-emerald-300/18 bg-emerald-300/[0.065] p-3.5"
              >
                <CheckCircle className="mt-0.5 h-[18px] w-[18px] shrink-0 text-emerald-200" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold leading-relaxed text-emerald-100/86">{successMessage}</p>
                  {sentEmails.map((email) => (
                    <p key={email} className="mt-1 truncate text-[11px] font-semibold text-emerald-100/56">{email}</p>
                  ))}
                  {sentPhones.map((phone) => (
                    <p key={phone} className="mt-1 truncate text-[11px] font-semibold text-emerald-100/56">{phone}</p>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="mb-5 flex items-start gap-3 rounded-[1.1rem] border border-red-300/18 bg-red-400/[0.07] p-3.5"
              >
                <AlertCircle className="mt-0.5 h-[18px] w-[18px] shrink-0 text-red-200" />
                <p className="flex-1 text-xs font-bold leading-relaxed text-red-100/86">{error}</p>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="space-y-6">
            <motion.div
              initial={{ y: 14, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.08 }}
            >
              <div className="mb-3 flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2.5">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/8 text-white/72">
                    <Mail className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <h2 className="text-sm font-black text-white">Email</h2>
                    <p className="text-[11px] font-semibold text-white/40">Send up to 5</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleAddEmail}
                  disabled={emails.length >= MAX_INVITES_PER_METHOD}
                  className="flex h-8 items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.06] px-3 text-[11px] font-black text-white/78 transition-colors hover:bg-white/12 disabled:cursor-not-allowed disabled:opacity-35"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add
                </button>
              </div>

              <div className="space-y-2.5">
                {emails.map((email, index) => (
                  <div key={`email-${index}`} className="relative">
                    <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/34" />
                    <input
                      type="email"
                      placeholder={`Email ${index + 1}`}
                      value={email}
                      onChange={(event) => handleEmailChange(index, event.target.value)}
                      className="h-12 w-full rounded-full border border-white/8 bg-white/[0.06] pl-11 pr-11 text-sm font-semibold text-white outline-none transition-colors placeholder:text-white/30 focus:border-emerald-200/42"
                    />
                    {email && (
                      <button
                        type="button"
                        onClick={() => handleRemoveEmail(index)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/38 transition-colors hover:text-white"
                        aria-label={`Remove email ${index + 1}`}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ y: 14, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.13 }}
            >
              <div className="mb-3 flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2.5">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/8 text-white/72">
                    <MessageSquare className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <h2 className="text-sm font-black text-white">SMS</h2>
                    <p className="text-[11px] font-semibold text-white/40">Send up to 5</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleAddPhone}
                  disabled={phoneNumbers.length >= MAX_INVITES_PER_METHOD}
                  className="flex h-8 items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.06] px-3 text-[11px] font-black text-white/78 transition-colors hover:bg-white/12 disabled:cursor-not-allowed disabled:opacity-35"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add
                </button>
              </div>

              <div className="space-y-2.5">
                {phoneNumbers.map((phone, index) => (
                  <div key={`phone-${index}`} className="relative">
                    <MessageSquare className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/34" />
                    <input
                      type="tel"
                      placeholder={`Phone ${index + 1}`}
                      value={phone}
                      onChange={(event) => handlePhoneChange(index, event.target.value)}
                      className="h-12 w-full rounded-full border border-white/8 bg-white/[0.06] pl-11 pr-11 text-sm font-semibold text-white outline-none transition-colors placeholder:text-white/30 focus:border-emerald-200/42"
                    />
                    {phone && (
                      <button
                        type="button"
                        onClick={() => handleRemovePhone(index)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/38 transition-colors hover:text-white"
                        aria-label={`Remove phone ${index + 1}`}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          <motion.div
            initial={{ y: 14, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.18 }}
            className="mt-7 space-y-3"
          >
            <button
              onClick={handleSendInvites}
              disabled={isLoading || filledEmailsCount === 0}
              className="flex h-[52px] w-full items-center justify-center gap-2 rounded-full bg-white px-5 text-sm font-black text-black shadow-[0_16px_38px_rgba(0,0,0,0.34)] transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-35"
            >
              {isLoading ? (
                <>
                  <motion.span
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="h-[18px] w-[18px] rounded-full border-2 border-black/30 border-t-black"
                  />
                  Opening Email
                </>
              ) : (
                <>
                  <Mail className="h-[18px] w-[18px]" />
                  Send Email Invites ({filledEmailsCount})
                </>
              )}
            </button>

            <button
              onClick={handleSendSMS}
              disabled={filledPhonesCount === 0}
              className="flex h-[52px] w-full items-center justify-center gap-2 rounded-full border border-white/10 bg-white/[0.07] px-5 text-sm font-black text-white shadow-[0_16px_38px_rgba(0,0,0,0.25)] transition-colors hover:bg-white/12 disabled:cursor-not-allowed disabled:opacity-35"
            >
              <MessageSquare className="h-[18px] w-[18px]" />
              Send SMS Invites ({filledPhonesCount})
            </button>
          </motion.div>

          <motion.div
            initial={{ y: 14, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.23 }}
            className="mt-5 rounded-[1.1rem] border border-white/8 bg-white/[0.04] px-4 py-3"
          >
            <p className="text-[11px] font-black uppercase tracking-[0.16em] text-white/36">Team Sync</p>
            <p className="mt-1 text-xs font-semibold leading-relaxed text-white/54">
              Sent email and SMS invites stay in the pending invite list.
            </p>
          </motion.div>
        </motion.section>
      </div>
    </div>
  );
}
