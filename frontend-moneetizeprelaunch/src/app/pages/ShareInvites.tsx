import { useState } from 'react';
import { useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, Mail, X, Send, CheckCircle, AlertCircle, MessageSquare, Plus } from 'lucide-react';
import { projectId, publicAnonKey } from '/utils/supabase/info';
import gemIcon from 'figma:asset/296d8aa06fd9c7e60192bc7368a4a032ec5bc17e.png';

// Share Invites component for sending email and SMS invites
export function ShareInvites() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'email' | 'sms'>('email');
  const [emails, setEmails] = useState(['', '']);
  const [phoneNumbers, setPhoneNumbers] = useState(['', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sentEmails, setSentEmails] = useState<string[]>([]);
  const [sentPhones, setSentPhones] = useState<string[]>([]);

  const handleEmailChange = (index: number, value: string) => {
    const newEmails = [...emails];
    newEmails[index] = value;
    setEmails(newEmails);
  };

  const handleRemoveEmail = (index: number) => {
    const newEmails = [...emails];
    newEmails.splice(index, 1);
    setEmails(newEmails);
  };

  const handleAddEmail = () => {
    if (emails.length < 10) {
      setEmails([...emails, '']);
    }
  };

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handlePhoneChange = (index: number, value: string) => {
    const newPhoneNumbers = [...phoneNumbers];
    newPhoneNumbers[index] = value;
    setPhoneNumbers(newPhoneNumbers);
  };

  const handleRemovePhone = (index: number) => {
    const newPhoneNumbers = [...phoneNumbers];
    newPhoneNumbers.splice(index, 1);
    setPhoneNumbers(newPhoneNumbers);
  };

  const handleAddPhone = () => {
    if (phoneNumbers.length < 10) {
      setPhoneNumbers([...phoneNumbers, '']);
    }
  };

  const validatePhone = (phone: string) => {
    // Basic phone validation - accepts formats like +1234567890, 1234567890, etc.
    const cleaned = phone.replace(/\D/g, '');
    return cleaned.length >= 10 && cleaned.length <= 15;
  };

  const handleSendSMS = () => {
    setError(null);
    setSuccessMessage(null);

    // Filter out empty phone numbers
    const validPhoneNumbers = phoneNumbers.filter(phone => phone.trim() !== '');
    
    if (validPhoneNumbers.length === 0) {
      setError('Please enter at least one phone number');
      return;
    }

    // Validate all phone numbers
    const invalidPhoneNumbers = validPhoneNumbers.filter(phone => !validatePhone(phone));
    if (invalidPhoneNumbers.length > 0) {
      setError('Please enter valid phone numbers (include country code, e.g., +1234567890)');
      return;
    }

    // Create invite message
    const inviteMessage = `Hey! I'm using Moneetize to earn rewards. Join me and start earning points! Download here: https://moneetize.app/invite`;

    // Open SMS app with pre-filled message for each phone number
    validPhoneNumbers.forEach((phone, index) => {
      setTimeout(() => {
        const smsUrl = `sms:${phone}?body=${encodeURIComponent(inviteMessage)}`;
        window.location.href = smsUrl;
      }, index * 500); // Delay to allow multiple SMS windows
    });

    // Award points
    const pointsEarned = validPhoneNumbers.length * 5;
    const currentPoints = parseInt(localStorage.getItem('userPoints') || '10', 10);
    const newPoints = currentPoints + pointsEarned;
    localStorage.setItem('userPoints', newPoints.toString());

    // Save sent SMS invites history
    const sentInvitesHistory = JSON.parse(localStorage.getItem('sentInvites') || '[]');
    const newSMSInvites = validPhoneNumbers.map(phone => ({
      phone,
      sentAt: new Date().toISOString(),
      points: 5,
      type: 'sms'
    }));
    localStorage.setItem('sentInvites', JSON.stringify([...sentInvitesHistory, ...newSMSInvites]));

    setSentPhones(validPhoneNumbers);
    setSuccessMessage(`SMS app opened for ${validPhoneNumbers.length} invite${validPhoneNumbers.length > 1 ? 's' : ''}! You earned ${pointsEarned} points!`);
    
    // Clear the form
    setPhoneNumbers(['', '']);
  };

  const handleSendInvites = async () => {
    setError(null);
    setSuccessMessage(null);

    // Filter out empty emails
    const validEmails = emails.filter(email => email.trim() !== '');
    
    if (validEmails.length === 0) {
      setError('Please enter at least one email address');
      return;
    }

    // Validate all emails
    const invalidEmails = validEmails.filter(email => !validateEmail(email));
    if (invalidEmails.length > 0) {
      setError('Please enter valid email addresses');
      return;
    }

    setIsLoading(true);

    try {
      console.log('Share Invites - Sending invites (MOCK MODE):', validEmails);

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      // MOCK MODE - Simulate successful sending
      const pointsEarned = validEmails.length * 5;
      
      // Get current points from localStorage
      const currentPoints = parseInt(localStorage.getItem('userPoints') || '10', 10);
      const newPoints = currentPoints + pointsEarned;
      
      // Save new points
      localStorage.setItem('userPoints', newPoints.toString());
      
      // Save sent invites history
      const sentInvitesHistory = JSON.parse(localStorage.getItem('sentInvites') || '[]');
      const newInvites = validEmails.map(email => ({
        email,
        sentAt: new Date().toISOString(),
        points: 5,
        type: 'email'
      }));
      localStorage.setItem('sentInvites', JSON.stringify([...sentInvitesHistory, ...newInvites]));

      setSentEmails(validEmails);
      setSuccessMessage(`Successfully sent ${validEmails.length} invite${validEmails.length > 1 ? 's' : ''}! You earned ${pointsEarned} points!`);
      
      console.log('✅ MOCK MODE: Invites sent successfully', {
        count: validEmails.length,
        pointsEarned,
        newTotalPoints: newPoints
      });

      // Clear the form
      setEmails(['', '']);

      /* BACKEND MODE - TEMPORARILY DISABLED
      const accessToken = localStorage.getItem('access_token');
      
      if (!accessToken) {
        throw new Error('You must be logged in to send invites');
      }

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-7a79873f/invites/send`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ emails: validEmails }),
        }
      );

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to send invites');
      }

      setSentEmails(validEmails);
      setSuccessMessage(`Successfully sent ${validEmails.length} invite${validEmails.length > 1 ? 's' : ''}! You earned ${result.data.pointsEarned} points!`);
      
      // Clear the form
      setEmails(['', '']);
      */

    } catch (err) {
      console.error('Send invites error:', err);
      setError(err instanceof Error ? err.message : 'Failed to send invites. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const filledEmailsCount = emails.filter(email => email.trim() !== '').length;
  const filledPhonesCount = phoneNumbers.filter(phone => phone.trim() !== '').length;
  const potentialPoints = (filledEmailsCount + filledPhonesCount) * 5;

  return (
    <div className="absolute inset-0 w-full h-full overflow-y-auto bg-gradient-to-b from-[#0a0e1a] via-[#0f1623] to-[#0a0e1a]">
      {/* Status Bar */}
      <div className="absolute top-0 left-0 right-0 h-11 flex items-center justify-between px-4 sm:px-6 text-white text-sm z-50">
        <span className="font-semibold">9:41</span>
        <div className="flex items-center gap-1">
          <div className="w-4 h-3 bg-white/80 rounded-sm" />
          <div className="w-4 h-3 bg-white/80 rounded-sm" />
          <div className="w-6 h-3 bg-white/80 rounded-sm" />
        </div>
      </div>

      {/* Back Button */}
      <div className="absolute top-14 sm:top-16 left-4 sm:left-6 z-40">
        <button
          onClick={() => navigate('/profile')}
          className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/20 transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
      </div>

      <div className="pt-28 sm:pt-32 pb-20 sm:pb-24 px-4 sm:px-6 max-w-2xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8"
        >
          <motion.div
            animate={{ 
              y: [0, -8, 0],
              rotate: [0, 5, -5, 0],
            }}
            transition={{ 
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="flex justify-center mb-4"
          >
            <div className="relative w-28 h-28 sm:w-36 sm:h-36">
              <div className="absolute inset-0 bg-emerald-400 rounded-lg blur-xl opacity-60" />
              <img 
                src={gemIcon} 
                alt="Gem" 
                className="relative w-full h-full object-contain"
              />
            </div>
          </motion.div>
          <h1 className="text-white text-2xl sm:text-3xl font-bold mb-2">Share Invites</h1>
          <p className="text-gray-400 text-sm sm:text-base">
            Invite friends to join Moneetize and earn 5 points per invite!
          </p>
        </motion.div>

        {/* Potential Points Card */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-emerald-500/10 to-green-500/10 backdrop-blur-md rounded-2xl p-6 mb-6 border border-emerald-500/30"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-emerald-400 text-sm mb-1">Potential Rewards</p>
              <p className="text-white text-3xl font-bold">+{potentialPoints} pts</p>
            </div>
            <div className="text-emerald-400 text-right">
              <p className="text-2xl font-bold">{filledEmailsCount + filledPhonesCount}/5</p>
              <p className="text-xs">invites</p>
            </div>
          </div>
        </motion.div>

        {/* Success Message */}
        <AnimatePresence>
          {successMessage && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-green-500/10 border border-green-500/30 rounded-2xl p-4 mb-6 flex items-start gap-3"
            >
              <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-green-400 text-sm">{successMessage}</p>
                {sentEmails.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {sentEmails.map((email, idx) => (
                      <p key={idx} className="text-green-300/70 text-xs">• {email}</p>
                    ))}
                  </div>
                )}
                {sentPhones.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {sentPhones.map((phone, idx) => (
                      <p key={idx} className="text-green-300/70 text-xs">• {phone}</p>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error Message */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 mb-6 flex items-start gap-3"
            >
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-red-400 text-sm flex-1">{error}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Email Inputs */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-md rounded-2xl p-6 mb-6 border border-white/10"
        >
          <h2 className="text-white text-lg font-semibold mb-4">Enter Email Addresses</h2>
          <div className="space-y-4">
            {emails.map((email, index) => (
              <div key={index} className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                  <Mail className="w-5 h-5" />
                </div>
                <input
                  type="email"
                  placeholder={`Email ${index + 1}`}
                  value={email}
                  onChange={(e) => handleEmailChange(index, e.target.value)}
                  className="w-full bg-[#1a1d2e] text-white placeholder-gray-500 pl-12 pr-12 py-4 rounded-xl border border-white/10 focus:border-emerald-500 focus:outline-none transition-colors"
                />
                {email && (
                  <button
                    type="button"
                    onClick={() => handleRemoveEmail(index)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={handleAddEmail}
              className="w-full bg-gradient-to-r from-emerald-600 to-green-600 text-white py-4 rounded-full font-semibold text-base sm:text-lg hover:from-emerald-700 hover:to-green-700 transition-all shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Add Email
            </button>
          </div>
          <p className="text-gray-400 text-xs mt-4 text-center">
            You can send up to 5 invites at a time
          </p>
        </motion.div>

        {/* SMS Inputs */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-md rounded-2xl p-6 mb-6 border border-white/10"
        >
          <h2 className="text-white text-lg font-semibold mb-4">Enter Phone Numbers</h2>
          <div className="space-y-4">
            {phoneNumbers.map((phone, index) => (
              <div key={index} className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <input
                  type="tel"
                  placeholder={`Phone ${index + 1}`}
                  value={phone}
                  onChange={(e) => handlePhoneChange(index, e.target.value)}
                  className="w-full bg-[#1a1d2e] text-white placeholder-gray-500 pl-12 pr-12 py-4 rounded-xl border border-white/10 focus:border-emerald-500 focus:outline-none transition-colors"
                />
                {phone && (
                  <button
                    type="button"
                    onClick={() => handleRemovePhone(index)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={handleAddPhone}
              className="w-full bg-gradient-to-r from-emerald-600 to-green-600 text-white py-4 rounded-full font-semibold text-base sm:text-lg hover:from-emerald-700 hover:to-green-700 transition-all shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Add Phone
            </button>
          </div>
          <p className="text-gray-400 text-xs mt-4 text-center">
            You can send up to 5 invites at a time
          </p>
        </motion.div>

        {/* Send Button */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="space-y-3"
        >
          <button
            onClick={handleSendInvites}
            disabled={isLoading || filledEmailsCount === 0}
            className="w-full bg-gradient-to-r from-emerald-600 to-green-600 text-white py-4 rounded-full font-semibold text-base sm:text-lg hover:from-emerald-700 hover:to-green-700 transition-all shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                />
                Sending Emails...
              </>
            ) : (
              <>
                <Mail className="w-5 h-5" />
                Send Email Invites ({filledEmailsCount})
              </>
            )}
          </button>

          <button
            onClick={handleSendSMS}
            disabled={filledPhonesCount === 0}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 rounded-full font-semibold text-base sm:text-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <MessageSquare className="w-5 h-5" />
            Send SMS Invites ({filledPhonesCount})
          </button>
        </motion.div>

        {/* Info Card */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-6 bg-blue-500/10 border border-blue-500/30 rounded-xl p-4"
        >
          <h3 className="text-blue-400 text-sm font-semibold mb-2">How it works:</h3>
          <ul className="space-y-2 text-gray-300 text-xs">
            <li className="flex items-start gap-2">
              <span className="text-blue-400 mt-0.5">•</span>
              <span>Enter up to 5 email addresses of friends you'd like to invite</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-400 mt-0.5">•</span>
              <span>Each friend will receive an email invitation to join Moneetize</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-400 mt-0.5">•</span>
              <span>Enter up to 5 phone numbers of friends you'd like to invite</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-400 mt-0.5">•</span>
              <span>Each friend will receive an SMS invitation to join Moneetize</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-400 mt-0.5">•</span>
              <span>You'll earn 5 points for each invite sent</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-400 mt-0.5">•</span>
              <span>Points are added immediately to your rewards balance</span>
            </li>
          </ul>
        </motion.div>
      </div>
    </div>
  );
}