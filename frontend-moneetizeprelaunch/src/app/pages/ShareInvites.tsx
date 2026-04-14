import { useState } from 'react';
import { useNavigate } from 'react-router';
import { AnimatePresence, motion } from 'motion/react';
import { AlertCircle, Check, CheckCircle, ChevronLeft, Copy, Mail, MessageSquare, Plus, X } from 'lucide-react';
import gemIcon from 'figma:asset/296d8aa06fd9c7e60192bc7368a4a032ec5bc17e.png';
import { buildInviteLink } from '../utils/invitationLinks';
import { recordSentInvites, type InviteDeliveryType } from '../utils/inviteSync';

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

  const awardInvitePoints = (inviteCount: number) => {
    const pointsEarned = inviteCount * 5;
    const currentPoints = parseInt(localStorage.getItem('userPoints') || '10', 10);
    localStorage.setItem('userPoints', (currentPoints + pointsEarned).toString());
    return pointsEarned;
  };

  const syncInviteRecords = (recipients: string[], type: InviteDeliveryType) => {
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

  const handleSendSMS = () => {
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

    const pointsEarned = syncInviteRecords(validPhoneNumbers, 'sms');
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
      const pointsEarned = syncInviteRecords(validEmails, 'email');
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
    <div className="absolute inset-0 h-full w-full overflow-y-auto bg-gradient-to-b from-[#0a0e1a] via-[#0f1623] to-[#0a0e1a] text-white [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
      <div className="absolute left-0 right-0 top-0 z-50 flex h-11 items-center justify-between px-4 text-sm text-white sm:px-6">
        <span className="font-semibold">9:41</span>
        <div className="flex items-center gap-1">
          <div className="h-3 w-4 rounded-sm bg-white/80" />
          <div className="h-3 w-4 rounded-sm bg-white/80" />
          <div className="h-3 w-6 rounded-sm bg-white/80" />
        </div>
      </div>

      <div className="absolute left-4 top-14 z-40 sm:left-6 sm:top-16">
        <button
          onClick={() => navigate('/profile-screen')}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-sm transition-colors hover:bg-white/20 sm:h-10 sm:w-10"
          aria-label="Back to profile"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
      </div>

      <div className="mx-auto max-w-2xl px-4 pb-20 pt-28 sm:px-6 sm:pb-24 sm:pt-32">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="mb-8 text-center"
        >
          <motion.div
            animate={{ y: [0, -8, 0], rotate: [0, 5, -5, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            className="mb-4 flex justify-center"
          >
            <div className="relative h-28 w-28 sm:h-36 sm:w-36">
              <div className="absolute inset-0 rounded-lg bg-emerald-400 opacity-60 blur-xl" />
              <img src={gemIcon} alt="Gem" className="relative h-full w-full object-contain" />
            </div>
          </motion.div>
          <h1 className="mb-2 text-2xl font-bold text-white sm:text-3xl">Share Invites</h1>
          <p className="text-sm text-gray-400 sm:text-base">Invite friends to join Moneetize and earn 5 points per invite.</p>
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.08 }}
          className="mb-6 rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-white/10 p-5 backdrop-blur-md"
        >
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-white">Your Invite URL</h2>
              <p className="text-xs text-gray-400">This link carries your inviter details into the scratch screen.</p>
            </div>
            <button
              type="button"
              onClick={handleCopyLink}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-black transition-colors hover:bg-gray-100"
              aria-label="Copy invite link"
            >
              {linkCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </button>
          </div>
          <div className="rounded-xl border border-white/10 bg-[#1a1d2e] px-4 py-3">
            <p className="truncate text-sm font-medium text-white/82">{inviteLink}</p>
          </div>
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="mb-6 rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 to-green-500/10 p-6 backdrop-blur-md"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="mb-1 text-sm text-emerald-400">Potential Rewards</p>
              <p className="text-3xl font-bold text-white">+{potentialPoints} pts</p>
            </div>
            <div className="text-right text-emerald-400">
              <p className="text-2xl font-bold">{filledEmailsCount + filledPhonesCount}/{MAX_INVITES_PER_METHOD * 2}</p>
              <p className="text-xs">invites</p>
            </div>
          </div>
        </motion.div>

        <AnimatePresence>
          {successMessage && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-6 flex items-start gap-3 rounded-2xl border border-green-500/30 bg-green-500/10 p-4"
            >
              <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-green-400" />
              <div className="flex-1">
                <p className="text-sm text-green-400">{successMessage}</p>
                {sentEmails.map((email) => (
                  <p key={email} className="mt-1 text-xs text-green-300/70">- {email}</p>
                ))}
                {sentPhones.map((phone) => (
                  <p key={phone} className="mt-1 text-xs text-green-300/70">- {phone}</p>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-6 flex items-start gap-3 rounded-2xl border border-red-500/30 bg-red-500/10 p-4"
            >
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-400" />
              <p className="flex-1 text-sm text-red-400">{error}</p>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mb-6 rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-white/10 p-6 backdrop-blur-md"
        >
          <h2 className="mb-4 text-lg font-semibold text-white">Enter Email Addresses</h2>
          <div className="space-y-4">
            {emails.map((email, index) => (
              <div key={`email-${index}`} className="relative">
                <Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  placeholder={`Email ${index + 1}`}
                  value={email}
                  onChange={(event) => handleEmailChange(index, event.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-[#1a1d2e] py-4 pl-12 pr-12 text-white placeholder-gray-500 outline-none transition-colors focus:border-emerald-500"
                />
                {email && (
                  <button
                    type="button"
                    onClick={() => handleRemoveEmail(index)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 transition-colors hover:text-white"
                    aria-label={`Remove email ${index + 1}`}
                  >
                    <X className="h-5 w-5" />
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={handleAddEmail}
              disabled={emails.length >= MAX_INVITES_PER_METHOD}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-emerald-600 to-green-600 py-4 text-base font-semibold text-white shadow-xl transition-all hover:from-emerald-700 hover:to-green-700 disabled:cursor-not-allowed disabled:opacity-50 sm:text-lg"
            >
              <Plus className="h-5 w-5" />
              Add Email
            </button>
          </div>
          <p className="mt-4 text-center text-xs text-gray-400">You can send up to 5 email invites at a time.</p>
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mb-6 rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-white/10 p-6 backdrop-blur-md"
        >
          <h2 className="mb-4 text-lg font-semibold text-white">Enter Phone Numbers</h2>
          <div className="space-y-4">
            {phoneNumbers.map((phone, index) => (
              <div key={`phone-${index}`} className="relative">
                <MessageSquare className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                <input
                  type="tel"
                  placeholder={`Phone ${index + 1}`}
                  value={phone}
                  onChange={(event) => handlePhoneChange(index, event.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-[#1a1d2e] py-4 pl-12 pr-12 text-white placeholder-gray-500 outline-none transition-colors focus:border-emerald-500"
                />
                {phone && (
                  <button
                    type="button"
                    onClick={() => handleRemovePhone(index)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 transition-colors hover:text-white"
                    aria-label={`Remove phone ${index + 1}`}
                  >
                    <X className="h-5 w-5" />
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={handleAddPhone}
              disabled={phoneNumbers.length >= MAX_INVITES_PER_METHOD}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-emerald-600 to-green-600 py-4 text-base font-semibold text-white shadow-xl transition-all hover:from-emerald-700 hover:to-green-700 disabled:cursor-not-allowed disabled:opacity-50 sm:text-lg"
            >
              <Plus className="h-5 w-5" />
              Add Phone
            </button>
          </div>
          <p className="mt-4 text-center text-xs text-gray-400">You can send up to 5 SMS invites at a time.</p>
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="space-y-3"
        >
          <button
            onClick={handleSendInvites}
            disabled={isLoading || filledEmailsCount === 0}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-emerald-600 to-green-600 py-4 text-base font-semibold text-white shadow-xl transition-all hover:from-emerald-700 hover:to-green-700 disabled:cursor-not-allowed disabled:opacity-50 sm:text-lg"
          >
            {isLoading ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="h-5 w-5 rounded-full border-2 border-white border-t-transparent"
                />
                Opening Email...
              </>
            ) : (
              <>
                <Mail className="h-5 w-5" />
                Send Email Invites ({filledEmailsCount})
              </>
            )}
          </button>

          <button
            onClick={handleSendSMS}
            disabled={filledPhonesCount === 0}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 py-4 text-base font-semibold text-white shadow-xl transition-all hover:from-blue-700 hover:to-purple-700 disabled:cursor-not-allowed disabled:opacity-50 sm:text-lg"
          >
            <MessageSquare className="h-5 w-5" />
            Send SMS Invites ({filledPhonesCount})
          </button>
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-6 rounded-xl border border-blue-500/30 bg-blue-500/10 p-4"
        >
          <h3 className="mb-2 text-sm font-semibold text-blue-400">How it works</h3>
          <ul className="space-y-2 text-xs text-gray-300">
            <li>Email and SMS buttons open a prefilled message with your invite URL.</li>
            <li>Every sent invite is saved to the pending invite list for Network and Team views.</li>
            <li>You earn 5 points for each invite you send.</li>
          </ul>
        </motion.div>
      </div>
    </div>
  );
}
